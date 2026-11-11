/**
 * "Show your stylist": a prop-driven view of the stylist-sheet model in a modal
 * `<dialog>`: the library pictures whole in arches, the sections as label and value rows, the footer, and the actions
 * the caller passes ("Copy as text", "Save as image"). Esc and Close close it; focus returns to the opener.
 */
import { useId, useRef, type ReactNode } from 'react';
import { cx } from '../cx.ts';
import { Icon } from '../icons.tsx';
import { Arch } from './Arch.tsx';
import { LiveRegion } from './LiveRegion.tsx';
import styles from './StylistSheet.module.css';
import { useModalDialog } from './useModalDialog.ts';

export interface StylistSheetPicture {
  readonly key: string;
  readonly src: string;
  readonly srcSet: string;
  readonly sizes: string;
  readonly width: number;
  readonly height: number;
  /** The picture's average colour, shown in its final aspect until it loads. */
  readonly placeholder: string;
  readonly alt: string;
}
export interface StylistSheetRow {
  readonly label: string;
  readonly value: string;
}
export interface StylistSheetSection {
  readonly id: string;
  readonly heading: string;
  readonly rows: readonly StylistSheetRow[];
}

export interface StylistSheetProps {
  readonly open: boolean;
  /** Called on Close, Esc and a tap outside the sheet. */
  readonly onClose: () => void;
  readonly title: string;
  readonly pictures: readonly StylistSheetPicture[];
  /** Names the pictures strip for screen readers. */
  readonly picturesLabel: string;
  readonly sections: readonly StylistSheetSection[];
  /** Huecut and its link. */
  readonly footer: readonly string[];
  readonly closeLabel: string;
  /** The caller's buttons, shown in the sheet's action bar. */
  readonly actions: ReactNode;
  /** The result of the last action, announced politely and shown under the buttons. */
  readonly status: string;
}

export function StylistSheet(props: StylistSheetProps) {
  const { open, onClose, title, closeLabel, actions, status } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalDialog(ref, open, onClose);
  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // React passes cancel up its own tree, portals included: Esc closes this dialog only, not one beneath it.
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.frame}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={cx(styles.close, 'press')} aria-label={closeLabel} onClick={onClose}>
            <Icon name="x" className={styles.icon} />
          </button>
        </header>
        <SheetBody {...props} titleId={titleId} />
        <div className={styles.actions}>
          <div className={styles.buttons}>{actions}</div>
          <LiveRegion message={status} className={cx(styles.status)} />
        </div>
      </div>
    </dialog>
  );
}

/** The sheet's text scrolls, so it takes focus (WCAG 2.1.1): keyboard users can scroll it with the arrow keys. */
function SheetBody({ pictures, picturesLabel, sections, footer, titleId }: StylistSheetProps & { titleId: string }) {
  const ids = useId();
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region with no control in it must be focusable
    <div className={styles.body} role="region" aria-labelledby={titleId} tabIndex={0}>
      {pictures.length > 0 && (
        <ul className={styles.pictures} aria-label={picturesLabel}>
          {pictures.map((p) => (
            <li key={p.key}>
              <Arch ratio={p.width / p.height} placeholder={p.placeholder}>
                <img src={p.src} srcSet={p.srcSet} sizes={p.sizes} width={p.width} height={p.height} alt={p.alt} decoding="async" />
              </Arch>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.sections}>
        {sections.map((s) => (
          <section key={s.id} className={styles.section} aria-labelledby={`${ids}${s.id}`}>
            <h3 id={`${ids}${s.id}`} className={styles.heading}>
              {s.heading}
            </h3>
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
      </div>
      <p className={styles.footer}>{footer.join(' ')}</p>
    </div>
  );
}
