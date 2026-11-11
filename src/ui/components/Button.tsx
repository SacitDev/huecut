/**
 * Buttons: primary cocoa pill, secondary outline, Rosewood text link.
 * A busy button keeps its place, shows its busy text and sets `aria-busy`; there is no spinner: a short line glides under the
 * words, so the wait reads as alive, and stands still under reduced motion.
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { Icon, type IconName } from '../icons.tsx';
import { WaitLine } from './Progress.tsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

interface CommonProps {
  variant?: ButtonVariant;
  /** A leading icon, always beside the words. */
  icon?: IconName;
  className?: string | undefined;
  children: ReactNode;
}

export interface ButtonProps extends CommonProps {
  type?: 'button' | 'submit';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** While true the button shows `busyText`, sets `aria-busy` and ignores presses. */
  busy?: boolean;
  busyText?: string;
  /** Not available right now: stays focusable (`aria-disabled`) so focus is never lost, and ignores presses. */
  unavailable?: boolean;
  describedBy?: string;
}

export interface LinkButtonProps extends CommonProps {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A native `<button>` in one of the three styles. */
export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  type = 'button',
  onClick,
  busy = false,
  busyText,
  unavailable = false,
  describedBy,
}: ButtonProps) {
  const inactive = busy || unavailable;
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], 'press', className)}
      aria-busy={busy || undefined}
      aria-disabled={inactive || undefined}
      aria-describedby={describedBy}
      onClick={inactive ? undefined : onClick}
    >
      {icon && <Icon name={icon} className={styles.icon} />}
      {busy ? (
        <>
          <span>{busyText ?? children}</span>
          <WaitLine className={styles.busyLine} />
        </>
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
}

/** A link that looks like a button, for actions that go to another screen. */
export function LinkButton({ variant = 'primary', icon, className, children, href, onClick }: LinkButtonProps) {
  return (
    <a href={href} className={cx(styles.button, styles[variant], 'press', className)} onClick={onClick}>
      {icon && <Icon name={icon} className={styles.icon} />}
      <span>{children}</span>
    </a>
  );
}
