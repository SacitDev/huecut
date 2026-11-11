/**
 * Answers to facts on a small question set shaped like the real one: "Not sure" is absent, `sets`
 * options, multi-select sets with an exclusive value and "None of these", wishes, follow-ups, measured face
 * facts through the bands, and broken content.
 */
import { describe, expect, it } from 'vitest';
import type { Band, Bands, Question } from '../content/types.ts';
import type { FaceFacts } from '../fuse/fuse.ts';
import { toFacts, type Answers } from './answers-to-facts.ts';

const WHERE = { goals: ['cut', 'colour'], collections: ['salon', 'barbering'], prompt: 'A question' } as const;
const NOT_SURE = { value: null, label: 'Not sure' } as const;

const QUESTIONS: readonly Question[] = [
  { ...WHERE, id: 'hair-texture', fact: 'hair.texture', type: 'single', options: [{ value: 'straight', label: 'Straight' }, { value: 'wavy', label: 'Wavy' }, NOT_SURE] },
  { ...WHERE, id: 'upkeep', type: 'single', options: [
    { label: 'Wash and go', sets: { 'life.styling_minutes': 5, 'life.trim_weeks_ok': 12 } },
    { label: 'I enjoy styling', sets: { 'life.styling_minutes': 30, 'life.trim_weeks_ok': 3, 'life.enjoys_styling': true } },
    NOT_SURE,
  ] },
  { ...WHERE, id: 'dye-reaction', type: 'single', options: [
    { label: 'No reaction, and my scalp is fine', sets: { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none' } },
    { label: 'Yes, a mild reaction', sets: { 'safety.dye_reaction': 'mild' } },
    NOT_SURE,
  ] },
  { ...WHERE, id: 'chemical-history', fact: 'hair.chemical_history', type: 'multi', options: [
    { value: 'none', label: 'None' }, { value: 'bleach', label: 'Bleach' }, { value: 'henna_plant', label: 'Plant henna' }, NOT_SURE,
  ] },
  { ...WHERE, id: 'headwear', fact: 'life.headwear', type: 'multi', options: [
    { value: 'hat_or_cap', label: 'A hat or cap' }, { value: 'helmet', label: 'A helmet' }, { none_of_these: true, label: 'None of these' },
  ] },
  { ...WHERE, id: 'wishes', type: 'wishes', options: [
    { label: 'Soften the look of length', fact: 'wish.face_length', value: 'soften' }, { label: 'Show off my cheekbones', fact: 'wish.cheekbones', value: 'emphasise' },
  ] },
  { ...WHERE, id: 'colour-direction', fact: 'pref.colour_direction', type: 'single', options: [
    { value: 'lighter', label: 'Go lighter' }, { value: 'darker', label: 'Go darker' }, { value: 'grey', label: 'Cover or blend my grey', follow_up: 'grey-amount' }, NOT_SURE,
  ] },
  { ...WHERE, id: 'grey-amount', fact: 'colour.grey_percent', type: 'single', options: [{ value: 0, label: 'None' }, { value: 15, label: 'A little' }, { value: 40, label: 'Some' }, NOT_SURE] },
];

const facts = (answers: Answers, faceFacts: FaceFacts | null = null, bands: Bands | null = null) => toFacts(answers, QUESTIONS, faceFacts, bands);

describe('answers to facts', () => {
  it('stores an answer as high and answered; "Not sure" and unknown options are absent', () => {
    expect(facts({ 'hair-texture': { chosen: [1] } })).toEqual({ 'hair.texture': { key: 'hair.texture', value: 'wavy', confidence: 'high', source: 'answered' } });
    expect(facts({ 'hair-texture': { chosen: [2] } })).toEqual({});
    expect(facts({ 'hair-texture': { chosen: [9] }, 'no-such-question': { chosen: [0] } })).toEqual({});
  });

  it('writes every fact of a `sets` option, and none for "Not sure"', () => {
    const f = facts({ upkeep: { chosen: [1] }, 'dye-reaction': { chosen: [0] } });
    expect([f['life.styling_minutes']?.value, f['life.trim_weeks_ok']?.value, f['life.enjoys_styling']?.value]).toEqual([30, 3, true]);
    expect([f['safety.dye_reaction']?.value, f['safety.scalp_irritation']?.value]).toEqual(['none', 'none']);
    expect(facts({ 'dye-reaction': { chosen: [2] } })).toEqual({});
  });

  it('builds sets from multi-select answers; an exclusive value with another is unknown', () => {
    expect(facts({ 'chemical-history': { chosen: [1, 2] } })['hair.chemical_history']?.value).toEqual(['bleach', 'henna_plant']);
    expect(facts({ 'chemical-history': { chosen: [0] } })['hair.chemical_history']?.value).toEqual(['none']);
    expect(facts({ 'chemical-history': { chosen: [0, 1] } })).toEqual({});
    expect(facts({ 'chemical-history': { chosen: [1, 3] } })).toEqual({});
    expect(facts({ headwear: { chosen: [2] } })['life.headwear']?.value).toEqual([]);
    expect(facts({ headwear: { chosen: [0, 2] } })).toEqual({});
    expect(facts({ headwear: { chosen: [0, 1] } })['life.headwear']?.value).toEqual(['hat_or_cap', 'helmet']);
  });

  it('writes one wish key per chosen option, and nothing with none chosen', () => {
    const f = facts({ wishes: { chosen: [0, 1] } });
    expect([f['wish.face_length']?.value, f['wish.cheekbones']?.value]).toEqual(['soften', 'emphasise']);
    expect(facts({ wishes: { chosen: [] } })).toEqual({});
  });
});

describe('follow-ups', () => {
  it('count while their parent option is chosen', () => {
    const f = facts({ 'colour-direction': { chosen: [2] }, 'grey-amount': { chosen: [2], under: 'colour-direction' } });
    expect([f['pref.colour_direction']?.value, f['colour.grey_percent']?.value]).toEqual(['grey', 40]);
  });

  it('drop out when the parent answer changes, but not when asked on their own', () => {
    const stale = facts({ 'colour-direction': { chosen: [1] }, 'grey-amount': { chosen: [2], under: 'colour-direction' } });
    expect(stale['pref.colour_direction']?.value).toBe('darker');
    expect(stale['colour.grey_percent']).toBeUndefined();
    expect(facts({ 'grey-amount': { chosen: [2], under: 'colour-direction' } })).toEqual({});
    expect(facts({ 'colour-direction': { chosen: [1] }, 'grey-amount': { chosen: [1] } })['colour.grey_percent']?.value).toBe(15);
  });
});

describe('measured face facts and broken content', () => {
  /** Illustrative cuts for the test only. */
  const band: Band = { fact: 'face.proportion', from: 'width_to_length', view: 'frontal', margin: 0.02, cuts: [{ below: 0.75, value: 'longer' }, { below: 0.85, value: 'balanced' }, { value: 'rounder' }] };
  const bands: Bands = { bands: [band], current_length_cm: { very_short: [0, 3], short: [3, 8], chin: [8, 20], shoulder: [20, 30], long: [30, 45], very_long: [45, 100] } };
  const face: FaceFacts = {
    frontal: { values: { width_to_length: { value: 0.8, confidence: 'medium', photos: 2, agreeing: 2, approximate: false } }, hairlineVisible: false },
    profile: { values: {}, hairlineVisible: false },
  };

  it('adds the banded face facts and the width number as measured, each with its own confidence and basis', () => {
    expect(facts({ 'hair-texture': { chosen: [0] } }, face, bands)['face.proportion']).toEqual({
      key: 'face.proportion', value: 'balanced', confidence: 'medium', source: 'measured', basis: '2 photos agree',
    });
    // Without bands only the number comes through: it reaches the engine from medium confidence.
    expect(facts({}, face, null)).toEqual({
      'face.width_to_length': { key: 'face.width_to_length', value: 0.8, confidence: 'medium', source: 'measured', basis: '2 photos agree' },
    });
    expect(facts({}, null, bands)).toEqual({});
  });

  it('throws when an option value does not fit its fact', () => {
    const bad: Question = { ...WHERE, id: 'bad', fact: 'hair.texture', type: 'single', options: [{ value: 'frizzy', label: 'Frizzy' }] };
    expect(() => toFacts({ bad: { chosen: [0] } }, [bad], null, null)).toThrow(/does not fit fact hair.texture/);
    const range: Question = { ...WHERE, id: 'range', fact: 'colour.grey_percent', type: 'single', options: [{ value: 140, label: 'Lots' }] };
    expect(() => toFacts({ range: { chosen: [0] } }, [range], null, null)).toThrow(/colour.grey_percent/);
  });
});
