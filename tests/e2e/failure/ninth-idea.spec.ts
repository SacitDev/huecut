/**
 * A ninth idea, in Chromium and WebKit (no analysis needed): adding from Explore. Own additions fill the list to 8 and the ninth is
 * refused with the app's sentence; with 4 own and 4 engine picks a fifth own addition drops the last engine pick.
 */
import type { Page } from '@playwright/test';
import { expect, test } from '../guard.ts';
import { APP_URL } from '../server.ts';
import { answersToQuestions, button, chooseGoal, go, heading } from './support.ts';

const FULL = 'Your list holds 8 ideas, the most it can. Remove one to add this.';
const FIND = 'Find my look with this style';
const YOURS = 'You added this';

/** The first `n` style ids Explore shows, leaving out the named ones (the engine's own picks, or the add would change nothing). */
async function styleIds(page: Page, n: number, skip: readonly string[] = []): Promise<string[]> {
  await go(page, '#/explore');
  const links = page.locator('a[href^="#/explore/style/"]');
  await expect(links.first()).toBeVisible();
  const tiles = await links.evaluateAll((all) => all.map((a) => ({ href: a.getAttribute('href') ?? '', text: a.textContent })));
  const ids = [...new Set(tiles.filter((t) => !skip.some((name) => t.text.includes(name))).map((t) => t.href))].map((h) => h.split('/').pop() ?? '').slice(0, n);
  expect(ids, 'Explore lists enough styles').toHaveLength(n);
  return ids;
}

/** Opens one style and adds it to My look; the page goes on to My look when the add is accepted. */
async function add(page: Page, id: string): Promise<void> {
  await go(page, `#/explore/style/${id}`);
  await button(page, FIND).click();
}

const ideaNames = (page: Page) => page.locator('main article h3').allTextContents();

test('eight own additions: the ninth from Explore is refused with the sentence', async ({ page }) => {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  const ids = await styleIds(page, 9);
  for (const id of ids.slice(0, 8)) {
    await add(page, id);
    await expect(page).toHaveURL(/#\/my-look\/goal$/);
  }
  await go(page, `#/explore/style/${ids[8] ?? ''}`);
  await button(page, FIND).click();
  await expect(page.getByText(FULL)).toBeAttached();
  await expect(page).toHaveURL(/#\/explore\/style\//);
  await go(page, '#/my-look/goal');
  await chooseGoal(page, 'Cut');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page.locator('main article')).toHaveCount(8);
  await expect(page.locator('main article').getByText(YOURS, { exact: true })).toHaveCount(8);
});

test('four own and four engine picks: a fifth own addition drops the last engine pick', async ({ page }) => {
  await answersToQuestions(page, 'Cut');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page.locator('main article')).toHaveCount(4);
  const picks = await ideaNames(page);
  const ids = await styleIds(page, 5, picks);
  for (const id of ids.slice(0, 4)) {
    await add(page, id);
    await expect(heading(page)).toHaveText('Your ideas');
  }
  await expect(page.locator('main article')).toHaveCount(8);
  await expect(page.locator('main article').getByText(YOURS, { exact: true })).toHaveCount(4);
  await expect.poll(() => ideaNames(page)).toEqual(expect.arrayContaining(picks));
  const before = await page.locator('main article').evaluateAll((cards) => cards.map((c) => ({ name: c.querySelector('h3')?.textContent ?? '', own: c.textContent.includes('You added this') })));
  const engine = before.filter((c) => !c.own).map((c) => c.name);
  expect(engine, 'four engine picks').toHaveLength(4);

  await add(page, ids[4] ?? '');
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page.locator('main article')).toHaveCount(8);
  await expect(page.locator('main article').getByText(YOURS, { exact: true })).toHaveCount(5);
  const after = await ideaNames(page);
  expect(after, 'the last engine pick is gone').not.toContain(engine[3]);
  for (const name of engine.slice(0, 3)) expect(after, `${name} stays`).toContain(name);
  for (const own of before.filter((c) => c.own)) expect(after, `${own.name} stays`).toContain(own.name);
});
