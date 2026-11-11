/**
 * Export item tests: the stylist sheet and the board as painter items, with every picture
 * drawn whole in its frame, the AI label on AI pictures, and Huecut with its link in the footer.
 */
import { expect, it } from 'vitest';
import type { Rect } from '../../domain/geometry/coords.ts';
import { asPictureId } from '../../domain/ids.ts';
import { buildBoard } from '../../domain/render-model/board.ts';
import { EN } from '../../domain/render-model/copy.ts';
import { JPEG_EXPORT } from '../../domain/render-model/face-card.ts';
import { STYLIST_SHEET_LAYOUT, type StylistSheet } from '../../domain/render-model/stylist-sheet.ts';
import { boardItems, stylistSheetItems } from './export.ts';
import type { PainterItem } from './painter.ts';

const at = (x: number): Rect => ({ x, y: 120, width: 462, height: 720 });
const SHEET: StylistSheet = {
  title: 'Long layers',
  thumbnails: (['front', 'side', 'back'] as const).map((view, i) => ({ itemId: 'long-layers', view, key: `model-a/long-layers-${view}`, rect: at(120 + i * 486) })),
  aiPicture: { pictureId: asPictureId('slot-1'), hairOnly: false, label: EN.sheet.aiLabel, rect: at(120 + 3 * 486) },
  sections: [
    { id: 'lengths', heading: 'Lengths', rows: [{ label: 'Top', value: '20-25 cm' }, { label: 'Measured', value: 'dry and stretched' }] },
    { id: 'upkeep', heading: 'Upkeep', rows: [{ label: 'Trim', value: 'every 8-10 weeks' }] },
  ],
  footer: [EN.footer.app, EN.footer.link],
  layout: STYLIST_SHEET_LAYOUT,
  export: JPEG_EXPORT,
};
const ofType = <T extends PainterItem['type']>(items: readonly PainterItem[], type: T) =>
  items.filter((i): i is Extract<PainterItem, { readonly type: T }> => i.type === type);
const inside = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

it('paints the sheet on the page ground: the library thumbnails, the AI picture with its label, two columns of text', () => {
  const items = stylistSheetItems(SHEET);
  expect(items[0]).toEqual({ type: 'ground', rect: { x: 0, y: 0, width: 2160, height: 2700 }, tone: 'page' });
  const pictures = ofType(items, 'picture');
  expect(pictures.map((p) => p.ref)).toEqual([
    { source: 'library', key: 'model-a/long-layers-front' },
    { source: 'library', key: 'model-a/long-layers-side' },
    { source: 'library', key: 'model-a/long-layers-back' },
    { source: 'ai', pictureId: 'slot-1', hairOnly: false },
  ]);
  expect(pictures.map((p) => p.rect)).toEqual([...SHEET.thumbnails.map((t) => t.rect), SHEET.aiPicture?.rect]);
  expect(pictures.at(-1)?.tag).toBe('AI picture, an illustration of the look');
  const [body, footer] = ofType(items, 'text');
  expect(body?.columns).toBe(2);
  expect(body?.rect).toEqual(STYLIST_SHEET_LAYOUT.text);
  expect(body?.blocks.map((b) => `${b.role}:${b.text}`)).toEqual([
    'title:Long layers', 'section:Lengths', 'row:Top: 20-25 cm', 'row:Measured: dry and stretched', 'section:Upkeep', 'row:Trim: every 8-10 weeks',
  ]);
  expect(footer?.blocks).toEqual([{ role: 'app', text: 'Huecut' }, { role: 'link', text: 'https://sacitdev.github.io/huecut/' }]);
});

it('paints no AI picture on a sheet without one', () => {
  expect(ofType(stylistSheetItems({ ...SHEET, aiPicture: null }), 'picture').map((p) => p.ref?.source)).toEqual(['library', 'library', 'library']);
});

it('paints the board: title, an arch per tile with its picture whole inside, the name and the AI label under it', () => {
  const board = buildBoard({
    ideas: [
      { id: 'long-layers', kind: 'cut', name: 'Long layers', picture: { source: 'ai', pictureId: asPictureId('slot-1'), hairOnly: false } },
      { id: 'copper-melt', kind: 'colour', name: 'Copper melt', picture: { source: 'library', key: 'model-a/copper-melt-front' } },
      { id: 'curly-bob', kind: 'cut', name: 'Curly bob', picture: null },
    ],
    pair: null,
  });
  const items = boardItems(board);
  expect(ofType(items, 'text')[0]?.blocks).toEqual([{ role: 'title', text: 'My looks' }]);
  const arches = ofType(items, 'arch');
  const pictures = ofType(items, 'picture');
  expect(arches.map((a) => a.rect)).toEqual(board.tiles.map((t) => t.pictureRect));
  expect(pictures.map((p) => p.ref)).toEqual(board.tiles.map((t) => t.picture));
  pictures.forEach((p, i) => {
    const frame = board.tiles[i]?.pictureRect;
    expect(frame && inside(frame, p.rect)).toBe(true);
    expect(p.rect.y - (frame?.y ?? 0)).toBeCloseTo(0.27 * (frame?.width ?? 0), 9);
  });
  const names = ofType(items, 'text').slice(1, -1).map((t) => t.blocks.map((b) => `${b.role}:${b.text}`));
  expect(names).toEqual([['name:Long layers', 'caption:AI picture, an illustration of the look'], ['name:Copper melt'], ['name:Curly bob']]);
  expect(ofType(items, 'text').at(-1)?.blocks.map((b) => b.text)).toEqual(['Huecut', 'https://sacitdev.github.io/huecut/']);
});
