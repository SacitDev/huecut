/**
 * The closed trait lists rules match on: cut, colour-look and beard traits.
 * Each trait is authored per item, derived at build (`by: 'build'`) or derived per person (`by: 'person'`).
 */
import { bool, num, oneOf, setOf, type Range, type SpecValue, type ValueSpec } from '../facts/registry.ts';

/** A `[min, max]` attribute of an item, such as styling minutes; a `range` test passes only if all of it fits. */
export const range = <const O extends object = object>(min: number, max: number, options: O = {} as O) =>
  ({ type: 'range', range: [min, max], ...options }) as const;

export interface RangeSpec { readonly type: 'range'; readonly range: Range }

/** Who sets a trait: the author (default), the build, or the engine per person from the facts in `reads`. */
export type TraitBy = 'authored' | 'build' | 'person';
export type TraitSpec = (ValueSpec | RangeSpec) & {
  readonly by?: 'build' | 'person';
  /** Per-person traits: the facts they are computed from; unknown when any of them is. */
  readonly reads?: readonly string[];
};

const BUILD = { by: 'build' } as const;

export const TRAITS = {
  cut: {
    length_class: oneOf(['buzz', 'very_short', 'short', 'chin', 'bob', 'shoulder', 'long', 'very_long'], BUILD),
    /** From `zones.top`: under 2 cm, 2-5 cm, 5-10 cm, over 10 cm. */
    top_length: oneOf(['very_short', 'short', 'medium', 'long'], BUILD),
    /** `zones.top` in cm, so a top-length answer is compared with the cut's real range. */
    top_cm: range(0, 100, BUILD),
    /** The shortest exposed length in mm (top, sides, back, nape, a fade's start or a nape undercut): below a few mm the scalp shows. */
    scalp_mm: num(0, 1000, BUILD),
    /** The length the hanging zones keep, in cm: the shortest upper end of the back and, on a salon cut, the sides. */
    hang_cm: num(0, 100, BUILD),
    height_top: oneOf(['flat', 'low', 'medium', 'high']),
    volume_zone: setOf(['crown', 'sides', 'jaw', 'ends', 'root_lift', 'temples', 'occiput']),
    /** From the fade. */
    sides: oneOf(
      ['none', 'skin_fade', 'bald_fade', 'low_fade', 'mid_fade', 'high_fade', 'drop_fade', 'taper', 'scissor_taper', 'undercut'],
      BUILD,
    ),
    sides_width: oneOf(['close', 'medium', 'full']),
    perimeter: oneOf(['blunt', 'blunt_sleek', 'soft', 'rounded', 'graduated']),
    part: oneOf(['none', 'centre', 'side', 'deep_side']),
    fringe: oneOf(['none', 'micro', 'short_blunt', 'blunt_full', 'bottleneck', 'wispy', 'curtain', 'side_swept', 'long_side',
      'textured_forward', 'curly']),
    layers: setOf(['none', 'light', 'medium', 'heavy', 'internal', 'long_layers', 'face_framing', 'shag', 'chin_level'], {
      exclusive: ['none'],
    }),
    /** Diversity works on silhouettes, never on texture. */
    silhouette: oneOf(['pixie', 'bob', 'geometric_bob', 'lob', 'shag', 'wolf', 'butterfly', 'long_layers', 'one_length',
      'rounded', 'tapered_natural', 'twist_out', 'buzz', 'crew', 'caesar', 'french_crop', 'crop', 'flat_top', 'quiff',
      'pompadour', 'swept_back', 'side_sweep', 'mullet']),
    weight_removal: oneOf(['low', 'medium', 'high']),
    cut_method: setOf(['dry_shaped', 'razor', 'thinning_shears', 'point_cut']),
    nape_style: oneOf(['tapered', 'blunt', 'undercut', 'natural']),
    shrinkage_risk: oneOf(['low', 'medium', 'high']),
    /** How much pull the style puts on the hairline. */
    tension: oneOf(['none', 'low', 'high']),
    heat_dependent: bool(),
    grow_out_friendly: bool(),
    tie_back: bool(),
    covers_forehead: bool(),
    covers_ears: bool(),
    /** Worn tucked behind the ear. */
    tucked_behind_ear: bool(),
    /** The sides are cut to blend into a beard. */
    beard_blend: bool(),
    /** A hard line-up at the front is part of the cut. */
    lineup: bool(),
    styling_minutes: range(0, 60),
    trim_weeks: range(1, 26),
    /** `waves` is the 360-waves pattern; `curly_first` is a tag, never a family. */
    tags: setOf(['slick_back', 'comb_over', 'wash_and_go', 'air_dry_friendly', 'textured_top', 'waves', 'needs_blow_out',
      'perm_dependent', 'curly_first', 'recession_friendly', 'thinning_crown_friendly', 'workplace_friendly',
      'fine_hair_friendly', 'thick_hair_friendly', 'low_maintenance']),
    /** The item's fit for the person's texture; for `mixed` the less good of the wavy and curly fits. */
    texture_fit: oneOf(['good', 'adapt', 'poor'], { by: 'person', reads: ['hair.texture'] }),
    /** The cut needs shaping every day with a pick or a setting product on the person's texture (its `daily` fit flag). */
    daily_styling: bool({ by: 'person', reads: ['hair.texture'] }),
    /** The cut's density fit for the person's density. */
    density_fit: oneOf(['good', 'adapt', 'poor'], { by: 'person', reads: ['hair.density'] }),
    /**
     * `small`: same or neighbouring length class; `medium`: two apart; `large`: three or more. A collarbone cut (`bob`) sits with
     * shoulder-length hair; a class set by zone lengths compares with the stretched length, a landmark with where curly hair rests.
     */
    length_change: oneOf(['small', 'medium', 'large'], { by: 'person', reads: ['hair.current_length'] }),
    /**
     * By length class as above; also `shorter` when the top, the back or a salon cut's sides end below that length (the back and
     * sides against the class below it on hair above the shoulder), or when hair to the chin or beyond would have a clipped part.
     */
    length_direction: oneOf(['shorter', 'same', 'longer'], { by: 'person', reads: ['hair.current_length'] }),
    /** How many times the cut's longest trim interval goes into the interval the person stated: above 2, the cut needs trims far more often. */
    trim_times: num(0, 26, { by: 'person', reads: ['life.trim_weeks_ok'] }),
    /** Weeks of growth before the cut works: 0 when it works today. */
    growth_weeks: num(0, 1040, { by: 'person', reads: ['hair.current_length'] }),
    /** What the cut shares with the looks the person tapped; unknown until they tap one. */
    liked: setOf(['silhouette', 'length_class', 'fringe', 'height_top'], { by: 'person', reads: ['wish.liked_cuts'] }),
  },
  colour: {
    /** The base shade's family. */
    family: oneOf(['blonde', 'brunette', 'red_copper', 'black', 'grey_silver', 'vivid'], BUILD),
    /** The base shade's warmth. */
    warmth: oneOf(['warm', 'cool', 'neutral'], BUILD),
    /** Every shade in the look. */
    tone: setOf(['ash', 'beige', 'pearl', 'silver', 'neutral', 'golden', 'honey', 'caramel', 'copper', 'red', 'red_brown',
      'chestnut', 'chocolate', 'mahogany', 'burgundy', 'plum', 'rose', 'pink', 'lavender', 'teal', 'blue'], BUILD),
    /** The base technique and every placement technique. */
    technique: setOf(['all_over', 'gloss', 'foil_highlights', 'babylights', 'lowlights', 'balayage', 'foilayage', 'ombre',
      'sombre', 'root_shadow', 'colour_melt', 'money_piece', 'peekaboo', 'grey_blending', 'grey_coverage',
      'colour_correction', 'vivid_all_over', 'demi_refresh'], BUILD),
    /** The base technique alone (`none` keeps the person's own colour as the base). */
    base_technique: oneOf(['none', 'all_over', 'gloss', 'demi_refresh', 'grey_coverage', 'vivid_all_over', 'colour_correction'], BUILD),
    technique_category: setOf(['process', 'placement', 'finish', 'blending', 'coverage', 'correction'], BUILD),
    /** Every region a placement uses. */
    regions: setOf(['root', 'mids', 'ends', 'face_frame', 'highlights', 'lowlights'], BUILD),
    lightening: oneOf(['none', 'some', 'always'], BUILD),
    /** A placement that lightens pieces (a placement technique with lightener): lighter than the hair it sits on, whatever its shade. */
    lighter_pieces: bool(BUILD),
    /** What the look does to grey, authored per look. */
    grey_effect: oneOf(['covers', 'tints', 'blends', 'shows', 'silver'], BUILD),
    /** The look has a required base level, so the hair is lightened before its shades go on. */
    prelightening: bool(BUILD),
    /** The lightest level the look reaches, its required base level included. */
    target_level: num(1, 10, BUILD),
    /**
     * The deepest and lightest levels the look puts on the roots (the base, or with a `none` base the colour it is designed on where no
     * root placement covers them; placements woven from the root), the required base level included with a base.
     */
    root_levels: range(0, 10, BUILD),
    /** The same on the lengths (every placement but a root-only one); lighter pieces count for the lightest level only beside a base. */
    lengths_levels: range(1, 10, BUILD),
    upkeep_weeks: range(1, 26, BUILD),
    vivid: bool(BUILD),
    salon_only: bool(BUILD),
    /**
     * The greatest lift the look needs over the regions it treats: the lengths from their level, and treated roots from the natural
     * level. Unknown while a level it needs is unknown.
     */
    lift_levels: num(-9, 9, { by: 'person', reads: ['colour.current_level_lengths', 'colour.natural_level', 'hair.chemical_history'] }),
    /** The greatest lift over the regions whose level is known, so a mandatory caution never waits for the other region. */
    known_lift: num(-9, 9, { by: 'person', reads: ['colour.current_level_lengths', 'colour.natural_level', 'hair.chemical_history'] }),
    /** The lift at the roots alone: the lightest level the look ends at there, each shade within its technique's lift, minus the natural level. */
    roots_lift: num(-9, 9, { by: 'person', reads: ['colour.natural_level'] }),
    /** The levels the look takes the roots down by, 0 when none. */
    roots_darken: num(0, 9, { by: 'person', reads: ['colour.natural_level'] }),
    /**
     * The levels the roots end away from the nearer of the natural level (the regrowth) and the lengths' level (the colour worn), so a
     * retouch to the colour worn keeps the depth; 0 when the look leaves the roots alone.
     */
    roots_from_worn: num(0, 9, { by: 'person', reads: ['colour.natural_level', 'colour.current_level_lengths', 'hair.chemical_history'] }),
    /** The levels the look takes the lengths down by, 0 when none; lighter pieces never darken. */
    lengths_darken: num(0, 9, { by: 'person', reads: ['colour.current_level_lengths', 'hair.chemical_history'] }),
    /**
     * The lift on the lengths alone: the lightest level the look ends at there minus their level now, each shade within its technique's
     * lift on natural or coloured lengths. Unknown while the history decides it and is unknown.
     */
    lengths_lift: num(-9, 9, { by: 'person', reads: ['colour.current_level_lengths', 'hair.chemical_history'] }),
    /**
     * The most levels the look takes some hair down by, on the lengths or the roots it treats; 0 when it darkens none. A dark root
     * counts with or without lightener elsewhere; lighter pieces and a pre-lightened level never do.
     */
    darkens_by: num(0, 9, { by: 'person', reads: ['colour.current_level_lengths', 'colour.natural_level', 'hair.chemical_history'] }),
    /**
     * Every shade the look needs can show on this hair: each on its own, only where its deepest level is within its
     * technique's lift of the hair it lands on, or, for a look that shows the person's own grey, where there is grey.
     */
    reaches_shade: bool({ by: 'person', reads: ['colour.current_level_lengths', 'colour.natural_level', 'hair.chemical_history', 'colour.grey_percent'] }),
    /**
     * Some region the look treats ends a level or more darker than it is now, judged by where it ends, not by its deepest shade, so a
     * toner at or above the hair's level is not darker.
     */
    ends_darker: bool({ by: 'person', reads: ['colour.current_level_lengths', 'colour.natural_level', 'hair.chemical_history'] }),
    /** The look's furthest level, on the roots or the lengths, against the natural level: within 1, 2-3, or 4 or more. */
    contrast_with_natural: oneOf(['low', 'medium', 'high'], { by: 'person', reads: ['colour.natural_level'] }),
    /**
     * A lightening placement (balayage, foilayage, foil_highlights, babylights, money_piece, ombre, sombre) has a shade
     * whose upper level is at or below the darker end of the person's current level.
     */
    placement_not_lighter: bool({ by: 'person', reads: ['colour.current_level_lengths'] }),
  },
  beard: {
    beard_shape: oneOf(['none', 'fuller_sides', 'short_sides', 'short_along_jaw', 'full_rounded', 'fuller_chin',
      'pointed_chin', 'ducktail', 'goatee', 'chin_strap', 'moustache_only']),
    beard_length: oneOf(['none', 'stubble', 'short', 'medium', 'long']),
    cheek_line: oneOf(['natural', 'low', 'sharp']),
    neckline: oneOf(['natural', 'two_fingers', 'high']),
  },
} as const;

// Checked here, not with `satisfies` on the literal: that contextual type widens the value lists of every `oneOf` and `setOf` called without options.
const SPECS: Readonly<Record<string, Readonly<Record<string, TraitSpec>>>> = TRAITS;

/** What a rule targets: cuts, colour looks or beards. */
export type TargetKind = keyof typeof TRAITS;
export const TARGET_KINDS = Object.keys(TRAITS) as readonly TargetKind[];

export type TraitSpecs<T extends TargetKind> = (typeof TRAITS)[T];
export type TraitKey<T extends TargetKind> = keyof TraitSpecs<T> & string;
/** A trait's value: a range trait holds `[min, max]`. */
export type TraitValue<S> = S extends { readonly type: 'range' } ? Range : SpecValue<S>;

type ByOf<S> = S extends { readonly by: infer B } ? B : 'authored';
type TraitsBy<T extends TargetKind, B extends TraitBy> = {
  readonly [K in TraitKey<T> as ByOf<TraitSpecs<T>[K]> extends B ? K : never]: TraitValue<TraitSpecs<T>[K]>;
};

/** Traits written in the item's `traits` block; always present. */
export type AuthoredTraits<T extends TargetKind> = TraitsBy<T, 'authored'>;
/** Traits the build derives; always present. */
export type BuildTraits<T extends TargetKind> = TraitsBy<T, 'build'>;
/** An item's traits after the build: authored and derived, never missing. */
export type ItemTraits<T extends TargetKind> = AuthoredTraits<T> & BuildTraits<T>;
/** Per-person traits; missing means unknown (three-valued). */
export type PersonTraits<T extends TargetKind> = Partial<TraitsBy<T, 'person'>>;

/** The trait spec, typed loosely, for code that walks the registry. */
export const traitSpec = (kind: TargetKind, key: string): TraitSpec | undefined => SPECS[kind]?.[key];

/** Who sets a trait. */
export const traitBy = (spec: TraitSpec): TraitBy => spec.by ?? 'authored';
