/**
 * Two tabs and starting again. One saved session per browser, named by its id: a tab writes only over its own session, a delete in one tab stays
 * deleted in the other, and taking the place of another session always takes the person's yes, on Home or in the tab that found it.
 */
import type { Page } from '@playwright/test';
import { button, go, heading } from './failure/support.ts';
import { expect, requires, test } from './guard.ts';
import { countWrites, goalPage, HOUR_MS, MODES, NOT_SAVED, NOTHING_YET, radio, record, refuseWritesOnDemand, saveBox, saveLine, say, seed, setFlag, TAKEN, writes, writtenUntil } from './save-support.ts';
import { APP_URL } from './server.ts';

test.beforeEach(async ({ page }) => {
  await requires(page, 'idbBlob');
});

const startAgainSheet = (page: Page) => page.getByRole('dialog', { name: 'Start again?' });
const SAVED_ID = 'saved-session';

/** Home with a saved session, once it has read it. */
async function homeWithSaved(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted', id: SAVED_ID });
  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();
}

/** Home's own word that it has read the saved session and keeps it: the offer to continue it. */
const continueOffered = (page: Page) => expect(page.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();

/** Start again, confirmed, up to Photo. */
async function startAgain(page: Page): Promise<void> {
  await button(page, 'Start again').first().click();
  await button(startAgainSheet(page), 'Yes, start again').click();
  await expect(heading(page)).toHaveText('Add your photo');
}

test('Home offers to continue or start again; continue resumes, cancel keeps, and only a yes replaces', async ({ page }) => {
  await homeWithSaved(page);
  await button(page, 'Start again').first().click();
  await expect(startAgainSheet(page).getByText('This replaces the session saved on this device', { exact: false })).toBeVisible();
  await button(startAgainSheet(page), 'Keep my session').click();
  await expect(startAgainSheet(page)).toHaveCount(0);
  expect((await record(page))?.id).toBe(SAVED_ID);
  await page.getByRole('link', { name: 'Continue where you left off' }).first().click();
  await expect(heading(page)).toHaveText('A few questions');
  expect((await record(page))?.id).toBe(SAVED_ID);
});

test('after a yes the old session stays until the first new answer commits, so a failed save cannot destroy it', async ({ page }) => {
  await refuseWritesOnDemand(page);
  await homeWithSaved(page);
  await startAgain(page);
  expect((await record(page))?.id, 'nothing is replaced yet').toBe(SAVED_ID);
  await page.getByRole('button', { name: 'Continue without a photo' }).click();
  await expect(heading(page)).toHaveText('Your goal');
  await setFlag(page, 'refuseWrites', true);
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText('Could not save. Keep this tab open.');
  expect((await record(page))?.id, 'a failed save leaves it').toBe(SAVED_ID);
  await setFlag(page, 'refuseWrites', false);
  await say(page, 'Colour');
  await expect.poll(async () => (await record(page))?.goal).toBe('colour');
  expect((await record(page))?.id).not.toBe(SAVED_ID);
});

test('a period chosen after Start again never reaches the old 24-hour session: unchanged within its time, gone after it, photo and all', async ({ page }) => {
  await page.goto(APP_URL);
  await seed(page, 20, { keep: 'day', id: SAVED_ID });
  await page.evaluate(() => { localStorage.setItem('huecut:saving', 'day'); });
  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();
  await startAgain(page);
  await expect(saveLine(page)).toHaveText(NOTHING_YET);
  await radio(page, MODES.until).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('huecut:saving'))).toBe('until_deleted');
  const before = await record(page);
  expect(before, 'nothing of the new session is written').toMatchObject({ id: SAVED_ID, keep: 'day', photo: true });
  for (const [hoursLater, what] of [[0, 'within its 24 hours: not changed, not re-dated'], [5, 'after them: deleted at its own time']] as const) {
    await page.goto('about:blank');
    if (hoursLater > 0) await page.addInitScript((later) => { const real = Date.now.bind(Date); Date.now = () => real() + later; }, hoursLater * HOUR_MS);
    await page.goto(`${APP_URL}#/explore`);
    await expect(heading(page).first()).toBeVisible();
    if (hoursLater > 0) {
      await expect.poll(() => record(page), { message: what }).toBeNull();
      continue;
    }
    await go(page, '#/');
    await continueOffered(page);
    expect(await record(page), what).toEqual(before);
  }
});

test('a period chosen by a new session in another tab is not taken up by the tab that runs the saved one', async ({ page, context }) => {
  await page.goto(APP_URL);
  await seed(page, 20, { keep: 'day', id: SAVED_ID });
  await page.evaluate(() => { localStorage.setItem('huecut:saving', 'day'); });
  await page.goto(`${APP_URL}#/my-look/goal`);
  await expect(heading(page)).toHaveText('Your goal');
  const other = await context.newPage();
  await other.goto(APP_URL);
  await expect(other.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();
  await startAgain(other);
  await radio(other, MODES.until).click();
  await expect.poll(() => other.evaluate(() => localStorage.getItem('huecut:saving'))).toBe('until_deleted');
  await say(page, 'Colour');
  await expect.poll(async () => (await record(page))?.goal).toBe('colour');
  expect((await record(page))?.keep, "its own period, not the other session's").toBe('day');
});

test('with a session saved, Home does not offer its other ways to start', async ({ page }) => {
  await homeWithSaved(page);
  await expect(page.getByRole('link', { name: 'See an example first' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'No photo? Get ideas from answers only' })).toHaveCount(0);
});

test('a link to the example does not replace a session that holds even one answer', async ({ page }) => {
  await goalPage(page, APP_URL);
  await say(page, 'Cut');
  await expect.poll(() => record(page)).not.toBeNull();
  const id = (await record(page))?.id;
  await go(page, '#/my-look/face?source=example');
  await expect(heading(page)).toHaveText('Your goal');
  await expect(page.getByText('Example', { exact: true })).toHaveCount(0);
  // Positive control: the same session runs on, and its next answer lands on its own record.
  await say(page, 'Colour');
  await expect.poll(async () => (await record(page))?.goal).toBe('colour');
  expect((await record(page))?.id).toBe(id);
});

test('a delete in one tab is not undone by the other, and the other tab says so', async ({ page, context }) => {
  await countWrites(page);
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted', id: SAVED_ID });
  await page.goto(`${APP_URL}#/my-look/goal`);
  await expect(heading(page)).toHaveText('Your goal');
  const other = await context.newPage();
  await other.goto(`${APP_URL}#/saved`);
  await expect(radio(other, MODES.until)).toBeChecked();
  await radio(other, MODES.off).click();
  await expect.poll(() => record(other)).toBeNull();
  await other.close();
  await expect(saveLine(page), 'this tab heard it').toHaveText(NOT_SAVED);
  await expect(radio(page, MODES.off)).toBeChecked();
  const whileOff = await writes(page);
  await say(page, 'Colour');
  // Positive control: only the person turning saving on here writes the session again, once.
  expect(await writtenUntil(page, whileOff, () => radio(page, MODES.until).click(), (r) => r?.goal === 'colour'), 'nothing was written while off').toBe(1);
});

test('a new session in another tab is not overwritten: this tab stops, says why and asks', async ({ page, context }) => {
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted', id: SAVED_ID });
  await page.goto(`${APP_URL}#/my-look/goal`);
  await expect(heading(page)).toHaveText('Your goal');
  const other = await context.newPage();
  await other.goto(APP_URL);
  await expect(other.getByRole('link', { name: 'Continue where you left off' }).first()).toBeVisible();
  await startAgain(other);
  await other.getByRole('button', { name: 'Continue without a photo' }).click();
  await expect(heading(other)).toHaveText('Your goal');
  await say(other, 'Both');
  await expect.poll(async () => (await record(other))?.goal).toBe('both');
  const theirs = (await record(other))?.id;
  expect(theirs).not.toBe(SAVED_ID);

  await say(page, 'Colour');
  await expect(saveLine(page)).toHaveText(TAKEN);
  expect((await record(page))?.id, 'not overwritten unasked').toBe(theirs);
  await button(saveBox(page), 'Replace it').click();
  await expect.poll(async () => (await record(page))?.id).toBe(SAVED_ID);
  await expect.poll(async () => (await record(page))?.goal).toBe('colour');
});

test('two new sessions at once: the second to write asks, and nothing is lost unasked', async ({ page, context }) => {
  await goalPage(page, APP_URL);
  await expect(heading(page)).toHaveText('Your goal');
  const other = await context.newPage();
  await goalPage(other, APP_URL);
  await expect(heading(other)).toHaveText('Your goal');
  await say(other, 'Both');
  await expect.poll(async () => (await record(other))?.goal).toBe('both');
  await say(page, 'Cut');
  await expect(saveLine(page)).toHaveText(TAKEN);
  expect((await record(page))?.goal).toBe('both');
});

test('a period chosen in one tab is the one the other writes', async ({ page, context }) => {
  await page.goto(APP_URL);
  await seed(page, 1, { keep: 'until_deleted', id: SAVED_ID });
  await page.goto(`${APP_URL}#/my-look/goal`);
  await expect(heading(page)).toHaveText('Your goal');
  const other = await context.newPage();
  await other.goto(`${APP_URL}#/saved`);
  await expect(radio(other, MODES.until)).toBeChecked();
  await radio(other, MODES.day).click();
  await expect.poll(async () => (await record(other))?.keep).toBe('day');
  await expect(radio(page, MODES.day), 'this tab follows').toBeChecked();
  await say(page, 'Colour');
  await expect.poll(async () => (await record(page))?.goal).toBe('colour');
  expect((await record(page))?.keep, 'and never writes the old period back').toBe('day');
});

test.describe('expiry', () => {
  test('no period counts as 24 hours from its own time, and a time that cannot be right counts as expired', async ({ page }) => {
    await page.goto(APP_URL);
    for (const [what, ageHours, over, stays] of [
      ['no period, not yet', 23.9, {}, true],
      ['no period, past', 24.1, {}, false],
      ['24 hours, a day ahead of the clock', -25, { keep: 'day' }, false],
      ['until deleted, a year on', 24 * 365, { keep: 'until_deleted' }, true],
    ] as const) {
      await seed(page, ageHours, over);
      await page.reload();
      await expect(heading(page).first()).toBeVisible();
      if (stays) await continueOffered(page);
      await expect.poll(async () => (await record(page)) !== null, { message: what }).toBe(stays);
    }
  });

  test('a 24-hour session left open past its time is deleted on resume, and the page starts clean', async ({ page }) => {
    await page.goto(APP_URL);
    await seed(page, 23.5, { keep: 'day' });
    await page.goto(`${APP_URL}#/my-look/goal`);
    await expect(heading(page)).toHaveText('Your goal');
    await page.evaluate((later) => {
      const real = Date.now.bind(Date);
      Date.now = () => real() + later;
      document.dispatchEvent(new Event('visibilitychange'));
    }, HOUR_MS);
    await expect(heading(page)).toHaveText('Add your photo');
    await expect.poll(() => record(page)).toBeNull();
  });

  test('a session kept until deleted is left alone on resume', async ({ page }) => {
    await page.goto(APP_URL);
    await seed(page, 23.5, { keep: 'until_deleted', id: SAVED_ID });
    await page.goto(`${APP_URL}#/my-look/goal`);
    await expect(heading(page)).toHaveText('Your goal');
    await page.evaluate((later) => {
      const real = Date.now.bind(Date);
      Date.now = () => real() + later;
      document.dispatchEvent(new Event('visibilitychange'));
    }, HOUR_MS * 100);
    await expect(heading(page)).toHaveText('Your goal');
    // Positive control: the session runs on after the resume, and its next answer lands on its own record.
    await say(page, 'Colour');
    await expect.poll(async () => (await record(page))?.goal).toBe('colour');
    expect((await record(page))?.id).toBe(SAVED_ID);
  });
});
