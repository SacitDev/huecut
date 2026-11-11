/**
 * What the painter reads from the theme at paint time: colours, fonts and the mirror trace's durations from tokens.css custom
 * properties, so the canvas follows the theme and reduced motion (whose durations are 0) and holds no raw colour of its own; plus
 * the trace's schedule.
 */
import type { LineId } from '../../domain/measure/measure.ts';

/** The colours the painter uses, by the token that holds each. */
const COLOURS = {
  ground: '--ground',
  surface: '--surface',
  text: '--text',
  text2: '--text-2',
  accent: '--accent',
  rose: '--rose-soft',
  primary: '--primary',
  onPrimary: '--on-primary',
  neutral: '--neutral-grey',
  placeholder: '--picture-placeholder',
  core: '--fc-core',
  casing: '--fc-casing',
  tag: '--fc-tag',
  tagText: '--fc-tag-text',
} as const;
export type Colour = keyof typeof COLOURS;

const TIMING = {
  outlineMs: '--dur-draw-outline',
  featureMs: '--dur-draw-feature',
  staggerMs: '--dur-draw-stagger',
  pinMs: '--dur-draw-pin',
  capMs: '--dur-draw-cap',
} as const;
export type TraceTiming = Readonly<Record<keyof typeof TIMING, number>>;

export interface PainterTokens {
  readonly colours: Readonly<Record<Colour, string>>;
  /** CSS font families: Bricolage Grotesque for display, Figtree for text. */
  readonly fonts: { readonly display: string; readonly text: string };
  readonly timing: TraceTiming;
  /** The scale a label pins from (0.96; 1 under reduced motion). */
  readonly pinScale: number;
}

const mapValues = <K extends string, V>(names: Readonly<Record<K, string>>, read: (name: string) => V): Record<K, V> =>
  Object.fromEntries(Object.entries<string>(names).map(([key, name]) => [key, read(name)])) as Record<K, V>;

/** A CSS time (`700ms`, `0.7s`) in ms; 0 when unset or unreadable. */
export function parseMs(value: string): number {
  const v = value.trim();
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return 0;
  return v.endsWith('ms') || !v.endsWith('s') ? n : n * 1000;
}

/** The theme's tokens as `element` sees them now (light, dark, reduced motion, from the device or from Settings). */
export function readTokens(element: Element): PainterTokens {
  const style = getComputedStyle(element);
  const read = (name: string): string => style.getPropertyValue(name).trim();
  const pinScale = Number.parseFloat(read('--pin-scale'));
  return {
    colours: mapValues(COLOURS, read),
    fonts: { display: read('--font-display'), text: read('--font-text') },
    timing: mapValues(TIMING, (name) => parseMs(read(name))),
    pinScale: Number.isFinite(pinScale) ? pinScale : 1,
  };
}

/** When something starts and how long it takes, in ms from the start of the trace. */
export interface Span {
  readonly start: number;
  readonly duration: number;
}
export interface TraceSchedule {
  readonly lines: ReadonlyMap<LineId, Span>;
  /** Labels and ticks pin together after the last line. */
  readonly pin: Span;
  readonly totalMs: number;
}
/** Lines that draw as one feature: the two brows, and jaw with chin (one item among the face values). */
const SAME_FEATURE: Readonly<Partial<Record<LineId, LineId>>> = { brow_left: 'brow_right', chin: 'jaw' };

/**
 * The mirror trace: the face outline as one stroke, then each feature starting a stagger
 * after the one before, then the labels pin. A schedule longer than the cap is compressed evenly to it (1.6 s), so the
 * order and proportions stay; under reduced motion every token is 0 and the drawing is complete at once.
 */
export function traceSchedule(ids: readonly LineId[], t: TraceTiming): TraceSchedule {
  const featureOf = (id: LineId): LineId => SAME_FEATURE[id] ?? id;
  const features = [...new Set(ids.filter((id) => id !== 'face_outline').map(featureOf))];
  const featuresAt = ids.includes('face_outline') ? t.outlineMs : 0;
  const linesEnd = features.length > 0 ? featuresAt + (features.length - 1) * t.staggerMs + t.featureMs : featuresAt;
  const natural = linesEnd + t.pinMs;
  const k = natural > t.capMs ? t.capMs / natural : 1;
  const span = (start: number, duration: number): Span => ({ start: start * k, duration: duration * k });
  const lineSpan = (id: LineId): Span =>
    id === 'face_outline' ? span(0, t.outlineMs) : span(featuresAt + features.indexOf(featureOf(id)) * t.staggerMs, t.featureMs);
  return { lines: new Map(ids.map((id) => [id, lineSpan(id)])), pin: span(linesEnd, t.pinMs), totalMs: natural * k };
}

/** How far a span has run at `at` ms, from 0 to 1; a null `at`, or no span, is the finished drawing. */
export function progressAt(span: Span | undefined, at: number | null): number {
  if (at === null || span === undefined) return 1;
  if (span.duration <= 0) return at >= span.start ? 1 : 0;
  return Math.min(1, Math.max(0, (at - span.start) / span.duration));
}
