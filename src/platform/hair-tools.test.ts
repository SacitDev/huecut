/**
 * The extras' worker calls over a fake supervisor: which mask and target each sends, the "running extra" marker,
 * one depth map per photo, and the hair-only transfer's pixel preservation.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { measureHair, transferColour, type HairMask } from '../domain/colour/transfer.ts';
import { asPhotoId, asPictureId } from '../domain/ids.ts';
import type { RgbaImage } from '../domain/measure/mask.ts';
import { ok, type Result } from '../domain/result.ts';
import type { AnalysisError, HairSelection, TintMask, TintSource } from '../worker/protocol.ts';
import { clearMarkerOnPageHide, connectHairTools, crashedExtras, depthLayers, hairOnly, markRunningExtra, photoPicture, tintedPicture } from './hair-tools.ts';
import * as resources from './resources.ts';

const PHOTO = asPhotoId('photo-1');
const signal = new AbortController().signal;
const targets = { root: null, mids: null, ends: null };
const session = new Map<string, string>();
const bitmap = { close: vi.fn() } as unknown as ImageBitmap;

const worker = {
  tint: vi.fn<(photo: unknown, source: TintSource, mask: TintMask) => Promise<Result<ImageBitmap, AnalysisError>>>(() => Promise.resolve(ok(bitmap))),
  selectHair: vi.fn(() => Promise.resolve(ok({} as HairSelection))),
  depth: vi.fn(() => Promise.resolve(ok({ widthPx: 1, heightPx: 1, data: new Float32Array(1) }))),
};

beforeEach(async () => {
  vi.clearAllMocks();
  session.clear();
  vi.stubGlobal('sessionStorage', {
    setItem: (k: string, v: string) => session.set(k, v),
    removeItem: (k: string) => session.delete(k),
    getItem: (k: string) => session.get(k) ?? null,
  });
  resources.disposeAll();
  await resources.addPhoto(new Blob(['photo']), 'photo', PHOTO);
  connectHairTools(() => worker);
});

const lastTint = () => worker.tint.mock.lastCall ?? [];

describe('the colour preview calls', () => {
  it('asks the segmenter for its mask when no outline was refined', async () => {
    await tintedPicture(PHOTO, targets, signal);
    expect(lastTint()[2]).toBe('auto');
    expect(lastTint()[1]).toEqual({ kind: 'targets', targets });
  });

  it('sends a copy of the refined mask, and the stored mask keeps its bytes', async () => {
    resources.setMask(PHOTO, { widthPx: 1, heightPx: 1, data: Uint8Array.of(255) });
    await tintedPicture(PHOTO, targets, signal);
    const sent = lastTint()[2] as Exclude<TintMask, 'auto'>;
    sent.data[0] = 0;
    await tintedPicture(PHOTO, targets, signal);
    expect((lastTint()[2] as Exclude<TintMask, 'auto'>).data[0]).toBe(255);
  });

  it('gets the "before" picture with no targets and an empty mask, so no model runs', async () => {
    await photoPicture(PHOTO, signal);
    const [, source, mask] = lastTint();
    expect(source).toEqual({ kind: 'targets', targets });
    expect(mask).toEqual({ widthPx: 1, heightPx: 1, data: new Uint8Array(1) });
  });

  it('answers with an error, not a throw, for a photo no longer in the store', async () => {
    const r = await tintedPicture(asPhotoId('gone'), targets, signal);
    expect(r.ok).toBe(false);
    expect(worker.tint).not.toHaveBeenCalled();
  });
});

describe('the running-extra marker', () => {
  it('is written while a run lasts and reads back at the next boot as the extra that crashed the tab', () => {
    expect(crashedExtras()).toEqual([]);
    markRunningExtra('sam');
    expect(session.get('huecut:running-extra')).toBe('sam');
    expect(crashedExtras()).toEqual(['sam']);
    markRunningExtra(null);
    expect(session.size).toBe(0);
    expect(crashedExtras()).toEqual([]);
  });

  function pageHide(): () => void {
    let hide = (): void => undefined;
    vi.stubGlobal('addEventListener', (type: string, listener: () => void) => {
      if (type === 'pagehide') hide = listener;
    });
    clearMarkerOnPageHide();
    return () => {
      hide();
    };
  }

  it('is taken away by a reload or a closing tab during a run, which fire pagehide as a real crash does not', () => {
    const hide = pageHide();
    markRunningExtra('depth');
    hide();
    expect(crashedExtras()).toEqual([]);
  });

  it('stays when the page that goes never ran anything: the crash it records was the page before', () => {
    const hide = pageHide();
    session.set('huecut:running-extra', 'sam');
    hide();
    expect(crashedExtras()).toEqual(['sam']);
  });
});

it('measures one depth map per photo', async () => {
  await depthLayers(PHOTO, signal);
  await depthLayers(PHOTO, signal);
  expect(worker.depth).toHaveBeenCalledOnce();
});

describe('the hair-only version', () => {
  it('fails when the AI picture is gone', async () => {
    await expect(hairOnly(PHOTO, asPictureId('missing'))).resolves.toBe('failed');
    expect(worker.tint).not.toHaveBeenCalled();
  });

  it('says so when the worker finds no hair in the AI picture', async () => {
    const picture = resources.addPicture(new Blob(['ai']));
    worker.tint.mockResolvedValueOnce({ ok: false, error: { code: 'decode_failed', retryable: true, detail: 'no hair found in the AI picture' } });
    await expect(hairOnly(PHOTO, picture)).resolves.toBe('no_hair');
    expect(lastTint()[1]).toMatchObject({ kind: 'picture' });
    expect(lastTint()[2]).toBe('auto');
  });

  it('moves the AI picture’s hair colour and leaves every pixel outside the photo’s hair mask exactly as it was', () => {
    const [w, h] = [40, 30];
    const paint = (r: number, g: number, b: number): RgbaImage => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) data.set([r + (i % 7), g + (i % 5), b + (i % 3), 255], i * 4);
      return { widthPx: w, heightPx: h, data };
    };
    const mask: HairMask = { widthPx: w, heightPx: h, data: new Uint8Array(w * h).map((_, i) => (i < w * 12 ? 255 : 0)) };
    const photo = paint(60, 45, 35);
    const target = measureHair(paint(210, 170, 120), mask);
    expect(target).not.toBeNull();
    if (!target) return;
    const out = transferColour(photo, mask, target);
    let changedInside = 0;
    for (let i = 0; i < w * h; i++) {
      const after = Array.from(out.data.subarray(i * 4, i * 4 + 4));
      const before = Array.from(photo.data.subarray(i * 4, i * 4 + 4));
      if (mask.data[i] === 0) expect(after).toEqual(before);
      else if (after.some((v, c) => v !== before[c])) changedInside++;
    }
    expect(changedInside).toBeGreaterThan(0.9 * w * 12);
  });
});
