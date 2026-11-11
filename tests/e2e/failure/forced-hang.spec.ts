/**
 * A forced hang, in Chromium: a real busy loop in the worker before an `analyse` (planted with `worker.evaluate`), the computer
 * watchdog of 15 s (limits.ts) ends it, the supervisor replaces the worker and the photo is analysed again.
 */
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, analysisWorker, button, expectAnalysed, go, heading, needsAnalysis, OTHER_FACE, toLines } from './support.ts';

const COMPUTER_ANALYSE_WATCHDOG_MS = 15_000;
/** The hang must outlast the watchdog by far: it is ended by `terminate()`, never by itself. */
const HANG_MS = 120_000;

test('a busy loop before an analyse (planted in the worker): the watchdog replaces the worker and the photo is analysed', async ({ page }) => {
  await needsAnalysis(page);
  await toLines(page);
  const old = await analysisWorker(page);
  let replacedAt = 0;
  page.once('worker', () => { replacedAt = Date.now(); });
  await button(page, 'Back').click();
  await expect(heading(page)).toHaveText('Add your photo');
  // In a macrotask, so this call returns at once: an evaluate still pending would keep the terminated worker listed.
  await old.evaluate((ms) => {
    setTimeout(() => {
      const end = Date.now() + ms;
      while (Date.now() < end);
    }, 0);
  }, HANG_MS);
  const addedAt = Date.now();
  await addPhotos(page, OTHER_FACE);
  await expectAnalysed(page, 'one-face-barbering-straight-wavy.jpg');
  const replaced = replacedAt - addedAt;
  console.log(`forced-hang: worker replaced ${String(replaced)} ms after the photo was added`);
  expect(replacedAt, 'a new worker took over').toBeGreaterThan(0);
  expect(replaced).toBeGreaterThanOrEqual(COMPUTER_ANALYSE_WATCHDOG_MS);
  expect(replaced, 'well before the hang would have ended on its own').toBeLessThan(HANG_MS / 2);
  await expect.poll(() => page.workers().length, { message: 'the hung worker is gone' }).toBe(1);
  expect(page.workers()[0]).not.toBe(old);
  await go(page, '#/my-look/face');
  await expect(page.locator('canvas[role="img"]')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
});
