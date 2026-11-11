/**
 * Saved by default on the production build with the real content: nothing is written until the first answer or photo, what a person is told
 * on every route in, the three modes, a save said only once committed, a refused write that keeps the last good one, and a control nothing can move.
 */
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { addPhotos, button, expectAnalysed, FACE, go, heading, holdModel, openPhoto, PHONE, RELOADED } from './failure/support.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { CUTS } from './real-content-support.ts';
import { boxesOf, countWrites, goalPage, holdWrites, LAST_GOOD, MODES, NO_SAVE_AT_ALL, NOT_SAVED, NOTHING_YET, TAKEN, radio, record, refuseWritesOnDemand, saveBox, saveLine, SAVED_UNTIL, SAVING, say, seed, setFlag, TOLD, expectToldFirst, writes, writtenUntil } from './save-support.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

test.beforeEach(async ({ page }) => {
  await requires(page, 'idbBlob');
});

const WIDTHS = [320, 375, 768, 1280];
const CONTROL = 'section[aria-label="Saving this session"]';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the control is clean in axe at every width, in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await goalPage(page, APP_URL);
    await expect(heading(page)).toHaveText('Your goal');
    await say(page, 'Cut');
    await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      const result = await new AxeBuilder({ page }).include(CONTROL).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map((v) => v.id), `${colorScheme} at ${String(width)} px`).toEqual([]);
      await page.screenshot({ path: join(shotsDir('saved-default'), `goal-${colorScheme}-${String(width)}.png`) });
      noteScreenshot();
    }
  });
}

for (const width of WIDTHS) {
  test(`at ${String(width)} px the line comes before the first editable control on every route into My look`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${APP_URL}#/my-look/photo`);
    await expect(heading(page)).toHaveText('Add your photo');
    await expectToldFirst(page, 'start with a photo');
    await goalPage(page, APP_URL);
    await page.reload();
    await expect(heading(page)).toHaveText('Your goal');
    await expectToldFirst(page, 'answers only');
    await page.goto('about:blank');
    await page.goto(`${APP_URL}#/my-look/ideas`);
    await expect(heading(page)).toHaveText('Add your photo');
    await expectToldFirst(page, 'a deep link with nothing saved');
    await page.goto('about:blank');
    await page.goto(`${APP_URL}#/explore/style/${CUTS[0]?.id ?? ''}`);
    await page.getByRole('button', { name: 'Find my look with this style' }).click();
    await expect(heading(page)).toHaveText('Add your photo');
    await expectToldFirst(page, 'add from Explore');
    await page.goto('about:blank');
    await page.goto(APP_URL);
    await seed(page, 1, { keep: 'until_deleted' });
    await page.goto(`${APP_URL}#/my-look/questions`);
    await expect(heading(page)).toHaveText('A few questions');
    await expectToldFirst(page, 'a restored session');
    await expect(radio(page, MODES.until)).toBeChecked();
  });
}

test('on the steps after the first, a short status with the same control a tap away', async ({ page }) => {
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted' });
  await page.goto(`${APP_URL}#/my-look/questions`);
  await expect(heading(page)).toHaveText('A few questions');
  await go(page, '#/my-look/goal');
  await expect(heading(page)).toHaveText('Your goal');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  await expect(radio(page, MODES.off)).toHaveCount(0);
  await button(page, 'Change saving').click();
  await expect(radio(page, MODES.off)).toBeVisible();
  await expect(saveBox(page).getByText(TOLD[0] ?? '', { exact: false })).toBeVisible();
});

test('opening the app saves nothing; the first answer starts the saving, until I delete it', async ({ page }) => {
  await countWrites(page);
  for (const hash of ['#/', '#/explore', '#/help', '#/saved', '#/my-look/photo', '#/my-look/goal?source=answers']) {
    await page.goto('about:blank');
    await page.goto(`${APP_URL}${hash}`);
    await expect(heading(page).first()).toBeVisible();
    await page.waitForTimeout(700);
    expect(await record(page), hash).toBeNull();
  }
  await expect(heading(page)).toHaveText('Your goal');
  await expect(radio(page, MODES.until), 'the default').toBeChecked();
  await expect(saveLine(page)).toHaveText(NOTHING_YET);
  await say(page, 'Cut');
  await expect.poll(async () => (await record(page))?.keep).toBe('until_deleted');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  expect(await writes(page), 'positive control: the first answer is the first write since the app opened').toBe(1);
});

test('the first photo starts the saving before its analysis ends, and comes back still to be analysed', async ({ page }) => {
  const held = await holdModel(page, /^mediapipe\//);
  await openPhoto(page);
  await addPhotos(page, FACE);
  await expect.poll(async () => (await record(page))?.photo, { timeout: 30_000 }).toBe(true);
  expect((await record(page))?.analysed).toBe(false);
  expect((await record(page))?.keep).toBe('until_deleted');
  await page.reload();
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
  await expect(page.getByText(RELOADED)).toHaveCount(0);
  held.release();
});

test('the bundled example is never saved and has no control of its own', async ({ page }) => {
  await countWrites(page);
  await page.goto(`${APP_URL}#/my-look/face?source=example`);
  await expect(heading(page)).toHaveText('Your face card');
  await expect(page.getByText('Example', { exact: true })).toBeVisible();
  await button(page, 'Choose what to change').click();
  await expect(heading(page)).toHaveText('Your goal');
  await say(page, 'Cut');
  await expect(saveBox(page)).toHaveCount(0);
  // Positive control: the person's own session from here is saved, and its first write is the only one the tab has made.
  const own = async (): Promise<void> => { await button(page, 'Start with my photo').click(); await button(page, 'Continue without a photo').click(); await say(page, 'Cut'); };
  expect(await writtenUntil(page, 0, own, (r) => r?.goal === 'cut'), 'the example wrote nothing').toBe(1);
});

test("Don't save deletes the copy, holds for later sessions and says Not saved, with a way to turn saving on", async ({ page }) => {
  await countWrites(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(() => record(page)).not.toBeNull();
  await radio(page, MODES.off).click();
  await expect.poll(() => record(page)).toBeNull();
  await expect(saveLine(page)).toHaveText(NOT_SAVED);
  expect(await page.evaluate(() => localStorage.getItem('huecut:saving'))).toBe('off');
  const whileOff = await writes(page);
  await say(page, 'Colour');
  expect(await writtenUntil(page, whileOff, () => radio(page, MODES.until).click(), (r) => r?.goal === 'colour'), 'positive control: on again, one write, so none while off').toBe(1);
  await radio(page, MODES.off).click();
  await expect.poll(() => record(page)).toBeNull();

  await page.reload();
  await expect(heading(page)).toHaveText('Add your photo');
  await expect(radio(page, MODES.off), 'a later session in this browser').toBeChecked();
  await expect(saveLine(page)).toHaveText(NOT_SAVED);
  const photoWhileOff = await writes(page);
  await addPhotos(page, FACE);
  await expectAnalysed(page, 'one-face-salon-straight-wavy.jpg');
  expect(await record(page)).toBeNull();

  expect(await writtenUntil(page, photoWhileOff, () => radio(page, MODES.until).click(), (r) => r?.keep === 'until_deleted' && r.photo), 'the photo was not written while off').toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('huecut:saving')), 'turned on again').toBe('until_deleted');
});

test("Delete my data keeps Don't save and says so, so the next session is not saved by surprise", async ({ page }) => {
  await countWrites(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(() => record(page)).not.toBeNull();
  await radio(page, MODES.off).click();
  await expect.poll(() => record(page)).toBeNull();
  await go(page, '#/saved');
  await expect(heading(page)).toHaveText('Saved');
  await button(page, 'Delete my data').click();
  await expect(page.getByText("If you chose Delete and don't save, that choice stays, so nothing is saved until you choose a period again.")).toBeVisible();
  await button(page, 'Yes, delete my data').click();
  await expect(page.getByText('Your data was deleted from this device.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('huecut:saving'))).toBe('off');
  await goalPage(page, APP_URL);
  await expect(radio(page, MODES.off), 'the next session').toBeChecked();
  const whileOff = await writes(page);
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText(NOT_SAVED);
  expect(await writtenUntil(page, whileOff, () => radio(page, MODES.until).click(), (r) => r?.goal === 'cut'), 'positive control: on again, one write, so none while off').toBe(1);
});

test("a save still in flight cannot bring back what Don't save removed", async ({ page }) => {
  await countWrites(page);
  await holdWrites(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(() => record(page)).not.toBeNull();
  await setFlag(page, 'holdWrites', true);
  await say(page, 'Colour');
  await expect(saveLine(page)).toHaveText(SAVING);
  await radio(page, MODES.off).click();
  await setFlag(page, 'releaseWrite', true);
  await expect.poll(() => record(page)).toBeNull();
  expect(await writtenUntil(page, await writes(page), () => radio(page, MODES.until).click(), (r) => r?.goal === 'colour'), 'positive control: on again, one write, so nothing came back').toBe(1);
});

test('Saved is said only once the write has committed', async ({ page }) => {
  await holdWrites(page);
  await goalPage(page, APP_URL);
  await setFlag(page, 'holdWrites', true);
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText(SAVING);
  await expect(saveLine(page)).not.toHaveText(SAVED_UNTIL);
  await page.waitForTimeout(800);
  await expect(saveLine(page), 'still in flight').not.toHaveText(SAVED_UNTIL);
  await setFlag(page, 'releaseWrite', true);
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
});

test('a refused write keeps the last good save and says so; the next good write clears it', async ({ page, guard }) => {
  await refuseWritesOnDemand(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(async () => (await record(page))?.goal).toBe('cut');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  await setFlag(page, 'refuseWrites', true);
  await say(page, 'Colour');
  await expect(saveLine(page)).toHaveText(LAST_GOOD);
  expect((await record(page))?.goal, 'the last good save').toBe('cut');
  await setFlag(page, 'refuseWrites', false);
  await say(page, 'Both');
  await expect.poll(async () => (await record(page))?.goal).toBe('both');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  expect(guard.errors).toEqual([]);
});

test('a first write refused says so and leaves nothing behind', async ({ page }) => {
  await refuseWritesOnDemand(page);
  await goalPage(page, APP_URL);
  await setFlag(page, 'refuseWrites', true);
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText(NO_SAVE_AT_ALL);
  expect(await record(page)).toBeNull();
});

/** Replaces `persist` and `persisted`: `how` is what `persist` does. */
const stubPersist = (page: Page, how: 'refuse' | 'reject'): Promise<unknown> =>
  page.addInitScript((mode) => {
    const w = window as unknown as { persistAsks: number };
    w.persistAsks = 0;
    Object.defineProperty(StorageManager.prototype, 'persisted', { value: () => Promise.resolve(false) });
    Object.defineProperty(StorageManager.prototype, 'persist', { value: () => { w.persistAsks++; return mode === 'reject' ? Promise.reject(new Error('refused by test')) : Promise.resolve(false); } });
  }, how);
const persistAsks = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { persistAsks: number }).persistAsks);

for (const how of ['refuse', 'reject'] as const) {
  test(`persistent storage is asked for once, at the first write; a ${how} blocks nothing and is never announced`, async ({ page }) => {
    await stubPersist(page, how);
    await goalPage(page, APP_URL);
    await expect(heading(page)).toHaveText('Your goal');
    await page.waitForTimeout(700);
    expect(await persistAsks(page), 'not on opening').toBe(0);
    await say(page, 'Cut');
    await expect.poll(() => record(page)).not.toBeNull();
    await expect.poll(() => persistAsks(page)).toBe(1);
    await say(page, 'Colour');
    await expect.poll(async () => (await record(page))?.goal).toBe('colour');
    await radio(page, MODES.day).click();
    await radio(page, MODES.until).click();
    await expect.poll(async () => (await record(page))?.keep).toBe('until_deleted');
    expect(await persistAsks(page), 'once').toBe(1);
    await expect(page.getByText(/safe|forever|guarantee|backed up/i)).toHaveCount(0);
  });
}

test('a browser with no StorageManager just goes on', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'storage', { value: undefined }); });
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(() => record(page)).not.toBeNull();
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
});

test('the period chosen is the period kept: it shows at once, and an earlier write still in flight cannot end on another', async ({ page }) => {
  await holdWrites(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(async () => (await record(page))?.goal).toBe('cut');
  await setFlag(page, 'holdWrites', true);
  await say(page, 'Colour');
  await expect(saveLine(page)).toHaveText(SAVING);
  await radio(page, MODES.day).click();
  await expect(radio(page, MODES.day), 'the choice is on the screen before any write').toBeChecked();
  await radio(page, MODES.until).click();
  await radio(page, MODES.day).click();
  await expect(radio(page, MODES.day)).toBeChecked();
  await expect(saveLine(page)).not.toHaveText(SAVED_UNTIL);
  await setFlag(page, 'releaseWrite', true);
  await expect.poll(async () => (await record(page))?.keep).toBe('day');
  await page.waitForTimeout(900);
  expect((await record(page))?.keep, 'and it stays').toBe('day');
  await expect(saveLine(page)).toHaveText('Saved on this device. About 24 hours left.');
});

test('a choice whose write never landed still holds when the app next runs, counting from then', async ({ page }) => {
  await holdWrites(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(async () => (await record(page))?.keep).toBe('until_deleted');
  const before = Date.now();
  await setFlag(page, 'holdWrites', true);
  await radio(page, MODES.day).click();
  await page.reload();
  await expect(radio(page, MODES.day)).toBeChecked();
  await expect(saveLine(page)).toHaveText('Saved on this device. About 24 hours left.');
  await expect.poll(async () => (await record(page))?.keep).toBe('day');
  expect((await record(page))?.savedAt).toBeGreaterThanOrEqual(before);
});

test('on a later step the one-line status keeps its height at 320 px, whatever it says', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await refuseWritesOnDemand(page);
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await say(page, "Women's styles");
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  const [box] = await boxesOf(saveBox(page));
  await setFlag(page, 'refuseWrites', true);
  // By keyboard, which stays on the question: the status sits under the question now, and a new question would move it for its own reasons.
  await page.locator('main fieldset input').first().press('Space');
  await expect(saveLine(page)).toHaveText(LAST_GOOD);
  expect((await boxesOf(saveBox(page)))[0], 'refused').toEqual(box);
  await setFlag(page, 'refuseWrites', false);
  await seed(page, 1, { id: 'another-session' });
  await page.locator('main fieldset input').nth(1).press('Space');
  await expect(saveLine(page)).toHaveText(TAKEN);
  expect((await boxesOf(saveBox(page)))[0], 'taken').toEqual(box);
});

test('no status change moves a control or what follows it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await refuseWritesOnDemand(page);
  await goalPage(page, APP_URL);
  await expect(heading(page)).toHaveText('Your goal');
  const controls = page.locator('main input[type=radio]');
  await expect(saveLine(page)).toHaveText(NOTHING_YET);
  const before = await boxesOf(controls);
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText(SAVED_UNTIL);
  expect(await boxesOf(controls), 'saved').toEqual(before);
  await setFlag(page, 'refuseWrites', true);
  await say(page, 'Colour');
  await expect(saveLine(page)).toHaveText(LAST_GOOD);
  expect(await boxesOf(controls), 'refused').toEqual(before);
  await setFlag(page, 'refuseWrites', false);
  await radio(page, MODES.off).click();
  await expect(saveLine(page)).toHaveText(NOT_SAVED);
  expect(await boxesOf(controls), 'not saved').toEqual(before);
});

for (const width of [320, 1280]) {
  test(`on Saved at ${String(width)} px a tap is never moved by what arrives later`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(APP_URL);
    await seed(page, 1, { keep: 'until_deleted' });
    await page.goto('about:blank');
    let release = (): void => undefined;
    const gate = new Promise<void>((done) => { release = done; });
    await page.route(/library-index-[^/]+\.json$/, async (route) => { await gate; await route.continue(); });
    await page.goto(`${APP_URL}#/saved`);
    await expect(heading(page)).toHaveText('Saved');
    await expect(radio(page, MODES.until)).toBeChecked();
    // Delete my data never waits for the library, and the list arriving later does not move it.
    await expect(button(page, 'Delete my data'), 'on screen while the list loads').toBeVisible();
    const controls = saveBox(page).locator('label').or(button(page, 'Delete my data'));
    const before = await boxesOf(controls);
    const target = before[1] ?? { top: 0, left: 0, width: 0, height: 0 };
    release();
    await page.mouse.click(target.left + target.width / 2, target.top + target.height / 2 - await page.evaluate(() => window.scrollY));
    await expect(radio(page, MODES.day), 'the control under the tap is the one chosen').toBeChecked();
    await expect(page.getByRole('heading', { name: 'Your favourites' }), 'the list has arrived').toBeVisible();
    expect(await boxesOf(controls), 'nothing moved').toEqual(before);
    await expect.poll(async () => (await record(page))?.keep).toBe('day');
  });
}

test.describe('on a phone', () => {
  test.use(PHONE);

  test('the three modes are 44 px targets, and a keyboard meets them before the screen', async ({ page }) => {
    await goalPage(page, APP_URL);
    await expect(heading(page)).toHaveText('Your goal');
    const boxes = await boxesOf(saveBox(page).locator('label'));
    expect(boxes).toHaveLength(3);
    for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
    await heading(page).focus();
    await page.keyboard.press('Tab');
    await expect(saveBox(page).getByRole('button', { name: 'What is kept' }), 'the first stop after the heading').toBeFocused();
    await page.keyboard.press('Tab');
    await expect(radio(page, MODES.until), 'then the modes, before anything of the screen').toBeFocused();
  });
});
