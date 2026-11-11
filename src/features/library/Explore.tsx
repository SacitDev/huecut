/**
 * Explore: the search box, the tabs Styles, Colours and Beards, "Show", the filters,
 * the result count (announced politely), the grid or the no-results state, and the item detail over the grid. Tab, Show,
 * search and filters live in the URL query (`#/explore?tab=colours&q=ash&family=blonde`); the last ones, not what was
 * typed, are kept on the device.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { LibraryIndex } from '../../domain/content/output.ts';
import type { ItemId } from '../../domain/ids.ts';
import { content } from '../../platform/content.ts';
import { transitionsPlay } from '../../platform/device.ts';
import { readKey, writeKey } from '../../platform/storage.ts';
import { en } from '../../strings/en.ts';
import { Progress } from '../../ui/components/Progress.tsx';
import { panelId, tabId, Tabs } from '../../ui/components/Tabs.tsx';
import { toggleFavourite, useFavourites } from './favourites.ts';
import { FilterBar, FilterPanel, SearchField, ShowChooser } from './Filters.tsx';
import {
  activeFilters, applyFilters, cleared, entriesOf, explorePath, itemPath, needsPolicy, offeredOptions, parseState, searchText, TAB_OF_KIND,
  TABS, toggled, toQuery, withSearch, withShow, withTab, without, type ActiveFilter, type ExploreState, type ItemKind,
  type UpkeepPolicy,
} from './filters.ts';
import { useContent, useMediaQuery, useSettled } from './hooks.ts';
import { ItemDetail } from './ItemDetail.tsx';
import { LibraryGrid, type GridTile } from './LibraryGrid.tsx';
import { LoadProblem } from './LoadProblem.tsx';
import { NoResults } from './NoResults.tsx';
import { optionLabel, tilesOf } from './tiles.ts';
import styles from './library.module.css';

const t = en.explore;
/** localStorage `huecut:explore`: the last tab, Show and filters (nothing personal). */
const LAST_FILTERS = 'explore';
/** The one name the tapped tile's arch and the detail's hero arch share for the morph. */
const HERO = 'library-hero';
/** Marks a dialog that arrived by the morph, for as long as it is open. */
const MORPHED = 'data-morphed';
/** How long a tap may wait for the picture: a slow network gets the motion anyway, and the picture a moment later. */
const PICTURE_WAIT_MS = 300;
/** How long the count must hold before it is read out: each key press would otherwise interrupt the last reading. */
const COUNT_SPOKEN_AFTER_MS = 500;

export interface ExploreItem {
  readonly kind: ItemKind;
  readonly id: string;
}
/** What "Find my look with this style" did: added (and My look opened), refused as the list is full, or failed. */
export type FindMyLookResult = 'added' | 'full' | 'failed';
export interface ExploreProps {
  readonly query: URLSearchParams;
  /** The item of `#/explore/:kind/:id`, or null on the grid. */
  readonly item: ExploreItem | null;
  /** Goes to a path such as `/explore?tab=colours`; `replace` changes the URL without a history entry. */
  readonly navigate: (to: string, replace?: boolean) => void;
  /** The browser's Back. */
  readonly back: () => void;
  /** Puts a cut or colour look on My look's list (the machine's `SHORTLIST.ADD`) and opens My look. */
  readonly onFindMyLook: (id: ItemId) => Promise<FindMyLookResult>;
}

/**
 * The shared-element morph: only the tapped tile's arch gets the name, and gives it up inside
 * the update, where the detail's hero arch takes it. Where transitions do not play (the router's gate) the change is
 * instant and the detail opens with its own entrance.
 */
function morphTo(frame: HTMLElement | null, go: () => void): void {
  if (!frame || !transitionsPlay()) {
    go();
    return;
  }
  frame.style.setProperty('view-transition-name', HERO);
  const transition = document.startViewTransition(async () => {
    frame.style.removeProperty('view-transition-name');
    flushSync(go);
    // The hero carries the motion: the dialog's own entrance, left on, would play after it as a second animation.
    const dialog = document.querySelector('dialog[open]');
    dialog?.toggleAttribute(MORPHED, true);
    await pictureReady(dialog?.querySelector('img'));
  });
  void transition.ready.catch(() => undefined);
  void transition.finished.catch(() => undefined);
}

/** Lets the detail's picture decode, within a bound, so it arrives with the morph and does not appear after it. */
function pictureReady(picture: HTMLImageElement | null | undefined): Promise<unknown> {
  if (!picture) return Promise.resolve();
  return Promise.race([picture.decode().catch(() => undefined), new Promise((done) => { setTimeout(done, PICTURE_WAIT_MS); })]);
}

/** The key of the item last shown, kept while its dialog plays its closing animation. */
function useShownItem(item: ExploreItem | null): ExploreItem | null {
  const key = item ? `${item.kind}/${item.id}` : null;
  const [kept, setKept] = useState<ExploreItem | null>(item);
  if (item && key !== (kept ? `${kept.kind}/${kept.id}` : null)) setKept(item);
  return item ?? kept;
}

/** Restores the last filters when Explore opens without any, and keeps each change. */
function useLastFilters(query: URLSearchParams, item: ExploreItem | null, current: string, navigate: ExploreProps['navigate']) {
  const [stored] = useState(() => readKey(LAST_FILTERS));
  const restore = useRef(query.size === 0 && item === null && stored !== null && stored !== '');
  useEffect(() => {
    if (!restore.current || stored === null) return;
    restore.current = false;
    navigate(explorePath(stored), true);
  }, [navigate, stored]);
  useEffect(() => {
    if (!restore.current) writeKey(LAST_FILTERS, current);
  }, [current]);
}

export function Explore({ query, item, navigate, back, onFindMyLook }: ExploreProps) {
  const state = parseState(query, item ? TAB_OF_KIND[item.kind] : 'styles');
  const current = toQuery(state);
  // What was typed is free text and this storage is readable across the origin (nothing personal), so it stays in the URL only.
  useLastFilters(query, item, toQuery(withSearch(state, '')), navigate);
  const index = useContent('index', () => content.index());
  const ids = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const change = (next: ExploreState) => {
    navigate(explorePath(toQuery(next)), true);
  };
  // Both clear buttons disappear once used, so focus goes to the field rather than being lost.
  const clearSearch = () => {
    change(withSearch(state, ''));
    searchInput.current?.focus();
  };
  return (
    <section className={styles.explore} aria-labelledby={`${ids}title`}>
      <header className={styles.head}>
        <h1 id={`${ids}title`}>{t.title}</h1>
        <p className={styles.illustrations}>{t.illustrations}</p>
      </header>
      <SearchField value={state.q} inputRef={searchInput} onChange={(q) => { change(withSearch(state, q)); }} onClear={clearSearch} />
      <Tabs tabs={TABS} tab={state.tab} labels={t.tabs} label={t.tabsLabel} ids={ids} onTab={(tab) => { change(withTab(state, tab)); }} />
      <div role="tabpanel" id={panelId(ids)} aria-labelledby={tabId(ids, state.tab)} className={styles.tabPanel}>
        {index.status === 'ready' ? (
          <Library index={index.value} state={state} current={current} item={item} navigate={navigate} back={back} change={change} onClearSearch={clearSearch} onFindMyLook={onFindMyLook} />
        ) : index.status === 'error' ? (
          <LoadProblem error={index.error} onRetry={index.retry} />
        ) : (
          <Progress label={t.loading} value={null} />
        )}
      </div>
    </section>
  );
}

interface LibraryProps {
  readonly index: LibraryIndex;
  readonly state: ExploreState;
  readonly current: string;
  readonly item: ExploreItem | null;
  readonly navigate: ExploreProps['navigate'];
  readonly back: () => void;
  readonly change: (next: ExploreState) => void;
  readonly onClearSearch: () => void;
  readonly onFindMyLook: ExploreProps['onFindMyLook'];
}

/** The low-upkeep policy, loaded only once an upkeep filter is chosen. */
function usePolicy(state: ExploreState): UpkeepPolicy | null {
  const consult = useContent(needsPolicy(state) ? 'consult' : null, () => content.consult());
  return consult.status === 'ready' ? consult.value.policy.low_upkeep : null;
}

function Library({ index, state, current, item, navigate, back, change, onClearSearch, onFindMyLook }: LibraryProps) {
  const wide = useMediaQuery('(width >= 840px)');
  const saved = useFavourites();
  const policy = usePolicy(state);
  const entries = entriesOf(index, state.tab);
  const shown = applyFilters(entries, state, policy);
  const active = activeFilters(state);
  const labelOf = (key: string, option: string) => optionLabel(index, state.tab, key, option);
  const countText = shown === null ? '' : t.count[state.tab](shown.length);
  const spokenCount = useSettled(countText, COUNT_SPOKEN_AFTER_MS);
  const detail = useDetail(item, current, navigate, back);
  const controls = {
    state, offered: offeredOptions(entries, state), labelOf,
    onToggle: (key: string, option: string) => { change(toggled(state, key, option)); },
    onClear: () => { change(cleared(state)); },
  };
  return (
    <div className={styles.layout}>
      {wide ? <FilterPanel {...controls} /> : <FilterBar {...controls} countText={countText} />}
      <div className={styles.results}>
        {state.tab !== 'beards' && <ShowChooser show={state.show} onShow={(show) => { change(withShow(state, show)); }} />}
        {/* The count shows at once; screen readers get it from the region below, once typing pauses. */}
        <p className={styles.count} aria-hidden="true">{countText}</p>
        <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{spokenCount}</p>
        {shown === null && <Progress label={t.loading} value={null} />}
        {shown?.length === 0 && (
          <NoResults tab={state.tab} search={searchText(state)} active={active} labelOf={(f: ActiveFilter) => (f.key === 'show' ? t.shows[state.show] : labelOf(f.key, f.option))}
            onRemove={(f) => { change(without(state, f)); }} onClearSearch={onClearSearch} />
        )}
        {shown && shown.length > 0 && (
          <LibraryGrid tiles={tilesOf(index, state.tab, shown, current)} label={t.tabs[state.tab]} saved={saved}
            saveLabel={t.save} onToggleSave={(id) => { toggleFavourite(id); }} onOpen={detail.open} />
        )}
      </div>
      {detail.shown && (
        <ItemDetail kind={detail.shown.kind} id={detail.shown.id} open={item !== null} index={index} onClose={detail.close}
          onOpenItem={detail.replace} hrefOf={(kind, id) => `#${itemPath(kind, id, current)}`} onFindMyLook={onFindMyLook} />
      )}
    </div>
  );
}

/**
 * Opening and closing the detail. Opened from a tile, the detail is a history entry, so closing is Back; opened from
 * a link (or after a reload) closing replaces the URL with the grid's. Each close acts once, however many fire.
 */
function useDetail(item: ExploreItem | null, current: string, navigate: ExploreProps['navigate'], back: () => void) {
  const shown = useShownItem(item);
  const openedHere = useRef(false);
  const closing = useRef<string | null>(null);
  const key = item ? `${item.kind}/${item.id}` : null;
  // In the commit, not after it: a passive effect can still be pending when a tile is tapped, and React runs it before that
  // tap's render, so its reset undid `open` below and closing replaced the URL instead of going Back.
  useLayoutEffect(() => {
    if (key !== null) return;
    openedHere.current = false;
    document.querySelector(`dialog[${MORPHED}]`)?.removeAttribute(MORPHED);
  }, [key]);
  const open = (tile: GridTile, frame: HTMLElement | null) => {
    openedHere.current = true;
    closing.current = null;
    morphTo(frame, () => {
      navigate(itemPath(tile.kind, tile.id, current));
    });
  };
  const replace = (kind: ItemKind, id: string) => {
    closing.current = null;
    navigate(itemPath(kind, id, current), true);
  };
  const close = () => {
    if (key === null || closing.current === key) return;
    closing.current = key;
    if (openedHere.current) back();
    else navigate(explorePath(current), true);
  };
  return { shown, open, replace, close };
}
