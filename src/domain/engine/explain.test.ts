/** Reasons from the attributes that matched on that item, ordered and capped (engine stage 6). */
import { expect, it } from 'vitest';
import type { RankRule } from '../content/types.ts';
import { explain, reasonText } from './explain.ts';
import type { Contribution } from './score.ts';

const review = { status: 'checked', date: '2026-11-08' } as const;
const PHRASES = {
  'volume_zone.sides': 'width at the sides', 'fringe.curtain': 'a curtain fringe', 'fringe.side_swept': 'a side-swept fringe',
  'layers.face_framing': 'face-framing layers', 'part.side': 'a side part', 'styling_minutes.0-10': 'ten minutes of styling or less',
  'lightening.none': 'no lightening', 'tie_back.true': 'enough length to tie back',
};
const A01: RankRule<'cut'> = {
  id: 'a01', group: 'A', target: 'cut', effect: 'rank', strength: 'moderate', evidence: 'trade_consensus', review,
  when: { 'face.proportion': { is: 'longer' }, 'wish.face_length': { is: 'soften' } },
  favour: [{ volume_zone: { is: 'sides' } }, { fringe: { in: ['curtain', 'side_swept'] } }, { layers: { is: 'face_framing' } }, { part: { is: 'side' } }],
  disfavour: [{ height_top: { is: 'high' } }], reason: 'You would like to soften the look of length',
};

it('names only what matched on this item: the example with a side part only', () => {
  expect(reasonText('cut', A01, [3], { part: 'side', fringe: 'none', volume_zone: ['crown'] }, PHRASES))
    .toBe('You would like to soften the look of length, so this cut has a side part.');
});

it('joins at most two phrases with "and", in favour list order', () => {
  const traits = { part: 'side', fringe: 'curtain', volume_zone: ['sides'], layers: ['face_framing'] };
  expect(reasonText('cut', A01, [0, 1, 2, 3], traits, PHRASES)).toBe('You would like to soften the look of length, so this cut has width at the sides and a curtain fringe.');
});

it('takes the in values the item really has, and names a range by its own key', () => {
  expect(reasonText('cut', A01, [1], { fringe: 'side_swept' }, PHRASES)).toBe('You would like to soften the look of length, so this cut has a side-swept fringe.');
  const c01: RankRule<'cut'> = { ...A01, id: 'c01', group: 'C', favour: [{ styling_minutes: { range: [0, 10] } }, { tie_back: { is: true } }], reason: 'You want little styling time' };
  expect(reasonText('cut', c01, [0, 1], { styling_minutes: [3, 6], tie_back: true }, PHRASES))
    .toBe('You want little styling time, so this cut has ten minutes of styling or less and enough length to tie back.');
});

it('calls a colour look a look, and falls back to the reason alone when no matched value has a phrase', () => {
  const e40: RankRule<'colour'> = { id: 'e40', group: 'E', target: 'colour', effect: 'rank', strength: 'weak', evidence: 'design_logic', review,
    when: {}, favour: [{ lightening: { in: ['none', 'some'] } }, { vivid: { is: false } }], disfavour: [], reason: 'Your hair has no colour history yet' };
  expect(reasonText('colour', e40, [0], { lightening: 'none' }, PHRASES)).toBe('Your hair has no colour history yet, so this look has no lightening.');
  expect(reasonText('colour', e40, [1], { vivid: false }, PHRASES)).toBe('Your hair has no colour history yet.');
});

const c = (ruleId: string, group: Contribution['group'], strength: Contribution['strength'], points: number): Contribution => ({ ruleId, group, strength, points, favoured: [] });

it('gives reasons only for rules that really favoured the item, by strength then groups B, C, D, A, E, at most three', () => {
  const rule = (id: string, group: Contribution['group']): RankRule<'cut'> => ({ ...A01, id, group, favour: [], reason: `Reason ${id}` });
  const rules = new Map(['a1', 'b1', 'c1', 'd1', 'e1', 'b2', 'b3'].map((id) => [id, rule(id, id[0]?.toUpperCase() as Contribution['group'])]));
  const contributions = [c('a1', 'A', 'strong', 3), c('e1', 'E', 'strong', 3), c('d1', 'D', 'moderate', 2), c('c1', 'C', 'moderate', 2), c('b1', 'B', 'weak', 1), c('b2', 'B', 'strong', -3), c('b3', 'B', 'strong', 0)];
  const policy = { max_reasons: 3, reason_group_order: ['B', 'C', 'D', 'A', 'E'] as const };
  expect(explain('cut', contributions, rules, {}, PHRASES, policy).map((r) => r.ruleId)).toEqual(['a1', 'e1', 'c1']);
  expect(explain('cut', contributions, rules, {}, PHRASES, { ...policy, max_reasons: 6 }).map((r) => r.ruleId)).toEqual(['a1', 'e1', 'c1', 'd1', 'b1']);
});
