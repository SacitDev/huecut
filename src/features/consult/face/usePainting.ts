/**
 * What the face card step paints with: the main photo decoded for the painter, the painter's lookup for it, and the main
 * photo's face card, built again on every change of its inputs.
 */
import { useEffect, useMemo, useState } from 'react';
import type { PhotoId } from '../../../domain/ids.ts';
import type { FaceCard } from '../../../domain/render-model/face-card.ts';
import type { PictureLookup } from '../../../platform/render/painter.ts';
import * as resources from '../../../platform/resources.ts';
import type { ConsultView, Selectors } from '../useConsult.ts';
import { cardOf, mainEntry } from './model.ts';

/** The photo is decoded for the screen at the analysis size (at most 1400 px). */
const DISPLAY_LONG_SIDE_PX = 1400;

/** The painter's pictures: the person's photo only. */
export const photoLookup =
  (bitmap: ImageBitmap | null): PictureLookup =>
  (ref) =>
    ref.source === 'photo' && bitmap ? { source: bitmap, size: { widthPx: bitmap.width, heightPx: bitmap.height } } : null;

/** The photo decoded for the painter; closed when it changes or the view goes. */
export function usePhotoBitmap(photoId: PhotoId): ImageBitmap | null {
  const [decoded, setDecoded] = useState<{ readonly id: PhotoId; readonly bitmap: ImageBitmap } | null>(null);
  useEffect(() => {
    const stored = resources.photo(photoId);
    if (!stored) return;
    let live = true;
    let made: ImageBitmap | null = null;
    void resources.displayBitmap(stored.blob, DISPLAY_LONG_SIDE_PX).then((bitmap) => {
      made = bitmap;
      if (live && bitmap) setDecoded({ id: photoId, bitmap });
      else bitmap?.close();
    });
    return () => {
      live = false;
      made?.close();
    };
  }, [photoId]);
  return decoded?.id === photoId ? decoded.bitmap : null;
}

/** The main photo's face card, with every moved line; null while there is nothing to state. */
export function useFaceCard(view: ConsultView, selectors: Selectors): FaceCard | null {
  const c = view.context;
  const entry = mainEntry(c);
  const measurements = entry ? selectors.measurementsOf(c, entry.id) : null;
  const facts = selectors.cardFacts(c);
  return useMemo(() => cardOf(entry, measurements, facts, new Date()), [entry, measurements, facts]);
}
