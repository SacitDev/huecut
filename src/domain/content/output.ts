/**
 * The shapes `npm run content:build` writes to `src/generated/`: the library index of checked
 * records, one details file per record, and `consult.json`. The platform reads them with one typed cast.
 */
import type { Range } from '../facts/registry.ts';
import type { ItemTraits, TargetKind } from './traits.ts';
import type {
  BeardStyle, Bands, ColourLook, Haircut, JourneyRecord, LibraryModel, PictureEntry, Placement, Policy, PromptTemplate,
  QuestionOption, QuestionsFile, Referral, Reminder, RuleFor, Shade, Technique,
} from './types.ts';
import type { Collection, Lightening, PromptKind, Region, ShadeFamily, SwatchRegion, TechniqueCategory, Tone, Warmth } from './values.ts';

/** CIE L*a*b* (D65). */
export type Lab = readonly [L: number, a: number, b: number];
/** Brightness-band targets: shadows at L* - 15, mid-tones at L*, light at L* + 12, chroma kept. */
export interface LabBands { readonly shadows: Lab; readonly mid: Lab; readonly light: Lab }
/** A shade's targets for each swatch region. */
export type ShadeLab = Readonly<Record<SwatchRegion, LabBands>>;
/** A look's targets per region after placement precedence; `null` keeps the person's own colour there. */
export type LookLab = Readonly<Record<SwatchRegion, LabBands | null>>;
/** Pictures by key, `<model-id>/<item-id>-<view>`. */
export type Pictures = Readonly<Record<string, PictureEntry>>;

interface IndexCommon {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
}
/** A cut or a variant, with what the engine needs: traits, fits and the length feasibility compares. */
export interface CutIndexEntry extends IndexCommon {
  readonly kind: 'cut';
  readonly collections: readonly Collection[];
  readonly family: string;
  /** The cut a variant belongs to, or `null`. */
  readonly variant_of: string | null;
  readonly traits: ItemTraits<'cut'>;
  readonly texture_fit: Haircut['texture_fit'];
  readonly density_fit: Haircut['density_fit'];
  /** The lower end of the longest zone, in cm (feasibility). */
  readonly required_cm: number;
  readonly pairs_with: Haircut['pairs_with'];
  readonly pictures: Pictures;
  /** The look's own caption when its pictures show another texture than the model's usual one. */
  readonly shown_on?: string;
}
export interface BeardIndexEntry extends IndexCommon {
  readonly kind: 'beard';
  readonly collections: readonly Collection[];
  readonly traits: ItemTraits<'beard'>;
  /** Hair length per zone, read by the beard ranking. */
  readonly zones_mm: BeardStyle['zones_mm'];
  readonly pairs_with: BeardStyle['pairs_with'];
  readonly pictures: Pictures;
}
/**
 * One shade a look needs in a region: its levels and the lift of the technique that puts it there. `darkens` is false for a
 * lighter piece and a pre-lightened level, which never take hair down.
 */
export interface ShadeNeed { readonly level: Range; readonly lifts: Technique['lifts']; readonly darkens: boolean }
/** Every shade a look needs at the roots (empty where it leaves them alone) and on the lengths, each judged on its own. */
export interface LookNeeds { readonly roots: readonly ShadeNeed[]; readonly lengths: readonly ShadeNeed[] }

/** A colour look with its build traits, the shades it needs by region, its placements (`placement_not_lighter`) and the preview's Lab targets. */
export interface LookIndexEntry extends IndexCommon {
  readonly kind: 'colour';
  readonly collections: readonly Collection[];
  readonly traits: ItemTraits<'colour'>;
  readonly needs: LookNeeds;
  readonly placements: readonly Pick<Placement, 'technique' | 'shade'>[];
  readonly lab: LookLab;
  readonly pictures: Pictures;
}
export interface ShadeIndexEntry extends IndexCommon {
  readonly kind: 'shade';
  readonly family: ShadeFamily;
  readonly level: Range;
  readonly tone: Tone;
  readonly warmth: Warmth;
  readonly swatch: Shade['swatch'];
  readonly lab: ShadeLab;
}
export interface TechniqueIndexEntry extends IndexCommon {
  readonly kind: 'technique';
  readonly category: TechniqueCategory;
  readonly regions: readonly Region[];
  readonly lightening: Lightening;
  readonly salon_only: boolean;
}
export type IndexEntry = CutIndexEntry | BeardIndexEntry | LookIndexEntry | ShadeIndexEntry | TechniqueIndexEntry;

/** `src/generated/library-index.json`: checked records only, and the library models. */
export interface LibraryIndex {
  readonly models: readonly LibraryModel[];
  readonly entries: readonly IndexEntry[];
}

/** `src/generated/details/<id>.json`: the whole record with its derived traits, without its review. */
export type CutDetail = Omit<Haircut, 'review' | 'traits' | 'variants'> & {
  readonly traits: ItemTraits<'cut'>;
  readonly variant_of: string | null;
  /** The cut's variants, each with its own details file; empty on a variant. */
  readonly variants: readonly { readonly id: string; readonly name: string }[];
  readonly required_cm: number;
};
export type BeardDetail = Omit<BeardStyle, 'review' | 'traits'> & { readonly traits: ItemTraits<'beard'> };
export type LookDetail = Omit<ColourLook, 'review'> & { readonly traits: ItemTraits<'colour'>; readonly lab: LookLab };
export type ShadeDetail = Omit<Shade, 'review'> & { readonly lab: ShadeLab };
export type TechniqueDetail = Omit<Technique, 'review'>;
export type Detail = CutDetail | BeardDetail | LookDetail | ShadeDetail | TechniqueDetail;

/**
 * A question option as `consult.json` ships it: one that names an `illustration` also carries the file the build
 * found for it in `public/illustrations/` (`q-hairline-m.svg`, `q-texture-wavy.avif`).
 */
export type ShippedOption = QuestionOption & { readonly illustration_file?: string };

/** `src/generated/consult.json`: everything the consult flow and the engine read. */
export interface ConsultData {
  readonly rules: { readonly [T in TargetKind]: readonly RuleFor<T>[] };
  readonly journey: readonly JourneyRecord[];
  readonly reminders: readonly (Reminder | Referral)[];
  /** `"<trait>.<value>"`, or `"<trait>.<min>-<max>"` for a range, to a short client phrase. */
  readonly phrases: Readonly<Record<string, string>>;
  readonly policy: Policy;
  readonly bands: Bands;
  /** Each option is a `ShippedOption`. */
  readonly questions: QuestionsFile;
  readonly prompts: Partial<Readonly<Record<PromptKind, PromptTemplate>>>;
}
