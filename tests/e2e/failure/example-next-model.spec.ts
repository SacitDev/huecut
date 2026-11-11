/**
 * "Try another model" when the next example cannot load (no connection yet, the named failure): the person is told and can try
 * again, and the page is never left waiting on "Opening My look".
 */
import { expect, test } from '../guard.ts';
import { button, dropReported, heading } from './support.ts';
import { APP_URL } from '../server.ts';

const FAILED = 'The example could not open. It needs a connection the first time.';
const which = 'On a fictional model:';

// `page.route` does not see what a service worker fetches.
test.use({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });

test('the next model failing to load says so, and Try again opens it', async ({ page, guard }) => {
  await page.goto(`${APP_URL}#/my-look/face?source=example`);
  await expect(heading(page)).toHaveText('Your face card');
  const first = await page.getByText(which, { exact: false }).textContent();
  await page.route('**/examples/**', (route) => route.abort());
  await button(page, 'Try another model').click();
  await expect(page.getByText(FAILED)).toBeVisible();
  dropReported(guard, /ERR_FAILED/);
  await page.unroute('**/examples/**');
  await button(page, 'Try again').click();
  await expect(page.getByText(which, { exact: false })).not.toHaveText(first ?? '');
  await expect(heading(page)).toHaveText('Your face card');
});
