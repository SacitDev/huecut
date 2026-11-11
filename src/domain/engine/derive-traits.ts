/**
 * Per-person traits and cut feasibility (engine stage 2). Each per-person trait is unknown, so left out, while a fact it reads is
 * unknown (three-valued).
 */
import type { FactKey, Facts, FactValue, Range } from '../facts/registry.ts';
import { TRAITS, type ItemTraits, type PersonTraits } from '../content/traits.ts';
import type { Bands, Placement, Policy } from '../content/types.ts';
import type { CutIndexEntry, LookIndexEntry, LookLab, ShadeNeed } from '../content/output.ts';
import type { FitValue, TechniqueValue } from '../content/values.ts';
import { usable } from './match.ts';

/** A cut as the engine reads it: the index entry's traits, fits and required length; its beard pairings when known. */
export type EngineCut = Pick<CutIndexEntry, 'id' | 'kind' | 'collections' | 'traits' | 'texture_fit' | 'density_fit' | 'required_cm'> & Partial<Pick<CutIndexEntry, 'pairs_with'>>;
/** A colour look as the engine reads it: its build traits, the shades it needs, its placements (`placement_not_lighter`) and, when known, its swatch colours. */
export type EngineLook = Pick<LookIndexEntry, 'id' | 'kind' | 'collections' | 'traits' | 'needs'> & {
  readonly placements: readonly Pick<Placement, 'technique' | 'shade'>[];
  readonly lab?: LookLab;
};
/** Each shade's `[min, max]` level, by shade id. */
export type ShadeLevels = Readonly<Record<string, Range>>;
/** What feasibility reads beyond the cut and the facts: the length bands and the growth rate; `EngineContent` fits as it is. */
export interface Reach { readonly lengthBands: Bands['current_length_cm']; readonly policy: Pick<Policy, 'growth_cm_per_month'> }

const FIT_ORDER: readonly FitValue[] = TRAITS.cut.texture_fit.values;
/** Where a length sits on one scale: a collarbone cut (`bob`) sits with shoulder-length hair, so the two compare equal; a buzz is below the shortest hair. */
const POSITION: Readonly<Record<string, number>> = { buzz: 0, very_short: 1, short: 2, chin: 3, bob: 4, shoulder: 4, long: 5, very_long: 6 };
/** Classes set by zone lengths (stretched centimetres) when a cut has no landmark; the others are landmarks, where the hair sits. */
const ZONE_CLASSES: ReadonlySet<string> = new Set(['buzz', 'very_short', 'short']);
/** The placements meant to be lighter than the hair they sit on. */
export const LIGHTENING_PLACEMENTS: ReadonlySet<TechniqueValue> = new Set<TechniqueValue>([
  'balayage', 'foilayage', 'foil_highlights', 'babylights', 'money_piece', 'ombre', 'sombre',
]);

const num = (facts: Facts, key: FactKey): number | undefined => usable(facts, key) as number | undefined;

/** The fit for a texture; `mixed` takes the less good of the wavy and curly fits, with both notes. */
function textureFit(cut: EngineCut, texture: FactValue<'hair.texture'>): { fit: FitValue; notes: string[] } {
  const parts = texture === 'mixed' ? [cut.texture_fit.wavy, cut.texture_fit.curly] : [cut.texture_fit[texture]];
  const fit = parts.reduce<FitValue>((worst, p) => (FIT_ORDER.indexOf(p.fit) > FIT_ORDER.indexOf(worst) ? p.fit : worst), 'good');
  return { fit, notes: parts.flatMap((p) => (p.note === undefined ? [] : [p.note])) };
}

/** Where the hair sits now, to compare with a landmark: the resting length when known and not longer than the stretched one. */
function sitsNow(facts: Facts): FactValue<'hair.current_length'> | undefined {
  const stretched = usable(facts, 'hair.current_length') as FactValue<'hair.current_length'> | undefined;
  const resting = usable(facts, 'hair.resting_length') as FactValue<'hair.resting_length'> | undefined;
  return stretched === undefined || resting === undefined || (POSITION[resting] ?? 0) > (POSITION[stretched] ?? 0) ? stretched : resting;
}

/** Length positions from the hair now to the cut (negative: the cut is shorter); `null` while the length is unknown. */
function classesFrom(cut: EngineCut, facts: Facts): number | null {
  const now = ZONE_CLASSES.has(cut.traits.length_class) ? (usable(facts, 'hair.current_length') as string | undefined) : sitsNow(facts);
  return now === undefined ? null : (POSITION[cut.traits.length_class] ?? 0) - (POSITION[now] ?? 0);
}

/** The record's notes for a `poor` texture fit, empty when it has none; `null` for any other or an unknown fit. */
export function poorFitNotes(cut: EngineCut, facts: Facts): readonly string[] | null {
  const texture = usable(facts, 'hair.texture') as FactValue<'hair.texture'> | undefined;
  if (texture === undefined) return null;
  const { fit, notes } = textureFit(cut, texture);
  return fit === 'poor' ? notes : null;
}

/** Length positions between the cut and the current length; `null` while that length is unknown. */
export function lengthSteps(cut: EngineCut, facts: Facts): number | null {
  const steps = classesFrom(cut, facts);
  return steps === null ? null : Math.abs(steps);
}

/** Length positions the cut takes off today; a cut that needs the hair to grow takes nothing off. `null` while the length is unknown. */
export function shorterSteps(cut: EngineCut, facts: Facts): number | null {
  const steps = classesFrom(cut, facts);
  return steps === null ? null : Math.max(0, -steps);
}

/** The person's length classes, shortest first; from the shoulder down the back and sides hang at the length too. */
const LENGTHS: readonly FactValue<'hair.current_length'>[] = ['very_short', 'short', 'chin', 'shoulder', 'long', 'very_long'];

/** Under 2 cm a part is clipped, so hair to the chin or beyond loses length there whatever its zones say. */
const CLIPPED_MM = 20;

/**
 * The cut leaves a visible zone shorter than the hair is now, such as a mullet's top or an undercut's back, in stretched cm:
 * the top against the length class now; the back and a salon cut's sides against it on hair to the shoulder or beyond, and against
 * the class below on shorter hair, which sits shorter at the back by the head's shape; and any clipped part on hair to the chin or beyond.
 */
function cutsAZone(cut: EngineCut, facts: Facts, bands: Bands['current_length_cm']): boolean {
  const now = usable(facts, 'hair.current_length') as FactValue<'hair.current_length'> | undefined;
  if (now === undefined) return false;
  const at = LENGTHS.indexOf(now);
  const back = at >= LENGTHS.indexOf('shoulder') ? now : (LENGTHS[at - 1] ?? now);
  const clipped = at >= LENGTHS.indexOf('chin') && cut.traits.scalp_mm < CLIPPED_MM;
  return clipped || cut.traits.top_cm[1] < bands[now][0] || cut.traits.hang_cm < bands[back][0];
}

/**
 * `texture_fit`, `daily_styling`, `density_fit`, `length_change`, `length_direction` and `trim_times` for this person. The length
 * change counts length classes; it goes shorter when the class does, or when a visible zone ends below the hair's length now.
 */
export function cutPersonTraits(cut: EngineCut, facts: Facts, bands: Bands['current_length_cm']): PersonTraits<'cut'> {
  const texture = usable(facts, 'hair.texture') as FactValue<'hair.texture'> | undefined;
  const density = usable(facts, 'hair.density') as FactValue<'hair.density'> | undefined;
  const trim = num(facts, 'life.trim_weeks_ok');
  const steps = classesFrom(cut, facts);
  const out: { -readonly [K in keyof PersonTraits<'cut'>]: PersonTraits<'cut'>[K] } = {};
  if (texture !== undefined) out.texture_fit = textureFit(cut, texture).fit;
  // `mixed` reads both of its textures, as the fit does.
  if (texture !== undefined) out.daily_styling = (texture === 'mixed' ? [cut.texture_fit.wavy, cut.texture_fit.curly] : [cut.texture_fit[texture]]).some((f) => f.daily === true);
  if (density !== undefined) out.density_fit = cut.density_fit[density].fit;
  if (trim !== undefined) out.trim_times = trim / cut.traits.trim_weeks[1];
  if (steps !== null) {
    const apart = Math.abs(steps);
    out.length_change = apart <= 1 ? 'small' : apart === 2 ? 'medium' : 'large';
    out.length_direction = steps < 0 || cutsAZone(cut, facts, bands) ? 'shorter' : steps === 0 ? 'same' : 'longer';
  }
  return out;
}

/**
 * The colour traits for this person, each region on its own: the lengths against their level now, the roots against
 * the natural level, so an unknown level in one region never hides what is known in the other; roots the look leaves alone change by 0.
 * Every shade the look needs is judged on its own with its technique's lift on that hair: the regrowth is never coloured; the
 * lengths are when the history says so. `lift_levels` and `darkens_by` are the most over both regions, unknown while either is;
 * `known_lift` the most over the regions that are known. `contrast_with_natural` from the levels the look shows.
 */
export function lookPersonTraits(look: EngineLook, facts: Facts, shadeLevels: ShadeLevels): PersonTraits<'colour'> {
  const lengths = num(facts, 'colour.current_level_lengths');
  const natural = num(facts, 'colour.natural_level');
  const roots = look.needs.roots.length > 0;
  // Roots the look leaves alone change by 0, whatever is known.
  const atRoots = !roots ? UNTREATED : natural === undefined ? null : regionChange(look.needs.roots, natural, 'natural');
  const atLengths = lengthsChange(look.needs.lengths, lengths, usable(facts, 'hair.chemical_history') as readonly string[] | undefined);
  const tops = look.placements.filter((p) => LIGHTENING_PLACEMENTS.has(p.technique)).map((p) => shadeLevels[p.shade]?.[1]);
  const reached = [...(atLengths?.reached ?? look.traits.lengths_levels), ...(roots ? (atRoots?.reached ?? look.traits.root_levels) : [])];
  return {
    ...liftTraits(atRoots, atLengths, roots),
    ...capabilityTraits(look, facts, atRoots, atLengths, roots),
    ...(lengths !== undefined && tops.every((t) => t !== undefined) ? { placement_not_lighter: tops.some((t) => t <= lengths) } : {}),
    ...(natural !== undefined ? { contrast_with_natural: contrast(reached, natural) } : {}),
  };
}

/** What a look does to one region of hair (see `regionChange`). */
interface Change {
  readonly now: number; readonly need: number; readonly darken: number; readonly low: number;
  /** What the technique's lift decides; unknown where the history decides it and the two outcomes differ. */
  readonly lift: number | undefined; readonly top: number | undefined; readonly reached: readonly number[] | undefined;
  readonly reaches: boolean | undefined; readonly darker: boolean | undefined;
}
/** Roots the look leaves alone: no change, nothing to reach. */
const UNTREATED: Change = { now: 0, need: 0, lift: 0, darken: 0, low: 0, top: 0, reached: [], reaches: true, darker: false };

/** `reaches_shade`, `ends_darker` and `roots_from_worn`, each left out while unknown. */
function capabilityTraits(look: EngineLook, facts: Facts, atRoots: Change | null, atLengths: Change | null, roots: boolean): PersonTraits<'colour'> {
  const grey = look.traits.grey_effect === 'shows' ? num(facts, 'colour.grey_percent') : 0;
  const reaches = reachesShade([atRoots, atLengths], grey);
  // Some region the look treats ends a level or more darker; that none ends lighter is the lifting rules' part.
  const darker = anyOf([...(roots ? [atRoots] : []), atLengths].map((r) => r?.darker));
  const fromWorn = roots ? rootsFromWorn(atRoots, num(facts, 'colour.current_level_lengths')) : 0;
  return {
    ...(reaches !== undefined ? { reaches_shade: reaches } : {}), ...(darker !== undefined ? { ends_darker: darker } : {}),
    ...(fromWorn !== undefined ? { roots_from_worn: fromWorn } : {}),
  };
}

/** Three-valued "all" and "any". */
const allOf = (each: readonly (boolean | undefined)[]): boolean | undefined => (each.includes(false) ? false : each.every((x) => x === true) ? true : undefined);
const anyOf = (each: readonly (boolean | undefined)[]): boolean | undefined => (each.includes(true) ? true : each.every((x) => x === false) ? false : undefined);

/**
 * Whether a look reaches every shade it needs, or, for a look that shows the person's own grey, finds grey to show where
 * the hair cannot take it (`grey` 0 for any other look). Unknown while a level it needs, or that grey, is unknown.
 */
function reachesShade(regions: readonly (Change | null)[], grey: number | undefined): boolean | undefined {
  const onGrey = grey === undefined ? undefined : grey > 0;
  return allOf(regions.map((r) => (r?.reaches === true || onGrey === true ? true : r?.reaches === false ? onGrey : undefined)));
}

/**
 * How far treated roots end from the nearer of the natural level and the lengths' level: a retouch matches the colour worn or
 * keeps the regrowth's depth; a shade the roots cannot take leaves them as they are. Unknown while either level is.
 */
function rootsFromWorn(atRoots: Change | null, worn: number | undefined): number | undefined {
  if (atRoots === null || worn === undefined) return undefined;
  const [low, top] = atRoots.reaches === true ? [atRoots.low, atRoots.top ?? atRoots.now] : [atRoots.now, atRoots.now];
  const off = (level: number): number => Math.max(0, top - level, level - low);
  return Math.min(off(atRoots.now), off(worn));
}

/** Each region's lift and darkening, the most over both while both are known, and the most over those that are. */
function liftTraits(atRoots: Change | null, atLengths: Change | null, roots: boolean): PersonTraits<'colour'> {
  const known = [atLengths?.lift, ...(roots ? [atRoots?.lift] : [])].filter((l): l is number => l !== undefined);
  return {
    ...(atRoots?.lift !== undefined ? { roots_lift: atRoots.lift, roots_darken: atRoots.darken } : {}),
    ...(atLengths ? { lengths_darken: atLengths.darken, ...(atLengths.lift !== undefined ? { lengths_lift: atLengths.lift } : {}) } : {}),
    // The journey's number keeps the lift the shade would need, so "a gloss cannot supply the lightening" can still be said.
    ...(atRoots && atLengths ? { lift_levels: Math.max(atLengths.need, roots ? atRoots.need : -9), darkens_by: Math.max(atLengths.darken, atRoots.darken) } : {}),
    ...(known.length > 0 ? { known_lift: Math.max(...known) } : {}),
  };
}

/**
 * The lengths: never-coloured ones take a technique's lift on natural hair, coloured ones its lift there. While the history is
 * unknown, whatever both outcomes agree on is known and only what differs is unknown; lengths the look leaves alone change by 0.
 */
function lengthsChange(needs: readonly ShadeNeed[], now: number | undefined, history: readonly string[] | undefined): Change | null {
  if (now === undefined) return null;
  if (needs.length === 0) return UNTREATED;
  if (history !== undefined) return regionChange(needs, now, history.length === 1 && history[0] === 'none' ? 'natural' : 'coloured');
  const [a, b] = [regionChange(needs, now, 'natural'), regionChange(needs, now, 'coloured')];
  const same = <K extends 'lift' | 'top' | 'reached' | 'reaches' | 'darker'>(k: K): Change[K] => (JSON.stringify(a[k]) === JSON.stringify(b[k]) ? a[k] : undefined);
  return { ...a, lift: same('lift'), top: same('top'), reached: same('reached'), reaches: same('reaches'), darker: same('darker') };
}

/**
 * How a region goes from its level now, each shade it needs on its own: a shade lands only if its deepest level is within its
 * technique's lift of the hair, and ends no lighter than the hair plus that lift. `need`, the lift to the lightest level; `lift`, what
 * the region really does; `darken`, to the deepest level of a shade that takes hair down; `darker`, the region ends a level or more
 * below the hair, wherever its deepest shade is; `reached`, the levels it shows (a shade the hair cannot take shows as itself, on grey if at all).
 */
function regionChange(needs: readonly ShadeNeed[], now: number, kind: keyof ShadeNeed['lifts']): Change {
  const ends = needs.map((n) => Math.min(n.level[1], now + n.lifts[kind]));
  const takes = needs.map((n) => n.level[0] <= now + n.lifts[kind]);
  const darkening = needs.filter((n) => n.darkens);
  const low = Math.min(...(darkening.length > 0 ? darkening : needs).map((n) => n.level[0]));
  const top = Math.max(...ends);
  return {
    now, need: Math.max(...needs.map((n) => n.level[1])) - now, lift: top - now, darken: Math.max(0, now - low), low, top,
    reached: needs.flatMap((n, i) => (takes[i] ? [n.level[0], ends[i] ?? n.level[1]] : [...n.level])), reaches: takes.every(Boolean), darker: top <= now - 1,
  };
}

/** How far the look's furthest level is from the natural level: within one level low, within three medium, else high. */
function contrast(levels: readonly number[], natural: number): NonNullable<PersonTraits<'colour'>['contrast_with_natural']> {
  const apart = Math.max(...levels.map((l) => Math.abs(l - natural)));
  return apart <= 1 ? 'low' : apart <= 3 ? 'medium' : 'high';
}

/** Item traits with the person's traits laid over them, as rule matches read them: a cut's growth to wait for, and what it shares with the cuts tapped. */
export const cutTraits = (cut: EngineCut, facts: Facts, reach: Reach & { readonly cuts?: readonly EngineCut[] }): ItemTraits<'cut'> & PersonTraits<'cut'> =>
  ({ ...cut.traits, ...cutPersonTraits(cut, facts, reach.lengthBands), ...growthTraits(feasibility(cut, facts, reach.lengthBands, reach.policy)), ...(reach.cuts ? likedTraits(cut, facts, reach.cuts) : {}) });
export const lookTraits = (look: EngineLook, facts: Facts, shadeLevels: ShadeLevels): ItemTraits<'colour'> & PersonTraits<'colour'> =>
  ({ ...look.traits, ...lookPersonTraits(look, facts, shadeLevels) });

/** Engine stage 2 for a cut. Never "not with this hair"; recession and shrinkage stay advisory. */
export interface Feasibility {
  /** `null` when the current length is unknown: no length line, and "depends on your current length". */
  readonly length: { readonly status: 'today' } | { readonly status: 'after_growth'; readonly cm: number; readonly weeks: number | null } | null;
  /** A texture or density fit of `adapt` for this person, with the item's note. */
  readonly adapting: readonly { readonly what: 'texture' | 'density'; readonly note: string | null }[];
  /** The one line shown: after growth, else needs adapting, else today; `null` when nothing is known. */
  readonly status: 'today' | 'after_growth' | 'needs_adapting' | null;
  readonly dependsOn: readonly FactKey[];
}

/** The texture and density fits of `adapt` for this person, with the item's notes. */
function adaptingFor(cut: EngineCut, facts: Facts): Feasibility['adapting'] {
  const texture = usable(facts, 'hair.texture') as FactValue<'hair.texture'> | undefined;
  const density = usable(facts, 'hair.density') as FactValue<'hair.density'> | undefined;
  const t = texture === undefined ? null : textureFit(cut, texture);
  const d = density === undefined ? null : cut.density_fit[density];
  return [
    ...(t?.fit === 'adapt' ? [{ what: 'texture' as const, note: t.notes.length > 0 ? t.notes.join(' ') : null }] : []),
    ...(d?.fit === 'adapt' ? [{ what: 'density' as const, note: d.note ?? null }] : []),
  ];
}

/**
 * Feasibility of a cut: what it needs against the middle of the person's bands in `bands.json`, as "today" or "needs about
 * N cm more" (whole cm, weeks only with a growth rate), and the fits. A band is a range of people, so "today" promises only what the
 * middle of it can do, give or take a month's growth. Curls with no resting answer get no "today" for a shape with a landmark: that would be a guess.
 */
export function feasibility(cut: EngineCut, facts: Facts, lengthBands: Bands['current_length_cm'], policy: Pick<Policy, 'growth_cm_per_month'>): Feasibility {
  const length = usable(facts, 'hair.current_length') as FactValue<'hair.current_length'> | undefined;
  const adapting = adaptingFor(cut, facts);
  const measured = length === undefined ? null : lengthLine(stillToGrow(cut, length, facts, lengthBands), policy.growth_cm_per_month);
  const guess = measured?.status === 'today' && sitsAtAGuess(cut, facts, lengthBands);
  const line = guess ? null : measured;
  const status = line?.status === 'after_growth' ? 'after_growth' : adapting.length > 0 ? 'needs_adapting' : (line?.status ?? null);
  return { length: line, adapting, status, dependsOn: line !== null ? [] : guess ? ['hair.resting_length'] : ['hair.current_length'] };
}

/** What a cut needs: the lower end of its longest zone, and at least where its length class starts. */
const lengthNeeded = (cut: EngineCut, bands: Bands['current_length_cm']): number => Math.max(cut.required_cm, classStart(cut.traits.length_class, bands));

const middle = ([low, high]: Range): number => (low + high) / 2;

/** Curls with no resting answer and a landmark to reach: a stretched length cannot say where such hair sits; it does answer a zone class. */
function sitsAtAGuess(cut: EngineCut, facts: Facts, bands: Bands['current_length_cm']): boolean {
  const texture = usable(facts, 'hair.texture');
  return (texture === 'curly' || texture === 'coily') && usable(facts, 'hair.resting_length') === undefined
    && !ZONE_CLASSES.has(cut.traits.length_class) && classStart(cut.traits.length_class, bands) > 0;
}

/**
 * Stretched centimetres still to grow, reading each band at its middle. Zones, and the classes they set, are stretched, so they compare
 * with the stretched length; a landmark is where the hair sits, and a curl lifts it in proportion, so a gap there takes more
 * growth than its own size.
 */
function stillToGrow(cut: EngineCut, length: FactValue<'hair.current_length'>, facts: Facts, bands: Bands['current_length_cm']): number {
  const have = middle(bands[length]);
  if (ZONE_CLASSES.has(cut.traits.length_class)) return lengthNeeded(cut, bands) - have;
  const resting = usable(facts, 'hair.resting_length') as FactValue<'hair.resting_length'> | undefined;
  const sits = resting === undefined ? have : Math.min(middle(bands[resting]), have);
  return Math.max(lengthNeeded(cut, bands) - have, (classStart(cut.traits.length_class, bands) - sits) * (have / sits));
}

/** Today, or how much more it needs. A month's growth is the next appointment, not a wait. */
function lengthLine(short: number, rate: number | null | undefined): NonNullable<Feasibility['length']> {
  if (short <= (rate ?? 0)) return { status: 'today' };
  const cm = Math.ceil(short);
  return { status: 'after_growth', cm, weeks: rate ? Math.ceil(((cm / rate) * 52) / 12) : null };
}

/** Where a length class starts: a chin-length shape needs hair to the chin, whatever its longest zone says. A bob is cut at the chin; a class with no band of its own (a buzz) adds nothing to what its zones need. */
function classStart(c: string, bands: Bands['current_length_cm']): number {
  const starts: Readonly<Partial<Record<string, readonly [number, number]>>> = bands;
  return starts[c === 'bob' ? 'chin' : c]?.[0] ?? 0;
}

/** The per-person `liked` trait: which traits the cut shares with the looks the person tapped. */
export function likedTraits(cut: EngineCut, facts: Facts, cuts: readonly EngineCut[]): PersonTraits<'cut'> {
  const ids = usable(facts, 'wish.liked_cuts') as readonly string[] | undefined;
  if (ids === undefined) return {};
  const tapped = cuts.filter((c) => ids.includes(c.id));
  return { liked: TRAITS.cut.liked.values.filter((k) => tapped.some((c) => c.traits[k] === cut.traits[k])) };
}

/** The per-person `growth_weeks` trait from a cut's feasibility: unknown without a length or a growth rate. */
export function growthTraits(f: Feasibility): PersonTraits<'cut'> {
  if (f.length === null) return {};
  if (f.length.status === 'today') return { growth_weeks: 0 };
  // Held at the declared most (20 years), so a rule's range on it still holds a growth far beyond that.
  return f.length.weeks === null ? {} : { growth_weeks: Math.min(f.length.weeks, TRAITS.cut.growth_weeks.range[1]) };
}
