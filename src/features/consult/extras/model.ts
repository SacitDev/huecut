/**
 * Pure rules of the extras: which looks the rough preview can show and with what targets, what it cannot draw, the turn of the 3D
 * view and the spot of tap-to-select.
 */
import type { IndexEntry, Lab, LabBands, LookIndexEntry, LookLab } from '../../../domain/content/output.ts';
import type { Collection } from '../../../domain/content/values.ts';
import type { Point } from '../../../domain/geometry/coords.ts';
import type { BandTargets, TintTargets } from '../../../worker/protocol.ts';

/** The placements the preview does not draw; the look's overall shade is shown instead. */
const UNDRAWN_REGIONS: ReadonlySet<string> = new Set(['face_frame', 'highlights', 'lowlights']);
/** One press of Turn left or Turn right, and the limit of the turn either way. */
export const TURN_STEP_DEG = 5;
export const TURN_LIMIT_DEG = 15;
/** Up and down, as far as one photo allows before the face stretches. */
export const TILT_STEP_DEG = 5;
export const TILT_LIMIT_DEG = 10;
/** One press of a move button shifts the spot this share of the photo's side. */
export const SPOT_STEP = 0.03;

export type Family = LookIndexEntry['traits']['family'];
export interface FamilyLooks {
  readonly family: Family;
  readonly looks: readonly LookIndexEntry[];
}

/** The looks the preview can honestly show (at least one of root, mids and ends has a target), of the collections chosen once there are any. */
export function previewLooks(entries: readonly IndexEntry[], collections: readonly Collection[] = []): LookIndexEntry[] {
  return entries.filter((e): e is LookIndexEntry =>
    e.kind === 'colour' && (e.lab.root !== null || e.lab.mids !== null || e.lab.ends !== null) && (collections.length === 0 || e.collections.some((c) => collections.includes(c))));
}

/** The looks grouped by family, families in order of their first look. */
export function byFamily(looks: readonly LookIndexEntry[]): FamilyLooks[] {
  const groups = new Map<Family, LookIndexEntry[]>();
  for (const look of looks) groups.set(look.traits.family, [...(groups.get(look.traits.family) ?? []), look]);
  return [...groups].map(([family, members]) => ({ family, looks: members }));
}

const labOf = ([l, a, b]: Lab) => ({ l, a, b });
const bandsOf = (bands: LabBands | null): BandTargets | null => (bands ? { shadows: labOf(bands.shadows), mid: labOf(bands.mid), light: labOf(bands.light) } : null);

/** A look's targets as the worker's `tint` takes them; `null` keeps the person's own colour in that region. */
export const tintTargets = (lab: LookLab): TintTargets => ({ root: bandsOf(lab.root), mids: bandsOf(lab.mids), ends: bandsOf(lab.ends) });

/** The look has placements the preview does not draw, so it says "Your colourist places the highlights". */
export const placedByColourist = (look: LookIndexEntry): boolean => look.traits.regions.some((r) => UNDRAWN_REGIONS.has(r));

/** A turn or tilt kept within its limit, in whole degrees. */
export const clampTurn = (degrees: number, limit: number): number => Math.round(Math.min(limit, Math.max(-limit, degrees)));

/** A position inside `box` as a point normalised to it, kept inside the photo. */
export function pointIn(box: { readonly left: number; readonly top: number; readonly width: number; readonly height: number }, clientX: number, clientY: number): Point {
  return clampPoint({ x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height });
}

export const clampPoint = (p: Point): Point => ({ x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) });

export type SpotMove = 'up' | 'down' | 'left' | 'right';
export const SPOT_MOVES: readonly SpotMove[] = ['up', 'down', 'left', 'right'];
const MOVES: Readonly<Record<SpotMove, Point>> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

/** The spot after one press of a move button (the keyboard alternative to a tap). */
export const movedSpot = (p: Point, move: SpotMove): Point => clampPoint({ x: p.x + MOVES[move].x * SPOT_STEP, y: p.y + MOVES[move].y * SPOT_STEP });
