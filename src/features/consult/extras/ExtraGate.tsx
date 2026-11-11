/**
 * The way into an extra: renders the machine's state for that extra, its reason where the
 * device cannot run it, the download's progress with Cancel, a failure with Try again, or the tool once it is ready.
 */
import type { ReactNode } from 'react';
import { extraBlock } from '../../../machine/consult.selectors.ts';
import { en } from '../../../strings/en.ts';
import { extrasCopy as x } from '../../../strings/en-extras.ts';
import { faceCopy as w } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import type { ExtraModel } from '../../../worker/protocol.ts';
import { useDownloadFraction, type ConsultPort } from '../useConsult.ts';
import { useExtras } from './connection.ts';
import styles from './extras.module.css';

/** The one part of an extra that follows every progress message. */
function Downloading({ port, model }: { readonly port: ConsultPort; readonly model: ExtraModel }) {
  return <Progress label={w.extra.downloading} value={useDownloadFraction(port, model)} />;
}

export function ExtraGate({ model, children }: { readonly model: ExtraModel; readonly children: ReactNode }) {
  const extras = useExtras();
  if (!extras) return <p className={styles.small}>{x.notReady}</p>;
  const { port, view, send, extraState } = extras;
  const block = extraBlock(view.context, model);
  if (block !== null) return <p className={styles.small}>{w.more.blocked[block]}</p>;
  const state = extraState(model);
  if (state === 'ready') return children;
  const { error } = view.context.models[model];
  if (state === 'downloading') {
    return (
      <div className={styles.stack}>
        <Downloading port={port} model={model} />
        <Button variant="secondary" onClick={() => { send({ type: 'CANCEL', model }); }}>{en.consult.tools.cancel}</Button>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className={styles.stack}>
        <p>{error?.code === 'network' ? en.consult.tools.stalled : x.gate.failed}</p>
        <Button variant="secondary" onClick={() => { send({ type: 'EXTRA.RETRY', model }); }}>{en.consult.tools.tryAgain}</Button>
        {error && <p className={styles.small}>{en.consult.tools.code(error.code)}</p>}
      </div>
    );
  }
  return (
    <div className={styles.stack}>
      <p>{en.consult.tools.stopped}</p>
      <Button variant="secondary" onClick={() => { send({ type: 'EXTRA.REQUEST', model }); }}>{en.consult.tools.downloadAgain}</Button>
    </div>
  );
}
