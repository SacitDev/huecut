/**
 * One behavioural fixture per contradiction between what a person said and what they were offered,
 * and one for the bound on the AI pool, each on the shipped content and through the shipped assessment (`recommend`, `assessIdea`). The checks
 * include independent assertions on library traits and assertions on per-person traits derived by `lookTraits()`.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assessIdea, recommend, type Idea, type Recommendation, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { rankBeards } from '../../src/domain/engine/beards.ts';
import { lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { buildSecondOpinion } from '../../src/domain/prompts/build.ts';
import { coreQuestions } from '../../src/features/consult/questions.ts';
import { feasibilityText, givesWayLine } from '../../src/features/consult/ideas/model.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
const c = loaded.content;
const shipped = loaded.shipped;
if (!c || !shipped) throw new Error(`the content does not build: ${loaded.note}`);

/** Answers, as the questions write them (keys are plain strings so a fact the registry lacks still runs). */
const A = (o: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
/** A measured face value at medium confidence. */
const M = (o: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'medium', source: 'measured' }]));
const run = (f: Facts, o: Partial<RecommendOptions> & Pick<RecommendOptions, 'kinds' | 'collections'>): Recommendation => recommend(f, c, { count: 4, ...o });
const listed = (r: Recommendation): Idea[] => [...r.picks, ...r.pool];
const cut = (id: string) => {
  const x = c.cuts.find((k) => k.id === id);
  if (!x) throw new Error(`no cut ${id} in the shipped library`);
  return x;
};
/** A look's traits for this person, as eligibility reads them. */
const traitsOf = (id: string, f: Facts) => lookTraits(look(id), deriveFacts(f), c.shadeLevels);
const look = (id: string) => {
  const x = c.looks.find((k) => k.id === id);
  if (!x) throw new Error(`no look ${id} in the shipped library`);
  return x;
};
const idea = (id: string, f: Facts): Idea => {
  const x = assessIdea(id, f, c);
  if (!x) throw new Error(`no idea ${id}`);
  return x;
};
const ids = (xs: readonly Idea[]): string[] => xs.map((x) => x.id);
const OK = { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'safety.henna_tattoo': false };

/** Where a length sits on one scale: a collarbone cut (`bob`) sits with shoulder-length hair, a buzz below the shortest hair. */
const POSITION: Readonly<Record<string, number>> = { buzz: 0, very_short: 1, short: 2, chin: 3, bob: 4, shoulder: 4, long: 5, very_long: 6 };
/** Classes measured on zone lengths (stretched) compare with the stretched length; landmarks compare with where the hair rests. */
const takesLengthOff = (id: string, stretched: string, resting: string = stretched): boolean => {
  const k = cut(id).traits.length_class;
  return (POSITION[k] ?? 0) < (POSITION[['buzz', 'very_short', 'short'].includes(k) ? stretched : resting] ?? 0);
};

describe('growing out keeps the length landmark', () => {
  it('straight shoulder-length hair being grown out: no cut that takes a length class off; shaping at the same landmark stays', () => {
    const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'life.grow_out_goal': true });
    const r = run(f, { kinds: ['cut'], collections: ['salon'], count: 8 });
    expect(listed(r).filter((i) => takesLengthOff(i.id, 'shoulder'))).toEqual([]);
    expect(idea('blunt-chin-bob', f).excluded.length).toBeGreaterThan(0);
    expect(idea('one-length-shoulder', f).excluded).toEqual([]);
  });
  it('coily hair being grown out (short stretched, resting very short): no flat top, no high and tight', () => {
    const f = A({ 'hair.texture': 'coily', 'hair.current_length': 'short', 'hair.resting_length': 'very_short', 'pref.top_length': 'short', 'pref.fringe': 'avoid', 'life.grow_out_goal': true });
    const r = run(f, { kinds: ['cut'], collections: ['barbering'], count: 6 });
    expect(listed(r).filter((i) => takesLengthOff(i.id, 'short', 'very_short')).map((i) => i.id)).toEqual([]);
    expect(ids(r.picks)).not.toContain('flat-top');
    expect(ids(r.picks)).not.toContain('high-and-tight');
  });
});

it('scars to cover: nothing that takes any part under 10 mm, fades, undercuts and buzz cuts judged by their millimetres', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'scalp.marks_cover': true, 'beard.style': 'full' });
  const r = run(f, { kinds: ['cut'], collections: ['barbering'] });
  const shows = (i: Idea): boolean => ['skin_fade', 'bald_fade', 'high_fade', 'mid_fade', 'low_fade', 'drop_fade', 'undercut'].includes(cut(i.id).traits.sides) || cut(i.id).traits.scalp_mm < 10;
  expect(listed(r).filter(shows).map((i) => i.id)).toEqual([]);
  expect(r.picks.length).toBeGreaterThan(0);
});

/** In every list: what holds comes before what does not, never one after the other again (`true` marks the later kind). */
const allAfter = (marks: readonly boolean[]): boolean => !marks.includes(true) || !marks.slice(marks.indexOf(true)).includes(false);
/** Cuts that need growth: at most 2 per list, after the shapes reachable today. */
const futureLast = (list: readonly Idea[]): void => {
  const later = list.map((i) => i.feasibility?.status === 'after_growth');
  expect(later.filter(Boolean).length).toBeLessThanOrEqual(2);
  expect(allAfter(later)).toBe(true);
};

it('a stated trim interval is a trade-off: never a removal; cuts that keep it lead, the rest follow by the smallest miss and say so', () => {
  const f = A({ 'hair.texture': 'wavy', 'hair.current_length': 'short', 'pref.top_length': 'short', 'life.styling_minutes': 5, 'life.trim_weeks_ok': 12 });
  const r = run(f, { kinds: ['cut'], collections: ['barbering'], count: 6 });
  expect(idea('caesar-cut', f).excluded).toEqual([]);
  expect(idea('caesar-cut', f).tradeOffs.map((t) => t.what)).toContain('trim');
  const traded = r.picks.filter((i) => i.tradeOffs.length > 0);
  expect(traded.length).toBeGreaterThan(0);
  expect(allAfter(r.picks.map((i) => i.tradeOffs.length > 0))).toBe(true);
  const miss = (i: Idea): number => i.tradeOffs.reduce((m, t) => m * t.factor, 1);
  expect(traded.map(miss)).toEqual([...traded.map(miss)].sort((a, b) => b - a));
  for (const i of traded) {
    const t = i.tradeOffs.find((x) => x.what === 'trim');
    if (t?.what === 'trim') expect(feasibilityText(i.feasibility, i.poorFit, i.tradeOffs)).toContain(`a trim every ${String(t.weeks[0])} to ${String(t.weeks[1])} weeks`);
    expect(feasibilityText(i.feasibility, i.poorFit, i.tradeOffs)).toMatch(/more than you said/);
  }
});

describe('after-growth targets', () => {
  const short = { 'hair.texture': 'straight', 'hair.current_length': 'very_short' };
  it('without a "growing out" answer, answered no or not at all, a cut that needs growth is a future option: at most 2, last, its growth named', () => {
    for (const f of [A({ ...short, 'life.grow_out_goal': false }), A(short)]) {
      const r = run(f, { kinds: ['cut'], collections: ['salon'], count: 8 });
      for (const list of [r.picks, r.pool]) futureLast(list);
      for (const i of listed(r).filter((x) => x.feasibility?.status === 'after_growth')) {
        expect(i.tradeOffs.map((t) => t.what)).toContain('growth');
        expect(feasibilityText(i.feasibility, i.poorFit, i.tradeOffs)).toMatch(/more length/);
      }
    }
  });
  it('not growing out, answered no or not at all: a cut more than a year of growth away is never listed', () => {
    for (const f of [A({ ...short, 'life.grow_out_goal': false }), A(short)]) {
      expect((idea('long-curtain-layers', f).feasibility?.length as { weeks?: number } | null)?.weeks ?? 0).toBeGreaterThan(52);
      expect(idea('long-curtain-layers', f).excluded.map((x) => x.ruleId)).toContain('growth-over-a-year');
      const r = run(f, { kinds: ['cut'], collections: ['salon'], count: 8 });
      for (const i of listed(r)) expect((i.feasibility?.length as { weeks?: number } | null)?.weeks ?? 0).toBeLessThanOrEqual(52);
    }
  });
  it('coily hair resting short that must tie back: every cut listed ties back; a lob that needs growth is only a future option', () => {
    const f = A({ 'hair.texture': 'coily', 'hair.current_length': 'shoulder', 'hair.resting_length': 'short', 'hair.density': 'high', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8, 'life.tie_back_needed': true });
    const r = run(f, { kinds: ['cut'], collections: ['salon'], count: 6 });
    for (const i of listed(r)) expect(idea(i.id, f).excluded.map((x) => x.ruleId)).not.toContain('c09');
    for (const list of [r.picks, r.pool]) futureLast(list);
  });
  it('growing out: at most 2 per list, after the shapes reachable today, with no growth trade-off', () => {
    for (const f of [A({ ...short, 'life.grow_out_goal': true }), A({ 'hair.texture': 'coily', 'hair.current_length': 'shoulder', 'hair.resting_length': 'short', 'life.grow_out_goal': true })]) {
      const r = run(f, { kinds: ['cut'], collections: ['salon'], count: 8 });
      for (const list of [r.picks, r.pool]) futureLast(list);
      for (const i of listed(r)) expect(i.tradeOffs.map((t) => t.what)).not.toContain('growth');
    }
  });
});

describe('bun, knot and bixies on a grow-out case', () => {
  it('the man bun and top knot need hair that ties: shoulder class; the bixies sit above the chin', () => {
    expect(POSITION[cut('man-bun-classic').traits.length_class]).toBeGreaterThanOrEqual(POSITION.shoulder ?? 4);
    expect(POSITION[cut('top-knot-undercut').traits.length_class]).toBeGreaterThanOrEqual(POSITION.shoulder ?? 4);
    expect(cut('bixie').traits.length_class).toBe('short');
    expect(cut('curly-bixie').traits.length_class).toBe('short');
  });
  it('wavy chin-length hair is not ready for a man bun today; curls resting at the chin being grown out are not cut into a bixie', () => {
    expect(idea('man-bun-classic', A({ 'hair.texture': 'wavy', 'hair.current_length': 'chin', 'pref.top_length': 'medium' })).feasibility?.status).not.toBe('today');
    const w2 = A({ 'hair.texture': 'curly', 'hair.current_length': 'shoulder', 'hair.resting_length': 'chin', 'life.grow_out_goal': true, 'wish.jaw': 'soften' });
    expect(ids(listed(run(w2, { kinds: ['cut'], collections: ['salon'] })))).not.toContain('curly-bixie');
    expect(idea('curly-bixie', w2).excluded.length).toBeGreaterThan(0);
  });
});

describe('wishes act as stated', () => {
  const base = { 'hair.texture': 'straight', 'hair.current_length': 'shoulder' };
  const CONCRETE: readonly (readonly [string, string])[] = [
    ['wish.face_length', 'soften'], ['wish.face_length', 'emphasise'], ['wish.face_width', 'soften'], ['wish.face_width', 'emphasise'],
    ['wish.forehead', 'soften'], ['wish.forehead', 'emphasise'], ['wish.jaw', 'soften'], ['wish.jaw', 'emphasise'],
    ['wish.chin', 'soften'], ['wish.chin', 'emphasise'], ['wish.height', 'soften'], ['wish.height', 'emphasise'],
  ];
  // "Make my hair look fuller" is gated on low density, a hair answer, not on the face, so it is not one of the face-gated wishes here.
  it('each concrete wish moves some cut with no photo at all', () => {
    const silent = CONCRETE.filter(([k, v]) => {
      const f = A({ ...base, [k]: v });
      const reads = new Set(c.rules.cut.filter((r) => Object.keys(r.when).includes(k)).map((r) => r.id));
      return !c.cuts.some((x) => idea(x.id, f).contributions.some((n) => reads.has(n.ruleId) && n.points !== 0));
    });
    expect(silent).toEqual([]);
  });
  it('"cover more of my forehead" favours fringes and never says "open space", whatever the forehead reading (a07 gone)', () => {
    for (const face of [{}, M({ 'face.width_to_length': 0.8, 'face.forehead_share': 'shorter' }), M({ 'face.width_to_length': 0.8, 'face.forehead_share': 'longer' })]) {
      const f = { ...A({ ...base, 'hair.density': 'medium', 'pref.fringe': 'open', 'wish.forehead': 'soften' }), ...face };
      const r = run(f, { kinds: ['cut'], collections: ['salon'] });
      expect(r.picks.flatMap((p) => p.reasons.map((x) => x.text)).join(' ')).not.toMatch(/open space/i);
      const wished = (id: string): number => idea(id, f).contributions.filter((n) => c.rules.cut.find((x) => x.id === n.ruleId)?.when['wish.forehead'] !== undefined).reduce((s, n) => s + n.points, 0);
      expect(wished('french-bob')).toBeGreaterThan(0);
      expect(wished('face-frame-only-shoulder')).toBeLessThanOrEqual(0);
    }
  });
});

it('traction signs: no high-tension style, the caution stays', () => {
  const f = A({ 'hair.texture': 'coily', 'hair.current_length': 'short', 'hair.traction_signs': true });
  const r = run(f, { kinds: ['cut'], collections: ['barbering'], count: 8 });
  expect(listed(r).filter((i) => cut(i.id).traits.tension === 'high').map((i) => i.id)).toEqual([]);
  expect(idea('cornrows-fade', f).excluded.length).toBeGreaterThan(0);
  expect(r.notes.map((n) => n.ruleId)).toContain('b33');
});

describe('henna, black-henna tattoos and a sore scalp are referrals', () => {
  const colour = { 'colour.natural_level': 4, 'pref.colour_direction': 'lighter', 'hair.condition': 'healthy' };
  const cases: Readonly<Record<string, Facts>> = {
    'compound henna in the history': A({ ...colour, ...OK, 'hair.chemical_history': ['henna_compound'] }),
    'plant henna that the follow-up calls compound': A({ ...colour, ...OK, 'hair.chemical_history': ['henna_plant'], 'colour.henna_type': 'compound' }),
    'henna of unknown type': A({ ...colour, ...OK, 'hair.chemical_history': ['henna_plant'] }),
    'a black-henna tattoo, natural hair': A({ ...colour, ...OK, 'hair.chemical_history': ['none'], 'safety.henna_tattoo': true }),
    'a scalp that is sore now': A({ ...colour, ...OK, 'hair.chemical_history': ['none'], 'safety.scalp_irritation': 'now' }),
  };
  for (const [what, f] of Object.entries(cases)) {
    it(`${what}: the referral, no colour ideas to try, no colour prompts`, () => {
      const r = run(f, { kinds: ['cut', 'colour'], collections: ['salon'] });
      expect(r.referral).not.toBeNull();
      expect(r.colourPrompts).toBe(false);
      expect(r.pool.filter((i) => i.kind === 'colour')).toEqual([]);
      expect(r.picks.filter((i) => i.kind === 'colour' && i.referral === null)).toEqual([]);
    });
  }
  it('the tattoo question is asked on its own in every colour core set, whatever the hair history: under every answer of the reaction question', () => {
    const q = shipped.consult.questions;
    for (const set of ['colour/any', 'both/salon', 'both/barbering'] as const) {
      const asked = coreQuestions(q, set, A({ 'hair.chemical_history': ['none'] }));
      const holder = asked.find((a) => [...a.followUps.values()].some((x) => x.fact === 'safety.henna_tattoo' && x.show_if === undefined));
      expect(holder, `${set}: a question holds the tattoo question as a follow-up`).toBeDefined();
      expect(holder?.followUps.size, set).toBe(holder?.question.options.length);
    }
  });
});

describe('damaged or repeatedly lightened lengths', () => {
  const lightensLengths = (i: Idea, lengths: number): boolean => i.kind === 'colour' && look(i.id).traits.lightening !== 'none' && look(i.id).traits.target_level > lengths;
  // The last field: whether a tone or gloss at the lengths' depth can be offered at the same depth: permanent colour lifts the natural
  // roots two levels to a colour worn at 7.
  const cases: readonly [string, Facts, number, RegExp, boolean][] = [
    ['damaged', A({ ...OK, 'hair.condition': 'damaged', 'hair.chemical_history': ['highlights', 'home_dye'], 'colour.natural_level': 6, 'colour.current_level_lengths': 7, 'pref.colour_direction': 'lighter' }), 7, /damaged/, true],
    ['lightened 2-3 times', A({ ...OK, 'hair.condition': 'healthy', 'hair.chemical_history': ['bleach'], 'colour.bleach_count': 3, 'colour.natural_level': 5, 'colour.current_level_lengths': 7, 'pref.colour_direction': 'lighter' }), 7, /lightened two or more times/, true],
  ];
  for (const [what, f, lengths, why, depth] of cases) {
    it(`${what}: no look lightens the lengths, and colour without lightener cannot go lighter either; a tone or gloss at their depth where the roots take it`, () => {
      const r = run(f, { kinds: ['colour'], collections: ['salon'], count: 8 });
      expect(listed(r).filter((i) => lightensLengths(i, lengths)).map((i) => i.id)).toEqual([]);
      expect(listed(r).filter((i) => look(i.id).traits.lightening === 'none').map((i) => i.id)).toEqual([]);
      if (r.picks.length === 0) expect(r.shortfall.flatMap((s) => s.because).join(' ')).toMatch(why);
      const tone = run({ ...f, 'pref.colour_direction': { key: 'pref.colour_direction', value: 'tone', confidence: 'high', source: 'answered' } }, { kinds: ['colour'], collections: ['salon'], count: 8 });
      expect(listed(tone).filter((i) => lightensLengths(i, lengths)).map((i) => i.id)).toEqual([]);
      expect(listed(tone).some((i) => look(i.id).traits.lightening === 'none' && Math.abs(look(i.id).traits.target_level - lengths) <= 1)).toBe(depth);
    });
  }
});

it('black roots under bleached lengths: lifting the roots is never Plausible', () => {
  const f = A({ ...OK, 'colour.natural_level': 1, 'hair.chemical_history': ['bleach'], 'colour.current_level_lengths': 9, 'hair.condition': 'healthy', 'colour.grey_percent': 40, 'colour.grey_goal': 'blend', 'pref.colour_direction': 'lighter' });
  const i = idea('grey-blend-blonde', f);
  expect(i.label).not.toBe('plausible');
  expect(i.journey?.lift ?? 0).toBeGreaterThanOrEqual(5);
});

describe('darker and natural are judged per region', () => {
  it('back to a natural level 4: a melt with soft-black roots is not called close to the natural shade', () => {
    const f = A({ ...OK, 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'pref.colour_direction': 'natural' });
    const i = idea('black-burgundy-melt', f);
    expect(i.contributions.filter((n) => n.ruleId === 'direction-natural' && n.points > 0)).toEqual([]);
    expect(i.reasons.map((x) => x.text).join(' ')).not.toMatch(/close to your natural/i);
  });
  it('darker from level 6: a look five levels darker at its deepest is not Plausible', () => {
    const f = A({ ...OK, 'colour.natural_level': 6, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.grey_percent': 40, 'colour.grey_goal': 'blend', 'pref.colour_direction': 'darker' });
    const i = idea('black-burgundy-melt', f);
    expect(i.excluded.length > 0 || i.label !== 'plausible').toBe(true);
  });
  it('darker over pale lengths: a dark root shadow on lightened hair does not count as darker', () => {
    const f = A({ ...OK, 'colour.natural_level': 6, 'hair.chemical_history': ['bleach'], 'colour.current_level_lengths': 9, 'hair.condition': 'healthy', 'pref.colour_direction': 'darker' });
    expect(idea('ash-blonde-root-shadow', f).excluded.length).toBeGreaterThan(0);
  });
});

describe('the direction is never turned around', () => {
  it('darker on black hair with 62% grey: nothing lighter', () => {
    const f = A({ ...OK, 'pref.colour_direction': 'darker', 'colour.natural_level': 1, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.grey_percent': 62.5, 'colour.grey_goal': 'blend', 'hair.texture': 'wavy' });
    const r = run(f, { kinds: ['colour'], collections: ['barbering'] });
    expect(listed(r).filter((i) => look(i.id).traits.target_level > 1).map((i) => i.id)).toEqual([]);
  });
  it('lighter over highlights at level 9: nothing two or more levels darker all over', () => {
    const f = A({ ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 2, 'hair.chemical_history': ['highlights'], 'colour.current_level_lengths': 9, 'hair.condition': 'dry', 'colour.grey_percent': 5, 'colour.grey_goal': 'blend' });
    const r = run(f, { kinds: ['colour'], collections: ['barbering'] });
    expect(listed(r).filter((i) => look(i.id).traits.target_level <= 7).map((i) => i.id)).toEqual([]);
  });
  it('a direction no look can do gives its line, and a direction some look does gives none', () => {
    const at = (way: string, level: number) => A({ ...OK, 'pref.colour_direction': way, 'colour.natural_level': level, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' });
    for (const f of [at('darker', 1), at('lighter', 10)]) expect(givesWayLine(run(f, { kinds: ['colour'], collections: ['salon'] }), f)).toMatch(/already as (dark|light) as it gets/);
    for (const f of [at('darker', 6), at('lighter', 6)]) expect(givesWayLine(run(f, { kinds: ['colour'], collections: ['salon'] }), f)).toBeNull();
  });
});

describe('a stated colour direction admits only looks that go that way, in the regions they treat', () => {
  const at = (way: string, natural: number, lengths: number, extra: object = {}) => A({ ...OK, 'pref.colour_direction': way, 'colour.natural_level': natural, 'colour.current_level_lengths': lengths, 'hair.chemical_history': ['home_dye'], 'hair.condition': 'healthy', 'colour.grey_percent': 30, 'colour.grey_goal': 'cover', ...extra });
  const cases: readonly [string, Facts, (t: ReturnType<typeof traitsOf>) => boolean][] = [
    ['lighter', at('lighter', 5, 5), (t) => (t.lift_levels ?? 0) >= 1 && (t.darkens_by ?? 0) <= 1],
    // What a look really does in each region: without lightener nothing ends lighter than the hair.
    ['darker', at('darker', 6, 7), (t) => (t.darkens_by ?? 0) >= 1 && (t.known_lift ?? 0) <= 0],
    ['bright', at('vivid', 4, 4), (t) => t.vivid],
    // What a look does to grey is its authored effect; "cover or blend" leaves out only looks that leave grey as it is.
    ['grey', at('grey', 5, 5), (t) => t.grey_effect !== 'shows'],
    ['natural', at('natural', 6, 4), (t) => t.contrast_with_natural === 'low'],
  ];
  it.each(cases)('%s: every colour listed goes that way; for barbering, lent salon looks too', (_, f, goes) => {
    for (const collections of [['salon'], ['barbering']] as const) {
      const r = run(f, { kinds: ['colour'], collections: [...collections], count: 6 });
      const shown = [...listed(r), ...r.worthAsking.map((w) => w.idea)].filter((i) => i.kind === 'colour');
      for (const i of shown) expect(goes(traitsOf(i.id, f)), `${collections[0]}: ${i.id}`).toBe(true);
      if (r.picks.length < 6) expect(r.shortfall.flatMap((s) => s.because).length).toBeGreaterThan(0);
    }
  });
  it('bright from medium brown in barbering: the bright look and the shortfall line, no grey cover in its place', () => {
    const f = A({ ...OK, 'pref.colour_direction': 'vivid', 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' });
    const r = run(f, { kinds: ['colour'], collections: ['barbering'], count: 6 });
    expect(r.picks.every((i) => look(i.id).traits.vivid)).toBe(true);
    expect(r.shortfall[0]?.because.join(' ')).toMatch(/not bright/);
  });
});

it('bright colours only when asked', () => {
  const f = A({ ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 1, 'hair.chemical_history': ['bleach'], 'colour.current_level_lengths': 9, 'hair.condition': 'healthy', 'colour.grey_percent': 40, 'colour.grey_goal': 'blend' });
  expect(listed(run(f, { kinds: ['colour'], collections: ['salon'], count: 8 })).filter((i) => look(i.id).traits.vivid).map((i) => i.id)).toEqual([]);
  const asked = A({ ...OK, 'pref.colour_direction': 'vivid', 'colour.natural_level': 7, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' });
  expect(run(asked, { kinds: ['colour'], collections: ['salon'] }).picks.some((i) => look(i.id).traits.vivid)).toBe(true);
});

it('the AI pick prompt carries the limits and the wishes in fixed words', () => {
  const said = { 'hair.texture': 'straight', 'hair.current_length': 'very_short', 'pref.fringe': 'want', 'life.styling_minutes': 5, 'life.trim_weeks_ok': 3, 'hair.recession_stage': 1, 'beard.style': 'full', 'scalp.marks_cover': true, 'life.grow_out_goal': true, 'wish.jaw': 'emphasise' };
  const f = A(said);
  const r = run(f, { kinds: ['cut'], collections: ['barbering'] });
  const names = new Map(shipped.library.entries.map((e) => [e.id, e.name]));
  const pool = r.pool.map((i) => ({ id: i.id, kind: i.kind, name: names.get(i.id) ?? i.id, prompt_spec: '' }));
  const built = buildSecondOpinion(shipped.consult.prompts, { pool, facts: f }, { referral: null });
  expect(built.ok).toBe(true);
  const text = built.ok ? built.value.text : '';
  expect(text).toMatch(/What I need:/);
  for (const words of [/growing my hair out/i, /scars? (on my scalp )?covered/i, /trim every 3 weeks/i, /5 minutes/i, /fringe/i, /clean line at my jaw/i]) expect(text).toMatch(words);
  // A listed cut that needs more than was said is named in "What I need", by limit.
  const longer = A({ ...said, 'life.trim_weeks_ok': 12, 'life.grow_out_goal': false });
  const traded = run(longer, { kinds: ['cut'], collections: ['barbering'] }).pool;
  const withTrades = traded.map((i) => ({ id: i.id, kind: i.kind, name: names.get(i.id) ?? i.id, prompt_spec: '', tradeOffs: i.tradeOffs }));
  const second = buildSecondOpinion(shipped.consult.prompts, { pool: withTrades, facts: longer }, { referral: null });
  if (traded.some((i) => i.tradeOffs.some((t) => t.what === 'trim'))) expect(second.ok ? second.value.text : '').toMatch(/more trims than I said/);
});

it('beard ranking reads the same notes the card shows: a wish note suppressed for patchy growth gives no lift in the order', () => {
  const answers = { 'hair.texture': 'straight', 'hair.current_length': 'short', 'beard.style': 'full', 'beard.density': 'patchy' };
  const face = M({ 'face.width_to_length': 0.95, 'face.proportion': 'rounder' });
  const target = cut('textured-crop-low-taper');
  // Stubble and short beards: patchy growth suppresses the width wish's notes on every one of them, so the wish has nothing to lift.
  const short = (c.beards ?? []).filter((b) => ['stubble', 'short'].includes(b.traits.beard_length));
  const order = (f: Facts) => rankBeards(target, f, short, c.rules.beard ?? [], ['barbering'], c.policy.suitability ?? (() => { throw new Error('no suitability'); })());
  expect(order({ ...A({ ...answers, 'wish.face_width': 'soften' }), ...face })).toEqual(order({ ...A(answers), ...face }));
});

it('the AI pool holds at most 10 ideas, each eligible, lent salon looks counted inside it', () => {
  const f = A({ ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 1, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.grey_percent': 20, 'colour.grey_goal': 'cover', 'hair.texture': 'straight', 'hair.current_length': 'short' });
  const r = run(f, { kinds: ['cut', 'colour'], collections: ['barbering'] });
  expect(r.pool.length).toBeLessThanOrEqual(10);
  expect(r.pool.filter((i) => i.excluded.length > 0)).toEqual([]);
});
