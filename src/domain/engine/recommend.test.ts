/**
 * `recommend()` composing the stages, and safety precedence: excludes, the
 * referral and labels on every idea, including added ones and the "Try together" pair. Expected values by hand.
 */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { JourneyRecord, Policy, Referral, Reminder, RuleFor } from '../content/types.ts';
import type { EngineCut, EngineLook } from './derive-traits.ts';
import { assessIdea, recommend, type EngineContent, type RecommendOptions } from './recommend.ts';
import { needsOf } from '../../../tests/engine/fixture-needs.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const review = { status: 'checked', date: '2026-11-08' } as const;
const POLICY: Policy = {
  weights: { weak: 1, moderate: 2, strong: 3 }, count: { min: 1, default: 4, max: 8 }, both_split: 'cut_first_half',
  grid_max_tiles: 4, max_per_silhouette: 2, min_distinct_silhouettes_share: 0.5, low_upkeep: { max_styling_minutes: 10, min_trim_weeks: 8 },
  max_reasons: 3, reason_group_order: ['B', 'C', 'D', 'A', 'E'], pool_size: 14, change_span: null, length_span: null, colour_variety: null,
  upkeep_stack: null, growth_cm_per_month: null,
};
const CUT: ItemTraits<'cut'> = {
  length_class: 'shoulder', top_length: 'long', top_cm: [12, 20], scalp_mm: 300, hang_cm: 38, sides: 'none', height_top: 'low', volume_zone: ['ends'], sides_width: 'full', perimeter: 'soft',
  part: 'side', fringe: 'none', layers: ['long_layers'], silhouette: 'long_layers', weight_removal: 'medium', cut_method: ['point_cut'],
  nape_style: 'natural', shrinkage_risk: 'low', tension: 'none', heat_dependent: false, grow_out_friendly: true, tie_back: true, covers_forehead: false,
  covers_ears: true, tucked_behind_ear: false, beard_blend: false, lineup: false, styling_minutes: [10, 20], trim_weeks: [8, 12], tags: [],
};
const FITS = { straight: { fit: 'good' }, wavy: { fit: 'good' }, curly: { fit: 'good' }, coily: { fit: 'good' } } as const;
const cut = (id: string, traits: Partial<ItemTraits<'cut'>>, fits: Partial<EngineCut['texture_fit']> = {}): EngineCut => ({
  id, kind: 'cut', collections: ['salon'], traits: { ...CUT, ...traits }, required_cm: 20, texture_fit: { ...FITS, ...fits },
  density_fit: { low: { fit: 'good' }, medium: { fit: 'good' }, high: { fit: 'good' } },
});
const LOOK: ItemTraits<'colour'> = {
  family: 'brunette', warmth: 'warm', tone: ['caramel'], technique: ['balayage'], base_technique: 'none', technique_category: ['placement'], regions: ['mids', 'ends'],
  lightening: 'some', lighter_pieces: true, grey_effect: 'shows', prelightening: false, target_level: 7, root_levels: [0, 0], lengths_levels: [7, 7], upkeep_weeks: [12, 16], vivid: false, salon_only: true,
};
/** A look on the lengths only, at its target level unless the traits say otherwise. */
const look = (id: string, traits: Partial<ItemTraits<'colour'>>): EngineLook => {
  const level = traits.target_level ?? LOOK.target_level;
  const all: ItemTraits<'colour'> = { ...LOOK, lengths_levels: [level, level], ...traits };
  return { id, kind: 'colour', collections: ['salon'], traits: all, needs: needsOf(all), placements: [] };
};

const CUTS = [
  cut('long-layers', {}), cut('curtain-shag', { silhouette: 'shag', fringe: 'curtain' }), cut('blunt-bob', { silhouette: 'bob', length_class: 'bob', tie_back: false }),
  cut('razor-lob', { silhouette: 'lob', cut_method: ['razor'] }), cut('curly-rounded', { silhouette: 'rounded' }, { straight: { fit: 'poor' } }),
  cut('pixie', { silhouette: 'pixie', length_class: 'very_short', tie_back: false }, { coily: { fit: 'adapt' } }),
];
const LOOKS = [look('caramel-balayage', {}), look('honey-blonde', { family: 'blonde', target_level: 9 }), look('espresso-gloss', { technique: ['gloss'], target_level: 3, lightening: 'none' })];
const rule = (r: Omit<Extract<RuleFor<'cut'>, { effect: 'rank' }>, 'target' | 'effect' | 'evidence' | 'review'>): RuleFor<'cut'> => ({ target: 'cut', effect: 'rank', evidence: 'trade_consensus', review, ...r });
const CUT_RULES: RuleFor<'cut'>[] = [
  rule({ id: 'b01', group: 'B', strength: 'strong', when: { 'hair.texture': { known: true } }, favour: [{ texture_fit: { is: 'good' } }], disfavour: [{ texture_fit: { is: 'poor' } }], reason: 'You told us your hair texture' }),
  rule({ id: 'b30', group: 'B', strength: 'moderate', when: { 'pref.fringe': { is: 'want' } }, favour: [{ fringe: { in: ['curtain', 'wispy'] } }], disfavour: [], reason: 'You would like a fringe' }),
  { id: 'c09', group: 'C', target: 'cut', effect: 'exclude', when: { 'life.tie_back_needed': { is: true } }, on: { tie_back: { is: false } }, because: 'You need to tie your hair back, so cuts too short to tie are left out.', evidence: 'design_logic', review },
  { id: 'c80', group: 'C', target: 'cut', effect: 'exclude', when: { 'hair.chemical_history': { is: 'relaxer_perm' } }, on: { cut_method: { is: 'razor' } }, because: 'Razor cutting can fray relaxed ends, so razor cuts are left out.', evidence: 'design_logic', review },
  { id: 'c50', group: 'C', target: 'cut', effect: 'note', note: 'design', when: { 'life.event_soon': { is: true } }, because: 'Try a new cut a few weeks before your event.', evidence: 'design_logic', review },
];
const j = (id: string, label: JourneyRecord['label'], when: JourneyRecord['when'], on?: JourneyRecord['on']): JourneyRecord =>
  ({ id, effect: 'label', label, when, ...(on ? { on } : {}), because: `Because ${id}.`, what_to_ask: `Ask ${id}.`, evidence: 'design_logic', review });
const JOURNEY = [
  j('lift-0-2-virgin', 'plausible', { 'hair.chemical_history': { is: 'none' }, 'hair.condition': { is: 'healthy' } }, { lift_levels: { range: [0, 2] } }),
  j('lift-5-plus-any', 'needs_professional', { 'hair.chemical_history': { known: true } }, { lift_levels: { range: [5, 9] } }),
  j('unknown-history', 'uncertain', { 'hair.chemical_history': { known: false } }),
  j('unknown-current-level', 'uncertain', { 'colour.current_level_lengths': { known: false } }),
];
const SKIN: Reminder = { id: 'skin-test', kind: 'reminder', applies_to: 'every_colour_look', text: 'Do the skin test.', review };
const REFERRAL: Referral = { id: 'dye-reaction-referral', kind: 'referral', when: { 'safety.dye_reaction': { in: ['mild', 'serious'] } }, text: 'Please ask a doctor or allergy clinic before colouring.', replaces_suggestions: true, review };
const CONTENT: EngineContent = {
  cuts: CUTS, looks: LOOKS, shadeLevels: {}, rules: { cut: CUT_RULES, colour: [] }, journey: JOURNEY, reminders: [SKIN, REFERRAL],
  phrases: { 'texture_fit.good': 'a shape made for your hair texture', 'fringe.curtain': 'a curtain fringe' }, policy: POLICY,
  lengthBands: { very_short: [0, 3], short: [3, 8], chin: [8, 15], shoulder: [15, 25], long: [25, 40], very_long: [40, 100] },
};
const ids = (xs: readonly { id: string }[]) => xs.map((x) => x.id);
const BOTH: RecommendOptions = { kinds: ['cut', 'colour'], collections: [], count: 4 };
const PERSON = { 'hair.texture': 'straight', 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'colour.natural_level': 6, 'safety.dye_reaction': 'none' };

it('picks cuts for the first half and colour looks for the second under Both, each in rank order', () => {
  const r = recommend(answered(PERSON), CONTENT, BOTH);
  // b01 gives +3 to every good fit and -3 to curly-rounded (poor for straight hair); ties break by id.
  expect(ids(r.picks)).toEqual(['blunt-bob', 'curtain-shag', 'caramel-balayage', 'espresso-gloss']);
  expect(r.picks.map((p) => p.score)).toEqual([3, 3, 0, 0]);
  expect(r.picks[0]?.reasons.map((x) => x.text)).toEqual(['You told us your hair texture, so this cut has a shape made for your hair texture.']);
  expect(r).toMatchObject({ shortfall: [], referral: null, colourPrompts: true, notes: [] });
});

it('labels each colour pick and adds its reminders', () => {
  const r = recommend(answered(PERSON), CONTENT, { kinds: ['colour'], collections: [], count: 3 });
  // Natural 6 is the derived current level: caramel (7) lifts 1, honey (9) lifts 3, espresso (3) lifts -3.
  expect(r.picks.map((p) => [p.id, p.label, p.journey?.lift])).toEqual([['caramel-balayage', 'plausible', 1], ['espresso-gloss', 'uncertain', -3], ['honey-blonde', 'uncertain', 3]]);
  expect(r.picks.every((p) => p.reminders.join() === 'Do the skin test.')).toBe(true);
});

it('leaves out excluded cuts, and keeps an added excluded idea with its reason', () => {
  const facts = answered({ ...PERSON, 'life.tie_back_needed': true, 'hair.chemical_history': ['relaxer_perm'] });
  const r = recommend(facts, CONTENT, { kinds: ['cut'], collections: [], count: 8, added: ['blunt-bob'] });
  expect(ids(r.picks)).toEqual(['curtain-shag', 'long-layers', 'curly-rounded']);
  expect(r.shortfall).toMatchObject([{ kind: 'cut', requested: 8, available: 3 }]);
  expect(r.shortfall[0]?.because.length).toBeGreaterThan(0);
  expect(r.added.map((a) => [a.id, a.excluded])).toEqual([['blunt-bob', [{ ruleId: 'c09', because: 'You need to tie your hair back, so cuts too short to tie are left out.' }]]]);
});

it('after the referral no automatic output holds a colour: the shortfall says the referral once; added ideas and the pair stay, replaced', () => {
  const facts = answered({ ...PERSON, 'safety.dye_reaction': 'mild' });
  const r = recommend(facts, CONTENT, { ...BOTH, added: ['honey-blonde'], pair: { cut: 'long-layers', colour: 'caramel-balayage' } });
  // Picks, the pool and lent looks hold no colour; the referral's reason is the colour shortfall's one line.
  expect([...r.picks, ...r.pool, ...r.worthAsking.map((w) => w.idea)].filter((i) => i.kind === 'colour')).toEqual([]);
  expect(r.shortfall.find((s) => s.kind === 'colour')).toMatchObject({ available: 0, because: [r.referral?.text] });
  const colour = [...r.added, ...(r.pair ? [r.pair.colour] : [])].filter((i) => i.kind === 'colour');
  expect(colour).toHaveLength(2);
  expect(colour.every((i) => i.label === 'needs_professional' && i.referral?.id === 'dye-reaction-referral')).toBe(true);
  // The journey itself still says plausible for caramel; only the label shown is replaced.
  expect(r.pair?.colour.journey?.label).toBe('plausible');
  expect(r).toMatchObject({ colourPrompts: false, referral: { id: 'dye-reaction-referral' } });
});

it('checks the pair again: a pair cut that a stated limit excludes keeps its reason', () => {
  const r = recommend(answered({ ...PERSON, 'life.tie_back_needed': true }), CONTENT, { ...BOTH, pair: { cut: 'pixie', colour: 'honey-blonde' } });
  expect(r.pair?.cut.excluded.map((e) => e.ruleId)).toEqual(['c09']);
  expect(r.pair?.colour.label).toBe('uncertain');
  expect(recommend(answered(PERSON), CONTENT, { ...BOTH, pair: { cut: 'pixie', colour: 'no-such-look' } }).pair).toBeNull();
});

it('replaces a removed idea with the next pick, so the count holds', () => {
  const r = recommend(answered(PERSON), CONTENT, { kinds: ['cut'], collections: [], count: 2, removed: ['blunt-bob'] });
  expect(ids(r.picks)).toEqual(['curtain-shag', 'long-layers']);
  expect(ids(r.pool)).not.toContain('blunt-bob');
});

const sized = (pool_size: number, extra: Partial<EngineContent> = {}): EngineContent => ({ ...CONTENT, ...extra, policy: { ...POLICY, pool_size } });
const kindsOf = (xs: readonly { kind: string }[]) => xs.map((x) => x.kind);

it('the top looks are the engine\'s own selection at the pool size, split like the picks', () => {
  const r = recommend(answered(PERSON), sized(4), BOTH);
  expect(kindsOf(r.pool)).toEqual(['cut', 'cut', 'colour', 'colour']);
  expect(ids(r.pool), 'at the same size, exactly what the list shows').toEqual(ids(r.picks));
});

it('a kind that runs short leaves its places in the top looks to the other', () => {
  expect(kindsOf(recommend(answered(PERSON), sized(8), BOTH).pool), 'few colours: more cuts').toEqual(['cut', 'cut', 'cut', 'cut', 'cut', 'colour', 'colour', 'colour']);
  const looks = Array.from({ length: 8 }, (_, i) => look(`look-${String(i)}`, {}));
  const removed = ['long-layers', 'curtain-shag', 'blunt-bob', 'razor-lob'];
  expect(kindsOf(recommend(answered(PERSON), sized(8, { looks }), { ...BOTH, removed }).pool), 'few cuts: more colours').toEqual(['cut', 'cut', 'colour', 'colour', 'colour', 'colour', 'colour', 'colour']);
  expect(ids(recommend(answered(PERSON), sized(8), { kinds: ['colour'], collections: [], count: 1 }).pool)).toHaveLength(3);
});

it('after the referral the top looks are cuts only, however many there are, and none under the Colour goal', () => {
  const referred = answered({ ...PERSON, 'safety.dye_reaction': 'mild' });
  expect(kindsOf(recommend(referred, sized(5), BOTH).pool)).toEqual(['cut', 'cut', 'cut', 'cut', 'cut']);
  expect(recommend(referred, sized(5), { kinds: ['colour'], collections: [], count: 4 }).pool).toEqual([]);
});

it('recomputes safety from the facts for any idea, so a restored session follows a later answer', () => {
  expect(assessIdea('honey-blonde', answered(PERSON), CONTENT)?.label).toBe('uncertain');
  expect(assessIdea('honey-blonde', answered({ ...PERSON, 'colour.natural_level': 3 }), CONTENT)?.label).toBe('needs_professional');
  expect(assessIdea('honey-blonde', answered({ ...PERSON, 'safety.dye_reaction': 'serious' }), CONTENT)?.referral?.id).toBe('dye-reaction-referral');
  expect(assessIdea('no-such-id', answered(PERSON), CONTENT)).toBeNull();
});

it('is deterministic, also with the library in another order', () => {
  const facts = answered({ ...PERSON, 'pref.fringe': 'want' });
  const a = recommend(facts, CONTENT, BOTH);
  expect(recommend(facts, CONTENT, BOTH)).toEqual(a);
  expect(recommend(facts, { ...CONTENT, cuts: [...CUTS].reverse(), looks: [...LOOKS].reverse() }, BOTH)).toEqual(a);
  expect(ids(a.picks).slice(0, 2)).toEqual(['curtain-shag', 'blunt-bob']);
});

it('keeps to the collections chosen, clamps the count to the policy and shows whole-result notes', () => {
  const men = { ...CONTENT, cuts: [...CUTS, { ...cut('crop', { silhouette: 'crop' }), collections: ['barbering'] as const }] };
  expect(ids(recommend(answered(PERSON), men, { kinds: ['cut'], collections: ['barbering'], count: 4 }).picks)).toEqual(['crop']);
  const all = recommend(answered({ ...PERSON, 'life.event_soon': true }), men, { kinds: ['cut'], collections: [], count: 20 });
  expect(all.picks).toHaveLength(7);
  expect(all.notes.map((n) => n.ruleId)).toEqual(['c50']);
});
