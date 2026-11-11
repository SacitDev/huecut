/**
 * PhotoObservation: what the analysis worker senses on one photo. The worker is a
 * sensor; `measure()` judges. Every point is normalised [0, 1] in the EXIF-oriented image.
 * Kept small (typed arrays of a few kilobytes) because it lives in the machine's context.
 */

/** CIE Lab colour (D65). Only ever shown as a hint. */
export interface Lab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

/** One face found by the face landmarker. */
export interface FaceObservation {
  /** 478 points as x, y, z triples (x, y normalised; z relative depth as MediaPipe gives it). */
  readonly landmarks: Float32Array;
  /** The 4x4 facial transformation matrix (column-major), or null when MediaPipe gives none. */
  readonly matrix: Float32Array | null;
  /** Blendshape scores used for expression checks (for example `mouthSmileLeft`), 0-1. */
  readonly expression: Readonly<Record<string, number>>;
}

/** Measures taken from the segmentation mask at analysis resolution. */
export interface HairMeasures {
  /** Share of the image that is hair, 0-1. */
  readonly coverage: number;
  /** Bounding box of the hair class, normalised, or null when no hair was found. */
  readonly extent: { readonly top: number; readonly bottom: number; readonly left: number; readonly right: number } | null;
  /** Points along the hair / face-skin boundary above the brows, as x, y pairs (normalised). */
  readonly hairline: Float32Array;
  /** True when enough of the hairline is visible to measure the forehead third. */
  readonly hairlineVisible: boolean;
  /** Median Lab samples; hints only. */
  readonly colour: { readonly hair: Lab | null; readonly skin: Lab | null; readonly eyes: Lab | null };
}

/** A small hair mask for the preview and for drawing, 256 px on the long side, values 0 or 255. */
export interface PreviewMask {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Uint8Array;
}

export interface PhotoObservation {
  readonly schemaVersion: 1;
  /** Size of the oriented analysis image (longest side at most 1400 px). */
  readonly image: { readonly widthPx: number; readonly heightPx: number };
  /** EXIF FocalLengthIn35mmFilm when present; helps the camera-distance check. */
  readonly focal35mm: number | null;
  /** Faces found (the landmarker is asked for up to 2, so "several faces" can be named). */
  readonly faces: readonly FaceObservation[];
  /** Hands found: 21 points each as x, y, z triples. */
  readonly hands: readonly Float32Array[];
  /** Body pose: 33 points as x, y, z, visibility quadruples, or null. */
  readonly pose: Float32Array | null;
  /** Hair measures, or null when the segmenter did not run (degraded mode). */
  readonly hair: HairMeasures | null;
  readonly previewMask: PreviewMask | null;
  /** Which core tools ran, so the face card can name a missing part. */
  readonly ran: readonly ('face' | 'hand' | 'pose' | 'segmenter')[];
}
