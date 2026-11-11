/** Sharpness: known Laplacian variances (flat, checkerboard, a single edge) and blur lowering the score. */
import { describe, expect, it } from 'vitest';
import { greyOf, laplacianVariance, sharpness } from './sharpness.ts';

function rgba(widthPx: number, heightPx: number, grey: (x: number, y: number) => number) {
  const data = new Uint8ClampedArray(widthPx * heightPx * 4);
  for (let y = 0; y < heightPx; y++) for (let x = 0; x < widthPx; x++) data.set([grey(x, y), grey(x, y), grey(x, y), 255], (y * widthPx + x) * 4);
  return { widthPx, heightPx, data };
}

describe('sharpness', () => {
  it('uses Rec. 601 luma', () => {
    const red = { widthPx: 1, heightPx: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) };
    expect(greyOf(red)[0]).toBeCloseTo(0.299 * 255, 3);
  });

  it('is 0 on a flat image and 1020² on a 0/255 checkerboard', () => {
    expect(sharpness(rgba(16, 16, () => 128))).toBe(0);
    // Every interior pixel differs by 255 from its 4 neighbours: Laplacian ±1020, mean 0.
    expect(sharpness(rgba(16, 16, (x, y) => ((x + y) % 2 === 0 ? 255 : 0)))).toBeCloseTo(1020 ** 2, 3);
  });

  it('worked by hand on a vertical edge', () => {
    // 4 x 3, columns 0 0 100 100: interior pixels (1,1) and (2,1) give +100 and -100: variance 10 000.
    expect(laplacianVariance(new Float32Array([0, 0, 100, 100, 0, 0, 100, 100, 0, 0, 100, 100]), 4, 3)).toBe(10000);
    expect(laplacianVariance(new Float32Array(4), 2, 2)).toBe(0);
  });

  it('drops when the same picture is blurred', () => {
    const sharp = (x: number, y: number): number => (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 ? 230 : 20;
    const blurred = (x: number, y: number): number => {
      let s = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += sharp(x + dx + 8, y + dy + 8);
      return s / 25;
    };
    expect(sharpness(rgba(64, 64, blurred))).toBeLessThan(sharpness(rgba(64, 64, (x, y) => sharp(x + 8, y + 8))) / 4);
  });
});
