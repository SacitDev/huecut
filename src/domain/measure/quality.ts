/**
 * Photo quality: the nine issues `measure()` can name, the photo's view, the
 * confidence cap its pose, distance and issues allow, and its fusion weight. Every threshold is a named
 * constant with its reason. Issues are hints: they never block the flow.
 */
import { CONFIDENCE_RANK, type Confidence } from '../facts/registry.ts';
import type { Point } from '../geometry/coords.ts';
import type { Pose } from './geometry.ts';
import type { FaceObservation } from './observation.ts';

export const QUALITY_ISSUES = [
  'no_face', 'several_faces', 'face_too_small', 'blurred', 'turned', 'hand_over_face', 'big_smile', 'close_selfie', 'hairline_hidden',
] as const;
export type QualityIssue = (typeof QUALITY_ISSUES)[number];

/** Frontal and profile values are fused apart and never mixed. */
export type MeasureView = 'frontal' | 'profile';

/**
 * A second face at least this share of the largest face's width counts as "several faces". Face width falls
 * with distance, so a face below 60% of the largest stands more than 1.7 times as far away: a bystander behind,
 * not someone beside the person. The largest face is measured either way.
 */
export const SEVERAL_FACES_MIN_WIDTH_SHARE = 0.6;

/**
 * Faces narrower than this at the cheeks (analysis px) are too small. Landmarks wobble by about 1-2 px; at
 * 150 px that is up to 2% of the width per end, already the size of a band margin. A head-and-shoulders photo
 * at 1400 px gives 300-500 px.
 */
export const FACE_MIN_WIDTH_PX = 150;

/**
 * Variance of the Laplacian below this (256 px grey thumbnail, 4-neighbour kernel, grey 0-255) is blurred. 100
 * is the usual rule of thumb for that kernel on full frames; downscaling to 256 px sharpens a photo, so the
 * same cut on the thumbnail names only blur that survives downscaling, the kind that moves landmarks.
 * Chosen, not yet measured on the validation photos.
 */
export const BLUR_MAX_LAPLACIAN_VARIANCE = 100;

/** Beyond these the face is turned: an earlier prototype's angle gate (yaw 22°, pitch 24°). */
export const TURNED_YAW_DEG = 22;
export const TURNED_PITCH_DEG = 24;

/** From this yaw the near cheek hides the far half of the face: a side (profile) view. */
export const PROFILE_MIN_YAW_DEG = 60;

/**
 * Pose limits for each confidence. A turn of θ shortens widths or lengths by 1 - cos θ: 1.5% at 10°, 3.4% at
 * 15°, 7% at the turned limit of 22°. Up to 10° on both axes is within landmark noise (high). Medium takes a yaw up to 15°
 * (about one band margin on the widths) and any pitch a frontal photo can have (12 of 17 everyday frontal photos
 * had a pitch over 15°, and one person's 10 such photos read width to length with an SD of 0.026); beyond is low.
 */
export const HIGH_MAX_ANGLE_DEG = 10;
export const MEDIUM_MAX_ANGLE_DEG = 15;

/**
 * At least this many of a hand's 21 points inside the face outline is a hand over the face. A finger laid
 * across the face puts its 3-4 joints inside; a hand only touching the outline puts 1-2 there.
 */
export const HAND_MIN_POINTS_INSIDE = 3;

/**
 * Blendshape scores (0-1, MediaPipe's ARKit-style names) at or above which the expression changes the
 * measures: half of a full smile raises the cheeks and widens the mouth; a quarter-open jaw drops the chin
 * and lengthens the lower third. Chosen, not yet measured on the validation photos.
 */
export const BIG_SMILE_MIN_SCORE = 0.5;
export const MOUTH_OPEN_MIN_SCORE = 0.25;

/**
 * Camera distances (m) from the iris ruler. Under 0.6 m is a close-up: arm's-length selfies sit at 0.3-0.6 m,
 * where perspective makes the nose look about 30% wider than from 1.5 m (Ward et al., JAMA Facial Plast Surg
 * 2018) and narrows the outline. High confidence needs "about 1 m or more": 0.9 m allows the iris
 * ruler's spread (11.7 ± 0.5 mm, about 4%) and lens rounding.
 */
export const CLOSE_SELFIE_MAX_M = 0.6;
export const FAR_ENOUGH_MIN_M = 0.9;

/**
 * Fusion weight per confidence: one high photo (1) outweighs two medium ones (0.8) or six low ones (0.9),
 * so a single good photo from 1 m sets the median against a pile of close selfies.
 */
export const CONFIDENCE_WEIGHT = { high: 1, medium: 0.4, low: 0.15 } as const satisfies Record<Confidence, number>;

/** Issues after which a number would be false, not just rough: part of the face is covered, the face is too small for its landmarks, or the expression moves them. */
export const UNREADABLE: readonly QualityIssue[] = ['face_too_small', 'hand_over_face', 'big_smile'];

/** Issues after which every value is low: the landmarks are pulled, distorted or may be someone else's. A known close-up stays here: a word cannot repair its perspective. */
const DISTORTING: readonly QualityIssue[] = ['several_faces', ...UNREADABLE, 'close_selfie'];

/** The lower of two confidences. */
export const lowerOf = (a: Confidence, b: Confidence): Confidence => (CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b);

/** The face to measure (the widest at the cheeks) and whether another face is close enough in size to matter. */
export function pickFace(
  faces: readonly FaceObservation[],
  widthOf: (f: FaceObservation) => number,
): { readonly face: FaceObservation; readonly several: boolean } | null {
  const sorted = [...faces].sort((a, b) => widthOf(b) - widthOf(a));
  const [first, second] = sorted;
  if (!first) return null;
  return { face: first, several: second !== undefined && widthOf(second) >= SEVERAL_FACES_MIN_WIDTH_SHARE * widthOf(first) };
}

/** Even-odd test of a point against a closed polygon (any consistent space). */
export function insidePolygon(p: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a && b && a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** The most points of any one hand (21 x, y, z triples, normalised) inside the face outline (normalised). */
export function handPointsInside(hands: readonly Float32Array[], outline: readonly Point[]): number {
  let most = 0;
  for (const hand of hands) {
    let n = 0;
    for (let i = 0; i + 1 < hand.length; i += 3) if (insidePolygon({ x: hand[i] ?? -1, y: hand[i + 1] ?? -1 }, outline)) n++;
    most = Math.max(most, n);
  }
  return most;
}

/** What the quality checks read, worked out by `measure()`. */
export interface QualitySignals {
  readonly several: boolean;
  readonly faceWidthPx: number;
  /** Thumbnail sharpness, or null when the resource store has none yet. */
  readonly sharpness: number | null;
  readonly pose: Pose;
  readonly handPoints: number;
  readonly expression: Readonly<Record<string, number>>;
  /** Camera distance in metres, or null without iris points or a known focal length: an assumed lens cannot tell a close-up from a crop. */
  readonly cameraM: number | null;
  /** True when the hairline is known (mask or edit) but hidden; false when visible or unknown. */
  readonly hairlineHidden: boolean;
}

/** The view a pose gives: frontal within the turned limits, profile from 60° yaw, otherwise none. */
export function viewOf(pose: Pose): MeasureView | null {
  if (Math.abs(pose.yawDeg) <= TURNED_YAW_DEG && Math.abs(pose.pitchDeg) <= TURNED_PITCH_DEG) return 'frontal';
  return Math.abs(pose.yawDeg) >= PROFILE_MIN_YAW_DEG ? 'profile' : null;
}

/** Every issue the signals show, in `QUALITY_ISSUES` order. */
export function issuesOf(s: QualitySignals): QualityIssue[] {
  const smile = Math.max(s.expression.mouthSmileLeft ?? 0, s.expression.mouthSmileRight ?? 0);
  const found: Record<Exclude<QualityIssue, 'no_face'>, boolean> = {
    several_faces: s.several,
    face_too_small: s.faceWidthPx < FACE_MIN_WIDTH_PX,
    blurred: s.sharpness !== null && s.sharpness < BLUR_MAX_LAPLACIAN_VARIANCE,
    turned: viewOf(s.pose) !== 'frontal',
    hand_over_face: s.handPoints >= HAND_MIN_POINTS_INSIDE,
    big_smile: smile >= BIG_SMILE_MIN_SCORE || (s.expression.jawOpen ?? 0) >= MOUTH_OPEN_MIN_SCORE,
    close_selfie: s.cameraM !== null && s.cameraM < CLOSE_SELFIE_MAX_M,
    hairline_hidden: s.hairlineHidden,
  };
  return QUALITY_ISSUES.filter((issue): issue is Exclude<QualityIssue, 'no_face'> => issue !== 'no_face' && found[issue]);
}

/**
 * The best confidence a frontal photo's values can have. High needs both angles within 10° and a distance of at
 * least 0.9 m measured with the EXIF focal length; without EXIF the distance is only a hint, so medium at best.
 */
export function confidenceOf(pose: Pose, camera: { readonly metres: number; readonly fromExif: boolean } | null, issues: readonly QualityIssue[]): Confidence {
  const [yaw, pitch] = [Math.abs(pose.yawDeg), Math.abs(pose.pitchDeg)];
  let c: Confidence = yaw <= HIGH_MAX_ANGLE_DEG && pitch <= HIGH_MAX_ANGLE_DEG ? 'high' : yaw <= MEDIUM_MAX_ANGLE_DEG && pitch <= TURNED_PITCH_DEG ? 'medium' : 'low';
  if (!camera?.fromExif || camera.metres < FAR_ENOUGH_MIN_M) c = lowerOf(c, 'medium');
  if (issues.includes('blurred')) c = lowerOf(c, 'medium');
  if (issues.some((i) => DISTORTING.includes(i))) c = 'low';
  return c;
}

/**
 * The best confidence of the vertical measures (the thirds and the forehead and lower shares): a known close-up distorts widths,
 * not heights, so it does not lower these; the pose, blur, several-faces and unreadable-photo gates stay. The hairline gate is the band's own.
 */
export const sharesConfidenceOf = (pose: Pose, camera: { readonly metres: number; readonly fromExif: boolean } | null, issues: readonly QualityIssue[]): Confidence =>
  confidenceOf(pose, camera, issues.filter((i) => i !== 'close_selfie'));

/** The forehead share also needs the head level within 10° (pitch), since a nod foreshortens the forehead most. */
export const foreheadConfidenceOf = (shares: Confidence, pose: Pose): Confidence => (Math.abs(pose.pitchDeg) <= HIGH_MAX_ANGLE_DEG ? shares : 'low');

/** Fusion weight: 0 when nothing should be fused (no view, or maybe someone else's face), else by confidence. */
export function weightOf(view: MeasureView | null, confidence: Confidence, issues: readonly QualityIssue[]): number {
  return view === null || issues.includes('several_faces') ? 0 : CONFIDENCE_WEIGHT[confidence];
}
