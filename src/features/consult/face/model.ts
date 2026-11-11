/**
 * The face card step's pure rules: what the step shows for the main photo (its card,
 * still reading, or why it cannot be read), the portrait drawn from the card, the parts Move the lines moves, when the hair
 * outline is unsure, the colour hints and the extras' status. The screen renders these; it never decides the flow.
 */
import type { ShadeIndexEntry } from '../../../domain/content/output.ts';
import type { FactKey, Facts } from '../../../domain/facts/registry.ts';
import { fromExport, toExport, type ExportPlacement, type Point, type Size } from '../../../domain/geometry/coords.ts';
import { colourHints } from '../../../domain/measure/colour.ts';
import { cheekWidthPx, isFullMesh, meshOf } from '../../../domain/measure/geometry.ts';
import { POINT } from '../../../domain/measure/landmarks.ts';
import type { LandmarkEdits, PhotoMeasurements } from '../../../domain/measure/measure.ts';
import type { Lab, PhotoObservation } from '../../../domain/measure/observation.ts';
import { pickFace } from '../../../domain/measure/quality.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import { buildFaceCard, FACE_CARD_LAYOUT, photoCrop, type CardFact, type FaceCard, type LabelId } from '../../../domain/render-model/face-card.ts';
import { isUsable } from '../../../machine/consult.selectors.ts';
import type { ConsultContent, ConsultContext, PhotoEntry } from '../../../machine/consult.types.ts';
import type { PainterItem } from '../../../platform/render/painter.ts';
import type { ExtraModel } from '../../../worker/protocol.ts';

// ── What the step shows ──

/** The main photo's entry, if any. */
export const mainEntry = (c: Pick<ConsultContext, 'photos' | 'mainPhotoId'>): PhotoEntry | undefined =>
  c.photos.find((p) => p.id === c.mainPhotoId);

/** A main photo that is usable, with its observation. */
export type MeasuredEntry = PhotoEntry & { readonly observation: PhotoObservation };
/** The entry is a main photo that is usable, with its observation. */
export const isMeasured = (e: PhotoEntry | undefined): e is MeasuredEntry => e !== undefined && isUsable(e) && e.observation !== null;

/** Why the main photo gives no card, each said in one sentence with one way on. */
export type UnreadReason = 'none_read' | 'no_face' | 'turned' | 'several_faces' | 'decode_failed' | 'out_of_memory' | 'failed';
/** `ready`: there are facts to state; `waiting`: the main photo is still to be read; `unread`: there is nothing to state, and why. */
export type FaceState = { readonly kind: 'ready' | 'waiting' } | { readonly kind: 'unread'; readonly reason: UnreadReason };

/** What the step shows for the main photo, from its card facts and measurements; every outcome has a screen, so the step never waits. */
export function faceState(c: ConsultContext, m: PhotoMeasurements | null, facts: readonly CardFact[]): FaceState {
  if (facts.length > 0) return { kind: 'ready' };
  const main = mainEntry(c);
  // The main photo always leads the analysis queue, so a queued one is being read or next.
  if (main?.status === 'queued') return { kind: 'waiting' };
  return { kind: 'unread', reason: main ? unreadReason(main, m, c.photos.every((p) => p.status === 'failed')) : 'none_read' };
}

/** Why one photo that is not still read gives no facts; a failure with a way round names it, any other says what comes instead. */
function unreadReason(main: PhotoEntry, m: PhotoMeasurements | null, noneRead: boolean): UnreadReason {
  if (main.status === 'failed' && (main.error === 'decode_failed' || main.error === 'out_of_memory')) return main.error;
  if (main.status === 'failed') return noneRead ? 'none_read' : 'failed';
  if (!m || m.lines.length === 0) return 'no_face';
  if (m.issues.includes('several_faces')) return 'several_faces';
  return m.view === 'frontal' ? 'failed' : 'turned';
}

/** The main photo's face card, exactly what the export paints; null without a usable, measured photo or any fact to state. */
export function cardOf(entry: PhotoEntry | undefined, measurements: PhotoMeasurements | null, facts: readonly CardFact[], date: Date): FaceCard | null {
  if (!entry?.observation || !isUsable(entry) || !measurements) return null;
  const hair = entry.refined?.measures ?? entry.observation.hair;
  const card = buildFaceCard({ image: entry.observation.image, measurements, hairExtent: hair?.extent ?? null, facts, date }, SHOWN);
  return card.ok ? card.value : null;
}

// ── The portrait: the top of the card, without its labels ──

const { arch: ARCH } = FACE_CARD_LAYOUT;
/** The window on the card the screen draws: the arch with its own margin on every side. */
const WINDOW = { x: ARCH.x - ARCH.y, y: 0, width: ARCH.width + 2 * ARCH.y, height: ARCH.height + 2 * ARCH.y };
/** The portrait's size in card px. */
export const PORTRAIT_SIZE: Size = { widthPx: WINDOW.width, heightPx: WINDOW.height };
const inWindow = <T extends Point>(p: T): T => ({ ...p, x: p.x - WINDOW.x, y: p.y - WINDOW.y });

/** The card's photo, arch, lines and ticks moved into the portrait's window; labels and words are the screen's to say. */
export const screenItems = (card: FaceCard): PainterItem[] =>
  card.items.flatMap((i): PainterItem[] => {
    switch (i.type) {
      case 'arch':
        return [{ ...i, rect: inWindow(i.rect) }];
      case 'ground':
        if (i.tone === 'panel') return [];
        return [{ ...i, rect: i.tone === 'page' ? { x: 0, y: 0, width: WINDOW.width, height: WINDOW.height } : inWindow(i.rect) }];
      case 'photo':
        return [{ ...i, placement: { ...i.placement, area: inWindow(i.placement.area) } }];
      case 'line':
        return [{ ...i, points: i.points.map(inWindow) }];
      case 'tick':
        return [{ ...i, at: inWindow(i.at) }];
      case 'label':
      case 'text':
        return [];
    }
  });

/** The names of the features the card draws, in drawing order and each once (the brows share one): its picture's one sentence. */
export function drawnNames(card: FaceCard): string[] {
  const names = new Map(card.items.flatMap((i) => (i.type === 'label' ? [[i.id, i.text] as const] : [])));
  const ids = card.items.flatMap((i): string[] => (i.type === 'line' ? [i.id === 'brow_right' || i.id === 'brow_left' ? 'brows' : i.id] : []));
  return [...new Set(ids)].flatMap((id) => names.get(id as LabelId) ?? []);
}

// ── Move the lines ──

/** Move the lines' stage: the card's 4:5 shape, filled by the face. */
export const MOVE_SIZE: Size = { widthPx: 2160, heightPx: 2700 };
/** Space kept around the face lines on the stage, as a share of their larger side. */
const MOVE_MARGIN_SHARE = 0.15;

/**
 * The stage's view of the photo: the face lines (the hairline included) filling it with a margin. It is worked out once when
 * the sheet opens, so the photo never shifts under a dragged dot.
 */
export function movePlacement(card: FaceCard, image: Size): ExportPlacement {
  const points = card.items.flatMap((i) => (i.type === 'line' ? i.points.map((p) => fromExport(p, card.placement)) : []));
  const [xs, ys] = [points.map((p) => p.x), points.map((p) => p.y)];
  const [x, y] = [Math.min(...xs), Math.min(...ys)];
  const keep = { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  const crop = photoCrop(image, [keep], MOVE_SIZE.widthPx / MOVE_SIZE.heightPx, MOVE_MARGIN_SHARE);
  return { crop, area: { x: 0, y: 0, width: MOVE_SIZE.widthPx, height: MOVE_SIZE.heightPx } };
}

/** The card's photo, lines and ticks moved into `placement` on a neutral ground: the stage's drawing. */
export function inPlacement(card: FaceCard, placement: ExportPlacement): PainterItem[] {
  const move = (p: Point): Point => toExport(fromExport(p, card.placement), placement);
  const ground: PainterItem = { type: 'ground', rect: placement.area, tone: 'neutral' };
  return [ground, ...card.items.flatMap((i): PainterItem[] => {
    if (i.type === 'photo') return [{ ...i, placement }];
    if (i.type === 'line') return [{ ...i, points: i.points.map(move) }];
    return i.type === 'tick' ? [{ ...i, at: move(i.at) }] : [];
  })];
}

/** The six parts a person can name and move: the hairline as one line, the chin, and the cheeks and jaw corners. */
export const PARTS = ['hairline', 'chin', 'cheek_left', 'cheek_right', 'jaw_left', 'jaw_right'] as const;
export type Part = (typeof PARTS)[number];
/** A part, what it moves (a mesh point or the hairline) and where its dot is now, normalised in the oriented image. */
export interface PlacedPart {
  readonly part: Part;
  readonly moves: number | 'hairline';
  readonly at: Point;
}

/**
 * The dots of the face `measure()` reads, with the edits applied. Left and right are as the photo shows them: MediaPipe names
 * the person's own sides, which swap in a mirrored selfie, so each pair is ordered by where its points are. The hairline's dot
 * sits on its line nearest the face's middle, and only when a hairline is drawn.
 */
export function placedParts(o: PhotoObservation, m: PhotoMeasurements, edits: LandmarkEdits | null): PlacedPart[] {
  const moved = edits?.points ?? {};
  const face = pickFace(o.faces.filter((f) => isFullMesh(f.landmarks)), (f) => cheekWidthPx(meshOf(f.landmarks, o.image, moved)))?.face;
  if (!face) return [];
  const at = (index: number): Point => moved[index] ?? { x: face.landmarks[index * 3] ?? 0, y: face.landmarks[index * 3 + 1] ?? 0 };
  const pair = (a: number, b: number): readonly [number, number] => (at(a).x <= at(b).x ? [a, b] : [b, a]);
  const [cheekLeft, cheekRight] = pair(POINT.cheekRight, POINT.cheekLeft);
  const [jawLeft, jawRight] = pair(POINT.jawRight, POINT.jawLeft);
  const middle = m.face?.x ?? 0.5;
  const hairline = (m.lines.find((l) => l.id === 'hairline')?.points ?? []).reduce<Point | null>((best, p) => (best === null || Math.abs(p.x - middle) < Math.abs(best.x - middle) ? p : best), null);
  const point = (part: Part, index: number): PlacedPart => ({ part, moves: index, at: at(index) });
  return [
    ...(hairline ? [{ part: 'hairline', moves: 'hairline', at: hairline } as const] : []),
    point('chin', POINT.menton), point('cheek_left', cheekLeft), point('cheek_right', cheekRight), point('jaw_left', jawLeft), point('jaw_right', jawRight),
  ];
}

/** An arrow button's direction; the hairline and chin move up and down only. */
export type Nudge = 'up' | 'down' | 'left' | 'right';
export const nudgesOf = (part: Part): readonly Nudge[] => (part === 'hairline' || part === 'chin' ? ['up', 'down'] : ['up', 'down', 'left', 'right']);
/** One nudge moves a dot 0.4% of the photo's long side (about 6 px of a 1400 px analysis image) in either axis. */
const NUDGE_SHARE = 0.004;
const STEP: Readonly<Record<Nudge, Point>> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

/** A point kept inside the photo. */
export const clampUnit = (p: Point): Point => ({ x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) });

/** `p` nudged one step, the same distance in px on both axes. */
export function nudged(p: Point, nudge: Nudge, image: Size): Point {
  const step = NUDGE_SHARE * Math.max(image.widthPx, image.heightPx);
  const d = STEP[nudge];
  return clampUnit({ x: p.x + (d.x * step) / image.widthPx, y: p.y + (d.y * step) / image.heightPx });
}

/** The hairline moved as one line: every point by the dot's change in height, so its shape stays the mask's. */
export const shiftedHairline = (hairline: readonly Point[], from: Point, to: Point): Point[] => hairline.map((p) => clampUnit({ x: p.x, y: p.y + to.y - from.y }));

/** The nearest dot within `tolerancePx` of a card-px position (a press on the stage), as an index into `parts`. */
export function nearestPart(parts: readonly PlacedPart[], at: Point, placement: ExportPlacement, tolerancePx: number): number | null {
  let best: { readonly i: number; readonly d: number } | null = null;
  for (const [i, p] of parts.entries()) {
    const c = toExport(p.at, placement);
    const d = Math.hypot(c.x - at.x, c.y - at.y);
    if (d <= tolerancePx && (best === null || d < best.d)) best = { i, d };
  }
  return best?.i ?? null;
}

// ── Refine my hair outline, and the extras ──

const BIG_CURLS: ReadonlySet<string> = new Set(['curly', 'coily', 'mixed']);

/**
 * "Refine my hair outline" is offered when the automatic outline is unsure (big curls, fringes): no outline was
 * found, the hairline does not show (a fringe or a covering), or the person said their hair is curly, coily or mixed.
 */
export function outlineUnsure(entry: PhotoEntry, m: PhotoMeasurements, facts: Facts): boolean {
  const texture = facts['hair.texture']?.value;
  return !entry.observation?.hair?.extent || !m.hairlineVisible || (texture !== undefined && BIG_CURLS.has(texture));
}

/** The ONNX Runtime on the wire, 6.8 MB gzip: the first extra used brings it. */
const RUNTIME_WIRE_MB = 6.8;
/**
 * Each extra's int8 files as the manifest lists them (a unit test holds them to it). Tap-to-select is 62.0 MB: its
 * weights are 61.2 MB and its two graph files add 0.7 MB.
 */
export const MODEL_MB: Readonly<Record<ExtraModel, number>> = { depth: 27.3, sam: 62 };
/** An extra's first download: its model plus the runtime. */
export const firstUseMb = (model: ExtraModel): number => MODEL_MB[model] + RUNTIME_WIRE_MB;

// ── Colour hints ──

/** The colour hints the step lists. */
export interface ColourReadings {
  /** The library shade nearest to the hair sample, with the sample's swatch. */
  readonly hair: { readonly swatch: string; readonly shade: ShadeIndexEntry } | null;
  /** The skin-depth answer the photo suggests, in the question's own words. */
  readonly skin: { readonly swatch: string; readonly label: string } | null;
  /** The person's own undertone answer, never read from the photo. */
  readonly undertone: string | null;
}

/** The label of the option that writes `value` to `fact`, in the questions file's own words. */
function optionLabel(content: ConsultContent, fact: FactKey, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const question = content.consult.questions.questions.find((q) => q.fact === fact);
  const option = question?.options.find((o) => 'value' in o && o.value === value);
  return option?.label ?? null;
}

/** A content Lab triple as the measured samples hold it. */
const labOf = ([l, a, b]: readonly [number, number, number]): Lab => ({ l, a, b });

/** The colour hints of one photo and the undertone answer; every part is null when it is not known. */
export function colourReadings(o: PhotoObservation, facts: Facts, content: ConsultContent): ColourReadings {
  const shades = content.library.entries.filter((e): e is ShadeIndexEntry => e.kind === 'shade');
  const hints = o.hair ? colourHints(o.hair.colour, shades.map((s) => ({ value: s, lab: labOf(s.lab.mids.mid) }))) : null;
  const skinLabel = hints?.skin ? optionLabel(content, 'look.skin_depth', hints.skin.depth) : null;
  return {
    hair: hints?.hair?.nearest ? { swatch: hints.hair.swatch, shade: hints.hair.nearest } : null,
    skin: hints?.skin && skinLabel !== null ? { swatch: hints.skin.swatch, label: skinLabel } : null,
    undertone: optionLabel(content, 'look.undertone', facts['look.undertone']?.value),
  };
}
