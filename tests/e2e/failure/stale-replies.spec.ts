/**
 * Stale replies, in Chromium with real analysis: replies from a replaced worker are covered by the crash tests (`worker-crash.spec.ts`).
 * Here, the other stale reply: a photo removed during its analysis has its reply discarded; the decode is held in the worker so
 * the removal lands in flight with no race (hold planted with `worker.evaluate`, released by the test).
 */
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, analysisWorker, button, expectAnalysed, FACE, needsAnalysis, onNextDecode, openPhoto, OTHER_FACE, photoRow } from './support.ts';

test('a photo removed during its analysis (decode held in the worker, then released): its late reply is dropped and the next photo is analysed', async ({ page }) => {
  await needsAnalysis(page);
  await openPhoto(page);
  // The tools first, so the hold falls on an analysis and its 15 s watchdog (limits.ts) starts only when the photo goes in.
  await addPhotos(page, FACE);
  await expectAnalysed(page, 'one-face-salon-straight-wavy.jpg');
  const worker = await analysisWorker(page);
  await onNextDecode(worker, 'hold');

  const beard = FACE.replace('one-face-salon-straight-wavy', 'beard');
  await addPhotos(page, [OTHER_FACE, beard]);
  const inFlight = page.locator('fieldset li', { hasText: 'Finding face points' });
  await expect(inFlight).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  const name = (await inFlight.innerText()).includes('beard.jpg') ? 'beard.jpg' : 'one-face-barbering-straight-wavy.jpg';
  const next = name === 'beard.jpg' ? 'one-face-barbering-straight-wavy.jpg' : 'beard.jpg';
  await inFlight.getByRole('button', { name: /^Remove Photo/ }).click();
  await button(inFlight, 'Remove photo').click();
  await expect(photoRow(page, name)).toHaveCount(0);

  await worker.evaluate(() => { (self as unknown as { releaseDecode: () => void }).releaseDecode(); });
  await expect.poll(() => worker.evaluate(() => (self as unknown as { decoded?: boolean }).decoded), { message: 'the held analysis ran on after the removal' }).toBe(true);
  await expectAnalysed(page, next);
  expect(page.workers(), 'the worker was not replaced').toContain(worker);
  await expect(photoRow(page, name)).toHaveCount(0);
});
