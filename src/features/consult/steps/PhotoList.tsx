/**
 * The photos added so far: each thumbnail with its quality hints in words (hints
 * never block; the photo being analysed shows its words with a moving line), the main photo chosen with a radio, and Remove
 * asking once, inline, naming the photo.
 */
import { useState } from 'react';
import { isListedOnly, isUsable } from '../../../machine/consult.selectors.ts';
import type { ConsultEvent, PhotoEntry } from '../../../machine/consult.types.ts';
import * as resources from '../../../platform/resources.ts';
import { en } from '../../../strings/en.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import type { StepProps } from '../useConsult.ts';
import styles from './steps.module.css';

const t = en.consult.photo;

/** The photo's state and its issues, each in a plain sentence with one next step. */
export function photoHints({ port, view }: StepProps, entry: PhotoEntry): string[] {
  const { context } = view;
  if (entry.status === 'failed') {
    const code = entry.error;
    return [code === 'decode_failed' || code === 'out_of_memory' ? t.errors[code] : t.errors.other];
  }
  if (entry.status === 'queued') {
    if (context.inFlight?.photoId === entry.id) return [t.status.analysing];
    return [isListedOnly(context, entry) ? t.status.listed : t.status.waiting];
  }
  const issues = port.selectors.measurementsOf(context, entry.id)?.issues ?? [];
  return issues.length === 0 && isUsable(entry) ? [t.status.ready] : issues.map((issue) => t.issues[issue]);
}

function Thumbnail({ entry }: { readonly entry: PhotoEntry }) {
  const thumbnail = resources.photo(entry.id)?.thumbnail;
  const url = resources.useObjectUrl(thumbnail);
  if (url === null) return <span className={styles.thumb} />;
  return <img className={styles.thumb} src={url} alt="" width={256} height={256} />;
}

function Remove({ name, onRemove }: { readonly name: string; readonly onRemove: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="text" icon="trash" onClick={() => { setAsking(true); }}>
        {t.remove(name)}
      </Button>
    );
  }
  return (
    <>
      <span>{t.removeAsk(name)}</span>
      <Button variant="secondary" onClick={onRemove}>{t.removeYes}</Button>
      <Button variant="text" onClick={() => { setAsking(false); }}>{t.removeNo}</Button>
    </>
  );
}

function Row({ step, entry, index }: { readonly step: StepProps; readonly entry: PhotoEntry; readonly index: number }) {
  const send = (event: ConsultEvent) => {
    step.port.send(event);
  };
  const fileName = resources.photo(entry.id)?.name ?? '';
  const label = t.name(index + 1);
  const hints = photoHints(step, entry);
  const analysing = entry.status === 'queued' && step.view.context.inFlight?.photoId === entry.id;
  return (
    <li className={styles.row}>
      <Thumbnail entry={entry} />
      <div className={styles.rowText}>
        <label className={styles.pick}>
          <input type="radio" name="main-photo" checked={step.view.context.mainPhotoId === entry.id} onChange={() => { send({ type: 'PHOTOS.SET_MAIN', id: entry.id }); }} />
          <span>{label}</span>
        </label>
        {analysing ? <Progress label={t.status.analysing} value={null} /> : hints.map((hint) => <p key={hint} className={styles.count}>{hint}</p>)}
      </div>
      <div className={styles.rowActions}>
        <Remove name={label} onRemove={() => { send({ type: 'PHOTOS.REMOVE', id: entry.id }); }} />
        {fileName !== '' && <span className={styles.count}>{fileName}</span>}
      </div>
    </li>
  );
}

export function PhotoList(step: StepProps) {
  const { photos } = step.view.context;
  if (photos.length === 0) return null;
  return (
    <fieldset className={styles.photos}>
      {/* One photo leaves nothing to choose: "Main photo" is then for screen readers only, and the photo starts higher on a small phone. */}
      <legend className={photos.length > 1 ? styles.photosTitle : 'visually-hidden'}>{t.main}</legend>
      <ul className={styles.list}>
        {photos.map((entry, i) => (
          <Row key={entry.id} step={step} entry={entry} index={i} />
        ))}
      </ul>
    </fieldset>
  );
}
