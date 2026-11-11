/**
 * "Save my card": the main photo decoded at the card's own height, the card painted by the one
 * painter at 2160 x 2700 as a JPEG with no EXIF, then the share sheet or a download. The decoded bitmap is closed when the
 * picture is made.
 */
import type { FaceCard } from '../../../domain/render-model/face-card.ts';
import { asFile, exportFileName } from '../../../platform/files.ts';
import { exportImage } from '../../../platform/render/export.ts';
import * as resources from '../../../platform/resources.ts';
import { saveFile, type SaveOutcome } from '../../../platform/share.ts';
import { photoLookup } from './usePainting.ts';

/** The photo is decoded at the card's height, so its crop keeps detail on the 2160 x 2700 export. */
const EXPORT_LONG_SIDE_PX = 2700;

/** Paints and saves the card; rejects when the photo cannot be decoded or the browser cannot make the picture. */
export async function saveFaceCard(card: FaceCard, photo: Blob | undefined, title: string): Promise<SaveOutcome> {
  const bitmap = photo ? await resources.displayBitmap(photo, EXPORT_LONG_SIDE_PX) : null;
  if (!bitmap) throw new Error('The photo could not be decoded for the face card');
  try {
    const blob = await exportImage(card.items, card.export, { pictures: photoLookup(bitmap) });
    return await saveFile(asFile(blob, exportFileName('face-card', card.export.mime, new Date())), title);
  } finally {
    bitmap.close();
  }
}
