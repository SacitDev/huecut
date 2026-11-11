/**
 * Engine stages 1 and 3: exclusions on answered facts, `suppresses` exceptions, each rank rule scored once per item on one scale,
 * and item notes.
 */
import { FACT_KEYS, type FactKey, type Facts } from '../facts/registry.ts';
import type { TargetKind } from '../content/traits.ts';
import type { AnyTests, NoteRule, Policy, RuleFor } from '../content/types.ts';
import type { NoteKind, RuleGroup, Strength } from '../content/values.ts';
import { evalAny, evalMatch, evalWhen, traitReads } from './match.ts';

type Traits = Readonly<Record<string, unknown>>;

/** An exclude rule that left the item out, with its sentence. */
export interface Exclusion { readonly ruleId: string; readonly because: string }
/** A note shown on an item (or, without `on`, on the whole result). `from` is the research id the UI groups by. */
export interface ItemNote { readonly ruleId: string; readonly from: string; readonly kind: NoteKind; readonly because: string }
/** One rank rule that fired on an item: its points (+weight, -weight, or 0 when both lists matched). */
export interface Contribution {
  readonly ruleId: string;
  readonly group: RuleGroup;
  readonly strength: Strength;
  readonly points: number;
  /** Indices of the favour matches that held, for the explanation. */
  readonly favoured: readonly number[];
  /** A disfavour match held, even when a favour match cancelled its points. */
  readonly against?: boolean;
}
export interface Scored {
  /** The sum of the points. */
  readonly score: number;
  readonly contributions: readonly Contribution[];
  /** Strong rules that favoured the item (the second tie-break). */
  readonly strongFired: number;
  /** Facts that would let more rank rules decide, in registry order ("depends on your hair texture"). */
  readonly dependsOn: readonly FactKey[];
}

const ordered = (keys: Iterable<FactKey>): FactKey[] => {
  const set = new Set(keys);
  return FACT_KEYS.filter((k) => set.has(k));
};
/** A wish left absent is "no preference": a wish-gated rule is then silent by design, not undecided. */
const undecided = (k: FactKey): boolean => !k.startsWith('wish.');

/** Answered facts only: exclusions never use measured or derived values (engine stage 1). */
export const answeredOnly = (facts: Facts): Facts =>
  Object.fromEntries(Object.entries(facts).filter(([, f]) => f.source === 'answered'));

/** Stage 1: the exclude rules whose `when` passes on answered facts and whose `on` holds. Unknown never excludes. */
export function exclusionsFor<T extends TargetKind>(kind: T, traits: Traits, rules: readonly RuleFor<T>[], facts: Facts): Exclusion[] {
  const answered = answeredOnly(facts);
  return rules.flatMap((r) => (r.effect === 'exclude' && evalWhen(r.when, answered, r.min).result === 'pass'
    && evalMatch(kind, r.on as AnyTests, traits).result === 'pass' ? [{ ruleId: r.id, because: r.because }] : []));
}

/** Whether a record applies on the item: its `when` holds and a rank rule's match, or a note's `on`, holds. */
function applies<T extends TargetKind>(kind: T, r: RuleFor<T>, traits: Traits, facts: Facts): boolean {
  if (evalWhen(r.when, facts, r.min).result !== 'pass') return false;
  if (r.effect === 'rank') return evalAny(kind, [...r.favour, ...r.disfavour] as readonly AnyTests[], traits).result === 'pass';
  if (r.effect === 'note') return r.on === undefined || evalMatch(kind, r.on as AnyTests, traits).result === 'pass';
  return evalMatch(kind, r.on as AnyTests, traits).result === 'pass';
}

/**
 * The records skipped on this item: those named by an applying record's `suppresses`. One level deep: a record that
 * is itself suppressed suppresses nothing. Excludes are never skipped (the content check forbids naming them).
 */
export function suppressedOn<T extends TargetKind>(kind: T, traits: Traits, rules: readonly RuleFor<T>[], facts: Facts): ReadonlySet<string> {
  const applying = rules.filter((r) => (r.suppresses ?? []).length > 0 && applies(kind, r, traits, facts));
  const first = new Set(applying.flatMap((r) => r.suppresses ?? []));
  return new Set(applying.filter((r) => !first.has(r.id)).flatMap((r) => r.suppresses ?? []));
}

/** Stage 3: every rank rule once per item (+weight on a favour match, -weight on a disfavour match, 0 on both). */
export function scoreItem<T extends TargetKind>(kind: T, traits: Traits, rules: readonly RuleFor<T>[], facts: Facts, policy: Pick<Policy, 'weights'>, suppressed: ReadonlySet<string>): Scored {
  const contributions: Contribution[] = [];
  const depends = new Set<FactKey>();
  for (const r of rules) {
    if (r.effect !== 'rank' || suppressed.has(r.id)) continue;
    const when = evalWhen(r.when, facts, r.min);
    if (when.result === 'unknown') when.missing.filter(undecided).forEach((k) => depends.add(k));
    if (when.result !== 'pass') continue;
    const fav = evalAny(kind, r.favour as readonly AnyTests[], traits);
    const dis = evalAny(kind, r.disfavour as readonly AnyTests[], traits);
    for (const t of [...fav.unknown, ...dis.unknown]) traitReads(kind, t).forEach((k) => depends.add(k));
    if (fav.result !== 'pass' && dis.result !== 'pass') continue;
    const weight = policy.weights[r.strength];
    const points = (fav.result === 'pass' ? weight : 0) - (dis.result === 'pass' ? weight : 0);
    contributions.push({ ruleId: r.id, group: r.group, strength: r.strength, points, favoured: points > 0 ? fav.passed : [], against: dis.result === 'pass' });
  }
  return {
    score: contributions.reduce((a, c) => a + c.points, 0),
    contributions,
    strongFired: contributions.filter((c) => c.strength === 'strong' && c.points > 0).length,
    dependsOn: ordered(depends),
  };
}

const noteOf = <T extends TargetKind>(r: NoteRule<T>): ItemNote => ({ ruleId: r.id, from: r.from ?? r.id, kind: r.note, because: r.because });

/** Notes whose `when` holds and whose `on` matches the item; one per research id (`from`), the first kept. */
export function notesFor<T extends TargetKind>(kind: T, traits: Traits, rules: readonly RuleFor<T>[], facts: Facts, suppressed: ReadonlySet<string>): ItemNote[] {
  const seen = new Set<string>();
  return rules.flatMap((r) => {
    if (r.effect !== 'note' || r.on === undefined || suppressed.has(r.id)) return [];
    if (evalWhen(r.when, facts, r.min).result !== 'pass' || evalMatch(kind, r.on as AnyTests, traits).result !== 'pass') return [];
    const note = noteOf(r);
    if (seen.has(note.from)) return [];
    seen.add(note.from);
    return [note];
  });
}

/** Notes without `on`: they belong to the whole result. */
export function resultNotes<T extends TargetKind>(rules: readonly RuleFor<T>[], facts: Facts): ItemNote[] {
  return rules.flatMap((r) => (r.effect === 'note' && r.on === undefined && evalWhen(r.when, facts, r.min).result === 'pass' ? [noteOf(r)] : []));
}
