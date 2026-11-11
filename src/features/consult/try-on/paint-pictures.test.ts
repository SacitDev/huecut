/** Unit tests of the export's picture rules: which file a tile draws from, and a sheet with a blank frame refused. */
import { describe, expect, it } from 'vitest';
import type { PictureEntry } from '../../../domain/content/types.ts';
import { fileWidthFor, painted } from './paint-pictures.ts';

const entry = { widthPx: 1086, heightPx: 1448, widths: [480, 960, 1086] } as unknown as PictureEntry;
const SPEC = { widthPx: 2160, heightPx: 2700, mime: 'image/jpeg', quality: 0.92 } as const;
const frame = (width: number, height: number) => ({ x: 0, y: 0, width, height });

describe('fileWidthFor', () => {
  it('takes the smallest file that covers the picture as it is drawn, whole inside its frame', () => {
    expect(fileWidthFor(entry, frame(400, 500), 1)).toBe(480);
    expect(fileWidthFor(entry, frame(618, 773), 1)).toBe(960);
    // Six looks on a sheet are under 640 px wide; two are limited by their height, 885 px of picture in a 944 px frame.
    expect(fileWidthFor(entry, frame(944, 1180), 1)).toBe(960);
  });

  it('takes the largest file when the frame needs more than any has', () => {
    expect(fileWidthFor(entry, frame(1672, 2090), 1)).toBe(1086);
  });

  it('scales the frame to the export', () => {
    expect(fileWidthFor(entry, frame(400, 500), 3)).toBe(1086);
  });
});

describe('painted', () => {
  it('refuses a whole sheet with a frame that has no picture to draw', async () => {
    await expect(painted([{ type: 'picture', ref: null, rect: frame(100, 125) }], SPEC, () => undefined, true)).rejects.toThrow('could not be decoded');
  });
});
