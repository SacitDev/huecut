/**
 * Explore's filter controls: each group a `fieldset` of chips with a legend; on phones a sticky row of quick chips with "All
 * filters" opening a sheet, from 840 px a 280 px side panel. "Show" is a radio group, and the search box sits above the tabs. Every
 * change is applied at once and written to the URL by the screen.
 */
import { useId, useState, type RefObject } from 'react';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { Chip } from '../../ui/components/Chip.tsx';
import { Sheet } from '../../ui/components/Sheet.tsx';
import { cx } from '../../ui/cx.ts';
import { Icon } from '../../ui/icons.tsx';
import { activeFilters, groupKeys, SEARCH_MAX_LENGTH, SHOWS, type ExploreState, type Show, type Tab } from './filters.ts';
import styles from './library.module.css';

const t = en.explore;

export interface SearchFieldProps {
  readonly value: string;
  /** The field, so the screen can return focus to it when the search is cleared. */
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly onChange: (value: string) => void;
  readonly onClear: () => void;
}

/** The search box: a visible label, a search keyboard with spelling help off (hair words get "corrected"), and a 44 px clear button. */
export function SearchField({ value, inputRef, onChange, onClear }: SearchFieldProps) {
  const id = useId();
  return (
    <div role="search" className={styles.search}>
      <label htmlFor={id} className={styles.searchLabel}>
        {t.searchLabel}
      </label>
      <div className={styles.searchBox}>
        <input
          ref={inputRef}
          id={id}
          className={styles.searchInput}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={SEARCH_MAX_LENGTH}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            // The results are already there, so a phone's Search key has only the keyboard left to put away.
            if (event.key === 'Enter' && window.matchMedia('(pointer: coarse)').matches) event.currentTarget.blur();
          }}
        />
        {value !== '' && (
          <button type="button" className={cx(styles.iconButton, styles.searchClear)} aria-label={t.clearSearch} onClick={onClear}>
            <Icon name="x" className={styles.icon} />
          </button>
        )}
      </div>
    </div>
  );
}

export interface FilterControlsProps {
  readonly state: ExploreState;
  /** The options to offer per group key. */
  readonly offered: Readonly<Record<string, readonly string[]>>;
  readonly labelOf: (key: string, option: string) => string;
  readonly onToggle: (key: string, option: string) => void;
  readonly onClear: () => void;
}

const legendOf = (tab: Tab, key: string): string => (t.groups[tab] as Readonly<Record<string, string>>)[key] ?? key;

/** One fieldset per group that has something to offer. */
export function FilterGroups({ state, offered, labelOf, onToggle }: FilterControlsProps) {
  return (
    <>
      {groupKeys(state.tab).map((key) => {
        const options = offered[key] ?? [];
        if (options.length === 0) return null;
        return (
          <fieldset key={key} className={styles.group}>
            <legend className={styles.legend}>{legendOf(state.tab, key)}</legend>
            <div className={styles.chips}>
              {options.map((option) => (
                <Chip
                  key={option}
                  label={labelOf(key, option)}
                  selected={state.chosen[key]?.includes(option) ?? false}
                  onToggle={() => {
                    onToggle(key, option);
                  }}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </>
  );
}

/** From 840 px: every group in a panel beside the grid. */
export function FilterPanel(props: FilterControlsProps) {
  const headingId = useId();
  const active = activeFilters(props.state).filter((f) => f.key !== 'show').length;
  return (
    <aside className={styles.filterPanel} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.filterTitle}>
        {t.filters}
      </h2>
      <FilterGroups {...props} />
      {active > 0 && (
        <Button variant="text" onClick={props.onClear}>
          {t.clearFilters}
        </Button>
      )}
    </aside>
  );
}

/** The quick chips: the first group's options (two groups for styles), then any other chosen option, so each shows. */
function quickChips(state: ExploreState, offered: FilterControlsProps['offered']): { key: string; option: string }[] {
  const keys = groupKeys(state.tab).slice(0, state.tab === 'styles' ? 2 : 1);
  const quick = keys.flatMap((key) => (offered[key] ?? []).map((option) => ({ key, option })));
  const others = activeFilters(state).filter((f) => f.key !== 'show' && !keys.includes(f.key));
  return [...quick, ...others];
}

/** Below 840 px: "All filters" (with how many are on) and the quick chips in one sticky row; the sheet holds the rest. */
export function FilterBar(props: FilterControlsProps & { readonly countText: string }) {
  const { state, offered, labelOf, onToggle, onClear, countText } = props;
  const [open, setOpen] = useState(false);
  const active = activeFilters(state).filter((f) => f.key !== 'show').length;
  return (
    <>
      <div className={styles.chipBar} role="group" aria-label={t.quickFilters}>
        <button
          type="button"
          className={cx(styles.allFilters, 'press')}
          aria-haspopup="dialog"
          aria-label={active > 0 ? t.allFiltersOn(active) : t.allFilters}
          onClick={(event) => {
            // Safari does not focus a button on click; the sheet returns focus to whatever had it when it opened.
            event.currentTarget.focus();
            setOpen(true);
          }}
        >
          <Icon name="plus" className={styles.icon} />
          <span>{t.allFilters}</span>
          {/* The space keeps the visible words "All filters 1" inside the name "All filters 1 on" (WCAG 2.5.3). */}
          {active > 0 && (
            <>
              {' '}
              <span className={styles.badge}>{active}</span>
            </>
          )}
        </button>
        {quickChips(state, offered).map(({ key, option }) => (
          <Chip key={`${key}:${option}`} label={labelOf(key, option)} selected={state.chosen[key]?.includes(option) ?? false} onToggle={() => { onToggle(key, option); }} />
        ))}
      </div>
      <Sheet open={open} title={t.filters} onClose={() => { setOpen(false); }} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
        <FilterGroups {...props} />
        <div className={styles.sheetActions}>
          <Button onClick={() => { setOpen(false); }}>{t.showResults(countText)}</Button>
          {active > 0 && (
            <Button variant="secondary" onClick={onClear}>
              {t.clearFilters}
            </Button>
          )}
        </div>
      </Sheet>
    </>
  );
}

/** "Show: Women's styles / Men's styles / All" as one radio group. */
export function ShowChooser({ show, onShow }: { readonly show: Show; readonly onShow: (show: Show) => void }) {
  const name = useId();
  return (
    <fieldset className={styles.show}>
      <legend className={styles.showLegend}>{t.showLegend}</legend>
      <div className={styles.showOptions}>
        {SHOWS.map((value) => (
          <label key={value} className={cx(styles.showOption, 'press')}>
            <input
              className="visually-hidden"
              type="radio"
              name={name}
              value={value}
              checked={show === value}
              onChange={() => {
                onShow(value);
              }}
            />
            {show === value && <Icon name="check" className={styles.icon} />}
            <span>{t.shows[value]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
