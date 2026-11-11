/**
 * S1, the runtime check of the analysis worker: its bars, measured on the `s1` harness page under the production CSP (`vite
 * preview` of the test-only harness build, `harness-build.ts`) and once in dev. Every bar asserts content; the `S1` lines are the evidence.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import { requires } from './guard.ts';
import { buildHarness, harnessPage } from './harness-build.ts';
import { DEV_ORIGIN, HARNESS, PREVIEW_OUTDIR } from './server.ts';

const BUILD = harnessPage('s1');
const DEV = `${DEV_ORIGIN}/huecut/tests/harness/s1.html`;
const ORIGINS = new Set([HARNESS.PREVIEW_ORIGIN, DEV_ORIGIN]);
const METRICS_HOST = 'odml.pa.googleapis.com';
const LIBRARY_FACES = ['one-face-salon-straight-wavy.jpg', 'one-face-salon-curly-coily.jpg', 'one-face-barbering-straight-wavy.jpg', 'one-face-barbering-curly-coily.jpg'];
const OTHER_FIXTURES = ['turned-head.jpg', 'close-up.jpg', 'hand-over-face.jpg', 'glasses.jpg', 'beard.jpg', 'fringe-hidden-hairline.jpg', 'far-1-5m.jpg', 'older-grey.jpg', 'head-covering.jpg', 'curly-frontal.jpg', 'blurred.jpg'];
const CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; require-trusted-types-for 'script'; trusted-types worker-bootstrap";

interface Summary {
  readonly name: string;
  readonly ok: boolean;
  readonly code: string | null;
  readonly ms: number;
  readonly faces: number;
  readonly hands: number;
  readonly pose: boolean;
  readonly ran: readonly string[];
  readonly hairCoverage: number | null;
  readonly hairlineVisible: boolean | null;
}
interface Diagnostics {
  readonly blocked: Record<string, number>;
  readonly violations: readonly { directive: string; blockedURI: string }[];
  readonly webgl: { created: number; lost: number };
}
interface Photo {
  readonly name: string;
  readonly base64: string;
}
interface Harness {
  start(options: { analyseLimitMs?: number }): Promise<{ ok: boolean; bootMs: number; detail: string | null; device: { class: string } }>;
  load(): Promise<{ ok: boolean; ms: number; loaded: readonly string[]; missing: readonly string[]; detail: string | null; progressEvents: number }>;
  analyse(name: string, base64: string): Promise<Summary>;
  analyseTogether(photos: readonly Photo[]): Promise<Summary[]>;
  diagnostics(): Promise<Diagnostics>;
  restarts(): readonly string[];
  missingChunk(): Promise<{ code: string; ms: number }>;
}
type S1Window = Window & { s1: Harness; __s1Violations: { directive: string; blockedURI: string }[] };

// Paths from the project's testDir, not import.meta: Playwright loads this spec as CommonJS while package.json starts with a BOM.
const fromTests = (...parts: string[]): string => join(test.info().project.testDir, '..', ...parts);
const fixture = (name: string): Photo => ({ name, base64: readFileSync(fromTests('fixtures', 'faces', name)).toString('base64') });
const evidence = (label: string, value: unknown): void => {
  console.log(`S1 ${label}: ${JSON.stringify(value)}`);
};

/** Calls into `window.s1`. Playwright evaluates these outside the page's CSP; the page itself never evals. */
const harness = (page: Page) => ({
  start: (options: { analyseLimitMs?: number } = {}) => page.evaluate((o) => (window as unknown as S1Window).s1.start(o), options),
  load: () => page.evaluate(() => (window as unknown as S1Window).s1.load()),
  analyse: (photo: Photo) => page.evaluate((p) => (window as unknown as S1Window).s1.analyse(p.name, p.base64), photo),
  together: (photos: Photo[]) => page.evaluate((ps) => (window as unknown as S1Window).s1.analyseTogether(ps), photos),
  diagnostics: () => page.evaluate(() => (window as unknown as S1Window).s1.diagnostics()),
  restarts: () => page.evaluate(() => (window as unknown as S1Window).s1.restarts()),
  missingChunk: () => page.evaluate(() => (window as unknown as S1Window).s1.missingChunk()),
  pageViolations: () => page.evaluate(() => (window as unknown as S1Window).__s1Violations),
});

/** Opens the harness with page-level violation, request and console capture (page and worker). */
async function open(page: Page, url: string) {
  const requests: string[] = [];
  const consoleLines: string[] = [];
  const workersClosed: string[] = [];
  page.context().on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => consoleLines.push(`page ${m.type()}: ${m.text()}`));
  page.on('worker', (w) => {
    w.on('console', (m) => consoleLines.push(`worker ${m.type()}: ${m.text()}`));
    w.on('close', () => workersClosed.push(w.url()));
  });
  await page.addInitScript(() => {
    const w = window as unknown as S1Window;
    w.__s1Violations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__s1Violations.push({ directive: e.effectiveDirective, blockedURI: e.blockedURI });
    });
  });
  await page.goto(url);
  await page.waitForFunction(() => 's1' in window);
  return { h: harness(page), requests, consoleLines, workersClosed };
}

type Opened = Awaited<ReturnType<typeof open>>;

test.beforeAll(async () => {
  test.setTimeout(240_000);
  await buildHarness();
});

/** Bar 1: all four tasks created in the worker with wasmLoaderPath ''. */
async function bar1(h: Opened['h'], browser: string): Promise<void> {
  const boot = await h.start();
  evidence(`${browser} boot`, boot);
  expect(boot.ok).toBe(true);
  const load = await h.load();
  evidence(`${browser} bar1 load`, load);
  expect(load.ok).toBe(true);
  expect([...load.loaded].sort()).toEqual(['face', 'hand', 'pose', 'segmenter']);
  expect(load.missing).toEqual([]);
  const after = await h.diagnostics();
  evidence(`${browser} webgl after load`, after.webgl);
  expect(after.webgl.created).toBeGreaterThanOrEqual(4);
}

/** Real models: one face on each library photo, none on no-face, two on two-faces; the other fixtures for information. */
async function realModels(h: Opened['h'], browser: string): Promise<void> {
  for (const name of LIBRARY_FACES) {
    const r = await h.analyse(fixture(name));
    evidence(`${browser} one face`, r);
    expect(r.ok && r.faces).toBe(1);
    expect(r.ran).toEqual(['face', 'hand', 'pose', 'segmenter']);
  }
  const none = await h.analyse(fixture('no-face.jpg'));
  evidence(`${browser} no face`, none);
  expect(none.ok && none.faces).toBe(0);
  const two = await h.analyse(fixture('two-faces.jpg'));
  evidence(`${browser} two faces`, two);
  expect(two.ok && two.faces).toBe(2);
  for (const name of OTHER_FIXTURES) {
    const r = await h.analyse(fixture(name));
    evidence(`${browser} fixture (information only)`, r);
    expect(r.ok).toBe(true);
  }
}

/** Bar 2: five rounds; in each, the first photo finds the face task idle and the second finds it busy. */
async function bar2(opened: Opened, browser: string): Promise<void> {
  for (let round = 0; round < 5; round++) {
    const pair = [fixture(LIBRARY_FACES[round % 4] ?? ''), fixture(LIBRARY_FACES[(round + 1) % 4] ?? '')];
    const results = await opened.h.together(pair);
    evidence(`${browser} bar2 round ${String(round + 1)}`, results.map((r) => ({ name: r.name, faces: r.faces, ms: r.ms })));
    for (const r of results) expect(r.ok && r.faces).toBe(1);
  }
  const after = await opened.h.diagnostics();
  const glWarnings = opened.consoleLines.filter((l) => /context lost|too many active webgl|CONTEXT_LOST/i.test(l));
  evidence(`${browser} bar2 webgl`, { ...after.webgl, consoleWarnings: glWarnings });
  expect(after.webgl.lost).toBe(0);
  expect(glWarnings).toEqual([]);
}

/** Bar 3: wait for MediaPipe's first 60-second metrics call; the allowlist must have blocked it, and nothing left. */
async function bar3(opened: Opened, page: Page, browser: string, loadedAt: number): Promise<void> {
  let diagnostics = await opened.h.diagnostics();
  while (!diagnostics.blocked[METRICS_HOST] && Date.now() - loadedAt < 95_000) {
    await page.waitForTimeout(2_000);
    diagnostics = await opened.h.diagnostics();
  }
  const pageViolations = await opened.h.pageViolations();
  const foreign = opened.requests.filter((u) => /^https?:/.test(u) && !ORIGINS.has(new URL(u).origin));
  evidence(`${browser} bar3`, { secondsAfterLoad: Math.round((Date.now() - loadedAt) / 1000), blocked: diagnostics.blocked, workerViolations: diagnostics.violations, pageViolations, requests: opened.requests.length, foreign });
  evidence(`${browser} request origins`, [...new Set(opened.requests.map((u) => (/^https?:/.test(u) ? new URL(u).origin : u.split(':')[0])))]);
  evidence(`${browser} console`, opened.consoleLines.slice(0, 40));
  expect(diagnostics.blocked[METRICS_HOST]).toBeGreaterThanOrEqual(1);
  expect(foreign).toEqual([]);
  expect(pageViolations).toEqual([]);
  expect(diagnostics.violations).toEqual([]);
}

test('S1 bars 1-3 (build, CSP): four tasks, five add-photo rounds without lost contexts, nothing leaves the origin', async ({ page, browserName }) => {
  await requires(page, 'workerWebGL');
  const opened = await open(page, BUILD);
  expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toBe(CSP);
  await bar1(opened.h, browserName);
  const loadedAt = Date.now();
  await realModels(opened.h, browserName);
  await bar2(opened, browserName);
  await bar3(opened, page, browserName, loadedAt);
});

test('S1 bar 5 (build, CSP): a missing worker chunk gives boot_failed within 1 s', async ({ page, browserName }) => {
  const { h } = await open(page, BUILD);
  const r = await h.missingChunk();
  evidence(`${browserName} bar5 missing chunk`, r);
  expect(r.code).toBe('boot_failed');
  expect(r.ms).toBeLessThan(1_000);
});

test('S1 bar 6 (build, CSP): a forced hang is ended by the watchdog and the worker restarts', async ({ page, browserName }) => {
  await requires(page, 'workerWebGL');
  const { h, workersClosed } = await open(page, BUILD);
  // The analyse watchdog is forced to 50 ms, so a real analysis (hundreds of ms of WASM) outlives it.
  expect((await h.start({ analyseLimitMs: 50 })).ok).toBe(true);
  expect((await h.load()).ok).toBe(true);
  const hung = await h.analyse(fixture(LIBRARY_FACES[0] ?? ''));
  const restarts = await h.restarts();
  // The restarted worker answers: it loads the four tasks again from the registry cache.
  const reload = await h.load();
  const diagnostics = await h.diagnostics();
  evidence(`${browserName} bar6`, { hung: { code: hung.code, ms: hung.ms }, restarts, workersClosed: workersClosed.length, reload, webgl: diagnostics.webgl });
  expect(hung.code).toBe('timeout');
  expect(restarts).toEqual(['timeout']);
  expect(workersClosed.length).toBeGreaterThanOrEqual(1);
  expect(reload.ok).toBe(true);
  expect([...reload.loaded].sort()).toEqual(['face', 'hand', 'pose', 'segmenter']);
});

/** Gzip size (zlib level 6) of the JS a built page loads first: its module script and modulepreload links. */
function firstLoadJs(outDir: string, entry: string): { files: Record<string, number>; totalGzip: number } | null {
  const dist = fromTests('..', outDir);
  let html: string;
  try {
    html = readFileSync(join(dist, entry), 'utf8');
  } catch {
    return null;
  }
  const urls = [...html.matchAll(/<(?:script[^>]*\bsrc|link[^>]*rel="modulepreload"[^>]*\bhref)="\/huecut\/([^"]+\.js)"/g)].map((m) => m[1] ?? '');
  const files = Object.fromEntries(urls.map((u) => [u, gzipSync(readFileSync(join(dist, u))).byteLength]));
  return { files, totalGzip: Object.values(files).reduce((a, b) => a + b, 0) };
}

test('S1 bar 4 (build): first-load JS of the built entry is at most 200 KB gzip', ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'measured once, from the built files');
  const report = { 'index.html': firstLoadJs(PREVIEW_OUTDIR, 'index.html'), 's1.html': firstLoadJs(HARNESS.PREVIEW_OUTDIR, 'tests/harness/s1.html') };
  evidence('bar4 first-load JS (gzip bytes, zlib level 6; null = page not built)', report);
  expect(report['s1.html']?.totalGzip ?? Infinity).toBeLessThanOrEqual(200 * 1024);
  expect(report['s1.html']?.totalGzip).toBeGreaterThan(0);
  if (report['index.html']) expect(report['index.html'].totalGzip).toBeLessThanOrEqual(200 * 1024);
});

test('S1 bar 5 (dev, no CSP): the worker boots in dev and analyses a photo', async ({ page, browserName }) => {
  await requires(page, 'workerWebGL');
  const { h } = await open(page, DEV);
  const boot = await h.start();
  const load = await h.load();
  const r = await h.analyse(fixture(LIBRARY_FACES[0] ?? ''));
  evidence(`${browserName} bar5 dev`, { boot, load: { ok: load.ok, ms: load.ms, loaded: load.loaded, detail: load.detail }, faces: r.faces });
  expect(boot.ok).toBe(true);
  expect(load.ok).toBe(true);
  expect(r.faces).toBe(1);
});
