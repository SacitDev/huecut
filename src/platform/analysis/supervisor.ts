/**
 * The worker supervisor: the only caller of `terminate()`. It ends the worker for
 * four reasons (watchdog expiry, crash, RESET and out-of-memory recovery) and owns the serial compute lane.
 */
import type { PhotoId } from '../../domain/ids.ts';
import type { PhotoObservation } from '../../domain/measure/observation.ts';
import { err, type Result } from '../../domain/result.ts';
import type {
  AnalysisError,
  AnalysisErrorCode,
  DepthMap,
  Diagnostics,
  ExtraModel,
  HairSelection,
  LoadProgress,
  ModelId,
  PhotoInput,
  RuntimeInfo,
  TapPoint,
  TintMask,
  TintSource,
  WorkerFault,
} from '../../worker/protocol.ts';
import type { AnalysisClient } from './client.ts';
import { createLane, type Lane } from './lane.ts';
import type { ComputeOp, Limits } from './limits.ts';

/** A started worker: its client and the one way to end it. */
export interface StartedWorker {
  readonly client: AnalysisClient;
  readonly terminate: () => void;
}

export interface SupervisorOptions {
  readonly limits: Limits;
  /** Starts a worker (bootstrap + client); `onCrash` is its `error` event after ready. Tests pass fakes. */
  readonly start: (onCrash: () => void) => StartedWorker;
  /** `WORKER.RESTARTED{reason}` for the machine. */
  readonly onRestarted: (reason: WorkerFault) => void;
  /** A depth or SAM run started (its model) or really ended (null): the "running extra" marker. */
  readonly onExtraRun: (model: ExtraModel | null) => void;
}

/** What the session uses; the same calls as the protocol, with an optional AbortSignal instead of op ids. */
export interface Supervisor {
  load(models: readonly ModelId[], onProgress: (p: LoadProgress) => void, signal?: AbortSignal): Promise<Result<RuntimeInfo, AnalysisError>>;
  analyse(photo: PhotoInput, signal?: AbortSignal): Promise<Result<PhotoObservation, AnalysisError>>;
  depth(photo: PhotoInput, signal?: AbortSignal): Promise<Result<DepthMap, AnalysisError>>;
  selectHair(photo: PhotoInput, points: readonly TapPoint[], signal?: AbortSignal): Promise<Result<HairSelection, AnalysisError>>;
  tint(photo: PhotoInput, source: TintSource, mask: TintMask, signal?: AbortSignal): Promise<Result<ImageBitmap, AnalysisError>>;
  release(photoId: PhotoId): void;
  diagnostics(): Promise<Diagnostics>;
  /** RESET: fails what is pending and ends the worker for good. */
  stop(): void;
  /** The current worker's handshake. */
  readonly ready: Promise<Result<void, AnalysisError>>;
}

const failure = (code: AnalysisErrorCode, detail: string): AnalysisError => ({ code, retryable: code !== 'internal', detail });
const EXTRA_OF: Readonly<Partial<Record<ComputeOp, ExtraModel>>> = { depth: 'depth', selectHair: 'sam' };
const FAULT_DETAIL: Readonly<Record<WorkerFault, string>> = {
  timeout: 'the compute watchdog expired',
  crashed: 'the worker crashed',
  out_of_memory: 'the worker ran out of memory',
};

/** One session's supervisor; `superviseWorker` is its public constructor. */
class WorkerSupervisor implements Supervisor {
  private readonly options: SupervisorOptions;
  private readonly lane: Lane;
  private generation = 0;
  private stopped = false;
  private current: StartedWorker;

  constructor(options: SupervisorOptions) {
    this.options = options;
    this.current = this.begin();
    this.lane = createLane({
      onExpire: () => {
        this.fault('timeout');
      },
    });
  }

  get ready(): Promise<Result<void, AnalysisError>> {
    return this.current.client.ready;
  }

  private begin(): StartedWorker {
    const mine = ++this.generation;
    return this.options.start(() => {
      if (mine === this.generation && !this.stopped) this.fault('crashed');
    });
  }

  /** A watchdog expiry, a crash or memory running out: end the worker, fail everything pending, start fresh, tell the machine. */
  private fault(reason: WorkerFault): void {
    if (this.stopped) return;
    const error = failure(reason, FAULT_DETAIL[reason]);
    const old = this.current;
    this.lane.failAll(error);
    old.client.dispose(reason, error.detail);
    old.terminate();
    this.current = this.begin();
    this.options.onRestarted(reason);
  }

  /** A worker that answered "out of memory" is as spent as one that crashed; `worker` guards against a reply from a replaced one. */
  private recoverIfOutOfMemory(r: Result<unknown, AnalysisError>, worker: number): void {
    if (!r.ok && r.error.code === 'out_of_memory' && worker === this.generation) this.fault('out_of_memory');
  }

  private compute<T>(op: ComputeOp, send: () => Promise<Result<T, AnalysisError>>, signal?: AbortSignal): Promise<Result<T, AnalysisError>> {
    if (this.stopped) return Promise.resolve(err(failure('aborted', 'the session ended')));
    const extra = EXTRA_OF[op];
    const run = async (): Promise<Result<T, AnalysisError>> => {
      const worker = this.generation;
      if (extra) this.options.onExtraRun(extra);
      try {
        const r = await send();
        this.recoverIfOutOfMemory(r, worker);
        return r;
      } finally {
        if (extra) this.options.onExtraRun(null);
      }
    };
    return this.lane.enqueue({ limitMs: this.options.limits.computeMs[op], signal, run });
  }

  async load(models: readonly ModelId[], onProgress: (p: LoadProgress) => void, signal?: AbortSignal): Promise<Result<RuntimeInfo, AnalysisError>> {
    if (this.stopped) return err(failure('aborted', 'the session ended'));
    const worker = this.generation;
    const r = await this.current.client.load(models, onProgress, signal);
    // Extras only: after a restart the core region goes straight back to loading, so a core load that restarts would never end.
    if (!models.includes('face')) this.recoverIfOutOfMemory(r, worker);
    return r;
  }

  analyse(photo: PhotoInput, signal?: AbortSignal): Promise<Result<PhotoObservation, AnalysisError>> {
    return this.compute('analyse', () => this.current.client.analyse(photo, signal), signal);
  }

  depth(photo: PhotoInput, signal?: AbortSignal): Promise<Result<DepthMap, AnalysisError>> {
    return this.compute('depth', () => this.current.client.depth(photo, signal), signal);
  }

  selectHair(photo: PhotoInput, points: readonly TapPoint[], signal?: AbortSignal): Promise<Result<HairSelection, AnalysisError>> {
    return this.compute('selectHair', () => this.current.client.selectHair(photo, points, signal), signal);
  }

  tint(photo: PhotoInput, source: TintSource, mask: TintMask, signal?: AbortSignal): Promise<Result<ImageBitmap, AnalysisError>> {
    return this.compute('tint', () => this.current.client.tint(photo, source, mask, signal), signal);
  }

  release(photoId: PhotoId): void {
    this.current.client.release(photoId);
  }

  diagnostics(): Promise<Diagnostics> {
    return this.current.client.diagnostics();
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    const error = failure('aborted', 'the session ended');
    this.lane.failAll(error);
    this.current.client.dispose('aborted', error.detail);
    this.current.terminate();
  }
}

/** Starts the first worker and supervises it until `stop()`. */
export function superviseWorker(options: SupervisorOptions): Supervisor {
  return new WorkerSupervisor(options);
}
