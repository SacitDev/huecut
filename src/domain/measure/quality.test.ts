/**
 * Quality issues one by one from clean signals, each just inside and just past its threshold; the view and
 * confidence rules; the face pick and the hand test.
 */
import { describe, expect, it } from 'vitest';
import type { FaceObservation } from './observation.ts';
import {
  BIG_SMILE_MIN_SCORE, BLUR_MAX_LAPLACIAN_VARIANCE, CLOSE_SELFIE_MAX_M, FACE_MIN_WIDTH_PX, HAND_MIN_POINTS_INSIDE, MOUTH_OPEN_MIN_SCORE,
  confidenceOf, foreheadConfidenceOf, handPointsInside, sharesConfidenceOf, insidePolygon, issuesOf, pickFace, viewOf, weightOf, type QualitySignals,
} from './quality.ts';

const CLEAN: QualitySignals = {
  several: false,
  faceWidthPx: 400,
  sharpness: 500,
  pose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0 },
  handPoints: 0,
  expression: {},
  cameraM: 1.2,
  hairlineHidden: false,
};
const issues = (change: Partial<QualitySignals>): readonly string[] => issuesOf({ ...CLEAN, ...change });

describe('quality issues, one at a time', () => {
  it('finds nothing on clean signals', () => {
    expect(issues({})).toEqual([]);
  });

  it('several faces, small face, blur', () => {
    expect(issues({ several: true })).toEqual(['several_faces']);
    expect(issues({ faceWidthPx: FACE_MIN_WIDTH_PX })).toEqual([]);
    expect(issues({ faceWidthPx: FACE_MIN_WIDTH_PX - 1 })).toEqual(['face_too_small']);
    expect(issues({ sharpness: BLUR_MAX_LAPLACIAN_VARIANCE })).toEqual([]);
    expect(issues({ sharpness: BLUR_MAX_LAPLACIAN_VARIANCE - 1 })).toEqual(['blurred']);
    expect(issues({ sharpness: null })).toEqual([]);
  });

  it('turned: past 22° yaw or 24° pitch', () => {
    expect(issues({ pose: { yawDeg: 22, pitchDeg: 24, rollDeg: 40 } })).toEqual([]);
    expect(issues({ pose: { yawDeg: -22.5, pitchDeg: 0, rollDeg: 0 } })).toEqual(['turned']);
    expect(issues({ pose: { yawDeg: 0, pitchDeg: 25, rollDeg: 0 } })).toEqual(['turned']);
  });

  it('hand over the face, big smile, open mouth', () => {
    expect(issues({ handPoints: HAND_MIN_POINTS_INSIDE - 1 })).toEqual([]);
    expect(issues({ handPoints: HAND_MIN_POINTS_INSIDE })).toEqual(['hand_over_face']);
    expect(issues({ expression: { mouthSmileLeft: BIG_SMILE_MIN_SCORE - 0.01, mouthSmileRight: 0.1 } })).toEqual([]);
    expect(issues({ expression: { mouthSmileLeft: 0.1, mouthSmileRight: BIG_SMILE_MIN_SCORE } })).toEqual(['big_smile']);
    expect(issues({ expression: { jawOpen: MOUTH_OPEN_MIN_SCORE } })).toEqual(['big_smile']);
  });

  it('close-up selfie and hidden hairline', () => {
    expect(issues({ cameraM: CLOSE_SELFIE_MAX_M })).toEqual([]);
    expect(issues({ cameraM: CLOSE_SELFIE_MAX_M - 0.01 })).toEqual(['close_selfie']);
    expect(issues({ cameraM: null })).toEqual([]);
    expect(issues({ hairlineHidden: true })).toEqual(['hairline_hidden']);
  });

  it('lists several issues in the fixed order', () => {
    expect(issues({ hairlineHidden: true, several: true, sharpness: 1 })).toEqual(['several_faces', 'blurred', 'hairline_hidden']);
  });
});

describe('view, confidence and weight', () => {
  const far = { metres: 1.2, fromExif: true };

  it('names the view from the yaw', () => {
    expect(viewOf({ yawDeg: 10, pitchDeg: 5, rollDeg: 0 })).toBe('frontal');
    expect(viewOf({ yawDeg: 40, pitchDeg: 0, rollDeg: 0 })).toBeNull();
    expect(viewOf({ yawDeg: -75, pitchDeg: 0, rollDeg: 0 })).toBe('profile');
  });

  it('gives high only within 10° and from 0.9 m measured with EXIF', () => {
    const pose = (yawDeg: number) => ({ yawDeg, pitchDeg: 0, rollDeg: 0 });
    expect(confidenceOf(pose(10), far, [])).toBe('high');
    expect(confidenceOf(pose(10.5), far, [])).toBe('medium');
    expect(confidenceOf(pose(15.5), far, [])).toBe('low');
    expect(confidenceOf(pose(0), { metres: 0.89, fromExif: true }, [])).toBe('medium');
    expect(confidenceOf(pose(0), { metres: 2, fromExif: false }, [])).toBe('medium');
    expect(confidenceOf(pose(0), null, [])).toBe('medium');
    expect(confidenceOf(pose(0), far, ['blurred'])).toBe('medium');
    expect(confidenceOf(pose(0), far, ['hairline_hidden'])).toBe('high');
    for (const issue of ['several_faces', 'face_too_small', 'hand_over_face', 'big_smile', 'close_selfie'] as const) {
      expect(confidenceOf(pose(0), far, [issue])).toBe('low');
    }
  });

  it('gives medium for a yaw up to 15° and any frontal pitch, high only with both angles within 10°', () => {
    const at = (yawDeg: number, pitchDeg: number) => ({ yawDeg, pitchDeg, rollDeg: 0 });
    expect(confidenceOf(at(5, 20), far, [])).toBe('medium');
    expect(confidenceOf(at(15, 24), far, [])).toBe('medium');
    expect(confidenceOf(at(5, 10.5), far, [])).toBe('medium');
    expect(confidenceOf(at(18, 0), far, [])).toBe('low');
    expect(confidenceOf(at(10, 10), far, [])).toBe('high');
    // Past 24° of pitch the photo is turned, not frontal, so it gives no frontal values at all.
    expect(viewOf(at(0, 25))).toBeNull();
    expect(issues({ pose: at(0, 25) })).toEqual(['turned']);
  });

  it('keeps the heights of a known close-up at the pose confidence and the widths low; the forehead also needs a level head', () => {
    const level = { yawDeg: 5, pitchDeg: 5, rollDeg: 0 };
    const close = { metres: 0.4, fromExif: true };
    expect(confidenceOf(level, close, ['close_selfie'])).toBe('low');
    expect(sharesConfidenceOf(level, close, ['close_selfie'])).toBe('medium');
    for (const gate of ['several_faces', 'face_too_small', 'hand_over_face', 'big_smile'] as const) expect(sharesConfidenceOf(level, close, ['close_selfie', gate])).toBe('low');
    expect(sharesConfidenceOf(level, far, ['blurred'])).toBe('medium');
    expect(foreheadConfidenceOf('medium', level)).toBe('medium');
    expect(foreheadConfidenceOf('medium', { yawDeg: 0, pitchDeg: 12, rollDeg: 0 })).toBe('low');
  });
});

describe('weight', () => {
  it('weighs by confidence, and not at all without a view or with several faces', () => {
    expect([weightOf('frontal', 'high', []), weightOf('frontal', 'medium', []), weightOf('frontal', 'low', [])]).toEqual([1, 0.4, 0.15]);
    expect(weightOf(null, 'high', [])).toBe(0);
    expect(weightOf('frontal', 'low', ['several_faces'])).toBe(0);
  });
});

describe('face pick and hands', () => {
  const f = (id: number): FaceObservation => ({ landmarks: new Float32Array([id]), matrix: null, expression: {} });
  const width = (x: FaceObservation): number => [0, 300, 200, 150][x.landmarks[0] ?? 0] ?? 0;

  it('measures the widest face and names several only for a near-equal second', () => {
    expect(pickFace([], width)).toBeNull();
    expect(pickFace([f(3), f(1)], width)).toEqual({ face: f(1), several: false });
    expect(pickFace([f(2), f(1)], width)).toEqual({ face: f(1), several: true });
  });

  it('counts the hand points inside the outline', () => {
    const square = [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }];
    expect(insidePolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
    expect(insidePolygon({ x: 0.9, y: 0.5 }, square)).toBe(false);
    const hand = new Float32Array(21 * 3).fill(0.95);
    hand.set([0.5, 0.5, 0, 0.6, 0.6, 0]);
    expect(handPointsInside([hand], square)).toBe(2);
    expect(handPointsInside([], square)).toBe(0);
  });
});
