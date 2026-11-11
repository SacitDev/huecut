/**
 * Depth Anything V2 Small and SAM 2.1 tiny through Transformers.js in the analysis worker:
 * WebGPU with the fp16 files when the adapter has `shader-f16`, else WASM with the int8 files; no cache
 * of its own, the self-hosted ONNX Runtime WASM, and every file through the registry's hash-verifying fetch.
 */
import type * as Transformers from '@huggingface/transformers';
import type { PhotoId } from '../../domain/ids.ts';
import type { RgbaImage } from '../../domain/measure/mask.ts';
import { err, ok, type Result } from '../../domain/result.ts';
import type { AnalysisError, DepthMap, ExtraModel, LoadProgress, Mask, TapPoint } from '../protocol.ts';
import type { Registry } from '../registry.ts';
import { failure, thrownCode } from '../service-extras.ts';

type Tjs = typeof Transformers;
type Tensor = Transformers.Tensor;

/** The ONNX Runtime WASM of the build Transformers.js bundles; its JS factory is inside the worker chunk. */
export const ORT_WASM = 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm';
/** Depth input short side, a multiple of 14. */
export const DEPTH_SHORT_SIDE_PX = 252;

export type Backend = 'webgpu' | 'wasm';
const DTYPE = { webgpu: 'fp16', wasm: 'int8' } as const satisfies Record<Backend, string>;

/** Each model's folder (its logical path prefix) and the files Transformers.js asks for, per dtype. */
export const EXTRA_FILES: Readonly<Record<ExtraModel, { readonly id: string; readonly files: (dtype: string) => readonly string[] }>> = {
  depth: { id: 'depth-anything-v2-small', files: (d) => ['config.json', 'preprocessor_config.json', `onnx/model_${d}.onnx`] },
  sam: {
    id: 'sam2.1-hiera-tiny',
    files: (d) => ['config.json', 'preprocessor_config.json', ...['vision_encoder', 'prompt_encoder_mask_decoder'].flatMap((n) => [`onnx/${n}_${d}.onnx`, `onnx/${n}_${d}.onnx_data`])],
  },
};

/** The part of a WebGPU adapter the backend choice reads. */
export interface GpuAdapterLike {
  readonly features: { has(feature: string): boolean };
}

export interface TransformersDeps {
  readonly registry: Pick<Registry, 'entry' | 'bytes'>;
  /** `env.fetch`: manifest files from the registry, anything else a 404 (`createRegistryFetch`). */
  readonly fetch: typeof fetch;
  /** Logical URL of a manifest path; `''` gives the models folder itself. */
  readonly logicalUrl: (path: string) => string;
  /** The WebGPU adapter, or null without WebGPU. */
  readonly adapter: () => Promise<GpuAdapterLike | null>;
}

export interface Extras {
  /** Fetches (or reads from the cache) and verifies every file of one model with progress, then starts it. */
  load(model: ExtraModel, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>>;
  /** The backend the extras run on, once one has started. */
  backend(): Backend | null;
  depth(image: RgbaImage): Promise<DepthMap>;
  /** The hair SAM finds from the taps, at the image's size; the photo's embedding is kept for the next tap. */
  selectHair(photoId: PhotoId, image: RgbaImage, points: readonly TapPoint[]): Promise<Mask>;
  /** Frees the kept embedding when it belongs to this photo. */
  release(photoId: PhotoId): void;
}

interface DepthParts {
  readonly model: Transformers.PreTrainedModel;
  readonly processor: Transformers.ImageProcessor;
}
interface SamParts {
  readonly model: Transformers.Sam2Model;
  readonly processor: Transformers.SamImageProcessor;
}
/** One photo's image embedding (about 16 MB) and the sizes its taps are mapped through, as [height, width]. */
interface Embedding {
  readonly photoId: PhotoId;
  readonly tensors: Record<string, Tensor>;
  readonly original: [number, number];
  readonly reshaped: [number, number];
}
interface State {
  readonly deps: TransformersDeps;
  library: Promise<Tjs> | null;
  backend: Promise<Backend> | null;
  started: Backend | null;
  ortVerified: boolean;
  depth: DepthParts | null;
  sam: SamParts | null;
  embedding: Embedding | null;
  /** The tap in progress, if any, and whether its photo was released meanwhile. */
  tap: { readonly photoId: PhotoId; released: boolean } | null;
}

/** The WebGPU adapter of this worker, asked for as ONNX Runtime asks for it. */
export const webGpuAdapter = (): Promise<GpuAdapterLike | null> => {
  const gpu = (navigator as { gpu?: { requestAdapter(o: { powerPreference: 'high-performance' }): Promise<GpuAdapterLike | null> } }).gpu;
  return gpu ? gpu.requestAdapter({ powerPreference: 'high-performance' }) : Promise.resolve(null);
};

/** Imports Transformers.js once and fences it: no cache of its own, local files only, the registry's fetch. */
async function library(deps: TransformersDeps): Promise<Tjs> {
  const tjs = await import('@huggingface/transformers');
  const { env } = tjs;
  // The registry owns caching; without useWasmCache = false ONNX Runtime would cache its WASM itself.
  env.useBrowserCache = false;
  env.useWasmCache = false;
  env.useFSCache = false;
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = deps.logicalUrl('');
  env.fetch = deps.fetch;
  const wasm = env.backends.onnx.wasm;
  if (!wasm) throw new Error('Transformers.js exposes no ONNX Runtime WASM settings');
  // The WASM path only: the bundled build then runs the factory inside this chunk and imports no .mjs.
  wasm.wasmPaths = { wasm: deps.logicalUrl(ORT_WASM) };
  // GitHub Pages gives no cross-origin isolation, so WASM is single-threaded.
  wasm.numThreads = 1;
  wasm.proxy = false;
  return tjs;
}

const chooseBackend = async (deps: TransformersDeps): Promise<Backend> => {
  const adapter = await deps.adapter().catch(() => null);
  return adapter?.features.has('shader-f16') ? 'webgpu' : 'wasm';
};

/** Verified bytes of every file, in turn, with one progress count against the manifest's byte counts. */
async function verifyFiles(deps: TransformersDeps, model: ExtraModel, paths: readonly string[], signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<number, AnalysisError>> {
  const totalBytes = paths.reduce((sum, p) => sum + (deps.registry.entry(p)?.bytes ?? 0), 0);
  let done = 0;
  for (const path of paths) {
    const got = await deps.registry.bytes(path, signal, (loaded, phase) => {
      onProgress({ model, phase, loadedBytes: done + loaded, totalBytes });
    });
    if (!got.ok) return err({ ...got.error, model });
    done += got.value.byteLength;
  }
  return ok(totalBytes);
}

const options = (backend: Backend): Transformers.PretrainedModelOptions => ({ device: backend, dtype: DTYPE[backend] });

async function startDepth(tjs: Tjs, backend: Backend): Promise<DepthParts> {
  const { id } = EXTRA_FILES.depth;
  const [model, processor] = await Promise.all([tjs.AutoModelForDepthEstimation.from_pretrained(id, options(backend)), tjs.AutoImageProcessor.from_pretrained(id)]);
  // With keep_aspect_ratio and ensure_multiple_of 14 the side nearer its target is fitted: the short side, 252 px.
  processor.size = { height: DEPTH_SHORT_SIDE_PX, width: DEPTH_SHORT_SIDE_PX };
  return { model, processor };
}

async function startSam(tjs: Tjs, backend: Backend): Promise<SamParts> {
  const { id } = EXTRA_FILES.sam;
  const [model, processor] = await Promise.all([tjs.Sam2Model.from_pretrained(id, options(backend)), tjs.AutoImageProcessor.from_pretrained(id)]);
  if (!(model instanceof tjs.Sam2Model) || !(processor instanceof tjs.SamImageProcessor)) throw new Error('the SAM files did not load as Sam2Model and SamImageProcessor');
  return { model, processor };
}

function toError(e: unknown, model: ExtraModel, backend: Backend): AnalysisError {
  const message = e instanceof Error ? e.message : String(e);
  return failure(thrownCode(message), `starting ${model} on ${backend}: ${message}`, model);
}

async function load(state: State, model: ExtraModel, signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>> {
  if (state[model]) return ok(undefined);
  const backend = await (state.backend ??= chooseBackend(state.deps));
  const { id, files } = EXTRA_FILES[model];
  const paths = [...(state.ortVerified ? [] : [ORT_WASM]), ...files(DTYPE[backend]).map((f) => `${id}/${f}`)];
  const verified = await verifyFiles(state.deps, model, paths, signal, onProgress);
  if (!verified.ok) return verified;
  state.ortVerified = true;
  if (signal.aborted) return err({ code: 'aborted', model, retryable: true, detail: `load of ${model} stopped` });
  onProgress({ model, phase: 'start', loadedBytes: verified.value, totalBytes: verified.value });
  return start(state, model, backend);
}

/** Imports the library (once; a failed import is tried again next time) and starts one model's sessions. */
async function start(state: State, model: ExtraModel, backend: Backend): Promise<Result<void, AnalysisError>> {
  let tjs: Tjs;
  try {
    tjs = await (state.library ??= library(state.deps));
  } catch (e) {
    state.library = null;
    return err(toError(e, model, backend));
  }
  try {
    if (model === 'depth') state.depth = await startDepth(tjs, backend);
    else state.sam = await startSam(tjs, backend);
    state.started = backend;
    return ok(undefined);
  } catch (e) {
    return err(toError(e, model, backend));
  }
}

const rgba = (tjs: Tjs, image: RgbaImage): Transformers.RawImage => new tjs.RawImage(image.data, image.widthPx, image.heightPx, 4);
const asFloat32 = (t: Tensor): Float32Array => (t.type === 'float32' ? t : t.to('float32')).data as Float32Array;

/** Relative depth scaled to 0-1 (Depth Anything gives inverse depth, so 1 is the nearest point). */
function normalised(values: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const range = max - min;
  return values.map((v) => (range > 0 ? (v - min) / range : 0));
}

async function runDepth(tjs: Tjs, parts: DepthParts, image: RgbaImage): Promise<DepthMap> {
  const { pixel_values } = await parts.processor._call(rgba(tjs, image));
  const out = (await parts.model._call({ pixel_values })) as { predicted_depth: Tensor };
  const [heightPx = 0, widthPx = 0] = out.predicted_depth.dims.slice(-2);
  const data = normalised(asFloat32(out.predicted_depth));
  pixel_values.dispose();
  out.predicted_depth.dispose();
  return { widthPx, heightPx, data };
}

function dropEmbedding(state: State): void {
  for (const t of Object.values(state.embedding?.tensors ?? {})) t.dispose();
  state.embedding = null;
}

/** The kept embedding when it is this photo's, else a new one from the encoder (the slow first tap). */
async function embedding(tjs: Tjs, state: State, sam: SamParts, photoId: PhotoId, image: RgbaImage): Promise<Embedding> {
  if (state.embedding?.photoId === photoId) return state.embedding;
  dropEmbedding(state);
  const processed = await sam.processor._call([rgba(tjs, image)]);
  const tensors = await sam.model.get_image_embeddings({ pixel_values: processed.pixel_values });
  processed.pixel_values.dispose();
  const original = processed.original_sizes[0];
  const reshaped = processed.reshaped_input_sizes[0];
  if (!original || !reshaped) throw new Error('the SAM processor gave no image sizes');
  state.embedding = { photoId, tensors, original, reshaped };
  return state.embedding;
}

/**
 * One low-resolution mask (`lowW` x `lowH` logits covering the padded model input) sampled bilinearly at every
 * pixel of the `w` x `h` image, which filled `reshaped` of `pad`; a logit above 0 is hair (255).
 */
export function upsampleMask(logits: Float32Array, lowW: number, lowH: number, w: number, h: number, reshaped: readonly [number, number], pad: { readonly height: number; readonly width: number }): Uint8Array {
  const sx = ((reshaped[1] / w) * lowW) / pad.width;
  const sy = ((reshaped[0] / h) * lowH) / pad.height;
  const at = (x: number, y: number): number => logits[Math.min(lowH - 1, Math.max(0, y)) * lowW + Math.min(lowW - 1, Math.max(0, x))] ?? 0;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) * sy - 0.5;
    const y0 = Math.floor(v);
    const fy = v - y0;
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) * sx - 0.5;
      const x0 = Math.floor(u);
      const fx = u - x0;
      const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
      const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
      out[y * w + x] = top * (1 - fy) + bottom * fy > 0 ? 255 : 0;
    }
  }
  return out;
}

async function runSam(tjs: Tjs, state: State, sam: SamParts, photoId: PhotoId, image: RgbaImage, points: readonly TapPoint[]): Promise<Mask> {
  const e = await embedding(tjs, state, sam, photoId, image);
  const [h, w] = e.original;
  const input_points = sam.processor.reshape_input_points([points.map((p) => [p.x * w, p.y * h])], [e.original], [e.reshaped]);
  const input_labels = sam.processor.add_input_labels([points.map((p) => (p.include ? 1 : 0))], input_points);
  const out = await sam.model._call({ ...e.tensors, input_points, input_labels });
  const scores = asFloat32(out.iou_scores);
  const best = scores.indexOf(Math.max(...scores));
  const [lowH = 256, lowW = 256] = out.pred_masks.dims.slice(-2);
  const logits = asFloat32(out.pred_masks).subarray(best * lowW * lowH, (best + 1) * lowW * lowH);
  const pad = (sam.processor.pad_size ?? sam.processor.size) as { height: number; width: number };
  const data = upsampleMask(logits, lowW, lowH, image.widthPx, image.heightPx, e.reshaped, pad);
  for (const t of [input_points, input_labels, out.iou_scores, out.pred_masks, out.object_score_logits]) t.dispose();
  return { widthPx: image.widthPx, heightPx: image.heightPx, data };
}

/** Creates the extras of one worker; nothing is imported or downloaded until the first `load`. */
export function createExtras(deps: TransformersDeps): Extras {
  const state: State = { deps, library: null, backend: null, started: null, ortVerified: false, depth: null, sam: null, embedding: null, tap: null };
  const ready = async <K extends 'depth' | 'sam'>(model: K): Promise<{ tjs: Tjs; parts: NonNullable<State[K]> }> => {
    const parts = state[model];
    if (!parts || !state.library) throw new Error(`the ${model} model is not loaded`);
    return { tjs: await state.library, parts };
  };
  return {
    load: (model, signal, onProgress) => load(state, model, signal, onProgress),
    backend: () => state.started,
    depth: async (image) => {
      const { tjs, parts } = await ready('depth');
      return runDepth(tjs, parts, image);
    },
    selectHair: async (photoId, image, points) => {
      const { tjs, parts } = await ready('sam');
      // A `release` that comes meanwhile takes effect at the end, so tensors are never freed under the decoder.
      const tap = { photoId, released: false };
      state.tap = tap;
      try {
        return await runSam(tjs, state, parts, photoId, image, points);
      } finally {
        state.tap = null;
        if (tap.released) dropEmbedding(state);
      }
    },
    release(photoId) {
      if (state.tap?.photoId === photoId) state.tap.released = true;
      else if (state.embedding?.photoId === photoId) dropEmbedding(state);
    },
  };
}
