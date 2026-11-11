/**
 * Reading the saved session over an in-memory IndexedDB: a session past its own period is deleted before the last saving choice can touch it, and
 * that choice applies to a live one, counting from now, only when it was made in that session; expiry deletes only what it read, a first write
 * begun before Delete my data stores nothing, and a connection closes when the database is to go.
 */
import { beforeEach, expect, it, vi } from 'vitest';
import { SESSION_TTL_MS, type KeepChoice } from '../domain/session/session-data.ts';
import { sessionAt } from '../../tests/machine/consult.fakes.ts';
import { changeSaving, deletedSince, deleteSession, markDeleted, readSession, writeSession } from './storage.ts';

const NOW = 1_800_000_000_000;
const HOUR_MS = SESSION_TTL_MS / 24;
const held = new Map<string, unknown>();
const keys = new Map<string, string>();
/** Every connection opened, so a test can send it a `versionchange`. */
const opened: { readonly close: () => void; onversionchange?: (() => void) | null }[] = [];
/** Runs once right after the next read of the record: another tab's write landing between two transactions. */
let afterRead: (() => void) | null = null;

/** One object store in memory: requests run on a later task, in order, and the transaction completes after them, as in a browser. */
function memoryDatabase() {
  const db = {
    close: vi.fn(),
    onversionchange: null as (() => void) | null,
    transaction: () => {
      const queue: (() => void)[] = [];
      const request = (run: () => unknown) => {
        const r: { result?: unknown; onsuccess?: () => void } = {};
        queue.push(() => {
          r.result = run();
          r.onsuccess?.();
        });
        return r;
      };
      const tx = {
        oncomplete: null as (() => void) | null,
        abort: () => { queue.length = 0; },
        objectStore: () => ({ transaction: tx, get: (k: string) => request(() => { const found = held.get(k); const then = afterRead; afterRead = null; then?.(); return found; }), put: (v: unknown, k: string) => request(() => held.set(k, v)), delete: (k: string) => request(() => held.delete(k)) }),
      };
      setTimeout(() => {
        for (let next = queue.shift(); next; next = queue.shift()) next();
        tx.oncomplete?.();
      });
      return tx;
    },
  };
  opened.push(db);
  return db;
}

beforeEach(() => {
  held.clear();
  keys.clear();
  opened.length = 0;
  afterRead = null;
  vi.stubGlobal('localStorage', { getItem: (k: string) => keys.get(k) ?? null, setItem: (k: string, v: string) => keys.set(k, v), removeItem: (k: string) => keys.delete(k) });
  vi.stubGlobal('indexedDB', {
    open: () => {
      const r: { result: unknown; onsuccess?: () => void } = { result: memoryDatabase() };
      setTimeout(() => r.onsuccess?.());
      return r;
    },
  });
});

/** The saved session's id. */
const KEPT = 'kept-session';

/** A saved session with a photo, last saved `ageHours` before NOW, and the last choice made in this browser, for the session with id `chosenFor`. */
function saved(ageHours: number, keep: KeepChoice | undefined, chosen: string, chosenFor?: string): void {
  const data = sessionAt('questions', { id: KEPT, source: 'answers_only', photo: null, savedAt: NOW - ageHours * HOUR_MS, ...(keep ? { keep } : {}) });
  held.set('current', { data, photo: new Blob(['a fictional photo']), pictures: {} });
  keys.set('huecut:saving', chosen);
  if (chosenFor !== undefined) keys.set('huecut:saving-for', chosenFor);
}

const heldData = (): unknown => (held.get('current') as { data: unknown } | undefined)?.data;

it('a 24-hour session past its time is deleted, even when a later session chose to keep until deleted', async () => {
  for (const keep of ['day', undefined] as const) {
    saved(25, keep, 'until_deleted');
    expect(await readSession(NOW), String(keep)).toBeNull();
    expect(held.has('current'), `${String(keep)}: the record and its photo are gone`).toBe(false);
  }
});

it('a live 24-hour session takes a choice made in it, counting from now', async () => {
  saved(23, 'day', 'until_deleted', KEPT);
  const found = await readSession(NOW);
  expect(found?.data).toMatchObject({ keep: 'until_deleted', savedAt: NOW });
  expect(heldData()).toMatchObject({ keep: 'until_deleted', savedAt: NOW });
});

it('a choice made in another session, or for none, never changes or re-dates a live saved session', async () => {
  for (const [what, chosenFor] of [['another session', 'new-session'], ['no session', undefined]] as const) {
    keys.clear();
    saved(23, 'day', 'until_deleted', chosenFor);
    const before = heldData();
    expect((await readSession(NOW))?.data, what).toMatchObject({ keep: 'day', savedAt: NOW - 23 * HOUR_MS });
    expect(heldData(), `${what}: stored as it was`).toEqual(before);
  }
});

it('a change of period reaches only the session it names', async () => {
  saved(23, 'day', 'day');
  const before = heldData();
  expect(await changeSaving('until_deleted', 'new-session', NOW)).toBe(false);
  expect(heldData()).toEqual(before);
  expect(await changeSaving('until_deleted', KEPT, NOW)).toBe(true);
  expect(heldData()).toMatchObject({ keep: 'until_deleted', savedAt: NOW });
});

/** A stored session of this id, last saved at `savedAt`, with a photo. */
const record = (id: string, savedAt: number) => ({ data: sessionAt('questions', { id, source: 'answers_only', photo: null, savedAt, keep: 'day' }), photo: new Blob(['a fictional photo']), pictures: {} });

it('a first write of a session begun before Delete my data ran in another tab stores nothing; one begun after it stores', async () => {
  const startedBefore = NOW - 1_000;
  // The other tab: Delete my data leaves its marker and the database goes.
  keys.set('huecut:deleted-at', String(NOW));
  held.clear();
  expect(await writeSession(record('old-tab', NOW + 10), false, false, startedBefore)).toBe('gone');
  expect(held.has('current'), 'nothing came back').toBe(false);
  expect(await writeSession(record('new-session', NOW + 20), false, false, NOW + 5)).toBe('stored');
  expect(heldData()).toMatchObject({ id: 'new-session' });
});

it('expiry deletes only the record it read: a fresh one written by another tab in between stays', async () => {
  saved(25, 'day', 'day');
  const fresh = record('other-tab', NOW);
  afterRead = () => { held.set('current', fresh); };
  expect(await readSession(NOW)).toBeNull();
  expect(held.get('current'), 'the newer record').toBe(fresh);
  afterRead = null;
  expect(await readSession(NOW), 'and the next read finds it').not.toBeNull();
});

it("a delete for one session removes only that session's record: a fresh one another tab saved since stays", async () => {
  const fresh = record('other-tab', NOW);
  held.set('current', fresh);
  expect(await deleteSession({ id: KEPT })).toBe(true);
  expect(held.get('current'), 'the other tab').toBe(fresh);
  held.set('current', record(KEPT, NOW));
  expect(await deleteSession({ id: KEPT })).toBe(true);
  expect(held.has('current'), 'its own').toBe(false);
});

it('Delete my data counts in this tab even when the browser refuses its marker', () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new DOMException('full', 'QuotaExceededError'); }, removeItem: () => undefined });
  // Times long past, so this tab's mark stops no write of the other tests in this file.
  expect(deletedSince(4)).toBe(false);
  markDeleted(5);
  expect(deletedSince(4)).toBe(true);
  expect(deletedSince(6)).toBe(false);
});

it('an open connection closes when another asks for the database to go', async () => {
  const reading = readSession(NOW);
  await new Promise((opens) => { setTimeout(opens); });
  const db = opened.at(-1);
  expect(db?.onversionchange, 'a handler is set').toBeTypeOf('function');
  db?.onversionchange?.();
  expect(db?.close).toHaveBeenCalled();
  await reading;
});
