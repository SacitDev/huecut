/**
 * Our own line breaker for the Canvas painter: Canvas has no wrapping, so text is broken greedily
 * over a measure function, and stacks of blocks are fitted into a rectangle, in columns, at the largest scale that fits.
 * Pure: the painter passes `ctx.measureText`, the tests a fake.
 */

/** Width of `text` at the font the caller has set, in the caller's px. */
export type Measure = (text: string) => number;

/** Cuts a word wider than a line between characters (a long link on a narrow column). */
function splitWord(word: string, maxWidth: number, measure: Measure): string[] {
  const pieces: string[] = [];
  let piece = '';
  for (const ch of word) {
    if (piece !== '' && measure(piece + ch) > maxWidth) {
      pieces.push(piece);
      piece = ch;
    } else piece += ch;
  }
  return [...pieces, piece];
}

function breakParagraph(paragraph: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of paragraph.split(/\s+/).filter((w) => w !== '')) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line !== '') lines.push(line);
    const pieces = measure(word) <= maxWidth ? [word] : splitWord(word, maxWidth, measure);
    lines.push(...pieces.slice(0, -1));
    line = pieces.at(-1) ?? '';
  }
  return line !== '' || lines.length === 0 ? [...lines, line] : lines;
}

/**
 * Greedy line breaking: words fill each line up to `maxWidth`; a newline starts a new line; a word wider than a whole
 * line is cut between characters. Runs of spaces collapse. An empty paragraph gives one empty line.
 */
export function breakLines(text: string, maxWidth: number, measure: Measure): string[] {
  return text.split('\n').flatMap((paragraph) => breakParagraph(paragraph, maxWidth, measure));
}

/** How one block sets at scale 1: font size, line height (a multiple of the size), space above and box padding. */
export interface BlockStyle {
  readonly sizePx: number;
  readonly lineHeight: number;
  /** Space above the block, except at the top of a column. */
  readonly gapBeforePx: number;
  /** Inner padding of the block's box on every side; 0 for text without a box. */
  readonly padPx: number;
}
export interface LayoutBlock {
  readonly text: string;
  readonly style: BlockStyle;
}
/** The rectangle blocks flow into, top to bottom, then into the next column. */
export interface TextFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly columns: number;
  readonly columnGapPx: number;
}
/** A block as set: its box, its lines and the scaled type values the painter draws with. */
export interface PlacedBlock {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly lines: readonly string[];
  readonly sizePx: number;
  readonly lineHeightPx: number;
  readonly padPx: number;
}
export interface BlockLayout {
  readonly scale: number;
  /** False when the blocks run past the last column's foot even at this scale. */
  readonly fits: boolean;
  readonly blocks: readonly PlacedBlock[];
}
/** A measure for block `index` at font size `sizePx` (the painter sets that block's font first). */
export type MeasureAt = (index: number, sizePx: number) => Measure;

/** Sets the blocks into the frame at `scale` (sizes, gaps and padding scale; the frame does not). */
export function layoutBlocks(blocks: readonly LayoutBlock[], frame: TextFrame, measureAt: MeasureAt, scale = 1): BlockLayout {
  const columnWidth = (frame.width - (frame.columns - 1) * frame.columnGapPx) / frame.columns;
  const placed: PlacedBlock[] = [];
  let column = 0;
  let y = 0;
  let fits = true;
  blocks.forEach(({ text, style }, index) => {
    const sizePx = style.sizePx * scale;
    const padPx = style.padPx * scale;
    const lineHeightPx = sizePx * style.lineHeight;
    const lines = breakLines(text, columnWidth - 2 * padPx, measureAt(index, sizePx));
    const height = lines.length * lineHeightPx + 2 * padPx;
    let gap = y === 0 ? 0 : style.gapBeforePx * scale;
    if (y + gap + height > frame.height && y > 0 && column < frame.columns - 1) {
      column += 1;
      y = 0;
      gap = 0;
    }
    const x = frame.x + column * (columnWidth + frame.columnGapPx);
    placed.push({ index, x, y: frame.y + y + gap, width: columnWidth, height, lines, sizePx, lineHeightPx, padPx });
    y += gap + height;
    if (y > frame.height + 1e-6) fits = false;
  });
  return { scale, fits, blocks: placed };
}

/** Scale steps tried by `fitBlocks`, from full size down. */
const FIT_STEP = 0.05;

/**
 * The layout at the largest scale, in steps of 0.05 from 1 down to `minScale`, at which every block fits the frame;
 * at `minScale` (with `fits` false) when none does, so the caller can see the overflow rather than lose text silently.
 */
export function fitBlocks(blocks: readonly LayoutBlock[], frame: TextFrame, measureAt: MeasureAt, minScale = 0.5): BlockLayout {
  for (let step = 0; 1 - step * FIT_STEP >= minScale - 1e-9; step += 1) {
    const layout = layoutBlocks(blocks, frame, measureAt, 1 - step * FIT_STEP);
    if (layout.fits) return layout;
  }
  return layoutBlocks(blocks, frame, measureAt, minScale);
}
