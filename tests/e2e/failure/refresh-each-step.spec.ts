/**
 * A reload at each step, in Chromium and WebKit at 375 and 1280 px: a reload at each of the 7 steps, with saving off
 * and with a saved session. No analysis is waited for when saving is off; in Chromium the saved photo itself is waited for and comes back.
 */
import type { Page } from '@playwright/test';
import { expect, requires, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, chooseGoal, FACE, go, heading, openPhoto, PHONE, RELOADED } from './support.ts';

const TITLES = {
  photo: 'Add your photo',
  face: 'Your face card',
  goal: 'Your goal',
  questions: 'A few questions',
  ideas: 'Your ideas',
  'try-on': 'Try it on',
  board: 'Board',
} as const;
type Step = keyof typeof TITLES;
const STEPS = Object.keys(TITLES) as Step[];

/** The clicks a person makes, from a new photo to `step`. */
async function walkTo(page: Page, step: Step): Promise<void> {
  const forward: readonly [string, () => Promise<void>][] = [
    ['photo', async () => { await openPhoto(page); await addPhotos(page, FACE); await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked(); }],
    ['face', () => button(page, 'Continue').click()],
    ['goal', () => button(page, 'Choose what to change').click()],
    ['questions', () => chooseGoal(page, 'Cut')],
    ['ideas', () => button(page, 'Skip to my ideas').click()],
    ['try-on', () => button(page, 'Try them on').click()],
    ['board', () => button(page, 'See your pictures side by side').click()],
  ];
  for (const [name, act] of forward) {
    await act();
    await expect(heading(page)).toHaveText(TITLES[name as Step]);
    if (name === step) return;
  }
}

/** What the saved session holds: its step and whether its photo is there as a stored copy. Asks whether the database exists first: opening one that does not would make an empty one. */
const stored = (page: Page): Promise<string> =>
  page.evaluate(async () => (await indexedDB.databases()).some((d) => d.name === 'huecut') ? new Promise<string>((resolve) => {
    const open = indexedDB.open('huecut', 1);
    open.onsuccess = () => {
      const get = open.result.transaction('session').objectStore('session').get('current');
      get.onsuccess = () => {
        const record = get.result as { photo: Blob | null; data: { step: string } } | undefined;
        open.result.close();
        resolve(`${record?.data.step ?? ''}/${record?.photo instanceof Blob ? 'photo' : 'none'}`);
      };
    };
  }) : '');

for (const device of [PHONE, { viewport: { width: 1280, height: 900 } }]) {
  test.describe(`refresh at ${String(device.viewport.width)} px`, () => {
    test.use(device);

    for (const step of STEPS) {
      test(`${step}, saving off: the page returns to Photo and says why`, async ({ page }) => {
        await page.addInitScript(() => { localStorage.setItem('huecut:saving', 'off'); });
        await walkTo(page, step);
        await page.reload();
        await expect(heading(page)).toHaveText('Add your photo');
        await expect(page).toHaveURL(/#\/my-look\/photo$/);
        await expect(page.getByText(RELOADED)).toHaveCount(step === 'photo' ? 0 : 1);
        await expect(page.getByRole('radio', { name: 'Photo 1' })).toHaveCount(0);
      });

      test(`${step}, saved by default: the same step comes back with no reload notice`, async ({ page }) => {
        // The photo is written as soon as it is added.
        await requires(page, 'idbBlob');
        await walkTo(page, step);
        await expect.poll(() => stored(page), { timeout: ANALYSIS_TIMEOUT_MS, intervals: [500] }).toBe(`${step}/photo`);
        await page.reload();
        await expect(heading(page)).toHaveText(TITLES[step]);
        await expect(page).toHaveURL(new RegExp(`#/my-look/${step}$`));
        await expect(page.getByText(RELOADED)).toHaveCount(0);
        await go(page, '#/my-look/photo');
        await expect(heading(page)).toHaveText('Add your photo');
        await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
      });
    }
  });
}
