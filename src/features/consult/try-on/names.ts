/**
 * The app's own names for the ideas (names under every tile), from the library index already in the
 * machine's content, worked out once per index.
 */
import type { LibraryIndex } from '../../../domain/content/output.ts';
import { lookOf } from '../../../domain/ids.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import type { Named } from './logic.ts';

const made = new WeakMap<LibraryIndex, Named>();

/** Name and kind of a cut or colour look by id; null for any other id. */
export function namedOf(library: LibraryIndex): Named {
  let named = made.get(library);
  if (!named) {
    const map = new Map(
      library.entries.flatMap((e) => (e.kind === 'cut' || e.kind === 'colour' ? [[e.id, e] as const] : [])),
    );
    named = (id) => map.get(id) ?? null;
    made.set(library, named);
  }
  return named;
}

/** The name to show for an idea or a `cut+colour` look; an id the index does not know (content changed under a kept session) shows as itself. */
export function nameOf(library: LibraryIndex): (id: string) => string {
  const named = namedOf(library);
  const one = (id: string): string => named(id)?.name ?? id;
  return (id) => {
    const look = lookOf(id);
    return typeof look === 'string' ? one(look) : SHOWN.board.lookName(one(look[0]), one(look[1]));
  };
}
