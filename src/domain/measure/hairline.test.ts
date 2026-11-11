/** The hairline reading (mask points, the person's own line, unknown) and the midline height. */
import { describe, expect, it } from 'vitest';
import { hairlineHeight, hairlineOf, MIDLINE_HALF_WIDTH_OF_CHEEK } from './hairline.ts';
import type { HairMeasures } from './observation.ts';

const hair = (points: readonly number[], visible: boolean): HairMeasures => ({
  coverage: 0.1, extent: null, hairline: new Float32Array(points), hairlineVisible: visible, colour: { hair: null, skin: null, eyes: null },
});

describe('hairline', () => {
  it('reads the mask points left to right, and keeps their visibility', () => {
    const r = hairlineOf(hair([0.5, 0.25, 0.25, 0.5], true), null);
    expect(r).toEqual({ points: [{ x: 0.25, y: 0.5 }, { x: 0.5, y: 0.25 }], visible: true, edited: false });
    expect(hairlineOf(hair([0.5, 0.25], false), null)?.visible).toBe(false);
    expect(hairlineOf(hair([], true), null)?.visible).toBe(false);
  });

  it('prefers the line the person placed, and is unknown without mask or edit', () => {
    expect(hairlineOf(hair([], false), [{ x: 0.6, y: 0.2 }, { x: 0.4, y: 0.21 }])).toEqual({
      points: [{ x: 0.4, y: 0.21 }, { x: 0.6, y: 0.2 }], visible: true, edited: true,
    });
    expect(hairlineOf(null, null)).toBeNull();
    expect(hairlineOf(null, [])).toBeNull();
  });

  it('takes the median height of the points near the midline only', () => {
    // Cheek 400 px: points within 100 px of x = 0 count; the temple points at ±150 do not.
    expect(MIDLINE_HALF_WIDTH_OF_CHEEK * 400).toBe(100);
    const points = [{ x: -150, y: -300 }, { x: -100, y: -210 }, { x: 0, y: -200 }, { x: 60, y: -190 }, { x: 150, y: -300 }];
    expect(hairlineHeight(points, 0, 400)).toBe(-200);
    expect(hairlineHeight([{ x: -100, y: -210 }, { x: 60, y: -190 }], 0, 400)).toBe(-200);
    expect(hairlineHeight([{ x: 150, y: -300 }], 0, 400)).toBeNull();
  });
});
