/**
 * Representative content: the full journey set (28 rules, 31 records), a synthetic
 * library, a probe's known-answer cases, the per-core-set journey sweep and the seeded 2,000-profile sweep.
 */
import { expect, it } from 'vitest';
import { FACTS, FACT_KEYS, type Confidence, type FactKey, type Facts } from '../facts/registry.ts';
import { deriveFacts } from '../facts/derive.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { JourneyRecord, Match, Policy, Referral, Reminder, RuleFor, When } from '../content/types.ts';
import type { JourneyLabel } from '../content/values.ts';
import { LIGHTENING_PLACEMENTS, lookTraits, type EngineCut, type EngineLook } from './derive-traits.ts';
import { labelLook } from './journey.ts';
import { assessIdea, recommend, type EngineContent, type IdeaKind } from './recommend.ts';
import { needsOf } from '../../../tests/engine/fixture-needs.ts';

const review = { status: 'checked', date: '2026-11-08' } as const;
const rec = (id: string, label: JourneyLabel, when: When, on?: Match<'colour'>): JourneyRecord =>
  ({ id, effect: 'label', label, when, ...(on ? { on } : {}), because: `Because ${id}.`, what_to_ask: `Ask ${id}.`, evidence: 'design_logic', review });
const H = 'hair.chemical_history', C = 'hair.condition', CL = 'colour.current_level_lengths', LCS = 'colour.last_chemical_service';
const DYE = ['home_dye', 'home_dark_dye', 'salon_colour', 'vivid'] as const;
const lift = (lo: number, hi: number) => ({ lift_levels: { range: [lo, hi] as const } });
const JOURNEY: readonly JourneyRecord[] = [
  rec('lift-0-2-virgin', 'plausible', { [H]: { is: 'none' }, [C]: { is: 'healthy' } }, lift(0, 2)),
  rec('lift-3-4-any', 'uncertain', { [H]: { known: true } }, lift(3, 4)),
  rec('lift-5-plus-any', 'needs_professional', { [H]: { known: true } }, lift(5, 9)),
  rec('very-dark-to-platinum', 'needs_professional', { [CL]: { range: [1, 4] } }, { target_level: { range: [9, 10] } }),
  rec('mid-brown-to-light-blonde', 'uncertain', { [CL]: { range: [4, 6] } }, { target_level: { range: [8, 9] } }),
  rec('go-lighter-over-dye', 'needs_professional', { [H]: { in: DYE } }, lift(1, 9)),
  rec('box-black-to-lighter', 'needs_professional', { [H]: { is: 'home_dark_dye' } }, lift(3, 9)),
  rec('colour-correction-tone', 'uncertain', { [H]: { in: DYE } }, { technique: { is: 'colour_correction' }, ...lift(-9, 0) }),
  rec('henna-plant', 'uncertain', { [H]: { is: 'henna_plant' } }, lift(1, 9)),
  rec('henna-plant-ash', 'uncertain', { [H]: { is: 'henna_plant' } }, { tone: { is: 'ash' } }),
  rec('metallic-salts', 'needs_professional', { [H]: { is: 'henna_compound' } }),
  rec('go-darker-modest', 'plausible', { [C]: { in: ['healthy', 'dry'] } }, lift(-3, -1)),
  rec('go-darker-from-bleached', 'uncertain', { [CL]: { range: [8, 10] } }, { target_level: { range: [1, 3] } }),
  rec('vivid-on-dark', 'needs_professional', { [CL]: { range: [1, 6] } }, { vivid: { is: true }, prelightening: { is: true } }),
  rec('vivid-deep-on-dark', 'uncertain', { [CL]: { range: [1, 5] } }, { vivid: { is: true }, prelightening: { is: false } }),
  rec('grey-coverage', 'plausible', {}, { technique: { is: 'grey_coverage' } }),
  rec('grey-blending', 'plausible', {}, { technique: { is: 'grey_blending' } }),
  rec('grey-to-silver', 'uncertain', {}, { family: { is: 'grey_silver' } }),
  rec('lightener-on-straightened', 'needs_professional', { [H]: { in: ['relaxer_perm', 'keratin'] } }, lift(1, 9)),
  rec('colour-soon-after-chemical', 'needs_professional', { [LCS]: { is: 'weeks_0_2' } }),
  rec('damaged-hair', 'needs_professional', { [C]: { is: 'damaged' } }, lift(1, 9)),
  rec('scalp-skin-problem', 'needs_professional', { 'safety.scalp_irritation': { is: 'now' } }),
  rec('pregnancy-treatment', 'needs_professional', { 'safety.health_context': { is: true } }),
  rec('ash-from-warm-base', 'uncertain', { 'colour.current_tone': { in: ['warm', 'copper', 'brassy'] } }, { warmth: { is: 'cool' }, ...lift(1, 9) }),
  rec('red-copper-fade', 'uncertain', { 'pref.colour_upkeep': { in: ['low', 'home_only'] } }, { family: { is: 'red_copper' } }),
  rec('textured-hair-lightening', 'uncertain', { 'hair.texture': { in: ['curly', 'coily'] } }, lift(3, 9)),
  rec('textured-hair-lightening-fine', 'uncertain', { 'hair.strand': { is: 'fine' } }, lift(3, 9)),
  rec('unknown-history', 'uncertain', { [H]: { known: false } }),
  rec('unknown-current-level', 'uncertain', { [CL]: { known: false } }),
  rec('deposit-only-lift', 'uncertain', {}, { technique: { in: ['gloss', 'demi_refresh'] }, ...lift(1, 9) }),
  rec('lightening-placement-not-lighter', 'uncertain', {}, { placement_not_lighter: { is: true } }),
];
/** One shade per level, topping out at that level, for the looks' lightening placements. */
const SHADES = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`level-${String(i + 1)}`, [Math.max(1, i), i + 1] as const]));
const BASE: ItemTraits<'colour'> = {
  family: 'blonde', warmth: 'warm', tone: ['honey'], technique: ['balayage'], base_technique: 'none', technique_category: ['placement'], regions: ['mids', 'ends'],
  lightening: 'some', lighter_pieces: true, grey_effect: 'shows', prelightening: false, target_level: 8, root_levels: [0, 0], lengths_levels: [8, 8], upkeep_weeks: [12, 16], vivid: false, salon_only: true,
};
/** A look whose lightening placements use a shade at its own target level, as a real look's would, on the lengths only. */
const look = (id: string, target: number, t: Partial<ItemTraits<'colour'>> = {}): EngineLook => {
  const traits = { ...BASE, lengths_levels: [target, target] as const, ...t, target_level: target };
  const placements = traits.technique.filter((x) => LIGHTENING_PLACEMENTS.has(x)).map((technique) => ({ technique, shade: `level-${String(target)}` }));
  return { id, kind: 'colour', collections: ['salon', 'barbering'], traits, needs: needsOf(traits), placements };
};
/** The label on facts already derived; `label` derives first. */
const labelOn = (l: EngineLook, f: Facts) => labelLook(lookTraits(l, f, SHADES), JOURNEY, f);
const label = (l: EngineLook, raw: Facts) => labelOn(l, deriveFacts(raw));
const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const core = (o: Record<string, unknown> = {}) => answered({ 'colour.natural_level': 7, [H]: ['none'], [C]: 'healthy', 'colour.grey_percent': 0, 'look.undertone': 'warm',
  'pref.colour_direction': 'lighter', 'pref.colour_upkeep': 'medium', 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', ...o });
const both = (o: Record<string, unknown> = {}) => answered({ 'hair.texture': 'straight', 'colour.natural_level': 7, [H]: ['relaxer_perm'], [CL]: 7, [C]: 'healthy',
  'pref.colour_direction': 'darker', 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', ...o });
const HONEY = look('honey-balayage', 8);
const COOL = look('cool-ash-babylights', 8, { warmth: 'cool', tone: ['ash'], technique: ['babylights'] });
const MOCHA = look('mocha', 5, { technique: ['all_over'], base_technique: 'all_over', technique_category: ['process'] });

it('holds 31 records with unique ids: 28 rules, three of them split', () => {
  expect(JOURNEY).toHaveLength(31);
  expect(new Set(JOURNEY.map((r) => r.id)).size).toBe(31);
});

it('gives the probe\'s labels for the Colour core answers (round 3, cases 1a-1d, 2a-2f)', () => {
  expect(label(HONEY, core()).label).toBe('plausible');
  expect(label(HONEY, core({ 'colour.natural_level': 6 })).applied.map((r) => r.id)).toEqual(['lift-0-2-virgin', 'mid-brown-to-light-blonde']);
  expect(label(MOCHA, core({ [H]: ['salon_colour'], [LCS]: 'months_2_6' })).label).toBe('uncertain');
  expect(label(MOCHA, core({ [H]: ['salon_colour'], [CL]: 7, [LCS]: 'months_2_6' })).label).toBe('plausible');
  expect(label(COOL, core({ 'safety.scalp_irritation': 'now' })).label).toBe('needs_professional');
  expect(label(COOL, core({ 'safety.scalp_irritation': undefined, 'safety.dye_reaction': undefined }))).toMatchObject({ label: 'uncertain', dependsOn: ['colour.current_tone', 'safety.scalp_irritation'] });
  expect(label(COOL, core())).toMatchObject({ label: 'uncertain', dependsOn: ['colour.current_tone'] });
  expect(label(COOL, core({ 'colour.current_tone': 'brassy' })).applied.map((r) => r.id)).toEqual(['lift-0-2-virgin', 'ash-from-warm-base']);
  expect(label(HONEY, core({ 'safety.health_context': true })).label).toBe('needs_professional');
  expect(label(HONEY, core())).toMatchObject({ label: 'plausible', dependsOn: [] });
});

it('gives the probe\'s labels for the Both core answers (cases 2g-2k)', () => {
  const chestnut = look('chestnut', 5, { technique: ['all_over'], family: 'brunette' });
  expect(label(chestnut, both())).toMatchObject({ label: 'uncertain', dependsOn: [LCS] });
  expect(label(chestnut, both({ [LCS]: 'weeks_0_2' })).label).toBe('needs_professional');
  const copper = look('copper-gloss', 7, { technique: ['gloss'], family: 'red_copper', tone: ['copper'] });
  expect(label(copper, both({ [H]: ['none'], [CL]: undefined }))).toMatchObject({ label: 'uncertain', dependsOn: ['pref.colour_upkeep'] });
  expect(label(copper, both({ [H]: ['none'], [CL]: undefined, 'pref.colour_upkeep': 'home_only' })).applied.map((r) => r.id)).toContain('red-copper-fade');
  const grey = look('grey-cover', 9, { technique: ['grey_coverage'], family: 'brunette' });
  expect(label(grey, core({ [H]: ['highlights'], [CL]: 4, [LCS]: 'months_6_plus' })).label).toBe('needs_professional');
});

it('labels both split cases within the whole set', () => {
  const gloss = look('honey-gloss', 8, { technique: ['gloss'], lightening: 'none' });
  expect(label(gloss, core()).applied.map((r) => r.id)).toEqual(['lift-0-2-virgin', 'deposit-only-lift']);
  expect(label(look('demi', 6, { technique: ['demi_refresh'] }), core())).toMatchObject({ label: 'plausible', lift: -1 });
  // A balayage that tops out at level 7 on level 7 hair: lift 0, but the placement is not lighter.
  expect(label(look('level-7-balayage', 7), core()).applied.map((r) => r.id)).toEqual(['lift-0-2-virgin', 'lightening-placement-not-lighter']);
  expect(label(look('level-7-balayage', 7), core({ 'colour.natural_level': 6 }))).toMatchObject({ label: 'plausible', lift: 1 });
});

// ── The per-core-set sweep of the probe, with the split records and placements ──

const LOOKS: EngineLook[] = [];
for (let t = 1; t <= 10; t++) {
  for (const tech of ['all_over', 'balayage', 'grey_coverage', 'grey_blending', 'gloss', 'colour_correction'] as const) {
    for (const warmth of ['warm', 'cool', 'neutral'] as const) LOOKS.push(look(`${tech}-${warmth}-${String(t)}`, t, { technique: [tech], warmth, tone: warmth === 'cool' ? ['ash'] : ['honey'], family: tech.startsWith('grey') ? 'brunette' : 'blonde' }));
  }
  LOOKS.push(look(`copper-${String(t)}`, t, { technique: ['gloss'], family: 'red_copper', tone: ['copper'] }));
  LOOKS.push(look(`silver-${String(t)}`, t, { technique: ['all_over'], family: 'grey_silver', tone: ['silver'], warmth: 'cool' }));
  LOOKS.push(look(`vivid-deep-${String(t)}`, t, { technique: ['vivid_all_over'], family: 'vivid', tone: ['plum'], vivid: true }));
  if (t >= 7) LOOKS.push(look(`vivid-bright-${String(t)}`, t, { technique: ['vivid_all_over'], family: 'vivid', tone: ['pink'], vivid: true, prelightening: true }));
}
const HISTORIES = [['none'], ['home_dye'], ['home_dark_dye'], ['salon_colour'], ['bleach'], ['highlights'], ['vivid'], ['colour_remover'], ['henna_plant'], ['henna_compound'], ['relaxer_perm'], ['keratin'], ['bleach', 'highlights'], ['home_dye', 'relaxer_perm']];
type SetId = 'colour/any' | 'both/salon';
/** What each core question set asks, as the probe writes it; the barbering Both set asks the same journey facts. */
function coreAnswers(set: SetId, h: string[], nat: number, cl: number, c: string): Facts {
  const history = !(h.length === 1 && h[0] === 'none');
  const f: Record<string, unknown> = { 'colour.natural_level': nat, [H]: h, [C]: c, 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', ...(history ? { [CL]: cl } : {}) };
  if (set === 'colour/any') Object.assign(f, { 'colour.grey_percent': 0, 'pref.colour_upkeep': 'medium', ...(history ? { [LCS]: 'months_6_plus' } : {}) });
  else f['hair.texture'] = 'straight';
  return answered(f);
}
const TONES = ['warm', 'copper', 'neutral', 'cool', 'brassy'];
const NON_CORE: Record<SetId, Record<string, readonly unknown[]>> = {
  'colour/any': { 'colour.current_tone': TONES, 'hair.texture': ['straight', 'wavy', 'curly', 'coily', 'mixed'], 'hair.strand': ['fine', 'medium', 'coarse'] },
  'both/salon': { 'colour.current_tone': TONES, 'hair.strand': ['fine', 'medium', 'coarse'], [LCS]: ['weeks_0_2', 'weeks_2_8', 'months_2_6', 'months_6_plus', 'never'], 'pref.colour_upkeep': ['high', 'medium', 'low', 'home_only'] },
};

interface SetSweep { pairs: number; plausible: number; guess: string[]; liftOver2: number }

/** One core-answers profile against every look: a core-only "Plausible" must survive every non-core answer. */
function sweepProfile(set: SetId, f: Facts, out: SetSweep): void {
  const derived = deriveFacts(f);
  for (const lk of LOOKS) {
    out.pairs++;
    const r = labelOn(lk, derived);
    if (r.label !== 'plausible') continue;
    out.plausible++;
    if ((r.lift ?? 99) > 2) out.liftOver2++;
    for (const [k, vals] of Object.entries(NON_CORE[set])) {
      if (derived[k as FactKey] !== undefined) continue;
      for (const v of vals) if (label(lk, { ...f, ...answered({ [k]: v }) }).label !== 'plausible') out.guess.push(`${lk.id}/${k}=${String(v)}`);
    }
  }
}

function sweepSet(set: SetId): SetSweep {
  const out: SetSweep = { pairs: 0, plausible: 0, guess: [], liftOver2: 0 };
  for (const h of HISTORIES) for (let nat = 1; nat <= 10; nat++) for (const cl of h[0] === 'none' ? [nat] : [2, 4, 6, 8, 10]) {
    for (const c of ['healthy', 'dry', 'damaged']) sweepProfile(set, coreAnswers(set, h, nat, cl, c), out);
  }
  return out;
}

it('keeps "Plausible" reachable with core answers only, never on a guess, and within a lift of 2, per core set', { timeout: 120_000 }, () => {
  for (const set of ['colour/any', 'both/salon'] as const) {
    const s = sweepSet(set);
    expect(s.plausible, set).toBeGreaterThan(0);
    expect(s.guess.slice(0, 3), set).toEqual([]);
    expect(s.liftOver2, set).toBe(0);
  }
});

it('never gives "Plausible" above a lift of 2 with full answers, for every history', { timeout: 60_000 }, () => {
  let violations = 0;
  for (const h of HISTORIES) for (let nat = 1; nat <= 10; nat++) for (const cl of [1, 3, 5, 7, 9]) for (const c of ['healthy', 'dry', 'damaged']) {
    const f = core({ [H]: h, 'colour.natural_level': nat, [C]: c, [CL]: h[0] === 'none' ? undefined : cl, [LCS]: 'months_6_plus', 'colour.current_tone': 'neutral', 'hair.texture': 'straight', 'hair.strand': 'medium', 'safety.health_context': false });
    const derived = deriveFacts(f);
    for (const lk of LOOKS) {
      const r = labelOn(lk, derived);
      if (r.label === 'plausible' && (r.lift === null || r.lift > 2)) violations++;
    }
  }
  expect(violations).toBe(0);
});

// ── The seeded sweep: 2,000 random profiles over a synthetic library with the whole journey set ──

const CUT: ItemTraits<'cut'> = {
  length_class: 'shoulder', top_length: 'long', top_cm: [12, 20], scalp_mm: 300, hang_cm: 38, sides: 'none', height_top: 'low', volume_zone: ['ends'], sides_width: 'full', perimeter: 'soft',
  part: 'side', fringe: 'none', layers: ['long_layers'], silhouette: 'long_layers', weight_removal: 'medium', cut_method: ['point_cut'], nape_style: 'natural',
  shrinkage_risk: 'low', tension: 'none', heat_dependent: false, grow_out_friendly: true, tie_back: true, covers_forehead: false, covers_ears: true,
  tucked_behind_ear: false, beard_blend: false, lineup: false, styling_minutes: [10, 20], trim_weeks: [8, 12], tags: [],
};
const FIT = { fit: 'good' } as const;
const SILHOUETTES = ['long_layers', 'shag', 'bob', 'lob', 'pixie', 'rounded', 'tapered_natural', 'crop', 'quiff', 'buzz'] as const;
const LENGTHS = ['buzz', 'very_short', 'short', 'chin', 'bob', 'shoulder', 'long'] as const;
/** Cut i of the synthetic library: traits cycle at different periods, so the 16 cuts mix silhouettes, limits and fits. */
const synthTraits = (i: number): ItemTraits<'cut'> => ({
  ...CUT, silhouette: SILHOUETTES[i % 10] ?? 'bob', length_class: LENGTHS[i % 7] ?? 'bob', tie_back: i % 4 !== 0,
  cut_method: i % 5 === 0 ? ['razor'] : ['point_cut'], fringe: i % 3 === 0 ? 'curtain' : 'none', height_top: i % 6 === 0 ? 'high' : 'low',
  styling_minutes: i % 4 === 1 ? [0, 5] : [10, 20], trim_weeks: i % 4 === 1 ? [8, 12] : [3, 6], tags: i % 2 === 0 ? ['curly_first'] : [],
});
const synthFits = (i: number): Pick<EngineCut, 'texture_fit' | 'density_fit'> => ({
  texture_fit: { straight: i % 5 === 4 ? { fit: 'poor' } : FIT, wavy: FIT, curly: i % 3 === 0 ? { fit: 'adapt', note: 'Dry cut.' } : FIT, coily: i % 2 === 0 ? FIT : { fit: 'poor' } },
  density_fit: { low: FIT, medium: FIT, high: i % 4 === 2 ? { fit: 'adapt', note: 'Remove bulk.' } : FIT },
});
const COLLECTIONS_BY_3 = [['barbering'], ['salon'], ['salon', 'barbering']] as const;
const synthCut = (i: number): EngineCut => ({
  id: `cut-${String(i).padStart(2, '0')}`, kind: 'cut', collections: COLLECTIONS_BY_3[i % 3] ?? [], required_cm: [2, 6, 12, 20, 30][i % 5] ?? 2,
  traits: synthTraits(i), ...synthFits(i),
});
type RankCut = Omit<Extract<RuleFor<'cut'>, { effect: 'rank' }>, 'target' | 'effect' | 'evidence' | 'review'>;
const rankCut = (r: RankCut): RuleFor<'cut'> => ({ target: 'cut', effect: 'rank', evidence: 'trade_consensus', review, ...r });
const CUT_RULES: RuleFor<'cut'>[] = [
  rankCut({ id: 'b01', group: 'B', strength: 'strong', when: { 'hair.texture': { known: true } }, favour: [{ texture_fit: { is: 'good' } }], disfavour: [{ texture_fit: { is: 'poor' } }], reason: 'You told us your hair texture' }),
  rankCut({ id: 'a01', group: 'A', strength: 'moderate', when: { 'face.proportion': { is: 'longer' }, 'wish.face_length': { is: 'soften' } }, favour: [{ fringe: { is: 'curtain' } }], disfavour: [{ height_top: { is: 'high' } }], reason: 'You would like to soften the look of length' }),
  rankCut({ id: 'a05', group: 'A', strength: 'moderate', when: { 'wish.forehead': { is: 'soften' } }, favour: [{ fringe: { in: ['curtain', 'wispy'] } }], disfavour: [], reason: 'You would like a softer forehead line' }),
  rankCut({ id: 'c01', group: 'C', strength: 'strong', when: { 'life.styling_minutes': { range: [0, 10] } }, favour: [{ styling_minutes: { range: [0, 10] } }], disfavour: [], reason: 'You want little styling time' }),
  rankCut({ id: 'c13', group: 'C', strength: 'moderate', when: { 'life.grow_out_goal': { is: true } }, favour: [{ length_direction: { in: ['same', 'longer'] } }], disfavour: [{ length_change: { is: 'large' } }], reason: 'You are growing your hair' }),
  { id: 'b20', group: 'B', target: 'cut', effect: 'note', note: 'caution', when: { 'hair.cowlick_front': { is: true } }, on: { fringe: { is: 'curtain' } }, because: 'A front cowlick lifts a fringe.', suppresses: ['a05'], evidence: 'single_source', review },
  { id: 'c09', group: 'C', target: 'cut', effect: 'exclude', when: { 'life.tie_back_needed': { is: true } }, on: { tie_back: { is: false } }, because: 'Too short to tie back.', evidence: 'design_logic', review },
  { id: 'c80', group: 'C', target: 'cut', effect: 'exclude', when: { [H]: { is: 'relaxer_perm' } }, on: { cut_method: { is: 'razor' } }, because: 'Razor cutting can fray relaxed ends.', evidence: 'design_logic', review },
  { id: 'c30', group: 'C', target: 'cut', effect: 'exclude', when: { 'life.headwear': { in: ['helmet', 'hat_or_cap'] } }, on: { height_top: { is: 'high' } }, because: 'A helmet flattens a high top.', evidence: 'design_logic', review },
];
const COLOUR_RULES: RuleFor<'colour'>[] = [{
  id: 'e01', group: 'E', target: 'colour', effect: 'rank', strength: 'weak', when: { 'look.undertone': { is: 'warm' } }, favour: [{ warmth: { is: 'warm' } }],
  disfavour: [{ tone: { is: 'ash' } }], reason: 'You said warm tones suit you', evidence: 'single_source', review,
}];
const REMINDERS: (Reminder | Referral)[] = [
  { id: 'skin-test', kind: 'reminder', applies_to: 'every_colour_look', text: 'Skin test.', review },
  { id: 'strand-test', kind: 'reminder', on: { lightening: { is: 'always' } }, text: 'Strand test.', review },
  { id: 'dye-reaction-referral', kind: 'referral', when: { 'safety.dye_reaction': { in: ['mild', 'serious'] } }, text: 'Ask a doctor first.', replaces_suggestions: true, review },
  { id: 'black-henna-reaction', kind: 'referral', when: { 'colour.henna_type': { is: 'tattoo' } }, text: 'Ask a doctor first.', replaces_suggestions: true, review },
];
const POLICY: Policy = {
  weights: { weak: 1, moderate: 2, strong: 3 }, count: { min: 1, default: 4, max: 8 }, both_split: 'cut_first_half', grid_max_tiles: 4,
  max_per_silhouette: 2, min_distinct_silhouettes_share: 0.5, low_upkeep: { max_styling_minutes: 10, min_trim_weeks: 8 }, max_reasons: 3,
  reason_group_order: ['B', 'C', 'D', 'A', 'E'], pool_size: 14, change_span: null, length_span: null, colour_variety: null, upkeep_stack: null, growth_cm_per_month: null,
};
const CONTENT: EngineContent = {
  cuts: Array.from({ length: 16 }, (_, i) => synthCut(i)), looks: LOOKS.filter((_, i) => i % 9 === 0), shadeLevels: SHADES,
  rules: { cut: CUT_RULES, colour: COLOUR_RULES }, journey: JOURNEY, reminders: REMINDERS, phrases: {}, policy: POLICY,
  lengthBands: { very_short: [0, 3], short: [3, 8], chin: [8, 15], shoulder: [15, 25], long: [25, 40], very_long: [40, 100] },
};

/** mulberry32: a small seeded generator, so the sweep is the same on every run. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rnd: () => number, xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)] as T;
/** A random value that fits the registry: a set respects its exclusive values, and may be empty when it has none. */
function valueFor(rnd: () => number, key: FactKey): unknown {
  const spec = FACTS[key];
  if (spec.type === 'enum') return pick(rnd, spec.values);
  if (spec.type === 'number') return spec.range[0] + Math.floor(rnd() * (spec.range[1] - spec.range[0] + 1));
  if (spec.type === 'bool') return rnd() < 0.5;
  const exclusive: readonly string[] = 'exclusive' in spec ? spec.exclusive : [];
  if (exclusive.length > 0 && rnd() < 0.3) return [pick(rnd, exclusive)];
  if (exclusive.length === 0 && rnd() < 0.15) return [];
  const others = spec.values.filter((v) => !exclusive.includes(v));
  return [...new Set([pick(rnd, others), ...(rnd() < 0.4 ? [pick(rnd, others)] : [])])];
}
const factOf = (rnd: () => number, key: FactKey, value: unknown) => {
  const measured = FACTS[key].from === 'measured';
  return { key, value, confidence: measured ? pick<Confidence>(rnd, ['low', 'medium', 'high']) : 'high', source: measured ? 'measured' : 'answered' };
};
const ASKABLE = FACT_KEYS.filter((k) => FACTS[k].from !== 'derived');
const profile = (rnd: () => number): Facts => Object.fromEntries(ASKABLE.filter(() => rnd() < 0.45).map((k) => [k, factOf(rnd, k, valueFor(rnd, k))]));
const ALL_IDS = [...CONTENT.cuts, ...CONTENT.looks].map((i) => i.id);
const eligibleIds = (f: Facts, content = CONTENT): Set<string> => new Set(ALL_IDS.filter((id) => assessIdea(id, f, content)?.excluded.length === 0));
const within = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => [...a].every((x) => b.has(x));

/** The sweep counts go to the test output; the domain project has no DOM or Node types, so `console` is looked up. */
const print = (line: string): void => {
  (globalThis as unknown as { console: { log: (l: string) => void } }).console.log(line);
};

interface Tally { profiles: number; picks: number; plausible: number; excluded: number; referrals: number; failures: string[] }
type Fail = (what: string) => void;

/** A quarter of the profiles answer the colour core like someone who could get "Plausible", so labels are tested too. */
function colourLike(rnd: () => number, f: Facts): Facts {
  const core = { [H]: rnd() < 0.6 ? ['none'] : [pick(rnd, ['home_dye', 'salon_colour', 'bleach'])], [C]: pick(rnd, ['healthy', 'dry']), 'safety.scalp_irritation': 'none', 'colour.natural_level': 1 + Math.floor(rnd() * 10) };
  return { ...f, ...Object.fromEntries(Object.entries(core).map(([k, v]) => [k, factOf(rnd, k as FactKey, v)])) };
}

/** Determinism, then the picks: none excluded or removed, the right kinds, the silhouette cap, the referral. */
function checkPicks(rnd: () => number, f: Facts, t: Tally, fail: Fail): void {
  const kinds = pick<IdeaKind[]>(rnd, [['cut'], ['colour'], ['cut', 'colour']]);
  const options = { kinds, collections: pick(rnd, [[], ['salon'], ['barbering']] as const), count: 1 + Math.floor(rnd() * 8), removed: rnd() < 0.3 ? [pick(rnd, ALL_IDS)] : [] };
  const r = recommend(f, CONTENT, options);
  if (JSON.stringify(recommend(f, CONTENT, options)) !== JSON.stringify(r)) fail('not deterministic');
  const reversed = { ...CONTENT, cuts: [...CONTENT.cuts].reverse(), looks: [...CONTENT.looks].reverse() };
  if (JSON.stringify(recommend(f, reversed, options)) !== JSON.stringify(r)) fail('depends on library order');
  const bad = r.picks.filter((p) => p.excluded.length > 0 || options.removed.includes(p.id) || !kinds.includes(p.kind));
  if (bad.length > 0) fail(`bad picks ${bad.map((p) => p.id).join(', ')}`);
  checkSilhouettes(r, fail);
  const colourLeft = r.picks.some((p) => p.kind === 'colour' && p.label !== 'needs_professional');
  if (r.referral && (r.colourPrompts || colourLeft)) fail('a colour suggestion after the referral');
  t.picks += r.picks.length;
  if (r.referral) t.referrals++;
}

/** At most `max_per_silhouette` of one silhouette unless the selection says it relaxed that cap. */
function checkSilhouettes(r: ReturnType<typeof recommend>, fail: Fail): void {
  const per = new Map<string, number>();
  for (const p of r.picks) if (p.silhouette) per.set(p.silhouette, (per.get(p.silhouette) ?? 0) + 1);
  const capRelaxed = r.relaxed.some((x) => x.relaxed.includes('max_per_silhouette'));
  if (!capRelaxed && [...per.values()].some((v) => v > POLICY.max_per_silhouette)) fail('more than two of one silhouette');
}

/** Plausible means a lift of at most 2 and an empty dependsOn; an unknown history is never plausible. */
function checkLabels(f: Facts, t: Tally, fail: Fail, content = CONTENT): void {
  for (const look of content.looks) {
    const j = assessIdea(look.id, f, content)?.journey;
    if (j?.label !== 'plausible') continue;
    t.plausible++;
    if (j.lift === null || j.lift > 2 || j.dependsOn.length > 0) fail(`${look.id} plausible with lift ${String(j.lift)}, dependsOn ${j.dependsOn.join(',')}`);
    if (!f[H]) fail(`${look.id} plausible with the history unknown`);
  }
}

/** Forgetting an answer never removes an item; stating a limit (a new answer or a set member) never adds one. */
function checkLimits(rnd: () => number, f: Facts, t: Tally, fail: Fail): void {
  const eligible = eligibleIds(f);
  t.excluded += ALL_IDS.length - eligible.size;
  const present = Object.keys(f) as FactKey[];
  const gone = present.length > 0 ? pick(rnd, present) : null;
  if (gone && !within(eligible, eligibleIds(Object.fromEntries(Object.entries(f).filter(([k]) => k !== gone))))) fail(`forgetting ${gone} removed an item`);
  const added = pick(rnd, ASKABLE.filter((k) => !f[k] && FACTS[k].from === 'question'));
  if (!within(eligibleIds({ ...f, [added]: factOf(rnd, added, valueFor(rnd, added)) }), eligible)) fail(`stating ${added} added an eligible item`);
  const sets = present.filter((k) => FACTS[k].type === 'set' && !(f[k]?.value as readonly string[]).includes('none'));
  if (sets.length === 0) return;
  const key = pick(rnd, sets);
  const spec = FACTS[key];
  const member = pick(rnd, spec.type === 'set' ? spec.values.filter((v) => v !== 'none') : []);
  const more = [...new Set([...(f[key]?.value as readonly string[]), member])];
  if (!within(eligibleIds({ ...f, [key]: factOf(rnd, key, more) }), eligible)) fail(`adding ${member} to ${key} added an eligible item`);
}

it('keeps every invariant over 2,000 seeded random profiles', { timeout: 120_000 }, () => {
  const rnd = random(20261108);
  const t: Tally = { profiles: 0, picks: 0, plausible: 0, excluded: 0, referrals: 0, failures: [] };
  for (let n = 0; n < 2000; n++) {
    const f = n % 4 === 0 ? colourLike(rnd, profile(rnd)) : profile(rnd);
    const fail: Fail = (what) => t.failures.push(`profile ${String(n)}: ${what}`);
    checkPicks(rnd, f, t, fail);
    checkLabels(f, t, fail);
    checkLimits(rnd, f, t, fail);
    t.profiles++;
  }
  print(`sweep: ${String(t.profiles)} profiles, ${String(t.picks)} picks, ${String(t.plausible)} plausible labels, ${String(t.excluded)} exclusions, ${String(t.referrals)} referrals, ${String(t.failures.length)} failures`);
  expect(t.failures.slice(0, 5)).toEqual([]);
  // Not vacuous: the sweep met plausible labels, exclusions and referrals.
  expect(Math.min(t.plausible, t.excluded, t.referrals)).toBeGreaterThan(0);
  expect(eligibleIds({})).toEqual(new Set(ALL_IDS));
});

it('catches planted faults, so a clean sweep means something', () => {
  // An exclude on an unknown answer: stating that answer brings the excluded cuts back.
  const swims: RuleFor<'cut'> = { id: 'x01', group: 'C', target: 'cut', effect: 'exclude', when: { 'life.swims_often': { known: false } }, on: { tie_back: { is: true } }, because: 'Planted.', evidence: 'design_logic', review };
  const planted = { ...CONTENT, rules: { ...CONTENT.rules, cut: [...CUT_RULES, swims] } };
  expect(within(eligibleIds(answered({ 'life.swims_often': true }), planted), eligibleIds({}, planted))).toBe(false);
  // Without lift-3-4-any, grey coverage at a lift of 3 is still not plausible: the label itself keeps "Plausible" to a lift of 2.
  const t: Tally = { profiles: 0, picks: 0, plausible: 0, excluded: 0, referrals: 0, failures: [] };
  const noBound = { ...CONTENT, journey: JOURNEY.filter((r) => r.id !== 'lift-3-4-any'), looks: [look('grey-cover-10', 10, { technique: ['grey_coverage'] })] };
  const bleached = core({ [H]: ['bleach'], [CL]: 7, [LCS]: 'months_6_plus', 'hair.texture': 'straight', 'hair.strand': 'medium' });
  checkLabels(bleached, t, (what) => t.failures.push(what), noBound);
  expect(t.failures).toEqual([]);
  expect(label(look('grey-cover-10', 10, { technique: ['grey_coverage'] }), bleached)).toMatchObject({ label: 'uncertain', lift: 3 });
});
