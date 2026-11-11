/**
 * The serial compute lane: `analyse`, `depth`, `selectHair` and `tint` run one at a time in FIFO order, and each call's watchdog
 * starts when the lane dispatches it, never while it waits, so a tap never times out behind a depth map. Downloads and the bypass
 * calls never enter it.
 */
import { err, type Result } from '../../domain/result.ts';
import type { AnalysisError } from '../../worker/protocol.ts';

export interface LaneJob<T> {
  /** Watchdog limit, from `limits.ts`. */
  readonly limitMs: number;
  /** Aborting drops a waiting call; a running one is answered `aborted` at once and keeps its slot until `run` settles. */
  readonly signal?: AbortSignal | undefined;
  /** Sends the call; invoked only at dispatch. */
  readonly run: () => Promise<Result<T, AnalysisError>>;
}

export interface LaneOptions {
  /** A running call outlived its watchdog. Called before the call settles with `timeout`. */
  readonly onExpire: () => void;
}

export interface Lane {
  enqueue<T>(job: LaneJob<T>): Promise<Result<T, AnalysisError>>;
  /** True while a call runs. */
  readonly running: boolean;
  /** Calls waiting, the running one not counted. */
  readonly queued: number;
  /** Settles the running call and every waiting one with `error` (crash, watchdog expiry, RESET). */
  failAll(error: AnalysisError): void;
}

type Settle = (r: Result<unknown, AnalysisError>) => void;

interface Entry {
  readonly job: LaneJob<unknown>;
  readonly settle: Settle;
}

interface LaneState {
  readonly options: LaneOptions;
  readonly queue: Entry[];
  finishCurrent: Settle | null;
  pumping: boolean;
}

const aborted: AnalysisError = { code: 'aborted', retryable: true, detail: 'cancelled in the lane' };

/** A reply nobody is waiting for: a bitmap (about 6 MB) is closed at once, not left to the collector. */
export function discardReply(r: Result<unknown, AnalysisError>): void {
  if (r.ok) (r.value as Partial<ImageBitmap> | null | undefined)?.close?.();
}

/** Runs one call under its watchdog, started now; resolves once the worker is free of it, however it settled. */
function dispatch(state: LaneState, entry: Entry): Promise<void> {
  return new Promise((done) => {
    const { signal } = entry.job;
    // MediaPipe and ONNX cannot be interrupted: the caller moves on, but the next call must not start its watchdog yet.
    let answered = false;
    const answer = (): void => {
      answered = true;
      entry.settle(err(aborted));
    };
    let finished = false;
    const finish: Settle = (r) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', answer);
      state.finishCurrent = null;
      if (answered) discardReply(r);
      else entry.settle(r);
      done();
    };
    signal?.addEventListener('abort', answer, { once: true });
    const timer = setTimeout(() => {
      state.options.onExpire();
      finish(err({ code: 'timeout', retryable: true, detail: `no reply within the ${String(entry.job.limitMs)} ms watchdog` }));
    }, entry.job.limitMs);
    state.finishCurrent = finish;
    entry.job.run().then(finish, (e: unknown) => {
      finish(err({ code: 'internal', retryable: false, detail: `lane call threw: ${String(e)}` }));
    });
  });
}

/** Dispatches waiting calls one at a time until the queue is empty. */
async function pump(state: LaneState): Promise<void> {
  if (state.pumping) return;
  state.pumping = true;
  try {
    for (let head = state.queue.shift(); head; head = state.queue.shift()) await dispatch(state, head);
  } finally {
    state.pumping = false;
  }
}

/** Queues one call; an abort while it waits removes it without sending it. */
function enqueue<T>(state: LaneState, job: LaneJob<T>): Promise<Result<T, AnalysisError>> {
  if (job.signal?.aborted) return Promise.resolve(err(aborted));
  return new Promise<Result<T, AnalysisError>>((resolve) => {
    const entry: Entry = { job, settle: resolve as Settle };
    state.queue.push(entry);
    const drop = (): void => {
      const i = state.queue.indexOf(entry);
      if (i < 0) return;
      state.queue.splice(i, 1);
      resolve(err(aborted));
    };
    job.signal?.addEventListener('abort', drop, { once: true });
    void pump(state);
  });
}

/** Creates an empty lane. */
export function createLane(options: LaneOptions): Lane {
  const state: LaneState = { options, queue: [], finishCurrent: null, pumping: false };
  return {
    enqueue: (job) => enqueue(state, job),
    get running() {
      return state.finishCurrent !== null;
    },
    get queued() {
      return state.queue.length;
    },
    failAll(error) {
      for (const entry of state.queue.splice(0)) entry.settle(err(error));
      state.finishCurrent?.(err(error));
    },
  };
}
