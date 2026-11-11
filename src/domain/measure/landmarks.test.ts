/**
 * The named indices against their source: the connection lists of the installed `@mediapipe/tasks-vision`
 * (read from the package itself, so a version change that moves an index fails here).
 */
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { describe, expect, it } from 'vitest';
import {
  BROW_LEFT, BROW_RIGHT, CHIN_LINE, EYE_LEFT, EYE_RIGHT, FACE_OUTLINE, IRIS_LEFT, IRIS_RIGHT, JAW_LINE, LIPS_INNER_LOWER, LIPS_INNER_UPPER,
  MESH_POINTS, POINT, USED_POINTS,
} from './landmarks.ts';

interface Connection {
  readonly start: number;
  readonly end: number;
}
/** The indices of a connection list, in path order. */
const path = (connections: readonly Connection[]): number[] => [connections[0]?.start ?? -1, ...connections.map((c) => c.end)];
const members = (connections: readonly Connection[]): Set<number> => new Set(connections.flatMap((c) => [c.start, c.end]));

describe('landmark indices', () => {
  it('follow the face oval in its own order', () => {
    expect([...FACE_OUTLINE, FACE_OUTLINE[0]]).toEqual(path(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL));
    const oval = new Set<number>(FACE_OUTLINE);
    for (const i of [...JAW_LINE, ...CHIN_LINE, POINT.foreheadTop, POINT.menton, POINT.cheekRight, POINT.cheekLeft, POINT.jawRight, POINT.jawLeft, POINT.chinRight, POINT.chinLeft]) {
      expect(oval.has(i)).toBe(true);
    }
  });

  it('take brows, eyes, lips and irises from their connection lists', () => {
    expect(BROW_RIGHT).toEqual(path(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW.slice(4)));
    expect(BROW_LEFT).toEqual(path(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW.slice(4)));
    const right = members(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
    const left = members(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE);
    expect([right.has(EYE_RIGHT.outer), right.has(EYE_RIGHT.inner), left.has(EYE_LEFT.inner), left.has(EYE_LEFT.outer)]).toEqual([true, true, true, true]);
    const lips = FaceLandmarker.FACE_LANDMARKS_LIPS;
    expect(LIPS_INNER_LOWER).toEqual(path(lips.slice(20, 30)));
    expect(LIPS_INNER_UPPER).toEqual(path(lips.slice(30, 40)));
    expect(IRIS_RIGHT.ring).toEqual(path(FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS).slice(0, 4));
    expect(IRIS_LEFT.ring).toEqual(path(FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS).slice(0, 4));
  });

  it('stay inside the refined mesh', () => {
    expect(USED_POINTS.every((i) => Number.isInteger(i) && i >= 0 && i < MESH_POINTS)).toBe(true);
    expect([IRIS_RIGHT.centre, IRIS_LEFT.centre]).toEqual([468, 473]);
  });
});
