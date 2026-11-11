/**
 * The S1 harness: drives the real bootstrap, client, lane and supervisor from
 * `window.s1`, so `tests/e2e/s1.spec.ts` can measure the bars under the production CSP. A test page (`s1.html`), never shipped.
 */
import { asPhotoId } from '../../src/domain/ids.ts';
import { browserWorkerStarter, startAnalysisWorker } from '../../src/platform/analysis/bootstrap.ts';
import { createAnalysisClient } from '../../src/platform/analysis/client.ts';
import { limitsFor, type Limits } from '../../src/platform/analysis/limits.ts';
import { superviseWorker, type Supervisor } from '../../src/platform/analysis/supervisor.ts';
import { readDevice, type DeviceInfo } from '../../src/platform/device.ts';
import type { PhotoObservation } from '../../src/domain/measure/observation.ts';
import type { Result } from '../../src/domain/result.ts';
import type { AnalysisError, CoreModel, Diagnostics } from '../../src/worker/protocol.ts';

const CORE: readonly CoreModel[] = ['face', 'hand', 'pose', 'segmenter'];
const log = (line: string): void => {
  const el = document.getElementById('log');
  if (el) el.textContent += `${line}\n`;
};

/** One analysed photo, reduced to what the bars check. */
export interface PhotoSummary {
  readonly name: string;
  readonly ok: boolean;
  readonly code: string | null;
  readonly ms: number;
  readonly faces: number;
  readonly hands: number;
  readonly pose: boolean;
  readonly ran: readonly string[];
  readonly imagePx: readonly [number, number] | null;
  readonly hairCoverage: number | null;
  readonly hairlineVisible: boolean | null;
  readonly hairlinePoints: number;
}

let device: DeviceInfo | null = null;
let supervisor: Supervisor | null = null;
const restarts: string[] = [];
let photoCount = 0;

const bytesOf = (base64: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

function summarise(name: string, ms: number, r: Result<PhotoObservation, AnalysisError>): PhotoSummary {
  if (!r.ok) return { name, ok: false, code: r.error.code, ms, faces: 0, hands: 0, pose: false, ran: [], imagePx: null, hairCoverage: null, hairlineVisible: null, hairlinePoints: 0 };
  const o = r.value;
  return {
    name,
    ok: true,
    code: null,
    ms,
    faces: o.faces.length,
    hands: o.hands.length,
    pose: o.pose !== null,
    ran: o.ran,
    imagePx: [o.image.widthPx, o.image.heightPx],
    hairCoverage: o.hair ? Math.round(o.hair.coverage * 1000) / 1000 : null,
    hairlineVisible: o.hair ? o.hair.hairlineVisible : null,
    hairlinePoints: o.hair ? o.hair.hairline.length / 2 : 0,
  };
}

async function analyseOne(name: string, base64: string): Promise<PhotoSummary> {
  if (!supervisor) throw new Error('start() first');
  const t0 = performance.now();
  const r = await supervisor.analyse({ id: asPhotoId(`s1-${String(++photoCount)}`), blob: new Blob([bytesOf(base64)], { type: 'image/jpeg' }) });
  const summary = summarise(name, Math.round(performance.now() - t0), r);
  log(`${name}: ${JSON.stringify(summary)}`);
  return summary;
}

const s1 = {
  /** Starts a supervised worker; `analyseLimitMs` forces the watchdog for bar 6. */
  async start(options: { analyseLimitMs?: number } = {}): Promise<{ ok: boolean; bootMs: number; detail: string | null; device: DeviceInfo }> {
    device ??= readDevice();
    const base = limitsFor(device.class);
    const limits: Limits = options.analyseLimitMs ? { ...base, computeMs: { ...base.computeMs, analyse: options.analyseLimitMs } } : base;
    const t0 = performance.now();
    supervisor = superviseWorker({
      limits,
      start: browserWorkerStarter(limits),
      onRestarted: (reason) => {
        restarts.push(reason);
        log(`WORKER.RESTARTED ${reason}`);
      },
      onExtraRun: () => undefined,
    });
    const ready = await supervisor.ready;
    const bootMs = Math.round(performance.now() - t0);
    log(`boot: ${ready.ok ? 'ready' : ready.error.code} in ${String(bootMs)} ms`);
    return { ok: ready.ok, bootMs, detail: ready.ok ? null : ready.error.detail, device };
  },
  /** Loads the four core tasks (bar 1). */
  async load(): Promise<{ ok: boolean; ms: number; loaded: readonly string[]; missing: readonly string[]; detail: string | null; progressEvents: number }> {
    if (!supervisor) throw new Error('start() first');
    let progressEvents = 0;
    const t0 = performance.now();
    const r = await supervisor.load(CORE, () => {
      progressEvents++;
    });
    const ms = Math.round(performance.now() - t0);
    log(`load: ${r.ok ? `loaded ${r.value.loaded.join(', ')}` : r.error.code} in ${String(ms)} ms`);
    return r.ok
      ? { ok: true, ms, loaded: r.value.loaded, missing: r.value.missing, detail: null, progressEvents }
      : { ok: false, ms, loaded: [], missing: [], detail: `${r.error.code}: ${r.error.detail}`, progressEvents };
  },
  analyse: analyseOne,
  /** Adds all photos at once: the first finds the face task idle, the others find it busy (bar 2). */
  analyseTogether: (photos: readonly { name: string; base64: string }[]): Promise<PhotoSummary[]> => Promise.all(photos.map((p) => analyseOne(p.name, p.base64))),
  diagnostics: (): Promise<Diagnostics> => {
    if (!supervisor) throw new Error('start() first');
    return supervisor.diagnostics();
  },
  restarts: (): readonly string[] => [...restarts],
  /** Starts a worker whose chunk does not exist and times the `boot_failed` (bar 5). */
  async missingChunk(): Promise<{ code: string; ms: number }> {
    const t0 = performance.now();
    const worker = startAnalysisWorker(new URL('assets/s1-missing-chunk.js', document.baseURI).href);
    const client = createAnalysisClient({ endpoint: worker, limits: limitsFor('computer'), onCrash: () => undefined });
    const r = await client.ready;
    const ms = Math.round(performance.now() - t0);
    worker.terminate();
    log(`missing chunk: ${r.ok ? 'ready (unexpected)' : r.error.code} in ${String(ms)} ms`);
    return { code: r.ok ? 'ready' : r.error.code, ms };
  },
};

(window as unknown as { s1: typeof s1 }).s1 = s1;
log('s1 harness ready');
