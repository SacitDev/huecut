/**
 * Known-answer tests for the mask measures on a drawn head: hair band above a forehead of face skin, brows
 * at a known height, irises of a known colour. Covers a visible hairline, a fringe and a head covering.
 */
import { describe, expect, it } from 'vitest';
import { srgbToLab } from '../colour/lab.ts';
import { reachableFrom, colourSamples, fillHairHoles, hairCoverage, hairExtent, hairline, hairMeasures, previewMask, SEGMENT, type CategoryMask, type RgbaImage } from './mask.ts';

const N = 200;
const HAIR_RGB = [40, 30, 20] as const;
const SKIN_RGB = [200, 160, 140] as const;
const EYE_RGB = [60, 90, 140] as const;

interface HeadOptions {
  readonly fringeToRow?: number;
  readonly covering?: boolean;
}

const inBox = (x: number, y: number, [x0, x1, y0, y1]: readonly [number, number, number, number]): boolean => x >= x0 && x < x1 && y >= y0 && y < y1;

function classOf(x: number, y: number, options: HeadOptions): number {
  if (inBox(x, y, [50, 150, 60, options.fringeToRow ?? 60])) return SEGMENT.hair;
  if (inBox(x, y, [50, 150, 60, 160])) return SEGMENT.faceSkin;
  if (inBox(x, y, [40, 160, 20, 60])) return options.covering ? SEGMENT.other : SEGMENT.hair;
  return SEGMENT.background;
}

/** Rows 20-59 hair (x 40-159), rows 60-159 face skin (x 50-149), the rest background. */
function head(options: HeadOptions = {}): CategoryMask {
  const data = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) data[y * N + x] = classOf(x, y, options);
  return { widthPx: N, heightPx: N, data };
}

const IRIS_CENTRES = [
  [468, 0.4, 0.5],
  [473, 0.6, 0.5],
] as const;

/** Brows at y 0.45 from x 0.35 to 0.65, forehead top 0.32, chin 0.8, irises of radius 0.025 (5 px). */
function landmarks(): Float32Array {
  const lm = new Float32Array(478 * 3);
  const set = (i: number, x: number, y: number): void => {
    lm[i * 3] = x;
    lm[i * 3 + 1] = y;
  };
  [70, 63, 105, 66, 107, 336, 296, 334, 293, 300].forEach((i, k) => {
    set(i, 0.35 + (0.3 * k) / 9, 0.45);
  });
  set(10, 0.5, 0.32);
  set(152, 0.5, 0.8);
  for (const [centre, x, y] of IRIS_CENTRES) {
    set(centre, x, y);
    set(centre + 1, x + 0.025, y);
    set(centre + 2, x, y - 0.025);
    set(centre + 3, x - 0.025, y);
    set(centre + 4, x, y + 0.025);
  }
  return lm;
}

function image(mask: CategoryMask): RgbaImage {
  const data = new Uint8ClampedArray(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const rgb = mask.data[i] === SEGMENT.hair ? HAIR_RGB : SKIN_RGB;
    data.set([...rgb, 255], i * 4);
  }
  for (const [, cx, cy] of IRIS_CENTRES) {
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (Math.hypot(x, y) <= 5) data.set([...EYE_RGB, 255], ((cy * N + y) * N + cx * N + x) * 4);
  }
  return { widthPx: N, heightPx: N, data };
}

it('measures hair coverage and extent', () => {
  const mask = head();
  expect(hairCoverage(mask)).toBeCloseTo((120 * 40) / (N * N), 10);
  expect(hairExtent(mask)).toEqual({ top: 0.1, bottom: 0.3, left: 0.2, right: 0.8 });
  expect(hairExtent({ widthPx: 2, heightPx: 2, data: new Uint8Array(4) })).toBeNull();
});

it('finds the hairline on the hair / face-skin boundary above the brows', () => {
  const line = hairline(head(), landmarks());
  expect(line.visible).toBe(true);
  expect(line.points.length).toBe(15 * 2);
  for (let i = 0; i < line.points.length; i += 2) {
    // Points are Float32 (the protocol's type), so compare to float precision.
    expect(line.points[i + 1]).toBeCloseTo(0.3, 6);
    expect(line.points[i]).toBeGreaterThanOrEqual(0.35 - 1e-6);
    expect(line.points[i]).toBeLessThanOrEqual(0.65 + 1e-6);
  }
});

it('reports the hairline hidden under a fringe that reaches the brows', () => {
  const line = hairline(head({ fringeToRow: 100 }), landmarks());
  expect(line.visible).toBe(false);
  expect(line.points.length).toBe(0);
});

it('finds no hairline under a head covering, and none without a face', () => {
  expect(hairline(head({ covering: true }), landmarks()).visible).toBe(false);
  expect(hairline(head(), null)).toEqual({ points: new Float32Array(0), visible: false });
});

it('samples hair, skin and eye colour as Lab medians', () => {
  const mask = head();
  const colour = colourSamples(mask, image(mask), landmarks());
  expect(colour.hair).toEqual(srgbToLab(...HAIR_RGB));
  expect(colour.skin).toEqual(srgbToLab(...SKIN_RGB));
  expect(colour.eyes).toEqual(srgbToLab(...EYE_RGB));
  expect(colourSamples(mask, image(mask), null).eyes).toBeNull();
});

it('scales the preview mask to 256 px on the long side with values 0 or 255', () => {
  const wide: CategoryMask = { widthPx: 200, heightPx: 100, data: new Uint8Array(200 * 100).map((_, i) => (i % 200 < 100 ? SEGMENT.hair : SEGMENT.faceSkin)) };
  const p = previewMask(wide);
  expect([p.widthPx, p.heightPx]).toEqual([256, 128]);
  expect(new Set(p.data)).toEqual(new Set([0, 255]));
  expect(p.data[0]).toBe(255);
  expect(p.data[255]).toBe(0);
});

describe('fillHairHoles (the holes at the ends)', () => {
  const S = 100;
  /** A hair block over rows 20-79 with `clear` cells set to `other`. */
  const block = (clear: (x: number, y: number) => boolean, other: number = SEGMENT.background): CategoryMask => ({
    widthPx: S,
    heightPx: S,
    data: new Uint8Array(S * S).map((_, i) => {
      const [x, y] = [i % S, Math.floor(i / S)];
      if (y < 20 || y >= 80 || x < 20 || x >= 80) return SEGMENT.background;
      return clear(x, y) ? other : SEGMENT.hair;
    }),
  });
  const at = (m: CategoryMask, x: number, y: number): number | undefined => m.data[y * S + x];

  it('fills a small hole in the hair and leaves the outer edge where it was', () => {
    const filled = fillHairHoles(block((x, y) => x >= 49 && x <= 50 && y >= 49 && y <= 50));
    expect(at(filled, 49, 49)).toBe(SEGMENT.hair);
    expect(at(filled, 10, 10)).toBe(SEGMENT.background);
    expect(at(filled, 19, 50)).toBe(SEGMENT.background);
  });

  it('never paints over face skin, however small the gap', () => {
    const filled = fillHairHoles(block((x, y) => x >= 49 && x <= 50 && y >= 49 && y <= 50, SEGMENT.faceSkin));
    expect(at(filled, 49, 49)).toBe(SEGMENT.faceSkin);
  });

  it('never paints over neck skin, clothes or an accessory, however small', () => {
    for (const other of [SEGMENT.bodySkin, SEGMENT.clothes, SEGMENT.other]) {
      const filled = fillHairHoles(block((x, y) => x >= 49 && x <= 50 && y >= 49 && y <= 50, other));
      expect(at(filled, 49, 49)).toBe(other);
    }
  });

  it('leaves a large gap and a notch open to the outside alone', () => {
    const large = fillHairHoles(block((x, y) => x >= 30 && x <= 69 && y >= 45 && y <= 54));
    expect(at(large, 50, 50)).toBe(SEGMENT.background);
    const notch = fillHairHoles(block((x, y) => x >= 49 && x <= 50 && y >= 20 && y <= 30));
    expect(at(notch, 49, 25)).toBe(SEGMENT.background);
  });
});

it('composes every measure', () => {
  const mask = head();
  const m = hairMeasures(mask, image(mask), landmarks());
  expect(m.hairlineVisible).toBe(true);
  expect(m.extent?.top).toBe(0.1);
  expect(m.colour.hair).not.toBeNull();
});

describe('reachableFrom', () => {
  const grid = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0];
  it('fills only what is joined four-way to the seed, and only through open cells', () => {
    const reached = reachableFrom([0], (cell) => grid[cell] === 1, 4, 4);
    expect(Array.from(reached.subarray(0, 4))).toEqual([1, 1, 0, 0]);
    expect(reached[7], 'behind the wall').toBe(0);
    expect(Array.from(reached).filter(Boolean)).toHaveLength(8);
  });
  it('a closed seed fills nothing', () => {
    expect(Array.from(reachableFrom([2], (cell) => grid[cell] === 1, 4, 4)).filter(Boolean)).toHaveLength(0);
  });
});
