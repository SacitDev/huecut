/**
 * My look's first four steps on the build (so the CSP applies): add a fictional photo, see its lines drawn
 * (the canvas has pixels and the lines are listed as text), answer the goal and the core questions by keyboard, go
 * Back and Forward with the browser, reload and see why the photos are gone, no request off the site's origin, and
 * axe clean on every screen, at 375 and 1280 px. Real-model analysis runs where the capability probe finds the face tools.
 */
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { capabilities, expect, HAS_WORKER_WEBGL, noteScreenshot, requires, settled, test } from './guard.ts';
import { APP_URL as APP, PREVIEW_ORIGIN as ORIGIN } from './server.ts';
import { shotsDir } from './shots.ts';

const PHOTO = join(import.meta.dirname, '..', 'fixtures', 'faces', 'one-face-salon-straight-wavy.jpg');
/** First visit: the core tools come from the preview server (about 48 MB decoded), then one analysis. */
const LINES_TIMEOUT_MS = 180_000;
const MAX_TABS = 60;

/** Requests that left the site's own origin (blob: and data: stay on the device). */
function watchRequests(page: Page): string[] {
  const foreign: string[] = [];
  page.context().on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'blob:' && url.protocol !== 'data:' && url.origin !== ORIGIN) foreign.push(request.url());
  });
  return foreign;
}

async function expectAxeClean(page: Page, screen: string): Promise<void> {
  await settled(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const found = result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(found, `axe on ${screen}`).toEqual([]);
}

/** Presses Tab until `target` has focus: the keyboard path a person takes, never a click. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}

async function shot(page: Page, name: string, width: number): Promise<void> {
  await page.screenshot({ path: join(shotsDir('mylook-a'), `${name}-${String(width)}.png`), fullPage: true });
  noteScreenshot();
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

/** Pixels the painter put on the canvas: how many are not fully transparent, and how many distinct colours. */
async function canvasInk(canvas: Locator): Promise<{ readonly opaque: number; readonly colours: number }> {
  return canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const data = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data ?? new Uint8ClampedArray();
    const colours = new Set<number>();
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4 * 7) {
      if ((data[i + 3] ?? 0) > 0) opaque++;
      colours.add(((data[i] ?? 0) << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0));
    }
    return { opaque, colours: colours.size };
  });
}

async function addPhotoAndSeeLines(page: Page, width: number): Promise<void> {
  await page.goto(`${APP}#/my-look/photo`);
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(page.getByText('The app never uploads your photos.', { exact: false })).toBeVisible();
  await expectAxeClean(page, 'Photo, empty');
  await page.locator('input[type=file]').first().setInputFiles(PHOTO);
  await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
  await expect(page.getByText('First time only: the face tools download (about 38 MB). Wi-Fi is best.')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('progressbar')).toBeVisible();
  await shot(page, 'photo-downloading', width);  await expectAxeClean(page, 'Photo, downloading');
  await tabTo(page, page.getByRole('button', { name: 'Continue', exact: true }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Your face card');
  await expect(page).toHaveURL(/#\/my-look\/face$/);
  const canvas = page.getByRole('img', { name: /^Your photo with lines on the face outline/ });
  await expect(canvas).toBeVisible({ timeout: LINES_TIMEOUT_MS });
  await expect(page.getByRole('region', { name: 'What this photo shows' }).getByRole('heading', { level: 3 }).first()).toBeVisible();
  // Let the trace finish (capped at 1.6 s), then the drawing must have ink of many colours: photo and lines.
  await page.waitForTimeout(2_000);
  const ink = await canvasInk(canvas);
  expect(ink.opaque).toBeGreaterThan(1_000);
  expect(ink.colours).toBeGreaterThan(50);
  await shot(page, 'face', width);
  // On phones the sticky action bar lies over whatever is under it at this scroll, and axe's target-size counts a row under it
  // as obscured; at the end of the page the bar rests below the list (as in face.spec.ts and try-on.spec.ts).
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  await expectAxeClean(page, 'Your face card');
}

/** Presses Tab until focus is inside `group` (a radio group takes one Tab stop). */
async function tabInto(page: Page, group: Locator): Promise<void> {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await page.evaluate((els) => els.some((el) => el === document.activeElement), await group.elementHandles())) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${group.toString()}`);
}

/** Chooses an option as a keyboard user does: Tab into its radio group and arrow to it, or Tab to a checkbox; Space. */
async function chooseByKeyboard(page: Page, option: Locator): Promise<void> {
  if ((await option.getAttribute('type')) === 'radio') {
    await tabInto(page, page.locator(`input[type="radio"][name="${(await option.getAttribute('name')) ?? ''}"]`));
    for (let i = 0; i < MAX_TABS && !(await option.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('ArrowDown');
  } else {
    await tabTo(page, option);
  }
  if (!(await option.isChecked())) await page.keyboard.press('Space');
  await expect(option).toBeChecked();
}

async function answerGoal(page: Page, width: number): Promise<void> {
  // The face card's primary names where it leads: "Choose what to change".
  await tabTo(page, page.getByRole('button', { name: 'Choose what to change', exact: true }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Your goal');
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await expectAxeClean(page, 'Goal');
  await chooseByKeyboard(page, page.getByRole('radio', { name: 'Cut', exact: true }));
  await chooseByKeyboard(page, page.getByRole('radio', { name: "Women's styles" }));
  await shot(page, 'goal', width);
  await tabTo(page, page.getByRole('button', { name: 'Continue', exact: true }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('A few questions');
}

/** The screen's heading and its "Question n of m" line, read together. */
const where = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const count = [...document.querySelectorAll('p')].find((p) => /^Question \d+ of \d+$/.test(p.textContent));
    return `${document.querySelector('h1')?.textContent ?? ''} | ${count?.textContent ?? ''}`;
  });

/** Answers every core question with its first option, by keyboard, until the flow leaves the questions. */
async function answerQuestions(page: Page, width: number, name = 'questions'): Promise<string[]> {
  await expect(page.getByText(/^Question \d+ of \d+$/)).toHaveText(/^Question 1 of \d+$/);
  await expectAxeClean(page, 'Questions');
  await shot(page, name, width);
  const seen: string[] = [];
  for (let now = await where(page); now.startsWith('A few questions |'); now = await where(page)) {
    seen.push(now);
    await chooseByKeyboard(page, page.locator('fieldset').first().locator('input').first());
    await tabTo(page, page.getByRole('button', { name: /^(Next question|Continue)$/ }));
    await page.keyboard.press('Enter');
    await expect.poll(() => where(page)).not.toBe(now);
  }
  return seen;
}

for (const width of [375, 1280]) {
  test(`My look from answers only at ${String(width)} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const foreign = watchRequests(page);
    // Home's "No photo? Get ideas from answers only" opens Goal; the start query leaves the URL once it has been used.
    await page.goto(`${APP}#/my-look/goal?source=answers`);
    await expect(heading(page)).toHaveText('Your goal');
    await expect(page).toHaveURL(/#\/my-look\/goal$/);
    await chooseByKeyboard(page, page.getByRole('radio', { name: 'Colour', exact: true }));
    await chooseByKeyboard(page, page.getByRole('radio', { name: 'All', exact: true }));
    await tabTo(page, page.getByRole('button', { name: 'Continue', exact: true }));
    await page.keyboard.press('Enter');
    await expect(heading(page)).toHaveText('A few questions');
    const asked = await answerQuestions(page, width, 'answers-questions');
    expect(asked.length).toBeGreaterThanOrEqual(5);
    // Colour goes from the questions straight to Ideas; Back returns to the last question, its answer kept.
    await expect(heading(page)).toHaveText('Your ideas');
    await expectAxeClean(page, 'Ideas');
    await page.goBack();
    await expect(heading(page)).toHaveText('A few questions');
    await expect(page.getByRole('radio', { checked: true }).or(page.getByRole('checkbox', { checked: true })).first()).toBeVisible();
    expect(foreign).toEqual([]);
  });

  test(`My look photo without the face tools at ${String(width)} px`, async ({ page }) => {
    test.skip((await capabilities(page)).workerWebGL, HAS_WORKER_WEBGL);
    await page.setViewportSize({ width, height: 900 });
    const foreign = watchRequests(page);
    await page.goto(`${APP}#/my-look/photo`);
    await page.locator('input[type=file]').first().setInputFiles(PHOTO);
    // Without OffscreenCanvas with WebGL in the worker (the probe above), the worker says `unsupported` before any download.
    await expect(page.locator('p', { hasText: 'The face tools cannot run in this browser.' })).toBeVisible({ timeout: 30_000 });
    // The worker can refuse before the photo is in: axe checks the screen once the photo has arrived, not while it lands.
    await expect(page.getByRole('button', { name: 'Remove Photo 1' })).toBeVisible();
    await expectAxeClean(page, 'Photo, tools unsupported');
    await tabTo(page, page.getByRole('button', { name: 'Continue with answers only' }));
    await page.keyboard.press('Enter');
    await expect(heading(page)).toHaveText('Your goal');
    expect(foreign).toEqual([]);
  });

  test(`My look photo to questions at ${String(width)} px`, async ({ page }) => {
    await requires(page, 'workerWebGL');
    // Saving off, so the reload at the end of this walk has nothing to bring back.
    await page.addInitScript(() => { localStorage.setItem('huecut:saving', 'off'); });
    await page.setViewportSize({ width, height: 900 });
    const foreign = watchRequests(page);
    await addPhotoAndSeeLines(page, width);
    await answerGoal(page, width);
    // Back and Forward with the browser: Questions → Goal (the choices kept) → Questions.
    await page.goBack();
    await expect(heading(page)).toHaveText('Your goal');
    await expect(page.getByRole('radio', { name: 'Cut', exact: true })).toBeChecked();
    await page.goBack();
    await expect(heading(page)).toHaveText('Your face card');
    await page.goForward();
    await page.goForward();
    await expect(heading(page)).toHaveText('A few questions');
    // The women's cut set asks up to 10; the count covers only the questions that apply, so it can shrink as answers
    // come in (the resting length is asked for curly or coily hair only).
    const asked = await answerQuestions(page, width);
    expect(asked.length).toBeGreaterThanOrEqual(8);
    expect(asked[0]).toMatch(/^A few questions \| Question 1 of (9|10)$/);
    // The questions lead to the ideas, with or without a photo.
    await expect(heading(page)).toHaveText('Your ideas');
    await expect(page).toHaveURL(/#\/my-look\/ideas$/);
    // A step not reached yet cannot be entered: the URL is put back to the machine's step.
    await page.goto(`${APP}#/my-look/board`);
    await expect(page).toHaveURL(/#\/my-look\/ideas$/);
    // A reload with nothing saved clears the photos and says so on Photo.
    await page.reload();
    await expect(heading(page)).toHaveText('Add your photo');
    await expect(page).toHaveURL(/#\/my-look\/photo$/);
    await expect(page.getByText('No photo is open here.', { exact: true })).toBeVisible();
    await shot(page, 'reloaded', width);
    await expectAxeClean(page, 'Photo after a reload');
    expect(foreign).toEqual([]);
  });
}

test('a model download does not re-render the step: only the progress line follows it', async ({ page }) => {
  await requires(page, 'workerWebGL', 'cdp');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    const scope = window as unknown as { commits: number; __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown };
    scope.commits = 0;
    scope.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject: () => 1, onScheduleFiberRoot: () => undefined, onCommitFiberRoot: () => { scope.commits += 1; }, onCommitFiberUnmount: () => undefined, onPostCommitFiberRoot: () => undefined, checkDCE: () => undefined };
  });
  const modelFiles = new Set<string>();
  page.on('requestfinished', (request) => { if (request.url().includes('/models/')) modelFiles.add(request.url()); });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: (9_000 * 1000) / 8, uploadThroughput: (1_500 * 1000) / 8 });
  await page.goto(`${APP}#/my-look/photo`);
  await expect(heading(page)).toHaveText('Add your photo');
  await page.locator('input[type=file]').first().setInputFiles(PHOTO);
  // The progress line itself still follows the download.
  const line = page.getByRole('progressbar');
  const shown = async (): Promise<number> => Number(await line.getAttribute('aria-valuenow'));
  await expect.poll(shown, { timeout: 30_000 }).toBeGreaterThan(0);
  const first = await shown();
  await expect.poll(shown, { timeout: 30_000 }).toBeGreaterThan(first);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(heading(page)).toHaveText('Your face card');
  await page.getByRole('button', { name: 'Choose what to change' }).click();
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText('Both', { exact: true }).click();
  await page.getByText("Women's styles", { exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(heading(page)).toHaveText('A few questions');
  await page.getByRole('button', { name: 'Skip to my ideas' }).click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page.locator('article').first()).toBeVisible();
  await page.waitForTimeout(1_000);
  const commits = (): Promise<number> => page.evaluate(() => (window as unknown as { commits: number }).commits);
  const before = await commits();
  await page.waitForTimeout(6_000);
  const made = (await commits()) - before;
  console.log(`commits on Ideas in 6 s of download: ${String(made)}; model files finished: ${String(modelFiles.size)}`);
  expect(modelFiles.size, 'the download was still running throughout').toBeLessThan(5);
  expect(made).toBeLessThan(6);
});
