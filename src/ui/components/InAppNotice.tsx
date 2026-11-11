/**
 * The in-app browser notice: a sentence, "Copy link" and "How to open it". All copy comes in as
 * props; the result shows next to the button for 2 s and in a polite live region.
 */
import { useEffect, useState } from 'react';
import { Icon } from '../icons.tsx';
import { Button } from './Button.tsx';
import { LiveRegion } from './LiveRegion.tsx';
import styles from './InAppNotice.module.css';

export interface InAppNoticeProps {
  message: string;
  copyLabel: string;
  copiedLabel: string;
  /** Shown with the link itself when the app blocks copying. */
  copyFailedText: string;
  link: string;
  howToLabel: string;
  howToText: string;
  /** Copies the link; resolves to false when copying is blocked. */
  onCopy: () => Promise<boolean>;
}

/** How long the button reads "Link copied". */
const COPIED_MS = 2000;

type CopyState = 'idle' | 'copied' | 'failed';

export function InAppNotice(props: InAppNoticeProps) {
  const { message, copyLabel, copiedLabel, copyFailedText, link, howToLabel, howToText, onCopy } = props;
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = window.setTimeout(() => {
      setState('idle');
    }, COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state]);
  const copy = async () => {
    setState((await onCopy()) ? 'copied' : 'failed');
  };
  return (
    <div className={styles.notice} role="note">
      <Icon name="info" className={styles.icon} />
      <div className={styles.content}>
        <p>{message}</p>
        <div className={styles.actions}>
          <Button variant="secondary" icon="linkSimple" onClick={() => void copy()}>
            {state === 'copied' ? copiedLabel : copyLabel}
          </Button>
          <details className={styles.how}>
            <summary className={styles.summary}>{howToLabel}</summary>
            <p className={styles.steps}>{howToText}</p>
          </details>
        </div>
        {state === 'failed' && (
          <p className={styles.fallback}>
            {copyFailedText} <span className={styles.link}>{link}</span>
          </p>
        )}
        <LiveRegion message={state === 'copied' ? copiedLabel : state === 'failed' ? copyFailedText : ''} />
      </div>
    </div>
  );
}
