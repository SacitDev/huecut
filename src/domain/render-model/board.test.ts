/**
 * Board tests: the pair first only with its picture, shortlist order, at most
 * 9 tiles, names, the AI label, the hair-only switch, the empty state, the footer and a layout that never overlaps.
 */
import { expect, it } from 'vitest';
import type { Rect } from '../geometry/coords.ts';
import { asPictureId } from '../ids.ts';
import { BOARD_LAYOUT, buildBoard, buildReferenceSheet, type BoardIdea, type BoardPair } from './board.ts';

const ai = (id: string, hairOnly = false) => ({ source: 'ai', pictureId: asPictureId(id), hairOnly }) as const;
const IDEAS: BoardIdea[] = [
  { id: 'long-layers-curtain-fringe', kind: 'cut', name: 'Long layers with a curtain fringe', picture: ai('p-cut') },
  { id: 'copper-balayage-root-shadow', kind: 'colour', name: 'Copper balayage with a root shadow', picture: ai('p-colour', true) },
  { id: 'mid-drop-fade-textured-crop', kind: 'cut', name: 'Mid drop fade with textured crop', picture: null },
];
const PAIR: BoardPair = {
  cut: { id: 'long-layers-curtain-fringe', name: 'Long layers with a curtain fringe' },
  colour: { id: 'copper-balayage-root-shadow', name: 'Copper balayage with a root shadow' },
  picture: ai('p-pair'),
};
const inside = (outer: Rect, r: Rect): boolean => r.x >= outer.x && r.y >= outer.y && r.x + r.width <= outer.x + outer.width + 1e-6 && r.y + r.height <= outer.y + outer.height + 1e-6;
const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

it('puts the pair first, named with both names, then every idea in shortlist order with the app\'s names', () => {
  const b = buildBoard({ ideas: IDEAS, pair: PAIR });
  expect(b.tiles.map((t) => t.name)).toEqual([
    'Together: Long layers with a curtain fringe, with Copper balayage with a root shadow',
    'Long layers with a curtain fringe', 'Copper balayage with a root shadow', 'Mid drop fade with textured crop',
  ]);
  expect(b.tiles[0]?.key).toBe('long-layers-curtain-fringe+copper-balayage-root-shadow');
  expect(b.tiles[0]?.ideas).toEqual(['long-layers-curtain-fringe', 'copper-balayage-root-shadow']);
  expect(buildBoard({ ideas: IDEAS, pair: { ...PAIR, picture: null } }).tiles.map((t) => t.key)).toEqual(IDEAS.map((i) => i.id));
});

it('labels every AI tile, and offers hair-only on AI colour tiles and the pair only', () => {
  const b = buildBoard({ ideas: [...IDEAS, { id: 'copper-balayage', kind: 'colour', name: 'Copper balayage', picture: { source: 'library', key: 'salon-straight-wavy/copper-balayage-back' } }], pair: PAIR });
  expect(b.tiles.map((t) => t.aiLabel)).toEqual(['AI picture, an illustration of the look', 'AI picture, an illustration of the look', 'AI picture, an illustration of the look', null, null]);
  expect(b.tiles.map((t) => t.hairOnly)).toEqual([false, null, true, null, null]);
});

it('holds at most 9 tiles: 8 ideas and the pair', () => {
  const many: BoardIdea[] = Array.from({ length: 10 }, (_, i) => ({ id: `idea-${String(i)}`, kind: 'cut', name: `Idea ${String(i)}`, picture: ai(`p${String(i)}`) }));
  const b = buildBoard({ ideas: many, pair: PAIR });
  expect(b.tiles).toHaveLength(9);
  expect(b.tiles.at(-1)?.key).toBe('idea-7');
  expect([b.columns, b.rows]).toEqual([3, 3]);
});

it('lays tiles out inside the grid area, 4:5 pictures with their names under them, none overlapping', () => {
  for (const n of [1, 2, 3, 4, 5, 9]) {
    const ideas = Array.from({ length: n }, (_, i): BoardIdea => ({ id: `i${String(i)}`, kind: 'cut', name: 'Idea', picture: ai(`p${String(i)}`) }));
    const tiles = buildBoard({ ideas, pair: null }).tiles;
    const rects = tiles.flatMap((t) => [t.pictureRect, t.nameRect]);
    for (const r of rects) expect(inside(BOARD_LAYOUT.grid, r)).toBe(true);
    rects.forEach((a, i) => { rects.slice(i + 1).forEach((b) => { expect(overlaps(a, b)).toBe(false); }); });
    for (const t of tiles) {
      expect(t.pictureRect.width / t.pictureRect.height).toBeCloseTo(0.8, 9);
      expect(t.nameRect.y).toBeCloseTo(t.pictureRect.y + t.pictureRect.height, 9);
    }
  }
});

it('is empty without pictures, and always carries Huecut and its link and saves as JPEG', () => {
  const empty = buildBoard({ ideas: IDEAS.map((i) => ({ ...i, picture: null })), pair: null });
  expect(empty.empty).toBe(true);
  expect(buildBoard({ ideas: IDEAS, pair: null }).empty).toBe(false);
  expect(empty.footer).toEqual(['Huecut', 'https://sacitdev.github.io/huecut/']);
  expect(empty.export).toEqual({ widthPx: 2160, heightPx: 2700, mime: 'image/jpeg', quality: 0.92 });
  expect(empty.title).toBe('My looks');
});

it('a cut made with a colour keeps both names and its pairing on its tile, and has the hair-only switch', () => {
  const [t] = buildBoard({ ideas: [{ id: 'long-layers', kind: 'cut', name: 'Long layers', picture: ai('p'), colour: { id: 'copper-all-over', name: 'Copper all over' } }], pair: null }).tiles;
  expect(t).toMatchObject({ key: 'long-layers+copper-all-over', ideas: ['long-layers', 'copper-all-over'], name: 'Long layers in Copper all over', hairOnly: false });
});

it('numbers the reference sheet from 1 in the order given, laid out like the board, as a JPEG with Huecut in its footer', () => {
  const sheet = buildReferenceSheet(Array.from({ length: 6 }, (_, i) => ({ name: `Look ${String(i)}`, picture: `m/look-${String(i)}-front` })));
  expect(sheet.tiles.map((t) => [t.number, t.picture])).toEqual([1, 2, 3, 4, 5, 6].map((n) => [n, `m/look-${String(n - 1)}-front`]));
  const rects = sheet.tiles.flatMap((t) => [t.pictureRect, t.nameRect]);
  for (const r of rects) expect(inside(BOARD_LAYOUT.grid, r)).toBe(true);
  rects.forEach((a, i) => { rects.slice(i + 1).forEach((r) => { expect(overlaps(a, r)).toBe(false); }); });
  expect(sheet.export).toEqual({ widthPx: 2160, heightPx: 2700, mime: 'image/jpeg', quality: 0.92 });
  expect(sheet.footer).toEqual(['Huecut', 'https://sacitdev.github.io/huecut/']);
});
