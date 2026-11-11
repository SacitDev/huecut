/**
 * `measure(observation, edits, hairMeasures) → PhotoMeasurements`: for one photo,
 * the painter's lines and thirds ticks, the values with their confidence, the quality issues and the fusion
 * weight. The worker's observation and Move the lines run exactly this code.
 */
import type { Confidence } from '../facts/registry.ts';
import { fromPx, type Point, type Size } from '../geometry/coords.ts';
import * as g from './geometry.ts';
import { hairlineHeight, hairlineOf, type HairlineReading } from './hairline.ts';
import * as L from './landmarks.ts';
import type { FaceObservation, HairMeasures, PhotoObservation } from './observation.ts';
import * as q from './quality.ts';

/**
 * The face values. The thirds and shares need a visible hairline; the jaw width needs medium confidence or better;
 * the jaw angle and chin need high (frontal, from about 1 m or more; not validated). The jaw angle is never shown.
 */
export const MEASURE_KEYS = [
  'width_to_length', 'length_to_width', 'third_upper', 'third_middle', 'third_lower', 'forehead_share', 'lower_share', 'jaw_to_cheek', 'jaw_angle', 'chin_to_jaw',
] as const;
/** One face value. */
export type MeasureKey = (typeof MEASURE_KEYS)[number];

export interface MeasuredValue {
  readonly value: number;
  readonly confidence: Confidence;
  /** "approximate (close-up photo)". */
  readonly approximate: boolean;
}
export type MeasuredValues = Readonly<Partial<Record<MeasureKey, MeasuredValue>>>;

export const LINE_IDS = ['face_outline', 'hairline', 'brow_right', 'brow_left', 'eye_line', 'nose_width', 'lip_line', 'jaw', 'chin'] as const;
export type LineId = (typeof LINE_IDS)[number];
/** A line for the painter, normalised in the oriented image. */
export interface FaceLine {
  readonly id: LineId;
  readonly points: readonly Point[];
  readonly closed: boolean;
}
/** The four heights that bound the thirds, drawn as quiet ticks on the face midline. */
export type TickId = 'hairline' | 'brow' | 'nose_base' | 'chin';
export interface ThirdTick {
  readonly id: TickId;
  readonly point: Point;
}

/** What the person changed on Move the lines; all points normalised in the oriented image. */
export interface LandmarkEdits {
  /** Moved face-mesh points by index. */
  readonly points: Readonly<Partial<Record<number, Point>>>;
  /** A hairline the person placed, replacing the measured one; null keeps the measured line. */
  readonly hairline: readonly Point[] | null;
}

export interface CameraDistance {
  readonly metres: number;
  /** False: the focal length was assumed, so this distance cannot tell a close-up from a crop. */
  readonly fromExif: boolean;
}

export interface PhotoMeasurements {
  /** Null with no face, or a face turned between frontal and profile. */
  readonly view: q.MeasureView | null;
  readonly lines: readonly FaceLine[];
  readonly ticks: readonly ThirdTick[];
  /** Values come from frontal photos only. */
  readonly values: MeasuredValues;
  readonly issues: readonly q.QualityIssue[];
  /** The best confidence this photo allows, or null with no face. */
  readonly confidence: Confidence | null;
  /** Fusion weight, 0 when the photo adds nothing to fusion. */
  readonly weight: number;
  readonly approximate: boolean;
  readonly camera: CameraDistance | null;
  readonly pose: g.Pose | null;
  /** The measured face's cheek-line centre and width, normalised: how fusion spots near-identical photos. */
  readonly face: { readonly x: number; readonly y: number; readonly width: number } | null;
  readonly hairlineVisible: boolean;
}

/** White-to-white (visible iris) diameter, 11.71 ± 0.42 mm in adults (Rüfer, Schröder & Erb, Cornea 2005); the prototype's ruler. */
export const IRIS_DIAMETER_MM = 11.7;
/** Diagonal of the 36 x 24 mm frame; a 35 mm-equivalent focal length is defined on the diagonal. */
export const FILM_DIAGONAL_MM = 43.27;
/** Without EXIF: the prototype's assumption; phone main and front cameras are 23-28 mm equivalent. */
export const ASSUMED_FOCAL35_MM = 26;

/** Iris diameter in px: per eye the larger of the ring's two diameters (a turn narrows one), averaged. */
export function irisDiameterPx(mesh: g.Mesh): number | null {
  const sizes = [L.IRIS_RIGHT, L.IRIS_LEFT].map(({ ring: [a, b, c, d] }) =>
    Math.max(g.distance(mesh.at(a), mesh.at(c)), g.distance(mesh.at(b), mesh.at(d))),
  );
  const mean = sizes.reduce((s, v) => s + v, 0) / sizes.length;
  return Number.isFinite(mean) && mean > 0 ? mean : null;
}

/** Camera distance from the iris ruler: focal length in px (from the 35 mm equivalent) x iris size / iris px. */
export function cameraDistance(irisPx: number, image: Size, focal35mm: number | null): CameraDistance {
  const focalPx = ((focal35mm ?? ASSUMED_FOCAL35_MM) / FILM_DIAGONAL_MM) * Math.hypot(image.widthPx, image.heightPx);
  return { metres: (focalPx * IRIS_DIAMETER_MM) / irisPx / 1000, fromExif: focal35mm !== null };
}

const EMPTY: Omit<PhotoMeasurements, 'issues'> = {
  view: null, lines: [], ticks: [], values: {}, confidence: null, weight: 0, approximate: false, camera: null, pose: null, face: null,
  hairlineVisible: false,
};

/**
 * Measures one photo. `hairMeasures` are the worker's automatic ones or, after tap-to-select, the refined
 * ones; `sharpness` is the resource store's thumbnail score (null when it has none yet).
 */
export function measure(
  observation: PhotoObservation,
  edits: LandmarkEdits | null,
  hairMeasures: HairMeasures | null,
  sharpness: number | null = null,
): PhotoMeasurements {
  const moved = edits?.points ?? {};
  const faces = observation.faces.filter((f) => g.isFullMesh(f.landmarks));
  const picked = q.pickFace(faces, (f) => g.cheekWidthPx(g.meshOf(f.landmarks, observation.image, moved)));
  if (!picked) return { ...EMPTY, issues: observation.ran.includes('face') ? ['no_face'] : [] };
  return measureFace(observation, picked, edits, hairMeasures, sharpness);
}

/** What one face gives before any judging: mesh, levelling, pose, camera distance and the hairline. */
interface Sensed {
  readonly mesh: g.Mesh;
  readonly level: g.Level;
  readonly pose: g.Pose;
  readonly camera: CameraDistance | null;
  /** The hairline when it is visible and reaches the midline, otherwise null. */
  readonly hairline: HairlineReading | null;
  /** Its height at the midline, levelled px. */
  readonly hairlineY: number | null;
  /** Known (mask or edit) but hidden; an unknown hairline is not hidden. */
  readonly hairlineHidden: boolean;
}

function sense(observation: PhotoObservation, face: FaceObservation, edits: LandmarkEdits | null, hairMeasures: HairMeasures | null): Sensed {
  const { image } = observation;
  const mesh = g.meshOf(face.landmarks, image, edits?.points ?? {});
  const level = g.levelOf(mesh);
  const iris = irisDiameterPx(mesh);
  const reading = hairlineOf(hairMeasures, edits?.hairline ?? null);
  const hairlineY = reading?.visible ? midlineHairline(mesh, level, reading, image) : null;
  return {
    mesh,
    level,
    pose: face.matrix ? g.poseFromMatrix(face.matrix) : g.poseFromMesh(mesh, level),
    camera: iris === null ? null : cameraDistance(iris, image, observation.focal35mm),
    hairline: hairlineY === null ? null : reading,
    hairlineY,
    hairlineHidden: reading !== null && hairlineY === null,
  };
}

function measureFace(
  observation: PhotoObservation,
  picked: { readonly face: FaceObservation; readonly several: boolean },
  edits: LandmarkEdits | null,
  hairMeasures: HairMeasures | null,
  sharpness: number | null,
): PhotoMeasurements {
  const { image } = observation;
  const s = sense(observation, picked.face, edits, hairMeasures);
  const { mesh, level, pose, camera, hairlineY } = s;
  const issues = q.issuesOf({
    several: picked.several,
    faceWidthPx: g.cheekWidthPx(mesh),
    sharpness,
    pose,
    handPoints: q.handPointsInside(observation.hands, L.FACE_OUTLINE.map((i) => fromPx(mesh.at(i), image))),
    expression: picked.face.expression,
    cameraM: camera?.fromExif ? camera.metres : null,
    hairlineHidden: s.hairlineHidden,
  });
  const view = q.viewOf(pose);
  const confidence = q.confidenceOf(pose, camera, issues);
  const approximate = issues.includes('close_selfie');
  const shares = q.sharesConfidenceOf(pose, camera, issues);
  const values = view === 'frontal' ? valuesOf(mesh, level, hairlineY, { confidence, shares, forehead: q.foreheadConfidenceOf(shares, pose) }, approximate) : {};
  const centre = fromPx(g.midpoint(mesh.at(L.POINT.cheekRight), mesh.at(L.POINT.cheekLeft)), image);
  return {
    view, issues, confidence, approximate, camera, pose, values,
    lines: linesOf(mesh, image, s.hairline),
    ticks: hairlineY === null || !values.third_upper ? [] : ticksOf(mesh, level, hairlineY, image),
    weight: Object.keys(values).length === 0 ? 0 : q.weightOf(view, confidence, issues),
    face: { ...centre, width: g.cheekWidthPx(mesh) / image.widthPx },
    hairlineVisible: hairlineY !== null,
  };
}

/** The hairline height at the midline, levelled px, from the reading's points. */
function midlineHairline(mesh: g.Mesh, level: g.Level, reading: HairlineReading, image: Size): number | null {
  const levelled = reading.points.map((p) => level.level({ x: p.x * image.widthPx, y: p.y * image.heightPx }));
  return hairlineHeight(levelled, level.level(mesh.at(L.POINT.glabella)).x, g.cheekWidthPx(mesh));
}

/**
 * The frontal values; thirds only with a hairline height, the jaw width from medium confidence, the jaw angle and chin at high only. The
 * thirds and shares carry their own confidence: a known close-up keeps the widths low but not the heights, and the forehead share also
 * needs a level head.
 */
function valuesOf(mesh: g.Mesh, level: g.Level, hairlineY: number | null, c: { readonly confidence: Confidence; readonly shares: Confidence; readonly forehead: Confidence }, approximate: boolean): MeasuredValues {
  const { confidence } = c;
  const widthToLength = g.widthToLength(mesh, level);
  const raw: Partial<Record<MeasureKey, number>> = { width_to_length: widthToLength, length_to_width: 1 / widthToLength };
  const thirds = hairlineY === null ? null : g.thirdsOf(mesh, level, hairlineY);
  if (thirds) {
    Object.assign(raw, { third_upper: thirds.upper, third_middle: thirds.middle, third_lower: thirds.lower });
    Object.assign(raw, { forehead_share: g.foreheadShare(thirds), lower_share: g.lowerShare(thirds) });
  }
  if (confidence !== 'low') raw.jaw_to_cheek = g.jawToCheek(mesh);
  if (confidence === 'high') Object.assign(raw, { jaw_angle: g.jawAngleDeg(mesh), chin_to_jaw: g.chinToJaw(mesh) });
  const out: Partial<Record<MeasureKey, MeasuredValue>> = {};
  for (const key of MEASURE_KEYS) {
    const value = raw[key];
    if (value !== undefined && Number.isFinite(value)) out[key] = { value, confidence: key === 'forehead_share' ? c.forehead : VERTICAL.has(key) ? c.shares : confidence, approximate };
  }
  return out;
}

/** The measures read from heights alone, which a close-up does not distort. */
const VERTICAL: ReadonlySet<MeasureKey> = new Set<MeasureKey>(['third_upper', 'third_middle', 'third_lower', 'forehead_share', 'lower_share']);

/** The face lines; the hairline only when it is visible (`reading` is null otherwise), and then the outline below the temples only. */
function linesOf(mesh: g.Mesh, image: Size, reading: HairlineReading | null): FaceLine[] {
  const at = (i: number): Point => fromPx(mesh.at(i), image);
  const line = (id: LineId, indices: readonly number[], closed = false): FaceLine => ({ id, points: indices.map(at), closed });
  const lip = L.LIPS_INNER_UPPER.map((u, k) => g.midpoint(at(u), at(L.LIPS_INNER_LOWER[k] ?? u)));
  return [
    reading ? line('face_outline', L.FACE_OUTLINE_LOWER) : line('face_outline', L.FACE_OUTLINE, true),
    ...(reading && reading.points.length >= 2 ? [{ id: 'hairline', points: reading.points, closed: false } as const] : []),
    line('brow_right', L.BROW_RIGHT),
    line('brow_left', L.BROW_LEFT),
    line('eye_line', L.EYE_LINE),
    line('nose_width', L.NOSE_WIDTH),
    { id: 'lip_line', points: lip, closed: false },
    line('jaw', L.JAW_LINE),
    line('chin', L.CHIN_LINE),
  ];
}

/** Ticks at the hairline, brow line, nose base and chin heights, on the levelled midline through the glabella. */
function ticksOf(mesh: g.Mesh, level: g.Level, hairlineY: number, image: Size): ThirdTick[] {
  const midX = level.level(mesh.at(L.POINT.glabella)).x;
  const tick = (id: TickId, y: number): ThirdTick => ({ id, point: fromPx(level.unlevel({ x: midX, y }), image) });
  const y = (i: number): number => level.level(mesh.at(i)).y;
  return [tick('hairline', hairlineY), tick('brow', y(L.POINT.glabella)), tick('nose_base', y(L.POINT.subnasale)), tick('chin', y(L.POINT.menton))];
}
