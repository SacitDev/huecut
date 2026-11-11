/**
 * Exports: the face card, stylist sheet, board and reference sheet as painter items at 2160 x 2700, painted
 * on an OffscreenCanvas where there is one (a detached canvas otherwise) and encoded as JPEG 0.92. Canvas
 * encoders write pixels only, so the file carries no EXIF or other camera metadata.
 */
import { CARD_PX, type Rect } from '../../domain/geometry/coords.ts';
import type { Board, BoardTile, ReferenceSheet } from '../../domain/render-model/board.ts';
import type { ExportSpec } from '../../domain/render-model/face-card.ts';
import type { StylistSheet } from '../../domain/render-model/stylist-sheet.ts';
import { EXPORT_WEIGHTS, loadFonts, paint, readTokens, type Ctx2D, type PainterItem, type PainterText, type PainterTokens, type PictureLookup } from './painter.ts';

const PAGE: PainterItem = { type: 'ground', rect: { x: 0, y: 0, width: CARD_PX.widthPx, height: CARD_PX.heightPx }, tone: 'page' };
/** Huecut and its link, in every export's footer. */
const footer = (rect: Rect, [app = '', link = '']: readonly string[]): PainterItem => ({
  type: 'text',
  rect,
  blocks: [{ role: 'app', text: app }, { role: 'link', text: link }],
});

/** The stylist sheet: the pictures strip drawn whole, the AI picture with its label, the sections in two columns. */
export function stylistSheetItems(sheet: StylistSheet): PainterItem[] {
  const blocks: PainterText[] = [
    { role: 'title', text: sheet.title },
    ...sheet.sections.flatMap((section): PainterText[] => [
      { role: 'section', text: section.heading },
      ...section.rows.map((r): PainterText => ({ role: 'row', text: `${r.label}: ${r.value}` })),
    ]),
  ];
  const ai = sheet.aiPicture;
  const aiItem: PainterItem[] = ai
    ? [{ type: 'picture', ref: { source: 'ai', pictureId: ai.pictureId, hairOnly: ai.hairOnly }, rect: ai.rect, tag: ai.label }]
    : [];
  return [
    PAGE,
    ...sheet.thumbnails.map((t): PainterItem => ({ type: 'picture', ref: { source: 'library', key: t.key }, rect: t.rect })),
    ...aiItem,
    { type: 'text', rect: sheet.layout.text, blocks, columns: 2 },
    footer(sheet.layout.footer, sheet.footer),
  ];
}

/** The picture inside a tile's arch keeps clear of the round crown, as the Arch component does (27% top, 6% sides). */
const ARCH_INSET = { crown: 0.27, side: 0.06 };

function tileItems(tile: BoardTile): PainterItem[] {
  const { x, y, width, height } = tile.pictureRect;
  const [crown, side] = [width * ARCH_INSET.crown, width * ARCH_INSET.side];
  const inner = { x: x + side, y: y + crown, width: width - 2 * side, height: height - crown - side };
  const caption: PainterText[] = tile.aiLabel === null ? [] : [{ role: 'caption', text: tile.aiLabel }];
  return [
    { type: 'arch', rect: tile.pictureRect },
    { type: 'picture', ref: tile.picture, rect: inner },
    { type: 'text', rect: tile.nameRect, blocks: [{ role: 'name', text: tile.name }, ...caption] },
  ];
}

/** The board: its title, one arch per tile with the picture whole inside and the name (and AI label) under it. */
export function boardItems(board: Board): PainterItem[] {
  return [
    PAGE,
    { type: 'text', rect: board.layout.title, blocks: [{ role: 'title', text: board.title }] },
    ...board.tiles.flatMap(tileItems),
    footer(board.layout.footer, board.footer),
  ];
}

/** The final card's reference sheet: each library picture whole, its number on it and its name under it. */
export function referenceSheetItems(sheet: ReferenceSheet): PainterItem[] {
  return [
    PAGE,
    { type: 'text', rect: sheet.layout.title, blocks: [{ role: 'title', text: sheet.title }] },
    ...sheet.tiles.flatMap((tile): PainterItem[] => [
      { type: 'picture', ref: tile.picture === null ? null : { source: 'library', key: tile.picture }, rect: tile.pictureRect, tag: String(tile.number) },
      { type: 'text', rect: tile.nameRect, blocks: [{ role: 'name', text: tile.name }] },
    ]),
    footer(sheet.layout.footer, sheet.footer),
  ];
}

export interface ExportOptions {
  /** The theme to paint in; default the page's current theme (the person may pick the other one at download). */
  readonly tokens?: PainterTokens;
  readonly pictures?: PictureLookup;
}

type Surface = { readonly canvas: OffscreenCanvas; readonly ctx: OffscreenCanvasRenderingContext2D } | { readonly canvas: HTMLCanvasElement; readonly ctx: CanvasRenderingContext2D };

function surface(widthPx: number, heightPx: number): Surface {
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(widthPx, heightPx);
    const ctx = canvas.getContext('2d');
    if (ctx) return { canvas, ctx };
  }
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context for the export');
  return { canvas, ctx };
}

function encode({ canvas }: Surface, spec: ExportSpec): Promise<Blob> {
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The canvas could not be encoded'));
      }, spec.mime, spec.quality);
    });
  }
  return canvas.convertToBlob({ type: spec.mime, quality: spec.quality });
}

/**
 * Paints the items at the spec's size, finished (no trace), with the export line weights, after loading their fonts,
 * and encodes them. Rejects when the browser cannot encode the spec's type rather than saving another type under its name.
 */
export async function exportImage(items: readonly PainterItem[], spec: ExportSpec, options: ExportOptions = {}): Promise<Blob> {
  const tokens = options.tokens ?? readTokens(document.documentElement);
  await loadFonts(items, tokens);
  const target = surface(spec.widthPx, spec.heightPx);
  const ctx: Ctx2D = target.ctx;
  paint(ctx, items, { tokens, scale: spec.widthPx / CARD_PX.widthPx, weights: EXPORT_WEIGHTS, elapsedMs: null, pictures: options.pictures });
  const blob = await encode(target, spec);
  if (blob.type !== spec.mime) throw new Error(`The browser encoded ${blob.type} instead of ${spec.mime}`);
  return blob;
}
