/** Tap-to-select's kept embedding against `release`, with Transformers.js faked: the encoder and the decoder wait on gates. */
import { beforeEach, expect, it, vi } from 'vitest';
import { asPhotoId } from '../../domain/ids.ts';
import { ok } from '../../domain/result.ts';
import { createExtras } from './transformers.ts';

const tjs = vi.hoisted(() => {
  const tensor = () => ({ type: 'float32', data: new Float32Array(16).fill(1), dims: [4, 4], dispose: vi.fn() });
  const run = { embeddings: [] as ReturnType<typeof tensor>[], encoderGate: Promise.resolve(), decoderGate: Promise.resolve(), encoded: (() => undefined) as () => void, decoding: (() => undefined) as () => void };
  class SamImageProcessor {
    pad_size = { height: 4, width: 4 };
    _call = () => Promise.resolve({ pixel_values: tensor(), original_sizes: [[4, 4]], reshaped_input_sizes: [[4, 4]] });
    reshape_input_points = () => tensor();
    add_input_labels = () => tensor();
  }
  class Sam2Model {
    static from_pretrained = () => Promise.resolve(new Sam2Model());
    get_image_embeddings = vi.fn(async () => {
      run.encoded();
      await run.encoderGate;
      const embedding = tensor();
      run.embeddings.push(embedding);
      return { image_embeddings: embedding };
    });
    _call = vi.fn(async () => {
      run.decoding();
      await run.decoderGate;
      return { iou_scores: tensor(), pred_masks: tensor(), object_score_logits: tensor() };
    });
  }
  return { run, module: { env: { backends: { onnx: { wasm: {} } } }, Sam2Model, SamImageProcessor, AutoImageProcessor: { from_pretrained: () => Promise.resolve(new SamImageProcessor()) }, RawImage: Object } };
});
vi.mock('@huggingface/transformers', () => tjs.module);

const PHOTO = asPhotoId('p');
const image = { widthPx: 4, heightPx: 4, data: new Uint8ClampedArray(64) };
const tap = [{ x: 0.5, y: 0.5, include: true }];

const gate = () => {
  let open = (): void => undefined;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
};
const reached = (set: (hit: () => void) => void) => new Promise<void>((resolve) => { set(resolve); });

async function started() {
  const extras = createExtras({ registry: { entry: () => undefined, bytes: () => Promise.resolve(ok(new Uint8Array(1))) }, fetch: globalThis.fetch, logicalUrl: (p) => p, adapter: () => Promise.resolve(null) });
  expect((await extras.load('sam', new AbortController().signal, () => undefined)).ok).toBe(true);
  return extras;
}

beforeEach(() => {
  tjs.run.embeddings.length = 0;
  tjs.run.encoderGate = Promise.resolve();
  tjs.run.decoderGate = Promise.resolve();
  tjs.run.encoded = () => undefined;
  tjs.run.decoding = () => undefined;
});

it('frees the embedding of a photo released while its encoder ran, instead of keeping it', async () => {
  const extras = await started();
  const encoder = gate();
  tjs.run.encoderGate = encoder.opened;
  const inEncoder = reached((hit) => (tjs.run.encoded = hit));
  const running = extras.selectHair(PHOTO, image, tap);
  await inEncoder;
  extras.release(PHOTO);
  encoder.open();
  await running;
  expect(tjs.run.embeddings[0]?.dispose).toHaveBeenCalledOnce();
  await extras.selectHair(PHOTO, image, tap);
  expect(tjs.run.embeddings).toHaveLength(2); // nothing was kept, so the next tap encodes again
});

it('leaves the tensors alone while the decoder is using them, and frees them when it has finished', async () => {
  const extras = await started();
  const decoder = gate();
  tjs.run.decoderGate = decoder.opened;
  const inDecoder = reached((hit) => (tjs.run.decoding = hit));
  const running = extras.selectHair(PHOTO, image, tap);
  await inDecoder;
  extras.release(PHOTO);
  expect(tjs.run.embeddings[0]?.dispose).not.toHaveBeenCalled();
  decoder.open();
  await running;
  expect(tjs.run.embeddings[0]?.dispose).toHaveBeenCalledOnce();
});

it('keeps the embedding across taps and frees it at once on a release between them', async () => {
  const extras = await started();
  await extras.selectHair(PHOTO, image, tap);
  await extras.selectHair(PHOTO, image, tap);
  expect(tjs.run.embeddings).toHaveLength(1);
  extras.release(PHOTO);
  expect(tjs.run.embeddings[0]?.dispose).toHaveBeenCalledOnce();
});
