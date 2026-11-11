/**
 * `fuse(measurements) → FaceFacts`: a quality-weighted median per feature and per view
 * (frontal and profile never mixed). Near-identical photos count once; the fused value takes the confidence of the
 * photo whose value is the median: the median already resists one odd photo, and the band margins absorb normal spread.
 */
import type { Confidence } from '../facts/registry.ts';
import { MEASURE_KEYS, type MeasureKey, type PhotoMeasurements } from '../measure/measure.ts';
import { CONFIDENCE_WEIGHT, type MeasureView } from '../measure/quality.ts';

/**
 * Two photos are near-identical (a burst, or the same selfie taken again) when the face moved less than 2% of
 * the image, its width changed less than 2% and the head turned less than 2° on every axis: hand tremor
 * between shots. A step back, a turn or a new place moves the face further than that.
 */
export const DUPLICATE_MAX_SHIFT = 0.02;
export const DUPLICATE_MAX_SCALE = 0.02;
export const DUPLICATE_MAX_ANGLE_DEG = 2;

/**
 * A photo counts as agreeing when its value is within 5% of the fused value: an informative count for the face card's words
 * ("2 of 3 photos agree") and the close-up mark only; it never changes the confidence.
 */
export const AGREE_TOLERANCE = 0.05;

export interface FusedValue {
  readonly value: number;
  readonly confidence: Confidence;
  /** Distinct photos that gave this value (near-identical photos count once). */
  readonly photos: number;
  /** Of those, the ones within the agreement tolerance of the fused value. */
  readonly agreeing: number;
  /** Every agreeing photo was a close-up. */
  readonly approximate: boolean;
}

export interface ViewFacts {
  readonly values: Readonly<Partial<Record<MeasureKey, FusedValue>>>;
  /** At least one fused photo of this view showed the hairline (the `hairline_visible` band gate). */
  readonly hairlineVisible: boolean;
}
export type FaceFacts = Readonly<Record<MeasureView, ViewFacts>>;

const LEVELS: readonly Confidence[] = ['low', 'medium', 'high'];

interface Sample {
  readonly value: number;
  readonly weight: number;
  readonly confidence: Confidence;
  readonly approximate: boolean;
}

/** True when two photos are the same shot for fusion's purposes. */
export function nearIdentical(a: PhotoMeasurements, b: PhotoMeasurements): boolean {
  const { face: fa, pose: pa } = a;
  const { face: fb, pose: pb } = b;
  if (a.view !== b.view || !fa || !fb || !pa || !pb) return false;
  const still = (k: 'yawDeg' | 'pitchDeg' | 'rollDeg'): boolean => Math.abs(pa[k] - pb[k]) <= DUPLICATE_MAX_ANGLE_DEG;
  return (
    Math.abs(fa.x - fb.x) <= DUPLICATE_MAX_SHIFT &&
    Math.abs(fa.y - fb.y) <= DUPLICATE_MAX_SHIFT &&
    Math.abs(fa.width / fb.width - 1) <= DUPLICATE_MAX_SCALE &&
    still('yawDeg') &&
    still('pitchDeg') &&
    still('rollDeg')
  );
}

/** One photo per group of near-identical photos: the one with the highest weight (the first on a tie). */
export function distinctPhotos(measurements: readonly PhotoMeasurements[]): PhotoMeasurements[] {
  const kept: PhotoMeasurements[] = [];
  for (const m of [...measurements].sort((p, q) => q.weight - p.weight)) if (!kept.some((k) => nearIdentical(k, m))) kept.push(m);
  return kept;
}

/**
 * Weighted median: the first value whose cumulative weight reaches half, with that photo's confidence; on an exact half the mean
 * of the two values and the lower of their confidences.
 */
export function weightedMedian(samples: readonly { readonly value: number; readonly weight: number; readonly confidence: Confidence }[]): { readonly value: number; readonly confidence: Confidence } {
  const sorted = [...samples].sort((p, q) => p.value - q.value);
  const half = sorted.reduce((s, x) => s + x.weight, 0) / 2;
  let cumulative = 0;
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!s) break;
    cumulative += s.weight;
    const next = sorted[i + 1] ?? s;
    if (Math.abs(cumulative - half) < 1e-12) return { value: (s.value + next.value) / 2, confidence: LEVELS[Math.min(LEVELS.indexOf(s.confidence), LEVELS.indexOf(next.confidence))] ?? 'low' };
    if (cumulative > half) return { value: s.value, confidence: s.confidence };
  }
  return { value: Number.NaN, confidence: 'low' };
}

/** Fuses one feature of one view. */
function fuseSamples(samples: readonly Sample[]): FusedValue | undefined {
  const total = samples.reduce((s, x) => s + x.weight, 0);
  if (total <= 0) return undefined;
  const { value, confidence } = weightedMedian(samples);
  const agree = samples.filter((s) => Math.abs(s.value - value) <= AGREE_TOLERANCE * Math.abs(value));
  return {
    value,
    confidence,
    photos: samples.length,
    agreeing: agree.length,
    approximate: agree.length > 0 && agree.every((s) => s.approximate),
  };
}

/** Fuses every photo's values into per-view face facts. Photos with weight 0 or no view are left out. */
export function fuse(measurements: readonly PhotoMeasurements[]): FaceFacts {
  const photos = distinctPhotos(measurements.filter((m) => m.weight > 0 && m.view !== null));
  const byView = (view: MeasureView): ViewFacts => {
    const inView = photos.filter((m) => m.view === view);
    const values: Partial<Record<MeasureKey, FusedValue>> = {};
    for (const key of MEASURE_KEYS) {
      const samples = inView.flatMap((m): Sample[] => {
        const v = m.values[key];
        return v ? [{ value: v.value, weight: Math.min(m.weight, CONFIDENCE_WEIGHT[v.confidence]), confidence: v.confidence, approximate: v.approximate }] : [];
      });
      const fused = fuseSamples(samples);
      if (fused) values[key] = fused;
    }
    return { values, hairlineVisible: inView.some((m) => m.hairlineVisible) };
  };
  return { frontal: byView('frontal'), profile: byView('profile') };
}
