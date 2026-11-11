/**
 * A full storage quota. Named failures: an init script makes IndexedDB `put` throw QuotaExceededError and `persist()` return false
 * (Chromium and WebKit: keeping is refused in words, everything else works), and CDP caps the origin's quota at 2 MB (Chromium:
 * Cache Storage refuses the model files, in the real browser: the verified bytes are used anyway and the lines are drawn).
 */
import { expect, requires, test } from '../guard.ts';
import { PREVIEW_ORIGIN } from '../server.ts';
import { answersToQuestions, button, go, heading, toLines } from './support.ts';

const REFUSED = 'Could not save. Keep this tab open.';

test('IndexedDB put throws QuotaExceededError and persist() is false: saving is refused in words, the rest goes on', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.set(IDBObjectStore.prototype, 'put', () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    Object.defineProperty(StorageManager.prototype, 'persist', { value: () => Promise.resolve(false) });
  });
  await answersToQuestions(page, 'Colour');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
  await expect(page.getByText(REFUSED).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Saved on this device', { exact: false })).toHaveCount(0);
  await go(page, '#/my-look/ideas');
  await expect(heading(page)).toHaveText('Your ideas');
  await button(page, 'Try them on').click();
  await expect(heading(page)).toHaveText('Try it on');
});

test('Cache Storage refused (CDP quota of 2 MB for the origin): the verified model files still run and the lines are drawn', async ({ page }) => {
  await requires(page, 'workerWebGL', 'cdp');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: PREVIEW_ORIGIN, quotaSize: 2 * 1024 * 1024 });
  await toLines(page);
  // The face card states what the photo shows only from a real reading (the Lines step's "Face points found" line is gone).
  await expect(page.getByRole('region', { name: 'What this photo shows' }).getByRole('heading', { level: 3 }).first()).toBeVisible();
  const kept = await page.evaluate(async () => (await (await caches.open('huecut-models')).keys()).length);
  expect(kept, 'a 2 MB quota cannot hold the 48 MB of model files').toBeLessThan(5);
});
