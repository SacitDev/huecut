/**
 * "Save as image" for the stylist sheet: the library thumbnails decoded from their
 * largest file, the sheet painted by the one painter at 2160 x 2700, then the share sheet or a download. The decoded
 * bitmaps are closed when the picture is made.
 */
import type { StylistSheet } from '../../domain/render-model/stylist-sheet.ts';
import { asFile, exportFileName } from '../../platform/files.ts';
import { exportImage, stylistSheetItems } from '../../platform/render/export.ts';
import type { PaintImage, PictureRef } from '../../platform/render/painter.ts';
import { saveFile, type SaveOutcome } from '../../platform/share.ts';
import { pictureUrl, type LibraryPicture } from './pictures.ts';

async function decode(picture: LibraryPicture): Promise<[string, ImageBitmap] | null> {
  try {
    const response = await fetch(pictureUrl(picture.key, picture.width));
    if (!response.ok) return null;
    return [picture.key, await createImageBitmap(await response.blob())];
  } catch {
    return null;
  }
}

/** Paints and saves the sheet; rejects when the browser cannot make the picture. */
export async function saveSheetImage(sheet: StylistSheet, pictures: readonly LibraryPicture[]): Promise<SaveOutcome> {
  const wanted = pictures.filter((p) => sheet.thumbnails.some((t) => t.key === p.key));
  const decoded = new Map((await Promise.all(wanted.map(decode))).filter((d): d is [string, ImageBitmap] => d !== null));
  try {
    const lookup = (ref: PictureRef): PaintImage | null => {
      const bitmap = ref.source === 'library' ? decoded.get(ref.key) : undefined;
      return bitmap ? { source: bitmap, size: { widthPx: bitmap.width, heightPx: bitmap.height } } : null;
    };
    const blob = await exportImage(stylistSheetItems(sheet), sheet.export, { pictures: lookup });
    return await saveFile(asFile(blob, exportFileName('stylist-sheet', sheet.export.mime, new Date())), sheet.title);
  } finally {
    for (const bitmap of decoded.values()) bitmap.close();
  }
}
