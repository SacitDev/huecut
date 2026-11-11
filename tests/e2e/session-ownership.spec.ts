/**
 * Work belongs to the session that started it, on the production build: photos still being imported never enter the session after Start
 * again or Delete my data, a restore still running when Delete my data comes brings nothing back and a delete queued behind an old photo
 * copy spares another tab's newer save, a restored session with a photo brings its colour preview back, and a delete another tab blocks
 * is said as partial.
 * Every photo is a copy of a fictional fixture face.
 */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { sessionAt } from '../machine/consult.fakes.ts';
import { addPhotos, ANALYSIS_TIMEOUT_MS, answersToQuestions, button, expectAnalysed, FACE, go, heading, openPhoto } from './failure/support.ts';
import { expect, requires, test } from './guard.ts';
import { countWrites, record, say, seed, writes, writtenUntil } from './save-support.ts';
import { APP_URL } from './server.ts';
import { keepSession } from './try-on-support.ts';

const PHOTO_COUNT = 20;
/** Twenty fictional photos chosen at once. */
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) => ({ name: `fictional-${String(i + 1).padStart(2, '0')}.jpg`, mimeType: 'image/jpeg', buffer: readFileSync(FACE) }));
/** Each photo is decoded twice on the main thread (the photo, then its 256 px thumbnail). */
const DECODES_PER_PHOTO = 2;

/**
 * Lets the first `free` main-thread decodes run and holds every later one until `releaseDecodes()`, counting them all: an import of many photos is
 * caught in the middle as a slow phone would be, whatever this machine's speed.
 */
const gateDecodes = (page: Page, free: number): Promise<unknown> =>
  page.addInitScript((allowed) => {
    const w = window as unknown as { decodes: number; held: (() => void)[]; releaseDecodes: () => void };
    w.decodes = 0;
    w.held = [];
    let open = false;
    w.releaseDecodes = () => {
      open = true;
      for (const go of w.held.splice(0)) go();
    };
    const real = window.createImageBitmap.bind(window) as (...args: unknown[]) => Promise<ImageBitmap>;
    Reflect.set(window, 'createImageBitmap', (...args: unknown[]) => {
      w.decodes += 1;
      return open || w.decodes <= allowed ? real(...args) : new Promise<void>((go) => { w.held.push(go); }).then(() => real(...args));
    });
  }, free);
const decodesHeld = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { held: unknown[] }).held.length);
const decodes = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { decodes: number }).decodes);

/** Lets the held decodes go and waits until no decode has started for two seconds: the import has really ended, however it ended. */
async function releaseAndSettle(page: Page): Promise<void> {
  await page.evaluate(() => { (window as unknown as { releaseDecodes: () => void }).releaseDecodes(); });
  let last = -1;
  await expect.poll(async () => { const now = await decodes(page); const still = now === last; last = now; return still; }, { intervals: [2_000], timeout: 120_000 }).toBe(true);
}

/** The photos My look lists. */
const listed = (page: Page) => page.locator('input[name="main-photo"]');

/** Twenty photos chosen at once; returns once the first is listed and the next decode is held. */
async function importHeld(page: Page): Promise<void> {
  await addPhotos(page, PHOTOS);
  await expect(listed(page)).toHaveCount(1);
  await expect.poll(() => decodesHeld(page)).toBeGreaterThan(0);
}

test('Start again in the middle of an import: the new session lists none of its photos and saves none', async ({ page }) => {
  await requires(page, 'idbBlob');
  await gateDecodes(page, DECODES_PER_PHOTO);
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted', id: 'saved-session' });
  // The saved session comes back on its own step; its Photo step is one step back.
  await page.goto(`${APP_URL}#/my-look/questions`);
  await expect(heading(page)).toHaveText('A few questions');
  await go(page, '#/my-look/photo');
  await expect(heading(page)).toHaveText('Add your photo');
  await importHeld(page);
  await go(page, '#/');
  // Home has read the saved session, and the page transition into it has ended (a click during it lands on the old page's picture).
  await expect(page.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();
  await expect(page.locator('html[data-page-change]')).toHaveCount(0);
  const before = await record(page);
  expect(before?.id).toBe('saved-session');
  await button(page, 'Start again').first().click();
  await button(page.getByRole('dialog', { name: 'Start again?' }), 'Yes, start again').click();
  await expect(heading(page)).toHaveText('Add your photo');
  await releaseAndSettle(page);
  await expect(listed(page)).toHaveCount(0);
  expect(await record(page), 'the new session wrote nothing: the record is still the one it replaces only at its first write').toEqual(before);
});

test('Delete my data in the middle of an import, then My look: no photo comes back and nothing is saved', async ({ page }) => {
  await gateDecodes(page, DECODES_PER_PHOTO);
  await openPhoto(page);
  await importHeld(page);
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
  await button(page, 'Delete my data').click();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
  await go(page, '#/my-look/photo');
  await expect(heading(page)).toHaveText('Add your photo');
  await releaseAndSettle(page);
  await expect(listed(page)).toHaveCount(0);
  expect(await record(page)).toBeNull();
});

/** The saved session the Delete my data tests below start from. */
const OLD_ID = 'saved-session';

/** A saved answers-only session on its questions, Cut its goal, stored as the app stores one with no photo: no Blob, so every browser keeps it. */
const seedAnswers = (page: Page): Promise<void> =>
  page.evaluate(async (data) => {
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const open = indexedDB.open('huecut', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('session');
    const db = await settle(open);
    await settle(db.transaction('session', 'readwrite').objectStore('session').put({ data, photo: null, pictures: {} }, 'current'));
    db.close();
  }, sessionAt('questions', { id: OLD_ID, source: 'answers_only', photo: null, savedAt: Date.now(), keep: 'until_deleted' }));

/** Holds My look's content file until `release()`, so its start-up waits after the saved session has been read. */
async function holdContent(page: Page): Promise<{ readonly asked: () => boolean; readonly release: () => void }> {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((open) => { release = open; });
  let asked = false;
  await page.route(/\/assets\/consult-[\w-]+\.json$/, async (route) => {
    asked = true;
    await gate;
    await route.continue();
  });
  return { asked: () => asked, release: () => { release(); } };
}

/** Saved's Delete my data, said done. */
async function deleteOnSaved(page: Page): Promise<void> {
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
  await button(page, 'Delete my data').click();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
}

/** No answer of the deleted session is on My look, nothing of it was written back, and the new session's first answer is the first write since `mark`. */
async function nothingOfItComesBack(page: Page, mark: number): Promise<void> {
  await go(page, '#/my-look/goal?source=answers');
  await expect(heading(page)).toHaveText('Your goal');
  await expect(page.getByRole('radio', { name: 'Cut', exact: true })).not.toBeChecked();
  expect(await record(page)).toBeNull();
  expect(await writtenUntil(page, mark, () => say(page, 'Colour'), (held) => held?.goal === 'colour')).toBe(1);
  expect((await record(page))?.id).not.toBe(OLD_ID);
}

test('Delete my data while My look is still starting, the saved session already read: it does not come back', async ({ page }) => {
  await countWrites(page);
  await page.goto(APP_URL);
  await seedAnswers(page);
  const content = await holdContent(page);
  await go(page, '#/my-look/questions');
  await expect.poll(content.asked).toBe(true);
  await deleteOnSaved(page);
  const mark = await writes(page);
  content.release();
  await nothingOfItComesBack(page, mark);
});

test('Delete my data on Saved opened while My look was starting, after the start-up has ended there: the restored session goes too', async ({ page }) => {
  await countWrites(page);
  await page.goto(APP_URL);
  await seedAnswers(page);
  const content = await holdContent(page);
  await go(page, '#/my-look/questions');
  await expect.poll(content.asked).toBe(true);
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
  // The restored session's machine starts its worker as it starts: then My look has started behind Saved.
  const started = page.waitForEvent('worker');
  content.release();
  await started;
  await deleteOnSaved(page);
  await nothingOfItComesBack(page, await writes(page));
});

test('Delete my data while My look is still restoring a saved photo: the new My look holds no photo of it', async ({ page }) => {
  await requires(page, 'idbBlob');
  await gateDecodes(page, 0);
  await countWrites(page);
  await page.goto(APP_URL);
  await keepSession(page, sessionAt('questions', { id: OLD_ID, savedAt: Date.now(), keep: 'until_deleted' }), readFileSync(FACE));
  await go(page, '#/my-look/questions');
  await expect.poll(() => decodesHeld(page)).toBeGreaterThan(0);
  await deleteOnSaved(page);
  const mark = await writes(page);
  await releaseAndSettle(page);
  await go(page, '#/my-look/photo');
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(listed(page)).toHaveCount(0);
  expect(await record(page)).toBeNull();
  // Positive control: this page does write, and what it writes is the new session.
  expect(await writtenUntil(page, mark, () => addPhotos(page, FACE), (held) => held?.photo === true)).toBeGreaterThanOrEqual(1);
  expect((await record(page))?.id).not.toBe(OLD_ID);
});

/** Counts this page's read-write IndexedDB transactions that have completed. */
const countReadWrites = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const real = Reflect.get(IDBDatabase.prototype, 'transaction') as (this: IDBDatabase, ...args: unknown[]) => IDBTransaction;
    Reflect.set(window, 'readWrites', 0);
    Reflect.set(IDBDatabase.prototype, 'transaction', function counted(this: IDBDatabase, ...args: unknown[]) {
      const tx = real.apply(this, args);
      if (args[1] === 'readwrite') tx.addEventListener('complete', () => { Reflect.set(window, 'readWrites', Number(Reflect.get(window, 'readWrites')) + 1); });
      return tx;
    });
  });
const readWrites = (page: Page): Promise<number> => page.evaluate(() => Number(Reflect.get(window, 'readWrites')));

test("the delete queued behind an old photo copy deletes only that session's record: another tab's save made after Delete my data stays", async ({ page, context }) => {
  // The photo's import runs; the first write's copy of it is held.
  await gateDecodes(page, DECODES_PER_PHOTO);
  await countReadWrites(page);
  await page.goto(APP_URL);
  await seedAnswers(page);
  await go(page, '#/my-look/questions');
  await expect(heading(page)).toHaveText('A few questions');
  await go(page, '#/my-look/photo');
  await expect(heading(page)).toHaveText('Add your photo');
  await addPhotos(page, FACE);
  await expect(listed(page)).toHaveCount(1);
  await expect.poll(() => decodesHeld(page)).toBeGreaterThan(0);
  await deleteOnSaved(page);

  const other = await context.newPage();
  await other.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(other)).toHaveText('Your goal');
  await say(other, 'Colour');
  await expect.poll(async () => (await record(other))?.goal).toBe('colour');
  const fresh = await record(other);
  expect(fresh?.id).not.toBe(OLD_ID);

  const mark = await readWrites(page);
  await page.evaluate(() => { (window as unknown as { releaseDecodes: () => void }).releaseDecodes(); });
  // Positive control: the first tab's queued delete has run its transaction.
  await expect.poll(() => readWrites(page)).toBeGreaterThan(mark);
  expect(await record(other)).toEqual(fresh);
});

test('a restored answers-only session with a photo added later shows its colour preview', async ({ page }) => {
  await requires(page, 'workerWebGL', 'idbBlob');
  await answersToQuestions(page, 'Colour');
  await go(page, '#/my-look/photo');
  await expect(heading(page)).toHaveText('Add your photo');
  await addPhotos(page, FACE);
  await expectAnalysed(page, 'one-face-salon-straight-wavy.jpg');
  await expect.poll(async () => (await record(page))?.analysed, { timeout: ANALYSIS_TIMEOUT_MS }).toBe(true);
  await page.reload();
  await expect(heading(page)).toHaveText('Add your photo');
  await go(page, '#/my-look/face');
  await expect(heading(page)).toHaveText('Your face card');
  await button(page, 'Try a colour on your photo').click();
  const sheet = page.getByRole('dialog', { name: 'Try a colour on your photo' });
  const said = sheet.getByRole('status').filter({ hasText: /rough preview on your photo|The preview could not be made/ });
  await expect(said).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await expect(said).toContainText('rough preview on your photo');
});

test('Delete my data while another tab holds the database open says the delete is partial, never done, and finishes once it closes', async ({ page, context }) => {
  await page.goto(`${APP_URL}#/saved`);
  await expect(heading(page)).toHaveText('Saved');
  const other = await context.newPage();
  await other.goto(APP_URL);
  // An older copy of the app in another tab, say, that does not close its connection when asked.
  await other.evaluate(() => new Promise<void>((opened) => {
    const request = indexedDB.open('huecut', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('session');
    request.onsuccess = () => { Reflect.set(window, 'held', request.result); opened(); };
  }));
  await button(page, 'Delete my data').click();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Some of your data could not be deleted.', { exact: false })).toBeVisible();
  await expect(page.getByText('Your data was deleted from this device.')).toHaveCount(0);
  await other.close();
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))).not.toContain('huecut');
});
