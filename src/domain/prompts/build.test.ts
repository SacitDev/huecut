/**
 * Prompt builder tests on the real templates: every word budget with long names, the referral, no face measurements or answers in
 * image prompts, the keep-list and the grid plan.
 */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import { PROMPT_BUDGETS, PROMPT_KINDS } from '../content/values.ts';
import { EN } from '../render-model/copy.ts';
import type { Bands } from '../content/types.ts';
import type { PhotoMeasurements } from '../measure/measure.ts';
import { cardFacts, factSentences } from '../render-model/face-card.ts';
import {
  buildExplainCard, buildFinalCard, buildPromptPack, buildQuickGrid, buildRepair, buildSecondOpinion, buildTryOn, buildTryTogether, cardSplits, planCards, planGrids, withColour,
  type Built, type IdeaLook, type PromptTemplates,
} from './build.ts';
import { countWords, KEEP_COLOUR, keepListText, parseTemplate } from './template.ts';

const node = (globalThis as unknown as {
  process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } };
}).process;
const TEMPLATES: PromptTemplates = Object.fromEntries(PROMPT_KINDS.map((kind) => {
  const r = parseTemplate(node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/content/prompts/${kind}.md`, 'utf8'));
  if (!r.ok) throw new Error(`${kind}: ${r.error.detail}`);
  return [kind, r.value];
}));
const BANDS = JSON.parse(node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/content/bands.json`, 'utf8')) as Bands;

/** Example names and prompt specs, written as the content writes them. */
const CUTS: readonly IdeaLook[] = [
  { id: 'mid-drop-fade-textured-crop', kind: 'cut', name: 'Mid drop fade with textured crop', prompt_spec: 'a mid drop fade with a short textured crop, 3-5 cm on top, sides faded from 9 mm to 0.5 mm behind the ear' },
  { id: 'mid-drop-fade-textured-crop-skin', kind: 'cut', name: 'Skin drop fade with textured crop', prompt_spec: 'a skin drop fade with a short textured crop, 3-5 cm on top, sides faded from 9 mm down to the skin behind the ear' },
  { id: 'long-layers-curtain-fringe', kind: 'cut', name: 'Long layers with a curtain fringe', prompt_spec: 'long layers well past the shoulders with a curtain fringe that parts in the middle and sweeps to both sides at the cheekbones' },
];
const LOOKS: readonly IdeaLook[] = [
  { id: 'copper-balayage-root-shadow', kind: 'colour', name: 'Copper balayage with a root shadow', prompt_spec: 'a copper balayage from mid-lengths to ends over a soft chestnut root shadow' },
  { id: 'copper-balayage', kind: 'colour', name: 'Copper balayage', prompt_spec: 'a hand-painted copper balayage from the mid-lengths to the ends, with the natural colour kept at the root and blended softly' },
];
const at = <T>(list: readonly T[], i: number): T => { const x = list[i % list.length]; if (x === undefined) throw new Error('empty fixture'); return x; };
/** Four cuts with the longest documented names and specs. */
const FOUR_CUTS: IdeaLook[] = [0, 1, 2, 3].map((i) => ({ ...at(CUTS, i), id: `${at(CUTS, i).id}-${String(i)}` }));

const answered = <const K extends string, const V>(key: K, value: V) => ({ key, value, confidence: 'high', source: 'answered' }) as const;
const measured = <const K extends string, const V>(key: K, value: V, confidence: 'medium' | 'high') =>
  ({ key, value, confidence, source: 'measured', basis: '3 photos agree' }) as const;
/** Every face note and every `SHEET_FACTS` answer known: the longest second opinion and explain card. */
const FACTS = {
  'face.proportion': measured('face.proportion', 'longer', 'medium'),
  'face.forehead_share': measured('face.forehead_share', 'longer', 'medium'),
  'face.lower_share': measured('face.lower_share', 'shorter', 'medium'),
  'face.jaw_vs_cheek': measured('face.jaw_vs_cheek', 'narrower', 'high'),
  'hair.texture': answered('hair.texture', 'curly'), 'hair.density': answered('hair.density', 'high'),
  'hair.strand': answered('hair.strand', 'fine'), 'hair.current_length': answered('hair.current_length', 'shoulder'),
  'colour.natural_level': answered('colour.natural_level', 6), 'hair.chemical_history': answered('hair.chemical_history', ['salon_colour', 'highlights']),
  'colour.current_level_lengths': answered('colour.current_level_lengths', 7), 'colour.last_dye': answered('colour.last_dye', 'months_2_6'),
  'colour.last_chemical_service': answered('colour.last_chemical_service', 'months_2_6'), 'colour.bleach_count': answered('colour.bleach_count', 2),
  'colour.grey_percent': answered('colour.grey_percent', 30), 'colour.grey_texture': answered('colour.grey_texture', 'wiry'),
  'safety.health_context': answered('safety.health_context', true), 'safety.dye_reaction': answered('safety.dye_reaction', 'none'),
} as const satisfies Facts;

const NO_REFERRAL = { referral: null };
const REFERRAL = { referral: { id: 'dye-reaction-referral' } };

/** The prompt, or a failure naming the refusal. */
const text = (b: Built): string => { if (!b.ok) throw new Error(`refused: ${b.error}`); return b.value.text; };
const withinBudget = (b: Built): void => {
  if (!b.ok) throw new Error(`refused: ${b.error}`);
  expect(b.value.words).toBe(countWords(b.value.text));
  expect(b.value.words).toBeLessThanOrEqual(PROMPT_BUDGETS[b.value.kind]);
  expect(b.value.text).not.toMatch(/\{\{|\}\}/);
};

it('every image prompt stays within its budget on the longest documented names and specs', () => {
  for (const look of [...CUTS, ...LOOKS]) withinBudget(buildTryOn(TEMPLATES, look, NO_REFERRAL));
  withinBudget(buildTryTogether(TEMPLATES, { cut: at(CUTS, 2), colour: at(LOOKS, 1) }, NO_REFERRAL));
  for (const n of [1, 2, 3, 4]) withinBudget(buildQuickGrid(TEMPLATES, at(planGrids(FOUR_CUTS.slice(0, n)), 0), NO_REFERRAL));
  withinBudget(buildRepair(TEMPLATES));
  expect(text(buildTryOn(TEMPLATES, at(CUTS, 0), NO_REFERRAL))).toContain('Mid drop fade with textured crop, that is a mid drop fade with a short textured crop');
});

it('a grid names its ideas with their specs when they fit, and by name only when four long specs would not', () => {
  const two = buildQuickGrid(TEMPLATES, at(planGrids(LOOKS), 0), NO_REFERRAL);
  expect(text(two)).toContain('split into 2 equal parts in a 1 by 2 grid');
  expect(text(two)).toContain('Copper balayage with a root shadow (a copper balayage from mid-lengths to ends over a soft chestnut root shadow); Copper balayage (');
  expect(two.ok && two.value.omitted).toEqual([]);
  const four = buildQuickGrid(TEMPLATES, at(planGrids(FOUR_CUTS), 0), NO_REFERRAL);
  expect(text(four)).toContain('split into 4 equal parts in a 2 by 2 grid');
  expect(text(four)).toContain('in this order, left to right and top to bottom: Mid drop fade with textured crop; Skin drop fade with textured crop; Long layers with a curtain fringe; Mid drop fade with textured crop.');
  expect(four.ok && four.value.omitted).toEqual(['prompt_spec']);
  expect(four.ok && four.value.ideas).toEqual(FOUR_CUTS.map((c) => c.id));
});

/** 14 candidates, 7 cuts and 7 colour looks, in rank order, with distinct ids. */
const pool = (extraWords: string): IdeaLook[] => Array.from({ length: 14 }, (_, i) => {
  const base = i < 7 ? at(CUTS, i) : at(LOOKS, i);
  return { ...base, id: `${base.id}-${String(i)}`, name: `${base.name}-${String(i)}${extraWords}` };
});

it('the AI pick prompt says a photo is attached, gives the answers, what I need and the notes, names the looks in order and asks for 3 from the list and one picture', () => {
  const ten = pool('').slice(0, 10);
  const needs: Facts = Object.fromEntries(Object.entries({ 'life.grow_out_goal': true, 'life.trim_weeks_ok': 8, 'pref.fringe': 'want', 'wish.jaw': 'soften', 'safety.health_context': true })
    .map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
  const b = buildSecondOpinion(TEMPLATES, { pool: ten, facts: { ...FACTS, ...needs } }, NO_REFERRAL);
  withinBudget(b);
  const t = text(b);
  expect(t.startsWith('Here is my photo, for a new haircut or colour.')).toBe(true);
  expect(t).toContain('About my hair: Texture: curly; Density: high; Strand: fine; Current length: to the shoulders');
  expect(t).toContain('What I need: growing my hair out; a trim every 8 weeks; a fringe; soft layers at my jaw.');
  expect(t).toContain('Face notes: Length and width: clearly longer than it is wide; Forehead: longer than the other two sections; Nose to chin: shorter than the other two sections; Jaw: clearly narrower than the cheekbones.');
  expect(t).toContain(`My top looks: ${ten.map((c) => c.name).join('; ')}.`);
  for (const c of ten) expect(t, 'names only, never an id').not.toContain(c.id);
  expect(t).toContain('Going by my photo and what I need, pick the 3 looks from the list that suit me best, best first, named as written.');
  expect(t).toContain('say why and what to ask my stylist');
  expect(t).toContain('Do not judge or grade my face or looks.');
  expect(t).toContain('make one picture of me with your first choice');
  expect(t).toContain('Keep my face, skin tone and features exactly as in the photo');
  expect(t).not.toMatch(/pregnan|reaction|health/i);
  expect(b.ok && b.value.ideas).toEqual(ten.map((c) => c.id));
  expect(b.ok && b.value.omitted, 'ten looks leave room for every answer, need and note').toEqual([]);
});

it('asks for 3 while there are 3 looks or more, and for what there is when there are fewer', () => {
  const asked = (n: number) => text(buildSecondOpinion(TEMPLATES, { pool: pool('').slice(0, n), facts: FACTS }, NO_REFERRAL));
  expect(asked(10)).toContain('pick the 3 looks from the list');
  expect(asked(3)).toContain('pick the 3 looks from the list');
  expect(asked(2)).toContain('pick the 2 looks from the list');
  expect(asked(1)).toContain('pick the 1 looks from the list');
});

it('two versions of a look with one name are listed once, and count once', () => {
  const twins = [at(CUTS, 0), { ...at(CUTS, 0), id: 'the-other-version' }, at(CUTS, 1)];
  const t = text(buildSecondOpinion(TEMPLATES, { pool: twins, facts: FACTS }, NO_REFERRAL));
  expect(t).toContain(`My top looks: ${at(CUTS, 0).name}; ${at(CUTS, 1).name}.`);
  expect(t).toContain('pick the 2 looks from the list');
});

it('with 14 candidates of up to 10-word names (longer than any documented name) it still fits, leaving out what does not', () => {
  const b = buildSecondOpinion(TEMPLATES, { pool: pool(' in a soft version'), facts: FACTS }, NO_REFERRAL);
  withinBudget(b);
  if (!b.ok) return;
  expect(b.value.ideas).toHaveLength(14);
  expect(b.value.text).toContain('pick the 3 looks from the list');
  // Fourteen long names still leave room for the answers here; the content check proves the longest real list leaves nothing out.
  expect(b.value.words).toBeLessThanOrEqual(330);
});

it('a cut-only second opinion leaves the colour answers out; with nothing answered it says none', () => {
  const cutsOnly = text(buildSecondOpinion(TEMPLATES, { pool: [...CUTS], facts: FACTS }, NO_REFERRAL));
  expect(cutsOnly).not.toMatch(/Natural level|Times bleached|Grey/);
  const bare = text(buildSecondOpinion(TEMPLATES, { pool: [...CUTS], facts: {} }, NO_REFERRAL));
  expect(bare).toContain('About my hair: none.');
  expect(bare).toContain('What I need: none.');
  expect(bare).toContain('Face notes: none.');
});

/** One photo whose four facts are among the wordiest: longer, a long forehead section, a short nose-to-chin section, a narrow jaw. */
const value = (v: number) => ({ value: v, confidence: 'high', approximate: false }) as const;
const PHOTO: PhotoMeasurements = {
  view: 'frontal', lines: [], ticks: [], issues: [], confidence: 'high', weight: 1, approximate: false, camera: null, pose: null, face: null, hairlineVisible: true,
  values: {
    width_to_length: value(0.72), length_to_width: value(1 / 0.72), third_upper: value(0.4), third_middle: value(0.33), third_lower: value(0.27),
    forehead_share: value(0.4 / 0.3), lower_share: value(0.27 / 0.365), jaw_to_cheek: value(0.75),
  },
};

it('the explain card carries the card\'s own facts in words, never a number, within budget; a fact that cannot be read is left out, and without facts there is no prompt', () => {
  const facts = cardFacts(PHOTO, BANDS);
  expect(facts.map((f) => f.fact)).toEqual(['face.proportion', 'face.forehead_share', 'face.lower_share', 'face.jaw_vs_cheek']);
  const b = buildExplainCard(TEMPLATES, facts);
  withinBudget(b);
  const t = text(b);
  for (const f of facts) expect(t).toContain(factSentences(f));
  expect(t).toContain('estimates from one photo: In this photo, your face is clearly longer than it is wide. Volume at the sides makes a face look wider.');
  expect(t.replace('under 200 words', '')).not.toMatch(/\d/);
  expect(buildExplainCard(TEMPLATES, [])).toEqual({ ok: false, error: 'no_face_notes' });
  expect(buildExplainCard(TEMPLATES, cardFacts({ ...PHOTO, issues: ['hand_over_face'] }, BANDS))).toEqual({ ok: false, error: 'no_face_notes' });
});

it('after the referral no colour prompt is built, anywhere in the pack; cut prompts still are', () => {
  const pack = buildPromptPack(TEMPLATES, { ideas: [...CUTS, ...LOOKS], pair: { cut: at(CUTS, 0), colour: at(LOOKS, 0) }, pool: pool(''), facts: FACTS }, REFERRAL);
  expect(pack.pair).toEqual({ ok: false, error: 'referral' });
  expect(pack.grids.map((g) => [g.plan.kind, g.prompt.ok ? 'built' : g.prompt.error])).toEqual([['cut', 'built'], ['colour', 'referral']]);
  expect(pack.looks.map((l) => (l.prompt.ok ? 'built' : l.prompt.error))).toEqual(['built', 'built', 'built', 'referral', 'referral']);
  const all = [pack.pair, pack.repair, pack.secondOpinion, ...pack.grids.map((g) => g.prompt), ...pack.looks.map((l) => l.prompt)];
  const built = all.flatMap((b) => (b?.ok ? [b.value.text] : []));
  expect(built.length).toBeGreaterThan(4);
  for (const t of built) for (const look of LOOKS) expect(t).not.toContain(look.id);
  for (const t of built) expect(t).not.toMatch(/balayage/i);
  expect(buildSecondOpinion(TEMPLATES, { pool: [...LOOKS], facts: FACTS }, REFERRAL)).toEqual({ ok: false, error: 'referral' });
  expect(buildTryOn(TEMPLATES, at(LOOKS, 0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
});

it('image prompts carry no face measurements, face notes or answers: only the look, the layout and the keep-list', () => {
  const plain = (l: IdeaLook): IdeaLook => ({ ...l, prompt_spec: l.prompt_spec.replace(/[\d.]+(-\d+)?\s*(cm|mm)|0\.5 mm/g, 'short') });
  const pack = buildPromptPack(TEMPLATES, { ideas: [...CUTS, ...LOOKS].map(plain), pair: { cut: plain(at(CUTS, 0)), colour: plain(at(LOOKS, 0)) }, pool: pool(''), facts: FACTS }, NO_REFERRAL);
  const images = [pack.pair, pack.repair, ...pack.grids.map((g) => g.prompt), ...pack.looks.map((l) => l.prompt)].map((b) => text(b ?? { ok: false, error: 'missing_template' }));
  const answers = ['curly', 'to the shoulders', 'level', 'bleach', 'grey', 'wiry', 'salon colour', 'highlights', 'estimate', 'forehead', 'jaw', 'longer than'];
  for (const t of images) {
    expect(t.replace(/split into \d equal parts in a \d by \d grid/, '')).not.toMatch(/\d/);
    for (const word of answers) expect(t.toLowerCase()).not.toContain(word);
    if (!t.startsWith('That changed my face')) expect(t).toContain(keepListText());
  }
});

it('a beard look keeps everything but the beard; a cut and a colour look keep the beard too', () => {
  const beard = { id: 'beard-short-boxed', kind: 'beard', name: 'Short boxed beard', prompt_spec: 'a short boxed beard, 6 mm on the cheeks' } as const;
  const t = text(buildTryOn(TEMPLATES, beard, NO_REFERRAL));
  expect(t).toContain(keepListText({ beard: false }));
  expect(t).not.toMatch(/\bbeard and background\b/);
  expect(text(buildTryOn(TEMPLATES, at(CUTS, 0), NO_REFERRAL))).toContain('glasses, beard and background');
});

it('try together is built for exactly one cut and one colour look', () => {
  const t = text(buildTryTogether(TEMPLATES, { cut: at(CUTS, 2), colour: at(LOOKS, 0) }, NO_REFERRAL));
  expect(t).toContain('The haircut: Long layers with a curtain fringe, that is long layers');
  expect(t).toContain('The colour: Copper balayage with a root shadow, that is a copper balayage');
  expect(buildTryTogether(TEMPLATES, { cut: at(LOOKS, 0), colour: at(CUTS, 0) }, NO_REFERRAL)).toEqual({ ok: false, error: 'not_a_pair' });
});

it('plans grids of at most 4, cuts and colour looks apart, spread evenly, in list order', () => {
  const cuts = (n: number): IdeaLook[] => Array.from({ length: n }, (_, i) => ({ ...at(CUTS, i), id: `c${String(i)}` }));
  const sizes = (n: number) => planGrids(cuts(n)).map((g) => `${String(g.rows)}x${String(g.columns)}:${String(g.ideas.length)}`);
  expect([1, 2, 3, 4, 5, 6, 7, 8].map(sizes)).toEqual([
    ['1x1:1'], ['1x2:2'], ['1x3:3'], ['2x2:4'], ['1x3:3', '1x2:2'], ['1x3:3', '1x3:3'], ['2x2:4', '1x3:3'], ['2x2:4', '2x2:4'],
  ]);
  const mixed = planGrids([at(LOOKS, 0), ...cuts(2), at(LOOKS, 1)]);
  expect(mixed.map((g) => [g.kind, g.ideas.map((i) => i.id)])).toEqual([['cut', ['c0', 'c1']], ['colour', ['copper-balayage-root-shadow', 'copper-balayage']]]);
  expect(buildQuickGrid(TEMPLATES, { kind: 'cut', rows: 1, columns: 3, ideas: cuts(4) }, NO_REFERRAL)).toEqual({ ok: false, error: 'bad_grid' });
  expect(buildQuickGrid(TEMPLATES, { kind: 'cut', rows: 1, columns: 2, ideas: [at(CUTS, 0), at(LOOKS, 0)] }, NO_REFERRAL)).toEqual({ ok: false, error: 'bad_grid' });
});

it('a missing template is refused, never filled with a stand-in', () => {
  expect(buildRepair({})).toEqual({ ok: false, error: 'missing_template' });
});

const paired = (i: number): IdeaLook => withColour(at(CUTS, i), at(LOOKS, i));
const cutsWithUpkeep = (n: number): IdeaLook[] => Array.from({ length: n }, (_, i) => ({ ...at(CUTS, i), id: `c${String(i)}`, upkeep: EN.prompts.cutUpkeep([5, 10], [4, 6]) }));

it('Keep adds its sentence to cut prompts and cut grids only', () => {
  expect(text(buildTryOn(TEMPLATES, at(CUTS, 0), NO_REFERRAL))).toContain(KEEP_COLOUR);
  expect(text(buildQuickGrid(TEMPLATES, at(planGrids([...CUTS]), 0), NO_REFERRAL))).toContain(KEEP_COLOUR);
  expect(text(buildTryOn(TEMPLATES, at(LOOKS, 0), NO_REFERRAL))).not.toContain(KEEP_COLOUR);
  expect(text(buildQuickGrid(TEMPLATES, at(planGrids([...LOOKS]), 0), NO_REFERRAL))).not.toContain(KEEP_COLOUR);
  expect(text(buildTryTogether(TEMPLATES, { cut: at(CUTS, 0), colour: at(LOOKS, 0) }, NO_REFERRAL))).not.toContain(KEEP_COLOUR);
});

it('a cut with a colour uses try_on_both and says both names, in a grid too; no keep sentence', () => {
  const look = paired(0);
  expect(look.id).toBe('mid-drop-fade-textured-crop+copper-balayage-root-shadow');
  const t = text(buildTryOn(TEMPLATES, look, NO_REFERRAL));
  expect(t).toContain('The haircut: Mid drop fade with textured crop, that is');
  expect(t).toContain('The colour: Copper balayage with a root shadow, that is');
  const grid = text(buildQuickGrid(TEMPLATES, at(planGrids([paired(0), paired(1)]), 0), NO_REFERRAL));
  expect(grid).toContain('Mid drop fade with textured crop in Copper balayage with a root shadow');
  expect(grid).not.toContain(KEEP_COLOUR);
});

it('after the referral the shared builder refuses every colour-bearing prompt: try-on, pair, grids and cards alike, and plain cuts still build', () => {
  expect(buildTryOn(TEMPLATES, paired(0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
  expect(buildQuickGrid(TEMPLATES, at(planGrids([paired(0)]), 0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
  expect(buildQuickGrid(TEMPLATES, at(planGrids([...LOOKS]), 0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
  expect(buildFinalCard(TEMPLATES, at(planCards([paired(0)]), 0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
  expect(buildFinalCard(TEMPLATES, at(planCards([...CUTS, at(LOOKS, 0)]), 0), REFERRAL)).toEqual({ ok: false, error: 'referral' });
  const pack = buildPromptPack(TEMPLATES, { ideas: [paired(0), ...CUTS.slice(1), ...LOOKS], pair: null, pool: pool(''), facts: FACTS }, REFERRAL);
  expect(pack.cards.map((c) => c.plan.ideas.map((i) => i.id)), 'the card holds only what can be asked for').toEqual([CUTS.slice(1).map((c) => c.id)]);
  expect(pack.cards[0]?.prompt.ok).toBe(true);
  expect(pack.looks.map((l) => (l.prompt.ok ? 'built' : l.prompt.error))).toEqual(['referral', 'built', 'built', 'referral', 'referral']);
  const texts = [...pack.cards.map((c) => c.prompt), ...pack.grids.map((g) => g.prompt), ...pack.looks.map((l) => l.prompt)].flatMap((b) => (b.ok ? [b.value.text] : []));
  for (const t of texts) expect(t).not.toMatch(/balayage|The colour:/i);
  for (const t of texts) expect(t).toContain(KEEP_COLOUR);
});

it('the final card numbers its looks, names the photos and the sheet, asks for the caption, and keeps within 250 words', () => {
  const plan = at(planCards(cutsWithUpkeep(6)), 0);
  expect([plan.rows, plan.columns]).toEqual([3, 2]);
  const b = buildFinalCard(TEMPLATES, plan, NO_REFERRAL);
  withinBudget(b);
  const t = text(b);
  expect(t).toContain('exactly 6 tiles, 2 across and 3 down');
  expect(t).toContain('1. Mid drop fade with textured crop. Styling 5-10 min, trim every 4-6 weeks.');
  expect(t).toContain('the person in every tile must be me');
  expect(t).toContain('one numbered reference sheet');
  expect(t).toContain('never its face or hair colour');
  expect(t).toContain(KEEP_COLOUR);
  expect(t).toContain('AI pictures, illustrations of the looks.');
  expect(t).toContain(keepListText());
});

it('a card of paired cuts asks for the colours named; a card of colour looks copies only the colour; over budget it drops the upkeep, never a name', () => {
  const named = text(buildFinalCard(TEMPLATES, at(planCards([paired(0), paired(1)]), 0), NO_REFERRAL));
  expect(named).toContain('1. Mid drop fade with textured crop in Copper balayage with a root shadow.');
  expect(named).toContain('use the colour named for each look');
  expect(named).not.toContain(KEEP_COLOUR);
  expect(text(buildFinalCard(TEMPLATES, at(planCards([...LOOKS]), 0), NO_REFERRAL))).toContain('keep my haircut exactly as it is');
  const long = (i: number): IdeaLook => ({ ...withColour(at(CUTS, 2), at(LOOKS, 0)), id: `long-${String(i)}`, upkeep: 'Styling 15-30 min, trim every 12-24 weeks and also a very long extra upkeep line' });
  const b = buildFinalCard(TEMPLATES, at(planCards([0, 1, 2, 3, 4, 5].map(long)), 0), NO_REFERRAL);
  withinBudget(b);
  expect(b.ok && b.value.omitted).toEqual(['upkeep']);
  expect(text(b)).toContain('6. Long layers with a curtain fringe in Copper balayage with a root shadow.');
  expect(text(b)).not.toContain('extra upkeep');
});

it('cards hold at most 6, spread evenly; 7 or 8 ideas make a second card; the choices are the splits a list can fill', () => {
  expect(planCards(cutsWithUpkeep(6)).map((c) => c.ideas.length)).toEqual([6]);
  expect(planCards(cutsWithUpkeep(7)).map((c) => c.ideas.length)).toEqual([4, 3]);
  expect(planCards(cutsWithUpkeep(8)).map((c) => c.ideas.length)).toEqual([4, 4]);
  expect(planCards(cutsWithUpkeep(6), 3).map((c) => c.ideas.length)).toEqual([3, 3]);
  expect(planCards(cutsWithUpkeep(5)).map((c) => [c.rows, c.columns])).toEqual([[3, 2]]);
  expect(planCards(cutsWithUpkeep(3)).map((c) => [c.rows, c.columns]), 'tall').toEqual([[3, 1]]);
  expect(cardSplits(6).map((s) => s.sizes)).toEqual([[6], [3, 3], [2, 2, 2]]);
  expect(cardSplits(8).map((s) => s.sizes)).toEqual([[4, 4], [3, 3, 2], [2, 2, 2, 2]]);
  expect(cardSplits(5).map((s) => s.sizes), 'never a card of one').toEqual([[5], [3, 2]]);
  expect(cardSplits(3).map((s) => s.sizes)).toEqual([[3]]);
  expect(cardSplits(1)).toEqual([]);
});

it('the upkeep line says one number when the ends match, and No styling for 0', () => {
  expect(EN.prompts.cutUpkeep([5, 5], [6, 6])).toBe('Styling 5 min, trim every 6 weeks');
  expect(EN.prompts.cutUpkeep([0, 0], [4, 6])).toBe('No styling, trim every 4-6 weeks');
  expect(EN.prompts.cutUpkeep([5, 10], [1, 1])).toBe('Styling 5-10 min, trim every week');
  expect(EN.prompts.colourUpkeep([6, 8])).toBe('Colour every 6-8 weeks');
});

it('a mixed card of paired cuts and colour looks, the usual Both result, names each colour; it is told to keep neither the haircut nor the colour', () => {
  const b = buildFinalCard(TEMPLATES, at(planCards([paired(0), paired(1), at(LOOKS, 0), at(LOOKS, 1)]), 0), NO_REFERRAL);
  expect(text(b)).toContain('use the colour named for each look');
  expect(text(b)).not.toContain('keep my haircut');
  expect(text(b)).not.toContain(KEEP_COLOUR);
  expect(b.ok && b.value.ideas, 'the card reports its looks in order').toEqual([paired(0).id, paired(1).id, at(LOOKS, 0).id, at(LOOKS, 1).id]);
});

it('a card takes the plan of its own number of tiles: tall for 1 to 3, two across for 4 to 6; any other plan is refused, the 6 included', () => {
  expect([1, 2, 3, 4, 5, 6].map((n) => at(planCards(cutsWithUpkeep(n)), 0)).map((c) => [c.rows, c.columns])).toEqual([[1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [3, 2]]);
  const six = at(planCards(cutsWithUpkeep(6)), 0);
  expect(buildFinalCard(TEMPLATES, { ...six, rows: 9, columns: 9 }, NO_REFERRAL)).toEqual({ ok: false, error: 'bad_grid' });
  expect(buildFinalCard(TEMPLATES, { ...six, columns: 3 }, NO_REFERRAL), 'right rows, wrong columns').toEqual({ ok: false, error: 'bad_grid' });
  expect(buildFinalCard(TEMPLATES, { ...six, ideas: cutsWithUpkeep(7) }, NO_REFERRAL), 'seven tiles have no layout').toEqual({ ok: false, error: 'bad_grid' });
  expect(buildFinalCard(TEMPLATES, { rows: 2, columns: 1, ideas: cutsWithUpkeep(3) }, REFERRAL), 'a wrong plan is refused before anything else').toEqual({ ok: false, error: 'bad_grid' });
});

it('looks spread as evenly as the limit allows, and the limit is always a whole number from 1 to the most a picture holds', () => {
  const sizes = (plans: readonly { readonly ideas: readonly IdeaLook[] }[]) => plans.map((p) => p.ideas.length);
  expect(sizes(planCards(cutsWithUpkeep(7), 3))).toEqual([3, 2, 2]);
  expect(sizes(planGrids(cutsWithUpkeep(7), 3))).toEqual([3, 2, 2]);
  expect(sizes(planCards(cutsWithUpkeep(7), 9)), 'never more than 6 on a card').toEqual([4, 3]);
  expect(sizes(planGrids(cutsWithUpkeep(5), 9)), 'never more than 4 on a grid').toEqual([3, 2]);
  expect(sizes(planCards(cutsWithUpkeep(5), 2.9))).toEqual([2, 2, 1]);
  expect(sizes(planCards(cutsWithUpkeep(2), 0)), 'zero would otherwise never end').toEqual([1, 1]);
  expect(sizes(planGrids(cutsWithUpkeep(2), 0))).toEqual([1, 1]);
});

it('the pack passes on the choices of looks per picture and tiles per grid', () => {
  const pack = (over: { readonly perCard?: number; readonly gridMaxTiles?: number }) => buildPromptPack(TEMPLATES, { ideas: cutsWithUpkeep(6), pair: null, pool: [], facts: {}, ...over }, NO_REFERRAL);
  expect(pack({ perCard: 2 }).cards.map((c) => c.plan.ideas.length)).toEqual([2, 2, 2]);
  expect(pack({}).cards.map((c) => c.plan.ideas.length)).toEqual([6]);
  expect(pack({ gridMaxTiles: 2 }).grids.map((g) => g.plan.ideas.length)).toEqual([2, 2, 2]);
});

it('a grid of paired looks gives each colour its spec beside the cut\'s when that fits the budget', () => {
  const brief = (i: number): IdeaLook => withColour({ ...at(CUTS, i), prompt_spec: `crop ${String(i)}` }, { ...at(LOOKS, i), prompt_spec: `shade ${String(i)}` });
  const grid = text(buildQuickGrid(TEMPLATES, at(planGrids([brief(0), brief(1)]), 0), NO_REFERRAL));
  expect(grid).toContain('Mid drop fade with textured crop in Copper balayage with a root shadow (crop 0; shade 0); Skin drop fade with textured crop in Copper balayage (crop 1; shade 1).');
});

it('the second opinion counts only what the person answered as an answer', () => {
  const texture = (source: 'answered' | 'derived' | 'measured') => ({ 'hair.texture': { key: 'hair.texture', value: 'curly', confidence: 'medium', source } }) as const;
  const said = (facts: Facts) => text(buildSecondOpinion(TEMPLATES, { pool: [...CUTS], facts }, NO_REFERRAL));
  expect(said(texture('answered'))).toContain('About my hair: Texture: curly.');
  expect(said(texture('derived'))).toContain('About my hair: none.');
  expect(said(texture('measured'))).toContain('About my hair: none.');
});

it('try together needs a cut as the cut and a colour look as the colour', () => {
  expect(buildTryTogether(TEMPLATES, { cut: at(LOOKS, 0), colour: at(LOOKS, 1) }, NO_REFERRAL)).toEqual({ ok: false, error: 'not_a_pair' });
  expect(buildTryTogether(TEMPLATES, { cut: at(CUTS, 0), colour: at(CUTS, 1) }, NO_REFERRAL)).toEqual({ ok: false, error: 'not_a_pair' });
});

it('budgets hold to the word: try_on_both builds at 300 and refuses 301; final_card builds at 250 with names alone and refuses 251', () => {
  const pad = (n: number): string => Array.from({ length: n }, () => 'layered').join(' ');
  const pair = (n: number) => buildTryTogether(TEMPLATES, { cut: { ...at(CUTS, 0), prompt_spec: pad(n) }, colour: at(LOOKS, 0) }, NO_REFERRAL);
  const fixed = countWords(text(pair(1))) - 1;
  expect(PROMPT_BUDGETS.try_on_both).toBe(300);
  expect(text(pair(300 - fixed)).split(/\s+/)).toHaveLength(300);
  expect(pair(301 - fixed)).toEqual({ ok: false, error: 'over_budget' });
  const card = (n: number) => buildFinalCard(TEMPLATES, at(planCards([{ ...at(CUTS, 0), name: pad(n) }]), 0), NO_REFERRAL);
  const fixedCard = countWords(text(card(1))) - 1;
  expect(PROMPT_BUDGETS.final_card).toBe(250);
  expect(text(card(250 - fixedCard)).split(/\s+/)).toHaveLength(250);
  expect(card(251 - fixedCard)).toEqual({ ok: false, error: 'over_budget' });
});

it("a look that keeps the person's own colour: its words for the design base become theirs and its placements stay", () => {
  const look = { ...at(LOOKS, 0), prompt_spec: 'copper lights over a dark blonde base, the blonde showing between them' };
  const own = (level: number | null): string => text(buildTryOn(TEMPLATES, { ...look, ownBase: { level, words: ['a dark blonde base', 'the blonde'] } }, NO_REFERRAL));
  expect(own(3)).toContain(`copper lights over ${EN.prompts.ownBase(3)}, ${EN.prompts.ownBase(3)} showing between them`);
  expect(own(null)).toContain(`copper lights over ${EN.prompts.ownBase(null)}`);
  for (const level of [3, null]) expect(own(level)).not.toMatch(/dark blonde|the blonde/);
  expect(text(buildTryOn(TEMPLATES, look, NO_REFERRAL))).toContain(look.prompt_spec);
});
