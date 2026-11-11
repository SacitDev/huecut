/**
 * Quick-grid split tests on synthetic RGBA grids of 2, 3 and 4 tiles: no border, a uniform border,
 * slight gaps, both, JPEG-like noise, and a plain backdrop reaching the tile edges.
 */
import { expect, it } from 'vitest';
import type { Rect } from '../geometry/coords.ts';
import type { RgbaImage } from '../measure/mask.ts';
import { splitGrid, type GridLayout } from './grid-split.ts';

type Rgb = readonly [number, number, number];
interface Spec extends GridLayout { readonly border: number; readonly gap: number; readonly backdrop?: number }
const TILE = { w: 120, h: 150 } as const;
const PALETTE: readonly Rgb[] = [[200, 40, 40], [40, 160, 60], [50, 70, 200], [190, 150, 30]];
const FRAME: Rgb = [246, 246, 246];
const BACKDROP: Rgb = [180, 186, 192];

/** A grid picture as an AI might return it: each tile a checked pattern in its own colour, framed and gapped by `spec`. */
function makeGrid(spec: Spec): { img: RgbaImage; truth: Rect[] } {
  const width = 2 * spec.border + spec.columns * TILE.w + (spec.columns - 1) * spec.gap;
  const height = 2 * spec.border + spec.rows * TILE.h + (spec.rows - 1) * spec.gap;
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = 7;
  const noise = (): number => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return Math.round((seed / 2 ** 31) * 10 - 5); };
  const set = (x: number, y: number, c: Rgb): void => { const i = (y * width + x) * 4; c.forEach((v, k) => { data[i + k] = v + noise(); }); data[i + 3] = 255; };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) set(x, y, FRAME);
  const truth: Rect[] = [];
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.columns; c++) {
      const rect = { x: spec.border + c * (TILE.w + spec.gap), y: spec.border + r * (TILE.h + spec.gap), width: TILE.w, height: TILE.h };
      const base = PALETTE[truth.length] ?? FRAME;
      const dark: Rgb = [base[0] * 0.5, base[1] * 0.5, base[2] * 0.5];
      for (let ly = 0; ly < TILE.h; ly++) {
        for (let lx = 0; lx < TILE.w; lx++) {
          const plain = spec.backdrop !== undefined && (lx < spec.backdrop || lx >= TILE.w - spec.backdrop);
          set(rect.x + lx, rect.y + ly, plain ? BACKDROP : ((lx >> 2) + (ly >> 2)) % 2 ? base : dark);
        }
      }
      truth.push(rect);
    }
  }
  return { img: { widthPx: width, heightPx: height, data }, truth };
}

const LAYOUTS: readonly GridLayout[] = [{ rows: 1, columns: 2 }, { rows: 1, columns: 3 }, { rows: 2, columns: 2 }];
const FRAMES = [{ border: 0, gap: 0 }, { border: 10, gap: 0 }, { border: 0, gap: 4 }, { border: 12, gap: 3 }] as const;

const expectNear = (got: readonly Rect[], want: readonly Rect[], tolerancePx: number): void => {
  expect(got).toHaveLength(want.length);
  got.forEach((g, i) => {
    const w = want[i];
    if (!w) throw new Error('missing tile');
    for (const [a, b] of [[g.x, w.x], [g.y, w.y], [g.x + g.width, w.x + w.width], [g.y + g.height, w.y + w.height]] as const) expect(Math.abs(a - b)).toBeLessThanOrEqual(tolerancePx);
  });
};

it('cuts 2, 3 and 4 tiles exactly, with and without a uniform border and slight gaps', () => {
  for (const layout of LAYOUTS) {
    for (const frame of FRAMES) {
      const { img, truth } = makeGrid({ ...layout, ...frame });
      const r = splitGrid(img, layout);
      if (!r.ok) throw new Error(r.error);
      expectNear(r.value.tiles, truth, 0);
      expect(r.value.content).toEqual({ x: frame.border, y: frame.border, width: img.widthPx - 2 * frame.border, height: img.heightPx - 2 * frame.border });
    }
  }
});

it('returns the tiles in reading order: each tile holds its own colour', () => {
  const { img } = makeGrid({ rows: 2, columns: 2, border: 8, gap: 2 });
  const r = splitGrid(img, { rows: 2, columns: 2 });
  if (!r.ok) throw new Error(r.error);
  r.value.tiles.forEach((t, i) => {
    const px = ((t.y + 2) * img.widthPx + t.x + 6) * 4;
    const base = PALETTE[i] ?? FRAME;
    expect(Math.abs((img.data[px] ?? 0) - base[0])).toBeLessThanOrEqual(5);
    expect(Math.abs((img.data[px + 2] ?? 0) - base[2])).toBeLessThanOrEqual(5);
  });
});

it('a plain backdrop reaching the tile edges is not taken for a border or a gap: cuts stay within the backdrop', () => {
  for (const layout of LAYOUTS) {
    const backdrop = 12;
    const { img, truth } = makeGrid({ ...layout, border: 0, gap: 0, backdrop });
    const r = splitGrid(img, layout);
    if (!r.ok) throw new Error(r.error);
    expectNear(r.value.tiles, truth, backdrop);
    for (const [i, t] of r.value.tiles.entries()) {
      const w = truth[i];
      if (!w) throw new Error('missing tile');
      expect(t.x).toBeLessThanOrEqual(w.x + backdrop);
      expect(t.x + t.width).toBeGreaterThanOrEqual(w.x + w.width - backdrop);
    }
  }
});

it('one tile is the picture without its border', () => {
  const { img, truth } = makeGrid({ rows: 1, columns: 1, border: 9, gap: 0 });
  const r = splitGrid(img, { rows: 1, columns: 1 });
  expect(r.ok && r.value.tiles).toEqual(truth);
});

it('leaves the pixels untouched and refuses a bad layout or a picture too small to split', () => {
  const { img } = makeGrid({ rows: 1, columns: 2, border: 4, gap: 2 });
  const before = Uint8ClampedArray.from(img.data);
  splitGrid(img, { rows: 1, columns: 2 });
  expect(img.data).toEqual(before);
  expect(splitGrid(img, { rows: 0, columns: 2 })).toEqual({ ok: false, error: 'bad_layout' });
  expect(splitGrid(img, { rows: 1, columns: 1.5 })).toEqual({ ok: false, error: 'bad_layout' });
  expect(splitGrid({ widthPx: 20, heightPx: 20, data: new Uint8ClampedArray(1600) }, { rows: 1, columns: 2 })).toEqual({ ok: false, error: 'too_small' });
});
