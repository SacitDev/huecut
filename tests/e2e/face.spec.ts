/**
 * Your face card on the build (so the CSP applies), at 375 and 1280 px: the portrait, the facts with their numbers, "More with
 * your photo", Move the lines by keyboard and by drag with one part and every line put back, Save my card through the share
 * sheet, as a download and while leaving, the saved card read at 360 px, a reload, a photo that failed before Continue, one
 * that fails after it with the sentence above the fold, and moved lines that stay with their own photo. Axe clean, nothing off
 * the origin (guard.ts). Playwright's WebKit on Windows cannot run the face tools (no OffscreenCanvas with WebGL in a worker): it
 * goes on with the answers.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { capabilities, expect, HAS_WORKER_WEBGL, noteScreenshot, requires, test } from './guard.ts';
import manifest from '../../models.manifest.json' with { type: 'json' };
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const FACES = join(import.meta.dirname, '..', 'fixtures', 'faces');
/** Taken from about 1.5 m: a frontal face with its hairline, so all four facts read. */
const PHOTO = join(FACES, 'far-1-5m.jpg');
const OTHER = join(FACES, 'one-face-salon-straight-wavy.jpg');
const NO_FACE = join(FACES, 'no-face.jpg');
/** A JPEG whose frame header names its size, so the picture gate lets it in, with no tables or data behind it: nothing can decode it. */
const BROKEN_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x64, 0x00, 0x64, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34, 0x56, 0x78, 0xff, 0xd9,
]);
/** First visit: the core tools come from the preview server (about 48 MB decoded), then one analysis. */
const READ_TIMEOUT_MS = 180_000;
const MAX_TABS = 80;
const MAX_NUDGES = 40;
const CARD = { width: 2160, height: 2700 };
/** Model files are served by their SHA-256 (`models/<sha256>.<ext>`); this is the depth model's int8 file. */
const DEPTH_MODEL_SHA = manifest.files.find((f) => f.path === 'depth-anything-v2-small/onnx/model_int8.onnx')?.sha256 ?? 'missing';
const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const portrait = (page: Page) => page.getByRole('img', { name: /^Your photo with lines on the face outline, hairline, brows/ });
const facts = (scope: Page | Locator) => scope.getByRole('region', { name: 'What this photo shows' });

async function expectAxeClean(page: Page, screen: string): Promise<void> {
  // On phones the sticky action bar lies over whatever is under it at this scroll, and axe's target-size counts a row
  // under it as obscured; at the end of the page the bar rests below the content (focus is kept clear by scroll-padding).
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${screen}`).toEqual([]);
}
async function shot(page: Page, name: string, width: number): Promise<void> {
  await page.screenshot({ path: join(shotsDir('face'), `${name}-${String(width)}.png`), fullPage: true });
  noteScreenshot();
}
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}
async function addPhotos(page: Page, ...files: string[]): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/photo`);
  await page.locator('input[type=file]').first().setInputFiles(files);
}
async function toFace(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(heading(page)).toHaveText('Your face card');
}
/** The sentence is the first thing under the title and ends above the sticky bar, so a phone shows it without scrolling. */
async function aboveTheFold(page: Page, sentence: Locator): Promise<void> {
  await page.evaluate(() => { window.scrollTo(0, 0); });
  const [text, bar] = [await sentence.boundingBox(), await page.getByRole('button', { name: 'Choose what to change' }).boundingBox()];
  const viewport = page.viewportSize();
  expect((text?.y ?? 0) + (text?.height ?? 0)).toBeLessThanOrEqual(Math.min(bar?.y ?? Infinity, viewport?.height ?? 0));
}

/** The facts: four topics, each with a number and how sure it is, observations only. */
async function seeFacts(page: Page, width: number): Promise<string> {
  const list = facts(page);
  await expect(list.getByRole('heading', { level: 3 })).toHaveText(['Length and width', 'Forehead', 'Nose to chin', 'Jaw']);
  const text = await list.innerText();
  for (const line of text.split('\n').filter((l) => /^(Your face is about|This part takes up about|Your jaw is about)/.test(l))) expect(line).toMatch(/, (steady |rough )?estimate$/);
  expect(text).toMatch(/^What this photo shows\n/);
  expect(text).not.toMatch(/balanc|suits|should|evenly|average|normal|ideal|score|jaw angle/i);
  await expect(portrait(page)).toBeVisible();
  // The trace is drawn on a canvas, which no CSS animation wait sees: the painter's own signal says the drawing is whole.
  await expect(page.locator('[data-trace]')).toHaveAttribute('data-trace', 'done');
  await shot(page, 'face-card', width);
  await expectAxeClean(page, 'Your face card');
  return text;
}
/** "More with your photo": on a computer each extra with its first download, on a phone "Available on a computer". */
async function seeMore(page: Page, computer: boolean, width: number): Promise<void> {
  await expect(page.getByRole('heading', { name: 'More with your photo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy a prompt to explain my face card' })).toBeVisible();
  await expect(page.getByText('Available on a computer')).toHaveCount(computer ? 0 : 1);
  await expect(page.getByText(/ \(hint\)$/).first()).toBeVisible();
  if (!computer) return;
  await expect(page.getByRole('button', { name: 'See it in 3D' })).toHaveAccessibleDescription('To look at, not to measure; about 34 MB the first time.');
  await Promise.all([page.waitForRequest((r) => r.url().includes(DEPTH_MODEL_SHA), { timeout: 30_000 }), page.getByRole('button', { name: 'See it in 3D' }).click()]);
  const sheet = page.getByRole('dialog', { name: 'See it in 3D' });
  await expect(sheet.getByText('Getting this tool ready. First time only.').or(sheet.getByText('3D view of your photo, for looking only, not for measuring.'))).toBeVisible();
  await shot(page, 'three-d-sheet', width);
  if (await sheet.getByRole('button', { name: 'Cancel download' }).isVisible()) await sheet.getByRole('button', { name: 'Cancel download' }).click();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
}

/** Presses an arrow until the sheet's facts change; null when they never do. */
async function nudgeUntilChange(page: Page, sheet: Locator, name: 'Down' | 'Up', before: string): Promise<string | null> {
  await tabTo(page, sheet.getByRole('button', { name, exact: true }));
  for (let i = 0; i < MAX_NUDGES; i++) {
    await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    const now = await facts(sheet).innerText();
    if (now !== before) return now;
  }
  return null;
}
/** Move the lines by keyboard: pick the chin, move it until a fact changes, put it back; a drag moves the picked dot; Done returns focus. */
async function moveTheLines(page: Page, width: number): Promise<string> {
  const open = page.getByRole('button', { name: 'Move the lines' });
  await tabTo(page, open);
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Move the lines' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('radio')).toHaveCount(6);
  await expect(sheet.getByRole('radio', { name: 'Hairline' })).toBeChecked();
  await expect(sheet.getByRole('button', { name: 'Left', exact: true })).toHaveCount(0); // the hairline moves up and down only
  await tabTo(page, sheet.getByRole('radio', { name: 'Hairline' }));
  await page.keyboard.press('ArrowDown');
  await expect(sheet.getByRole('radio', { name: 'Chin' })).toBeChecked();
  const before = await facts(sheet).innerText();
  const moved = (await nudgeUntilChange(page, sheet, 'Down', before)) ?? (await nudgeUntilChange(page, sheet, 'Up', before));
  expect(moved, 'a fact changed while the chin moved').not.toBeNull();
  await expect(sheet.getByRole('status').filter({ hasText: 'Chin moved' })).toHaveCount(1);
  await shot(page, 'move-the-lines', width);
  await expectAxeClean(page, 'Move the lines');
  await sheet.getByRole('button', { name: 'Put the chin back' }).click();
  await expect.poll(() => facts(sheet).innerText()).toBe(before);
  await sheet.getByText('Left jaw', { exact: true }).click();
  await expect(sheet.getByRole('radio', { name: 'Left jaw' })).toBeChecked();
  const marker = sheet.locator('span[data-selected="true"]');
  await sheet.getByRole('img', { name: 'Your photo with its lines and a dot on each part you can move' }).scrollIntoViewIfNeeded();
  await marker.scrollIntoViewIfNeeded();
  const from = await marker.boundingBox();
  const [x, y] = [(from?.x ?? 0) + (from?.width ?? 0) / 2, (from?.y ?? 0) + (from?.height ?? 0) / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 20, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => ((await marker.boundingBox())?.y ?? 0) - (from?.y ?? 0)).toBeGreaterThan(10);
  const dragged = await facts(sheet).innerText();
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();
  await expect.poll(() => facts(page).innerText()).toBe(dragged);
  return dragged;
}

/** The JPEG's frame size and whether it carries an APP1 segment (EXIF or XMP), read from its markers. */
function jpegInfo(bytes: Buffer): { readonly width: number; readonly height: number; readonly app1: boolean } {
  expect(bytes.readUInt16BE(0), 'JPEG start of image').toBe(0xffd8);
  let [at, app1, size] = [2, false, { width: 0, height: 0 }];
  while (at + 4 <= bytes.length && bytes.readUInt8(at) === 0xff) {
    const marker = bytes.readUInt8(at + 1);
    if (marker === 0xe1) app1 = true;
    if (marker >= 0xc0 && marker <= 0xc2) size = { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
    if (marker === 0xda) break;
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  return { ...size, app1 };
}
const SHARE_STUB = (): void => {
  Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: (data?: ShareData) => (data?.files?.length ?? 0) > 0 });
  Object.defineProperty(Navigator.prototype, 'share', {
    configurable: true,
    value: async (data: ShareData) => {
      const file = data.files?.[0];
      const bytes = new Uint8Array((await file?.arrayBuffer()) ?? new ArrayBuffer(0)) as Uint8Array & { toBase64: () => string };
      (window as unknown as { shared: unknown }).shared = { name: file?.name, type: file?.type, base64: bytes.toBase64() };
    },
  });
};
const NO_SHARE = (): void => { for (const key of ['share', 'canShare']) Reflect.deleteProperty(Navigator.prototype, key); };
const sharedOf = (page: Page) => page.evaluate(() => (window as unknown as { shared?: { name: string; type: string; base64: string } }).shared ?? null);

/** Save my card through the share sheet, then as a download; the saved card is written out and shown at 360 px to be read. */
async function saveTheCard(page: Page, width: number): Promise<void> {
  await page.getByRole('button', { name: 'Save my face card' }).click();
  await expect(page.getByText('Face card shared.')).toBeVisible({ timeout: 30_000 });
  const shared = await sharedOf(page);
  expect(`${shared?.type ?? ''} ${shared?.name ?? ''}`).toMatch(/^image\/jpeg huecut-face-card-\d{4}-\d{2}-\d{2}\.jpg$/);
  const bytes = Buffer.from(shared?.base64 ?? '', 'base64');
  expect(jpegInfo(bytes)).toEqual({ ...CARD, app1: false });
  const file = join(shotsDir('face'), `saved-card-${String(width)}.jpg`);
  await writeFile(file, bytes);
  const viewer = await page.context().newPage();
  await viewer.setViewportSize({ width: 360, height: 450 });
  await viewer.setContent(`<body style="margin:0"><img alt="" style="display:block;width:360px" src="data:image/jpeg;base64,${shared?.base64 ?? ''}"></body>`);
  await viewer.screenshot({ path: join(shotsDir('face'), `saved-card-at-360-${String(width)}.png`) });
  await viewer.close();
  await page.evaluate(NO_SHARE);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save my face card' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^huecut-face-card-\d{4}-\d{2}-\d{2}\.jpg$/);
  expect(jpegInfo(await readFile(await download.path()))).toEqual({ ...CARD, app1: false });
  await expect(page.getByText('Face card saved to your downloads.')).toBeVisible();
}

/** The whole step on a good photo, then a reload brings it back with its moved lines (saved by default), and on to the goal. */
async function wholeStep(page: Page, width: number): Promise<void> {
  await page.addInitScript(SHARE_STUB);
  await addPhotos(page, PHOTO);
  await toFace(page);
  await expect(portrait(page)).toBeVisible({ timeout: READ_TIMEOUT_MS });
  await seeFacts(page, width);
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'face-card-dark', width);
  await expectAxeClean(page, 'Your face card, dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await seeMore(page, width === 1280, width);
  const moved = await moveTheLines(page, width);
  await saveTheCard(page, width);
  await page.reload();
  await expect(heading(page)).toHaveText('Your face card');
  await expect.poll(() => facts(page).innerText(), { timeout: READ_TIMEOUT_MS }).toBe(moved);
  await page.getByRole('button', { name: 'Choose what to change' }).click();
  await expect(heading(page)).toHaveText('Your goal');
}

/** Save my card, then on at once: the card shown at the tap is still saved. */
async function saveWhileLeaving(page: Page): Promise<void> {
  await page.addInitScript(SHARE_STUB);
  await addPhotos(page, PHOTO);
  await toFace(page);
  await expect(portrait(page)).toBeVisible({ timeout: READ_TIMEOUT_MS });
  await page.getByRole('button', { name: 'Save my face card' }).click();
  await page.getByRole('button', { name: 'Choose what to change' }).click();
  await expect(heading(page)).toHaveText('Your goal');
  await expect.poll(() => sharedOf(page), { timeout: 30_000 }).not.toBeNull();
  expect(jpegInfo(Buffer.from((await sharedOf(page))?.base64 ?? '', 'base64'))).toEqual({ ...CARD, app1: false });
}

/** Lines moved on photo 1 stay on photo 1: photo 2 as the main photo shows its own, and photo 1 comes back moved. */
async function linesStayWithTheirPhoto(page: Page, width: number): Promise<void> {
  await addPhotos(page, PHOTO, OTHER);
  await toFace(page);
  await expect(portrait(page)).toBeVisible({ timeout: READ_TIMEOUT_MS });
  const first = await facts(page).innerText();
  const moved = await moveTheLines(page, width);
  expect(moved).not.toBe(first);
  await page.goBack();
  await expect(heading(page)).toHaveText('Add your photo');
  await page.getByRole('radio', { name: 'Photo 2' }).check();
  await page.goForward();
  await expect(heading(page)).toHaveText('Your face card');
  await expect.poll(() => facts(page).innerText(), { timeout: READ_TIMEOUT_MS }).not.toBe(moved);
  await page.goBack();
  await page.getByRole('radio', { name: 'Photo 1' }).check();
  await page.goForward();
  await expect.poll(() => facts(page).innerText()).toBe(moved);
}

/** The tools held: the step says it is reading and Continue works; then the photo with no face says so above the fold. */
async function noFaceAfterContinue(page: Page, width: number): Promise<void> {
  let release = (): void => undefined;
  const held = new Promise<undefined>((resolve) => { release = () => { resolve(undefined); }; });
  await page.route('**/models/**', (route) => held.then(() => route.continue()));
  await addPhotos(page, NO_FACE);
  await toFace(page);
  await expect(page.getByText('Reading your photo.')).toBeVisible();
  await expect(page.getByText('You can go on. Your card will wait for you.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose what to change' })).toBeEnabled();
  await shot(page, 'reading', width);
  await expectAxeClean(page, 'Your face card, reading');
  release();
  const sentence = page.getByText('We could not find a face in this photo.', { exact: false });
  await expect(sentence).toBeVisible({ timeout: READ_TIMEOUT_MS });
  await aboveTheFold(page, sentence);
  await expect(page.getByRole('link', { name: 'Choose another photo' })).toBeVisible();
  await expect(portrait(page)).toHaveCount(0);
  await shot(page, 'no-face', width);
  await expectAxeClean(page, 'Your face card, no face');
  await page.getByRole('button', { name: 'Choose what to change' }).click();
  await expect(heading(page)).toHaveText('Your goal');
}

/** A photo that failed before Continue still reaches the step, which says what happened above the fold. */
async function failedBeforeContinue(page: Page): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/photo`);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: BROKEN_JPEG });
  await expect(page.getByText(/could not be analysed|could not open this photo/)).toBeVisible({ timeout: READ_TIMEOUT_MS });
  const decode = await page.getByText(/could not open this photo/).isVisible();
  await toFace(page);
  // Undecodable says how to fix it; any other failure of the only photo says the ideas come from the answers.
  const sentence = page.getByText(decode ? /could not open this photo/ : /None of your photos could be read/);
  await expect(sentence).toBeVisible();
  await aboveTheFold(page, sentence);
  await expect(page.getByRole('link', { name: decode ? 'Choose another photo' : 'Add another photo' })).toBeVisible();
  await expectAxeClean(page, 'Your face card, the photo failed');
}

const WALKS: readonly (readonly [string, (page: Page, width: number) => Promise<void>])[] = [
  ['the portrait, the facts, More with your photo, Move the lines, Save my card, a reload, and on to the goal', wholeStep],
  ['Save my card still saves when the person moves on at once', saveWhileLeaving],
  ['moved lines stay with their own photo when the main photo changes', linesStayWithTheirPhoto],
  ['a photo with no face: reading it while the tools come, then one sentence above the fold and one way on', noFaceAfterContinue],
  ['a photo that failed before Continue still reaches the face card, which says so', failedBeforeContinue],
];

for (const width of [375, 1280]) {
  const computer = width === 1280;
  test.describe(`Your face card on a ${computer ? 'computer' : 'phone'} at ${String(width)} px`, () => {
    test.use(computer ? { viewport: { width, height: 900 } } : { viewport: { width, height: 812 }, isMobile: true, hasTouch: true });
    for (const [name, walk] of WALKS) {
      test(name, async ({ page }) => {
        await requires(page, 'workerWebGL');
        await walk(page, width);
      });
    }
  });

  test(`WebKit goes on from the face card with the answers, without the face tools, at ${String(width)} px`, async ({ page }) => {
    test.skip((await capabilities(page)).workerWebGL, HAS_WORKER_WEBGL);
    await page.setViewportSize({ width, height: 900 });
    await addPhotos(page, PHOTO);
    await toFace(page);
    await expect(page.locator('p', { hasText: 'The face tools cannot run in this browser.' })).toBeVisible({ timeout: 30_000 });
    // Nothing is being read: no moving line, and no promise of a card that cannot come.
    await expect(page.getByText('Reading your photo.')).toHaveCount(0);
    await expect(page.getByText('You can go on. Your card will wait for you.')).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expectAxeClean(page, 'Your face card without the face tools');
    await page.getByRole('button', { name: 'Continue with answers only' }).click();
    await expect(heading(page)).toHaveText('Your goal');
  });
}
