/** The value tests, three-valued, with the minimum confidence a rule needs. */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import { allOf, anyOf, evalAny, evalMatch, evalWhen, testValue, usable } from './match.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));

it('reads is, in and not on one value as equals, one of and none of', () => {
  expect(testValue({ is: 'curly' }, 'curly', 'scalar')).toBe('pass');
  expect(testValue({ is: 'curly' }, 'wavy', 'scalar')).toBe('fail');
  expect(testValue({ in: ['curly', 'coily'] }, 'coily', 'scalar')).toBe('pass');
  expect(testValue({ not: ['curly', 'coily'] }, 'coily', 'scalar')).toBe('fail');
  expect(testValue({ not: ['curly', 'coily'] }, 'wavy', 'scalar')).toBe('pass');
  expect(testValue({ is: true }, false, 'scalar')).toBe('fail');
});

it('reads is, in and not on a set as contains, any overlap and none of', () => {
  const history = ['bleach', 'home_dye'];
  expect(testValue({ is: 'home_dye' }, history, 'set')).toBe('pass');
  expect(testValue({ in: ['vivid', 'bleach'] }, history, 'set')).toBe('pass');
  expect(testValue({ in: ['vivid'] }, history, 'set')).toBe('fail');
  // A complement on a set would wrongly pass here; `not` fails because bleach is in the set.
  expect(testValue({ not: ['bleach'] }, history, 'set')).toBe('fail');
  expect(testValue({ is: 'none' }, ['none'], 'set')).toBe('pass');
});

it('treats the empty set as a known value: not passes, is and in fail, known passes', () => {
  expect(testValue({ not: ['helmet'] }, [], 'set')).toBe('pass');
  expect(testValue({ is: 'helmet' }, [], 'set')).toBe('fail');
  expect(testValue({ in: ['helmet'] }, [], 'set')).toBe('fail');
  expect(testValue({ known: true }, [], 'set')).toBe('pass');
});

it('passes a range on a number inclusively, and on a range trait only when the whole range fits', () => {
  expect(testValue({ range: [3, 4] }, 3, 'scalar')).toBe('pass');
  expect(testValue({ range: [3, 4] }, 4, 'scalar')).toBe('pass');
  expect(testValue({ range: [3, 4] }, 5, 'scalar')).toBe('fail');
  expect(testValue({ range: [0, 10] }, [3, 6], 'range')).toBe('pass');
  expect(testValue({ range: [0, 5] }, [3, 6], 'range')).toBe('fail');
});

it('makes every test on an unknown value unknown, except known', () => {
  for (const t of [{ is: 'x' }, { in: ['x'] }, { not: ['x'] }, { range: [1, 2] as const }]) expect(testValue(t, undefined, 'scalar')).toBe('unknown');
  expect(testValue({ known: true }, undefined, 'scalar')).toBe('fail');
  expect(testValue({ known: false }, undefined, 'scalar')).toBe('pass');
  expect(testValue({ known: false }, 'curly', 'scalar')).toBe('fail');
});

it('combines three-valued results: AND fails on any fail, OR passes on any pass', () => {
  expect(allOf(['pass', 'unknown'])).toBe('unknown');
  expect(allOf(['unknown', 'fail'])).toBe('fail');
  expect(allOf([])).toBe('pass');
  expect(anyOf(['fail', 'unknown'])).toBe('unknown');
  expect(anyOf(['unknown', 'pass'])).toBe('pass');
  expect(anyOf([])).toBe('fail');
});

it('evaluates a when: all tests on known values, missing keys named only while nothing fails', () => {
  const f = answered({ 'hair.texture': 'curly', 'hair.chemical_history': ['none'] });
  expect(evalWhen({ 'hair.texture': { in: ['curly', 'coily'] }, 'hair.chemical_history': { is: 'none' } }, f)).toEqual({ result: 'pass', missing: [] });
  expect(evalWhen({ 'hair.texture': { is: 'curly' }, 'hair.current_length': { known: true }, 'hair.strand': { is: 'fine' } }, f))
    .toEqual({ result: 'fail', missing: [] });
  expect(evalWhen({ 'hair.texture': { is: 'curly' }, 'hair.strand': { is: 'fine' } }, f)).toEqual({ result: 'unknown', missing: ['hair.strand'] });
});

it('counts a measured fact below the needed confidence as unknown; a rule may lower the need', () => {
  const f = { 'face.proportion': { key: 'face.proportion', value: 'longer', confidence: 'low', source: 'measured' } } as Facts;
  // face.proportion needs `medium` in the registry.
  expect(usable(f, 'face.proportion')).toBeUndefined();
  expect(evalWhen({ 'face.proportion': { is: 'longer' } }, f)).toEqual({ result: 'unknown', missing: ['face.proportion'] });
  expect(evalWhen({ 'face.proportion': { is: 'longer' } }, f, { 'face.proportion': 'low' }).result).toBe('pass');
});

it('fails a missing authored trait but leaves a missing per-person trait unknown', () => {
  expect(evalMatch('cut', { fringe: { is: 'curtain' } }, {}).result).toBe('fail');
  expect(evalMatch('cut', { texture_fit: { is: 'good' } }, {})).toEqual({ result: 'unknown', unknown: ['texture_fit'] });
  expect(evalMatch('cut', { texture_fit: { is: 'good' }, fringe: { is: 'curtain' } }, { fringe: 'none' }).result).toBe('fail');
  expect(evalMatch('colour', { not_a_trait: { is: true } }, { not_a_trait: true }).result).toBe('fail');
});

it('passes a list of matches when any match holds, and reports which', () => {
  const traits = { fringe: 'curtain', part: 'side', volume_zone: ['crown'] };
  const list = [{ volume_zone: { is: 'sides' } }, { fringe: { in: ['curtain', 'side_swept'] } }, { part: { is: 'side' } }];
  expect(evalAny('cut', list, traits)).toEqual({ result: 'pass', passed: [1, 2], unknown: [] });
  expect(evalAny('cut', [{ volume_zone: { is: 'sides' } }, { length_change: { is: 'small' } }], traits)).toEqual({ result: 'unknown', passed: [], unknown: ['length_change'] });
});
