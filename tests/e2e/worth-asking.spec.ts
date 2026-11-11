/**
 * "Worth asking a colourist about" on the production build with the shipped content: a separate, labelled group at 320 px in
 * both themes, no sideways scroll, axe-clean, each card saying what the compromise is, and added to the list by keyboard.
 */
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './guard.ts';
import { axeClean, open, settled } from './real-content-support.ts';

const TITLE = 'Worth asking a colourist about';
const SENTENCE = 'This colour is from Women\'s styles, pictured on longer hair.';
/**
 * A barbering client with natural light blonde hair asking to go lighter: two men's looks do it, so three salon looks are lent and
 * the group appears. (A bright colour from medium brown no longer brings it: the men's looks that are not bright stay
 * eligible, and they fill the six places.)
 */
const ANSWERS = {
  'colour-natural-level': { chosen: [7] }, 'hair-chemical-history': { chosen: [0] }, 'hair-condition': { chosen: [0] },
  'pref-colour-direction': { chosen: [0] }, 'dye-reaction': { chosen: [0] },
};
const group = (page: Page): Locator => page.locator('section', { has: page.getByRole('heading', { level: 2, name: TITLE, exact: true }) });

test.use({ viewport: { width: 320, height: 800 } });

for (const theme of ['light', 'dark'] as const) {
  test(`stands apart, reads at 320 px and passes axe in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await open(page, { prefs: { goal: 'colour', collections: ['barbering'], count: 6 }, answers: ANSWERS });
    const cards = group(page).locator('article');
    await expect(cards.first()).toBeVisible();
    for (const card of await cards.all()) await expect(card.getByText(SENTENCE)).toBeVisible();
    await settled(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no sideways scroll at 320 px').toBeLessThanOrEqual(0);
    await axeClean(page, `${TITLE}, ${theme}, 320 px`);
  });
}

test('is added to the list from the keyboard, and leaves the group', async ({ page }) => {
  await open(page, { prefs: { goal: 'colour', collections: ['barbering'], count: 6 }, answers: ANSWERS });
  const first = group(page).locator('article').first();
  const name = await first.getByRole('heading', { level: 3 }).textContent();
  await first.getByRole('button', { name: 'Add to my ideas' }).focus();
  await page.keyboard.press('Enter');
  const colours = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'Colours', exact: true }) });
  await expect(colours.getByRole('heading', { level: 3, name: name ?? '' })).toBeVisible();
  await expect(group(page).getByRole('heading', { level: 3, name: name ?? '' })).toHaveCount(0);
  await expect(page.locator('h2:focus')).toHaveText(TITLE);
});
