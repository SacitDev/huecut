/**
 * Text for the Canvas painter: the card-px type of each text role, the fonts to
 * load per weight before painting, rose tags, and text blocks set by our line breaker, fitted to their rectangle.
 */
import type { Rect } from '../../domain/geometry/coords.ts';
import type { TextBlock } from '../../domain/render-model/face-card.ts';
import { breakLines, fitBlocks, type BlockLayout, type BlockStyle, type TextFrame } from './text-layout.ts';
import type { Colour, PainterTokens } from './tokens.ts';

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
/** The context and the theme a piece of text is drawn with. */
export interface Pen {
  readonly ctx: Ctx2D;
  readonly tokens: PainterTokens;
}
export type TextRole = TextBlock['role'] | 'title' | 'section' | 'row' | 'name' | 'caption';
export interface PainterText {
  readonly role: TextRole;
  readonly text: string;
}
/** Blocks stacked top to bottom inside `rect`, flowing into `columns` (default 1). */
export interface TextItem {
  readonly type: 'text';
  readonly rect: Rect;
  readonly blocks: readonly PainterText[];
  readonly columns?: number;
}

type Face = 'display' | 'text';
export interface FontStyle {
  readonly face: Face;
  readonly weight: number;
}
interface RoleStyle extends BlockStyle, FontStyle {
  readonly colour: Colour;
  /** Set right-aligned in the end column: Huecut and its link in the footer. */
  readonly end?: boolean;
}
const flat = { gapBeforePx: 0, padPx: 0 };
const SMALL: RoleStyle = { face: 'text', weight: 500, sizePx: 34, lineHeight: 1.35, ...flat, colour: 'text2' };
/**
 * Card px type per role: Bricolage Grotesque for display sizes, Figtree for text. The face card's panel roles are
 * light on the cocoa panel and sized for a saved card read at phone width: 54 card px is 9 CSS px on a 360 px wide screen.
 */
export const ROLES: Readonly<Record<TextRole, RoleStyle>> = {
  heading: { face: 'display', weight: 700, sizePx: 84, lineHeight: 1.08, ...flat, colour: 'onPrimary' },
  title: { face: 'display', weight: 700, sizePx: 88, lineHeight: 1.08, ...flat, colour: 'text' },
  section: { face: 'display', weight: 650, sizePx: 52, lineHeight: 1.15, gapBeforePx: 40, padPx: 0, colour: 'text' },
  qualifier: { face: 'text', weight: 500, sizePx: 50, lineHeight: 1.35, gapBeforePx: 20, padPx: 0, colour: 'rose' },
  fact: { face: 'text', weight: 650, sizePx: 66, lineHeight: 1.25, gapBeforePx: 52, padPx: 0, colour: 'onPrimary' },
  hair: { face: 'text', weight: 400, sizePx: 58, lineHeight: 1.3, gapBeforePx: 10, padPx: 0, colour: 'onPrimary' },
  number: { face: 'text', weight: 500, sizePx: 54, lineHeight: 1.3, gapBeforePx: 10, padPx: 0, colour: 'rose' },
  row: { face: 'text', weight: 400, sizePx: 36, lineHeight: 1.4, gapBeforePx: 8, padPx: 0, colour: 'text' },
  name: { face: 'text', weight: 600, sizePx: 44, lineHeight: 1.2, ...flat, colour: 'text' },
  caption: { face: 'text', weight: 500, sizePx: 32, lineHeight: 1.3, gapBeforePx: 4, padPx: 0, colour: 'text2' },
  footer: SMALL,
  date: SMALL,
  app: { face: 'display', weight: 700, sizePx: 48, lineHeight: 1.1, ...flat, colour: 'text', end: true },
  link: { ...SMALL, colour: 'accent', end: true },
};
/** Picture tags: Figtree 600 at 40 card px, rose tag, cocoa text. */
export const TAG = { face: 'text', weight: 600, sizePx: 40, lineHeight: 1.1, padX: 18, padY: 8, radius: 16, inset: 24 } as const;
/** The face card's line labels: the same tag at 52 card px, in two columns beside the photo. */
export const LABEL_TAG = { ...TAG, sizePx: 52 } as const;
type TagStyle = typeof TAG | typeof LABEL_TAG;
const COLUMN_GAP_PX = 64;
/** Share of a footer's width taken by its end column. */
const END_SHARE = 0.4;

/** The display face is set semi-condensed: Bricolage Grotesque at width 85-90. */
const stretchOf = (face: Face): CanvasFontStretch => (face === 'display' ? 'semi-condensed' : 'normal');
const shorthand = (tokens: PainterTokens, { face, weight }: FontStyle, sizePx: number): string =>
  `${String(weight)} ${String(sizePx)}px ${tokens.fonts[face] || 'sans-serif'}`;

/**
 * A CSS font (with its stretch) for `document.fonts.load()`, naming only the theme's first family: the shipped web font. The
 * families after it are local fallback faces a system may lack (no Arial on Linux or Android), and a face that fails would
 * fail the whole load, or end the wait before the web font has arrived.
 */
export const fontOf = (tokens: PainterTokens, { face, weight }: FontStyle, sizePx: number): string =>
  `${stretchOf(face)} ${String(weight)} ${String(sizePx)}px ${(tokens.fonts[face].split(',')[0] ?? '').trim() || 'sans-serif'}`;

/** Sets the context's font. Canvas takes the stretch as its own property, not in the shorthand. */
export function setFont(pen: Pen, style: FontStyle, sizePx: number): void {
  pen.ctx.font = shorthand(pen.tokens, style, sizePx);
  pen.ctx.fontStretch = stretchOf(style.face);
}

/** Items as far as their fonts go: text blocks, label tags, and picture tags. */
interface FontItem {
  readonly type: string;
  readonly blocks?: readonly PainterText[];
  readonly text?: string;
  readonly tag?: string;
}

/** Each face and weight the items use, with the letters set in it: they decide which `unicode-range` faces load (Latin Extended for Latvian). */
function lettersByFont(items: readonly FontItem[], tokens: PainterTokens): Map<string, string> {
  const byFont = new Map<string, string>();
  const add = (style: FontStyle, text: string): void => {
    const font = fontOf(tokens, style, 16);
    byFont.set(font, [...new Set((byFont.get(font) ?? '') + text)].join(''));
  };
  for (const i of items) {
    if (i.type === 'text') for (const b of i.blocks ?? []) add(ROLES[b.role], b.text);
    else if (i.type === 'label') add(LABEL_TAG, i.text ?? '');
    else if (i.tag !== undefined) add(TAG, i.tag);
  }
  return byFont;
}

/** One CSS font per face and weight the items use, for `document.fonts.load()` before painting. */
export function fontsFor(items: readonly FontItem[], tokens: PainterTokens): string[] {
  return [...lettersByFont(items, tokens).keys()];
}

/**
 * Loads every font weight the items use, with the letters they set, before painting, so text never sets in a fallback font
 * first and then jumps. Returns the fonts that did not load (an error, or no face matched); they set in the theme's fallback
 * font, and the export still saves.
 */
export async function loadFonts(items: readonly FontItem[], tokens: PainterTokens, fonts: FontFaceSet = document.fonts): Promise<string[]> {
  const wanted = [...lettersByFont(items, tokens)];
  const results = await Promise.allSettled(wanted.map(([font, letters]) => fonts.load(font, letters || ' ')));
  return wanted.filter((_, i) => {
    const result = results[i];
    return result?.status !== 'fulfilled' || result.value.length === 0;
  }).map(([font]) => font);
}

/** Where a tag goes: its left edge and top, each fixed or computed from the tag's own width or height. */
export interface TagPlace {
  readonly left: number | ((width: number) => number);
  readonly top: (height: number) => number;
}

/** A rose tag with cocoa text, wrapped to `maxWidth` and placed by `place` once its size is known. */
export function drawTag(pen: Pen, text: string, place: TagPlace, maxWidth: number, tag: TagStyle = TAG): void {
  const { ctx, tokens } = pen;
  setFont(pen, tag, tag.sizePx);
  const lines = breakLines(text, Math.max(1, maxWidth - 2 * tag.padX), (t) => ctx.measureText(t).width);
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 2 * tag.padX;
  const lineHeight = tag.sizePx * tag.lineHeight;
  const height = lines.length * lineHeight + 2 * tag.padY;
  const x = typeof place.left === 'number' ? place.left : place.left(width);
  const y = place.top(height);
  ctx.fillStyle = tokens.colours.tag;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, tag.radius);
  ctx.fill();
  ctx.fillStyle = tokens.colours.tagText;
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + tag.padX, y + tag.padY + (i + 0.5) * lineHeight);
  });
}

interface TextSet {
  readonly blocks: readonly PainterText[];
  readonly layout: BlockLayout;
  readonly end: boolean;
}
const layouts = new WeakMap<TextItem, { readonly key: string; readonly sets: readonly TextSet[] }>();

/** Widths that change when a web font arrives, so a layout measured in a fallback font is set again. */
function fontProbe(pen: Pen): string {
  return (['display', 'text'] as const)
    .map((face) => {
      setFont(pen, { face, weight: 400 }, 100);
      return String(pen.ctx.measureText('Huecut Hamburgefonstiv').width);
    })
    .join('/');
}

function setBlocks(pen: Pen, blocks: readonly PainterText[], frame: TextFrame, end: boolean): TextSet {
  const measureAt = (index: number, sizePx: number) => {
    setFont(pen, ROLES[blocks[index]?.role ?? 'row'], sizePx);
    return (t: string) => pen.ctx.measureText(t).width;
  };
  return { blocks, layout: fitBlocks(blocks.map((b) => ({ text: b.text, style: ROLES[b.role] })), frame, measureAt), end };
}

/** Start blocks flow in the item's columns; end blocks are set right-aligned beside them. Cached per item and font. */
function textLayout(pen: Pen, item: TextItem): readonly TextSet[] {
  const key = `${fontProbe(pen)}|${pen.tokens.fonts.display}|${pen.tokens.fonts.text}`;
  const cached = layouts.get(item);
  if (cached?.key === key) return cached.sets;
  const { rect } = item;
  const start = item.blocks.filter((b) => ROLES[b.role].end !== true);
  const end = item.blocks.filter((b) => ROLES[b.role].end === true);
  const endWidth = end.length === 0 ? 0 : start.length === 0 ? rect.width : rect.width * END_SHARE;
  const frame = { y: rect.y, height: rect.height, columnGapPx: COLUMN_GAP_PX };
  const sets = [
    setBlocks(pen, start, { ...frame, x: rect.x, width: rect.width - endWidth, columns: item.columns ?? 1 }, false),
    setBlocks(pen, end, { ...frame, x: rect.x + rect.width - endWidth, width: endWidth, columns: 1 }, true),
  ];
  layouts.set(item, { key, sets });
  return sets;
}

/** Draws a text item, each line on its line-height centre. */
export function drawText(pen: Pen, item: TextItem): void {
  const { ctx, tokens } = pen;
  for (const { blocks, layout, end } of textLayout(pen, item)) {
    for (const b of layout.blocks) {
      const style = ROLES[blocks[b.index]?.role ?? 'row'];
      setFont(pen, style, b.sizePx);
      ctx.fillStyle = tokens.colours[style.colour];
      ctx.textBaseline = 'middle';
      ctx.textAlign = end ? 'right' : 'left';
      const x = end ? b.x + b.width - b.padPx : b.x + b.padPx;
      b.lines.forEach((line, i) => {
        ctx.fillText(line, x, b.y + b.padPx + (i + 0.5) * b.lineHeightPx);
      });
      ctx.textAlign = 'left';
    }
  }
}
