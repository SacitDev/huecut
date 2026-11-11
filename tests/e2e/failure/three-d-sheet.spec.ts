/**
 * The 3D sheet's download on a fictional photo: its progress line follows the download, though the screen around it no longer re-renders
 * with each message, and a viewer chunk that cannot be fetched (the named failure, an aborted request) is said in words instead of staying busy for ever.
 */
import type { Page } from '@playwright/test';
import { expect, requires, test } from '../guard.ts';
import { button, dropReported, needsAnalysis, toLines } from './support.ts';

const THREE_D = 'See it in 3D';
/** Depth starts on the WASM backend before the viewer's chunk is asked for. */
const DEPTH_TIMEOUT_MS = 180_000;

// `page.route` does not see what a service worker fetches.
test.use({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });

/** The 3D view opened from the face card, on a photo the core tools have read. */
async function openThreeD(page: Page) {
  await button(page, THREE_D).click();
  return page.getByRole('dialog', { name: THREE_D });
}

test('a 3D viewer that cannot load says so', async ({ page, guard }) => {
  await needsAnalysis(page);
  await page.route('**/assets/viewer3d-*.js', (route) => route.abort());
  await toLines(page);
  const sheet = await openThreeD(page);
  await expect(sheet.getByRole('status').filter({ hasText: 'The 3D view could not open in this browser.' })).toHaveCount(1, { timeout: DEPTH_TIMEOUT_MS });
  dropReported(guard, /ERR_FAILED/);
});

test('the progress line of an extra follows its download', async ({ page }) => {
  await requires(page, 'workerWebGL', 'cdp');
  await toLines(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: (9_000 * 1000) / 8, uploadThroughput: (1_500 * 1000) / 8 });
  const sheet = await openThreeD(page);
  const line = sheet.getByRole('progressbar');
  await expect(line).toBeVisible({ timeout: DEPTH_TIMEOUT_MS });
  const shown = async (): Promise<number> => Number(await line.getAttribute('aria-valuenow'));
  await expect.poll(shown, { timeout: 30_000 }).toBeGreaterThan(0);
  const first = await shown();
  await expect.poll(shown, { timeout: 30_000 }).toBeGreaterThan(first);
});
