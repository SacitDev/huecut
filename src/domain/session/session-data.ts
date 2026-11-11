/**
 * The round-trip session record: one versioned shape for a kept session and for the
 * bundled examples. Machine snapshots are never stored. `parseSessionData` checks a stored or bundled record without
 * Zod and turns plain number arrays (from JSON) back into the typed arrays an observation holds.
 */
import { COLLECTIONS, type Collection } from '../content/values.ts';
import type { AnswerValue, Answers } from '../facts/answers-to-facts.ts';
import type { Point } from '../geometry/coords.ts';
import { asItemId, asPhotoId, asPictureId, lookId, type ItemId, type LookId, type PhotoId, type PictureId, type SlotKey } from '../ids.ts';
import type { LandmarkEdits } from '../measure/measure.ts';
import type { FaceObservation, HairMeasures, Lab, PhotoObservation, PreviewMask } from '../measure/observation.ts';
import { err, ok, type Result } from '../result.ts';

export const SESSION_SCHEMA_VERSION = 2;
/** A session saved for the `day` period expires 24 h after it was last saved. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** How long a session is kept: 24 hours from its last save, or until the person deletes it. */
export const KEEP_CHOICES = ['day', 'until_deleted'] as const;
export type KeepChoice = (typeof KEEP_CHOICES)[number];
/** How a session is saved: for one of the two periods, or not at all ("Delete and don't save"). */
export type SaveMode = KeepChoice | 'off';
/** Saved by default: a new real session stays until the person deletes it, unless they switch it to 24 hours or off. */
export const DEFAULT_KEEP: KeepChoice = 'until_deleted';

/** The steps of My look in forward order; each is one URL `#/my-look/<step>`. */
export const STEPS = ['photo', 'face', 'goal', 'questions', 'ideas', 'try-on', 'board'] as const;
export type Step = (typeof STEPS)[number];
/** The goal question's answer: Cut, Colour or Both. */
export const CONSULT_GOALS = ['cut', 'colour', 'both'] as const;
export type ConsultGoal = (typeof CONSULT_GOALS)[number];
/** How My look started: with photos, from answers only, or the bundled example. */
export const SOURCES = ['photo', 'answers_only', 'example'] as const;
export type ConsultSource = (typeof SOURCES)[number];
/** "Colour in your results": keep the person's colour, one colour for all, or colours picked by the app. */
export const COLOUR_MODES = ['keep', 'one', 'pick'] as const;
export type ColourMode = (typeof COLOUR_MODES)[number];
/** The mode, and beside it the look of the chosen colour for `one`. */
export interface ColourChoice {
  readonly mode: ColourMode;
  readonly shade: ItemId | null;
}
/** Try it on's tabs: All together, One by one, My pictures, Tips. */
export const TRY_ON_TABS = ['together', 'single', 'pictures', 'tips'] as const;
export type TryOnTab = (typeof TRY_ON_TABS)[number];
const CORE_TOOLS = ['face', 'hand', 'pose', 'segmenter'] as const;

/** The one photo a session keeps: its analysis output, small preview mask and the person's edits. The refined mask is omitted. */
export interface SavedPhoto {
  readonly id: PhotoId;
  readonly sharpness: number | null;
  /** Null while the first analysis is still to come: the photo is saved as soon as it is added, and analysed again if it comes back first. */
  readonly observation: PhotoObservation | null;
  readonly edits: LandmarkEdits | null;
  /** The tap-to-select hair measures; the refined mask itself is not saved. */
  readonly refined: { readonly measures: HairMeasures } | null;
  /** Bundled examples only: the library picture used as the photo and the model's hair mask PNG. */
  readonly example: { readonly picture: string; readonly mask: string } | null;
}

/** The person's choices for the results; written once here, because the machine holds them and this record restores them. */
export interface Prefs {
  readonly goal: ConsultGoal | null;
  readonly collections: readonly Collection[];
  /** Ideas wanted; under Both the total of cuts and colour looks. */
  readonly count: number;
  /** "Colour in your results". Absent until chosen, and in older sessions: Keep for Cut, Pick for Both. */
  readonly colour?: ColourChoice;
  /** The Try it on tab shown. */
  readonly tab?: TryOnTab;
  /** Looks per picture on All together; absent means all together. */
  readonly perPicture?: number;
}
/** The person's changes to the list. */
export interface Shortlist {
  readonly added: readonly ItemId[];
  readonly removed: readonly ItemId[];
  readonly order: readonly ItemId[];
}
/** The one "Try together" pair: a cut and a colour look, both in the list. */
export interface Pair {
  readonly cut: ItemId;
  readonly colour: ItemId;
}
/** The picture a person added for one look. */
export interface Slot {
  readonly pictureId: PictureId;
  readonly hairOnly: boolean;
}
/** One quick grid's picture and the look each of its tiles shows. */
export interface Grid {
  /** The quick grid's number in the prompt pack (cut and colour ideas go in separate grids of at most 4). */
  readonly grid: number;
  readonly pictureId: PictureId;
  /** Empty until the person confirms which look each tile shows. */
  readonly ideas: readonly LookId[];
  readonly confirmed: boolean;
}

export interface SessionData {
  readonly schemaVersion: typeof SESSION_SCHEMA_VERSION;
  /** Which session this is, so a tab never writes over another one's session unasked; absent in a record saved before there were ids. */
  readonly id?: string;
  /** Epoch ms of the last save; 0 in a bundled example, which never expires. */
  readonly savedAt: number;
  /** Absent in a record saved before this choice existed, which counts as `day`. */
  readonly keep?: KeepChoice;
  readonly source: ConsultSource;
  readonly step: Step;
  /** Index into `STEPS` of the furthest step reached. */
  readonly furthest: number;
  readonly answers: Answers;
  readonly prefs: Prefs;
  readonly shortlist: Shortlist;
  readonly pair: Pair | null;
  readonly slots: Readonly<Partial<Record<SlotKey, Slot>>>;
  readonly grids: readonly Grid[];
  readonly photo: SavedPhoto | null;
}

/** `version`: written by another schema version; `shape`: the field at `path` is missing or wrong. */
export interface SessionDataError {
  readonly code: 'version' | 'shape';
  readonly path: string;
}

/** 24 hours are up by this time. One that cannot be right counts as up: not a number, or a day or more ahead of the clock (the margin is for a clock set back a little). */
export const dayIsOver = (savedAt: number, nowMs: number): boolean => !Number.isFinite(savedAt) || Math.abs(nowMs - savedAt) >= SESSION_TTL_MS;

/** True once a session kept for 24 hours, or with no period at all, is past its own time; one kept until deleted and a bundled example never expire by time. */
export const isExpired = (data: SessionData, nowMs: number): boolean =>
  data.source !== 'example' && (!Number.isFinite(data.savedAt) || (data.keep !== 'until_deleted' && dayIsOver(data.savedAt, nowMs)));

// ── Readers: each returns the checked value or throws a ShapeError naming the path ──

class ShapeError extends Error {
  readonly path: string;
  constructor(path: string) {
    super(`session data: bad ${path}`);
    this.path = path;
  }
}

type Obj = Readonly<Record<string, unknown>>;
type Read<T> = (v: unknown, path: string) => T;

const fail = (path: string): never => {
  throw new ShapeError(path);
};
const obj: Read<Obj> = (v, p) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : fail(p));
const num: Read<number> = (v, p) => (typeof v === 'number' && Number.isFinite(v) ? v : fail(p));
const int =
  (min: number, max: number): Read<number> =>
  (v, p) => {
    const n = num(v, p);
    return Number.isInteger(n) && n >= min && n <= max ? n : fail(p);
  };
const str: Read<string> = (v, p) => (typeof v === 'string' && v.length > 0 ? v : fail(p));
const bool: Read<boolean> = (v, p) => (typeof v === 'boolean' ? v : fail(p));
const nullable =
  <T>(read: Read<T>): Read<T | null> =>
  (v, p) =>
    v === null ? null : read(v, p);
const list =
  <T>(read: Read<T>): Read<T[]> =>
  (v, p) =>
    Array.isArray(v) ? v.map((x, i) => read(x, `${p}[${String(i)}]`)) : fail(p);
const oneOf =
  <T extends string | number>(values: readonly T[]): Read<T> =>
  (v, p) =>
    values.includes(v as T) ? (v as T) : fail(p);
const id =
  <T>(as: (s: string) => T): Read<T> =>
  (v, p) =>
    as(str(v, p));
/** An object read field by field in the spec's order, each at `<path>.<field>`. */
const record =
  <T extends object>(spec: { readonly [K in keyof T]-?: Read<T[K]> }): Read<T> =>
  (v, p) => {
    const o = obj(v, p);
    return Object.fromEntries(
      Object.entries<Read<unknown>>(spec).map(([k, read]) => [k, read(o[k], `${p}.${k}`)]),
    ) as T;
  };
/** An object of any keys, each value read at `<path>.<key>`. */
const dict =
  <T>(read: (v: unknown, path: string, key: string) => T): Read<Record<string, T>> =>
  (v, p) =>
    Object.fromEntries(Object.entries(obj(v, p)).map(([k, x]) => [k, read(x, `${p}.${k}`, k)]));

/** A typed array as stored (IndexedDB keeps it) or as a plain number array (JSON). */
const f32: Read<Float32Array> = (v, p) => (v instanceof Float32Array ? v : Float32Array.from(list(num)(v, p)));
const u8: Read<Uint8Array> = (v, p) => (v instanceof Uint8Array ? v : Uint8Array.from(list(int(0, 255))(v, p)));

const point = record<Point>({ x: num, y: num });
const lab = nullable(record<Lab>({ l: num, a: num, b: num }));
const hair = record<HairMeasures>({
  coverage: num,
  extent: nullable(record<NonNullable<HairMeasures['extent']>>({ top: num, bottom: num, left: num, right: num })),
  hairline: f32,
  hairlineVisible: bool,
  colour: record<HairMeasures['colour']>({ hair: lab, skin: lab, eyes: lab }),
});
const maskShape = record<PreviewMask>({ widthPx: int(1, 4096), heightPx: int(1, 4096), data: u8 });
const mask: Read<PreviewMask> = (v, p) => {
  const m = maskShape(v, p);
  return m.data.length === m.widthPx * m.heightPx ? m : fail(`${p}.data`);
};
const observation = record<PhotoObservation>({
  schemaVersion: oneOf([1] as const),
  image: record<PhotoObservation['image']>({ widthPx: int(1, 1400), heightPx: int(1, 1400) }),
  focal35mm: nullable(num),
  faces: list(record<FaceObservation>({ landmarks: f32, matrix: nullable(f32), expression: dict(num) })),
  hands: list(f32),
  pose: nullable(f32),
  hair: nullable(hair),
  previewMask: nullable(mask),
  ran: list(oneOf(CORE_TOOLS)),
});
/** Moved face-mesh points by index (0-477) and an optional placed hairline. */
const edits = record<LandmarkEdits>({
  points: dict((v, p, key) => {
    int(0, 477)(Number(key), p);
    return point(v, p);
  }),
  hairline: nullable(list(point)),
});
const savedPhoto = record<SavedPhoto>({
  id: id(asPhotoId),
  sharpness: nullable(num),
  observation: nullable(observation),
  edits: nullable(edits),
  refined: nullable(record<NonNullable<SavedPhoto['refined']>>({ measures: hair })),
  example: nullable(record<NonNullable<SavedPhoto['example']>>({ picture: str, mask: str })),
});

const answer: Read<AnswerValue> = (v, p) => {
  const o = obj(v, p);
  const chosen = list(int(0, 99))(o.chosen, `${p}.chosen`);
  return o.under === undefined ? { chosen } : { chosen, under: str(o.under, `${p}.under`) };
};
const slot = record<Slot>({ pictureId: id(asPictureId), hairOnly: bool });
const items = list(id(asItemId));

/** The three later preferences are optional: a session kept before they existed still restores, and its safety is computed again. */
const prefs: Read<Prefs> = (v, p) => {
  const o = obj(v, p);
  const colour = record<ColourChoice>({ mode: oneOf(COLOUR_MODES), shade: nullable(id(asItemId)) });
  return {
    ...record<Pick<Prefs, 'goal' | 'collections' | 'count'>>({ goal: nullable(oneOf(CONSULT_GOALS)), collections: list(oneOf(COLLECTIONS)), count: int(1, 8) })(v, p),
    ...(o.colour === undefined ? {} : { colour: colour(o.colour, `${p}.colour`) }),
    ...(o.tab === undefined ? {} : { tab: oneOf(TRY_ON_TABS)(o.tab, `${p}.tab`) }),
    ...(o.perPicture === undefined ? {} : { perPicture: int(1, 6)(o.perPicture, `${p}.perPicture`) }),
  };
};

const sessionShape = record<Omit<SessionData, 'schemaVersion' | 'keep' | 'id'>>({
  savedAt: num,
  source: oneOf(SOURCES),
  step: oneOf(STEPS),
  furthest: int(0, STEPS.length - 1),
  answers: dict(answer),
  prefs,
  shortlist: record<Shortlist>({ added: items, removed: items, order: items }),
  pair: nullable(record<Pair>({ cut: id(asItemId), colour: id(asItemId) })),
  // A slot key is `<idea>@<photo>` (the pair: `<cut>+<colour>@<photo>`).
  slots: dict((v, p, key) => (/^.+@.+$/.test(key) ? slot(v, p) : fail(p))),
  grids: list(
    record<Grid>({
      grid: int(0, 99),
      pictureId: id(asPictureId),
      ideas: list(id(lookId)),
      confirmed: bool,
    }),
  ),
  photo: nullable(savedPhoto),
});

/** Checks a stored or bundled record; plain number arrays become typed arrays. */
export function parseSessionData(raw: unknown): Result<SessionData, SessionDataError> {
  try {
    const o = obj(raw, '$');
    if (o.schemaVersion !== SESSION_SCHEMA_VERSION) return err({ code: 'version', path: '$.schemaVersion' });
    const data: SessionData = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      ...sessionShape(o, '$'),
      ...(o.keep === undefined ? {} : { keep: oneOf(KEEP_CHOICES)(o.keep, '$.keep') }),
      ...(o.id === undefined ? {} : { id: str(o.id, '$.id') }),
    };
    if (STEPS.indexOf(data.step) > data.furthest) fail('$.furthest');
    if (data.source === 'example' && !data.photo?.example) fail('$.photo.example');
    return ok(data);
  } catch (e) {
    if (e instanceof ShapeError) return err({ code: 'shape', path: e.path });
    throw e;
  }
}
