/**
 * How well an eligible idea suits this person. Hard limits are exclusions before this runs; here
 * the rule score is one factor, each practical preference one more, and the face one bounded factor; an unknown input is neutral.
 * The factors decide the order; they are never shown as a number, and nothing here is a verdict on a face.
 */
import type { LookLab } from '../content/output.ts';
import type { ItemTraits, PersonTraits } from '../content/traits.ts';
import type { Suitability } from '../content/suitability.ts';
import type { JourneyLabel } from '../content/values.ts';
import type { FactValue, Facts } from '../facts/registry.ts';
import type { EngineCut, Feasibility } from './derive-traits.ts';
import { REASON_WORDS, type ReasonWords } from './explain.ts';
import { usable } from './match.ts';

/** How a cut's framing relates to the person's own proportions; `between` is the house default with no wish. */
export type FrameAim = 'soften' | 'between' | 'preserve' | 'emphasise';

/** Each multiplied factor of a cut; absent means its input is unknown, so neutral. */
export interface CutFactors {
  readonly rules: number;
  readonly texture?: number;
  readonly density?: number;
  readonly trim?: number;
  readonly styling?: number;
  readonly growth?: number;
  readonly change?: number;
}

/**
 * A stated limit a cut misses that the person may accept: more styling or more trims than they said, or a growth wait when
 * they are not growing out. `factor` is the miss's own practical factor, so the smallest miss is the largest product.
 */
export type TradeOff =
  | { readonly what: 'styling'; readonly minutes: number; readonly factor: number }
  | { readonly what: 'trim'; readonly weeks: readonly [number, number]; readonly factor: number }
  | { readonly what: 'growth'; readonly weeks: number | null; readonly factor: number };

/** What a cut adds to the face, as fractions of the face length. */
export interface HairShape { readonly width: number; readonly height: number; readonly fringe: number; readonly jaw: number }

/** The face-frame result: the aim in play (a stated wish, else the house aim) and its factor. */
export interface FrameFit { readonly aims: readonly FrameAim[]; readonly at: readonly number[] }

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const product = (o: object): number => Object.values(o as Readonly<Record<string, number>>).reduce((a, b) => a * b, 1);
const bell = (x: number, centre: number, sigma: number): number => Math.exp(-0.5 * ((x - centre) / sigma) ** 2);

/** The rule score as one factor, bounded so a long list of small wins cannot buy a cut its practical fit lacks. */
export const rulesFactor = (r: number, s: Pick<Suitability['rules'], 'tau' | 'cap'>): number => Math.exp(clamp(r, -s.cap, s.cap) / s.tau);

/** A stated limit as a factor: 1 within it; beyond it a step down (`miss`), then the size of the miss, with a floor. */
const limitFactor = (ratio: number, s: { readonly power: number; readonly floor: number; readonly miss: number }): number =>
  ratio >= 1 ? 1 : Math.max(s.floor, s.miss * ratio ** s.power);

/**
 * The practical factors of a cut: texture and density fit, trim, styling time, growth and the size of the change (`steps`: classes
 * taken off today). A poor fit is an exclusion; a missed trim interval, styling time or growth wait is a trade-off.
 */
export function cutFactors(cut: EngineCut, traits: Pick<PersonTraits<'cut'>, 'texture_fit' | 'density_fit'>, feasible: Feasibility, steps: number | null, facts: Facts, points: number, s: Suitability): CutFactors {
  const stated = usable(facts, 'life.trim_weeks_ok') as number | undefined;
  const minutes = usable(facts, 'life.styling_minutes') as number | undefined;
  const amount = usable(facts, 'pref.change_amount') as FactValue<'pref.change_amount'> | undefined;
  const weeks = feasible.length?.status === 'after_growth' ? feasible.length.weeks : null;
  const row = s.change[amount ?? 'unknown'];
  const known: readonly (readonly [keyof CutFactors, number | undefined])[] = [
    ['texture', traits.texture_fit && s.texture_fit[traits.texture_fit]],
    ['density', traits.density_fit && s.density_fit[traits.density_fit]],
    ['trim', stated && limitFactor(cut.traits.trim_weeks[1] / stated, s.trim)],
    ['styling', minutes === undefined ? undefined : limitFactor((minutes + s.styling.grace_minutes) / (cut.traits.styling_minutes[0] + s.styling.grace_minutes), s.styling)],
    ['growth', weeks === null ? undefined : Math.exp(-weeks / s.growth_weeks)],
    ['change', steps === null ? undefined : (row[Math.min(steps, row.length - 1)] ?? 1)],
  ];
  return { rules: rulesFactor(points, s.rules), ...Object.fromEntries(known.filter(([, v]) => v !== undefined)) };
}

/** The trade-offs a cut misses, read from the factors that measured them; a growth wait counts only for someone not growing out. */
export function tradeOffsOf(cut: EngineCut, feasible: Feasibility, f: CutFactors, facts: Facts): TradeOff[] {
  const later = feasible.length?.status === 'after_growth' ? feasible.length : null;
  return [
    ...(f.styling !== undefined && f.styling < 1 ? [{ what: 'styling', minutes: cut.traits.styling_minutes[0], factor: f.styling } as const] : []),
    ...(f.trim !== undefined && f.trim < 1 ? [{ what: 'trim', weeks: cut.traits.trim_weeks, factor: f.trim } as const] : []),
    ...(later && usable(facts, 'life.grow_out_goal') !== true ? [{ what: 'growth', weeks: later.weeks, factor: f.growth ?? 1 } as const] : []),
  ];
}

/**
 * What the cut adds around the face, from its traits and scaled by texture (curls stand out further than straight hair): width at the
 * sides and at jaw level, height on top and length falling past the chin, and a fringe that shortens the face.
 */
export function hairShape(t: ItemTraits<'cut'>, facts: Facts, s: Suitability['frame']): HairShape {
  const texture = usable(facts, 'hair.texture') as FactValue<'hair.texture'> | undefined;
  const k = texture ? s.texture[texture] : 1;
  // What a volume zone adds when the cut has it.
  const zone = (z: (typeof t.volume_zone)[number], adds: number): number => (t.volume_zone.includes(z) ? adds : 0);
  return {
    width: k * ((s.sides[t.sides_width] ?? 0) + zone('sides', s.zones.sides) + zone('temples', s.zones.temples) + zone('jaw', s.zones.jaw)),
    height: k * ((s.height[t.height_top] ?? 0) + Math.max(zone('crown', s.zones.crown), zone('root_lift', s.zones.crown))) + (s.length[t.length_class] ?? 0),
    fringe: s.fringe[t.fringe] ?? 0,
    jaw: k * (zone('jaw', s.zones.jaw) + zone('ends', s.zones.ends)),
  };
}

/** The target of the apparent proportion for an aim; `soften` is the disclosed house preference, never a claim about faces. */
export const aimTarget = (aim: FrameAim, own: number, balance: number, push: number): number =>
  aim === 'soften' ? balance : aim === 'preserve' ? own : aim === 'emphasise' ? own + (own - balance) * push : (own + balance) / 2;

/**
 * The aim in play: the proportion wish ("evens out", "keeps", "plays up my proportions"), else the house's own. Concrete wishes
 * (fullness at the sides, height, a line at the jaw) act through their rules as stated, never through the face.
 */
export function frameAims(facts: Facts, s: Suitability['frame']): readonly FrameAim[] | null {
  if (usable(facts, 'face.width_to_length') === undefined) return null;
  const overall = usable(facts, 'wish.overall_balance') as FrameAim | undefined;
  return overall ? [overall] : s.no_wish_aims.slice(0, 1);
}

/** The apparent width to length of a face with this hair (and, for a beard, its extra width and chin). */
export const apparentRatio = (w: number, h: HairShape, beard = { width: 0, chin: 0 }): number =>
  (w + 2 * h.width + beard.width) / (1 + h.height - h.fringe + beard.chin);

/** The jaw to cheek number the frame may read: at high confidence, or at medium only in the clear cases outside `jaw_clear`. */
function jawOf(facts: Facts, s: Suitability['frame']): number | undefined {
  const jaw = usable(facts, 'face.jaw_to_cheek') as number | undefined;
  if (jaw === undefined) return undefined;
  return facts['face.jaw_to_cheek']?.confidence === 'high' || jaw < s.jaw_clear[0] || jaw > s.jaw_clear[1] ? jaw : undefined;
}

/**
 * The forehead reading with no wish about the forehead: a taller forehead favours a fringe, a shorter one a light fringe over
 * a heavy one. `null` when not read; `thirds.miss` for a cut against it.
 */
function foreheadPart(t: ItemTraits<'cut'>, facts: Facts, s: Suitability['frame']): number | null {
  const forehead = usable(facts, 'wish.forehead') === undefined ? usable(facts, 'face.forehead_share') : undefined;
  if (forehead === undefined) return null;
  return (forehead === 'longer' && t.fringe === 'none') || (forehead === 'shorter' && s.thirds.heavy_fringes.includes(t.fringe)) ? s.thirds.miss : 1;
}

/**
 * The lower-third and wide-jaw readings with no wish about the jaw or chin: a longer lower third favours length and
 * volume at the jaw, a wider jaw soft ends past it, and neither a blunt chin-length line. `null` when neither is read; per reading,
 * `thirds.miss` for a blunt chin-length line and half of it for a cut that does not do what the reading favours.
 */
function jawLinePart(t: ItemTraits<'cut'>, facts: Facts, s: Suitability['frame']): number | null {
  if (usable(facts, 'wish.jaw') !== undefined || usable(facts, 'wish.chin') !== undefined) return null;
  const lower = usable(facts, 'face.lower_share');
  const wideJaw = (jawOf(facts, s) ?? 0) > s.jaw_clear[1];
  if (lower === undefined && !wideJaw) return null;
  const blunt = t.perimeter === 'blunt' && t.length_class === 'chin';
  const part = (read: boolean, favoured: boolean): number => (!read ? 1 : blunt ? s.thirds.miss : favoured ? 1 : (1 + s.thirds.miss) / 2);
  const atJaw = ['chin', 'bob', 'shoulder'].includes(t.length_class) && t.volume_zone.some((z) => z === 'jaw' || z === 'ends');
  const softPastJaw = ['bob', 'shoulder', 'long', 'very_long'].includes(t.length_class) && t.perimeter === 'soft';
  return part(lower === 'longer', atJaw) * part(wideJaw, softPastJaw);
}

/** The forehead, lower-third and wide-jaw readings in one value; `null` when none is read. */
function thirdsPart(t: ItemTraits<'cut'>, facts: Facts, s: Suitability['frame']): number | null {
  const fore = foreheadPart(t, facts, s);
  const jaw = jawLinePart(t, facts, s);
  return fore === null && jaw === null ? null : (fore ?? 1) * (jaw ?? 1);
}

/**
 * The frame factor per aim, all the face's readings in one bounded value: the apparent width to length, the jaw in clear cases, and
 * for a cut the forehead and lower third (they count without a width, from a close-up say); `null` when nothing is read, so the factor stays neutral.
 */
export function frameFit(h: HairShape, facts: Facts, s: Suitability['frame'], beard?: { readonly width: number; readonly chin: number; readonly jaw: number; readonly sigma: number }, cut?: ItemTraits<'cut'>): FrameFit | null {
  const w = usable(facts, 'face.width_to_length') as number | undefined;
  const thirds = cut ? thirdsPart(cut, facts, s) : null;
  if (w === undefined && thirds === null) return null;
  const aims = frameAims(facts, s) ?? s.no_wish_aims.slice(0, 1);
  const jawRaw = jawOf(facts, s);
  const b = beard ?? { width: 0, chin: 0, jaw: 0, sigma: s.sigma };
  const rest = thirds ?? 1;
  // The apparent jaw to cheek with this hair (and beard).
  const j = (jawToCheek: number, width: number): number => (width * jawToCheek + 2 * h.jaw + b.jaw) / (width + 2 * h.width + b.width);
  const at = aims.map((aim) => {
    if (w === undefined) return s.floor + (1 - s.floor) * rest;
    const ratioPart = bell(apparentRatio(w, h, b), aimTarget(aim, w, s.balance, s.emphasise), b.sigma);
    const jawPart = jawRaw === undefined ? 1 : bell(j(jawRaw, w), aimTarget(aim, jawRaw, s.jaw_balance, s.emphasise), s.jaw_sigma);
    return s.floor + (1 - s.floor) * ratioPart * jawPart * rest;
  });
  return { aims, at };
}

/** What the cut does, in words of the policy joined by `both`: at most two, named from its traits and never from the face. */
export function frameWords(t: ItemTraits<'cut'>, words: Suitability['because']['does'], both: ReasonWords['both'] = REASON_WORDS.both): string {
  const zone = (z: (typeof t.volume_zone)[number]): boolean => t.volume_zone.includes(z);
  const height = heightWord(t.height_top, zone('crown') || zone('root_lift'), words);
  const width = t.sides_width === 'close' ? words.sides_close : t.sides_width === 'full' || zone('sides') ? words.adds_width : null;
  const parts = [height, width, t.fringe !== 'none' && (height === null || width === null) ? words.fringe_line : null].flatMap((x) => x ?? []).slice(0, 2);
  return parts.length === 0 ? words.balanced : both(parts);
}

/** What the top does: a high top, or a medium one lifted at the crown, adds height; a flat or low one keeps the top low. */
function heightWord(height: string, lifted: boolean, words: Suitability['because']['does']): string | null {
  if (height === 'high' || (height === 'medium' && lifted)) return words.adds_height;
  return height === 'flat' || height === 'low' ? words.keeps_top_low : null;
}

/** The base suitability: every factor but the frame multiplied. */
export const baseFit = (f: CutFactors): number => product(f);

/**
 * The face's say in the order: one moderate rule's worth at medium and at high, shared by every face reading. What flatters
 * comes after what was asked and what the hair can do, so it chooses only among cuts already right on those.
 */
export function frameFactor(u: number, frame: Pick<Suitability['frame'], 'floor'>, rules: Pick<Suitability['rules'], 'tau'>, moderate: number): number {
  const least = Math.exp(-moderate / rules.tau);
  return least + (1 - least) * ((u - frame.floor) / (1 - frame.floor));
}

/**
 * Colour order, as a written policy: stated wishes first (the rule score), the journey label as a multiplier. One moderate or
 * strong preference outweighs the step from Plausible to Uncertain; it takes two strong ones to outweigh Best done by a colourist.
 * At equal preference and label the smaller change in level comes first. Labels themselves are never changed here.
 */
export const lookFit = (rulesPoints: number, label: JourneyLabel | null, lift: number | null, s: Suitability['colour']): number =>
  rulesFactor(rulesPoints, s) * s.label[label ?? 'uncertain'] * (lift === null ? 1 : Math.exp(-Math.abs(lift) * s.lift_step));

/** The tie-break between looks of equal suitability: warmth of the swatches against an undertone the person confirmed. */
export function harmony(lab: LookLab | undefined, facts: Facts, s: Suitability['colour']['harmony']): number {
  const undertone = usable(facts, 'look.undertone') as FactValue<'look.undertone'> | undefined;
  if (!lab || !undertone || facts['look.undertone']?.source !== 'answered') return 0;
  const parts = [lab.root, lab.mids, lab.ends].flatMap((b) => (b ? [b.mid[2] - s.lightness * b.mid[0]] : []));
  if (parts.length === 0) return 0;
  return bell(parts.reduce((a, b) => a + b, 0) / parts.length, s.targets[undertone], s.sigma);
}
