/**
 * The shared e2e guard: an auto fixture that fails every test on a console error, an uncaught
 * exception or a request that leaves the preview's origin. Only lines that are not the app's are accepted, exactly:
 * MediaPipe's XNNPACK start-up notice, WebKit's notice that it does not know the viewport key `interactive-widget` (Chromium uses it to keep the bottom bar
 * above the on-screen keyboard), and one CSP refusal per WebKit screenshot, because Playwright's screenshot injects a
 * stylesheet (call `noteScreenshot()` after each screenshot). Also the capability probe every platform skip keys on, CDP included.
 */
import { expect, test as base, type Page } from '@playwright/test';
import sharp from 'sharp';
import { originOfSpec, PREVIEW_ORIGIN } from './server.ts';

/** MediaPipe's own start-up notice, which it writes as a console error: the one accepted exactly. */
const MEDIAPIPE_XNNPACK = 'INFO: Created TensorFlow Lite XNNPACK delegate for CPU.';
const WEBKIT_VIEWPORT_KEY = 'Viewport argument key "interactive-widget" not recognized and ignored.';
const WEBKIT_SCREENSHOT_STYLE =
  "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.";

let screenshots = 0;

/** What the guard saw in one test. */
export interface Guard {
  readonly errors: string[];
  readonly foreign: string[];
}

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page, browserName }, use, testInfo) => {
      const guard: Guard = { errors: [], foreign: [] };
      const origin = originOfSpec(testInfo.file);
      page.on('console', (m) => {
        if (m.type() === 'error') guard.errors.push(m.text());
      });
      page.on('pageerror', (e) => guard.errors.push(String(e)));
      page.on('request', (r) => {
        const url = r.url();
        if (/^https?:/.test(url) && new URL(url).origin !== origin) guard.foreign.push(url);
      });
      screenshots = 0;
      await use(guard);
      let refusals = screenshots;
      const errors = guard.errors.filter((e) => {
        if (e === MEDIAPIPE_XNNPACK) return false;
        if (browserName === 'webkit' && e === WEBKIT_VIEWPORT_KEY) return false;
        if (e !== WEBKIT_SCREENSHOT_STYLE || refusals === 0) return true;
        refusals -= 1;
        return false;
      });
      expect(errors, 'console errors').toEqual([]);
      expect(guard.foreign, 'requests off the site').toEqual([]);
    },
    { auto: true },
  ],
});

/** Counts one screenshot taken in WebKit, whose injected stylesheet the CSP refuses with one console line. */
export function noteScreenshot(): void {
  if (test.info().project.name === 'webkit') screenshots += 1;
}

/** What the browser can do that the app's tools need, as probed: a skip names the probe, never the browser. */
export interface Capabilities {
  /** An OffscreenCanvas in a worker at all: without it the worker refuses every model before any download (`service.ts`). */
  readonly workerOffscreen: boolean;
  /** An OffscreenCanvas with a WebGL context in a worker: MediaPipe needs it, so the face tools and extras run. */
  readonly workerWebGL: boolean;
  /** An AVIF image decodes: the library pictures, and the sheets painted from them. */
  readonly avif: boolean;
  /** IndexedDB stores a Blob: a session is saved with its photo. */
  readonly idbBlob: boolean;
  /** A Chrome DevTools Protocol session: the network, CPU, storage and crash emulation some tests inject, and the memory reading of `s2.spec.ts`. */
  readonly cdp: boolean;
}

/** The skip message for each missing capability. */
export const MISSING: Readonly<Record<keyof Capabilities, string>> = {
  workerOffscreen: 'Capability probe: no OffscreenCanvas in a worker, so the face tools cannot run in this browser',
  workerWebGL: 'Capability probe: no OffscreenCanvas with WebGL in a worker, so the face tools cannot run in this browser',
  avif: 'Capability probe: this browser decodes no AVIF image',
  idbBlob: 'Capability probe: this browser refuses to store a Blob in IndexedDB',
  cdp: 'Capability probe: this browser offers no Chrome DevTools Protocol session, which this test injects its fault or measures with',
};
/** The skip message of a test of the early refusal, where the probe finds OffscreenCanvas in a worker, so the worker does not refuse before loading. */
export const HAS_WORKER_WEBGL = 'Capability probe: this browser has OffscreenCanvas with WebGL in a worker, so its worker does not refuse the models up front; this test is that refusal';

/** The page's probes, in a page with no app code and no CSP: a worker's OffscreenCanvas and its WebGL context, a small AVIF, a Blob put. */
const probeInPage = async (avifUrl: string): Promise<Omit<Capabilities, 'cdp'>> => {
  const source = "const has = typeof OffscreenCanvas === 'function'; postMessage([has, has && (new OffscreenCanvas(1, 1).getContext('webgl2') ?? new OffscreenCanvas(1, 1).getContext('webgl')) !== null])";
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  const [workerOffscreen, workerWebGL] = await new Promise<readonly [boolean, boolean]>((resolve) => {
    worker.onmessage = (e: MessageEvent<readonly [boolean, boolean]>) => { resolve(e.data); };
    worker.onerror = () => { resolve([false, false]); };
  });
  worker.terminate();
  const image = new Image();
  image.src = avifUrl;
  const avif = await image.decode().then(() => image.naturalWidth > 0, () => false);
  const idbBlob = await new Promise<boolean>((resolve) => {
    const open = indexedDB.open('capability-probe');
    open.onupgradeneeded = () => open.result.createObjectStore('blobs');
    open.onerror = () => { resolve(false); };
    open.onsuccess = () => {
      try {
        const tx = open.result.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put(new Blob(['probe']), 'probe');
        tx.oncomplete = () => { resolve(true); };
        tx.onabort = () => { resolve(false); };
      } catch {
        resolve(false);
      }
    };
  });
  return { workerOffscreen, workerWebGL, avif, idbBlob };
};

const probed = new Map<string, Promise<Capabilities>>();

/** Probes this browser once per worker, in a context of its own on a same-origin blank page served by a route, and logs the result. */
export function capabilities(page: Page): Promise<Capabilities> {
  const browser = page.context().browser();
  if (!browser) throw new Error('capabilities: the page has no browser');
  const key = `${browser.browserType().name()} ${browser.version()}`;
  const known = probed.get(key);
  if (known) return known;
  const result = (async () => {
    const context = await browser.newContext();
    try {
      const url = `${PREVIEW_ORIGIN}/capability-probe`;
      await context.route(url, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Capability probe</title>' }));
      const blank = await context.newPage();
      await blank.goto(url);
      const avif = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#a07060' } }).avif().toBuffer();
      const cdp = await context.newCDPSession(blank).then(async (session) => { await session.detach(); return true; }, () => false);
      const found = { ...(await blank.evaluate(probeInPage, `data:image/avif;base64,${avif.toString('base64')}`)), cdp };
      console.log(`capabilities of ${key}: ${JSON.stringify(found)}`);
      return found;
    } finally {
      await context.close();
    }
  })();
  probed.set(key, result);
  return result;
}

/**
 * Every animation has played but a wait's endless line, which ends only with its wait: axe and screenshots then see the
 * final colours, not a blend mid-transition (a contrast read on a blend is a measuring error, not the page's contrast).
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
}

/** Skips the running test where the probe finds any of `needs` missing, naming each one in the skip message. */
export async function requires(page: Page, ...needs: readonly (keyof Capabilities)[]): Promise<void> {
  const found = await capabilities(page);
  const missing = needs.filter((need) => !found[need]);
  test.skip(missing.length > 0, missing.map((need) => MISSING[need]).join('; '));
}

export { expect };
