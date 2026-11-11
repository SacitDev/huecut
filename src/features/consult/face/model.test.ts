/**
 * The face card step's pure rules: what it shows for each outcome of the main photo, the portrait drawn from the card without
 * its words, Move the lines' parts, stage and arrows, the unsure-outline rule, the colour hints, and the
 * download sizes against the manifest.
 */
import { expect, it } from 'vitest';
import manifest from '../../../../models.manifest.json';
import type { IndexEntry } from '../../../domain/content/output.ts';
import type { Facts } from '../../../domain/facts/registry.ts';
import { POINT } from '../../../domain/measure/landmarks.ts';
import type { FaceLine, PhotoMeasurements } from '../../../domain/measure/measure.ts';
import type { HairMeasures, PhotoObservation } from '../../../domain/measure/observation.ts';
import type { CardFact } from '../../../domain/render-model/face-card.ts';
import { content, input, observation, photo } from '../../../../tests/machine/consult.fakes.ts';
import { freshContext } from '../../../machine/consult.machine.ts';
import type { ConsultContent, ConsultContext, PhotoEntry } from '../../../machine/consult.types.ts';
import * as m from './model.ts';

const base = freshContext(input());
const entry = (n: number, over: Partial<PhotoEntry> = {}): PhotoEntry => ({
  id: photo(n), status: 'done', sharpness: 200 - n, observation: observation(), edits: null, refined: null, error: null, tries: 0, ...over,
}) as PhotoEntry;
const queued = (n: number): PhotoEntry => entry(n, { status: 'queued', observation: null });
const failed = (n: number, error: 'decode_failed' | 'timeout' = 'decode_failed'): PhotoEntry => entry(n, { status: 'failed', observation: null, error });
const ctx = (photos: readonly PhotoEntry[], over: Partial<ConsultContext> = {}): ConsultContext => ({ ...base, photos, mainPhotoId: photos[0]?.id ?? null, ...over });

const ring = (cx: number, cy: number, r: number): FaceLine['points'] =>
  Array.from({ length: 12 }, (_, i) => ({ x: cx + r * Math.cos((i / 12) * 2 * Math.PI), y: cy + 1.2 * r * Math.sin((i / 12) * 2 * Math.PI) }));
const MEASURED: PhotoMeasurements = {
  view: 'frontal',
  lines: [
    { id: 'face_outline', points: ring(0.5, 0.45, 0.15), closed: true },
    { id: 'hairline', points: [{ x: 0.42, y: 0.3 }, { x: 0.5, y: 0.28 }, { x: 0.58, y: 0.3 }], closed: false },
    { id: 'brow_right', points: [{ x: 0.42, y: 0.37 }, { x: 0.47, y: 0.36 }], closed: false },
    { id: 'brow_left', points: [{ x: 0.53, y: 0.36 }, { x: 0.58, y: 0.37 }], closed: false },
    { id: 'jaw', points: [{ x: 0.4, y: 0.55 }, { x: 0.5, y: 0.62 }, { x: 0.6, y: 0.55 }], closed: false },
  ],
  ticks: [{ id: 'chin', point: { x: 0.5, y: 0.63 } }], values: {}, issues: [], confidence: 'medium', weight: 0.4, approximate: false, camera: null, pose: null,
  face: { x: 0.5, y: 0.45, width: 0.3 }, hairlineVisible: true,
};
const FACTS: readonly CardFact[] = [{
  fact: 'face.proportion', name: 'Length and width', words: 'a little longer than it is wide', title: 'In this photo, your face is a little longer than it is wide',
  hair: 'Volume at the sides makes a face look wider.', number: 'Length about 1.20 times the width, estimate', sureness: 'estimate', between: false,
  brief: 'Length and width: a little longer than it is wide',
}];
function measuredCard() {
  const card = m.cardOf(entry(1), MEASURED, FACTS, new Date(2026, 10, 9));
  if (!card) throw new Error('no card');
  return card;
}

it('shows the card when there are facts, waits for a photo still read, and otherwise says why in one sentence', () => {
  expect(m.faceState(ctx([entry(1)]), MEASURED, FACTS)).toEqual({ kind: 'ready' });
  expect(m.faceState(ctx([queued(1)]), null, [])).toEqual({ kind: 'waiting' });
  const unread = (c: ConsultContext, measured: PhotoMeasurements | null) => m.faceState(c, measured, []);
  expect(unread(ctx([failed(1, 'timeout'), failed(2, 'timeout')]), null)).toEqual({ kind: 'unread', reason: 'none_read' });
  // A failure with a way round says it, even when no other photo is left.
  expect(unread(ctx([failed(1)]), null)).toEqual({ kind: 'unread', reason: 'decode_failed' });
  // A photo that failed before Continue still reaches the step and says what happened; another photo still gives hope.
  expect(unread(ctx([failed(1), entry(2)]), null)).toEqual({ kind: 'unread', reason: 'decode_failed' });
  expect(unread(ctx([failed(1, 'timeout'), queued(2)]), null)).toEqual({ kind: 'unread', reason: 'failed' });
  expect(unread(ctx([entry(1, { observation: observation(0) })]), { ...MEASURED, lines: [], view: null, issues: ['no_face'] })).toEqual({ kind: 'unread', reason: 'no_face' });
  expect(unread(ctx([entry(1)]), { ...MEASURED, view: null, values: {}, issues: ['turned'] })).toEqual({ kind: 'unread', reason: 'turned' });
  expect(unread(ctx([entry(1)]), { ...MEASURED, issues: ['several_faces'] })).toEqual({ kind: 'unread', reason: 'several_faces' });
});

it('builds the main photo\'s card only with a usable photo and a fact to state', () => {
  expect(m.cardOf(undefined, MEASURED, FACTS, new Date(2026, 10, 9))).toBeNull();
  expect(m.cardOf(entry(1, { observation: observation(0) }), MEASURED, FACTS, new Date(2026, 10, 9))).toBeNull();
  expect(m.cardOf(entry(1), MEASURED, [], new Date(2026, 10, 9))).toBeNull();
  expect(measuredCard().items.length).toBeGreaterThan(0);
});

it('draws the portrait from the card: the arch window, the photo, lines and ticks, no labels and no words', () => {
  const card = measuredCard();
  const shown = m.screenItems(card);
  expect([...new Set(shown.map((i) => i.type))]).toEqual(['ground', 'arch', 'photo', 'line', 'tick']);
  expect(shown.find((i) => i.type === 'arch')).toMatchObject({ rect: { x: 48, y: 48 } });
  expect(shown[0]).toEqual({ type: 'ground', rect: { x: 0, y: 0, ...{ width: m.PORTRAIT_SIZE.widthPx, height: m.PORTRAIT_SIZE.heightPx } }, tone: 'page' });
  expect(m.drawnNames(card)).toEqual(['Face outline', 'Hairline', 'Brows', 'Jaw']);
});

it('opens Move the lines on the face lines in a frozen 4:5 crop, the photo, lines and ticks on neutral ground', () => {
  const card = measuredCard();
  const placement = m.movePlacement(card, { widthPx: 1000, heightPx: 1250 });
  expect(placement.area).toEqual({ x: 0, y: 0, width: 2160, height: 2700 });
  expect(placement.crop.width / placement.crop.height).toBeCloseTo((2160 / 2700) * (1250 / 1000));
  const moved = m.inPlacement(card, placement);
  expect([...new Set(moved.map((i) => i.type))]).toEqual(['ground', 'photo', 'line', 'tick']);
  expect(moved[0]).toEqual({ type: 'ground', rect: placement.area, tone: 'neutral' });
});

/** A full 478-point mesh at 0.5, 0.5 with the cheekbones `width` apart, mirrored when `mirror`. */
function mesh(width: number, mirror = false): Float32Array {
  const a = new Float32Array(478 * 3).fill(0.5);
  const side = mirror ? -1 : 1;
  a[POINT.cheekRight * 3] = 0.5 - (side * width) / 2;
  a[POINT.cheekLeft * 3] = 0.5 + (side * width) / 2;
  a[POINT.jawRight * 3] = 0.5 - (side * width) / 3;
  a[POINT.jawLeft * 3] = 0.5 + (side * width) / 3;
  a[POINT.menton * 3 + 1] = 0.7;
  return a;
}
const meshed = (mirror = false): PhotoObservation => ({ ...observation(), faces: [{ landmarks: mesh(0.3, mirror), matrix: null, expression: {} }] });

it('names six parts, left and right as the photo shows them, with the hairline\'s dot on its line nearest the middle', () => {
  const parts = m.placedParts(meshed(), MEASURED, null);
  expect(parts.map((p) => p.part)).toEqual([...m.PARTS]);
  expect(parts[0]).toEqual({ part: 'hairline', moves: 'hairline', at: { x: 0.5, y: 0.28 } });
  expect(parts.find((p) => p.part === 'cheek_left')).toMatchObject({ moves: POINT.cheekRight, at: { x: expect.closeTo(0.35) as number } });
  // A mirrored selfie swaps the person's sides on the photo: left stays the one on the left.
  expect(m.placedParts(meshed(true), MEASURED, null).find((p) => p.part === 'cheek_left')?.moves).toBe(POINT.cheekLeft);
  const edited = m.placedParts(meshed(), MEASURED, { points: { [POINT.menton]: { x: 0.52, y: 0.75 } }, hairline: null });
  expect(edited.find((p) => p.part === 'chin')).toEqual({ part: 'chin', moves: POINT.menton, at: { x: 0.52, y: 0.75 } });
  expect(m.placedParts(meshed(), { ...MEASURED, lines: MEASURED.lines.filter((l) => l.id !== 'hairline') }, null).map((p) => p.part)).not.toContain('hairline');
  expect(m.placedParts(observation(), MEASURED, null)).toEqual([]);
});

it('moves a dot the same distance in px on both axes, inside the photo; the hairline moves as one line, up and down only', () => {
  const image = { widthPx: 1000, heightPx: 1400 };
  expect(m.nudged({ x: 0.5, y: 0.5 }, 'down', image)).toEqual({ x: 0.5, y: 0.5 + (0.004 * 1400) / 1400 });
  expect(m.nudged({ x: 0.5, y: 0.5 }, 'left', image).x).toBeCloseTo(0.5 - (0.004 * 1400) / 1000);
  expect(m.nudged({ x: 0.999, y: 0.001 }, 'right', image).x).toBe(1);
  expect(m.nudgesOf('hairline')).toEqual(['up', 'down']);
  expect(m.nudgesOf('chin')).toEqual(['up', 'down']);
  expect(m.nudgesOf('jaw_left')).toEqual(['up', 'down', 'left', 'right']);
  const line = [{ x: 0.4, y: 0.3 }, { x: 0.5, y: 0.28 }];
  expect(m.shiftedHairline(line, { x: 0.5, y: 0.28 }, { x: 0.9, y: 0.25 })).toEqual([{ x: 0.4, y: expect.closeTo(0.27) as number }, { x: 0.5, y: expect.closeTo(0.25) as number }]);
});

it('finds the dot under a press', () => {
  const placement = { crop: { x: 0, y: 0, width: 1, height: 1 }, area: { x: 0, y: 0, width: 1000, height: 1000 } };
  const parts = m.placedParts(meshed(), MEASURED, null);
  expect(m.nearestPart(parts, { x: 505, y: 690 }, placement, 40)).toBe(parts.findIndex((p) => p.part === 'chin'));
  expect(m.nearestPart(parts, { x: 900, y: 100 }, placement, 40)).toBeNull();
});

const hair = (over: Partial<HairMeasures> = {}): HairMeasures => ({
  coverage: 0.2, extent: { top: 0.1, bottom: 0.7, left: 0.2, right: 0.8 }, hairline: new Float32Array(), hairlineVisible: true,
  colour: { hair: null, skin: null, eyes: null }, ...over,
});
const texture = (value: 'straight' | 'curly' | 'coily' | 'mixed'): Facts => ({ 'hair.texture': { key: 'hair.texture', value, confidence: 'high', source: 'answered' } });

it('offers Refine my hair outline only when the automatic outline is unsure', () => {
  const sure = entry(1, { observation: { ...observation(), hair: hair() } });
  expect(m.outlineUnsure(sure, MEASURED, texture('straight'))).toBe(false);
  expect(m.outlineUnsure(sure, MEASURED, {})).toBe(false);
  for (const t of ['curly', 'coily', 'mixed'] as const) expect(m.outlineUnsure(sure, MEASURED, texture(t))).toBe(true);
  expect(m.outlineUnsure(sure, { ...MEASURED, hairlineVisible: false }, {})).toBe(true);
  expect(m.outlineUnsure(entry(1, { observation: { ...observation(), hair: hair({ extent: null }) } }), MEASURED, {})).toBe(true);
  expect(m.outlineUnsure(entry(1), MEASURED, {})).toBe(true);
});

it('states first-use sizes that match the manifest\'s int8 files, plus the ONNX Runtime', () => {
  // Everything under the model's folder except the fp16 files, which only WebGPU devices fetch, in MB to one decimal.
  const mb = (folder: string): number =>
    Math.round(manifest.files.filter((f) => f.path.startsWith(folder) && !f.path.includes('fp16')).reduce((s, f) => s + f.bytes, 0) / 1e5) / 10;
  expect(mb('depth-anything-v2-small/')).toBe(m.MODEL_MB.depth);
  expect(mb('sam2.1-hiera-tiny/')).toBe(m.MODEL_MB.sam);
  expect(Math.round(m.firstUseMb('depth'))).toBe(34);
  expect(Math.round(m.firstUseMb('sam'))).toBe(69);
});

const LAB = { l: 30, a: 8, b: 12 };
const shade = { id: 'dark-brown', kind: 'shade', name: 'Dark brown', level: [3, 4], lab: { mids: { mid: [LAB.l, LAB.a, LAB.b] } } } as unknown as IndexEntry;
const far = { id: 'platinum', kind: 'shade', name: 'Platinum blonde', level: [10, 10], lab: { mids: { mid: [90, 0, 8] } } } as unknown as IndexEntry;
const withQuestions: ConsultContent = {
  library: { models: [], entries: [shade, far] },
  consult: {
    ...content.consult,
    questions: {
      ...content.consult.questions,
      questions: [
        { id: 'look-skin-depth', fact: 'look.skin_depth', type: 'single', goals: ['colour'], collections: ['salon'], prompt: 'Skin depth?', options: [{ value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' }, { value: null, label: 'Not sure' }] },
        { id: 'look-undertone', fact: 'look.undertone', type: 'single', goals: ['colour'], collections: ['salon'], prompt: 'Undertone?', options: [{ value: 'warm', label: 'Warm' }, { value: null, label: 'Not sure' }] },
      ],
    },
  },
};

it('gives the colour hints: the nearest library shade, skin depth in the question\'s words, and the undertone answer', () => {
  const sampled = { ...observation(), hair: hair({ colour: { hair: { l: 31, a: 8, b: 11 }, skin: { l: 65, a: 12, b: 18 }, eyes: null } }) };
  const warm: Facts = { 'look.undertone': { key: 'look.undertone', value: 'warm', confidence: 'high', source: 'answered' } };
  const read = m.colourReadings(sampled, warm, withQuestions);
  expect(read.hair?.shade).toBe(shade);
  expect(read.hair?.swatch).toMatch(/^#[0-9a-f]{6}$/);
  // ITA = atan((65 - 50) / 18) = 39.8°: the "medium" class (28-41°).
  expect(read.skin?.label).toBe('Medium');
  expect(read.undertone).toBe('Warm');
  expect(m.colourReadings(observation(), {}, withQuestions)).toEqual({ hair: null, skin: null, undertone: null });
  expect(m.colourReadings(sampled, {}, content).hair).toBeNull();
});
