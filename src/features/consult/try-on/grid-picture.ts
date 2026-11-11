/**
 * Cutting a quick-grid picture into its tiles: the picture decoded once, its pixels split by
 * `splitGrid` with the layout the prompt asked for, and each tile saved as a JPEG in the resource store, in reading order.
 */
import { splitGrid, type GridLayout, type SplitProblem } from '../../../domain/board/grid-split.ts';
import type { Rect } from '../../../domain/geometry/coords.ts';
import type { PictureId } from '../../../domain/ids.ts';
import { JPEG_EXPORT } from '../../../domain/render-model/face-card.ts';
import { err, ok, type Result } from '../../../domain/result.ts';
import * as resources from '../../../platform/resources.ts';

/** Grid pictures from an AI chat are about 1024-1536 px; a larger one is cut at this size. */
const SPLIT_LONG_SIDE_PX = 2048;

export type CutProblem = SplitProblem | 'decode_failed';

function tileBlob(source: HTMLCanvasElement, r: Rect): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = r.width;
  canvas.height = r.height;
  canvas.getContext('2d')?.drawImage(source, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, JPEG_EXPORT.mime, JPEG_EXPORT.quality);
  });
}

/**
 * The grid picture's tiles as pictures in the resource store, in reading order (left to right, top to bottom). A cut the session's end overtook stores
 * no tile.
 */
export async function cutGrid(blob: Blob, layout: GridLayout): Promise<Result<PictureId[], CutProblem>> {
  const mine = resources.generation();
  const bitmap = await resources.displayBitmap(blob, SPLIT_LONG_SIDE_PX);
  if (!bitmap) return err('decode_failed');
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx?.drawImage(bitmap, 0, 0);
  bitmap.close();
  if (!ctx) return err('decode_failed');
  let pixels: ImageData;
  try {
    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // Out of memory on a very large picture: refused, so the person can act on it, not left on "cutting" for ever.
    return err('decode_failed');
  }
  const split = splitGrid({ widthPx: pixels.width, heightPx: pixels.height, data: pixels.data }, layout);
  if (!split.ok) return split;
  const tiles = await Promise.all(split.value.tiles.map((r) => tileBlob(canvas, r)));
  if (tiles.some((b) => b === null) || resources.generation() !== mine) return err('decode_failed');
  return ok(tiles.flatMap((b) => (b ? [resources.addPicture(b)] : [])));
}
