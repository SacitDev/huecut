/**
 * What the app reads from the first 128 KB of a JPEG: FocalLengthIn35mmFilm (tag 0xA405), which helps the camera-distance
 * check. Everything else in EXIF is ignored and never leaves the device.
 */
import { jpegSegments } from '../domain/measure/picture-gate.ts';

/** How much of the file is read: EXIF sits in APP1 near the start, and 64 KB is its maximum size. */
export const EXIF_SCAN_BYTES = 128 * 1024;

const EXIF_IFD_POINTER = 0x8769;
const FOCAL_35MM = 0xa405;
const TYPE_SHORT = 3;
const TYPE_LONG = 4;

/** Reads FocalLengthIn35mmFilm in mm, or null when the bytes hold none (or are not a JPEG). Never throws. */
export function focal35FromJpeg(bytes: ArrayBuffer): number | null {
  const v = new DataView(bytes);
  for (const { marker, off, end } of jpegSegments(v)) {
    if (marker === 0xffe1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) return readTiff(v, off + 10, end);
  }
  return null;
}

/** Walks IFD0 → Exif IFD inside the TIFF block at `tiff` (bounded by `end`). */
function readTiff(v: DataView, tiff: number, end: number): number | null {
  const limit = Math.min(end, v.byteLength);
  const fits = (offset: number, size: number): boolean => offset >= 0 && tiff + offset + size <= limit;
  if (!fits(0, 8)) return null;
  const order = v.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  const u16 = (o: number): number | null => (fits(o, 2) ? v.getUint16(tiff + o, le) : null);
  const u32 = (o: number): number | null => (fits(o, 4) ? v.getUint32(tiff + o, le) : null);
  const find = (ifd: number, tag: number): number | null => {
    const count = u16(ifd) ?? 0;
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === tag) return entry;
    }
    return null;
  };
  const ifd0 = u32(4);
  const pointer = ifd0 === null ? null : find(ifd0, EXIF_IFD_POINTER);
  const exifIfd = pointer === null ? null : u32(pointer + 8);
  const entry = exifIfd === null ? null : find(exifIfd, FOCAL_35MM);
  if (entry === null) return null;
  const type = u16(entry + 2);
  const value = type === TYPE_SHORT ? u16(entry + 8) : type === TYPE_LONG ? u32(entry + 8) : null;
  return value === 0 ? null : value;
}

/** Reads the focal length from a photo file (JPEG only; other formats return null). */
export async function readFocal35(blob: Blob): Promise<number | null> {
  return focal35FromJpeg(await blob.slice(0, EXIF_SCAN_BYTES).arrayBuffer());
}
