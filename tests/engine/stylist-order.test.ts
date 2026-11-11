/**
 * The order of a good consultation, on the real content: what the person asked for, then what their hair can do within
 * their patience, then what flatters them, then variety. Facts are fictional and hand-written from a stylist's reasoning.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { EngineCut } from '../../src/domain/engine/derive-traits.ts';
import { recommend, type EngineContent, type Idea, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { apparentRatio, hairShape } from '../../src/domain/engine/suitability.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
if (!loaded.content) throw new Error(loaded.note);
const content: EngineContent = loaded.content;

const fact = (key: string, value: unknown, confidence: string, source: string) => [key, { key, value, confidence, source }] as const;
const answered = (values: Record<string, unknown>): Facts => Object.fromEntries(Object.entries(values).map(([k, v]) => fact(k, v, 'high', 'answered')));
const face = (w: number, j = 0.85): Facts => Object.fromEntries([fact('face.width_to_length', w, 'high', 'measured'), fact('face.jaw_to_cheek', j, 'high', 'measured')]);
const salon: RecommendOptions = { kinds: ['cut'], collections: ['salon'], count: 6 };
const barber: RecommendOptions = { kinds: ['cut'], collections: ['barbering'], count: 6 };
const colourSalon: RecommendOptions = { kinds: ['colour'], collections: ['salon'], count: 6 };
const colourBarber: RecommendOptions = { kinds: ['colour'], collections: ['barbering'], count: 6 };
const cutOf = (p: Idea): EngineCut => {
  const c = content.cuts.find((x) => x.id === p.id);
  if (!c) throw new Error(`no cut ${p.id}`);
  return c;
};
const firstOf = (picks: readonly Idea[]): Idea => {
  const [p] = picks;
  if (!p) throw new Error('no picks');
  return p;
};
const lookOf = (p: Idea) => {
  const l = content.looks.find((x) => x.id === p.id);
  if (!l) throw new Error(`no look ${p.id}`);
  return l;
};

const VERY_SHORT_MAN = { 'hair.texture': 'straight', 'hair.current_length': 'very_short', 'hair.density': 'low', 'life.styling_minutes': 5, 'life.trim_weeks_ok': 12 };

it('never offers a man bun or long layers to someone who asked for a top under 2 cm', () => {
  // A clipper-short top needs a trim every few weeks; asked for every 12, every such cut would miss the trim answer and carry it as a
  // trade-off, so this person says 4.
  const { picks } = recommend(answered({ ...VERY_SHORT_MAN, 'life.trim_weeks_ok': 4, 'pref.top_length': 'very_short', 'pref.change_amount': 'bold' }), content, barber);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) expect(['very_short', 'short']).toContain(cutOf(p).traits.top_length);
  expect(picks.map((p) => p.id)).not.toContain('man-bun-classic');
  expect(picks.map((p) => p.id)).not.toContain('long-layers-natural');
});

it('says plainly that a top under 2 cm cannot be tied back, rather than offering a cut that breaks either answer', () => {
  const r = recommend(answered({ ...VERY_SHORT_MAN, 'pref.top_length': 'very_short', 'life.tie_back_needed': true }), content, barber);
  expect(r.picks).toEqual([]);
  expect(r.shortfall[0]?.because).toEqual(expect.arrayContaining(['You need to tie your hair back, so cuts that cannot be tied are left out.']));
});

it('leaves out every cut that cannot be tied when tying back is needed, whatever its length', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'life.tie_back_needed': true }), content, salon);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) expect(cutOf(p).traits.tie_back).toBe(true);
});

it('keeps a cut that ties back ahead of one that merely stays out of the way', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'wavy', 'hair.current_length': 'long', 'hair.density': 'medium', 'life.tie_back_needed': true, 'pref.change_amount': 'bold' }), content, salon);
  expect(cutOf(firstOf(picks)).traits.tie_back).toBe(true);
});

it('gives a person who wants over 10 cm on top no buzz cut or crop', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'wavy', 'hair.current_length': 'chin', 'hair.density': 'medium', 'pref.top_length': 'long', 'pref.change_amount': 'bold' }), content, barber);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) expect(['medium', 'long']).toContain(cutOf(p).traits.top_length);
});

it('puts the top length that was asked for ahead of the next one along', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'hair.density': 'medium', 'pref.top_length': 'short' }), content, barber);
  expect(cutOf(firstOf(picks)).traits.top_length).toBe('short');
});

it('shows no fringe to someone who said no fringe', () => {
  for (const options of [salon, barber]) {
    const { picks } = recommend(answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'pref.fringe': 'avoid', 'pref.change_amount': 'bold' }), content, options);
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect(cutOf(p).traits.fringe).toBe('none');
  }
});

it('does not cut a short fringe back in while one is being grown out; a long sweep is still fine', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'curly', 'hair.current_length': 'short', 'life.growing_out_fringe': true }), content, barber);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) expect(['none', 'curtain', 'side_swept', 'long_side']).toContain(cutOf(p).traits.fringe);
});

it('takes "subtle" at its word: no big chop from long hair', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'very_long', 'hair.density': 'high', 'pref.change_amount': 'subtle' }), content, salon);
  for (const p of picks) expect(['long', 'very_long', 'shoulder']).toContain(cutOf(p).traits.length_class);
});

it('offers nothing that breaks an answer when answers cannot all be met: it says which answers stand in the way', () => {
  const r = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'very_long', 'pref.top_length': 'very_short', 'pref.change_amount': 'subtle' }), content, barber);
  expect(r.picks).toEqual([]);
  expect(r.shortfall).toMatchObject([{ kind: 'cut', requested: 6, available: 0 }]);
  expect(r.shortfall[0]?.because).toEqual(expect.arrayContaining(['You asked for a gentle change, so cuts that take a lot of length off are left out.']));
});

it('reads a length band honestly: a cut is not "today" just because the very top of the band could reach it', () => {
  const man = content.cuts.find((c) => c.id === 'man-bun-classic');
  expect(man).toBeDefined();
  const r = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'short' }), content, { ...barber, added: ['man-bun-classic'] });
  expect(r.added[0]?.feasibility?.length?.status).toBe('after_growth');
});

it('does not promise a chin-length shape to hair of a few centimetres', () => {
  const r = recommend(answered({ 'hair.texture': 'curly', 'hair.current_length': 'very_short' }), content, { ...salon, added: ['short-shag'] });
  expect(r.added[0]?.feasibility?.length?.status).toBe('after_growth');
});

it('leads with what works today for someone not growing their hair; a cut that needs growth is a marked future option', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'hair.density': 'medium' }), content, salon);
  expect(picks.length).toBeGreaterThan(0);
  expect(picks[0]?.feasibility?.length?.status).toBe('today');
  const lob = recommend(answered({ 'hair.texture': 'straight', 'hair.current_length': 'chin', 'hair.density': 'medium' }), content, { ...salon, added: ['a-line-lob'] }).added[0];
  expect(lob?.feasibility?.length?.status).toBe('after_growth');
  expect(lob?.excluded).toEqual([]);
  expect(lob?.tradeOffs.map((t) => t.what)).toEqual(['growth']);
});

it('lets someone growing their hair out see cuts that need growth, up to a year of it, with no growth trade-off', () => {
  const facts = { 'hair.texture': 'straight', 'hair.current_length': 'very_short', 'hair.density': 'medium' };
  const allIdeas = (extra: object) => recommend(answered({ ...facts, ...extra }), content, { ...salon, count: 8, added: content.cuts.filter((c) => c.collections.includes('salon')).map((c) => c.id) });
  const growing = allIdeas({ 'life.grow_out_goal': true });
  const later = (r: typeof growing) => r.added.filter((p) => p.excluded.length === 0 && p.feasibility?.length?.status === 'after_growth');
  expect(later(growing).length).toBeGreaterThan(0);
  // Growing it out, the wait is what was asked for; not growing it, the same wait is a trade-off the card names.
  for (const p of later(growing)) expect(p.tradeOffs.some((t) => t.what === 'growth')).toBe(false);
  for (const p of later(allIdeas({}))) expect(p.tradeOffs.some((t) => t.what === 'growth')).toBe(true);
  for (const p of growing.added) {
    const f = p.feasibility?.length;
    // At 1 cm a month a year is 12 cm (52 weeks); a cut further than that is left out even for someone growing it.
    if (f?.status === 'after_growth' && (f.weeks ?? 0) > 52) expect(p.excluded.map((x) => x.ruleId)).toContain('growth-over-a-year');
  }
});

it('never counts growing longer as a big change', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'wavy', 'hair.current_length': 'short', 'hair.density': 'medium', 'pref.change_amount': 'bold' }), content, salon);
  for (const p of picks) expect(p.feasibility?.length?.status).toBe('today');
});

it('takes hair of the wrong texture off the list before anything else, however flattering', () => {
  const hair = { 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'hair.density': 'medium' };
  for (const w of [0.72, 0.83, 0.95]) {
    const { picks } = recommend({ ...answered(hair), ...face(w) }, content, salon);
    for (const p of picks) {
      const t = cutOf(p).traits.tags;
      expect(t.includes('curly_first') || t.includes('perm_dependent')).toBe(false);
      expect(p.excluded).toEqual([]);
    }
  }
});

it('leads with cuts that fit the texture as they are; one that needs adapting pays its texture factor (one score, no tiers)', () => {
  const { picks } = recommend(answered({ 'hair.texture': 'coily', 'hair.current_length': 'short', 'hair.density': 'medium' }), content, salon);
  const adapting = (p: Idea): boolean => p.feasibility?.adapting.some((a) => a.what === 'texture') ?? false;
  expect(picks.length).toBeGreaterThan(0);
  expect(adapting(firstOf(picks))).toBe(false);
  for (const p of picks.filter(adapting)) expect(p.factors?.texture).toBe(content.policy.suitability?.texture_fit.adapt);
});

it('lets the face reorder only what is already right: it never brings in an excluded cut or passes over a stated wish', () => {
  // A round face leans towards height; this person said less height. The wish must win the first pick.
  const asked = answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'hair.density': 'medium', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8, 'wish.height': 'soften' });
  for (const w of [0.72, 0.95]) {
    const withFace = recommend({ ...asked, ...face(w) }, content, salon);
    expect(withFace.picks.every((p) => p.excluded.length === 0)).toBe(true);
    expect(cutOf(firstOf(withFace.picks)).traits.height_top).not.toBe('high');
  }
});

it('is neutral below medium confidence: a low reading leaves the list as no photo does', () => {
  const hair = answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'hair.density': 'medium', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8 });
  const low: Facts = Object.fromEntries([fact('face.width_to_length', 0.72, 'low', 'measured')]);
  const ids = (f: Facts) => recommend(f, content, salon).picks.map((p) => p.id);
  expect(ids({ ...hair, ...low })).toEqual(ids(hair));
});

it("moves a single cut the stylist's way: with the same answers, the cut a long face brings in adds width or a fringe, the one a round face brings in adds height or closer sides", () => {
  const hair = answered({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 4 });
  const frame = content.policy.suitability?.frame;
  if (!frame) throw new Error('no frame policy');
  const none = recommend(hair, content, barber).picks.map((p) => p.id);
  for (const w of [0.72, 0.95]) {
    const f = { ...hair, ...face(w) };
    const withFace = recommend(f, content, barber).picks.map((p) => p.id);
    const target = (w + frame.balance) / 2;
    const near = (id: string): number => Math.abs(apparentRatio(w, hairShape(cutOf({ id } as Idea).traits, f, frame)) - target);
    const [entered, left] = [withFace.filter((id) => !none.includes(id)), none.filter((id) => !withFace.includes(id))];
    // Each cut the face brings in sits nearer its aim than the nearest-aimed cut it pushed out.
    if (entered.length > 0) expect(Math.min(...entered.map(near))).toBeLessThanOrEqual(Math.min(...left.map(near)) + 1e-9);
  }
});

it('still lets the face choose among equally good cuts', () => {
  const hair = answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'hair.density': 'medium', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8 });
  const ids = (w: number) => recommend({ ...hair, ...face(w) }, content, salon).picks.map((p) => p.id).join();
  expect(ids(0.72)).not.toBe(ids(0.95));
});

const COLOUR_FACTS = { 'colour.natural_level': 4, 'colour.current_level_lengths': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' };
/** Darker from a natural level 2: the men's looks run short, so salon colours all over are lent. */
const SHORT_BARBER = { ...COLOUR_FACTS, 'colour.natural_level': 2, 'colour.current_level_lengths': 2, 'pref.colour_direction': 'darker' };

it('offers salon colours a barbering client could wear, in the second group, only when the matches fall short', () => {
  const r = recommend(answered({ ...SHORT_BARBER }), content, colourBarber);
  const colours = r.picks.filter((p) => p.kind === 'colour').length;
  expect(colours).toBeLessThan(6);
  expect(r.worthAsking.length).toBeGreaterThan(0);
  expect(colours + r.worthAsking.length).toBeLessThanOrEqual(6);
  for (const { idea, why } of r.worthAsking) {
    const look = lookOf(idea);
    expect(why).toBe('salon_look');
    expect(look.collections).toContain('salon');
    expect(look.placements).toEqual([]);
    expect(idea.excluded).toEqual([]);
    expect(r.picks.map((p) => p.id)).not.toContain(idea.id);
  }
});

it('lists the matches first in the AI pool and the lent looks after them, at most 10 in all', () => {
  const r = recommend(answered({ ...SHORT_BARBER }), content, colourBarber);
  const second = r.worthAsking.map((c) => c.idea.id);
  expect(second.length).toBeGreaterThan(0);
  expect(r.pool.map((p) => p.id).slice(-second.length)).toEqual(second);
  expect(r.pool.slice(0, -second.length).map((p) => p.id).sort()).toEqual(r.picks.map((p) => p.id).sort());
  expect(r.pool.length).toBeLessThanOrEqual(10);
});

it('never lends a salon look with sections or highlights: those are cut to length and the picture would mislead', () => {
  for (const direction of ['vivid', 'lighter', 'tone']) {
    const r = recommend(answered({ ...COLOUR_FACTS, 'pref.colour_direction': direction }), content, colourBarber);
    for (const { idea } of r.worthAsking) expect(lookOf(idea).placements).toEqual([]);
  }
});

it('does not fill the second group when the matches already reach the count', () => {
  const r = recommend(answered({ ...COLOUR_FACTS, 'colour.natural_level': 6, 'colour.current_level_lengths': 6, 'pref.colour_direction': 'lighter' }), content, { ...colourSalon, count: 2 });
  expect(r.picks).toHaveLength(2);
  expect(r.worthAsking).toEqual([]);
});

it('never lends a look against the stated direction merely to reach the count', () => {
  const blackHair = { ...COLOUR_FACTS, 'colour.natural_level': 1, 'colour.current_level_lengths': 1 };
  const darker = recommend(answered({ ...blackHair, 'pref.colour_direction': 'darker' }), content, colourBarber);
  for (const { idea } of darker.worthAsking) expect(idea.journey?.lift ?? 0).toBeLessThanOrEqual(0);
  // A salon list is never lent to.
  expect(recommend(answered({ ...COLOUR_FACTS, 'colour.grey_percent': 40, 'pref.colour_direction': 'grey', 'colour.grey_goal': 'cover' }), content, colourSalon).worthAsking).toEqual([]);
});

it('offers nothing further after a past reaction: the referral replaces the colour ideas', () => {
  const r = recommend(answered({ ...COLOUR_FACTS, 'pref.colour_direction': 'vivid', 'safety.dye_reaction': 'serious' }), content, colourBarber);
  expect(r.referral).not.toBeNull();
  expect(r.worthAsking).toEqual([]);
});

it('keeps a removed look out of the second group', () => {
  const facts = answered({ ...SHORT_BARBER });
  const first = recommend(facts, content, colourBarber).worthAsking[0]?.idea.id;
  expect(first).toBeDefined();
  expect(recommend(facts, content, { ...colourBarber, removed: [first ?? ''] }).worthAsking.map((c) => c.idea.id)).not.toContain(first);
});

it('says what left the rest out when a colour list falls short, in the exclusions\' own words', () => {
  const r = recommend(answered({ ...SHORT_BARBER }), content, colourBarber);
  expect(r.shortfall[0]?.because).toEqual(expect.arrayContaining(['You asked to go darker, so looks that make any of your hair lighter are left out.']));
});

const GREY = { 'colour.natural_level': 4, 'colour.current_level_lengths': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.grey_percent': 40 };

it('covers grey for someone who asked to cover it fully, and offers nothing that leaves it showing', () => {
  for (const options of [colourSalon, colourBarber]) {
    const { picks } = recommend(answered({ ...GREY, 'pref.colour_direction': 'grey', 'colour.grey_goal': 'cover' }), content, options);
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) {
      const t = lookOf(p).traits;
      // Read from the look's authored grey effect.
      expect(t.grey_effect).toBe('covers');
    }
  }
});

it('blends for someone who asked to blend, without a solid cover', () => {
  const { picks } = recommend(answered({ ...GREY, 'pref.colour_direction': 'grey', 'colour.grey_goal': 'blend' }), content, colourBarber);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) expect(lookOf(p).traits.technique.includes('grey_coverage')).toBe(false);
});

it('does not hide grey that someone wants to show', () => {
  for (const direction of ['refresh', 'natural', 'grey']) {
    const { picks } = recommend(answered({ ...GREY, 'pref.colour_direction': direction, 'colour.grey_goal': 'embrace' }), content, colourSalon);
    for (const p of picks) expect(lookOf(p).traits.technique.includes('grey_coverage')).toBe(false);
  }
});

it('never calls a deposit-only gloss, a demi or a black shade "going lighter"', () => {
  const { picks } = recommend(answered({ 'colour.natural_level': 3, 'colour.current_level_lengths': 3, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'pref.colour_direction': 'lighter' }), content, colourSalon);
  expect(picks.length).toBeGreaterThan(0);
  for (const p of picks) {
    const t = lookOf(p).traits;
    expect(t.family).not.toBe('black');
    expect(['gloss', 'demi_refresh']).not.toContain(t.base_technique);
  }
});

it('keeps the level when asked to change only the tone', () => {
  const { picks } = recommend(answered({ 'colour.natural_level': 5, 'colour.current_level_lengths': 5, 'hair.chemical_history': ['salon_colour'], 'hair.condition': 'healthy', 'pref.colour_direction': 'tone' }), content, colourSalon);
  expect(picks.length).toBeGreaterThan(0);
  expect(picks[0]?.contributions.some((c) => c.ruleId === 'direction-tone' && c.points > 0)).toBe(true);
  expect(lookOf(firstOf(picks)).traits.target_level).toBe(5);
});

it('returning to natural means no lightening', () => {
  const { picks } = recommend(answered({ 'colour.natural_level': 2, 'colour.current_level_lengths': 4, 'hair.chemical_history': ['home_dye'], 'hair.condition': 'dry', 'pref.colour_direction': 'natural' }), content, colourBarber);
  for (const p of picks) expect(lookOf(p).traits.lightening).toBe('none');
});

it('does not correct colour that was never put in', () => {
  const r = recommend(answered({ 'colour.natural_level': 5, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy' }), content, { ...colourSalon, count: 8, added: ['beige-blonde-colour-correction'] });
  expect(r.added[0]?.excluded.length).toBeGreaterThan(0);
});

it('has no length to melt on hair of a few centimetres', () => {
  const { picks } = recommend(answered({ 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'hair.current_length': 'very_short', 'pref.colour_direction': 'vivid' }), content, colourSalon);
  for (const p of picks) {
    const t = lookOf(p).traits.technique;
    expect(t.includes('ombre') || t.includes('sombre') || t.includes('colour_melt')).toBe(false);
  }
});


