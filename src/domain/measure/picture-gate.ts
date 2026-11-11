/**
 * The one gate for a picture coming into the app: which bytes count, whatever the file's name or declared type, the size they
 * name, and the largest raster a decode may make. Pure, so the main thread and the analysis worker decide alike; each runs its own browser decode.
 */

/**
 * The most pixels one decode may hold at once: 52 MP, 208 MB as RGBA. A 50 MP camera file (8192 x 6144) fits, so no ordinary photo is
 * refused; a larger JPEG still comes in where it can be decoded at a smaller scale, and everything else above this stays out. In
 * Chromium 158 on a desktop a 50 MP PNG peaked 370 MB above the open page, a 192 MP one 1,135 MB.
 */
export const MAX_RASTER_PX = 52_000_000;

/** The first look: every format here names its size this early unless a JPEG carries long metadata. */
const HEAD_BYTES = 128 * 1024;
/** The second look, when the first found no size: a phone's portrait JPEG can hold megabytes of depth data before its frame header. */
const LONG_HEAD_BYTES = 16 * 1024 * 1024;

/** Why the gate turned a file away. */
export type PictureRefusal = 'not_picture' | 'too_large';

interface PictureSize {
  readonly width: number;
  readonly height: number;
}

/** What a file's own first bytes say it is, and its size before any EXIF rotation. */
export interface PictureHead extends PictureSize {
  readonly format: 'jpeg' | 'png' | 'webp' | 'heif';
}

const hasText = (v: DataView, at: number, text: string): boolean => at + text.length <= v.byteLength && Array.from(text, (c) => c.charCodeAt(0)).every((code, i) => v.getUint8(at + i) === code);

/**
 * The marker segments of a JPEG head, in order, up to the start of scan; none when the bytes are not a JPEG. It walks as the decoder
 * does (fill bytes, the markers with no length), so a file cannot show this walk one frame size and the decoder another.
 */
export function* jpegSegments(v: DataView): Generator<{ readonly marker: number; readonly off: number; readonly end: number }> {
  const fits = (offset: number, size: number): boolean => offset + size <= v.byteLength;
  if (!fits(0, 2) || v.getUint16(0) !== 0xffd8) return;
  for (let off = 2; fits(off, 4); ) {
    const [lead, code] = [v.getUint8(off), v.getUint8(off + 1)];
    if (lead !== 0xff || code === 0x00 || code === 0xda) return; // not a marker, or start of scan
    if (code === 0xff) {
      off += 1;
    } else if (code === 0x01 || (code >= 0xd0 && code <= 0xd7)) {
      off += 2;
    } else {
      const end = off + 2 + v.getUint16(off + 2);
      yield { marker: 0xff00 | code, off, end };
      off = end;
    }
  }
}

/** SOF0 to SOF15, which name the frame size; 0xC4, 0xC8 and 0xCC share the range but are other segments. */
const isFrameHeader = (marker: number): boolean => marker >= 0xffc0 && marker <= 0xffcf && marker !== 0xffc4 && marker !== 0xffc8 && marker !== 0xffcc;

/** The frame size of a JPEG before any EXIF rotation, or null when its head has none in reach. Never throws. */
export function jpegSize(bytes: ArrayBuffer): PictureSize | null {
  const v = new DataView(bytes);
  for (const { marker, off } of jpegSegments(v)) {
    if (isFrameHeader(marker) && off + 9 <= v.byteLength) return { height: v.getUint16(off + 5), width: v.getUint16(off + 7) };
  }
  return null;
}

function pngSize(bytes: ArrayBuffer): PictureSize | null {
  const v = new DataView(bytes);
  if (v.byteLength < 24 || v.getUint32(0) !== 0x89504e47 || !hasText(v, 12, 'IHDR')) return null;
  return { width: v.getUint32(16), height: v.getUint32(20) };
}

/** The three WebP layouts: the extended header's canvas, lossy's frame header and lossless's packed sizes. */
function webpSize(bytes: ArrayBuffer): PictureSize | null {
  const v = new DataView(bytes);
  if (v.byteLength < 30 || !hasText(v, 0, 'RIFF') || !hasText(v, 8, 'WEBP')) return null;
  if (hasText(v, 12, 'VP8X')) return { width: (v.getUint32(24, true) & 0xffffff) + 1, height: (v.getUint32(26, true) >>> 8) + 1 };
  if (hasText(v, 12, 'VP8 ') && v.getUint16(23) === 0x9d01 && v.getUint8(25) === 0x2a) return { width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff };
  if (hasText(v, 12, 'VP8L') && v.getUint8(20) === 0x2f) {
    const packed = v.getUint32(21, true);
    return { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

/** AVIF and HEIC: the largest `ispe` box in the head, because a tiled HEIC names its tiles' size too. */
function heifSize(bytes: ArrayBuffer): PictureSize | null {
  const v = new DataView(bytes);
  if (!hasText(v, 4, 'ftyp')) return null;
  let largest: PictureSize | null = null;
  for (let at = 8; at + 16 <= v.byteLength; at++) {
    if (v.getUint32(at) !== 0x69737065) continue; // "ispe"
    const size = { width: v.getUint32(at + 8), height: v.getUint32(at + 12) };
    if (!largest || size.width * size.height > largest.width * largest.height) largest = size;
  }
  return largest;
}

/**
 * Rasters only (AVIF and HEIC share the HEIF container, and only Safari decodes HEIC): an SVG is a program for the browser's SVG engine, and GIF, BMP
 * and TIFF are not photos anyone adds here.
 */
const READERS = [['jpeg', jpegSize], ['png', pngSize], ['webp', webpSize], ['heif', heifSize]] as const;

/** What these bytes are and how big, or null when they are no raster this app knows or name no usable size. Never throws. */
export function pictureHead(bytes: ArrayBuffer): PictureHead | null {
  for (const [format, sizeOf] of READERS) {
    const size = sizeOf(bytes);
    if (size) return size.width > 0 && size.height > 0 ? { format, ...size } : null;
  }
  return null;
}

/** The little of a Blob this reads; the domain has no DOM types. */
interface ByteSource {
  readonly size: number;
  slice(start: number, end: number): { arrayBuffer(): Promise<ArrayBuffer> };
}

/** Reads a file's head, looking further only when the first look found no size. */
export async function readPictureHead(file: ByteSource): Promise<PictureHead | null> {
  const first = pictureHead(await file.slice(0, HEAD_BYTES).arrayBuffer());
  return first || file.size <= HEAD_BYTES ? first : pictureHead(await file.slice(0, LONG_HEAD_BYTES).arrayBuffer());
}

/**
 * How to decode a file for a target long side: at the smallest of a JPEG's eight DCT scales that covers it (the size to ask for),
 * `plain` for a whole decode, or `refuse` when that decode would pass the limit. No file with an unknown head passes the door; a Blob
 * made here without one is left to the browser's own decoder.
 */
export function planDecode(head: PictureHead | null, canScale: boolean, longSide: number): PictureSize | 'plain' | 'refuse' {
  if (!head) return 'plain';
  const eighths = canScale && head.format === 'jpeg' ? Math.ceil((longSide * 8) / Math.max(head.width, head.height)) : 8;
  const scaled = { width: Math.ceil((head.width * eighths) / 8), height: Math.ceil((head.height * eighths) / 8) };
  if (eighths < 8 && scaled.width * scaled.height <= MAX_RASTER_PX) return scaled;
  return head.width * head.height <= MAX_RASTER_PX ? 'plain' : 'refuse';
}
