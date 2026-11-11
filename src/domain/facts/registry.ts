/**
 * The closed fact vocabulary: 91 keys, each with its type, values or range
 * and unit, its producer and the minimum confidence a rule needs. Every fact type in the app derives from `FACTS`.
 */

/** Ordinal confidence. "Unknown" is not a level: an unknown fact is absent. */
export type Confidence = 'low' | 'medium' | 'high';
export const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 } as const satisfies Record<Confidence, number>;

/** Where a stored fact came from. Answers are always `high`. */
export type FactSource = 'answered' | 'measured' | 'derived';

/** Who writes a fact: a question, a measurement band (`content/bands.json`) or a derivation from other facts. */
export type Producer = 'question' | 'measured' | 'derived';

/** An inclusive `[min, max]` pair. */
export type Range = readonly [min: number, max: number];

/** One of a closed list of snake_case values. */
export interface EnumSpec { readonly type: 'enum'; readonly values: readonly string[] }
/** A set value; `exclusive` values cannot be combined with any other value. */
export interface SetSpec { readonly type: 'set'; readonly values: readonly string[]; readonly exclusive?: readonly string[] }
/** A number in the inclusive `range`. */
export interface NumberSpec { readonly type: 'number'; readonly range: Range; readonly unit?: string }
/** Yes or no. */
export interface BoolSpec { readonly type: 'bool' }
export type ValueSpec = EnumSpec | SetSpec | NumberSpec | BoolSpec;

/** What every fact entry adds to its value spec. */
export interface FactOptions {
  readonly from: Producer;
  /** Default minimum confidence a rule needs (default `low`; answers are always `high`). */
  readonly min?: Confidence;
  /** The facts a derivation reads. With `from: 'question'` the fact is also derived when those answers allow. */
  readonly derivedFrom?: readonly string[];
}
export type FactSpec = (EnumSpec | SetSpec | (NumberSpec & { readonly unit: string }) | BoolSpec) & FactOptions;

/** No extra options. */
type NoOptions = object;

/** An enum over a closed list of snake_case values. */
export const oneOf = <const V extends readonly [string, ...string[]], const O extends object = NoOptions>(values: V, options: O = {} as O) =>
  ({ type: 'enum', values, ...options }) as const;

/** A set over a closed list; the value is a list of distinct members. */
export const setOf = <const V extends readonly [string, ...string[]], const O extends object = NoOptions>(values: V, options: O = {} as O) =>
  ({ type: 'set', values, ...options }) as const;

/** A number in `[min, max]`. */
export const num = <const O extends object = NoOptions>(min: number, max: number, options: O = {} as O) =>
  ({ type: 'number', range: [min, max], ...options }) as const;

/** A yes or no value. */
export const bool = <const O extends object = NoOptions>(options: O = {} as O) => ({ type: 'bool', ...options }) as const;

const Q = { from: 'question' } as const;
const M_MEDIUM = { from: 'measured', min: 'medium' } as const;
const M_HIGH = { from: 'measured', min: 'high' } as const;
const LENGTHS = ['very_short', 'short', 'chin', 'shoulder', 'long', 'very_long'] as const;
const SINCE = ['weeks_0_2', 'weeks_2_8', 'months_2_6', 'months_6_plus', 'never'] as const;
const WISH = ['emphasise', 'soften'] as const;
const wish = () => oneOf(WISH, Q);
/** The one wish that also offers "keep my own proportions". */
const OVERALL_BALANCE = ['preserve', 'emphasise', 'soften'] as const;
/** The looks on the taste cards of `content/questions.json`, six per library model. */
const LIKED_CUTS = [
  'classic-pixie', 'french-bob', 'collarbone-lob-blunt', 'classic-shag', 'long-u-layers', 'long-wolf-cut',
  'tapered-twa', 'shaped-round-afro', 'curly-bob-rounded', 'curly-lob-rounded', 'curly-long-shag', 'long-curly-wolf-cut',
  'buzz-tapered', 'textured-crop-low-taper', 'side-part-classic', 'quiff-classic', 'flow-medium', 'curtains-middle-part',
  'curly-taper-defined', 'afro-taper-round', 'curly-quiff', 'short-twists-fade', 'curly-flow', 'waves-360',
] as const;

/** The fact keys section by section, 91 in all, with the two numeric face facts and the tattoo question in their sections. "Not sure" and "Skip" are absent facts. */
export const FACTS = {
  // Face (measured). The jaw and chin values need `high`: a frontal photo from about 1 m. A medium jaw never reaches a rule.
  'face.proportion': oneOf(['longer', 'balanced', 'rounder'], M_MEDIUM),
  // The sections are vertical proportions, which an unknown camera distance hardly changes, so medium is enough; widths are
  // what distance distorts, so the jaw needs high. A rule still reads the sections only with a wish.
  'face.forehead_share': oneOf(['shorter', 'similar', 'longer'], M_MEDIUM),
  'face.lower_share': oneOf(['shorter', 'similar', 'longer'], M_MEDIUM),
  'face.jaw_vs_cheek': oneOf(['narrower', 'similar', 'wider'], M_HIGH),
  'face.jaw_angle': oneOf(['soft', 'moderate', 'defined'], M_HIGH),
  'face.chin_width': oneOf(['narrow', 'similar', 'broad'], M_HIGH),
  /** The frontal width to length as a number. The face-frame factor gives medium and high confidence readings the same influence. */
  'face.width_to_length': num(0.5, 1.3, { unit: 'ratio', ...M_MEDIUM }),
  /** The jaw to cheek width as a number from medium confidence: the face factor reads it at high, and at medium only in clear cases. */
  'face.jaw_to_cheek': num(0.5, 1.3, { unit: 'ratio', ...M_MEDIUM }),

  // Head and hair
  'head.occiput': oneOf(['flat', 'rounded', 'prominent'], Q),
  'head.crown_shape': oneOf(['flat', 'rounded'], Q),
  'hair.texture': oneOf(['straight', 'wavy', 'curly', 'coily', 'mixed'], Q),
  'hair.density': oneOf(['low', 'medium', 'high'], Q),
  'hair.strand': oneOf(['fine', 'medium', 'coarse'], Q),
  /** Stretched length; the photo may suggest an answer, but only the answer is a fact. */
  'hair.current_length': oneOf(LENGTHS, Q),
  /** Where curly or coily hair sits when dry and not stretched: reach compares a cut's length class with this. */
  'hair.resting_length': oneOf(LENGTHS, Q),
  'hair.cowlick_front': bool(Q),
  'hair.cowlick_nape': bool(Q),
  'hair.crown_whorl': oneOf(['none', 'single', 'double'], Q),
  'hair.part_side': oneOf(['left', 'right', 'centre', 'none'], Q),
  'hair.hairline_shape': oneOf(['straight', 'rounded', 'widows_peak', 'm_shape'], Q),
  /** Stage on a recession scale, asked with drawings; the scale's name never appears in the UI. */
  'hair.recession_stage': num(1, 7, { unit: 'stage', ...Q }),
  'hair.thinning_stage': num(1, 3, { unit: 'stage', ...Q }),
  'hair.thinning_zone': oneOf(['none', 'crown', 'front', 'part', 'diffuse'], Q),
  'hair.traction_signs': bool(Q),
  'hair.sudden_loss': bool(Q),
  'hair.condition': oneOf(['healthy', 'dry', 'damaged'], Q),
  'hair.heat_habit': oneOf(['none', 'rare', 'weekly', 'daily'], Q),
  /** The last 2-3 years. `none` stands alone. */
  'hair.chemical_history': setOf(
    ['none', 'home_dye', 'home_dark_dye', 'salon_colour', 'bleach', 'highlights', 'vivid', 'colour_remover',
      'henna_plant', 'henna_compound', 'relaxer_perm', 'keratin'],
    { ...Q, exclusive: ['none'] },
  ),
  'hair.style_interest': setOf(['braids', 'weave', 'extensions', 'tight_ponytail'], Q),
  'scalp.oil': oneOf(['oily', 'balanced', 'dry'], Q),
  'scalp.marks_cover': bool(Q),

  // Beard and look
  'beard.style': oneOf(['none', 'stubble', 'short', 'medium', 'full'], Q),
  'beard.density': oneOf(['even', 'patchy'], Q),
  'beard.texture': oneOf(['straight', 'wavy', 'curly', 'coily'], Q),
  'beard.shave_close': bool(Q),
  'look.glasses': oneOf(['none', 'sometimes', 'daily'], Q),
  'look.glasses_frame': oneOf(['bold', 'thin', 'rimless'], Q),
  'look.eye_colour': oneOf(['dark_brown', 'light_brown', 'hazel', 'green', 'blue', 'grey', 'other'], Q),
  'look.skin_depth': oneOf(['very_light', 'light', 'medium', 'tan_olive', 'deep', 'very_deep'], Q),
  /** Answered only, with clues as help; never derived and never read from pixels. */
  'look.undertone': oneOf(['warm', 'cool', 'neutral', 'olive'], Q),
  /** Derived from the skin depth and natural level answers only. */
  'look.contrast': oneOf(['low', 'medium', 'high'], { from: 'derived', derivedFrom: ['look.skin_depth', 'colour.natural_level'] }),

  // Colour state, history and safety
  /** 1 black, 10 lightest blonde. */
  'colour.natural_level': num(1, 10, { unit: 'level', ...Q }),
  /** The darker end of the band chosen; the natural level when the history is `none`. */
  'colour.current_level_lengths': num(1, 10, { unit: 'level', ...Q, derivedFrom: ['hair.chemical_history', 'colour.natural_level'] }),
  'colour.current_tone': oneOf(['warm', 'copper', 'neutral', 'cool', 'brassy'], Q),
  'colour.last_dye': oneOf(SINCE, Q),
  /** `never` when the history is `none`. */
  'colour.last_chemical_service': oneOf(SINCE, { ...Q, derivedFrom: ['hair.chemical_history'] }),
  /** 4 means four or more. */
  'colour.bleach_count': num(0, 4, { unit: 'count', ...Q }),
  'colour.henna_type': oneOf(['plant', 'compound', 'tattoo'], Q),
  /** The midpoint of the band chosen. */
  'colour.grey_percent': num(0, 100, { unit: 'percent', ...Q }),
  'colour.grey_goal': oneOf(['cover', 'blend', 'embrace', 'silver'], Q),
  'colour.grey_pattern': oneOf(['even', 'temples', 'front', 'patches'], Q),
  'colour.grey_texture': oneOf(['same', 'wiry', 'dry'], Q),
  'safety.dye_reaction': oneOf(['none', 'mild', 'serious'], Q),
  /** Written by the `dye-reaction` question. */
  'safety.scalp_irritation': oneOf(['none', 'now'], Q),
  /** A black-henna temporary tattoo ever, asked on its own in colour paths whatever the hair history: yes is a referral. */
  'safety.henna_tattoo': bool(Q),
  /** Optional for privacy: "Skip" is absent; it never blocks "plausible". */
  'safety.health_context': bool(Q),

  // Preferences and life
  'pref.fringe': oneOf(['want', 'open', 'avoid'], Q),
  'pref.top_length': oneOf(['very_short', 'short', 'medium', 'long'], Q),
  'pref.hard_lineup': bool(Q),
  'pref.change_amount': oneOf(['subtle', 'noticeable', 'bold'], Q),
  'pref.colour_direction': oneOf(['lighter', 'darker', 'tone', 'refresh', 'grey', 'vivid', 'natural'], Q),
  /** The colour families the person has in mind; every look's `family` trait is one of these or vivid. */
  'pref.colour_family': setOf(['blonde', 'brunette', 'red_copper', 'black', 'grey_silver'], Q),
  'pref.colour_upkeep': oneOf(['high', 'medium', 'low', 'home_only'], Q),
  'pref.budget': oneOf(['low', 'medium', 'high'], Q),
  /** The upper end of the band chosen; written by the `upkeep` question. */
  'life.styling_minutes': num(0, 60, { unit: 'minutes', ...Q }),
  'life.enjoys_styling': bool(Q),
  /** Written by the `upkeep` question. */
  'life.trim_weeks_ok': num(1, 26, { unit: 'weeks', ...Q }),
  'life.headwear': setOf(['hat_or_cap', 'helmet', 'scarf_or_turban'], Q),
  'life.tie_back_needed': bool(Q),
  'life.hair_covered_at_work': bool(Q),
  'life.workplace_style': oneOf(['no_limits', 'creative', 'conservative'], Q),
  'life.grow_out_goal': bool(Q),
  'life.growing_out_fringe': bool(Q),
  'life.swims_often': bool(Q),
  'life.humid_climate': bool(Q),
  'life.event_soon': bool(Q),

  // Wishes: one multi-select question writes one key per chosen option; "no preference" is absent.
  'wish.face_length': wish(),
  'wish.face_width': wish(),
  'wish.forehead': wish(),
  'wish.cheekbones': wish(),
  'wish.eyes': wish(),
  'wish.nose': wish(),
  'wish.ears': wish(),
  'wish.jaw': wish(),
  'wish.chin': wish(),
  'wish.hairline': wish(),
  'wish.height': wish(),
  'wish.fullness': wish(),
  'wish.contrast': wish(),
  'wish.overall_balance': oneOf(OVERALL_BALANCE, Q),
  /** The looks tapped on the taste cards: a positive preference only, and never read from the photo. */
  'wish.liked_cuts': setOf(LIKED_CUTS, Q),
} as const satisfies Record<string, FactSpec>;

/** The value a spec holds: an enum value, a list of set members, a number or a boolean. */
export type SpecValue<S> = S extends { readonly type: 'enum'; readonly values: readonly (infer V)[] }
  ? V
  : S extends { readonly type: 'set'; readonly values: readonly (infer V)[] }
    ? readonly V[]
    : S extends { readonly type: 'number' }
      ? number
      : S extends { readonly type: 'bool' }
        ? boolean
        : never;

/** The element a value test names: set tests name members, number tests name numbers. */
export type SpecScalar<S> = S extends { readonly type: 'enum' | 'set'; readonly values: readonly (infer V)[] }
  ? V
  : S extends { readonly type: 'number' | 'range' }
    ? number
    : S extends { readonly type: 'bool' }
      ? boolean
      : never;

export type FactKey = keyof typeof FACTS;
export type FactValue<K extends FactKey> = SpecValue<(typeof FACTS)[K]>;
export type WishKey = Extract<FactKey, `wish.${string}`>;

/** One piece of knowledge about the person. The union is correlated: `value` always fits `key`. */
export type Fact<K extends FactKey = FactKey> = {
  readonly [P in K]: {
    readonly key: P;
    readonly value: FactValue<P>;
    readonly confidence: Confidence;
    readonly source: FactSource;
    /** Plain-words basis for the UI, for example "3 photos agree". */
    readonly basis?: string;
  };
}[K];

/** Known facts only. A missing key means unknown, and unknown never removes an option. */
export type Facts = { readonly [K in FactKey]?: Fact<K> };

export const FACT_KEYS = Object.keys(FACTS) as readonly FactKey[];

export const isFactKey = (key: string): key is FactKey => Object.hasOwn(FACTS, key);

/** True when a confidence reaches the fact's registry minimum, the bar a rule uses by default. */
export const meetsMin = (key: FactKey, confidence: Confidence): boolean =>
  CONFIDENCE_RANK[confidence] >= CONFIDENCE_RANK[(FACTS[key] as FactOptions).min ?? 'low'];

/** Facts feasibility reads: the length bands, and the texture and density fits. */
export const FEASIBILITY_FACTS = ['hair.current_length', 'hair.resting_length', 'hair.texture', 'hair.density'] as const satisfies readonly FactKey[];

/** The stylist sheet's "About my hair" list; one of the readers the question check counts. */
export const SHEET_FACTS = [
  'hair.texture', 'hair.density', 'hair.strand', 'hair.current_length', 'colour.natural_level',
  'hair.chemical_history', 'colour.current_level_lengths', 'colour.last_dye', 'colour.last_chemical_service',
  'colour.bleach_count', 'colour.grey_percent', 'colour.grey_texture',
] as const satisfies readonly FactKey[];
