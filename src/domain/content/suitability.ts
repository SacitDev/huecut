/** The engine's ranking constants, the `suitability` block of `content/policy.json`. */
import type { FitValue, JourneyLabel } from './values.ts';

/** The ranking constants; `sources` says where each came from ("chosen, not measured" is a fine answer). */
export interface Suitability {
  /** Every rank rule that fires, wishes and taste included, counts once on this one scale. */
  readonly rules: { readonly tau: number; readonly cap: number };
  readonly texture_fit: Readonly<Record<FitValue, number>>;
  readonly density_fit: Readonly<Record<FitValue, number>>;
  /** `miss`: a stated limit is a limit, so any miss costs this step before the size of the miss counts. */
  readonly trim: { readonly power: number; readonly floor: number; readonly miss: number };
  readonly styling: { readonly grace_minutes: number; readonly power: number; readonly floor: number; readonly miss: number };
  /** Growth waited for divides the factor by e every this many weeks. */
  readonly growth_weeks: number;
  /** By `pref.change_amount`, or `unknown`: the factor for 0, 1, 2 and 3 or more length classes apart. */
  readonly change: Readonly<Record<'subtle' | 'noticeable' | 'bold' | 'unknown', readonly number[]>>;
  readonly frame: {
    readonly balance: number; readonly jaw_balance: number; readonly sigma: number; readonly jaw_sigma: number;
    /** The frame factor is never below this. */
    readonly floor: number;
    /** How far past the person's own proportions "emphasise" aims. */
    readonly emphasise: number;
    readonly no_wish_aims: readonly ('soften' | 'between' | 'preserve' | 'emphasise')[];
    readonly sides: Readonly<Record<string, number>>;
    readonly height: Readonly<Record<string, number>>;
    /** Length falling past the chin, by length class, as apparent length. */
    readonly length: Readonly<Record<string, number>>;
    readonly fringe: Readonly<Record<string, number>>;
    readonly zones: { readonly sides: number; readonly temples: number; readonly crown: number; readonly jaw: number; readonly ends: number };
    readonly texture: Readonly<Record<'straight' | 'wavy' | 'curly' | 'coily' | 'mixed', number>>;
    /** A jaw to cheek number at medium confidence counts only outside this range: the clear cases. */
    readonly jaw_clear: readonly [number, number];
    /** The forehead and lower-third readings: a cut against one takes `miss`; the fringes that weigh on a short forehead. */
    readonly thirds: { readonly miss: number; readonly heavy_fringes: readonly string[] };
  };
  readonly colour: {
    readonly tau: number; readonly cap: number;
    /** Each level of lift or darkening costs this much: at equal preference and label, the smaller change is the more realistic. */
    readonly lift_step: number;
    readonly label: Readonly<Record<JourneyLabel, number>>;
    readonly harmony: { readonly sigma: number; readonly lightness: number; readonly targets: Readonly<Record<'warm' | 'neutral' | 'olive' | 'cool', number>> };
  };
  readonly slate: { readonly lambda: number; readonly floor: number; readonly weights: Readonly<Record<string, number>> };
  readonly beards: {
    readonly scale_mm: number; readonly sigma: number; readonly shown: number;
    readonly patchy: { readonly full_mm: number; readonly full: number; readonly some_mm: number; readonly some: number };
    readonly not_paired: number; readonly wish_note: number;
    /** A chin beard longer than this (mm) is a long chin, kept short for a longer lower third. */
    readonly short_chin_mm: number;
  };
  /** The "Because" lines of decisive factors. */
  readonly because: {
    readonly trim: string; readonly styling: string; readonly density: string;
    readonly does: { readonly adds_height: string; readonly keeps_top_low: string; readonly sides_close: string; readonly adds_width: string; readonly fringe_line: string; readonly balanced: string };
    readonly aim: Readonly<Record<'soften' | 'between' | 'preserve' | 'emphasise', string>>;
    /** A factor counts as decisive when it beats the median candidate by this ratio. */
    readonly decisive_ratio: number;
  };
  readonly sources: Readonly<Record<string, string>>;
}
