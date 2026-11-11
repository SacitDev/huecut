/**
 * The hairline on the main thread: the worker's boundary points from `mask.ts`, or a
 * line the person moved on Move the lines, turned into the painter's line and the hairline height the forehead
 * third starts from. A hidden hairline (fringe, head covering) gives no thirds.
 */
import type { Point } from '../geometry/coords.ts';
import type { HairMeasures } from './observation.ts';

/**
 * Hairline points within this share of the cheek width either side of the face midline set the hairline
 * height. The mask walks 15 columns from brow end to brow end and calls the hairline visible from its middle
 * 9; on the canonical face those span ±0.21 cheek widths, so 0.25 keeps them and leaves out the temples,
 * where recession lifts the line.
 */
export const MIDLINE_HALF_WIDTH_OF_CHEEK = 0.25;

/** The hairline as known for one photo; points are normalised, left to right in the image. */
export interface HairlineReading {
  readonly points: readonly Point[];
  /** Enough of the hairline shows to measure the forehead third. */
  readonly visible: boolean;
  /** The person moved it on Move the lines. */
  readonly edited: boolean;
}

/**
 * The hairline to use: the person's own line when they placed one, otherwise the mask's points. Null when
 * neither exists (the segmenter did not run), which is unknown rather than hidden.
 */
export function hairlineOf(hair: HairMeasures | null, edited: readonly Point[] | null): HairlineReading | null {
  if (edited && edited.length > 0) return { points: [...edited].sort((a, b) => a.x - b.x), visible: true, edited: true };
  if (!hair) return null;
  const points: Point[] = [];
  for (let i = 0; i + 1 < hair.hairline.length; i += 2) points.push({ x: hair.hairline[i] ?? 0, y: hair.hairline[i + 1] ?? 0 });
  points.sort((a, b) => a.x - b.x);
  return { points, visible: hair.hairlineVisible && points.length > 0, edited: false };
}

/** Median of a non-empty list. */
function median(values: readonly number[]): number {
  const s = [...values].sort((p, q) => p - q);
  const mid = s.length >> 1;
  return s.length % 2 === 1 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

/**
 * The hairline height at the face midline in levelled pixels: the median levelled height of the points within
 * `MIDLINE_HALF_WIDTH_OF_CHEEK` of the midline. `levelled` are the hairline points already levelled; null
 * when none lies near the midline.
 */
export function hairlineHeight(levelled: readonly Point[], midlineX: number, cheekWidthPx: number): number | null {
  const near = levelled.filter((p) => Math.abs(p.x - midlineX) <= MIDLINE_HALF_WIDTH_OF_CHEEK * cheekWidthPx);
  return near.length > 0 ? median(near.map((p) => p.y)) : null;
}
