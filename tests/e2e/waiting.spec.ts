/**
 * Waiting feels alive, on a phone: a screen whose code is slow to come, the prompts' details held (the AI
 * pick's busy button and an idea's details), a held download of the face tools and one held photo analysis each show words saying what
 * is happening and a line that moves; under reduced motion (the device's setting, or the app's own Motion setting) the same words and a
 * line that stands still. Measured on the element that moves: its transform over 300 ms. Each wait is saved for the review.
 */
import { join } from 'node:path';
import type { Locator, Page, Route } from '@playwright/test';
import { addPhotos, analysisWorker, ANALYSIS_TIMEOUT_MS, answersToQuestions, button, expectAnalysed, FACE, heading, holdModel, onNextDecode, openPhoto, OTHER_FACE, PHONE } from './failure/support.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

test.use(PHONE);

/** How the page is asked to move: as the device allows, reduced by the device, or reduced by the app's own Motion setting. */
const MOTIONS = ['moving', 'reduced by the device', 'reduced in Settings'] as const;
type Motion = (typeof MOTIONS)[number];

async function setMotion(page: Page, motion: Motion): Promise<void> {
  if (motion === 'reduced by the device') await page.emulateMedia({ reducedMotion: 'reduce' });
  if (motion === 'reduced in Settings') await page.addInitScript(() => { localStorage.setItem('huecut:motion', 'reduce'); });
}

/** The wait's moving part (the progress bar's segment): its transform now and 300 ms later, the animations running on it, and its width. */
const sample = (bar: Locator) =>
  bar.evaluate(async (el) => {
    const part = el.firstElementChild;
    if (!part) throw new Error('the progress bar has no moving part');
    const at = (): string => getComputedStyle(part).transform;
    const first = at();
    await new Promise((done) => { setTimeout(done, 300); });
    return { first, later: at(), running: part.getAnimations().filter((a) => a.playState === 'running').length, width: part.getBoundingClientRect().width };
  });

/**
 * The words are on the screen and name the bar (or the busy button, `named`); the line moves, or under reduced motion stands still in
 * sight. Saved for the review unless `shot` is false.
 */
async function expectWait(bar: Locator, words: RegExp, motion: Motion, named: Locator = bar, shot = true): Promise<void> {
  await expect(bar).toBeVisible();
  await expect(named).toHaveAccessibleName(words);
  const seen = await sample(bar);
  if (shot) {
    await bar.scrollIntoViewIfNeeded();
    await bar.page().screenshot({ path: join(shotsDir('waiting'), `${test.info().title.replaceAll(/[^\w]+/gu, '-')}-${motion.replaceAll(' ', '-')}.png`) });
    noteScreenshot();
  }
  expect(seen.width, 'the line shows').toBeGreaterThan(0);
  if (motion === 'moving') {
    expect(seen.running, `one animation runs (${JSON.stringify(seen)})`).toBe(1);
    expect(seen.later, `the line moved in 300 ms (${JSON.stringify(seen)})`).not.toBe(seen.first);
  } else {
    expect(seen.running, `nothing runs (${JSON.stringify(seen)})`).toBe(0);
    expect(seen.later, `the line stands still (${JSON.stringify(seen)})`).toBe(seen.first);
  }
}

/** Holds every request the matcher takes until `release()`. */
async function hold(page: Page, matcher: RegExp): Promise<() => void> {
  let open = (): void => undefined;
  const gate = new Promise<void>((done) => { open = done; });
  await page.route(matcher, async (route: Route) => {
    await gate;
    await route.continue().catch(() => undefined);
  });
  return open;
}

/** Ideas while each idea's details are held: the AI pick's busy button and the first idea's card each show their wait. */
async function detailsHeld(page: Page, motion: Motion): Promise<void> {
  await answersToQuestions(page, 'Cut');
  // The library and the questions are in by now; each idea's details are a file of their own.
  const release = await hold(page, /\/assets\/[^/]+\.json$/u);
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  const busy = page.getByRole('button', { name: 'Getting the details ready' });
  await expectWait(busy.locator('span[aria-hidden="true"]'), /^Getting the details ready$/u, motion, busy);
  await expectWait(page.locator('main article[data-idea]').first().getByRole('progressbar'), /^Getting the details ready$/u, motion);
  release();
  await expect(busy).toHaveCount(0);
}

for (const motion of MOTIONS) {
  test.describe(motion, () => {
    test('a screen whose code is slow to come says it is opening', async ({ page, browserName }) => {
      await setMotion(page, motion);
      const release = await hold(page, /\/assets\/Help-[\w-]+\.js$/u);
      // Only to the response: the code held back here keeps the page loading.
      await page.goto(`${APP_URL}#/help`, { waitUntil: 'commit' });
      // WebKit takes no screenshot while the page is still loading (measured: page.screenshot ran past the test's 5 minutes).
      const bar = page.getByRole('progressbar');
      await expectWait(bar, /^Opening Help$/u, motion, bar, browserName !== 'webkit');
      release();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Help');
      await expect(page.getByRole('progressbar')).toHaveCount(0);
    });

    test('the prompts while their details are held: the AI pick waits on its button, an idea on its card', async ({ page }) => {
      await setMotion(page, motion);
      await detailsHeld(page, motion);
    });

    test('the face tools download, held', async ({ page }) => {
      await requires(page, 'workerWebGL');
      await setMotion(page, motion);
      const tools = await holdModel(page, /^mediapipe\//u);
      await openPhoto(page);
      await addPhotos(page, FACE);
      await expect.poll(() => tools.held(), { timeout: 60_000 }).toBeGreaterThan(0);
      await expectWait(page.getByRole('progressbar'), /face tools/u, motion);
      tools.release();
    });

    test('one photo analysis, held in the worker', async ({ page }) => {
      await requires(page, 'workerWebGL');
      await setMotion(page, motion);
      await openPhoto(page);
      // The tools first, so the hold falls on an analysis, short of its watchdog.
      await addPhotos(page, FACE);
      await expectAnalysed(page, 'one-face-salon-straight-wavy.jpg');
      const worker = await analysisWorker(page);
      await onNextDecode(worker, 'hold');
      await addPhotos(page, OTHER_FACE);
      const row = page.locator('main fieldset li', { hasText: 'one-face-barbering-straight-wavy.jpg' });
      await expectWait(row.getByRole('progressbar'), /^Finding face points$/u, motion);
      await worker.evaluate(() => { (self as unknown as { releaseDecode: () => void }).releaseDecode(); });
      await expectAnalysed(page, 'one-face-barbering-straight-wavy.jpg');
      await expect(row.getByRole('progressbar')).toHaveCount(0, { timeout: ANALYSIS_TIMEOUT_MS });
    });
  });
}
