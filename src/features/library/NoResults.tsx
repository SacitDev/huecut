/**
 * No results: says which filters cause it and offers to remove each one ("No styles match both
 * filters. Remove ‘Men's styles’ or ‘Medium length’?"). A search that finds nothing says what was searched for and
 * offers to clear it. With no filter on and no search, the tab is simply empty and says so.
 */
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import type { ActiveFilter, Tab } from './filters.ts';
import styles from './library.module.css';

export interface NoResultsProps {
  readonly tab: Tab;
  /** The words searched for, or empty when there is no search. */
  readonly search: string;
  readonly active: readonly ActiveFilter[];
  readonly labelOf: (filter: ActiveFilter) => string;
  readonly onRemove: (filter: ActiveFilter) => void;
  readonly onClearSearch: () => void;
}

export function NoResults({ tab, search, active, labelOf, onRemove, onClearSearch }: NoResultsProps) {
  const t = en.explore;
  if (active.length === 0 && search === '') return <p className={styles.noResults}>{t.empty[tab]}</p>;
  const labels = active.map(labelOf);
  return (
    <div className={styles.noResults}>
      <p>{search === '' ? `${t.noResults(t.what[tab], active.length)} ${t.removeQuestion(labels)}` : t.noSearchResults(t.what[tab], search, active.length > 0)}</p>
      <div className={styles.removeActions}>
        {search !== '' && <Button variant="secondary" onClick={onClearSearch}>{t.clearSearch}</Button>}
        {active.map((filter, i) => (
          <Button key={`${filter.key}:${filter.option}`} variant="secondary" onClick={() => { onRemove(filter); }}>
            {t.remove(labels[i] ?? filter.option)}
          </Button>
        ))}
      </div>
    </div>
  );
}
