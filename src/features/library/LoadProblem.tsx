/**
 * A content load that failed: what happened, the likely cause, one next step and a small code.
 * "Try again" is offered where trying again can help (offline, a damaged file).
 */
import type { ContentError } from '../../platform/content.ts';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import styles from './library.module.css';

export function LoadProblem({ error, onRetry }: { readonly error: ContentError; readonly onRetry: () => void }) {
  const t = en.explore.errors;
  const words = t[error];
  return (
    <div className={styles.problemBox} role="alert">
      <p className={styles.problemTitle}>{words.title}</p>
      <p>{words.body}</p>
      {(error === 'offline' || error === 'failed') && (
        <Button variant="secondary" onClick={onRetry}>
          {t.retry}
        </Button>
      )}
      <p className={styles.code}>{t.code(`content_${error}`)}</p>
    </div>
  );
}
