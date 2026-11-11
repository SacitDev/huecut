/**
 * "Face looks different?" and the tips: the repair prompt for the same chat, a new chat per look, the
 * original photo every time, and the one honest line about what AI pictures tend to get wrong.
 */
import { useId } from 'react';
import type { Built } from '../../../domain/prompts/build.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { cx } from '../../../ui/cx.ts';
import { useCopy } from '../../shared/useCopy.ts';
import styles from './try-on.module.css';

const t = tryOnCopy;

export function Tips({ repair }: { readonly repair: Built | null }) {
  const id = useId();
  const [state, copy] = useCopy();
  const text = repair?.ok ? repair.value.text : null;
  return (
    <div className={styles.panel}>
      {text !== null && (
        <div className={styles.stack}>
          <Button variant="secondary" icon="copy" describedBy={`${id}-repair`} onClick={() => void copy(text)}>
            {t.repair.button}
          </Button>
          <p id={`${id}-repair`} className={styles.small}>
            {t.repair.hint}
          </p>
          <LiveRegion
            message={state === 'copied' ? t.repair.copied : state === 'refused' ? `${t.repair.refused} ${text}` : ''}
            className={cx(styles.status)}
          />
        </div>
      )}
      {repair?.ok === false && <p className={styles.problem}>{t.repair.failed(repair.error)}</p>}
      <ul className={styles.list}>
        {t.tips.list.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p>{t.tips.honest}</p>
    </div>
  );
}
