/** Per-person traits and cut feasibility, with values worked out from the rule texts. */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { Bands } from '../content/types.ts';
import { cutPersonTraits, feasibility, growthTraits, lengthSteps, lookPersonTraits, poorFitNotes, shorterSteps, type EngineCut, type EngineLook } from './derive-traits.ts';
import { needsOf } from '../../../tests/engine/fixture-needs.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));

const CUT_TRAITS: ItemTraits<'cut'> = {
  length_class: 'bob', top_length: 'long', top_cm: [12, 20], scalp_mm: 300, hang_cm: 25, sides: 'none', height_top: 'low', volume_zone: ['ends'], sides_width: 'full',
  perimeter: 'blunt', part: 'side', fringe: 'none', layers: ['none'], silhouette: 'bob', weight_removal: 'low', cut_method: ['point_cut'],
  nape_style: 'blunt', shrinkage_risk: 'medium', tension: 'none', heat_dependent: false, grow_out_friendly: true, tie_back: true,
  covers_forehead: false, covers_ears: true, tucked_behind_ear: false, beard_blend: false, lineup: false, styling_minutes: [5, 10],
  trim_weeks: [6, 8], tags: [],
};
const cut = (over: Partial<EngineCut> = {}): EngineCut => ({
  id: 'test-bob', kind: 'cut', collections: ['salon'], traits: CUT_TRAITS, required_cm: 12,
  texture_fit: { straight: { fit: 'good' }, wavy: { fit: 'good', note: 'Wavy note.' }, curly: { fit: 'adapt', note: 'Curly note.' }, coily: { fit: 'poor' } },
  density_fit: { low: { fit: 'good' }, medium: { fit: 'good' }, high: { fit: 'adapt', note: 'Remove bulk.' } },
  ...over,
});
const LOOK_TRAITS: ItemTraits<'colour'> = {
  family: 'blonde', warmth: 'warm', tone: ['honey'], technique: ['root_shadow', 'balayage'], base_technique: 'none', technique_category: ['placement'],
  regions: ['root', 'mids', 'ends'], lightening: 'some', lighter_pieces: true, grey_effect: 'shows', prelightening: false, target_level: 8, root_levels: [0, 0], lengths_levels: [7, 8], upkeep_weeks: [12, 16], vivid: false, salon_only: true,
};
const look = (placements: EngineLook['placements']): EngineLook => ({ id: 'test-look', kind: 'colour', collections: ['salon'], traits: LOOK_TRAITS, needs: needsOf(LOOK_TRAITS), placements });
/** The look with other traits, its needs following them. */
const withTraits = (traits: ItemTraits<'colour'>): EngineLook => ({ ...look([]), traits, needs: needsOf(traits) });
const SHADES = { 'honey-blonde': [7, 8], 'mid-brown': [5, 7], 'dark-brown': [3, 4] } as const;
const BANDS: Bands['current_length_cm'] = { very_short: [0, 3], short: [3, 8], chin: [8, 15], shoulder: [15, 25], long: [25, 40], very_long: [40, 100] };

it('gives the texture fit for the person, and for mixed hair the less good of wavy and curly', () => {
  expect(cutPersonTraits(cut(), answered({ 'hair.texture': 'straight' }), BANDS).texture_fit).toBe('good');
  expect(cutPersonTraits(cut(), answered({ 'hair.texture': 'coily' }), BANDS).texture_fit).toBe('poor');
  expect(cutPersonTraits(cut(), answered({ 'hair.texture': 'mixed' }), BANDS).texture_fit).toBe('adapt');
  expect(cutPersonTraits(cut(), answered({}), BANDS).texture_fit).toBeUndefined();
});

it('measures the length change in length positions and its direction, a collarbone cut sitting with shoulder-length hair', () => {
  // Positions buzz 0, very_short 1, short 2, chin 3, bob and shoulder 4, long 5, very_long 6: bob is the shoulder's own position,
  // two below very_long and two above short.
  expect(cutPersonTraits(cut(), answered({ 'hair.current_length': 'shoulder' }), BANDS)).toEqual({ length_change: 'small', length_direction: 'same' });
  expect(cutPersonTraits(cut(), answered({ 'hair.current_length': 'very_long' }), BANDS)).toEqual({ length_change: 'medium', length_direction: 'shorter' });
  expect(cutPersonTraits(cut(), answered({ 'hair.current_length': 'short' }), BANDS)).toEqual({ length_change: 'medium', length_direction: 'longer' });
  expect(cutPersonTraits(cut({ traits: { ...CUT_TRAITS, length_class: 'chin' } }), answered({ 'hair.current_length': 'chin' }), BANDS))
    .toEqual({ length_change: 'small', length_direction: 'same' });
});

it('computes lift on the lengths as the lightest level put there minus their level, unknown with that level', () => {
  expect(lookPersonTraits(look([]), answered({ 'colour.current_level_lengths': 6 }), SHADES)).toMatchObject({ lift_levels: 2, lengths_lift: 2, darkens_by: 0 });
  expect(lookPersonTraits(look([]), answered({ 'colour.current_level_lengths': 9 }), SHADES)).toMatchObject({ lift_levels: -1, lengths_lift: -1, darkens_by: 2 });
  // Roots the look leaves alone change by 0 whatever is known; whether its shades show waits for the lengths.
  expect(lookPersonTraits(look([]), answered({}), SHADES)).toEqual({ roots_lift: 0, roots_darken: 0, roots_from_worn: 0 });
});

it('reads the roots a look treats from the natural level and takes the greatest lift; a missing natural level leaves it unknown', () => {
  const rooted = (root_levels: readonly [number, number], lightening: 'none' | 'some' = 'some'): EngineLook => withTraits({ ...LOOK_TRAITS, root_levels, lightening });
  // Highlights from the root at 7-9 over black roots and bleached lengths: the lengths need nothing, the roots 8 levels.
  const roots = rooted([7, 9]);
  expect(lookPersonTraits(roots, answered({ 'colour.current_level_lengths': 9, 'colour.natural_level': 1 }), SHADES)).toMatchObject({ lift_levels: 8, lengths_lift: -1 });
  // Each region on its own: the lengths stay known when the natural level is not, so the combined lift stays unknown.
  expect(lookPersonTraits(roots, answered({ 'colour.current_level_lengths': 9 }), SHADES)).toEqual({ lengths_lift: -1, lengths_darken: 2, known_lift: -1, ends_darker: true, placement_not_lighter: false });
  expect(lookPersonTraits(roots, answered({ 'colour.natural_level': 1 }), SHADES)).toMatchObject({ roots_lift: 8, roots_darken: 0 });
  // A dark root counts as darkening, with or without lightener elsewhere; "darker" leaves lightened looks out by their lightener.
  expect(lookPersonTraits(rooted([3, 4]), answered({ 'colour.current_level_lengths': 8, 'colour.natural_level': 6 }), SHADES)).toMatchObject({ lift_levels: 0, roots_darken: 3, darkens_by: 3 });
  expect(lookPersonTraits(rooted([3, 4], 'none'), answered({ 'colour.current_level_lengths': 8, 'colour.natural_level': 6 }), SHADES)).toMatchObject({ darkens_by: 3 });
  // Contrast reads the furthest level, roots included: soft-black roots are 3 from a natural 6.
  expect(lookPersonTraits(rooted([3, 4]), answered({ 'colour.natural_level': 6 }), SHADES).contrast_with_natural).toBe('medium');
});

it('sets placement_not_lighter when a lightening placement shade tops out at or below the current level', () => {
  const balayage = look([{ technique: 'root_shadow', shade: 'dark-brown' }, { technique: 'balayage', shade: 'mid-brown' }]);
  // mid-brown tops out at 7: not lighter than level 7 hair, lighter than level 6 hair.
  expect(lookPersonTraits(balayage, answered({ 'colour.current_level_lengths': 7 }), SHADES).placement_not_lighter).toBe(true);
  expect(lookPersonTraits(balayage, answered({ 'colour.current_level_lengths': 6 }), SHADES).placement_not_lighter).toBe(false);
  // A root shadow is not a lightening placement, so its dark shade does not count.
  expect(lookPersonTraits(look([{ technique: 'root_shadow', shade: 'dark-brown' }]), answered({ 'colour.current_level_lengths': 6 }), SHADES).placement_not_lighter).toBe(false);
  expect(lookPersonTraits(look([{ technique: 'babylights', shade: 'unknown-shade' }]), answered({ 'colour.current_level_lengths': 6 }), SHADES).placement_not_lighter).toBeUndefined();
  expect(lookPersonTraits(balayage, answered({}), SHADES).placement_not_lighter).toBeUndefined();
});

it('grades contrast with the natural level: within 1, 2-3, 4 or more', () => {
  expect(lookPersonTraits(look([]), answered({ 'colour.natural_level': 7 }), SHADES).contrast_with_natural).toBe('low');
  expect(lookPersonTraits(look([]), answered({ 'colour.natural_level': 5 }), SHADES).contrast_with_natural).toBe('medium');
  expect(lookPersonTraits(look([]), answered({ 'colour.natural_level': 4 }), SHADES).contrast_with_natural).toBe('high');
});

it('finds a cut feasible today when the middle of the band reaches what it needs', () => {
  // 12 cm needed: the shoulder band's middle is 20 cm; the chin band's is 11.5 cm, so only its top end could reach it.
  const f = feasibility(cut(), answered({ 'hair.current_length': 'shoulder' }), BANDS, { growth_cm_per_month: null });
  expect(f).toEqual({ length: { status: 'today' }, adapting: [], status: 'today', dependsOn: [] });
  expect(feasibility(cut(), answered({ 'hair.current_length': 'chin' }), BANDS, { growth_cm_per_month: null }).length).toEqual({ status: 'after_growth', cm: 1, weeks: null });
});

it('treats a month of growth as today: it is the next appointment', () => {
  expect(feasibility(cut(), answered({ 'hair.current_length': 'chin' }), BANDS, { growth_cm_per_month: 1 }).length).toEqual({ status: 'today' });
});

it('needs at least where the cut\'s length class starts, whatever its longest zone says', () => {
  // The record's longest zone is only 2 cm, but it is a chin-length shape: the chin band starts at 8 cm.
  const chinShape = cut({ required_cm: 2, traits: { ...CUT_TRAITS, length_class: 'chin' } });
  expect(feasibility(chinShape, answered({ 'hair.current_length': 'very_short' }), BANDS, { growth_cm_per_month: null }).length).toEqual({ status: 'after_growth', cm: 7, weeks: null });
  expect(feasibility(cut({ required_cm: 0.5, traits: { ...CUT_TRAITS, length_class: 'buzz' } }), answered({ 'hair.current_length': 'very_short' }), BANDS, { growth_cm_per_month: null }).length).toEqual({ status: 'today' });
});

it('reads a length class with no band of its own as needing only what its zones say', () => {
  const later = cut({ required_cm: 70, traits: { ...CUT_TRAITS, length_class: 'waist' as unknown as EngineCut['traits']['length_class'] } });
  expect(feasibility(later, answered({ 'hair.current_length': 'very_long' }), BANDS, { growth_cm_per_month: 1 }).length).toEqual({ status: 'today' });
});

it('counts only the length a cut takes off as change: growing longer is not a change made in the chair', () => {
  expect(shorterSteps(cut({ traits: { ...CUT_TRAITS, length_class: 'short' } }), answered({ 'hair.current_length': 'long' }))).toBe(3);
  expect(shorterSteps(cut({ traits: { ...CUT_TRAITS, length_class: 'long' } }), answered({ 'hair.current_length': 'short' }))).toBe(0);
  expect(shorterSteps(cut(), answered({}))).toBeNull();
});

it('says how many cm more length a cut needs, in whole cm, and weeks only with a growth rate', () => {
  // 12 cm needed, the short band's middle is 5.5 cm: 6.5, rounded up to 7 cm more.
  expect(feasibility(cut(), answered({ 'hair.current_length': 'short' }), BANDS, { growth_cm_per_month: null }).length)
    .toEqual({ status: 'after_growth', cm: 7, weeks: null });
  // 12.5 cm: 7 cm; at 1.25 cm a month that is 5.6 months, 52 / 12 * 5.6 = 24.27, so 25 weeks.
  expect(feasibility(cut({ required_cm: 12.5 }), answered({ 'hair.current_length': 'short' }), BANDS, { growth_cm_per_month: 1.25 }).length)
    .toEqual({ status: 'after_growth', cm: 7, weeks: 25 });
});

it('marks a cut that needs adapting, with the notes, and never "not with this hair"', () => {
  const f = feasibility(cut(), answered({ 'hair.current_length': 'shoulder', 'hair.texture': 'mixed', 'hair.density': 'high' }), BANDS, { growth_cm_per_month: null });
  expect(f.status).toBe('needs_adapting');
  expect(f.adapting).toEqual([{ what: 'texture', note: 'Wavy note. Curly note.' }, { what: 'density', note: 'Remove bulk.' }]);
  const poor = feasibility(cut(), answered({ 'hair.current_length': 'shoulder', 'hair.resting_length': 'shoulder', 'hair.texture': 'coily' }), BANDS, { growth_cm_per_month: null });
  expect(poor.status).toBe('today');
});

it('gives the record\'s notes for a poor fit only, and leaves the status as it was', () => {
  const notes = { coily: { fit: 'poor', note: 'Not suited.' }, wavy: { fit: 'poor' }, straight: { fit: 'good' }, curly: { fit: 'adapt', note: 'Curly note.' } } as const;
  expect(poorFitNotes(cut({ texture_fit: notes }), answered({ 'hair.texture': 'coily' }))).toEqual(['Not suited.']);
  expect(poorFitNotes(cut({ texture_fit: notes }), answered({ 'hair.texture': 'wavy' }))).toEqual([]);
  expect(poorFitNotes(cut({ texture_fit: notes }), answered({ 'hair.texture': 'curly' }))).toBeNull();
  expect(poorFitNotes(cut({ texture_fit: notes }), answered({}))).toBeNull();
});

it('counts the length classes between the cut and the current length, and nothing when that is unknown', () => {
  expect(lengthSteps(cut(), answered({ 'hair.current_length': 'very_long' }))).toBe(2);
  expect(lengthSteps(cut(), answered({ 'hair.current_length': 'short' }))).toBe(2);
  expect(lengthSteps(cut(), answered({}))).toBeNull();
});

it('gives the weeks of growth as a trait: 0 today, unknown without a length or a growth rate', () => {
  const at = (length: string, rate: number | null) => growthTraits(feasibility(cut(), answered({ 'hair.current_length': length }), BANDS, { growth_cm_per_month: rate }));
  expect(at('shoulder', 1)).toEqual({ growth_weeks: 0 });
  // 12 cm needed, the short band's middle is 5.5 cm: 7 cm, 7 months at 1 cm, 52 / 12 * 7 = 30.33, so 31 weeks.
  expect(at('short', 1)).toEqual({ growth_weeks: 31 });
  expect(at('short', null)).toEqual({});
  expect(growthTraits(feasibility(cut(), answered({}), BANDS, { growth_cm_per_month: 1 }))).toEqual({});
});

it('gives no length line for an unknown current length and says it depends on it', () => {
  expect(feasibility(cut(), answered({}), BANDS, { growth_cm_per_month: null })).toEqual({ length: null, adapting: [], status: null, dependsOn: ['hair.current_length'] });
  expect(feasibility(cut(), answered({ 'hair.current_length': 'short', 'hair.density': 'high' }), BANDS, { growth_cm_per_month: null }).status).toBe('after_growth');
});

const SHRINKS = { 'hair.texture': 'curly', 'hair.current_length': 'shoulder' } as const;
const reach = (over: Record<string, unknown>, c = cut(), rate: number | null = null) => feasibility(c, answered({ ...SHRINKS, ...over }), BANDS, { growth_cm_per_month: rate }).length;

it('compares the zones with the stretched length and the length class with where the hair sits', () => {
  // The bob's class starts at the chin band (8 cm). Sitting at the chin it is there today.
  expect(reach({ 'hair.resting_length': 'chin' })).toEqual({ status: 'today' });
  // Sitting short (middle 5.5) of a stretched 20: 2.5 cm of landmark needs 2.5 x 20 / 5.5 = 9.1 cm of real growth, because the curl takes its share.
  expect(reach({ 'hair.resting_length': 'short' })).toEqual({ status: 'after_growth', cm: 10, weeks: null });
  expect(reach({ 'hair.resting_length': 'short' }, cut(), 1)).toEqual({ status: 'after_growth', cm: 10, weeks: 44 });
});

it('promises no reach on a guess: curls with no resting answer get no "today" for a cut that needs a landmark', () => {
  const f = feasibility(cut(), answered(SHRINKS), BANDS, { growth_cm_per_month: 1 });
  expect(f.length).toBeNull();
  expect(f.dependsOn).toEqual(['hair.resting_length']);
  expect(reach({ 'hair.texture': 'coily' })).toBeNull();
  expect(growthTraits(f)).toEqual({});
  // Hair that does not spring up, and a shape with no landmark, keep their line; a stretched shortfall is still a shortfall.
  expect(reach({ 'hair.texture': 'wavy' })).toEqual({ status: 'today' });
  expect(reach({}, cut({ required_cm: 1, traits: { ...CUT_TRAITS, length_class: 'buzz' } }))).toEqual({ status: 'today' });
  expect(reach({}, cut({ required_cm: 40 }))).toEqual({ status: 'after_growth', cm: 20, weeks: null });
});

it('reads a resting length longer than the stretched one as the stretched one', () => {
  expect(reach({ 'hair.current_length': 'chin', 'hair.resting_length': 'long' }, cut({ required_cm: 5 }))).toEqual({ status: 'today' });
});

it('counts a change of length from where the hair sits, so a curly cut at its own landmark is no big chop', () => {
  const chin = cut({ traits: { ...CUT_TRAITS, length_class: 'chin' } });
  const sits = answered({ 'hair.texture': 'coily', 'hair.current_length': 'very_long', 'hair.resting_length': 'chin' });
  expect([shorterSteps(chin, sits), lengthSteps(chin, sits), cutPersonTraits(chin, sits, BANDS).length_change]).toEqual([0, 0, 'small']);
  // A resting answer longer than the stretched one is read as the stretched one: shoulder is one position above chin.
  expect(shorterSteps(chin, answered({ 'hair.current_length': 'shoulder', 'hair.resting_length': 'very_long' }))).toBe(1);
  // A class set by zone lengths (stretched centimetres) compares with the stretched length, whatever the curl rests at.
  const crop = cut({ traits: { ...CUT_TRAITS, length_class: 'very_short' } });
  expect(cutPersonTraits(crop, answered({ 'hair.texture': 'coily', 'hair.current_length': 'short', 'hair.resting_length': 'very_short' }), BANDS).length_direction).toBe('shorter');
});

it('gives the density fit and how many of the cut\'s longest trim intervals go into the stated one', () => {
  expect(cutPersonTraits(cut(), answered({ 'hair.density': 'high', 'life.trim_weeks_ok': 12 }), BANDS)).toEqual({ density_fit: 'adapt', trim_times: 1.5 });
});

it('a zone-measured short class reads the stretched length only: no growth for curls resting very short, and no guess', () => {
  const short = cut({ required_cm: 4, traits: { ...CUT_TRAITS, length_class: 'short' } });
  expect(reach({ 'hair.resting_length': 'very_short' }, short)).toEqual({ status: 'today' });
  expect(reach({}, short)).toEqual({ status: 'today' });
  // A landmark still compares with where the hair rests.
  expect(reach({ 'hair.resting_length': 'very_short' })).toMatchObject({ status: 'after_growth' });
});

it('a look without lightener reaches its shade only on hair at or lighter than it, or on grey for a look that shows it', () => {
  const deposit = (levels: readonly [number, number], grey_effect: ItemTraits<'colour'>['grey_effect'] = 'tints'): EngineLook =>
    withTraits({ ...LOOK_TRAITS, lightening: 'none', lighter_pieces: false, grey_effect, root_levels: levels, lengths_levels: levels });
  const at = (natural: number, extra: Record<string, unknown> = {}) => answered({ 'colour.natural_level': natural, 'colour.current_level_lengths': natural, ...extra });
  // Pale on dark cannot show, never "no change"; at its own depth it lands and lifts nothing.
  expect(lookPersonTraits(deposit([9, 10]), at(6), SHADES)).toMatchObject({ reaches_shade: false, lengths_lift: 0, lengths_darken: 0 });
  expect(lookPersonTraits(deposit([9, 10]), at(9), SHADES)).toMatchObject({ reaches_shade: true, lengths_lift: 0, lift_levels: 1 });
  // Unknown while a level is.
  expect(lookPersonTraits(deposit([9, 10]), answered({ 'colour.natural_level': 9 }), SHADES).reaches_shade).toBeUndefined();
  // A silver gloss shows on grey: with grey, without it, and while the grey amount is not said.
  expect(lookPersonTraits(deposit([7, 10], 'shows'), at(3, { 'colour.grey_percent': 40 }), SHADES)).toMatchObject({ reaches_shade: true, contrast_with_natural: 'high', lengths_lift: 0 });
  expect(lookPersonTraits(deposit([7, 10], 'shows'), at(3, { 'colour.grey_percent': 0 }), SHADES).reaches_shade).toBe(false);
  expect(lookPersonTraits(deposit([7, 10], 'shows'), at(3), SHADES).reaches_shade).toBeUndefined();
});

it('the roots are judged against the nearer of the natural level and the colour worn on the lengths', () => {
  const darkRoots = withTraits({ ...LOOK_TRAITS, lightening: 'none', lighter_pieces: false, root_levels: [3, 4], lengths_levels: [3, 4] });
  // A retouch to dyed level 3 over a natural 6: within one level of the colour worn.
  expect(lookPersonTraits(darkRoots, answered({ 'colour.natural_level': 6, 'colour.current_level_lengths': 3 }), SHADES).roots_from_worn).toBe(1);
  // Undyed natural 6: three levels from both.
  expect(lookPersonTraits(darkRoots, answered({ 'colour.natural_level': 6, 'colour.current_level_lengths': 6 }), SHADES).roots_from_worn).toBe(3);
  expect(lookPersonTraits(darkRoots, answered({ 'colour.natural_level': 6 }), SHADES).roots_from_worn).toBeUndefined();
});

it('growing out reads every visible zone: a short top or, on hanging hair, a short back or side makes a cut shorter', () => {
  const zones = (top: readonly [number, number], hang: number) => cut({ traits: { ...CUT_TRAITS, length_class: 'shoulder', top_cm: top, hang_cm: hang } });
  const now = (length: string) => answered({ 'hair.current_length': length });
  // Shoulder (15-25 in these bands): a top ending at 10 is shorter; the same top on chin-length hair (8-15) is not.
  expect(cutPersonTraits(zones([5, 10], 30), now('shoulder'), BANDS).length_direction).toBe('shorter');
  expect(cutPersonTraits(zones([5, 10], 30), now('chin'), BANDS).length_direction).toBe('longer');
  // A back ending at 12 is shorter on shoulder hair; on chin hair the back is read a class shorter (short: 3-8), so it is not.
  expect(cutPersonTraits(zones([20, 30], 12), now('shoulder'), BANDS).length_direction).toBe('shorter');
  expect(cutPersonTraits(zones([20, 30], 12), now('chin'), BANDS).length_direction).toBe('longer');
  expect(cutPersonTraits(zones([20, 30], 2), now('chin'), BANDS).length_direction).toBe('shorter');
  expect(cutPersonTraits(zones([20, 30], 30), now('shoulder'), BANDS).length_direction).toBe('same');
});
