/**
 * Content record types. Every key and value a rule names is typed from `FACTS` and `TRAITS`,
 * so a wrong one fails to compile; field value lists are in `values.ts`, build output shapes in `output.ts`.
 */
import type { Confidence, FACTS, FactKey, FactValue, Range, SpecScalar, WishKey } from '../facts/registry.ts';
import type { Suitability } from './suitability.ts';
import type { AuthoredTraits, TargetKind, TraitKey, TraitSpecs } from './traits.ts';
import type {
  BAND_GATES, BEARD_ZONES, BaseTechnique, GreyEffect, BeardNeckline, CheekLine, Collection, CoreSetName,
  CUT_NECKLINES, Evidence, FADE_HEIGHTS, FADE_KINDS, FADE_SPEEDS, FitValue, FringeKind, Goal, HAIR_GROUPS, HEAT_USE,
  JourneyLabel, LEVELS, Lightening, MEASURE_VIEWS, NoteKind, PerimeterLandmark, PromptKind, Region, REVIEW_STATUSES,
  RuleGroup, ShadeFamily, Strength, SwatchRegion, TechniqueCategory, TechniqueValue, Tone, View, Warmth, ZONES,
} from './values.ts';

// ── The rules DSL ──

interface Known { readonly known: boolean }
/** The one test a `when`, `on`, `favour` or `disfavour` entry holds; which tests apply depends on the spec. */
export type TestFor<S> = S extends { readonly type: 'enum' | 'set' }
  ? { readonly is: SpecScalar<S> } | { readonly in: readonly SpecScalar<S>[] } | { readonly not: readonly SpecScalar<S>[] } | Known
  : S extends { readonly type: 'number' }
    ? { readonly is: number } | { readonly in: readonly number[] } | { readonly not: readonly number[] } | { readonly range: Range } | Known
    : S extends { readonly type: 'bool' }
      ? { readonly is: boolean } | Known
      : S extends { readonly type: 'range' }
        ? { readonly range: Range } | Known
        : never;

/** A test with its parts loosely typed, for code that walks rules. */
export interface AnyTest {
  readonly is?: string | number | boolean; readonly in?: readonly (string | number)[]; readonly not?: readonly (string | number)[];
  readonly range?: Range; readonly known?: boolean;
}
/** A `when` or a match with its keys loosely typed, for code that walks rules. */
export type AnyTests = Readonly<Record<string, AnyTest>>;

/** The person side: every test must hold on known values (AND). */
export type When = { readonly [K in FactKey]?: TestFor<(typeof FACTS)[K]> };
/** The item side: every listed trait must pass (AND). A list of matches means any of them. */
export type Match<T extends TargetKind> = { readonly [K in TraitKey<T>]?: TestFor<TraitSpecs<T>[K]> };

/** The content review of a record; `date` is `YYYY-MM-DD`. */
export interface Review { readonly status: (typeof REVIEW_STATUSES)[number]; readonly date: string; readonly note?: string }

interface RuleCommon {
  /** The research id in lower case (`a01`); split records add a suffix and carry `from`. */
  readonly id: string;
  readonly from?: string;
  readonly group: RuleGroup;
  readonly when: When;
  /** Rare per-rule override of a fact's minimum confidence. */
  readonly min?: Partial<Readonly<Record<FactKey, Confidence>>>;
  /** Records of the same target skipped on every item where this record applies. */
  readonly suppresses?: readonly string[];
  readonly evidence: Evidence;
  readonly sources?: readonly string[];
  readonly review: Review;
}

/** Scores an item once: +weight on a favour match, -weight on a disfavour match, 0 on both. */
export interface RankRule<T extends TargetKind> extends RuleCommon {
  readonly target: T;
  readonly effect: 'rank';
  readonly strength: Strength;
  readonly favour: readonly Match<T>[];
  readonly disfavour: readonly Match<T>[];
  /** The part about the person, without "so"; the item part is generated from the matched phrases. */
  readonly reason: string;
}

/** Shows `because` on the items `on` matches; without `on` it is a note for the whole result. */
export interface NoteRule<T extends TargetKind> extends RuleCommon {
  readonly target: T;
  readonly effect: 'note';
  readonly note: NoteKind;
  readonly on?: Match<T>;
  readonly because: string;
}

/** Leaves out the items `on` matches; every `when` key must be an answered fact. */
export interface ExcludeRule<T extends TargetKind> extends RuleCommon {
  readonly target: T;
  readonly effect: 'exclude';
  readonly on: Match<T>;
  readonly because: string;
}

export type RuleFor<T extends TargetKind> = RankRule<T> | NoteRule<T> | ExcludeRule<T>;
export type Rule = { [T in TargetKind]: RuleFor<T> }[TargetKind];

/** One record of the journey set: applies only when its `when` and its `on` both hold on known values. */
export interface JourneyRecord {
  readonly id: string;
  readonly from?: string;
  readonly effect: 'label';
  readonly label: JourneyLabel;
  readonly when: When;
  /** Absent: every look. */
  readonly on?: Match<'colour'>;
  readonly because: string;
  readonly what_to_ask: string;
  readonly evidence: Evidence;
  readonly sources?: readonly string[];
  readonly review: Review;
}

/** A procedural note on colour looks; never a label. Exactly one of `applies_to` and `on`. */
export interface Reminder {
  readonly id: string; readonly kind: 'reminder'; readonly text: string;
  readonly applies_to?: 'every_colour_look'; readonly on?: Match<'colour'>; readonly review: Review;
}

/** Replaces every colour suggestion and colour prompt with "Best done by a colourist" and the reason. */
export interface Referral {
  readonly id: string; readonly kind: 'referral'; readonly when: When; readonly text: string;
  readonly replaces_suggestions: true; readonly review: Review;
}

// ── Library items ──

export interface Source { readonly url: string; readonly supports: string; readonly level: Evidence }

/** A zone length, in cm (dry and stretched) or as a clipper guard in mm. */
export type Zone = { readonly cm: Range } | { readonly guard_mm: Range };
export type Zones = { readonly basis: 'dry_stretched'; readonly top: Zone } & Readonly<Record<Exclude<(typeof ZONES)[number], 'top'>, Zone | null>>;

export interface Fade {
  readonly kind: (typeof FADE_KINDS)[number]; readonly height: (typeof FADE_HEIGHTS)[number] | null;
  readonly start_mm: number; readonly note: string | null;
}

/** `landmark`: where the fringe sits, in snake_case (`brow`). */
export interface Fringe { readonly kind: FringeKind; readonly landmark: string | null; readonly options: readonly FringeKind[] }

export interface Fit { readonly fit: FitValue; readonly note?: string; /** Shaped every day on this texture (a pick, a setting product), so never wash and go there. */ readonly daily?: true }

/** `model` is a library model id. */
export interface Images {
  readonly model: string;
  readonly views: readonly View[];
  /** Replaces the model's caption when the pictures show another texture ("Shown on 4A to 4B coils"). */
  readonly shown_on?: string;
}

/** What a variant changes; everything else comes from its cut. */
export interface VariantChanges {
  readonly zones?: Partial<Omit<Zones, 'basis'>>;
  readonly perimeter?: { readonly landmark: PerimeterLandmark | null };
  readonly fade?: Partial<Fade> | null;
  readonly fringe?: Fringe | null;
  readonly neckline?: (typeof CUT_NECKLINES)[number] | null;
  readonly traits?: Partial<AuthoredTraits<'cut'>>;
}

/** A length, fringe or fade step of one structure, with its own id, pictures and prompt. */
export interface Variant {
  readonly id: string; readonly name: string; readonly changes: VariantChanges; readonly prompt_spec: string; readonly client?: string;
}

/** One schema for both collections. */
export interface Haircut {
  readonly id: string; readonly kind: 'cut'; readonly name: string;
  readonly aliases: readonly string[];
  readonly collections: readonly Collection[];
  /** Structural family, the file name; never a texture. */
  readonly family: string;
  readonly zones: Zones;
  readonly perimeter: { readonly landmark: PerimeterLandmark | null };
  readonly fade: Fade | null;
  readonly neckline: (typeof CUT_NECKLINES)[number] | null;
  readonly sideburns: string | null;
  readonly fringe: Fringe | null;
  readonly texture_fit: Readonly<Record<'straight' | 'wavy' | 'curly' | 'coily', Fit>>;
  readonly density_fit: Readonly<Record<'low' | 'medium' | 'high', Fit>>;
  /** Salon curly cuts; advisory. */
  readonly shrinkage: { readonly curly_pct: Range; readonly coily_pct: Range } | null;
  /** Advisory, never a hard limit. */
  readonly growth: { readonly recession_stage_max: number | null; readonly whorl_note: string | null; readonly note: string | null };
  readonly strand_note: string | null;
  readonly density_note: string | null;
  readonly glasses_note: string | null;
  readonly upkeep: { readonly styling_minutes: Range; readonly trim_weeks: Range; readonly heat: (typeof HEAT_USE)[number]; readonly products: readonly string[] };
  readonly grow_out: string | null;
  /** snake_case (`current`). */
  readonly era: string;
  readonly pairs_with: { readonly beards: readonly string[]; readonly looks: readonly string[] };
  readonly traits: AuthoredTraits<'cut'>;
  readonly variants: readonly Variant[];
  readonly client: string;
  readonly stylist: string;
  readonly images: Images;
  readonly prompt_spec: string;
  readonly sources: readonly Source[];
  readonly review: Review;
}

/** Not ranked; shown in Explore, as pairings and on the stylist sheet. */
export interface BeardStyle {
  readonly id: string; readonly kind: 'beard'; readonly name: string;
  readonly aliases: readonly string[];
  readonly collections: readonly Collection[];
  readonly zones_mm: Readonly<Record<(typeof BEARD_ZONES)[number], Range>>;
  readonly cheek_line: CheekLine;
  readonly neckline: BeardNeckline;
  readonly growth: { readonly weeks_needed: Range; readonly note: string | null };
  readonly upkeep: { readonly trim_days: Range; readonly daily_minutes: number; readonly products: readonly string[] };
  readonly pairs_with: { readonly cuts: readonly string[] };
  readonly traits: AuthoredTraits<'beard'>;
  readonly client: string;
  readonly stylist: string;
  readonly images: Images;
  readonly prompt_spec: string;
  readonly sources: readonly Source[];
  readonly review: Review;
}

/** What colour: a level range and a tone. */
export interface Shade {
  readonly id: string; readonly kind: 'shade'; readonly name: string;
  readonly aliases: readonly string[];
  readonly family: ShadeFamily;
  readonly level: Range;
  readonly tone: Tone;
  readonly warmth: Warmth;
  readonly tone_description: string;
  /** Illustration as `#rrggbb`; the build derives the Lab targets from it. */
  readonly swatch: Readonly<Record<SwatchRegion, string>>;
  readonly maintenance: {
    readonly fade_speed: (typeof FADE_SPEEDS)[number]; readonly gloss_weeks: Range | null; readonly retouch_weeks: Range | null;
    readonly regrowth_visibility: (typeof LEVELS)[number]; readonly upkeep_level: number;
  };
  readonly risks: readonly string[];
  readonly vivid: boolean;
  readonly client: string;
  readonly stylist: string;
  readonly sources: readonly Source[];
  readonly evidence: Evidence;
  readonly review: Review;
}

/** How a shade is applied. Its id is the kebab-case form of its `technique` trait value (`root-shadow`). */
export interface Technique {
  readonly id: string; readonly kind: 'technique'; readonly name: string;
  readonly category: TechniqueCategory; readonly how: string;
  /** Where it may be placed. */ readonly regions: readonly Region[];
  readonly lightening: Lightening;
  /** Levels it lifts on never-coloured and on coloured hair: lightener 9, permanent colour 2 and 0 (tint cannot lift tint). */
  readonly lifts: { readonly natural: number; readonly coloured: number };
  readonly pairs_with: { readonly families: readonly ShadeFamily[]; readonly avoid: readonly ShadeFamily[] };
  readonly regrowth_friendliness: number;
  readonly revisit_weeks: Range;
  readonly session_hours: Range;
  readonly damage_risk: (typeof LEVELS)[number];
  readonly salon_only: boolean;
  readonly client: string;
  readonly stylist: string;
  readonly sources: readonly Source[];
  readonly evidence: Evidence;
  readonly review: Review;
}

/** `shade` is a shade id. */
export interface Placement { readonly technique: TechniqueValue; readonly shade: string; readonly region: Region }

/** A base shade plus optional placements. */
export interface ColourLook {
  readonly id: string; readonly kind: 'colour'; readonly name: string;
  readonly aliases?: readonly string[];
  readonly collections: readonly Collection[];
  /** `technique: none`: the own colour stays wherever no placement covers the hair; `on` is the colour the look is designed on, `on_words` the words of `prompt_spec` that picture it, each once, which a person's prompt gives as their own colour. */
  readonly base: { readonly shade: string; readonly technique: BaseTechnique; readonly on?: string; readonly on_words?: readonly string[] };
  /** What the look does to grey hair: the grey goals are judged on this, never guessed from technique names. */
  readonly grey: GreyEffect;
  readonly placements: readonly Placement[];
  /** The level the hair must be lightened to first, or `null`. */
  readonly required_base_level: number | null;
  readonly client: string;
  readonly stylist: string;
  readonly images: { readonly models: readonly string[]; readonly view: View };
  readonly prompt_spec: string;
  readonly sources?: readonly Source[];
  readonly review: Review;
}

// ── Questions ──

export type OptionValue = string | number | boolean;
interface OptionCommon {
  readonly label: string;
  readonly illustration?: string;
  /** A question shown under this option once it is chosen. */
  readonly follow_up?: string;
}
/** Writes the question's fact; `value: null` is "Not sure", stored as absence. `picture`: a library key per collection. `note`: said to someone shown only that collection. */
export interface ValueOption extends OptionCommon {
  readonly value: OptionValue | null;
  readonly picture?: Partial<Readonly<Record<Collection, string>>>;
  readonly note?: Partial<Readonly<Record<Collection, string>>>;
}
/** Writes several facts at once (the `upkeep` and `dye-reaction` questions). */
export interface SetsOption extends OptionCommon { readonly sets: { readonly [K in FactKey]?: FactValue<K> } }
/** "None of these" on a set without a `none` value: stored as the empty set. */
export interface NoneOfTheseOption { readonly none_of_these: true; readonly label: string }
/** One option of the `wishes` question: a wish key and its value. */
export interface WishOption { readonly label: string; readonly fact: WishKey; readonly value: 'preserve' | 'emphasise' | 'soften' }
export type QuestionOption = ValueOption | SetsOption | NoneOfTheseOption | WishOption;

export interface Question {
  readonly id: string;
  /** The fact the question writes; absent when its options use `sets`, and on the `wishes` question. */
  readonly fact?: FactKey;
  readonly type: 'single' | 'multi' | 'wishes';
  readonly goals: readonly Goal[];
  readonly collections: readonly Collection[];
  readonly prompt: string;
  readonly help?: string;
  /** The most answers a multi question takes. */ readonly max?: number;
  /** Shown when true or unknown (asking is the safe side). */
  readonly show_if?: When;
  readonly options: readonly QuestionOption[];
}

export interface QuestionsFile {
  readonly questions: readonly Question[];
  /** Ordered lists of question ids; at most 10 each, 12 for Both, a follow-up counting with its question. */
  readonly core_sets: Readonly<Record<CoreSetName, readonly string[]>>;
}

// ── Bands, policy, library models, prompts, pictures ──

/** Turns a measured number into a fact value; thresholds never live in rules. */
export interface Band {
  readonly fact: FactKey;
  /** The measurement's snake_case name (`width_to_length`). */
  readonly from: string;
  readonly view: (typeof MEASURE_VIEWS)[number];
  /** Ascending; every cut but the last has `below`; a `null` leaves the band unset, so its fact stays unknown. */
  readonly cuts: readonly { readonly below?: number | null; readonly value: string }[];
  /** A value within the margin of a cut gets low confidence; `null` leaves the band unset. */
  readonly margin: number | null;
  readonly requires?: readonly (typeof BAND_GATES)[number][];
}

export interface Bands {
  readonly bands: readonly Band[];
  /** The cm band of the longest zone for each `hair.current_length` value (feasibility). */
  readonly current_length_cm: Readonly<Record<FactValue<'hair.current_length'>, Range>>;
}

/** The selection policy as parameters (`content/policy.json`). */
export interface Policy {
  readonly weights: Readonly<Record<Strength, number>>;
  readonly count: { readonly min: number; readonly default: number; readonly max: number };
  readonly both_split: 'cut_first_half';
  readonly grid_max_tiles: number;
  readonly max_per_silhouette: number;
  readonly min_distinct_silhouettes_share: number;
  readonly low_upkeep: { readonly max_styling_minutes: number; readonly min_trim_weeks: number };
  readonly max_reasons: number;
  readonly reason_group_order: readonly RuleGroup[];
  readonly pool_size: number;
  readonly change_span: number | null;
  readonly length_span: number | null;
  readonly colour_variety: number | null;
  readonly upkeep_stack: number | null;
  /** `null` hides "weeks" in feasibility lines. */
  readonly growth_cm_per_month: number | null;
  /** Ranking constants; absent on small test libraries, which rank by rule score alone. */ readonly suitability?: Suitability;
}

/** One of the four fictional library models. */
export interface LibraryModel {
  readonly id: string; readonly collection: Collection; readonly hair_group: (typeof HAIR_GROUPS)[number];
  readonly label: string; readonly shown_on: string;
  /** Picture keys (`<model-id>/<stem>-<view>`) in `content/pictures.json`. */
  readonly base_pictures: Readonly<Record<View, string>>;
  /** `examples/<model-id>.json`, a bundled session. */
  readonly example: string;
  readonly licence: string;
}

/** The header block of a `content/prompts/*.md` template. */
export interface PromptHeader {
  readonly template: PromptKind;
  readonly kind: 'image' | 'text';
  readonly word_budget: number;
  /** The body carries `{{keep_list}}`, filled with the keep-list. */
  readonly keep_list: boolean;
  readonly variables: readonly string[];
}

export interface PromptTemplate extends PromptHeader { readonly body: string }

/** One entry of `content/pictures.json`, written by `scripts/images.ts`; keyed `<model-id>/<item-id>-<view>`. */
/** `average` is the placeholder colour as `#rrggbb`. */
export interface PictureEntry {
  readonly widthPx: number; readonly heightPx: number; readonly widths: readonly number[]; readonly average: string; readonly bytes: number;
  /** The AVIF quality when it differs from the script's default, so a later run makes the same bytes. */
  readonly quality?: number;
}
