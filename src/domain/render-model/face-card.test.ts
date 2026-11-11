/**
 * Face card tests: what the card says (each word of sureness, each count of facts, a
 * boundary, a reading that cannot be trusted, no facts and no card), observations never prescriptions, the jaw angle never,
 * the crop that keeps all the hair, the labels in two columns off the photo, the panel of full-width rows and the footer.
 */
import { expect, it } from 'vitest';
import type { Bands } from '../content/types.ts';
import type { Confidence, Facts } from '../facts/registry.ts';
import { toExport, type Rect } from '../geometry/coords.ts';
import type { FaceLine, MeasureKey, PhotoMeasurements } from '../measure/measure.ts';
import { EN, type NoteCopy } from './copy.ts';
import { buildFaceCard, cardFacts, faceNotes, factSentences, FACE_CARD_LAYOUT, photoCrop, type CardFact, type FaceCard, type FaceCardInput, type FaceCardItem } from './face-card.ts';

const node = (globalThis as unknown as {
  process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } };
}).process;
/** The shipped bands: the card's words rest on their cuts and margins. */
const BANDS = JSON.parse(node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/content/bands.json`, 'utf8')) as Bands;

const ring = (cx: number, cy: number, rx: number, ry: number): FaceLine['points'] =>
  Array.from({ length: 36 }, (_, i) => ({ x: cx + rx * Math.cos((i / 36) * 2 * Math.PI), y: cy + ry * Math.sin((i / 36) * 2 * Math.PI) }));
const LINES: FaceLine[] = [
  { id: 'face_outline', points: ring(0.5, 0.46, 0.14, 0.19), closed: true },
  { id: 'hairline', points: [{ x: 0.4, y: 0.3 }, { x: 0.5, y: 0.28 }, { x: 0.6, y: 0.3 }], closed: false },
  { id: 'brow_right', points: [{ x: 0.42, y: 0.37 }, { x: 0.47, y: 0.36 }], closed: false },
  { id: 'brow_left', points: [{ x: 0.53, y: 0.36 }, { x: 0.58, y: 0.37 }], closed: false },
  { id: 'eye_line', points: [{ x: 0.42, y: 0.4 }, { x: 0.58, y: 0.4 }], closed: false },
  { id: 'nose_width', points: [{ x: 0.47, y: 0.49 }, { x: 0.53, y: 0.49 }], closed: false },
  { id: 'lip_line', points: [{ x: 0.45, y: 0.56 }, { x: 0.55, y: 0.56 }], closed: false },
  { id: 'jaw', points: [{ x: 0.37, y: 0.5 }, { x: 0.43, y: 0.61 }, { x: 0.5, y: 0.65 }, { x: 0.57, y: 0.61 }, { x: 0.63, y: 0.5 }], closed: false },
  { id: 'chin', points: [{ x: 0.47, y: 0.65 }, { x: 0.53, y: 0.65 }], closed: false },
];
/** One photo's values: longer than wide, even sections, the jaw a little narrower than the cheeks. */
const VALUES: Readonly<Record<MeasureKey, number>> = {
  width_to_length: 0.7293, length_to_width: 1.3712, third_upper: 0.341, third_middle: 0.33, third_lower: 0.329,
  forehead_share: 1.03, lower_share: 0.98, jaw_to_cheek: 0.85, jaw_angle: 131.6, chin_to_jaw: 0.41,
};
const MEASURED: PhotoMeasurements = {
  view: 'frontal', lines: LINES, values: {}, issues: [], confidence: 'high', weight: 1, approximate: false, camera: null, pose: null,
  ticks: [{ id: 'hairline', point: { x: 0.5, y: 0.28 } }, { id: 'brow', point: { x: 0.5, y: 0.37 } }, { id: 'nose_base', point: { x: 0.5, y: 0.5 } }, { id: 'chin', point: { x: 0.5, y: 0.65 } }],
  face: { x: 0.5, y: 0.46, width: 0.28 }, hairlineVisible: true,
};
/** The photo at one confidence, with some values changed and some left out (as `measure()` leaves out what it cannot read). */
const photo = (confidence: Confidence, over: Partial<Record<MeasureKey, number>> = {}, without: readonly MeasureKey[] = []): PhotoMeasurements => ({
  ...MEASURED, confidence,
  values: Object.fromEntries(Object.entries({ ...VALUES, ...over }).filter(([k]) => !without.includes(k as MeasureKey)).map(([k, value]) => [k, { value, confidence, approximate: false }])),
});
const THIRDS: readonly MeasureKey[] = ['third_upper', 'third_middle', 'third_lower', 'forehead_share', 'lower_share'];
const INPUT: FaceCardInput = {
  image: { widthPx: 1000, heightPx: 1400 }, measurements: photo('high'), hairExtent: { top: 0.14, bottom: 0.72, left: 0.27, right: 0.73 },
  facts: cardFacts(photo('high'), BANDS), date: new Date(2026, 10, 8),
};

const card = (input: FaceCardInput = INPUT): FaceCard => {
  const r = buildFaceCard(input);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const blocks = (c: FaceCard, role: string): string[] =>
  c.items.flatMap((i) => (i.type === 'text' ? i.blocks.filter((b) => b.role === role).map((b) => b.text) : []));
/** Every word the card says (not the coordinates). */
const cardWords = (c: FaceCard): string =>
  c.items.flatMap((i) => (i.type === 'text' ? i.blocks.map((b) => b.text) : i.type === 'label' ? [i.text] : [])).join('\n');
const ofType = <T extends FaceCardItem['type']>(c: FaceCard, type: T) => c.items.filter((i): i is Extract<FaceCardItem, { type: T }> => i.type === type);
const contains = (outer: Rect, inner: Rect): boolean =>
  outer.x <= inner.x + 1e-9 && outer.y <= inner.y + 1e-9 && outer.x + outer.width >= inner.x + inner.width - 1e-9 && outer.y + outer.height >= inner.y + inner.height - 1e-9;
const said = (facts: readonly CardFact[]) => facts.map((f) => [f.title, f.hair, f.number]);

it('states each topic of the photo as an observation, its neutral hair line and its number with its word', () => {
  expect(said(cardFacts(photo('high'), BANDS))).toEqual([
    ['In this photo, your face is clearly longer than it is wide', 'Volume at the sides makes a face look wider.', 'Your face is about 1.37 times as long as it is wide, steady estimate'],
    ['In this photo, your forehead section is about the same as the other two sections', 'A fringe covers part of the forehead, and an open front shows all of it.', 'This part takes up about 34% of your face height. Middle about 33%, steady estimate'],
    ['In this photo, your nose-to-chin section is about the same as the other two sections', 'Where the hair ends draws the eye to that height.', 'This part takes up about 33% of your face height, steady estimate'],
    ['In this photo, your jaw is a little narrower than the cheekbones', 'Soft layers blur the jaw line, and blunt ends mark it.', 'Your jaw is about 85% as wide as your cheeks, steady estimate'],
  ]);
  expect(cardFacts(photo('high'), BANDS).map((f) => f.brief)).toEqual([
    'Length and width: clearly longer than it is wide', 'Forehead: about the same as the other two sections', 'Nose to chin: about the same as the other two sections', 'Jaw: a little narrower than the cheekbones',
  ]);
});

it('says how sure each number is in one of three words: steady at high, estimate at the fact\'s minimum, rough below it', () => {
  const words = (m: PhotoMeasurements) => cardFacts(m, BANDS).map((f) => [f.fact, f.sureness, f.number?.split(', ').at(-1)]);
  expect(words(photo('high')).map(([, s, w]) => [s, w])).toEqual(Array.from({ length: 4 }, () => ['steady', 'steady estimate']));
  // The sections read vertical proportions, which an unknown distance hardly changes: an estimate at medium. A medium jaw is
  // below its minimum (widths are what distance distorts): rough, and no rule reads it.
  expect(words(photo('medium'))).toEqual([
    ['face.proportion', 'estimate', 'estimate'], ['face.forehead_share', 'estimate', 'estimate'], ['face.lower_share', 'estimate', 'estimate'], ['face.jaw_vs_cheek', 'rough', 'rough estimate'],
  ]);
  // A low photo has no jaw width (measure() leaves it out) and every other number is rough.
  expect(words(photo('low', {}, ['jaw_to_cheek']))).toEqual([
    ['face.proportion', 'rough', 'rough estimate'], ['face.forehead_share', 'rough', 'rough estimate'], ['face.lower_share', 'rough', 'rough estimate'],
  ]);
});

it('shows a known close-up\'s numbers as rough estimates under the close-up line', () => {
  const closeUp = { ...photo('low', {}, ['jaw_to_cheek']), issues: ['close_selfie'] as const, approximate: true };
  const facts = cardFacts(closeUp, BANDS);
  expect(facts.map((f) => f.number)).toEqual([
    'Your face is about 1.37 times as long as it is wide, rough estimate', 'This part takes up about 34% of your face height. Middle about 33%, rough estimate',
    'This part takes up about 33% of your face height, rough estimate',
  ]);
  expect(blocks(card({ ...INPUT, measurements: closeUp, facts }), 'qualifier')).toEqual(['Taken close up, so these are approximate (close-up photo).']);
  expect(blocks(card(), 'qualifier')).toEqual([]);
});

it('has a card for one to four facts in one layout and none for zero, each fact a lead line and a number', () => {
  const sets: readonly (readonly [number, PhotoMeasurements])[] = [
    [0, photo('medium', {}, [...THIRDS, 'width_to_length', 'length_to_width', 'jaw_to_cheek'])],
    [1, photo('medium', {}, [...THIRDS, 'jaw_to_cheek'])],
    [2, photo('medium', {}, THIRDS)],
    [3, photo('medium', {}, ['jaw_to_cheek'])],
    [4, photo('medium')],
  ];
  for (const [count, m] of sets) {
    const facts = cardFacts(m, BANDS);
    expect(facts).toHaveLength(count);
    const built = buildFaceCard({ ...INPUT, measurements: m, facts });
    if (count === 0) {
      expect(built).toEqual({ ok: false, error: 'unread' });
      continue;
    }
    if (!built.ok) throw new Error(built.error);
    expect(blocks(built.value, 'fact')).toEqual(facts.map((f) => f.brief));
    expect(blocks(built.value, 'number')).toHaveLength(count);
    // The same rectangles at every count: only the rows change.
    expect(ofType(built.value, 'text').map((t) => t.rect)).toEqual([FACE_CARD_LAYOUT.text, FACE_CARD_LAYOUT.footer]);
  }
});

it('says a reading on a boundary as its own title only, its number and its word carrying the closeness; the margin widens below high confidence', () => {
  // 0.815 is 0.035 above the 0.78 cut: outside the margin of 0.03 at high, inside 0.045 at medium.
  const near = { width_to_length: 0.815, length_to_width: 1 / 0.815 };
  const [medium] = cardFacts(photo('medium', near), BANDS);
  expect(medium).toMatchObject({
    title: 'In this photo, your face is a little longer than it is wide',
    hair: 'Height on top makes a face look longer, and volume at the sides makes it look wider.',
    number: 'Your face is about 1.23 times as long as it is wide, estimate', sureness: 'estimate', between: true,
  });
  const [high] = cardFacts(photo('high', near), BANDS);
  expect(high).toMatchObject({ title: 'In this photo, your face is a little longer than it is wide', number: 'Your face is about 1.23 times as long as it is wide, steady estimate', between: false });
  expect(cardFacts(photo('high', { jaw_to_cheek: 0.81 }), BANDS).at(-1)?.words).toBe('a little narrower than the cheekbones');
});

it('names every borderline reading by its own title, never "close to" another', () => {
  const near = cardFacts(photo('high', { width_to_length: 0.77, length_to_width: 1 / 0.77, forehead_share: 0.86, lower_share: 1.14, jaw_to_cheek: 0.81 }), BANDS);
  expect(near.map((f) => [f.between, f.brief])).toEqual([
    [true, 'Length and width: clearly longer than it is wide'],
    [true, 'Forehead: shorter than the other two sections'],
    [true, 'Nose to chin: longer than the other two sections'],
    [true, 'Jaw: a little narrower than the cheekbones'],
  ]);
  expect(near.map(factSentences).join(' ')).not.toMatch(/close to/);
});

it('says "Cannot read reliably" with no number for a covered face, a tiny face or a changed expression; nothing at all for a photo of several faces', () => {
  for (const issue of ['hand_over_face', 'face_too_small', 'big_smile'] as const) {
    const facts = cardFacts({ ...photo('low', {}, ['jaw_to_cheek']), issues: [issue] }, BANDS);
    expect(facts.map((f) => [f.brief, f.title, f.hair, f.number, f.sureness, f.between])).toEqual(
      ['Length and width', 'Forehead', 'Nose to chin'].map((name) => [`${name}: cannot read reliably`, 'Cannot read reliably', null, null, 'cannot_read', false]),
    );
    expect(facts.map(factSentences)).toEqual(['Length and width: cannot read reliably.', 'Forehead: cannot read reliably.', 'Nose to chin: cannot read reliably.']);
  }
  expect(cardFacts({ ...photo('low'), issues: ['several_faces'] }, BANDS)).toEqual([]);
});

it('states observations, never prescriptions: each sentence says what this photo shows, each hair line what hair does, with no verdict or norm', () => {
  const topics = Object.values(EN.faceNotes);
  expect(topics).toHaveLength(4);
  for (const topic of topics) {
    const readings: readonly NoteCopy[] = Object.values(topic.values);
    expect(readings).toHaveLength(3);
    for (const r of readings) {
      expect(topic.says(r.words)).toMatch(/^In this photo, your /);
      expect(r.hair).toMatch(/fringe|front|volume|height|length|layers|fullness|softness|hair ends/i);
      expect(`${topic.says(r.words)} ${r.hair}`).not.toMatch(/balanc|suit|should|evenly|ideal|normal|average|typical|score|most people|flatter|better|best/i);
    }
  }
});

it('never shows the jaw angle', () => {
  const words = cardWords(card());
  expect(words).not.toMatch(/131|132|angle/i);
  expect(words).toMatch(/Your jaw is about 85% as wide as your cheeks/);
});

it('gives a prompt about the picks the engine\'s own view: fused facts that meet their minimum, in a few words', () => {
  const facts: Facts = {
    'face.proportion': { key: 'face.proportion', value: 'longer', confidence: 'medium', source: 'measured' },
    'face.forehead_share': { key: 'face.forehead_share', value: 'similar', confidence: 'low', source: 'measured' },
    'face.jaw_vs_cheek': { key: 'face.jaw_vs_cheek', value: 'narrower', confidence: 'medium', source: 'measured' },
  };
  expect(faceNotes(facts)).toEqual([{ fact: 'face.proportion', brief: 'Length and width: clearly longer than it is wide' }]);
  expect(faceNotes({ ...facts, 'face.jaw_vs_cheek': { key: 'face.jaw_vs_cheek', value: 'narrower', confidence: 'high', source: 'measured' } }).map((n) => n.brief))
    .toEqual(['Length and width: clearly longer than it is wide', 'Jaw: clearly narrower than the cheekbones']);
});

it('crops to keep the whole hair and the face with a margin, at the photo area shape, inside the photo when it can', () => {
  const hair = { x: 0.27, y: 0.14, width: 0.46, height: 0.58 };
  const crop = photoCrop({ widthPx: 1000, heightPx: 1400 }, [hair], 0.88);
  const marginX = (0.12 * Math.max(460, 812)) / 1000;
  expect(contains(crop, { x: hair.x - marginX, y: hair.y - 0.12 * 812 / 1400, width: hair.width + 2 * marginX, height: hair.height + 2 * 0.12 * 812 / 1400 })).toBe(true);
  expect((crop.width * 1000) / (crop.height * 1400)).toBeCloseTo(0.88, 9);
  expect(crop.x).toBeGreaterThanOrEqual(0);
  expect(crop.y + crop.height).toBeLessThanOrEqual(1 + 1e-9);
});

it('extends past the photo, never shrinking, when the hair reaches its edge or the photo is too narrow', () => {
  expect(photoCrop({ widthPx: 1000, heightPx: 1400 }, [{ x: 0.3, y: 0, width: 0.4, height: 0.5 }], 0.88).y).toBeLessThan(0);
  const narrow = photoCrop({ widthPx: 400, heightPx: 1400 }, [{ x: 0, y: 0.2, width: 1, height: 0.3 }], 0.88);
  expect(narrow.x).toBeLessThan(0);
  expect(narrow.x + narrow.width).toBeGreaterThan(1);
  expect(contains(narrow, { x: 0, y: 0.2, width: 1, height: 0.3 })).toBe(true);
});

it('draws the card at 2160 x 2700 as JPEG 0.92: page, arch, neutral ground, photo, the lines, ticks and labels, then the panel', () => {
  const c = card();
  expect(c.export).toEqual({ widthPx: 2160, heightPx: 2700, mime: 'image/jpeg', quality: 0.92 });
  expect(c.items.slice(0, 4).map((i) => (i.type === 'ground' ? `ground:${i.tone}` : i.type))).toEqual(['ground:page', 'arch', 'ground:neutral', 'photo']);
  expect(ofType(c, 'line').map((l) => l.id)).toEqual(LINES.map((l) => l.id));
  expect(ofType(c, 'tick')).toHaveLength(4);
  const area = FACE_CARD_LAYOUT.photo;
  for (const l of ofType(c, 'line')) for (const p of l.points) expect(contains(area, { x: p.x, y: p.y, width: 0, height: 0 })).toBe(true);
  expect(contains(c.placement.crop, { x: 0.27, y: 0.14, width: 0.46, height: 0.58 })).toBe(true);
  const { panel, text, footer } = FACE_CARD_LAYOUT;
  expect(c.items.find((i) => i.type === 'ground' && i.tone === 'panel')).toEqual({ type: 'ground', rect: panel, tone: 'panel' });
  expect(panel.y).toBeGreaterThan(FACE_CARD_LAYOUT.arch.y + FACE_CARD_LAYOUT.arch.height);
  expect(contains(panel, text)).toBe(true);
  expect(footer.y).toBeGreaterThanOrEqual(panel.y + panel.height);
});

it('sets the labels in two columns off the photo, evenly spaced beside the lines in their order, each leader on its own line', () => {
  const c = card();
  const labels = ofType(c, 'label');
  const area = FACE_CARD_LAYOUT.photo;
  expect(labels.map((l) => l.text).sort()).toEqual(['Brows', 'Chin', 'Eye line', 'Face outline', 'Hairline', 'Jaw', 'Lip line', 'Nose width']);
  for (const side of ['right', 'left'] as const) {
    const column = labels.filter((l) => l.align === side);
    expect(column).toHaveLength(4);
    // A right-aligned label ends left of the photo; a left-aligned one starts right of it; neither reaches the card's edge.
    for (const l of column) {
      expect(side === 'right' ? l.anchor.x < area.x : l.anchor.x > area.x + area.width).toBe(true);
      expect(l.maxWidthPx).toBeGreaterThan(400);
    }
    // Evenly spaced over the height the face lines take, never closer than a label row (110 px), inside the photo's height,
    // centred on the lines so the leaders stay short.
    const ys = column.map((l) => l.anchor.y);
    const steps = ys.slice(1).map((y, i) => y - (ys[i] ?? 0));
    for (const s of steps) expect(s).toBeCloseTo(steps[0] ?? 0, 6);
    expect(steps[0]).toBeGreaterThanOrEqual(110);
    for (const y of ys) expect(y >= area.y && y <= area.y + area.height).toBe(true);
    const lineYs = ofType(c, 'line').flatMap((line) => line.points.map((p) => p.y));
    const mid = (Math.min(...lineYs) + Math.max(...lineYs)) / 2;
    expect(((ys[0] ?? 0) + (ys.at(-1) ?? 0)) / 2).toBeCloseTo(mid, 6);
    const lines = column.map((l) => ofType(c, 'line').filter((line) => line.points.some((p) => p.x === l.leaderTo.x && p.y === l.leaderTo.y)).length);
    expect(lines.every((n) => n > 0)).toBe(true);
  }
});

it('leads each label to the nearest point of its own feature on its own side: no leader crosses the face\'s midline', () => {
  // A hairline seen on the left only (hair over the other side): it is labelled from the left, where it is.
  const partial = LINES.map((l) => (l.id === 'hairline' ? { ...l, points: [{ x: 0.38, y: 0.31 }, { x: 0.44, y: 0.29 }, { x: 0.49, y: 0.285 }] } : l));
  const featureOf = (id: string): string => (id.startsWith('brow_') ? 'brows' : id);
  for (const m of [photo('high'), { ...photo('high'), lines: partial }]) {
    const c = card({ ...INPUT, measurements: m });
    const mid = toExport({ x: m.face?.x ?? 0.5, y: m.face?.y ?? 0.5 }, c.placement).x;
    const labels = ofType(c, 'label');
    expect(labels).toHaveLength(8);
    for (const l of labels) {
      const left = l.align === 'right';
      expect(left ? l.anchor.x < mid && l.leaderTo.x <= mid : l.anchor.x > mid && l.leaderTo.x >= mid, `${l.text} stays on its own side`).toBe(true);
      const own = ofType(c, 'line').filter((line) => featureOf(line.id) === l.id).flatMap((line) => line.points).filter((p) => (left ? p.x <= mid : p.x >= mid));
      const away = (p: { readonly x: number; readonly y: number }): number => Math.hypot(p.x - l.anchor.x, p.y - l.anchor.y);
      expect(away(l.leaderTo), `${l.text} goes to its nearest point`).toBeCloseTo(Math.min(...own.map(away)), 9);
    }
  }
});

it('the footer says what the card is, the date, Huecut and its link, under the panel', () => {
  const footer = ['Estimates from your photo, made on your device.', '8 November 2026', 'Huecut', 'https://sacitdev.github.io/huecut/'];
  expect(card().items.at(-1)).toEqual({ type: 'text', rect: FACE_CARD_LAYOUT.footer, blocks: ['footer', 'date', 'app', 'link'].map((role, i) => ({ role, text: footer[i] })) });
  expect(blocks(card(), 'heading')).toEqual(['What this photo shows']);
});

it('has no card without face lines', () => {
  expect(buildFaceCard({ ...INPUT, measurements: { ...photo('high'), lines: [], ticks: [] } })).toEqual({ ok: false, error: 'unread' });
});
