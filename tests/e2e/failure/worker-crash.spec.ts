/**
 * A worker crash, in Chromium: a real uncaught error raised in the real worker with `worker.evaluate`. During an analysis
 * the photo is analysed again once and a second crash marks it failed; while idle the worker is replaced and a refined mask,
 * kept on the main thread, still shapes the preview.
 */
import type { Locator, Page, Worker } from '@playwright/test';
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, analysisWorker, button, dropReported, expectAnalysed, FACE, go, heading, needsAnalysis, onNextDecode, OTHER_FACE, photoRow, toLines } from './support.ts';

const OTHER_NAME = 'one-face-barbering-straight-wavy.jpg';
/** Reported by the worker's own uncaught error, the fault each test plants. */
const PLANTED = /planted crash/;

/** Counts the workers this page starts from now on. */
function countWorkers(page: Page): { readonly started: () => number; readonly newest: () => Worker | null } {
  let n = 0;
  let last: Worker | null = null;
  page.on('worker', (w) => { n++; last = w; });
  return { started: () => n, newest: () => last };
}

/** Lines are up and the first photo's tools are ready; back on Photo so a second photo goes through the analysis. */
async function readyOnPhoto(page: Page): Promise<Worker> {
  await toLines(page);
  await button(page, 'Back').click();
  await expect(heading(page)).toHaveText('Add your photo');
  return analysisWorker(page);
}

test('during analysis (real uncaught error in the worker, once): the worker is replaced and the photo analysed again', async ({ page, guard }) => {
  await needsAnalysis(page);
  const worker = await readyOnPhoto(page);
  const workers = countWorkers(page);
  await onNextDecode(worker, 'crash');
  await addPhotos(page, OTHER_FACE);
  await expect.poll(workers.started, { timeout: ANALYSIS_TIMEOUT_MS }).toBe(1);
  await expectAnalysed(page, OTHER_NAME);
  expect(page.workers(), 'exactly one worker after the replacement').toHaveLength(1);
  expect(workers.started(), 'one replacement, not a loop').toBe(1);
  dropReported(guard, PLANTED);
});

test('during analysis (real uncaught error, in the original and in the replacement): the photo is marked failed and the tools still work', async ({ page, guard }) => {
  await needsAnalysis(page);
  const worker = await readyOnPhoto(page);
  const workers = countWorkers(page);
  // The replacement carries the fault too; the worker after it does not, so it can prove the tools recovered.
  let replacements = 0;
  page.on('worker', (w) => { if (replacements++ === 0) void onNextDecode(w, 'crash').catch(() => undefined); });
  await onNextDecode(worker, 'crash');
  await addPhotos(page, OTHER_FACE);
  await expect(photoRow(page, OTHER_NAME).getByText('This photo could not be analysed. Try another photo.')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  expect(workers.started(), 'the first crash replaced it, then the second').toBe(2);
  await addPhotos(page, FACE.replace('one-face-salon-straight-wavy', 'beard'));
  await expectAnalysed(page, 'beard.jpg');
  dropReported(guard, PLANTED);
});

// ── Idle, with a refined mask ──

const REFINE = 'Tap your hair to make the preview fit better';

/** The preview's "after" pixels as one hash: a different outline tints different pixels. */
const afterHash = (sheet: Locator): Promise<string> =>
  sheet.locator('canvas[data-layer="after"]').evaluate(async (el: HTMLCanvasElement) => {
    const { data } = el.getContext('2d')?.getImageData(0, 0, el.width, el.height) ?? new ImageData(1, 1);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  });

async function openPreview(page: Page): Promise<Locator> {
  await button(page, 'Try a colour on your photo').click();
  const sheet = page.getByRole('dialog', { name: 'Try a colour on your photo' });
  await expect(sheet.getByRole('status').filter({ hasText: 'rough preview on your photo' })).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  return sheet;
}

/** One real tap inside the automatic outline's hair, then the outline is used. */
async function refine(page: Page, sheet: Locator): Promise<void> {
  await sheet.getByRole('button', { name: REFINE }).click();
  const outline = sheet.locator('canvas[data-layer="outline"]');
  await expect(outline).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  const spot = await outline.evaluate((c: HTMLCanvasElement) => {
    const { data, width: w, height: h } = c.getContext('2d')?.getImageData(0, 0, c.width, c.height) ?? new ImageData(1, 1);
    const hair = (x: number, y: number): boolean => (data[(y * w + x) * 4 + 3] ?? 0) > 0;
    for (let y = 8; y < h - 8; y++) for (let x = 8; x < w - 8; x++) if ([[0, 0], [-6, 0], [6, 0], [0, -6], [0, 6]].every(([dx = 0, dy = 0]) => hair(x + dx, y + dy))) return { x: x / w, y: y / h };
    throw new Error('no hair in the automatic outline');
  });
  const box = await outline.boundingBox();
  if (!box) throw new Error('the outline is not on the page');
  await page.mouse.click(box.x + spot.x * box.width, box.y + spot.y * box.height);
  await expect(sheet.getByRole('status').filter({ hasText: 'Hair outline updated.' })).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await button(sheet, 'Use this outline').click();
  await expect(sheet.getByRole('button', { name: REFINE })).toBeVisible();
}

test('idle (real uncaught error in the worker): the worker is replaced, the lines stay and the refined mask still shapes the preview', async ({ page, guard }) => {
  await needsAnalysis(page);
  test.setTimeout(600_000);
  await toLines(page);
  const first = await openPreview(page);
  const autoHash = await afterHash(first);
  await refine(page, first);
  await expect(first.getByRole('status').filter({ hasText: 'rough preview on your photo' })).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await expect.poll(() => afterHash(first), { timeout: ANALYSIS_TIMEOUT_MS }).not.toBe(autoHash);
  const refinedHash = await afterHash(first);
  await button(first, 'Close').click();
  await expect(first).toBeHidden();

  const workers = countWorkers(page);
  const worker = await analysisWorker(page);
  await worker.evaluate(() => {
    setTimeout(() => { throw new Error('planted crash while idle'); }, 0);
  });
  await expect.poll(workers.started, { timeout: ANALYSIS_TIMEOUT_MS }).toBe(1);
  expect(page.workers(), 'exactly one worker after the replacement').toHaveLength(1);
  await expect(page.locator('canvas[role="img"]')).toBeVisible();
  await go(page, '#/my-look/photo');
  await expectAnalysed(page, 'one-face-salon-straight-wavy.jpg');
  await go(page, '#/my-look/face');
  const again = await openPreview(page);
  await expect.poll(() => afterHash(again), { timeout: ANALYSIS_TIMEOUT_MS }).toBe(refinedHash);
  dropReported(guard, PLANTED);
});
