/**
 * "Colour in your results" through the real wiring (`app/consult-deps.ts`) on the real shipped content, built here into a
 * temporary folder: which colours a cut can be paired with, what the prompts name, and the safety view on a stylist sheet.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';
import { buildContent } from '../../scripts/content/build.ts';
import { libraryOf, selectorDeps } from '../../src/app/consult-deps.ts';
import type { ConsultData, Detail, LibraryIndex, LookDetail, ShadeDetail } from '../../src/domain/content/output.ts';
import type { RuleFor } from '../../src/domain/content/types.ts';
import { assessIdea, recommend } from '../../src/domain/engine/recommend.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { asItemId, lookId, type ItemId, type Look } from '../../src/domain/ids.ts';
import { buildTryOn } from '../../src/domain/prompts/build.ts';
import { EN } from '../../src/domain/render-model/copy.ts';
import { journeyLabelOf } from '../../src/features/consult/try-on/sheets.ts';
import type { ConsultRecommendation, DetailsOf } from '../../src/features/consult/useConsult.ts';
import { input } from '../machine/consult.fakes.ts';
import { freshContext } from '../../src/machine/consult.machine.ts';
import { createConsultSelectors, type EngineRequest } from '../../src/machine/consult.selectors.ts';
import type { ColourChoice, ConsultContent, ConsultContext, Prefs } from '../../src/machine/consult.types.ts';

const out = mkdtempSync(join(tmpdir(), 'huecut-consult-deps-'));
afterAll(() => { rmSync(out, { recursive: true, force: true }); });

const built = buildContent(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'), out, { complete: false });
if (!built.ok) throw new Error(`the content does not build: ${JSON.stringify(built.check.problems.find((p) => p.level === 'error'))}`);
const read = (name: string): unknown => JSON.parse(readFileSync(join(out, name), 'utf8'));
const CONTENT: ConsultContent = { library: read('library-index.json') as LibraryIndex, consult: read('consult.json') as ConsultData };
const details: DetailsOf = (id) => (existsSync(join(out, 'details', `${id}.json`)) ? (read(join('details', `${id}.json`)) as Detail) : undefined);

const SHADE = asItemId('auburn-all-over');
const BLACK = asItemId('jet-black-all-over');
const CUT = asItemId(CONTENT.library.entries.find((e) => e.kind === 'cut')?.id ?? 'no-cut');
const nameOf = (id: string): string => CONTENT.library.entries.find((e) => e.id === id)?.name ?? id;
const isColour = (id: string): boolean => CONTENT.library.entries.some((e) => e.id === id && e.kind === 'colour');

const answered = <const K extends keyof Facts, const V>(key: K, value: V) => ({ key, value, confidence: 'high', source: 'answered' }) as const;
/** Natural, healthy hair at a known level: every look gets a journey label. */
const FACTS = {
  'hair.chemical_history': answered('hair.chemical_history', ['none']),
  'hair.condition': answered('hair.condition', 'healthy'),
  'colour.natural_level': answered('colour.natural_level', 5),
  'colour.current_level_lengths': answered('colour.current_level_lengths', 5),
} as const satisfies Facts;
const REFERRED = { ...FACTS, 'safety.dye_reaction': answered('safety.dye_reaction', 'mild') } as const satisfies Facts;

/** The test adds a deterministic exclusion to the shipped colour rules: black looks are out for everyone. */
const EXCLUDE_BLACK: RuleFor<'colour'> = {
  id: 'test-exclude-black', group: 'A', target: 'colour', effect: 'exclude', when: {}, on: { family: { is: 'black' } }, because: 'Test only',
  evidence: 'design_logic', review: { status: 'checked', date: '2026-11-09' },
};
const NO_BLACK: ConsultContent = { ...CONTENT, consult: { ...CONTENT.consult, rules: { ...CONTENT.consult.rules, colour: [...CONTENT.consult.rules.colour, EXCLUDE_BLACK] } } };

const request = (over: Partial<EngineRequest>): EngineRequest => ({ goal: 'both', collections: ['salon'], count: 4, removed: [], added: [], colours: { mode: 'pick', shade: null }, ...over });
const recommendation = (facts: Facts, over: Partial<EngineRequest>, content: ConsultContent = CONTENT): ConsultRecommendation => selectorDeps.recommend(facts, content, request(over));
const colourIds = (facts: Facts, over: Partial<EngineRequest>, content?: ConsultContent): string[] => recommendation(facts, over, content).colours.map((c) => c.id);
const one = (shade: string): ColourChoice => ({ mode: 'one', shade: asItemId(shade) });

// ── The colours a cut can be paired with ──

it('Pick under Both is the engine\'s own colour looks, and Both asks the engine for both kinds', () => {
  const r = recommendation(FACTS, {});
  expect(new Set(r.picks.map((p) => p.kind))).toEqual(new Set(['cut', 'colour']));
  expect(r.colours).toEqual(r.picks.filter((p) => p.kind === 'colour'));
  expect(r.colours.length).toBeGreaterThan(0);
});

it('Pick under Cut has no colour looks among its picks, so its colours are a separate engine run on colours alone, honouring what was removed', () => {
  const r = recommendation(FACTS, { goal: 'cut' });
  expect(r.picks.every((p) => p.kind === 'cut')).toBe(true);
  const own = recommend(FACTS, libraryOf(CONTENT).engine, { kinds: ['colour'], collections: ['salon'], count: 4, removed: [] }).picks.map((p) => p.id);
  expect(own.length).toBeGreaterThan(0);
  expect(r.colours.map((c) => c.id)).toEqual(own);
  const [first = ''] = own;
  expect(colourIds(FACTS, { goal: 'cut', removed: [asItemId(first)] })).not.toContain(first);
});

it('the person\'s own added colour counts, after the engine\'s picks; under Cut it is the only colour', () => {
  expect(colourIds(FACTS, { goal: 'cut', added: [SHADE] })).toEqual([SHADE]);
  const picks = colourIds(FACTS, {});
  const extra = [SHADE, BLACK].find((id) => !picks.includes(id)) ?? BLACK;
  expect(colourIds(FACTS, { added: [extra] })).toEqual([...picks, extra]);
});

it('an added colour a rule rules out is not chosen for them; another added colour still is', () => {
  expect(colourIds(FACTS, { goal: 'cut', added: [BLACK, SHADE] }, NO_BLACK)).toEqual([SHADE]);
});

it('Keep gives none, under Both and under Cut; the Colour goal has no haircuts to colour', () => {
  for (const goal of ['both', 'cut'] as const) expect(colourIds(FACTS, { goal, colours: { mode: 'keep', shade: null } })).toEqual([]);
  expect(colourIds(FACTS, { goal: 'colour', colours: null })).toEqual([]);
});

it('One colour is exactly that look; an unknown id, a cut\'s id, no shade or a look a rule rules out gives none, never a stand-in', () => {
  expect(colourIds(FACTS, { goal: 'cut', colours: one(SHADE) })).toEqual([SHADE]);
  expect(colourIds(FACTS, { goal: 'cut', colours: one('no-such-look') })).toEqual([]);
  expect(colourIds(FACTS, { goal: 'cut', colours: one(CUT) })).toEqual([]);
  expect(colourIds(FACTS, { goal: 'cut', colours: { mode: 'one', shade: null } })).toEqual([]);
  expect(colourIds(FACTS, { goal: 'cut', colours: one(BLACK) }, NO_BLACK)).toEqual([]);
  expect(colourIds(FACTS, { goal: 'cut', colours: one(SHADE) }, NO_BLACK), 'only the ruled-out look goes').toEqual([SHADE]);
});

it('after the referral there are none, under every choice', () => {
  for (const colours of [{ mode: 'pick', shade: null }, one(SHADE)] as const) {
    for (const goal of ['both', 'cut'] as const) {
      const r = recommendation(REFERRED, { goal, colours });
      expect(r.engine.referral).not.toBeNull();
      expect(r.colours).toEqual([]);
    }
  }
  expect(colourIds(REFERRED, { goal: 'cut', added: [SHADE] }), 'nor the person\'s own').toEqual([]);
});

// ── What the prompts and the sheet say ──

const pack = (facts: Facts, looks: readonly Look[]) =>
  selectorDeps.buildPrompts({ facts, recommendation: recommendation(facts, {}), looks, perPicture: undefined, pair: null, content: CONTENT, hasPhoto: false })(details);

it('the AI pick prompt names the engine\'s top 10 on the shipped content, in its order, cuts and colours alike; after the referral 10 cuts', () => {
  const said = pack(FACTS, []).secondOpinion;
  const top = recommendation(FACTS, {}).engine.pool;
  expect(top.map((i) => i.kind).join()).toBe('cut,cut,cut,cut,cut,colour,colour,colour,colour,colour');
  expect(said.ok && said.value.ideas).toEqual(top.map((i) => i.id));
  expect(said.ok && said.value.text).toContain(`My top looks: ${top.map((i) => nameOf(i.id)).join('; ')}.`);
  const referred = pack(REFERRED, []).secondOpinion;
  expect(referred.ok && referred.value.ideas).toHaveLength(10);
  expect(referred.ok && referred.value.ideas.filter(isColour)).toEqual([]);
});

it('a paired look names the cut as the haircut and the colour as the colour', () => {
  const [first] = pack(FACTS, [[CUT, SHADE]]).looks;
  expect(first?.id).toBe(lookId([CUT, SHADE]));
  const text = first?.prompt.ok ? first.prompt.value.text : '';
  expect(text).toContain(`The haircut: ${nameOf(CUT)}, that is`);
  expect(text).toContain(`The colour: ${nameOf(SHADE)}, that is`);
});

it('after the referral a paired look is refused, in the builder, and the same cut alone still builds', () => {
  const { looks } = pack(REFERRED, [[CUT, SHADE], CUT]);
  expect(looks[0]?.prompt).toEqual({ ok: false, error: 'referral' });
  expect(looks[1]?.prompt.ok).toBe(true);
});

const sheet = (facts: Facts, over: Partial<EngineRequest>) =>
  selectorDeps.stylistSheet({ id: CUT, colour: SHADE, facts, recommendation: recommendation(facts, over), content: CONTENT, picture: null })(details);

it('under One colour the engine ran on cuts only, and the sheet still carries that colour\'s label for this person', () => {
  const r = recommendation(FACTS, { goal: 'cut', colours: one(SHADE) });
  expect(r.engine.picks.some((p) => p.id === SHADE), 'the colour is not among the engine\'s picks').toBe(false);
  const label = assessIdea(SHADE, FACTS, libraryOf(CONTENT).engine)?.label;
  if (!label) throw new Error('the fixture facts should give this look a label');
  expect(journeyLabelOf(sheet(FACTS, { goal: 'cut', colours: one(SHADE) }))).toBe(EN.sheet.journeyLabels[label]);
});

it('after the referral the sheet says it needs a professional, however the pairing was reached', () => {
  expect(journeyLabelOf(sheet(REFERRED, { goal: 'cut', colours: one(SHADE) }))).toBe(EN.sheet.journeyLabels.needs_professional);
});

// ── The selectors on the real wiring ──

const context = (prefs: Partial<Prefs>, over: Partial<ConsultContext> = {}): ConsultContext => ({
  ...freshContext(input({ content: CONTENT })),
  prefs: { goal: 'both', collections: ['salon'], count: 4, ...prefs },
  ...over,
});
const paired = (looks: readonly Look[]): readonly (readonly [ItemId, ItemId])[] => looks.filter((l) => typeof l !== 'string');

it('Keep: only cuts, the full count, none paired and no notice', () => {
  const s = createConsultSelectors(selectorDeps);
  const c = context({ colour: { mode: 'keep', shade: null } });
  expect(s.ideas(c).ids).toHaveLength(4);
  expect(s.ideas(c).colours).toEqual([]);
  expect(s.looks(c)).toEqual(s.ideas(c).ids);
  expect(s.noColourFits(c)).toBe(false);
});

it('One colour: every cut carries it and nothing else is on the list', () => {
  const s = createConsultSelectors(selectorDeps);
  const c = context({ colour: one(SHADE) });
  expect(s.ideas(c).ids).toHaveLength(4);
  expect(s.looks(c)).toEqual(s.ideas(c).ids.map((id) => [id, SHADE]));
  expect(s.ideas(c).ids.some(isColour)).toBe(false);
});

it('Pick under Both pairs every cut and keeps the colour looks on the list; Pick under Cut pairs every cut from the engine\'s colours', () => {
  const s = createConsultSelectors(selectorDeps);
  const both = context({});
  expect(paired(s.looks(both))).toHaveLength(s.ideas(both).cuts.length);
  expect(s.ideas(both).colours.length).toBeGreaterThan(0);
  const cut = context({ goal: 'cut', colour: { mode: 'pick', shade: null } });
  expect(paired(s.looks(cut))).toHaveLength(4);
  expect(s.ideas(cut).ids.some(isColour)).toBe(false);
});

const { questions } = CONTENT.consult.questions;
const writesMild = (q: (typeof questions)[number]): number => q.options.findIndex((o) => 'sets' in o && o.sets['safety.dye_reaction'] === 'mild');
const reactionQ = questions.find((q) => writesMild(q) >= 0);
if (!reactionQ) throw new Error('no question writes a mild dye reaction');
/** The answer to the safety question that says the person once reacted to dye. */
const MILD = { [reactionQ.id]: { chosen: [writesMild(reactionQ)] } };

it('after a dye reaction no cut is paired and the screen is told; the cuts stay', () => {
  const s = createConsultSelectors(selectorDeps);
  const c = context({ goal: 'cut', colour: { mode: 'pick', shade: null } }, { answers: MILD });
  expect(s.recommendation(c)?.engine.referral).not.toBeNull();
  expect(paired(s.looks(c))).toEqual([]);
  expect(s.ideas(c).cuts).toHaveLength(4);
  expect(s.noColourFits(c)).toBe(true);
});

it('after a referral the saved pair stays with its colour referred, and no prompt names its colour or an added colour', () => {
  const s = createConsultSelectors(selectorDeps);
  const before = context({});
  const [cut] = s.ideas(before).cuts;
  const [colour] = s.ideas(before).colours;
  if (cut === undefined || colour === undefined) throw new Error('Both should list a cut and a colour before the referral');
  const pair = { cut, colour };
  const c = context({}, { pair, answers: MILD, shortlist: { added: [SHADE], removed: [], order: [] } });
  const engine = s.recommendation(c)?.engine;
  expect(engine?.referral).not.toBeNull();
  // The pair stays on screen, and its colour and the added one carry the referral, so they read "Best done by a colourist".
  expect(s.pairIdea(c)).toEqual(pair);
  expect(engine?.added.find((i) => i.id === SHADE)?.referral).toBeTruthy();
  const prompts = s.promptPack(c)?.(details);
  if (!prompts) throw new Error('a goal gives prompts');
  expect(prompts.pair).toEqual({ ok: false, error: 'referral' });
  // No prompt the person can copy names either colour, however it was reached.
  const built = [prompts.pair, prompts.secondOpinion, ...prompts.looks.map((l) => l.prompt), ...prompts.grids.map((g) => g.prompt), ...prompts.cards.map((k) => k.prompt)];
  const texts = built.flatMap((p) => (p?.ok ? [p.value.text] : []));
  expect(texts.length).toBeGreaterThan(0);
  for (const name of [nameOf(colour), nameOf(SHADE)]) expect(texts.filter((t) => t.includes(name)), name).toEqual([]);
  expect(prompts.looks.filter((l) => l.id.includes(SHADE)).map((l) => l.prompt)).toEqual(prompts.looks.filter((l) => l.id.includes(SHADE)).map(() => ({ ok: false, error: 'referral' })));
});

/** A text's words as a prompt reads them: lower case, hyphens as spaces ("dark-blonde" is "dark blonde"). */
const wordsOf = (s: string): string[] => s.toLowerCase().replaceAll('-', ' ').split(/[^a-z']+/).filter(Boolean);
/** Words that say nothing of a colour's depth or shade. */
const NOT_COLOUR = new Set(['a', 'across', 'an', 'and', 'at', 'base', 'deep', 'ends', 'existing', 'hair', 'head', 'in', 'lengths', 'level', 'mid', 'mids', 'my', 'natural',
  'neutral', 'of', 'on', 'own', "person's", 'rich', 'root', 'roots', 'short', 'sides', 'soft', 'the', 'then', 'through', 'to', 'upper', 'very', 'warm', 'whole', 'with']);
const dyed = (natural: number, lengths: number): Facts => ({
  'hair.chemical_history': answered('hair.chemical_history', ['salon_colour']), 'colour.natural_level': answered('colour.natural_level', natural),
  'colour.current_level_lengths': answered('colour.current_level_lengths', lengths),
});
const LEVEL_3: Facts = { 'hair.chemical_history': answered('hair.chemical_history', ['none']), 'colour.natural_level': answered('colour.natural_level', 3) };
/** Hair to write prompts for: one level, not known, roots and lengths at different levels, and one of them known; with their lists. */
const HAIR = ([
  ['level 3', LEVEL_3, 3, 3], ['not known', {}, null, null], ['roots 3, lengths 9', dyed(3, 9), 3, 9], ['roots 9, lengths 3', dyed(9, 3), 9, 3],
  ['roots 3, lengths not known', { 'colour.natural_level': answered('colour.natural_level', 3) }, 3, null],
  ['roots not known, lengths 6', { 'colour.current_level_lengths': answered('colour.current_level_lengths', 6) }, null, 6],
] as const)
  .map(([about, facts, roots, lengths]) => ({ about, facts, roots, lengths, listed: recommendation(facts, {}) }));
type Hair = (typeof HAIR)[number];
const OWN = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => EN.prompts.ownBase(level));
const OWN_GREY = /\b(?:my own natural grey|whatever natural grey I already have|the grey I already have)\b/g; // The person's own grey as a look keeps it: theirs, never a claim of its design base.
const UNTREATED = CONTENT.library.entries.filter((e) => e.kind === 'colour' && (details(e.id) as LookDetail).base.technique === 'none').map((e) => e.id);

/** Words that name where on the head a colour sits. */
const REGION_WORDS = ['root', 'roots', 'upper', 'lengths', 'mid', 'mids', 'ends', 'sides', 'top', 'temples', 'head'];
const NO_REFERRAL = { referral: null };

/**
 * The words for the person's own colour a look must give, read from its placements zone by zone from the top: the roots, at
 * their natural level, then the upper lengths, the mid-lengths and the ends, at the level worn. A root placement runs on into placed
 * mid-lengths, so the upper lengths are coloured only when both are placed. One level only when every untreated zone has it.
 */
function ownWords(d: LookDetail, hair: Hair): string {
  const at = new Set(d.placements.map((p) => p.region));
  const zones = [
    { coloured: at.has('root'), level: hair.roots }, { coloured: at.has('root') && at.has('mids'), level: hair.lengths },
    { coloured: at.has('mids'), level: hair.lengths }, { coloured: at.has('ends'), level: hair.lengths },
  ].filter((z) => !z.coloured);
  const [first] = zones;
  return EN.prompts.ownBase(first?.level != null && zones.every((z) => z.level === first.level) ? first.level : null);
}

/**
 * What a complete colour prompt, its name included, says against the person's own colour for a look with an untreated base: a
 * marked word of the design base; a colour word of the design base (marked words, name, aliases) that no placement shade shares; a
 * placement shade the look's words name but the prompt lost; a word for a place on the head that the look's own prompt has and this one
 * lost or gained; or other words for the person's own colour than `ownWords`.
 */
function contradictionsIn(text: string, d: LookDetail, hair: Hair, detailsOf: DetailsOf): string[] {
  const generic = buildTryOn(CONTENT.consult.prompts, { id: d.id, kind: 'colour', name: d.name, prompt_spec: d.prompt_spec }, NO_REFERRAL);
  if (!generic.ok) throw new Error(`${d.id}: ${generic.error}`);
  const count = (words: readonly string[], w: string): number => words.filter((x) => x === w).length;
  const shadeWords = (id: string): string[] => { const s = detailsOf(id) as ShadeDetail; return [s.name, ...s.aliases].flatMap(wordsOf); };
  const placed = new Set(d.placements.flatMap((p) => shadeWords(p.shade)));
  const marked = d.base.on_words ?? [];
  const claims = [...marked.flatMap(wordsOf), ...(d.base.on === undefined ? [] : shadeWords(d.base.on))].filter((w) => !NOT_COLOUR.has(w) && !placed.has(w));
  const said = wordsOf(text.replace(OWN_GREY, ' '));
  const own = ownWords(d, hair);
  const at = `${d.id} (${hair.about})`;
  return [
    ...marked.filter((w) => text.includes(w)).map((w) => `${at} keeps "${w}"`),
    ...[...new Set(claims)].filter((w) => said.includes(w)).map((w) => `${at} says "${w}" of its design base`),
    ...d.placements.map((p) => wordsOf((detailsOf(p.shade) as ShadeDetail).name).join(' '))
      .filter((n) => wordsOf(d.prompt_spec).join(' ').includes(n) && !said.join(' ').includes(n)).map((n) => `${at} loses "${n}"`),
    ...REGION_WORDS.filter((w) => count(said, w) !== count(wordsOf(generic.value.text), w)).map((w) => `${at} changes where it says "${w}"`),
    ...(marked.length > 0 && !text.includes(own) ? [`${at} does not say "${own}"`] : []),
    ...OWN.filter((o) => o !== own && text.includes(o)).map((o) => `${at} says "${o}"`),
  ];
}

/** The person's colour prompt for one look through the real wiring. */
function promptFor(id: string, hair: Hair, detailsOf: DetailsOf): string {
  const built = selectorDeps.buildPrompts({ facts: hair.facts, recommendation: hair.listed, looks: [asItemId(id)], perPicture: undefined, pair: null, content: CONTENT, hasPhoto: false })(detailsOf).looks[0]?.prompt;
  if (!built?.ok) throw new Error(`${id} (${hair.about}): no prompt`);
  return built.value.text;
}

it("every look with an untreated base: its whole prompt gives the person's own colour, truly, and keeps each placement's shade", () => {
  expect(UNTREATED.length).toBeGreaterThan(30);
  expect(UNTREATED.flatMap((id) => HAIR.flatMap((hair) => contradictionsIn(promptFor(id, hair, details), details(id) as LookDetail, hair, details)))).toEqual([]);
  // Plants: a name that still claims the design base, and one level for untreated roots and upper lengths that differ.
  const LOWLIGHTS = details('brown-lowlights-men') as LookDetail;
  const named: DetailsOf = (id) => (id === LOWLIGHTS.id ? { ...LOWLIGHTS, name: 'Light brown with deeper lowlights' } : details(id));
  const [level3, , rootsUnder] = HAIR;
  if (!level3 || !rootsUnder) throw new Error('hair');
  expect(contradictionsIn(promptFor(LOWLIGHTS.id, level3, named), LOWLIGHTS, level3, details)).toEqual(['brown-lowlights-men (level 3) says "light" of its design base']);
  const OMBRE = details('caramel-ombre') as LookDetail;
  const oneLevel = buildTryOn(CONTENT.consult.prompts, { ...OMBRE, ownBase: { level: 3, words: OMBRE.base.on_words ?? [] } }, NO_REFERRAL);
  if (!oneLevel.ok) throw new Error(oneLevel.error);
  expect(contradictionsIn(oneLevel.value.text, OMBRE, rootsUnder, details)).toEqual([
    'caramel-ombre (roots 3, lengths 9) does not say "my existing colour"', 'caramel-ombre (roots 3, lengths 9) says "my own level 3 colour"',
  ]);
  // A look that applies its own base says nothing of the person's.
  const black = selectorDeps.buildPrompts({ facts: FACTS, recommendation: recommendation(FACTS, {}), looks: [BLACK], perPicture: undefined, pair: null, content: CONTENT, hasPhoto: false })(details).looks[0]?.prompt;
  for (const own of OWN) expect(black?.ok && black.value.text).not.toContain(own);
}, 60_000);

/** The parts of the head from the top, and the words a look's description uses for them ("lower lengths" sit with the ends). */
const ZONE_WORDS: readonly (readonly [RegExp, readonly Zone[]])[] = [
  [/\broots?\b/g, ['roots']], [/\bupper lengths\b/g, ['upper']], [/\bmid lengths\b|\bmids\b/g, ['mids']], [/\blower lengths\b|\bends\b|\btips\b/g, ['ends']],
  [/(?<!\b(?:upper|mid|lower) )\blengths\b/g, ['upper', 'mids', 'ends']],
];
type Zone = 'roots' | 'upper' | 'mids' | 'ends';
/** Every shade by each of its names, lower case with hyphens as spaces, longest first so "golden blonde" is not read as "blonde". */
const SHADE_NAMES = (() => {
  const by = new Map<string, Set<string>>();
  for (const e of CONTENT.library.entries.filter((x) => x.kind === 'shade')) {
    const s = details(e.id) as ShadeDetail;
    for (const n of [s.name, ...s.aliases]) by.set(wordsOf(n).join(' '), (by.get(wordsOf(n).join(' ')) ?? new Set()).add(s.id));
  }
  return [...by].sort(([a], [b]) => b.length - a.length);
})();
const OWN_WORDS = /\bmy (?:existing|own level \d+) colour\b/g;

/**
 * What a look's description in a person's prompt says against its placements, part of the head by part: in each clause, a
 * part named with a colour must have that colour placed there (a root placement runs on into placed mid-lengths, so the upper lengths
 * carry either), unless the colour is a lighter or deeper piece placed through the hair or the base applied all over; and the person's
 * own colour may stand only on a part the look leaves untreated.
 */
function regionClaims(text: string, d: LookDetail): string[] {
  const at = (r: string): string[] => d.placements.filter((p) => p.region === r).map((p) => p.shade);
  const shadesAt: Readonly<Record<Zone, readonly string[]>> = {
    roots: at('root'), upper: at('root').length > 0 && at('mids').length > 0 ? [...at('root'), ...at('mids')] : [], mids: at('mids'), ends: at('ends'),
  };
  const anywhere = new Set([...['highlights', 'lowlights', 'face_frame'].flatMap(at), ...(d.base.technique === 'none' ? [] : [d.base.shade])]);
  const treated = (z: Zone): boolean => d.base.technique !== 'none' || shadesAt[z].length > 0;
  const line = text.split('\n').find((l) => l.startsWith('The colour:')) ?? '';
  const clauses = line.slice(line.indexOf(', that is ') + 10).split(/[,;:.]|\b(?:then|into|and|with)\b/).map((c) => wordsOf(c).join(' '));
  return clauses.flatMap((clause) => {
    const zones = ZONE_WORDS.flatMap(([re, z]) => ((clause.match(re) ?? []).length > 0 ? z : []));
    const own = (clause.match(OWN_WORDS) ?? []).length > 0;
    // Read from the left, the longest name at each word: "milk chocolate brown" is milk chocolate, not chocolate brown.
    const words = clause.replace(OWN_WORDS, ' ').split(' ').filter(Boolean);
    const named: (readonly [string, ReadonlySet<string>])[] = [];
    for (let i = 0; i < words.length; ) {
      const hit = SHADE_NAMES.find(([name]) => words.slice(i, i + name.split(' ').length).join(' ') === name);
      if (hit) named.push(hit);
      i += hit ? hit[0].split(' ').length : 1;
    }
    return zones.flatMap((z) => [
      ...(own && treated(z) ? [`${d.id} gives the person's own colour at the ${z}, which the look colours`] : []),
      ...named.filter(([, ids]) => ![...ids].some((id) => anywhere.has(id) || shadesAt[z].includes(id))).map(([name]) => `${d.id} names ${name} at the ${z}, where ${treated(z) ? `it places ${shadesAt[z].join(', ')}` : 'it colours nothing'}`),
    ]);
  });
}

it('every look names, part of the head by part, only the colour placed there, or the person\'s own where it places nothing', () => {
  const looks = CONTENT.library.entries.filter((e) => e.kind === 'colour').map((e) => e.id);
  expect(looks.length).toBe(68);
  const found = looks.flatMap((id) => HAIR.flatMap((hair) => regionClaims(promptFor(id, hair, details), details(id) as LookDetail)));
  expect([...new Set(found)]).toEqual([]);
  // Plant: the copper ombre as it was, its auburn on the untreated upper lengths and its copper on the auburn mid-lengths.
  const OMBRE = details('copper-ombre') as LookDetail;
  const old = 'natural auburn-brown at the root, then auburn brown upper lengths with a clear smooth gradient to warm orange-red copper through the mid-lengths and a bright copper at the ends';
  const was: DetailsOf = (id) => (id === OMBRE.id ? { ...OMBRE, prompt_spec: old } : details(id));
  const [, , mixed] = HAIR;
  if (!mixed) throw new Error('hair');
  expect(regionClaims(promptFor(OMBRE.id, mixed, was), OMBRE)).toEqual([
    'copper-ombre names auburn at the upper, where it colours nothing', 'copper-ombre names orange red at the mids, where it places auburn',
    'copper-ombre names copper at the mids, where it places auburn',
  ]);
}, 120_000);
