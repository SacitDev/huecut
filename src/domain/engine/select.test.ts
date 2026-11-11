/** Ranking tie-breaks, the Both split and diversity on silhouettes (engine stage 5). */
import { describe, expect, it } from 'vitest';
import type { Policy } from '../content/types.ts';
import { rank, select, similarity, splitCount, type Rankable } from './select.ts';

const POLICY: Policy = {
  weights: { weak: 1, moderate: 2, strong: 3 }, count: { min: 1, default: 4, max: 8 }, both_split: 'cut_first_half',
  grid_max_tiles: 4, max_per_silhouette: 2, min_distinct_silhouettes_share: 0.5, low_upkeep: { max_styling_minutes: 10, min_trim_weeks: 8 },
  max_reasons: 3, reason_group_order: ['B', 'C', 'D', 'A', 'E'], pool_size: 14, change_span: null, length_span: null, colour_variety: null,
  upkeep_stack: null, growth_cm_per_month: null,
};
const item = (id: string, score: number, silhouette: string | null, over: Partial<Rankable> = {}): Rankable =>
  ({ id, score, strongFired: 0, silhouette, lowUpkeep: false, feasibility: null, lengthSteps: null, ...over });
const ids = (xs: readonly Rankable[]) => xs.map((x) => x.id);
const none = new Set<string>();
const TODAY: Rankable['feasibility'] = { status: 'today', length: { status: 'today' } };
const ADAPT: Rankable['feasibility'] = { status: 'needs_adapting', length: { status: 'today' } };
const GROWTH: Rankable['feasibility'] = { status: 'after_growth', length: { status: 'after_growth', cm: 10, weeks: 44 } };

it('ranks by score, then strong rules fired, then id', () => {
  const ranked = rank([item('b', 3, 'bob'), item('a', 3, 'bob'), item('c', 3, 'bob', { strongFired: 1 }), item('d', 5, 'bob'), item('e', -1, 'bob')]);
  expect(ids(ranked)).toEqual(['d', 'c', 'a', 'b', 'e']);
});

it('breaks a tie for the person: works today, then needs adapting, then after growth, then fewer length steps', () => {
  const ranked = rank([
    item('a-growth', 3, 'bob', { feasibility: GROWTH, lengthSteps: 0 }), item('b-adapt', 3, 'bob', { feasibility: ADAPT, lengthSteps: 0 }),
    item('c-today-far', 3, 'bob', { feasibility: TODAY, lengthSteps: 4 }), item('d-today-near', 3, 'bob', { feasibility: TODAY, lengthSteps: 1 }),
  ]);
  expect(ids(ranked)).toEqual(['d-today-near', 'c-today-far', 'b-adapt', 'a-growth']);
});

it('keeps the score and the strong rules ahead of feasibility, and the id last', () => {
  expect(ids(rank([item('a', 3, 'bob', { feasibility: TODAY }), item('b', 4, 'bob', { feasibility: GROWTH })]))).toEqual(['b', 'a']);
  expect(ids(rank([item('a', 3, 'bob', { feasibility: TODAY }), item('b', 3, 'bob', { feasibility: GROWTH, strongFired: 1 })]))).toEqual(['b', 'a']);
  expect(ids(rank([item('z', 3, 'bob', { feasibility: TODAY, lengthSteps: 2 }), item('y', 3, 'bob', { feasibility: TODAY, lengthSteps: 2 })]))).toEqual(['y', 'z']);
});

it('skips the length comparison when the current length is unknown', () => {
  const ranked = rank([item('z', 3, 'bob', { feasibility: { status: null, length: null }, lengthSteps: null }), item('a', 3, 'bob', { feasibility: { status: null, length: null }, lengthSteps: null })]);
  expect(ids(ranked)).toEqual(['a', 'z']);
});

it('puts the shapes that work today first and fills only what is left with at most two that need growth', () => {
  const pool = [item('a', 9, 'bob', { feasibility: GROWTH }), item('b', 8, 'lob', { feasibility: GROWTH }), item('e', 7, 'shag', { feasibility: GROWTH }), item('c', 5, 'pixie', { feasibility: ADAPT }), item('d', 4, 'crop', { feasibility: TODAY })];
  expect(select(pool, 5, POLICY, none)).toEqual({ picks: [pool[3], pool[4], pool[0], pool[1]], shortfall: 1, relaxed: [] });
  expect(ids(select(pool, 1, POLICY, none).picks)).toEqual(['c']);
  expect(ids(select(pool, 2, POLICY, new Set(['c'])).picks)).toEqual(['d', 'a']);
});

it('keeps two cuts that need growth when nothing works today, and the order of the rest', () => {
  const growth = [item('a', 9, 'bob', { feasibility: GROWTH }), item('b', 8, 'lob', { feasibility: GROWTH }), item('c', 7, 'shag', { feasibility: GROWTH })];
  expect(select(growth, 3, POLICY, none)).toEqual({ picks: growth.slice(0, 2), shortfall: 1, relaxed: [] });
  const fine = [item('a', 9, 'bob', { feasibility: TODAY }), item('b', 8, 'lob', { feasibility: GROWTH })];
  expect(ids(select(fine, 2, POLICY, none).picks)).toEqual(['a', 'b']);
  // Colour looks have no feasibility, so the constraint never reads them.
  const looks = [item('l1', 3, null), item('l2', 2, null)];
  expect(ids(select(looks, 2, POLICY, none).picks)).toEqual(['l1', 'l2']);
});

it('splits Both as ceil(n / 2) cuts and floor(n / 2) colour looks; one goal takes the whole count', () => {
  expect(splitCount(4, ['cut', 'colour'])).toEqual({ cut: 2, colour: 2 });
  expect(splitCount(5, ['cut', 'colour'])).toEqual({ cut: 3, colour: 2 });
  expect(splitCount(1, ['cut', 'colour'])).toEqual({ cut: 1, colour: 0 });
  expect(splitCount(4, ['colour'])).toEqual({ cut: 0, colour: 4 });
});

it('takes at most two of one silhouette and keeps rank order', () => {
  const pool = [item('a', 10, 'bob'), item('b', 9, 'bob'), item('c', 8, 'bob'), item('d', 7, 'lob'), item('e', 6, 'pixie')];
  expect(select(pool, 3, POLICY, none)).toEqual({ picks: [pool[0], pool[1], pool[3]], shortfall: 0, relaxed: [] });
});

it('keeps one slot for a low-upkeep option when the count is two or more', () => {
  const pool = [item('a', 10, 'bob'), item('b', 9, 'lob'), item('c', 8, 'pixie'), item('d', 7, 'crop', { lowUpkeep: true })];
  expect(ids(select(pool, 3, POLICY, none).picks)).toEqual(['a', 'b', 'd']);
  expect(ids(select(pool, 1, POLICY, none).picks)).toEqual(['a']);
});

it('skips removed ideas so the next pick takes their place and the count holds', () => {
  const pool = [item('a', 10, 'bob'), item('b', 9, 'lob'), item('c', 8, 'pixie'), item('d', 7, 'crop')];
  expect(ids(select(pool, 2, POLICY, new Set(['a'])).picks)).toEqual(['b', 'c']);
});

it('says plainly when fewer items are eligible than requested, and relaxes nothing', () => {
  const pool = [item('a', 10, 'bob'), item('b', 9, 'bob')];
  expect(select(pool, 4, POLICY, none)).toEqual({ picks: pool, shortfall: 2, relaxed: [] });
});

it('relaxes in a fixed order: the distinct share first', () => {
  const pool = [item('a', 10, 'bob'), item('b', 9, 'bob'), item('c', 8, 'lob'), item('d', 7, 'lob'), item('e', 6, 'bob')];
  // A share of 0.75 asks for 3 silhouettes among 4 picks; there are only 2.
  expect(select(pool, 4, { ...POLICY, min_distinct_silhouettes_share: 0.75 }, none)).toEqual({ picks: pool.slice(0, 4), shortfall: 0, relaxed: ['distinct_silhouettes'] });
});

it('raises the per-silhouette cap step by step only when nothing else fills the count', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'].map((id, i) => item(id, 10 - i, 'bob'));
  const s = select(pool, 4, POLICY, none);
  expect(ids(s.picks)).toEqual(['a', 'b', 'c', 'd']);
  expect(s.relaxed).toEqual(['distinct_silhouettes', 'max_per_silhouette']);
  const low = [...pool.slice(0, 4), item('f', 1, 'bob', { lowUpkeep: true })];
  expect(select(low, 4, POLICY, none).relaxed).toEqual(['distinct_silhouettes', 'low_upkeep', 'max_per_silhouette']);
});

it('does not cap curly and coily results at two: diversity is on silhouettes, never on texture', () => {
  const curly = [item('curly-rounded', 9, 'rounded'), item('curly-tapered', 8, 'tapered_natural'), item('curly-twist-out', 7, 'twist_out'), item('curly-shag', 6, 'shag'), item('straight-bob', 1, 'bob')];
  expect(ids(select(curly, 4, POLICY, none).picks)).toEqual(['curly-rounded', 'curly-tapered', 'curly-twist-out', 'curly-shag']);
});

it('puts no silhouette cap on colour looks, which have none', () => {
  const looks = ['l1', 'l2', 'l3', 'l4', 'l5'].map((id, i) => item(id, 10 - i, null));
  expect(select(looks, 4, POLICY, none)).toEqual({ picks: looks.slice(0, 4), shortfall: 0, relaxed: [] });
});

describe('the slate', () => {
  const slate = { lambda: 0.7, floor: 0.5, weights: { silhouette: 3, fringe: 2 } };
  const fitted = (id: string, fit: number, silhouette: string, over: Partial<Rankable> = {}): Rankable =>
    item(id, 0, silhouette, { fitAt: [fit], facets: { silhouette, fringe: 'none' }, ...over });

  it('orders by suitability before the rule score, and harmony breaks a tie in suitability', () => {
    expect(ids(rank([item('a', 9, 'bob', { fitAt: [0.5] }), item('b', 0, 'lob', { fitAt: [0.9] })]))).toEqual(['b', 'a']);
    expect(ids(rank([item('a', 0, 'bob', { fitAt: [0.5], harmony: 0.2 }), item('b', 0, 'lob', { fitAt: [0.5], harmony: 0.8 })]))).toEqual(['b', 'a']);
  });

  it('measures how alike two items are on the weighted facets', () => {
    const a = fitted('a', 1, 'bob');
    expect(similarity(a, fitted('b', 1, 'bob'), slate.weights)).toBe(1);
    expect(similarity(a, fitted('c', 1, 'lob'), slate.weights)).toBeCloseTo(2 / 5);
  });

  it('after the first pick prefers the less alike of two suitable items, and takes nothing below the floor while something above fits', () => {
    const pool = [fitted('a', 1, 'bob'), fitted('b', 0.98, 'bob'), fitted('c', 0.9, 'lob'), fitted('d', 0.2, 'crop')];
    expect(ids(rank(pool))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(select(rank(pool), 2, POLICY, none, slate).picks)).toEqual(['a', 'c']);
    expect(ids(select(rank(pool), 3, POLICY, none, slate).picks)).toEqual(['a', 'c', 'b']);
  });

  it('holds a slot for the low-upkeep option with the slate too, below the floor if it must', () => {
    const pool = [fitted('a', 1, 'bob'), fitted('b', 0.9, 'lob'), fitted('low', 0.2, 'crop', { lowUpkeep: true })];
    expect(select(rank(pool), 2, POLICY, none, slate)).toEqual({ picks: [pool[0], pool[2]], shortfall: 0, relaxed: [] });
  });

  it('keeps the cap with the slate', () => {
    const pool = [fitted('a', 1, 'bob'), fitted('b', 0.99, 'bob'), fitted('c', 0.98, 'bob'), fitted('d', 0.6, 'lob')];
    // The second bob is worth more than the lob, so it stays; the third bob is blocked by the cap and the lob takes its place.
    expect(ids(select(rank(pool), 3, POLICY, none, slate).picks)).toEqual(['a', 'b', 'd']);
  });
});
