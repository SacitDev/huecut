/**
 * From index entries to what the grid and the filters show: one tile per entry (link, name, meta phrase, model line,
 * front picture) and each filter option in words.
 */
import type { LibraryIndex } from '../../domain/content/output.ts';
import { en } from '../../strings/en.ts';
import { beardMeta, cutMeta, lookMeta, techniqueNames } from './captions.ts';
import { itemPath, KIND_OF_TAB, type Tab, type TabEntry } from './filters.ts';
import type { GridTile } from './LibraryGrid.tsx';
import { tilePicture } from '../shared/pictures.ts';

const t = en.explore;

/** The tiles for a tab's entries; each links to its detail with the grid's query, so Back and reload keep the grid. */
export function tilesOf(index: LibraryIndex, tab: Tab, entries: readonly TabEntry[], query: string): GridTile[] {
  const names = techniqueNames(index);
  const kind = KIND_OF_TAB[tab];
  return entries.map((entry) => {
    const picture = tilePicture(entry, index.models);
    const meta = entry.kind === 'cut' ? cutMeta(entry) : entry.kind === 'colour' ? lookMeta(entry, names) : beardMeta(entry);
    return {
      id: entry.id,
      kind,
      href: `#${itemPath(kind, entry.id, query)}`,
      name: entry.name,
      meta,
      shownOn: (entry.kind === 'cut' ? entry.shown_on : undefined) ?? picture?.model?.shown_on ?? null,
      picture,
    };
  });
}

type Words = Readonly<Record<string, string>>;
/** Where each group's option words live in `en.explore.options`. */
const OPTION_WORDS: Readonly<Record<Tab, Readonly<Record<string, Words>>>> = {
  styles: { length: t.options.length, texture: t.options.texture, fringe: t.options.fringe, upkeep: t.options.upkeep, works: t.options.works },
  colours: { family: t.options.family, upkeep: t.options.upkeep },
  beards: { length: t.options.beardLength, shape: t.options.shape },
};

/** A filter option in words; techniques are named by the library's own technique records. */
export function optionLabel(index: LibraryIndex, tab: Tab, key: string, option: string): string {
  if (tab === 'colours' && key === 'technique') return techniqueNames(index).get(option) ?? option.replaceAll('_', ' ');
  return OPTION_WORDS[tab][key]?.[option] ?? option;
}
