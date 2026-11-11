/**
 * Explore e2e: the built app under the production CSP (`vite preview` on the port and folder of server.ts) on the
 * fixture content, which `explore-build.ts` builds into that folder (never `dist`) in beforeAll. At 375 and 1280 px, light and dark: tabs, filters in the URL and the count,
 * the no-results state, the detail by keyboard, Copy prompt, Save across a reload, the stylist sheet, axe, no console
 * errors and no request off the site. The search box at 320, 375, 768 and 1280 px, in both themes. Screenshots go to
 * `shotsDir('explore')` (tests/e2e/shots.ts).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import {
  axe, BASE, BOB, count, detail, openExplore, ORIGIN, PREVIEW_OUTDIR, SAVE_IMAGE, searchCaret, searchEnter, searchFocusOrder, searchLayout, searchLink, searchSpokenOnce,
  searchWithFilters, shot,
} from './explore-support.ts';
import { expect, test } from './guard.ts';

const BOB_ALT = `Front view: ${BOB}, on the straight-to-wavy model.`;
const BOB_SPEC = 'a chin-length blunt bob with a soft curtain fringe parted in the centre';
const VIEWPORTS = [{ name: 'phone', width: 375, height: 812 }, { name: 'desktop', width: 1280, height: 800 }] as const;
const THEMES = ['light', 'dark'] as const;


/** The fixture content build's temporary folder, removed after the suite. */
let work = '';

test.beforeAll(async () => {
  test.setTimeout(240_000);
  const app = join(test.info().project.testDir, '..', '..');
  work = mkdtempSync(join(tmpdir(), 'huecut-explore-'));
  const log = execFileSync(process.execPath, [join(app, 'tests', 'e2e', 'explore-build.ts'), work, PREVIEW_OUTDIR], { cwd: app, encoding: 'utf8' });
  console.log(log.trim());
  // The preview must serve this very build, or every check below would test something else.
  const served = await (await fetch(`${BASE}index.html`)).text();
  expect(served, `${ORIGIN} serves ${PREVIEW_OUTDIR}`).toBe(readFileSync(join(app, PREVIEW_OUTDIR, 'index.html'), 'utf8'));
});

test.afterAll(() => {
  if (work) rmSync(work, { recursive: true, force: true });
});

type Viewport = (typeof VIEWPORTS)[number];

async function tabsAndGrid(page: Page, tag: string): Promise<void> {
  await openExplore(page);
  await expect(page.getByText('The models in these pictures are fictional. The pictures are made as illustrations.')).toBeVisible();
  await expect(count(page)).toHaveText('3 styles');
  await expect(count(page)).toHaveAttribute('aria-live', 'polite');
  const styles = page.getByRole('tab', { name: 'Styles' });
  await expect(styles).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Colours' }).click();
  await expect(page).toHaveURL(/#\/explore\?tab=colours$/);
  await expect(count(page)).toHaveText('2 colour looks');
  await expect(page.getByRole('link', { name: 'Copper with silver ends' })).toBeVisible();
  // Arrow keys move between the tabs and choose at once; Home goes to the first.
  await page.getByRole('tab', { name: 'Colours' }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Beards' })).toBeFocused();
  await expect(page).toHaveURL(/tab=beards/);
  await expect(page.getByText('There are no beards in the library yet.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Show' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Beards' }).press('Home');
  await expect(styles).toBeFocused();
  await expect(page).toHaveURL(/#\/explore$/);
  // Every library picture is whole: the image box keeps the file's 3:4 aspect, with its three widths offered.
  const img = page.getByRole('img', { name: BOB_ALT });
  const box = await img.boundingBox();
  expect(box && box.width / box.height).toBeCloseTo(1086 / 1448, 2);
  await expect(img).toHaveAttribute('srcset', /chin-bob-curtain-fringe-front-480\.avif 480w, .*-960\.avif 960w, .*-1086\.avif 1086w$/);
  await expect(img).toHaveAttribute('sizes', /width >= 1200px/);
  await expect(page.getByText('Medium length, straight to wavy')).toBeVisible();
  await expect(page.getByText('Shown on wavy 2B hair')).toBeVisible();
  await shot(page, `${tag}-grid`);
  await axe(page, 'grid');
}

/** Phones: "All filters" opens the sheet; from 840 px the side panel holds the groups. */
async function chooseMediumLength(page: Page, vp: Viewport, tag: string): Promise<void> {
  if (vp.name === 'phone') {
    await page.getByRole('button', { name: 'All filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('group', { name: 'Length' }).getByRole('button', { name: 'Medium length' }).click();
    await expect(page).toHaveURL(/length=medium/);
    await expect(sheet.getByRole('button', { name: 'Show 1 style' })).toBeVisible();
    await shot(page, `${tag}-filters`);
    await axe(page, 'filter sheet');
    await sheet.getByRole('button', { name: 'Show 1 style' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'All filters 1 on' })).toBeFocused();
    return;
  }
  const panel = page.getByRole('complementary', { name: 'Filters' });
  await panel.getByRole('group', { name: 'Length' }).getByRole('button', { name: 'Medium length' }).click();
  await expect(page).toHaveURL(/length=medium/);
  await expect(panel.getByRole('button', { name: 'Medium length' })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, `${tag}-filters`);
}

async function filtersAndNoResults(page: Page, vp: Viewport, tag: string): Promise<void> {
  await openExplore(page);
  await chooseMediumLength(page, vp, tag);
  await expect(count(page)).toHaveText('1 style');
  await page.getByText("Men's styles", { exact: true }).click();
  await expect(page).toHaveURL(/show=barbering&length=medium/);
  await expect(count(page)).toHaveText('0 styles');
  await expect(page.getByText('No styles match both filters. Remove ‘Men\'s styles’ or ‘Medium length’?')).toBeVisible();
  await shot(page, `${tag}-no-results`);
  await axe(page, 'no results');
  await page.getByRole('button', { name: 'Remove Medium length' }).click();
  await expect(page).toHaveURL(/#\/explore\?show=barbering$/);
  await expect(count(page)).toHaveText('2 styles');
  // The query is the state: a reload shows the same filtered grid.
  await page.reload();
  await expect(count(page)).toHaveText('2 styles');
  await expect(page.getByRole('radio', { name: "Men's styles", exact: true })).toBeChecked();
  // The last filters are kept on the device: coming back to a bare #/explore restores them.
  await page.goto(`${BASE}#/`);
  await openExplore(page);
  await expect(page).toHaveURL(/#\/explore\?show=barbering$/);
  await expect(count(page)).toHaveText('2 styles');
}

async function detailByKeyboard(page: Page, tag: string): Promise<void> {
  await openExplore(page);
  const tile = page.getByRole('link', { name: BOB });
  await tile.focus();
  await page.keyboard.press('Enter');
  const dialog = detail(page, BOB);
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/#\/explore\/style\/chin-bob-curtain-fringe$/);
  await expect(dialog.getByRole('heading', { name: 'Lengths' })).toBeVisible();
  await expect(dialog.getByText('Front view, 1 of 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByText('Side view, 2 of 3')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Works with your hair if…' })).toBeVisible();
  await expect(dialog.getByText('it is curly: Cut it dry, curl by curl.')).toBeVisible();
  await expect(dialog.getByText('Paste it into a normal AI chat with your photo. The picture you get back is yours to save here.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Find my look with this style' })).toBeVisible();
  await shot(page, `${tag}-detail`);
  await axe(page, 'detail');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(tile).toBeFocused();
  // A deep link opens the detail over the grid; closing it leaves the grid with its filters.
  await openExplore(page, '#/explore/colour/copper-with-silver-ends?tab=colours');
  const look = detail(page, 'Copper with silver ends');
  await expect(look.getByRole('heading', { name: 'Colour' })).toBeVisible();
  // One picture, so no Previous and Next.
  await expect(look.getByRole('button', { name: 'Next' })).toHaveCount(0);
  await look.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/#\/explore\?tab=colours$/);
  await expect(count(page)).toHaveText('2 colour looks');
}

async function saveSurvivesReload(page: Page): Promise<void> {
  await openExplore(page);
  const heart = page.getByRole('button', { name: `Save ${BOB}` });
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: `Save ${BOB}` })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: BOB }).click();
  const save = detail(page, BOB).getByRole('button', { name: `Save ${BOB}` });
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('huecut:favourites'))).toBe('[]');
}

/** Only Chromium lets a test grant clipboard reading; elsewhere the button's own confirmation is what is checked. */
async function clipboard(page: Page, browserName: string): Promise<string | null> {
  return browserName === 'chromium' ? page.evaluate(() => navigator.clipboard.readText()) : null;
}

async function copyPrompt(page: Page, context: BrowserContext, browserName: string): Promise<Locator> {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
  await openExplore(page);
  await page.getByRole('link', { name: BOB }).click();
  const dialog = detail(page, BOB);
  const copy = dialog.getByRole('button', { name: 'Copy prompt' });
  await expect(copy).not.toHaveAttribute('aria-disabled', 'true');
  await copy.click();
  await expect(dialog.getByRole('button', { name: 'Prompt copied' })).toBeVisible();
  await expect(dialog.getByRole('status').filter({ hasText: 'Prompt copied. Now open ChatGPT or Gemini and paste it.' })).toBeVisible();
  if (browserName === 'chromium') expect(await clipboard(page, browserName)).toContain(BOB_SPEC);
  return dialog;
}

async function stylistSheet(page: Page, dialog: Locator, browserName: string, tag: string): Promise<void> {
  await dialog.getByRole('button', { name: 'Show your stylist' }).click();
  const sheet = page.getByRole('dialog', { name: BOB }).filter({ has: page.getByRole('button', SAVE_IMAGE) });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name: 'For my hair' })).toBeVisible();
  await expect(sheet.getByText('Huecut https://sacitdev.github.io/huecut/')).toBeVisible();
  await shot(page, `${tag}-stylist`);
  await axe(page, 'stylist sheet');
  await sheet.getByRole('button', { name: 'Copy as text' }).click();
  await expect(sheet.getByRole('button', { name: 'Sheet copied' })).toBeVisible();
  if (browserName === 'chromium') expect(await clipboard(page, browserName)).toMatch(/^Chin bob with a curtain fringe\r?\n\r?\nLengths\r?\n/);
  const download = page.waitForEvent('download');
  await sheet.getByRole('button', SAVE_IMAGE).click();
  expect((await download).suggestedFilename()).toMatch(/^huecut-stylist-sheet-\d{4}-\d{2}-\d{2}\.jpg$/);
  await expect(sheet.getByText('Stylist sheet saved to your downloads.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(dialog.getByRole('button', { name: 'Show your stylist' })).toBeFocused();
  await expect(dialog).toBeVisible();
}

test('opening a look is one motion: the picture flies over where transitions play, else the panel slides in once by itself', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExplore(page);
  // Where the router plays page transitions (Chromium browsers, which have userAgentData); WebKit crashed the tab on them.
  const morphs = await page.evaluate(() => 'startViewTransition' in document && 'userAgentData' in navigator);
  // The grid can render after the heading (measured in WebKit, like the filter panel): click once its first tile is there.
  await expect(page.locator('a[aria-labelledby]').first()).toBeVisible();
  const names = await page.evaluate(async () => {
    const seen = new Set<string>();
    const start = performance.now();
    document.querySelector<HTMLElement>('a[aria-labelledby]')?.click();
    while (performance.now() - start < 1500) {
      for (const a of document.querySelector('dialog[open]')?.getAnimations() ?? []) seen.add((a as CSSAnimation).animationName);
      await new Promise((next) => { requestAnimationFrame(next); });
    }
    return [...seen];
  });
  if (morphs) {
    expect(names, 'the dialog never animates in by itself').toEqual([]);
    await expect(page.locator('dialog[open][data-morphed]')).toHaveCount(1);
  } else {
    expect(names, 'its own entrance, once').toHaveLength(1);
    expect(names[0]).toMatch(/panel-in/);
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(page.locator('dialog[data-morphed]')).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[data-morphed]')).toHaveCount(0);
});

test('every filter heading stands clear of its buttons', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExplore(page);
  // The filter panel can render after the heading (measured in WebKit): measure once its first chip is there.
  await expect(page.locator('fieldset button').first()).toBeVisible();
  const gaps = await page.locator('fieldset').evaluateAll((sets) => sets.map((set) => {
    const legend = set.querySelector('legend')?.getBoundingClientRect();
    const chip = set.querySelector('button')?.getBoundingClientRect();
    return legend && chip ? chip.top - legend.bottom : null;
  }).filter((gap) => gap !== null));
  expect(gaps.length).toBeGreaterThan(2);
  for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(8);
});

test.describe('Search', () => {
  for (const [width, height] of [[320, 640], [375, 812], [768, 1024], [1280, 800]] as const) {
    for (const theme of THEMES) {
      test.describe(`${String(width)} ${theme}`, () => {
        test.use({ viewport: { width, height }, colorScheme: theme });
        test('narrows as you type, holds its place, and clears', async ({ page }) => searchLayout(page, `${String(width)}-${theme}`));
      });
    }
  }
  test('editing keeps the caret where it is, and a later word can be typed', async ({ page }) => searchCaret(page));
  test('a shared link opens the search, typing adds no history, and Back from a look returns to it', async ({ page }) => searchLink(page));
  test('works with the chips and across the tabs, and stays off the device', async ({ page }) => searchWithFilters(page));
  test('focus goes field, clear, tabs; clearing keeps it in the field', async ({ page }) => searchFocusOrder(page));
  test('the count is read out when typing pauses, not at every key, and shows at once', async ({ page }) => searchSpokenOnce(page));
  test('on a computer Enter leaves the field where it is', async ({ page }) => searchEnter(page, false));
  test.describe('on a phone', () => {
    test.use({ hasTouch: true });
    test('the Search key puts the keyboard away', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Only Chromium reports a coarse pointer for an emulated touch screen');
      await searchEnter(page, true);
    });
  });
});

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const tag = `${vp.name}-${theme}`;
    test.describe(`Explore ${tag}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
      test('tabs switch the library, change the URL and the count', async ({ page }) => tabsAndGrid(page, tag));
      test('filters change the URL and the count; no results names the filters', async ({ page }) => filtersAndNoResults(page, vp, tag));
      test('the detail opens and closes with the keyboard; focus returns to the tile', async ({ page }) => detailByKeyboard(page, tag));
      test('Save toggles aria-pressed and survives a reload', async ({ page }) => saveSurvivesReload(page));
      test('Copy prompt writes the clipboard; the stylist sheet copies and saves', async ({ page, context, browserName }) => {
        await stylistSheet(page, await copyPrompt(page, context, browserName), browserName, tag);
      });
    });
  }
}
