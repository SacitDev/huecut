/**
 * The analysis client: a Promise + AbortSignal facade over one worker's Comlink proxy.
 * It owns op ids, the `ready` handshake with the boot timeout and the download stall timers; replies to ops
 * no longer pending are discarded. It reports a crash and never terminates the worker (the supervisor does).
 */
import { proxy, transfer, wrap, type Endpoint, type Remote } from 'comlink';
import { asOpId, type OpId, type PhotoId } from '../../domain/ids.ts';
import type { PhotoObservation } from '../../domain/measure/observation.ts';
import { err, type Result } from '../../domain/result.ts';
import type {
  AnalysisApi,
  AnalysisError,
  AnalysisErrorCode,
  BootMessage,
  DepthMap,
  Diagnostics,
  HairSelection,
  LoadProgress,
  ModelId,
  PhotoInput,
  RuntimeInfo,
  TapPoint,
  TintMask,
  TintSource,
} from '../../worker/protocol.ts';
import { discardReply } from './lane.ts';
import type { Limits } from './limits.ts';

/** What the client needs of a Worker; a MessagePort with an `error` source works in tests. */
export type WorkerEndpoint = Endpoint;

export interface ClientOptions {
  readonly endpoint: WorkerEndpoint;
  readonly limits: Pick<Limits, 'bootMs' | 'stallMs'>;
  /** An `error` event after `ready`: the supervisor terminates and restarts. */
  readonly onCrash: () => void;
}

/**
 * One worker's calls. Compute calls are dispatched by the lane; this facade only sends and settles them. An abort stops
 * a download at once; a compute call is told to stop and settles with the worker's reply, because a stage cannot be
 * interrupted and the lane must keep its slot until the worker is free.
 */
export interface AnalysisClient {
  /** Settles once: ok after `ready`, else `boot_failed` (the bootstrap's message, an error, or the boot timeout). */
  readonly ready: Promise<Result<void, AnalysisError>>;
  load(models: readonly ModelId[], onProgress: (p: LoadProgress) => void, signal?: AbortSignal): Promise<Result<RuntimeInfo, AnalysisError>>;
  analyse(photo: PhotoInput, signal?: AbortSignal): Promise<Result<PhotoObservation, AnalysisError>>;
  depth(photo: PhotoInput, signal?: AbortSignal): Promise<Result<DepthMap, AnalysisError>>;
  selectHair(photo: PhotoInput, points: readonly TapPoint[], signal?: AbortSignal): Promise<Result<HairSelection, AnalysisError>>;
  tint(photo: PhotoInput, source: TintSource, mask: TintMask, signal?: AbortSignal): Promise<Result<ImageBitmap, AnalysisError>>;
  release(photoId: PhotoId): void;
  diagnostics(): Promise<Diagnostics>;
  /** Downloads in flight. */
  readonly downloads: number;
  /** Settles every pending call with `code` and stops all timers and listeners; never terminates. */
  dispose(code: AnalysisErrorCode, detail: string): void;
}

let lastOp = 0;
/** Op ids are unique for the page's life, so a reply from a replaced worker can never match a new call. */
export const nextOpId = (): OpId => asOpId(++lastOp);

const failure = (code: AnalysisErrorCode, detail: string): AnalysisError => ({ code, retryable: code !== 'internal', detail });

type Settle = (r: Result<unknown, AnalysisError>) => void;

interface ClientState {
  readonly remote: Remote<AnalysisApi>;
  readonly limits: ClientOptions['limits'];
  readonly ready: Promise<Result<void, AnalysisError>>;
  readonly pending: Map<OpId, Settle>;
  readonly stalls: Map<OpId, ReturnType<typeof setTimeout>>;
  disposed: AnalysisError | null;
  downloads: number;
}

/** The handshake: `ready`, or `boot_failed` from the bootstrap's message, an error event or the boot timeout; `stop` ends it early. */
function handshake(endpoint: WorkerEndpoint, bootMs: number): { readonly ready: Promise<Result<void, AnalysisError>>; readonly stop: () => void } {
  let finish: (r: Result<void, AnalysisError>) => void = () => undefined;
  const ready = new Promise<Result<void, AnalysisError>>((resolve) => {
    finish = (r) => {
      clearTimeout(timer);
      endpoint.removeEventListener('message', onMessage);
      endpoint.removeEventListener('error', onBootError);
      resolve(r);
    };
    const onMessage = (event: Event): void => {
      const type = ((event as MessageEvent).data as Partial<BootMessage> | null)?.type;
      if (type === 'ready') finish({ ok: true, value: undefined });
      else if (type === 'boot_failed') finish(err(failure('boot_failed', 'the worker chunk did not load')));
    };
    const onBootError = (): void => {
      finish(err(failure('boot_failed', 'the worker failed before ready')));
    };
    const timer = setTimeout(() => {
      finish(err(failure('boot_failed', `no ready within ${String(bootMs)} ms`)));
    }, bootMs);
    endpoint.addEventListener('message', onMessage);
    endpoint.addEventListener('error', onBootError);
  });
  return {
    ready,
    stop: () => {
      finish(err(failure('boot_failed', 'disposed before ready')));
    },
  };
}

/** Settles an op once; a late or stale reply finds nothing pending and is discarded. */
function settle(state: ClientState, op: OpId, r: Result<unknown, AnalysisError>): void {
  const done = state.pending.get(op);
  if (!done) {
    discardReply(r);
    return;
  }
  state.pending.delete(op);
  clearTimeout(state.stalls.get(op));
  state.stalls.delete(op);
  done(r);
}

interface CallOptions {
  readonly signal?: AbortSignal | undefined;
  readonly onStart?: (op: OpId) => void;
  /** A download answers an abort at once; a compute call waits for the worker's reply. */
  readonly answerOnAbort: boolean;
}

/** Sends one call after `ready`, with its op id; an aborted signal cancels it in the worker. */
function call<T>(state: ClientState, send: (op: OpId) => Promise<Result<T, AnalysisError>>, { signal, onStart, answerOnAbort }: CallOptions): Promise<Result<T, AnalysisError>> {
  const op = nextOpId();
  return new Promise<Result<T, AnalysisError>>((resolve) => {
    const refused = state.disposed ?? (signal?.aborted ? failure('aborted', 'cancelled before it was sent') : null);
    if (refused) {
      resolve(err(refused));
      return;
    }
    state.pending.set(op, resolve as Settle);
    let sent = false;
    signal?.addEventListener(
      'abort',
      () => {
        if (!state.pending.has(op)) return;
        if (sent) void state.remote.cancel(op);
        if (!sent || answerOnAbort) settle(state, op, err(failure('aborted', 'cancelled by the caller')));
      },
      { once: true },
    );
    void state.ready.then((booting) => {
      if (!booting.ok) settle(state, op, booting);
      if (!state.pending.has(op)) return;
      onStart?.(op);
      sent = true;
      send(op).then(
        (r) => {
          settle(state, op, r);
        },
        (e: unknown) => {
          settle(state, op, err(failure('internal', `worker call threw: ${String(e)}`)));
        },
      );
    });
  });
}

/** (Re)starts the stall timer of a download: 30 s with no progress aborts it with `network`. */
function armStall(state: ClientState, op: OpId): void {
  clearTimeout(state.stalls.get(op));
  const timer = setTimeout(() => {
    if (!state.pending.has(op)) return;
    void state.remote.cancel(op);
    settle(state, op, err(failure('network', `no download progress for ${String(state.limits.stallMs)} ms`)));
  }, state.limits.stallMs);
  state.stalls.set(op, timer);
}

/** A download beside the lane, watched by its stall timer instead of a watchdog. */
async function load(state: ClientState, models: readonly ModelId[], onProgress: (p: LoadProgress) => void, signal?: AbortSignal): Promise<Result<RuntimeInfo, AnalysisError>> {
  state.downloads++;
  try {
    const send = (op: OpId): Promise<Result<RuntimeInfo, AnalysisError>> =>
      state.remote.load(
        op,
        models,
        proxy((p: LoadProgress) => {
          if (!state.pending.has(op)) return;
          armStall(state, op);
          onProgress(p);
        }),
      );
    return await call(state, send, {
      signal,
      answerOnAbort: true,
      onStart: (op) => {
        armStall(state, op);
      },
    });
  } finally {
    state.downloads--;
  }
}

/** Creates the client and starts the handshake at once. */
export function createAnalysisClient(options: ClientOptions): AnalysisClient {
  const { endpoint } = options;
  const { ready, stop: stopHandshake } = handshake(endpoint, options.limits.bootMs);
  const state: ClientState = { remote: wrap<AnalysisApi>(endpoint), limits: options.limits, ready, pending: new Map(), stalls: new Map(), disposed: null, downloads: 0 };
  let booted = false;
  void ready.then((r) => (booted = r.ok));
  const compute = <T>(send: (op: OpId) => Promise<Result<T, AnalysisError>>, signal?: AbortSignal): Promise<Result<T, AnalysisError>> => call(state, send, { signal, answerOnAbort: false });
  const onError = (): void => {
    if (booted && !state.disposed) options.onCrash();
  };
  endpoint.addEventListener('error', onError);
  return {
    ready,
    load: (models, onProgress, signal) => load(state, models, onProgress, signal),
    analyse: (photo, signal) => compute((op) => state.remote.analyse(op, photo), signal),
    depth: (photo, signal) => compute((op) => state.remote.depth(op, photo), signal),
    selectHair: (photo, points, signal) => compute((op) => state.remote.selectHair(op, photo, points), signal),
    tint: (photo, source, mask, signal) =>
      compute((op) => state.remote.tint(op, photo, source, mask === 'auto' ? mask : transfer(mask, [mask.data.buffer as ArrayBuffer])) as Promise<Result<ImageBitmap, AnalysisError>>, signal),
    release(photoId) {
      if (!state.disposed) void state.remote.release(photoId);
    },
    diagnostics: () => state.remote.diagnostics(),
    get downloads() {
      return state.downloads;
    },
    dispose(code, detail) {
      state.disposed ??= failure(code, detail);
      endpoint.removeEventListener('error', onError);
      for (const op of [...state.pending.keys()]) settle(state, op, err(state.disposed));
      stopHandshake();
    },
  };
}
