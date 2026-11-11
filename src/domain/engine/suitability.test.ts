/** The factor formulas: limits, neutrality for unknowns, the face factor, and the colour policy. Values by hand. */
import { describe, expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { Suitability } from '../content/suitability.ts';
import type { EngineCut, Feasibility } from './derive-traits.ts';
import { apparentRatio, aimTarget, cutFactors, frameFit, frameWords, hairShape, harmony, lookFit, rulesFactor } from './suitability.ts';

const S: Suitability = {
  rules: { tau: 6, cap: 6 },
  texture_fit: { good: 1, adapt: 0.7, poor: 0.15 }, density_fit: { good: 1, adapt: 0.8, poor: 0.3 },
  trim: { power: 3, floor: 0.05, miss: 0.85 }, styling: { grace_minutes: 5, power: 3, floor: 0.2, miss: 0.6 }, growth_weeks: 52,
  change: { subtle: [1, 0.95, 0.6, 0.25], noticeable: [0.75, 1, 0.9, 0.5], bold: [0.5, 0.8, 1, 0.95], unknown: [1, 1, 0.85, 0.5] },
  frame: {
    balance: 0.83, jaw_balance: 0.85, sigma: 0.09, jaw_sigma: 0.14, floor: 0.3, emphasise: 0.5, no_wish_aims: ['between', 'soften', 'preserve'],
    sides: { close: 0, medium: 0.02, full: 0.05 }, height: { flat: 0, low: 0.03, medium: 0.07, high: 0.13 }, length: {},
    fringe: { none: 0, micro: 0.02, short_blunt: 0.1, blunt_full: 0.14, bottleneck: 0.09, wispy: 0.05, curtain: 0.05, side_swept: 0.05, long_side: 0.06, textured_forward: 0.08, curly: 0.08 },
    zones: { sides: 0.02, temples: 0.01, crown: 0.02, jaw: 0.03, ends: 0.01 }, texture: { straight: 1, wavy: 1.15, curly: 1.35, coily: 1.5, mixed: 1.25 },
    jaw_clear: [0.78, 0.93], thirds: { miss: 0.6, heavy_fringes: ['micro', 'short_blunt', 'blunt_full', 'bottleneck'] },
  },
  colour: { tau: 2, cap: 9, lift_step: 0.03, label: { plausible: 1, uncertain: 0.5, needs_professional: 0.15 }, harmony: { sigma: 9, lightness: 0.22, targets: { warm: 12, neutral: -3, olive: -6, cool: -14 } } },
  slate: { lambda: 0.7, floor: 0.5, weights: {} },
  beards: { scale_mm: 190, sigma: 0.05, shown: 3, patchy: { full_mm: 12, full: 0.2, some_mm: 6, some: 0.6 }, not_paired: 0.6, wish_note: 1.3, short_chin_mm: 20 },
  because: {
    trim: '', styling: '', density: '',
    does: { adds_height: 'adds height', keeps_top_low: 'keeps the top low', sides_close: 'keeps the sides close', adds_width: 'adds width at the sides', fringe_line: 'a soft line', balanced: 'an even shape' },
    aim: { soften: '', between: '', preserve: '', emphasise: '' }, decisive_ratio: 1.25,
  },
  sources: {},
};
const answered = (values: Record<string, unknown>): Facts => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const measured = (values: Record<string, [unknown, string]>): Facts => Object.fromEntries(Object.entries(values).map(([key, [value, confidence]]) => [key, { key, value, confidence, source: 'measured' }]));
const TRAITS: ItemTraits<'cut'> = {
  length_class: 'shoulder', top_length: 'long', top_cm: [12, 20], scalp_mm: 300, hang_cm: 38, sides: 'none', height_top: 'low', volume_zone: ['ends'], sides_width: 'medium', perimeter: 'soft', part: 'side', fringe: 'none', layers: ['long_layers'],
  silhouette: 'long_layers', weight_removal: 'medium', cut_method: ['point_cut'], nape_style: 'natural', shrinkage_risk: 'low', tension: 'none', heat_dependent: false, grow_out_friendly: true, tie_back: true,
  covers_forehead: false, covers_ears: true, tucked_behind_ear: false, beard_blend: false, lineup: false, styling_minutes: [5, 10], trim_weeks: [6, 8], tags: [],
};
const CUT: EngineCut = {
  id: 'c', kind: 'cut', collections: ['salon'], traits: TRAITS, required_cm: 20,
  texture_fit: { straight: { fit: 'good' }, wavy: { fit: 'adapt' }, curly: { fit: 'poor' }, coily: { fit: 'poor' } },
  density_fit: { low: { fit: 'good' }, medium: { fit: 'adapt' }, high: { fit: 'poor' } },
};
const TODAY: Feasibility = { length: { status: 'today' }, adapting: [], status: 'today', dependsOn: [] };
const grown: Feasibility = { length: { status: 'after_growth', cm: 10, weeks: 52 }, adapting: [], status: 'after_growth', dependsOn: [] };
const points = 0;

describe('cutFactors', () => {
  it('is neutral on what is unknown: only the rule factor is present', () => {
    expect(cutFactors(CUT, {}, { length: null, adapting: [], status: null, dependsOn: [] }, null, {}, points, S)).toEqual({ rules: 1 });
  });

  it('reads each fit, the stated limits and the size of the change', () => {
    const f = cutFactors(CUT, { texture_fit: 'poor', density_fit: 'adapt' }, grown, 3, answered({ 'life.trim_weeks_ok': 16, 'life.styling_minutes': 5, 'pref.change_amount': 'subtle' }), 6, S);
    expect(f.texture).toBe(0.15);
    expect(f.density).toBe(0.8);
    // Stated 16 weeks, this cut lasts 8 at most: half the interval, so a factor of 8 after the step for missing it.
    expect(f.trim).toBeCloseTo(0.85 * 0.125);
    expect(f.styling).toBe(1);
    expect(f.growth).toBeCloseTo(Math.exp(-1));
    expect(f.change).toBe(0.25);
    expect(f.rules).toBeCloseTo(Math.E);
  });

  it('keeps a miss of a stated limit visible, however small, and bounds it from below', () => {
    expect(cutFactors(CUT, {}, TODAY, null, answered({ 'life.trim_weeks_ok': 8 }), points, S).trim).toBe(1);
    expect(cutFactors(CUT, {}, TODAY, null, answered({ 'life.trim_weeks_ok': 9 }), points, S).trim).toBeCloseTo(0.85 * (8 / 9) ** 3);
    expect(cutFactors(CUT, {}, TODAY, null, answered({ 'life.trim_weeks_ok': 26 }), points, S).trim).toBe(0.05);
    expect(cutFactors({ ...CUT, traits: { ...TRAITS, styling_minutes: [6, 20] } }, {}, TODAY, null, answered({ 'life.styling_minutes': 5 }), points, S).styling).toBeCloseTo(0.6 * (10 / 11) ** 3);
  });

  it('bounds the rule score, so a long list of small wins cannot pay for a failed limit', () => {
    expect(rulesFactor(60, S.rules)).toBeCloseTo(Math.E);
    expect(rulesFactor(-60, S.rules)).toBeCloseTo(1 / Math.E);
  });
});

describe('the frame', () => {
  const w = (value: number) => measured({ 'face.width_to_length': [value, 'high'] });
  const tall: ItemTraits<'cut'> = { ...TRAITS, height_top: 'high', sides_width: 'close', volume_zone: ['crown'] };
  const wide: ItemTraits<'cut'> = { ...TRAITS, height_top: 'low', sides_width: 'full', volume_zone: ['sides'] };
  const at = (t: ItemTraits<'cut'>, facts: Facts) => frameFit(hairShape(t, facts, S.frame), facts, S.frame);

  it('measures the apparent proportion a cut gives', () => {
    expect(apparentRatio(0.93, { width: 0, height: 0.13, fringe: 0, jaw: 0 })).toBeCloseTo(0.93 / 1.13);
    expect(aimTarget('between', 0.95, 0.83, 0.5)).toBeCloseTo(0.89);
    expect(aimTarget('soften', 0.95, 0.83, 0.5)).toBe(0.83);
    expect(aimTarget('preserve', 0.95, 0.83, 0.5)).toBe(0.95);
    expect(aimTarget('emphasise', 0.95, 0.83, 0.5)).toBeCloseTo(1.01);
  });

  it('with no wish takes the house aim alone, favours height and close sides on a rounder face and side width on a longer one', () => {
    const round = w(0.95);
    expect(at(tall, round)?.aims).toEqual(['between']);
    expect(at(tall, round)?.at[0]).toBeGreaterThan(at(wide, round)?.at[0] ?? 1);
    const long = w(0.72);
    expect(at(wide, long)?.at[0]).toBeGreaterThan(at(tall, long)?.at[0] ?? 1);
  });

  it('says what the cut does, in at most two parts', () => {
    expect(frameWords(tall, S.because.does)).toBe('adds height and keeps the sides close');
    expect(frameWords(wide, S.because.does)).toBe('keeps the top low and adds width at the sides');
    expect(frameWords({ ...TRAITS, height_top: 'medium', volume_zone: [], sides_width: 'medium', fringe: 'none' }, S.because.does)).toBe('an even shape');
  });
});

describe('the frame, with wishes and uncertainty', () => {
  const w = (value: number) => measured({ 'face.width_to_length': [value, 'high'] });
  const tall: ItemTraits<'cut'> = { ...TRAITS, height_top: 'high', sides_width: 'close', volume_zone: ['crown'] };
  const wide: ItemTraits<'cut'> = { ...TRAITS, height_top: 'low', sides_width: 'full', volume_zone: ['sides'] };
  const at = (t: ItemTraits<'cut'>, facts: Facts) => frameFit(hairShape(t, facts, S.frame), facts, S.frame);

  it('takes the proportion wish as the one aim; a concrete wish acts through its rules, never through the face', () => {
    const preserve = { ...w(0.95), ...answered({ 'wish.overall_balance': 'preserve' }) };
    expect(at(tall, preserve)?.aims).toEqual(['preserve']);
    expect(at(tall, { ...w(0.72), ...answered({ 'wish.face_length': 'soften' }) })?.aims).toEqual(['between']);
    expect(at(tall, { ...w(0.95), ...answered({ 'wish.face_width': 'soften' }) })?.aims).toEqual(['between']);
  });

  it('reads the width from medium confidence, is neutral below it, and never lower than its floor', () => {
    expect(at(tall, measured({ 'face.width_to_length': [0.95, 'low'] }))).toBeNull();
    expect(at(tall, measured({ 'face.width_to_length': [0.95, 'medium'] }))?.at[0]).toBe(at(tall, w(0.95))?.at[0]);
    expect(at(tall, {})).toBeNull();
    const floorFact = measured({ 'face.width_to_length': [1.3, 'high'] });
    expect(Math.min(...(at(wide, floorFact)?.at ?? [0]))).toBeGreaterThanOrEqual(S.frame.floor);
  });

  it('adds the jaw term at high confidence, and at medium only in the clear cases outside 0.78-0.93', () => {
    const noJaw = at(tall, w(0.95));
    const jaw = (value: number, confidence: string) => at(tall, { ...w(0.95), ...measured({ 'face.jaw_to_cheek': [value, confidence] }) })?.at[0];
    expect(jaw(0.95, 'high')).not.toBe(noJaw?.at[0]);
    expect(jaw(0.95, 'medium')).not.toBe(noJaw?.at[0]);
    expect(jaw(0.75, 'medium')).not.toBe(noJaw?.at[0]);
    expect(jaw(0.85, 'medium')).toBe(noJaw?.at[0]);
  });

  it('reads the forehead and lower third with no wish about them, inside the same bounded factor, also without a width', () => {
    const fit = (t: ItemTraits<'cut'>, facts: Facts) => frameFit(hairShape(t, facts, S.frame), facts, S.frame, undefined, t)?.at[0];
    const longer = measured({ 'face.forehead_share': ['longer', 'medium'] });
    const shorter = measured({ 'face.forehead_share': ['shorter', 'medium'] });
    const fringe = { ...TRAITS, fringe: 'curtain' } as const;
    const heavy = { ...TRAITS, fringe: 'blunt_full' } as const;
    // A taller forehead: a fringe over none; a shorter one: anything over a heavy fringe; a close-up gives these with no width.
    expect(fit(fringe, longer)).toBeGreaterThan(fit(TRAITS, longer) ?? 1);
    expect(fit(fringe, shorter)).toBeGreaterThan(fit(heavy, shorter) ?? 1);
    expect(fit(TRAITS, longer)).toBe(S.frame.floor + (1 - S.frame.floor) * S.frame.thirds.miss);
    // A wish about the forehead leads; the reading then says nothing.
    expect(fit(TRAITS, { ...longer, ...answered({ 'wish.forehead': 'emphasise' }) })).toBeUndefined();
    // A longer lower third: length and volume at the jaw over a blunt chin-length line.
    const lower = measured({ 'face.lower_share': ['longer', 'medium'] });
    expect(fit({ ...TRAITS, length_class: 'shoulder', volume_zone: ['jaw'] }, lower)).toBeGreaterThan(fit({ ...TRAITS, length_class: 'chin', perimeter: 'blunt' }, lower) ?? 1);
  });
});

describe('colour order', () => {
  const fit = lookFit;
  it('puts a moderate preference above the step from Plausible to Uncertain, and needs two strong ones to pass a colourist label', () => {
    expect(fit(2, 'uncertain', null, S.colour)).toBeGreaterThan(fit(0, 'plausible', null, S.colour));
    expect(fit(3, 'needs_professional', null, S.colour)).toBeLessThan(fit(0, 'plausible', null, S.colour));
    expect(fit(6, 'needs_professional', null, S.colour)).toBeGreaterThan(fit(0, 'plausible', null, S.colour));
  });

  it('puts the smaller change in level first at equal preference and label, and is neutral on an unknown lift', () => {
    expect(fit(0, 'uncertain', 1, S.colour)).toBeGreaterThan(fit(0, 'uncertain', 3, S.colour));
    expect(fit(0, 'uncertain', -2, S.colour)).toBeCloseTo(fit(0, 'uncertain', 2, S.colour));
    expect(fit(0, 'uncertain', null, S.colour)).toBeGreaterThan(fit(0, 'uncertain', 1, S.colour));
  });

  it('breaks ties by harmony only from an undertone the person confirmed, and never from a measured one', () => {
    const lab = { root: null, mids: { shadows: [0, 0, 0], mid: [50, 0, 25], light: [0, 0, 0] }, ends: null } as const;
    const warm = harmony(lab, answered({ 'look.undertone': 'warm' }), S.colour.harmony);
    const cool = harmony(lab, answered({ 'look.undertone': 'cool' }), S.colour.harmony);
    expect(warm).toBeGreaterThan(cool);
    expect(harmony(lab, {}, S.colour.harmony)).toBe(0);
    expect(harmony(undefined, answered({ 'look.undertone': 'warm' }), S.colour.harmony)).toBe(0);
    expect(harmony(lab, measured({ 'look.undertone': ['warm', 'high'] }), S.colour.harmony)).toBe(0);
  });
});
