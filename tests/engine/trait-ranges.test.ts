/**
 * Every trait the build and the engine make stays inside its own declaration: a value beyond the declared range would slip past
 * a rule's range on it, as twenty years of growth once slipped past the one-year limit. Checked over the shipped library on a grid of hair.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { valueOf } from '../../scripts/content/schema.ts';
import { TRAITS, type TargetKind, type TraitSpec } from '../../src/domain/content/traits.ts';
import { cutTraits, lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
const A = (o: Readonly<Record<string, unknown>>): Facts => deriveFacts(Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }])));

/** The hair the grid runs over: every length with the curliest and the straightest resting answers, every level and history kind. */
const CUT_FACTS = ['very_short', 'short', 'chin', 'shoulder', 'long', 'very_long'].flatMap((length) => ['straight', 'coily'].flatMap((texture) =>
  [undefined, 'very_short'].map((resting) => A({ 'hair.current_length': length, 'hair.texture': texture, 'hair.density': 'high', 'life.trim_weeks_ok': 26, ...(resting ? { 'hair.resting_length': resting } : {}) }))));
const LOOK_FACTS = [1, 4, 7, 10].flatMap((natural) => [1, 5, 10].flatMap((lengths) => [['none'], ['home_dye']].map((history) =>
  A({ 'colour.natural_level': natural, 'colour.current_level_lengths': lengths, 'hair.chemical_history': history, 'colour.grey_percent': 50 }))));

/** Each trait value that its declaration does not allow, as `<item> <trait>=<value>`. */
function outside(kind: TargetKind, id: string, traits: Readonly<Record<string, unknown>>): string[] {
  const specs = TRAITS[kind] as Readonly<Record<string, TraitSpec>>;
  return Object.entries(traits).flatMap(([key, value]) => {
    const spec = specs[key];
    return spec && !valueOf(spec).safeParse(value).success ? [`${id} ${key}=${JSON.stringify(value)}`] : [];
  });
}

it('keeps every built and per-person trait inside its declaration, over the library and a grid of hair', () => {
  const c = loaded.content;
  if (!c) throw new Error(loaded.note);
  const cuts = c.cuts.flatMap((cut) => CUT_FACTS.flatMap((f) => outside('cut', cut.id, cutTraits(cut, f, c))));
  const looks = c.looks.flatMap((look) => LOOK_FACTS.flatMap((f) => outside('colour', look.id, lookTraits(look, f, c.shadeLevels))));
  expect([...new Set([...cuts, ...looks])]).toEqual([]);
  // The grid reaches the extremes: twenty years of growth, and the most trims the stated interval allows.
  expect(c.cuts.some((cut) => CUT_FACTS.some((f) => cutTraits(cut, f, c).growth_weeks === TRAITS.cut.growth_weeks.range[1]))).toBe(true);
}, 60_000);
