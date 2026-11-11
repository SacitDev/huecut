/**
 * The My look machine: `intro → session`, where `session` runs the parallel regions
 * `models`, `analysis` and `flow` and invokes the worker supervisor. Created once per app session in `app/compose.ts`,
 * which injects the actors, the `hasIdeas` guard and the side-effect actions with `consultMachine.provide()`.
 */
import { assertEvent, type SnapshotFrom } from 'xstate';
import type { PhotoId, PictureId } from '../domain/ids.ts';
import { DEFAULT_KEEP, SESSION_SCHEMA_VERSION, type SavedPhoto, type SessionData } from '../domain/session/session-data.ts';
import { NEW_PHOTO, NO_PHOTO, picturesNotOf, slotPhotoOf, slotsOnlyOf, withPhotoRemoved } from './consult.logic.ts';
import { STEPS, type ConsultContext, type PhotoEntry, type Step } from './consult.types.ts';
import { analysisRegion } from './regions/analysis.ts';
import { flowRegion } from './regions/flow.ts';
import { IDLE_MODELS, modelsRegion } from './regions/models.ts';
import { consultSetup, refuseShortlist } from './setup.ts';

// ── Fresh, restored and saved sessions ──

type Base = Pick<ConsultContext, 'content' | 'device' | 'extras'>;

/** A new session: the inputs given at creation, nothing chosen yet. */
export const freshContext = ({ content, device, extras }: Base): ConsultContext => ({
  content,
  device,
  extras,
  source: 'photo',
  photos: [],
  mainPhotoId: null,
  answers: {},
  prefs: { goal: null, collections: [], count: content.consult.policy.count.default },
  skipped: false,
  models: IDLE_MODELS,
  shortlist: { added: [], removed: [], order: [] },
  pair: null,
  slots: {},
  grids: [],
  keep: DEFAULT_KEEP,
  keptStored: false,
  saveStatus: 'idle',
  savedAt: null,
  replaceSaved: false,
  resumeAt: null,
  inFlight: null,
  furthest: 0,
});

/** A saved photo as an entry: already analysed, or back in the queue when it was saved before its first analysis finished. */
function savedEntry(saved: SavedPhoto): PhotoEntry {
  const entry = { ...NEW_PHOTO, id: saved.id, sharpness: saved.sharpness, edits: saved.edits, refined: saved.refined };
  return saved.observation ? { ...entry, observation: saved.observation, status: 'done' } : entry;
}

/** A saved session or a bundled example. */
export function restoredContext(base: Base, data: SessionData): ConsultContext {
  const { answers, prefs, shortlist, pair, slots, grids, furthest, source, photo: saved } = data;
  const photo = saved && savedEntry(saved);
  const restored = { answers, prefs, shortlist, pair, slots, grids, furthest, source, resumeAt: data.step };
  return {
    ...freshContext(base),
    ...restored,
    photos: photo ? [photo] : [],
    mainPhotoId: photo?.id ?? null,
    keep: data.keep ?? 'day',
    keptStored: source !== 'example',
    saveStatus: source === 'example' ? 'idle' : 'saved',
    savedAt: data.savedAt,
  };
}

/** The record `app/session-sync.ts` writes while saving is on; null when it is off and for the example, which can always be reopened. */
export function sessionDataOf(c: ConsultContext, step: Step, savedAt: number): SessionData | null {
  if (c.source === 'example' || c.keep === 'off') return null;
  const main = c.photos.find((p) => p.id === c.mainPhotoId);
  const photo: SavedPhoto | null = main
    ? {
        id: main.id,
        sharpness: main.sharpness,
        observation: main.observation,
        edits: main.edits,
        refined: main.refined,
        example: null,
      }
    : null;
  const { source, furthest, answers, prefs, shortlist, pair, grids } = c;
  const slots = slotsOnlyOf(c, photo?.id ?? NO_PHOTO);
  return { schemaVersion: SESSION_SCHEMA_VERSION, savedAt, keep: c.keep, step, source, furthest, answers, prefs, shortlist, pair, grids, slots, photo };
}

const reset = consultSetup.assign(({ context }) => freshContext(context));
const startAgain = consultSetup.assign(({ context }) => ({ ...freshContext(context), replaceSaved: true }));
const start = consultSetup.assign(({ context, event }) => {
  assertEvent(event, 'START');
  if (event.source === 'example') return restoredContext(context, event.session);
  return { source: event.source, ...(event.keep === undefined ? {} : { keep: event.keep }) };
});

/** Inputs that only change data: targetless, so they never re-enter a region. */
const sessionInputs = consultSetup.createStateConfig({
  on: {
    // The first photo replaces `none` as the slot photo, so slots filled without a photo are disposed.
    'PHOTOS.ADD': {
      actions: [
        {
          type: 'disposePictures',
          params: ({ context, event }) => ({ ids: firstPhotoDrops(context, event.files[0]?.id) }),
        },
        'addPhotos',
      ],
    },
    'PHOTOS.REMOVE': {
      actions: [
        { type: 'releasePhoto', params: ({ event }) => ({ photoId: event.id }) },
        {
          type: 'disposePictures',
          params: ({ context, event }) => ({
            ids: picturesNotOf(context, slotPhotoOf(withPhotoRemoved(context, event.id))),
          }),
        },
        'removePhoto',
      ],
    },
    // A new main photo empties the visible slots and disposes the old pictures.
    'PHOTOS.SET_MAIN': {
      guard: 'isNewMainPhoto',
      actions: [
        { type: 'disposePictures', params: ({ context, event }) => ({ ids: picturesNotOf(context, event.id) }) },
        'setMainPhoto',
      ],
    },
    // Move the lines applies at once, to the main photo only: an edit for a photo switched or removed since is refused.
    'POINTS.MOVE': { guard: 'isMainPhotoEdit', actions: 'movePoint' },
    'HAIRLINE.MOVE': { guard: 'isMainPhotoEdit', actions: 'moveHairline' },
    'POINTS.RESET': { guard: 'isMainPhotoEdit', actions: 'resetPoints' },
    ANSWER: { actions: 'storeAnswer' },
    'PREFS.SET': { actions: 'storePrefs' },
    'HAIR.REFINED': { actions: 'storeRefined' },
    'SHORTLIST.REMOVE': { actions: 'removeFromShortlist' },
    'SHORTLIST.MOVE': { actions: 'moveInShortlist' },
    'PAIR.SET': { guard: 'isPairOfKinds', actions: 'setPair' },
    'PAIR.CLEAR': { actions: 'clearPair' },
    'SLOT.ADD': {
      guard: 'isMainPhotoSlot',
      actions: [
        {
          type: 'disposePictures',
          params: ({ context, event }) => ({ ids: replaced(context.slots[event.key]?.pictureId, event.file) }),
        },
        'addSlot',
      ],
    },
    'SLOT.CLEAR': {
      actions: [
        {
          type: 'disposePictures',
          params: ({ context, event }) => ({ ids: replaced(context.slots[event.key]?.pictureId, null) }),
        },
        'clearSlot',
      ],
    },
    'SLOT.HAIR_ONLY': { actions: 'setHairOnly' },
    'GRID.ADD': {
      actions: [
        {
          type: 'disposePictures',
          params: ({ context, event }) => ({
            ids: replaced(context.grids.find((g) => g.grid === event.grid)?.pictureId, event.file),
          }),
        },
        'addGrid',
      ],
    },
    'GRID.CONFIRM': { actions: 'confirmGrid' },
    'SESSION.KEEP': { actions: 'keepSession' },
    'SESSION.REPLACE': { actions: 'replaceSaved' },
    'SESSION.SAVING': { actions: 'markSaving' },
    'SESSION.STORED': { actions: 'markStored' },
    'SESSION.REFUSED': { actions: 'refuseSave' },
    'SESSION.TAKEN': { actions: 'markTaken' },
    'SESSION.DELETE': { actions: 'deleteSession' },
  },
});

/** The old picture of a slot or grid when a different one (or none) takes its place. */
function replaced<T>(old: T | undefined, next: T | null): T[] {
  return old === undefined || old === next ? [] : [old];
}

/** Pictures of the `none` slots once the first photo arrives (no main photo yet); otherwise nothing. */
function firstPhotoDrops(c: ConsultContext, first: PhotoId | undefined): PictureId[] {
  return c.mainPhotoId === null && first !== undefined ? picturesNotOf(c, first) : [];
}

export const consultMachine = consultSetup.createMachine({
  id: 'consult',
  context: ({ input }) => (input.restore ? restoredContext(input, input.restore) : freshContext(input)),
  initial: 'intro',
  on: {
    RESET: { target: '.intro', actions: reset },
    START_AGAIN: { target: '.intro', actions: startAgain },
    // On the root, so Explore can add before My look starts; refused once the person's additions fill the list.
    'SHORTLIST.ADD': [{ guard: 'canAddToShortlist', actions: 'addToShortlist' }, { actions: refuseShortlist }],
  },
  states: {
    intro: {
      always: { guard: 'isRestored', target: 'session' },
      on: { START: { target: 'session', actions: start } },
    },
    session: {
      type: 'parallel',
      // The only owner of the worker: leaving `session` (RESET) stops it, which ends the worker.
      invoke: { id: 'supervisor', src: 'superviseWorker', input: null },
      on: sessionInputs.on,
      states: { models: modelsRegion, analysis: analysisRegion, flow: flowRegion },
    },
  },
});

export type ConsultMachine = typeof consultMachine;
export type ConsultSnapshot = SnapshotFrom<ConsultMachine>;

/** The step the URL shows, or null outside My look (intro). */
export function currentStep(snapshot: Pick<ConsultSnapshot, 'matches'>): Step | null {
  return STEPS.find((step) => snapshot.matches({ session: { flow: step } })) ?? null;
}
