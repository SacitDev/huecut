/**
 * How long a session is kept on the production build with the real content: what a person is told, the period across a reload, the clock,
 * expiry on any page, the Board and pictures across a restore, and deletion that a save in flight cannot undo.
 */
import type { Locator, Page } from '@playwright/test';
import type { SessionData } from '../../src/domain/session/session-data.ts';
import { sessionAt } from '../machine/consult.fakes.ts';
import { answersToQuestions, button, go, heading, PHONE } from './failure/support.ts';
import { expect, requires, test } from './guard.ts';
import { open, PICTURES, prefs, tab, toTryOn } from './real-content-support.ts';
import { APP_URL } from './server.ts';
import { keepSession } from './try-on-support.ts';
import { countWrites, MODES, NOT_SAVED, NOTHING_YET, openKept, radio, SAVED_UNTIL, SHARED, TAKEN, TOLD, writes, writtenUntil } from './save-support.ts';

const HOUR_MS = 3_600_000;
const KEEP_DAY = MODES.day;
const KEEP_LONGER = MODES.until;
const KEPT_LONGER = SAVED_UNTIL;
/** Each thing a person must be told, by its words. */
const BEFORE_CHOOSING = TOLD;
const FACE_PHOTO = Buffer.from('a fictional photo');

test.beforeEach(async ({ page }) => {
  await requires(page, 'idbBlob');
});

interface Held { readonly keep?: string; readonly savedAt: number; readonly step: string; readonly pictures: readonly string[] }
/** The kept record as stored, or null; never creates the database, so "it is gone" can be asserted on it. */
const stored = (page: Page): Promise<Held | null> =>
  page.evaluate(async () => {
    if (!(await indexedDB.databases()).some((d) => d.name === 'huecut')) return null;
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const db = await settle(indexedDB.open('huecut', 1));
    const kept = await settle(db.transaction('session').objectStore('session').get('current') as IDBRequest<{ data: { keep?: string; savedAt: number; step: string }; pictures: object } | undefined>);
    db.close();
    return kept ? { ...(kept.data.keep === undefined ? {} : { keep: kept.data.keep }), savedAt: kept.data.savedAt, step: kept.data.step, pictures: Object.keys(kept.pictures) } : null;
  });

const databases = (page: Page): Promise<(string | undefined)[]> => page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));

/** A kept session with answers only, `ageHours` since its last save. */
const seed = (page: Page, ageHours: number, over: Partial<SessionData> = {}): Promise<void> =>
  keepSession(page, sessionAt('questions', { source: 'answers_only', photo: null, savedAt: Date.now() - ageHours * HOUR_MS, ...over }), FACE_PHOTO);

const toSaved = async (page: Page): Promise<void> => {
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
};

/** Counts the requests for persistent storage, each answered as a browser that has not granted it. */
const countPersistAsks = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const w = window as unknown as { persistAsks: number };
    w.persistAsks = 0;
    Object.defineProperty(StorageManager.prototype, 'persisted', { value: () => Promise.resolve(false) });
    Object.defineProperty(StorageManager.prototype, 'persist', { value: () => { w.persistAsks++; return Promise.resolve(false); } });
  });

/** From `window.holdCopies = true` on, every JPEG the page encodes waits until `window.release()`, so a save can be caught between its copy and its write. */
const holdCopies = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const w = window as unknown as { holdCopies: boolean; heldCopies: (() => void)[]; release: () => void };
    w.holdCopies = false;
    w.heldCopies = [];
    w.release = () => { w.holdCopies = false; for (const run of w.heldCopies.splice(0)) run(); };
    const real = Reflect.get(HTMLCanvasElement.prototype, 'toBlob') as (this: HTMLCanvasElement, ...args: unknown[]) => void;
    Reflect.set(HTMLCanvasElement.prototype, 'toBlob', function hold(this: HTMLCanvasElement, ...args: unknown[]) {
      if (w.holdCopies) w.heldCopies.push(() => { real.apply(this, args); });
      else real.apply(this, args);
    });
  });
const heldCopies = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { heldCopies: unknown[] }).heldCopies.length);

/** A restored session at Try it on, with a picture being added whose copy for the next save is held open. */
async function saveInFlight(page: Page): Promise<void> {
  await holdCopies(page);
  await open(page, { prefs: prefs('cut', 6) });
  await toTryOn(page);
  await tab(page, 'My pictures');
  await page.evaluate(() => { (window as unknown as { holdCopies: boolean }).holdCopies = true; });
  await page.locator('input[type=file]').first().setInputFiles(PICTURES[0] ?? '');
  await expect.poll(() => heldCopies(page), { message: 'the save is making its copy' }).toBeGreaterThan(0);
}

const release = (page: Page): Promise<void> => page.evaluate(() => { (window as unknown as { release: () => void }).release(); });
/** Home's own word that it has read the saved session and keeps it: the offer to continue it. */
const continueOffered = (page: Page) => expect(page.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();

test('told before the first answer; the default survives a reload, stays visible and asks for persistent storage', async ({ page }) => {
  await countPersistAsks(page);
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  // The face photo and the shared-browser warning in the open; the rest one tap away, under "What is kept".
  for (const words of SHARED) await expect(page.getByText(words, { exact: false }), words).toBeVisible();
  await openKept(page);
  for (const words of BEFORE_CHOOSING) await expect(page.getByText(words, { exact: false }), words).toBeVisible();
  await expect(radio(page, KEEP_DAY)).toBeVisible();
  await page.getByText('Cut', { exact: true }).click();
  await expect(page.getByText(KEPT_LONGER)).toBeVisible();
  await toSaved(page);
  await expect(radio(page, KEEP_LONGER)).toBeChecked();
  await expect(page.getByText(KEPT_LONGER)).toBeVisible();
  expect((await stored(page))?.keep).toBe('until_deleted');
  expect(await page.evaluate(() => (window as unknown as { persistAsks: number }).persistAsks), 'persistent storage is requested at the first write').toBe(1);
  await expect(page.getByText(/safe|forever|guarantee/i)).toHaveCount(0);

  await page.reload();
  await expect(heading(page)).toHaveText('Saved');
  await expect(page.getByText(KEPT_LONGER), 'with no machine on the page').toBeVisible();
  await go(page, '#/my-look/goal');
  await expect(heading(page)).toHaveText('Your goal');
  await toSaved(page);
  await expect(page.getByText(KEPT_LONGER), 'and with the session restored').toBeVisible();
  expect((await stored(page))?.keep).toBe('until_deleted');
});

test('opening, restoring and moving between steps never restart the clock; the record shows it', async ({ page }) => {
  await page.goto(APP_URL);
  await seed(page, 20);
  const before = (await stored(page))?.savedAt;
  await page.goto(`${APP_URL}#/my-look/questions`);
  await expect(heading(page)).toHaveText('A few questions');
  await go(page, '#/my-look/goal');
  await expect(heading(page)).toHaveText('Your goal');
  await expect.poll(async () => (await stored(page))?.step, { message: 'the new step was written' }).toBe('goal');
  expect((await stored(page))?.savedAt).toBe(before);
  await toSaved(page);
  await expect(page.getByText('Saved on this device. About 4 hours left.')).toBeVisible();
});

for (const [name, hash] of [['Home', '#/'], ['Explore', '#/explore'], ['Help', '#/help'], ['Saved', '#/saved']] as const) {
  test(`expiry at ${name} respects the choice; no choice counts as 24 hours`, async ({ page }) => {
    await page.goto(`${APP_URL}${hash}`);
    await expect(heading(page).first()).toBeVisible();
    for (const [what, ageHours, over, stays] of [
      ['kept until deleted, a year on', 24 * 365, { keep: 'until_deleted' }, true],
      ['24 hours, not yet', 23.9, { keep: 'day' }, true],
      ['24 hours, past', 24.1, { keep: 'day' }, false],
      ['no choice, not yet', 23.9, {}, true],
      ['no choice, past', 24.1, {}, false],
    ] as const) {
      await seed(page, ageHours, over);
      await page.reload();
      await expect(heading(page).first()).toBeVisible();
      if (stays) {
        await go(page, '#/');
        await continueOffered(page);
      }
      await expect.poll(async () => (await stored(page)) !== null, { message: what }).toBe(stays);
    }
  });
}

test('a record with no choice reads as 24 hours on Saved', async ({ page }) => {
  await page.goto(APP_URL);
  await seed(page, 2);
  await toSaved(page);
  await expect(page.getByText('Saved on this device. About 22 hours left.')).toBeVisible();
  await expect(radio(page, KEEP_DAY)).toBeChecked();
  await expect(page.getByText(KEPT_LONGER)).toHaveCount(0);
});

for (const [how, hash, title] of [['with no machine on the page', '#/saved', 'Saved'], ['with the session restored', '#/my-look/questions', 'A few questions']] as const) {
  test(`switching to 24 hours sets the expiry from that save, ${how}`, async ({ page }) => {
    await countPersistAsks(page);
    await page.goto(APP_URL);
    await seed(page, 24 * 40, { keep: 'until_deleted' });
    await page.goto(`${APP_URL}${hash}`);
    await expect(heading(page)).toHaveText(title);
    await toSaved(page);
    await expect(page.getByText(KEPT_LONGER)).toBeVisible();
    const pressed = Date.now();
    await radio(page, KEEP_DAY).click();
    await expect(page.getByText('Saved on this device. About 24 hours left.')).toBeVisible();
    await expect.poll(async () => (await stored(page))?.keep).toBe('day');
    expect((await stored(page))?.savedAt).toBeGreaterThanOrEqual(pressed);
    for (const words of BEFORE_CHOOSING) await expect(page.getByText(words, { exact: false }), `${words}, before going back to the longer choice`).toBeVisible();
    await radio(page, KEEP_LONGER).click();
    await expect(page.getByText(KEPT_LONGER)).toBeVisible();
    await expect.poll(async () => (await stored(page))?.keep).toBe('until_deleted');
    expect(await page.evaluate(() => (window as unknown as { persistAsks: number }).persistAsks), 'not on opening and not for a session already written').toBe(0);
  });
}

interface Shown { readonly ratio: number; readonly longSide: number; readonly sample: readonly number[] }
/** Each picture once it has arrived, in screen order: its shape and a small sample of its pixels. */
async function samplesOf(images: Locator): Promise<Shown[]> {
  await expect.poll(() => images.evaluateAll((all) => all.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0)), { message: 'every picture decoded' }).toBe(true);
  return images.evaluateAll((all) => (all as HTMLImageElement[]).map((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0, 8, 8);
    return { ratio: image.naturalWidth / image.naturalHeight, longSide: Math.max(image.naturalWidth, image.naturalHeight), sample: Array.from(ctx?.getImageData(0, 0, 8, 8).data ?? []) };
  }));
}

/** The same pictures in the same places: a stored copy is at most 1536 px on its long side, and otherwise the same picture. */
function expectSamePictures(after: readonly Shown[], before: readonly Shown[], where: string): void {
  expect(after.length, where).toBe(before.length);
  expect(before.length, where).toBeGreaterThan(0);
  for (const [i, was] of before.entries()) {
    const now = after[i];
    expect(now?.longSide, `${where} ${String(i)}: its size`).toBeLessThanOrEqual(Math.min(was.longSide, 1536));
    expect(Math.abs((now?.ratio ?? 0) - was.ratio), `${where} ${String(i)}: its shape`).toBeLessThan(0.01);
    const distance = was.sample.reduce((sum, v, k) => sum + Math.abs(v - (now?.sample[k] ?? 0)), 0) / was.sample.length;
    expect(distance, `${where} ${String(i)}: the same picture came back`).toBeLessThan(8);
  }
}

const slotPictures = (page: Page): Locator => page.getByRole('img', { name: /^Your AI picture for / });
const boardPictures = (page: Page): Locator => page.getByRole('list', { name: 'Your looks' }).locator('figure img');

const shownIdeas = (page: Page): Promise<string[]> => page.locator('main h3').allTextContents();

test('the Board, the ideas, the AI pictures and a grid still waiting for its names come back whole', async ({ page }) => {
  await open(page, { prefs: prefs('cut', 6) });
  const ideas = await shownIdeas(page);
  expect(ideas.length).toBeGreaterThan(0);
  await toTryOn(page);
  await tab(page, 'My pictures');
  const grid = page.locator('section').filter({ has: page.getByRole('heading', { level: 3, name: /^Picture 1 of \d+:/ }) }).last();
  const boxes = page.locator('input[type=file]');
  for (const [i, picture] of PICTURES.entries()) await boxes.nth(i).setInputFiles(picture);
  await expect(slotPictures(page)).toHaveCount(PICTURES.length);
  await grid.locator('input[type=file]').setInputFiles(PICTURES[0] ?? '');
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  await expect(heading(page)).toHaveText('Board');
  await expect(boardPictures(page)).toHaveCount(PICTURES.length);
  const boardBefore = await samplesOf(boardPictures(page));
  const namesBefore = await page.getByRole('list', { name: 'Your looks' }).locator('figcaption').allTextContents();
  await toSaved(page);
  await radio(page, KEEP_LONGER).click();
  await expect(radio(page, KEEP_LONGER), 'the choice shows at once, whatever a write is doing').toBeChecked();
  await expect(page.getByText(KEPT_LONGER), 'and "saved" when it has committed: seven pictures, on a loaded machine').toBeVisible({ timeout: 30_000 });
  await go(page, '#/my-look/try-on');
  await expect(heading(page)).toHaveText('Try it on');
  await expect.poll(async () => (await stored(page))?.step, { timeout: 30_000 }).toBe('try-on');
  const slotsBefore = await samplesOf(slotPictures(page));
  expect((await stored(page))?.pictures.length, 'six slots and the grid').toBe(PICTURES.length + 1);

  await page.reload();
  await expect(heading(page)).toHaveText('Try it on');
  await expect(page.getByRole('tab', { name: 'My pictures' })).toHaveAttribute('aria-selected', 'true');
  await expect(slotPictures(page)).toHaveCount(PICTURES.length);
  expectSamePictures(await samplesOf(slotPictures(page)), slotsBefore, 'slot');
  await expect(grid.getByText('This picture is no longer on this device.', { exact: false }), 'the grid picture came back too').toHaveCount(0);
  await expect(grid.getByText('Which look does each tile show?')).toBeVisible();
  await go(page, '#/my-look/board');
  await expect(heading(page)).toHaveText('Board');
  await expect(boardPictures(page)).toHaveCount(PICTURES.length);
  expect(await page.getByRole('list', { name: 'Your looks' }).locator('figcaption').allTextContents()).toEqual(namesBefore);
  expectSamePictures(await samplesOf(boardPictures(page)), boardBefore, 'board tile');
  await go(page, '#/my-look/ideas');
  await expect(heading(page)).toHaveText('Your ideas');
  expect(await shownIdeas(page)).toEqual(ideas);
});

test("Don't save removes the record and its pictures, and a save in flight cannot bring it back", async ({ page }) => {
  await countWrites(page);
  await saveInFlight(page);
  expect(await stored(page)).not.toBeNull();
  await toSaved(page);
  await radio(page, MODES.off).click();
  await expect(page.getByText(NOT_SAVED).first()).toBeVisible();
  const deleted = await writes(page);
  await release(page);
  // The delete waits behind the save in flight, which then stores nothing.
  await expect.poll(() => stored(page), 'the save that was in flight stored nothing').toBeNull();
  // Positive control: turned on again the session is written once, so the save in flight never wrote.
  expect(await writtenUntil(page, deleted, () => radio(page, KEEP_LONGER).click(), (r) => r?.keep === 'until_deleted'), 'one write, when turned on again').toBe(1);
  await radio(page, MODES.off).click();
  await expect.poll(() => stored(page)).toBeNull();
  await page.reload();
  await expect(page.getByText(NOT_SAVED).first()).toBeVisible();
  expect(await stored(page)).toBeNull();
});

test("a Don't save the browser refuses says so, and the record stays", async ({ page }) => {
  await page.goto(APP_URL);
  await seed(page, 1);
  await page.evaluate(() => { Reflect.set(IDBObjectStore.prototype, 'delete', () => { throw new DOMException('refused', 'UnknownError'); }); });
  await toSaved(page);
  await radio(page, MODES.off).click();
  await expect(page.getByText('Could not delete it.', { exact: false }).first()).toBeVisible();
  await expect(page.getByText(NOT_SAVED)).toHaveCount(0);
  expect(await stored(page)).not.toBeNull();
});

test('Delete my data removes the database, and a save in flight cannot bring it back', async ({ page }) => {
  await countWrites(page);
  await saveInFlight(page);
  await toSaved(page);
  await button(page, 'Delete my data').click();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
  const deleted = await writes(page);
  await release(page);
  expect(await databases(page), 'not even an empty database').not.toContain('huecut');
  // Positive control: a new session's first answer is written behind the save that was in flight, and that one write is all since the delete.
  expect(await writtenUntil(page, deleted, async () => {
    await go(page, '#/my-look/goal?source=answers');
    await expect(heading(page)).toHaveText('Your goal');
    await page.getByText('Cut', { exact: true }).click();
  }, (r) => r?.goal === 'cut'), 'the save that was in flight stored nothing').toBe(1);
  await toSaved(page);
  await button(page, 'Delete my data').click();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
  await page.reload();
  await expect(heading(page)).toHaveText('Saved');
  // The app's own status line: it has read the storage, which it never creates by reading.
  await expect(page.getByText(NOTHING_YET).first()).toBeVisible();
  expect(await databases(page), 'and no page load makes one').not.toContain('huecut');
});

test('a session deleted in another tab is not written back by this one', async ({ page, context }) => {
  await countWrites(page);
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted' });
  await page.goto(`${APP_URL}#/my-look/questions`);
  await expect(heading(page)).toHaveText('A few questions');
  const other = await context.newPage();
  await other.goto(`${APP_URL}#/saved`);
  await expect(heading(other)).toHaveText('Saved');
  await radio(other, MODES.off).click();
  await expect(other.getByText(NOT_SAVED).first()).toBeVisible();
  await other.close();
  const deleted = await writes(page);
  await go(page, '#/my-look/goal');
  await expect(heading(page)).toHaveText('Your goal');
  await toSaved(page);
  await expect(page.getByText(NOT_SAVED).first(), 'and this tab says so').toBeVisible();
  expect(await stored(page)).toBeNull();
  // Positive control: turning saving on here writes the session, once: nothing was written back before.
  expect(await writtenUntil(page, deleted, () => radio(page, KEEP_LONGER).click(), (r) => r?.step === 'goal'), 'with a way to turn saving on').toBe(1);
});

test.describe('on a phone', () => {
  test.use(PHONE);

  test('Try it on tells what is saved, says when it would replace another session, and each mode works', async ({ page }) => {
    await answersToQuestions(page, 'Colour');
    await button(page, 'Skip to my ideas').click();
    await expect(heading(page)).toHaveText('Your ideas');
    await seed(page, 1, { id: 'another-session' });
    await button(page, 'Try them on').click();
    await expect(heading(page)).toHaveText('Try it on');
    // Told whole on the step the person came in on; here one line, with the same control a tap away.
    await expect(page.getByText(TAKEN).first()).toBeVisible();
    await button(page, 'Replace it').click();
    await expect.poll(async () => (await stored(page))?.step).toBe('try-on');
    await expect(page.getByText(KEPT_LONGER)).toBeVisible();
    await button(page, 'Change saving').click();
    for (const words of BEFORE_CHOOSING) await expect(page.getByText(words, { exact: false }), words).toBeVisible();
    expect((await stored(page))?.keep).toBe('until_deleted');
    await radio(page, KEEP_DAY).click();
    await expect(page.getByText('Saved on this device. About 24 hours left.')).toBeVisible();
    await expect.poll(async () => (await stored(page))?.keep).toBe('day');
    await radio(page, MODES.off).click();
    await expect.poll(() => stored(page)).toBeNull();
    await expect(page.getByText(TAKEN), 'its own deleted session is nothing to replace').toHaveCount(0);
  });

  test('with nothing else saved there is no question of replacing', async ({ page }) => {
    await answersToQuestions(page, 'Colour');
    await button(page, 'Skip to my ideas').click();
    await button(page, 'Try them on').click();
    await expect(heading(page)).toHaveText('Try it on');
    await button(page, 'Change saving').click();
    await expect(radio(page, KEEP_LONGER)).toBeChecked();
    // The app's own status line: the write has landed and was not taken.
    await expect(page.getByText(KEPT_LONGER)).toBeVisible();
    await expect(page.getByText(TAKEN)).toHaveCount(0);
  });
});
