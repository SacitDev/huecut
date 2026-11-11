/**
 * The signature moment: the main photo in its arch with the face lines drawing themselves once,
 * by the card's own painter from the card's own items, without labels (the facts say it better). Any tap or key finishes the
 * trace; reduced motion shows it done. Until the photo is decoded, the photo alone holds its place.
 */
import { useEffect, useMemo, useState } from 'react';
import type { PhotoId } from '../../../domain/ids.ts';
import type { FaceCard } from '../../../domain/render-model/face-card.ts';
import { screenPainter } from '../../../platform/render/painter.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { PainterCanvas } from '../../../ui/components/PainterCanvas.tsx';
import { PhotoFigure } from '../PhotoFigure.tsx';
import { drawnNames, PORTRAIT_SIZE, screenItems } from './model.ts';
import { photoLookup, usePhotoBitmap } from './usePainting.ts';

/** Photos whose trace has played on this page: it plays once, later visits show the drawing finished. */
const traced = new Set<PhotoId>();

export function Portrait({ card, photoId }: { readonly card: FaceCard; readonly photoId: PhotoId }) {
  const bitmap = usePhotoBitmap(photoId);
  const [play] = useState(() => !traced.has(photoId));
  useEffect(() => {
    if (bitmap) traced.add(photoId);
  }, [bitmap, photoId]);
  const items = useMemo(() => screenItems(card), [card]);
  const paint = useMemo(() => screenPainter(photoLookup(bitmap)), [bitmap]);
  if (!bitmap) return <PhotoFigure photoId={photoId} />;
  return <PainterCanvas items={items} size={PORTRAIT_SIZE} paint={paint} label={faceCopy.canvas(drawnNames(card))} playOnMount={play} />;
}
