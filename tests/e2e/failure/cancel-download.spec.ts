/**
 * Cancelled downloads, in Chromium: each download cancelled while its file is held open (the named failure, a held request). The extras
 * are cancelled while the other still downloads; core cancels alone, because the screens reach the extras only after the core
 * tools have read the photo (`client.test › cancel aborts only that op` covers core beside an extra).
 */
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, drawing, FACE, heading, HIDDEN_HAIRLINE, holdModel, isModelRequest, needsAnalysis, openPhoto, toLines } from './support.ts';

const WASM = /^mediapipe\/vision_wasm/;
const DEPTH = /^depth-anything-v2-small\/onnx\/model_/;
const SAM = /^sam2\.1-hiera-tiny\/onnx\/vision_encoder_.*\.onnx_data$/;
const STOPPED = 'Download stopped. Download again?';
const REFINE = 'Refine my hair outline';
const THREE_D = 'See it in 3D';

test('core: held WASM, Cancel says so, the photo stays, and Download again draws the lines', async ({ page }) => {
  await needsAnalysis(page);
  const hold = await holdModel(page, WASM);
  await openPhoto(page);
  await addPhotos(page, FACE);
  await expect.poll(hold.held, { timeout: 30_000 }).toBeGreaterThan(0);
  await button(page, 'Cancel download').click();
  await expect(page.locator('p', { hasText: STOPPED })).toBeVisible();
  await expect(button(page, 'Continue with answers only')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
  hold.release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await button(page, 'Download again').click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
});

/** Opens an extra's sheet from More with your photo and leaves its download running; the sheet is returned closed, its download still going. */
async function start(page: Page, name: string): Promise<void> {
  await button(page, name).click();
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet.getByRole('progressbar')).toBeVisible();
  await button(sheet, 'Close').click();
  await expect(sheet).toBeHidden();
}

async function reopen(page: Page, name: string): Promise<Locator> {
  await button(page, name).click();
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  return sheet;
}

/** Both extras downloading with their files held, one cancelled while the other goes on; each then finishes. */
async function cancelOneWhileOtherRuns(page: Page, cancel: { readonly name: string; readonly path: RegExp }, other: { readonly name: string; readonly path: RegExp }, otherReady: (s: Locator) => Promise<void>, cancelledReady: (s: Locator) => Promise<void>): Promise<void> {
  const failed: string[] = [];
  page.context().on('requestfailed', (r) => failed.push(r.url()));
  const [holdCancel, holdOther] = [await holdModel(page, cancel.path), await holdModel(page, other.path)];
  await toLines(page, HIDDEN_HAIRLINE);
  await start(page, other.name);
  await expect.poll(holdOther.held, { timeout: ANALYSIS_TIMEOUT_MS }).toBeGreaterThan(0);
  await start(page, cancel.name);
  await expect.poll(holdCancel.held, { timeout: ANALYSIS_TIMEOUT_MS }).toBeGreaterThan(0);

  const cancelling = await reopen(page, cancel.name);
  await button(cancelling, 'Cancel download').click();
  await expect(cancelling.getByText(STOPPED)).toBeVisible();
  await button(cancelling, 'Close').click();
  await expect(cancelling).toBeHidden();

  const isOther = isModelRequest(other.path);
  expect(failed.filter(isOther), `the ${other.name} download was left alone`).toEqual([]);
  const running = await reopen(page, other.name);
  await expect(running.getByRole('progressbar'), `${other.name} is still downloading`).toBeVisible();
  holdOther.release();
  await otherReady(running);
  await button(running, 'Close').click();
  await expect(running).toBeHidden();

  holdCancel.release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  // A cancelled extra is back to idle, so pressing its button downloads it again.
  await cancelledReady(await reopen(page, cancel.name));
}

const tapScreenShows = (sheet: Locator): Promise<void> => expect(sheet.locator('canvas[data-layer="outline"]')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
const threeDShows = (sheet: Locator): Promise<void> => expect(sheet.getByRole('status').filter({ hasText: 'Facing front.' })).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });

test('depth cancelled with its file held while SAM (held) goes on: SAM finishes, then depth downloads again', async ({ page }) => {
  await needsAnalysis(page);
  await cancelOneWhileOtherRuns(page, { name: THREE_D, path: DEPTH }, { name: REFINE, path: SAM }, tapScreenShows, threeDShows);
});

test('SAM cancelled with its file held while depth (held) goes on: depth finishes, then SAM downloads again', async ({ page }) => {
  await needsAnalysis(page);
  await cancelOneWhileOtherRuns(page, { name: REFINE, path: SAM }, { name: THREE_D, path: DEPTH }, threeDShows, tapScreenShows);
});
