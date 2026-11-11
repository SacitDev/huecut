/**
 * The contract between the main thread and the analysis worker. TYPES ONLY: the one
 * worker file other layers may import, and only with `import type` (enforced by lint).
 */
import type { OpId, PhotoId } from '../domain/ids.ts';
import type { PhotoObservation } from '../domain/measure/observation.ts';
import type { Lab } from '../domain/measure/observation.ts';
import type { Result } from '../domain/result.ts';

export type CoreModel = 'face' | 'hand' | 'pose' | 'segmenter';
export type ExtraModel = 'depth' | 'sam';
export type ModelId = CoreModel | ExtraModel;

/** Throttled by the worker to about 10 per second. Byte counts come from the manifest, not Content-Length. */
export interface LoadProgress {
  readonly model: ModelId;
  readonly phase: 'download' | 'verify' | 'start';
  readonly loadedBytes: number;
  readonly totalBytes: number;
}

export type AnalysisErrorCode =
  | 'aborted' // the caller cancelled that download
  | 'network' // a download failed or stalled (30 s without progress)
  | 'integrity' // SHA-256 of a model file did not match the manifest, twice
  | 'unsupported' // the browser lacks a needed feature
  | 'out_of_memory'
  | 'decode_failed' // the picture could not be decoded (for example HEIC outside Safari)
  | 'crashed' // the worker died; the supervisor restarts it
  | 'internal' // a bug; shown as a generic message
  | 'timeout' // the compute watchdog expired
  | 'boot_failed'; // the worker chunk did not load (stale deploy) or no `ready` within the boot timeout

/** Why the supervisor replaced the worker. */
export type WorkerFault = Extract<AnalysisErrorCode, 'timeout' | 'crashed' | 'out_of_memory'>;

export interface AnalysisError {
  readonly code: AnalysisErrorCode;
  readonly model?: ModelId;
  readonly retryable: boolean;
  /** Developer detail for the console; never shown (the UI maps `code` to strings/en.ts). */
  readonly detail: string;
}

export interface RuntimeInfo {
  readonly mediapipe: 'cpu';
  readonly extras: 'webgpu' | 'wasm' | null;
  readonly loaded: readonly ModelId[];
  readonly missing: readonly ModelId[];
}

/** Blobs pass by reference; the worker decodes and orients them itself. */
export interface PhotoInput {
  readonly id: PhotoId;
  readonly blob: Blob;
}

/** Relative depth 0-1 at a short side of 252 px, row by row; 1 is the nearest point, 0 the farthest. */
export interface DepthMap {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Float32Array;
  /** The person (every class but the segmenter's background) at this map's size, 0 or 255; absent without the segmenter. */
  readonly foreground?: Uint8Array;
}

/** A hair mask at analysis size, values 0 or 255. */
export interface Mask {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8Array;
}

/** A tap on the photo, normalised; `include: false` marks "not hair". */
export interface TapPoint {
  readonly x: number;
  readonly y: number;
  readonly include: boolean;
}

/**
 * A tap-to-select result: the refined mask at analysis size (stored by the main thread under the photo id) and
 * its measures. The hairline needs the face points and the segmenter's face skin, so it is measured only where
 * those tools loaded; without them `hairline` is empty and `hairlineVisible` false, and the hairline from `analyse` stands.
 */
export interface HairSelection {
  readonly mask: Mask;
  readonly measures: NonNullable<PhotoObservation['hair']>;
}

/** Lab targets per region and brightness band, built from a colour look. */
export interface TintTargets {
  readonly root: BandTargets | null;
  readonly mids: BandTargets | null;
  readonly ends: BandTargets | null;
}
export interface BandTargets {
  readonly shadows: Lab;
  readonly mid: Lab;
  readonly light: Lab;
}

/** `auto`: the segmenter runs again, so it needs the core tools; otherwise a transferred copy of a stored mask (no model needed). */
export type TintMask = 'auto' | Mask;

/** What `tint` colours towards: a look's Lab targets, or an AI picture whose hair statistics are measured. */
export type TintSource = { readonly kind: 'targets'; readonly targets: TintTargets } | { readonly kind: 'picture'; readonly blob: Blob };

export interface Diagnostics {
  /** Requests the fetch allowlist rejected, counted by host. */
  readonly blocked: Readonly<Record<string, number>>;
  /** Manifest files answered from the registry (verified bytes), counted by logical path. */
  readonly served: Readonly<Record<string, number>>;
  /** Requests Transformers.js's fetch got for files not in the manifest, answered 404 without the network. */
  readonly unlisted: Readonly<Record<string, number>>;
  /** The worker's own `securitypolicyviolation` events (a violation inside a worker never reaches the page). */
  readonly violations: readonly { readonly directive: string; readonly blockedURI: string }[];
  /**
   * WebGL contexts the worker's tasks opened, and how many the browser has since lost (a `webglcontextlost`
   * event or `isContextLost()`). A lost context made the face task find no face, silently.
   */
  readonly webgl: { readonly created: number; readonly lost: number };
}

/**
 * Exposed with Comlink by `worker/analysis.worker.ts`. Expected failures return `Result`, never throw.
 * There is no `close`: the machine and the client never close a task.
 */
export interface AnalysisApi {
  load(op: OpId, models: readonly ModelId[], onProgress: (p: LoadProgress) => void): Promise<Result<RuntimeInfo, AnalysisError>>;
  analyse(op: OpId, photo: PhotoInput): Promise<Result<PhotoObservation, AnalysisError>>;
  depth(op: OpId, photo: PhotoInput): Promise<Result<DepthMap, AnalysisError>>;
  selectHair(op: OpId, photo: PhotoInput, points: readonly TapPoint[]): Promise<Result<HairSelection, AnalysisError>>;
  tint(op: OpId, photo: PhotoInput, source: TintSource, mask: TintMask): Promise<Result<ImageBitmap, AnalysisError>>;
  cancel(op: OpId): void;
  release(photoId: PhotoId): void;
  diagnostics(): Promise<Diagnostics>;
}

/** The first message a worker posts: `ready` after Comlink is exposed, or `boot_failed` from the bootstrap's catch. */
export type BootMessage = { readonly type: 'ready' } | { readonly type: 'boot_failed' };
