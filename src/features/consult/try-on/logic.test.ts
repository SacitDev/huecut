/** Unit tests of Try it on's pure rules: hand-off by device class, grid stages, moving names, tile fills and the board input. */
import { describe, expect, it } from 'vitest';
import { asItemId, asPhotoId, asPictureId, lookId, slotKey } from '../../../domain/ids.ts';
import type { BoardTile } from '../../../machine/consult.selectors.ts';
import type { Grid } from '../../../machine/consult.types.ts';
import { boardInput, gridStage, handoffOf, isPairTile, moved, tileFills, type Named } from './logic.ts';

const [cut1, cut2, cut3, colour] = [asItemId('cut-1'), asItemId('cut-2'), asItemId('cut-3'), asItemId('colour-1')];
const photo = asPhotoId('p1');
const [pic1, pic2, pic3] = [asPictureId('t1'), asPictureId('t2'), asPictureId('t3')];
const grid = (over: Partial<Grid> = {}): Grid => ({ grid: 0, pictureId: asPictureId('g'), ideas: [], confirmed: false, ...over });

describe('handoffOf', () => {
  it('gives phones and tablets the two numbered buttons, and computers the desktop hand-off', () => {
    expect(handoffOf({ class: 'phone' })).toBe('touch');
    expect(handoffOf({ class: 'tablet' })).toBe('touch');
    expect(handoffOf({ class: 'computer' })).toBe('desktop');
  });
});

describe('gridStage', () => {
  it('follows the grid from no picture to names attached, or to one picture per look', () => {
    const ideas = [cut2, cut1];
    expect(gridStage(undefined, false, ideas)).toBe('empty');
    expect(gridStage(grid(), true, ideas)).toBe('confirming');
    expect(gridStage(grid(), false, ideas)).toBe('lost');
    expect(gridStage(grid({ confirmed: true, ideas: [cut1, cut2] }), false, ideas)).toBe('named');
    expect(gridStage(grid({ confirmed: true, ideas: [] }), true, ideas)).toBe('per-idea');
  });
  it('treats names confirmed for other looks as empty, because grids are numbered by their place in the list', () => {
    expect(gridStage(grid({ confirmed: true, ideas: [cut1, cut3] }), true, [cut1, cut2])).toBe('empty');
    expect(gridStage(grid({ confirmed: true, ideas: [cut1, cut2] }), true, [cut1])).toBe('empty');
    expect(gridStage(grid({ confirmed: true, ideas: [cut1] }), true, [cut1, cut2]), 'names for only some of the looks').toBe('empty');
  });
});

describe('moved', () => {
  it('swaps a name with its neighbour and leaves the list alone at its ends', () => {
    const list = [cut1, cut2, cut3];
    expect(moved(list, 0, 1)).toEqual([cut2, cut1, cut3]);
    expect(moved(list, 2, -1)).toEqual([cut1, cut3, cut2]);
    expect(moved(list, 0, -1)).toEqual(list);
    expect(moved(list, 2, 1)).toEqual(list);
    expect(list).toEqual([cut1, cut2, cut3]);
  });
});

describe('tileFills', () => {
  it('gives each named look its tile, in the confirmed order, unless its slot already has a picture', () => {
    const slots = { [slotKey(cut2, photo)]: { pictureId: asPictureId('own'), hairOnly: false } };
    expect(tileFills([cut3, cut1, cut2], [pic1, pic2, pic3], photo, slots)).toEqual([
      { key: slotKey(cut3, photo), picture: pic1 },
      { key: slotKey(cut1, photo), picture: pic2 },
    ]);
  });
  it('names no tile when the order is empty ("Tiles look wrong?")', () => {
    expect(tileFills([], [pic1, pic2], photo, {})).toEqual([]);
  });
  it('keys the tile of a cut with its colour by that look', () => {
    expect(tileFills([lookId([cut1, colour])], [pic1], photo, {})).toEqual([{ key: slotKey([cut1, colour], photo), picture: pic1 }]);
  });
});

describe('isPairTile', () => {
  const tile = (ideas: BoardTile['ideas']): BoardTile => ({ key: slotKey(cut1, photo), ideas, picture: null });
  it('is the tile holding exactly the pair: not another pairing, not a single idea, and never without a pair', () => {
    const isPair = isPairTile({ cut: cut1, colour });
    expect(isPair(tile([cut1, colour]))).toBe(true);
    expect(isPair(tile([cut2, colour]))).toBe(false);
    expect(isPair(tile([cut1, asItemId('colour-2')]))).toBe(false);
    expect(isPair(tile([cut1]))).toBe(false);
    expect(isPairTile(null)(tile([cut1, colour]))).toBe(false);
  });
});

describe('boardInput', () => {
  const names: Record<string, { name: string; kind: 'cut' | 'colour' }> = {
    [cut1]: { name: 'Shingle bob', kind: 'cut' },
    [colour]: { name: 'Bronde balayage', kind: 'colour' },
  };
  const named: Named = (id) => names[id] ?? null;
  const tile = (ideas: BoardTile['ideas'], picture: BoardTile['picture']): BoardTile => ({
    key: slotKey(ideas.length === 2 ? [cut1, colour] : (ideas[0] ?? cut1), photo),
    ideas,
    picture,
  });
  it('names each idea, keeps its picture and hair-only state, and makes the pair from the two-idea tile', () => {
    const pictured = { pictureId: pic1, hairOnly: true };
    const input = boardInput([tile([cut1, colour], pictured), tile([cut1], null), tile([colour], pictured)], named);
    expect(input.pair).toEqual({
      cut: { id: cut1, name: 'Shingle bob' },
      colour: { id: colour, name: 'Bronde balayage' },
      picture: { source: 'ai', pictureId: pic1, hairOnly: true },
    });
    expect(input.ideas).toEqual([
      { id: cut1, kind: 'cut', name: 'Shingle bob', picture: null },
      { id: colour, kind: 'colour', name: 'Bronde balayage', picture: { source: 'ai', pictureId: pic1, hairOnly: true } },
    ]);
  });
  it('makes a two-idea tile a cut with its colour unless it is the pair', () => {
    const pictured = { pictureId: pic1, hairOnly: false };
    const input = boardInput([tile([cut1, colour], pictured)], named, () => false);
    expect(input.pair).toBeNull();
    expect(input.ideas).toEqual([{ id: cut1, kind: 'cut', name: 'Shingle bob', picture: { source: 'ai', pictureId: pic1, hairOnly: false }, colour: { id: colour, name: 'Bronde balayage' } }]);
  });
  it('leaves out an id the library does not know rather than showing a tile without a name', () => {
    expect(boardInput([tile([cut2], null)], named)).toEqual({ ideas: [], pair: null });
  });
});
