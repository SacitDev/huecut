/**
 * The colour preview, tap-to-select, the 3D view and the hair-only version on the build (so the CSP applies), in Chromium with
 * the real models and a fictional photo, on the fixture content (extras-support.ts). The preview's pixels are checked against
 * the hair outline; phones show "Available on a computer" for every extra.
 */
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import manifest from '../../models.manifest.json' with { type: 'json' };
import { buildOnFixtures, DRAWN, expectDisposedOnClose, expectNoViolations, expectTintedInsideOnly, HIGHLIGHTS, instrument, keepOutline, keepPictures, splitByOutline, watchWorker } from './extras-support.ts';
import { expect, noteScreenshot, requires, settled, test } from './guard.ts';
import { fixtureServer } from './server.ts';
import { shotsDir } from './shots.ts';

const { APP_URL } = fixtureServer('extras');
const PHOTO = join(import.meta.dirname, '..', 'fixtures', 'faces', 'one-face-salon-straight-wavy.jpg');
/** A fictional picture standing in for an AI result: another model's hair, so the transfer has a colour to carry over. */
const AI_PICTURE = join(import.meta.dirname, '..', 'fixtures', 'faces', 'older-grey.jpg');
const HAND_PLACED = 'Your colourist places the highlights';
const REFINE = 'Tap your hair to make the preview fit better';
/** First visit: the core tools come from the preview server, then one analysis (as in the other real-model suites). */
const ANALYSIS_TIMEOUT_MS = 180_000;
/** A depth or SAM start on the WASM backend, then the first tap's image encoder (limits.ts: a first tap took about 30 s on the throttled tablet profile). */
const EXTRA_TIMEOUT_MS = 180_000;
const MAX_TABS = 80;
const SAM_ENCODER = manifest.files.find((f) => f.path === 'sam2.1-hiera-tiny/onnx/vision_encoder_int8.onnx_data')?.sha256 ?? 'missing';

test.beforeAll(async () => {
  test.setTimeout(300_000);
  await buildOnFixtures();
});

const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
const frames = (page: Page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
const status = (scope: Locator, text: string): Locator => scope.getByRole('status').filter({ hasText: text });

async function expectAxeClean(page: Page, screen: string): Promise<void> {
  await settled(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${screen}`).toEqual([]);
}

async function shot(page: Page, name: string, width: number): Promise<void> {
  await settled(page);
  await page.screenshot({ path: join(shotsDir('extras'), `${name}-${String(width)}.png`) });
  noteScreenshot();
}

/** Presses Tab until `target` has focus: the keyboard path a person takes, never a click. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}
const pressByKeyboard = async (page: Page, target: Locator): Promise<void> => {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
};

/** Photo → the face card, waiting for the lines drawn on the real analysis. */
async function reachLines(page: Page): Promise<void> {
  await page.addInitScript(instrument);
  page.on('worker', (w) => { void watchWorker(w).catch(() => undefined); });
  await page.goto(`${APP_URL}#/my-look/photo`);
  await expect(heading(page)).toHaveText('Add your photo');
  await page.locator('input[type=file]').first().setInputFiles(PHOTO);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(heading(page)).toHaveText('Your face card');
  await expect(page.locator('canvas[role="img"]')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
}

// ── The rough preview ──

const previewCanvasReady = (page: Page, layer: string): Promise<void> =>
  expect.poll(() => page.locator(`canvas[data-layer="${layer}"]`).evaluate((c: HTMLCanvasElement) => c.width), { timeout: EXTRA_TIMEOUT_MS }).toBeGreaterThan(300);

async function openLookPicker(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Try a colour on your photo' }).click();
  const sheet = page.getByRole('dialog', { name: 'Try a colour on your photo' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Rough preview', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Is it realistic for your hair? A few questions will tell.')).toBeVisible();
  return sheet;
}

/** Chooses a look by name and waits until its tint is on the canvas. */
async function chooseLook(page: Page, sheet: Locator, name: string): Promise<void> {
  await sheet.getByRole('button', { name, exact: true }).click();
  await expect(sheet.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(status(sheet, `${name}, rough preview on your photo`)).toHaveCount(1, { timeout: EXTRA_TIMEOUT_MS });
  await previewCanvasReady(page, 'before');
  await previewCanvasReady(page, 'after');
}

/** The labelled preview, what it cannot draw said in words, the neutral grey view and the before-and-after slider. */
async function seePreview(page: Page, sheet: Locator, width: number): Promise<void> {
  await chooseLook(page, sheet, HIGHLIGHTS);
  await expect(sheet.getByText(HAND_PLACED, { exact: true })).toBeVisible();
  await shot(page, 'preview-highlights', width);
  await chooseLook(page, sheet, DRAWN);
  await expect(sheet.getByText(HAND_PLACED, { exact: true })).toHaveCount(0);
  await keepPictures(page, 'auto');
  const grey = sheet.getByRole('switch', { name: 'Neutral grey view' });
  const surface = sheet.locator('[data-neutral]');
  await grey.check();
  await expect(surface).toHaveAttribute('data-neutral', 'true');
  expect(await surface.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(118, 118, 118)');
  await shot(page, 'preview-neutral', width);
  await expectAxeClean(page, 'the rough preview, neutral view');
  await grey.uncheck();
  const slider = sheet.getByRole('slider', { name: 'Before and after' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('1');
  expect(await sheet.locator('canvas[data-layer="before"]').evaluate((c: HTMLElement) => c.style.clipPath)).toBe('inset(0px 99% 0px 0px)');
  await expectAxeClean(page, 'the rough preview');
}

// ── Tap to select ──

/** A held download: the SAM encoder file stays in flight until `release()`, so Cancel can be pressed while it runs. */
async function holdSamDownload(page: Page): Promise<() => void> {
  let release = (): void => undefined;
  const held = new Promise<void>((done) => { release = done; });
  await page.route((url) => url.href.includes(SAM_ENCODER), async (route) => {
    await held;
    await route.continue().catch(() => undefined);
  });
  return () => { release(); };
}

/** Stated size, Cancel while it downloads, Download again, and the tap screen once ready. */
async function downloadSam(page: Page, sheet: Locator, width: number): Promise<void> {
  const release = await holdSamDownload(page);
  const offer = sheet.getByRole('button', { name: REFINE });
  await expect(offer).toHaveAccessibleDescription('Downloads the tap tool, about 69 MB the first time.');
  await offer.click();
  await expect(sheet.getByText('Getting this tool ready. First time only.')).toBeVisible();
  await expect(sheet.getByRole('progressbar')).toBeVisible();
  await shot(page, 'tap-downloading', width);
  await expectAxeClean(page, 'tap-to-select, downloading');
  await sheet.getByRole('button', { name: 'Cancel download' }).click();
  await expect(sheet.getByText('Download stopped. Download again?')).toBeVisible();
  await expect(sheet.locator('canvas[data-layer="outline"]')).toHaveCount(0);
  release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await sheet.getByRole('button', { name: 'Download again' }).click();
  await expect(sheet.locator('canvas[data-layer="outline"]')).toBeVisible({ timeout: EXTRA_TIMEOUT_MS });
}

/** A point well inside the outline, as a share of its size: a full 9 x 9 block of hair nearest the outline's top middle. */
const pointInHair = (page: Page): Promise<{ readonly x: number; readonly y: number }> =>
  page.locator('canvas[data-layer="outline"]').evaluate((c: HTMLCanvasElement) => {
    const { data, width: w, height: h } = c.getContext('2d')?.getImageData(0, 0, c.width, c.height) ?? new ImageData(1, 1);
    const block = (cx: number, cy: number): boolean => {
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if ((data[((cy + y) * w + cx + x) * 4 + 3] ?? 0) === 0) return false;
      return true;
    };
    for (let cy = 4; cy < h - 4; cy++) for (let d = 0; d < w / 2 - 4; d++) for (const cx of [Math.round(w / 2) - d, Math.round(w / 2) + d]) if (block(cx, cy)) return { x: cx / w, y: cy / h };
    throw new Error('no block of hair in the outline');
  });

const tapOn = async (page: Page, p: { readonly x: number; readonly y: number }): Promise<void> => {
  const box = await page.locator('canvas[data-layer="outline"]').boundingBox();
  if (!box) throw new Error('the outline is not on the page');
  await page.mouse.click(box.x + p.x * box.width, box.y + p.y * box.height);
};

/** The automatic outline holds the first preview's tint; a tap redraws it; "Not hair" by keyboard changes it; returns its size. */
async function tapAndMark(page: Page, sheet: Locator, width: number): Promise<{ readonly w: number; readonly h: number }> {
  expect((await keepOutline(page, 'outline-auto')).hair, 'the automatic outline').toBeGreaterThan(100);
  // The 256 px outline is a sample of the worker's mask, so a thin strand can sit two cells out (measured: 1 pixel of 309,688
  // changed). The exact check, with no margin, is against the refined mask at the picture's own size, in tapToSelect.
  expectTintedInsideOnly(await splitByOutline(page, 'auto-before', 'auto-after', 'outline-auto', 2), 'the preview on the automatic outline');
  await tapOn(page, await pointInHair(page));
  await expect(status(sheet, 'Hair outline updated.')).toHaveCount(1, { timeout: EXTRA_TIMEOUT_MS });
  const first = await keepOutline(page, 'outline-first');
  expect(first.hair, 'the outline after one tap').toBeGreaterThan(1_000);
  await shot(page, 'tap-one', width);
  await expectAxeClean(page, 'tap-to-select');
  await sheet.getByRole('button', { name: 'Not hair', exact: true }).click();
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Right', exact: true }));
  await expect(status(sheet, 'Spot ').or(status(sheet, 'Hair outline updated.'))).toHaveCount(1);
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Mark this spot' }));
  await expect(status(sheet, 'Reading your tap.')).toHaveCount(1);
  await expect(status(sheet, 'Hair outline updated.')).toHaveCount(1, { timeout: EXTRA_TIMEOUT_MS });
  await expect.poll(async () => (await keepOutline(page, 'outline-final')).hair, { timeout: 30_000 }).not.toBe(first.hair);
  return keepOutline(page, 'outline-final');
}

/** The refined mask goes to the store, and the preview is made again inside exactly that mask. */
async function tapToSelect(page: Page, sheet: Locator, width: number): Promise<void> {
  const final = await tapAndMark(page, sheet, width);
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Use this outline' }));
  await expect(sheet.getByRole('button', { name: REFINE })).toBeVisible();
  await chooseLook(page, sheet, DRAWN);
  await keepPictures(page, 'refined');
  const exact = await splitByOutline(page, 'refined-before', 'refined-after', 'outline-final', 0);
  expect([exact.width, exact.height], 'the refined mask is at the picture’s own size').toEqual([final.w, final.h]);
  expectTintedInsideOnly(exact, 'the preview on the refined outline');
}

// ── The 3D view ──

const stageShot = async (page: Page, stage: Locator): Promise<Buffer> => {
  await frames(page);
  const png = await stage.screenshot();
  noteScreenshot();
  return png;
};

/** Turn and Tilt by keyboard, with reduced motion so each press lands at once: the words and the picture change, and Reset brings it back exactly. */
async function turnByKeyboard(page: Page, sheet: Locator, stage: Locator, width: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const front = await stageShot(page, stage);
  const left = sheet.getByRole('button', { name: 'Turn left' });
  await pressByKeyboard(page, left);
  await expect(status(sheet, 'Turned 5 degrees left.')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(status(sheet, 'Turned 15 degrees left.')).toHaveCount(1);
  await expect(left).toHaveAttribute('aria-disabled', 'true');
  const turned = await stageShot(page, stage);
  expect(turned.equals(front), 'Turn left changed the picture').toBe(false);
  await shot(page, 'three-d-left', width);
  await tabTo(page, sheet.getByRole('button', { name: 'Turn right' }));
  for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');
  await expect(status(sheet, 'Turned 15 degrees right.')).toHaveCount(1);
  expect((await stageShot(page, stage)).equals(turned), 'Turn right changed the picture').toBe(false);
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Reset' }));
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Tilt up' }));
  await expect(status(sheet, 'Tilted 5 degrees up.')).toHaveCount(1);
  expect((await stageShot(page, stage)).equals(front), 'Tilt up changed the picture').toBe(false);
  await tabTo(page, sheet.getByRole('button', { name: 'Tilt down' }));
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(status(sheet, 'Tilted 5 degrees down.')).toHaveCount(1);
  await pressByKeyboard(page, sheet.getByRole('button', { name: 'Reset' }));
  await expect(status(sheet, 'Facing front.')).toHaveCount(1);
  expect((await stageShot(page, stage)).equals(front), 'Reset brought the picture back').toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
}

/** A quarter of the stage's width is a quarter of the ±15° range, rounded to whole degrees; afterwards nothing moves on its own. */
async function dragAndStayStill(page: Page, sheet: Locator, stage: Locator): Promise<void> {
  const box = await stage.boundingBox();
  if (!box) throw new Error('the 3D stage is not on the page');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + (3 * box.width) / 4, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(status(sheet, 'Turned 8 degrees right.')).toHaveCount(1);
  const still = await stageShot(page, stage);
  await page.waitForTimeout(600);
  const later = await stage.screenshot();
  noteScreenshot();
  expect(later.equals(still), 'no idle motion').toBe(true);
}

async function threeD(page: Page, width: number): Promise<void> {
  const open = page.getByRole('button', { name: 'See it in 3D' });
  await expect(open).toHaveAccessibleDescription('To look at, not to measure; about 34 MB the first time.');
  await pressByKeyboard(page, open);
  const sheet = page.getByRole('dialog', { name: 'See it in 3D' });
  const stage = sheet.getByRole('img', { name: 'Your photo in 3D' });
  await expect(status(sheet, 'Facing front.')).toHaveCount(1, { timeout: EXTRA_TIMEOUT_MS });
  await expect(sheet.getByText('for looking only, not for measuring', { exact: false })).toBeVisible();
  await frames(page);
  await shot(page, 'three-d-front', width);
  await expectAxeClean(page, 'the 3D view');
  await turnByKeyboard(page, sheet, stage, width);
  await dragAndStayStill(page, sheet, stage);
  await expectDisposedOnClose(page, sheet);
}

// ── "See it on me" and the hair-only version ──

async function colourGoalToIdeas(page: Page): Promise<void> {
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText('Colour', { exact: true }).click();
  await page.getByText("Women's styles", { exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Skip to my ideas' }).click();
  await expect(heading(page)).toHaveText('Your ideas');
}

async function seeItOnMe(page: Page, width: number): Promise<void> {
  const card = page.locator('article', { has: page.getByRole('heading', { level: 3, name: DRAWN, exact: true }) });
  await card.getByRole('button', { name: 'See it on me' }).click();
  const sheet = page.getByRole('dialog', { name: 'See it on me' });
  await expect(sheet.getByText('Rough preview', { exact: true })).toBeVisible();
  await expect(status(sheet, `${DRAWN}, rough preview on your photo`)).toHaveCount(1, { timeout: EXTRA_TIMEOUT_MS });
  await expect(sheet.getByRole('group', { name: 'Colour family' })).toHaveCount(0);
  await shot(page, 'see-it-on-me', width);
  await expectAxeClean(page, 'See it on me');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
}

/** A picture in a slot, then the Board's switch: the person's own photo with that picture's hair colour, only inside the outline. */
async function hairOnlyOnBoard(page: Page, width: number): Promise<void> {
  await page.getByRole('button', { name: 'Try them on' }).click();
  await expect(heading(page)).toHaveText('Try it on');
  await page.getByRole('tab', { name: 'My pictures', exact: true }).click();
  await page.getByRole('group', { name: `Picture for ${DRAWN}` }).locator('input[type=file]').setInputFiles(AI_PICTURE);
  await expect(page.getByText(`Picture added for ${DRAWN}.`)).toBeAttached();
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  await expect(heading(page)).toHaveText('Board');
  const tile = page.getByRole('list', { name: 'Your looks' }).locator('> li').filter({ hasText: DRAWN });
  const picture = tile.locator('img').first();
  const before = await picture.getAttribute('src');
  await tile.getByRole('switch', { name: 'Hair-only version' }).check();
  await expect(picture).not.toHaveAttribute('src', before ?? '', { timeout: EXTRA_TIMEOUT_MS });
  await picture.evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(img, 0, 0);
    const image = context?.getImageData(0, 0, canvas.width, canvas.height);
    if (image) window.rec.kept['hair-only'] = image;
  });
  expectTintedInsideOnly(await splitByOutline(page, 'refined-before', 'hair-only', 'outline-final', 0), 'the hair-only version');
  await shot(page, 'board-hair-only', width);
  await expectAxeClean(page, 'Board with the hair-only version');
}

// ── The two device classes ──

test.describe('the extras on a computer at 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('preview, tap to select, the 3D view, See it on me and the hair-only version', async ({ page, guard }) => {
    await requires(page, 'workerWebGL');
    test.setTimeout(900_000);
    await reachLines(page);
    const sheet = await openLookPicker(page);
    await seePreview(page, sheet, 1280);
    await downloadSam(page, sheet, 1280);
    await tapToSelect(page, sheet, 1280);
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
    await threeD(page, 1280);
    // No goal is chosen yet, so the face card leads on to the goal question.
    await page.getByRole('button', { name: 'Choose what to change' }).click();
    await colourGoalToIdeas(page);
    await seeItOnMe(page, 1280);
    await hairOnlyOnBoard(page, 1280);
    await expectNoViolations(page);
    expect(guard.foreign, 'requests off the site').toEqual([]);
  });
});

/** The share of the two kept pictures that differs, and how many of the four corners (background) changed. */
const phoneDifference = (page: Page) =>
  page.evaluate(() => {
    const { kept } = window.rec;
    const [a, b] = [kept['phone-before'], kept['phone-after']];
    if (!a || !b) throw new Error('a kept picture is missing');
    const differs = (p: number): boolean => a.data[p * 4] !== b.data[p * 4] || a.data[p * 4 + 1] !== b.data[p * 4 + 1] || a.data[p * 4 + 2] !== b.data[p * 4 + 2];
    let changed = 0;
    for (let p = 0; p < a.width * a.height; p++) if (differs(p)) changed++;
    return { share: changed / (a.width * a.height), corners: [0, a.width - 1, a.width * (a.height - 1), a.width * a.height - 1].filter(differs).length };
  });

test.describe('the extras on a phone at 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('the preview tints, and every extra says "Available on a computer"', async ({ page, guard }) => {
    await requires(page, 'workerWebGL');
    test.setTimeout(600_000);
    await reachLines(page);
    const sheet = await openLookPicker(page);
    await chooseLook(page, sheet, DRAWN);
    await keepPictures(page, 'phone');
    const difference = await phoneDifference(page);
    expect(difference.share, 'share of the picture tinted').toBeGreaterThan(0.01);
    expect(difference.corners, 'the corners are background and stay').toBe(0);
    await expect(sheet.getByText('Available on a computer')).toBeVisible();
    await expect(sheet.getByRole('button', { name: REFINE })).toHaveCount(0);
    await shot(page, 'phone-preview', 375);
    await expectAxeClean(page, 'the rough preview on a phone');
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'See it in 3D' })).toHaveCount(0);
    await expect(page.getByText('Available on a computer').first()).toBeVisible();
    await shot(page, 'phone-tools', 375);
    await expectNoViolations(page);
    expect(guard.foreign, 'requests off the site').toEqual([]);
  });
});
