/**
 * The one Canvas 2D painter: draws the render models' items at screen or export size from the same items, in the theme's custom
 * properties read at paint time, with two-tone lines that the mirror trace draws by `lineDashOffset`, and text set by our own line
 * breaker (paint-text.ts).
 */
import { CARD_PX, toExport, type ExportPlacement, type Point, type Rect, type Size } from '../../domain/geometry/coords.ts';
import type { PictureId } from '../../domain/ids.ts';
import type { FaceCardItem } from '../../domain/render-model/face-card.ts';
import { drawTag, drawText, LABEL_TAG, TAG, type Ctx2D, type Pen, type TextItem } from './paint-text.ts';
import { progressAt, readTokens, traceSchedule, type PainterTokens, type TraceSchedule } from './tokens.ts';

export { fontsFor, loadFonts, type Ctx2D, type PainterText, type TextRole } from './paint-text.ts';
export { readTokens, type PainterTokens, type TraceTiming } from './tokens.ts';

/** What a picture shows: the person's photo, a library picture by its key, or an AI picture from a slot. */
export type PictureRef =
  | { readonly source: 'photo' }
  | { readonly source: 'library'; readonly key: string }
  | { readonly source: 'ai'; readonly pictureId: PictureId; readonly hairOnly: boolean };
/** A decoded picture and its size; the caller decodes and closes it (the resource store). */
export interface PaintImage {
  readonly source: CanvasImageSource;
  readonly size: Size;
}
export type PictureLookup = (ref: PictureRef) => PaintImage | null;
/** The face card's items, plus text in columns and pictures drawn whole (sheet, board). Card px (2160 x 2700). */
export type PainterItem =
  | Exclude<FaceCardItem, { readonly type: 'text' }>
  | TextItem
  | { readonly type: 'picture'; readonly ref: PictureRef | null; readonly rect: Rect; readonly tag?: string };

/** Core width, and casing width on each side of it, in device px. */
export interface LineWeights {
  readonly core: number;
  readonly casing: number;
}
/** On screen, in CSS px (times the device pixel ratio when painting). */
export const SCREEN_WEIGHTS: LineWeights = { core: 1.25, casing: 0.75 };
/** On the 2160 x 2700 export: thin enough for the card's 720 px photo. */
export const EXPORT_WEIGHTS: LineWeights = { core: 3, casing: 1 };

export interface PaintOptions {
  readonly tokens: PainterTokens;
  /** Device px per card px: 1 on the export. */
  readonly scale: number;
  readonly weights: LineWeights;
  /** Time since the trace started; null paints the finished drawing. */
  readonly elapsedMs: number | null;
  readonly pictures?: PictureLookup | undefined;
}
export interface PaintResult {
  /** False while the trace still has frames to draw. */
  readonly done: boolean;
  /** The trace's length; 0 under reduced motion. */
  readonly totalMs: number;
}

const PICTURE_RADIUS_PX = 24;
const ARCH_FOOT_PX = 48;

interface State extends Pen {
  /** Line weights in card px. */
  readonly core: number;
  readonly casing: number;
  readonly schedule: TraceSchedule;
  readonly at: number | null;
  readonly pictures: PictureLookup | undefined;
}
type Of<T extends PainterItem['type']> = Extract<PainterItem, { readonly type: T }>;

const segments = (points: readonly Point[], closed: boolean): (readonly [Point, Point])[] =>
  (closed ? [...points.slice(1), ...points.slice(0, 1)] : points.slice(1)).map((b, i) => [points[i] ?? b, b] as const);

/** A polyline's length, with the closing segment for a closed line: the dash length of the trace. */
export const pathLength = (points: readonly Point[], closed: boolean): number =>
  segments(points, closed).reduce((sum, [a, b]) => sum + Math.hypot(b.x - a.x, b.y - a.y), 0);

/** `image` scaled to fit inside `rect`, centred: pictures are drawn whole, never cropped. */
export function containRect(image: Size, rect: Rect): Rect {
  const k = Math.min(rect.width / image.widthPx, rect.height / image.heightPx);
  const [width, height] = [image.widthPx * k, image.heightPx * k];
  return { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
}

/**
 * The photo's share of a crop: the source rectangle in image px and where it lands on the card. A crop reaching past
 * the photo keeps its scale, and the neutral ground drawn first shows around it. Null when the crop misses the photo.
 */
export function photoRects(placement: ExportPlacement, image: Size): { readonly source: Rect; readonly target: Rect } | null {
  const { crop } = placement;
  const [x0, y0] = [Math.max(0, crop.x), Math.max(0, crop.y)];
  const [x1, y1] = [Math.min(1, crop.x + crop.width), Math.min(1, crop.y + crop.height)];
  if (x1 <= x0 || y1 <= y0) return null;
  const [a, b] = [toExport({ x: x0, y: y0 }, placement), toExport({ x: x1, y: y1 }, placement)];
  const source = { x: x0 * image.widthPx, y: y0 * image.heightPx, width: (x1 - x0) * image.widthPx, height: (y1 - y0) * image.heightPx };
  return { source, target: { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y } };
}

function polyline(points: readonly Point[], closed: boolean): Path2D {
  const path = new Path2D();
  points.forEach((p, i) => {
    if (i === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
  });
  if (closed) path.closePath();
  return path;
}

/** A light core over a dark casing, like a road on a map; below 1, `progress` draws the first part by the dash offset. */
function strokeTwoTone(s: State, path: Path2D, length: number, progress: number): void {
  if (progress <= 0) return;
  const { ctx } = s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(progress < 1 ? [length, length + 1] : []);
  ctx.lineDashOffset = progress < 1 ? length * (1 - progress) : 0;
  ctx.strokeStyle = s.tokens.colours.casing;
  ctx.lineWidth = s.core + 2 * s.casing;
  ctx.stroke(path);
  ctx.strokeStyle = s.tokens.colours.core;
  ctx.lineWidth = s.core;
  ctx.stroke(path);
  ctx.setLineDash([]);
}

function drawLine(s: State, item: Of<'line'>): void {
  const progress = progressAt(s.schedule.lines.get(item.id), s.at);
  strokeTwoTone(s, polyline(item.points, item.closed), pathLength(item.points, item.closed), progress);
}

/** The thirds as quiet short ticks, appearing with the labels. */
function drawTick(s: State, item: Of<'tick'>): void {
  const pin = progressAt(s.schedule.pin, s.at);
  const half = item.lengthPx / 2;
  s.ctx.globalAlpha = pin;
  const ends = [{ x: item.at.x - half, y: item.at.y }, { x: item.at.x + half, y: item.at.y }];
  strokeTwoTone(s, polyline(ends, false), item.lengthPx, pin > 0 ? 1 : 0);
  s.ctx.globalAlpha = 1;
}

/** A label beside the face with its leader to its line; it pins after the lines (opacity, scale 0.96 to 1). */
function drawLabel(s: State, item: Of<'label'>): void {
  const pin = progressAt(s.schedule.pin, s.at);
  if (pin <= 0) return;
  const { ctx } = s;
  const eased = 1 - (1 - pin) ** 3;
  const k = s.tokens.pinScale + (1 - s.tokens.pinScale) * eased;
  const { anchor, leaderTo } = item;
  ctx.save();
  ctx.globalAlpha = eased;
  strokeTwoTone(s, polyline([anchor, leaderTo], false), Math.hypot(leaderTo.x - anchor.x, leaderTo.y - anchor.y), 1);
  ctx.translate(anchor.x, anchor.y);
  ctx.scale(k, k);
  ctx.translate(-anchor.x, -anchor.y);
  const place = { left: item.align === 'left' ? anchor.x : (w: number) => anchor.x - w, top: (h: number) => anchor.y - h / 2 };
  drawTag(s, item.text, place, item.maxWidthPx, LABEL_TAG);
  ctx.restore();
}

/** The mirror arch: a semicircle crown and rounded feet, a decoration behind the picture, never a clip. */
function drawArch(s: State, { x, y, width, height }: Rect): void {
  const r = width / 2;
  const f = Math.min(ARCH_FOOT_PX, r);
  const path = new Path2D();
  path.moveTo(x, y + r);
  path.arc(x + r, y + r, r, Math.PI, 0);
  path.lineTo(x + width, y + height - f);
  path.arcTo(x + width, y + height, x + width - f, y + height, f);
  path.lineTo(x + f, y + height);
  path.arcTo(x, y + height, x, y + height - f, f);
  path.closePath();
  s.ctx.fillStyle = s.tokens.colours.rose;
  s.ctx.fill(path);
}

function drawPhoto(s: State, placement: ExportPlacement): void {
  const image = s.pictures?.({ source: 'photo' }) ?? null;
  const r = image ? photoRects(placement, image.size) : null;
  if (!image || !r) return;
  const { source: a, target: b } = r;
  s.ctx.drawImage(image.source, a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height);
}

/** A picture drawn whole on the placeholder ground, with its tag (the AI label) inside its foot. */
function drawPicture(s: State, item: Of<'picture'>): void {
  const { ctx } = s;
  const r = item.rect;
  ctx.fillStyle = s.tokens.colours.placeholder;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.width, r.height, PICTURE_RADIUS_PX);
  ctx.fill();
  const image = item.ref ? (s.pictures?.(item.ref) ?? null) : null;
  if (image) {
    const d = containRect(image.size, r);
    ctx.drawImage(image.source, d.x, d.y, d.width, d.height);
  }
  if (item.tag !== undefined) {
    const place = { left: r.x + TAG.inset, top: (h: number) => r.y + r.height - TAG.inset - h };
    drawTag(s, item.tag, place, r.width - 2 * TAG.inset);
  }
}

const GROUND_TONES = { page: 'ground', neutral: 'neutral', panel: 'primary' } as const;

function drawItem(s: State, item: PainterItem): void {
  switch (item.type) {
    case 'ground':
      s.ctx.fillStyle = s.tokens.colours[GROUND_TONES[item.tone]];
      s.ctx.fillRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
      return;
    case 'arch':
      drawArch(s, item.rect);
      return;
    case 'photo':
      drawPhoto(s, item.placement);
      return;
    case 'picture':
      drawPicture(s, item);
      return;
    case 'line':
      drawLine(s, item);
      return;
    case 'tick':
      drawTick(s, item);
      return;
    case 'label':
      drawLabel(s, item);
      return;
    case 'text':
      drawText(s, item);
  }
}

/** Paints the items over the whole card at `scale`, at the trace's `elapsedMs` (null: finished). */
export function paint(ctx: Ctx2D, items: readonly PainterItem[], o: PaintOptions): PaintResult {
  const schedule = traceSchedule(items.flatMap((i) => (i.type === 'line' ? [i.id] : [])), o.tokens.timing);
  const [core, casing] = [o.weights.core / o.scale, o.weights.casing / o.scale];
  const s: State = { ctx, tokens: o.tokens, core, casing, schedule, at: o.elapsedMs, pictures: o.pictures };
  ctx.save();
  ctx.setTransform(o.scale, 0, 0, o.scale, 0, 0);
  ctx.clearRect(0, 0, CARD_PX.widthPx, CARD_PX.heightPx);
  for (const item of items) drawItem(s, item);
  ctx.restore();
  return { done: o.elapsedMs === null || o.elapsedMs >= schedule.totalMs, totalMs: schedule.totalMs };
}

/** The frame `PainterCanvas` passes on each paint. */
export interface ScreenFrame {
  readonly scale: number;
  readonly dpr: number;
  readonly elapsedMs: number | null;
}
/** A `paint` for `PainterCanvas`: the tokens are read from the canvas on every frame, so the drawing follows the theme. */
export const screenPainter =
  (pictures?: PictureLookup) =>
  (ctx: CanvasRenderingContext2D, items: readonly PainterItem[], f: ScreenFrame): PaintResult =>
    paint(ctx, items, {
      tokens: readTokens(ctx.canvas),
      scale: f.scale,
      weights: { core: SCREEN_WEIGHTS.core * f.dpr, casing: SCREEN_WEIGHTS.casing * f.dpr },
      elapsedMs: f.elapsedMs,
      pictures,
    });
