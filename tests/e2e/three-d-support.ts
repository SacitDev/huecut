/**
 * Support for three-d.spec.ts: the way to the 3D view on a real fictional photo, what the page records, and how much of a
 * stage picture is whole. A pixel whose colour changes with the theme is clear, because only the stage behind the person does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { instrument } from './extras-support.ts';
import { addPhotos, ANALYSIS_TIMEOUT_MS, button, drawing, heading, openPhoto } from './failure/support.ts';
import { expect } from './guard.ts';

const FACES = join(import.meta.dirname, '..', 'fixtures', 'faces');
/** A fictional photo by file name. */
export const photoOf = (name: string): string => join(FACES, `${name}.jpg`);
/** What the status says at rest. */
export const FRONT = 'Facing front.';

declare global {
  interface Window {
    /** How many surfaces the page has drawn. */
    draws: number;
  }
}

/** Counts the draw calls, the one sure sign that the picture changed. */
const countDraws = (): void => {
  window.draws = 0;
  const proto = WebGL2RenderingContext.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
  const real = proto.drawElements;
  proto.drawElements = function counted(this: unknown, ...args: unknown[]) {
    window.draws++;
    return real?.apply(this, args);
  };
};

/** The 3D view's sheet. */
export const sheetOf = (page: Page): Locator => page.getByRole('dialog', { name: 'See it in 3D' });
/** The picture's stage, by its text alternative. */
export const stageOf = (page: Page): Locator => sheetOf(page).getByRole('img', { name: 'Your photo in 3D' });
/** The status line, when it says `text`. */
export const said = (page: Page, text: string): Locator => sheetOf(page).getByRole('status').filter({ hasText: text });
/** A button in the sheet, by its exact name. */
export const control = (page: Page, name: string): Locator => button(sheetOf(page), name);
/** The menu's button that opens the view. */
export const opener = (page: Page): Locator => page.getByRole('button', { name: 'See it in 3D' });
/** Two frames: whatever a press asked for has been drawn. */
export const settle = (page: Page): Promise<unknown> => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

/** The face card's "More with your photo" list, scrolled into view. */
export async function menuFromLines(page: Page): Promise<void> {
  await expect(heading(page)).toHaveText('Your face card');
  await page.getByRole('heading', { name: 'More with your photo' }).scrollIntoViewIfNeeded();
}

/** Photo → the face card, with "More with your photo" in view; `photo` is a path or a file made in the test. */
export async function toMenu(page: Page, photo: Parameters<typeof addPhotos>[1]): Promise<void> {
  await page.addInitScript(instrument);
  await page.addInitScript(countDraws);
  await openPhoto(page);
  await addPhotos(page, photo);
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  await menuFromLines(page);
}

/** Opens the view and waits until the picture is ready. */
export async function openAndWait(page: Page): Promise<void> {
  await opener(page).click();
  await expect(said(page, FRONT)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
}

/** Closes the sheet by its Close button. */
export async function closeSheet(page: Page): Promise<void> {
  await sheetOf(page).getByRole('button', { name: 'Close' }).click();
  await expect(sheetOf(page)).toBeHidden();
}

/** Presses a control `times` times. */
export async function press(page: Page, name: string, times: number): Promise<void> {
  for (let i = 0; i < times; i++) await control(page, name).click();
}

/** The middle of the stage, and its size. */
export async function stageMiddle(page: Page): Promise<{ readonly x: number; readonly y: number; readonly width: number; readonly height: number }> {
  const box = await stageOf(page).boundingBox();
  if (!box) throw new Error('the stage is not on the page');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height };
}

/** Refuses WebGL on the page: on every canvas, or only on one in the document, which the start-up check's canvas is not. */
export async function refuseWebgl(page: Page, which: 'every' | 'connected'): Promise<void> {
  await page.addInitScript((mode) => {
    const real = Reflect.get(HTMLCanvasElement.prototype, 'getContext') as (this: HTMLCanvasElement, id: string, o?: unknown) => unknown;
    Reflect.set(HTMLCanvasElement.prototype, 'getContext', function refused(this: HTMLCanvasElement, id: string, o?: unknown) {
      return id.startsWith('webgl') && (mode === 'every' || this.isConnected) ? null : real.call(this, id, o);
    });
  }, which);
}

/** Runs `check` in a page of its own, with no CSP, on pictures passed as base64. */
async function inBlankPage<T, A>(context: BrowserContext, check: (arg: A) => Promise<T>, arg: A): Promise<T> {
  const blank = await context.newPage();
  try {
    return await blank.evaluate(check as (arg: unknown) => Promise<T>, arg);
  } finally {
    await blank.close();
  }
}

interface Grid {
  readonly w: number;
  readonly h: number;
  /** 1 for a clear pixel, row by row. */
  readonly clear: number[];
}

/** Which pixels of the stage are clear, from the same pose in the light and the dark theme. */
const clearPixels = (context: BrowserContext, light: Buffer, dark: Buffer): Promise<Grid> =>
  inBlankPage(
    context,
    async ([a, b]: readonly [string, string]) => {
      const load = async (base64: string): Promise<ImageData> => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const painter = canvas.getContext('2d');
        painter?.drawImage(image, 0, 0);
        return painter?.getImageData(0, 0, canvas.width, canvas.height) ?? new ImageData(1, 1);
      };
      const [x, y] = await Promise.all([load(a), load(b)]);
      const apart = (i: number, c: number): number => Math.abs((x.data[i * 4 + c] ?? 0) - (y.data[i * 4 + c] ?? 0));
      return { w: x.width, h: x.height, clear: Array.from({ length: x.width * x.height }, (_, i) => (apart(i, 0) + apart(i, 1) + apart(i, 2) > 45 ? 1 : 0)) };
    },
    [light.toString('base64'), dark.toString('base64')] as const,
  );

/** Marks in `seen` the four-way region of cells equal to `value` around `start`, and returns its size. */
function flood({ w, h, clear }: Grid, start: number, value: number, seen: Uint8Array): number {
  const stack = [start];
  seen[start] = 1;
  let size = 0;
  for (let i = stack.pop(); i !== undefined; i = stack.pop()) {
    size++;
    for (const n of [i % w > 0 ? i - 1 : -1, i % w < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (n < 0 || n >= w * h || seen[n] || clear[n] !== value) continue;
      seen[n] = 1;
      stack.push(n);
    }
  }
  return size;
}

/** Clear pixels the outside of the stage cannot reach: holes in the person. */
function holesIn(grid: Grid): number {
  const { w, h, clear } = grid;
  const outside = new Uint8Array(w * h);
  clear.forEach((c, i) => {
    if (c && !outside[i] && (i < w || i >= w * (h - 1) || i % w === 0 || i % w === w - 1)) flood(grid, i, 1, outside);
  });
  return clear.filter((c, i) => c && !outside[i]).length;
}

/** Solid pixels cut off from the person: torn fragments. */
function looseIn(grid: Grid): number {
  const seen = new Uint8Array(grid.w * grid.h);
  const sizes: number[] = [];
  grid.clear.forEach((c, i) => {
    if (!c && !seen[i]) sizes.push(flood(grid, i, 0, seen));
  });
  return sizes.reduce((sum, s) => sum + s, 0) - Math.max(0, ...sizes);
}

/** Rows up from the stage's bottom, and pixels in from its sides: clear of its rounded and anti-aliased rim. */
const RIM_PX = 3;
const CORNER_PX = 24;

/** How many rows up a solid pixel means a body cut off in the view; a shoulder beside the clear pixel never overhangs it that closely. */
const CUT_ROWS = 12;

/** The share of the stage's lowest row that is clear with the person right above it: an end of the body or of the photo showing, where only clear beside the person is honest framing. */
function cutIn({ w, h, clear }: Grid): number {
  const row = h - RIM_PX;
  // No body at all in the lowest row: the person ends somewhere above it, in full view.
  if (!clear.slice(row * w + CORNER_PX, (row + 1) * w - CORNER_PX).includes(0)) return 1;
  let cut = 0;
  for (let x = CORNER_PX; x < w - CORNER_PX; x++) {
    if (clear[row * w + x] !== 1) continue;
    for (let y = row - 1; y >= Math.max(0, row - CUT_ROWS); y--) {
      if (clear[y * w + x] === 0) { cut++; break; }
    }
  }
  return cut / (w - 2 * CORNER_PX);
}

/** How whole the picture is, from the stage in the light and in the dark theme. */
export async function coverage(context: BrowserContext, light: Buffer, dark: Buffer): Promise<{ readonly holes: number; readonly loose: number; readonly cut: number }> {
  const grid = await clearPixels(context, light, dark);
  return { holes: holesIn(grid), loose: looseIn(grid), cut: cutIn(grid) };
}

/** Where a redrawn photo goes on its new canvas, and an optional patch of the photo copied elsewhere (source x, y, w, h, then target x, y, w, h). */
export interface Redraw {
  readonly width: number;
  readonly height: number;
  readonly place?: readonly [number, number, number, number];
  readonly patch?: readonly [number, number, number, number, number, number, number, number];
}

/** A fictional photo redrawn on a plain wall, as a JPEG file: a size, or a person placed where the fixtures never are. */
export async function redrawn(context: BrowserContext, photo: string, redraw: Redraw): Promise<Buffer> {
  const base64 = await inBlankPage(
    context,
    async ([source, { width, height, place, patch }]: readonly [string, Redraw]) => {
      const image = new Image();
      image.src = `data:image/jpeg;base64,${source}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const painter = canvas.getContext('2d');
      if (!painter) throw new Error('no 2D canvas');
      painter.fillStyle = '#d8d7d3';
      painter.fillRect(0, 0, width, height);
      painter.drawImage(image, ...(place ?? ([0, 0, width, height] as const)));
      if (patch) painter.drawImage(image, ...patch);
      return canvas.toDataURL('image/jpeg', 0.9).split(',')[1] ?? '';
    },
    [readFileSync(photo).toString('base64'), redraw] as const,
  );
  return Buffer.from(base64, 'base64');
}
