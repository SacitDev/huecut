/**
 * Named MediaPipe face-mesh indices (478-point refined layout) for each face line and value, with the
 * source of every index. "Right" and "left" are the person's own sides, as MediaPipe names them.
 *
 * Sources: (a) the connection lists of `FaceLandmarker` in `@mediapipe/tasks-vision` 1.2.2
 * (`FACE_LANDMARKS_FACE_OVAL`, `_LIPS`, `_RIGHT_EYE`, `_LEFT_EYE`, `_RIGHT_EYEBROW`, `_LEFT_EYEBROW`,
 * `_RIGHT_IRIS`, `_LEFT_IRIS`), printed from the installed package; (b) the canonical face model's vertex
 * positions (cm, x to the person's left, y up), read from `geometry_pipeline_metadata_landmarks.binarypb`
 * inside the bundled `face_landmarker.task`, quoted as "canonical x, y".
 */

/** Points in the refined mesh: 468 face points and 10 iris points. */
export const MESH_POINTS = 478;

/** The face outline, closed, clockwise from the forehead top (a: `FACE_LANDMARKS_FACE_OVAL`, in its order). */
export const FACE_OUTLINE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172,
  58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
] as const;

/**
 * The outline from the right temple (356) through the chin (152) to the left temple (127), the run of `FACE_OUTLINE` below
 * the temples: drawn when a hairline is, so the hairline is the face's real top and no arc crosses the forehead under it.
 */
export const FACE_OUTLINE_LOWER = FACE_OUTLINE.slice(FACE_OUTLINE.indexOf(356), FACE_OUTLINE.indexOf(127) + 1);

/** Upper edge of each brow, outer to inner (a: the second run of `_RIGHT_EYEBROW` and `_LEFT_EYEBROW`). */
export const BROW_RIGHT = [70, 63, 105, 66, 107] as const;
export const BROW_LEFT = [300, 293, 334, 296, 336] as const;

/**
 * The eye line, through both eyes from the right outer corner to the left outer corner (a: the corners where
 * the upper and lower runs of `_RIGHT_EYE` (33, 133) and `_LEFT_EYE` (362, 263) meet).
 */
export const EYE_LINE = [33, 133, 362, 263] as const;
export const EYE_RIGHT = { outer: 33, inner: 133 } as const;
export const EYE_LEFT = { inner: 362, outer: 263 } as const;

/**
 * Nose width across the alar wings (b: 129 and 358 are the widest nose points, canonical x ∓1.79 cm,
 * against ∓1.73 for 102 / 331 and ∓1.59 for 64 / 294; an alar width of 3.6 cm).
 */
export const NOSE_WIDTH = [129, 358] as const;

/**
 * Where the lips meet: the inner upper and inner lower rings, corner to corner (a: the third and fourth runs
 * of `_LIPS`). The lip line is drawn through the midpoints of each pair.
 */
export const LIPS_INNER_UPPER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308] as const;
export const LIPS_INNER_LOWER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308] as const;

/** The jaw from below the right ear round the chin to below the left ear (a: the lower run of the outline). */
export const JAW_LINE = [58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288] as const;

/** The chin curve between the chin's sides (a: the outline either side of 152 out to 176 and 400). */
export const CHIN_LINE = [176, 148, 152, 377, 400] as const;

/** Single points that values are measured between. */
export const POINT = {
  /** Top of the outline (a: first point of the oval; canonical y 8.26). Not the hairline: the mesh stops on the forehead. */
  foreheadTop: 10,
  /** Between the brows (b: canonical y 4.89, level with the brows' upper edges at 5.01-5.11): the brow line of the thirds. */
  glabella: 9,
  /** Where the nose meets the upper lip (b: canonical y -2.09, z 6.06, below the nostril bases 98 / 327 at -1.71). */
  subnasale: 2,
  /** Lowest point of the chin (a: the oval's bottom point; canonical y -9.40). */
  menton: 152,
  /** Widest points of the face outline (a, b: canonical x ∓7.66, the oval's widest pair). */
  cheekRight: 234,
  cheekLeft: 454,
  /** Jaw corners, the prototype's jaw width (a: oval points six steps either side of the menton; canonical x ∓5.94, y -6.22). */
  jawRight: 172,
  jawLeft: 397,
  /** Sides of the chin (a: two steps either side of the menton; canonical x ∓2.31, below the mouth corners at ∓2.46). */
  chinRight: 176,
  chinLeft: 400,
} as const;

/** Iris centre and ring (a: `_RIGHT_IRIS` 469-472, `_LEFT_IRIS` 474-477; the centres 468 and 473 follow the face's 468). */
export const IRIS_RIGHT = { centre: 468, ring: [469, 470, 471, 472] } as const;
export const IRIS_LEFT = { centre: 473, ring: [474, 475, 476, 477] } as const;

/** Every index any line or value reads, for tests and for Move the lines. */
export const USED_POINTS: readonly number[] = [
  ...new Set<number>([
    ...FACE_OUTLINE, ...BROW_RIGHT, ...BROW_LEFT, ...EYE_LINE, ...NOSE_WIDTH, ...LIPS_INNER_UPPER, ...LIPS_INNER_LOWER,
    ...JAW_LINE, ...CHIN_LINE, ...Object.values(POINT), IRIS_RIGHT.centre, ...IRIS_RIGHT.ring, IRIS_LEFT.centre, ...IRIS_LEFT.ring,
  ]),
];
