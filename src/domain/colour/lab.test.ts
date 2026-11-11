/** Known answers for sRGB to Lab (D65), checked against the published conversion values, and the way back. */
import { describe, expect, it } from 'vitest';
import { labToSrgb, linearise, medianLab, srgbToLab } from './lab.ts';

const close = (actual: { l: number; a: number; b: number }, expected: readonly [number, number, number], digits = 1): void => {
  expect(actual.l).toBeCloseTo(expected[0], digits);
  expect(actual.a).toBeCloseTo(expected[1], digits);
  expect(actual.b).toBeCloseTo(expected[2], digits);
};

describe('sRGB to Lab', () => {
  it('maps the primaries, white, black and mid grey to their known Lab values', () => {
    close(srgbToLab(255, 255, 255), [100, 0, 0]);
    close(srgbToLab(0, 0, 0), [0, 0, 0]);
    close(srgbToLab(255, 0, 0), [53.24, 80.09, 67.2]);
    close(srgbToLab(0, 255, 0), [87.73, -86.18, 83.18]);
    close(srgbToLab(0, 0, 255), [32.3, 79.19, -107.86]);
    close(srgbToLab(128, 128, 128), [53.59, 0, 0]);
  });

  it('linearises with the sRGB curve, including its linear toe', () => {
    expect(linearise(0)).toBe(0);
    expect(linearise(255)).toBeCloseTo(1, 10);
    expect(linearise(10)).toBeCloseTo(10 / 255 / 12.92, 10);
    expect(linearise(128)).toBeCloseTo(0.2158605, 6);
  });

  it('converts back to the same sRGB bytes, and clamps colours outside the gamut', () => {
    for (let v = 0; v < 256; v += 15) {
      for (const rgb of [[v, v, v], [v, 255 - v, 40], [200, v, 255 - v]] as const) {
        expect(labToSrgb(srgbToLab(rgb[0], rgb[1], rgb[2]))).toEqual(rgb);
      }
    }
    expect(labToSrgb({ l: 50, a: 300, b: 0 })).toEqual([255, 0, expect.any(Number)]);
    expect(labToSrgb({ l: -5, a: 0, b: 0 })).toEqual([0, 0, 0]);
  });

  it('takes the per-channel median of samples, and null of none', () => {
    expect(medianLab([])).toBeNull();
    expect(
      medianLab([
        { l: 10, a: 1, b: -3 },
        { l: 30, a: 5, b: 0 },
        { l: 20, a: 3, b: 9 },
      ]),
    ).toEqual({ l: 20, a: 3, b: 0 });
    expect(
      medianLab([
        { l: 10, a: 0, b: 0 },
        { l: 20, a: 2, b: 4 },
      ]),
    ).toEqual({ l: 15, a: 1, b: 2 });
  });
});
