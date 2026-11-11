/**
 * The homepage's scroll story and the page change on the build: the promise shows by itself, nothing sticks out sideways,
 * type never touches the photograph, the next panel covers the first and shuts its buttons, no Pause button, reduced motion stands still with
 * everything readable, the first screen's words clear of the scroll cue on computer screens in both languages, a page change plays, cleans up and
 * lands on the new heading, axe clean at phone and desktop width.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './guard.ts';
import { PREVIEW_PORT } from './server.ts';

const APP = `http://localhost:${String(PREVIEW_PORT)}/huecut/`;
const WIDTHS = [375, 1280];
const STAGE = '[class*="_heroTrack_"]';
/** The first screen's own button, found by place: once shut it is out of the accessibility tree, and the closing section has the same one. */
const FIRST_BUTTON = '[class*="_heroTrack_"] [class*="_copy_"] a';

async function open(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(APP);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const scrollTimelines = (page: Page): Promise<boolean> => page.evaluate(() => CSS.supports('animation-timeline: view()'));

/** Scrolls to a share of the first section's pinned track and lets the page paint it. */
async function toStage(page: Page, share: number, selector: string = STAGE): Promise<void> {
  await page.evaluate(([where, at]) => {
    const stage = document.querySelector(where);
    if (!stage) throw new Error('no stage');
    const box = stage.getBoundingClientRect();
    window.scrollTo({ top: box.top + window.scrollY + (box.height - window.innerHeight) * (at), behavior: 'instant' });
  }, [selector, share] as const);
  await page.evaluate(() => new Promise((done) => { requestAnimationFrame(() => { requestAnimationFrame(done); }); }));
}

/** The opening has played: only what scrolling drives, and the looks that change by themselves, are still moving. */
const entered = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.timeline instanceof ViewTimeline || /restLook|cueBob/.test((a as CSSAnimation).animationName)));

for (const width of WIDTHS) {
  test(`the first screen shows itself at ${String(width)} px`, async ({ page }) => {
    await open(page, width);
    await expect.poll(() => page.evaluate(() => {
      const lines = [...document.querySelectorAll('h1 span span')];
      return lines.length > 0 && lines.every((line) => line.getAnimations().every((a) => a.playState === 'finished'));
    }), { timeout: 5_000 }).toBe(true);
    await expect(page.getByRole('link', { name: 'Find my look' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /pause/i })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });

  test(`the scroll carries the story at ${String(width)} px`, async ({ page }) => {
    await open(page, width);
    test.skip(!(await scrollTimelines(page)), 'this browser shows the still page');
    await entered(page);
    const touching = await page.evaluate(() => {
      const figure = document.querySelector('[class*="_heroFigure_"]')?.getBoundingClientRect();
      if (!figure || figure.width === 0) return ['no figure'];
      return [...document.querySelectorAll('[class*="_heroTrack_"] [class*="_copy_"] > *')].flatMap((el) => {
        const b = el.getBoundingClientRect();
        const shown = b.width > 0 && b.height > 0;
        const apart = b.right <= figure.left || b.bottom <= figure.top;
        return shown && !apart ? [el.tagName] : [];
      });
    });
    expect(touching, 'words touching the photograph').toEqual([]);
    await toStage(page, 1);
    await expect(page.locator(FIRST_BUTTON).first()).toBeHidden();
    await expect(page.locator('#home-lines')).toBeInViewport();
    await toStage(page, 0);
    await expect(page.locator(FIRST_BUTTON).first()).toBeVisible();
  });
}

/** Phones with the browser's own bars showing, so the page gets far less height than the screen has. */
const PHONES = [[320, 568], [360, 640], [360, 690], [375, 667], [390, 664], [412, 780], [375, 812]] as const;
const STORY = [['_heroTrack_', 0], ['_linesTrack_', 0.5], ['_colourTrack_', 0.5]] as const;
/** The least of the photograph a person sees above the tab bar, as a share of the page's height. */
const LEAST_PICTURE_SHARE = 0.15;

for (const [width, height] of PHONES) {
  test(`words and photograph stay apart on a ${String(width)} by ${String(height)} phone`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(APP);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    test.skip(!(await scrollTimelines(page)), 'this browser shows the still page');
    await entered(page);
    for (const [track, share] of STORY) {
      const stage = `[class*="${track}"]`;
      await toStage(page, share, stage);
      const found = await page.evaluate((selector) => {
        const figure = document.querySelector(`${selector} [class*="_figure_"]`)?.getBoundingClientRect();
        const tabs = document.querySelector('nav[aria-label="Main"]')?.getBoundingClientRect();
        if (!figure || !tabs) return null;
        const words = [...document.querySelectorAll(`${selector} [class*="_copy_"] > *`)].map((el) => ({ tag: el.tagName, box: el.getBoundingClientRect() })).filter(({ box }) => box.width > 0 && box.height > 0);
        return {
          touching: words.filter(({ box }) => box.bottom > figure.top && box.top < figure.bottom).map((w) => w.tag),
          hiddenByTabs: words.filter(({ box }) => box.bottom > tabs.top).map((w) => w.tag),
          picture: Math.min(figure.bottom, tabs.top) - figure.top,
        };
      }, stage);
      if (!found) throw new Error(`no figure in ${track}`);
      expect(found.touching, `${track}: words touching the photograph`).toEqual([]);
      expect(found.hiddenByTabs, `${track}: words behind the tab bar`).toEqual([]);
      expect(found.picture, `${track}: the photograph still shows`).toBeGreaterThanOrEqual(height * LEAST_PICTURE_SHARE);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

/** Computer screens, a 1600 by 851 laptop at 125 % among them: the Latvian promise wraps to five lines where the English takes three. */
const SCREENS = [[1920, 1080], [1600, 851], [1536, 864], [1440, 900], [1366, 768], [1280, 800], [1280, 720], [1024, 700], [900, 700]] as const;

for (const language of ['en', 'lv'] as const) {
  test(`the first screen's words stay under the top bar, above the scroll cue and on the screen of a computer, in ${language === 'en' ? 'English' : 'Latvian'}`, async ({ page }) => {
    await page.addInitScript((chosen) => { localStorage.setItem('huecut:language', chosen); }, language);
    await page.goto(APP);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(language);
    test.skip(!(await scrollTimelines(page)), 'this browser shows the still page');
    for (const [width, height] of SCREENS) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise((done) => { requestAnimationFrame(() => { requestAnimationFrame(done); }); }));
      await entered(page);
      const found = await page.evaluate(() => {
        const words = [...document.querySelectorAll('[class*="_heroTrack_"] [class*="_copy_"] > *')].map((el) => el.getBoundingClientRect()).filter((box) => box.height > 0);
        const cue = document.querySelector('[class*="_heroTrack_"] [class*="_cue_"]');
        return {
          top: Math.min(...words.map((box) => box.top)),
          bottom: Math.max(...words.map((box) => box.bottom)),
          cue: cue && getComputedStyle(cue).display !== 'none' ? cue.getBoundingClientRect().top : null,
          bar: document.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
        };
      });
      const at = `${String(width)} by ${String(height)}`;
      expect(found.cue, `${at}: the scroll cue shows`).not.toBeNull();
      expect(found.top, `${at}: the words start under the top bar`).toBeGreaterThanOrEqual(found.bar);
      expect(found.bottom, `${at}: the words end above the scroll cue`).toBeLessThanOrEqual(found.cue ?? 0);
      expect(found.bottom, `${at}: the words end on the screen`).toBeLessThanOrEqual(height);
    }
  });
}

// Where the pictures of you come from is said on a phone's first screen too; a page under 46rem tall gives it up for the photograph.
test('a phone\'s first screen says where the pictures of you come from', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(APP);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator(STAGE).getByText('Pictures of you with each look are made in your own ChatGPT or Gemini.', { exact: false })).toBeInViewport();
});

test('reduced motion stands still with everything readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 1280);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Find my look' }).first()).toBeVisible();
});

test('a page change plays, cleans up and lands on the new heading', async ({ page }) => {
  await open(page, 1280);
  await toStage(page, 0.4);
  const canPlay = await page.evaluate(() => 'startViewTransition' in document && 'userAgentData' in navigator);
  const played = canPlay
    ? page.evaluate(() => new Promise<string | undefined>((done) => {
      new MutationObserver((_, watcher) => {
        watcher.disconnect();
        done(document.documentElement.dataset.pageChange);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-page-change'] });
    }))
    : Promise.resolve('place');
  await page.locator('a[href="#/explore"]').first().evaluate((link: HTMLElement) => { link.click(); });
  expect(await played).toBe('place');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toContainText('Explore');
  await expect(heading).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.pageChange ?? 'none')).toBe('none');
});
