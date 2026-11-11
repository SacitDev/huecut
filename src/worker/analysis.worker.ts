/**
 * The analysis worker's entry: observers and the fetch allowlist go in first, before any
 * model runtime is imported (MediaPipe and Transformers.js load lazily on the first `load`); then Comlink exposes
 * the service and the worker posts `ready`. Started from the blob bootstrap of `platform/analysis/bootstrap.ts`.
 */
import { expose } from 'comlink';
import manifest from '../../models.manifest.json';
import type { RgbaImage } from '../domain/measure/mask.ts';
import { createRegistryFetch, installFetchAllowlist } from './allowlist.ts';
import { createMediaPipe } from './models/mediapipe.ts';
import { createExtras, webGpuAdapter } from './models/transformers.ts';
import { observeWorker, type CanvasPrototype } from './observe.ts';
import type { BootMessage, ModelId } from './protocol.ts';
import { createRegistry, type ModelManifest } from './registry.ts';
import { createAnalysisService, decodePhoto } from './service.ts';
import { readFocal35 } from './exif.ts';
import { workerUrls } from './urls.ts';

// The face tools draw through WebGL on an OffscreenCanvas, even on the CPU delegate. Some engines have no OffscreenCanvas in
// workers, and some have one without WebGL (Safari 16.4 to 16.7, WebKit on Linux): the worker still boots, and `load` says
// `unsupported` before anything is fetched. Probed before the observer wraps `getContext`, so the probe is never counted.
const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
const hasOffscreenWebGL = hasOffscreenCanvas && (new OffscreenCanvas(1, 1).getContext('webgl2') ?? new OffscreenCanvas(1, 1).getContext('webgl')) !== null;
const missingFeature = hasOffscreenWebGL ? null : hasOffscreenCanvas ? 'WebGL on an OffscreenCanvas' : 'OffscreenCanvas';
const observer = observeWorker(self, hasOffscreenCanvas ? (OffscreenCanvas.prototype as unknown as CanvasPrototype) : null);
const urls = workerUrls();
const ownFetch = self.fetch.bind(self);
const registry = createRegistry({ manifest: manifest as ModelManifest, caches: self.caches, fetch: ownFetch, fileUrl: urls.modelFile });
installFetchAllowlist(self, { urls, registry, fetch: ownFetch, onBlocked: observer.countBlocked, onServed: observer.countServed });
void registry.prune();

const mediapipe = createMediaPipe({ registry, logicalUrl: urls.logical });
const extras = createExtras({
  registry,
  fetch: createRegistryFetch({ urls, registry, onServed: observer.countServed, onUnlisted: observer.countUnlisted }),
  logicalUrl: urls.logical,
  adapter: webGpuAdapter,
});
const isCore = (m: ModelId): m is 'face' | 'hand' | 'pose' | 'segmenter' => m !== 'depth' && m !== 'sam';
const toBitmap = (image: RgbaImage): Promise<ImageBitmap> =>
  createImageBitmap(new ImageData(new Uint8ClampedArray(image.data.buffer as ArrayBuffer, image.data.byteOffset, image.data.byteLength), image.widthPx, image.heightPx));

expose(
  createAnalysisService({
    decode: decodePhoto,
    readFocal35,
    loadModel: (model, signal, onProgress) => (isCore(model) ? mediapipe.load(model, signal, onProgress) : extras.load(model, signal, onProgress)),
    runStage: (stage, image) => mediapipe.run(stage, image),
    extras,
    toBitmap,
    missingFeature,
    diagnostics: observer.snapshot,
  }),
);
self.postMessage({ type: 'ready' } satisfies BootMessage);
