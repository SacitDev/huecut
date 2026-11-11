/**
 * "More with your photo" at the foot of the face card step: a plain list, each with its one line: Try a colour on your photo, See
 * it in 3D, Refine my hair outline (only when the outline is unsure), the prompt that explains the card, and the colour hints. An
 * extra shows its first download, or the device's reason in its place; a press sends `EXTRA.REQUEST` and opens its sheet, where the
 * tool's own `ExtraGate` shows the progress and Cancel, a failure with Try again, or the tool, which lives only while its sheet is
 * open.
 */
import { useId, useState } from 'react';
import type { PhotoMeasurements } from '../../../domain/measure/measure.ts';
import { buildExplainCard } from '../../../domain/prompts/build.ts';
import { cardFacts } from '../../../domain/render-model/face-card.ts';
import { extraBlock } from '../../../machine/consult.selectors.ts';
import type { ConsultEvent } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import type { ExtraModel } from '../../../worker/protocol.ts';
import { CopyPrompt } from '../../shared/CopyPrompt.tsx';
import { useExtras } from '../extras/connection.ts';
import { HairRefine } from '../extras/HairRefine.tsx';
import { ThreeDView } from '../extras/ThreeDView.tsx';
import { TryColour } from '../TryColour.tsx';
import type { ConsultView, StepProps } from '../useConsult.ts';
import { colourReadings, firstUseMb, outlineUnsure, type MeasuredEntry } from './model.ts';
import styles from './face.module.css';

const t = faceCopy;
type Send = (event: ConsultEvent) => void;

/** One extra: its button and first download, or the device's reason in its place; the tool in its sheet gates itself (one gate). */
function ExtraItem({ model, view, send }: { readonly model: ExtraModel; readonly view: ConsultView; readonly send: Send }) {
  const [open, setOpen] = useState(false);
  const hintId = useId();
  const extras = useExtras();
  const reason = extraBlock(view.context, model);
  const name = model === 'depth' ? t.more.threeD : t.more.refine;
  if (reason !== null) {
    return (
      <li className={styles.item}>
        <span className={styles.itemName}>{name}</span>
        <span className={styles.small}>{t.more.blocked[reason]}</span>
      </li>
    );
  }
  const start = () => {
    if (extras?.extraState(model) === 'idle') send({ type: 'EXTRA.REQUEST', model });
    setOpen(true);
  };
  return (
    <li className={styles.item}>
      <Button variant="secondary" describedBy={hintId} onClick={start}>{name}</Button>
      <p id={hintId} className={styles.small}>{model === 'depth' ? t.more.threeDHint(firstUseMb('depth')) : t.more.refineHint(firstUseMb('sam'))}</p>
      <Sheet open={open} title={name} onClose={() => { setOpen(false); }} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
        {open && view.context.mainPhotoId !== null && (model === 'depth' ? <ThreeDView photoId={view.context.mainPhotoId} /> : <HairRefine photoId={view.context.mainPhotoId} />)}
      </Sheet>
    </li>
  );
}

/** Colour readings as hints, and the undertone as the person's own answer (never read from the photo). */
function ColourHints({ step, entry }: { readonly step: StepProps; readonly entry: MeasuredEntry }) {
  const { context } = step.view;
  const read = colourReadings(entry.observation, step.port.selectors.facts(context), context.content);
  const rows = [
    ...(read.hair ? [{ swatch: read.hair.swatch, text: t.colour.hair(read.hair.shade.name) }] : []),
    ...(read.skin ? [{ swatch: read.skin.swatch, text: t.colour.skin(read.skin.label) }] : []),
    ...(read.undertone === null ? [] : [{ swatch: null, text: t.colour.undertone(read.undertone) }]),
  ];
  if (rows.length === 0) return null;
  return (
    <li className={styles.item}>
      <span className={styles.itemName}>{t.colour.heading}</span>
      <p className={styles.small}>{t.colour.intro}</p>
      <ul className={styles.hints}>
        {rows.map((r) => (
          <li key={r.text} className={styles.hint}>
            {r.swatch !== null && <span className={styles.swatch} style={{ backgroundColor: r.swatch }} aria-hidden="true" />}
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** The list, in the order the step shows it. */
export function More({ step, entry, m }: { readonly step: StepProps; readonly entry: MeasuredEntry; readonly m: PhotoMeasurements }) {
  const { port, view } = step;
  const headingId = useId();
  const unsure = outlineUnsure(entry, m, port.selectors.facts(view.context));
  const facts = port.selectors.cardFacts(view.context);
  // Nothing to explain when no fact could be read.
  const explains = facts.some((f) => f.sureness !== 'cannot_read');
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{t.more.heading}</h2>
      <ul className={styles.items}>
        {entry.observation.previewMask && (
          <li className={styles.item}>
            <TryColour photoId={entry.id} look="button" />
            <p className={styles.small}>{en.consult.colour.realistic}</p>
          </li>
        )}
        <ExtraItem model="depth" view={view} send={port.send} />
        {unsure && <ExtraItem model="sam" view={view} send={port.send} />}
        {explains && (
          <li className={styles.item}>
            {/* The prompt reads the card's English words, whatever language the screen shows. */}
            <CopyPrompt build={() => buildExplainCard(view.context.content.consult.prompts, cardFacts(m, view.context.content.consult.bands))} words={t.explain} />
          </li>
        )}
        <ColourHints step={step} entry={entry} />
      </ul>
    </section>
  );
}
