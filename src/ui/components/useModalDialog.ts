/**
 * The one modal-dialog behaviour of the bottom sheet, the stylist sheet and Explore's side panel:
 * `showModal()` when `open` turns true, a closing animation then `close()` when it turns false, focus back to the opener.
 */
import { useEffect, useRef, type RefObject } from 'react';

/** Longest wait for a closing animation before the dialog closes anyway (its token is 220 ms). */
const CLOSE_FALLBACK_MS = 400;

/**
 * `showModal()` when `open` turns true (focus moves in, the page behind is inert), a closing animation then `close()` when it
 * turns false, focus back to the element that opened it, `onClosed` once it has closed (a sheet resets itself there), and
 * `onClose` for every close, a tap on the backdrop and the browser's own close (a repeated Esc) included, but not a late `close`
 * event for a dialog already shown again. The dialog itself handles Esc with `onCancel`.
 */
export function useModalDialog(ref: RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void, onClosed?: () => void): void {
  const opener = useRef<HTMLElement | null>(null);
  const latest = useRef({ onClose, onClosed });
  useEffect(() => {
    latest.current = { onClose, onClosed };
  });
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      // `close` is queued as a task, so it can arrive after the dialog was shown again (Explore's next detail by link): that
      // close is over, and handling it would report the open dialog as closed and focus its old opener.
      if (dialog.open) return;
      delete dialog.dataset.closing;
      opener.current?.focus();
      opener.current = null;
      latest.current.onClosed?.();
      latest.current.onClose();
    };
    const handleBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) latest.current.onClose();
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleBackdrop);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdrop);
    };
  }, [ref]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) {
        opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
      }
      return;
    }
    if (!dialog.open) return;
    return closeAfterAnimation(dialog);
  }, [ref, open]);
}

/** Marks the dialog as closing so CSS plays its exit, then closes it; returns the cleanup. */
function closeAfterAnimation(dialog: HTMLDialogElement): () => void {
  const finish = () => {
    if (dialog.open) dialog.close();
  };
  const handleEnd = (event: AnimationEvent) => {
    if (event.target === dialog) finish();
  };
  dialog.dataset.closing = 'true';
  dialog.addEventListener('animationend', handleEnd);
  const timer = window.setTimeout(finish, CLOSE_FALLBACK_MS);
  return () => {
    dialog.removeEventListener('animationend', handleEnd);
    window.clearTimeout(timer);
  };
}
