/**
 * The client over the real Comlink seam: a MessageChannel with the real service and fake browser parts on
 * the far side. Covers the handshake, progress, transfer, cancel of one download only,
 * the stall timer and late replies.
 */
import { expose } from 'comlink';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { asPhotoId } from '../../domain/ids.ts';
import type { FaceObservation } from '../../domain/measure/observation.ts';
import { ok, type Result } from '../../domain/result.ts';
import type { StageOutput } from '../../worker/models/mediapipe.ts';
import type { AnalysisError, CoreModel, LoadProgress, ModelId } from '../../worker/protocol.ts';
import { createAnalysisService, type ServiceDeps } from '../../worker/service.ts';
import { createAnalysisClient } from './client.ts';

/** The error code of a result, or 'ok'. */
const codeOf = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);

/** Node's macrotask yield, which fake timers leave alone (the app's program has no Node types). */
declare const setImmediate: (run: () => void) => void;

const LIMITS = { bootMs: 20_000, stallMs: 30_000 };
const W = 40;
const H = 40;

/** One macrotask: lets MessagePort traffic flow while timers are fake. */
const turn = (): Promise<void> =>
  new Promise((resolve) => {
    const c = new MessageChannel();
    c.port1.onmessage = () => {
      c.port1.close();
      resolve();
    };
    c.port2.postMessage(null);
  });
const turns = async (n = 30): Promise<void> => {
  for (let i = 0; i < n; i++) await turn();
};
const advance = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
  await turns();
};

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
}
const deferred = (): Deferred => {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

const face: FaceObservation = { landmarks: new Float32Array(478 * 3).fill(0.5), matrix: new Float32Array(16).fill(1), expression: { mouthSmileLeft: 0.1 } };

/** Fake browser parts: loads wait on a gate per model and record their signals; stages answer fixed data. */
function fakeDeps() {
  const gates = new Map<ModelId, Deferred>();
  const signals = new Map<ModelId, AbortSignal>();
  const stageGate: { current: Deferred | null } = { current: null };
  const loadModel = vi.fn((model: ModelId, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>> => {
    signals.set(model, signal);
    onProgress({ model, phase: 'download', loadedBytes: 1, totalBytes: 10 });
    const gate = gates.get(model);
    if (!gate) return Promise.resolve(ok(undefined));
    return new Promise((resolve) => {
      signal.addEventListener('abort', () => {
        resolve({ ok: false, error: { code: 'aborted', model, retryable: true, detail: 'aborted in the fake' } });
      });
      void gate.promise.then(() => {
        resolve(ok(undefined));
      });
    });
  });
  const outputs: StageOutput = {
    face: [face],
    hand: [],
    pose: null,
    segmenter: { widthPx: W, heightPx: H, data: new Uint8Array(W * H).fill(1) },
  };
  const deps: ServiceDeps = {
    decode: () => Promise.resolve(ok({ widthPx: W, heightPx: H, data: new Uint8ClampedArray(W * H * 4).fill(120) })),
    readFocal35: () => Promise.resolve(26),
    loadModel,
    runStage: async <S extends CoreModel>(stage: S): Promise<StageOutput[S]> => {
      if (stageGate.current) await stageGate.current.promise;
      return outputs[stage];
    },
    extras: {
      depth: () => Promise.reject(new Error('no depth in this test')),
      selectHair: () => Promise.reject(new Error('no tap-to-select in this test')),
      release: () => undefined,
      backend: () => null,
    },
    toBitmap: () => Promise.reject(new Error('no bitmaps in this test')),
    missingFeature: null,
    diagnostics: () => ({ blocked: { 'odml.pa.googleapis.com': 2 }, served: {}, unlisted: {}, violations: [], webgl: { created: 4, lost: 0 } }),
  };
  return { deps, gates, signals, stageGate, loadModel };
}

/** A client on port1 and the real service on port2, which posts `ready` as the worker does. */
function connect(deps: ServiceDeps, sendReady = true) {
  const { port1, port2 } = new MessageChannel();
  expose(createAnalysisService(deps), port2);
  port1.start();
  port2.start();
  const onCrash = vi.fn();
  const client = createAnalysisClient({ endpoint: port1, limits: LIMITS, onCrash });
  if (sendReady) port2.postMessage({ type: 'ready' });
  return { client, port1, port2, onCrash };
}

const photo = { id: asPhotoId('p1'), blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }) };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
});
afterEach(() => {
  vi.useRealTimers();
});

it('waits for ready, then loads with progress and analyses with typed arrays intact', async () => {
  const f = fakeDeps();
  // Progress comes on the callback's own port and the answer on the main one, so they may arrive in either order, and the client
  // drops progress for a load already answered. Each load waits on its gate, so its progress arrives while it is still running.
  const faceGate = deferred();
  const segmenterGate = deferred();
  f.gates.set('face', faceGate);
  f.gates.set('segmenter', segmenterGate);
  const { client, port1, port2 } = connect(f.deps);
  expect(await client.ready).toEqual(ok(undefined));
  const progress: LoadProgress[] = [];
  const loading = client.load(['face', 'segmenter'], (p) => progress.push(p));
  await vi.waitFor(() => { expect(progress.map((p) => p.model)).toEqual(['face']); });
  faceGate.resolve();
  await vi.waitFor(() => { expect(progress.map((p) => p.model)).toEqual(['face', 'segmenter']); });
  segmenterGate.resolve();
  const loaded = await loading;
  expect(loaded.ok && loaded.value.loaded).toEqual(['face', 'segmenter']);
  const r = await client.analyse(photo);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value.ran).toEqual(['face', 'segmenter']);
  expect(r.value.faces[0]?.landmarks).toBeInstanceOf(Float32Array);
  expect(r.value.faces[0]?.landmarks.length).toBe(478 * 3);
  expect(r.value.focal35mm).toBe(26);
  expect(r.value.hair?.coverage).toBe(1);
  expect(r.value.previewMask?.widthPx).toBe(256);
  expect(await client.diagnostics()).toEqual({ blocked: { 'odml.pa.googleapis.com': 2 }, served: {}, unlisted: {}, violations: [], webgl: { created: 4, lost: 0 } });
  port1.close();
  port2.close();
});

it('reports boot_failed from the bootstrap message, and after the 20 s boot timeout', async () => {
  const f = fakeDeps();
  const failed = connect(f.deps, false);
  failed.port2.postMessage({ type: 'boot_failed' });
  await turns();
  const r = await failed.client.ready;
  expect(codeOf(r)).toBe('boot_failed');
  const silent = connect(f.deps, false);
  let settled = false;
  void silent.client.ready.then(() => {
    settled = true;
  });
  await advance(19_999);
  expect(settled).toBe(false);
  await advance(1);
  const late = await silent.client.ready;
  expect(codeOf(late)).toBe('boot_failed');
  const call = await silent.client.analyse(photo);
  expect(codeOf(call)).toBe('boot_failed');
  for (const p of [failed.port1, failed.port2, silent.port1, silent.port2]) p.close();
});

it('cancel aborts only that download', async () => {
  const f = fakeDeps();
  f.gates.set('face', deferred());
  const handGate = deferred();
  f.gates.set('hand', handGate);
  const { client, port1, port2 } = connect(f.deps);
  await client.ready;
  const stopFace = new AbortController();
  const faceLoad = client.load(['face'], () => undefined, stopFace.signal);
  const handLoad = client.load(['hand'], () => undefined);
  await turns();
  expect(client.downloads).toBe(2);
  stopFace.abort();
  const rFace = await faceLoad;
  expect(codeOf(rFace)).toBe('aborted');
  await turns();
  expect(f.signals.get('face')?.aborted).toBe(true);
  expect(f.signals.get('hand')?.aborted).toBe(false);
  handGate.resolve();
  const rHand = await handLoad;
  expect(rHand.ok && rHand.value.loaded).toEqual(['hand']);
  expect(client.downloads).toBe(0);
  port1.close();
  port2.close();
});

it('aborts a download after 30 s without progress, never a slow one that keeps moving', async () => {
  const f = fakeDeps();
  f.gates.set('face', deferred());
  const { client, port1, port2 } = connect(f.deps);
  await client.ready;
  let stalled: Result<unknown, AnalysisError> | null = null;
  void client.load(['face'], () => undefined).then((r) => {
    stalled = r;
  });
  await turns();
  await advance(29_000);
  expect(stalled).toBeNull();
  await advance(1_500);
  expect(stalled).toEqual({ ok: false, error: expect.objectContaining({ code: 'network' }) as unknown });
  expect(f.signals.get('face')?.aborted).toBe(true);

  // A slow download: progress every 20 s for 100 s, then done.
  const slowGate = deferred();
  f.gates.set('hand', slowGate);
  f.loadModel.mockImplementationOnce((model, signal, onProgress) => {
    f.signals.set(model, signal);
    for (let s = 20; s <= 100; s += 20) {
      setTimeout(() => {
        onProgress({ model, phase: 'download', loadedBytes: s, totalBytes: 100 });
      }, s * 1000);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(ok(undefined));
      }, 100_500);
    });
  });
  let slow: Result<unknown, AnalysisError> | null = null;
  void client.load(['hand'], () => undefined).then((r) => {
    slow = r;
  });
  await turns();
  for (let t = 0; t < 101; t += 10) await advance(10_000);
  expect(slow).toEqual(ok(expect.objectContaining({ loaded: ['hand'] }) as unknown));
  port1.close();
  port2.close();
});

it('tells the worker to stop an aborted compute call and settles it with its reply', async () => {
  const f = fakeDeps();
  const { client, port1, port2 } = connect(f.deps);
  await client.ready;
  await client.load(['face'], () => undefined);
  const gate = deferred();
  f.stageGate.current = gate;
  const stop = new AbortController();
  let settled = false;
  const cancelled = client.analyse(photo, stop.signal);
  void cancelled.then(() => (settled = true));
  await turns();
  stop.abort();
  await turns();
  expect(settled).toBe(false); // the worker is still on it, so the lane must keep its slot
  gate.resolve();
  expect(codeOf(await cancelled)).toBe('aborted'); // it stopped at the next stage boundary
  port1.close();
  port2.close();
});

it('answers an aborted compute call at once when it was never sent', async () => {
  const f = fakeDeps();
  const { client, port1, port2 } = connect(f.deps, false);
  const stop = new AbortController();
  const waiting = client.analyse(photo, stop.signal);
  stop.abort();
  expect(codeOf(await waiting)).toBe('aborted');
  port2.postMessage({ type: 'ready' });
  await turns();
  expect(f.loadModel).not.toHaveBeenCalled();
  port1.close();
  port2.close();
});

it('discards a late reply to a disposed client', async () => {
  const f = fakeDeps();
  const { client, port1, port2 } = connect(f.deps);
  await client.ready;
  await client.load(['face'], () => undefined);
  const gate2 = deferred();
  f.stageGate.current = gate2;
  const inFlight = client.analyse(photo);
  await turns();
  client.dispose('crashed', 'test');
  const r2 = await inFlight;
  expect(codeOf(r2)).toBe('crashed');
  gate2.resolve();
  await turns();
  expect(await inFlight).toBe(r2);
  const after = await client.analyse(photo);
  expect(codeOf(after)).toBe('crashed');
  port1.close();
  port2.close();
});

it('closes a bitmap that arrives after the client was disposed', async () => {
  const f = fakeDeps();
  const gate = deferred();
  // A MessagePort stands in for the ImageBitmap: Node has none, and a port is also transferred and has close().
  const deps = { ...f.deps, toBitmap: () => gate.promise.then(() => new MessageChannel().port1 as unknown as ImageBitmap) };
  const { client, port1, port2 } = connect(deps);
  await client.ready;
  const lab = { l: 50, a: 0, b: 0 };
  const targets = { root: { shadows: lab, mid: lab, light: lab }, mids: null, ends: null };
  const mask = { widthPx: W, heightPx: H, data: new Uint8Array(W * H).fill(255) };
  const running = client.tint(photo, { kind: 'targets', targets }, mask);
  await turns();
  client.dispose('crashed', 'test');
  expect(codeOf(await running)).toBe('crashed');
  const close = vi.spyOn(MessagePort.prototype, 'close');
  gate.resolve();
  for (let i = 0; i < 20; i++) await new Promise<void>((resolve) => { setImmediate(resolve); }); // not `turns()`: it closes ports of its own
  expect(close).toHaveBeenCalledOnce();
  port1.close();
  port2.close();
});

it('transfers the mask copy it is given rather than cloning it', async () => {
  const f = fakeDeps();
  const deps = { ...f.deps, toBitmap: () => Promise.resolve(new MessageChannel().port1 as unknown as ImageBitmap) };
  const { client, port1, port2 } = connect(deps);
  await client.ready;
  const lab = { l: 50, a: 0, b: 0 };
  const targets = { root: { shadows: lab, mid: lab, light: lab }, mids: null, ends: null };
  const mask = { widthPx: W, heightPx: H, data: new Uint8Array(W * H).fill(255) };
  const r = await client.tint(photo, { kind: 'targets', targets }, mask);
  expect(codeOf(r)).toBe('ok');
  expect(mask.data.byteLength).toBe(0);
  port1.close();
  port2.close();
});

it('stops its boot timer when disposed', () => {
  const { port1, port2 } = new MessageChannel();
  const client = createAnalysisClient({ endpoint: port1, limits: LIMITS, onCrash: () => undefined });
  expect(vi.getTimerCount()).toBe(1);
  client.dispose('aborted', 'test');
  expect(vi.getTimerCount()).toBe(0);
  port1.close();
  port2.close();
});

it('reports an error event after ready as a crash, and one before ready as boot_failed', async () => {
  const f = fakeDeps();
  const early = connect(f.deps, false);
  early.port1.dispatchEvent(new Event('error'));
  const r = await early.client.ready;
  expect(codeOf(r)).toBe('boot_failed');
  expect(early.onCrash).not.toHaveBeenCalled();
  const late = connect(f.deps);
  await late.client.ready;
  late.port1.dispatchEvent(new Event('error'));
  expect(late.onCrash).toHaveBeenCalledTimes(1);
  for (const p of [early.port1, early.port2, late.port1, late.port2]) p.close();
});
