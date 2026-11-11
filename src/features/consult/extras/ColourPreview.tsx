/**
 * The rough colour preview: colour looks by family, or one look, tinted on the
 * person's own hair through the worker's `tint`; always labelled "Rough preview", with the before and after, a neutral grey
 * view and "Your colourist places the highlights" for placements it does not draw. The sheet body of "Try a colour on your
 * photo" and "See it on me".
 */
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { LookIndexEntry } from '../../../domain/content/output.ts';
import type { PhotoId } from '../../../domain/ids.ts';
import { extraBlock } from '../../../machine/consult.selectors.ts';
import { photoPicture, tintedPicture } from '../../../platform/hair-tools.ts';
import * as resources from '../../../platform/resources.ts';
import { exploreCopy } from '../../../strings/en-explore.ts';
import { extrasCopy as c } from '../../../strings/en-extras.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Chip } from '../../../ui/components/Chip.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import type { AnalysisError } from '../../../worker/protocol.ts';
import { firstUseMb } from '../face/model.ts';
import { Switch } from '../../../ui/components/Switch.tsx';
import { useExtras, type Extras } from './connection.ts';
import { HairRefine } from './HairRefine.tsx';
import { byFamily, placedByColourist, previewLooks, tintTargets, type Family } from './model.ts';
import { cx } from '../../../ui/cx.ts';
import styles from './extras.module.css';

const x = c.preview;

/** Draws a bitmap at its own size on a canvas and closes it. */
function paint(canvas: HTMLCanvasElement | null, bitmap: ImageBitmap): void {
  if (canvas) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  }
  bitmap.close();
}

/** The worker's own decode of the photo on the `before` canvas, once per photo; true when it could not be made. */
function useBefore(photoId: PhotoId, canvas: RefObject<HTMLCanvasElement | null>): boolean {
  const [failedFor, setFailedFor] = useState<PhotoId | null>(null);
  useEffect(() => {
    const stop = new AbortController();
    void photoPicture(photoId, stop.signal).then((r) => {
      if (r.ok) paint(canvas.current, r.value);
      else if (!stop.signal.aborted) setFailedFor(photoId);
    });
    return () => {
      stop.abort();
    };
  }, [photoId, canvas]);
  return failedFor === photoId;
}

interface Tint {
  readonly busy: boolean;
  readonly failure: AnalysisError | null;
  readonly retry: () => void;
}

/** The look tinted on the `after` canvas, again whenever the refined outline changes, once the core tools it `waits` for are there; a new look stops the one before. */
function useAfter(photoId: PhotoId, look: LookIndexEntry, refined: unknown, canvas: RefObject<HTMLCanvasElement | null>, waits: boolean): Tint {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<{ readonly key: string; readonly failure: AnalysisError | null } | null>(null);
  const key = `${look.id}/${String(attempt)}`;
  const { lab } = look;
  useEffect(() => {
    if (waits) return;
    const stop = new AbortController();
    void tintedPicture(photoId, tintTargets(lab), stop.signal).then((r) => {
      if (stop.signal.aborted) {
        if (r.ok) r.value.close();
        return;
      }
      if (r.ok) paint(canvas.current, r.value);
      setOutcome({ key, failure: r.ok ? null : r.error });
    });
    return () => {
      stop.abort();
    };
  }, [photoId, lab, key, refined, canvas, waits]);
  return { busy: outcome?.key !== key, failure: outcome?.key === key ? outcome.failure : null, retry: () => { setAttempt((n) => n + 1); } };
}

interface BeforeAfterProps {
  readonly photoId: PhotoId;
  readonly look: LookIndexEntry;
  readonly refined: unknown;
  readonly neutral: boolean;
  /** The core tools are still coming: the tint waits for them. */
  readonly waits: boolean;
  /** The looks, between the picture and the slider, so they stay right under the picture held at the top. */
  readonly children: ReactNode;
}

/** The labelled picture, held in view at the top with the whole look showing first, and the before-and-after slider; a thin divider once it moves; the whole photo always shows. */
function BeforeAfter({ photoId, look, refined, neutral, waits, children }: BeforeAfterProps) {
  const before = useRef<HTMLCanvasElement>(null);
  const after = useRef<HTMLCanvasElement>(null);
  const [split, setSplit] = useState(0);
  const hint = useId();
  const noBefore = useBefore(photoId, before);
  const tint = useAfter(photoId, look, refined, after, waits);
  return (
    <>
      <div className={styles.surface} data-neutral={neutral}>
        <p className={styles.label}>{x.label}</p>
        <div className={styles.compare}>
          <canvas ref={after} className={styles.picture} data-layer="after" role="img" aria-label={x.shown(look.name)} />
          <canvas ref={before} className={styles.pictureOver} data-layer="before" aria-hidden="true" style={{ clipPath: `inset(0 ${String(100 - split)}% 0 0)` }} />
          {split > 0 && split < 100 && <span className={styles.divider} data-layer="divider" aria-hidden="true" style={{ insetInlineStart: `${String(split)}%` }} />}
        </div>
        {tint.busy && <Progress label={x.busy} value={null} />}
        {placedByColourist(look) && <p>{x.placed}</p>}
      </div>
      {children}
      <label className={styles.slider}>
        <span>{x.compare}</span>
        <input type="range" min={0} max={100} step={1} value={split} aria-valuetext={x.compareValue(split)} aria-describedby={hint} onChange={(e) => { setSplit(Number(e.currentTarget.value)); }} />
      </label>
      <p id={hint} className={styles.small}>{noBefore ? x.noBefore : x.compareHint}</p>
      {/* Said aloud always; on screen once the preview is made, the moving line above saying the rest. */}
      <LiveRegion message={tint.busy ? x.busy : tint.failure ? x.failed : x.shown(look.name)} className={tint.busy ? undefined : cx(styles.small)} />
      {tint.failure && <Button variant="secondary" onClick={tint.retry}>{x.tryAgain}</Button>}
    </>
  );
}

/** The families as chips and the chosen family's looks, the choice held here only while the sheet is open. */
function LookPicker({ looks, look, onChoose }: { readonly looks: readonly LookIndexEntry[]; readonly look: LookIndexEntry; readonly onChoose: (look: LookIndexEntry) => void }) {
  const groups = byFamily(looks);
  const [family, setFamily] = useState<Family>(look.traits.family);
  const shown = groups.find((g) => g.family === family) ?? groups[0];
  const options = exploreCopy.options.family;
  return (
    <>
      <div className={styles.chipRow} role="group" aria-label={x.familyLabel}>
        {groups.map((g) => <Chip key={g.family} label={options[g.family]} selected={g.family === shown?.family} onToggle={() => { setFamily(g.family); }} />)}
      </div>
      <div className={styles.chipRow} role="group" aria-label={x.looksLabel}>
        {shown?.looks.map((l) => <Chip key={l.id} label={l.name} selected={l.id === look.id} onToggle={() => { onChoose(l); }} />)}
      </div>
    </>
  );
}

/** "Tap your hair…" with its download size, or the device's reason in its place. */
function RefineOffer({ extras, onOpen }: { readonly extras: Extras; readonly onOpen: () => void }) {
  const hint = useId();
  const reason = extraBlock(extras.view.context, 'sam');
  if (reason !== null) return <p className={styles.small}>{reason === 'computer_only' ? c.refine.computerOnly : faceCopy.more.blocked[reason]}</p>;
  const open = () => {
    if (extras.extraState('sam') === 'idle') extras.send({ type: 'EXTRA.REQUEST', model: 'sam' });
    onOpen();
  };
  return (
    <div className={styles.stack}>
      <Button variant="secondary" describedBy={hint} onClick={open}>{c.refine.open}</Button>
      <p id={hint} className={styles.small}>{c.refine.hint(firstUseMb('sam'))}</p>
    </div>
  );
}

interface BodyProps {
  readonly photoId: PhotoId;
  readonly looks: readonly LookIndexEntry[];
  /** Set for "See it on me": this look alone, with no picker. */
  readonly fixed: LookIndexEntry | null;
  readonly note: string | undefined;
  readonly extras: Extras;
  readonly onRefine: () => void;
  readonly waits: boolean;
}

function PreviewBody({ photoId, looks, fixed, note, extras, onRefine, waits }: BodyProps) {
  const [chosen, setChosen] = useState<LookIndexEntry | null>(null);
  const [neutral, setNeutral] = useState(false);
  const hint = useId();
  const look = fixed ?? chosen ?? looks[0];
  if (!look) return <p>{x.noLooks}</p>;
  const refined = extras.view.context.photos.find((p) => p.id === photoId)?.refined ?? null;
  return (
    <div className={styles.stack}>
      <BeforeAfter photoId={photoId} look={look} refined={refined} neutral={neutral} waits={waits}>
        {!fixed && <LookPicker looks={looks} look={look} onChoose={setChosen} />}
      </BeforeAfter>
      <Switch label={x.neutral} checked={neutral} onChange={setNeutral} describedBy={hint} />
      <p id={hint} className={styles.small}>{x.neutralHint}</p>
      <RefineOffer extras={extras} onOpen={onRefine} />
      {note !== undefined && <p className={styles.small}>{note}</p>}
    </div>
  );
}

export interface ColourPreviewProps {
  readonly photoId: PhotoId;
  /** One look ("See it on me"); without it the person chooses from the looks by family. */
  readonly lookId?: string;
  /** A line under the preview ("Is it realistic for your hair?…"). */
  readonly note?: string;
}

export function ColourPreview({ photoId, lookId, note }: ColourPreviewProps) {
  const extras = useExtras();
  const [refining, setRefining] = useState(false);
  // Without a stored outline the tint needs the segmenter, whose core tools a restored answers-only session never started: the preview asks for them.
  const core = extras?.view.core;
  const waits = !resources.hasMask(photoId) && (core === 'idle' || core === 'loading');
  const send = extras?.send;
  useEffect(() => {
    if (waits && core === 'idle') send?.({ type: 'MODELS.RETRY' });
  }, [waits, core, send]);
  if (!extras) return <p className={styles.small}>{c.notReady}</p>;
  if (refining) {
    return (
      <div className={styles.stack}>
        <Button variant="text" onClick={() => { setRefining(false); }}>{c.refine.back}</Button>
        <HairRefine photoId={photoId} onDone={() => { setRefining(false); }} />
      </div>
    );
  }
  const { content, prefs } = extras.view.context;
  const looks = previewLooks(content.library.entries, prefs.collections);
  // A look from the list, any collection: it may have been added from Explore.
  const fixed = lookId === undefined ? null : (previewLooks(content.library.entries).find((l) => l.id === lookId) ?? null);
  if (lookId !== undefined && !fixed) return <p>{x.notShowable}</p>;
  return <PreviewBody photoId={photoId} looks={looks} fixed={fixed} note={note} extras={extras} onRefine={() => { setRefining(true); }} waits={waits} />;
}
