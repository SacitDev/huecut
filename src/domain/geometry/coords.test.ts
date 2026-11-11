/**
 * Coordinate conversions: known values worked by hand, round trips for every conversion, and the 8 EXIF
 * orientations checked against the specification's own row and column table rather than the code's formulas.
 */
import { describe, expect, it } from 'vitest';
import {
  CARD_PX,
  contentBox,
  fromDisplay,
  fromExport,
  fromPx,
  orientedSize,
  orientedToStored,
  storedToOriented,
  toDisplay,
  toExport,
  toPx,
  type DisplayFrame,
  type ExifOrientation,
  type ExportPlacement,
  type Point,
} from './coords.ts';

const POINTS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 0.25, y: 0.75 },
  { x: 0.613, y: 0.087 },
  { x: 0.5, y: 0.5 },
];
const ORIENTATIONS: readonly ExifOrientation[] = [1, 2, 3, 4, 5, 6, 7, 8];

const close = (a: Point, b: Point): void => {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
};

const frame = (fit: DisplayFrame['fit'], position: Point = { x: 0.5, y: 0.5 }): DisplayFrame => ({
  left: 40,
  top: 100,
  widthPx: 300,
  heightPx: 300,
  fit,
  position,
});
/** A portrait photo, 3:4. */
const IMAGE = { widthPx: 900, heightPx: 1200 };

describe('analysis pixels', () => {
  it('scales by the image size and round-trips', () => {
    expect(toPx({ x: 0.5, y: 0.25 }, { widthPx: 1400, heightPx: 1050 })).toEqual({ x: 700, y: 262.5 });
    for (const p of POINTS) close(fromPx(toPx(p, IMAGE), IMAGE), p);
  });
});

describe('display pixels inside an object-fit frame', () => {
  it('letterboxes with contain and crops with cover (hand-worked)', () => {
    // contain: scale min(300/900, 300/1200) = 0.25 → 225 x 300, centred: 37.5 px bars left and right.
    expect(contentBox(frame('contain'), IMAGE)).toEqual({ x: 37.5, y: 0, width: 225, height: 300 });
    // cover: scale 1/3 → 300 x 400, centred: 50 px cut off top and bottom.
    expect(contentBox(frame('cover'), IMAGE)).toEqual({ x: 0, y: -50, width: 300, height: 400 });
    // cover, object-position top: nothing cut at the top.
    expect(contentBox(frame('cover', { x: 0.5, y: 0 }), IMAGE).y).toBeCloseTo(0, 12);
    expect(contentBox(frame('fill'), IMAGE)).toEqual({ x: 0, y: 0, width: 300, height: 300 });
    expect(contentBox(frame('none'), IMAGE)).toEqual({ x: -300, y: -450, width: 900, height: 1200 });
    expect(contentBox(frame('scale-down'), { widthPx: 100, heightPx: 50 })).toEqual({ x: 100, y: 125, width: 100, height: 50 });
  });

  it('adds the frame offset and the fit offset', () => {
    // The image centre sits at the frame centre; the image's top-left corner sits on the letterbox edge.
    close(toDisplay({ x: 0.5, y: 0.5 }, frame('contain'), IMAGE), { x: 190, y: 250 });
    close(toDisplay({ x: 0, y: 0 }, frame('contain'), IMAGE), { x: 77.5, y: 100 });
    close(toDisplay({ x: 0, y: 0 }, frame('cover'), IMAGE), { x: 40, y: 50 });
  });

  it('round-trips for every fit and position', () => {
    const fits: readonly DisplayFrame['fit'][] = ['contain', 'cover', 'fill', 'none', 'scale-down'];
    for (const fit of fits) {
      for (const position of [{ x: 0.5, y: 0.5 }, { x: 0, y: 1 }, { x: 0.3, y: 0.8 }]) {
        for (const p of POINTS) close(fromDisplay(toDisplay(p, frame(fit, position), IMAGE), frame(fit, position), IMAGE), p);
      }
    }
  });

  it('gives a value outside [0, 1] on the letterbox', () => {
    expect(fromDisplay({ x: 41, y: 150 }, frame('contain'), IMAGE).x).toBeLessThan(0);
  });
});

describe('export pixels on the 2160 x 2700 card', () => {
  /** The upper 2160 x 2160 of the card shows a square crop of the photo. */
  const placement: ExportPlacement = { crop: { x: 0, y: 0.125, width: 1, height: 0.75 }, area: { x: 0, y: 0, width: 2160, height: 2160 } };

  it('maps the crop onto the card area (hand-worked)', () => {
    expect(CARD_PX).toEqual({ widthPx: 2160, heightPx: 2700 });
    close(toExport({ x: 0.5, y: 0.5 }, placement), { x: 1080, y: 1080 });
    close(toExport({ x: 0, y: 0.125 }, placement), { x: 0, y: 0 });
    close(toExport({ x: 1, y: 0.875 }, placement), { x: 2160, y: 2160 });
  });

  it('round-trips, also with an inset area', () => {
    const inset: ExportPlacement = { crop: { x: 0.1, y: 0.2, width: 0.6, height: 0.6 }, area: { x: 120, y: 160, width: 1920, height: 1920 } };
    for (const p of POINTS) {
      close(fromExport(toExport(p, placement), placement), p);
      close(fromExport(toExport(p, inset), inset), p);
    }
  });
});

/**
 * The EXIF / TIFF definition of Orientation, as data: which visual side the stored image's 0th row and 0th
 * column lie on. The oracle below places a stored pixel by this table alone.
 */
const SPEC: Record<ExifOrientation, { readonly row0: 'top' | 'bottom' | 'left' | 'right'; readonly col0: 'top' | 'bottom' | 'left' | 'right' }> = {
  1: { row0: 'top', col0: 'left' },
  2: { row0: 'top', col0: 'right' },
  3: { row0: 'bottom', col0: 'right' },
  4: { row0: 'bottom', col0: 'left' },
  5: { row0: 'left', col0: 'top' },
  6: { row0: 'right', col0: 'top' },
  7: { row0: 'right', col0: 'bottom' },
  8: { row0: 'left', col0: 'bottom' },
};

/** Where stored pixel (col, row) of a W x H image lands in the oriented image, in pixel indices. */
function oracle(col: number, row: number, w: number, h: number, o: ExifOrientation): { x: number; y: number } {
  const { row0, col0 } = SPEC[o];
  if (row0 === 'top' || row0 === 'bottom') {
    return { x: col0 === 'left' ? col : w - 1 - col, y: row0 === 'top' ? row : h - 1 - row };
  }
  // Rows run along the visual x axis: row 0 at the left or right edge; columns run down or up.
  return { x: row0 === 'left' ? row : h - 1 - row, y: col0 === 'top' ? col : w - 1 - col };
}

describe('EXIF orientations 1-8', () => {
  const stored = { widthPx: 4, heightPx: 3 };

  it('places every pixel centre where the specification puts it', () => {
    for (const o of ORIENTATIONS) {
      const size = orientedSize(stored, o);
      for (let row = 0; row < stored.heightPx; row++) {
        for (let col = 0; col < stored.widthPx; col++) {
          const want = oracle(col, row, stored.widthPx, stored.heightPx, o);
          const got = storedToOriented({ x: (col + 0.5) / stored.widthPx, y: (row + 0.5) / stored.heightPx }, o);
          close(got, { x: (want.x + 0.5) / size.widthPx, y: (want.y + 0.5) / size.heightPx });
        }
      }
    }
  });

  it('swaps the size for 5-8 only', () => {
    expect(ORIENTATIONS.map((o) => orientedSize(stored, o).widthPx)).toEqual([4, 4, 4, 4, 3, 3, 3, 3]);
  });

  it('round-trips both ways for all 8', () => {
    for (const o of ORIENTATIONS) {
      for (const p of POINTS) {
        close(orientedToStored(storedToOriented(p, o), o), p);
        close(storedToOriented(orientedToStored(p, o), o), p);
      }
    }
  });
});
