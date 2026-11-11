/**
 * Every automatic slot of every list respects what the person said, asserted over 10,000 seeded profiles on the
 * shipped content and checked by `said.ts` on the library's own records; the checker first proves it catches planted breaches.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { Bands, QuestionsFile } from '../../src/domain/content/types.ts';
import { assessIdea, recommend, type Idea, type Recommendation } from '../../src/domain/engine/recommend.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';
import { saidChecker } from './said.ts';
import { saidSweep } from './said-sweep.ts';

const DIR = join(fileURLToPath(new URL('../../', import.meta.url)), 'content');
const loaded = engineFrom(DIR);
const c = loaded.content;
if (!c) throw new Error(`the content does not build: ${loaded.note}`);
const said = saidChecker(DIR);
const A = (o: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(o).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const idea = (id: string, f: Facts): Idea => {
  const x = assessIdea(id, f, c);
  if (!x) throw new Error(`no idea ${id}`);
  return x;
};
/** A list as the engine would return it, holding exactly these ideas in its picks. */
const listOf = (picks: readonly Idea[], referral: Recommendation['referral'] = null): Recommendation => ({
  picks, added: [], pair: null, pool: [], shortfall: [], relaxed: [], notes: [], worthAsking: [], unmet: [], referral, colourPrompts: referral === null,
});
const OK = { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'safety.henna_tattoo': false };

it('the checker catches each planted breach and passes the same ideas where nothing forbids them', () => {
  const planted: readonly (readonly [string, Facts, string])[] = [
    ['crew-cut-long', A({ 'pref.top_length': 'very_short' }), 'top_length'],
    ['buzz-cut-women', A({ 'scalp.marks_cover': true }), 'scars'],
    ['micro-pixie', A({ 'life.grow_out_goal': true, 'hair.current_length': 'very_short' }), 'grow_out'],
    ['flat-top', A({ 'hair.texture': 'coily', 'life.styling_minutes': 7 }), 'wash_and_go'],
    ['high-and-tight', A({ 'wish.face_length': 'soften' }), 'wish'],
    ['caramel-tips-men', A({ ...OK, 'pref.colour_direction': 'darker', 'colour.natural_level': 4, 'hair.chemical_history': ['home_dye'], 'colour.current_level_lengths': 7 }), 'direction'],
    ['black-brown-money-piece', A({ ...OK, 'pref.colour_direction': 'tone', 'colour.natural_level': 1, 'hair.chemical_history': ['none'] }), 'direction'],
    ['grey-coverage-chocolate', A({ ...OK, 'colour.grey_percent': 40, 'colour.grey_goal': 'embrace' }), 'grey_goal'],
    ['silver-white-all-over', A({ ...OK, 'colour.grey_percent': 40, 'colour.grey_goal': 'blend' }), 'grey_goal'],
  ];
  for (const [id, f, kind] of planted) {
    expect(said.breaches(listOf([idea(id, f)]), f).map((b) => b.kind), id).toContain(kind);
    expect(said.breaches(listOf([idea(id, A({ ...OK }))]), A({ ...OK })), `${id} with nothing said`).toEqual([]);
  }
  const reaction = A({ ...OK, 'safety.dye_reaction': 'mild' });
  expect(said.breaches(listOf([idea('chestnut-demi-refresh', reaction)], { id: 'black-henna-reaction', kind: 'referral', when: {}, text: 'x' } as never), reaction).map((b) => b.kind)).toContain('referral');
  const tie = A({ 'life.tie_back_needed': true });
  expect(said.breaches(listOf([idea('micro-pixie', tie)]), tie).map((b) => b.kind)).toContain('eligibility');
});

it('10,000 profiles, every automatic slot: nothing against a stated direction, grey goal, referral or cut limit', { timeout: 900_000 }, () => {
  const file = JSON.parse(readFileSync(join(DIR, 'questions.json'), 'utf8')) as QuestionsFile;
  const bands = JSON.parse(readFileSync(join(DIR, 'bands.json'), 'utf8')) as Bands;
  const out = saidSweep(c, file, bands, said, 20261111, 10_000);
  console.log(`said sweep: ${String(out.profiles)} profiles, ${String(out.positives)} lists with ideas, breaches ${JSON.stringify(out.breaches)}`);
  for (const [set, row] of Object.entries(out.empty)) {
    const top = Object.entries(row.causes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} ${String(n)}`).join(', ');
    console.log(`  ${set}: ${String(row.empty)} empty and ${String(row.short)} short of ${String(row.lists)}; empty kinds by cause: ${top}`);
  }
  expect(out.examples).toEqual([]);
  expect(out.breaches).toEqual({});
  // Positive control: a sweep that rejected everything would pass the line above, so most lists must show ideas.
  expect(out.positives).toBeGreaterThan(out.profiles * 0.6);
});

it('the added checks catch their planted breaches, from the answers and not from the engine', () => {
  const reaction = A({ ...OK, 'safety.dye_reaction': 'mild' });
  const kinds = (r: Recommendation, f: Facts): string[] => said.breaches(r, f).map((b) => b.kind);
  // A referral the answers call for but the result lacks, and colour prompts left on after it.
  expect(kinds(listOf([]), reaction)).toContain('referral');
  expect(kinds({ ...listOf([], { id: 'black-henna-reaction', kind: 'referral', when: {}, text: 'x' } as never), colourPrompts: true }, reaction)).toContain('prompt');
  // A look a known region makes professional, shown with a softer label; the engine's own label passes.
  const lift = A({ ...OK, 'pref.colour_direction': 'lighter', 'hair.chemical_history': ['keratin'], 'colour.current_level_lengths': 1, 'hair.condition': 'healthy' });
  const tips = idea('caramel-tips-men', lift);
  expect(tips.label).toBe('needs_professional');
  expect(kinds(listOf([tips]), lift)).not.toContain('label');
  expect(kinds(listOf([{ ...tips, label: 'uncertain' }]), lift)).toContain('label');
  // An addition against what was said must be marked as blocked; a paired colour after a referral must carry it.
  const top = A({ 'pref.top_length': 'very_short' });
  expect(kinds({ ...listOf([]), added: [{ ...idea('crew-cut-long', top), excluded: [] }] }, top)).toContain('manual');
  expect(kinds({ ...listOf([]), added: [idea('crew-cut-long', top)] }, top)).not.toContain('manual');
  const pair = { cut: idea('crew-cut-classic', reaction), colour: { ...idea('chestnut-demi-refresh', reaction), referral: null } };
  expect(kinds({ ...listOf([], { id: 'black-henna-reaction', kind: 'referral', when: {}, text: 'x' } as never), colourPrompts: false, pair }, reaction)).toContain('referral');
  // A beard that is not the library's.
  const cut = idea('crew-cut-classic', A({ ...OK }));
  expect(kinds(listOf([{ ...cut, beards: ['no-such-beard'] }]), A({ ...OK }))).toContain('beard');
  // Scars judged by the shortest exposed length, the nape included; the silver goal and the grey direction read the authored effect.
  expect(said.ofIdea('slick-back-classic', A({ 'scalp.marks_cover': true })).map((b) => b.kind)).toContain('scars');
  expect(said.ofIdea('buzz-4-uniform', A({ 'scalp.marks_cover': true }))).toEqual([]);
  expect(said.ofIdea('auburn-money-piece', A({ ...OK, 'colour.grey_percent': 40, 'colour.grey_goal': 'silver' })).map((b) => b.kind)).toContain('grey_goal');
  expect(said.ofIdea('natural-silver-gloss', A({ ...OK, 'pref.colour_direction': 'grey' })).map((b) => b.kind)).toContain('direction');
});

it('a look without lightener never lightens: each demonstrated case is caught from the technique records and levels, and left out', () => {
  const kinds = (id: string, f: Facts): string[] => said.ofIdea(id, f).map((b) => b.kind);
  const cases: readonly (readonly [string, Facts, string])[] = [
    // A silver gloss on black hair with no grey, for "same depth", "refresh" and "natural".
    ...['tone', 'refresh', 'natural'].map((way) => ['natural-silver-gloss', A({ ...OK, 'pref.colour_direction': way, 'colour.natural_level': 1, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 }), 'capability'] as const),
    // "Lighter" with black roots and the dyed lengths' level unknown, and with the natural level "Not sure".
    ...['soft-black-gloss', 'natural-silver-gloss'].map((id) => [id, A({ ...OK, 'pref.colour_direction': 'lighter', 'colour.natural_level': 1, 'hair.chemical_history': ['home_dye'] }), 'direction'] as const),
    ['chestnut-demi-refresh', A({ ...OK, 'pref.colour_direction': 'lighter', 'hair.chemical_history': ['none'] }), 'direction'],
    // A pale gloss on hair at level 6 or darker (the stylist's 235 lists).
    ['pearl-blonde-gloss', A({ ...OK, 'pref.colour_direction': 'tone', 'colour.natural_level': 6, 'colour.current_level_lengths': 5, 'hair.chemical_history': ['home_dye'] }), 'capability'],
  ];
  for (const [id, f, kind] of cases) {
    expect(kinds(id, f), id).toContain(kind);
    expect(idea(id, f).excluded.length, `${id} left out by the engine`).toBeGreaterThan(0);
  }
  // Where the hair takes the shade, or grey shows under a silver gloss, nothing is wrong.
  expect(said.ofIdea('pearl-blonde-gloss', A({ ...OK, 'colour.natural_level': 10, 'hair.chemical_history': ['none'] }))).toEqual([]);
  const grey = A({ ...OK, 'pref.colour_direction': 'natural', 'colour.natural_level': 3, 'hair.chemical_history': ['none'], 'colour.grey_percent': 40, 'colour.grey_goal': 'embrace' });
  expect(said.ofIdea('natural-silver-gloss', grey)).toEqual([]);
  expect(idea('natural-silver-gloss', grey).excluded).toEqual([]);
  // "Plausible" while the level is unknown is a planted label breach; the engine's own label is not plausible.
  const unknown = A({ ...OK, 'hair.chemical_history': ['home_dye'], 'colour.natural_level': 4 });
  const gloss = idea('chestnut-demi-refresh', unknown);
  expect(gloss.label).not.toBe('plausible');
  expect(said.breaches(listOf([{ ...gloss, label: 'plausible' }]), unknown).map((b) => b.kind)).toContain('label');
});

it('the checker catches a root off the colour worn and a visible zone cut on a grower, from the records', () => {
  const kinds = (id: string, f: Facts): string[] => said.ofIdea(id, f).map((b) => b.kind);
  // Refresh with dyed lengths: a retouch to the colour worn is fine, a black root two levels below it and four below the regrowth is not.
  const refresh = A({ ...OK, 'pref.colour_direction': 'refresh', 'colour.natural_level': 6, 'colour.current_level_lengths': 3, 'hair.chemical_history': ['home_dye'] });
  expect(said.ofIdea('grey-coverage-chocolate', refresh)).toEqual([]);
  expect(kinds('black-burgundy-melt', refresh)).toContain('direction');
  // Growing out: a mullet's top on shoulder-length hair, an undercut back on chin-length hair; a one-length cut passes.
  const grow = (length: string): Facts => A({ 'hair.current_length': length, 'life.grow_out_goal': true });
  expect(kinds('modern-mullet', grow('shoulder'))).toContain('grow_out');
  expect(kinds('top-knot-undercut', grow('chin'))).toContain('grow_out');
  expect(said.ofIdea('one-length-shoulder', grow('shoulder'))).toEqual([]);
  expect(said.ofIdea('blunt-chin-bob', grow('chin'))).toEqual([]);
});

it('the checker catches the cases below from the records, and the engine leaves them out', () => {
  const kinds = (id: string, f: Facts): string[] => said.ofIdea(id, f).map((b) => b.kind);
  const caught = (id: string, f: Facts, kind: string): void => {
    expect(kinds(id, f), id).toContain(kind);
    expect(idea(id, f).excluded.length, `${id} left out by the engine`).toBeGreaterThan(0);
  };
  // Each applied shade is judged on its own: chocolate lowlights cannot show on black hair. The light brown the look was pictured on
  // is no target (only its design base): on natural 3 to 5 the lowlights land and the prompt keeps the person's own base.
  caught('brown-lowlights-men', A({ ...OK, 'pref.colour_direction': 'tone', 'colour.natural_level': 2, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 }), 'capability');
  for (const level of [3, 4, 5]) expect(kinds('brown-lowlights-men', A({ ...OK, 'colour.natural_level': level, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 })), String(level)).not.toContain('capability');
  // Permanent cover lifts the natural regrowth to a colour worn two levels above it, so a root retouch has ideas.
  const retouch = A({ ...OK, 'pref.colour_direction': 'refresh', 'colour.natural_level': 2, 'colour.current_level_lengths': 4, 'hair.chemical_history': ['home_dye'], 'colour.grey_percent': 40, 'colour.grey_goal': 'cover' });
  expect(said.ofIdea('grey-coverage-brown-men', retouch)).toEqual([]);
  expect(recommend(retouch, c, { kinds: ['colour'], collections: ['barbering'], count: 6 }).picks.length).toBeGreaterThan(0);
  // A pale toner at or above the hair's level is not darker.
  for (const level of [9, 10]) caught('pearl-blonde-gloss', A({ ...OK, 'pref.colour_direction': 'darker', 'colour.natural_level': level, 'hair.chemical_history': ['none'] }), 'direction');
  // A clipped part on a grower's hair to the chin or beyond, and grey services with no grey and no direction.
  caught('asymmetric-coily-taper', A({ 'hair.current_length': 'chin', 'life.grow_out_goal': true, 'hair.texture': 'coily' }), 'grow_out');
  caught('grey-coverage-light-brown', A({ ...OK, 'colour.natural_level': 5, 'hair.chemical_history': ['none'], 'colour.grey_percent': 0 }), 'grey_goal');
});

it('an unknown history hides only what it changes: black over near-white lengths stays out of "refresh" and needs a colourist for "darker"', () => {
  const at = (way: string): Facts => A({ ...OK, 'pref.colour_direction': way, 'colour.natural_level': 1, 'colour.current_level_lengths': 9 });
  expect(said.ofIdea('jet-black-all-over', at('refresh')).map((b) => b.kind)).toContain('direction');
  expect(idea('jet-black-all-over', at('refresh')).excluded.map((x) => x.ruleId)).toContain('same-depth-not-darker');
  const darker = idea('jet-black-all-over', at('darker'));
  expect(darker.label).toBe('needs_professional');
  expect(darker.journey?.applied.map((x) => x.id)).toContain('filler-before-dark');
  // A planted softer label is caught from the answers alone.
  expect(said.breaches(listOf([{ ...darker, label: 'uncertain' }]), at('darker')).map((b) => b.kind)).toContain('label');
  // The grey blend the stylist accepted on natural 3 keeps the person's own base and is offered again.
  const grey = A({ ...OK, 'pref.colour_direction': 'natural', 'colour.natural_level': 3, 'hair.chemical_history': ['home_dye'], 'colour.current_level_lengths': 3, 'colour.grey_percent': 40, 'colour.grey_goal': 'embrace' });
  expect(said.ofIdea('grey-blend-brunette', grey)).toEqual([]);
  expect(idea('grey-blend-brunette', grey).excluded).toEqual([]);
});
