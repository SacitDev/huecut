/**
 * The painter's canvas: prop-driven and sized to its container, it paints its items through the `paint` it is given and plays the
 * mirror trace once (any tap or key finishes it; under reduced motion the draw tokens are 0, so it is complete at once). The canvas
 * is `role="img"`, named by one sentence.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { cx } from '../cx.ts';
import { useWidth } from '../useWidth.ts';
import styles from './PainterCanvas.module.css';

/** What the canvas passes to `paint` on each frame. */
export interface PaintFrame {
  /** Device px per item px. */
  readonly scale: number;
  /** Device px per CSS px. */
  readonly dpr: number;
  /** Time since the trace started; null for the finished drawing. */
  readonly elapsedMs: number | null;
}
export interface PaintOutcome {
  readonly done: boolean;
}
export type Paint<Item> = (ctx: CanvasRenderingContext2D, items: readonly Item[], frame: PaintFrame) => PaintOutcome;

export interface PainterCanvasProps<Item> {
  readonly items: readonly Item[];
  /** The items' own size in item px; the canvas keeps this shape at the container's width. */
  readonly size: { readonly widthPx: number; readonly heightPx: number };
  readonly paint: Paint<Item>;
  /** Loads what painting needs first (the fonts, per weight). Keep it stable; painting goes ahead if it fails. */
  readonly prepare?: () => Promise<unknown>;
  /** The canvas's accessible name: one sentence saying what it shows. */
  readonly label: string;
  /** Play the trace once when ready; false shows the finished drawing. */
  readonly playOnMount?: boolean;
  readonly className?: string | undefined;
}

/** Changes when the theme or the motion setting may have changed, so the painter reads its tokens again. */
function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => {
      setVersion((v) => v + 1);
    };
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
    const queries = ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'].map((q) => window.matchMedia(q));
    for (const q of queries) q.addEventListener('change', bump);
    return () => {
      observer.disconnect();
      for (const q of queries) q.removeEventListener('change', bump);
    };
  }, []);
  return version;
}

function useReady(prepare: (() => Promise<unknown>) | undefined): boolean {
  const [ready, setReady] = useState(prepare === undefined);
  useEffect(() => {
    if (!prepare) return;
    let live = true;
    void prepare()
      .catch((): undefined => undefined)
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [prepare]);
  return ready;
}

/** While the trace plays, any tap or key anywhere finishes it. */
function useSkip(playing: boolean, finish: () => void): void {
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    if (!playing) return;
    const skip = () => {
      finishRef.current();
    };
    for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, skip);
    return () => {
      for (const type of ['pointerdown', 'keydown'] as const) window.removeEventListener(type, skip);
    };
  }, [playing]);
}

/** Paints on every change and runs the trace frame by frame; true while it plays. */
function usePainting<Item>(canvasRef: RefObject<HTMLCanvasElement | null>, props: PainterCanvasProps<Item>, width: number): boolean {
  const { items, size, paint, prepare, playOnMount = true } = props;
  const ready = useReady(prepare);
  const theme = useThemeVersion();
  const [playing, setPlaying] = useState(playOnMount);
  const start = useRef<number | null>(null);
  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  });
  useSkip(playing, () => {
    start.current = null;
    setPlaying(false);
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !ready || width === 0) return;
    let frame = 0;
    const draw = (now: number) => {
      if (playing) start.current ??= now;
      const elapsedMs = playing ? now - (start.current ?? now) : null;
      const outcome = paintRef.current(ctx, items, { scale: canvas.width / size.widthPx, dpr: canvas.width / width, elapsedMs });
      if (playing && !outcome.done) frame = requestAnimationFrame(draw);
      else if (playing) {
        start.current = null;
        setPlaying(false);
      }
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [canvasRef, items, size.widthPx, width, ready, theme, playing]);
  return playing;
}

/** The canvas at its container's width, in the items' shape. */
export function PainterCanvas<Item>(props: PainterCanvasProps<Item>) {
  const { size, label, className } = props;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = useWidth(stageRef);
  const playing = usePainting(canvasRef, props, width);
  const deviceWidth = Math.round(width * window.devicePixelRatio);
  return (
    <div ref={stageRef} className={cx(styles.stage, className)} data-trace={playing ? 'playing' : 'done'}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={label}
        width={deviceWidth}
        height={Math.round((deviceWidth * size.heightPx) / size.widthPx)}
        style={{ aspectRatio: `${String(size.widthPx)} / ${String(size.heightPx)}` }}
      />
    </div>
  );
}
