/** Colour hints: Lab ↔ sRGB swatches round-trip, ITA° classes worked by hand, nearest reference. */
import { describe, expect, it } from 'vitest';
import { srgbToLab } from '../colour/lab.ts';
import { colourHints, itaDeg, labToHex, nearest, skinDepthHint } from './colour.ts';

const hex = (r: number, g: number, b: number): string => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

describe('colour hints', () => {
  it('turns Lab back into the sRGB it came from', () => {
    for (const [r, g, b] of [[0, 0, 0], [255, 255, 255], [40, 30, 20], [200, 160, 140], [60, 90, 140], [255, 0, 0], [1, 254, 7]] as const) {
      expect(labToHex(srgbToLab(r, g, b))).toBe(hex(r, g, b));
    }
    expect(labToHex({ l: 50, a: 120, b: -120 })).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('classes skin by the Individual Typology Angle', () => {
    // atan((70 - 50) / 10) = 63.4°, atan(10 / 15) = 33.7°, atan(-10 / 20) = -26.6°, atan(-25 / 10) = -68.2°.
    expect(itaDeg({ l: 70, a: 8, b: 10 })).toBeCloseTo(63.435, 3);
    expect(skinDepthHint({ l: 70, a: 8, b: 10 })).toBe('very_light');
    expect(skinDepthHint({ l: 60, a: 10, b: 15 })).toBe('medium');
    expect(skinDepthHint({ l: 55, a: 10, b: 15 })).toBe('tan_olive');
    expect(skinDepthHint({ l: 40, a: 10, b: 20 })).toBe('deep');
    expect(skinDepthHint({ l: 25, a: 8, b: 10 })).toBe('very_deep');
    expect(skinDepthHint({ l: 60, a: 0, b: -3 })).toBeNull();
  });

  it('points a hair sample to the nearest reference swatch', () => {
    const refs = [{ value: 2, lab: { l: 20, a: 2, b: 3 } }, { value: 6, lab: { l: 45, a: 8, b: 20 } }];
    expect(nearest({ l: 40, a: 6, b: 18 }, refs)).toBe(6);
    expect(nearest({ l: 40, a: 6, b: 18 }, [])).toBeNull();
    const hints = colourHints({ hair: { l: 22, a: 2, b: 4 }, skin: null, eyes: srgbToLab(60, 90, 140) }, refs);
    expect(hints).toEqual({ hair: { swatch: expect.stringMatching(/^#/) as string, nearest: 2 }, skin: null, eyes: { swatch: '#3c5a8c' } });
  });
});
