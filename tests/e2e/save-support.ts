/**
 * Test support of the saved-by-default specs: the record as stored, the words of the shared control, a session at any age, and held or
 * refused writes. Every photo in these tests is a fictional fixture.
 */
import type { Locator, Page } from '@playwright/test';
import type { SessionData } from '../../src/domain/session/session-data.ts';
import { sessionAt } from '../machine/consult.fakes.ts';
import { expect } from './guard.ts';
import { keepSession } from './try-on-support.ts';

export const HOUR_MS = 3_600_000;
/** The three modes, by the words the person reads. */
export const MODES = { until: 'Keep until I delete it', day: 'Keep for 24 hours', off: "Delete and don't save" } as const;
export const SAVED_UNTIL = 'Saved on this device until you delete it.';
export const NOT_SAVED = 'Not saved on this device.';
export const NOTHING_YET = 'Nothing is saved yet.';
export const SAVING = 'Saving';
export const LAST_GOOD = 'Could not save. Your last save is still here.';
export const NO_SAVE_AT_ALL = 'Could not save. Keep this tab open.';
export const TAKEN = 'Another session is saved here. Replace it?';
/** Each thing the line must say before the first editable control, by its words. */
export const TOLD = ['When saving is on, it keeps','a smaller photo of your face', 'in this browser on this device', 'the browser clears them', 'not a backup', 'Anyone using this browser can see them', 'shared computer'];
/** What My look's first step says in the open, before the modes; the rest of `TOLD` is one tap away there, under "What is kept". */
export const SHARED = ['a smaller photo of your face', 'Anyone using this browser can see them', 'shared computer'];
export const FICTIONAL_PHOTO = Buffer.from('a fictional photo');

/** One of the three modes, as a person finds it. */
export const radio = (page: Page, name: string): Locator => page.getByRole('radio', { name, exact: true });
/** The one shared control. */
export const saveBox = (page: Page): Locator => page.getByRole('region', { name: 'Saving this session' });
/** The control's status line. */
export const saveLine = (page: Page): Locator => saveBox(page).getByRole('paragraph').first();
/** Opens "What is kept", folded on My look's first step, and waits for its words. */
export async function openKept(page: Page): Promise<void> {
  await saveBox(page).getByRole('button', { name: 'What is kept' }).click();
  await expect(saveBox(page).getByText(TOLD[0] ?? '', { exact: false })).toBeVisible();
}
/** Answers the goal question with this tile. */
export const say = (page: Page, text: string): Promise<void> => page.getByText(text, { exact: true }).click();
/** The Goal screen of a new answers-only session; nothing is entered yet. */
export const goalPage = async (page: Page, app: string): Promise<void> => {
  await page.goto(`${app}#/my-look/goal?source=answers`);
};

export interface Held {
  readonly id?: string;
  readonly keep?: string;
  readonly savedAt: number;
  readonly step: string;
  readonly goal: string | null;
  readonly count: number;
  readonly photo: boolean;
  readonly analysed: boolean;
}

/** The record as stored, or null; never creates the database, so "there is none" can be asserted on it. */
export const record = (page: Page): Promise<Held | null> =>
  page.evaluate(async () => {
    if (!(await indexedDB.databases()).some((d) => d.name === 'huecut')) return null;
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const db = await settle(indexedDB.open('huecut', 1));
    if (!db.objectStoreNames.contains('session')) { db.close(); return null; }
    const kept = await settle(db.transaction('session').objectStore('session').get('current') as IDBRequest<{ photo: unknown; data: { id?: string; keep?: string; savedAt: number; step: string; prefs: { goal: string | null; count: number }; photo: { observation: unknown } | null } } | undefined>);
    db.close();
    return kept ? { ...(kept.data.id === undefined ? {} : { id: kept.data.id }), ...(kept.data.keep === undefined ? {} : { keep: kept.data.keep }), savedAt: kept.data.savedAt, step: kept.data.step, goal: kept.data.prefs.goal, count: kept.data.prefs.count, photo: kept.photo instanceof Blob, analysed: (kept.data.photo?.observation ?? null) !== null } : null;
  });

/** A saved session with answers only, `ageHours` since its last save. */
export const seed = (page: Page, ageHours: number, over: Partial<SessionData> = {}): Promise<void> =>
  keepSession(page, sessionAt('questions', { source: 'answers_only', photo: null, savedAt: Date.now() - ageHours * HOUR_MS, ...over }), FICTIONAL_PHOTO);

/** Counts every IndexedDB `put` in this tab, across its loads: a "nothing is written" check is then closed by a write it must see. */
export const countWrites = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    if (!location.protocol.startsWith('http')) return;
    const realPut = Reflect.get(IDBObjectStore.prototype, 'put') as (this: IDBObjectStore, value: unknown, key?: IDBValidKey) => IDBRequest;
    Reflect.set(IDBObjectStore.prototype, 'put', function counted(this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      sessionStorage.setItem('e2e:writes', String(Number(sessionStorage.getItem('e2e:writes') ?? '0') + 1));
      return realPut.call(this, value, key);
    });
  });
/** The writes this tab has made so far. */
export const writes = (page: Page): Promise<number> => page.evaluate(() => Number(sessionStorage.getItem('e2e:writes') ?? '0'));

/**
 * The positive control of a "nothing is written" check: makes `change`, which must be written, waits until the record shows it, and returns the writes
 * since `mark`. The app writes one at a time, in order, so a write it wrongly made or scheduled before the change, however slow, is counted too.
 */
export async function writtenUntil(page: Page, mark: number, change: () => Promise<void>, shows: (held: Held | null) => boolean): Promise<number> {
  await change();
  await expect.poll(async () => shows(await record(page)), { timeout: 30_000 }).toBe(true);
  return (await writes(page)) - mark;
}

/** Makes every `put` wait, holding its transaction open, until `window.releaseWrite` is set. */
export const holdWrites = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const w = window as unknown as { releaseWrite?: boolean; holdWrites?: boolean };
    const realPut = Reflect.get(IDBObjectStore.prototype, 'put') as (this: IDBObjectStore, value: unknown, key?: IDBValidKey) => IDBRequest;
    Reflect.set(IDBObjectStore.prototype, 'put', function hold(this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const request = realPut.call(this, value, key);
      // The transaction stays open while requests keep coming, so the write cannot finish until the test releases it.
      const spin = (): void => { if (w.holdWrites === true && w.releaseWrite !== true) this.get('current').onsuccess = spin; };
      spin();
      return request;
    });
  });

/** From `window.refuseWrites = true` on, every `put` throws as a full disk does. */
export const refuseWritesOnDemand = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const w = window as unknown as { refuseWrites?: boolean };
    const realPut = Reflect.get(IDBObjectStore.prototype, 'put') as (this: IDBObjectStore, value: unknown, key?: IDBValidKey) => IDBRequest;
    Reflect.set(IDBObjectStore.prototype, 'put', function refuse(this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (w.refuseWrites === true) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return realPut.call(this, value, key);
    });
  });
export const setFlag = (page: Page, name: 'refuseWrites' | 'releaseWrite' | 'holdWrites', on: boolean): Promise<void> =>
  page.evaluate(([flag, value]) => { Reflect.set(window, flag as string, value); }, [name, on] as const);

export interface Box { readonly top: number; readonly left: number; readonly width: number; readonly height: number }
/** Waits for the service worker and loads the page once more: it controls a page only from its next load, and claims none, so a page is never taken over in the middle of a session. */
export async function controlled(page: Page): Promise<void> {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

/** Where these elements are now, in the page's own coordinates (so a scroll is not a move). */
export const boxesOf = (scope: Locator): Promise<Box[]> =>
  scope.evaluateAll((all) => all.map((el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left + window.scrollX), width: Math.round(r.width), height: Math.round(r.height) }; }));

/**
 * The line and all three modes come before the first editable control of the screen, and the words wrap inside the screen: the face
 * photo and the shared-browser warning in the open, the rest of what saving keeps one tap away, under "What is kept".
 */
export async function expectToldFirst(page: Page, where: string): Promise<void> {
  for (const words of SHARED) await expect(saveBox(page).getByText(words, { exact: false }), `${where}: ${words}`).toBeVisible();
  for (const name of Object.values(MODES)) await expect(radio(page, name), `${where}: ${name}`).toBeVisible();
  await openKept(page);
  for (const words of TOLD) await expect(saveBox(page).getByText(words, { exact: false }), `${where}: ${words}`).toBeVisible();
  const order = await page.evaluate((text) => {
    const main = document.querySelector('main');
    const line = [...(main?.querySelectorAll('p') ?? [])].find((p) => p.textContent.includes(text));
    const first = main?.querySelector('input, select, textarea');
    return { before: line !== undefined && first !== null && first !== undefined && (line.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0, sideways: document.documentElement.scrollWidth > window.innerWidth };
  }, TOLD[0] ?? '');
  expect(order, where).toEqual({ before: true, sideways: false });
}
