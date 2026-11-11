/** The picture gate: which bytes count and the size they name, and what a decode may do. */
import { describe, expect, it } from 'vitest';
import { jpegSize, MAX_RASTER_PX, pictureHead, planDecode, readPictureHead, type PictureHead } from './picture-gate.ts';

const bytes = (...parts: readonly (number | string)[]): ArrayBuffer =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? Array.from(p, (c) => c.charCodeAt(0)) : [p]))).buffer;
const be32 = (n: number): number[] => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const le16 = (n: number): number[] => [n & 255, n >>> 8];
const pad = (n: number): number[] => new Array<number>(n).fill(0);
/** An SOF0 naming `width` x `height`. */
const sof = (width: number, height: number): number[] => [0xff, 0xc0, 0x00, 0x11, 8, height >> 8, height & 255, width >> 8, width & 255, 3];
const SMALL_SOF = sof(10, 10);
/** Far enough into a segment of length 0xC000 that a walk fooled into reading one lands there. */
const FOOLED_TO = 0xc000 - 2;

const png = (w: number, h: number): ArrayBuffer => bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...be32(13), 'IHDR', ...be32(w), ...be32(h));
const riff = (...rest: readonly (number | string)[]): ArrayBuffer => bytes('RIFF', ...pad(4), 'WEBP', ...rest, ...pad(32));
const heif = (...sizes: readonly (readonly [number, number])[]): ArrayBuffer => bytes(...be32(24), 'ftypheic', ...pad(12), ...sizes.flatMap(([w, h]) => [...be32(20), 'ispe', ...pad(4), ...be32(w), ...be32(h)]));
const head = (format: PictureHead['format'], width: number, height: number): PictureHead => ({ format, width, height });

describe('the size in a file header', () => {
  it('reads PNG', () => {
    expect(pictureHead(png(16000, 12000))).toEqual(head('png', 16000, 12000));
  });
  it('reads the three WebP layouts', () => {
    expect(pictureHead(riff('VP8X', ...pad(8), 0xff, 0x3f, 0, 0xff, 0x3f, 0))).toEqual(head('webp', 16384, 16384));
    expect(pictureHead(riff('VP8 ', ...pad(7), 0x9d, 0x01, 0x2a, ...le16(4032), ...le16(3024)))).toEqual(head('webp', 4032, 3024));
    // 0xfff x 0xbcf in 14 bits each: 4096 x 3024.
    expect(pictureHead(riff('VP8L', ...pad(4), 0x2f, 0xff, 0xcf, 0xf3, 0x02))).toEqual(head('webp', 4096, 3024));
  });
  it('takes the largest ispe of an AVIF or HEIC, the image and not its tiles', () => {
    expect(pictureHead(heif([512, 512], [8064, 6048], [512, 512]))).toEqual(head('heif', 8064, 6048));
  });
  it('gives null for bytes that are no raster, a size of zero, and short heads', () => {
    expect(pictureHead(bytes('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'))).toBeNull();
    // What the declared-type allowlist kept out before the bytes alone decided: GIF, BMP, TIFF, PDF, HTML and text.
    for (const head of ['GIF89a', 'BM', 'II*\0', 'MM\0*', '%PDF-1.4', '<!doctype html>', 'plain words']) expect(pictureHead(bytes(head, ...pad(64))), head).toBeNull();
    expect(pictureHead(bytes(...be32(24), 'ftypheic', ...pad(64)))).toBeNull();
    expect(pictureHead(png(0, 100))).toBeNull();
    expect(pictureHead(bytes(0xff, 0xd8, ...sof(10, 0)))).toBeNull();
    expect(pictureHead(new ArrayBuffer(0))).toBeNull();
  });
});

describe('a JPEG cannot show the walk one frame and the decoder another', () => {
  const lieBeyond = (...trick: readonly number[]): ArrayBuffer => bytes(0xff, 0xd8, ...trick, ...sof(16320, 12240), ...pad(FOOLED_TO), ...SMALL_SOF);
  it('skips fill bytes as the decoder does', () => {
    expect(jpegSize(lieBeyond(0xff, 0xff))).toEqual({ width: 16320, height: 12240 });
  });
  it('steps over the markers that have no length', () => {
    expect(jpegSize(lieBeyond(0xff, 0xd0))).toEqual({ width: 16320, height: 12240 });
    expect(jpegSize(lieBeyond(0xff, 0x01))).toEqual({ width: 16320, height: 12240 });
  });
  it('stops at a stuffed zero, or junk, so the file counts as unreadable rather than small', () => {
    expect(jpegSize(lieBeyond(0xff, 0x00))).toBeNull();
    expect(jpegSize(lieBeyond(0x12, 0x34))).toBeNull();
  });
});

describe('the head of a file', () => {
  /** A file of these bytes, as `readPictureHead` sees a Blob (the domain has no DOM). */
  const file = (data: Uint8Array<ArrayBuffer>) => ({ size: data.byteLength, slice: (start: number, end: number) => ({ arrayBuffer: () => Promise.resolve(data.slice(start, end).buffer) }) });
  /** A JPEG with `segments` APP1 blocks of 64 KB before its frame header. */
  const jpegAfter = (segments: number): Uint8Array<ArrayBuffer> => {
    const data = new Uint8Array(2 + segments * 0x10001 + 10).fill(0x41);
    data.set([0xff, 0xd8]);
    for (let i = 0; i < segments; i++) data.set([0xff, 0xe1, 0xff, 0xff], 2 + i * 0x10001);
    data.set(sof(4000, 3000), 2 + segments * 0x10001);
    return data;
  };
  it('looks further for a JPEG whose frame header lies past the first look', async () => {
    expect(await readPictureHead(file(jpegAfter(5)))).toEqual(head('jpeg', 4000, 3000));
  });
  it('gives up after the second look rather than read a whole file, and counts a raster that does not start the file as none', async () => {
    expect(await readPictureHead(file(jpegAfter(300)))).toBeNull();
    const shifted = new Uint8Array(200_000 + 24);
    shifted.set(new Uint8Array(png(10, 10)), 200_000);
    expect(await readPictureHead(file(shifted))).toBeNull();
  });
});

describe('what a decode may do', () => {
  it('takes a 200 MP JPEG at the 1/8 scale where the browser can, and refuses it where it cannot', () => {
    const big = head('jpeg', 16320, 12240);
    expect(planDecode(big, true, 1536)).toEqual({ width: 2040, height: 1530 });
    expect(planDecode(big, false, 1536)).toBe('refuse');
  });
  it('holds the limit on the scaled raster too', () => {
    expect(planDecode(head('jpeg', 65500, 65500), true, 256)).toBe('refuse');
  });
  it('leaves a photo already under the target to the plain decode', () => {
    expect(planDecode(head('jpeg', 800, 600), true, 1536)).toBe('plain');
  });
  it('holds non-JPEG files to their whole raster: a 50 MP camera file passes, just above the limit does not', () => {
    expect(8192 * 6144).toBeLessThanOrEqual(MAX_RASTER_PX);
    expect(planDecode(head('png', 8192, 6144), true, 256)).toBe('plain');
    expect(planDecode(head('webp', 8192, 6400), true, 256)).toBe('refuse');
    expect(planDecode(head('heif', 16000, 12000), true, 256)).toBe('refuse');
  });
  it('leaves a Blob with no known head to the browser, since no file with one passes the door', () => {
    expect(planDecode(null, true, 256)).toBe('plain');
  });
});
