/**
 * The saved session: from the first answer or photo the versioned `SessionData` is written, debounced, with one downscaled, EXIF-free
 * copy of the main photo and of each AI picture, until the person chooses "Don't save", which deletes it at once. On boot a session still within its period
 * comes back: its photo and pictures go into the resource store under their ids first.
 */
import type { PictureId } from '../domain/ids.ts';
import { dayIsOver, type SaveMode, type SessionData } from '../domain/session/session-data.ts';
import { hasPersonalData } from '../machine/consult.logic.ts';
import { currentStep, sessionDataOf, type ConsultSnapshot } from '../machine/consult.machine.ts';
import type { MachineEvent } from '../machine/consult.types.ts';
import * as resources from '../platform/resources.ts';
import { deletedSince, deleteSession, periodChosenIn, readSession, rememberSaving, requestPersistOnce, SAVING_KEY, savingChoice, writeSession, type StoredSession, type WriteResult } from '../platform/storage.ts';

/** Changes come in bursts (an answer, its follow-up); one write after a short quiet spell. */
const WRITE_DEBOUNCE_MS = 400;
/** The most AI pictures one record stores: 8 ideas, the pair and the quick grids are well under it, so only a person who keeps swapping ideas ever reaches it. */
const MAX_SAVED_PICTURES = 24;

interface Subscribable {
  readonly getSnapshot: () => ConsultSnapshot;
  readonly send: (event: MachineEvent) => void;
  readonly subscribe: (listener: (s: ConsultSnapshot) => void) => { unsubscribe: () => void };
}

/** What came back from storage is already a stored copy: written back as it is, a long-kept session does not lose quality to every save. */
const fromStorage = new WeakSet<Blob>();

/**
 * The saved session's record, with its photo and pictures already in the resource store; null when none is saved. Begun at `startedAt`, it ends once `before`
 * (My look's content) is in too, and the machine is built from it at once: a "Delete my data" until then, in this tab or another, leaves nothing of it in the
 * store, so that is checked after every wait.
 */
export async function restoreSession(startedAt: number, before: Promise<unknown> = Promise.resolve()): Promise<SessionData | null> {
  const kept = await readSession(startedAt);
  if (!kept || deletedSince(startedAt)) return null;
  const saved = kept.data.photo;
  if (kept.photo) fromStorage.add(kept.photo);
  if (saved && kept.photo) await resources.addPhoto(kept.photo, '', saved.id);
  const pictures = deletedSince(startedAt) ? {} : kept.pictures;
  for (const [id, blob] of Object.entries(pictures)) {
    if (!blob) continue;
    fromStorage.add(blob);
    resources.addPicture(blob, id as PictureId);
  }
  await before;
  if (!deletedSince(startedAt)) return kept.data;
  if (saved) resources.removePhoto(saved.id);
  resources.disposePictures(Object.keys(pictures) as PictureId[]);
  return null;
}

/** One share copy per source Blob: a photo or picture is re-encoded once, not on every write. */
function copier(): (blob: Blob) => Promise<Blob | null> {
  const made = new WeakMap<Blob, Promise<Blob | null>>();
  return (blob) => {
    if (fromStorage.has(blob)) return Promise.resolve(blob);
    const known = made.get(blob);
    if (known) return known;
    const next = resources.shareCopy(blob);
    made.set(blob, next);
    return next;
  };
}

/** The session's content: everything but the clock and where the person stands in it (the step, the Try it on tab). */
const contentOf = ({ source, furthest, answers, prefs, shortlist, pair, slots, grids, photo, keep }: SessionData): string =>
  JSON.stringify([source, furthest, answers, { ...prefs, tab: null }, shortlist, pair, slots, grids, photo && [photo.id, photo.edits, photo.refined, photo.observation !== null], keep ?? 'day']);

/**
 * What a write would change, or null when there is nothing to write. Only a change of this starts a write: the models' progress and every other machine event
 * leave it the same, so they cannot keep putting a save off.
 */
function placeOf(snapshot: ConsultSnapshot): string | null {
  const { context } = snapshot;
  const step = currentStep(snapshot);
  if (step === null || !(context.keptStored || hasPersonalData(context))) return null;
  const data = sessionDataOf(context, step, 0);
  return data && JSON.stringify([contentOf(data), step, context.prefs.tab]);
}

/** Keeps `savedAt` of the last save until the content changes, so opening, restoring or moving between steps never restarts the 24 hours. */
function clockFrom(restored: SessionData | null): (data: SessionData) => SessionData {
  let last = restored && { savedAt: restored.savedAt, content: contentOf(restored) };
  return (data) => {
    const content = contentOf(data);
    last = last?.content === content ? last : { savedAt: data.savedAt, content };
    return { ...data, savedAt: last.savedAt };
  };
}

/** Delete must win (privacy): writes and deletes run one at a time, and a write that a delete overtook stores nothing. */
function jobQueue() {
  let deletes = 0;
  let turn: Promise<unknown> = Promise.resolve();
  return {
    run: <T>(work: () => Promise<T>): Promise<T> => {
      const next = turn.then(work);
      turn = next.catch(() => undefined);
      return next;
    },
    overtake: (): void => { deletes++; },
    /** A check that stays true until the next `overtake`. */
    ticket: (): (() => boolean) => {
      const before = deletes;
      return () => before === deletes;
    },
  };
}
type Jobs = ReturnType<typeof jobQueue>;

/** Where the sync stands; the machine holds what the person chose, this holds only what has been handed to storage. */
interface Sync {
  readonly copy: (blob: Blob) => Promise<Blob | null>;
  id: string | undefined;
  stamp: (data: SessionData) => SessionData;
  timer: ReturnType<typeof setTimeout> | undefined;
  place: string | null;
  /** The person's yes to replacing another session, as last seen: a new one is worth a write even with nothing else changed. */
  yes: boolean;
  mode: SaveMode;
  stored: boolean;
  running: boolean;
  /** When the running session began: its first write stores nothing if "Delete my data" ran since, in any tab. */
  startedAt: number;
}

interface Written {
  readonly result: WriteResult;
  readonly savedAt: number;
}

/** The stored copies of the record's main photo and of its AI pictures, the newest ones when there are ever more than the limit. */
async function copiesFor(data: SessionData, copy: Sync['copy']): Promise<Pick<StoredSession, 'photo' | 'pictures'>> {
  const original = data.photo ? resources.photo(data.photo.id)?.blob : undefined;
  const photo = original ? await copy(original) : null;
  const pictures: Partial<Record<PictureId, Blob>> = {};
  for (const id of [...Object.values(data.slots).map((slot) => slot?.pictureId), ...data.grids.map((grid) => grid.pictureId)].slice(-MAX_SAVED_PICTURES)) {
    const blob = id && resources.picture(id);
    const copied = blob ? await copy(blob) : null;
    if (id && copied) pictures[id] = copied;
  }
  return { photo, pictures };
}

/** One write of the session; null when there was nothing to do or a delete came while it made its copies. Persistent storage is asked for when the record is first made. */
async function write(snapshot: ConsultSnapshot, sync: Sync, wanted: () => boolean): Promise<Written | null> {
  const step = currentStep(snapshot);
  const found = step && sessionDataOf(snapshot.context, step, Date.now());
  if (!found) return null;
  const data: SessionData = { ...sync.stamp(found), ...(sync.id === undefined ? {} : { id: sync.id }) };
  const copies = await copiesFor(data, sync.copy);
  if (!wanted()) return null;
  const { keptStored, replaceSaved } = snapshot.context;
  const result = await writeSession({ data, ...copies }, keptStored, replaceSaved, sync.startedAt);
  if (result === 'stored' && !keptStored) requestPersistOnce();
  return { result, savedAt: data.savedAt };
}

/** Tells the machine what a write did. A failure is news only when no newer change is on its way behind it. */
function report(actor: Subscribable, sync: Sync, done: Written, wrote: string | null): void {
  if (done.result === 'stored') actor.send({ type: 'SESSION.STORED', latest: wrote === sync.place, savedAt: done.savedAt });
  else if (done.result === 'gone') {
    // The copy has already gone elsewhere: saving ends here too, and a delete from this tab could only hit what another tab has saved since.
    sync.mode = 'off';
    actor.send({ type: 'SESSION.DELETE' });
  } else if (wrote === sync.place) actor.send({ type: done.result === 'refused' ? 'SESSION.REFUSED' : 'SESSION.TAKEN' });
}

function schedule(actor: Subscribable, sync: Sync, jobs: Jobs): void {
  actor.send({ type: 'SESSION.SAVING' });
  clearTimeout(sync.timer);
  sync.timer = setTimeout(() => {
    const wanted = jobs.ticket();
    const wrote = sync.place;
    void jobs.run(() => write(actor.getSnapshot(), sync, wanted)).then((done) => {
      if (done && wanted()) report(actor, sync, done, wrote);
    });
  }, WRITE_DEBOUNCE_MS);
}

/** Nothing written or scheduled so far may land any more. */
function forget(sync: Sync, jobs: Jobs): void {
  clearTimeout(sync.timer);
  jobs.overtake();
  sync.place = null;
  sync.stamp = clockFrom(null);
}

/**
 * Remembers a period chosen in this session with its id, so one chosen in a new, empty session never reaches another session's record. Only a choice
 * (`SESSION.KEEP`) changes the period while a session runs on; starting, ending or restoring one is no choice.
 */
function rememberChoice(sync: Sync, keep: SaveMode, running: boolean): void {
  if (sync.running && running && keep !== sync.mode) rememberSaving(keep, sync.id);
}

/** Notes whether a session runs, and when the running one began. */
function track(sync: Sync, running: boolean): void {
  if (running && !sync.running) sync.startedAt = Date.now();
  sync.running = running;
}

/** Deletes the saved copy once the jobs before it are done: with `mine`, only while it is still that session's. */
function deleteSaved(actor: Subscribable, jobs: Jobs, mine?: { readonly id: string | undefined }): void {
  void jobs.run(() => deleteSession(mine)).then((gone) => {
    if (!gone) actor.send({ type: 'SESSION.REFUSED' });
  });
}

/** What the sync tells: the running session's id, and when it began (null when none runs). */
interface SessionSync {
  readonly stop: () => void;
  readonly sessionId: () => string | undefined;
  readonly begun: () => number | null;
}

/**
 * Writes while saving is on and deletes when it is turned off or the session ends; `restored` is the record the machine started from. Returns the stop function,
 * the running session's id and when it began.
 */
export function startSessionSync(actor: Subscribable, restored: SessionData | null = null): SessionSync {
  const first = actor.getSnapshot();
  const jobs = jobQueue();
  const sync: Sync = { copy: copier(), id: restored ? restored.id : crypto.randomUUID(), stamp: clockFrom(restored), timer: undefined, place: placeOf(first), yes: first.context.replaceSaved, mode: first.context.keep, stored: first.context.keptStored, running: currentStep(first) !== null, startedAt: Date.now() };
  const subscription = actor.subscribe((snapshot) => {
    const { context } = snapshot;
    const running = currentStep(snapshot) !== null;
    rememberChoice(sync, context.keep, running);
    if (sync.running && !running) {
      // The session is over: RESET takes its copy along, and only its own, as its delete may wait behind a photo copy while another tab saves anew;
      // a confirmed Start again leaves the copy until the new session's first write replaces it.
      forget(sync, jobs);
      const mine = { id: sync.id };
      sync.id = crypto.randomUUID();
      if (sync.stored && !context.replaceSaved) deleteSaved(actor, jobs, mine);
    }
    track(sync, running);
    sync.stored = context.keptStored;
    if (sync.mode !== 'off' && context.keep === 'off') {
      forget(sync, jobs);
      deleteSaved(actor, jobs);
    }
    sync.mode = context.keep;
    const next = placeOf(snapshot);
    const newYes = context.replaceSaved && !sync.yes;
    sync.yes = context.replaceSaved;
    if (next === null || (next === sync.place && !newYes)) return;
    sync.place = next;
    schedule(actor, sync, jobs);
  });
  return {
    stop: () => {
      clearTimeout(sync.timer);
      subscription.unsubscribe();
    },
    sessionId: () => sync.id,
    begun: () => (sync.running ? sync.startedAt : null),
  };
}

/**
 * What the browser says about this session (`session`). A period chosen for it in another tab applies here too, so no tab writes back a period the person left,
 * while one chosen in another session never does; saving turned off elsewhere ends here at once (turning it on elsewhere does not turn it on here). A 24-hour
 * session left open past its time is deleted on resume, and the page starts clean. "Delete my data" in this tab ends a session begun before it.
 */
export function followBrowser(actor: Pick<Subscribable, 'getSnapshot' | 'send'>, session: Pick<SessionSync, 'sessionId' | 'begun'>): void {
  window.addEventListener('storage', (event) => {
    // This tab's own delete event has no key. Saved drawn before My look had started has no machine to reset, so the session goes here.
    const begun = session.begun();
    if (event.key === null && begun !== null && deletedSince(begun)) actor.send({ type: 'RESET' });
    if (event.key !== SAVING_KEY) return;
    const { keep } = actor.getSnapshot().context;
    const chosen = savingChoice() === 'off' ? 'off' : periodChosenIn(session.sessionId());
    if (chosen !== null && chosen !== keep && keep !== 'off') actor.send({ type: 'SESSION.KEEP', keep: chosen });
  });
  const onResume = (): void => {
    const { keep, keptStored, savedAt } = actor.getSnapshot().context;
    if (document.visibilityState !== 'visible' || keep !== 'day' || !keptStored || savedAt === null || !dayIsOver(savedAt, Date.now())) return;
    void readSession().then((still) => {
      if (still === null) window.location.reload();
    });
  };
  document.addEventListener('visibilitychange', onResume);
  window.addEventListener('pageshow', onResume);
}
