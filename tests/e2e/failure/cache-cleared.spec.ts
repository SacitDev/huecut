/**
 * The model cache cleared, in Chromium with real analysis: `caches.delete('huecut-models')` between visits (the named failure), then a
 * reload: the five core files are fetched again, every cached file hashes to its manifest entry, and a face is found.
 */
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, CORE_FILES, drawing, FACE, heading, needsAnalysis, RELOADED, toLines } from './support.ts';

test("caches.delete('huecut-models'), then reload: downloaded again, hashes verified, face found", async ({ page }) => {
  await needsAnalysis(page);
  // With nothing saved the reload starts over, so the photo goes through the model files again, the case under test.
  await page.addInitScript(() => { localStorage.setItem('huecut:saving', 'off'); });
  await toLines(page);
  const before = await page.evaluate(async () => (await caches.keys()).includes('huecut-models') && (await (await caches.open('huecut-models')).keys()).length);
  expect(before, 'the first visit stored every core file').toBe(CORE_FILES.length);

  expect(await page.evaluate(() => caches.delete('huecut-models'))).toBe(true);
  const fetched: string[] = [];
  page.on('response', (r) => { if (r.ok() && r.url().includes('/huecut/models/')) fetched.push(r.url()); });

  await page.reload();
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(page.getByText(RELOADED)).toBeVisible();
  await addPhotos(page, FACE);
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  // The face card states what the photo shows only from a real reading (the Lines step's "Face points found" line is gone).
  await expect(page.getByRole('region', { name: 'What this photo shows' }).getByRole('heading', { level: 3 }).first()).toBeVisible();

  for (const file of CORE_FILES) expect(fetched.filter((u) => u.includes(file.sha256)), `${file.path} downloaded once again`).toHaveLength(1);
  const hashes = await page.evaluate(async () => {
    const cache = await caches.open('huecut-models');
    return Promise.all(
      (await cache.keys()).map(async (request) => {
        const bytes = await (await cache.match(request))?.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes ?? new ArrayBuffer(0));
        return { url: request.url, hash: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('') };
      }),
    );
  });
  expect(hashes).toHaveLength(CORE_FILES.length);
  // Each entry's bytes hash to the manifest value named in its own URL.
  for (const file of CORE_FILES) expect(hashes.find((h) => h.url.includes(file.sha256))?.hash, `${file.path} bytes in the cache`).toBe(file.sha256);
});
