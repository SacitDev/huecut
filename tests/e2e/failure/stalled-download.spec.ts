/**
 * A stalled download, in Chromium: a model request held with no response (the named failure), so after 30 s without progress the
 * download stops with "The download stopped. Download again?", and Download again works. Time is the bar here, so the test waits it out.
 */
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, drawing, heading, holdModel, needsAnalysis, openPhoto, FACE } from './support.ts';

const STALL_MS = 30_000;
const STALLED = 'The download stopped. Download again?';

test('a core model request held with no response stops at 30 s, and Download again draws the lines', async ({ page }) => {
  await needsAnalysis(page);
  const hold = await holdModel(page, /^mediapipe\/face_landmarker/);
  await openPhoto(page);
  await addPhotos(page, FACE);
  await expect.poll(hold.held, { timeout: ANALYSIS_TIMEOUT_MS }).toBeGreaterThan(0);
  const heldAt = Date.now();
  await expect(page.locator('p', { hasText: STALLED })).toBeVisible({ timeout: STALL_MS + 5_000 });
  const stalledAfter = Date.now() - heldAt;
  console.log(`stalled-download: stopped ${String(stalledAfter)} ms after the request was held`);
  // Everything before the held file moved the timer, so the bar is the 30 s since that file's request.
  expect(stalledAfter).toBeGreaterThanOrEqual(STALL_MS - 1_000);
  expect(stalledAfter).toBeLessThan(STALL_MS + 3_000);
  await expect(button(page, 'Continue with answers only')).toBeVisible();

  hold.release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await button(page, 'Download again').click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
});
