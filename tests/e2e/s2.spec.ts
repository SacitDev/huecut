/**
 * S2, the runtime check of the extras: depth and tap-to-select through Transformers.js under the production CSP (`vite preview` of
 * the test-only harness build, `harness-build.ts`), on the WASM int8 path (Chromium headless shell) and the WebGPU fp16 path
 * (Edge, `HUECUT_E2E_EDGE=1`), and the early refusal where the probe finds no face tools. Every check asserts content; the `S2` lines are the evidence.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { capabilities, HAS_WORKER_WEBGL, MISSING, requires } from './guard.ts';
import { buildHarness, harnessPage } from './harness-build.ts';
import { HARNESS } from './server.ts';

const BUILD = harnessPage('s2');
const ORIGIN = HARNESS.PREVIEW_ORIGIN;
const CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; require-trusted-types-for 'script'; trusted-types worker-bootstrap";
const CORE = ['face', 'hand', 'pose', 'segmenter'] as const;
const TAP_PHOTO = 'one-face-salon-straight-wavy.jpg';
const DEPTH_PHOTOS = ['one-face-salon-straight-wavy.jpg', 'one-face-salon-curly-coily.jpg', 'one-face-barbering-straight-wavy.jpg', 'one-face-barbering-curly-coily.jpg', 'curly-frontal.jpg', 'beard.jpg', 'two-faces.jpg'];
const ORT_WASM = 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm';
const DTYPE = { webgpu: 'fp16', wasm: 'int8' } as const;
const blonde = { l: 72, a: 3, b: 24 };

interface Point {
  readonly x: number;
  readonly y: number;
  readonly include: boolean;
}
interface Fail {
  readonly ok: false;
  readonly ms: number;
  readonly code: string;
  readonly detail: string;
}
type Call<T> = Fail | ({ readonly ok: true; readonly ms: number } & T);
interface Harness {
  start(): Promise<{ ok: boolean; bootMs: number; detail: string | null; device: { class: string }; mode: string }>;
  load(models: readonly string[]): Promise<Call<{ loaded: string[]; missing: string[]; extras: string | null; progressEvents: number }> & { progressEvents: number }>;
  analyse(name: string, base64: string): Promise<Call<{ faces: number; points: ({ x: number; y: number } | null)[] }>>;
  depth(name: string, base64: string): Promise<Call<{ widthPx: number; heightPx: number; min: number; max: number; mean: number; nonFinite: number }>>;
  tap(id: string, name: string, base64: string, points: readonly Point[]): Promise<Call<{ maskPx: number[]; maskShare: number; tapsHonoured: boolean; segmenter: { precision: number; iou: number } | null; coverage: number; hairlineVisible: boolean; hairlinePoints: number }>>;
  tint(name: string, base64: string, targets: unknown, useLastMask: boolean): Promise<Call<{ size: number[]; mask: string }>>;
  release(id: string): void;
  diagnostics(): Promise<{ blocked: Record<string, number>; served: Record<string, number>; unlisted: Record<string, number>; violations: unknown[] }>;
  caches(): Promise<{ name: string; keys: number }[]>;
}
type S2Window = Window & { s2: Harness; __s2Violations: { directive: string; blockedURI: string }[] };

const fromTests = (...parts: string[]): string => join(test.info().project.testDir, '..', ...parts);
const photo = (name: string): string => readFileSync(fromTests('fixtures', 'faces', name)).toString('base64');
const evidence = (label: string, value: unknown): void => {
  console.log(`S2 ${test.info().project.name} ${label}: ${JSON.stringify(value)}`);
};
const okOf = <T>(r: Call<T>): Exclude<Call<T>, Fail> => {
  if (!r.ok) throw new Error(`${r.code}: ${r.detail}`);
  return r as Exclude<Call<T>, Fail>;
};

/** Calls into `window.s2`. Playwright evaluates these outside the page's CSP; the page itself never evals. */
const harness = (page: Page) => ({
  start: () => page.evaluate(() => (window as unknown as S2Window).s2.start()),
  load: (models: readonly string[]) => page.evaluate((m) => (window as unknown as S2Window).s2.load(m), models),
  analyse: (name: string, base64: string) => page.evaluate((a) => (window as unknown as S2Window).s2.analyse(a.name, a.base64), { name, base64 }),
  depth: (name: string, base64: string) => page.evaluate((a) => (window as unknown as S2Window).s2.depth(a.name, a.base64), { name, base64 }),
  tap: (id: string, name: string, base64: string, points: readonly Point[]) => page.evaluate((a) => (window as unknown as S2Window).s2.tap(a.id, a.name, a.base64, a.points), { id, name, base64, points }),
  tint: (name: string, base64: string, targets: unknown, useLastMask: boolean) => page.evaluate((a) => (window as unknown as S2Window).s2.tint(a.name, a.base64, a.targets, a.useLastMask), { name, base64, targets, useLastMask }),
  release: (id: string) => page.evaluate((i) => {
    (window as unknown as S2Window).s2.release(i);
  }, id),
  diagnostics: () => page.evaluate(() => (window as unknown as S2Window).s2.diagnostics()),
  caches: () => page.evaluate(() => (window as unknown as S2Window).s2.caches()),
  pageViolations: () => page.evaluate(() => (window as unknown as S2Window).__s2Violations),
});

test.beforeAll(async () => {
  test.setTimeout(240_000);
  await buildHarness();
});

/** Opens the harness with page-level violation, request and console capture (page and worker). */
async function open(page: Page) {
  const requests: string[] = [];
  const consoleLines: string[] = [];
  const notOk: string[] = [];
  page.context().on('request', (r) => requests.push(r.url()));
  page.context().on('response', (r) => {
    if (r.status() >= 400) notOk.push(`${String(r.status())} ${r.url()}`);
  });
  page.on('console', (m) => consoleLines.push(`page ${m.type()}: ${m.text()}`));
  page.on('worker', (w) => {
    w.on('console', (m) => consoleLines.push(`worker ${m.type()}: ${m.text()}`));
  });
  await page.addInitScript(() => {
    const w = window as unknown as S2Window;
    w.__s2Violations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__s2Violations.push({ directive: e.effectiveDirective, blockedURI: e.blockedURI });
    });
  });
  await page.goto(BUILD);
  await page.waitForFunction(() => 's2' in window);
  return { h: harness(page), requests, consoleLines, notOk };
}

/** Private bytes (MB) of the largest renderer (the page and its worker) and the GPU process: CDP's process list, sizes from Windows. */
function memoryOf(browser: Browser) {
  return async (stage: string, log: unknown[]): Promise<void> => {
    const cdp = await browser.newBrowserCDPSession();
    const { processInfo } = (await cdp.send('SystemInfo.getProcessInfo')) as { processInfo: { type: string; id: number }[] };
    await cdp.detach();
    const ids = processInfo.map((p) => p.id).join(',');
    const raw = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Get-Process -Id ${ids} -ErrorAction SilentlyContinue | Select-Object Id, PrivateMemorySize64 | ConvertTo-Json -Compress`], { encoding: 'utf8' });
    const sizes = new Map(([JSON.parse(raw)] as unknown[]).flat().map((p) => [(p as { Id: number }).Id, (p as { PrivateMemorySize64: number }).PrivateMemorySize64 / 2 ** 20]));
    const of = (type: string): number[] => processInfo.filter((p) => p.type === type).map((p) => Math.round(sizes.get(p.id) ?? 0));
    const renderer = Math.max(0, ...of('renderer'));
    const gpu = Math.max(0, ...of('GPU'));
    log.push({ stage, rendererMB: renderer, gpuMB: gpu, sumMB: renderer + gpu, renderers: of('renderer') });
  };
}

/** Bar: depth at a short side of 252 px, values 0-1 and finite, on every depth photo; times per photo. */
async function depthBar(h: ReturnType<typeof harness>): Promise<void> {
  for (const name of DEPTH_PHOTOS) {
    const r = okOf(await h.depth(name, photo(name)));
    const long = Math.max(r.widthPx, r.heightPx);
    evidence('depth', { name, ms: r.ms, size: [r.widthPx, r.heightPx], longSideIn308to322: long >= 308 && long <= 322, min: r.min, max: r.max, mean: r.mean, nonFinite: r.nonFinite });
    expect(Math.min(r.widthPx, r.heightPx)).toBe(252);
    expect(long % 14).toBe(0);
    expect([r.min, r.max, r.nonFinite]).toEqual([0, 1, 0]);
  }
}

/** Bar: the first tap runs the encoder, later taps only the decoder; release drops the embedding. */
async function samBar(h: ReturnType<typeof harness>): Promise<void> {
  const base64 = photo(TAP_PHOTO);
  const analysed = okOf(await h.analyse(TAP_PHOTO, base64));
  const [p0, p1] = analysed.points;
  if (!p0 || !p1) throw new Error('the segmenter found no hair to tap on');
  const hair = (p: { x: number; y: number }): Point => ({ ...p, include: true });
  const taps: { label: string; points: Point[] }[] = [
    { label: 'first tap (encoder + decoder)', points: [hair(p0)] },
    { label: 'later tap 2 points', points: [hair(p0), hair(p1)] },
    { label: 'later tap with an exclude', points: [hair(p0), hair(p1), { x: 0.5, y: 0.97, include: false }] },
    { label: 'later tap again', points: [hair(p0)] },
  ];
  for (const tap of taps) {
    const r = okOf(await h.tap('tap-photo', TAP_PHOTO, base64, tap.points));
    evidence('tap', { label: tap.label, ms: r.ms, maskPx: r.maskPx, maskShare: r.maskShare, tapsHonoured: r.tapsHonoured, segmenter: r.segmenter, coverage: r.coverage, hairlineVisible: r.hairlineVisible, hairlinePoints: r.hairlinePoints });
    expect(r.maskShare).toBeGreaterThan(0.01);
    expect(r.maskShare).toBeLessThan(0.9);
    expect(r.tapsHonoured).toBe(true);
  }
  await h.release('tap-photo');
  const again = okOf(await h.tap('tap-photo', TAP_PHOTO, base64, [hair(p0)]));
  evidence('tap after release (encoder again)', { ms: again.ms, maskShare: again.maskShare });
}

/** The colour preview on the refined mask (a copy, as the store hands it over) and on the segmenter's (`auto`). */
async function tintCheck(h: ReturnType<typeof harness>): Promise<void> {
  const targets = { root: { shadows: blonde, mid: blonde, light: blonde }, mids: { shadows: blonde, mid: blonde, light: blonde }, ends: { shadows: blonde, mid: blonde, light: blonde } };
  for (const useLastMask of [true, false]) {
    const r = okOf(await h.tint(TAP_PHOTO, photo(TAP_PHOTO), targets, useLastMask));
    evidence('tint', { mask: r.mask, ms: r.ms, size: r.size });
    expect(r.size).toEqual([1050, 1400]);
  }
}

/** The backend the extras should pick here: WebGPU only with a `shader-f16` adapter (asked for as the worker asks). */
async function expectedBackend(page: Page, browser: Browser): Promise<'webgpu' | 'wasm'> {
  const adapter = await page.evaluate(async () => {
    const gpu = (navigator as { gpu?: { requestAdapter(o: object): Promise<{ features: Set<string>; info?: { vendor: string; architecture: string } } | null> } }).gpu;
    const a = gpu ? await gpu.requestAdapter({ powerPreference: 'high-performance' }) : null;
    return { navigatorGpu: gpu !== undefined, adapter: a ? { shaderF16: a.features.has('shader-f16'), vendor: a.info?.vendor ?? null, architecture: a.info?.architecture ?? null } : null };
  });
  const expected = adapter.adapter?.shaderF16 ? 'webgpu' : 'wasm';
  evidence('browser', { version: browser.version(), webgpu: adapter, expectedExtras: expected });
  return expected;
}

/** Served by logical path, nothing unlisted, no violations, no other origin, and only the registry's cache. */
async function fenceChecks(opened: Awaited<ReturnType<typeof open>>, backend: 'webgpu' | 'wasm'): Promise<void> {
  const { h } = opened;
  const dtype = DTYPE[backend];
  const wanted = [
    ORT_WASM,
    ...['config.json', 'preprocessor_config.json', `onnx/model_${dtype}.onnx`].map((f) => `depth-anything-v2-small/${f}`),
    ...['config.json', 'preprocessor_config.json', ...['vision_encoder', 'prompt_encoder_mask_decoder'].flatMap((n) => [`onnx/${n}_${dtype}.onnx`, `onnx/${n}_${dtype}.onnx_data`])].map((f) => `sam2.1-hiera-tiny/${f}`),
  ];
  const diagnostics = await h.diagnostics();
  const pageViolations = await h.pageViolations();
  const caches = await h.caches();
  const foreign = opened.requests.filter((u) => /^https?:/.test(u) && new URL(u).origin !== ORIGIN);
  const modelRequests = opened.requests.filter((u) => u.includes('/huecut/models/'));
  const byLogicalPath = modelRequests.filter((u) => !/\/huecut\/models\/[0-9a-f]{64}\.[\w]+$/.test(u));
  evidence('served by logical path (from the registry)', diagnostics.served);
  evidence('unlisted', diagnostics.unlisted);
  evidence('blocked', diagnostics.blocked);
  evidence('violations', { page: pageViolations, worker: diagnostics.violations });
  evidence('caches', caches);
  evidence('requests', { total: opened.requests.length, foreign, modelFiles: modelRequests.length, byLogicalPath, mjs: opened.requests.filter((u) => u.endsWith('.mjs')), notOk: opened.notOk });
  // MediaPipe's own info lines are left out; everything else the page and the worker logged is shown.
  evidence('console (MediaPipe info lines left out)', opened.consoleLines.filter((l) => !/gl_context|Graph successfully|XNNPACK|inference_feedback_manager|landmark_projection_calculator|face_landmarker_graph/.test(l)));
  for (const path of wanted) expect(diagnostics.served[path], path).toBeGreaterThanOrEqual(1);
  expect(diagnostics.unlisted).toEqual({});
  expect(pageViolations).toEqual([]);
  expect(diagnostics.violations).toEqual([]);
  expect(foreign).toEqual([]);
  expect(byLogicalPath).toEqual([]);
  expect(opened.notOk).toEqual([]);
  expect(caches.map((c) => c.name)).toEqual(['huecut-models']);
}

test('S2 (build, CSP): depth and tap-to-select through Transformers.js, self-hosted, verified, nothing cached outside the registry', async ({ page, browser }) => {
  await requires(page, 'workerWebGL');
  test.setTimeout(600_000);
  const project = test.info().project.name;
  const memory: unknown[] = [];
  // The memory reading is evidence only: process ids over CDP, private bytes from Windows. Without either it is left out and every
  // model, registry and fence check still runs.
  const { cdp } = await capabilities(page);
  const windows = process.platform === 'win32';
  const measure = cdp && windows ? memoryOf(browser) : () => Promise.resolve();
  if (!cdp) evidence('memory', MISSING.cdp);
  else if (!windows) evidence('memory', 'not read: private bytes are read through Windows PowerShell');
  const opened = await open(page);
  const { h } = opened;
  expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toBe(CSP);
  const expected = await expectedBackend(page, browser);
  if (project === 'msedge') expect(expected).toBe('webgpu');
  if (project === 'chromium') expect(expected).toBe('wasm');
  await measure('page open', memory);

  const boot = await h.start();
  evidence('boot', boot);
  expect(boot.ok).toBe(true);
  const core = okOf(await h.load([...CORE]));
  evidence('load core', { ms: core.ms, loaded: core.loaded, missing: core.missing });
  await measure('core loaded', memory);

  const depth = okOf(await h.load(['depth']));
  evidence('load depth', { ms: depth.ms, extras: depth.extras, progressEvents: depth.progressEvents });
  expect(depth.extras).toBe(expected);
  await measure('depth loaded', memory);
  await depthBar(h);
  await measure('after 7 depth maps', memory);

  const sam = okOf(await h.load(['sam']));
  evidence('load sam', { ms: sam.ms, extras: sam.extras, progressEvents: sam.progressEvents });
  expect(sam.extras).toBe(expected);
  await measure('sam loaded', memory);
  await samBar(h);
  await measure('after taps', memory);
  await tintCheck(h);
  await measure('after tint', memory);
  evidence('memory (private bytes, MB)', memory);
  await fenceChecks(opened, expected);
});

test('S2 WebKit (build, CSP): load says unsupported before any model is fetched when the worker has no OffscreenCanvas with WebGL', async ({ page }) => {
  const can = await capabilities(page);
  test.skip(can.workerWebGL, HAS_WORKER_WEBGL);
  // The reason names the browser's own gap: no OffscreenCanvas at all (WebKit on Windows), or one without WebGL (WebKit on Linux).
  const missing = can.workerOffscreen ? 'WebGL on an OffscreenCanvas' : 'OffscreenCanvas';
  const opened = await open(page);
  const offscreen = await page.evaluate(() => typeof OffscreenCanvas);
  const boot = await opened.h.start();
  const results = [];
  for (const models of [['depth'], ['sam'], [...CORE]]) {
    const r = await opened.h.load(models);
    results.push({ models, ok: r.ok, code: r.ok ? null : r.code, detail: r.ok ? null : r.detail, progressEvents: r.progressEvents });
  }
  const diagnostics = await opened.h.diagnostics();
  const modelRequests = opened.requests.filter((u) => u.includes('/huecut/models/'));
  evidence('webkit', { offscreenInPage: offscreen, boot: { ok: boot.ok, bootMs: boot.bootMs }, results, served: diagnostics.served, modelRequests, violations: diagnostics.violations });
  expect(boot.ok).toBe(true);
  for (const r of results) expect(r).toMatchObject({ ok: false, code: 'unsupported', detail: `no ${missing} in this worker`, progressEvents: 0 });
  expect(modelRequests).toEqual([]);
  expect(diagnostics.served).toEqual({});
});
