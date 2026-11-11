/**
 * Public types of the My look machine: steps, context, input, events and the notices it
 * emits. Features import only this file and `consult.selectors.ts`. Context holds inputs only.
 */
import type { ConsultData, LibraryIndex } from '../domain/content/output.ts';
import type { Collection } from '../domain/content/values.ts';
import type { DeviceInfo } from '../domain/device.ts';
import type { AnswerValue, Answers, QuestionId } from '../domain/facts/answers-to-facts.ts';
import type { Point } from '../domain/geometry/coords.ts';
import type { ItemId, LookId, PhotoId, PictureId, SlotKey } from '../domain/ids.ts';
import type { LandmarkEdits } from '../domain/measure/measure.ts';
import type { HairMeasures, PhotoObservation } from '../domain/measure/observation.ts';
import type { ColourChoice, ColourMode, ConsultGoal, ConsultSource, Grid, Pair, Prefs, SaveMode, SessionData, Shortlist, Slot, Step, TryOnTab } from '../domain/session/session-data.ts';
import type { AnalysisError, AnalysisErrorCode, ExtraModel, LoadProgress, ModelId, WorkerFault } from '../worker/protocol.ts';

export { STEPS } from '../domain/session/session-data.ts';
export type { ColourChoice, ColourMode, ConsultGoal, ConsultSource, Grid, Pair, Prefs, SaveMode, Shortlist, Slot, Step, TryOnTab };

/** The list holds at most 8 ideas, the person's own additions included. */
export const MAX_IDEAS = 8;
/** On phones only the 15 clearest photos are analysed; the rest stay listed. */
export const PHONE_ANALYSED_PHOTOS = 15;

interface PhotoCommon {
  readonly id: PhotoId;
  /** The resource store's thumbnail score (variance of the Laplacian); null when it could not decode one. */
  readonly sharpness: number | null;
  readonly edits: LandmarkEdits | null;
  /** Tap-to-select measures; the mask itself lives in the resource store under the photo id. */
  readonly refined: { readonly measures: HairMeasures } | null;
  /** Analyses that ended in a worker crash, a watchdog expiry or out of memory; one retry is allowed. */
  readonly tries: number;
}
/** A photo of this session: `queued` waits for analysis (on phones, possibly only listed); `done` has an observation; `failed` has a code. */
export type PhotoEntry = PhotoCommon & (
  | { readonly status: 'queued'; readonly observation: null; readonly error: null }
  | { readonly status: 'done'; readonly observation: PhotoObservation; readonly error: null }
  | { readonly status: 'failed'; readonly observation: null; readonly error: AnalysisErrorCode }
);

/** What the newest write of the session did: none yet, one on its way, committed, refused by the browser, or stopped because another session is saved here. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'refused' | 'taken';

/** Everything content the flow and the engine read. */
export interface ConsultContent {
  readonly library: LibraryIndex;
  readonly consult: ConsultData;
}

/** Why an extra is off on this device, shown in place of its button. */
export type ExtraBlock = 'no_webgl2' | 'low_memory' | 'computer_only' | 'crashed_last_time' | 'out_of_memory';

/** Device rules for the extras that are decided outside the machine. */
export interface ExtrasPolicy {
  /** Depth and tap-to-select on computers only: on the measured phone and tablet profiles they missed their limits. */
  readonly computersOnly: boolean;
  /** Extras whose "running extra" marker was found at boot: off for this tab. */
  readonly crashed: readonly ExtraModel[];
}

export type DownloadKey = 'core' | ExtraModel;
export interface ModelStatus {
  readonly progress: LoadProgress | null;
  readonly error: AnalysisError | null;
  /** Core only: the models that did not load (degraded mode names them). */
  readonly missing: readonly ModelId[];
}
export type ModelsStatus = Readonly<Record<DownloadKey, ModelStatus>> & {
  /** Times the worker ran out of memory this session; the second switches the extras off. */
  readonly outOfMemory: number;
};

export interface ConsultContext {
  readonly content: ConsultContent;
  readonly device: DeviceInfo;
  readonly extras: ExtrasPolicy;
  readonly source: ConsultSource;
  readonly photos: readonly PhotoEntry[];
  readonly mainPhotoId: PhotoId | null;
  readonly answers: Answers;
  readonly prefs: Prefs;
  /** ANALYSIS.SKIP was chosen ("Continue with answers only"); adding a photo brings the photos back in. */
  readonly skipped: boolean;
  readonly models: ModelsStatus;
  readonly shortlist: Shortlist;
  readonly pair: Pair | null;
  readonly slots: Readonly<Partial<Record<SlotKey, Slot>>>;
  readonly grids: readonly Grid[];
  /** How this session is saved: until deleted unless the person chose otherwise; `off` means no write at all. */
  readonly keep: SaveMode;
  /** A write of this session has committed, so a reload now brings it back; false until then and after a delete. */
  readonly keptStored: boolean;
  readonly saveStatus: SaveStatus;
  /** Epoch ms of the last committed write, for the time left of a 24-hour session; null before there is one. */
  readonly savedAt: number | null;
  /** The person said yes to this session taking the place of the one saved on this device; only a first write may use it. */
  readonly replaceSaved: boolean;
  /** The step a restored session returns to; cleared once `start` has used it. */
  readonly resumeAt: Step | null;
  readonly inFlight: { readonly photoId: PhotoId } | null;
  /** Index into `STEPS` of the furthest step reached. */
  readonly furthest: number;
}

export interface ConsultInput {
  readonly content: ConsultContent;
  readonly device: DeviceInfo;
  readonly extras: ExtrasPolicy;
  /** A kept round-trip session still within its chosen period; its photo and pictures are already in the resource store. */
  readonly restore: SessionData | null;
}

/** A photo the resource store has taken: the Blob stays there, the machine gets its id and sharpness. */
export interface AddedPhoto {
  readonly id: PhotoId;
  readonly sharpness: number | null;
}

export type StartEvent =
  /** `keep`: the browser's standing choice, when it is not the default. */
  | { readonly type: 'START'; readonly source: 'photo' | 'answers_only'; readonly keep?: SaveMode }
  /** The bundled session of a library model; its picture and hair mask are already in the resource store. */
  | { readonly type: 'START'; readonly source: 'example'; readonly session: SessionData };

export type ModelsEvent =
  | { readonly type: 'MODELS.PROGRESS'; readonly progress: LoadProgress }
  | { readonly type: 'MODELS.READY'; readonly loaded: readonly ModelId[]; readonly missing: readonly ModelId[] }
  | { readonly type: 'MODELS.FAILED'; readonly error: AnalysisError };
export type ExtraEvent =
  | { readonly type: 'EXTRA.PROGRESS'; readonly model: ExtraModel; readonly progress: LoadProgress }
  | { readonly type: 'EXTRA.READY'; readonly model: ExtraModel }
  | { readonly type: 'EXTRA.FAILED'; readonly model: ExtraModel; readonly error: AnalysisError };
/** What a loader actor sends back. */
export type LoaderEvent = ModelsEvent | ExtraEvent;
/** Sent by the supervisor when it replaced the worker. */
export interface WorkerRestartedEvent {
  readonly type: 'WORKER.RESTARTED';
  readonly reason: WorkerFault;
}

/** What a screen may send through the port; the rest of `MachineEvent` cannot be sent from a screen. */
export type ConsultEvent =
  | StartEvent
  | { readonly type: 'NEXT' }
  | { readonly type: 'RESET' }
  | { readonly type: 'PHOTOS.ADD'; readonly files: readonly AddedPhoto[] }
  | { readonly type: 'PHOTOS.REMOVE'; readonly id: PhotoId }
  | { readonly type: 'PHOTOS.SET_MAIN'; readonly id: PhotoId }
  /** `value: null` clears the answer; "Not sure" is an option index like any other. */
  | { readonly type: 'ANSWER'; readonly question: QuestionId; readonly value: AnswerValue | null }
  | {
      readonly type: 'PREFS.SET';
      readonly goal?: ConsultGoal | null;
      readonly collections?: readonly Collection[];
      readonly count?: number;
      readonly colour?: ColourChoice;
      readonly tab?: TryOnTab;
      readonly perPicture?: number;
    }
  | { readonly type: 'MODELS.RETRY' }
  | { readonly type: 'EXTRA.REQUEST'; readonly model: ExtraModel }
  | { readonly type: 'EXTRA.RETRY'; readonly model: ExtraModel }
  | { readonly type: 'CANCEL'; readonly model: DownloadKey }
  | { readonly type: 'ANALYSIS.SKIP' }
  /** Move the lines: a face-mesh point of the photo, by index, to a normalised position; refused unless it is the main photo. */
  | { readonly type: 'POINTS.MOVE'; readonly photoId: PhotoId; readonly index: number; readonly to: Point }
  /** Move the lines: the photo's whole hairline, to these normalised points; refused unless it is the main photo. */
  | { readonly type: 'HAIRLINE.MOVE'; readonly photoId: PhotoId; readonly to: readonly Point[] }
  /** Puts back one point (by index), the hairline, or every line of the photo as measured. */
  | { readonly type: 'POINTS.RESET'; readonly photoId: PhotoId; readonly part: number | 'hairline' | 'all' }
  | { readonly type: 'HAIR.REFINED'; readonly photoId: PhotoId; readonly measures: HairMeasures }
  | { readonly type: 'SHORTLIST.ADD'; readonly id: ItemId }
  | { readonly type: 'SHORTLIST.REMOVE'; readonly id: ItemId }
  /** `shown`: the list as the person saw it (the `ideas` selector), so the new order needs no engine call. */
  | { readonly type: 'SHORTLIST.MOVE'; readonly id: ItemId; readonly to: number; readonly shown: readonly ItemId[] }
  | { readonly type: 'PAIR.SET'; readonly cut: ItemId; readonly colour: ItemId }
  | { readonly type: 'PAIR.CLEAR' }
  /** `file`: the picture's id in the resource store (Blobs never enter the machine). */
  | { readonly type: 'SLOT.ADD'; readonly key: SlotKey; readonly file: PictureId }
  | { readonly type: 'SLOT.CLEAR'; readonly key: SlotKey }
  | { readonly type: 'SLOT.HAIR_ONLY'; readonly key: SlotKey; readonly on: boolean }
  | { readonly type: 'GRID.ADD'; readonly grid: number; readonly file: PictureId }
  | { readonly type: 'GRID.CONFIRM'; readonly grid: number; readonly order: readonly LookId[] }
  /** Changes how this session is saved; `off` deletes any saved copy and stops the saving. */
  | { readonly type: 'SESSION.KEEP'; readonly keep: SaveMode }
  /** The person said yes: this session takes the place of the one saved on this device. */
  | { readonly type: 'SESSION.REPLACE' }
  /** The person said yes on Home: a new session, whose first committed write replaces the saved one. */
  | { readonly type: 'START_AGAIN' };

/** Every event the machine takes: the screens', and those of the router, session-sync and its own actors. */
export type MachineEvent =
  | ConsultEvent
  /** Sent only by the router (`app/router-sync.ts`). */
  | { readonly type: 'NAVIGATE'; readonly to: Step }
  | LoaderEvent
  | WorkerRestartedEvent
  /** `app/session-sync.ts`, for all of these: a write is on its way. */
  | { readonly type: 'SESSION.SAVING' }
  /** A write committed; `latest` when no newer change waits behind it. */
  | { readonly type: 'SESSION.STORED'; readonly latest: boolean; readonly savedAt: number }
  /** The browser refused the write (quota, private mode); the last good save is still there. */
  | { readonly type: 'SESSION.REFUSED' }
  /** Another session is saved here: only the person may replace it. */
  | { readonly type: 'SESSION.TAKEN' }
  /** The saved copy was deleted elsewhere (another tab): it stays deleted, so saving stops. */
  | { readonly type: 'SESSION.DELETE' };

/** The notice the machine emits for the screens to say in words (`actor.on(type, ...)`): "Your list holds 8 ideas, the most it can. Remove one to add this." */
export interface ConsultEmitted { readonly type: 'SHORTLIST.REFUSED'; readonly id: ItemId; readonly reason: 'full' }
