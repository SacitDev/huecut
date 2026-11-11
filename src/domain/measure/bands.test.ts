/** Bands: cuts and margins worked by hand, gates, views, unset bands and broken content. */
import { describe, expect, it } from 'vitest';
import type { Band, Bands } from '../content/types.ts';
import type { FaceFacts, FusedValue } from '../fuse/fuse.ts';
import { applyBand, bandReadings, bandValue, basisOf, MEDIUM_MARGIN_FACTOR, numericReadings } from './bands.ts';

/** Illustrative cuts for the test only; the real ones are in `content/bands.json`. */
const PROPORTION: Band = {
  fact: 'face.proportion', from: 'width_to_length', view: 'frontal', margin: 0.02,
  cuts: [{ below: 0.75, value: 'longer' }, { below: 0.85, value: 'balanced' }, { value: 'rounder' }],
};
const FOREHEAD: Band = {
  fact: 'face.forehead_share', from: 'forehead_share', view: 'frontal', margin: 0.05, requires: ['hairline_visible'],
  cuts: [{ below: 0.9, value: 'shorter' }, { below: 1.1, value: 'similar' }, { value: 'longer' }],
};

const fused = (value: number, extra: Partial<FusedValue> = {}): FusedValue => ({ value, confidence: 'medium', photos: 3, agreeing: 3, approximate: false, ...extra });
const facts = (frontal: FaceFacts['frontal']['values'], hairlineVisible = true): FaceFacts => ({
  frontal: { values: frontal, hairlineVisible },
  profile: { values: { width_to_length: fused(0.6) }, hairlineVisible: false },
});

describe('bands', () => {
  it('picks the cut, names the value across a cut within its margin, and is low there', () => {
    expect(bandValue(PROPORTION, 0.7, 'high')).toEqual({ value: 'longer', between: null });
    expect(bandValue(PROPORTION, 0.74, 'high')).toEqual({ value: 'longer', between: 'balanced' });
    expect(bandValue(PROPORTION, 0.75, 'high')).toEqual({ value: 'balanced', between: 'longer' });
    expect(bandValue(PROPORTION, 0.8, 'high')).toEqual({ value: 'balanced', between: null });
    expect(bandValue(PROPORTION, 0.84, 'high')).toEqual({ value: 'balanced', between: 'rounder' });
    expect(bandValue(PROPORTION, 0.9, 'high')).toEqual({ value: 'rounder', between: null });
    expect(applyBand(PROPORTION, facts({ width_to_length: fused(0.8) }))).toEqual({ fact: 'face.proportion', value: 'balanced', confidence: 'medium', basis: '3 photos agree' });
    expect(applyBand(PROPORTION, facts({ width_to_length: fused(0.86, { confidence: 'high' }) }))?.confidence).toBe('low');
  });

  it('widens the margin by 1.5 below high confidence (provisional)', () => {
    expect(MEDIUM_MARGIN_FACTOR).toBe(1.5);
    // 0.775 is 0.025 from the 0.75 cut: outside 0.02, inside 0.03.
    expect(bandValue(PROPORTION, 0.775, 'high')).toEqual({ value: 'balanced', between: null });
    expect(bandValue(PROPORTION, 0.775, 'medium')).toEqual({ value: 'balanced', between: 'longer' });
    expect(bandValue(PROPORTION, 0.775, 'low')).toEqual({ value: 'balanced', between: 'longer' });
    expect(bandValue(PROPORTION, 0.785, 'medium')).toEqual({ value: 'balanced', between: null });
    expect(applyBand(PROPORTION, facts({ width_to_length: fused(0.775) }))?.confidence).toBe('low');
    expect(applyBand(PROPORTION, facts({ width_to_length: fused(0.775, { confidence: 'high' }) }))?.confidence).toBe('high');
  });

  it('reads only its own view, and gives nothing without the value', () => {
    // The profile view holds 0.6 ("longer"); the frontal band must not see it.
    expect(applyBand(PROPORTION, facts({}))).toBeNull();
    expect(applyBand({ ...PROPORTION, view: 'profile' }, facts({}))?.value).toBe('longer');
  });

  it('honours the hairline gate', () => {
    expect(applyBand(FOREHEAD, facts({ forehead_share: fused(1.2) }))?.value).toBe('longer');
    expect(applyBand(FOREHEAD, facts({ forehead_share: fused(1.2) }, false))).toBeNull();
  });

  it('gives nothing while a band is unset, and throws on a measurement that does not exist', () => {
    const values = facts({ width_to_length: fused(0.8) });
    expect(applyBand({ ...PROPORTION, margin: null }, values)).toBeNull();
    expect(applyBand({ ...PROPORTION, cuts: [{ below: null, value: 'longer' }, { value: 'rounder' }] }, values)).toBeNull();
    expect(() => applyBand({ ...PROPORTION, from: 'eye_spacing' }, values)).toThrow(/not a measurement/);
    const bands: Bands = { bands: [PROPORTION, FOREHEAD], current_length_cm: { very_short: [0, 3], short: [3, 8], chin: [8, 20], shoulder: [20, 30], long: [30, 45], very_long: [45, 100] } };
    expect(bandReadings(bands, values).map((r) => r.fact)).toEqual(['face.proportion']);
  });

  it('says the basis in plain words', () => {
    expect(basisOf(fused(1, { photos: 1, agreeing: 1 }))).toBe('1 photo');
    expect(basisOf(fused(1, { photos: 3, agreeing: 2 }))).toBe('2 of 3 photos agree');
    expect(basisOf(fused(1, { photos: 2, agreeing: 2, approximate: true }))).toBe('2 photos agree, approximate (close-up photo)');
  });
});

describe('numericReadings', () => {
  const on = (values: Partial<Record<'width_to_length' | 'jaw_to_cheek', FusedValue>>): FaceFacts => ({ frontal: { values, hairlineVisible: true }, profile: { values: {}, hairlineVisible: false } });

  it('passes on the width and the jaw from medium confidence with their own confidence (the engine reads a medium jaw in clear cases only); low stays unknown, so neutral', () => {
    const width = (confidence: FusedValue['confidence']) => ({ fact: 'face.width_to_length', value: 0.84, confidence, basis: '3 photos agree' });
    expect(numericReadings(on({ width_to_length: fused(0.84, { confidence: 'high' }) }))).toEqual([width('high')]);
    expect(numericReadings(on({ width_to_length: fused(0.84, { confidence: 'medium' }), jaw_to_cheek: fused(0.9, { confidence: 'medium' }) }))).toEqual([width('medium'), { fact: 'face.jaw_to_cheek', value: 0.9, confidence: 'medium', basis: '3 photos agree' }]);
    expect(numericReadings(on({ width_to_length: fused(0.84, { confidence: 'low' }), jaw_to_cheek: fused(0.9, { confidence: 'low' }) }))).toEqual([]);
    expect(numericReadings(on({ jaw_to_cheek: fused(0.9, { confidence: 'high' }) }))).toEqual([{ fact: 'face.jaw_to_cheek', value: 0.9, confidence: 'high', basis: '3 photos agree' }]);
  });

  it('leaves out a value outside the fact range instead of failing', () => {
    expect(numericReadings(on({ width_to_length: fused(2, { confidence: 'high' }) }))).toEqual([]);
  });
});
