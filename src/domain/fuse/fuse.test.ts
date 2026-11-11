/**
 * Fusion: the weighted median worked by hand, an outlier photo, near-identical photos counting once, frontal
 * and profile never mixed, and the confidence of the photo whose value is the median.
 */
import { describe, expect, it } from 'vitest';
import type { Confidence } from '../facts/registry.ts';
import type { MeasureKey, PhotoMeasurements } from '../measure/measure.ts';
import type { MeasureView } from '../measure/quality.ts';
import { distinctPhotos, fuse, nearIdentical, weightedMedian } from './fuse.ts';

const WEIGHT: Record<Confidence, number> = { high: 1, medium: 0.4, low: 0.15 };
let shot = 0;

/** One photo's measurements; every photo stands somewhere new unless `at` repeats a place. */
function photo(values: Partial<Record<MeasureKey, number>>, options: { confidence?: Confidence; view?: MeasureView; at?: number; approximate?: boolean } = {}): PhotoMeasurements {
  const confidence = options.confidence ?? 'medium';
  const place = options.at ?? ++shot;
  const approximate = options.approximate ?? false;
  return {
    view: options.view ?? 'frontal',
    lines: [], ticks: [], issues: [], approximate, camera: null,
    confidence,
    weight: WEIGHT[confidence],
    values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v, confidence, approximate }])),
    pose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0 },
    // Consecutive photos sit 3% of the image apart, past the 2% near-identical limit.
    face: { x: 0.03 * (place % 30), y: 0.4, width: 0.3 },
    hairlineVisible: values.third_upper !== undefined,
  };
}

describe('weighted median', () => {
  it('worked by hand', () => {
    // Weights 1, 1, 2 (half 2): the cumulative weight is exactly half after the second value, so the mean of 2 and 3.
    expect(weightedMedian([{ value: 3, weight: 2, confidence: 'high' }, { value: 1, weight: 1, confidence: 'high' }, { value: 2, weight: 1, confidence: 'medium' }])).toEqual({ value: 2.5, confidence: 'medium' });
    expect(weightedMedian([{ value: 1, weight: 1, confidence: 'high' }, { value: 2, weight: 3, confidence: 'low' }])).toEqual({ value: 2, confidence: 'low' });
    expect(weightedMedian([{ value: 7, weight: 0.4, confidence: 'medium' }])).toEqual({ value: 7, confidence: 'medium' });
  });
});

describe('fuse: medians, duplicates and views', () => {
  it('keeps one photo as it is', () => {
    const f = fuse([photo({ width_to_length: 0.78 }, { confidence: 'high' })]);
    expect(f.frontal.values.width_to_length).toEqual({ value: 0.78, confidence: 'high', photos: 1, agreeing: 1, approximate: false });
  });

  it('ignores an outlier photo and keeps the confidence when most agree', () => {
    const f = fuse([0.8, 0.81, 0.79, 0.8, 1.2].map((v) => photo({ width_to_length: v })));
    expect(f.frontal.values.width_to_length).toEqual({ value: 0.8, confidence: 'medium', photos: 5, agreeing: 4, approximate: false });
  });

  it('counts near-identical photos once', () => {
    const first = photo({ width_to_length: 0.7 }, { at: 100 });
    const burst = [first, photo({ width_to_length: 0.7 }, { at: 100 }), photo({ width_to_length: 0.7 }, { at: 100 })];
    const others = [photo({ width_to_length: 0.8 }), photo({ width_to_length: 0.8 })];
    expect(nearIdentical(first, { ...first, face: { x: 0.315, y: 0.41, width: 0.305 }, pose: { yawDeg: 1.5, pitchDeg: -1, rollDeg: 2 } })).toBe(true);
    expect(nearIdentical(first, { ...first, pose: { yawDeg: 2.5, pitchDeg: 0, rollDeg: 0 } })).toBe(false);
    expect(nearIdentical(first, { ...first, face: { x: 0.3, y: 0.4, width: 0.31 } })).toBe(false);
    expect(nearIdentical(first, { ...first, view: 'profile' })).toBe(false);
    expect(distinctPhotos([...burst, ...others])).toHaveLength(3);
    // Without the rule the three copies would win (0.7); counted once they are outvoted.
    expect(fuse([...burst, ...others]).frontal.values.width_to_length).toMatchObject({ value: 0.8, photos: 3, agreeing: 2 });
  });

  it('never mixes frontal and profile values', () => {
    const f = fuse([
      photo({ third_upper: 0.3 }), photo({ third_upper: 0.31 }),
      photo({ third_upper: 0.4 }, { view: 'profile' }), photo({ third_upper: 0.41 }, { view: 'profile' }), photo({ third_upper: 0.4 }, { view: 'profile' }),
    ]);
    expect(f.frontal.values.third_upper).toMatchObject({ value: expect.closeTo(0.305, 9) as number, photos: 2 });
    expect(f.profile.values.third_upper).toMatchObject({ value: 0.4, photos: 3 });
    expect([f.frontal.hairlineVisible, f.profile.hairlineVisible]).toEqual([true, true]);
  });
});

describe('fuse: confidence', () => {
  it('takes the confidence of the photo whose value is the median, the lower of two on an exact half; disagreement only shows in the count', () => {
    // High (1) at 0.80 and medium (0.4) at 0.95: the median is the high photo's 0.80, so high.
    expect(fuse([photo({ jaw_to_cheek: 0.8 }, { confidence: 'high' }), photo({ jaw_to_cheek: 0.95 })]).frontal.values.jaw_to_cheek).toMatchObject({ value: 0.8, confidence: 'high', agreeing: 1 });
    // Two equal medium photos 0.70 and 0.90: an exact half, so the mean 0.80 and the lower of two mediums.
    expect(fuse([photo({ width_to_length: 0.7 }), photo({ width_to_length: 0.9 })]).frontal.values.width_to_length).toMatchObject({
      value: expect.closeTo(0.8, 9) as number, confidence: 'medium', agreeing: 0,
    });
    expect(fuse([photo({ width_to_length: 0.8 }, { confidence: 'high' }), photo({ width_to_length: 0.82 }, { confidence: 'high' }), photo({ width_to_length: 0.95 })]).frontal.values.width_to_length).toMatchObject({ value: 0.82, confidence: 'high' });
  });

  it('three medium photos whose shares spread by 10% fuse to medium at their median', () => {
    const f = fuse([0.95, 1.0, 1.045].map((v) => photo({ forehead_share: v, lower_share: v })));
    expect(f.frontal.values.forehead_share).toMatchObject({ value: 1.0, confidence: 'medium', photos: 3 });
    expect(f.frontal.values.lower_share).toMatchObject({ value: 1.0, confidence: 'medium', photos: 3 });
  });

  it('never raises confidence above the median photo, and leaves out weightless photos', () => {
    const agreeing = [0.8, 0.8, 0.81, 0.79].map((v) => photo({ width_to_length: v }));
    expect(fuse(agreeing).frontal.values.width_to_length?.confidence).toBe('medium');
    const unusable: PhotoMeasurements = { ...photo({ width_to_length: 2 }, { confidence: 'high' }), weight: 0 };
    const noView: PhotoMeasurements = { ...photo({ width_to_length: 2 }, { confidence: 'high' }), view: null };
    expect(fuse([...agreeing, unusable, noView]).frontal.values.width_to_length).toMatchObject({ value: 0.8, photos: 4 });
    expect(fuse([]).frontal).toEqual({ values: {}, hairlineVisible: false });
  });

  it('marks a value approximate only when every agreeing photo was a close-up', () => {
    const close = [photo({ width_to_length: 0.8 }, { confidence: 'low', approximate: true }), photo({ width_to_length: 0.8 }, { confidence: 'low', approximate: true })];
    expect(fuse(close).frontal.values.width_to_length?.approximate).toBe(true);
    expect(fuse([...close, photo({ width_to_length: 0.8 })]).frontal.values.width_to_length?.approximate).toBe(false);
  });
});
