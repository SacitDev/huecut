/**
 * Mask measures the worker takes at analysis resolution: hair coverage and extent,
 * hairline points on the hair / face-skin boundary above the brows, Lab colour hints and the 256 px preview
 * mask. Pure functions over the multi-class segmenter's category mask; the worker senses, `measure()` judges.
 */
import { medianLab, srgbToLab } from '../colour/lab.ts';
import type { HairMeasures, Lab, PreviewMask } from './observation.ts';

/** Classes of MediaPipe's multi-class selfie segmenter, in its model card's order. */
export const SEGMENT = { background: 0, hair: 1, bodySkin: 2, faceSkin: 3, clothes: 4, other: 5 } as const;

/** One class index per pixel, row by row. */
export interface CategoryMask {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8Array;
}

/** RGBA pixels, row by row (ImageData's layout). */
export interface RgbaImage {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8ClampedArray | Uint8Array;
}

/** Face mesh points as x, y, z triples (x, y normalised), in MediaPipe's 478-point layout. */
export type Landmarks = Float32Array;

/** Upper edge of both brows, and the forehead top and chin of the face outline (face mesh indices). */
const BROW_UPPER = [70, 63, 105, 66, 107, 336, 296, 334, 293, 300] as const;
const FOREHEAD_TOP = 10;
const CHIN = 152;
/** Iris centre and its four ring points, right then left (the refined mesh's last 10 points). */
const IRISES = [
  { centre: 468, ring: [469, 470, 471, 472] },
  { centre: 473, ring: [474, 475, 476, 477] },
] as const;

/** Columns walked across the forehead, brow end to brow end. */
const HAIRLINE_COLUMNS = 15;
/** Visible when at least 5 of the 9 middle columns find the boundary (the feasibility prototype's rule). */
const MIDDLE = { from: 3, to: 12, needed: 5 } as const;
/** The walk starts this share of the face height above the brow line, clear of the brow hairs. */
const START_ABOVE_BROW = 0.015;
/** Rows of another class tolerated between forehead skin and hair (soft mask edges). */
const MAX_GAP_ROWS = 2;
/** Colour samples come from a grid of at most this many cells on the long side. */
const SAMPLE_GRID = 160;
const MIN_CLASS_SAMPLES = 20;
const MIN_IRIS_SAMPLES = 8;
export const PREVIEW_LONG_SIDE_PX = 256;

interface Point {
  readonly x: number;
  readonly y: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function point(landmarks: Landmarks, index: number): Point | null {
  const x = landmarks[index * 3];
  const y = landmarks[index * 3 + 1];
  return x === undefined || y === undefined ? null : { x, y };
}

const classAt = (mask: CategoryMask, mx: number, my: number): number | undefined => mask.data[my * mask.widthPx + mx];

function labAt(image: RgbaImage, nx: number, ny: number): Lab {
  const ix = clamp(Math.floor(nx * image.widthPx), 0, image.widthPx - 1);
  const iy = clamp(Math.floor(ny * image.heightPx), 0, image.heightPx - 1);
  const i = (iy * image.widthPx + ix) * 4;
  return srgbToLab(image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0);
}

/** Share of the mask that is hair, 0-1. */
export function hairCoverage(mask: CategoryMask): number {
  let hair = 0;
  for (const c of mask.data) if (c === SEGMENT.hair) hair++;
  return mask.data.length === 0 ? 0 : hair / mask.data.length;
}

/** Normalised bounding box of the hair class, or null when there is no hair. */
export function hairExtent(mask: CategoryMask): HairMeasures['extent'] {
  const { widthPx: w, heightPx: h } = mask;
  let left = w;
  let right = -1;
  let top = h;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (classAt(mask, x, y) !== SEGMENT.hair) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { top: top / h, bottom: (bottom + 1) / h, left: left / w, right: (right + 1) / w };
}

/** Brow line height at `x`, interpolated along the brow points sorted by x. */
function browYAt(brow: readonly Point[], x: number): number {
  const first = brow[0];
  const last = brow[brow.length - 1];
  if (!first || !last) return 0;
  if (x <= first.x) return first.y;
  for (let i = 1; i < brow.length; i++) {
    const a = brow[i - 1];
    const b = brow[i];
    if (a && b && x <= b.x) return b.x === a.x ? a.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  return last.y;
}

/**
 * Walks up one mask column from `startY` and returns the point where forehead skin meets a run of hair
 * (hair at that row and 2 and 4 rows above, as the prototype did), or null: hair first means a fringe hides
 * the hairline there; anything else (background, a head covering) means no hair / face-skin boundary.
 */
function walkUp(mask: CategoryMask, nx: number, startY: number): Point | null {
  const mx = clamp(Math.floor(nx * mask.widthPx), 0, mask.widthPx - 1);
  const isHair = (y: number): boolean => y >= 0 && classAt(mask, mx, y) === SEGMENT.hair;
  let seenSkin = false;
  let gap = 0;
  for (let y = clamp(Math.floor(startY * mask.heightPx), 0, mask.heightPx - 1); y >= 0; y--) {
    const c = classAt(mask, mx, y);
    if (c === SEGMENT.faceSkin) {
      seenSkin = true;
      gap = 0;
    } else if (!seenSkin) {
      return null;
    } else if (isHair(y) && isHair(y - 2) && isHair(y - 4)) {
      return { x: nx, y: (y + 1) / mask.heightPx };
    } else if (++gap > MAX_GAP_ROWS) {
      return null;
    }
  }
  return null;
}

/** Hairline points (x, y pairs, normalised) and whether enough of it shows to measure the forehead third. */
export function hairline(mask: CategoryMask, landmarks: Landmarks | null): { readonly points: Float32Array; readonly visible: boolean } {
  const none = { points: new Float32Array(0), visible: false };
  if (!landmarks) return none;
  const brow = BROW_UPPER.map((i) => point(landmarks, i)).filter((p): p is Point => p !== null);
  const top = point(landmarks, FOREHEAD_TOP);
  const chin = point(landmarks, CHIN);
  if (brow.length < BROW_UPPER.length || !top || !chin || chin.y <= top.y) return none;
  brow.sort((p, q) => p.x - q.x);
  const left = brow[0]?.x ?? 0;
  const right = brow[brow.length - 1]?.x ?? 0;
  const lift = START_ABOVE_BROW * (chin.y - top.y);
  const found: (Point | null)[] = [];
  for (let i = 0; i < HAIRLINE_COLUMNS; i++) {
    const x = left + ((right - left) * i) / (HAIRLINE_COLUMNS - 1);
    found.push(walkUp(mask, x, browYAt(brow, x) - lift));
  }
  const middleFound = found.slice(MIDDLE.from, MIDDLE.to).filter((p) => p !== null).length;
  const points = found.filter((p): p is Point => p !== null).flatMap((p) => [p.x, p.y]);
  return { points: new Float32Array(points), visible: middleFound >= MIDDLE.needed };
}

/** Median Lab of the image under one mask class, from a sampling grid; null with too few pixels. */
function classColour(mask: CategoryMask, image: RgbaImage, cls: number): Lab | null {
  const { widthPx: w, heightPx: h } = mask;
  const step = Math.max(1, Math.round(Math.max(w, h) / SAMPLE_GRID));
  const samples: Lab[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) if (classAt(mask, x, y) === cls) samples.push(labAt(image, (x + 0.5) / w, (y + 0.5) / h));
  }
  return samples.length >= MIN_CLASS_SAMPLES ? medianLab(samples) : null;
}

/** Median Lab of both irises, sampling a ring between 40% and 85% of the iris radius (no pupil, no lid). */
function irisColour(image: RgbaImage, landmarks: Landmarks | null): Lab | null {
  if (!landmarks) return null;
  const samples: Lab[] = [];
  for (const iris of IRISES) {
    const c = point(landmarks, iris.centre);
    const ring = iris.ring.map((i) => point(landmarks, i)).filter((p): p is Point => p !== null);
    if (!c || ring.length < iris.ring.length) continue;
    const radiusPx = ring.reduce((sum, p) => sum + Math.hypot((p.x - c.x) * image.widthPx, (p.y - c.y) * image.heightPx), 0) / ring.length;
    const r = Math.ceil(radiusPx);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy);
        if (d >= 0.4 * radiusPx && d <= 0.85 * radiusPx) samples.push(labAt(image, c.x + dx / image.widthPx, c.y + dy / image.heightPx));
      }
    }
  }
  return samples.length >= MIN_IRIS_SAMPLES ? medianLab(samples) : null;
}

/** Hair, face-skin and eye colour as Lab hints. */
export function colourSamples(mask: CategoryMask, image: RgbaImage, landmarks: Landmarks | null): HairMeasures['colour'] {
  return { hair: classColour(mask, image, SEGMENT.hair), skin: classColour(mask, image, SEGMENT.faceSkin), eyes: irisColour(image, landmarks) };
}

/**
 * A hole inside the hair up to this share of the image, holding only the background class, is taken as the segmenter missing
 * hair: a larger one is an ear or a real gap, and any other class (neck skin, clothes, an accessory) is really there.
 */
const MAX_HOLE_SHARE = 0.001;

const onEdge = (i: number, w: number, h: number): boolean => i < w || i >= w * (h - 1) || i % w === 0 || i % w === w - 1;
const neighbours = (i: number, w: number, h: number): readonly number[] =>
  [i % w > 0 ? i - 1 : -1, i % w < w - 1 ? i + 1 : -1, i - w, i + w < w * h ? i + w : -1].filter((n) => n >= 0);

/** Which cells of a grid can be reached, four-way, from `seeds` through cells that `open` lets in; 1 for those, 0 for the rest. */
export function reachableFrom(seeds: Iterable<number>, open: (cell: number) => boolean, widthPx: number, heightPx: number): Uint8Array {
  const reached = new Uint8Array(widthPx * heightPx);
  const stack: number[] = [];
  const visit = (cell: number): void => {
    if (reached[cell] || !open(cell)) return;
    reached[cell] = 1;
    stack.push(cell);
  };
  for (const seed of seeds) visit(seed);
  for (let cell = stack.pop(); cell !== undefined; cell = stack.pop()) for (const n of neighbours(cell, widthPx, heightPx)) visit(n);
  return reached;
}

/** The cells along the border of a grid. */
export const borderCells = (widthPx: number, heightPx: number): number[] =>
  Array.from({ length: widthPx * heightPx }, (_, cell) => cell).filter((cell) => cell < widthPx || cell >= (heightPx - 1) * widthPx || cell % widthPx === 0 || cell % widthPx === widthPx - 1);

/** The person with the segmenter's holes filled: background that cannot reach the photo's border is a hole in the hair, which the softened mask would turn into a round bite. */
export function withoutHoles(foreground: Uint8Array, widthPx: number, heightPx: number): Uint8Array {
  return reachableFrom(borderCells(widthPx, heightPx), (cell) => foreground[cell] === 0, widthPx, heightPx).map((outside) => (outside ? 0 : 255));
}

/** Pixels of the non-hair region around `from`, 4-connected, and whether it reaches the edge of the image or holds anything but background. */
function regionAt(from: number, mask: CategoryMask, seen: Uint8Array): { readonly pixels: readonly number[]; readonly open: boolean } {
  const { widthPx: w, heightPx: h, data } = mask;
  const pixels: number[] = [];
  const stack = [from];
  let open = false;
  seen[from] = 1;
  for (let i = stack.pop(); i !== undefined; i = stack.pop()) {
    pixels.push(i);
    open ||= onEdge(i, w, h) || data[i] !== SEGMENT.background;
    for (const n of neighbours(i, w, h)) {
      if (!seen[n] && data[n] !== SEGMENT.hair) {
        seen[n] = 1;
        stack.push(n);
      }
    }
  }
  return { pixels, open };
}

/** For the colour preview only: small background-only holes enclosed by the hair become hair (the brown holes a tint left at the ends). Measures use the segmenter's own classes. */
export function fillHairHoles(mask: CategoryMask): CategoryMask {
  const { widthPx: w, heightPx: h, data } = mask;
  const seen = new Uint8Array(w * h);
  const out = new Uint8Array(data);
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i] === SEGMENT.hair) continue;
    const { pixels, open } = regionAt(i, mask, seen);
    if (!open && pixels.length <= MAX_HOLE_SHARE * w * h) for (const p of pixels) out[p] = SEGMENT.hair;
  }
  return { widthPx: w, heightPx: h, data: out };
}

/** The hair class scaled (nearest neighbour) to 256 px on the long side, values 0 or 255. */
export function previewMask(mask: CategoryMask, longSidePx = PREVIEW_LONG_SIDE_PX): PreviewMask {
  const scale = longSidePx / Math.max(mask.widthPx, mask.heightPx, 1);
  const widthPx = Math.max(1, Math.round(mask.widthPx * scale));
  const heightPx = Math.max(1, Math.round(mask.heightPx * scale));
  const data = new Uint8Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y++) {
    const sy = clamp(Math.floor((y + 0.5) / scale), 0, mask.heightPx - 1);
    for (let x = 0; x < widthPx; x++) {
      const sx = clamp(Math.floor((x + 0.5) / scale), 0, mask.widthPx - 1);
      data[y * widthPx + x] = classAt(mask, sx, sy) === SEGMENT.hair ? 255 : 0;
    }
  }
  return { widthPx, heightPx, data };
}

/** Every mask measure for one photo; `landmarks` is the first face's, or null with no face. */
export function hairMeasures(mask: CategoryMask, image: RgbaImage, landmarks: Landmarks | null): HairMeasures {
  const line = hairline(mask, landmarks);
  return {
    coverage: hairCoverage(mask),
    extent: hairExtent(mask),
    hairline: line.points,
    hairlineVisible: line.visible,
    colour: colourSamples(mask, image, landmarks),
  };
}
