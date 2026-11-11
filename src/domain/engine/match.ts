/**
 * Three-valued value tests of the rules DSL: `when` over facts and matches
 * over item traits. Unknown is data: an absent fact or per-person trait makes a test unknown, except `known`.
 */
import { CONFIDENCE_RANK, FACTS, isFactKey, type Confidence, type FactKey, type Facts, type Range } from '../facts/registry.ts';
import { traitBy, traitSpec, type TargetKind } from '../content/traits.ts';
import type { AnyTest, AnyTests, When } from '../content/types.ts';

/** The result of a test on possibly unknown values. */
export type Tri = 'pass' | 'fail' | 'unknown';

/** How a value is read: one value, a set of members, or a `[min, max]` range trait. */
export type Shape = 'scalar' | 'set' | 'range';

/** Per-rule minimum confidences that override the registry default (`RuleCommon.min`). */
export type MinConfidence = Partial<Readonly<Record<FactKey, Confidence>>>;

/** Whether any member of a set value is in `list`; one value counts as a set of one. */
function overlaps(list: readonly unknown[], value: unknown, shape: Shape): boolean {
  if (shape !== 'set') return list.includes(value);
  for (const m of value as readonly unknown[]) if (list.includes(m)) return true;
  return false;
}

/**
 * One test on one value: `is` contains on a set, `in` any overlap, `not` none of; `range` is inclusive and a
 * range trait passes only if its whole range fits; `known` tests presence. An empty set is a known value.
 */
export function testValue(test: AnyTest, value: unknown, shape: Shape): Tri {
  if (test.known !== undefined) return (value !== undefined) === test.known ? 'pass' : 'fail';
  if (value === undefined) return 'unknown';
  return holds(test, value, shape) ? 'pass' : 'fail';
}

/** A test on a known value; `range` tests are not used on sets, and only `range` on range traits. */
function holds(test: AnyTest, value: unknown, shape: Shape): boolean {
  if (test.is !== undefined) return shape === 'set' ? (value as readonly unknown[]).includes(test.is) : shape === 'scalar' && value === test.is;
  if (test.in !== undefined) return shape !== 'range' && overlaps(test.in, value, shape);
  if (test.not !== undefined) return shape !== 'range' && !overlaps(test.not, value, shape);
  if (test.range === undefined || shape === 'set') return false;
  const [lo, hi] = shape === 'range' ? (value as Range) : [value as number, value as number];
  return lo >= test.range[0] && hi <= test.range[1];
}

/** Three-valued AND: any fail fails, else any unknown is unknown. */
export const allOf = (results: readonly Tri[]): Tri => (results.includes('fail') ? 'fail' : results.includes('unknown') ? 'unknown' : 'pass');

/** Three-valued OR: any pass passes, else any unknown is unknown. */
export const anyOf = (results: readonly Tri[]): Tri => (results.includes('pass') ? 'pass' : results.includes('unknown') ? 'unknown' : 'fail');

/**
 * A fact's value when its confidence reaches what a rule needs (the rule's `min`, else the registry's, else `low`);
 * below that it counts as unknown, so a low-confidence photo value skips a rule instead of firing it.
 */
export function usable(facts: Facts, key: FactKey, min: MinConfidence = {}): unknown {
  const fact = facts[key];
  if (!fact) return undefined;
  const need = min[key] ?? (FACTS[key] as { readonly min?: Confidence }).min ?? 'low';
  return CONFIDENCE_RANK[fact.confidence] >= CONFIDENCE_RANK[need] ? fact.value : undefined;
}

const FAILED = { result: 'fail', missing: [] } as const;
const PASSED = { result: 'pass', missing: [] } as const;
const MATCH_FAILED = { result: 'fail', unknown: [] } as const;
const MATCH_PASSED = { result: 'pass', unknown: [] } as const;

/** A `when` on the facts: every test must hold on known values. `missing` names the keys left unknown. */
export function evalWhen(when: When, facts: Facts, min: MinConfidence = {}): { readonly result: Tri; readonly missing: readonly FactKey[] } {
  let missing: FactKey[] | null = null;
  for (const key in when) {
    const test = (when as AnyTests)[key];
    if (test === undefined) continue;
    const known = isFactKey(key);
    const r = testValue(test, known ? usable(facts, key, min) : undefined, known && FACTS[key].type === 'set' ? 'set' : 'scalar');
    if (r === 'fail') return FAILED;
    if (r === 'unknown' && known) (missing ??= []).push(key);
  }
  return missing ? { result: 'unknown', missing } : PASSED;
}
/**
 * One match on an item's traits: every listed trait must pass. Authored and build traits are always present, so a
 * missing one fails; a missing per-person trait is unknown. `unknown` names those traits.
 */
export function evalMatch(kind: TargetKind, match: AnyTests, traits: Readonly<Record<string, unknown>>): { readonly result: Tri; readonly unknown: readonly string[] } {
  let unknown: string[] | null = null;
  for (const key in match) {
    const test = match[key];
    const spec = traitSpec(kind, key);
    if (test === undefined) continue;
    if (spec === undefined) return MATCH_FAILED;
    const value = traits[key];
    if (value === undefined && traitBy(spec) !== 'person') return MATCH_FAILED;
    const r = testValue(test, value, spec.type === 'set' ? 'set' : spec.type === 'range' ? 'range' : 'scalar');
    if (r === 'fail') return MATCH_FAILED;
    if (r === 'unknown') (unknown ??= []).push(key);
  }
  return unknown ? { result: 'unknown', unknown } : MATCH_PASSED;
}
/** A list of matches means any of them. `passed` holds the indices that pass, in list order. */
export function evalAny(kind: TargetKind, matches: readonly AnyTests[], traits: Readonly<Record<string, unknown>>): { readonly result: Tri; readonly passed: readonly number[]; readonly unknown: readonly string[] } {
  const each = matches.map((m) => evalMatch(kind, m, traits));
  const passed = each.flatMap((e, i) => (e.result === 'pass' ? [i] : []));
  const result = anyOf(each.map((e) => e.result));
  return { result, passed, unknown: result === 'unknown' ? [...new Set(each.flatMap((e) => e.unknown))] : [] };
}

/** The facts a per-person trait is computed from (`reads` in `TRAITS`). */
export function traitReads(kind: TargetKind, trait: string): readonly FactKey[] {
  return (traitSpec(kind, trait)?.reads ?? []).filter(isFactKey);
}
