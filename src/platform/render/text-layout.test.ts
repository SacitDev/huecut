/**
 * Line breaker tests with fake measures: greedy breaks, newlines, long words cut, every line
 * within the width; blocks stacked with gaps and padding, flowing into columns, and fitted at the largest scale.
 */
import { expect, it } from 'vitest';
import { breakLines, fitBlocks, layoutBlocks, type LayoutBlock, type Measure, type MeasureAt, type TextFrame } from './text-layout.ts';

/** Every character is `k` px wide (the texts here are ASCII). */
const mono = (k = 10): Measure => (t) => t.length * k;
/** A proportional fake: narrow i, l, space and punctuation, wide m and w. */
const proportional: Measure = (t) => {
  let width = 0;
  for (const ch of t) width += /[il .,]/.test(ch) ? 4 : /[mw]/.test(ch) ? 14 : 9;
  return width;
};

it('breaks greedily at spaces, filling each line up to the width', () => {
  expect(breakLines('the quick brown fox jumps', 100, mono())).toEqual(['the quick', 'brown fox', 'jumps']);
  expect(breakLines('the quick brown fox jumps', 90, mono())).toEqual(['the quick', 'brown fox', 'jumps']);
  expect(breakLines('the quick brown fox jumps', 89, mono())).toEqual(['the', 'quick', 'brown', 'fox', 'jumps']);
});

it('starts a new line at a newline, collapses runs of spaces, and keeps an empty paragraph as one empty line', () => {
  expect(breakLines('a b\nc', 100, mono())).toEqual(['a b', 'c']);
  expect(breakLines('  a    b  ', 100, mono())).toEqual(['a b']);
  expect(breakLines('', 100, mono())).toEqual(['']);
  expect(breakLines('a\n\nb', 100, mono())).toEqual(['a', '', 'b']);
});

it('cuts a word wider than a line between characters and carries on after it', () => {
  expect(breakLines('see https://sacitdev.github.io/huecut/ now', 100, mono())).toEqual([
    'see',
    'https://sa',
    'citdev.git',
    'hub.io/hue',
    'cut/ now',
  ]);
});

it('never sets a line wider than the width and loses no character; words stay whole where they fit a line', () => {
  const text = 'Your forehead section is long compared with the rest of your face, so a fringe or a side part would sit nicely.';
  const widest = Math.max(...text.split(' ').map(proportional));
  for (const width of [40, 60, 120, 200, 333, 1000]) {
    const lines = breakLines(text, width, proportional);
    for (const line of lines) expect(proportional(line)).toBeLessThanOrEqual(width);
    expect(lines.join('').replaceAll(' ', '')).toBe(text.replaceAll(' ', ''));
    if (width >= widest) expect(lines.join(' ').split(' ')).toEqual(text.split(' '));
  }
});

const style = (sizePx: number, lineHeight: number, gapBeforePx = 0, padPx = 0) => ({ sizePx, lineHeight, gapBeforePx, padPx });
/** Half the font size per character, so sizes scale widths as real fonts do. */
const halfEm: MeasureAt = (_index, sizePx) => (t) => t.length * sizePx * 0.5;
const frame = (height: number, columns = 1): TextFrame => ({ x: 10, y: 20, width: 100, height, columns, columnGapPx: 20 });

it('stacks blocks with their gaps and padding, the first block at the top of the frame', () => {
  const blocks: LayoutBlock[] = [
    { text: 'Title', style: style(20, 1) },
    { text: 'aaa bbb', style: style(10, 1.5, 5, 4) },
  ];
  const { blocks: placed, fits } = layoutBlocks(blocks, frame(1000), halfEm);
  expect(fits).toBe(true);
  expect(placed[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 20, lines: ['Title'], sizePx: 20, lineHeightPx: 20 });
  expect(placed[1]).toMatchObject({ x: 10, y: 45, height: 23, lines: ['aaa bbb'], padPx: 4 });
});

it('flows into the next column without a gap at its top, and reports text past the last column', () => {
  const blocks = Array.from({ length: 4 }, (): LayoutBlock => ({ text: 'x', style: style(10, 3, 10) }));
  const two = layoutBlocks(blocks, frame(75, 2), halfEm);
  expect(two.blocks.map((b) => [b.x, b.y])).toEqual([[10, 20], [10, 60], [70, 20], [70, 60]]);
  expect(two.blocks[0]?.width).toBe(40);
  expect(two.fits).toBe(true);
  expect(layoutBlocks(blocks, frame(75, 1), halfEm).fits).toBe(false);
});

it('fits at the largest scale, in steps of 0.05, that keeps every block inside; at the minimum otherwise', () => {
  const blocks = Array.from({ length: 5 }, (): LayoutBlock => ({ text: 'word', style: style(20, 1, 0) }));
  const fitted = fitBlocks(blocks, frame(81), halfEm);
  expect(fitted.fits).toBe(true);
  expect(fitted.scale).toBeCloseTo(0.8, 9);
  expect(fitBlocks(blocks, frame(100), halfEm).scale).toBe(1);
  const tooMuch = fitBlocks(blocks, frame(30), halfEm, 0.5);
  expect(tooMuch.fits).toBe(false);
  expect(tooMuch.scale).toBe(0.5);
});
