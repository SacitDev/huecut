/** Derived facts: the two derivations from a history of `none`, and `look.contrast`. */
import { expect, it } from 'vitest';
import type { Facts } from './registry.ts';
import { contrastOf, deriveFacts } from './derive.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));

it('derives the current level (the natural level) and the last service (never) when the history is none', () => {
  const d = deriveFacts(answered({ 'hair.chemical_history': ['none'], 'colour.natural_level': 6 }));
  expect(d['colour.current_level_lengths']).toEqual({ key: 'colour.current_level_lengths', value: 6, confidence: 'high', source: 'derived' });
  expect(d['colour.last_chemical_service']).toEqual({ key: 'colour.last_chemical_service', value: 'never', confidence: 'high', source: 'derived' });
});

it('derives no current level from a history other than none, or an unknown one', () => {
  for (const history of [['home_dye'], ['bleach', 'highlights'], undefined]) {
    const d = deriveFacts(answered({ ...(history ? { 'hair.chemical_history': history } : {}), 'colour.natural_level': 6 }));
    expect(d['colour.current_level_lengths']).toBeUndefined();
  }
});

it('derives a last service of never from any known history without a perm, relaxer or keratin, and nothing otherwise', () => {
  const last = (history?: readonly string[]) => deriveFacts(answered(history ? { 'hair.chemical_history': history } : {}))['colour.last_chemical_service']?.value;
  expect([last(['home_dye']), last(['bleach', 'highlights'])]).toEqual(['never', 'never']);
  expect([last(['relaxer_perm']), last(['keratin', 'home_dye']), last()]).toEqual([undefined, undefined, undefined]);
});

it('keeps an answered value over a derived one', () => {
  const d = deriveFacts(answered({ 'hair.chemical_history': ['none'], 'colour.natural_level': 6, 'colour.current_level_lengths': 5 }));
  expect(d['colour.current_level_lengths']?.value).toBe(5);
  expect(d['colour.current_level_lengths']?.source).toBe('answered');
});

it('leaves the current level unknown when the natural level is unknown, but still derives the last service', () => {
  const d = deriveFacts(answered({ 'hair.chemical_history': ['none'] }));
  expect(d['colour.current_level_lengths']).toBeUndefined();
  expect(d['colour.last_chemical_service']?.value).toBe('never');
});

it('derives look.contrast from the skin depth and natural level answers, by level steps apart', () => {
  // Very light skin sits at 9 on the level scale: black hair (1) is 8 steps away, light blonde (8) one step.
  expect(contrastOf('very_light', 1)).toBe('high');
  expect(contrastOf('very_light', 8)).toBe('low');
  // Light skin (8) with light brown hair (5): 3 steps; deep skin (3) with black hair (1): 2 steps.
  expect(contrastOf('light', 5)).toBe('medium');
  expect(contrastOf('deep', 1)).toBe('low');
  expect(contrastOf('medium', 1)).toBe('high');
  expect(deriveFacts(answered({ 'look.skin_depth': 'light', 'colour.natural_level': 5 }))['look.contrast']?.value).toBe('medium');
});

it('derives look.contrast from answers only', () => {
  expect(deriveFacts(answered({ 'look.skin_depth': 'light' }))['look.contrast']).toBeUndefined();
  const measured = { ...answered({ 'look.skin_depth': 'light' }), 'colour.natural_level': { key: 'colour.natural_level', value: 5, confidence: 'medium', source: 'measured' } } as Facts;
  expect(deriveFacts(measured)['look.contrast']).toBeUndefined();
});
