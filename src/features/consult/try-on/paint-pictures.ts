/**
 * Making the board, the stylist sheet and the reference sheet: the pictures the painter draws are
 * decoded first (AI pictures from the resource store, or their hair-only version, and library pictures from the site), the items are
 * painted at 2160 x 2700 and encoded (no EXIF), then saved through the share sheet or downloaded. Bitmaps are closed after.
 */
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { PictureEntry } from '../../../domain/content/types.ts';
import { CARD_PX, type Rect } from '../../../domain/geometry/coords.ts';
import type { ExportSpec } from '../../../domain/render-model/face-card.ts';
import { asFile, exportFileName, type ExportKind } from '../../../platform/files.ts';
import { exportImage } from '../../../platform/render/export.ts';
import type { PainterItem, PaintImage, PictureRef } from '../../../platform/render/painter.ts';
import * as resources from '../../../platform/resources.ts';
import { saveFile, type SaveOutcome } from '../../../platform/share.ts';
import { pictureUrl } from '../../shared/pictures.ts';
import { hairOnlyMade } from './hair-only.ts';

/** The smallest file of a library picture that covers it as drawn: whole, inside `rect`, at the export's `scale`. */
export function fileWidthFor(entry: PictureEntry, rect: Rect, scale: number): number {
  const drawn = Math.min(rect.width, rect.height * (entry.widthPx / entry.heightPx)) * scale;
  return entry.widths.find((w) => w >= drawn) ?? Math.max(entry.widthPx, ...entry.widths);
}

async function bitmapOf(blob: Blob | null | undefined): Promise<ImageBitmap | null> {
  try {
    return blob ? await createImageBitmap(blob, { imageOrientation: 'from-image' }) : null;
  } catch {
    return null;
  }
}

/**
 * A library picture loaded as an image, as the screens show them. A fetched Blob is read by WebKit through an internal `blob:` URL, and a page
 * reloaded during that read, or during the fetch, logged "... due to access control checks"; a reload cancels an image load silently.
 */
async function libraryBitmap(url: string): Promise<ImageBitmap | null> {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return await createImageBitmap(image);
  } catch {
    return null;
  }
}

/** The bitmap a reference stands for: the AI picture (its hair-only version when switched on and made), or a library file. */
async function bitmapFor(ref: PictureRef, rect: Rect, scale: number, library: (key: string) => PictureEntry | undefined): Promise<ImageBitmap | null> {
  if (ref.source === 'photo') return null;
  if (ref.source === 'ai') {
    const picture = resources.picture(ref.pictureId);
    return bitmapOf((ref.hairOnly && picture ? await hairOnlyMade(picture) : null) ?? picture);
  }
  const entry = library(ref.key);
  return entry ? libraryBitmap(pictureUrl(ref.key, fileWidthFor(entry, rect, scale))) : null;
}

const keyOf = (ref: PictureRef): string => (ref.source === 'ai' ? `ai:${ref.pictureId}:${String(ref.hairOnly)}` : ref.source === 'library' ? ref.key : 'photo');

/** Picture files by key, from the index entries of the library. */
export function libraryPictures(library: LibraryIndex): (key: string) => PictureEntry | undefined {
  return (key) => {
    for (const e of library.entries) if ('pictures' in e && key in e.pictures) return e.pictures[key];
    return undefined;
  };
}

/**
 * Paints `items` and encodes them as `spec` says; rejects when this browser cannot make the picture, with `whole` when one of its frames
 * has no decoded picture, and when `stale` is aborted, which it checks between pictures and before the encode.
 */
export async function painted(items: readonly PainterItem[], spec: ExportSpec, library: (key: string) => PictureEntry | undefined, whole = false, stale?: AbortSignal): Promise<Blob> {
  const frames = items.flatMap((i) => (i.type === 'picture' ? [i] : []));
  const scale = spec.widthPx / CARD_PX.widthPx;
  const decoded = new Map<string, ImageBitmap>();
  try {
    for (const { ref, rect } of frames) {
      stale?.throwIfAborted();
      const bitmap = !ref || decoded.has(keyOf(ref)) ? null : await bitmapFor(ref, rect, scale, library);
      if (ref && bitmap) decoded.set(keyOf(ref), bitmap);
    }
    stale?.throwIfAborted();
    if (whole && frames.some(({ ref }) => !ref || !decoded.has(keyOf(ref)))) throw new Error('A picture of the export could not be decoded');
    const lookup = (ref: PictureRef): PaintImage | null => {
      const b = decoded.get(keyOf(ref));
      return b ? { source: b, size: { widthPx: b.width, heightPx: b.height } } : null;
    };
    return await exportImage(items, spec, { pictures: lookup });
  } finally {
    for (const bitmap of decoded.values()) bitmap.close();
  }
}

/** Paints `items` and saves the file; rejects when this browser cannot make the picture. */
export async function savePainted(
  items: readonly PainterItem[],
  spec: ExportSpec,
  file: { readonly kind: ExportKind; readonly title: string },
  library: (key: string) => PictureEntry | undefined,
): Promise<SaveOutcome> {
  return saveFile(asFile(await painted(items, spec, library), exportFileName(file.kind, spec.mime, new Date())), file.title);
}
