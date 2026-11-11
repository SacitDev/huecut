/** The core questions as asked: set choice, show_if, follow-ups, order and taps. */
import { describe, expect, it } from 'vitest';
import type { Question, QuestionsFile } from '../../domain/content/types.ts';
import type { Facts } from '../../domain/facts/registry.ts';
import { chosenAfter, coreQuestions, coreSetOf, goesOnByTap, startIndex } from './questions.ts';

const NOT_SURE = { value: null, label: 'Not sure' } as const;
const q = (id: string, over: Partial<Question> = {}): Question => ({
  id,
  type: 'single',
  goals: ['cut', 'colour'],
  collections: ['salon', 'barbering'],
  prompt: `Prompt of ${id}`,
  options: [NOT_SURE, { value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
  ...over,
});

const history = q('hair-chemical-history', {
  fact: 'hair.chemical_history',
  type: 'multi',
  options: [{ value: 'none', label: 'None' }, { value: 'bleach', label: 'Bleach' }, { value: 'home_dye', label: 'Home dye' }, NOT_SURE],
});
const level = q('colour-current-level-lengths', { show_if: { 'hair.chemical_history': { not: ['none'] } } });
const direction = q('pref-colour-direction', {
  options: [{ value: 'lighter', label: 'Go lighter' }, { value: 'grey', label: 'Cover or blend my grey', follow_up: 'grey-amount' }, NOT_SURE],
});
const grey = q('grey-amount');
const file: QuestionsFile = {
  questions: [history, level, direction, grey],
  core_sets: {
    'cut/salon': [],
    'cut/barbering': [],
    'colour/any': ['hair-chemical-history', 'colour-current-level-lengths', 'grey-amount', 'pref-colour-direction'],
    'both/salon': ['hair-chemical-history', 'colour-current-level-lengths', 'pref-colour-direction'],
    'both/barbering': [],
  },
};
const answered = (value: readonly string[]): Facts =>
  ({ 'hair.chemical_history': { key: 'hair.chemical_history', value, confidence: 'high', source: 'answered' } }) as unknown as Facts;

describe('coreSetOf', () => {
  it('takes the Colour set for colour, the men\'s set for men\'s styles only, and the women\'s set for All', () => {
    expect(coreSetOf('colour', ['barbering'])).toBe('colour/any');
    expect(coreSetOf('cut', ['barbering'])).toBe('cut/barbering');
    expect(coreSetOf('both', ['salon', 'barbering'])).toBe('both/salon');
    expect(coreSetOf('cut', ['salon'])).toBe('cut/salon');
  });
});

describe('coreQuestions', () => {
  it('asks a show_if question while its fact is unknown, and skips it once the answer rules it out', () => {
    const ids = (facts: Facts) => coreQuestions(file, 'both/salon', facts).map((a) => a.question.id);
    expect(ids({})).toEqual(['hair-chemical-history', 'colour-current-level-lengths', 'pref-colour-direction']);
    expect(ids(answered(['none']))).toEqual(['hair-chemical-history', 'pref-colour-direction']);
    expect(ids(answered(['bleach']))).toEqual(['hair-chemical-history', 'colour-current-level-lengths', 'pref-colour-direction']);
  });

  it('opens a follow-up under its option, unless the set asks that question itself', () => {
    const both = coreQuestions(file, 'both/salon', {}).find((a) => a.question.id === 'pref-colour-direction');
    expect([...(both?.followUps.entries() ?? [])].map(([i, f]) => [i, f.id])).toEqual([[1, 'grey-amount']]);
    const colour = coreQuestions(file, 'colour/any', {}).find((a) => a.question.id === 'pref-colour-direction');
    expect(colour?.followUps.size).toBe(0);
  });

  it('puts "Not sure" last whatever its place in the content', () => {
    const [first] = coreQuestions(file, 'both/salon', {});
    expect(first?.order).toEqual([0, 1, 2, 3]);
    const asked = coreQuestions({ ...file, core_sets: { ...file.core_sets, 'cut/salon': ['grey-amount'] } }, 'cut/salon', {});
    expect(asked[0]?.order).toEqual([1, 2, 0]);
  });
});

describe('goesOnByTap', () => {
  it('goes on from a single answer, never from several', () => {
    expect(goesOnByTap(q('hair-density'))).toBe(true);
    expect(goesOnByTap(history)).toBe(false);
  });

  it('never goes on from a safety question, whether it writes the fact or sets it from an option', () => {
    expect(goesOnByTap(q('safety-health-context', { fact: 'safety.health_context' }))).toBe(false);
    expect(goesOnByTap(q('dye-reaction', { options: [{ label: 'No reaction', sets: { 'safety.dye_reaction': 'none' } }, NOT_SURE] }))).toBe(false);
  });
});

describe('startIndex', () => {
  it('opens at the first unanswered question, or the last when all are answered', () => {
    const asked = coreQuestions(file, 'both/salon', {});
    expect(startIndex(asked, {})).toBe(0);
    expect(startIndex(asked, { 'hair-chemical-history': { chosen: [1] } })).toBe(1);
    const all = { 'hair-chemical-history': { chosen: [1] }, 'colour-current-level-lengths': { chosen: [1] }, 'pref-colour-direction': { chosen: [0] } };
    expect(startIndex(asked, all)).toBe(2);
  });
});

describe('chosenAfter', () => {
  it('keeps one option for a single question and marks a follow-up with its parent', () => {
    expect(chosenAfter(direction, { chosen: [0] }, 1)).toEqual({ chosen: [1] });
    expect(chosenAfter(grey, undefined, 2, 'pref-colour-direction')).toEqual({ chosen: [2], under: 'pref-colour-direction' });
  });

  it('toggles a multi option, and lets "Not sure" or a none option stand alone', () => {
    expect(chosenAfter(history, { chosen: [1] }, 2)).toEqual({ chosen: [1, 2] });
    expect(chosenAfter(history, { chosen: [1, 2] }, 1)).toEqual({ chosen: [2] });
    expect(chosenAfter(history, { chosen: [1, 2] }, 3)).toEqual({ chosen: [3] });
    expect(chosenAfter(history, { chosen: [3] }, 1)).toEqual({ chosen: [1] });
    expect(chosenAfter(history, { chosen: [1] }, 1)).toBeNull();
    // `none` is exclusive in the chemical-history fact: it replaces the others, and another choice replaces it.
    expect(chosenAfter(history, { chosen: [1, 2] }, 0)).toEqual({ chosen: [0] });
    expect(chosenAfter(history, { chosen: [0] }, 2)).toEqual({ chosen: [2] });
  });
});
