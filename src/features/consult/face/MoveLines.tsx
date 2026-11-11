/**
 * Move the lines: asked for in one line under the portrait, then a sheet with the photo in the crop it
 * opened with and a dot on each of six parts named in words. A part is picked by its name or its dot and moved by dragging or
 * with the arrows (WCAG 2.5.7). Every move applies at once and the facts under the photo follow; one part, or every line, can
 * be put back as found. Each event carries the photo's id, so one for a photo switched or removed since is refused.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Point } from '../../../domain/geometry/coords.ts';
import type { FaceCard } from '../../../domain/render-model/face-card.ts';
import { en } from '../../../strings/en.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import type { StepProps } from '../useConsult.ts';
import { EditStage } from './EditStage.tsx';
import { FaceFacts } from './FaceFacts.tsx';
import { inPlacement, movePlacement, nudged, nudgesOf, placedParts, shiftedHairline, type MeasuredEntry, type Part, type PlacedPart } from './model.ts';
import { usePhotoBitmap } from './usePainting.ts';
import styles from './face.module.css';

const t = faceCopy.mover;
const ICONS = { up: 'arrowUp', down: 'arrowDown', left: 'arrowLeft', right: 'arrowRight' } as const;

/**
 * Holds the facts at their tallest since the sheet opened. Facts come and go as a dot moves; a shorter sheet would make the
 * browser pull the scroll back, moving the photo under the finger and the dot with it.
 */
function useNeverShrink() {
  const block = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (block.current) block.current.style.minBlockSize = `${String(block.current.offsetHeight)}px`;
  });
  return block;
}

/** The picked part's arrows (Up and Down only for the hairline and chin) and putting it, or every line, back as found. */
function PartControls({ step, entry, part, moveTo, say }: {
  readonly step: StepProps; readonly entry: MeasuredEntry; readonly part: PlacedPart; readonly moveTo: (p: PlacedPart, to: Point) => void; readonly say: (s: string) => void;
}) {
  const name = t.parts[part.part];
  const reset = (which: PlacedPart['moves'] | 'all', said: string) => {
    step.port.send({ type: 'POINTS.RESET', photoId: entry.id, part: which });
    say(said);
  };
  return (
    <>
      <fieldset className={styles.nudges}>
        <legend className="visually-hidden">{t.moveLabel(name)}</legend>
        {nudgesOf(part.part).map((n) => (
          <Button key={n} variant="secondary" icon={ICONS[n]} onClick={() => { moveTo(part, nudged(part.at, n, entry.observation.image)); say(t.moved(name)); }}>
            {t.nudge[n]}
          </Button>
        ))}
      </fieldset>
      <div className={styles.row}>
        <Button variant="secondary" onClick={() => { reset(part.moves, t.putBackDone(name)); }}>{t.putBack(name)}</Button>
        <Button variant="text" onClick={() => { reset('all', t.allBackDone); }}>{t.putAllBack}</Button>
      </div>
    </>
  );
}

interface MoverProps {
  readonly step: StepProps;
  /** The main photo as it was when the sheet opened: its crop is frozen and every event names it. */
  readonly entry: MeasuredEntry;
  readonly card: FaceCard;
  readonly onDone: () => void;
}

/** The sheet's body: the parts, the stage, the arrows, putting back, and the facts as they change. */
function Mover({ step, entry, card, onDone }: MoverProps) {
  const { port, view } = step;
  const photoId = entry.id;
  const [placement] = useState(() => movePlacement(card, entry.observation.image));
  const edits = view.context.photos.find((p) => p.id === photoId)?.edits ?? null;
  const m = port.selectors.measurementsOf(view.context, photoId);
  const parts = useMemo(() => (m ? placedParts(entry.observation, m, edits) : []), [entry.observation, m, edits]);
  const [picked, setPicked] = useState<Part>(parts[0]?.part ?? 'chin');
  const [said, setSaid] = useState('');
  const items = useMemo(() => inPlacement(card, placement), [card, placement]);
  const bitmap = usePhotoBitmap(photoId);
  const facts = useNeverShrink();
  const index = Math.max(0, parts.findIndex((p) => p.part === picked));
  const part = parts[index];
  const moveTo = (p: PlacedPart, to: Point) => {
    if (p.moves !== 'hairline') port.send({ type: 'POINTS.MOVE', photoId, index: p.moves, to });
    else port.send({ type: 'HAIRLINE.MOVE', photoId, to: shiftedHairline(m?.lines.find((l) => l.id === 'hairline')?.points ?? [], p.at, to) });
  };
  return (
    <div className={styles.section}>
      <p>{t.intro}</p>
      <OptionGroup legend={t.partLegend} twoPerRow>
        {parts.map((p) => (
          <OptionTile key={p.part} name="move-part" value={p.part} label={t.parts[p.part]} checked={p.part === picked} onChange={setPicked} />
        ))}
      </OptionGroup>
      <EditStage
        items={items} parts={parts} selected={index} placement={placement} bitmap={bitmap} label={t.canvas}
        onSelect={(i) => { setPicked(parts[i]?.part ?? picked); }}
        onMove={(to) => { if (part) moveTo(part, to); }}
      />
      {part && <PartControls step={step} entry={entry} part={part} moveTo={moveTo} say={setSaid} />}
      <LiveRegion message={said} />
      <div ref={facts}>
        <FaceFacts facts={port.selectors.cardFacts(view.context)} />
      </div>
      <Button onClick={onDone}>{t.done}</Button>
    </div>
  );
}

/** The ask under the portrait, and its sheet. */
export function MoveLines({ step, entry, card }: Omit<MoverProps, 'onDone'>) {
  const [open, setOpen] = useState<MeasuredEntry | null>(null);
  const close = () => {
    setOpen(null);
  };
  return (
    <div className={styles.row}>
      <p className={styles.small}>{t.ask}</p>
      <Button variant="text" onClick={() => { setOpen(entry); }}>{t.open}</Button>
      <Sheet open={open !== null} title={t.open} onClose={close} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
        {open && <Mover step={step} entry={open} card={card} onDone={close} />}
      </Sheet>
    </div>
  );
}
