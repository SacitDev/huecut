/**
 * The supervisor with fake workers: restart on a forced hang (watchdog) and on a crash, and RESET.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { asPhotoId } from '../../domain/ids.ts';
import type { PhotoObservation } from '../../domain/measure/observation.ts';
import { err, ok, type Result } from '../../domain/result.ts';
import type { AnalysisError, AnalysisErrorCode, ExtraModel, HairSelection, ModelId, RuntimeInfo } from '../../worker/protocol.ts';
import type { AnalysisClient } from './client.ts';
import { limitsFor } from './limits.ts';
import { superviseWorker, type StartedWorker } from './supervisor.ts';

const observation = (): PhotoObservation => ({ schemaVersion: 1, image: { widthPx: 10, heightPx: 10 }, focal35mm: null, faces: [], hands: [], pose: null, hair: null, previewMask: null, ran: ['face'] });
const photo = { id: asPhotoId('p'), blob: new Blob([]) };

interface Gate<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}
const gate = <T>(): Gate<T> => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

/** A fake worker: calls wait on gates the test opens; `dispose` settles what is pending like the real client. */
class FakeWorker implements StartedWorker {
  readonly terminate = vi.fn();
  readonly loads: (readonly ModelId[])[] = [];
  readonly analyses: Gate<Result<PhotoObservation, AnalysisError>>[] = [];
  readonly taps: Gate<Result<HairSelection, AnalysisError>>[] = [];
  disposedWith: AnalysisErrorCode | null = null;
  private readonly pending = new Set<(r: Result<never, AnalysisError>) => void>();
  readonly onCrash: () => void;
  constructor(onCrash: () => void) {
    this.onCrash = onCrash;
  }

  private track<T>(p: Promise<Result<T, AnalysisError>>): Promise<Result<T, AnalysisError>> {
    return new Promise((resolve) => {
      this.pending.add(resolve);
      void p.then(resolve);
    });
  }

  readonly client = {
    ready: Promise.resolve(ok(undefined)),
    load: vi.fn<AnalysisClient['load']>((models) => {
      this.loads.push(models);
      const info: RuntimeInfo = { mediapipe: 'cpu', extras: models.some((m) => m === 'depth' || m === 'sam') ? 'wasm' : null, loaded: models, missing: [] };
      return this.track(Promise.resolve(ok(info)));
    }),
    analyse: () => {
      const g = gate<Result<PhotoObservation, AnalysisError>>();
      this.analyses.push(g);
      return this.track(g.promise);
    },
    depth: () => this.track(Promise.resolve(ok({ widthPx: 1, heightPx: 1, data: new Float32Array(1) }))),
    selectHair: () => {
      const g = gate<Result<HairSelection, AnalysisError>>();
      this.taps.push(g);
      return this.track(g.promise);
    },
    tint: () => this.track(Promise.resolve(err<AnalysisError>({ code: 'unsupported', retryable: false, detail: 'fake' }))),
    release: () => undefined,
    diagnostics: () => Promise.resolve({ blocked: {}, served: {}, unlisted: {}, violations: [], webgl: { created: 0, lost: 0 } }),
    downloads: 0,
    dispose: (code, detail) => {
      this.disposedWith = code;
      for (const settle of this.pending) settle(err({ code, retryable: true, detail }));
      this.pending.clear();
    },
  } satisfies AnalysisClient;
}

function setup() {
  const workers: FakeWorker[] = [];
  const restarted = vi.fn();
  const marks: (ExtraModel | null)[] = [];
  const supervisor = superviseWorker({
    limits: limitsFor('computer'),
    start: (onCrash) => {
      const w = new FakeWorker(onCrash);
      workers.push(w);
      return w;
    },
    onRestarted: restarted,
    onExtraRun: (model) => marks.push(model),
  });
  const latest = (): FakeWorker => {
    const w = workers[workers.length - 1];
    if (!w) throw new Error('no worker');
    return w;
  };
  return { supervisor, workers, restarted, latest, marks };
}

const code = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it('ends a forced hang with the watchdog, fails what is pending and restarts', async () => {
  const { supervisor, workers, restarted } = setup();
  await supervisor.load(['face'], () => undefined);
  const hung = supervisor.analyse(photo);
  const queued = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(limitsFor('computer').computeMs.analyse);
  expect(code(await hung)).toBe('timeout');
  expect(code(await queued)).toBe('timeout');
  expect(workers[0]?.terminate).toHaveBeenCalledTimes(1);
  expect(workers).toHaveLength(2);
  expect(restarted).toHaveBeenCalledWith('timeout');
  // The new worker answers; the hung worker's late reply changes nothing.
  workers[0]?.analyses[0]?.resolve(ok(observation()));
  const next = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  workers[1]?.analyses[0]?.resolve(ok(observation()));
  expect(code(await next)).toBe('ok');
  expect(code(await hung)).toBe('timeout');
});

it('restarts after a crash and fails the pending calls with crashed', async () => {
  const { supervisor, workers, restarted } = setup();
  const pending = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  workers[0]?.onCrash();
  expect(code(await pending)).toBe('crashed');
  expect(workers[0]?.terminate).toHaveBeenCalledTimes(1);
  expect(restarted).toHaveBeenCalledWith('crashed');
  expect(workers).toHaveLength(2);
  // A crash report from the replaced worker is ignored.
  workers[0]?.onCrash();
  expect(restarted).toHaveBeenCalledTimes(1);
});

it('restarts on a returned out_of_memory as on a crash, and the calls keep that code', async () => {
  const { supervisor, workers, restarted } = setup();
  const pending = supervisor.analyse(photo);
  const queued = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  workers[0]?.analyses[0]?.resolve(err({ code: 'out_of_memory', retryable: true, detail: 'Aborted(OOM)' }));
  expect(code(await pending)).toBe('out_of_memory');
  expect(code(await queued)).toBe('out_of_memory');
  expect(workers[0]?.terminate).toHaveBeenCalledTimes(1);
  expect(workers).toHaveLength(2);
  expect(restarted.mock.calls).toEqual([['out_of_memory']]);
});

it('restarts when an extra runs out of memory while loading, but leaves a core load to its Try again', async () => {
  const { supervisor, workers, restarted } = setup();
  const noMemory = err<AnalysisError>({ code: 'out_of_memory', retryable: true, detail: 'allocation failed' });
  workers[0]?.client.load.mockResolvedValueOnce(noMemory);
  expect(code(await supervisor.load(['face'], () => undefined))).toBe('out_of_memory');
  expect(workers).toHaveLength(1); // the core region reloads itself after a restart: restarting here would never end
  workers[0]?.client.load.mockResolvedValueOnce(noMemory);
  expect(code(await supervisor.load(['sam'], () => undefined))).toBe('out_of_memory');
  expect(workers).toHaveLength(2);
  expect(restarted.mock.calls).toEqual([['out_of_memory']]);
});

it('marks a depth or SAM run from its dispatch until the worker is really done with it, and no other call', async () => {
  const { supervisor, workers, marks } = setup();
  const stop = new AbortController();
  const tap = supervisor.selectHair(photo, [], stop.signal);
  const depth = supervisor.depth(photo);
  await vi.advanceTimersByTimeAsync(0);
  expect(marks).toEqual(['sam']); // depth is still queued
  stop.abort();
  expect(code(await tap)).toBe('aborted');
  expect(marks).toEqual(['sam']); // the worker has not stopped yet
  workers[0]?.taps[0]?.resolve(err({ code: 'aborted', retryable: true, detail: 'stopped' }));
  expect(code(await depth)).toBe('ok');
  expect(marks).toEqual(['sam', null, 'depth', null]);
  const analysing = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  workers[0]?.analyses[0]?.resolve(ok(observation()));
  await analysing;
  expect(marks).toHaveLength(4);
});

it('clears the mark when a run ends in a crash: the tab survived it', async () => {
  const { supervisor, workers, marks } = setup();
  const tap = supervisor.selectHair(photo, []);
  await vi.advanceTimersByTimeAsync(0);
  workers[0]?.onCrash();
  expect(code(await tap)).toBe('crashed');
  await vi.advanceTimersByTimeAsync(0);
  expect(marks).toEqual(['sam', null]);
});

it('holds the lane for a cancelled call until the busy worker replies, under its watchdog', async () => {
  const { supervisor, workers, restarted } = setup();
  const stop = new AbortController();
  const cancelled = supervisor.analyse(photo, stop.signal);
  const next = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  stop.abort();
  expect(code(await cancelled)).toBe('aborted');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(workers[0]?.analyses).toHaveLength(1); // the worker is still on the cancelled call, so the next one waits
  workers[0]?.analyses[0]?.resolve(err({ code: 'aborted', retryable: true, detail: 'stopped at a stage boundary' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(workers[0]?.analyses).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(limitsFor('computer').computeMs.analyse - 1);
  expect(restarted).not.toHaveBeenCalled(); // its watchdog started when it was dispatched, not when it was queued
  workers[0]?.analyses[1]?.resolve(ok(observation()));
  expect(code(await next)).toBe('ok');
});

it('ends everything on RESET', async () => {
  const { supervisor, workers, restarted } = setup();
  const pending = supervisor.analyse(photo);
  await vi.advanceTimersByTimeAsync(0);
  supervisor.stop();
  expect(code(await pending)).toBe('aborted');
  expect(workers[0]?.terminate).toHaveBeenCalledTimes(1);
  expect(code(await supervisor.analyse(photo))).toBe('aborted');
  expect(code(await supervisor.load(['face'], () => undefined))).toBe('aborted');
  workers[0]?.onCrash();
  expect(restarted).not.toHaveBeenCalled();
  expect(workers).toHaveLength(1);
});
