/**
 * Explore's filter model: the tabs, "Show", the search over names and aliases, each
 * tab's filter groups with their tests, and the URL query that holds them. Pure: no DOM and no words; the screen names
 * everything from `en.ts`.
 */
import type { BeardIndexEntry, CutIndexEntry, IndexEntry, LibraryIndex, LookIndexEntry } from '../../domain/content/output.ts';
import { TRAITS } from '../../domain/content/traits.ts';
import type { Policy } from '../../domain/content/types.ts';

export const TABS = ['styles', 'colours', 'beards'] as const;
export type Tab = (typeof TABS)[number];
export interface TabEntries { readonly styles: CutIndexEntry; readonly colours: LookIndexEntry; readonly beards: BeardIndexEntry }
export type TabEntry = TabEntries[Tab];

/** The route kind of each tab (`#/explore/:kind/:id`) and back. */
export const KIND_OF_TAB = { styles: 'style', colours: 'colour', beards: 'beard' } as const;
export type ItemKind = (typeof KIND_OF_TAB)[Tab];
export const TAB_OF_KIND: Readonly<Record<ItemKind, Tab>> = { style: 'styles', colour: 'colours', beard: 'beards' };
const ENTRY_KIND = { styles: 'cut', colours: 'colour', beards: 'beard' } as const;

/** "Show: Women's styles / Men's styles / All"; beards are one collection, so the Beards tab has none. */
export const SHOWS = ['salon', 'barbering', 'all'] as const;
export type Show = (typeof SHOWS)[number];
const showsOn = (tab: Tab): boolean => tab !== 'beards';

/** The engine's low-upkeep reading (`recommend.ts`): `policy.low_upkeep` from consult.json. */
export type UpkeepPolicy = Policy['low_upkeep'];

/** Length classes in three plain groups, as people say them. */
export const LENGTH_GROUPS = {
  short: ['buzz', 'very_short', 'short'],
  medium: ['chin', 'bob', 'shoulder'],
  long: ['long', 'very_long'],
} as const satisfies Record<string, readonly (typeof TRAITS.cut.length_class.values)[number][]>;
export type LengthGroup = keyof typeof LENGTH_GROUPS;
export const lengthGroupOf = (lengthClass: string): LengthGroup =>
  (Object.keys(LENGTH_GROUPS) as LengthGroup[]).find((g) => (LENGTH_GROUPS[g] as readonly string[]).includes(lengthClass)) ?? 'medium';

export const TEXTURES = ['straight', 'wavy', 'curly', 'coily'] as const;
export type Texture = (typeof TEXTURES)[number];
const WORKS_TAGS = { hairline: 'recession_friendly', fine: 'fine_hair_friendly' } as const;

interface Group<E> {
  readonly key: string;
  /** Every option in display order; the screen lists those some entry of the tab has. */
  readonly options: readonly string[];
  /** `any`: one chosen option must match (length short or medium); `all`: every chosen option must (tags). */
  readonly match: 'any' | 'all';
  /** Reads `policy.low_upkeep`, so it waits for consult.json. */
  readonly needsPolicy?: true;
  readonly test: (entry: E, option: string, policy: UpkeepPolicy) => boolean;
}
type AnyGroup = Group<CutIndexEntry> | Group<LookIndexEntry> | Group<BeardIndexEntry>;

const STYLE_GROUPS: readonly Group<CutIndexEntry>[] = [
  { key: 'length', options: Object.keys(LENGTH_GROUPS), match: 'any', test: (e, o) => lengthGroupOf(e.traits.length_class) === o },
  { key: 'texture', options: TEXTURES, match: 'any', test: (e, o) => e.texture_fit[o as Texture].fit === 'good' },
  { key: 'fringe', options: ['fringe', 'none'], match: 'any', test: (e, o) => (e.traits.fringe === 'none') === (o === 'none') },
  {
    key: 'upkeep', options: ['low'], match: 'any', needsPolicy: true,
    test: (e, _o, p) => e.traits.styling_minutes[1] <= p.max_styling_minutes && e.traits.trim_weeks[0] >= p.min_trim_weeks,
  },
  { key: 'works', options: Object.keys(WORKS_TAGS), match: 'all', test: (e, o) => e.traits.tags.includes(WORKS_TAGS[o as keyof typeof WORKS_TAGS]) },
];
const COLOUR_GROUPS: readonly Group<LookIndexEntry>[] = [
  { key: 'family', options: TRAITS.colour.family.values, match: 'any', test: (e, o) => e.traits.family === o },
  { key: 'technique', options: TRAITS.colour.technique.values, match: 'any', test: (e, o) => (e.traits.technique as readonly string[]).includes(o) },
  { key: 'upkeep', options: ['low'], match: 'any', needsPolicy: true, test: (e, _o, p) => e.traits.upkeep_weeks[0] >= p.min_trim_weeks },
];
const BEARD_GROUPS: readonly Group<BeardIndexEntry>[] = [
  { key: 'length', options: TRAITS.beard.beard_length.values, match: 'any', test: (e, o) => e.traits.beard_length === o },
  { key: 'shape', options: TRAITS.beard.beard_shape.values, match: 'any', test: (e, o) => e.traits.beard_shape === o },
];
const GROUPS: Readonly<Record<Tab, readonly AnyGroup[]>> = { styles: STYLE_GROUPS, colours: COLOUR_GROUPS, beards: BEARD_GROUPS };

/** The group keys of a tab, in display order. */
export const groupKeys = (tab: Tab): readonly string[] => GROUPS[tab].map((g) => g.key);

/** What the URL holds: the tab, "Show", the search and the chosen options per group of that tab. */
export interface ExploreState {
  readonly tab: Tab;
  readonly show: Show;
  /** The search box exactly as typed: tidying it here would eat the space before the next word. */
  readonly q: string;
  readonly chosen: Readonly<Record<string, readonly string[]>>;
}
/** One chosen filter, or "Show" when it is not All (the no-results state offers to remove either). */
export interface ActiveFilter { readonly key: string; readonly option: string }

const pick = <T extends string>(allowed: readonly T[], value: string | null): T | undefined => allowed.find((a) => a === value);

/** The longest search kept, in the field and from a link; the longest name or alias in the library is 43 characters. */
export const SEARCH_MAX_LENGTH = 60;

/** Reads the query; unknown keys and values are ignored, so an old link still opens. */
export function parseState(query: URLSearchParams, fallbackTab: Tab = 'styles'): ExploreState {
  const tab = pick(TABS, query.get('tab')) ?? fallbackTab;
  const show = (showsOn(tab) ? pick(SHOWS, query.get('show')) : undefined) ?? 'all';
  const q = (query.get('q') ?? '').slice(0, SEARCH_MAX_LENGTH);
  const chosen: Record<string, readonly string[]> = {};
  for (const group of GROUPS[tab]) {
    const wanted = new Set((query.get(group.key) ?? '').split(','));
    const options = group.options.filter((o) => wanted.has(o));
    if (options.length > 0) chosen[group.key] = options;
  }
  return { tab, show, q, chosen };
}

/** The query for a state, defaults left out: `tab=colours&q=ash&family=blonde,red_copper`. */
export function toQuery(state: ExploreState): string {
  const params = new URLSearchParams();
  if (state.tab !== 'styles') params.set('tab', state.tab);
  if (state.show !== 'all' && showsOn(state.tab)) params.set('show', state.show);
  if (state.q !== '') params.set('q', state.q);
  for (const key of groupKeys(state.tab)) {
    const options = state.chosen[key];
    if (options && options.length > 0) params.set(key, options.join(','));
  }
  // Commas stay readable in the hash; URLSearchParams would write them as %2C.
  return params.toString().replaceAll('%2C', ',');
}

/** The grid's path for a query (`/explore?tab=colours`). */
export const explorePath = (query: string): string => (query ? `/explore?${query}` : '/explore');
/** An item's path, carrying the grid's query so the grid behind the detail, Back and a reload keep it. */
export const itemPath = (kind: ItemKind, id: string, query: string): string =>
  `/explore/${kind}/${encodeURIComponent(id)}${query ? `?${query}` : ''}`;

/** Another tab starts with no filters of its own; "Show" and the search, which sits above the tabs, carry over. */
export const withTab = (state: ExploreState, tab: Tab): ExploreState => ({ tab, show: state.show, q: state.q, chosen: {} });
export const withShow = (state: ExploreState, show: Show): ExploreState => ({ ...state, show });
/** The state with the search box's new text. */
export const withSearch = (state: ExploreState, q: string): ExploreState => ({ ...state, q });
/** "Clear filters": the chips and "Show"; the search has its own clear button. */
export const cleared = (state: ExploreState): ExploreState => ({ ...state, show: 'all', chosen: {} });

/** Turns one option on or off, keeping the group's option order. */
export function toggled(state: ExploreState, key: string, option: string): ExploreState {
  const group = GROUPS[state.tab].find((g) => g.key === key);
  if (!group) return state;
  const current = new Set(state.chosen[key] ?? []);
  if (current.has(option)) current.delete(option);
  else current.add(option);
  return { ...state, chosen: { ...state.chosen, [key]: group.options.filter((o) => current.has(o)) } };
}

/** Removes one active filter; for "Show" that means All. */
export const without = (state: ExploreState, filter: ActiveFilter): ExploreState =>
  filter.key === 'show' ? withShow(state, 'all') : toggled(state, filter.key, filter.option);

/** "Show" first when it is not All, then every chosen option in group order. */
export function activeFilters(state: ExploreState): ActiveFilter[] {
  const show: ActiveFilter[] = state.show !== 'all' && showsOn(state.tab) ? [{ key: 'show', option: state.show }] : [];
  return [...show, ...groupKeys(state.tab).flatMap((key) => (state.chosen[key] ?? []).map((option) => ({ key, option })))];
}

/** True when a chosen filter needs `policy.low_upkeep`. */
export const needsPolicy = (state: ExploreState): boolean =>
  GROUPS[state.tab].some((g) => g.needsPolicy && (state.chosen[g.key]?.length ?? 0) > 0);

/** The index entries a tab lists, in index order. */
export function entriesOf<T extends Tab>(index: LibraryIndex, tab: T): TabEntries[T][] {
  return index.entries.filter((e: IndexEntry) => e.kind === ENTRY_KIND[tab]) as TabEntries[T][];
}

function passes(group: AnyGroup, entry: TabEntry, chosen: readonly string[], policy: UpkeepPolicy): boolean {
  const test = group.test as (e: TabEntry, o: string, p: UpkeepPolicy) => boolean;
  return group.match === 'all' ? chosen.every((o) => test(entry, o, policy)) : chosen.some((o) => test(entry, o, policy));
}

/** Lower case with no accents or apostrophes and every other mark a space, so "See-Through" and "see through" read alike. */
const folded = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\p{M}'’]/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const searchTerms = (q: string): string[] => folded(q).split(' ').filter(Boolean);

/** Words shorter than this match only at a word start: anywhere, "red" would find every "layered" and "tapered". */
const MATCH_INSIDE_FROM = 4;

/** Every term is somewhere in the name or the aliases, together: "korean hush" spans an alias and the name. */
function matchesSearch(entry: TabEntry, terms: readonly string[]): boolean {
  const text = ` ${folded([entry.name, ...entry.aliases].join(' '))}`;
  return terms.every((term) => text.includes(term.length < MATCH_INSIDE_FROM ? ` ${term}` : term));
}

/** The search to name to the person; empty when it holds nothing to search for (only spaces or punctuation). */
export const searchText = (state: ExploreState): string => (searchTerms(state.q).length > 0 ? state.q.trim() : '');

/**
 * The entries that pass "Show", the search and every chosen group (AND across groups). `null` while a chosen group
 * still waits for the policy, so the screen never shows a count it cannot stand behind.
 */
export function applyFilters<E extends TabEntry>(entries: readonly E[], state: ExploreState, policy: UpkeepPolicy | null): E[] | null {
  if (needsPolicy(state) && policy === null) return null;
  const groups = GROUPS[state.tab].filter((g) => (state.chosen[g.key]?.length ?? 0) > 0);
  const p = policy ?? { max_styling_minutes: 0, min_trim_weeks: 0 };
  const terms = searchTerms(state.q);
  return entries.filter((entry) => {
    if (state.show !== 'all' && showsOn(state.tab) && !entry.collections.includes(state.show)) return false;
    return matchesSearch(entry, terms) && groups.every((g) => passes(g, entry, state.chosen[g.key] ?? [], p));
  });
}

/**
 * The options worth offering per group: those at least one entry of the tab has, plus every chosen one (so a filter
 * from an old link can still be removed). Upkeep is always offered: its test waits for the policy.
 */
export function offeredOptions(entries: readonly TabEntry[], state: ExploreState): Readonly<Record<string, readonly string[]>> {
  const placeholder = { max_styling_minutes: Number.POSITIVE_INFINITY, min_trim_weeks: 0 };
  return Object.fromEntries(GROUPS[state.tab].map((group) => {
    const test = group.test as (e: TabEntry, o: string, p: UpkeepPolicy) => boolean;
    const chosen = state.chosen[group.key] ?? [];
    const options = group.options.filter((o) => group.needsPolicy === true || chosen.includes(o) || entries.some((e) => test(e, o, placeholder)));
    return [group.key, options];
  }));
}
