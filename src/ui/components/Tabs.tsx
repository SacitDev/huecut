/**
 * Tabs (WAI-ARIA tab pattern): one tab stop, arrow keys move between the tabs and choose at once (automatic activation), Home and
 * End go to the ends. The screen owns which tab is chosen, and links its panel with `tabId` and `panelId`.
 */
import { cx } from '../cx.ts';
import styles from './Tabs.module.css';

export interface TabsProps<T extends string> {
  readonly tabs: readonly T[];
  readonly tab: T;
  /** The words on each tab. */
  readonly labels: Readonly<Record<T, string>>;
  readonly label: string;
  /** The prefix of the ids the tabs and panel share. */
  readonly ids: string;
  readonly onTab: (tab: T) => void;
  /** All tabs on the row (wrapping if they must), on a narrow screen too, instead of a row that scrolls sideways. */
  readonly fit?: boolean;
}

/** The id of a tab, for its panel's `aria-labelledby`. */
export const tabId = (ids: string, tab: string): string => `${ids}tab-${tab}`;
/** The id of the panel, for the tabs' `aria-controls`. */
export const panelId = (ids: string): string => `${ids}panel`;

export function Tabs<T extends string>({ tabs, tab, labels, label, ids, onTab, fit = false }: TabsProps<T>) {
  const move = (from: T, step: number) => {
    const next = tabs[(tabs.indexOf(from) + step + tabs.length) % tabs.length] ?? from;
    onTab(next);
    document.getElementById(tabId(ids, next))?.focus();
  };
  return (
    <div className={cx(styles.tabs, fit && styles.fit)} role="tablist" aria-label={label}>
      {tabs.map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          id={tabId(ids, value)}
          className={cx(styles.tab, 'press')}
          aria-selected={tab === value}
          aria-controls={panelId(ids)}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => {
            if (tab !== value) onTab(value);
          }}
          onKeyDown={(event) => {
            // Alt+Left is the browser's Back, and the others are the browser's or the system's too.
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            const at = tabs.indexOf(value);
            const steps: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1, Home: -at, End: tabs.length - 1 - at };
            const step = steps[event.key];
            if (step === undefined) return;
            event.preventDefault();
            move(value, step);
          }}
        >
          {labels[value]}
        </button>
      ))}
    </div>
  );
}
