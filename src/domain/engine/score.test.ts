/** Exclusions, `suppresses`, rank scoring on one scale (the group-A cap gone) and notes. */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import type { RuleFor } from '../content/types.ts';
import { exclusionsFor, notesFor, resultNotes, scoreItem, suppressedOn } from './score.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const review = { status: 'checked', date: '2026-11-08' } as const;
const POLICY = { weights: { weak: 1, moderate: 2, strong: 3 } };
type CutRule = RuleFor<'cut'>;
const rank = (id: string, over: Partial<Extract<CutRule, { effect: 'rank' }>>): CutRule =>
  ({ id, group: 'B', target: 'cut', effect: 'rank', strength: 'moderate', when: {}, favour: [], disfavour: [], reason: `Reason ${id}`, evidence: 'design_logic', review, ...over });

const C09: CutRule = {
  id: 'c09', group: 'C', target: 'cut', effect: 'exclude', when: { 'life.tie_back_needed': { is: true } }, on: { tie_back: { is: false } },
  because: 'You need to tie your hair back, so cuts too short to tie are left out.', evidence: 'design_logic', review,
};

it('excludes on answered facts only, and never on an unknown', () => {
  const short = { tie_back: false };
  expect(exclusionsFor('cut', short, [C09], answered({ 'life.tie_back_needed': true }))).toEqual([{ ruleId: 'c09', because: C09.because }]);
  expect(exclusionsFor('cut', { tie_back: true }, [C09], answered({ 'life.tie_back_needed': true }))).toEqual([]);
  expect(exclusionsFor('cut', short, [C09], answered({}))).toEqual([]);
  const derived = { 'life.tie_back_needed': { key: 'life.tie_back_needed', value: true, confidence: 'high', source: 'derived' } } as Facts;
  expect(exclusionsFor('cut', short, [C09], derived)).toEqual([]);
});

it('scores each rank rule once per item: +weight on favour, -weight on disfavour, 0 on both', () => {
  const rule = rank('b09', { favour: [{ perimeter: { is: 'blunt' } }, { layers: { in: ['none', 'light'] } }], disfavour: [{ cut_method: { is: 'thinning_shears' } }] });
  const facts = answered({});
  const both = scoreItem('cut', { perimeter: 'blunt', layers: ['none'], cut_method: ['thinning_shears'] }, [rule], facts, POLICY, new Set());
  expect(both.score).toBe(0);
  expect(both.contributions.map((c) => c.points)).toEqual([0]);
  // Two favour matches still count once: +2, not +4.
  const fav = scoreItem('cut', { perimeter: 'blunt', layers: ['none'], cut_method: ['point_cut'] }, [rule], facts, POLICY, new Set());
  expect(fav.score).toBe(2);
  expect(fav.contributions[0]?.favoured).toEqual([0, 1]);
  expect(scoreItem('cut', { perimeter: 'soft', layers: ['heavy'], cut_method: ['thinning_shears'] }, [rule], facts, POLICY, new Set()).score).toBe(-2);
  expect(scoreItem('cut', { perimeter: 'soft', layers: ['heavy'], cut_method: ['razor'] }, [rule], facts, POLICY, new Set()).contributions).toEqual([]);
});

it('counts a wish rule (group A) like any other, also when it is the only rule that fires (no group cap)', () => {
  const wish = rank('a28', { group: 'A', when: { 'wish.height': { is: 'emphasise' } }, favour: [{ height_top: { is: 'high' } }] });
  const texture = rank('b05', { strength: 'strong', favour: [{ perimeter: { is: 'blunt' } }] });
  expect(scoreItem('cut', { height_top: 'high', perimeter: 'soft' }, [wish], answered({ 'wish.height': 'emphasise' }), POLICY, new Set()).score).toBe(2);
  expect(scoreItem('cut', { height_top: 'high', perimeter: 'blunt' }, [wish, texture], answered({ 'wish.height': 'emphasise' }), POLICY, new Set()).score).toBe(5);
});

it('puts the missing keys of an unknown when in dependsOn, but not an absent wish (no preference)', () => {
  const a01 = rank('a01', { group: 'A', when: { 'face.proportion': { is: 'longer' }, 'wish.face_length': { is: 'soften' } }, favour: [{ part: { is: 'side' } }] });
  const b01 = rank('b01', { strength: 'strong', when: { 'hair.texture': { known: true } }, favour: [{ texture_fit: { is: 'good' } }] });
  expect(scoreItem('cut', { part: 'side' }, [a01, b01], answered({}), POLICY, new Set()).dependsOn).toEqual(['face.proportion']);
  expect(scoreItem('cut', { part: 'side' }, [a01], answered({ 'wish.face_length': 'soften' }), POLICY, new Set()).dependsOn).toEqual(['face.proportion']);
  // The when fails on a known value: nothing to wait for.
  expect(scoreItem('cut', { part: 'side' }, [a01], answered({ 'wish.face_length': 'emphasise' }), POLICY, new Set()).dependsOn).toEqual([]);
});

it('counts the strong rules that favoured the item', () => {
  const strong = rank('b01', { strength: 'strong', favour: [{ part: { is: 'side' } }] });
  const strongAgainst = rank('b02', { strength: 'strong', disfavour: [{ part: { is: 'side' } }] });
  const s = scoreItem('cut', { part: 'side' }, [strong, strongAgainst, rank('c01', { favour: [{ part: { is: 'side' } }] })], answered({}), POLICY, new Set());
  expect(s.strongFired).toBe(1);
  expect(s.score).toBe(3 - 3 + 2);
});

it('counts a strong rule only when it scored positively, so a penalty cannot win a tie', () => {
  const both = rank('b01', { strength: 'strong', favour: [{ part: { is: 'side' } }], disfavour: [{ part: { is: 'side' } }] });
  expect(scoreItem('cut', { part: 'side' }, [both], answered({}), POLICY, new Set())).toMatchObject({ score: 0, strongFired: 0 });
  const against = rank('b02', { strength: 'strong', disfavour: [{ part: { is: 'side' } }] });
  expect(scoreItem('cut', { part: 'side' }, [against], answered({}), POLICY, new Set())).toMatchObject({ score: -3, strongFired: 0 });
});

it('skips the records a suppressing record names, only on the items where it applies', () => {
  const a05 = rank('a05', { group: 'A', when: { 'wish.forehead': { is: 'soften' } }, favour: [{ fringe: { in: ['curtain', 'wispy'] } }] });
  const b20: CutRule = {
    id: 'b20', group: 'B', target: 'cut', effect: 'note', note: 'caution', when: { 'hair.cowlick_front': { is: true } },
    on: { fringe: { in: ['curtain', 'blunt_full'] } }, because: 'A front cowlick lifts a fringe.', suppresses: ['a05'], evidence: 'single_source', review,
  };
  const facts = answered({ 'hair.cowlick_front': true, 'wish.forehead': 'soften' });
  expect([...suppressedOn('cut', { fringe: 'curtain' }, [a05, b20], facts)]).toEqual(['a05']);
  expect([...suppressedOn('cut', { fringe: 'wispy' }, [a05, b20], facts)]).toEqual([]);
  expect([...suppressedOn('cut', { fringe: 'curtain' }, [a05, b20], answered({ 'wish.forehead': 'soften' }))]).toEqual([]);
});

it('suppresses one level deep: a suppressed record suppresses nothing', () => {
  const x = rank('x', { favour: [{ part: { is: 'side' } }], suppresses: ['y'] });
  const y = rank('y', { favour: [{ part: { is: 'side' } }], suppresses: ['z'] });
  const z = rank('z', { favour: [{ part: { is: 'side' } }] });
  const skipped = suppressedOn('cut', { part: 'side' }, [x, y, z], answered({}));
  expect([...skipped]).toEqual(['y']);
  expect(scoreItem('cut', { part: 'side' }, [x, y, z], answered({}), POLICY, skipped).contributions.map((c) => c.ruleId)).toEqual(['x', 'z']);
});

it('shows a note on the items its on matches, one per research id, and notes without on on the result', () => {
  const n1: CutRule = { id: 'b02', group: 'B', target: 'cut', effect: 'note', note: 'caution', when: { 'hair.texture': { in: ['curly', 'coily'] } }, on: { length_class: { in: ['chin', 'bob'] } }, because: 'Curls spring up.', evidence: 'trade_consensus', review };
  const n2: CutRule = { ...n1, id: 'b02-b', from: 'b02', on: { shrinkage_risk: { is: 'high' } } };
  const whole: CutRule = { id: 'c50', group: 'C', target: 'cut', effect: 'note', note: 'design', when: { 'life.event_soon': { is: true } }, because: 'Try a new cut a few weeks before the event.', evidence: 'design_logic', review };
  const facts = answered({ 'hair.texture': 'curly', 'life.event_soon': true });
  expect(notesFor('cut', { length_class: 'bob', shrinkage_risk: 'high' }, [n1, n2, whole], facts, new Set())).toEqual([{ ruleId: 'b02', from: 'b02', kind: 'caution', because: 'Curls spring up.' }]);
  expect(notesFor('cut', { length_class: 'long', shrinkage_risk: 'high' }, [n1, n2, whole], facts, new Set()).map((n) => n.ruleId)).toEqual(['b02-b']);
  expect(notesFor('cut', { length_class: 'bob', shrinkage_risk: 'high' }, [n1], facts, new Set(['b02']))).toEqual([]);
  expect(resultNotes([n1, whole], facts).map((n) => n.ruleId)).toEqual(['c50']);
});
