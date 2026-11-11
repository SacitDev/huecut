/**
 * What the face card says, and its painter items: `cardFacts` is the one source of the card's words for the screen, the saved card
 * and the explain prompt. The card is 2160 x 2700 (4:5): the photo in its arch with the lines and their labels in two columns
 * beside it, a panel with the facts in full-width rows, the footer.
 */
import type { Bands } from '../content/types.ts';
import { meetsMin, type Confidence, type Facts } from '../facts/registry.ts';
import { CARD_PX, toExport, type ExportPlacement, type Point, type Rect, type Size } from '../geometry/coords.ts';
import { bandValue } from '../measure/bands.ts';
import type { FaceLine, LineId, MeasureKey, PhotoMeasurements, TickId } from '../measure/measure.ts';
import type { HairMeasures } from '../measure/observation.ts';
import { UNREADABLE } from '../measure/quality.ts';
import { err, ok, type Result } from '../result.ts';
import { EN, type Copy, type NoteCopy, type NoteFact, type Sureness } from './copy.ts';

/** How an export is saved: JPEG 0.92 at 2160 x 2700 with a photo or picture on it, no EXIF. */
export interface ExportSpec { readonly widthPx: number; readonly heightPx: number; readonly mime: 'image/jpeg'; readonly quality: number }
export const JPEG_EXPORT: ExportSpec = { ...CARD_PX, mime: 'image/jpeg', quality: 0.92 };

/** Card layout in card px. The arch is decoration behind the photo, never a clip over hair. */
export const FACE_CARD_LAYOUT = {
  arch: { x: 620, y: 48, width: 920, height: 912 },
  photo: { x: 720, y: 128, width: 720, height: 832 },
  panel: { x: 0, y: 1000, width: 2160, height: 1560 },
  text: { x: 120, y: 1072, width: 1920, height: 1428 },
  footer: { x: 120, y: 2584, width: 1920, height: 100 },
} as const satisfies Record<string, Rect>;
/** Space kept around the hair and face, as a share of their larger side. */
export const CROP_MARGIN_SHARE = 0.12;
/** Labels sit this far from the photo, in two columns that never reach the card's edge. */
const LABEL_GAP_PX = 36;
const CARD_MARGIN_PX = 72;
/** A label row: a 52 px tag (about 73 px tall) and room to tell it from the next. */
const LABEL_ROW_PX = 110;
const TICK_LENGTH_PX = 28;

/** The card's topics, in their order. */
export const NOTE_FACTS: readonly NoteFact[] = ['face.proportion', 'face.forehead_share', 'face.lower_share', 'face.jaw_vs_cheek'];

const percent = (share: number): number => Math.round(share * 100);
/** Each topic's numbers from the photo's own values, as its sentence shows them. */
const NOTE_NUMBERS: Readonly<Record<NoteFact, (at: (key: MeasureKey) => number) => number[]>> = {
  'face.proportion': (at) => [at('length_to_width')],
  'face.forehead_share': (at) => [percent(at('third_upper')), percent(at('third_middle'))],
  'face.lower_share': (at) => [percent(at('third_lower'))],
  'face.jaw_vs_cheek': (at) => [percent(at('jaw_to_cheek'))],
};

/** One topic of the card. It states what this photo shows, relative to the person's own face. */
export interface CardFact {
  readonly fact: NoteFact;
  readonly name: string;
  /** What the photo shows, in words that follow the topic ("a little longer than it is wide"), or "cannot read reliably". */
  readonly words: string;
  /** The words as one sentence: "In this photo, your face is a little longer than it is wide". */
  readonly title: string;
  /** One neutral line on what hair does; null when nothing can be stated. */
  readonly hair: string | null;
  /** The number and its word of sureness; null when a number would be false. */
  readonly number: string | null;
  readonly sureness: Sureness | 'cannot_read';
  /** The reading sits on the boundary of two values. It says nothing about how sure the number is. */
  readonly between: boolean;
  /** "Length and width: a little longer than it is wide": the saved card's lead line and a prompt's short form. */
  readonly brief: string;
}

const surenessOf = (fact: NoteFact, confidence: Confidence): Sureness =>
  !meetsMin(fact, confidence) ? 'rough' : confidence === 'high' ? 'steady' : 'estimate';
const capitalised = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/**
 * What the card says, read from the main photo's own measurements before any engine filter. The main photo and not the fused
 * values: the card pictures that photo, says "in this photo", draws its lines, and a moved line must change its number. The
 * engine alone reads the fused values, so with several photos the two can differ and both stay true. Nothing is said of a
 * photo that may show someone else; no facts means no card.
 */
export function cardFacts(m: PhotoMeasurements, bands: Bands, copy: Pick<Copy, 'faceCard' | 'faceNotes'> = EN): CardFact[] {
  if (m.issues.includes('several_faces')) return [];
  const c = copy.faceCard;
  const unreadable = m.issues.some((i) => UNREADABLE.includes(i));
  const at = (key: MeasureKey): number => m.values[key]?.value ?? Number.NaN;
  return NOTE_FACTS.flatMap((fact): CardFact[] => {
    const band = bands.bands.find((b) => b.fact === fact);
    const reading = band && m.values[band.from as MeasureKey];
    const read = band && reading ? bandValue(band, reading.value, reading.confidence) : null;
    const topic = copy.faceNotes[fact];
    const values: Readonly<Record<string, NoteCopy>> = topic.values;
    const own = read ? values[read.value] : undefined;
    if (!reading || !read || !own) return [];
    const said = { fact, name: topic.name, between: false };
    if (unreadable) return [{ ...said, words: c.cannotRead, title: capitalised(c.cannotRead), hair: null, number: null, sureness: 'cannot_read', brief: `${topic.name}: ${c.cannotRead}` }];
    const sureness = surenessOf(fact, reading.confidence);
    const number = topic.number(...NOTE_NUMBERS[fact](at));
    // A reading on a boundary says only its own value: its number and its word of sureness carry how close it is.
    return [{
      ...said, words: own.words, title: topic.says(own.words), hair: own.hair, number: `${number}, ${c.sureness[sureness]}`, sureness,
      between: read.between !== null && values[read.between] !== undefined, brief: `${topic.name}: ${own.words}`,
    }];
  });
}

/** A fact as sentences: what the photo shows and what hair does. */
export const factSentences = (f: CardFact): string => (f.hair === null ? `${f.brief}.` : `${f.title}. ${f.hair}`);

/** The engine's own view of the face for a prompt about its picks: one note per fused fact that meets its minimum, in `NOTE_FACTS` order. */
export function faceNotes(facts: Facts, copy: Pick<Copy, 'faceNotes'> = EN): { readonly fact: NoteFact; readonly brief: string }[] {
  return NOTE_FACTS.flatMap((key) => {
    const fact = facts[key];
    if (!fact || !meetsMin(key, fact.confidence)) return [];
    const topic = copy.faceNotes[key];
    const words = (topic.values as Readonly<Record<string, NoteCopy>>)[fact.value];
    return words ? [{ fact: key, brief: `${topic.name}: ${words.words}` }] : [];
  });
}

/** The card's labels: one per drawn feature, the two brows sharing one. */
export type LabelId = Exclude<LineId, 'brow_right' | 'brow_left'> | 'brows';
const LABEL_SIDE: Readonly<Record<LabelId, 'left' | 'right'>> = {
  face_outline: 'left', hairline: 'right', brows: 'left', eye_line: 'right', nose_width: 'left', lip_line: 'right', jaw: 'left', chin: 'right',
};
const labelOf = (id: LineId): LabelId => (id === 'brow_right' || id === 'brow_left' ? 'brows' : id);

export interface TextBlock { readonly role: 'heading' | 'qualifier' | 'fact' | 'hair' | 'number' | 'footer' | 'date' | 'app' | 'link'; readonly text: string }
/** Painter items, in drawing order; points and rects are card px except the photo crop (normalised). */
export type FaceCardItem =
  | { readonly type: 'ground'; readonly rect: Rect; readonly tone: 'page' | 'neutral' | 'panel' }
  | { readonly type: 'arch'; readonly rect: Rect }
  | { readonly type: 'photo'; readonly placement: ExportPlacement }
  | { readonly type: 'line'; readonly id: LineId; readonly points: readonly Point[]; readonly closed: boolean }
  | { readonly type: 'tick'; readonly id: TickId; readonly at: Point; readonly lengthPx: number }
  | {
    readonly type: 'label'; readonly id: LabelId; readonly text: string; readonly anchor: Point; readonly align: 'left' | 'right';
    readonly maxWidthPx: number; readonly leaderTo: Point;
  }
  /** Blocks stacked top to bottom inside `rect`; the line breaker wraps them, shrinking all of them together when it must. */
  | { readonly type: 'text'; readonly rect: Rect; readonly blocks: readonly TextBlock[] };

export interface FaceCard {
  readonly size: Size;
  readonly export: ExportSpec;
  /** Where the photo sits; Move the lines starts from it. */
  readonly placement: ExportPlacement;
  readonly items: readonly FaceCardItem[];
}

export interface FaceCardInput {
  /** The oriented analysis image of the main photo. */
  readonly image: Size;
  /** The main photo's measurements: its lines, ticks and close-up flag. */
  readonly measurements: PhotoMeasurements;
  /** The main photo's hair box (the segmenter's, or the refined mask's), normalised; null without a hair mask. */
  readonly hairExtent: HairMeasures['extent'];
  /** What the card says (`cardFacts`). */
  readonly facts: readonly CardFact[];
  readonly date: Date;
}

const bounds = (points: readonly Point[]): Rect => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** One axis of the crop: as much of the photo as possible, but always all of [keepStart, keepEnd]. */
function placeAxis(start: number, size: number, keepStart: number, keepEnd: number, imageSize: number): number {
  const inImage = size <= imageSize ? clamp(start, 0, imageSize - size) : clamp(start, imageSize - size, 0);
  return clamp(inImage, keepEnd - size, keepStart);
}

/**
 * The crop of the oriented image (normalised) that keeps every `keep` box (hair and face) with a margin, extended to
 * `aspect` (width over height) and never shrunk. Where it reaches past the photo the painter shows neutral ground.
 */
export function photoCrop(image: Size, keep: readonly Rect[], aspect: number, marginShare = CROP_MARGIN_SHARE): Rect {
  const px = keep.map((r) => ({ x: r.x * image.widthPx, y: r.y * image.heightPx, width: r.width * image.widthPx, height: r.height * image.heightPx }));
  const u = bounds(px.flatMap((r) => [{ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y + r.height }]));
  const m = marginShare * Math.max(u.width, u.height);
  const box = { x: u.x - m, y: u.y - m, width: u.width + 2 * m, height: u.height + 2 * m };
  const width = Math.max(box.width, box.height * aspect);
  const height = width / aspect;
  const x = placeAxis(box.x + box.width / 2 - width / 2, width, box.x, box.x + box.width, image.widthPx);
  const y = placeAxis(box.y + box.height / 2 - height / 2, height, box.y, box.y + box.height, image.heightPx);
  return { x: x / image.widthPx, y: y / image.heightPx, width: width / image.widthPx, height: height / image.heightPx };
}

type CardLine = FaceLine & { readonly card: readonly Point[] };

/**
 * The labels in two columns beside the photo, so they can never collide and no text touches the picture: each side's labels
 * are spread evenly over the height the face lines take (at least a label row apart, inside the photo's height) in the order
 * of their lines. Each leader goes to the nearest point of its own feature on its label's side of the face's midline (`midX`),
 * so no leader crosses the face; a feature seen on one side only (a hairline under a side fringe) is labelled from that side.
 */
function labels(lines: readonly CardLine[], midX: number, copy: Copy['faceCard']): FaceCardItem[] {
  const area = FACE_CARD_LAYOUT.photo;
  const onSide = (side: 'left' | 'right') => (p: Point): boolean => (side === 'left' ? p.x <= midX : p.x >= midX);
  const features = [...new Set(lines.map((l) => labelOf(l.id)))].flatMap((id) => {
    const all = lines.filter((l) => labelOf(l.id) === id).flatMap((l) => l.card);
    const side = all.some(onSide(LABEL_SIDE[id])) ? LABEL_SIDE[id] : LABEL_SIDE[id] === 'left' ? 'right' : 'left';
    const points = all.filter(onSide(side));
    return points.length === 0 ? [] : [{ id, side, points, y: points.reduce((s, p) => s + p.y, 0) / points.length }];
  });
  const ys = lines.flatMap((l) => l.card.map((p) => p.y));
  const rows = Math.max(...(['left', 'right'] as const).map((side) => features.filter((f) => f.side === side).length));
  const span = Math.min(area.height, Math.max(Math.max(...ys) - Math.min(...ys), rows * LABEL_ROW_PX));
  const top = clamp((Math.min(...ys) + Math.max(...ys) - span) / 2, area.y, area.y + area.height - span);
  return (['left', 'right'] as const).flatMap((side) => {
    const x = side === 'left' ? area.x - LABEL_GAP_PX : area.x + area.width + LABEL_GAP_PX;
    const placed = features.filter((f) => f.side === side).sort((a, b) => a.y - b.y);
    return placed.map((f, i): FaceCardItem => {
      const anchor = { x, y: top + ((i + 0.5) * span) / placed.length };
      const away = (p: Point): number => Math.hypot(p.x - anchor.x, p.y - anchor.y);
      const leaderTo = f.points.reduce((best, p) => (away(p) < away(best) ? p : best));
      return {
        type: 'label', id: f.id, text: copy.lines[f.id], anchor, align: side === 'left' ? 'right' : 'left',
        maxWidthPx: side === 'left' ? x - CARD_MARGIN_PX : CARD_PX.widthPx - CARD_MARGIN_PX - x, leaderTo,
      };
    });
  });
}

/** The panel's words: the heading, a close-up's line, then each fact as a lead line, its hair line and its number. */
function panelBlocks(facts: readonly CardFact[], approximate: boolean, copy: Copy['faceCard']): TextBlock[] {
  return [
    { role: 'heading', text: copy.heading },
    ...(approximate ? [{ role: 'qualifier' as const, text: copy.closeUpLine }] : []),
    ...facts.flatMap((f): TextBlock[] => [
      { role: 'fact', text: f.brief },
      ...(f.hair === null ? [] : [{ role: 'hair' as const, text: f.hair }]),
      ...(f.number === null ? [] : [{ role: 'number' as const, text: f.number }]),
    ]),
  ];
}

/** The face card for the main photo, or `unread` when it has no face lines to draw or no facts to state. */
export function buildFaceCard(input: FaceCardInput, copy: Pick<Copy, 'faceCard' | 'footer'> = EN): Result<FaceCard, 'unread'> {
  const { measurements: m, facts } = input;
  if (m.lines.length === 0 || facts.length === 0) return err('unread');
  const { photo: area, arch, panel, text, footer } = FACE_CARD_LAYOUT;
  const extent = input.hairExtent;
  const keep = [bounds(m.lines.flatMap((l) => l.points)), ...(extent ? [{ x: extent.left, y: extent.top, width: extent.right - extent.left, height: extent.bottom - extent.top }] : [])];
  const placement: ExportPlacement = { crop: photoCrop(input.image, keep, area.width / area.height), area };
  const lines: CardLine[] = m.lines.map((l) => ({ ...l, card: l.points.map((p) => toExport(p, placement)) }));
  // The midline through the cheekbones' centre; without a face centre, the middle of the lines.
  const outline = bounds(lines.flatMap((l) => l.card));
  const midX = m.face ? toExport(m.face, placement).x : outline.x + outline.width / 2;
  const d = input.date;
  const footerText = [copy.faceCard.footerNote, copy.faceCard.date(d.getDate(), copy.faceCard.months[d.getMonth()] ?? '', d.getFullYear()), copy.footer.app, copy.footer.link];
  const items: FaceCardItem[] = [
    { type: 'ground', rect: { x: 0, y: 0, width: CARD_PX.widthPx, height: CARD_PX.heightPx }, tone: 'page' },
    { type: 'arch', rect: arch },
    { type: 'ground', rect: area, tone: 'neutral' },
    { type: 'photo', placement },
    ...lines.map((l): FaceCardItem => ({ type: 'line', id: l.id, points: l.card, closed: l.closed })),
    ...m.ticks.map((t): FaceCardItem => ({ type: 'tick', id: t.id, at: toExport(t.point, placement), lengthPx: TICK_LENGTH_PX })),
    ...labels(lines, midX, copy.faceCard),
    { type: 'ground', rect: panel, tone: 'panel' },
    { type: 'text', rect: text, blocks: panelBlocks(facts, m.approximate, copy.faceCard) },
    { type: 'text', rect: footer, blocks: (['footer', 'date', 'app', 'link'] as const).map((role, i) => ({ role, text: footerText[i] ?? '' })) },
  ];
  return ok({ size: CARD_PX, export: JPEG_EXPORT, placement, items });
}
