/**
 * Colour hints: the worker's median Lab samples as swatches shown beside a question,
 * a skin-depth suggestion by the Individual Typology Angle, and the nearest of given reference swatches.
 * Hints only: never a fact, no reference-card correction in v1, and never the undertone.
 */
import type { FactValue } from '../facts/registry.ts';
import type { HairMeasures, Lab } from './observation.ts';

/** D65 reference white, as in `colour/lab.ts`. */
const WHITE = { x: 0.95047, y: 1, z: 1.08883 } as const;
const DELTA = 6 / 29;

const fInverse = (t: number): number => (t > DELTA ? t ** 3 : 3 * DELTA ** 2 * (t - 4 / 29));
const gamma = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const byte = (c: number): string =>
  Math.round(Math.min(1, Math.max(0, gamma(c))) * 255)
    .toString(16)
    .padStart(2, '0');

/** Lab (D65) to an sRGB `#rrggbb` swatch, clamped into the gamut (the inverse of `srgbToLab`). */
export function labToHex(lab: Lab): string {
  const fy = (lab.l + 16) / 116;
  const x = WHITE.x * fInverse(fy + lab.a / 500);
  const y = WHITE.y * fInverse(fy);
  const z = WHITE.z * fInverse(fy - lab.b / 200);
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const b = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** Individual Typology Angle in degrees, atan((L* - 50) / b*); null when b* is not positive (not skin-like). */
export const itaDeg = (lab: Lab): number | null => (lab.b > 0 ? (Math.atan((lab.l - 50) / lab.b) * 180) / Math.PI : null);

/**
 * ITA° classes, lightest first (Chardon, Cretois & Hourseau 1991; the six classes of Del Bino et al. 2006): very
 * light above 55°, light 41-55°, intermediate 28-41°, tan 10-28°, brown -30 to 10°, dark below -30°. They map
 * one to one onto the six skin-depth answers.
 */
export const ITA_CLASSES = [
  { above: 55, depth: 'very_light' },
  { above: 41, depth: 'light' },
  { above: 28, depth: 'medium' },
  { above: 10, depth: 'tan_olive' },
  { above: -30, depth: 'deep' },
  { above: Number.NEGATIVE_INFINITY, depth: 'very_deep' },
] as const satisfies readonly { readonly above: number; readonly depth: FactValue<'look.skin_depth'> }[];

/** The skin-depth answer the photo suggests, or null; under uncorrected light it is a suggestion to confirm. */
export function skinDepthHint(skin: Lab): FactValue<'look.skin_depth'> | null {
  const ita = itaDeg(skin);
  return ita === null ? null : (ITA_CLASSES.find((c) => ita > c.above)?.depth ?? 'very_deep');
}

/** A reference swatch, for example a library shade's mid-tone Lab with its level. */
export interface Reference<V> {
  readonly value: V;
  readonly lab: Lab;
}

/** CIE 1976 colour difference. */
export const deltaE = (p: Lab, q: Lab): number => Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b);

/** The value of the reference nearest to `lab` (ΔE*ab), or null without references. */
export function nearest<V>(lab: Lab, references: readonly Reference<V>[]): V | null {
  let best: Reference<V> | null = null;
  for (const r of references) if (!best || deltaE(lab, r.lab) < deltaE(lab, best.lab)) best = r;
  return best ? best.value : null;
}

export interface ColourHints<V> {
  readonly hair: { readonly swatch: string; readonly nearest: V | null } | null;
  readonly skin: { readonly swatch: string; readonly depth: FactValue<'look.skin_depth'> | null } | null;
  readonly eyes: { readonly swatch: string } | null;
}

/** Hints from one photo's colour samples; `hairReferences` are the swatches a hair hint may point to. */
export function colourHints<V>(colour: HairMeasures['colour'], hairReferences: readonly Reference<V>[] = []): ColourHints<V> {
  return {
    hair: colour.hair ? { swatch: labToHex(colour.hair), nearest: nearest(colour.hair, hairReferences) } : null,
    skin: colour.skin ? { swatch: labToHex(colour.skin), depth: skinDepthHint(colour.skin) } : null,
    eyes: colour.eyes ? { swatch: labToHex(colour.eyes) } : null,
  };
}
