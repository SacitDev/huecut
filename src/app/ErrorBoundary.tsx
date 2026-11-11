/**
 * Catches a render error in a screen and shows the app's error state (what happened, the likely
 * cause, one next step, a small code) inside the shell, so the top bar and navigation keep working.
 */
import { Component, type ReactNode } from 'react';
import { en } from '../strings/en.ts';
import { Button } from '../ui/components/Button.tsx';
import { cx } from '../ui/cx.ts';
import styles from './routes.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** The screen shown: when it changes after a failure, the boundary starts clean. */
  resetOn: string;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Keyed by the route in App, so moving to another screen starts clean; My look's steps share a key and reset through `resetOn`. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.failed && previous.resetOn !== this.props.resetOn) this.setState({ failed: false });
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <section className={styles.page} role="alert">
        <h1>{en.error.title}</h1>
        <p className={styles.body}>{en.error.body}</p>
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          {en.error.action}
        </Button>
        <p className={cx('t-small', styles.body)}>{en.error.code}</p>
      </section>
    );
  }
}
