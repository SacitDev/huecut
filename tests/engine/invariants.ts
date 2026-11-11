/**
 * The engine invariants on one profile, shared by the golden cases and the bars: the same list every time, an unknown answer never
 * removes an item and a restricting one never adds one, "Plausible" never rests on a guess, and with `said` what the person said holds.
 */
import { FACTS, FACT_KEYS, type FactKey, type Facts } from '../../src/domain/facts/registry.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import { cutTraits, lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { exclusionsFor } from '../../src/domain/engine/score.ts';
import { assessIdea, recommend, type EngineContent, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import type { saidChecker } from './said.ts';

/** Items no exclude rule leaves out (engine stage 1 on its own, so the invariant loops stay quick). */
export function eligibleIds(f: Facts, c: EngineContent): Set<string> {
  const d = deriveFacts(f);
  return new Set([
    ...c.cuts.filter((x) => exclusionsFor('cut', cutTraits(x, d, c), c.rules.cut, d).length === 0).map((x) => x.id),
    ...c.looks.filter((x) => exclusionsFor('colour', lookTraits(x, d, c.shadeLevels), c.rules.colour, d).length === 0).map((x) => x.id),
  ]);
}

/**
 * Answers that may admit an item, so the restriction invariants skip them: the explicit opt-ins (growing out lets cuts that need
 * growth in; a bright colour asked lets bright looks in) and where curly hair rests, which can show that a cut keeps the length it
 * has (the golden cases cover restricting answers only), and the lengths level, whose reading lets back the
 * lightening an unknown level left out on damaged or twice-lightened lengths, and full grey cover.
 */
export const admits = (key: string, value: unknown): boolean =>
  (key === 'life.grow_out_goal' && value === true) || (key === 'pref.colour_direction' && value === 'vivid') || key === 'hair.resting_length' || key === 'colour.current_level_lengths'
  // Full grey cover may go as deep as it needs, and with grey on show only a big lightening is far from the natural colour, so
  // these grey goals let looks in.
  || (key === 'colour.grey_goal' && ['cover', 'embrace', 'silver'].includes(String(value)));

const within = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => [...a].every((x) => b.has(x));
const without = (f: Facts, key: string): Facts => Object.fromEntries(Object.entries(f).filter(([k]) => k !== key));
const withAnswer = (f: Facts, key: FactKey, value: unknown): Facts => ({ ...f, [key]: { key, value, confidence: 'high', source: 'answered' } });
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** A few values of every kind a question can state: each enum value, both booleans, the ends and middle of a range, each set member. */
export function valuesOf(key: FactKey): unknown[] {
  const s = FACTS[key];
  if (s.type === 'enum') return [...s.values];
  if (s.type === 'bool') return [true, false];
  if (s.type === 'number') return [s.range[0], Math.round((s.range[0] + s.range[1]) / 2), s.range[1]];
  const exclusive: readonly string[] = 'exclusive' in s ? s.exclusive : [];
  return [...s.values.map((v) => [v]), ...(exclusive.length === 0 ? [[]] : [])];
}
const QUESTION_KEYS = FACT_KEYS.filter((k) => FACTS[k].from === 'question');

/** One random member of a list, as a list of zero or one. */
export const oneOf = <T>(xs: readonly T[], rnd: () => number): T[] => {
  const x = xs[Math.floor(rnd() * xs.length)];
  return x === undefined ? [] : [x];
};

/** Deterministic, also with the library in reverse order. */
function sameEveryTime(f: Facts, c: EngineContent, options: RecommendOptions): string[] {
  const r = recommend(f, c, options);
  return [
    ...(same(recommend(f, c, options), r) ? [] : ['not deterministic']),
    ...(same(recommend(f, { ...c, cuts: [...c.cuts].reverse(), looks: [...c.looks].reverse() }, options), r) ? [] : ['depends on the library order']),
  ];
}

/**
 * Unknown never removes an item (forgetting an answer that is not an opt-in), and a restricting answer never adds one; `thorough` tries every
 * answer. A fact the answers already derive (the lengths' level of natural hair) is known, so it is not stated again.
 */
function limits(f: Facts, c: EngineContent, thorough: boolean, rnd: () => number): string[] {
  const eligible = eligibleIds(f, c);
  const present = Object.entries(f).filter(([k, x]) => !admits(k, x.value)).map(([k]) => k);
  const forget = thorough ? present : oneOf(present, rnd);
  const derived = deriveFacts(f);
  const absent = QUESTION_KEYS.filter((k) => !derived[k]);
  const stated = (thorough ? absent : oneOf(absent, rnd)).flatMap((k) => (thorough ? valuesOf(k) : oneOf(valuesOf(k), rnd)).map((v) => [k, v] as const)).filter(([k, v]) => !admits(k, v));
  return [
    ...forget.filter((k) => !within(eligible, eligibleIds(without(f, k), c))).map((k) => `forgetting ${k} removed an item`),
    ...stated.filter(([k, v]) => !within(eligibleIds(withAnswer(f, k, v), c), eligible)).map(([k, v]) => `stating ${k} = ${JSON.stringify(v)} added an eligible item`),
  ];
}

/** Plausible means a lift of at most 2 and an empty dependsOn, and an unknown history is never plausible. */
export function labels(f: Facts, c: EngineContent): string[] {
  return c.looks.flatMap((look) => {
    const j = assessIdea(look.id, f, c)?.journey;
    if (j?.label !== 'plausible') return [];
    return [
      ...(j.lift === null || j.lift > 2 || j.dependsOn.length > 0 ? [`${look.id} is plausible with lift ${String(j.lift)} and dependsOn [${j.dependsOn.join(', ')}]`] : []),
      ...(f['hair.chemical_history'] ? [] : [`${look.id} is plausible with the chemical history unknown`]),
    ];
  });
}

/**
 * Every invariant on one profile; `thorough` forgets every answer and states every absent one, else one of each. With `said`, every
 * automatic slot is also checked against what the person said, on the library's own records.
 */
export function invariants(f: Facts, c: EngineContent, options: RecommendOptions, thorough: boolean, rnd: () => number = Math.random, said?: ReturnType<typeof saidChecker>): string[] {
  const breaches = said ? said.breaches(recommend(f, c, options), f).map((b) => `${b.id} against what was said (${b.kind}): ${b.why}`) : [];
  return [...sameEveryTime(f, c, options), ...limits(f, c, thorough, rnd), ...labels(f, c), ...breaches];
}
