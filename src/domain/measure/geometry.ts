/**
 * Face geometry on one face mesh: the mesh in analysis pixels with the person's edits,
 * roll levelling on the eye line, head pose, and the face ratios. Levelling removes roll only; yaw and
 * pitch are left to the quality limits, because no 2D correction undoes them.
 */
import { toPx, type Point, type Size } from '../geometry/coords.ts';
import { EYE_LEFT, EYE_RIGHT, MESH_POINTS, POINT } from './landmarks.ts';

const DEG = 180 / Math.PI;

/** One face mesh in analysis pixels; `moved` points (normalised, from Move the lines) replace the landmarker's. */
export interface Mesh {
  /** Point `i` in analysis px. */
  readonly at: (i: number) => Point;
  /** MediaPipe's relative depth of point `i` in analysis px (its z uses the scale of x, the image width). */
  readonly depth: (i: number) => number;
}

/** True when `landmarks` holds the whole refined mesh as x, y, z triples. */
export const isFullMesh = (landmarks: Float32Array): boolean => landmarks.length >= MESH_POINTS * 3;

export function meshOf(landmarks: Float32Array, image: Size, moved: Readonly<Partial<Record<number, Point>>>): Mesh {
  return {
    at: (i) => toPx(moved[i] ?? { x: landmarks[i * 3] ?? Number.NaN, y: landmarks[i * 3 + 1] ?? Number.NaN }, image),
    depth: (i) => (landmarks[i * 3 + 2] ?? Number.NaN) * image.widthPx,
  };
}

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** A rotation about the eye-line centre that makes the eye line horizontal, and its inverse. */
export interface Level {
  readonly rollDeg: number;
  readonly level: (p: Point) => Point;
  readonly unlevel: (p: Point) => Point;
}

/**
 * Levels roll on the line through both eye centres (the prototype's method). The eyes are taken in image
 * order, left to right, so a mirrored selfie levels the same way instead of turning upside down.
 */
export function levelOf(mesh: Mesh): Level {
  const right = midpoint(mesh.at(EYE_RIGHT.outer), mesh.at(EYE_RIGHT.inner));
  const left = midpoint(mesh.at(EYE_LEFT.inner), mesh.at(EYE_LEFT.outer));
  const [a, b] = right.x <= left.x ? [right, left] : [left, right];
  const roll = Math.atan2(b.y - a.y, b.x - a.x);
  const c = midpoint(a, b);
  const cos = Math.cos(roll);
  const sin = Math.sin(roll);
  return {
    rollDeg: roll * DEG,
    level: (p) => ({ x: cos * (p.x - c.x) + sin * (p.y - c.y), y: -sin * (p.x - c.x) + cos * (p.y - c.y) }),
    unlevel: (p) => ({ x: c.x + cos * p.x - sin * p.y, y: c.y + sin * p.x + cos * p.y }),
  };
}

/** Head pose in degrees; only magnitudes are used, so the signs follow whichever source gave them. */
export interface Pose {
  readonly yawDeg: number;
  readonly pitchDeg: number;
  readonly rollDeg: number;
}

/**
 * Pose from MediaPipe's 4x4 facial transformation matrix (column-major, as `observation.ts` stores it), as
 * the X-Y-Z Euler angles of its rotation R = Rx(pitch) Ry(yaw) Rz(roll), the decomposition an earlier prototype used.
 */
export function poseFromMatrix(m: Float32Array): Pose {
  const r = (row: number, col: number): number => m[col * 4 + row] ?? 0;
  return {
    pitchDeg: Math.atan2(-r(1, 2), r(2, 2)) * DEG,
    yawDeg: Math.asin(Math.max(-1, Math.min(1, r(0, 2)))) * DEG,
    rollDeg: Math.atan2(-r(0, 1), r(0, 0)) * DEG,
  };
}

/**
 * Pose from the mesh when no matrix came back: yaw from the depth difference across the cheeks, pitch from the
 * depth difference between forehead top and chin (both level on the canonical face, within 0.7°), roll from the eyes.
 */
export function poseFromMesh(mesh: Mesh, level: Level): Pose {
  const across = Math.abs(level.level(mesh.at(POINT.cheekLeft)).x - level.level(mesh.at(POINT.cheekRight)).x);
  const down = Math.abs(level.level(mesh.at(POINT.menton)).y - level.level(mesh.at(POINT.foreheadTop)).y);
  return {
    yawDeg: Math.atan2(mesh.depth(POINT.cheekLeft) - mesh.depth(POINT.cheekRight), across) * DEG,
    pitchDeg: Math.atan2(mesh.depth(POINT.menton) - mesh.depth(POINT.foreheadTop), down) * DEG,
    rollDeg: level.rollDeg,
  };
}

/** Face width at the cheeks, analysis px (rotation-invariant). */
export const cheekWidthPx = (mesh: Mesh): number => distance(mesh.at(POINT.cheekRight), mesh.at(POINT.cheekLeft));

/** Levelled height of a point, analysis px (y grows downwards). */
const heightOf = (mesh: Mesh, level: Level, i: number): number => level.level(mesh.at(i)).y;

/** Cheek width over the levelled outline length, forehead top to chin (the earlier prototype's `outline_width_height`). */
export function widthToLength(mesh: Mesh, level: Level): number {
  return cheekWidthPx(mesh) / Math.abs(heightOf(mesh, level, POINT.menton) - heightOf(mesh, level, POINT.foreheadTop));
}

/** Jaw width at the jaw corners over the cheek width (the earlier prototype's `jaw_cheek`). */
export const jawToCheek = (mesh: Mesh): number => distance(mesh.at(POINT.jawRight), mesh.at(POINT.jawLeft)) / cheekWidthPx(mesh);

/** Chin width over the jaw width. */
export const chinToJaw = (mesh: Mesh): number =>
  distance(mesh.at(POINT.chinRight), mesh.at(POINT.chinLeft)) / distance(mesh.at(POINT.jawRight), mesh.at(POINT.jawLeft));

/** Angle in degrees at `corner` between the rays to `a` and `b`. */
export function angleDeg(corner: Point, a: Point, b: Point): number {
  const dot = (a.x - corner.x) * (b.x - corner.x) + (a.y - corner.y) * (b.y - corner.y);
  return Math.acos(Math.max(-1, Math.min(1, dot / (distance(corner, a) * distance(corner, b))))) * DEG;
}

/**
 * The outline's angle at the jaw corners, cheek to jaw corner to chin, both sides averaged (132° on the
 * canonical face). A frontal outline angle, not the bone's gonial angle; never shown as a value.
 */
export function jawAngleDeg(mesh: Mesh): number {
  const right = angleDeg(mesh.at(POINT.jawRight), mesh.at(POINT.cheekRight), mesh.at(POINT.menton));
  const left = angleDeg(mesh.at(POINT.jawLeft), mesh.at(POINT.cheekLeft), mesh.at(POINT.menton));
  return (right + left) / 2;
}

/** The three vertical thirds as shares of the face height (they sum to 1). */
export interface Thirds {
  readonly upper: number;
  readonly middle: number;
  readonly lower: number;
}

/**
 * Thirds from the levelled hairline height: hairline to brow line (glabella), brow line to the base of the
 * nose (subnasale), nose base to chin (menton). Null unless the four heights run strictly downwards.
 */
export function thirdsOf(mesh: Mesh, level: Level, hairlineY: number): Thirds | null {
  const upper = heightOf(mesh, level, POINT.glabella) - hairlineY;
  const middle = heightOf(mesh, level, POINT.subnasale) - heightOf(mesh, level, POINT.glabella);
  const lower = heightOf(mesh, level, POINT.menton) - heightOf(mesh, level, POINT.subnasale);
  const total = upper + middle + lower;
  return upper > 0 && middle > 0 && lower > 0 ? { upper: upper / total, middle: middle / total, lower: lower / total } : null;
}

/** The forehead third against the mean of the other two (1 means alike). */
export const foreheadShare = (t: Thirds): number => t.upper / ((t.middle + t.lower) / 2);

/** The lower third against the mean of the other two (1 means alike). */
export const lowerShare = (t: Thirds): number => t.lower / ((t.upper + t.middle) / 2);
