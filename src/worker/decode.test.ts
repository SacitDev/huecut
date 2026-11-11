/** The analysis decode with the browser's decoders faked: a very large JPEG never becomes a full raster. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { jpegSize } from '../domain/measure/picture-gate.ts';
import type { Result } from '../domain/result.ts';
import type { AnalysisError } from './protocol.ts';
import { decodePhoto } from './service.ts';

/** A JPEG head with one APP1 before the SOF0 that names its size. */
const jpegHead = (width: number, height: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 8, height >> 8, height & 255, width >> 8, width & 255, 3]);
const jpeg = (width: number, height: number): Blob => new Blob([jpegHead(width, height)], { type: 'image/jpeg' });
const size = (r: Result<{ widthPx: number; heightPx: number }, AnalysisError>): unknown => (r.ok ? [r.value.widthPx, r.value.heightPx] : r.error.code);

const frameClose = vi.fn();
const decoderClose = vi.fn();
const inits: ImageDecoderInit[] = [];
let decodeResult: () => Promise<unknown>;
class FakeDecoder {
  constructor(init: ImageDecoderInit) {
    inits.push(init);
  }
  decode = (): Promise<unknown> => decodeResult();
  close = decoderClose;
}
const frame = (displayWidth: number, displayHeight: number) => ({ image: { displayWidth, displayHeight, close: frameClose } });
const bitmap = vi.fn(() => Promise.resolve({ width: 800, height: 600, close: vi.fn() } as unknown as ImageBitmap));

beforeEach(() => {
  inits.length = 0;
  vi.clearAllMocks();
  decodeResult = () => Promise.resolve(frame(1512, 2016));
  vi.stubGlobal('OffscreenCanvas', class {
    private readonly w: number;
    private readonly h: number;
    constructor(w: number, h: number) {
      this.w = w;
      this.h = h;
    }
    getContext = () => ({ drawImage: () => undefined, getImageData: () => ({ data: new Uint8ClampedArray(this.w * this.h * 4) }) });
  });
  vi.stubGlobal('ImageDecoder', FakeDecoder);
  vi.stubGlobal('createImageBitmap', bitmap);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it('decodes a 6048 x 8064 JPEG at the smallest scale that covers the cap, and never as a full raster', async () => {
  expect(size(await decodePhoto(jpeg(6048, 8064)))).toEqual([1050, 1400]);
  expect(bitmap).not.toHaveBeenCalled();
  expect(inits.map((i) => [i.desiredWidth, i.desiredHeight])).toEqual([[1512, 2016]]);
  expect(frameClose).toHaveBeenCalledOnce();
  expect(decoderClose).toHaveBeenCalledOnce();
});

it('leaves a photo already under the cap to the plain decode', async () => {
  expect(size(await decodePhoto(jpeg(800, 600)))).toEqual([800, 600]);
  expect(inits).toEqual([]);
});

it('falls back to the plain decode without ImageDecoder, for another format by its bytes and when the decoder fails', async () => {
  vi.stubGlobal('ImageDecoder', undefined);
  await decodePhoto(jpeg(6048, 8064));
  expect(bitmap).toHaveBeenCalledTimes(1);
  vi.stubGlobal('ImageDecoder', FakeDecoder);
  // PNG bytes (3000 x 4000) are decoded whole, whatever the declared type.
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x0b, 0xb8, 0, 0, 0x0f, 0xa0]);
  await decodePhoto(new Blob([png], { type: 'image/jpeg' }));
  expect(bitmap).toHaveBeenCalledTimes(2);
  // JPEG bytes under another declared type take the scaled route: the bytes decide.
  await decodePhoto(new Blob([jpegHead(6048, 8064)], { type: 'image/png' }));
  expect(bitmap).toHaveBeenCalledTimes(2);
  decodeResult = () => Promise.reject(new DOMException('bad data', 'EncodingError'));
  await decodePhoto(jpeg(6048, 8064));
  expect(bitmap).toHaveBeenCalledTimes(3);
  // Each decoder used is closed: the JPEG under another type, then the one that failed.
  expect(decoderClose).toHaveBeenCalledTimes(2);
});

it('refuses a raster past the limit without decoding it, whatever the format, and when the scaled route fails', async () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x3e, 0x80, 0, 0, 0x2e, 0xe0]);
  expect(size(await decodePhoto(new Blob([png], { type: 'image/png' })))).toEqual('decode_failed');
  expect(bitmap).not.toHaveBeenCalled();
  decodeResult = () => Promise.reject(new DOMException('bad data', 'EncodingError'));
  expect(size(await decodePhoto(jpeg(16320, 12240)))).toEqual('decode_failed');
  expect(bitmap).not.toHaveBeenCalled();
});

it('reads the frame size from a JPEG head, past other segments, and gives null without one', () => {
  expect(jpegSize(jpegHead(6048, 8064).buffer)).toEqual({ width: 6048, height: 8064 });
  expect(jpegSize(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer)).toBeNull();
  expect(jpegSize(new Uint8Array([1, 2, 3, 4]).buffer)).toBeNull();
});
