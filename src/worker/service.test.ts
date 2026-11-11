/** The worker service with fake browser parts: idempotent loads, degraded mode, stage order, cancellation and the extras. */
import { describe, expect, it, vi } from 'vitest';
import { asOpId, asPhotoId } from '../domain/ids.ts';
import type { RgbaImage } from '../domain/measure/mask.ts';
import { ok, type Result } from '../domain/result.ts';
import type { StageOutput } from './models/mediapipe.ts';
import type { AnalysisError, CoreModel, LoadProgress, Mask, ModelId } from './protocol.ts';
import { createAnalysisService, type ServiceDeps } from './service.ts';

const photo = { id: asPhotoId('p'), blob: new Blob([new Uint8Array(4)]) };
/** The error code of a result, or 'ok'. */
const codeOf = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);
const W = 20;
/** The segmenter sees hair in the top 5 rows; SAM (the fake) in the top 10. */
const segments = new Uint8Array(W * W).map((_, i) => (i < 5 * W ? 1 : 3));
const samHair: Mask = { widthPx: W, heightPx: W, data: new Uint8Array(W * W).map((_, i) => (i < 10 * W ? 255 : 0)) };
const outputs: StageOutput = {
  face: [{ landmarks: new Float32Array(478 * 3), matrix: null, expression: {} }],
  hand: [new Float32Array(63)],
  pose: new Float32Array(132),
  segmenter: { widthPx: W, heightPx: W, data: segments },
};
const image = (): RgbaImage => ({ widthPx: W, heightPx: W, data: new Uint8ClampedArray(W * W * 4).map((_, i) => (i % 4 === 3 ? 255 : 60)) });

function deps(overrides: Partial<ServiceDeps> = {}) {
  const stages: CoreModel[] = [];
  const painted: RgbaImage[] = [];
  const release = vi.fn();
  const base: ServiceDeps = {
    decode: () => Promise.resolve(ok(image())),
    readFocal35: () => Promise.resolve(null),
    loadModel: vi.fn((): Promise<Result<void, AnalysisError>> => Promise.resolve(ok(undefined))),
    runStage: <S extends CoreModel>(stage: S): Promise<StageOutput[S]> => {
      stages.push(stage);
      return Promise.resolve(outputs[stage]);
    },
    extras: {
      depth: () => Promise.resolve({ widthPx: 252, heightPx: 336, data: new Float32Array(252 * 336) }),
      selectHair: () => Promise.resolve({ ...samHair, data: samHair.data.slice() }),
      release,
      backend: () => 'wasm',
    },
    toBitmap: (picture) => {
      painted.push(picture);
      return Promise.resolve({ width: picture.widthPx, height: picture.heightPx, close: () => undefined } as ImageBitmap);
    },
    missingFeature: null,
    diagnostics: () => ({ blocked: {}, served: {}, unlisted: {}, violations: [], webgl: { created: 0, lost: 0 } }),
    ...overrides,
  };
  return { deps: base, stages, painted, release };
}

const failing = (failed: readonly ModelId[]) =>
  vi.fn((model: ModelId): Promise<Result<void, AnalysisError>> =>
    Promise.resolve(failed.includes(model) ? { ok: false, error: { code: 'network', model, retryable: true, detail: 'fake' } } : ok(undefined)),
  );

it('loads each model once, however often it is asked', async () => {
  const { deps: d } = deps();
  const service = createAnalysisService(d);
  await Promise.all([service.load(asOpId(1), ['face', 'hand'], () => undefined), service.load(asOpId(2), ['face'], () => undefined)]);
  const again = await service.load(asOpId(3), ['face', 'hand'], () => undefined);
  expect(again.ok && again.value).toEqual({ mediapipe: 'cpu', extras: 'wasm', loaded: ['face', 'hand'], missing: [] });
  expect(d.loadModel).toHaveBeenCalledTimes(2);
});

it('says unsupported before any model is fetched or started when the engine has no OffscreenCanvas', async () => {
  const { deps: d } = deps({ missingFeature: 'OffscreenCanvas' });
  const service = createAnalysisService(d);
  const core = await service.load(asOpId(1), ['face', 'hand', 'pose', 'segmenter'], () => undefined);
  const extra = await service.load(asOpId(2), ['depth'], () => undefined);
  expect(core.ok ? null : core.error).toMatchObject({ code: 'unsupported', model: 'face', retryable: false, detail: 'no OffscreenCanvas in this worker' });
  expect(codeOf(extra)).toBe('unsupported');
  expect(d.loadModel).not.toHaveBeenCalled();
  expect(codeOf(await service.analyse(asOpId(3), photo))).toBe('internal');
});

it('is degraded, not failed, when the face model loads but another core model does not', async () => {
  const service = createAnalysisService(deps({ loadModel: failing(['pose']) }).deps);
  const r = await service.load(asOpId(1), ['face', 'hand', 'pose', 'segmenter'], () => undefined);
  expect(r.ok && r.value.missing).toEqual(['pose']);
});

it('fails the load when the face model fails', async () => {
  const service = createAnalysisService(deps({ loadModel: failing(['face']) }).deps);
  const r = await service.load(asOpId(1), ['face', 'hand'], () => undefined);
  expect((r.ok ? null : r.error)).toMatchObject({ code: 'network', model: 'face' });
});

it('throttles progress to one message per 100 ms per phase, always sending the last', async () => {
  let t = 0;
  const loadModel = (model: ModelId, _signal: AbortSignal, onProgress: (p: LoadProgress) => void): Promise<Result<void, AnalysisError>> => {
    for (let i = 1; i <= 100; i++) {
      t += 5;
      onProgress({ model, phase: 'download', loadedBytes: i, totalBytes: 100 });
    }
    return Promise.resolve(ok(undefined));
  };
  const service = createAnalysisService(deps({ loadModel, now: () => t }).deps);
  const seen: LoadProgress[] = [];
  await service.load(asOpId(1), ['face'], (p) => seen.push(p));
  expect(seen.length).toBeLessThanOrEqual(6);
  expect(seen.at(-1)?.loadedBytes).toBe(100);
});

it('runs only the loaded stages, in order, and returns the observation with the mask measures', async () => {
  const { deps: d, stages } = deps();
  const service = createAnalysisService(d);
  await service.load(asOpId(1), ['segmenter', 'face'], () => undefined);
  const r = await service.analyse(asOpId(2), photo);
  expect(stages).toEqual(['face', 'segmenter']);
  expect(r.ok && r.value.ran).toEqual(['face', 'segmenter']);
  expect(r.ok && r.value.hair?.coverage).toBe(0.25);
  expect(r.ok && r.value.previewMask?.heightPx).toBe(256);
  expect(r.ok && r.value.pose).toBeNull();
});

it('stops at the next stage boundary when cancelled', async () => {
  let service: ReturnType<typeof createAnalysisService> | null = null;
  const { deps: d, stages } = deps({
    runStage: <S extends CoreModel>(stage: S): Promise<StageOutput[S]> => {
      stages.push(stage);
      if (stage === 'hand') service?.cancel(asOpId(9));
      return Promise.resolve(outputs[stage]);
    },
  });
  service = createAnalysisService(d);
  await service.load(asOpId(1), ['face', 'hand', 'pose', 'segmenter'], () => undefined);
  const r = await service.analyse(asOpId(9), photo);
  expect(codeOf(r)).toBe('aborted');
  expect(stages).toEqual(['face', 'hand']);
});

it('passes a decode failure through and refuses to analyse before any load', async () => {
  const service = createAnalysisService(deps({ decode: () => Promise.resolve({ ok: false, error: { code: 'decode_failed', retryable: false, detail: 'heic' } }) }).deps);
  const early = await service.analyse(asOpId(1), photo);
  expect(codeOf(early)).toBe('internal');
  await service.load(asOpId(2), ['face'], () => undefined);
  const r = await service.analyse(asOpId(3), photo);
  expect(codeOf(r)).toBe('decode_failed');
});

it('turns a stage that throws into a Result, out of memory included', async () => {
  const service = createAnalysisService(
    deps({
      runStage: () => Promise.reject(new Error('Aborted(OOM): out of memory')),
    }).deps,
  );
  await service.load(asOpId(1), ['face'], () => undefined);
  const r = await service.analyse(asOpId(2), photo);
  expect(codeOf(r)).toBe('out_of_memory');
});

it.each(['memory access out of bounds', 'Aborted(OOM)', 'Array buffer allocation failed'])('reports the runtime failure "%s" as out of memory', async (message) => {
  const service = createAnalysisService(deps({ runStage: () => Promise.reject(new Error(message)) }).deps);
  await service.load(asOpId(1), ['face'], () => undefined);
  expect(codeOf(await service.analyse(asOpId(2), photo))).toBe('out_of_memory');
});

describe('extras', () => {
  it('gives depth only after the depth model loaded, at the extras’ size', async () => {
    const service = createAnalysisService(deps().deps);
    expect(codeOf(await service.depth(asOpId(1), photo))).toBe('internal');
    await service.load(asOpId(2), ['depth'], () => undefined);
    const r = await service.depth(asOpId(3), photo);
    expect(r.ok && [r.value.widthPx, r.value.heightPx]).toEqual([252, 336]);
  });

  it('measures the refined hair over the segmenter’s face skin, sensing each photo once across taps', async () => {
    const { deps: d, stages, release } = deps();
    const service = createAnalysisService(d);
    await service.load(asOpId(1), ['face', 'segmenter', 'sam'], () => undefined);
    const first = await service.selectHair(asOpId(2), photo, [{ x: 0.5, y: 0.2, include: true }]);
    const later = await service.selectHair(asOpId(3), photo, [{ x: 0.5, y: 0.2, include: true }, { x: 0.5, y: 0.9, include: false }]);
    expect(first.ok && first.value.measures.coverage).toBe(0.5);
    expect(later.ok && later.value.mask.data.length).toBe(W * W);
    expect(stages).toEqual(['segmenter', 'face']);
    service.release(photo.id);
    expect(release).toHaveBeenCalledWith(photo.id);
    await service.selectHair(asOpId(4), photo, [{ x: 0.5, y: 0.2, include: true }]);
    expect(stages).toEqual(['segmenter', 'face', 'segmenter', 'face']);
  });

  it('measures SAM’s hair alone, with no hairline, where the core tools are not in this worker', async () => {
    const service = createAnalysisService(deps().deps);
    await service.load(asOpId(1), ['sam'], () => undefined);
    const r = await service.selectHair(asOpId(2), photo, [{ x: 0.5, y: 0.2, include: true }]);
    expect(r.ok && r.value.measures).toMatchObject({ coverage: 0.5, hairlineVisible: false });
    expect(codeOf(await service.selectHair(asOpId(3), photo, []))).toBe('internal');
  });

});

describe('tint', () => {
  it('tints inside a mask copy and leaves every other pixel as decoded', async () => {
    const { deps: d, painted } = deps();
    const service = createAnalysisService(d);
    const lab = { l: 80, a: 0, b: 20 };
    const targets = { root: { shadows: lab, mid: lab, light: lab }, mids: null, ends: null };
    const r = await service.tint(asOpId(1), photo, { kind: 'targets', targets }, samHair);
    expect(codeOf(r)).toBe('ok');
    const out = painted[0]?.data ?? new Uint8ClampedArray();
    expect(Array.from(out.subarray(10 * W * 4))).toEqual(Array.from(image().data.subarray(10 * W * 4)));
    expect(out[0]).toBeGreaterThan(60);
  });

  it('closes the bitmap and answers aborted when it was cancelled while the bitmap was being made', async () => {
    const close = vi.fn();
    let service: ReturnType<typeof createAnalysisService> | null = null;
    const { deps: d } = deps({
      toBitmap: () => {
        service?.cancel(asOpId(1));
        return Promise.resolve({ close } as unknown as ImageBitmap);
      },
    });
    service = createAnalysisService(d);
    const r = await service.tint(asOpId(1), photo, { kind: 'targets', targets: { root: null, mids: null, ends: null } }, samHair);
    expect(codeOf(r)).toBe('aborted');
    expect(close).toHaveBeenCalledOnce();
  });

  it('needs the segmenter for an automatic mask and for an AI picture, and says when a picture has no hair', async () => {
    const service = createAnalysisService(deps().deps);
    const targets = { root: null, mids: null, ends: null };
    expect(codeOf(await service.tint(asOpId(1), photo, { kind: 'targets', targets }, 'auto'))).toBe('internal');
    const bald = createAnalysisService(deps({ runStage: <S extends CoreModel>(stage: S) => Promise.resolve({ ...outputs, segmenter: { widthPx: W, heightPx: W, data: new Uint8Array(W * W) } }[stage]) }).deps);
    await bald.load(asOpId(2), ['segmenter'], () => undefined);
    expect(codeOf(await bald.tint(asOpId(3), photo, { kind: 'picture', blob: photo.blob }, samHair))).toBe('decode_failed');
  });
});

describe('tint on short hair', () => {
  // The fake segmenter's hair is the top 5 rows with face skin right below it, so every column ends on the face: short hair.
  it('short hair: a look takes one flat colour, while an AI picture keeps its own root-to-ends colours', async () => {
    const dark = { l: 20, a: 0, b: 5 };
    const light = { l: 88, a: 0, b: 5 };
    const band = (lab: typeof dark) => ({ shadows: lab, mid: lab, light: lab });
    const greyRow = (row: number): number => (row < 2 ? 30 : row >= 3 ? 220 : 120);
    const aiPicture = (): RgbaImage => ({
      widthPx: W,
      heightPx: W,
      data: new Uint8ClampedArray(W * W * 4).map((_, i) => (i % 4 === 3 ? 255 : greyRow(Math.floor(i / 4 / W)))),
    });
    const spread = (out: RgbaImage | undefined): number => (out?.data[4 * W * 4] ?? 0) - (out?.data[0] ?? 0);

    const look = deps();
    const lookService = createAnalysisService(look.deps);
    await lookService.load(asOpId(1), ['segmenter'], () => undefined);
    const targets = { root: band(dark), mids: null, ends: band(light) };
    expect(codeOf(await lookService.tint(asOpId(2), photo, { kind: 'targets', targets }, 'auto'))).toBe('ok');
    expect(Math.abs(spread(look.painted[0]))).toBeLessThan(10);

    let decodes = 0;
    const ai = deps({ decode: () => Promise.resolve(ok(decodes++ === 0 ? image() : aiPicture())) });
    const aiService = createAnalysisService(ai.deps);
    await aiService.load(asOpId(3), ['segmenter'], () => undefined);
    expect(codeOf(await aiService.tint(asOpId(4), photo, { kind: 'picture', blob: photo.blob }, 'auto'))).toBe('ok');
    expect(spread(ai.painted[0])).toBeGreaterThan(30); // far above the flat case's bound of 10
  });
});
