/**
 * "See it in 3D": the photo on its depth surface, turned and tilted a little by a
 * drag or by Turn left, Turn right, Tilt up, Tilt down and Reset; no idle motion; "for looking, not for measuring". Three.js loads with the
 * viewer, and leaving this view disposes every GPU resource. Offered on computers only, through `ExtraGate`.
 */
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { PhotoId } from '../../../domain/ids.ts';
import { depthLayers } from '../../../platform/hair-tools.ts';
import type { Viewer3d } from '../../../platform/render/viewer3d.ts';
import * as resources from '../../../platform/resources.ts';
import { extrasCopy as c } from '../../../strings/en-extras.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import { ExtraGate } from './ExtraGate.tsx';
import { clampTurn, TILT_LIMIT_DEG, TILT_STEP_DEG, TURN_LIMIT_DEG, TURN_STEP_DEG } from './model.ts';
import { cx } from '../../../ui/cx.ts';
import styles from './extras.module.css';

const x = c.threeD;
/** The photo's long side on the 3D texture. */
const TEXTURE_LONG_SIDE_PX = 1024;

type Status = 'busy' | 'ready' | 'failed' | 'lost';

/** Measures the depth, loads Three.js and makes the viewer inside `host`; null when any step fails. */
async function makeViewer(host: HTMLElement, photoId: PhotoId, signal: AbortSignal, onContext: (state: 'lost' | 'ready') => void): Promise<Viewer3d | null> {
  const stored = resources.photo(photoId);
  const depth = await depthLayers(photoId, signal);
  if (!stored || !depth.ok) return null;
  let photo: ImageBitmap | null = null;
  try {
    const three = await import('../../../platform/render/viewer3d.ts');
    photo = await resources.displayBitmap(stored.blob, TEXTURE_LONG_SIDE_PX);
    return photo && !signal.aborted ? three.createViewer3d(host, { photo, depth: depth.value, foreground: depth.value.foreground ?? null, onContext }) : null;
  } catch {
    return null;
  } finally {
    photo?.close();
  }
}

/** The viewer for this photo while the view is open. */
function useViewer(host: RefObject<HTMLDivElement | null>, photoId: PhotoId) {
  const [status, setStatus] = useState<Status>('busy');
  const viewer = useRef<Viewer3d | null>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const stop = new AbortController();
    void makeViewer(element, photoId, stop.signal, setStatus).then((made) => {
      if (stop.signal.aborted) {
        made?.dispose();
        return;
      }
      viewer.current = made;
      setStatus(made ? 'ready' : 'failed');
    });
    return () => {
      stop.abort();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [host, photoId]);
  return { status, viewer };
}

function Stage({ photoId }: { readonly photoId: PhotoId }) {
  const host = useRef<HTMLDivElement>(null);
  const { status, viewer } = useViewer(host, photoId);
  const [pose, setPose] = useState({ yaw: 0, tilt: 0 });
  const drag = useRef<{ readonly x: number; readonly y: number; readonly yaw: number; readonly tilt: number; readonly width: number; readonly height: number } | null>(null);
  const ready = status === 'ready';
  const moveTo = (yaw: number, tilt: number, smooth: boolean) => {
    const next = { yaw: clampTurn(yaw, TURN_LIMIT_DEG), tilt: clampTurn(tilt, TILT_LIMIT_DEG) };
    setPose(next);
    viewer.current?.turn(next.yaw, next.tilt, smooth);
  };
  /** A button wins over a drag still held, whose next move would otherwise pull the view straight back. */
  const press = (yaw: number, tilt: number) => {
    drag.current = null;
    moveTo(yaw, tilt, true);
  };
  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !ready) return;
    drag.current = { x: event.clientX, y: event.clientY, ...pose, width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) moveTo(d.yaw + ((event.clientX - d.x) / d.width) * 2 * TURN_LIMIT_DEG, d.tilt - ((event.clientY - d.y) / d.height) * 2 * TILT_LIMIT_DEG, false);
  };
  const message = status === 'busy' ? x.busy : status === 'failed' ? x.failed : status === 'lost' ? x.lost : x.facing(pose.yaw, pose.tilt);
  return (
    <div className={styles.stack}>
      <div ref={host} className={styles.viewer} role="img" aria-label={x.stage} hidden={status === 'failed'} onPointerDown={onDown} onPointerMove={onMove} onLostPointerCapture={() => { drag.current = null; }} />
      {status === 'busy' && <Progress label={x.busy} value={null} />}
      {status !== 'failed' && <p>{faceCopy.extra.threeDName}</p>}
      {status !== 'failed' && <div className={styles.chips} role="group" aria-label={x.controls}>
        <Button variant="secondary" unavailable={!ready || pose.yaw <= -TURN_LIMIT_DEG} onClick={() => { press(pose.yaw - TURN_STEP_DEG, pose.tilt); }}>{x.left}</Button>
        <Button variant="secondary" unavailable={!ready || pose.yaw >= TURN_LIMIT_DEG} onClick={() => { press(pose.yaw + TURN_STEP_DEG, pose.tilt); }}>{x.right}</Button>
        <Button variant="secondary" unavailable={!ready || pose.tilt >= TILT_LIMIT_DEG} onClick={() => { press(pose.yaw, pose.tilt + TILT_STEP_DEG); }}>{x.up}</Button>
        <Button variant="secondary" unavailable={!ready || pose.tilt <= -TILT_LIMIT_DEG} onClick={() => { press(pose.yaw, pose.tilt - TILT_STEP_DEG); }}>{x.down}</Button>
        <Button variant="text" unavailable={!ready} onClick={() => { press(0, 0); }}>{x.reset}</Button>
      </div>}
      {/* While busy, the moving line above says it on screen; the region still says it aloud. */}
      <LiveRegion message={message} className={status === 'busy' ? undefined : cx(styles.small)} />
    </div>
  );
}

export function ThreeDView({ photoId }: { readonly photoId: PhotoId }) {
  return (
    <ExtraGate model="depth">
      <Stage key={photoId} photoId={photoId} />
    </ExtraGate>
  );
}
