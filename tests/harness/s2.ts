/**
 * The S2 harness: drives depth, tap-to-select and the colour preview through the real
 * bootstrap, client, lane and supervisor from `window.s2`, so `tests/e2e/s2.spec.ts` can measure the bars
 * under the production CSP. A test page (`s2.html`), never shipped.
 */
import { asPhotoId } from '../../src/domain/ids.ts';
import type { Result } from '../../src/domain/result.ts';
import { browserWorkerStarter } from '../../src/platform/analysis/bootstrap.ts';
import { limitsFor } from '../../src/platform/analysis/limits.ts';
import { superviseWorker, type Supervisor } from '../../src/platform/analysis/supervisor.ts';
import { readDevice, type DeviceInfo } from '../../src/platform/device.ts';
import type { AnalysisError, Diagnostics, Mask, ModelId, TapPoint, TintTargets } from '../../src/worker/protocol.ts';

const log = (line: string): void => {
  const el = document.getElementById('log');
  if (el) el.textContent += `${line}\n`;
};

let device: DeviceInfo | null = null;
let supervisor: Supervisor | null = null;
const restarts: string[] = [];
/** The last refined mask, so `tint` can use a mask copy as the app's store would hand it over. */
let lastMask: Mask | null = null;

const bytesOf = (base64: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
const photoOf = (id: string, base64: string) => ({ id: asPhotoId(id), blob: new Blob([bytesOf(base64)], { type: 'image/jpeg' }) });
const running = (): Supervisor => {
  if (!supervisor) throw new Error('start() first');
  return supervisor;
};
const failed = (r: { ok: false; error: AnalysisError }, ms: number) => ({ ok: false as const, ms, code: r.error.code, detail: r.error.detail });

/** Times one call. */
async function timed<T>(call: () => Promise<Result<T, AnalysisError>>): Promise<{ ms: number; r: Result<T, AnalysisError> }> {
  const t0 = performance.now();
  const r = await call();
  return { ms: Math.round(performance.now() - t0), r };
}

/** Min, max, mean and non-finite count of a depth map. */
function depthStats(data: Float32Array): { min: number; max: number; mean: number; nonFinite: number } {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let nonFinite = 0;
  for (const v of data) {
    if (!Number.isFinite(v)) {
      nonFinite++;
      continue;
    }
    min = Math.min(min, v);
    max = Math.max(max, v);
    sum += v;
  }
  return { min, max, mean: Math.round((sum / Math.max(1, data.length - nonFinite)) * 1000) / 1000, nonFinite };
}

const share = (mask: Mask): number => Math.round((mask.data.reduce((n, v) => n + (v > 0 ? 1 : 0), 0) / mask.data.length) * 1000) / 1000;

/** The middle of the longest hair run in the row `depth` of the way down the segmenter's hair: a tap a person would make. */
function hairPoint(preview: Mask, depth: number): { x: number; y: number } | null {
  const { widthPx: w, heightPx: h, data } = preview;
  const rows = [...Array(h).keys()].filter((y) => data.subarray(y * w, (y + 1) * w).some((v) => v > 0));
  const top = rows[0];
  const bottom = rows.at(-1);
  if (top === undefined || bottom === undefined) return null;
  const y = Math.round(top + depth * (bottom - top));
  let best = { start: 0, length: 0 };
  for (let x = 0, start = -1; x <= w; x++) {
    const hair = x < w && (data[y * w + x] ?? 0) > 0;
    if (hair && start < 0) start = x;
    if (!hair && start >= 0) {
      if (x - start > best.length) best = { start, length: x - start };
      start = -1;
    }
  }
  return best.length > 0 ? { x: (best.start + best.length / 2) / w, y: (y + 0.5) / h } : null;
}

/** Share of the refined mask that the segmenter also calls hair, and their intersection over union (information). */
function agreement(refined: Mask, preview: Mask): { precision: number; iou: number } {
  let both = 0;
  let either = 0;
  let refinedCount = 0;
  for (let y = 0; y < preview.heightPx; y++) {
    for (let x = 0; x < preview.widthPx; x++) {
      const rx = Math.floor(((x + 0.5) * refined.widthPx) / preview.widthPx);
      const ry = Math.floor(((y + 0.5) * refined.heightPx) / preview.heightPx);
      const a = (refined.data[ry * refined.widthPx + rx] ?? 0) > 0;
      const b = (preview.data[y * preview.widthPx + x] ?? 0) > 0;
      if (a) refinedCount++;
      if (a && b) both++;
      if (a || b) either++;
    }
  }
  const round = (v: number): number => Math.round(v * 1000) / 1000;
  return { precision: round(both / Math.max(1, refinedCount)), iou: round(both / Math.max(1, either)) };
}

/** The segmenter's preview mask of each analysed photo, by name, for tap points and agreement. */
const previews = new Map<string, Mask>();

const s2 = {
  /** Starts a supervised worker for this device class. */
  async start(): Promise<{ ok: boolean; bootMs: number; detail: string | null; device: DeviceInfo }> {
    device ??= readDevice();
    const limits = limitsFor(device.class);
    const t0 = performance.now();
    supervisor = superviseWorker({ limits, start: browserWorkerStarter(limits), onRestarted: (reason) => restarts.push(reason), onExtraRun: () => undefined });
    const ready = await supervisor.ready;
    const bootMs = Math.round(performance.now() - t0);
    log(`boot: ${ready.ok ? 'ready' : ready.error.code} in ${String(bootMs)} ms`);
    return { ok: ready.ok, bootMs, detail: ready.ok ? null : ready.error.detail, device };
  },
  /** Loads models with progress; reports what loaded and the backend the extras run on. */
  async load(models: readonly ModelId[]) {
    let progressEvents = 0;
    let last: unknown = null;
    const { ms, r } = await timed(() =>
      running().load(models, (p) => {
        progressEvents++;
        last = p;
      }),
    );
    log(`load ${models.join(', ')}: ${r.ok ? `extras ${String(r.value.extras)}` : r.error.code} in ${String(ms)} ms`);
    if (!r.ok) return { ...failed(r, ms), progressEvents, last };
    return { ok: true as const, ms, loaded: r.value.loaded, missing: r.value.missing, extras: r.value.extras, progressEvents, last };
  },
  /** Core analysis of one photo; returns two hair points from the segmenter's preview mask for the taps. */
  async analyse(name: string, base64: string) {
    const { ms, r } = await timed(() => running().analyse(photoOf(`s2-analyse-${name}`, base64)));
    if (!r.ok) return failed(r, ms);
    const preview = r.value.previewMask;
    if (preview) previews.set(name, preview);
    const points = preview ? [hairPoint(preview, 0.15), hairPoint(preview, 0.35)] : [];
    return { ok: true as const, ms, faces: r.value.faces.length, ran: r.value.ran, coverage: r.value.hair?.coverage ?? null, points };
  },
  /** One depth map, reduced to its size and value range. */
  async depth(name: string, base64: string) {
    const { ms, r } = await timed(() => running().depth(photoOf(`s2-depth-${name}`, base64)));
    log(`depth ${name}: ${r.ok ? `${String(r.value.widthPx)} x ${String(r.value.heightPx)}` : r.error.code} in ${String(ms)} ms`);
    return r.ok ? { ok: true as const, ms, widthPx: r.value.widthPx, heightPx: r.value.heightPx, ...depthStats(r.value.data) } : failed(r, ms);
  },
  /** One tap-to-select call on photo `id` (the same id keeps the embedding); `name` picks the analysed photo to compare with. */
  async tap(id: string, name: string, base64: string, points: readonly TapPoint[]) {
    const { ms, r } = await timed(() => running().selectHair(photoOf(id, base64), points));
    log(`tap ${id} (${String(points.length)} points): ${r.ok ? `hair ${String(share(r.value.mask))}` : r.error.code} in ${String(ms)} ms`);
    if (!r.ok) return failed(r, ms);
    const { mask, measures: m } = r.value;
    lastMask = mask;
    const at = (p: TapPoint): number => mask.data[Math.min(mask.heightPx - 1, Math.floor(p.y * mask.heightPx)) * mask.widthPx + Math.min(mask.widthPx - 1, Math.floor(p.x * mask.widthPx))] ?? 0;
    const preview = previews.get(name);
    return {
      ok: true as const,
      ms,
      maskPx: [mask.widthPx, mask.heightPx],
      maskShare: share(mask),
      tapsHonoured: points.every((p) => (at(p) > 0) === p.include),
      segmenter: preview ? agreement(mask, preview) : null,
      coverage: m.coverage,
      hairlineVisible: m.hairlineVisible,
      hairlinePoints: m.hairline.length / 2,
      hairColour: m.colour.hair,
    };
  },
  /** The colour preview with the look's Lab targets, on the last refined mask or the segmenter's (`auto`). */
  async tint(name: string, base64: string, targets: TintTargets, useLastMask: boolean) {
    const mask = useLastMask && lastMask ? { ...lastMask, data: lastMask.data.slice() } : 'auto';
    const { ms, r } = await timed(() => running().tint(photoOf(`s2-tint-${name}`, base64), { kind: 'targets', targets }, mask));
    if (!r.ok) return failed(r, ms);
    const size = [r.value.width, r.value.height];
    r.value.close();
    return { ok: true as const, ms, size, mask: mask === 'auto' ? 'auto' : 'copy' };
  },
  release: (id: string): void => {
    running().release(asPhotoId(id));
  },
  diagnostics: (): Promise<Diagnostics> => running().diagnostics(),
  restarts: (): readonly string[] => [...restarts],
  /** Every Cache Storage name of this origin and its key count (the bar: nothing outside the registry's cache). */
  async caches(): Promise<{ name: string; keys: number }[]> {
    const names = await caches.keys();
    return Promise.all(names.map(async (name) => ({ name, keys: (await (await caches.open(name)).keys()).length })));
  },
};

(window as unknown as { s2: typeof s2 }).s2 = s2;
log('s2 harness ready');
