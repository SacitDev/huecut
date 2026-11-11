/**
 * The example's bar: the "Example" badge on every My look screen, "Try another model" and "Start with my
 * photo". It also opens the first model when the URL asks for an example; `asked` is true on `?source=example`.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { exampleMayOpen } from '../../machine/consult.selectors.ts';
import { en } from '../../strings/en.ts';
import { savedCopy } from '../../strings/en-saved.ts';
import { Button } from '../../ui/components/Button.tsx';
import { EXAMPLE_PHOTO_PREFIX, openExample, startWithMyPhoto } from './example-session.ts';
import type { SessionPort } from './model.ts';
import styles from './Saved.module.css';

const t = savedCopy.example;

/** Says the example could not open, with a way to try again. */
function ExampleFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className={styles.exampleFailed} role="status">
      <p>{t.failed}</p>
      <Button variant="secondary" onClick={onRetry}>
        {t.tryAgain}
      </Button>
    </div>
  );
}

export function ExampleBar({ port, asked }: { readonly port: SessionPort; readonly asked: boolean }) {
  const view = useSyncExternalStore(port.subscribe, port.view);
  const models = view.context.content.library.models;
  const first = models[0]?.id;
  /** The model that could not open: the session has already ended by then, so the person is told and can try again. */
  const [failed, setFailed] = useState<string | null>(null);
  const open = (id: string): void => {
    openExample(port, id).catch(() => {
      setFailed(id);
    });
  };
  // The same rule as router-sync: this renders before router-sync has put the URL right, and opening the example ends the session.
  const waiting = asked && exampleMayOpen(view);
  useEffect(() => {
    if (!waiting || failed !== null || first === undefined) return;
    openExample(port, first).catch(() => {
      setFailed(first);
    });
  }, [port, waiting, failed, first]);
  if (failed !== null) return <ExampleFailed onRetry={() => { setFailed(null); if (!waiting) open(failed); }} />;
  if (view.step === null || view.context.source !== 'example') return null;
  const shownId = view.context.mainPhotoId?.slice(EXAMPLE_PHOTO_PREFIX.length);
  const shown = models.findIndex((m) => m.id === shownId);
  const model = models[shown];
  const next = models[(shown + 1) % models.length];
  // Two siblings: the badge alone sticks while the step scrolls, because a whole bar would cover a phone's screen.
  return (
    <>
      <span className={styles.badge}>{t.badge}</span>
      <div className={styles.example}>
        {model && <p className={styles.exampleText}>{t.on(model.label, en.consult.goal.collections[model.collection])}</p>}
        {next && (
          <Button variant="text" onClick={() => { open(next.id); }}>
            {t.another}
          </Button>
        )}
        <Button variant="secondary" onClick={() => { startWithMyPhoto(port); }}>
          {t.mine}
        </Button>
      </div>
    </>
  );
}
