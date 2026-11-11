/**
 * What Explore's e2e needs beyond its own file: the shared steps, and the search box's scenarios. `explore.spec.ts`
 * registers every test, so its server and its guard apply to them all.
 */
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, noteScreenshot, settled } from './guard.ts';
import { fixtureServer } from './server.ts';
import { shotsDir } from './shots.ts';

/** The fixture suite's server. */
export const { APP_URL: BASE, PREVIEW_ORIGIN: ORIGIN, PREVIEW_OUTDIR } = fixtureServer('explore');
/** The fixture look most scenarios open. */
export const BOB = 'Chin bob with a curtain fringe';

/** The live region that reads the result count out. */
export const count = (page: Page): Locator => page.getByRole('status').filter({ hasText: /^\d+ (styles?|colour looks?|beards?)$/ });

/** axe on the page as it stands: no serious or critical violation. */
export async function axe(page: Page, where: string): Promise<void> {
  await settled(page);
  const result = await new AxeBuilder({ page }).analyze();
  const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe at ${where}`).toEqual([]);
}

/** A screenshot of the page once its colours have settled. */
export async function shot(page: Page, name: string): Promise<void> {
  await settled(page);
  await page.screenshot({ path: join(shotsDir('explore'), `${name}.png`) });
  noteScreenshot();
}

/** Opens Explore at `hash` and waits for its heading. */
export async function openExplore(page: Page, hash = '#/explore'): Promise<void> {
  await page.goto(`${BASE}${hash}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Explore styles and colours' })).toBeVisible();
}

/** The stylist sheet has its item's name too; its Save as image button tells the two dialogs apart. */
export const SAVE_IMAGE = { name: 'Save as image' } as const;
/** An item's detail dialog. */
export const detail = (page: Page, name: string): Locator => page.getByRole('dialog', { name }).filter({ hasNot: page.getByRole('button', SAVE_IMAGE) });

const field = (page: Page): Locator => page.getByRole('searchbox', { name: 'Search by name' });
/** The clear button inside the field; the no-results state has one of the same name. */
const clearInField = (page: Page): Locator => page.getByRole('search').getByRole('button', { name: 'Clear search' });
const visibleCount = (page: Page): Locator => page.locator('[class*="_count_"]');

/** Where the controls above the grid stand on the page: results changing must not move them. */
async function stillParts(page: Page): Promise<unknown[]> {
  const scrolled = await page.evaluate(() => window.scrollY);
  return Promise.all([field(page), page.getByRole('tablist', { name: 'What to explore' }), visibleCount(page)].map(async (part) => {
    const box = await part.boundingBox();
    return box && { ...box, y: box.y + scrolled };
  }));
}

/** The clear button is a real target, 16 px or more keeps an iPhone from zooming the page, and the keyboard is a search keyboard. */
async function searchFieldIsFit(page: Page): Promise<void> {
  const input = field(page);
  const box = await clearInField(page).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(await input.evaluate((e) => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  for (const [name, value] of [['type', 'search'], ['enterkeyhint', 'search'], ['autocapitalize', 'none'], ['autocorrect', 'off'], ['spellcheck', 'false']] as const) {
    await expect(input).toHaveAttribute(name, value);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'no sideways scroll').toBe(true);
}

/** Types, finds, finds nothing and clears at one size and theme, with nothing above the grid moving. */
export async function searchLayout(page: Page, tag: string): Promise<void> {
  await openExplore(page);
  const input = field(page);
  await expect(count(page)).toHaveText('3 styles');
  const before = await stillParts(page);
  await input.pressSequentially('bob');
  await expect(page).toHaveURL(/#\/explore\?q=bob$/);
  await expect(count(page)).toHaveText('1 style');
  await expect(page.getByRole('link', { name: BOB })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mid drop fade with textured crop' })).toHaveCount(0);
  expect(await stillParts(page), 'typing moves nothing above the grid').toEqual(before);
  await searchFieldIsFit(page);
  await shot(page, `${tag}-search`);
  await axe(page, 'search');
  await input.fill('zzz');
  await expect(page.getByText('No styles match ‘zzz’.', { exact: true })).toBeVisible();
  await expect(count(page)).toHaveText('0 styles');
  expect(await stillParts(page), 'nor does finding nothing').toEqual(before);
  await shot(page, `${tag}-search-none`);
  await axe(page, 'search with no results');
  await page.getByRole('main').getByRole('button', { name: 'Clear search' }).last().click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(count(page)).toHaveText('3 styles');
  expect(await stillParts(page), 'nor does clearing').toEqual(before);
}

/** Editing inside the text keeps the caret there, and a space does not eat the next word. */
export async function searchCaret(page: Page): Promise<void> {
  await openExplore(page);
  const input = field(page);
  await input.pressSequentially('ob');
  await input.press('Home');
  await input.pressSequentially('b');
  await expect(input).toHaveValue('bob');
  expect(await input.evaluate((e) => (e as HTMLInputElement).selectionStart), 'the caret stayed after the typed letter').toBe(1);
  await input.press('End');
  await input.pressSequentially(' chin');
  await expect(input).toHaveValue('bob chin');
  await expect(page).toHaveURL(/q=bob\+chin$/);
  await expect(count(page)).toHaveText('1 style');
}

/** A shared link, history, a look opened from the results, Back and a reload. */
export async function searchLink(page: Page): Promise<void> {
  await openExplore(page, '#/explore?q=chin+bob');
  const input = field(page);
  await expect(input).toHaveValue('chin bob');
  await expect(count(page)).toHaveText('1 style');
  const entries = await page.evaluate(() => history.length);
  await input.press('End');
  await input.pressSequentially(' curtain');
  await expect(page).toHaveURL(/q=chin\+bob\+curtain$/);
  expect(await page.evaluate(() => history.length), 'typing replaces the URL').toBe(entries);
  await page.getByRole('link', { name: BOB }).click();
  const dialog = detail(page, BOB);
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/chin-bob-curtain-fringe\?q=chin\+bob\+curtain$/);
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(input).toHaveValue('chin bob curtain');
  await expect(count(page)).toHaveText('1 style');
  await page.reload();
  await expect(field(page)).toHaveValue('chin bob curtain');
}

/** With the chips, across the tabs, and never stored with the filters. */
export async function searchWithFilters(page: Page): Promise<void> {
  await openExplore(page, '#/explore?q=bob&show=barbering');
  await expect(page.getByText('No styles match ‘bob’ with these filters.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Remove Men's styles" }).click();
  await expect(page).toHaveURL(/#\/explore\?q=bob$/);
  await expect(count(page)).toHaveText('1 style');
  await page.getByRole('tab', { name: 'Colours' }).click();
  await expect(page).toHaveURL(/#\/explore\?tab=colours&q=bob$/);
  await expect(page.getByText('No colour looks match ‘bob’.', { exact: true })).toBeVisible();
  // What is typed is free text, so it is not kept on the device with the filters: nothing personal is kept there.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('huecut:explore'))).toBe('tab=colours');
  await page.goto(`${BASE}#/`);
  await openExplore(page);
  await expect(page).toHaveURL(/#\/explore\?tab=colours$/);
  await expect(field(page)).toHaveValue('');
}

/** The field, then its clear button, then the tabs; clearing keeps focus in the field. */
export async function searchFocusOrder(page: Page): Promise<void> {
  await openExplore(page, '#/explore?q=bob');
  await field(page).focus();
  await page.keyboard.press('Tab');
  await expect(clearInField(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tab', { name: 'Styles' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(clearInField(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('');
  await expect(clearInField(page)).toHaveCount(0);
}

/** The count shows at once and is read out once, when typing pauses. */
export async function searchSpokenOnce(page: Page): Promise<void> {
  await openExplore(page);
  const status = count(page);
  await expect(status).toHaveText('3 styles');
  await status.evaluate((el) => {
    const said: string[] = [];
    (window as unknown as { said: string[] }).said = said;
    new MutationObserver(() => { said.push(el.textContent); }).observe(el, { childList: true, characterData: true, subtree: true });
  });
  // "b" finds 1 style and "bx" none, so without the pause the region would change twice.
  await field(page).pressSequentially('bx', { delay: 40 });
  await expect(visibleCount(page)).toHaveText('0 styles');
  await expect(status).toHaveText('0 styles');
  expect(await page.evaluate(() => (window as unknown as { said: string[] }).said)).toEqual(['0 styles']);
}

/** Enter on a touch screen puts the keyboard away; on a computer it leaves the field focused. */
export async function searchEnter(page: Page, touch: boolean): Promise<void> {
  await openExplore(page);
  await field(page).pressSequentially('bob');
  await field(page).press('Enter');
  if (touch) await expect(field(page)).not.toBeFocused();
  else await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('bob');
  await expect(page).toHaveURL(/#\/explore\?q=bob$/);
}
