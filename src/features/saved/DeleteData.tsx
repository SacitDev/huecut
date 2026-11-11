/**
 * "Delete my data": asks once, inline, naming what will be deleted. `RESET` first, so the worker
 * has stopped and the photos in memory are gone before the storage they might write to is emptied.
 */
import { useState } from 'react';
import { savedCopy } from '../../strings/en-saved.ts';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { deleteMyData } from './delete-data.ts';
import type { SessionPort } from './model.ts';
import styles from './Saved.module.css';

const t = savedCopy.data;

export function DeleteData({ port, onDeleted }: { readonly port: SessionPort | null; readonly onDeleted: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'asking' | 'busy'>('idle');
  const [message, setMessage] = useState('');
  const confirm = (): void => {
    setPhase('busy');
    if (port && port.view().step !== null) port.send({ type: 'RESET' });
    void deleteMyData().then((all) => {
      onDeleted();
      setPhase('idle');
      setMessage(all ? t.done : t.partly);
    });
  };
  return (
    <section className={styles.section}>
      <h2 className="t-h2">{t.heading}</h2>
      {phase === 'idle' ? (
        <Button variant="secondary" onClick={() => { setMessage(''); setPhase('asking'); }}>
          {t.delete}
        </Button>
      ) : (
        <div className={styles.empty}>
          <p>{t.ask}</p>
          <div className={styles.actions}>
            <Button onClick={confirm} busy={phase === 'busy'} busyText={t.busy}>
              {t.yes}
            </Button>
            <Button variant="text" unavailable={phase === 'busy'} onClick={() => { setPhase('idle'); }}>
              {t.no}
            </Button>
          </div>
        </div>
      )}
      <LiveRegion message={message} className={styles.status ?? ''} />
    </section>
  );
}
