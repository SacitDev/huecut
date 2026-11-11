/**
 * The detail's side panel from 840 px (420 px on expanded, 480 px on large): a modal `<dialog>` at the
 * inline end with its title and a Close button. Esc, Close and a tap beside it close it; focus returns to the opener.
 */
import { useId, useRef, type ReactNode } from 'react';
import { useModalDialog } from '../../ui/components/useModalDialog.ts';
import { cx } from '../../ui/cx.ts';
import { Icon } from '../../ui/icons.tsx';
import styles from './library.module.css';

export interface SidePanelProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly closeLabel: string;
  readonly children: ReactNode;
}

export function SidePanel({ open, title, onClose, closeLabel, children }: SidePanelProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalDialog(ref, open, onClose);
  return (
    <dialog
      ref={ref}
      className={styles.panel}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // React passes cancel up its own tree, portals included: Esc closes this dialog only, not one beneath it.
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.panelFrame}>
        <div className={styles.panelHeader}>
          <h2 id={titleId} className={styles.panelTitle}>
            {title}
          </h2>
          <button type="button" className={cx(styles.iconButton, 'press')} aria-label={closeLabel} onClick={onClose}>
            <Icon name="x" className={styles.icon} />
          </button>
        </div>
        <div className={styles.panelBody}>{children}</div>
      </div>
    </dialog>
  );
}
