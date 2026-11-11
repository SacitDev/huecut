/**
 * Storage on the device: the saved session in IndexedDB `huecut`, store `session`, as the
 * versioned `SessionData` with its photo and AI pictures, deleted once past its period; small `huecut:*` keys in local
 * and session storage, each read and write in try/catch (private mode, quota); and `navigator.storage.persist()`.
 */
import type { PictureId } from '../domain/ids.ts';
import { DEFAULT_KEEP, isExpired, parseSessionData, type KeepChoice, type SaveMode, type SessionData } from '../domain/session/session-data.ts';

const DB_NAME = 'huecut';
const DB_VERSION = 1;
const STORE = 'session';
/** The one record of the store: there is at most one saved session in a browser. */
const KEY = 'current';

/** What a saved session stores: the record, its one photo copy (≤ 1536 px, no EXIF) and its slot pictures. */
export interface StoredSession {
  readonly data: SessionData;
  readonly photo: Blob | null;
  readonly pictures: Readonly<Partial<Record<PictureId, Blob>>>;
}

/** There is no database and this call may not make one: reading or deleting must not bring back what "Delete my data" removed. */
const NO_DATABASE = new Error('no database');

function openDb(create: boolean): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let absent = false;
    request.onupgradeneeded = () => {
      absent = !create;
      if (absent) request.transaction?.abort();
      else if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      const db = request.result;
      // "Delete my data" in this or another tab waits for every open connection: this one lets it go at once.
      db.onversionchange = () => { db.close(); };
      resolve(db);
    };
    request.onerror = () => {
      reject(absent ? NO_DATABASE : (request.error ?? new Error('IndexedDB open failed')));
    };
    request.onblocked = () => {
      reject(new Error('IndexedDB open blocked'));
    };
  });
}

/** One request in its own transaction; the database is closed once it settles. */
async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>, create = false): Promise<T> {
  const db = await openDb(create);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => {
        resolve(request.result);
      };
      tx.onerror = () => {
        reject(tx.error ?? new Error('IndexedDB transaction failed'));
      };
      tx.onabort = () => {
        reject(tx.error ?? new Error('IndexedDB transaction aborted'));
      };
    });
  } finally {
    db.close();
  }
}

/**
 * Deletes the saved session ("Don't save", or once it has expired); with `mine`, only while the record is still that session's, in one transaction, so a
 * record another tab saved since stays. Resolves false when storage refused, and true when nothing of it is left.
 */
export async function deleteSession(mine?: { readonly id: string | undefined }): Promise<boolean> {
  try {
    if (mine) await updateRecord((old) => (old !== undefined && old.data.id === mine.id ? 'delete' : null), false);
    else await withStore('readwrite', (s) => s.delete(KEY));
    return true;
  } catch (e) {
    return e === NO_DATABASE;
  }
}

/**
 * The saved session if one exists and is within its period. An expired, unreadable or other-version record is deleted now, so a 24-hour
 * session is gone the next time the app runs after 24 hours, and so is any copy left behind by a "Don't save" the browser refused. Null when there is none.
 */
export async function readSession(nowMs: number = Date.now()): Promise<StoredSession | null> {
  if (chosenSaving() === 'off') {
    await deleteSession();
    return null;
  }
  let raw: unknown;
  try {
    raw = await withStore('readonly', (s) => s.get(KEY));
  } catch {
    return null;
  }
  if (raw === undefined) return null;
  const record = raw as Partial<Record<keyof StoredSession, unknown>>;
  const parsed = parseSessionData(record.data);
  // Past its own period first: a choice made since, perhaps in a new session that saved nothing yet, must not keep it longer.
  if (!parsed.ok || isExpired(parsed.value, nowMs)) {
    // Only the record read here goes: one another tab wrote since stays.
    const read = stampOf(raw);
    await updateRecord((old) => (stampOf(old) === read ? 'delete' : null), false).catch(() => undefined);
    return null;
  }
  const chosen = periodChosenIn(parsed.value.id);
  const data = withLastChoice(parsed.value, chosen, nowMs);
  if (data !== parsed.value && chosen !== null) await changeSaving(chosen, parsed.value.id, nowMs);
  return { data, ...blobsOf(record) };
}

/** A tab closed before its write landed leaves a period chosen in this session only in the key: it applies to its live record now, counting from now. */
const withLastChoice = (data: SessionData, chosen: KeepChoice | null, nowMs: number): SessionData =>
  chosen === null || chosen === (data.keep ?? 'day') ? data : { ...data, keep: chosen, savedAt: nowMs };

/** The photo and pictures of a record as read back; anything else in their place counts as none. */
function blobsOf({ photo, pictures }: Partial<Record<keyof StoredSession, unknown>>): Pick<StoredSession, 'photo' | 'pictures'> {
  return { photo: photo instanceof Blob ? photo : null, pictures: typeof pictures === 'object' && pictures !== null ? Object.fromEntries(Object.entries(pictures).filter((e): e is [string, Blob] => e[1] instanceof Blob)) : {} };
}

/**
 * What a write did: `gone` when the record it was to replace had been deleted or saving was turned off meanwhile, `taken` when another session is saved there and
 * the person has not said it may be replaced, `refused` when the browser would not (quota, private mode).
 */
export type WriteResult = 'stored' | 'gone' | 'taken' | 'refused';

/** A record's session id and save time: what tells it from a newer one. */
const stampOf = (record: unknown): string => {
  const data = (record as { data?: { id?: unknown; savedAt?: unknown } } | undefined)?.data;
  return JSON.stringify([data?.id, data?.savedAt]);
};

/**
 * Reads the record and maybe puts another in its place, or deletes it, in one transaction, so a failed write leaves the last good one and nothing deleted
 * meanwhile comes back. `next` returns the new record, `delete`, or null to leave things as they are; `old` is undefined when there is none.
 */
const updateRecord = (next: (old: StoredSession | undefined) => StoredSession | 'delete' | null, create: boolean): Promise<void> =>
  withStore(
    'readwrite',
    (s) => {
      const get = s.get(KEY) as IDBRequest<StoredSession | undefined>;
      get.onsuccess = () => {
        try {
          const record = next(get.result);
          if (record === 'delete') s.delete(KEY);
          else if (record) s.put(record, KEY);
        } catch {
          // Thrown in this handler it would be an uncaught error; aborting is how the transaction reports it.
          s.transaction.abort();
        }
      };
      return get;
    },
    create,
  ).then(() => undefined);

/** "Delete my data" was used at or after this time, in this tab or another (the marker `markDeleted` leaves). */
export function deletedSince(startedAt: number): boolean {
  const at = readKey(DELETED_AT);
  return deletedHere >= startedAt || (at !== null && Number(at) >= startedAt);
}

/**
 * Writes the session. Only the first write may create the record: with `overwriteOnly`, a record deleted meanwhile, in another tab too, stays deleted, and a
 * first write of a session begun (`startedAt`) before a "Delete my data" anywhere is `gone` too. A record of another session is replaced only with
 * `mayReplace` (the person's yes). The check and the write are one transaction; the keys are read inside it, so a "Don't save" or a delete made elsewhere stops
 * this write; a first write checks the delete before it opens the database as well, so it does not make an empty one.
 */
export async function writeSession(session: StoredSession, overwriteOnly: boolean, mayReplace = false, startedAt = Date.now()): Promise<WriteResult> {
  const deleted = (): boolean => !overwriteOnly && deletedSince(startedAt);
  if (deleted()) return 'gone';
  let result: WriteResult = 'stored';
  const pick = (old: StoredSession | undefined): StoredSession | null => {
    if (savingChoice() === 'off' || (old === undefined && overwriteOnly) || deleted()) result = 'gone';
    else if (old !== undefined && old.data.id !== session.data.id && !mayReplace) result = 'taken';
    return result === 'stored' ? session : null;
  };
  try {
    await updateRecord(pick, !overwriteOnly);
    return result;
  } catch (e) {
    return e === NO_DATABASE ? 'gone' : 'refused';
  }
}

/**
 * Changes the saved session with this id (undefined: one saved before sessions had ids) when no machine holds it on this page: its period, counting from now,
 * or `off` to delete whatever is saved. A record of another session is left as it is. False when there is none or storage refused.
 */
export async function changeSaving(mode: SaveMode, id: string | undefined, nowMs: number = Date.now()): Promise<boolean> {
  if (mode === 'off') return deleteSession();
  let found = false;
  const pick = (old: StoredSession | undefined): StoredSession | null => {
    found = old !== undefined && old.data.id === id;
    return old && found ? { ...old, data: { ...old.data, keep: mode, savedAt: nowMs } } : null;
  };
  try {
    await updateRecord(pick, false);
    return found;
  } catch {
    return false;
  }
}

// ── Small keys (`huecut:*`): nothing personal ──

type Area = 'local' | 'session';
const areaOf = (area: Area): Storage => (area === 'local' ? localStorage : sessionStorage);
const keyOf = (name: string): string => `huecut:${name}`;

/** A `huecut:<name>` value, or null when absent or when storage is unavailable. */
export function readKey(name: string, area: Area = 'local'): string | null {
  try {
    return areaOf(area).getItem(keyOf(name));
  } catch {
    return null;
  }
}

/** Stores `huecut:<name>`; false when the browser refuses. */
export function writeKey(name: string, value: string, area: Area = 'local'): boolean {
  try {
    areaOf(area).setItem(keyOf(name), value);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(name: string, area: Area = 'local'): void {
  try {
    areaOf(area).removeItem(keyOf(name));
  } catch {
    // Storage is unavailable: there is nothing to remove.
  }
}

/** The one key of the saving choice; a tab hears it change through the `storage` event. */
export const SAVING_KEY = keyOf('saving');

/** When "Delete my data" last ran in this browser: nothing personal, kept so that a first write or a restore begun before it keeps nothing. */
const DELETED_AT = 'deleted-at';
/** The same for this tab alone, which holds when the browser refuses the key (storage full, say). */
let deletedHere = Number.NEGATIVE_INFINITY;
/** Leaves the time of a "Delete my data" for every tab's next first write and every restore under way; call it before the database goes. */
export const markDeleted = (nowMs: number = Date.now()): void => {
  deletedHere = nowMs;
  writeKey(DELETED_AT, String(nowMs));
};

/** The last choice made in this browser, if any. */
function chosenSaving(): SaveMode | null {
  const value = readKey('saving');
  return value === 'day' || value === 'off' || value === DEFAULT_KEEP ? value : null;
}

/** How this browser saves a new session: the last choice made here, "Don't save" included, or the default. */
export const savingChoice = (): SaveMode => chosenSaving() ?? DEFAULT_KEEP;

/** Names the session the last choice was made in. */
const CHOSEN_IN = 'saving-for';

/**
 * Remembers the choice and the session it was made in (undefined: none yet, so it stands only for the next one), before anything is deleted, so that a tab
 * which has not heard yet still finds it at its next write. The session comes first, so a tab that hears the choice also finds where it was made.
 */
export function rememberSaving(mode: SaveMode, sessionId: string | undefined): void {
  if (sessionId === undefined) removeKey(CHOSEN_IN);
  else writeKey(CHOSEN_IN, sessionId);
  writeKey('saving', mode);
}

/** The period last chosen, if it was chosen in the session with this id: a period chosen in another session, or for none, never reaches this one's record. */
export function periodChosenIn(sessionId: string | undefined): KeepChoice | null {
  const chosen = chosenSaving();
  return chosen !== null && chosen !== 'off' && sessionId !== undefined && readKey(CHOSEN_IN) === sessionId ? chosen : null;
}

let persistAsked = false;
/**
 * Asks once for persistent storage, when a session is first written; some browsers show a prompt for it. A refusal or a rejection changes nothing except
 * that the browser may clear the data, so nothing waits for it and nothing is said about it.
 */
export function requestPersistOnce(): void {
  if (persistAsked) return;
  persistAsked = true;
  // Older Safari and some in-app browsers have no StorageManager, whatever the DOM types say.
  const manager = (navigator as Partial<Pick<Navigator, 'storage'>>).storage;
  if (typeof manager?.persist !== 'function') return;
  void manager
    .persisted()
    .then((already) => (already ? true : manager.persist()))
    .catch(() => false);
}
