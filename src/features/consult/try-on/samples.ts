/** The library's sample picture of a look, the same one Ideas shows: on the model of the person's collection and texture group. */
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { Collection } from '../../../domain/content/values.ts';
import { idsOfLook, lookOf } from '../../../domain/ids.ts';
import { picturesOf, type LibraryPicture } from '../../shared/pictures.ts';
import { entryOf, pictureKeyFor } from '../ideas/model.ts';

/** The look's picture from the library: for a `cut+colour` look the cut's, because the colour comes from its name. Null without one. */
export function samplePicture(library: LibraryIndex, collections: readonly Collection[], texture: string | undefined, id: string): LibraryPicture | null {
  const entry = entryOf(library, idsOfLook(lookOf(id))[0]);
  if (!entry) return null;
  const key = pictureKeyFor(entry, library.models, collections, texture);
  return picturesOf(entry, library.models).find((p) => p.key === key) ?? null;
}
