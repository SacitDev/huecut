/**
 * Bottom sheet on a modal `<dialog>`: `showModal()` traps focus and makes the page inert,
 * Esc closes and focus returns to the opener. Snap points peek (45 %) and full (92 % of 100dvh); the 48 px header
 * follows a drag 1:1, and Expand and Close do the same without dragging (WCAG 2.5.7).
 */
import { useId, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { cx } from '../cx.ts';
import { Icon } from '../icons.tsx';
import styles from './Sheet.module.css';
import { useModalDialog } from './useModalDialog.ts';

export type SheetSnap = 'peek' | 'full';

export interface SheetProps {
  open: boolean;
  title: string;
  /** Called on Close, Esc, a tap on the scrim or a drag down past the peek point. */
  onClose: () => void;
  closeLabel: string;
  expandLabel: string;
  collapseLabel: string;
  initialSnap?: SheetSnap;
  children: ReactNode;
}

export function Sheet(props: SheetProps) {
  const { open, title, onClose, closeLabel, expandLabel, collapseLabel, initialSnap = 'peek', children } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [snap, setSnap] = useState<SheetSnap>(initialSnap);
  useModalDialog(ref, open, onClose, () => {
    // A drag that closed the sheet leaves its offset behind; it opens again at its first snap.
    ref.current?.style.removeProperty('transform');
    setSnap(initialSnap);
  });
  const drag = useSheetDrag(ref, snap, setSnap, onClose);
  const full = snap === 'full';
  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      data-snap={snap}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.header} {...drag}>
        <span className={styles.handle} aria-hidden="true" />
        <button
          type="button"
          className={cx(styles.headerButton, 'press')}
          onClick={() => {
            setSnap(full ? 'peek' : 'full');
          }}
        >
          <Icon name={full ? 'caretDown' : 'caretUp'} className={styles.icon} />
          <span>{full ? collapseLabel : expandLabel}</span>
        </button>
        <button type="button" className={cx(styles.headerButton, 'press')} aria-label={closeLabel} onClick={onClose}>
          <Icon name="x" className={styles.icon} />
        </button>
      </div>
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

interface DragState {
  startY: number;
  base: number;
  peek: number;
  height: number;
  y: number;
}

/**
 * Drag on the header: the sheet follows the pointer 1:1, then settles on the nearest of full, peek or closed
 * with the spring easing of the sheet's transition.
 */
function useSheetDrag(
  ref: RefObject<HTMLDialogElement | null>,
  snap: SheetSnap,
  setSnap: (snap: SheetSnap) => void,
  onClose: () => void,
) {
  const drag = useRef<DragState | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const dialog = ref.current;
    if (!dialog || event.button !== 0 || (event.target as Element).closest('button')) return;
    const height = dialog.offsetHeight;
    const peek =
      height - Number.parseFloat(getComputedStyle(dialog).getPropertyValue('--sheet-peek')) * window.innerHeight;
    const base = snap === 'full' ? 0 : peek;
    drag.current = { startY: event.clientY, base, peek, height, y: base };
    event.currentTarget.setPointerCapture(event.pointerId);
    dialog.dataset.dragging = 'true';
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || !ref.current) return;
    state.y = Math.max(0, state.base + event.clientY - state.startY);
    ref.current.style.transform = `translateY(${String(state.y)}px)`;
  };
  const onPointerUp = () => {
    const state = drag.current;
    const dialog = ref.current;
    drag.current = null;
    if (!state || !dialog) return;
    delete dialog.dataset.dragging;
    const nearest = [0, state.peek, state.height].reduce((a, b) =>
      Math.abs(b - state.y) < Math.abs(a - state.y) ? b : a,
    );
    if (nearest === state.height) {
      onClose();
      return;
    }
    dialog.style.removeProperty('transform');
    setSnap(nearest === 0 ? 'full' : 'peek');
  };
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}
