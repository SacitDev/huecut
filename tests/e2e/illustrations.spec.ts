/**
 * The question pictures on the build, so the CSP applies: a texture option shows its photo and a
 * recession option its drawing above the label; a drawing's ink is black on the light theme and white on the dark one;
 * axe clean; and one contact sheet of every drawing at 96 px, light and dark. Playwright's WebKit on Windows decodes
 * no AVIF at all (the library's pictures neither), so there a photo is only shown to be served; real Safari is untested.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import sharp from 'sharp';
import { capabilities, expect, noteScreenshot, test } from './guard.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const DRAWINGS = readdirSync(join(import.meta.dirname, '..', '..', 'public', 'illustrations')).filter((name) => name.endsWith('.svg')).sort();
const TEXTURE_Q = 'How does your hair dry if you leave it alone?';
const RECESSION_Q = 'Which drawing is closest to your hairline and crown?';
const MAX_QUESTIONS = 10;

/** Checks a radio as the keyboard does; the native input is visually hidden under its tile. */
async function choose(page: Page, radio: Locator): Promise<void> {
  await radio.focus();
  await page.keyboard.press('Space');
  await expect(radio).toBeChecked();
}

/** Opens the men's cut questions from answers only. */
async function openQuestions(page: Page): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await choose(page, page.getByRole('radio', { name: 'Cut', exact: true }));
  await choose(page, page.getByRole('radio', { name: "Men's styles", exact: true }));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

/** Answers each question with its first option until the one asking `prompt` is on screen. */
async function reach(page: Page, prompt: string): Promise<Locator> {
  const group = page.getByRole('group', { name: prompt });
  for (let n = 1; n <= MAX_QUESTIONS; n++) {
    await expect(page.getByText(new RegExp(`^Question ${String(n)} of \\d+$`))).toBeVisible();
    if (await group.isVisible()) return group;
    await choose(page, page.locator('fieldset input').first());
    await page.getByRole('button', { name: /^(Next question|Continue)$/ }).click();
  }
  throw new Error(`no question asked: ${prompt}`);
}

/** The option's picture is loaded above its label, 3:4, with no alt text of its own and its space held. */
async function expectPicture(group: Locator, label: string, file: string): Promise<Locator> {
  const tile = group.locator('label').filter({ has: group.page().getByText(label, { exact: true }) });
  const picture = tile.locator('img');
  await picture.scrollIntoViewIfNeeded();
  await expect(picture).toHaveAttribute('src', new RegExp(`/illustrations/${file}$`));
  await expect(picture).toHaveAttribute('alt', '');
  await expect(picture).toHaveAttribute('loading', 'lazy');
  await expect(picture).toHaveAttribute('width', '480');
  await expect(picture).toHaveAttribute('height', '640');
  if (file.endsWith('.avif') && !(await capabilities(group.page())).avif) {
    const served = await group.page().request.get(await picture.evaluate((img: HTMLImageElement) => img.src));
    expect([served.status(), served.headers()['content-type']], file).toEqual([200, 'image/avif']);
    return picture;
  }
  await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const box = await picture.boundingBox();
  const text = await tile.getByText(label, { exact: true }).boundingBox();
  expect(box !== null && text !== null && box.y + box.height <= text.y, `${file} sits above its label`).toBe(true);
  expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(4 / 3, 1);
  return picture;
}

/** The darkest and lightest grey levels painted inside `picture`. */
async function greyRange(picture: Locator): Promise<{ readonly darkest: number; readonly lightest: number }> {
  const png = await picture.screenshot({ animations: 'disabled' });
  noteScreenshot();
  const { data } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { darkest: data.reduce((low, v) => Math.min(low, v), 255), lightest: data.reduce((high, v) => Math.max(high, v), 0) };
}

async function expectAxeClean(page: Page, screen: string): Promise<void> {
  // A question fades in as it arrives: axe would measure its text at the opacity of the fade.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${screen}`).toEqual([]);
}

for (const width of [375, 1280]) {
  test(`question options show their pictures at ${String(width)} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openQuestions(page);
    const texture = await reach(page, TEXTURE_Q);
    await expectPicture(texture, 'Wavy', 'q-texture-wavy.avif');
    await expectAxeClean(page, 'the texture question');
    await page.screenshot({ path: join(shotsDir('illustrations'), `texture-${String(width)}.png`), fullPage: true });
    noteScreenshot();

    const recession = await reach(page, RECESSION_Q);
    const drawing = await expectPicture(recession, 'Higher at the temples, a small thin patch on the crown', 'q-recession-4.svg');
    await expectAxeClean(page, 'the recession question');

    // The page's own text is #2f1c19 (grey 34) and #f8eae6 (grey 237): ink at 0 and 255 is the file's black, not the
    // page's colour, so these fail if the dark theme loses its filter.
    await page.emulateMedia({ colorScheme: 'light' });
    expect((await greyRange(drawing)).darkest, 'light theme ink').toBeLessThanOrEqual(10);
    await page.screenshot({ path: join(shotsDir('illustrations'), `recession-light-${String(width)}.png`), fullPage: true });
    noteScreenshot();
    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await greyRange(drawing);
    expect(dark.lightest, 'dark theme ink').toBeGreaterThanOrEqual(245);
    expect(dark.darkest, 'dark theme ground').toBeLessThanOrEqual(60);
    await page.screenshot({ path: join(shotsDir('illustrations'), `recession-dark-${String(width)}.png`), fullPage: true });
    noteScreenshot();
  });
}

// 51 drawings and 57 swatches; a swatch keeps its true colour in the dark, as on its tile.
test('contact sheet: the 51 drawings and 57 swatches at 96 px, light and dark, in the app\'s own theme values', async ({ page }) => {
  expect(DRAWINGS).toHaveLength(108);
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(APP_URL);
  const counts = await page.evaluate((names) => {
    const root = document.documentElement;
    const sheet = document.createElement('div');
    for (const theme of ['light', 'dark']) {
      root.dataset.theme = theme;
      const tokens = getComputedStyle(root);
      const grid = document.createElement('div');
      Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(8, 96px)', gap: '16px', padding: '16px', background: tokens.getPropertyValue('--surface'), width: 'max-content' });
      for (const name of names) {
        const img = new Image(96, 128);
        img.src = `illustrations/${name}`;
        img.style.filter = name.startsWith('q-swatch') ? 'none' : tokens.getPropertyValue('--drawing-filter');
        grid.append(img);
      }
      sheet.append(grid);
    }
    root.dataset.theme = 'light';
    document.body.replaceChildren(sheet);
    return Promise.all([...sheet.querySelectorAll('img')].map((img) => img.decode().then(() => img.naturalWidth > 0 && img.width === 96))).then((loaded) => loaded.filter(Boolean).length);
  }, DRAWINGS);
  expect(counts).toBe(2 * DRAWINGS.length);
  await page.screenshot({ path: join(shotsDir('illustrations'), 'contact-sheet.png'), fullPage: true });
  noteScreenshot();
});
