/**
 * A tab crash while an extra runs, in Chromium: a real tab crash (CDP `Page.crash`) while depth runs, then a reload through CDP `Page.navigate`,
 * because Playwright's `page.reload` refuses a crashed page. The "running extra" marker survives and Help's line for that extra says why it is off.
 */
import { expect, requires, test } from '../guard.ts';
import { APP_URL } from '../server.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, drawing, HIDDEN_HAIRLINE } from './support.ts';

const MARKER = 'huecut:running-extra';
const OFF_FOR_NOW = 'This tool stopped the page last time, so it is off for now on this device.';

test('CDP Page.crash during a depth run, then reload: the 3D view is off with its reason and tap-to-select stays', async ({ page }) => {
  await requires(page, 'workerWebGL', 'cdp');
  test.setTimeout(600_000);
  await page.goto(`${APP_URL}#/my-look/photo`);
  await addPhotos(page, HIDDEN_HAIRLINE);
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  await button(page, 'See it in 3D').click();
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), MARKER), { timeout: ANALYSIS_TIMEOUT_MS, intervals: [25] }).toBe('depth');

  const cdp = await page.context().newCDPSession(page);
  const crashed = new Promise<void>((done) => { page.once('crash', () => { done(); }); });
  void cdp.send('Page.crash').catch(() => undefined);
  await crashed;
  await cdp.send('Page.navigate', { url: `${APP_URL}#/help/method` });

  // Playwright keeps a crashed page crashed, whatever the tab does next, so the reloaded tab is read over the same CDP session.
  const read = async (expression: string): Promise<unknown> => (await cdp.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await expect.poll(() => read('document.body.innerText'), { timeout: 30_000 }).toContain(`See it in 3D: ${OFF_FOR_NOW}`);
  expect(await read('document.body.innerText'), 'the other extra was not the one running').toContain('Refine my hair outline: Works on this device.');
  expect(await read(`sessionStorage.getItem('${MARKER}')`), 'the marker survived the crash').toBe('depth');
});
