/**
 * Quick-grid split: the app knows the rows x columns it asked for, so it trims
 * uniform borders from the grid picture and cuts equal tiles, moving a cut onto a thin uniform gap where one shows.
 * Pure, on RGBA pixels; the person then confirms which idea each tile shows, and "Tiles look wrong?" is the way out.
 */
import type { Rect } from '../geometry/coords.ts';
import type { RgbaImage } from '../measure/mask.ts';
import { err, ok, type Result } from '../result.ts';

/** A pixel belongs to a uniform line when no channel is further than this from the line's mean (0-255; JPEG noise). */
export const COLOUR_TOLERANCE = 20;
/** A line is uniform when at least this share of its pixels is within the tolerance (allows a few stray pixels). */
export const UNIFORM_SHARE = 0.98;
/** Borders are thin frames: at most this share of the width or height is trimmed from each side. */
export const MAX_BORDER_SHARE = 0.08;
/** A gap between tiles is looked for within this share of the content size either side of the equal cut. */
export const GAP_SEARCH_SHARE = 0.03;
/** Below this a tile is not a picture worth confirming. */
export const MIN_TILE_PX = 16;

export interface GridLayout { readonly rows: number; readonly columns: number }
/** `content`: the picture without its border; `tiles`: px rects in reading order (left to right, top to bottom). */
export interface GridSplit { readonly content: Rect; readonly tiles: readonly Rect[] }
export type SplitProblem = 'bad_layout' | 'too_small';

type Rgb = readonly [number, number, number];
type Axis = 'row' | 'column';
interface Line { readonly uniform: boolean; readonly mean: Rgb }

/** Byte offset of pixel `k` along line `at` of the axis. */
const offset = (img: RgbaImage, axis: Axis, at: number, k: number): number => (axis === 'row' ? at * img.widthPx + k : k * img.widthPx + at) * 4;

/** One row (`at` = y) or column (`at` = x), from `from` to `to` (exclusive) along it. */
function lineAt(img: RgbaImage, axis: Axis, at: number, from: number, to: number): Line {
  const d = img.data;
  const sum = [0, 0, 0];
  for (let k = from; k < to; k++) {
    const i = offset(img, axis, at, k);
    for (let c = 0; c < 3; c++) sum[c] = (sum[c] ?? 0) + (d[i + c] ?? 0);
  }
  const n = Math.max(1, to - from);
  const mean: Rgb = [(sum[0] ?? 0) / n, (sum[1] ?? 0) / n, (sum[2] ?? 0) / n];
  let close = 0;
  for (let k = from; k < to; k++) {
    const i = offset(img, axis, at, k);
    if (mean.every((m, c) => Math.abs((d[i + c] ?? 0) - m) <= COLOUR_TOLERANCE)) close++;
  }
  return { uniform: close >= UNIFORM_SHARE * n, mean };
}

const sameColour = (a: Rgb, b: Rgb): boolean => a.every((v, c) => Math.abs(v - (b[c] ?? 0)) <= COLOUR_TOLERANCE);

/** How many lines from one edge, stepping inwards, are uniform in one colour (at most `limit`). */
function edgeRun(img: RgbaImage, axis: Axis, start: number, step: 1 | -1, limit: number, span: readonly [number, number]): number {
  let first: Rgb | null = null;
  let run = 0;
  while (run < limit) {
    const l = lineAt(img, axis, start + run * step, span[0], span[1]);
    if (!l.uniform || (first !== null && !sameColour(first, l.mean))) break;
    first ??= l.mean;
    run++;
  }
  return run;
}

/**
 * The picture without its border. Each axis trims the same amount from both sides (the smaller of the two runs): a frame
 * is drawn evenly, while a plain background reaching one edge would otherwise shift every cut.
 */
function trim(img: RgbaImage): Rect {
  const { widthPx: w, heightPx: h } = img;
  const sideX = Math.min(edgeRun(img, 'column', 0, 1, Math.floor(w * MAX_BORDER_SHARE), [0, h]), edgeRun(img, 'column', w - 1, -1, Math.floor(w * MAX_BORDER_SHARE), [0, h]));
  const span: readonly [number, number] = [sideX, w - sideX];
  const sideY = Math.min(edgeRun(img, 'row', 0, 1, Math.floor(h * MAX_BORDER_SHARE), span), edgeRun(img, 'row', h - 1, -1, Math.floor(h * MAX_BORDER_SHARE), span));
  return { x: sideX, y: sideY, width: w - 2 * sideX, height: h - 2 * sideY };
}

/**
 * The cut between two tiles near `expected`: a run of uniform lines (across the whole content) that starts and ends
 * inside the search window is a gap, and both tiles stop at its edges. A run reaching the window's edge is plain
 * background spanning the seam, not a gap, so the cut stays at the equal position.
 */
function cutAt(img: RgbaImage, axis: Axis, expected: number, window: number, span: readonly [number, number]): readonly [number, number] {
  const lo = Math.round(expected) - window;
  const flags = Array.from({ length: 2 * window + 1 }, (_, k) => lineAt(img, axis, lo + k, span[0], span[1]).uniform);
  let best: readonly [number, number] | null = null;
  for (let k = 0; k < flags.length; k++) {
    if (!flags[k] || flags[k - 1]) continue;
    let end = k;
    while (flags[end + 1]) end++;
    const inside = k > 0 && end < flags.length - 1;
    const nearer = best === null || Math.abs((k + end) / 2 + lo - expected) < Math.abs((best[0] + best[1] - 1) / 2 - expected);
    if (inside && nearer) best = [lo + k, lo + end + 1];
  }
  return best ?? [Math.round(expected), Math.round(expected)];
}

/** Tile edges along one axis: `[start, end)` per tile, with each inner cut moved onto a gap where one shows. */
function edges(img: RgbaImage, axis: Axis, start: number, size: number, count: number, span: readonly [number, number]): (readonly [number, number])[] {
  const window = Math.max(2, Math.round(size * GAP_SEARCH_SHARE));
  const cuts = Array.from({ length: count - 1 }, (_, k) => cutAt(img, axis, start + ((k + 1) * size) / count, window, span));
  return Array.from({ length: count }, (_, k) => [k === 0 ? start : (cuts[k - 1]?.[1] ?? start), k === count - 1 ? start + size : (cuts[k]?.[0] ?? start + size)] as const);
}

/** Splits a grid picture into `rows x columns` tiles in reading order. */
export function splitGrid(img: RgbaImage, layout: GridLayout): Result<GridSplit, SplitProblem> {
  const { rows, columns } = layout;
  if (![rows, columns].every((n) => Number.isInteger(n) && n >= 1)) return err('bad_layout');
  if (img.widthPx < columns * MIN_TILE_PX || img.heightPx < rows * MIN_TILE_PX || img.data.length < img.widthPx * img.heightPx * 4) return err('too_small');
  const content = trim(img);
  const xs = edges(img, 'column', content.x, content.width, columns, [content.y, content.y + content.height]);
  const ys = edges(img, 'row', content.y, content.height, rows, [content.x, content.x + content.width]);
  const tiles = ys.flatMap(([y0, y1]) => xs.map(([x0, x1]) => ({ x: x0, y: y0, width: x1 - x0, height: y1 - y0 })));
  if (tiles.some((t) => t.width < MIN_TILE_PX || t.height < MIN_TILE_PX)) return err('too_small');
  return ok({ content, tiles });
}
