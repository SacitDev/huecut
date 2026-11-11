/**
 * Latvian beside English, on the build: English start-up requests no Latvian file and the service worker keeps none; a
 * Latvian browser starts in Latvian; a planted Latvian entry shows after the switch in Settings and survives a reload; switching
 * in the middle of the questions keeps the answers; a failed Latvian load shows English with one notice and keeps the choice;
 * and the prompt for the AI stays English while the screen shows the Latvian name. The Latvian chunks are planted by route.
 */
import type { Page } from '@playwright/test';
import type { LvContent, LvStrings } from '../../src/strings/i18n.ts';
import built from '../../src/strings/lv-strings.json' with { type: 'json' };
import { answersToQuestions, button, dropReported, heading } from './failure/support.ts';
import { expect, test } from './guard.ts';
import { APP_URL } from './server.ts';

const LATVIAN_CHUNK = /\/assets\/lv-(?:strings|content)-[\w-]+\.js$/;
const STRINGS: LvStrings = {
  strings: { 'nav.explore': 'Izpēte', 'nav.settings': 'Iestatījumi', 'language.legend': 'Valoda', 'consult.questions.skip': 'Uz manām idejām' },
  functions: { 'consult.questions.count': { params: ['n', 'total'], cases: [{ when: {}, text: '{n}. jautājums no {total}' }] } },
  held: 1,
};
const CONTENT: LvContent = {
  'hair-texture.options.straight.label': 'Taisni',
  'hair-current-length.prompt': 'Cik tālu sniedzas jūsu mati, ja tos viegli izstiepj?',
  'frohawk.name': 'Frohauks',
};

/** Serves the planted Latvian in place of the build's two chunks (the build's own Latvian column is empty until translated). */
async function plantLatvian(page: Page): Promise<string[]> {
  const asked: string[] = [];
  await page.route(LATVIAN_CHUNK, async (route) => {
    asked.push(route.request().url());
    const table = route.request().url().includes('/lv-strings-') ? STRINGS : CONTENT;
    await route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: `export default ${JSON.stringify(table)};` });
  });
  return asked;
}

const navLink = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true });

/** Settings (named `settings` in the language shown), the language's option, then Escape, waiting until the sheet has gone. */
async function switchTo(page: Page, settings: string, language: 'English' | 'Latviešu'): Promise<void> {
  await page.getByRole('button', { name: settings, exact: true }).click();
  const option = page.getByText(language, { exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.getByRole('radio', { name: language })).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(option).toBeHidden();
}

/** The Latvian files in the site's caches, once its service worker is active. */
const latvianCached = (page: Page): Promise<string[]> =>
  page.evaluate(async (pattern) => {
    await navigator.serviceWorker.ready;
    const urls: string[] = [];
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) urls.push(r.url);
    return urls.filter((url) => new RegExp(pattern).test(url));
  }, LATVIAN_CHUNK.source);

test('English start-up requests no Latvian file, and the service worker keeps none', async ({ page, context }) => {
  const latvian: string[] = [];
  context.on('request', (r) => {
    if (LATVIAN_CHUNK.test(r.url())) latvian.push(r.url());
  });
  await page.goto(APP_URL);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto(`${APP_URL}#/explore`);
  await expect(heading(page)).toHaveText('Explore styles and colours');
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  const shell = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const names = (await caches.keys()).filter((name) => name.startsWith('huecut-shell-'));
    return names.length === 1 ? (await (await caches.open(names[0] ?? '')).keys()).length : 0;
  });
  expect(shell, 'the shell is cached').toBeGreaterThan(20);
  expect(await latvianCached(page), 'Latvian files in the cache').toEqual([]);
  expect(latvian, 'Latvian files requested').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
});

test('the service worker keeps the Latvian files once Latvian is chosen, and lets them go with English', async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await latvianCached(page)).toEqual([]);
  // The build's own Latvian chunks: the files are what counts here, and Settings is named in whatever Latvian they hold.
  await switchTo(page, 'Settings', 'Latviešu');
  await expect.poll(() => latvianCached(page)).toHaveLength(2);
  await switchTo(page, (built as LvStrings).strings['nav.settings'] ?? 'Settings', 'English');
  await expect.poll(() => latvianCached(page)).toEqual([]);
});

// Playwright cannot route what a service worker answers, so the planted Latvian needs the page to fetch it itself.
test.describe('In a Latvian browser', () => {
  test.use({ serviceWorkers: 'block', locale: 'lv-LV' });

  test('the app starts in Latvian with nothing saved', async ({ page }) => {
    await plantLatvian(page);
    await page.goto(APP_URL);
    await expect(navLink(page, 'Izpēte')).toBeVisible();
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('huecut:language')])).toEqual(['lv', null]);
  });
});

test.describe('With the Latvian planted', () => {
  test.use({ serviceWorkers: 'block' });

  test('a planted Latvian entry shows after the switch and survives a reload; English comes back', async ({ page }) => {
    const asked = await plantLatvian(page);
    await page.goto(APP_URL);
    await expect(navLink(page, 'Explore')).toBeVisible();
    expect(asked, 'English start-up').toEqual([]);
    await switchTo(page, 'Settings', 'Latviešu');
    await expect(navLink(page, 'Izpēte')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iestatījumi', exact: true })).toBeVisible();
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('huecut:language')])).toEqual(['lv', 'lv']);
    await page.reload();
    await expect(navLink(page, 'Izpēte')).toBeVisible();
    await switchTo(page, 'Iestatījumi', 'English');
    await expect(navLink(page, 'Explore')).toBeVisible();
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('huecut:language')])).toEqual(['en', 'en']);
  });

  test('switching in the middle of the questions keeps the answers and the place', async ({ page }) => {
    await plantLatvian(page);
    await answersToQuestions(page, 'Cut');
    // Past the first question's arrival, when a tap counts; the tap goes on to the next question.
    await page.waitForTimeout(600);
    await page.locator('main fieldset label', { hasText: 'Straight' }).click();
    await expect(page.getByText(/^Question 2 of \d+$/)).toBeVisible();
    await switchTo(page, 'Settings', 'Latviešu');
    await expect(page.getByRole('group', { name: CONTENT['hair-current-length.prompt'] ?? '' })).toBeVisible();
    await expect(page.getByText(/^2\. jautājums no \d+$/)).toBeVisible();
    await expect(button(page, 'Uz manām idejām')).toBeVisible();
    await button(page, 'Back').click();
    await expect(page.getByRole('radio', { name: 'Taisni', exact: true }), 'the first answer, now in Latvian').toBeChecked();
  });
});

test.describe('The prompt, and a failed load', () => {
  test.use({ serviceWorkers: 'block' });

  test('the prompt for the AI stays English while the screen shows the Latvian name', async ({ page }) => {
    await plantLatvian(page);
    await page.goto(APP_URL);
    await switchTo(page, 'Settings', 'Latviešu');
    await page.goto(`${APP_URL}#/explore/style/frohawk`);
    const panel = page.getByRole('dialog', { name: 'Frohauks' });
    await expect(panel).toBeVisible();
    await panel.getByText('Show the prompt', { exact: true }).click();
    const prompt = await panel.getByRole('textbox', { name: 'The prompt' }).inputValue();
    expect(prompt).toContain('Frohawk');
    expect(prompt).not.toContain('Frohauks');
  });

  test('a failed Latvian load shows English with one notice and keeps the choice', async ({ page, guard }) => {
    await page.route(LATVIAN_CHUNK, (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.setItem('huecut:language', 'lv');
    });
    await page.reload();
    const notice = page.getByRole('status').filter({ hasText: 'The Latvian text could not load, so the app is in English for now. Reload the page to try again.' });
    await expect(notice).toHaveCount(1);
    await expect(notice).toBeVisible();
    await expect(navLink(page, 'Explore')).toBeVisible();
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('huecut:language')])).toEqual(['en', 'lv']);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Latviešu' })).toBeChecked();
    // The browser reports the missing chunk, and only that.
    dropReported(guard, /lv-strings|404|dynamically imported module|Importing a module script failed|Failed to fetch|Load failed/i);
  });

  test('a stalled Latvian load gives English with the notice, never a blank page', async ({ page }) => {
    await page.route(LATVIAN_CHUNK, () => undefined);
    await page.addInitScript(() => {
      localStorage.setItem('huecut:language', 'lv');
    });
    // The stalled request may hold the load event, so only the navigation itself is awaited.
    await page.goto(APP_URL, { waitUntil: 'commit' });
    await expect(page.getByRole('status').filter({ hasText: 'The Latvian text could not load' })).toBeVisible({ timeout: 15_000 });
    await expect(navLink(page, 'Explore')).toBeVisible();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
