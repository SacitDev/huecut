/**
 * What a first visit costs, on the build: the scripts Home and Explore really request and the library index against
 * their budgets, the first picture found early, the service worker keeping out of the first paint's way and never costing a picture, and a
 * build that holds the product only.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { go } from './failure/support.ts';
import { expect, test } from './guard.ts';
import { APP_URL, PREVIEW_OUTDIR } from './server.ts';

const dist = join(import.meta.dirname, '..', '..', PREVIEW_OUTDIR);
const JS_BUDGET_BYTES = 200 * 1024;
const INDEX_BUDGET_BYTES = 100 * 1024;
/** More than the entry and its modulepreload links, which is all a reading of the HTML would count. */
const FEWEST_SCRIPTS = 6;
const gzipBytes = (url: string): number => gzipSync(readFileSync(join(dist, new URL(url).pathname.replace('/huecut/', '')))).byteLength;
const firstPictures = '[class*="_heroFigure_"] img';

test('the build carries the app\'s licence and every third-party licence as text, out of the offline shell, linked from Credits', async ({ page }) => {
  expect(readFileSync(join(dist, 'sw.js'), 'utf8')).not.toContain('licences/');
  await page.goto(`${APP_URL}#/help/credits`);
  for (const [name, start] of [['tools, fonts and models', '# Third-party licences'], ['Huecut (MIT)', 'MIT License']] as const) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    const response = await page.request.get(new URL((await link.getAttribute('href')) ?? '', page.url()).href);
    expect(response.status(), name).toBe(200);
    expect((await response.text()).startsWith(start), name).toBe(true);
  }
});

test('the build holds no spike, harness or dev page, nor any of their files', () => {
  const files = readdirSync(dist, { recursive: true, encoding: 'utf8' });
  expect(files, `${PREVIEW_OUTDIR} is a build`).toContain('index.html');
  expect(files.filter((file) => /spike-|harness|painter-check/i.test(file))).toEqual([]);
});

test.describe('The budgets', () => {
  test.use({ serviceWorkers: 'block' });

  for (const [screen, hash] of [['Home', ''], ['Explore', '#/explore']] as const) {
    test(`${screen}: the scripts it really requests fit the first-load budget, and the library index fits its own`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Measured once, on one browser');
      const scripts = new Set<string>();
      const indexes = new Set<string>();
      page.on('request', (r) => {
        if (r.resourceType() === 'script') scripts.add(r.url());
        if (/library-index[^/]*\.json$/.test(r.url())) indexes.add(r.url());
      });
      await page.goto(`${APP_URL}${hash}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      const total = [...scripts].reduce((sum, url) => sum + gzipBytes(url), 0);
      console.log(`${screen}: ${String(scripts.size)} scripts, ${String(total)} bytes gzip of ${String(JS_BUDGET_BYTES)}`);
      expect(scripts.size).toBeGreaterThanOrEqual(FEWEST_SCRIPTS);
      expect(total).toBeLessThanOrEqual(JS_BUDGET_BYTES);
      if (screen === 'Explore') {
        expect(indexes.size, 'Explore fetches the library index').toBe(1);
        const index = gzipBytes([...indexes][0] ?? '');
        console.log(`library index: ${String(index)} bytes gzip of ${String(INDEX_BUDGET_BYTES)}`);
        expect(index).toBeLessThanOrEqual(INDEX_BUDGET_BYTES);
      }
    });
  }
});

test.describe('The first picture', () => {
  test.use({ serviceWorkers: 'block', viewport: { width: 412, height: 915 } });

  test('is preloaded exactly as Home asks for it, fetched once, and each shot has its colour behind it', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Measured once, on one browser');
    const fetched: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/french-bob-front-')) fetched.push(r.url()); });
    await page.goto(APP_URL);
    const preload = page.locator('head link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    const first = page.locator(firstPictures).first();
    await expect(first).toBeVisible();
    await expect(preload).toHaveAttribute('imagesrcset', (await first.getAttribute('srcset')) ?? 'no srcset');
    await expect(preload).toHaveAttribute('imagesizes', (await first.getAttribute('sizes')) ?? 'no sizes');
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
    await page.waitForLoadState('networkidle');
    expect(fetched, 'the preload and the picture share one download').toHaveLength(1);
    const behind = await page.locator(firstPictures).evaluateAll((shots) => shots.map((s) => getComputedStyle(s).backgroundColor));
    expect(behind).toEqual(['rgb(161, 147, 140)', 'rgb(160, 142, 134)', 'rgb(173, 161, 157)', 'rgb(178, 167, 163)']);
  });
});

test.describe('The service worker', () => {
  test('registers only after the load event and leaves the computer-only tools off its list', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Measured once, on one browser');
    await page.addInitScript(() => {
      const scope = window as unknown as { readyAtRegister: string };
      const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
      navigator.serviceWorker.register = (...args: Parameters<typeof register>) => {
        scope.readyAtRegister = document.readyState;
        return register(...args);
      };
    });
    await page.goto(APP_URL);
    await expect.poll(() => page.evaluate(() => (window as unknown as { readyAtRegister?: string }).readyAtRegister)).toBe('complete');
    const chunks = readdirSync(join(dist, 'assets')).filter((name) => /^(?:transformers\.web|viewer3d)-.*\.js$/.test(name));
    expect(chunks, 'both chunks exist in the build').toHaveLength(2);
    const worker = readFileSync(join(dist, 'sw.js'), 'utf8');
    for (const chunk of chunks) expect(worker, `${chunk} is not precached`).not.toContain(chunk);
    expect(worker, 'the rest of the shell is').toMatch(/assets\/index-[\w-]+\.js/);
  });

  test('a cache write the browser refuses never blanks a picture the network delivered', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium lets a test reach inside the service worker');
    await page.goto(APP_URL);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    // A first visit stays uncontrolled until the next load: the worker never claims a page.
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    const worker = context.serviceWorkers()[0];
    if (!worker) throw new Error('no service worker is running');
    await worker.evaluate(() => {
      const scope = self as unknown as { refused: number };
      scope.refused = 0;
      Cache.prototype.put = () => {
        scope.refused += 1;
        return Promise.reject(new DOMException('planted', 'QuotaExceededError'));
      };
    });
    await go(page, '#/explore');
    const pictures = page.locator('a[aria-labelledby] img');
    await expect.poll(() => pictures.count()).toBeGreaterThan(7);
    await expect.poll(() => pictures.evaluateAll((all) => all.slice(0, 8).filter((p) => (p as HTMLImageElement).complete && (p as HTMLImageElement).naturalWidth > 0).length), { timeout: 30_000 }).toBe(8);
    expect(await worker.evaluate(() => (self as unknown as { refused: number }).refused), 'the plant refused real writes').toBeGreaterThan(0);
  });
});
