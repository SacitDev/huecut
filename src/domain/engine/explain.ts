/**
 * Engine stage 6: at most `max_reasons` reasons per item, by strength and then the group order B, C, D, A, E, each built from the
 * rule's `reason` and the favour values that matched.
 */
import type { TargetKind } from '../content/traits.ts';
import type { AnyTest, AnyTests, Policy, RankRule } from '../content/types.ts';
import type { RuleGroup, Strength } from '../content/values.ts';
import type { Contribution } from './score.ts';

type Traits = Readonly<Record<string, unknown>>;

export interface Reason {
  readonly ruleId: string;
  readonly group: RuleGroup;
  readonly strength: Strength;
  readonly text: string;
}

const STRENGTH_RANK: Readonly<Record<Strength, number>> = { strong: 0, moderate: 1, weak: 2 };
/** How the generated part names the item. */
const ITEM_NOUN: Readonly<Record<TargetKind, string>> = { cut: 'cut', colour: 'look', beard: 'beard' };
const MAX_PHRASES = 2;

/** The words the engine joins its reasons with: passed in, so the screens can show them in their own language. */
export interface ReasonWords {
  /** A rule's reason and the phrases of what matched on the item, at most two; with none, the reason alone. */
  readonly reason: (reason: string, kind: TargetKind, phrases: readonly string[]) => string;
  /** At most two things a cut does around the face, as one phrase. */
  readonly both: (parts: readonly string[]) => string;
  /** The weeks a cut goes between trims, for the policy's trim line (`{longest}`). */
  readonly weeks: (n: number) => string;
  /** The fewest minutes a cut takes to style, for the policy's styling line (`{fastest}`). */
  readonly minutes: (n: number) => string;
}

/** The English joining words, the default. */
export const REASON_WORDS: ReasonWords = {
  reason: (reason, kind, phrases) => (phrases.length === 0 ? `${reason}.` : `${reason}, so this ${ITEM_NOUN[kind]} has ${phrases.join(' and ')}.`),
  both: (parts) => parts.join(' and '),
  weeks: (n) => (n === 1 ? '1 week' : `${String(n)} weeks`),
  minutes: (n) => (n === 1 ? '1 minute' : `${String(n)} minutes`),
};

/** The phrase keys of one test that the item really has: `is` and `in` values it holds, or the `range` itself. */
function matchedKeys(trait: string, test: AnyTest, value: unknown): string[] {
  if (test.range) return [`${trait}.${String(test.range[0])}-${String(test.range[1])}`];
  if (test.is !== undefined) return [`${trait}.${String(test.is)}`];
  if (!test.in) return [];
  const members: readonly unknown[] = Array.isArray(value) ? value : [value];
  return test.in.filter((v) => members.includes(v)).map((v) => `${trait}.${String(v)}`);
}

/**
 * The reason text: `reason`, then ", so this cut has " and the phrases of the favour values that matched on this
 * item (at most two, in list order, joined with "and"), in `words`. `not` and `known` tests name nothing. No phrase: `reason.`
 */
export function reasonText<T extends TargetKind>(kind: T, rule: RankRule<T>, favoured: readonly number[], traits: Traits, phrases: Readonly<Record<string, string>>, words: ReasonWords = REASON_WORDS): string {
  const keys = favoured.flatMap((i) => Object.entries((rule.favour[i] ?? {}) as AnyTests).flatMap(([t, test]) => matchedKeys(t, test, traits[t])));
  const found = [...new Set(keys.flatMap((k) => phrases[k] ?? []))].slice(0, MAX_PHRASES);
  return words.reason(rule.reason, kind, found);
}

/** Reasons for the rank rules that really favoured the item (points above 0); disfavour never gives a reason. */
export function explain<T extends TargetKind>(kind: T, contributions: readonly Contribution[], rules: ReadonlyMap<string, RankRule<T>>, traits: Traits, phrases: Readonly<Record<string, string>>, policy: Pick<Policy, 'max_reasons' | 'reason_group_order'>, words: ReasonWords = REASON_WORDS): Reason[] {
  const groupRank = (g: RuleGroup): number => {
    const i = policy.reason_group_order.indexOf(g);
    return i < 0 ? policy.reason_group_order.length : i;
  };
  return contributions
    .map((c, order) => ({ c, order, rule: rules.get(c.ruleId) }))
    .filter((x): x is { c: Contribution; order: number; rule: RankRule<T> } => x.c.points > 0 && x.rule !== undefined)
    .sort((a, b) => STRENGTH_RANK[a.c.strength] - STRENGTH_RANK[b.c.strength] || groupRank(a.c.group) - groupRank(b.c.group) || a.order - b.order)
    .slice(0, policy.max_reasons)
    .map(({ c, rule }) => ({ ruleId: c.ruleId, group: c.group, strength: c.strength, text: reasonText(kind, rule, c.favoured, traits, phrases, words) }));
}
