/**
 * A stale worker chunk, in Chromium and WebKit: the worker chunk of an old build is gone after a deploy (routed to 404, the named
 * failure), so the worker says `boot_failed` within 1 s and the screen gives the reload sentence and its one action.
 */
import { expect, test } from '../guard.ts';
import { APP_URL } from '../server.ts';
import { button, dropReported, heading } from './support.ts';

const CHUNK = /\/huecut\/assets\/analysis\.worker-[^/]+\.js$/;
const BOOT_FAILED = 'The face tools could not start. Reload the page to get the latest version.';

// Playwright cannot route what a service worker answers, and the chunk gone from the server is the case under test.
test.use({ serviceWorkers: 'block' });

test('the worker chunk routed to 404 gives boot_failed within 1 s and the reload sentence', async ({ page, guard }) => {
  let refusedAt = 0;
  await page.route(CHUNK, async (route) => {
    refusedAt = Date.now();
    await route.fulfill({ status: 404, body: '' });
  });
  await page.goto(`${APP_URL}#/my-look/photo`);
  await expect(heading(page)).toHaveText('Add your photo');
  const sentence = page.locator('p', { hasText: BOOT_FAILED });
  await expect(sentence).toBeVisible();
  const elapsed = Date.now() - refusedAt;
  console.log(`stale-chunk: sentence ${String(elapsed)} ms after the 404`);
  expect(refusedAt, 'the chunk request reached the route').toBeGreaterThan(0);
  expect(elapsed).toBeLessThan(1_000);
  await expect(button(page, 'Continue with answers only')).toHaveCount(0);
  // The browser reports the missing chunk, and only that.
  dropReported(guard, /analysis\.worker|404|MIME type|dynamically imported module|Importing a module script failed/i);

  // After a deploy the reload finds the new chunk: the same screen with no sentence.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await button(page, 'Reload the page').click();
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(sentence).toHaveCount(0);
});
