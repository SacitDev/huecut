/**
 * Token tests: the face card panel's text against its ground in both themes, as tokens.css sets
 * them; the mirror trace, outline 700 ms then the features 300 ms each 80 ms apart, labels pin 160 ms, capped
 * at 1.6 s, complete at once under reduced motion; CSS times parsed.
 */
import { expect, it } from 'vitest';
import { LINE_IDS } from '../../domain/measure/measure.ts';
import { parseMs, progressAt, traceSchedule, type TraceTiming } from './tokens.ts';

const node = (globalThis as unknown as {
  process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } };
}).process;
const CSS = node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/src/ui/tokens.css`, 'utf8');
/** A colour token's hex value in the block that opens with `selector`. */
function token(selector: string, name: string): string {
  const start = CSS.indexOf(selector);
  const value = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(CSS.slice(start, CSS.indexOf('}', start)))?.[1];
  if (start < 0 || value === undefined) throw new Error(`${name} under ${selector}`);
  return value;
}
/** WCAG 2 contrast of two sRGB hex colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r = 0, g = 0, bl = 0] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

it('sets the face card panel\'s words, cream and rose on cocoa, at 4.5:1 or more in both themes', () => {
  for (const theme of [':root {', ":root[data-theme='dark'] {"]) {
    const ground = token(theme, '--primary');
    expect(contrast(token(theme, '--on-primary'), ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(theme, '--rose-soft'), ground)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 6);
});

/** The values of tokens.css. */
const B: TraceTiming = { outlineMs: 700, featureMs: 300, staggerMs: 80, pinMs: 160, capMs: 1600 };
const REDUCED: TraceTiming = { outlineMs: 0, featureMs: 0, staggerMs: 0, pinMs: 0, capMs: 0 };

it('reads CSS times in ms and s, and 0 for anything unreadable', () => {
  expect(parseMs('700ms')).toBe(700);
  expect(parseMs(' 160ms ')).toBe(160);
  expect(parseMs('0.7s')).toBe(700);
  expect(parseMs('0ms')).toBe(0);
  expect(parseMs('12')).toBe(12);
  expect(parseMs('')).toBe(0);
  expect(parseMs('none')).toBe(0);
});

it('draws the outline first, then each feature 80 ms after the last (brows together, jaw with chin), then pins', () => {
  const s = traceSchedule(LINE_IDS, B);
  const at = (id: (typeof LINE_IDS)[number]) => s.lines.get(id);
  expect(at('face_outline')).toEqual({ start: 0, duration: 700 });
  expect(at('hairline')).toEqual({ start: 700, duration: 300 });
  expect(at('brow_right')).toEqual({ start: 780, duration: 300 });
  expect(at('brow_left')).toEqual({ start: 780, duration: 300 });
  expect(at('eye_line')?.start).toBe(860);
  expect(at('nose_width')?.start).toBe(940);
  expect(at('lip_line')?.start).toBe(1020);
  expect(at('jaw')).toEqual({ start: 1100, duration: 300 });
  expect(at('chin')).toEqual({ start: 1100, duration: 300 });
  expect(s.pin).toEqual({ start: 1400, duration: 160 });
  expect(s.totalMs).toBe(1560);
});

it('compresses a longer schedule evenly to the 1.6 s cap, keeping its order', () => {
  const s = traceSchedule(LINE_IDS, { ...B, staggerMs: 200 });
  expect(s.totalMs).toBeCloseTo(1600, 9);
  const k = 1600 / (700 + 5 * 200 + 300 + 160);
  expect(s.lines.get('face_outline')?.duration).toBeCloseTo(700 * k, 9);
  expect(s.lines.get('jaw')?.start).toBeCloseTo((700 + 5 * 200) * k, 9);
  expect(s.pin.start + s.pin.duration).toBeCloseTo(1600, 9);
});

it('is complete at once under reduced motion: every token 0, every line and the pin at full progress from 0 ms', () => {
  const s = traceSchedule(LINE_IDS, REDUCED);
  expect(s.totalMs).toBe(0);
  for (const id of LINE_IDS) expect(progressAt(s.lines.get(id), 0)).toBe(1);
  expect(progressAt(s.pin, 0)).toBe(1);
});

it('starts the features at 0 without an outline, and runs each span from 0 to 1', () => {
  const s = traceSchedule(['eye_line', 'lip_line'], B);
  expect(s.lines.get('eye_line')).toEqual({ start: 0, duration: 300 });
  expect(s.lines.get('lip_line')).toEqual({ start: 80, duration: 300 });
  const span = { start: 100, duration: 200 };
  expect(progressAt(span, 50)).toBe(0);
  expect(progressAt(span, 200)).toBe(0.5);
  expect(progressAt(span, 400)).toBe(1);
  expect(progressAt(span, null)).toBe(1);
  expect(progressAt(undefined, 0)).toBe(1);
});
