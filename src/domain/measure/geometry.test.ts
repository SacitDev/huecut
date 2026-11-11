/**
 * Geometry: the pose decomposition against rotation matrices built from known angles, levelling as an exact
 * inverse pair, pose from mesh depths, angles and the thirds' ordering guard.
 */
import { describe, expect, it } from 'vitest';
import { angleDeg, levelOf, meshOf, midpoint, poseFromMatrix, poseFromMesh, thirdsOf, type Mesh } from './geometry.ts';
import { MESH_POINTS } from './landmarks.ts';

type M3 = readonly (readonly [number, number, number])[];
const rad = (deg: number): number => (deg * Math.PI) / 180;
const rx = (d: number): M3 => [[1, 0, 0], [0, Math.cos(rad(d)), -Math.sin(rad(d))], [0, Math.sin(rad(d)), Math.cos(rad(d))]];
const ry = (d: number): M3 => [[Math.cos(rad(d)), 0, Math.sin(rad(d))], [0, 1, 0], [-Math.sin(rad(d)), 0, Math.cos(rad(d))]];
const rz = (d: number): M3 => [[Math.cos(rad(d)), -Math.sin(rad(d)), 0], [Math.sin(rad(d)), Math.cos(rad(d)), 0], [0, 0, 1]];
const mul = (a: M3, b: M3): M3 =>
  [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((s, k) => s + (a[i]?.[k] ?? 0) * (b[k]?.[j] ?? 0), 0)) as [number, number, number]);

/** A 4x4 transform stored column-major, as MediaPipe's matrix data. */
function columnMajor(r: M3): Float32Array {
  const m = new Float32Array(16);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) m[col * 4 + row] = r[row]?.[col] ?? 0;
  m[14] = -45;
  m[15] = 1;
  return m;
}

/** A mesh with the given points (normalised x, y, z) on a 1000 x 800 image; the rest at the centre. */
function mesh(points: Readonly<Record<number, readonly [number, number, number]>>): Mesh {
  const lm = new Float32Array(MESH_POINTS * 3).fill(0.5);
  for (const [i, [x, y, z]] of Object.entries(points)) lm.set([x, y, z], Number(i) * 3);
  return meshOf(lm, { widthPx: 1000, heightPx: 800 }, {});
}

const EYES = { 33: [0.38, 0.5, 0], 133: [0.46, 0.5, 0], 362: [0.54, 0.5, 0], 263: [0.62, 0.5, 0] } as const;

describe('pose', () => {
  it('recovers pitch, yaw and roll from R = Rx Ry Rz', () => {
    for (const [p, y, r] of [[8, -14, 5], [-20, 30, -12], [0, 0, 0], [3, 61, 2]] as const) {
      const pose = poseFromMatrix(columnMajor(mul(mul(rx(p), ry(y)), rz(r))));
      expect(pose.pitchDeg).toBeCloseTo(p, 3);
      expect(pose.yawDeg).toBeCloseTo(y, 3);
      expect(pose.rollDeg).toBeCloseTo(r, 3);
    }
  });

  it('reads yaw from the depth across the cheeks when there is no matrix', () => {
    // Cheeks 400 px apart, the left one 400 px deeper (z 0.4 of a 1000 px width): yaw 45°.
    const m = mesh({ ...EYES, 234: [0.3, 0.5, 0], 454: [0.7, 0.5, 0.4], 10: [0.5, 0.2, 0], 152: [0.5, 0.8, 0] });
    expect(poseFromMesh(m, levelOf(m)).yawDeg).toBeCloseTo(45, 4);
    expect(poseFromMesh(m, levelOf(m)).pitchDeg).toBeCloseTo(0, 6);
  });
});

describe('levelling and angles', () => {
  it('rotates the eye line flat about its centre, and back', () => {
    // Right eye centre (420, 400), left (580, 464): roll atan(64 / 160).
    const m = mesh({ 33: [0.38, 0.5, 0], 133: [0.46, 0.5, 0], 362: [0.54, 0.58, 0], 263: [0.62, 0.58, 0] });
    const level = levelOf(m);
    expect(level.rollDeg).toBeCloseTo((Math.atan(64 / 160) * 180) / Math.PI, 4);
    // The landmarks are Float32, so the eye centres are the mesh's own, not the literal pixels.
    const left = level.level(midpoint(m.at(362), m.at(263)));
    const right = level.level(midpoint(m.at(33), m.at(133)));
    expect(left.y).toBeCloseTo(right.y, 9);
    expect(left.x - right.x).toBeCloseTo(Math.hypot(160, 64), 3);
    for (const p of [{ x: 0, y: 0 }, { x: 123, y: 777 }]) {
      const back = level.unlevel(level.level(p));
      expect(back.x).toBeCloseTo(p.x, 9);
      expect(back.y).toBeCloseTo(p.y, 9);
    }
  });

  it('measures angles and refuses thirds that do not run downwards', () => {
    expect(angleDeg({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 9);
    expect(angleDeg({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 })).toBeCloseTo(180, 9);
    const m = mesh({ ...EYES, 9: [0.5, 0.45, 0], 2: [0.5, 0.65, 0], 152: [0.5, 0.85, 0] });
    const level = levelOf(m);
    // Brow line at 360 px, nose base 520, chin 680 (levelled about the eye centre at 400): equal thirds above 200.
    expect(thirdsOf(m, level, 200 - 400)).toEqual({ upper: expect.closeTo(1 / 3, 5) as number, middle: expect.closeTo(1 / 3, 5) as number, lower: expect.closeTo(1 / 3, 5) as number });
    expect(thirdsOf(m, level, 370 - 400)).toBeNull();
  });
});
