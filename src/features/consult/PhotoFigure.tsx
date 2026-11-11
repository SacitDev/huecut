/**
 * The main photo as taken, whole in the mirror arch and never cropped: the aside of Goal and
 * Questions, and the Lines photo while its face points are still being found.
 */
import type { PhotoId } from '../../domain/ids.ts';
import * as resources from '../../platform/resources.ts';
import { en } from '../../strings/en.ts';
import { Arch } from '../../ui/components/Arch.tsx';
import styles from './ConsultRoute.module.css';

/** Until a thumbnail tells the photo's shape, the portrait frame of the face card (4:5) holds its place. */
const DEFAULT_RATIO = 4 / 5;

export function PhotoFigure({ photoId, caption }: { readonly photoId: PhotoId | null; readonly caption?: string }) {
  const stored = photoId === null ? undefined : resources.photo(photoId);
  const url = resources.useObjectUrl(stored?.preview);
  if (!stored) return null;
  return (
    <figure className={styles.figure}>
      <Arch ratio={stored.aspect ?? DEFAULT_RATIO}>{url !== null && <img src={url} alt={en.consult.photoAlt} />}</Arch>
      {caption !== undefined && <figcaption className={styles.small}>{caption}</figcaption>}
    </figure>
  );
}
