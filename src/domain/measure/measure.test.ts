/**
 * Known-answer tests for `measure()` on a synthetic 478-point face: the indices it reads are placed at chosen
 * pixels of a 1000 x 1000 analysis image, and every expected value is worked by hand from those pixels.
 * Covers levelling (rotation, mirroring), edits, confidence, the jaw rule, lines, ticks and each issue.
 */
import { describe, expect, it } from 'vitest';
import { MESH_POINTS } from './landmarks.ts';
import { cameraDistance, measure, type LandmarkEdits, type PhotoMeasurements } from './measure.ts';
import type { FaceObservation, HairMeasures, PhotoObservation } from './observation.ts';

const SIZE = 1000;
type Px = readonly [x: number, y: number];

/** The chosen pixels. Cheeks 400 px apart, forehead top to chin 520 px, jaw 320 px, chin 120 px. */
const DESIGN: Readonly<Record<number, Px>> = {
  10: [500, 250], 152: [500, 770], 234: [300, 450], 454: [700, 450], 172: [340, 680], 397: [660, 680], 176: [440, 755], 400: [560, 755],
  9: [500, 380], 2: [500, 560],
  33: [380, 400], 133: [460, 400], 362: [540, 400], 263: [620, 400],
  129: [465, 540], 358: [535, 540],
};
/** Hairline from the mask: a level line at y 220 from x 380 to 620. */
const HAIRLINE: readonly Px[] = Array.from({ length: 13 }, (_, k) => [380 + 20 * k, 220] as const);

/** The 36 outline points on an ellipse (centre 500, 510; 200 x 260), then the chosen ones on top. */
const OUTLINE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

interface Shape {
  readonly rotateDeg?: number;
  readonly mirror?: boolean;
  readonly scale?: number;
  /** Iris diameter in px. */
  readonly irisPx?: number;
}

function transform([x, y]: Px, s: Shape): Px {
  const k = s.scale ?? 1;
  const a = ((s.rotateDeg ?? 0) * Math.PI) / 180;
  const dx = (x - 500) * k;
  const dy = (y - 500) * k;
  const rx = 500 + dx * Math.cos(a) - dy * Math.sin(a);
  const ry = 500 + dx * Math.sin(a) + dy * Math.cos(a);
  return [s.mirror ? SIZE - rx : rx, ry];
}

function landmarks(s: Shape = {}): Float32Array {
  const lm = new Float32Array(MESH_POINTS * 3).fill(0.5);
  for (let i = 0; i < MESH_POINTS; i++) lm[i * 3 + 2] = 0;
  const set = (i: number, p: Px): void => {
    const [x, y] = transform(p, s);
    lm[i * 3] = x / SIZE;
    lm[i * 3 + 1] = y / SIZE;
  };
  OUTLINE.forEach((i, k) => {
    set(i, [500 + 200 * Math.sin((2 * Math.PI * k) / 36), 510 - 260 * Math.cos((2 * Math.PI * k) / 36)]);
  });
  for (const [i, p] of Object.entries(DESIGN)) set(Number(i), p);
  const r = (s.irisPx ?? 30) / 2;
  for (const [centre, cx] of [[468, 420], [473, 580]] as const) {
    set(centre, [cx, 400]);
    [[r, 0], [0, -r], [-r, 0], [0, r]].forEach(([ox = 0, oy = 0], k) => {
      set(centre + 1 + k, [cx + ox, 400 + oy]);
    });
  }
  return lm;
}

function hair(s: Shape = {}, visible = true): HairMeasures {
  const points = HAIRLINE.flatMap((p) => transform(p, s).map((v) => v / SIZE));
  return { coverage: 0.2, extent: null, hairline: new Float32Array(points), hairlineVisible: visible, colour: { hair: null, skin: null, eyes: null } };
}

const face = (s: Shape = {}, extra: Partial<FaceObservation> = {}): FaceObservation => ({ landmarks: landmarks(s), matrix: null, expression: {}, ...extra });

/** A frontal photo from about 1 m: 80 mm-equivalent lens, iris 30 px → 1.02 m (worked in the camera test). */
function observation(faces: readonly FaceObservation[] = [face()], extra: Partial<PhotoObservation> = {}): PhotoObservation {
  return { schemaVersion: 1, image: { widthPx: SIZE, heightPx: SIZE }, focal35mm: 80, faces, hands: [], pose: null, hair: null, previewMask: null, ran: ['face', 'hand', 'pose', 'segmenter'], ...extra };
}

const value = (m: PhotoMeasurements, key: keyof PhotoMeasurements['values']): number | undefined => m.values[key]?.value;

describe('measure: known answers on a frontal photo from 1 m', () => {
  const m = measure(observation(), null, hair());

  it('measures length to width and the thirds from the chosen pixels', () => {
    expect(m.view).toBe('frontal');
    expect(m.issues).toEqual([]);
    expect(value(m, 'width_to_length')).toBeCloseTo(400 / 520, 5);
    expect(value(m, 'length_to_width')).toBeCloseTo(1.3, 5);
    // Hairline 220, brow line 380, nose base 560, chin 770: sections 160, 180, 210 of 550.
    expect(value(m, 'third_upper')).toBeCloseTo(160 / 550, 5);
    expect(value(m, 'third_middle')).toBeCloseTo(180 / 550, 5);
    expect(value(m, 'third_lower')).toBeCloseTo(210 / 550, 5);
    expect(value(m, 'forehead_share')).toBeCloseTo(160 / 195, 5);
    expect(value(m, 'lower_share')).toBeCloseTo(210 / 170, 5);
  });

  it('measures the jaw values at high confidence only', () => {
    expect(m.confidence).toBe('high');
    expect(value(m, 'jaw_to_cheek')).toBeCloseTo(320 / 400, 5);
    expect(value(m, 'chin_to_jaw')).toBeCloseTo(120 / 320, 5);
    // At (340, 680): rays (-40, -230) to the cheek and (160, 90) to the chin; dot -27100.
    expect(value(m, 'jaw_angle')).toBeCloseTo((Math.acos(-27100 / Math.sqrt(54500 * 33700)) * 180) / Math.PI, 3);
    expect(m.values.jaw_to_cheek?.confidence).toBe('high');
    expect(m.weight).toBe(1);
  });
});

describe('measure: lines, ticks and camera on the same photo', () => {
  const m = measure(observation(), null, hair());

  it('draws every line and the four thirds ticks', () => {
    expect(m.lines.map((l) => l.id)).toEqual(['face_outline', 'hairline', 'brow_right', 'brow_left', 'eye_line', 'nose_width', 'lip_line', 'jaw', 'chin']);
    const nose = m.lines.find((l) => l.id === 'nose_width')?.points ?? [];
    expect(nose.flatMap((p) => [p.x, p.y]).map((v) => Math.round(v * 1e5) / 1e5)).toEqual([0.465, 0.54, 0.535, 0.54]);
    // Under a visible hairline the outline runs from temple to temple through the chin, open: the hairline is the top.
    expect(m.lines.find((l) => l.id === 'face_outline')).toMatchObject({ closed: false });
    expect(m.lines.find((l) => l.id === 'face_outline')?.points).toHaveLength(23);
    const hidden = measure(observation(), null, hair({}, false)).lines.find((l) => l.id === 'face_outline');
    expect(hidden).toMatchObject({ closed: true });
    expect(hidden?.points).toHaveLength(36);
    const ticks = Object.fromEntries(m.ticks.map((t) => [t.id, t.point]));
    expect(ticks.hairline?.y).toBeCloseTo(0.22, 5);
    expect(ticks.brow?.y).toBeCloseTo(0.38, 5);
    expect(ticks.nose_base?.y).toBeCloseTo(0.56, 5);
    expect(ticks.chin?.y).toBeCloseTo(0.77, 5);
    expect(ticks.hairline?.x).toBeCloseTo(0.5, 5);
    expect(m.face).toEqual({ x: expect.closeTo(0.5, 5) as number, y: expect.closeTo(0.45, 5) as number, width: expect.closeTo(0.4, 5) as number });
  });

  it('works out the camera distance from the iris and the EXIF focal length', () => {
    // 80 / 43.27 x 1414.21 px = 2614.7 px; x 11.7 mm / 30 px = 1019.7 mm.
    expect(m.camera?.metres).toBeCloseTo(1.0197, 3);
    expect(m.camera?.fromExif).toBe(true);
    expect(cameraDistance(30, { widthPx: SIZE, heightPx: SIZE }, null)).toEqual({ metres: expect.closeTo(0.3314, 3) as number, fromExif: false });
  });
});

describe('measure: levelling and edits', () => {
  const upright = measure(observation(), null, hair());

  it('levels roll: a face rotated 12° gives the same values', () => {
    const tilted = measure(observation([face({ rotateDeg: 12 })]), null, hair({ rotateDeg: 12 }));
    expect(tilted.pose?.rollDeg).toBeCloseTo(12, 3);
    for (const [key, v] of Object.entries(upright.values)) expect(tilted.values[key as keyof typeof upright.values]?.value).toBeCloseTo(v.value, 4);
  });

  it('levels a mirrored selfie the same way, not upside down', () => {
    const mirrored = measure(observation([face({ mirror: true })]), null, hair({ mirror: true }));
    expect(Math.abs(mirrored.pose?.rollDeg ?? 99)).toBeLessThan(1e-6);
    expect(value(mirrored, 'third_upper')).toBeCloseTo(160 / 550, 5);
    expect(value(mirrored, 'jaw_to_cheek')).toBeCloseTo(0.8, 5);
  });

  it('uses moved points and a placed hairline (Move the lines)', () => {
    const edits: LandmarkEdits = { points: { 152: { x: 0.5, y: 0.79 } }, hairline: [{ x: 0.5, y: 0.2 }] };
    const edited = measure(observation(), edits, hair({}, false));
    expect(value(edited, 'width_to_length')).toBeCloseTo(400 / 540, 5);
    // Hairline 200, chin 790: sections 180, 180, 230 of 590.
    expect(value(edited, 'third_upper')).toBeCloseTo(180 / 590, 5);
    expect(edited.issues).not.toContain('hairline_hidden');
  });
});

describe('measure: confidence', () => {
  it('without EXIF a far photo is medium at best: the jaw width is read, the jaw angle and chin are not', () => {
    // Assumed 26 mm: 849.8 px x 11.7 / 10 px = 0.99 m.
    const m = measure(observation([face({ irisPx: 10 })], { focal35mm: null }), null, hair());
    expect(m.camera).toEqual({ metres: expect.closeTo(0.994, 2) as number, fromExif: false });
    expect(m.confidence).toBe('medium');
    expect(m.values.width_to_length?.confidence).toBe('medium');
    expect(m.values.jaw_to_cheek).toEqual({ value: expect.closeTo(0.8, 5) as number, confidence: 'medium', approximate: false });
    expect(m.values.jaw_angle).toBeUndefined();
    expect(m.values.chin_to_jaw).toBeUndefined();
    expect(m.weight).toBe(0.4);
  });

  it('claims no close-up without a focal length: an assumed lens cannot tell a close-up from a crop', () => {
    // The same face that reads 0.33 m with an assumed 26 mm lens (worked in the camera test).
    const m = measure(observation([face()], { focal35mm: null }), null, hair());
    expect(m.camera).toEqual({ metres: expect.closeTo(0.3314, 3) as number, fromExif: false });
    expect(m.issues).toEqual([]);
    expect(m).toMatchObject({ confidence: 'medium', approximate: false, weight: 0.4 });
    expect(m.values.width_to_length).toMatchObject({ confidence: 'medium', approximate: false });
  });

  it('a turn of 12° is medium, 18° low, 30° turned with no values', () => {
    const yaw = (deg: number): Float32Array => {
      const a = (deg * Math.PI) / 180;
      return new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, -50, 1]);
    };
    const at = (deg: number): PhotoMeasurements => measure(observation([face({}, { matrix: yaw(deg) })]), null, hair());
    expect(at(12).confidence).toBe('medium');
    expect(at(18).confidence).toBe('low');
    expect(at(30)).toMatchObject({ view: null, values: {}, weight: 0, issues: ['turned'] });
    expect(at(70)).toMatchObject({ view: 'profile', values: {}, weight: 0 });
    expect(at(30).lines.length).toBeGreaterThan(0);
  });

  it('a close-up with a known focal length stays low and approximate, with no jaw values', () => {
    const m = measure(observation([face()], { focal35mm: 26 }), null, hair());
    expect(m.issues).toEqual(['close_selfie']);
    expect(m).toMatchObject({ confidence: 'low', approximate: true, weight: 0.15 });
    expect(m.values.width_to_length).toMatchObject({ confidence: 'low', approximate: true });
    expect(m.values.jaw_to_cheek).toBeUndefined();
  });
});

describe('measure: issues found on whole observations', () => {
  it('no face, and nothing said when the face tool did not run', () => {
    expect(measure(observation([]), null, null)).toMatchObject({ issues: ['no_face'], lines: [], weight: 0, view: null });
    expect(measure(observation([], { ran: ['segmenter'] }), null, null).issues).toEqual([]);
  });

  it('several faces of a similar size; a small bystander is ignored', () => {
    const two = measure(observation([face({ scale: 0.7 }), face()]), null, hair());
    expect(two.issues).toContain('several_faces');
    expect(two.weight).toBe(0);
    expect(value(two, 'width_to_length')).toBeCloseTo(400 / 520, 5);
    expect(measure(observation([face(), face({ scale: 0.5 })]), null, hair()).issues).not.toContain('several_faces');
  });

  it('a small face, a blurred photo, a hand, a big smile', () => {
    expect(measure(observation([face({ scale: 0.3 })]), null, null).issues).toContain('face_too_small');
    expect(measure(observation(), null, hair(), 40).issues).toEqual(['blurred']);
    expect(measure(observation(), null, hair(), 40).confidence).toBe('medium');
    const hand = new Float32Array(21 * 3).fill(0.05);
    hand.set([0.5, 0.5, 0, 0.52, 0.5, 0, 0.54, 0.5, 0, 0.56, 0.5, 0]);
    expect(measure(observation([face()], { hands: [hand] }), null, hair()).issues).toEqual(['hand_over_face']);
    const smile = measure(observation([face({}, { expression: { mouthSmileLeft: 0.2, mouthSmileRight: 0.7 } })]), null, hair());
    expect(smile.issues).toEqual(['big_smile']);
    expect(smile.values.jaw_to_cheek).toBeUndefined();
  });

  it('a hidden hairline gives no thirds; no mask says nothing', () => {
    const hidden = measure(observation(), null, hair({}, false));
    expect(hidden.issues).toEqual(['hairline_hidden']);
    expect(hidden.values.third_upper).toBeUndefined();
    expect(hidden.ticks).toEqual([]);
    expect(hidden.lines.map((l) => l.id)).not.toContain('hairline');
    const noMask = measure(observation(), null, null);
    expect(noMask.issues).toEqual([]);
    expect(noMask.values.third_upper).toBeUndefined();
    expect(noMask.values.width_to_length).toBeDefined();
  });
});
