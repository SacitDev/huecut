/**
 * Photo sharpness: the variance of the Laplacian on the grey 256 px thumbnail. The resource
 * store keeps the score to order analysis; `measure()` compares it with the blur threshold in `quality.ts`.
 */
import type { RgbaImage } from './mask.ts';

/** Grey 0-255 with the Rec. 601 luma weights (the ones the blur rule of thumb was set with). */
export function greyOf(image: RgbaImage): Float32Array {
  const grey = new Float32Array(image.widthPx * image.heightPx);
  for (let i = 0; i < grey.length; i++) {
    grey[i] = 0.299 * (image.data[i * 4] ?? 0) + 0.587 * (image.data[i * 4 + 1] ?? 0) + 0.114 * (image.data[i * 4 + 2] ?? 0);
  }
  return grey;
}

/**
 * Population variance of the 4-neighbour Laplacian (0 1 0 / 1 -4 1 / 0 1 0) over the interior pixels; 0 for
 * an image too small to have an interior.
 */
export function laplacianVariance(grey: Float32Array, widthPx: number, heightPx: number): number {
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  for (let y = 1; y < heightPx - 1; y++) {
    for (let x = 1; x < widthPx - 1; x++) {
      const i = y * widthPx + x;
      const l = (grey[i - 1] ?? 0) + (grey[i + 1] ?? 0) + (grey[i - widthPx] ?? 0) + (grey[i + widthPx] ?? 0) - 4 * (grey[i] ?? 0);
      n++;
      sum += l;
      sumSq += l * l;
    }
  }
  return n === 0 ? 0 : sumSq / n - (sum / n) ** 2;
}

/** Sharpness score of an RGBA thumbnail. */
export const sharpness = (thumbnail: RgbaImage): number => laplacianVariance(greyOf(thumbnail), thumbnail.widthPx, thumbnail.heightPx);
