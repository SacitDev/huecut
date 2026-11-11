/**
 * The four core MediaPipe tasks in the worker: CPU delegate, `wasmLoaderPath: ''`
 * with `self.ModuleFactory` set before every `createFromOptions` (a module worker otherwise creates only the
 * first task), and model bytes from the registry as `modelAssetBuffer`. Tasks are never closed.
 */
import type * as Vision from '@mediapipe/tasks-vision';
import type { FaceLandmarker, HandLandmarker, ImageSegmenter, NormalizedLandmark, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { FaceObservation } from '../../domain/measure/observation.ts';
import type { CategoryMask, RgbaImage } from '../../domain/measure/mask.ts';
import { err, ok, type Result } from '../../domain/result.ts';
import type { AnalysisError, CoreModel, LoadProgress } from '../protocol.ts';
import type { Registry } from '../registry.ts';
import { failure, thrownCode } from '../service-extras.ts';

/** The WASM of MediaPipe's ES-module loader, the only MediaPipe runtime file requested (manifest path). */
export const MEDIAPIPE_WASM = 'mediapipe/vision_wasm_module_internal.wasm';

/** Model file per task (manifest paths). */
export const MODEL_FILES: Readonly<Record<CoreModel, string>> = {
  face: 'mediapipe/face_landmarker.task',
  hand: 'mediapipe/hand_landmarker.task',
  pose: 'mediapipe/pose_landmarker_lite.task',
  segmenter: 'mediapipe/selfie_multiclass_256x256.tflite',
};

/** What each stage returns, in the shapes `PhotoObservation` and `domain/measure/mask.ts` use. */
export interface StageOutput {
  readonly face: readonly FaceObservation[];
  readonly hand: readonly Float32Array[];
  readonly pose: Float32Array | null;
  readonly segmenter: CategoryMask;
}

export interface MediaPipeDeps {
  readonly registry: Pick<Registry, 'entry' | 'bytes'>;
  /** Logical URL of a manifest file (the WASM is fetched by it, through the allowlist and the registry). */
  readonly logicalUrl: (path: string) => string;
}

export interface MediaPipe {
  /** Fetches (or reads from the cache), verifies and creates one task; idempotence is the caller's. */
  load(model: CoreModel, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>>;
  run<S extends CoreModel>(stage: S, image: RgbaImage): Promise<StageOutput[S]>;
}

interface Tasks {
  face?: FaceLandmarker;
  hand?: HandLandmarker;
  pose?: PoseLandmarker;
  segmenter?: ImageSegmenter;
}

/** The package declares its fileset type without exporting it. */
type WasmFileset = Parameters<typeof FaceLandmarker.createFromOptions>[0];

/** Flattens landmarks into x, y, z (and visibility) values in a buffer of its own, so it can be transferred. */
function flatten(points: readonly NormalizedLandmark[], withVisibility: boolean): Float32Array {
  const stride = withVisibility ? 4 : 3;
  const out = new Float32Array(points.length * stride);
  points.forEach((p, i) => {
    out.set(withVisibility ? [p.x, p.y, p.z, p.visibility] : [p.x, p.y, p.z], i * stride);
  });
  return out;
}

function toError(e: unknown, model: CoreModel): AnalysisError {
  const message = e instanceof Error ? e.message : String(e);
  return failure(thrownCode(message), `creating the ${model} task: ${message}`, model);
}

/** Verified bytes of every file a task needs, with progress against the manifest's byte counts; returns the model file. */
async function fetchFiles(deps: MediaPipeDeps, model: CoreModel, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<Uint8Array<ArrayBuffer>, AnalysisError>> {
  const paths = [MEDIAPIPE_WASM, MODEL_FILES[model]];
  const totalBytes = paths.reduce((sum, p) => sum + (deps.registry.entry(p)?.bytes ?? 0), 0);
  let done = 0;
  let last: Uint8Array<ArrayBuffer> | null = null;
  for (const path of paths) {
    const got = await deps.registry.bytes(path, signal, (loaded, phase) => {
      onProgress({ model, phase, loadedBytes: done + loaded, totalBytes });
    });
    if (!got.ok) return err({ ...got.error, model });
    done += got.value.byteLength;
    last = got.value;
  }
  return last ? ok(last) : err({ code: 'internal', model, retryable: false, detail: 'no model file' });
}

/** Creates one task. `self.ModuleFactory` must be set right before, because creation consumes it. */
async function createTask(mp: typeof Vision, fileset: WasmFileset, model: CoreModel, modelAssetBuffer: Uint8Array, tasks: Tasks): Promise<void> {
  const baseOptions = { modelAssetBuffer, delegate: 'CPU' as const };
  switch (model) {
    case 'face':
      tasks.face = await mp.FaceLandmarker.createFromOptions(fileset, { baseOptions, runningMode: 'IMAGE', numFaces: 2, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true });
      return;
    case 'hand':
      tasks.hand = await mp.HandLandmarker.createFromOptions(fileset, { baseOptions, runningMode: 'IMAGE', numHands: 2 });
      return;
    case 'pose':
      tasks.pose = await mp.PoseLandmarker.createFromOptions(fileset, { baseOptions, runningMode: 'IMAGE', numPoses: 1 });
      return;
    case 'segmenter':
      tasks.segmenter = await mp.ImageSegmenter.createFromOptions(fileset, { baseOptions, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false });
      return;
  }
}

const missing = (stage: CoreModel): Error => new Error(`the ${stage} task is not loaded`);

function runFace(tasks: Tasks, image: ImageData): StageOutput['face'] {
  if (!tasks.face) throw missing('face');
  const r = tasks.face.detect(image);
  return r.faceLandmarks.map((points, i) => {
    const matrix = r.facialTransformationMatrixes[i]?.data;
    const categories = r.faceBlendshapes[i]?.categories ?? [];
    return {
      landmarks: flatten(points, false),
      matrix: matrix ? new Float32Array(matrix) : null,
      expression: Object.fromEntries(categories.map((c) => [c.categoryName, c.score])),
    };
  });
}

function runPose(tasks: Tasks, image: ImageData): StageOutput['pose'] {
  if (!tasks.pose) throw missing('pose');
  const r = tasks.pose.detect(image);
  const first = r.landmarks[0];
  r.close();
  return first ? flatten(first, true) : null;
}

function runSegmenter(tasks: Tasks, image: ImageData): StageOutput['segmenter'] {
  if (!tasks.segmenter) throw missing('segmenter');
  const r = tasks.segmenter.segment(image);
  const mask = r.categoryMask;
  // The mask belongs to the task: copy it, then close the result (closing a result is not closing the task).
  const out = mask ? { widthPx: mask.width, heightPx: mask.height, data: mask.getAsUint8Array().slice() } : { widthPx: 0, heightPx: 0, data: new Uint8Array(0) };
  r.close();
  return out;
}

function runners(tasks: Tasks): { readonly [S in CoreModel]: (image: ImageData) => StageOutput[S] } {
  return {
    face: (image) => runFace(tasks, image),
    hand: (image) => {
      if (!tasks.hand) throw missing('hand');
      return tasks.hand.detect(image).landmarks.map((points) => flatten(points, false));
    },
    pose: (image) => runPose(tasks, image),
    segmenter: (image) => runSegmenter(tasks, image),
  };
}

const imageData = (image: RgbaImage): ImageData =>
  new ImageData(new Uint8ClampedArray(image.data.buffer as ArrayBuffer, image.data.byteOffset, image.data.byteLength), image.widthPx, image.heightPx);

type Runtime = readonly [typeof Vision, { readonly default: unknown }];

/**
 * MediaPipe's JS: the tasks, and the loader whose default export is the factory every task needs. The loader is code,
 * so it ships in this build's own chunks rather than with the model files: a checked copy could not run from a `blob:` URL,
 * which `script-src` refuses, and a second fetch of the same URL could bring back other bytes.
 */
const importRuntime = (): Promise<Runtime> =>
  // @ts-expect-error The package ships no types for its loader module.
  Promise.all([import('@mediapipe/tasks-vision'), import('@mediapipe/tasks-vision/vision_wasm_module_internal.js')]) as Promise<Runtime>;

/** Creates the MediaPipe runner for one worker. */
export function createMediaPipe(deps: MediaPipeDeps): MediaPipe {
  const tasks: Tasks = {};
  const run = runners(tasks);
  let runtime: Promise<Runtime | null> | null = null;
  // One creation at a time: `self.ModuleFactory` is a global that each creation consumes.
  let creating: Promise<unknown> = Promise.resolve();

  async function create([mp, loader]: Runtime, model: CoreModel, buffer: Uint8Array): Promise<void> {
    (self as unknown as { ModuleFactory?: unknown }).ModuleFactory = loader.default;
    await createTask(mp, { wasmLoaderPath: '', wasmBinaryPath: deps.logicalUrl(MEDIAPIPE_WASM) }, model, buffer, tasks);
  }

  return {
    async load(model, signal, onProgress) {
      if (tasks[model]) return ok(undefined);
      // MediaPipe draws through WebGL on an OffscreenCanvas even on the CPU delegate; without it nothing can start.
      if (typeof OffscreenCanvas === 'undefined') return err({ code: 'unsupported', model, retryable: false, detail: 'no OffscreenCanvas in this worker' });
      const imported = await (runtime ??= importRuntime().catch(() => null));
      // A browser remembers a module that failed to load, so "Try again" could never work here: the screen offers a reload.
      if (!imported) return err(failure('boot_failed', 'the MediaPipe chunks did not load', model));
      const bytes = await fetchFiles(deps, model, signal, onProgress);
      if (!bytes.ok) return bytes;
      if (signal.aborted) return err({ code: 'aborted', model, retryable: true, detail: `load of ${model} stopped` });
      onProgress({ model, phase: 'start', loadedBytes: bytes.value.byteLength, totalBytes: bytes.value.byteLength });
      const next = creating.then(() => create(imported, model, bytes.value));
      creating = next.catch(() => undefined);
      return next.then(
        () => ok(undefined),
        (e: unknown) => err(toError(e, model)),
      );
    },
    run: (stage, image) => Promise.resolve(run[stage](imageData(image))),
  };
}
