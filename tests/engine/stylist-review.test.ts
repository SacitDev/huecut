/**
 * A stylist's review of the engine: one fixture per finding, on the shipped content and through the shipped assessment, with
 * the stylist's own fictional probe profiles.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assessIdea, recommend, type Idea, type Recommendation, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { coreQuestions } from '../../src/features/consult/questions.ts';
import { givesWayLine } from '../../src/features/consult/ideas/model.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
const c = loaded.content;
const shipped = loaded.shipped;
if (!c || !shipped) throw new Error(`the content does not build: ${loaded.note}`);

const A = (o: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const run = (f: Facts, o: Pick<RecommendOptions, 'kinds' | 'collections'> & Partial<RecommendOptions>): Recommendation => recommend(f, c, { count: 6, ...o });
const listed = (r: Recommendation): Idea[] => [...r.picks, ...r.pool];
const idea = (id: string, f: Facts): Idea => {
  const x = assessIdea(id, f, c);
  if (!x) throw new Error(`no idea ${id}`);
  return x;
};
const look = (id: string) => c.looks.find((l) => l.id === id) ?? (() => { throw new Error(`no look ${id}`); })();
const traits = (id: string, f: Facts) => lookTraits(look(id), deriveFacts(f), c.shadeLevels);
const question = (id: string) => shipped.consult.questions.questions.find((q) => q.id === id);
const OK = { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'safety.henna_tattoo': false };
const LIGHTER = { ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 5 };

describe('damaged or twice-lightened lengths are never lightened, by a gloss or with their level unknown', () => {
  it.each([
    ['damaged, highlighted lengths at 7', A({ ...LIGHTER, 'hair.chemical_history': ['highlights'], 'colour.current_level_lengths': 7, 'hair.condition': 'damaged' })],
    ['lightened 2-3 times, lengths at 7', A({ ...LIGHTER, 'hair.chemical_history': ['bleach'], 'colour.bleach_count': 3, 'colour.current_level_lengths': 7, 'hair.condition': 'healthy' })],
  ])('%s: no listed look lifts the lengths, a gloss included', (_, f) => {
    for (const i of listed(run(f, { kinds: ['colour'], collections: ['salon'] }))) expect(traits(i.id, f).lengths_lift ?? 0, i.id).toBeLessThan(1);
  });
  it.each([
    ['damaged', A({ ...LIGHTER, 'hair.chemical_history': ['highlights'], 'hair.condition': 'damaged' })],
    ['lightened 2-3 times', A({ ...LIGHTER, 'hair.chemical_history': ['bleach'], 'colour.bleach_count': 3, 'hair.condition': 'healthy' })],
  ])('%s, lengths level not known: no listed look uses lightener', (_, f) => {
    for (const i of listed(run(f, { kinds: ['colour'], collections: ['salon'] }))) expect(look(i.id).traits.lightening, i.id).toBe('none');
  });
});

it('an unknown level never says that no look can take the hair the way asked', () => {
  for (const f of [A({ ...LIGHTER, 'hair.chemical_history': ['highlights'], 'hair.condition': 'healthy' }), A({ ...OK, 'pref.colour_direction': 'darker' })]) {
    const r = run(f, { kinds: ['colour'], collections: ['salon'] });
    expect(r.picks.length).toBeGreaterThan(0);
    expect(givesWayLine(r, f)).toBeNull();
  }
});

it('traction signs leave out the man bun, the top knot and the afro puff: they gather the hair and pull', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'long', 'hair.resting_length': 'long', 'hair.traction_signs': true, 'pref.top_length': 'long', 'life.styling_minutes': 20, 'life.trim_weeks_ok': 6 });
  for (const id of ['man-bun-classic', 'top-knot-undercut', 'afro-puff-taper']) expect(idea(id, f).excluded.map((x) => x.ruleId), id).toContain('traction-high-tension');
  expect(listed(run(f, { kinds: ['cut'], collections: ['barbering'], count: 8 })).map((i) => i.id)).not.toContain('man-bun-classic');
});

describe('an answer stores the limit it accepts, and a reason quotes its words', () => {
  it('trim answers store the shortest interval each accepts, styling answers the most minutes', () => {
    expect(question('trim-interval')?.options.map((o) => ('value' in o ? o.value : null))).toEqual([2, 4, 6, 12, null]);
    expect(question('styling-time')?.options.map((o) => ('sets' in o ? o.sets['life.styling_minutes' as never] : null))).toEqual([7, 12, 20, 60, null]);
  });
  it('a cut holding 5 to 7 weeks is no trade-off for "every 6 to 8 weeks"; one needing 6 minutes none for "about 5 minutes"', () => {
    // The values the two answers store, as the questions give them.
    const trim = question('trim-interval')?.options.find((o) => o.label === 'Every 6 to 8 weeks');
    const styling = question('styling-time')?.options.find((o) => o.label === 'Wash and go, about 5 minutes');
    const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'pref.top_length': 'medium', 'life.styling_minutes': styling && 'sets' in styling ? styling.sets['life.styling_minutes' as never] : 0, 'life.trim_weeks_ok': trim && 'value' in trim ? trim.value : 0 });
    const holds = c.cuts.filter((x) => x.traits.trim_weeks[1] >= 6 && x.traits.trim_weeks[1] < 8 && x.traits.styling_minutes[0] <= 7);
    expect(holds.length).toBeGreaterThan(0);
    for (const x of holds) expect(idea(x.id, f).tradeOffs.filter((t) => t.what !== 'growth').map((t) => t.what), x.id).toEqual([]);
  });
  it('the trim reason quotes the answer as the person chose it', () => {
    const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'pref.top_length': 'medium', 'life.styling_minutes': 12, 'life.trim_weeks_ok': 6 });
    const reasons = listed(run(f, { kinds: ['cut'], collections: ['barbering'], count: 8 })).flatMap((i) => i.reasons.filter((r) => r.ruleId === 'fit-trim').map((r) => r.text));
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) expect(r).toContain('“Every 6 to 8 weeks”');
  });
});

describe('the questions a colourist or barber asks first are in the core sets, each behind its condition', () => {
  const sets = ['colour/any', 'both/salon', 'both/barbering'] as const;
  const asked = (set: (typeof sets)[number], history: readonly string[]) => coreQuestions(shipped.consult.questions, set, A({ 'hair.chemical_history': history })).map((a) => a.question.id);
  it.each(sets)('%s: the henna type after plant henna, the bleach count after lightening, neither after none', (set) => {
    expect(asked(set, ['henna_plant'])).toContain('colour-henna-type');
    expect(asked(set, ['highlights'])).toContain('colour-bleach-count');
    expect(asked(set, ['none'])).not.toContain('colour-henna-type');
    expect(asked(set, ['home_dye'])).not.toContain('colour-bleach-count');
  });
  it('the henna type has no tattoo option of its own (the tattoo question asks it); plant henna named is no referral', () => {
    expect(question('colour-henna-type')?.options.map((o) => ('value' in o ? o.value : null))).not.toContain('tattoo');
    const f = A({ ...OK, 'pref.colour_direction': 'darker', 'colour.natural_level': 4, 'hair.chemical_history': ['henna_plant'], 'colour.henna_type': 'plant', 'colour.current_level_lengths': 5, 'hair.condition': 'healthy' });
    expect(run(f, { kinds: ['colour'], collections: ['salon'] }).referral).toBeNull();
  });
  it('a man choosing cut and colour is asked about scars too', () => {
    expect(shipped.consult.questions.core_sets['both/barbering']).toContain('scalp-marks-cover');
  });
});

it('a silver goal never leads with brown pieces at level 3 to 6', () => {
  const f = A({ ...OK, 'pref.colour_direction': 'grey', 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.grey_percent': 87.5, 'colour.grey_goal': 'silver' });
  const first = run(f, { kinds: ['colour'], collections: ['salon'] }).picks[0];
  expect(first && look(first.id).traits.target_level).toBeGreaterThan(6);
});

it('going lighter leaves out lowlights, which are darker pieces', () => {
  const f = A({ ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 3, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' });
  for (const collections of [['barbering'], ['salon']] as const) {
    expect(listed(run(f, { kinds: ['colour'], collections: [...collections] })).filter((i) => look(i.id).traits.technique.includes('lowlights')).map((i) => i.id)).toEqual([]);
  }
});

it('a shaved head is trimmed at the barber every 4 to 12 weeks (the razor shave at home is its styling): no trade-off for a 2-4 week client', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'very_short', 'pref.top_length': 'very_short', 'life.styling_minutes': 12, 'life.trim_weeks_ok': 2 });
  expect(idea('shaved-head', f).tradeOffs).toEqual([]);
});
