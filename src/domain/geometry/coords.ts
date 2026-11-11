/**
 * The single coordinate system: every stored point is normalised [0, 1] in the
 * EXIF-oriented image. Pure conversions to and from analysis pixels, display pixels inside an `object-fit`
 * frame, export pixels inside the 2160 x 2700 card, and between the stored and oriented image (EXIF 1-8).
 */

/** A point; its space is named by the function that made it (normalised, analysis, display or export px). */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly widthPx: number;
  readonly heightPx: number;
}

/** An axis-aligned rectangle in the space of the function that takes it. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// ── Analysis pixels (the oriented image, long side at most 1400 px) ──

/** Normalised point to pixels of an image of `size` (analysis image, mask or thumbnail). */
export const toPx = (p: Point, size: Size): Point => ({ x: p.x * size.widthPx, y: p.y * size.heightPx });

/** Pixels of an image of `size` to a normalised point. */
export const fromPx = (p: Point, size: Size): Point => ({ x: p.x / size.widthPx, y: p.y / size.heightPx });

// ── Display pixels (CSS px inside an object-fit frame) ──

export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

/** An element showing the oriented image: its box in CSS px and its `object-fit` / `object-position`. */
export interface DisplayFrame {
  /** The frame's own offset (for example from `getBoundingClientRect()`), CSS px. */
  readonly left: number;
  readonly top: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly fit: ObjectFit;
  /** `object-position` as fractions; the CSS default `50% 50%` is `{ x: 0.5, y: 0.5 }`. */
  readonly position: Point;
}

/** Where the image is drawn inside the frame, in CSS px relative to the frame (`image` is its natural size). */
export function contentBox(frame: DisplayFrame, image: Size): Rect {
  const sx = frame.widthPx / image.widthPx;
  const sy = frame.heightPx / image.heightPx;
  const contain = Math.min(sx, sy);
  const cover = Math.max(sx, sy);
  const scales: Record<ObjectFit, readonly [number, number]> = {
    fill: [sx, sy],
    contain: [contain, contain],
    cover: [cover, cover],
    none: [1, 1],
    'scale-down': [Math.min(1, contain), Math.min(1, contain)],
  };
  const [kx, ky] = scales[frame.fit];
  const width = image.widthPx * kx;
  const height = image.heightPx * ky;
  return {
    x: (frame.widthPx - width) * frame.position.x,
    y: (frame.heightPx - height) * frame.position.y,
    width,
    height,
  };
}

/** Normalised point to CSS px, including the frame's offset and the letterbox or crop of its fit. */
export function toDisplay(p: Point, frame: DisplayFrame, image: Size): Point {
  const box = contentBox(frame, image);
  return { x: frame.left + box.x + p.x * box.width, y: frame.top + box.y + p.y * box.height };
}

/** CSS px to a normalised point; a point on the letterbox gives a value outside [0, 1] (callers clamp). */
export function fromDisplay(p: Point, frame: DisplayFrame, image: Size): Point {
  const box = contentBox(frame, image);
  return { x: (p.x - frame.left - box.x) / box.width, y: (p.y - frame.top - box.y) / box.height };
}

// ── Export pixels (the 4:5 card) ──

export const CARD_PX: Size = { widthPx: 2160, heightPx: 2700 };

/**
 * How the photo sits on the card: `crop` (normalised, in the oriented image) is drawn into `area` (card px).
 * The crop is extended to the area's shape before drawing (views never crop hair), so the axes scale alike.
 */
export interface ExportPlacement {
  readonly crop: Rect;
  readonly area: Rect;
}

/** Normalised point to card pixels. */
export function toExport(p: Point, { crop, area }: ExportPlacement): Point {
  return { x: area.x + ((p.x - crop.x) / crop.width) * area.width, y: area.y + ((p.y - crop.y) / crop.height) * area.height };
}

/** Card pixels to a normalised point. */
export function fromExport(p: Point, { crop, area }: ExportPlacement): Point {
  return { x: crop.x + ((p.x - area.x) / area.width) * crop.width, y: crop.y + ((p.y - area.y) / area.height) * crop.height };
}

// ── EXIF orientation (stored image ↔ oriented image) ──

/** EXIF tag 0x0112: 1 as stored, 2 mirrored, 3 rotated 180°, 4 flipped, 5 transposed, 6 rotate 90° CW, 7 transverse, 8 rotate 90° CCW. */
export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Size of the oriented image: orientations 5-8 swap width and height. */
export const orientedSize = (stored: Size, o: ExifOrientation): Size =>
  o >= 5 ? { widthPx: stored.heightPx, heightPx: stored.widthPx } : stored;

/** A normalised point of the stored image to the oriented image. */
export function storedToOriented({ x, y }: Point, o: ExifOrientation): Point {
  const map: Record<ExifOrientation, Point> = {
    1: { x, y },
    2: { x: 1 - x, y },
    3: { x: 1 - x, y: 1 - y },
    4: { x, y: 1 - y },
    5: { x: y, y: x },
    6: { x: 1 - y, y: x },
    7: { x: 1 - y, y: 1 - x },
    8: { x: y, y: 1 - x },
  };
  return map[o];
}

/** A normalised point of the oriented image back to the stored image (the inverse of `storedToOriented`). */
export function orientedToStored({ x, y }: Point, o: ExifOrientation): Point {
  const map: Record<ExifOrientation, Point> = {
    1: { x, y },
    2: { x: 1 - x, y },
    3: { x: 1 - x, y: 1 - y },
    4: { x, y: 1 - y },
    5: { x: y, y: x },
    6: { x: y, y: 1 - x },
    7: { x: 1 - y, y: 1 - x },
    8: { x: 1 - y, y: x },
  };
  return map[o];
}
