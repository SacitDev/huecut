/**
 * Tap to select hair: the photo with its hair outline; a tap adds to it or takes
 * away, SAM redraws it, and "Use this outline" puts the mask in the resource store and sends `HAIR.REFINED`. The move and
 * Mark buttons are the keyboard alternative to a tap. Offered on computers only, through `ExtraGate`.
 */
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Point } from '../../../domain/geometry/coords.ts';
import type { PhotoId } from '../../../domain/ids.ts';
import { selectHair } from '../../../platform/hair-tools.ts';
import * as resources from '../../../platform/resources.ts';
import { extrasCopy as c } from '../../../strings/en-extras.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Chip } from '../../../ui/components/Chip.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { cx } from '../../../ui/cx.ts';
import type { HairSelection, TapPoint } from '../../../worker/protocol.ts';
import { useExtras } from './connection.ts';
import { ExtraGate } from './ExtraGate.tsx';
import { movedSpot, pointIn, SPOT_MOVES } from './model.ts';
import styles from './extras.module.css';

const x = c.tap;
/** The outline's colour on the photo: RGB of the rose-soft token, part see-through so the hair still shows. */
const OUTLINE_RGBA = [243, 198, 208, 150] as const;
/** Where the spot starts: over the top of the head, as most photos are framed. */
const SPOT_START: Point = { x: 0.5, y: 0.15 };
const percent = (share: number): number => Math.round(share * 100);

type TapStatus = 'idle' | 'busy' | 'failed';

interface MaskLike {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8Array;
}

/** A ref for the outline canvas; the mask is painted on it at the mask's own size, again whenever it changes. */
function useOutline(mask: MaskLike | null): RefObject<HTMLCanvasElement | null> {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const context = el?.getContext('2d');
    if (!el || !context || !mask) return;
    el.width = mask.widthPx;
    el.height = mask.heightPx;
    const image = context.createImageData(mask.widthPx, mask.heightPx);
    mask.data.forEach((v, i) => {
      if (v > 0) image.data.set(OUTLINE_RGBA, i * 4);
    });
    context.putImageData(image, 0, 0);
  }, [mask]);
  return canvas;
}

/** The taps so far and SAM's answer; one tap is read at a time, and leaving stops the one running. */
function useTaps(photoId: PhotoId) {
  const [points, setPoints] = useState<readonly TapPoint[]>([]);
  const [selection, setSelection] = useState<HairSelection | null>(null);
  const [status, setStatus] = useState<TapStatus>('idle');
  const stop = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      stop.current?.abort();
    },
    [],
  );
  const add = (point: TapPoint): void => {
    if (status === 'busy') return;
    const next = [...points, point];
    const controller = new AbortController();
    stop.current = controller;
    setStatus('busy');
    void selectHair(photoId, next, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setStatus(r.ok ? 'idle' : 'failed');
      if (!r.ok) return;
      setPoints(next);
      setSelection(r.value);
    });
  };
  const reset = (): void => {
    stop.current?.abort();
    setPoints([]);
    setSelection(null);
    setStatus('idle');
  };
  return { selection, status, add, reset };
}

/** The spot's move buttons and Mark: the keyboard alternative to a tap. */
function SpotControls({ spot, onMove, onMark, busy }: { readonly spot: Point; readonly onMove: (to: Point) => void; readonly onMark: () => void; readonly busy: boolean }) {
  return (
    <div className={styles.chips} role="group" aria-label={x.moveLabel}>
      {SPOT_MOVES.map((move) => <Button key={move} variant="secondary" onClick={() => { onMove(movedSpot(spot, move)); }}>{x.move[move]}</Button>)}
      <Button variant="secondary" busy={busy} busyText={x.busy} onClick={onMark}>{x.mark}</Button>
    </div>
  );
}

/** What the live region says now: the tap's progress or the spot's place. */
function statusOf(status: TapStatus, updated: boolean, spot: Point): string {
  if (status === 'busy') return x.busy;
  if (status === 'failed') return x.failed;
  return updated ? x.updated : x.spot(percent(spot.x), percent(spot.y));
}

function TapStage({ photoId, onDone }: { readonly photoId: PhotoId; readonly onDone?: (() => void) | undefined }) {
  const extras = useExtras();
  const entry = extras?.view.context.photos.find((p) => p.id === photoId);
  const photoUrl = resources.useObjectUrl(resources.photo(photoId)?.preview);
  const { selection, status, add, reset } = useTaps(photoId);
  const overlay = useOutline(selection?.mask ?? entry?.observation?.previewMask ?? null);
  const [include, setInclude] = useState(true);
  const [spot, setSpot] = useState(SPOT_START);
  if (!extras) return null;
  const mark = (at: Point) => {
    add({ x: at.x, y: at.y, include });
  };
  const tap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const at = pointIn(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    setSpot(at);
    mark(at);
  };
  const use = () => {
    if (!selection) return;
    resources.setMask(photoId, selection.mask);
    extras.send({ type: 'HAIR.REFINED', photoId, measures: selection.measures });
    onDone?.();
  };
  return (
    <div className={styles.stack}>
      <p>{x.intro}</p>
      <div className={styles.tapStage} onPointerUp={tap}>
        {photoUrl !== null && <img className={styles.picture} src={photoUrl} alt={x.photo} />}
        <canvas ref={overlay} className={styles.pictureOver} data-layer="outline" aria-hidden="true" />
        <span className={styles.spot} style={{ left: `${String(percent(spot.x))}%`, top: `${String(percent(spot.y))}%` }} aria-hidden="true" />
      </div>
      <div className={styles.chips} role="group" aria-label={x.modeLabel}>
        <Chip label={x.add} selected={include} onToggle={() => { setInclude(true); }} />
        <Chip label={x.remove} selected={!include} onToggle={() => { setInclude(false); }} />
      </div>
      <SpotControls spot={spot} onMove={setSpot} onMark={() => { mark(spot); }} busy={status === 'busy'} />
      <LiveRegion message={statusOf(status, selection !== null, spot)} className={cx(styles.small)} />
      <div className={styles.chips}>
        <Button unavailable={!selection} onClick={use}>{x.use}</Button>
        <Button variant="text" onClick={reset}>{x.reset}</Button>
      </div>
    </div>
  );
}

export function HairRefine({ photoId, onDone }: { readonly photoId: PhotoId; readonly onDone?: () => void }) {
  return (
    <ExtraGate model="sam">
      <TapStage photoId={photoId} onDone={onDone} />
    </ExtraGate>
  );
}
