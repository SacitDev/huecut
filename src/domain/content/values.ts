/**
 * The closed value lists of content record fields that are not traits. The record types
 * in `types.ts` and the schemas in `scripts/content/schema.ts` both come from these lists.
 */
import { TRAITS } from './traits.ts';

export const COLLECTIONS = ['salon', 'barbering'] as const;
/** Shown as "Women's styles" and "Men's styles"; the person chooses, the app never infers it. */
export type Collection = (typeof COLLECTIONS)[number];
/** `policy`: the app's own ranking choice from a stated answer or the library's own fit, so it needs no source. */
export const EVIDENCE = ['authority', 'research', 'trade_consensus', 'single_source', 'design_logic', 'policy'] as const;
export type Evidence = (typeof EVIDENCE)[number];
export const JOURNEY_LABELS = ['plausible', 'uncertain', 'needs_professional'] as const;
/** Shown as "Plausible", "Uncertain" and "Best done by a colourist", always with why and what to ask. */
export type JourneyLabel = (typeof JOURNEY_LABELS)[number];
export const VIEWS = ['front', 'side', 'back'] as const;
export type View = (typeof VIEWS)[number];
export const REVIEW_STATUSES = ['draft', 'checked'] as const;
export const RULE_GROUPS = ['A', 'B', 'C', 'D', 'E'] as const;
/** A face, B hair, C lifestyle, D extras, E colour. */
export type RuleGroup = (typeof RULE_GROUPS)[number];
export const STRENGTHS = ['weak', 'moderate', 'strong'] as const;
export type Strength = (typeof STRENGTHS)[number];
export const NOTE_KINDS = ['caution', 'design', 'referral'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
export const GOALS = ['cut', 'colour'] as const;
export type Goal = (typeof GOALS)[number];
/** One core set per goal and collection; the Colour set serves both collections. */
export const CORE_SETS = ['cut/salon', 'cut/barbering', 'colour/any', 'both/salon', 'both/barbering'] as const;
export type CoreSetName = (typeof CORE_SETS)[number];
export const PERIMETER_LANDMARKS = ['above_ear', 'ear', 'jaw', 'chin', 'collarbone', 'shoulder', 'shoulder_blade', 'mid_back', 'waist'] as const;
export type PerimeterLandmark = (typeof PERIMETER_LANDMARKS)[number];
/** `fade` is a plain fade named by its height; the others name the `sides` trait themselves. */
export const FADE_KINDS = ['fade', 'skin', 'bald', 'drop', 'taper', 'scissor_taper', 'undercut'] as const;
export const FADE_HEIGHTS = ['low', 'mid', 'high'] as const;
export const CUT_NECKLINES = ['natural', 'tapered', 'blocked', 'rounded'] as const;
export const ZONES = ['top', 'fringe', 'sides', 'back', 'nape'] as const;
export const BEARD_ZONES = ['cheeks', 'chin', 'moustache', 'neck', 'sideburns'] as const;
export const FITS = TRAITS.cut.texture_fit.values;
export type FitValue = (typeof FITS)[number];
export const HEAT_USE = ['none', 'rare', 'weekly', 'daily'] as const;
export const SWATCH_REGIONS = ['root', 'mids', 'ends'] as const;
export type SwatchRegion = (typeof SWATCH_REGIONS)[number];
export const REGIONS = TRAITS.colour.regions.values;
export type Region = (typeof REGIONS)[number];
export type TechniqueValue = (typeof TRAITS.colour.technique.values)[number];
/** Base techniques; `none` keeps the person's own colour as the base. */
export const BASE_TECHNIQUES = ['none', 'all_over', 'gloss', 'demi_refresh', 'grey_coverage', 'vivid_all_over', 'colour_correction'] as const;
export type BaseTechnique = (typeof BASE_TECHNIQUES)[number];
/** What a look does to grey hair: covers it, tints it see-through, blends it with lights or lowlights, leaves it showing, or takes the hair to silver. */
export const GREY_EFFECTS = TRAITS.colour.grey_effect.values;
export type GreyEffect = (typeof GREY_EFFECTS)[number];
export const LEVELS = ['low', 'medium', 'high'] as const;
export const FADE_SPEEDS = ['slow', 'medium', 'fast'] as const;
export const HAIR_GROUPS = ['straight_wavy', 'curly_coily'] as const;
export const MEASURE_VIEWS = ['frontal', 'profile'] as const;
/** Measurement gates a band may require. */
export const BAND_GATES = ['hairline_visible'] as const;
/** Prompt templates and their word budgets. */
export const PROMPT_BUDGETS = {
  try_on_cut: 300,
  try_on_beard: 300,
  try_on_colour: 300,
  try_on_both: 300,
  quick_grid: 150,
  final_card: 250,
  repair: 40,
  second_opinion: 330,
  explain_card: 150,
} as const;
export type PromptKind = keyof typeof PROMPT_BUDGETS;
export const PROMPT_KINDS = Object.keys(PROMPT_BUDGETS) as readonly PromptKind[];

type Values<S> = S extends { readonly values: readonly (infer V)[] } ? V : never;
export type ShadeFamily = Values<typeof TRAITS.colour.family>;
export type Tone = Values<typeof TRAITS.colour.tone>;
export type Warmth = Values<typeof TRAITS.colour.warmth>;
export type TechniqueCategory = Values<typeof TRAITS.colour.technique_category>;
export type Lightening = Values<typeof TRAITS.colour.lightening>;
export type FringeKind = Values<typeof TRAITS.cut.fringe>;
export type CheekLine = Values<typeof TRAITS.beard.cheek_line>;
export type BeardNeckline = Values<typeof TRAITS.beard.neckline>;
