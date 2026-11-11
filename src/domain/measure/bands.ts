/**
 * Bands: `bands.json` turns numbers into fact values. A value within the band's margin of a cut gets low confidence. A band whose
 * cuts or margin are null gives nothing, so its fact stays unknown. Rules never hold raw thresholds. Two numbers also reach the
 * engine as numbers, for the face-frame factor.
 */
import type { Band, Bands } from '../content/types.ts';
import { FACTS, meetsMin, type Confidence, type FactKey } from '../facts/registry.ts';
import type { FaceFacts, FusedValue } from '../fuse/fuse.ts';
import { MEASURE_KEYS, type MeasureKey } from './measure.ts';

/** A fact value read from a band, before `toFacts` checks it against the registry. */
export interface BandReading {
  readonly fact: FactKey;
  readonly value: string;
  readonly confidence: Confidence;
  /** Plain words for the UI, for example "3 photos agree". */
  readonly basis: string;
}

const isMeasureKey = (name: string): name is MeasureKey => (MEASURE_KEYS as readonly string[]).includes(name);

/**
 * Provisional, not a validated bound: a reading below high uses the band's margin times this. A 15° turn moves a ratio 3.4%,
 * about 0.028 of a width to length near 0.8, more than that band's 0.02 margin. Never narrow it because many readings land on a boundary.
 */
export const MEDIUM_MARGIN_FACTOR = 1.5;

/**
 * The band's value for `value` and, within the margin of a cut (inclusive), the value on the cut's other side. Cuts are
 * ascending: a value below a cut's `below` takes that cut's value, the last cut takes the rest. Null while unset.
 */
export function bandValue(band: Band, value: number, confidence: Confidence): { readonly value: string; readonly between: string | null } | null {
  const { margin, cuts } = band;
  const bounds = cuts.slice(0, -1).map((c) => c.below);
  const last = cuts[cuts.length - 1];
  if (margin === null || !last || bounds.some((b) => b === null || b === undefined)) return null;
  const below = bounds as readonly number[];
  const index = below.findIndex((b) => value < b);
  const chosen = index === -1 ? last : cuts[index];
  if (!chosen) return null;
  const reach = confidence === 'high' ? margin : margin * MEDIUM_MARGIN_FACTOR;
  const near = below.findIndex((b) => Math.abs(value - b) <= reach);
  const other = near === -1 ? undefined : cuts[near] === chosen ? cuts[near + 1] : cuts[near];
  return { value: chosen.value, between: other?.value ?? null };
}

/** "1 photo", "3 photos agree" or "2 of 3 photos agree", with "approximate (close-up photo)" when it was. */
export function basisOf(f: FusedValue): string {
  const count =
    f.photos === 1 ? '1 photo' : f.agreeing === f.photos ? `${String(f.photos)} photos agree` : `${String(f.agreeing)} of ${String(f.photos)} photos agree`;
  return f.approximate ? `${count}, approximate (close-up photo)` : count;
}

/**
 * Applies one band to the fused face facts of its view; null when the measurement is missing, a gate fails or
 * the band is unset. A band naming a measurement `measure()` never makes is broken content and throws.
 */
export function applyBand(band: Band, faceFacts: FaceFacts): BandReading | null {
  if (!isMeasureKey(band.from)) throw new Error(`Band for ${band.fact} reads "${band.from}", which is not a measurement`);
  const view = faceFacts[band.view];
  if (band.requires?.includes('hairline_visible') && !view.hairlineVisible) return null;
  const fused = view.values[band.from];
  const read = fused ? bandValue(band, fused.value, fused.confidence) : null;
  if (!fused || !read) return null;
  return { fact: band.fact, value: read.value, confidence: read.between === null ? fused.confidence : 'low', basis: basisOf(fused) };
}

/** Every band's reading that exists. */
export const bandReadings = (bands: Bands, faceFacts: FaceFacts): BandReading[] =>
  bands.bands.flatMap((band) => applyBand(band, faceFacts) ?? []);

/** The measurements the face-frame factor reads as numbers. */
export const NUMERIC_FACE_FACTS = { width_to_length: 'face.width_to_length', jaw_to_cheek: 'face.jaw_to_cheek' } as const satisfies Partial<Record<MeasureKey, FactKey>>;

/** The numeric face facts: a frontal value that meets its fact's minimum and lies inside its range; anything else stays unknown, so neutral. */
export function numericReadings(faceFacts: FaceFacts): readonly { readonly fact: FactKey; readonly value: number; readonly confidence: Confidence; readonly basis: string }[] {
  return Object.entries(NUMERIC_FACE_FACTS).flatMap(([measure, fact]) => {
    const fused = faceFacts.frontal.values[measure as MeasureKey];
    const spec = FACTS[fact];
    return fused && meetsMin(fact, fused.confidence) && fused.value >= spec.range[0] && fused.value <= spec.range[1] ? [{ fact, value: fused.value, confidence: fused.confidence, basis: basisOf(fused) }] : [];
  });
}
