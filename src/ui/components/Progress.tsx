/**
 * Progress: a pill-shaped track under its label in words, with a cocoa fill for a download. A wait with no
 * share to show (`value` null, nothing come yet, or all come and the work going on) shows a short segment gliding along the track, so
 * the wait reads as alive; under reduced motion it stands still in the middle. `WaitLine` is that segment alone, for a busy button or a status line. Announcing changes is
 * the caller's job, through a LiveRegion.
 */
import { useId } from 'react';
import { cx } from '../cx.ts';
import styles from './Progress.module.css';

export interface ProgressProps {
  /** What is happening, and how far, in words: "Getting the face tools ready. First time only: 18 of 38 MB." */
  label: string;
  /** Fraction done from 0 to 1, or null while the total is not known (or there is none). */
  value: number | null;
}

export function Progress({ label, value }: ProgressProps) {
  const labelId = useId();
  const fraction = value === null ? null : Math.min(1, Math.max(0, value));
  // Nothing has come yet, or all of it has and the work goes on (a model starting): no share to show, so the line glides.
  const share = fraction !== null && fraction > 0 && fraction < 1 ? fraction : null;
  return (
    <div className={styles.progress}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fraction === null ? undefined : Math.round(fraction * 100)}
      >
        {share === null ? <span className={styles.wait} /> : <span className={styles.fill} style={{ transform: `scaleX(${String(share)})` }} />}
      </div>
    </div>
  );
}

/** The gliding segment on a line of its own, in the colour of the text around it; the caller sizes and places the line. */
export function WaitLine({ className }: { readonly className?: string | undefined }) {
  return (
    <span className={cx(styles.line, className)} aria-hidden="true">
      <span className={styles.wait} />
    </span>
  );
}
