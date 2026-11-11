/**
 * sRGB to CIE Lab (D65, 2° observer) and back, the colour space of every colour hint and tint target.
 * Pure; the constants are the IEC 61966-2-1 and CIE 15 values.
 */
import type { Lab } from '../measure/observation.ts';

/** D65 reference white, Y normalised to 1. */
const WHITE = { x: 0.95047, y: 1, z: 1.08883 } as const;
const EPSILON = (6 / 29) ** 3;
const KAPPA_INV = 1 / (3 * (6 / 29) ** 2);

/** sRGB channel (0-255) to linear light (0-1). */
export function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const f = (t: number): number => (t > EPSILON ? Math.cbrt(t) : t * KAPPA_INV + 4 / 29);

/** Converts one sRGB colour (channels 0-255) to Lab: L 0-100, a and b roughly -128 to 127. */
export function srgbToLab(r: number, g: number, b: number): Lab {
  const lr = linearise(r);
  const lg = linearise(g);
  const lb = linearise(b);
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / WHITE.x;
  const y = (0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb) / WHITE.y;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / WHITE.z;
  const fy = f(y);
  return { l: 116 * fy - 16, a: 500 * (f(x) - fy), b: 200 * (fy - f(z)) };
}

const fInverse = (t: number): number => (t > 6 / 29 ? t ** 3 : (t - 4 / 29) / KAPPA_INV);

/** Linear light (0-1) to an sRGB channel (0-255), rounded and clamped. */
function encode(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.max(0, linear) ** (1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(c * 255)));
}

/** Converts Lab back to sRGB (channels 0-255, clamped to the gamut), the inverse of `srgbToLab`. */
export function labToSrgb(lab: Lab): readonly [number, number, number] {
  const fy = (lab.l + 16) / 116;
  const x = WHITE.x * fInverse(fy + lab.a / 500);
  const y = WHITE.y * fInverse(fy);
  const z = WHITE.z * fInverse(fy - lab.b / 200);
  return [
    encode(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    encode(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
    encode(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
  ];
}

/** Per-channel median of Lab samples, or null when there are none. Sorts copies, never the input. */
export function medianLab(samples: readonly Lab[]): Lab | null {
  if (samples.length === 0) return null;
  const median = (values: number[]): number => {
    values.sort((p, q) => p - q);
    const mid = values.length >> 1;
    return values.length % 2 === 1 ? (values[mid] ?? 0) : ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2;
  };
  return { l: median(samples.map((s) => s.l)), a: median(samples.map((s) => s.a)), b: median(samples.map((s) => s.b)) };
}
