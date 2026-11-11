/**
 * The resource store: what is too big for the machine, by id. Photos as the original
 * File or Blob with a 256 px thumbnail, a bounded preview and its sharpness; refined hair masks and depth maps by photo id;
 * pictures for the slots and grid tiles. The door for files and the one bounded decode are here. Bitmaps are decoded one at a
 * time and closed at once; RESET calls `disposeAll()`.
 */
import { asPhotoId, asPictureId, type PhotoId, type PictureId } from '../domain/ids.ts';
import { planDecode, readPictureHead, type PictureRefusal } from '../domain/measure/picture-gate.ts';
import { sharpness } from '../domain/measure/sharpness.ts';
import { JPEG_EXPORT } from '../domain/render-model/face-card.ts';
import type { DepthMap, Mask } from '../worker/protocol.ts';

/** Thumbnails are 256 px on the long side; the sharpness score is measured on them. */
export const THUMBNAIL_LONG_SIDE_PX = 256;
/** The round-trip copy: at most 1536 px on the long side, downscaled and never cropped, re-encoded without EXIF. */
export const ROUND_TRIP_LONG_SIDE_PX = 1536;
const THUMBNAIL_QUALITY = 0.85;

export interface StoredPhoto {
  readonly id: PhotoId;
  /** The original File (usually backed by the disk, so it costs little memory) or a restored Blob. */
  readonly blob: Blob;
  /** The file name the person chose, for the photo's accessible name; empty for a restored copy. */
  readonly name: string;
  /** A 256 px JPEG of the oriented photo, or null when this browser could not decode it (HEIC outside Safari). */
  readonly thumbnail: Blob | null;
  /** What the screens show instead of the original: a JPEG of at most 1536 px, null when the thumbnail is. */
  readonly preview: Blob | null;
  /** Variance of the Laplacian on the thumbnail (`domain/measure/sharpness.ts`), or null without a thumbnail. */
  readonly sharpness: number | null;
  /** Width over height of the oriented photo, from the thumbnail; null without one. */
  readonly aspect: number | null;
}

const photos = new Map<PhotoId, StoredPhoto>();
const masks = new Map<PhotoId, Mask>();
const depths = new Map<PhotoId, DepthMap>();
const pictures = new Map<PictureId, Blob>();
/** Counts each photo's outlines: a picture made from the photo's hair is stale once this moves. */
const maskRevisions = new Map<PhotoId, number>();
/** Object URLs of the Blobs above, by Blob (useObjectUrl). */
const urls = new Map<Blob, string>();
/** Pictures made from a stored Blob (the hair-only version), whose object URLs go with it. */
const derived = new WeakMap<Blob, Blob[]>();
/** Moves on at every `disposeAll`: an import begun before it belongs to a session that has gone. */
let epoch = 0;

/** The current session's epoch: an import takes it before its first wait and is stored only while it still holds. */
export const generation = (): number => epoch;

function revoke(...blobs: readonly (Blob | null | undefined)[]): void {
  for (const blob of blobs) {
    const url = blob ? urls.get(blob) : undefined;
    if (blob && url !== undefined) {
      URL.revokeObjectURL(url);
      urls.delete(blob);
    }
    if (blob) releaseDerived(blob);
  }
}

/** Lets go of the pictures made from `source`. */
function releaseDerived(source: Blob): void {
  const made = derived.get(source);
  derived.delete(source);
  if (made) revoke(...made);
}

/** Ties a picture made from stored Blobs (the hair-only version) to them: its object URL goes when any of them goes or the photo's outline changes. */
export function derive(made: Blob, ...sources: readonly (Blob | null | undefined)[]): void {
  for (const source of sources) if (source) derived.set(source, [...(derived.get(source) ?? []), made]);
}

/** An id no earlier session can have used: a restored session brings its own photo id back. */
function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

let decodeQueue: Promise<unknown> = Promise.resolve();
/** Decodes run one at a time (a queue of one), so a pile of photos never holds many bitmaps at once. */
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = decodeQueue.then(task, task);
  decodeQueue = run.catch(() => undefined);
  return run;
}

/** This browser can decode a JPEG straight to a smaller DCT scale; `planDecode` only scales what the bytes show to be a JPEG, whatever its declared type. */
const canScale = (): boolean => typeof ImageDecoder !== 'undefined';

/** A JPEG decoded at the size `planDecode` chose; null when the decoder cannot. The worker has its own copy of this call (layers). */
async function scaledJpeg(blob: Blob, size: { readonly width: number; readonly height: number }): Promise<VideoFrame | null> {
  let decoder: ImageDecoder | null = null;
  try {
    decoder = new ImageDecoder({ data: blob.stream(), type: 'image/jpeg', desiredWidth: size.width, desiredHeight: size.height });
    return (await decoder.decode()).image;
  } catch {
    return null;
  } finally {
    decoder?.close();
  }
}

/**
 * The one bounded decode of the main thread: the oriented photo as a bitmap, never above the picture gate's limit and, for a JPEG that
 * allows it, at a scale just covering `longSide`. Null when this browser cannot decode it or the limit forbids it.
 */
async function decode(blob: Blob, longSide: number): Promise<ImageBitmap | null> {
  const head = await readPictureHead(blob);
  const plan = planDecode(head, canScale(), longSide);
  const frame = typeof plan === 'object' ? await scaledJpeg(blob, plan) : null;
  if (!frame && planDecode(head, false, longSide) === 'refuse') return null;
  try {
    return await createImageBitmap(frame ?? blob, { imageOrientation: 'from-image' });
  } catch {
    return null;
  } finally {
    frame?.close();
  }
}

/**
 * The door every file a person brings in goes through: why it is refused, or null when it may come in. `decodedWhole` is for pictures
 * shown and painted at their own size, which no smaller scale can help.
 */
export async function refusal(file: File, decodedWhole = false): Promise<PictureRefusal | null> {
  const head = await readPictureHead(file);
  // The bytes alone decide: only a raster head with its size lets a file in, so no decode skips the size check; a name or type that disagrees
  // with the bytes (a WebP saved as .jpg, as messengers do, or a photo handed over with no type or a generic one) is not held against a real photo.
  if (!head) return 'not_picture';
  return planDecode(head, !decodedWhole && canScale(), ROUND_TRIP_LONG_SIDE_PX) === 'refuse' ? 'too_large' : null;
}

/** Draws a bitmap with its long side at most `longSide` px; the caller closes the bitmap. */
function drawScaled(bitmap: ImageBitmap, longSide: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const k = Math.min(1, longSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * k));
  canvas.height = Math.max(1, Math.round(bitmap.height * k));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

const jpegOf = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });

/** The photo at 256 px wide with the browser's best resampling, for a steady sharpness score; the bitmap itself where it has no resize. */
const resampled = (bitmap: ImageBitmap): Promise<ImageBitmap> =>
  createImageBitmap(bitmap, { resizeWidth: THUMBNAIL_LONG_SIDE_PX, resizeQuality: 'high' }).catch(() => bitmap);

/** From one decode: the 256 px thumbnail, its sharpness, the photo's aspect and the preview, or nulls when the photo cannot be decoded here. */
async function thumbnailOf(blob: Blob): Promise<Pick<StoredPhoto, 'thumbnail' | 'preview' | 'sharpness' | 'aspect'>> {
  const bitmap = await decode(blob, ROUND_TRIP_LONG_SIDE_PX);
  if (!bitmap) return { thumbnail: null, preview: null, sharpness: null, aspect: null };
  const small = await resampled(bitmap);
  try {
    const drawn = drawScaled(small, THUMBNAIL_LONG_SIDE_PX);
    const big = drawScaled(bitmap, ROUND_TRIP_LONG_SIDE_PX);
    if (!drawn || !big) return { thumbnail: null, preview: null, sharpness: null, aspect: bitmap.width / bitmap.height };
    const { canvas, ctx } = drawn;
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const score = sharpness({ widthPx: image.width, heightPx: image.height, data: image.data });
    const [thumbnail, preview] = await Promise.all([jpegOf(canvas, THUMBNAIL_QUALITY), jpegOf(big.canvas, JPEG_EXPORT.quality)]);
    return { thumbnail, preview, sharpness: score, aspect: canvas.width / canvas.height };
  } finally {
    small.close();
    bitmap.close();
  }
}

/**
 * Takes one photo: the Blob stays here, the machine gets its id and sharpness (`PHOTOS.ADD`). `mine` is the epoch its import began in; null when RESET
 * came since.
 */
export async function addPhoto(blob: Blob, name = '', id: PhotoId = asPhotoId(randomId('photo')), mine = epoch): Promise<StoredPhoto | null> {
  const made = await oneAtATime(() => (mine === epoch ? thumbnailOf(blob) : Promise.resolve(null)));
  if (!made || mine !== epoch) return null;
  const stored: StoredPhoto = { id, blob, name, ...made };
  photos.set(id, stored);
  return stored;
}

export const photo = (id: PhotoId): StoredPhoto | undefined => photos.get(id);

/** Removes a photo with its mask and depth map. */
export function removePhoto(id: PhotoId): void {
  const stored = photos.get(id);
  revoke(stored?.blob, stored?.thumbnail, stored?.preview);
  photos.delete(id);
  masks.delete(id);
  maskRevisions.delete(id);
  depths.delete(id);
}

/**
 * The copy kept for the round trip and handed to ChatGPT or Gemini: the oriented photo downscaled to at most 1536 px,
 * never cropped, re-encoded as JPEG, so no EXIF (location, camera) leaves with it. Null when it cannot be decoded.
 */
export async function shareCopy(blob: Blob, longSide = ROUND_TRIP_LONG_SIDE_PX): Promise<Blob | null> {
  return oneAtATime(async () => {
    const bitmap = await decode(blob, longSide);
    if (!bitmap) return null;
    try {
      const drawn = drawScaled(bitmap, longSide);
      return drawn ? await jpegOf(drawn.canvas, JPEG_EXPORT.quality) : null;
    } finally {
      bitmap.close();
    }
  });
}

/**
 * The oriented photo as a bitmap with its long side at most `longSide` px, for drawing on screen (the painter's photo).
 * Decoded on demand, one at a time; the caller closes it. Null when this browser cannot decode the photo.
 */
export function displayBitmap(blob: Blob, longSide: number): Promise<ImageBitmap | null> {
  return oneAtATime(async () => {
    const bitmap = await decode(blob, longSide);
    if (!bitmap || Math.max(bitmap.width, bitmap.height) <= longSide) return bitmap;
    try {
      const drawn = drawScaled(bitmap, longSide);
      return drawn ? await createImageBitmap(drawn.canvas) : null;
    } finally {
      bitmap.close();
    }
  });
}

// ── Refined masks and depth maps, by photo id (they survive every worker restart) ──

/** A photo removed during the run keeps nothing. A new outline makes what was drawn from the old one stale. */
export function setMask(id: PhotoId, mask: Mask): void {
  const stored = photos.get(id);
  if (!stored) return;
  masks.set(id, mask);
  maskRevisions.set(id, maskRevision(id) + 1);
  releaseDerived(stored.blob);
}
/** Which outline of the photo is stored: it moves at every `setMask`. */
export const maskRevision = (id: PhotoId): number => maskRevisions.get(id) ?? 0;
/** A stored outline exists, so a tint needs no segmenter (a refined outline, or the example's). */
export const hasMask = (id: PhotoId): boolean => masks.has(id);
/** A copy of the stored mask for a worker call, which transfers (and so empties) what it is given. */
export function maskCopy(id: PhotoId): Mask | null {
  const m = masks.get(id);
  return m ? { widthPx: m.widthPx, heightPx: m.heightPx, data: m.data.slice() } : null;
}
/** A photo removed during the run keeps nothing. */
export const setDepth = (id: PhotoId, depth: DepthMap): void => {
  if (photos.has(id)) depths.set(id, depth);
};
export const depth = (id: PhotoId): DepthMap | undefined => depths.get(id);

// ── Pictures (AI pictures for the slots, quick-grid tiles) ──

export function addPicture(blob: Blob, id: PictureId = asPictureId(randomId('picture'))): PictureId {
  pictures.set(id, blob);
  return id;
}
export const picture = (id: PictureId): Blob | undefined => pictures.get(id);
export function disposePictures(ids: readonly PictureId[]): void {
  for (const id of ids) {
    revoke(pictures.get(id));
    pictures.delete(id);
  }
}

/** RESET and the end of a session: everything goes, object URLs too. */
export function disposeAll(): void {
  epoch++;
  revoke(...urls.keys());
  photos.clear();
  masks.clear();
  maskRevisions.clear();
  depths.clear();
  pictures.clear();
}

/**
 * The object URL a view shows `blob` with: one per Blob of this store, made on first use and shared by every view,
 * and revoked when the store lets the Blob go (`removePhoto`, `disposePictures`, `disposeAll`). The store holds the Blob
 * anyway, so the URL costs nothing more, and views that remount on every navigation never make a new one.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  if (!blob) return null;
  let url = urls.get(blob);
  if (url === undefined) {
    url = URL.createObjectURL(blob);
    urls.set(blob, url);
  }
  return url;
}