/**
 * Engine stage 5: rank by suitability, then pick with diversity on silhouettes only, never on texture, one low-upkeep option,
 * half good texture fits when the pool allows, removed ideas skipped, deterministic relaxation and maximal marginal relevance among the ideas that fit everything asked;
 * then ideas that miss only trade-offs, smallest miss first, and at most two cuts that need growth, after the rest.
 */
import type { Policy } from '../content/types.ts';
import type { Suitability } from '../content/suitability.ts';
import type { Feasibility } from './derive-traits.ts';

/** What selection reads of an assessed item. */
export interface Rankable {
  readonly id: string;
  readonly score: number;
  readonly strongFired: number;
  /** The cut's silhouette; `null` for colour looks, which have none. */
  readonly silhouette: string | null;
  readonly lowUpkeep: boolean;
  /** Cuts only; a colour look has none. */
  readonly feasibility: Pick<Feasibility, 'status' | 'length'> | null;
  /** Cuts only: length classes from the current length; `null` when that is unknown. */
  readonly lengthSteps: number | null;
  /** Suitability. Empty or absent: the rule score alone orders items. */
  readonly fitAt?: readonly number[];
  /** Tie-break after suitability: harmony with a confirmed undertone (colour looks). */
  readonly harmony?: number;
  /** What the item is, for how alike two items are. */
  readonly facets?: Readonly<Record<string, string>>;
  /** Cuts only: the trade-offs the item misses, each with its practical factor; none means it fits everything asked. */
  readonly tradeOffs?: readonly { readonly factor: number }[];
  /** Cuts only: whether the texture fit is good; `null` or absent while the texture is unknown. */
  readonly goodFit?: boolean | null;
}

/** A constraint dropped, in this fixed order, because the picks could not be filled with it (never feasibility). */
export type Relaxation = 'good_texture' | 'distinct_silhouettes' | 'low_upkeep' | 'max_per_silhouette';

export interface Selection<T> {
  readonly picks: readonly T[];
  /** How many fewer eligible items there are than requested; said plainly, never relaxed. */
  readonly shortfall: number;
  readonly relaxed: readonly Relaxation[];
}

/** Cuts that need growth take at most this many places, after the shapes that work today. */
export const MAX_AFTER_GROWTH = 2;

/** Today before needs adapting before after growth (an unknown length has no line, so it reads as today). */
const feasibleOrder = ({ feasibility: f }: Rankable): number => (f?.status === 'after_growth' ? 2 : f?.status === 'needs_adapting' ? 1 : 0);
const fitOf = (i: Rankable): number => i.fitAt?.[0] ?? 0;

/** The tie-breaks after the score: strong rules that scored positively, feasibility, fewer length steps, id. */
const tieBreak = (a: Rankable, b: Rankable): number =>
  b.strongFired - a.strongFired || feasibleOrder(a) - feasibleOrder(b) || (a.lengthSteps ?? 0) - (b.lengthSteps ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Suitability, harmony, the score, then the tie-breaks. */
export function rank<T extends Rankable>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => fitOf(b) - fitOf(a) || (b.harmony ?? 0) - (a.harmony ?? 0) || b.score - a.score || tieBreak(a, b));
}

/** Under Both the cuts take the first half, rounded up (`both_split: cut_first_half`); one goal takes all. */
export function splitCount(count: number, kinds: readonly ('cut' | 'colour')[]): { readonly cut: number; readonly colour: number } {
  const both = kinds.includes('cut') && kinds.includes('colour');
  if (both) return { cut: Math.ceil(count / 2), colour: Math.floor(count / 2) };
  return { cut: kinds.includes('cut') ? count : 0, colour: kinds.includes('colour') ? count : 0 };
}

interface Rules { readonly maxPer: number; readonly minDistinct: number; readonly needLow: boolean; readonly needGood: number }

interface Pass { readonly picks: Rankable[]; readonly per: Map<string, number>; haveLow: boolean; good: number }

/** Whether the item may take a slot: under its silhouette's cap, and leaving room for what is still needed. */
function fits(item: Rankable, pass: Pass, count: number, r: Rules): boolean {
  const sil = item.silhouette;
  if (sil !== null && (pass.per.get(sil) ?? 0) >= r.maxPer) return false;
  const isNew = sil !== null && !pass.per.has(sil);
  const distinctLeft = Math.max(0, r.minDistinct - pass.per.size - (isNew ? 1 : 0));
  const lowLeft = r.needLow && !pass.haveLow && !item.lowUpkeep ? 1 : 0;
  const goodLeft = Math.max(0, r.needGood - pass.good - (item.goodFit === true ? 1 : 0));
  // One later item may bring a new silhouette, low upkeep and a good fit at once, so the largest need is what must still fit.
  return Math.max(distinctLeft, lowLeft, goodLeft) <= count - pass.picks.length - 1;
}

function take(item: Rankable, pass: Pass): void {
  pass.picks.push(item);
  if (item.silhouette !== null) pass.per.set(item.silhouette, (pass.per.get(item.silhouette) ?? 0) + 1);
  pass.haveLow ||= item.lowUpkeep;
  if (item.goodFit === true) pass.good++;
}

/** How alike two items are, 0 to 1: the share of their facet weight on which they match. */
export function similarity(a: Rankable, b: Rankable, weights: Suitability['slate']['weights']): number {
  let same = 0;
  let total = 0;
  for (const [k, v] of Object.entries(a.facets ?? {})) {
    const w = weights[k] ?? 0;
    total += w;
    if (b.facets?.[k] === v) same += w;
  }
  return total === 0 ? 0 : same / total;
}

/** The next pick: maximal marginal relevance, and below the floor an item only fills, by suitability alone, once nothing above fits. */
function nextByRelevance<T extends Rankable>(open: readonly T[], pass: Pass, slate: Suitability['slate']): T {
  const top = Math.max(...open.map(fitOf));
  const worth = (i: T): number => {
    const relevance = top > 0 ? fitOf(i) / top : 0;
    if (relevance < slate.floor) return relevance - 2;
    return slate.lambda * relevance - (1 - slate.lambda) * Math.max(...pass.picks.map((p) => similarity(i, p, slate.weights)));
  };
  return open.reduce((best, i) => (worth(i) > worth(best) ? i : best));
}

/**
 * The rule sets to try, in the fixed relaxation order. The good-fit share goes first: it holds only where the selection's own
 * priorities allow it, and the step that drops it is recorded.
 */
function relaxationSteps(strict: Rules, count: number): { relaxed: readonly Relaxation[]; rules: Rules }[] {
  const noGood: Relaxation[] = strict.needGood > 0 ? ['good_texture'] : [];
  const noDistinct: Relaxation[] = [...noGood, ...(strict.minDistinct > 0 ? (['distinct_silhouettes'] as const) : [])];
  const noLow: Relaxation[] = [...noDistinct, ...(strict.needLow ? (['low_upkeep'] as const) : [])];
  const loose = { ...strict, needGood: 0 };
  const steps: { relaxed: readonly Relaxation[]; rules: Rules }[] = [
    { relaxed: [], rules: strict },
    { relaxed: noGood, rules: loose },
    { relaxed: noDistinct, rules: { ...loose, minDistinct: 0 } },
    { relaxed: noLow, rules: { ...loose, minDistinct: 0, needLow: false } },
  ];
  for (let maxPer = strict.maxPer + 1; maxPer <= count; maxPer++) {
    steps.push({ relaxed: [...noLow, 'max_per_silhouette'], rules: { maxPer, minDistinct: 0, needLow: false, needGood: 0 } });
  }
  return steps;
}

/** One pass that keeps slots back for a new silhouette and for the low-upkeep option: rank order, or relevance after the first pick. */
function greedy<T extends Rankable>(pool: readonly T[], count: number, r: Rules, slate: Suitability['slate'] | null): T[] | null {
  const pass: Pass = { picks: [], per: new Map(), haveLow: false, good: 0 };
  let left = [...pool];
  while (pass.picks.length < count) {
    const open = left.filter((i) => fits(i, pass, count, r));
    const [first] = open;
    if (first === undefined) break;
    const next = pass.picks.length === 0 || slate === null ? first : nextByRelevance(open, pass, slate);
    take(next, pass);
    left = left.filter((i) => i !== next);
  }
  const ok = pass.picks.length === count && pass.per.size >= r.minDistinct && (!r.needLow || pass.haveLow) && pass.good >= r.needGood;
  return ok ? (pass.picks as T[]) : null;
}

/** Records the silhouette cap as let go when a short list holds more of one shape than it allows. */
function capBroken(pool: readonly Rankable[], maxPer: number): Relaxation[] {
  const per = new Map<string, number>();
  for (const i of pool) if (i.silhouette !== null) per.set(i.silhouette, (per.get(i.silhouette) ?? 0) + 1);
  return [...per.values()].some((n) => n > maxPer) ? ['max_per_silhouette'] : [];
}

/** The variety rules on one pool, relaxed in the fixed order until `count` is filled; every item when the pool is no larger. */
function variety<T extends Rankable>(pool: readonly T[], count: number, policy: Policy, slate: Suitability['slate'] | null): Selection<T> {
  if (pool.length <= count) return { picks: [...pool], shortfall: count - pool.length, relaxed: capBroken(pool, policy.max_per_silhouette) };
  const silhouettes = pool.some((i) => i.silhouette !== null);
  const strict: Rules = {
    maxPer: silhouettes ? policy.max_per_silhouette : count,
    minDistinct: silhouettes ? Math.ceil(count * policy.min_distinct_silhouettes_share) : 0,
    needLow: count >= 2 && pool.some((i) => i.lowUpkeep),
    // At least half good texture fits, as many as the pool holds.
    needGood: Math.min(Math.ceil(count / 2), pool.filter((i) => i.goodFit === true).length),
  };
  for (const { relaxed, rules } of relaxationSteps(strict, count)) {
    const picks = greedy(pool, count, rules, slate);
    if (picks) return { picks, shortfall: 0, relaxed };
  }
  // With the cap at `count` and nothing reserved, a pool larger than `count` always fills.
  throw new Error('selection: the fully relaxed pass did not fill the picks');
}

/**
 * Picks `count` items from `ranked` (already in rank order), skipping `removed` so the next pick takes their place. The shapes that
 * work today and fit everything asked come first; ideas that miss only trade-offs complete a short list, smallest miss first, and cuts
 * that need growth fill what is left, at most `MAX_AFTER_GROWTH`. At most `max_per_silhouette`
 * per silhouette, at least `ceil(count * share)` distinct silhouettes, and one low-upkeep option when the count is 2 or more and one
 * exists. When the eligible items cannot meet these, they are relaxed in a fixed order: the good-texture share, the distinct share,
 * the low-upkeep option, then the per-silhouette cap step by step. With a `slate` the slots after the first go by maximal marginal relevance.
 */
export function select<T extends Rankable>(ranked: readonly T[], count: number, policy: Policy, removed: ReadonlySet<string>, slate: Suitability['slate'] | null = null): Selection<T> {
  const open = ranked.filter((i) => !removed.has(i.id));
  const later = (i: T): boolean => i.feasibility?.status === 'after_growth';
  const traded = (i: T): boolean => (i.tradeOffs?.length ?? 0) > 0;
  // The smallest miss first (the product of the missed limits' factors); a stable sort keeps the rank order between equal misses.
  const miss = (i: T): number => (i.tradeOffs ?? []).reduce((m, t) => m * t.factor, 1);
  const byMiss = (xs: readonly T[]): T[] => [...xs].sort((a, b) => miss(b) - miss(a));
  const today = variety(open.filter((i) => !later(i) && !traded(i)), count, policy, slate);
  const fill = byMiss(open.filter((i) => !later(i) && traded(i))).slice(0, today.shortfall);
  const left = today.shortfall - fill.length;
  const growth = byMiss(open.filter(later)).slice(0, Math.min(MAX_AFTER_GROWTH, left));
  return { picks: [...today.picks, ...fill, ...growth], shortfall: left - growth.length, relaxed: today.relaxed };
}
