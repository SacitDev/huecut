/** FocalLengthIn35mmFilm from hand-built JPEG headers, both byte orders, and hostile or empty input. */
import { describe, expect, it } from 'vitest';
import { EXIF_SCAN_BYTES, focal35FromJpeg, readFocal35 } from './exif.ts';

/** SOI, an APP0 segment, then APP1 "Exif" with IFD0 → Exif IFD → tag 0xA405 = `focal` (SHORT). */
function jpegWithFocal(focal: number, littleEndian: boolean, type = 3): ArrayBuffer {
  const tiff = new DataView(new ArrayBuffer(8 + 2 + 12 + 4 + 2 + 12 + 4));
  tiff.setUint16(0, littleEndian ? 0x4949 : 0x4d4d);
  tiff.setUint16(2, 42, littleEndian);
  tiff.setUint32(4, 8, littleEndian); // IFD0 at 8
  tiff.setUint16(8, 1, littleEndian); // one entry
  tiff.setUint16(10, 0x8769, littleEndian); // Exif IFD pointer
  tiff.setUint16(12, 4, littleEndian);
  tiff.setUint32(14, 1, littleEndian);
  tiff.setUint32(18, 26, littleEndian); // Exif IFD at 26
  tiff.setUint32(22, 0, littleEndian);
  tiff.setUint16(26, 1, littleEndian);
  tiff.setUint16(28, 0xa405, littleEndian);
  tiff.setUint16(30, type, littleEndian);
  tiff.setUint32(32, 1, littleEndian);
  if (type === 3) tiff.setUint16(36, focal, littleEndian);
  else tiff.setUint32(36, focal, littleEndian);
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...new Array<number>(14).fill(0)];
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const app1Length = 2 + exifHeader.length + tiff.byteLength;
  const bytes = [0xff, 0xd8, ...app0, 0xff, 0xe1, app1Length >> 8, app1Length & 0xff, ...exifHeader, ...new Uint8Array(tiff.buffer), 0xff, 0xda, 0, 2];
  return new Uint8Array(bytes).buffer;
}

describe('EXIF focal length', () => {
  it('reads FocalLengthIn35mmFilm in both byte orders, after an APP0 segment', () => {
    expect(focal35FromJpeg(jpegWithFocal(26, true))).toBe(26);
    expect(focal35FromJpeg(jpegWithFocal(52, false))).toBe(52);
    expect(focal35FromJpeg(jpegWithFocal(77, true, 4))).toBe(77);
  });

  it('gives null for zero (unknown), no EXIF, a PNG and every truncation of a valid header', () => {
    expect(focal35FromJpeg(jpegWithFocal(0, true))).toBeNull();
    expect(focal35FromJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer)).toBeNull();
    expect(focal35FromJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull();
    expect(focal35FromJpeg(new ArrayBuffer(0))).toBeNull();
    const full = new Uint8Array(jpegWithFocal(26, true));
    for (let n = 0; n < full.byteLength - 4; n++) {
      const value = focal35FromJpeg(full.slice(0, n).buffer);
      expect(value === null || value === 26).toBe(true);
    }
  });

  it('reads only the first 128 KB of a file', async () => {
    const header = new Uint8Array(jpegWithFocal(28, true));
    const blob = new Blob([header, new Uint8Array(EXIF_SCAN_BYTES * 2)]);
    expect(await readFocal35(blob)).toBe(28);
    expect(EXIF_SCAN_BYTES).toBe(131_072);
  });
});
