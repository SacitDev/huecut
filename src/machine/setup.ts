/**
 * The machine's setup: its types, guards (`hasX`, `canX`, `wantsX`, `isX`), context actions,
 * and the abstract parts `app/compose.ts` injects with `provide()`: the actors, the `hasIdeas` guard (the engine is a
 * selector) and two side-effect actions. Tests inject fakes built with the same constructors, so they type-check.
 * The model-status guards and actions live with their region in `regions/models.ts`.
 */
import { assertEvent, assign, fromCallback, fromPromise, setup, type EventObject } from 'xstate';
import type { PhotoId, PictureId } from '../domain/ids.ts';
import type { PhotoObservation } from '../domain/measure/observation.ts';
import { err, type Result } from '../domain/result.ts';
import type { AnalysisError } from '../worker/protocol.ts';
import * as L from './consult.logic.ts';
import type {
  ConsultContext,
  ConsultEmitted,
  MachineEvent,
  ConsultInput,
  ConsultSource,
  DownloadKey,
  LoaderEvent,
  Step,
  WorkerRestartedEvent,
} from './consult.types.ts';

// ── What compose.ts implements (and tests fake) ──

export interface LoaderInput {
  readonly model: DownloadKey;
}
export interface AnalyseInput {
  readonly photoId: PhotoId;
}
/** Starts one download and reports through `send`; `signal` aborts once its downloading state is left. */
export type LoadModels = (input: LoaderInput, send: (event: LoaderEvent) => void, signal: AbortSignal) => void;
/** Analyses one photo of the resource store; `signal` aborts when the analysis region leaves `working`. */
export type AnalysePhoto = (
  input: AnalyseInput,
  signal: AbortSignal,
) => Promise<Result<PhotoObservation, AnalysisError>>;
/** Creates the session's supervisor; returns the cleanup that terminates the worker and disposes all resources. */
export type SuperviseWorker = (send: (event: WorkerRestartedEvent) => void) => () => void;

/** The loader actor for `loadModels`: stopping it aborts its download. */
export const loaderActor = (load: LoadModels) =>
  fromCallback<EventObject, LoaderInput>(({ input, sendBack }) => {
    const abort = new AbortController();
    load(input, sendBack, abort.signal);
    return () => {
      abort.abort();
    };
  });
/** The promise actor for `analysePhoto`. */
export const analyseActor = (analyse: AnalysePhoto) =>
  fromPromise<Result<PhotoObservation, AnalysisError>, AnalyseInput>(({ input, signal }) => analyse(input, signal));
/** The session-level actor for `superviseWorker`: it lives exactly as long as `session`. */
export const supervisorActor = (supervise: SuperviseWorker) =>
  fromCallback<EventObject, null>(({ sendBack }) => supervise(sendBack));

const injected = (what: string) => (): never => {
  throw new Error(`${what} is provided in app/compose.ts with machine.provide()`);
};

/** The in-flight photo; `working` is entered only with one claimed (guarded by `hasNextPhoto`). */
export function inFlightId(c: ConsultContext): PhotoId {
  if (!c.inFlight) throw new Error('invariant: analysis started without a claimed photo');
  return c.inFlight.photoId;
}

const THREW: Result<never, AnalysisError> = err({
  code: 'internal',
  retryable: false,
  detail: 'the analysis actor threw',
});

export const consultSetup = setup({
  types: {
    context: {} as ConsultContext,
    events: {} as MachineEvent,
    input: {} as ConsultInput,
    emitted: {} as ConsultEmitted,
  },
  actors: {
    superviseWorker: fromCallback<EventObject, null>(injected('the actor superviseWorker')),
    loadModels: fromCallback<EventObject, LoaderInput>(injected('the actor loadModels')),
    analysePhoto: fromPromise<Result<PhotoObservation, AnalysisError>, AnalyseInput>(
      injected('the actor analysePhoto'),
    ),
  },
  guards: {
    /** The engine runs in a selector; compose.ts provides `({ context }) => selectors.hasIdeas(context)`. */
    hasIdeas: injected('the guard hasIdeas'),
    wantsCore: ({ context }) => L.wantsCore(context),
    hasGoal: ({ context }) => L.hasGoal(context),
    /** Any photo, a failed one too: the face card step says what happened to it (an existence guard, not a usability one). */
    hasPhoto: ({ context }) => context.photos.length > 0,
    reachedIdeas: ({ context }) => L.reachedIdeas(context),
    hasNextPhoto: ({ context }) => !context.skipped && L.analysisQueue(context).length > 0,
    isRestored: ({ context }) => context.resumeAt !== null,
    isResumeAt: ({ context }, params: { step: Step }) => context.resumeAt === params.step,
    isSource: ({ context }, params: { source: ConsultSource }) => context.source === params.source,
    canNavigateTo: ({ context, event }, params: { step: Step }) =>
      event.type === 'NAVIGATE' && event.to === params.step && L.canEnter(context, params.step, true),
    isMainPhotoEdit: ({ context, event }) =>
      (event.type === 'POINTS.MOVE' || event.type === 'HAIRLINE.MOVE' || event.type === 'POINTS.RESET') && L.isMainPhotoEdit(context, event.photoId),
    canAddToShortlist: ({ context, event }) =>
      event.type === 'SHORTLIST.ADD' && L.canAddToShortlist(context.shortlist, event.id),
    isPairOfKinds: ({ context, event }) => event.type === 'PAIR.SET' && L.isPairOfKinds(context.content, event),
    isNewMainPhoto: ({ context, event }) =>
      event.type === 'PHOTOS.SET_MAIN' &&
      event.id !== context.mainPhotoId &&
      context.photos.some((p) => p.id === event.id),
    isMainPhotoSlot: ({ context, event }) => event.type === 'SLOT.ADD' && L.isMainPhotoSlot(context, event.key),
  },
  actions: {
    /** Removes a photo from the resource store and frees its worker-side embedding (`release(photoId)`). */
    releasePhoto: (_, params: { readonly photoId: PhotoId }) => {
      injected(`the action releasePhoto(${params.photoId})`)();
    },
    /** Disposes pictures (AI pictures, grid tiles) in the resource store. */
    disposePictures: (_, params: { readonly ids: readonly PictureId[] }) => {
      injected(`the action disposePictures(${params.ids.join(', ')})`)();
    },

    reach: assign({
      furthest: ({ context }, params: { step: Step }) => Math.max(context.furthest, L.stepIndex(params.step)),
    }),
    clearResume: assign({ resumeAt: null }),
    skipAnalysis: assign({ skipped: true }),

    addPhotos: assign(
      ({ context, event }) => (assertEvent(event, 'PHOTOS.ADD'), L.withPhotosAdded(context, event.files)),
    ),
    removePhoto: assign(
      ({ context, event }) => (assertEvent(event, 'PHOTOS.REMOVE'), L.withPhotoRemoved(context, event.id)),
    ),
    setMainPhoto: assign(
      ({ context, event }) => (assertEvent(event, 'PHOTOS.SET_MAIN'), L.withMainPhoto(context, event.id)),
    ),
    storeRefined: assign({
      photos: ({ context, event }) => {
        assertEvent(event, 'HAIR.REFINED');
        return context.photos.map((p) =>
          p.id === event.photoId ? { ...p, refined: { measures: event.measures } } : p,
        );
      },
    }),
    storeAnswer: assign({
      answers: ({ context, event }) => {
        assertEvent(event, 'ANSWER');
        const rest = Object.fromEntries(Object.entries(context.answers).filter(([q]) => q !== event.question));
        return event.value === null ? rest : { ...rest, [event.question]: event.value };
      },
    }),
    storePrefs: assign({
      prefs: ({ context, event }) => (assertEvent(event, 'PREFS.SET'), L.withPrefs(context, event)),
    }),

    claimPhoto: assign({
      inFlight: ({ context }) => {
        const next = L.analysisQueue(context)[0];
        return next ? { photoId: next.id } : null;
      },
    }),
    storeAnalysis: assign(({ context }, params: { output: Result<PhotoObservation, AnalysisError> }) =>
      L.withAnalysis(context, params.output),
    ),
    failInFlight: assign(({ context }) => L.withAnalysis(context, THREW)),

    movePoint: assign(({ context, event }) => {
      assertEvent(event, 'POINTS.MOVE');
      return L.withEdits(context, event.photoId, (e) => ({ ...e, points: { ...e.points, [event.index]: event.to } }));
    }),
    moveHairline: assign(({ context, event }) => {
      assertEvent(event, 'HAIRLINE.MOVE');
      return L.withEdits(context, event.photoId, (e) => ({ ...e, hairline: event.to }));
    }),
    resetPoints: assign(({ context, event }) => {
      assertEvent(event, 'POINTS.RESET');
      return L.withEdits(context, event.photoId, (e) => (event.part === 'all' ? null : L.withoutPart(e, event.part)));
    }),

    addToShortlist: assign({
      shortlist: ({ context, event }) => (
        assertEvent(event, 'SHORTLIST.ADD'),
        L.withAdded(context.shortlist, event.id)
      ),
    }),
    removeFromShortlist: assign({
      shortlist: ({ context, event }) => (
        assertEvent(event, 'SHORTLIST.REMOVE'),
        L.withRemoved(context.shortlist, event.id)
      ),
    }),
    moveInShortlist: assign({
      shortlist: ({ context, event }) => (
        assertEvent(event, 'SHORTLIST.MOVE'),
        L.withMoved(context.shortlist, event.shown, event.id, event.to)
      ),
    }),
    setPair: assign({
      pair: ({ event }) => (assertEvent(event, 'PAIR.SET'), { cut: event.cut, colour: event.colour }),
    }),
    clearPair: assign({ pair: null }),

    addSlot: assign({
      slots: ({ context, event }) => (
        assertEvent(event, 'SLOT.ADD'),
        { ...context.slots, [event.key]: { pictureId: event.file, hairOnly: false } }
      ),
    }),
    clearSlot: assign({
      slots: ({ context, event }) => (
        assertEvent(event, 'SLOT.CLEAR'),
        Object.fromEntries(Object.entries(context.slots).filter(([k]) => k !== event.key))
      ),
    }),
    setHairOnly: assign({
      slots: ({ context, event }) => {
        assertEvent(event, 'SLOT.HAIR_ONLY');
        const slot = context.slots[event.key];
        return slot ? { ...context.slots, [event.key]: { ...slot, hairOnly: event.on } } : context.slots;
      },
    }),
    addGrid: assign({
      grids: ({ context, event }) => (
        assertEvent(event, 'GRID.ADD'),
        L.withGrid(context.grids, event.grid, event.file)
      ),
    }),
    confirmGrid: assign({
      grids: ({ context, event }) => (
        assertEvent(event, 'GRID.CONFIRM'),
        L.withGridConfirmed(context.grids, event.grid, event.order)
      ),
    }),
    // Changing the period of a stored session leaves it stored: only the next write changes what is on the device.
    keepSession: assign(({ context, event }) => (
      assertEvent(event, 'SESSION.KEEP'),
      {
        keep: event.keep,
        keptStored: event.keep !== 'off' && context.keep !== 'off' && context.keptStored,
        saveStatus: event.keep === 'off' ? ('idle' as const) : context.saveStatus,
      }
    )),
    replaceSaved: assign({ replaceSaved: true }),
    markSaving: assign({ saveStatus: 'saving' }),
    markStored: assign(({ context, event }) => (
      assertEvent(event, 'SESSION.STORED'),
      {
        keptStored: context.keep !== 'off',
        savedAt: event.savedAt,
        saveStatus: event.latest && context.keep !== 'off' ? ('saved' as const) : context.saveStatus,
        replaceSaved: false,
      }
    )),
    refuseSave: assign({ saveStatus: 'refused' }),
    markTaken: assign({ saveStatus: 'taken', keptStored: false }),
    deleteSession: assign({ keep: 'off', keptStored: false, saveStatus: 'idle' }),
  },
});

/** "Your list holds 8 ideas, the most it can. Remove one to add this." */
export const refuseShortlist = consultSetup.emit(({ event }) => {
  assertEvent(event, 'SHORTLIST.ADD');
  return { type: 'SHORTLIST.REFUSED', id: event.id, reason: 'full' };
});
