/**
 * The analysis service the worker exposes. It takes its browser parts as injected
 * dependencies (`decode`, `readFocal35`, `loadModel`, `runStage`, the extras), so it runs in Vitest with fakes.
 * Expected failures return `Result`; typed arrays are transferred; cancellation is checked between stages.
 */
import { releaseProxy, transfer } from 'comlink';
import type { OpId, PhotoId } from '../domain/ids.ts';
import { hairMeasures, previewMask, type RgbaImage } from '../domain/measure/mask.ts';
import type { FaceObservation, HairMeasures, PhotoObservation, PreviewMask } from '../domain/measure/observation.ts';
import { planDecode, readPictureHead } from '../domain/measure/picture-gate.ts';
import { err, ok, type Result } from '../domain/result.ts';
import type { StageOutput } from './models/mediapipe.ts';
import type { AnalysisApi, AnalysisError, CoreModel, DepthMap, Diagnostics, LoadProgress, Mask, ModelId, RuntimeInfo, TapPoint } from './protocol.ts';
import { depthOf, failure, selectHairOf, thrownCode, tintOf, type ExtraContext } from './service-extras.ts';

/** Longest side of the analysis image. */
export const ANALYSIS_MAX_SIDE_PX = 1400;
/** Minimum interval between progress messages in milliseconds, except when the model or phase changes or loading completes. */
const PROGRESS_INTERVAL_MS = 100;
const CORE_ORDER: readonly CoreModel[] = ['face', 'hand', 'pose', 'segmenter'];

/** Depth and tap-to-select as the service uses them (`models/transformers.ts`); tests pass fakes. */
export interface ExtraRunner {
  depth(image: RgbaImage): Promise<DepthMap>;
  selectHair(photoId: PhotoId, image: RgbaImage, points: readonly TapPoint[]): Promise<Mask>;
  release(photoId: PhotoId): void;
  /** The backend the extras run on, once one has started. */
  backend(): 'webgpu' | 'wasm' | null;
}

/** The browser parts of the service; tests pass fakes. */
export interface ServiceDeps {
  /** Decodes, EXIF-orients and scales a photo to at most 1400 px on its longest side. */
  readonly decode: (blob: Blob) => Promise<Result<RgbaImage, AnalysisError>>;
  readonly readFocal35: (blob: Blob) => Promise<number | null>;
  /** Fetches or reads from the cache, verifies and starts one model. */
  readonly loadModel: (model: ModelId, signal: AbortSignal, onProgress: (p: LoadProgress) => void) => Promise<Result<void, AnalysisError>>;
  readonly runStage: <S extends CoreModel>(stage: S, image: RgbaImage) => Promise<StageOutput[S]>;
  readonly extras: ExtraRunner;
  /** Turns a tinted image into the bitmap `tint` returns. */
  readonly toBitmap: (image: RgbaImage) => Promise<ImageBitmap>;
  /**
   * A feature every model needs that this engine lacks, or null. Playwright's WebKit on Windows has no
   * OffscreenCanvas, so `load` says `unsupported` before any model is fetched or started.
   */
  readonly missingFeature: string | null;
  readonly diagnostics: () => Diagnostics;
  readonly now?: () => number;
}

/** Wraps a progress callback so it sends at most one message per 100 ms, phase changes and the end always. */
function throttled(send: (p: LoadProgress) => void, now: () => number): (p: LoadProgress) => void {
  let lastAt = -Infinity;
  let lastKey = '';
  return (p) => {
    const key = `${p.model}:${p.phase}`;
    const t = now();
    if (key === lastKey && t - lastAt < PROGRESS_INTERVAL_MS && p.loadedBytes < p.totalBytes) return;
    lastAt = t;
    lastKey = key;
    send(p);
  };
}

/** Every buffer an observation holds, so Comlink transfers them instead of copying. */
function buffersOf(o: PhotoObservation): ArrayBuffer[] {
  const views = [...o.faces.flatMap((f) => (f.matrix ? [f.landmarks, f.matrix] : [f.landmarks])), ...o.hands, ...(o.pose ? [o.pose] : []), ...(o.hair ? [o.hair.hairline] : []), ...(o.previewMask ? [o.previewMask.data] : [])];
  return [...new Set(views.map((v) => v.buffer as ArrayBuffer))];
}

/** The service's state: in-flight ops (for `cancel`), the models loaded or loading in this worker, and the extras' context. */
interface ServiceState extends ExtraContext {
  readonly now: () => number;
  readonly ops: Map<OpId, AbortController>;
  readonly loaded: Set<ModelId>;
  readonly loading: Map<ModelId, Promise<Result<void, AnalysisError>>>;
}

function track(state: ServiceState, op: OpId): AbortSignal {
  const controller = new AbortController();
  state.ops.set(op, controller);
  return controller.signal;
}

/** Runs one compute call under its op id; a throw becomes `out_of_memory` or `internal`, never a rejection. */
async function withOp<T>(state: ServiceState, op: OpId, name: string, run: (signal: AbortSignal) => Promise<Result<T, AnalysisError>>): Promise<Result<T, AnalysisError>> {
  const signal = track(state, op);
  try {
    return await run(signal);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(failure(thrownCode(message), `${name}: ${message}`));
  } finally {
    state.ops.delete(op);
  }
}

/** Idempotent per model: a second request joins the first (and shares its signal); a loaded model is not loaded again. */
function loadOnce(state: ServiceState, model: ModelId, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>> {
  if (state.loaded.has(model)) return Promise.resolve(ok(undefined));
  const joined = state.loading.get(model);
  if (joined) return joined;
  const pending = state.deps.loadModel(model, signal, onProgress).then(
    (r) => {
      if (r.ok) state.loaded.add(model);
      return r;
    },
    (e: unknown) => err(failure('internal', `loading ${model}: ${String(e)}`, model)),
  );
  state.loading.set(model, pending);
  void pending.finally(() => state.loading.delete(model));
  return pending;
}

/** Loads models in order. `core_degraded` needs the face model: without it, or with nothing loaded, the load failed. */
async function load(state: ServiceState, op: OpId, models: readonly ModelId[], onProgress: (p: LoadProgress) => void): Promise<Result<RuntimeInfo, AnalysisError>> {
  const signal = track(state, op);
  const progress = throttled((p) => {
    onProgress(p);
  }, state.now);
  try {
    // Refuse before anything is fetched or started, so the machine shows its reason at once.
    if (state.deps.missingFeature) return err(failure('unsupported', `no ${state.deps.missingFeature} in this worker`, models[0]));
    const failed = new Map<ModelId, AnalysisError>();
    for (const model of models) {
      if (signal.aborted) return err(failure('aborted', 'load stopped', model));
      const r = await loadOnce(state, model, signal, progress);
      if (!r.ok && r.error.code === 'aborted') return r;
      if (!r.ok) failed.set(model, r.error);
    }
    const first = failed.get('face') ?? (failed.size === models.length ? failed.values().next().value : undefined);
    if (first) return err(first);
    return ok({ mediapipe: 'cpu', extras: state.deps.extras.backend(), loaded: [...state.loaded], missing: [...failed.keys()] });
  } finally {
    state.ops.delete(op);
    // The callback is a Comlink proxy in the worker; release its port once the load is over.
    (onProgress as Partial<Record<typeof releaseProxy, () => void>>)[releaseProxy]?.();
  }
}

/** What the stages found so far; the segmenter's measures use the first face's landmarks. */
interface Found {
  faces: readonly FaceObservation[];
  hands: readonly Float32Array[];
  pose: Float32Array | null;
  hair: HairMeasures | null;
  preview: PreviewMask | null;
}

async function runOne(deps: ServiceDeps, stage: CoreModel, image: RgbaImage, found: Found): Promise<void> {
  if (stage === 'face') found.faces = await deps.runStage('face', image);
  else if (stage === 'hand') found.hands = await deps.runStage('hand', image);
  else if (stage === 'pose') found.pose = await deps.runStage('pose', image);
  else {
    const mask = await deps.runStage('segmenter', image);
    found.hair = hairMeasures(mask, image, found.faces[0]?.landmarks ?? null);
    found.preview = previewMask(mask);
  }
}

/** Decodes the photo and runs the loaded stages in order, checking for cancellation between them. */
async function observe(state: ServiceState, signal: AbortSignal, photo: Blob): Promise<Result<PhotoObservation, AnalysisError>> {
  const image = await state.deps.decode(photo);
  if (!image.ok) return image;
  const focal35mm = await state.deps.readFocal35(photo);
  const ran: CoreModel[] = [];
  const found: Found = { faces: [], hands: [], pose: null, hair: null, preview: null };
  for (const stage of CORE_ORDER) {
    if (signal.aborted) return err(failure('aborted', `analysis stopped before ${stage}`));
    if (!state.loaded.has(stage)) continue;
    ran.push(stage);
    await runOne(state.deps, stage, image.value, found);
  }
  const { faces, hands, pose, hair, preview } = found;
  return ok({ schemaVersion: 1, image: { widthPx: image.value.widthPx, heightPx: image.value.heightPx }, focal35mm, faces, hands, pose, hair, previewMask: preview, ran });
}

async function analyse(state: ServiceState, signal: AbortSignal, photo: Blob): Promise<Result<PhotoObservation, AnalysisError>> {
  if (!CORE_ORDER.some((m) => state.loaded.has(m))) return err(failure('internal', 'analyse before any core model loaded'));
  const r = await observe(state, signal, photo);
  return r.ok ? transfer(r, buffersOf(r.value)) : r;
}

/** Creates the service over its dependencies. */
export function createAnalysisService(deps: ServiceDeps): AnalysisApi {
  const state: ServiceState = { deps, now: deps.now ?? (() => performance.now()), ops: new Map(), loaded: new Set(), loading: new Map(), sensed: null };
  return {
    load: (op, models, onProgress) => load(state, op, models, onProgress),
    analyse: (op, photo) => withOp(state, op, 'analyse', (signal) => analyse(state, signal, photo.blob)),
    depth: (op, photo) => withOp(state, op, 'depth', (signal) => depthOf(state, signal, photo.blob)),
    selectHair: (op, photo, points) => withOp(state, op, 'selectHair', (signal) => selectHairOf(state, signal, photo, points)),
    tint: (op, photo, source, mask) => withOp(state, op, 'tint', (signal) => tintOf(state, signal, photo.blob, source, mask)),
    cancel(op) {
      state.ops.get(op)?.abort();
    },
    release(photoId) {
      deps.extras.release(photoId);
      if (state.sensed?.photoId === photoId) state.sensed = null;
    },
    diagnostics: () => Promise.resolve(deps.diagnostics()),
  };
}


/**
 * A large JPEG decoded straight to a smaller one of its eight DCT scales; null when the decoder cannot. Not `createImageBitmap` with
 * resize options: that still makes the full raster first (6048 x 8064 in Chromium 158: 192 MB added at its peak, against 10 MB here).
 * The frame honours the EXIF orientation, all eight tags. The main thread's copy is in `platform/resources.ts` (layers).
 */
async function scaledJpeg(blob: Blob, size: { readonly width: number; readonly height: number }): Promise<VideoFrame | null> {
  let decoder: ImageDecoder | null = null;
  try {
    decoder = new ImageDecoder({ data: blob.stream(), type: 'image/jpeg', desiredWidth: size.width, desiredHeight: size.height });
    return (await decoder.decode()).image;
  } catch {
    return null;
  } finally {
    decoder?.close();
  }
}

/** The browser `decode`: bounded by the picture gate, EXIF-oriented, scaled into an OffscreenCanvas. */
export async function decodePhoto(blob: Blob): Promise<Result<RgbaImage, AnalysisError>> {
  if (typeof OffscreenCanvas === 'undefined') return err(failure('unsupported', 'no OffscreenCanvas in this worker'));
  const head = await readPictureHead(blob);
  const plan = planDecode(head, typeof ImageDecoder !== 'undefined', ANALYSIS_MAX_SIDE_PX);
  let source: ImageBitmap | VideoFrame | null = typeof plan === 'object' ? await scaledJpeg(blob, plan) : null;
  if (!source && planDecode(head, false, ANALYSIS_MAX_SIDE_PX) === 'refuse') return err(failure('decode_failed', 'decode: over the pixel limit'));
  try {
    source ??= await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch (e) {
    return err(failure('decode_failed', `decode: ${e instanceof Error ? e.message : String(e)}`));
  }
  try {
    const [width, height] = 'displayWidth' in source ? [source.displayWidth, source.displayHeight] : [source.width, source.height];
    const scale = Math.min(1, ANALYSIS_MAX_SIDE_PX / Math.max(width, height));
    const widthPx = Math.max(1, Math.round(width * scale));
    const heightPx = Math.max(1, Math.round(height * scale));
    const context = new OffscreenCanvas(widthPx, heightPx).getContext('2d', { willReadFrequently: true });
    if (!context) return err(failure('unsupported', 'no 2D canvas in this worker'));
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, widthPx, heightPx);
    return ok({ widthPx, heightPx, data: context.getImageData(0, 0, widthPx, heightPx).data });
  } finally {
    source.close();
  }
}
