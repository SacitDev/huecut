/**
 * Test-only check page for tests/e2e/painter.spec.ts (painter-check.html, served by `vite dev`, never a build input):
 * the face card of a fictional face drawn here in code, painted through PainterCanvas, with the exports and pixel
 * probes the spec asserts on. It goes, with painter-check.html, once the painter spec runs on a real screen that mounts the painter.
 */
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/figtree/wght.css';
import '../../src/ui/tokens.css';
import '../../src/ui/base.css';
import { createRoot } from 'react-dom/client';
import { CARD_PX, fromExport } from '../../src/domain/geometry/coords.ts';
import { asPictureId } from '../../src/domain/ids.ts';
import type { FaceLine, LineId, PhotoMeasurements } from '../../src/domain/measure/measure.ts';
import { buildBoard } from '../../src/domain/render-model/board.ts';
import { EN } from '../../src/domain/render-model/copy.ts';
import { buildFaceCard, JPEG_EXPORT, type CardFact, type FaceCard, type FaceCardInput } from '../../src/domain/render-model/face-card.ts';
import { STYLIST_SHEET_LAYOUT, type StylistSheet } from '../../src/domain/render-model/stylist-sheet.ts';
import { boardItems, exportImage, stylistSheetItems } from '../../src/platform/render/export.ts';
import { fontsFor, loadFonts, readTokens, screenPainter, type PaintImage, type PictureRef } from '../../src/platform/render/painter.ts';
import { PainterCanvas } from '../../src/ui/components/PainterCanvas.tsx';

/** The canvas's CSS width: at a device pixel ratio of 2 it is 864 device px, 0.4 device px per card px. */
const STAGE_PX = 432;

const ring = (cx: number, cy: number, rx: number, ry: number): FaceLine['points'] =>
  Array.from({ length: 36 }, (_, i) => ({ x: cx + rx * Math.cos((i / 36) * 2 * Math.PI), y: cy + ry * Math.sin((i / 36) * 2 * Math.PI) }));
const flat = (id: LineId, x0: number, x1: number, y: number): FaceLine => ({ id, points: [{ x: x0, y }, { x: x1, y }], closed: false });
/** A fictional face: an oval outline and straight feature lines, normalised in a 1000 x 1400 picture. */
const LINES: FaceLine[] = [
  { id: 'face_outline', points: ring(0.5, 0.46, 0.14, 0.19), closed: true },
  { id: 'hairline', points: [{ x: 0.4, y: 0.3 }, { x: 0.5, y: 0.28 }, { x: 0.6, y: 0.3 }], closed: false },
  { id: 'brow_right', points: [{ x: 0.42, y: 0.37 }, { x: 0.47, y: 0.36 }], closed: false },
  { id: 'brow_left', points: [{ x: 0.53, y: 0.36 }, { x: 0.58, y: 0.37 }], closed: false },
  flat('eye_line', 0.42, 0.58, 0.4),
  flat('nose_width', 0.47, 0.53, 0.49),
  flat('lip_line', 0.43, 0.57, 0.56),
  { id: 'jaw', points: [{ x: 0.37, y: 0.5 }, { x: 0.43, y: 0.61 }, { x: 0.5, y: 0.65 }, { x: 0.57, y: 0.61 }, { x: 0.63, y: 0.5 }], closed: false },
  flat('chin', 0.47, 0.53, 0.65),
];
const fact = (over: Pick<CardFact, 'fact' | 'name' | 'words' | 'hair' | 'number'>): CardFact =>
  ({ ...over, title: over.words, sureness: 'estimate', between: false, brief: `${over.name}: ${over.words}` });
const FACTS: readonly CardFact[] = [
  fact({ fact: 'face.proportion', name: 'Length and width', words: 'clearly longer than it is wide', hair: 'Volume at the sides makes a face look wider.', number: 'Length about 1.37 times the width, estimate' }),
  fact({ fact: 'face.forehead_share', name: 'Forehead', words: 'about the same as the other two sections', hair: 'A fringe covers part of the forehead, and an open front shows all of it.', number: 'Top about 34%, middle about 33% of your face height, estimate' }),
  fact({ fact: 'face.jaw_vs_cheek', name: 'Jaw', words: 'a little narrower than the cheekbones', hair: 'Soft layers blur the jaw line, and blunt ends mark it.', number: 'About 87% of your cheek width, rough estimate' }),
];
const measurements = (lines: readonly FaceLine[]): PhotoMeasurements => ({
  view: 'frontal', lines, values: {}, issues: [], confidence: 'high', weight: 1, approximate: false, camera: null, pose: null,
  ticks: [{ id: 'hairline', point: { x: 0.5, y: 0.28 } }, { id: 'brow', point: { x: 0.5, y: 0.37 } }, { id: 'nose_base', point: { x: 0.5, y: 0.5 } }, { id: 'chin', point: { x: 0.5, y: 0.65 } }],
  face: { x: 0.5, y: 0.46, width: 0.28 }, hairlineVisible: true,
});
const input = (lines: readonly FaceLine[]): FaceCardInput => ({
  image: { widthPx: 1000, heightPx: 1400 }, measurements: measurements(lines), hairExtent: { top: 0.14, bottom: 0.72, left: 0.27, right: 0.73 },
  facts: FACTS, date: new Date(2026, 10, 8),
});
const cardOf = (lines: readonly FaceLine[]): FaceCard => {
  const r = buildFaceCard(input(lines));
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

/** Rows to sample across a horizontal line: x, the rows fully inside its core, and one fully inside each casing. */
export interface Probe {
  readonly x: number;
  readonly core: readonly number[];
  readonly casing: readonly number[];
}

/**
 * Moves two lines a fraction of a px (inside the face, so the crop stays) so whole pixel rows fall inside their tones:
 * the eye line half past a card row for the export (core 3 px, casing 1 px), the lip line a quarter past a device row on
 * screen (core 2.5, casing 1.5 device px at a pixel ratio of 2).
 */
function aligned(dpr: number): { readonly lines: FaceLine[]; readonly probes: { readonly export: Probe; readonly screen: Probe } } {
  const first = cardOf(LINES);
  const s = Math.round(STAGE_PX * dpr) / CARD_PX.widthPx;
  const midOf = (id: LineId) => {
    const line = first.items.find((i) => i.type === 'line' && i.id === id);
    const [a, b] = line?.type === 'line' ? [line.points[0], line.points.at(-1)] : [];
    if (!a || !b) throw new Error(`No ${id}`);
    return { x: (a.x + b.x) / 2, y: a.y };
  };
  const [eye, lip] = [midOf('eye_line'), midOf('lip_line')];
  const eyeY = Math.round(eye.y);
  const lipRow = Math.round(lip.y * s);
  const toY = (cardY: number) => fromExport({ x: 0, y: cardY }, first.placement).y;
  const lines = LINES.map((l) => (l.id === 'eye_line' ? flat(l.id, 0.42, 0.58, toY(eyeY + 0.5)) : l.id === 'lip_line' ? flat(l.id, 0.43, 0.57, toY((lipRow + 0.25) / s)) : l));
  if (JSON.stringify(cardOf(lines).placement) !== JSON.stringify(first.placement)) throw new Error('The probe lines moved the crop');
  return {
    lines,
    probes: {
      export: { x: Math.round(eye.x), core: [eyeY - 1, eyeY, eyeY + 1], casing: [eyeY - 2, eyeY + 2] },
      screen: { x: Math.floor(lip.x * s), core: [lipRow - 1, lipRow], casing: [lipRow - 2, lipRow + 2] },
    },
  };
}

/** A page canvas and its context; the page's own fixtures work where OffscreenCanvas does not exist (WebKit on Windows). */
function canvas2d(widthPx: number, heightPx: number): { readonly canvas: HTMLCanvasElement; readonly ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D context');
  return { canvas, ctx };
}

/** A fictional portrait drawn in code: a grey backdrop, dark hair, a face oval and a neck. Nobody real. */
function portrait(): Promise<ImageBitmap> {
  const { canvas, ctx } = canvas2d(1000, 1400);
  const back = ctx.createLinearGradient(0, 0, 0, 1400);
  back.addColorStop(0, '#b9c0c7');
  back.addColorStop(1, '#8a939c');
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, 1000, 1400);
  ctx.fillStyle = '#3b2a22';
  ctx.beginPath();
  ctx.ellipse(500, 600, 230, 410, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#c99a7c';
  ctx.fillRect(430, 820, 140, 400);
  ctx.beginPath();
  ctx.ellipse(500, 644, 140, 266, 0, 0, 2 * Math.PI);
  ctx.fill();
  return createImageBitmap(canvas);
}

/** A flat fictional picture for the sheet and the board: a hue gradient with a pale oval. */
async function swatch(hue: number, widthPx = 600, heightPx = 800): Promise<PaintImage> {
  const { canvas, ctx } = canvas2d(widthPx, heightPx);
  const g = ctx.createLinearGradient(0, 0, widthPx, heightPx);
  g.addColorStop(0, `hsl(${String(hue)} 45% 55%)`);
  g.addColorStop(1, `hsl(${String(hue + 40)} 35% 30%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, widthPx, heightPx);
  ctx.fillStyle = 'rgb(255 255 255 / 0.55)';
  ctx.beginPath();
  ctx.ellipse(widthPx / 2, heightPx * 0.42, widthPx * 0.22, heightPx * 0.2, 0, 0, 2 * Math.PI);
  ctx.fill();
  return { source: await createImageBitmap(canvas), size: { widthPx, heightPx } };
}

const pictureRect = (i: number) => ({ x: 120 + i * 486, y: 120, width: 462, height: 720 });
const SHEET: StylistSheet = {
  title: 'Long layers with a curtain fringe',
  thumbnails: (['front', 'side', 'back'] as const).map((view, i) => ({ itemId: 'check-cut', view, key: `check-model/check-cut-${view}`, rect: pictureRect(i) })),
  aiPicture: { pictureId: asPictureId('check-slot'), hairOnly: false, label: EN.sheet.aiLabel, rect: pictureRect(3) },
  sections: [
    { id: 'lengths', heading: 'Lengths', rows: [{ label: 'Top', value: '20-25 cm' }, { label: 'Fringe', value: '8-10 cm' }, { label: 'Measured', value: 'dry and stretched' }] },
    { id: 'layers', heading: 'Layers', rows: [{ label: 'Layers', value: 'long layers, face-framing layers' }] },
    { id: 'upkeep', heading: 'Upkeep', rows: [{ label: 'Styling', value: '10-15 minutes a day' }, { label: 'Trim', value: 'every 8-10 weeks' }] },
  ],
  footer: [EN.footer.app, EN.footer.link],
  layout: STYLIST_SHEET_LAYOUT,
  export: JPEG_EXPORT,
};
const BOARD = buildBoard({
  ideas: [
    { id: 'check-cut', kind: 'cut', name: 'Long layers', picture: { source: 'ai', pictureId: asPictureId('check-slot'), hairOnly: false } },
    { id: 'check-colour', kind: 'colour', name: 'Copper melt', picture: { source: 'library', key: 'check-model/check-colour-front' } },
    { id: 'check-bob', kind: 'cut', name: 'Curly bob', picture: null },
  ],
  pair: null,
});

const toBase64 = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

/** RGBA at column `x` for each row of a canvas or a decoded export. */
function rowsAt(source: CanvasImageSource & { readonly width: number; readonly height: number }, x: number, rows: readonly number[]): number[][] {
  const { ctx } = canvas2d(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  return rows.map((y) => [...ctx.getImageData(x, y, 1, 1).data]);
}

/** A small JPEG at `quality` through the same encoder the export uses here (OffscreenCanvas where there is one). */
function referenceJpeg(quality: number): Promise<Blob> {
  const fill = (ctx: { fillRect: (x: number, y: number, w: number, h: number) => void } | null) => ctx?.fillRect(0, 0, 32, 32);
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(64, 64);
    fill(canvas.getContext('2d'));
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
  const { canvas, ctx } = canvas2d(64, 64);
  fill(ctx);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No reference JPEG'));
    }, 'image/jpeg', quality);
  });
}

async function main(): Promise<void> {
  const dpr = window.devicePixelRatio;
  const { lines, probes } = aligned(dpr);
  const card = cardOf(lines);
  const photo = await portrait();
  const library = new Map<string, PaintImage>([
    ...(await Promise.all(SHEET.thumbnails.map(async (t, i) => [t.key, await swatch(20 + i * 30)] as const))),
    ['check-model/check-colour-front', await swatch(18)],
  ]);
  const ai = await swatch(300, 768, 1024);
  const lookup = (ref: PictureRef): PaintImage | null =>
    ref.source === 'photo' ? { source: photo, size: { widthPx: photo.width, heightPx: photo.height } } : ref.source === 'ai' ? ai : (library.get(ref.key) ?? null);
  const exports = { card: [card.items, card.export], sheet: [stylistSheetItems(SHEET), SHEET.export], board: [boardItems(BOARD), BOARD.export] } as const;
  const api = {
    dpr,
    probes,
    totalLines: card.items.filter((i) => i.type === 'line').length,
    screen: (x: number, rows: readonly number[]) => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 ? rowsAt(canvas, x, rows) : [];
    },
    /** Exports one kind; `probe` samples the face card's export probe rows, `samples` the given card px points. */
    exportFile: async (kind: keyof typeof exports, points: readonly { readonly x: number; readonly y: number }[] = []) => {
      const [items, spec] = exports[kind];
      const blob = await exportImage(items, spec, { pictures: lookup });
      const bitmap = await createImageBitmap(blob);
      const probe = rowsAt(bitmap, probes.export.x, [...probes.export.core, ...probes.export.casing]);
      const samples = points.flatMap((p) => rowsAt(bitmap, p.x, [p.y]));
      const offscreen = typeof OffscreenCanvas === 'function';
      return { base64: await toBase64(blob), mime: blob.type, width: bitmap.width, height: bitmap.height, probe, samples, offscreen };
    },
    referenceJpeg: async (quality: number) => toBase64(await referenceJpeg(quality)),
    fonts: () => fontCheck(card),
  };
  Object.assign(window, { __painterCheck: api });
  const play = new URLSearchParams(location.search).get('play') !== '0';
  createRoot(document.getElementById('root') ?? document.body).render(<Check card={card} lookup={lookup} play={play} />);
}

/** Every font the card uses is loaded, and an OffscreenCanvas (null where there is none) measures text as a page canvas does. */
async function fontCheck(card: FaceCard) {
  const tokens = readTokens(document.documentElement);
  const wanted = fontsFor(card.items, tokens);
  const missing = await loadFonts(card.items, tokens);
  const sample = 'What the card says, Huecut';
  const width = (ctx: { font: string; measureText: (t: string) => TextMetrics } | null, font: string) => {
    if (!ctx) return -1;
    ctx.font = font;
    return ctx.measureText(sample).width;
  };
  const figtree = `600 40px ${tokens.fonts.text}`;
  return {
    wanted,
    missing,
    loaded: wanted.map((f) => document.fonts.check(f)),
    element: width(document.createElement('canvas').getContext('2d'), figtree),
    offscreen: typeof OffscreenCanvas === 'function' ? width(new OffscreenCanvas(1, 1).getContext('2d'), figtree) : null,
    fallback: width(document.createElement('canvas').getContext('2d'), "600 40px 'Figtree fallback'"),
  };
}

function Check({ card, lookup, play }: { readonly card: FaceCard; readonly lookup: (ref: PictureRef) => PaintImage | null; readonly play: boolean }) {
  const paint = screenPainter(lookup);
  const prepare = () => loadFonts(card.items, readTokens(document.documentElement));
  return (
    <main style={{ inlineSize: `${String(STAGE_PX)}px`, padding: 0, margin: '16px' }}>
      <PainterCanvas items={card.items} size={card.size} paint={paint} prepare={prepare} label="The face card of a fictional face" playOnMount={play} />
    </main>
  );
}

main().then(
  () => {
    document.body.dataset.ready = 'true';
  },
  (error: unknown) => {
    document.body.dataset.ready = 'failed';
    document.body.dataset.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  },
);
