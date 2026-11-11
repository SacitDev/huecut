/**
 * Colour-statistics transfer for the on-device colour preview: inside the hair
 * mask each pixel's Lab moves to the target for its place down the hair (root, mids, ends) and its brightness
 * band (shadows, mid-tones, light), with soft blends and a feather inside the mask edge. Pure; pixels outside
 * the mask are never changed.
 */
import type { RgbaImage } from '../measure/mask.ts';
import type { Lab } from '../measure/observation.ts';
import { labToSrgb, srgbToLab } from './lab.ts';

export const REGIONS = ['root', 'mids', 'ends'] as const;
export const BANDS = ['shadows', 'mid', 'light'] as const;
export type HairRegion = (typeof REGIONS)[number];
export type BrightnessBand = (typeof BANDS)[number];

/** A hair or face-skin mask, row by row, at any size; a value above 0 is inside it (the worker's masks hold 0 or 255). */
export interface HairMask {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8Array;
}

/** Where one region and band moves: its mean, and its spread (null keeps the photo's own spread). */
export interface BandTarget {
  readonly mean: Lab;
  readonly spread: Lab | null;
}
export type RegionTarget = Readonly<Record<BrightnessBand, BandTarget>>;
/** One target per region; null keeps the person's own colour there (a `none` base with no placement). */
export type TransferTarget = Readonly<Record<HairRegion, RegionTarget | null>>;

/** Lab targets per region and band, as a look gives them. */
export type LabTargets = Readonly<Record<HairRegion, Readonly<Record<BrightnessBand, Lab>> | null>>;

/** The feather runs this share of the image's long side inwards from the mask edge. */
const FEATHER_SHARE = 0.004;
/** Spreads below this (Lab units) count as this, so a flat band is not stretched without bound. */
const MIN_SPREAD = 1;
const STRETCH = { min: 0.25, max: 4 } as const;
/** A band of a measured picture with less weight than this borrows the picture's overall hair statistics. */
const MIN_CELL_WEIGHT = 20;
const CELLS = REGIONS.length * BANDS.length;

/** The hair pixels of one image: their indices, Lab values and position down their column (0 top, 1 at the ends). */
interface HairPixels {
  readonly index: Uint32Array;
  readonly lab: Float32Array;
  readonly position: Float32Array;
}

interface CellStats {
  readonly weight: number;
  readonly mean: Lab;
  readonly spread: Lab;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Soft weights over three centres (piecewise linear, summing to 1), so neighbouring regions and bands blend softly. */
function hat3(v: number, c0: number, c1: number, c2: number): readonly [number, number, number] {
  if (v <= c0) return [1, 0, 0];
  if (v >= c2) return [0, 0, 1];
  if (v <= c1) {
    const k = (v - c0) / (c1 - c0);
    return [1 - k, k, 0];
  }
  const k = (v - c1) / (c2 - c1);
  return [0, 1 - k, k];
}

/** The mask sampled (nearest neighbour) at the image's size: 1 for hair, 0 elsewhere. */
export function maskAt(mask: HairMask, widthPx: number, heightPx: number): Uint8Array {
  const out = new Uint8Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y++) {
    const my = Math.min(mask.heightPx - 1, Math.floor(((y + 0.5) * mask.heightPx) / heightPx));
    for (let x = 0; x < widthPx; x++) {
      const mx = Math.min(mask.widthPx - 1, Math.floor(((x + 0.5) * mask.widthPx) / widthPx));
      out[y * widthPx + x] = (mask.data[my * mask.widthPx + mx] ?? 0) > 0 ? 1 : 0;
    }
  }
  return out;
}

/**
 * A column shorter than this share of the longest is hair that a parting or the forehead cuts short, so its lowest row is
 * not where the hair ends: without this, the centre of a parted head turned the colour of the ends.
 */
const MIN_LENGTH_SHARE = 0.6;
const LONG_COLUMN_RANK = 0.95;

/** Top and lowest hair row of every column (-1 where a column has no hair) and the longest column's span. */
function columnExtents(inside: Uint8Array, w: number, h: number): { top: Int32Array; bottom: Int32Array; count: number; longest: number } {
  const top = new Int32Array(w).fill(-1);
  const bottom = new Int32Array(w).fill(-1);
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside[y * w + x]) continue;
      if (top[x] === -1) top[x] = y;
      bottom[x] = y;
      count++;
    }
  }
  // The 95th percentile, not the maximum: one stray long column must not hold the rest of the hair back from its ends.
  const spans = Int32Array.from(Array.from(top).flatMap((t, x) => (t === -1 ? [] : [(bottom[x] ?? t) - t]))).sort();
  return { top, bottom, count, longest: spans[Math.floor(LONG_COLUMN_RANK * (spans.length - 1))] ?? 0 };
}

function hairPixels(image: RgbaImage, inside: Uint8Array, flatAt: number | null = null): HairPixels {
  const { widthPx: w, heightPx: h, data } = image;
  const { top, bottom, count, longest } = columnExtents(inside, w, h);
  const out = { index: new Uint32Array(count), lab: new Float32Array(count * 3), position: new Float32Array(count) };
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!inside[i]) continue;
      const lab = srgbToLab(data[i * 4] ?? 0, data[i * 4 + 1] ?? 0, data[i * 4 + 2] ?? 0);
      const t = top[x] ?? 0;
      const span = Math.max((bottom[x] ?? t) - t, longest * MIN_LENGTH_SHARE);
      out.index[n] = i;
      out.lab.set([lab.l, lab.a, lab.b], n * 3);
      out.position[n] = flatAt ?? (span > 0 ? (y - t) / span : 0);
      n++;
    }
  }
  return out;
}

/** How far below a column's lowest hair the face is looked for, as a share of the image height. */
const FACE_REACH = 0.006;
/**
 * The share of hair columns that must end against the face for the hair to count as short. Measured on five fictional photos:
 * short hair 93 to 96 %, bob and longer 31 to 46 %.
 */
const SHORT_HAIR_SHARE = 0.8;

/**
 * Where a short head of hair sits on the root-to-ends scale, or null for longer hair: hair that ends on the face has no ends
 * to show, and painting "ends" there drew a light band along the hairline. It takes the mids, else the root, else the ends.
 */
function shortHairPosition(inside: Uint8Array, faceSkin: HairMask | null, w: number, h: number, target: TransferTarget): number | null {
  if (!faceSkin) return null;
  const face = maskAt(faceSkin, w, h);
  const { bottom } = columnExtents(inside, w, h);
  const reach = Math.max(2, Math.round(h * FACE_REACH));
  let columns = 0;
  let onFace = 0;
  for (let x = 0; x < w; x++) {
    const b = bottom[x] ?? -1;
    if (b < 0) continue;
    columns++;
    if (face[Math.min(h - 1, b + reach) * w + x]) onFace++;
  }
  if (columns === 0 || onFace < SHORT_HAIR_SHARE * columns) return null;
  return target.mids ? 0.5 : target.root ? 0 : 1;
}

/** Centres of the three brightness bands: the 1/6, 1/2 and 5/6 points of the hair's own L (a histogram in 0.1 steps). */
function bandCentres(lab: Float32Array): readonly [number, number, number] {
  const bins = new Uint32Array(1001);
  const n = lab.length / 3;
  for (let i = 0; i < n; i++) {
    const bin = Math.round(clamp(lab[i * 3] ?? 0, 0, 100) * 10);
    bins[bin] = (bins[bin] ?? 0) + 1;
  }
  const at = (share: number): number => {
    const target = share * n;
    let seen = 0;
    for (let b = 0; b < bins.length; b++) {
      seen += bins[b] ?? 0;
      if (seen >= target) return b / 10;
    }
    return 100;
  };
  return [at(1 / 6), at(1 / 2), at(5 / 6)];
}

/** The nine (region, band) weights of one hair pixel, region-major. */
function cellWeights(position: number, l: number, centres: readonly [number, number, number]): Float64Array {
  const wp = hat3(position, 0, 0.5, 1);
  const wb = hat3(l, ...centres);
  const out = new Float64Array(CELLS);
  wp.forEach((p, r) => {
    wb.forEach((q, b) => {
      out[r * 3 + b] = p * q;
    });
  });
  return out;
}

const statsOf = (s: Float64Array, o: number): CellStats => {
  const w = s[o] ?? 0;
  const mean = (c: number): number => (w > 0 ? (s[o + 1 + c] ?? 0) / w : 0);
  const spread = (c: number): number => (w > 0 ? Math.sqrt(Math.max(0, (s[o + 4 + c] ?? 0) / w - mean(c) ** 2)) : 0);
  return { weight: w, mean: { l: mean(0), a: mean(1), b: mean(2) }, spread: { l: spread(0), a: spread(1), b: spread(2) } };
};

/** Weighted mean and spread of every (region, band) cell, then of all hair together (the tenth entry). */
function cellStats(pixels: HairPixels, centres: readonly [number, number, number]): CellStats[] {
  const sums = new Float64Array((CELLS + 1) * 7);
  const add = (cell: number, w: number, l: number, a: number, b: number): void => {
    const o = cell * 7;
    const values = [w, w * l, w * a, w * b, w * l * l, w * a * a, w * b * b];
    for (let k = 0; k < 7; k++) sums[o + k] = (sums[o + k] ?? 0) + (values[k] ?? 0);
  };
  for (let i = 0; i < pixels.index.length; i++) {
    const [l = 0, a = 0, b = 0] = pixels.lab.subarray(i * 3, i * 3 + 3);
    const weights = cellWeights(pixels.position[i] ?? 0, l, centres);
    weights.forEach((w, cell) => {
      if (w > 0) add(cell, w, l, a, b);
    });
    add(CELLS, 1, l, a, b);
  }
  return Array.from({ length: CELLS + 1 }, (_, cell) => statsOf(sums, cell * 7));
}

/** One-dimensional box blur of `n` values at `start`, `stride` apart, with edge values repeated past the ends. */
function blurLine(src: Float32Array, dst: Float32Array, start: number, stride: number, n: number, r: number): void {
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = (prefix[i] ?? 0) + (src[start + i * stride] ?? 0);
  const first = src[start] ?? 0;
  const last = src[start + (n - 1) * stride] ?? 0;
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - r);
    const hi = Math.min(n, i + r + 1);
    const sum = (prefix[hi] ?? 0) - (prefix[lo] ?? 0) + Math.max(0, r - i) * first + Math.max(0, i + r - (n - 1)) * last;
    dst[start + i * stride] = sum / (2 * r + 1);
  }
}

/** How strongly each pixel takes the new colour: 0 outside the mask, rising to 1 a few pixels inside its edge. */
export function featherInside(inside: Uint8Array, w: number, h: number): Float32Array {
  const r = Math.max(1, Math.round(Math.max(w, h) * FEATHER_SHARE));
  const src = Float32Array.from(inside);
  const across = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) blurLine(src, across, y * w, 1, w, r);
  for (let x = 0; x < w; x++) blurLine(across, out, x, w, h, r);
  for (let i = 0; i < out.length; i++) if (!inside[i]) out[i] = 0;
  return out;
}

/** A look's Lab targets as a transfer target that keeps the photo's own spread. */
export function targetsFromLab(targets: LabTargets): TransferTarget {
  const region = (r: HairRegion): RegionTarget | null => {
    const t = targets[r];
    return t ? { shadows: { mean: t.shadows, spread: null }, mid: { mean: t.mid, spread: null }, light: { mean: t.light, spread: null } } : null;
  };
  return { root: region('root'), mids: region('mids'), ends: region('ends') };
}

/**
 * The hair statistics of a picture (an AI result) per region and band, as a target with its own spreads
 * (hair-only version). A band with too little hair borrows the picture's overall statistics; null when
 * the picture has no hair in the mask.
 */
export function measureHair(image: RgbaImage, mask: HairMask): TransferTarget | null {
  const pixels = hairPixels(image, maskAt(mask, image.widthPx, image.heightPx));
  if (pixels.index.length === 0) return null;
  const stats = cellStats(pixels, bandCentres(pixels.lab));
  const overall = stats[CELLS];
  const band = (r: number, b: number): BandTarget => {
    const s = (stats[r * 3 + b]?.weight ?? 0) >= MIN_CELL_WEIGHT ? stats[r * 3 + b] : overall;
    return { mean: s?.mean ?? { l: 0, a: 0, b: 0 }, spread: s?.spread ?? null };
  };
  const region = (r: number): RegionTarget => ({ shadows: band(r, 0), mid: band(r, 1), light: band(r, 2) });
  return { root: region(0), mids: region(1), ends: region(2) };
}

/**
 * One pixel moved from the source cell to the target's: its lightness keeps its distance from the cell's mean, and its chroma
 * is the target's own, fading with the shadows. Added as an offset, a near-black pixel went past neutral to the target's
 * opposite hue (the teal band beside the neck).
 */
function movedLab(lab: Lab, source: CellStats, target: BandTarget): Lab {
  const stretch = target.spread ? clamp(target.spread.l / Math.max(source.spread.l, MIN_SPREAD), STRETCH.min, STRETCH.max) : 1;
  const l = (lab.l - source.mean.l) * stretch + target.mean.l;
  const chroma = clamp(l / Math.max(target.mean.l, 1), 0, 1);
  return { l, a: target.mean.a * chroma, b: target.mean.b * chroma };
}

/** The new Lab of one hair pixel, or null when no region with a target covers it (its own colour stays). */
function newLab(lab: Lab, weights: Float64Array, stats: readonly CellStats[], target: TransferTarget): Lab | null {
  let covered = 0;
  const out = { l: 0, a: 0, b: 0 };
  weights.forEach((w, cell) => {
    if (w === 0) return;
    const region = target[REGIONS[Math.floor(cell / 3)] ?? 'root'];
    const band = region?.[BANDS[cell % 3] ?? 'mid'];
    const source = stats[cell];
    if (band && source) covered += w;
    const next = band && source ? movedLab(lab, source, band) : lab;
    for (const c of ['l', 'a', 'b'] as const) out[c] += w * next[c];
  });
  return covered > 0 ? out : null;
}

/**
 * Recolours the hair in `mask` towards `target`; returns a new image and leaves every pixel outside the mask as it was.
 * `face` is the segmenter's face skin, when known: short hair ending on it takes one flat colour.
 */
export function transferColour(image: RgbaImage, mask: HairMask, target: TransferTarget, face: HairMask | null = null): RgbaImage {
  const { widthPx: w, heightPx: h } = image;
  const data = new Uint8ClampedArray(image.data);
  const inside = maskAt(mask, w, h);
  const pixels = hairPixels(image, inside, shortHairPosition(inside, face, w, h, target));
  if (pixels.index.length === 0 || REGIONS.every((r) => target[r] === null)) return { widthPx: w, heightPx: h, data };
  const centres = bandCentres(pixels.lab);
  const stats = cellStats(pixels, centres);
  const alpha = featherInside(inside, w, h);
  for (let n = 0; n < pixels.index.length; n++) {
    const [l = 0, a = 0, b = 0] = pixels.lab.subarray(n * 3, n * 3 + 3);
    const next = newLab({ l, a, b }, cellWeights(pixels.position[n] ?? 0, l, centres), stats, target);
    if (!next) continue;
    const i = pixels.index[n] ?? 0;
    const k = alpha[i] ?? 0;
    labToSrgb(next).forEach((v, c) => {
      const old = data[i * 4 + c] ?? 0;
      data[i * 4 + c] = Math.round(old + (v - old) * k);
    });
  }
  return { widthPx: w, heightPx: h, data };
}
