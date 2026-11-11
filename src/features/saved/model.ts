/**
 * Pure helpers of Saved: the favourites grouped by kind in the order Explore shows them and the picture a tile uses.
 */
import type { IndexEntry, LibraryIndex } from '../../domain/content/output.ts';
import type { savedCopy } from '../../strings/en-saved.ts';

export type { SessionPort } from '../shared/save-status.ts';

type SavedKind = keyof typeof savedCopy.favourites.groups;
/** A library entry that can be saved: a cut, a colour look or a beard. */
export type SavedEntry = Extract<IndexEntry, { readonly kind: SavedKind }>;
/** The saved items of one kind. */
export interface SavedGroup {
  readonly kind: SavedKind;
  readonly entries: readonly SavedEntry[];
}
const KINDS: readonly SavedKind[] = ['cut', 'colour', 'beard'];
/** The Explore path segment of each kind. */
const ROUTE_KIND: Readonly<Record<SavedKind, string>> = { cut: 'style', colour: 'colour', beard: 'beard' };

/** The favourites that are in the library, by kind; an id the library no longer has is left out, and an empty kind too. */
export function savedGroups(index: LibraryIndex, favourites: ReadonlySet<string>): SavedGroup[] {
  const of = (kind: SavedKind) => (e: IndexEntry): e is SavedEntry => e.kind === kind && favourites.has(e.id);
  return KINDS.map((kind) => ({ kind, entries: index.entries.filter(of(kind)) })).filter((group) => group.entries.length > 0);
}

export const detailHref = (kind: SavedKind, id: string): string => `#/explore/${ROUTE_KIND[kind]}/${id}`;

/** A tile's picture: `key` and its entry in the picture index, the front view first, or null when it has none. */
export function tilePictureKey(pictures: SavedEntry['pictures']): string | null {
  const keys = Object.keys(pictures);
  return keys.find((key) => key.endsWith('-front')) ?? keys[0] ?? null;
}
