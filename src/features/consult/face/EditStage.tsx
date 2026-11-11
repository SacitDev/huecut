/**
 * Move the lines' stage: the photo and its lines painted by the one painter in the crop the sheet opened
 * with, a dot on each part, and pointer dragging: press near a dot to pick its part, drag to move it. The arrow buttons
 * beside it are the alternative to dragging (WCAG 2.5.7), so the dots are not focusable.
 */
import { useEffect, useRef, type PointerEvent, type RefObject } from 'react';
import { fromExport, toExport, type ExportPlacement, type Point } from '../../../domain/geometry/coords.ts';
import { screenPainter, type PainterItem } from '../../../platform/render/painter.ts';
import { useWidth } from '../../../ui/useWidth.ts';
import { clampUnit, MOVE_SIZE, nearestPart, type PlacedPart } from './model.ts';
import { photoLookup } from './usePainting.ts';
import styles from './face.module.css';

/** A press counts for the dot within half a 44 px target, in CSS px. */
const PRESS_RADIUS_CSS_PX = 22;

/** Paints the finished drawing (no trace while moving) at the stage's width and the device's pixel ratio. */
function usePaint(canvasRef: RefObject<HTMLCanvasElement | null>, width: number, items: readonly PainterItem[], bitmap: ImageBitmap | null): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || width === 0) return;
    const dpr = window.devicePixelRatio;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round((canvas.width * MOVE_SIZE.heightPx) / MOVE_SIZE.widthPx);
    screenPainter(photoLookup(bitmap))(ctx, items, { scale: canvas.width / MOVE_SIZE.widthPx, dpr, elapsedMs: null });
  }, [canvasRef, width, items, bitmap]);
}

/** What the stage draws, which part is picked, and how a press or drag is reported. */
export interface EditStageProps {
  readonly items: readonly PainterItem[];
  readonly parts: readonly PlacedPart[];
  readonly selected: number;
  readonly placement: ExportPlacement;
  readonly bitmap: ImageBitmap | null;
  readonly label: string;
  readonly onSelect: (index: number) => void;
  readonly onMove: (to: Point) => void;
}

/** Where a pointer is on the stage, in card px, and how many card px one CSS px is there. */
function cardAt(event: PointerEvent<HTMLDivElement>): { readonly at: Point; readonly perCssPx: number } {
  const box = event.currentTarget.getBoundingClientRect();
  const perCssPx = MOVE_SIZE.widthPx / box.width;
  return { at: { x: (event.clientX - box.left) * perCssPx, y: (event.clientY - box.top) * perCssPx }, perCssPx };
}

/** The painted photo with a dot on each part, moved by the pointer. */
export function EditStage({ items, parts, selected, placement, bitmap, label, onSelect, onMove }: EditStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  usePaint(canvasRef, useWidth(stageRef), items, bitmap);
  const press = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const { at, perCssPx } = cardAt(event);
    const index = nearestPart(parts, at, placement, PRESS_RADIUS_CSS_PX * perCssPx);
    if (index === null) return;
    onSelect(index);
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) onMove(clampUnit(fromExport(cardAt(event).at, placement)));
  };
  const release = () => {
    dragging.current = false;
  };
  return (
    <div ref={stageRef} className={styles.stage} onPointerDown={press} onPointerMove={drag} onPointerUp={release} onPointerCancel={release}>
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={label} style={{ aspectRatio: `${String(MOVE_SIZE.widthPx)} / ${String(MOVE_SIZE.heightPx)}` }} />
      {parts.map((p, i) => {
        const c = toExport(p.at, placement);
        const position = { left: `${String((100 * c.x) / MOVE_SIZE.widthPx)}%`, top: `${String((100 * c.y) / MOVE_SIZE.heightPx)}%` };
        return <span key={p.part} className={styles.marker} data-selected={i === selected} style={position} aria-hidden="true" />;
      })}
    </div>
  );
}
