/**
 * The detail's reading parts and two of its actions: its sections as label and value rows (lengths with
 * guard numbers, fade, upkeep, the colour plan), "Works with your hair if…", "Find my look with this style", and the
 * Save toggle (`aria-pressed`).
 */
import { useState } from 'react';
import type { ItemId } from '../../domain/ids.ts';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { cx } from '../../ui/cx.ts';
import { Icon } from '../../ui/icons.tsx';
import type { DetailSection } from './detail-model.ts';
import type { FindMyLookResult } from './Explore.tsx';
import { toggleFavourite, useFavourites } from './favourites.ts';
import styles from './library.module.css';

export interface DetailInfoProps {
  readonly sections: readonly DetailSection[];
  readonly works: { readonly heading: string; readonly lines: readonly string[]; readonly note: string | null } | null;
}

export function DetailInfo({ sections, works }: DetailInfoProps) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.id} className={styles.infoSection}>
          <h3 className={styles.infoHeading}>{s.heading}</h3>
          <dl className={styles.rows}>
            {s.rows.map((r) => (
              <div key={`${r.label}:${r.value}`} className={styles.row}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {works && (works.lines.length > 0 || works.note) && (
        <section className={styles.infoSection}>
          <h3 className={styles.infoHeading}>{works.heading}</h3>
          {works.lines.length > 0 && (
            <ul className={styles.works}>
              {works.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {works.note && <p className={styles.quiet}>{works.note}</p>}
        </section>
      )}
    </>
  );
}

/**
 * "Find my look with this style": busy while My look's machine starts, then My look opens. A refusal
 * (the list is full) or a failure is said next to the button.
 */
export function FindMyLookButton({ id, onFind }: { readonly id: ItemId; readonly onFind: (id: ItemId) => Promise<FindMyLookResult> }) {
  const [state, setState] = useState<FindMyLookResult | 'idle' | 'busy'>('idle');
  const t = en.explore.detail;
  const find = async () => {
    setState('busy');
    setState(await onFind(id));
  };
  return (
    <div className={styles.prompt}>
      <Button variant="secondary" busy={state === 'busy'} busyText={t.adding} onClick={() => void find()}>
        {t.findMyLook}
      </Button>
      <LiveRegion message={state === 'full' ? t.listFull : state === 'failed' ? t.addFailed : ''} className={cx(styles.status)} />
    </div>
  );
}

/** "Save": the same favourite as the grid's heart, with a constant name and its state in `aria-pressed`. */
export function SaveButton({ id, name }: { readonly id: string; readonly name: string }) {
  const saved = useFavourites().has(id);
  return (
    <button
      type="button"
      className={cx(styles.saveButton, 'press')}
      aria-pressed={saved}
      aria-label={en.explore.save(name)}
      onClick={() => {
        toggleFavourite(id);
      }}
    >
      <Icon name={saved ? 'check' : 'heart'} className={styles.icon} />
      <span>{en.explore.detail.save}</span>
    </button>
  );
}
