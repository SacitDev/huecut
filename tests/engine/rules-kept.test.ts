/**
 * One shipped-content fixture per rule a review of the engine corrected, each with the case it must leave out and one it must keep,
 * through the shipped assessment (`recommend`, `assessIdea`). The every-slot check over 10,000 profiles is `said.test.ts`.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { RuleFor } from '../../src/domain/content/types.ts';
import { rankBeards } from '../../src/domain/engine/beards.ts';
import { lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { assessIdea, recommend, type Idea, type Recommendation, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
const content = loaded.content;
if (!content) throw new Error(`the content does not build: ${loaded.note}`);
const c = content;

/** Answers, as the questions write them. */
const A = (o: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const run = (f: Facts, o: Partial<RecommendOptions> & Pick<RecommendOptions, 'kinds' | 'collections'>): Recommendation => recommend(f, c, { count: 4, ...o });
const listed = (r: Recommendation): Idea[] => [...r.picks, ...r.pool];
const ids = (xs: readonly Idea[]): string[] => xs.map((x) => x.id);
const cut = (id: string) => {
  const x = c.cuts.find((k) => k.id === id);
  if (!x) throw new Error(`no cut ${id} in the shipped library`);
  return x;
};
const idea = (id: string, f: Facts): Idea => {
  const x = assessIdea(id, f, c);
  if (!x) throw new Error(`no idea ${id}`);
  return x;
};
/** A look's traits for this person, as eligibility reads them. */
const traitsOf = (id: string, f: Facts) => {
  const l = c.looks.find((k) => k.id === id);
  if (!l) throw new Error(`no look ${id}`);
  return lookTraits(l, deriveFacts(f), c.shadeLevels);
};
const OK = { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'safety.henna_tattoo': false };

const colour = (way: string, extra: object = {}) => A({ ...OK, 'pref.colour_direction': way, 'hair.condition': 'healthy', ...extra });
const shown = (r: Recommendation): string[] => ids([...listed(r), ...r.worthAsking.map((w) => w.idea)]);
const out = (id: string, f: Facts): string[] => idea(id, f).excluded.map((x) => x.ruleId);

it('darker: lighter pieces and lightener are left out whatever the levels say, also with the lengths level unknown; a darker deposit stays', () => {
  for (const lengths of [7, undefined]) {
    const f = colour('darker', { 'colour.natural_level': 4, 'hair.chemical_history': ['home_dye'], ...(lengths ? { 'colour.current_level_lengths': lengths } : {}) });
    for (const id of ['caramel-tips-men', 'golden-highlights-men', 'sandy-tips-crop-men', 'platinum-blonde-men']) expect(out(id, f).length, `${id} at ${String(lengths)}`).toBeGreaterThan(0);
    expect(shown(run(f, { kinds: ['colour'], collections: ['barbering'], count: 6 }))).not.toContain('caramel-tips-men');
  }
  expect(out('darkest-brown-gloss', colour('darker', { 'colour.natural_level': 5, 'hair.chemical_history': ['none'] }))).toEqual([]);
});

it('a known contradiction in one region is never hidden by an unknown level in the other: copper all over cannot reach level-1 lengths', () => {
  const f = colour('darker', { 'hair.chemical_history': ['home_dark_dye'], 'colour.current_level_lengths': 1 });
  // Without lightener the copper cannot show on black lengths, whatever the roots are.
  expect(out('copper-all-over', f)).toContain('cannot-reach-shade');
});

it('the same depth: no lighter pieces and no region two levels away (a soft-black root on dark brown); a level demi stays', () => {
  const f = colour('tone', { 'colour.natural_level': 3, 'hair.chemical_history': ['none'] });
  expect(out('black-brown-money-piece', f)).toContain('same-depth-no-lighter-pieces');
  expect(out('black-burgundy-melt', f)).toContain('same-depth-not-darker-roots');
  expect(out('mahogany-demi-refresh', f)).toEqual([]);
});

it('refresh what I have: highlights only for hair that has them now', () => {
  const at = (history: string[]) => colour('refresh', { 'colour.natural_level': 6, 'colour.current_level_lengths': 7, 'hair.chemical_history': history });
  expect(out('honey-blonde-foil-highlights', at(['home_dye']))).toContain('refresh-no-new-pieces');
  expect(out('honey-blonde-foil-highlights', at(['highlights']))).not.toContain('refresh-no-new-pieces');
});

it("back to natural: no lighter pieces and no shade far from the natural level; a look that keeps the base keeps the person's own", () => {
  const f = colour('natural', { 'colour.natural_level': 4, 'hair.chemical_history': ['home_dye'] });
  // The soft black it was pictured on is no target: only its lighter pieces leave it out.
  expect(out('black-brown-money-piece', f)).toEqual(['natural-no-lighter-pieces']);
  expect(out('caramel-tips-men', f)).toContain('natural-no-lighter-pieces');
  expect(out('ash-brown-all-over', f)).toEqual([]);
});

it('lighter: a root two levels deeper is not lighter, even beside lighter ends', () => {
  const f = colour('lighter', { 'colour.natural_level': 5, 'hair.chemical_history': ['none'] });
  expect(out('chocolate-caramel-melt', f)).toContain('lighter-no-darkening-roots');
  expect(out('honey-blonde-foil-highlights', f)).toEqual([]);
});

describe('grey goals are judged on what each look does to grey', () => {
  const grey = (goal: string) => colour('grey', { 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'colour.grey_percent': 40, 'colour.grey_goal': goal });
  const goalRules = (id: string, goal: string): string[] => out(id, grey(goal)).filter((r) => r.startsWith('grey-goal'));
  it('show it: nothing that covers or tints it; blends and silver stay', () => {
    for (const id of ['grey-coverage-chocolate', 'grey-blend-translucent-men']) expect(goalRules(id, 'embrace'), id).toContain('grey-goal-shows');
    for (const id of ['grey-blend-brunette', 'natural-silver-gloss']) expect(goalRules(id, 'embrace'), id).toEqual([]);
  });
  it('a soft blend: no full cover, no silver or white, nothing that leaves it as it is', () => {
    for (const id of ['grey-coverage-chocolate', 'silver-white-all-over', 'natural-silver-gloss']) expect(goalRules(id, 'blend'), id).toContain('grey-goal-blend-only');
    // Silver babylights blend the grey already there: a soft blend keeps them.
    for (const id of ['grey-blend-brunette', 'silver-babylights-blend']) expect(goalRules(id, 'blend'), id).toEqual([]);
  });
  it('move to silver: no warm colour that only leaves grey showing; silver and grey looks stay', () => {
    for (const id of ['auburn-money-piece', 'ginger-balayage', 'copper-ombre']) expect(goalRules(id, 'silver'), id).toContain('grey-goal-silver-no-colour');
    for (const id of ['natural-silver-gloss', 'silver-white-all-over']) expect(goalRules(id, 'silver'), id).toEqual([]);
  });
  it('cover or blend my grey, as a direction: looks that leave grey as it is are left out, read from what each look does to grey', () => {
    expect(out('natural-silver-gloss', colour('grey', { 'colour.natural_level': 4, 'hair.chemical_history': ['none'] }))).toContain('grey-must-treat-grey');
    expect(out('copper-all-over', colour('grey', { 'colour.natural_level': 6, 'hair.chemical_history': ['none'] }))).not.toContain('grey-must-treat-grey');
  });
  it('cover it fully: only looks that cover', () => {
    expect(goalRules('grey-blend-brunette', 'cover')).toContain('grey-goal-cover-only');
    expect(goalRules('grey-coverage-chocolate', 'cover')).toEqual([]);
  });
});

it("bleached near-white lengths, mostly grey, cover fully: covering shades are listed as a colourist's filler route, not left empty", () => {
  const f = colour('grey', { 'colour.natural_level': 4, 'hair.chemical_history': ['bleach'], 'colour.current_level_lengths': 9, 'colour.grey_percent': 87.5, 'colour.grey_goal': 'cover', 'pref.colour_upkeep': 'home_only' });
  const r = run(f, { kinds: ['colour'], collections: ['salon'], count: 6 });
  expect(r.picks.length).toBeGreaterThan(0);
  // A deep covering shade over near-white lengths is a colourist's filler route; a shade close to them stays as labelled.
  for (const i of r.picks) if ((traitsOf(i.id, f).lengths_darken ?? 0) >= 4) expect(i.label, i.id).toBe('needs_professional');
  expect(idea('grey-coverage-chocolate', f).journey?.applied.map((x) => x.id)).toContain('filler-before-dark');
});

it('a deeper grey-coverage shade is never refused as a lift; a much lighter one still is', () => {
  const f = colour('grey', { 'colour.natural_level': 8, 'hair.chemical_history': ['none'], 'colour.grey_percent': 62.5, 'colour.grey_goal': 'cover' });
  expect(out('grey-coverage-soft-black', f)).toEqual(expect.not.arrayContaining(['coverage-lift-limit', 'cannot-reach-shade']));
  // Grey cover has no lightener, so light brown cannot reach above black at all.
  expect(out('grey-coverage-light-brown', colour('grey', { 'colour.natural_level': 1, 'hair.chemical_history': ['none'], 'colour.grey_percent': 62.5, 'colour.grey_goal': 'cover' }))).toContain('cannot-reach-shade');
});

it("a lighter shade over dyed lengths is a colourist's job that takes the old colour out first; colour without lightener cannot do it", () => {
  const f = colour('grey', { 'colour.natural_level': 4, 'hair.chemical_history': ['home_dark_dye'], 'colour.current_level_lengths': 1, 'colour.grey_percent': 40, 'colour.grey_goal': 'cover' });
  const i = idea('caramel-balayage-chocolate', f);
  expect(i.label).toBe('needs_professional');
  expect(i.journey?.applied.find((x) => x.id === 'go-lighter-over-dye')?.because).toMatch(/takes the old colour out/);
  expect(out('grey-coverage-light-brown', f)).toContain('cannot-reach-shade');
});

it('wiry grey: a covering look notes the extra step', () => {
  const f = colour('grey', { 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'colour.grey_percent': 40, 'colour.grey_goal': 'cover', 'colour.grey_texture': 'wiry' });
  expect(idea('grey-coverage-chocolate', f).notes.map((n) => n.ruleId)).toContain('wiry-grey-coverage');
  expect(idea('grey-blend-brunette', f).notes.map((n) => n.ruleId)).not.toContain('wiry-grey-coverage');
});

it('a clipper cut is a buzz cut whatever its outline: it never escapes the scar or grow-out limits', () => {
  expect(cut('buzz-cut-women').traits.length_class).toBe('buzz');
  expect(out('buzz-cut-women', A({ 'scalp.marks_cover': true }))).toContain('scars-scalp-shows');
});

it('scars to cover: the shortest exposed length (nape, fades and undercuts included) under 10 mm, under 15 mm on thin hair, whatever the cut is called', () => {
  const scars = A({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'scalp.marks_cover': true });
  for (const id of ['crew-cut-classic', 'high-and-tight', 'micro-pixie', 'eton-crop', 'side-part-classic', 'slick-back-classic', 'long-shaved-side', 'long-curls-tapered-side', 'curly-mullet', 'nape-undercut-bob']) expect(out(id, scars), id).toContain('scars-scalp-shows');
  // A number 4 all over (13 mm) covers small scars on normal hair, so the buzz cut is judged by its millimetres like any cut.
  const anyHair = A({ 'scalp.marks_cover': true });
  for (const id of ['buzz-4-uniform', 'perm-curls-men', 'flow-medium']) expect(out(id, anyHair), id).toEqual([]);
  const thin = A({ 'hair.texture': 'straight', 'hair.current_length': 'short', 'scalp.marks_cover': true, 'hair.density': 'low' });
  expect(out('buzz-4-uniform', thin)).toContain('scars-thin-hair');
  expect(out('shaggy-pixie', thin)).toEqual([]);
  expect(listed(run(scars, { kinds: ['cut'], collections: ['barbering'], count: 6 })).length).toBeGreaterThan(0);
});

it("a top-length answer meets the cut's real top range", () => {
  const top = (v: string) => A({ 'hair.texture': 'straight', 'pref.top_length': v });
  expect(out('crew-cut-long', top('very_short'))).toContain('top-length-very-short-only');
  expect(out('crew-cut-classic', top('very_short'))).toEqual([]);
  expect(out('caesar-cut', top('medium'))).toContain('top-length-medium-only');
  expect(out('high-and-tight', top('short'))).not.toContain('top-length-short-not-clipper');
  expect(out('buzz-tapered', top('short'))).toContain('top-length-short-not-clipper');
  expect(out('quiff-classic', top('long'))).not.toContain('top-length-long-only');
});

it('growing out from a few centimetres: no clipper cut and no very short crop kept short by cutting; a shape that grows out stays', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'very_short', 'life.grow_out_goal': true });
  for (const id of ['buzz-cut-women', 'micro-pixie', 'eton-crop']) expect(out(id, f), id).toEqual(expect.arrayContaining([expect.stringMatching(/^grow-out/)]));
  expect(out('crew-cut-classic', f)).toEqual([]);
  expect(shown(run(f, { kinds: ['cut'], collections: ['salon'], count: 6 }))).not.toContain('micro-pixie');
});

it('extensions or a weave keep the length they need', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'hair.style_interest': ['extensions'] });
  expect(out('blunt-chin-bob', f)).toContain('extensions-keep-length');
  expect(out('one-length-shoulder', f)).toEqual([]);
});

it('wash and go: a cut the texture needs shaped every day is left out; the same cut stays for someone who styles', () => {
  expect(out('flat-top', A({ 'hair.texture': 'coily', 'life.styling_minutes': 7 }))).toContain('wash-and-go-no-daily-shaping');
  expect(out('flat-top', A({ 'hair.texture': 'coily', 'life.styling_minutes': 20 }))).toEqual([]);
  expect(out('afro-taper-round', A({ 'hair.texture': 'coily', 'life.styling_minutes': 7 }))).toEqual([]);
  expect(out('afro-taper-round', A({ 'hair.texture': 'curly', 'life.styling_minutes': 7 }))).toContain('wash-and-go-no-daily-shaping');
});

it('a wanted fringe and fullness at the sides are met as stated', () => {
  expect(out('long-u-layers', A({ 'pref.fringe': 'want' }))).toContain('fringe-want');
  expect(out('french-bob', A({ 'pref.fringe': 'want' }))).toEqual([]);
  expect(out('high-and-tight', A({ 'wish.face_length': 'soften' }))).toContain('side-fullness-not-close');
  expect(out('flow-medium', A({ 'wish.face_length': 'soften' }))).toEqual([]);
});

it('after a referral no automatic slot holds a colour, and the shortfall says why once', () => {
  const f = colour('lighter', { 'colour.natural_level': 4, 'hair.chemical_history': ['none'], 'safety.henna_tattoo': true });
  const r = run(f, { kinds: ['cut', 'colour'], collections: ['barbering'], count: 6 });
  expect([...listed(r), ...r.worthAsking.map((w) => w.idea)].filter((i) => i.kind === 'colour')).toEqual([]);
  expect(r.shortfall.find((s) => s.kind === 'colour')?.because).toEqual([r.referral?.text]);
});

it('a beard an exclude rule leaves out is never offered with a cut, the way cuts and looks are gated', () => {
  const suitability = c.policy.suitability;
  if (!suitability) throw new Error('no suitability policy');
  const beards = c.beards ?? [];
  const target = cut('textured-crop-low-taper');
  const f = A({ 'hair.texture': 'straight', 'beard.style': 'full' });
  const shown = rankBeards(target, f, beards, c.rules.beard ?? [], ['barbering'], suitability);
  const first = shown[0];
  expect(first).toBeDefined();
  const long = beards.find((b) => b.id === first)?.traits.beard_length;
  // No beard exclusion ships today; a planted one proves the gate.
  const planted = { id: 'planted', group: 'C', when: { 'beard.style': { is: 'full' } }, target: 'beard', effect: 'exclude', on: { beard_length: { is: long } }, because: 'planted', evidence: 'policy', review: { status: 'checked', date: '2026-11-11' } } as unknown as RuleFor<'beard'>;
  const gated = rankBeards(target, f, beards, [...(c.rules.beard ?? []), planted], ['barbering'], suitability);
  expect(gated).not.toContain(first);
  expect(gated.every((id) => beards.find((b) => b.id === id)?.traits.beard_length !== long)).toBe(true);
});

it('a mandatory caution is judged on each region whose level is known: an unknown natural level never softens it', () => {
  const f = A({ ...OK, 'hair.chemical_history': ['keratin'], 'colour.current_level_lengths': 1, 'hair.condition': 'healthy', 'colour.last_chemical_service': 'months_6_plus' });
  const tips = idea('caramel-tips-men', f);
  expect(tips.label).toBe('needs_professional');
  expect(tips.journey?.applied.map((x) => x.id)).toEqual(expect.arrayContaining(['lift-5-plus-any', 'lightener-on-straightened']));
  // Uncertainty is kept apart: with neither level known no lift is read as none, so nothing is plausible and the level is asked.
  const blank = idea('grey-coverage-chocolate', A({ ...OK, 'hair.chemical_history': ['home_dye'], 'hair.condition': 'healthy' }));
  expect(blank.label).not.toBe('plausible');
});

it('a look without lightener never lifts: dark over dyed level-5 lengths, nothing lighter than black on black, no such look for lighter', () => {
  const darker = colour('darker', { 'colour.natural_level': 1, 'hair.chemical_history': ['home_dye'], 'colour.current_level_lengths': 5 });
  expect(out('soft-black-gloss', darker)).toEqual([]);
  // Darkest brown (level 2) cannot show on black roots: it is not counted as "no change".
  expect(out('darkest-brown-gloss', darker)).toContain('cannot-reach-shade');
  expect(run(darker, { kinds: ['colour'], collections: ['salon'], count: 6 }).picks.length).toBeGreaterThan(0);
  const black = colour('tone', { 'colour.natural_level': 1, 'hair.chemical_history': ['none'] });
  for (const id of ['cherry-cola-gloss', 'mahogany-demi-refresh']) expect(out(id, black), id).toContain('cannot-reach-shade');
  expect(out('soft-black-gloss', black)).toEqual([]);
  expect(out('natural-silver-gloss', colour('lighter', { 'colour.natural_level': 1, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 }))).toEqual(expect.arrayContaining(['lighter-must-lift', 'lighter-needs-lightener', 'cannot-reach-shade']));
});

it('back to a natural colour: a dark natural level is never refused as too deep; with grey on show only a big lightening is far', () => {
  const dark = colour('natural', { 'colour.natural_level': 2, 'hair.chemical_history': ['home_dye'], 'colour.current_level_lengths': 7 });
  expect(out('darkest-brown-gloss', dark)).toEqual([]);
  expect(run(dark, { kinds: ['colour'], collections: ['salon'], count: 6 }).picks.length).toBeGreaterThan(0);
  const grey = colour('natural', { 'colour.natural_level': 3, 'hair.chemical_history': ['home_dye'], 'colour.current_level_lengths': 3, 'colour.grey_percent': 40, 'colour.grey_goal': 'embrace' });
  // The blend keeps the person's own base: the milk chocolate it was pictured on is no target.
  expect(out('grey-blend-brunette', grey)).toEqual([]);
  expect(out('silver-white-all-over', grey)).toContain('natural-not-far-grey');
});

it('refresh and tone are judged against the colour worn when the lengths level is known: a retouch to it stays, a root two levels off both goes', () => {
  const f = colour('refresh', { 'colour.natural_level': 6, 'colour.current_level_lengths': 3, 'hair.chemical_history': ['home_dye'], 'colour.grey_percent': 40, 'colour.grey_goal': 'cover' });
  expect(out('grey-coverage-chocolate', f)).toEqual([]);
  expect(run(f, { kinds: ['colour'], collections: ['salon'], count: 6 }).picks.length).toBeGreaterThan(0);
  expect(out('black-burgundy-melt', f)).toContain('same-depth-roots-near-worn');
  // With the lengths level unknown the natural level is the reference, as before.
  expect(out('grey-coverage-chocolate', colour('refresh', { 'colour.natural_level': 6, 'hair.chemical_history': ['home_dye'], 'colour.grey_percent': 40, 'colour.grey_goal': 'cover' }))).toContain('same-depth-not-darker-roots');
  // Natural, undyed hair: the roots are still judged against it.
  expect(out('chocolate-caramel-melt', colour('tone', { 'colour.natural_level': 5, 'hair.chemical_history': ['none'] }))).toContain('same-depth-roots-near-worn');
});

it('growing out keeps every visible length: no mullet top on shoulder-length hair, no undercut back on chin-length hair', () => {
  const grow = (length: string) => A({ 'hair.current_length': length, 'life.grow_out_goal': true, 'hair.texture': 'straight' });
  expect(out('modern-mullet', grow('shoulder'))).toContain('grow-out-keeps-length');
  expect(out('one-length-shoulder', grow('shoulder'))).toEqual([]);
  expect(out('long-butterfly', grow('long'))).toContain('grow-out-keeps-length');
  expect(out('long-one-length-blunt', grow('long'))).toEqual([]);
  for (const id of ['mullet-soft-short', 'top-knot-undercut']) expect(out(id, grow('chin')), id).toContain('grow-out-keeps-length');
  expect(out('blunt-chin-bob', grow('chin'))).toEqual([]);
  expect(out('bro-flow', grow('chin'))).toEqual([]);
  // Extensions need the same length kept.
  expect(out('modern-mullet', A({ 'hair.current_length': 'shoulder', 'hair.style_interest': ['extensions'] }))).toContain('extensions-keep-length');
});

it('a short class is measured stretched: coily hair long when stretched but resting very short has a short cut today', () => {
  const f = A({ 'hair.texture': 'coily', 'hair.current_length': 'chin', 'hair.resting_length': 'very_short' });
  for (const id of ['frohawk', 'afro-taper-round']) {
    expect(idea(id, f).feasibility?.length, id).toEqual({ status: 'today' });
    expect(out(id, f), id).not.toContain('growth-over-a-year');
  }
  // With no resting answer a zone class is no guess either.
  expect(idea('frohawk', A({ 'hair.texture': 'coily', 'hair.current_length': 'chin' })).feasibility?.length).toEqual({ status: 'today' });
});

it('a look without lightener is named by the change it really makes, and by nothing while a level is unknown', () => {
  const reasons = (id: string, f: Facts): string[] => idea(id, f).reasons.map((r) => r.text);
  expect(reasons('natural-silver-gloss', colour('tone', { 'colour.natural_level': 8, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 })).join()).toMatch(/at about the same depth.*no lightener/);
  expect(reasons('mahogany-demi-refresh', colour('darker', { 'colour.natural_level': 5, 'hair.chemical_history': ['none'] })).join()).toMatch(/go darker.*a little darker/);
  // At the hair's own level it ends no darker, so it is not offered for "darker" and says nothing of it.
  expect(out('mahogany-demi-refresh', colour('darker', { 'colour.natural_level': 4, 'hair.chemical_history': ['none'] }))).toContain('darker-must-darken');
  expect(reasons('cherry-cola-gloss', colour('tone', { 'colour.natural_level': 4, 'hair.chemical_history': ['home_dye'] }))).toEqual([]);
  expect(reasons('soft-black-gloss', colour('darker', { 'hair.chemical_history': ['none'] }))).toEqual([]);
});

it('a growth of twenty years or more is still more than a year', () => {
  const f = A({ 'hair.texture': 'straight', 'hair.current_length': 'chin', 'hair.resting_length': 'very_short' });
  expect(idea('long-v-layers', f).feasibility?.length).toMatchObject({ status: 'after_growth' });
  expect(out('long-v-layers', f)).toContain('growth-over-a-year');
});
