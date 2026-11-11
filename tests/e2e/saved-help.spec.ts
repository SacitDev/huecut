/**
 * Saved, Help, the service worker and the examples on the build (production CSP, fixture content from `explore-build.ts`;
 * `HUECUT_E2E_PREBUILT=1` tests the build already there), at 375 and 1280 px, axe, no request off the site, fictional faces only.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { devices, type Page } from '@playwright/test';
import { SESSION_SCHEMA_VERSION } from '../../src/domain/session/session-data.ts';
import { capabilities, expect, noteScreenshot, requires, test } from './guard.ts';
import { fixtureServer } from './server.ts';
import { controlled as waitForServiceWorker } from './save-support.ts';
import { shotsDir } from './shots.ts';

const { APP_URL, PREVIEW_ORIGIN, PREVIEW_OUTDIR } = fixtureServer('saved-help');
const app = join(import.meta.dirname, '..', '..');
const PHOTO = join(app, 'tests', 'fixtures', 'faces', 'one-face-salon-straight-wavy.jpg');
const VIEWPORTS = [{ width: 375, height: 812 }, { width: 1280, height: 800 }] as const;
const HOUR_MS = 3_600_000;
const PRIVACY_LINE = 'The app never uploads your photos. It hands a copy only to the app you choose when you tap Share or Download.';
const TRADEMARK_LINE = 'ChatGPT is a trademark of OpenAI and Gemini a trademark of Google; Huecut is not affiliated with either.';
const BOOT_FAILED = 'The face tools could not start. Reload the page to get the latest version.';
const DELETE_RULE = 'Keep for 24 hours deletes it the next time the app runs after 24 hours.';
const NOT_SAVED = 'Not saved on this device.';
const SAVE_MODE = (name: string, page: Page) => page.getByRole('radio', { name, exact: true });
const OFF = "Delete and don't save";
const BOB = 'Chin bob with a curtain fringe';
const COPPER = 'Copper with silver ends';
/** The fixture content has no checked beard, so the beard group is covered by the unit test of `savedGroups`. */
const SAVED_IDS = ['chin-bob-curtain-fringe', 'copper-with-silver-ends'];

let work = '';
test.beforeAll(async () => {
  test.setTimeout(300_000);
  if (process.env.HUECUT_E2E_PREBUILT !== '1') {
    work = mkdtempSync(join(tmpdir(), 'huecut-saved-'));
    console.log(execFileSync(process.execPath, [join(app, 'tests', 'e2e', 'explore-build.ts'), work, PREVIEW_OUTDIR], { cwd: app, encoding: 'utf8' }).trim());
  }
  const served = await (await fetch(`${APP_URL}index.html`)).text();
  expect(served, `${PREVIEW_ORIGIN} serves ${PREVIEW_OUTDIR}`).toBe(readFileSync(join(app, PREVIEW_OUTDIR, 'index.html'), 'utf8'));
});

test.afterAll(() => { if (work) rmSync(work, { recursive: true, force: true }); });
const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const exampleBadge = (page: Page) => page.getByText('Example', { exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const go = (page: Page, hash: string): Promise<void> =>
  page.evaluate((h) => { window.location.hash = h; }, hash);

async function axeAndShot(page: Page, name: string, width: number): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${name} at ${String(width)} px`).toEqual([]);
  await page.screenshot({ path: join(shotsDir('saved-help'), `${name}-${String(width)}.png`), fullPage: true });
  noteScreenshot();
}

/** A valid kept record without a photo, last saved `ageHours` ago, as session-sync would have written it. */
const keptRecord = (ageHours: number) => ({
  data: { schemaVersion: SESSION_SCHEMA_VERSION, savedAt: Date.now() - ageHours * HOUR_MS, source: 'answers_only', step: 'goal', furthest: 2, answers: {}, prefs: { goal: null, collections: [], count: 4 }, shortlist: { added: [], removed: [], order: [] }, pair: null, slots: {}, grids: [], photo: null },
  photo: null, pictures: {},
});

/** One request on the session store, making the database if nothing has yet; the connection is closed again. */
const withSessionStore = (page: Page, op: 'get' | 'put', value: unknown): Promise<unknown> =>
  page.evaluate(
    ([kind, record]) =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('huecut', 1);
        open.onupgradeneeded = () => void open.result.createObjectStore('session');
        open.onerror = () => { reject(open.error ?? new Error('open failed')); };
        open.onsuccess = () => {
          const store = open.result.transaction('session', 'readwrite').objectStore('session');
          const request = kind === 'put' ? store.put(record, 'current') : store.get('current');
          request.onsuccess = () => {
            open.result.close();
            resolve(kind === 'put' ? null : ((request.result as unknown) ?? null));
          };
        };
      }),
    [op, value] as const,
  );

const seedKept = (page: Page, ageHours: number): Promise<unknown> => withSessionStore(page, 'put', keptRecord(ageHours));
const storedSession = (page: Page): Promise<unknown> => withSessionStore(page, 'get', null);

const openSaved = async (page: Page): Promise<void> => { await go(page, '#/saved'); await expect(heading(page)).toHaveText('Saved'); };

test('favourites show, grouped by kind, and go', async ({ page }) => {
  for (const { width, height } of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    await page.goto(APP_URL);
    await page.evaluate((ids) => { localStorage.setItem('huecut:favourites', JSON.stringify(ids)); }, SAVED_IDS);
    await page.goto(`${APP_URL}#/saved`);
    await page.reload();
    await expect(heading(page)).toHaveText('Saved');
    for (const group of ['Styles', 'Colour looks']) await expect(page.getByRole('heading', { level: 3, name: group })).toBeVisible();
    await expect(page.getByRole('link', { name: BOB })).toHaveAttribute('href', '#/explore/style/chin-bob-curtain-fringe');
    await expect(page.getByRole('link', { name: COPPER })).toHaveAttribute('href', '#/explore/colour/copper-with-silver-ends');
    await expect.poll(() => page.locator('main li img').evaluateAll((images) => images.filter((i) => (i as HTMLImageElement).currentSrc !== '').length)).toBe(2);
    const shown = await page.locator('main li img').evaluateAll((images) => images.map((i) => (i as HTMLImageElement).currentSrc));
    for (const src of shown) expect(new URL(src).pathname).toMatch(/^\/huecut\/library\/.+\.avif$/);
    await axeAndShot(page, 'saved-favourites', width);
    await button(page, `Remove ${BOB}`).click();
    await expect(page.getByRole('link', { name: BOB })).toHaveCount(0);
    await expect(page.getByText(`${BOB} removed from Saved.`)).toBeAttached();
    expect(await page.evaluate(() => localStorage.getItem('huecut:favourites'))).toBe(JSON.stringify(SAVED_IDS.slice(1)));
    await button(page, `Remove ${COPPER}`).click();
    await expect(page.getByText('No favourites yet.', { exact: false })).toBeVisible();
    await axeAndShot(page, 'saved-empty', width);
    await page.evaluate(() => { localStorage.clear(); });
  }
});

test('Saved and Help take the heading focus on navigation', async ({ page }) => {
  await page.goto(APP_URL);
  for (const name of ['Saved', 'Help']) {
    await page.getByRole('link', { name, exact: true }).first().click();
    await expect(heading(page)).toHaveText(name);
    await expect(heading(page)).toBeFocused();
  }
});

test("a saved session shows its time left, and Don't save removes it from IndexedDB", async ({ page }) => {
  await page.goto(APP_URL);
  await seedKept(page, 2);
  await openSaved(page);
  await expect(page.getByText('Saved on this device. About 22 hours left.')).toBeVisible();
  await expect(page.getByText(DELETE_RULE, { exact: false })).toBeVisible();
  await axeAndShot(page, 'saved-kept', 1280);
  await SAVE_MODE(OFF, page).click();
  await expect(page.getByText(NOT_SAVED).first()).toBeVisible();
  expect(await storedSession(page)).toBeNull();
  // Older than 24 hours, with no choice left in the browser: gone the next time Saved reads it.
  await page.evaluate(() => { localStorage.removeItem('huecut:saving'); });
  await seedKept(page, 25);
  await page.reload();
  await expect(page.getByText('Nothing is saved yet.')).toBeVisible();
  expect(await storedSession(page)).toBeNull();
});

test("an open session is saved from its first answer, and Don't save on Saved deletes it again", async ({ page }) => {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText('Cut', { exact: true }).click();
  await openSaved(page);
  await expect.poll(async () => ((await storedSession(page)) as { readonly data: unknown } | null)?.data).toMatchObject({ source: 'answers_only', step: 'goal', keep: 'until_deleted' });
  await SAVE_MODE(OFF, page).click();
  await expect(page.getByText(NOT_SAVED).first()).toBeVisible();
  await expect.poll(() => storedSession(page)).toBeNull();
});

/** Fills every store the app uses, beside entries another site on the origin would have. */
async function seedAll(page: Page): Promise<void> {
  await seedKept(page, 1);
  await page.evaluate(async () => {
    for (const [key, value] of [['huecut:favourites', '["chin-bob-curtain-fringe"]'], ['huecut:theme', 'dark'], ['huecut:motion', 'reduce'], ['huecut:saving', 'day'], ['other-site:keep', 'yes']] as const) localStorage.setItem(key, value);
    sessionStorage.setItem('huecut:running-extra', 'depth');
    for (const name of ['huecut-pictures', 'huecut-models', 'huecut-shell-seed', 'other-site-cache']) await (await caches.open(name)).put('/huecut/seed', new Response('x'));
    document.documentElement.dataset.theme = 'dark';
    await navigator.serviceWorker.ready;
  });
}

const storageState = (page: Page) =>
  page.evaluate(async () => ({ local: Object.keys(localStorage).sort(), session: Object.keys(sessionStorage), databases: (await indexedDB.databases()).map((d) => d.name), caches: (await caches.keys()).sort(), theme: document.documentElement.dataset.theme ?? null, worker: (await navigator.serviceWorker.getRegistration('/huecut/')) !== undefined }));

test('Delete my data asks once, inline, then empties the keys, the database and the caches, and only ours', async ({ page }) => {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await seedAll(page);
  await openSaved(page);
  await button(page, 'Delete my data').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('This deletes your favourites and your theme and motion settings. It deletes your saved session with its photo', { exact: false })).toBeVisible();
  await axeAndShot(page, 'saved-delete-ask', 1280);
  await button(page, 'Keep my data').click();
  expect((await storageState(page)).databases).toContain('huecut');
  expect(await storedSession(page)).not.toBeNull();
  await button(page, 'Delete my data').click();
  const before = await storageState(page);
  expect(before.local).toContain('huecut:favourites');
  expect([before.local.includes('huecut:saving'), before.worker], 'the saving choice and the worker are in the proof').toEqual([true, true]);
  expect(before.caches).toContain('huecut-models');
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
  const after = await storageState(page);
  expect([after.local, after.worker], 'only the time of the delete stays, which holds nothing personal').toEqual([['huecut:deleted-at', 'other-site:keep'], false]);
  expect(after.session).toEqual([]);
  expect(after.databases).not.toContain('huecut');
  expect(after.caches).toEqual(['other-site-cache']);
  expect(after.theme).toBeNull();
  await expect(page.getByText('No favourites yet.', { exact: false })).toBeVisible();
});

/** Each Help page: its route, its heading, its second-level headings and the lines it must show word for word. */
const HELP_PAGES = [
  {
    hash: '#/help/privacy', title: 'Privacy', shot: 'help-privacy',
    headings: ['What the app does not do', 'What is stored, and where', 'Test it yourself'],
    lines: [PRIVACY_LINE, 'There are no analytics and no accounts.', 'Safari may clear stored data after 7 days without a visit.', 'After the face tools have loaded once, switch on airplane mode. The app still opens and reads your photo. Pictures and extra tools you have not opened yet need a connection.', 'Blocked in this session: 0.'],
  },
  {
    hash: '#/help/method', title: 'How this is measured', shot: 'help-method',
    headings: ['Estimates', 'Hints', 'Phones and tablets', 'Colour labels', 'Tools on this device'],
    lines: ['See it in 3D: Works on this device.', 'Refine my hair outline: Works on this device.'],
  },
  { hash: '#/help/prompts', title: 'Using prompts', shot: 'help-prompts', headings: ['From prompt to picture', 'Tips'], lines: ['Always attach your own photo, never an AI picture.'] },
  { hash: '#/help/credits', title: 'Credits and licences', shot: 'help-credits', headings: ['Developed by Michael', 'Tools and fonts the app runs on'], lines: [TRADEMARK_LINE, 'Huecut is designed and developed by Michael (SacitDev on GitHub).', 'If you reuse or change this code, the MIT licence says you must keep this notice. Copyright (c) 2026 Michael (SacitDev)'] },
] as const;

test('Help has every section with the exact privacy and trademark lines', async ({ page }) => {
  for (const { width, height } of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    await page.goto(`${APP_URL}#/help`);
    await expect(heading(page)).toHaveText('Help');
    for (const part of ['How it works', 'Feedback']) await expect(page.getByRole('heading', { level: 2, name: part })).toBeVisible();
    await expect(page.getByText('pictures of you are made in your own ChatGPT or Gemini', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tell us how it went' })).toHaveAttribute('href', 'https://github.com/SacitDev/huecut/issues/new');
    await axeAndShot(page, 'help', width);
    for (const help of HELP_PAGES) {
      await go(page, help.hash);
      await expect(heading(page)).toHaveText(help.title);
      for (const part of help.headings) await expect(page.getByRole('heading', { level: 2, name: part })).toBeVisible();
      for (const line of help.lines) await expect(page.getByText(line, { exact: true })).toBeVisible();
      await axeAndShot(page, help.shot, width);
    }
    await go(page, '#/help/privacy');
    await expect(page.getByText("By default it stays until you delete it or your browser clears it, so it is not a backup. If you choose Keep for 24 hours, it is deleted the next time the app runs after 24 hours. If you choose Delete and don't save, any saved copy is deleted. Nothing more is saved until you choose a period again.", { exact: false })).toBeVisible();
    await go(page, '#/help/method');
    for (const part of ['That test is preliminary, and the app has not been tried on real phones.', 'With mostly grey hair, a silver gloss mostly tones the grey you already have.']) {
      await expect(page.getByText(part, { exact: false })).toBeVisible();
    }
  }
});

test('Help says why an extra is unavailable on a phone', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'a coarse pointer is emulated in Chromium');
  const page = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();
  await page.goto(`${APP_URL}#/help/method`);
  await expect(page.getByText('See it in 3D: Available on a computer')).toBeVisible();
  await expect(page.getByText('Refine my hair outline: Available on a computer')).toBeVisible();
  await page.context().close();
});

test('Help counts the metrics the worker blocked in this session', async ({ page }) => {
  await requires(page, 'workerWebGL');
  test.setTimeout(300_000);
  await page.goto(`${APP_URL}#/my-look/photo`);
  await page.locator('input[type=file]').first().setInputFiles(PHOTO);
  await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
  await button(page, 'Continue').click();
  await expect(page.locator('canvas[role="img"]')).toBeVisible({ timeout: 180_000 });
  const count = page.getByTestId('blocked-count');
  const read = async (): Promise<number> => {
    await go(page, '#/help');
    await expect(heading(page)).toHaveText('Help');
    await go(page, '#/help/privacy');
    await expect(count).toHaveText(/^Blocked in this session: \d+\.$/);
    return Number(/\d+/.exec((await count.textContent()) ?? '')?.[0]);
  };
  await expect.poll(read, { timeout: 120_000, intervals: [5_000] }).toBeGreaterThanOrEqual(1);
});

/** The first tile's picture has arrived, and its bytes come back from a fetch; its pixels are checked where the probe finds an AVIF decode. */
async function pictureLoaded(page: Page): Promise<void> {
  await page.waitForFunction((checkPixels) => { const image = document.querySelector<HTMLImageElement>('main img[alt^="Front view"]'); return image !== null && image.complete && (!checkPixels || image.naturalWidth > 0); }, (await capabilities(page)).avif);
  expect(await page.evaluate(async () => { const url = document.querySelector<HTMLImageElement>('main img[alt^="Front view"]')?.src ?? ''; const r = await fetch(url); return [r.status, r.headers.get('content-type')]; })).toEqual([200, 'image/avif']);
}

test('the service worker registers under the CSP and a second load works offline', async ({ page, context }) => {
  await page.goto(APP_URL);
  expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain("require-trusted-types-for 'script'");
  await waitForServiceWorker(page);
  expect(new URL(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL ?? '')).pathname).toBe('/huecut/sw.js');
  expect((await page.evaluate(() => caches.keys())).filter((name) => /^huecut-shell-[0-9a-f]{12}$/.test(name)).length).toBe(1);
  // A second visit goes through the worker, so its pictures are cached as they are viewed.
  await page.reload();
  await waitForServiceWorker(page);
  await go(page, '#/explore');
  await pictureLoaded(page);
  await page.waitForLoadState('networkidle');
  const pictures = await page.evaluate(async () => (await (await caches.open('huecut-pictures')).keys()).map((r) => new URL(r.url).pathname));
  expect(pictures.some((path) => /\/library\/.+\.avif$/.test(path))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(heading(page)).toHaveText('Explore styles and colours');
  await pictureLoaded(page);
  await expect(page.getByText('You are offline. Explore and anything you have already used still work.')).toBeVisible();
  await go(page, '#/help/privacy');
  await expect(page.getByText(PRIVACY_LINE, { exact: true })).toBeVisible();
  await axeAndShot(page, 'offline-help', 1280);
  await context.setOffline(false);
});

test('no cache holds a photo', async ({ page }) => {
  await page.goto(APP_URL);
  await waitForServiceWorker(page);
  await page.reload();
  await go(page, '#/my-look/photo');
  await page.locator('input[type=file]').first().setInputFiles(PHOTO);
  await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
  const entries = await page.evaluate(async (b64) => {
    const photo = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const same = (bytes: Uint8Array): boolean => bytes.length === photo.length && bytes.every((b, i) => b === photo[i]);
    const found: { cache: string; url: string; type: string; isPhoto: boolean }[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        const response = await caches.match(request, { cacheName: name, ignoreVary: true });
        found.push({ cache: name, url: request.url, type: response?.headers.get('content-type') ?? '', isPhoto: same(new Uint8Array((await response?.arrayBuffer()) ?? new ArrayBuffer(0))) });
      }
    }
    return found;
  }, readFileSync(PHOTO).toString('base64'));
  expect(entries.length).toBeGreaterThan(10);
  expect(entries.filter((e) => e.isPhoto)).toEqual([]);
  expect(entries.filter((e) => !e.url.startsWith(`${PREVIEW_ORIGIN}/huecut/`))).toEqual([]);
  expect(entries.filter((e) => e.cache === 'huecut-pictures' && !e.type.startsWith('image/'))).toEqual([]);
  expect(entries.filter((e) => e.cache.startsWith('huecut-shell-') && /\/(library|models)\//.test(e.url))).toEqual([]);
});

test('a worker chunk gone after a deploy says to reload the page', async ({ page, guard }) => {
  const assets = join(app, PREVIEW_OUTDIR, 'assets');
  const chunk = readdirSync(assets).find((name) => /^analysis\.worker-.+\.js$/.test(name)) ?? '';
  await page.goto(APP_URL);
  await waitForServiceWorker(page);
  // A newer deploy: its worker replaced the old shell cache, and the server has dropped the old chunk.
  await page.evaluate(async () => { for (const name of await caches.keys()) if (name.startsWith('huecut-shell-')) await caches.delete(name); });
  renameSync(join(assets, chunk), join(assets, `${chunk}.gone`));
  try {
    await go(page, '#/my-look/photo');
    await expect(page.getByText(BOOT_FAILED).first()).toBeVisible({ timeout: 60_000 });
  } finally {
    renameSync(join(assets, `${chunk}.gone`), join(assets, chunk));
  }
  // The missing chunk is this test's own doing: the browser reports it, and only it.
  expect(guard.errors.filter((e) => !/analysis\.worker|MIME type|dynamically imported module|interactive-widget/i.test(e))).toEqual([]);
  guard.errors.length = 0;
});

/** The models of the build under test (the fixture content has fewer than the shipped four, all checked in examples.test.ts). */
const MODEL_COUNT = (JSON.parse(readFileSync(join(app, 'tests', 'fixtures', 'content', 'library-models.json'), 'utf8')) as readonly unknown[]).length;

/** Opens every other model from the bar, back to the first, and returns the descriptions seen. */
async function cycleModels(page: Page): Promise<string[]> {
  const which = page.getByText('On a fictional model:', { exact: false });
  const seen = [(await which.textContent()) ?? ''];
  for (let i = 1; i <= MODEL_COUNT; i++) {
    await button(page, 'Try another model').click();
    await expect(which).not.toHaveText(seen[i - 1] ?? '');
    await expect(heading(page)).toHaveText('Your face card');
    await expect(exampleBadge(page)).toBeVisible();
    seen.push((await which.textContent()) ?? '');
  }
  return seen;
}

test('an example starts at the face card with its badge, needs no download, and leaves with Start with my photo', async ({ page }) => {
  for (const { width, height } of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    // A fresh document each time: the real session started at the end of a round must not count against the next one.
    await page.goto('about:blank');
    const requests: string[] = [];
    page.on('request', (r) => { requests.push(r.url()); });
    await page.goto(`${APP_URL}#/my-look/face?source=example`);
    await expect(heading(page)).toHaveText('Your face card');
    await expect(exampleBadge(page)).toBeVisible();
    // Where the probe finds no AVIF decode, the example's picture is not drawn (measured on Playwright WebKit on Windows).
    if ((await capabilities(page)).avif) await expect(page.locator('canvas[role="img"]')).toBeVisible();
    await expect(page.getByRole('region', { name: 'What this photo shows' })).toBeVisible();
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.endsWith('-hair-mask.png')).length)).toBeGreaterThanOrEqual(1);
    await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); }); // On a phone the sticky bar lies over the colour button at this scroll, which axe's target-size counts as obscured; as in mylook-a.spec.ts.
    await axeAndShot(page, 'example-face', width);
    await button(page, 'Try a colour on your photo').click();
    const sheet = page.getByRole('dialog', { name: 'Try a colour on your photo' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
    await button(page, 'Choose what to change').click();
    await expect(heading(page)).toHaveText('Your goal');
    await expect(exampleBadge(page)).toBeVisible();
    await expect(button(page, 'Start with my photo')).toBeVisible();
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    await expect(exampleBadge(page)).toBeInViewport();
    await axeAndShot(page, 'example-goal', width);
    const seen = await cycleModels(page);
    expect(new Set(seen).size).toBe(MODEL_COUNT);
    expect(seen.at(-1)).toBe(seen[0]);
    expect(requests.filter((u) => u.includes('/huecut/models/'))).toEqual([]);
    await button(page, 'Start with my photo').click();
    await expect(heading(page)).toHaveText('Add your photo');
    await expect(exampleBadge(page)).toHaveCount(0);
    await expect(page).toHaveURL(/#\/my-look\/photo$/);
    // Nothing is in that session yet, so "See an example first" still opens an example over it.
    await go(page, '#/my-look/face?source=example');
    await expect(exampleBadge(page)).toBeVisible();
  }
});
