/**
 * Install like an app on the production build under `/huecut/`: what Chromium's own CDP reports, the install offer only after a click, the iPhone
 * words, hidden when installed, an offline launch, and an upgrade that waits for a safe restart. A real install prompt cannot be raised in a test, so the offer runs on
 * a synthetic `beforeinstallprompt`; real iPhones, Android and Safari are not proven here.
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { button, go, heading } from './failure/support.ts';
import { expect, test } from './guard.ts';
import { controlled, goalPage, say, seed } from './save-support.ts';
import { APP_URL, PREVIEW_OUTDIR } from './server.ts';

test.skip(({ browserName }) => browserName !== 'chromium', 'CDP and the install event are Chromium only');

const app = join(import.meta.dirname, '..', '..');
const dist = join(app, PREVIEW_OUTDIR);
const INSTALL = 'Install Huecut';
const IOS = 'Share, then Add to Home Screen';

const workerReady = (page: Page): Promise<unknown> => page.evaluate(async () => { await navigator.serviceWorker.ready; });

test('Chromium finds it installable: CDP reports no errors, and the manifest, icons, launch URL and worker scope are right', async ({ page }) => {
  await page.goto(APP_URL);
  await workerReady(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  const manifest = await cdp.send('Page.getAppManifest');
  console.log(`CDP Page.getInstallabilityErrors: ${JSON.stringify(installabilityErrors)}`);
  console.log(`CDP Page.getAppManifest: url=${manifest.url} errors=${JSON.stringify(manifest.errors)} data=${manifest.data ?? ''}`);
  expect(installabilityErrors).toEqual([]);
  expect(manifest.errors).toEqual([]);
  expect(manifest.url).toBe(`${APP_URL}manifest.webmanifest`);
  const m = JSON.parse(manifest.data ?? '{}') as { name: string; id: string; start_url: string; scope: string; display: string; icons: { src: string; sizes: string; type: string; purpose: string }[] };
  expect({ name: m.name, id: m.id, start: m.start_url, scope: m.scope, display: m.display }).toEqual({ name: 'Huecut', id: './', start: './', scope: './', display: 'standalone' });
  for (const [size, purpose] of [[192, 'any'], [512, 'any'], [192, 'maskable'], [512, 'maskable']] as const) {
    const icon = m.icons.find((i) => i.sizes === `${String(size)}x${String(size)}` && i.purpose === purpose);
    expect(icon?.type, `${purpose} ${String(size)}`).toBe('image/png');
    expect(await sharp(join(dist, icon?.src ?? '')).metadata(), `${purpose} ${String(size)}`).toMatchObject({ format: 'png', width: size, height: size });
  }
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)).toBe(APP_URL);
  expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'), 'the manifest falls under its own origin').toContain("default-src 'self'");
  expect(await page.evaluate(async () => (await fetch('manifest.webmanifest')).status)).toBe(200);
});

/** A browser that offers to install, some time after the page has started; `window.installPrompts` counts the calls of its prompt. */
const offerInstall = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const w = window as unknown as { installPrompts: number; offer: () => boolean };
    w.installPrompts = 0;
    w.offer = () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, { prompt: () => { w.installPrompts++; return Promise.resolve({ outcome: 'accepted' }); } });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    window.addEventListener('load', () => { setTimeout(w.offer, 50); });
  });
const prompts = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { installPrompts: number }).installPrompts);

test('Install Huecut shows on Home and Help only when offered, prompts only on the click, once, and never comes back', async ({ page }) => {
  await offerInstall(page);
  await page.goto(`${APP_URL}#/help`);
  await expect(heading(page)).toHaveText('Help');
  await expect(button(page, INSTALL)).toBeVisible();
  await go(page, '#/');
  await expect(button(page, INSTALL)).toBeAttached();
  expect(await prompts(page), 'not without a click').toBe(0);
  await go(page, '#/help');
  await button(page, INSTALL).click();
  expect(await prompts(page)).toBe(1);
  await expect(button(page, INSTALL)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { offer: () => boolean }).offer()), 'a second event is left alone').toBe(false);
  await page.waitForTimeout(300);
  await expect(button(page, INSTALL), 'no repeat').toHaveCount(0);
  expect(await prompts(page)).toBe(1);
});

test('with no offer from the browser there is no install button, and Help still says what installing does not do', async ({ page }) => {
  await page.goto(`${APP_URL}#/help`);
  await expect(heading(page)).toHaveText('Help');
  await expect(button(page, INSTALL)).toHaveCount(0);
  await expect(page.getByText(IOS)).toHaveCount(0);
  for (const words of ['keeps your data only on this device', 'not a backup', 'less likely', 'can still happen']) await expect(page.getByText(words, { exact: false }), words).toBeVisible();
});

test.describe('iPhone', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('short words instead of a button, on Home and Help; none once running from the Home Screen', async ({ page }) => {
    await page.goto(`${APP_URL}#/help`);
    await expect(heading(page)).toHaveText('Help');
    await expect(page.getByText(IOS)).toBeVisible();
    await go(page, '#/');
    await expect(page.getByText(IOS)).toBeAttached();
    await expect(button(page, INSTALL)).toHaveCount(0);
    await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
    await page.goto('about:blank');
    await page.goto(`${APP_URL}#/help`);
    await expect(heading(page)).toHaveText('Help');
    await expect(page.getByText(IOS)).toHaveCount(0);
  });
});

test('running installed shows no offer, even when the browser makes one', async ({ page }) => {
  await offerInstall(page);
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => (query.includes('display-mode') ? ({ matches: true, media: query, addEventListener: () => undefined, removeEventListener: () => undefined } as unknown as MediaQueryList) : real(query));
  });
  await page.goto(`${APP_URL}#/help`);
  await expect(heading(page)).toHaveText('Help');
  await page.waitForTimeout(300);
  await expect(button(page, INSTALL)).toHaveCount(0);
});

test('offline launch: the installed shell opens with no network, and a saved session comes back', async ({ page, context }) => {
  await page.goto(APP_URL);
  await controlled(page);
  await seed(page, 1, { keep: 'until_deleted', id: 'offline-session' });
  await go(page, '#/my-look/questions');
  await expect(heading(page)).toHaveText('A few questions');
  // Closed first, as an installed app is: a request this page still has open would only report the network going away.
  await page.close();
  await context.setOffline(true);
  const launched = await context.newPage();
  await launched.goto(APP_URL);
  await expect(launched.getByRole('heading', { level: 1 })).toBeVisible();
  await launched.goto(`${APP_URL}#/my-look/questions`);
  await expect(launched.getByRole('heading', { level: 1 })).toHaveText('A few questions');
  await launched.close();
  await context.setOffline(false);
});

/** A new build on the server, as a deploy makes one: a chunk under a new name, the worker with a new id and file list. Returns the undo. */
function deployNewBuild(buildId: string): { readonly oldChunk: string; readonly undo: () => void } {
  const assets = join(dist, 'assets');
  // A chunk the worker keeps: the computer-only tools are left off its list on purpose (`vite.config.ts`).
  const oldChunk = readdirSync(assets).find((name) => name.endsWith('.js') && !/^index-|transformers\.web|viewer3d/.test(name)) ?? '';
  const newChunk = `new-${oldChunk}`;
  const keep = mkdtempSync(join(tmpdir(), 'huecut-upgrade-'));
  const texts = ['sw.js', 'index.html', ...readdirSync(assets).filter((name) => name.endsWith('.js')).map((name) => join('assets', name))].filter((file) => readFileSync(join(dist, file), 'utf8').includes(oldChunk) || file === 'sw.js');
  for (const file of texts) cpSync(join(dist, file), join(keep, file.replaceAll(/[\\/]/g, '_')));
  for (const file of texts) writeFileSync(join(dist, file), readFileSync(join(dist, file), 'utf8').replaceAll(oldChunk, newChunk));
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  writeFileSync(join(dist, 'sw.js'), sw.replaceAll(buildId, 'beefbeefbeef'));
  renameSync(join(assets, oldChunk), join(assets, newChunk));
  const undo = (): void => {
    if (existsSync(join(assets, newChunk))) renameSync(join(assets, newChunk), join(assets, oldChunk));
    for (const file of texts) cpSync(join(keep, file.replaceAll(/[\\/]/g, '_')), join(dist, file));
    rmSync(keep, { recursive: true, force: true });
  };
  return { oldChunk, undo };
}

/** A row of the app's database under a key of its own, which the app never reads: `value` writes it, null reads it back. */
const sentinel = (page: Page, value: string | null): Promise<string | null> =>
  page.evaluate((row) => new Promise((resolve, reject) => {
    const open = indexedDB.open('huecut', 1);
    open.onupgradeneeded = () => void open.result.createObjectStore('session');
    open.onerror = () => { reject(open.error ?? new Error('open failed')); };
    open.onsuccess = () => {
      const store = open.result.transaction('session', 'readwrite').objectStore('session');
      const request = row === null ? store.get('beside-the-update') : store.put(row, 'beside-the-update');
      request.onsuccess = () => { open.result.close(); resolve(row ?? ((request.result as string | undefined) ?? null)); };
    };
  }), value);

/** What the worker registration and the caches say now. */
const workers = (page: Page) =>
  page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return { waiting: r?.waiting?.state ?? null, active: r?.active?.state ?? null, shells: (await caches.keys()).filter((n) => n.startsWith('huecut-shell-')).sort(), all: (await caches.keys()).sort() };
  });

test('an upgrade waits for a safe restart: the old page keeps its chunks and its memory, then the new build takes over and only old shells go', async ({ page, context }) => {
  await page.goto(APP_URL);
  await controlled(page);
  await page.evaluate(async () => { await (await caches.open('huecut-models')).put('/huecut/seed', new Response('kept')); });
  await page.evaluate(() => { localStorage.setItem('huecut:saving', 'off'); });
  await page.reload();
  await goalPage(page, APP_URL);
  await expect(heading(page)).toHaveText('Your goal');
  await say(page, 'Cut');
  await page.evaluate(() => { (window as unknown as { sameDocument: boolean }).sameDocument = true; });
  await sentinel(page, 'still here');
  const before = await workers(page);
  expect(before.shells).toHaveLength(1);
  const deployed = deployNewBuild((before.shells[0] ?? '').replace('huecut-shell-', ''));
  try {
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
    await expect.poll(async () => (await workers(page)).waiting, { timeout: 60_000, message: 'the new build is installed and waits' }).toBe('installed');
    const waiting = await workers(page);
    expect(waiting.shells, 'the old shell is still there').toContain(before.shells[0]);
    expect(waiting.shells).toHaveLength(2);
    expect(await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument), 'no reload').toBe(true);
    await expect(page.getByRole('radio', { name: 'Cut', exact: true }), 'the work in memory').toBeChecked();
    const loaded = await page.evaluate(async (url) => { try { await import(/* @vite-ignore */ url); return true; } catch { return false; } }, `${APP_URL}assets/${deployed.oldChunk}`);
    expect(loaded, 'the old page still gets a chunk the server has dropped').toBe(true);
    await page.close();
    const next = await context.newPage();
    await next.goto(APP_URL);
    await expect.poll(async () => (await workers(next)).waiting, { timeout: 30_000 }).toBeNull();
    await expect.poll(async () => (await workers(next)).shells, { timeout: 30_000 }).toHaveLength(1);
    const after = await workers(next);
    expect(after.shells).not.toContain(before.shells[0]);
    expect(after.all, "Huecut's other caches stay").toContain('huecut-models');
    expect(await sentinel(next, null), 'the database is untouched').toBe('still here');
  } finally {
    deployed.undo();
  }
});
