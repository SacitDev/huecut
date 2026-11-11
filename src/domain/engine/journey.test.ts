/**
 * Journey semantics on small record sets written from the journey rules, the referral
 * and reminders, and the search behind point 3 of the plausible check.
 */
import { expect, it } from 'vitest';
import type { Facts } from '../facts/registry.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { JourneyRecord, Match, Question, Referral, Reminder, When } from '../content/types.ts';
import type { JourneyLabel } from '../content/values.ts';
import { lookTraits, type EngineLook } from './derive-traits.ts';
import { deriveFacts } from '../facts/derive.ts';
import { labelLook, referralFor, remindersFor, searchPlausible } from './journey.ts';
import { needsOf } from '../../../tests/engine/fixture-needs.ts';

const answered = (values: Record<string, unknown>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const review = { status: 'checked', date: '2026-11-08' } as const;
const rec = (id: string, label: JourneyLabel, when: When, on?: Match<'colour'>): JourneyRecord =>
  ({ id, effect: 'label', label, when, ...(on ? { on } : {}), because: `Because ${id}.`, what_to_ask: `Ask ${id}.`, evidence: 'design_logic', review });

const H = 'hair.chemical_history';
const LIFT_0_2_VIRGIN = rec('lift-0-2-virgin', 'plausible', { [H]: { is: 'none' }, 'hair.condition': { is: 'healthy' } }, { lift_levels: { range: [0, 2] } });
const LIFT_3_4 = rec('lift-3-4-any', 'uncertain', { [H]: { known: true } }, { lift_levels: { range: [3, 4] } });
const LIFT_5_PLUS = rec('lift-5-plus-any', 'needs_professional', { [H]: { known: true } }, { lift_levels: { range: [5, 9] } });
const GO_DARKER = rec('go-darker-modest', 'plausible', { 'hair.condition': { in: ['healthy', 'dry'] } }, { lift_levels: { range: [-3, -1] } });
const ASH_WARM = rec('ash-from-warm-base', 'uncertain', { 'colour.current_tone': { in: ['warm', 'copper', 'brassy'] } }, { warmth: { is: 'cool' }, lift_levels: { range: [1, 9] } });
const SCALP = rec('scalp-skin-problem', 'needs_professional', { 'safety.scalp_irritation': { is: 'now' } });
const HEALTH = rec('pregnancy-treatment', 'needs_professional', { 'safety.health_context': { is: true } });
const UNKNOWN_HISTORY = rec('unknown-history', 'uncertain', { [H]: { known: false } });
const UNKNOWN_LEVEL = rec('unknown-current-level', 'uncertain', { 'colour.current_level_lengths': { known: false } });
// Two cases with records of their own: a deposit-only base that has to lift, and a lightening placement that is not lighter.
const DEPOSIT_ONLY = rec('deposit-only-lift', 'uncertain', {}, { base_technique: { in: ['gloss', 'demi_refresh'] }, lift_levels: { range: [1, 9] } });
const NOT_LIGHTER = rec('lightening-placement-not-lighter', 'uncertain', {}, { placement_not_lighter: { is: true } });
const SET = [LIFT_0_2_VIRGIN, LIFT_3_4, LIFT_5_PLUS, GO_DARKER, ASH_WARM, SCALP, HEALTH, UNKNOWN_HISTORY, UNKNOWN_LEVEL, DEPOSIT_ONLY, NOT_LIGHTER];

const LOOK_TRAITS: ItemTraits<'colour'> = {
  family: 'blonde', warmth: 'warm', tone: ['honey'], technique: ['balayage'], base_technique: 'none', technique_category: ['placement'], regions: ['mids', 'ends'],
  lightening: 'some', lighter_pieces: true, grey_effect: 'shows', prelightening: false, target_level: 8, root_levels: [0, 0], lengths_levels: [8, 8], upkeep_weeks: [12, 16], vivid: false, salon_only: true,
};
const SHADES = { honey: [7, 8], 'mid-brown': [5, 7], gloss: [6, 6] } as const;
/** A look on the lengths only, at its target level unless the traits say otherwise. */
const look = (id: string, traits: Partial<ItemTraits<'colour'>>, placements: EngineLook['placements'] = []): EngineLook => {
  const level = traits.target_level ?? LOOK_TRAITS.target_level;
  const all: ItemTraits<'colour'> = { ...LOOK_TRAITS, lengths_levels: [level, level], ...traits };
  return { id, kind: 'colour', collections: ['salon'], traits: all, needs: needsOf(all), placements };
};
const HONEY = look('honey-balayage', {}, [{ technique: 'balayage', shade: 'honey' }]);
const label = (l: EngineLook, values: Record<string, unknown>, records: readonly JourneyRecord[] = SET) => {
  const facts = deriveFacts(answered(values));
  return labelLook(lookTraits(l, facts, SHADES), records, facts);
};
const NO_TONE = { [H]: ['none'], 'hair.condition': 'healthy', 'safety.scalp_irritation': 'none' };
const VIRGIN = { ...NO_TONE, 'colour.current_tone': 'neutral' };

it('gives "plausible" from an applying plausible record when nothing more cautious applies or waits', () => {
  const r = label(HONEY, { ...VIRGIN, 'colour.natural_level': 7 });
  expect(r.label).toBe('plausible');
  expect(r.applied.map((a) => a.id)).toEqual(['lift-0-2-virgin']);
  expect(r).toMatchObject({ lift: 1, dependsOn: [] });
});

it('takes the most cautious applying record', () => {
  // Natural 3, target 8: lift 5 applies lift-5-plus-any (needs_professional).
  const r = label(HONEY, { ...VIRGIN, 'colour.natural_level': 3 });
  expect(r.label).toBe('needs_professional');
  expect(r.applied.map((a) => a.id)).toEqual(['lift-5-plus-any']);
  expect(label(HONEY, { ...VIRGIN, 'colour.natural_level': 5 }).label).toBe('uncertain');
});

it('gives "uncertain" when no record applies', () => {
  // Natural 9, an all-over target 8: lift -1 with damaged hair; go-darker-modest needs healthy or dry.
  const r = label(look('all-over-8', { technique: ['all_over'], base_technique: 'all_over', technique_category: ['process'] }), { ...VIRGIN, 'hair.condition': 'damaged', 'colour.natural_level': 9 });
  expect(r.applied).toEqual([]);
  expect(r.label).toBe('uncertain');
});

it('never gives "plausible" on a guess: an unknown more cautious record waits on its fact', () => {
  const cool = look('cool-babylights', { warmth: 'cool', tone: ['ash'], technique: ['babylights'] }, [{ technique: 'babylights', shade: 'honey' }]);
  const r = label(cool, { ...NO_TONE, 'colour.natural_level': 7 });
  expect(r.label).toBe('uncertain');
  expect(r.dependsOn).toEqual(['colour.current_tone']);
  expect(label(cool, { ...VIRGIN, 'colour.current_tone': 'brassy', 'colour.natural_level': 7 }).applied.map((a) => a.id)).toContain('ash-from-warm-base');
  // A warm look fails ash-from-warm-base's on, so the unknown tone does not matter.
  expect(label(HONEY, { ...NO_TONE, 'colour.natural_level': 7 })).toMatchObject({ label: 'plausible', dependsOn: [] });
});

it('never puts the health context in dependsOn, and names it in "what to ask" unless answered no', () => {
  const r = label(HONEY, { ...VIRGIN, 'colour.natural_level': 7 });
  expect(r).toMatchObject({ label: 'plausible', askHealth: true });
  expect(label(HONEY, { ...VIRGIN, 'colour.natural_level': 7, 'safety.health_context': false }).askHealth).toBe(false);
  expect(label(HONEY, { ...VIRGIN, 'colour.natural_level': 7, 'safety.health_context': true }).label).toBe('needs_professional');
});

it('makes an unknown history and an unknown current level uncertain through their known: false records', () => {
  const r = label(HONEY, { 'hair.condition': 'healthy', 'safety.scalp_irritation': 'none', 'colour.natural_level': 7 });
  expect(r.label).toBe('uncertain');
  expect(r.applied.map((a) => a.id)).toEqual(['unknown-history', 'unknown-current-level']);
  expect(r.lift).toBeNull();
  expect(label(HONEY, { ...VIRGIN, [H]: ['salon_colour'], 'colour.natural_level': 7 }).applied.map((a) => a.id)).toEqual(['unknown-current-level']);
});

it('a gloss or demi base that has to lift is uncertain; going darker with it stays plausible', () => {
  const gloss = look('honey-gloss', { technique: ['gloss'], base_technique: 'gloss', technique_category: ['finish'], target_level: 8, lightening: 'none' });
  expect(label(gloss, { ...VIRGIN, 'colour.natural_level': 7 })).toMatchObject({ label: 'uncertain', lift: 1 });
  expect(label(gloss, { ...VIRGIN, 'colour.natural_level': 7 }).applied.map((a) => a.id)).toEqual(['lift-0-2-virgin', 'deposit-only-lift']);
  const demi = look('demi-refresh', { technique: ['demi_refresh'], base_technique: 'demi_refresh', target_level: 6, lightening: 'none' });
  expect(label(demi, { ...VIRGIN, 'colour.natural_level': 7 })).toMatchObject({ label: 'plausible', lift: -1, dependsOn: [] });
});

it('a lightening placement whose shade is not lighter than the hair is uncertain', () => {
  const brown = look('mid-brown-balayage', { target_level: 7 }, [{ technique: 'balayage', shade: 'mid-brown' }]);
  // mid-brown tops out at 7: on level 7 hair the balayage is not lighter; on level 6 hair it is.
  const same = label(brown, { ...VIRGIN, 'colour.natural_level': 7 });
  expect(same.label).toBe('uncertain');
  expect(same.applied.map((a) => a.id)).toEqual(['lift-0-2-virgin', 'lightening-placement-not-lighter']);
  expect(label(brown, { ...VIRGIN, 'colour.natural_level': 6 })).toMatchObject({ label: 'plausible', lift: 1, dependsOn: [] });
  // Unknown current level: the not-lighter record's on is unknown, so it waits for that level (an unknown trait is never read as no caution).
  const unknown = label(brown, { ...VIRGIN, [H]: ['salon_colour'], 'colour.natural_level': 6 });
  expect(unknown).toMatchObject({ label: 'uncertain', dependsOn: ['colour.current_level_lengths'] });
  expect(unknown.applied.map((a) => a.id)).toEqual(['unknown-current-level']);
});

const REFERRAL: Referral = { id: 'dye-reaction-referral', kind: 'referral', when: { 'safety.dye_reaction': { in: ['mild', 'serious'] } }, text: 'Ask a doctor first.', replaces_suggestions: true, review };
const HENNA: Referral = { id: 'black-henna-reaction', kind: 'referral', when: { 'colour.henna_type': { is: 'tattoo' } }, text: 'Ask a doctor first.', replaces_suggestions: true, review };
const SKIN: Reminder = { id: 'skin-test', kind: 'reminder', applies_to: 'every_colour_look', text: 'Skin test.', review };
const STRAND: Reminder = { id: 'strand-test', kind: 'reminder', on: { lightening: { is: 'always' } }, text: 'Strand test.', review };

it('applies the referral after a reaction to hair dye or a black henna tattoo, never on an unknown', () => {
  expect(referralFor([SKIN, REFERRAL, HENNA], answered({ 'safety.dye_reaction': 'mild' }))?.id).toBe('dye-reaction-referral');
  expect(referralFor([SKIN, REFERRAL, HENNA], answered({ 'safety.dye_reaction': 'none', 'colour.henna_type': 'tattoo' }))?.id).toBe('black-henna-reaction');
  expect(referralFor([SKIN, REFERRAL, HENNA], answered({ 'safety.dye_reaction': 'none' }))).toBeNull();
  expect(referralFor([SKIN, REFERRAL, HENNA], answered({}))).toBeNull();
});

it('shows reminders on every look or where their on matches', () => {
  expect(remindersFor([SKIN, STRAND, REFERRAL], LOOK_TRAITS).map((r) => r.id)).toEqual(['skin-test']);
  expect(remindersFor([SKIN, STRAND, REFERRAL], { ...LOOK_TRAITS, lightening: 'always' }).map((r) => r.id)).toEqual(['skin-test', 'strand-test']);
});

const q = (id: string, fact: Question['fact'], type: Question['type'], values: readonly (string | number | null)[], extra: Partial<Question> = {}): Question => ({
  id, ...(fact ? { fact } : {}), type, goals: ['colour'], collections: ['salon', 'barbering'], prompt: id,
  options: values.map((value) => ({ value, label: String(value) })), ...extra,
});
const CORE: Question[] = [
  q('natural-level', 'colour.natural_level', 'single', [1, 4, 7, 9, null]),
  q('chemical-history', H, 'multi', ['none', 'home_dye', 'bleach', null]),
  q('current-level', 'colour.current_level_lengths', 'single', [3, 6, 9, null], { show_if: { [H]: { not: ['none'] } } }),
  q('hair-condition', 'hair.condition', 'single', ['healthy', 'dry', 'damaged', null]),
  { id: 'dye-reaction', type: 'single', goals: ['colour'], collections: ['salon', 'barbering'], prompt: 'dye',
    options: [{ label: 'none', sets: { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none' } }, { label: 'mild', sets: { 'safety.dye_reaction': 'mild' } }, { value: null, label: 'Not sure' }] },
  q('budget', 'pref.budget', 'single', ['low', 'high']),
];
const BASE_SET = [LIFT_0_2_VIRGIN, LIFT_3_4, LIFT_5_PLUS, GO_DARKER, SCALP, UNKNOWN_HISTORY, UNKNOWN_LEVEL];

it('finds a core-answers profile that labels a look "Plausible" and reports it as the witness', () => {
  const s = searchPlausible({ core: CORE, improve: [], looks: [HONEY], journey: BASE_SET, shadeLevels: SHADES });
  expect(s.complete).toBe(true);
  expect(s.violations).toEqual([]);
  expect(s.witness?.lookId).toBe('honey-balayage');
  // Options in order: natural level 1 with a history of none derives level 1, lift 7 (needs_professional, cut); with
  // home dye, current level 3 lifts 5 (cut) and 6 lifts 2, which no record applies to; level 9 lifts -1, and
  // go-darker-modest with healthy hair and a fine scalp makes it plausible.
  const w = s.witness?.facts ?? {};
  expect([w['colour.natural_level']?.value, w[H]?.value, w['colour.current_level_lengths']?.value, w['hair.condition']?.value, w['safety.scalp_irritation']?.value])
    .toEqual([1, ['home_dye'], 9, 'healthy', 'none']);
  expect(w['pref.budget']).toBeUndefined();
});

it('reports no witness when no core profile can reach "Plausible", after searching every branch', () => {
  // Without hair.condition in the core set, lift-0-2-virgin and go-darker-modest can never apply.
  const noCondition = CORE.filter((x) => x.id !== 'hair-condition');
  const s = searchPlausible({ core: noCondition, improve: [], looks: [HONEY], journey: BASE_SET, shadeLevels: SHADES });
  expect(s).toMatchObject({ witness: null, complete: true, violations: [] });
  // A cautious record on every look whose fact the set never asks waits on it in every profile.
  const toneOnEveryLook = rec('tone-on-every-look', 'uncertain', { 'colour.current_tone': { in: ['warm', 'copper', 'brassy'] } });
  const s2 = searchPlausible({ core: CORE, improve: [], looks: [HONEY], journey: [...BASE_SET, toneOnEveryLook], shadeLevels: SHADES });
  expect(s2).toMatchObject({ witness: null, complete: true });
});

it('stops at the profile budget and says the search did not finish', () => {
  const noCondition = CORE.filter((x) => x.id !== 'hair-condition');
  const s = searchPlausible({ core: noCondition, improve: [], looks: [HONEY], journey: [LIFT_0_2_VIRGIN], shadeLevels: SHADES }, 3);
  expect(s).toMatchObject({ witness: null, complete: false, profiles: 3 });
});

it('asks a follow-up under the option that opens it, and only then', () => {
  const grey = q('grey-amount', 'colour.grey_percent', 'single', [0, 40]);
  const direction: Question = { ...q('colour-direction', 'pref.colour_direction', 'single', []), options: [{ value: 'grey', label: 'Grey', follow_up: 'grey-amount' }] };
  const coverage = rec('grey-coverage', 'plausible', { 'colour.grey_percent': { range: [1, 100] } }, { technique: { is: 'grey_coverage' } });
  const covered = look('grey-cover', { technique: ['grey_coverage'], family: 'brunette', target_level: 5 });
  // With a history of none and natural level 5 the lift is 0, so a "Plausible" grey coverage is a valid witness.
  const lift = [q('natural-level', 'colour.natural_level', 'single', [5]), q('chemical-history', H, 'multi', ['none'])];
  const s = searchPlausible({ core: [...lift, direction], improve: [grey], looks: [covered], journey: [coverage], shadeLevels: SHADES });
  expect(s.witness?.facts['colour.grey_percent']?.value).toBe(40);
  expect(searchPlausible({ core: [...lift, direction], improve: [], looks: [covered], journey: [coverage], shadeLevels: SHADES }).witness).toBeNull();
});

it('takes no witness that breaks an invariant: an unknown lift is never "Plausible", so none is found and none is reported', () => {
  const coverage = rec('grey-coverage', 'plausible', {}, { technique: { is: 'grey_coverage' } });
  const covered = look('grey-cover', { technique: ['grey_coverage'], family: 'brunette', target_level: 5 });
  const s = searchPlausible({ core: [q('budget', 'pref.budget', 'single', ['low'])], improve: [], looks: [covered], journey: [coverage], shadeLevels: SHADES });
  expect(s).toMatchObject({ witness: null, complete: true });
  expect(s.violations).toEqual([]);
  // The same record on a look whose lift is unknown: the label waits for the levels it needs.
  const waiting = labelLook(lookTraits(covered, {}, SHADES), [coverage], {});
  expect(waiting.label).toBe('uncertain');
  expect(waiting.dependsOn).toContain('colour.current_level_lengths');
});
