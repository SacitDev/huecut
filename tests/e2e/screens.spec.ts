/**
 * The My look screens on the build (so the CSP applies), with real content and fictional photos: the colour preview, the face
 * card's order on a phone, the explain prompt, the question taps, the short colour cards, Improve my ideas, the saving control
 * and the Board action.
 * Chromium only for the face tools.
 */
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, requires, test } from './guard.ts';
import { APP_URL } from './server.ts';

const FACES = join(import.meta.dirname, '..', 'fixtures', 'faces');
const SALON = join(FACES, 'one-face-salon-straight-wavy.jpg');
const FAR = join(FACES, 'far-1-5m.jpg');
/** First visit: the core tools come from the preview server, then one analysis. */
const ANALYSIS_TIMEOUT_MS = 180_000;
const MAX_TABS = 60;
const COUNT = /^Question \d+ of \d+$/;

const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
const button = (scope: Page | Locator, name: string): Locator => scope.getByRole('button', { name, exact: true });

async function toFace(page: Page, file: string): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/photo`);
  await page.locator('input[type=file]').first().setInputFiles(file);
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  await expect(page.locator('canvas[role="img"]')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
}

/** Goal and collection by pointer, on to the questions. */
async function toQuestions(page: Page, goal: 'Cut' | 'Colour' | 'Both', show: string): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText(goal, { exact: true }).click();
  await page.getByText(show, { exact: true }).click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
}

/** Focus on the question's radio group by Tab (one Tab stop), never a click. */
async function tabIntoRadios(page: Page): Promise<void> {
  const radios = page.locator('fieldset').first().locator('input[type="radio"]');
  for (let i = 0; i < MAX_TABS; i++) {
    if (await radios.evaluateAll((els) => els.includes(document.activeElement as HTMLElement))) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab never reached the radio group');
}

test.describe('the preview on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('opens whole with no seam, stays in view, and its looks run in one row', async ({ page }) => {
    await requires(page, 'workerWebGL');
    await toFace(page, SALON);
    await button(page, 'Try a colour on your photo').click();
    const sheet = page.getByRole('dialog', { name: 'Try a colour on your photo' });
    await expect(sheet.getByRole('status').filter({ hasText: 'rough preview on your photo' })).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
    const slider = sheet.getByRole('slider', { name: 'Before and after' });
    await expect(slider).toHaveValue('0');
    const before = sheet.locator('canvas[data-layer="before"]');
    expect(await before.evaluate((c: HTMLElement) => c.style.clipPath)).toBe('inset(0px 100% 0px 0px)');
    await expect(sheet.locator('[data-layer="divider"]')).toHaveCount(0);
    const inView = async (): Promise<void> => {
      const box = await sheet.locator('canvas[data-layer="after"]').boundingBox();
      expect(box?.y ?? -1, 'the top of the picture').toBeGreaterThanOrEqual(0);
      expect((box?.y ?? 0) + (box?.height ?? 9_999), 'the bottom of the picture').toBeLessThanOrEqual(812);
    };
    await inView();
    const looks = sheet.getByRole('group', { name: 'Colour looks' });
    const row = await looks.evaluate((el) => ({ scrolls: el.scrollWidth > el.clientWidth, height: el.getBoundingClientRect().height }));
    expect(row.scrolls, 'the looks run sideways').toBe(true);
    expect(row.height, 'one row of looks').toBeLessThan(80);
    await looks.getByRole('button').nth(1).click();
    await inView();
    await sheet.getByRole('switch', { name: 'Neutral grey view' }).scrollIntoViewIfNeeded();
    await inView();
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('1');
    await expect(sheet.locator('[data-layer="divider"]')).toHaveCount(1);
  });
});

test('the face card on a phone: the portrait first, Move the lines right under it, then the facts; no photo asked for again', async ({ page }) => {
  await requires(page, 'workerWebGL');
  await page.setViewportSize({ width: 375, height: 900 });
  await toFace(page, SALON);
  const canvas = page.locator('canvas[role="img"]');
  await expect(canvas).toHaveAccessibleName(/^Your photo with lines on the face outline/);
  const [picture, move, facts] = [await canvas.boundingBox(), await button(page, 'Move the lines').boundingBox(), await page.getByRole('region', { name: 'What this photo shows' }).boundingBox()];
  const under = (move?.y ?? 9_999) - ((picture?.y ?? 0) + (picture?.height ?? 0));
  expect(under, 'Move the lines sits under the photo').toBeGreaterThanOrEqual(0);
  expect(under).toBeLessThan(120);
  expect(facts?.y ?? 0).toBeGreaterThan(move?.y ?? 9_999);
  // An ordinary photo is not sent back for a better one.
  await expect(page.getByRole('link', { name: 'Add a photo from further away' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'What this photo shows' }).getByRole('heading', { level: 3 })).not.toHaveCount(0);
});

test('the face card copies a prompt that explains it, in its own words and with no number', async ({ page, context }) => {
  await requires(page, 'workerWebGL');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await toFace(page, FAR);
  await button(page, 'Copy a prompt to explain my face card').click();
  await expect(page.getByText('Prompt copied', { exact: true })).toBeVisible();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt.length).toBeGreaterThan(100);
  expect(prompt).toContain('In this photo, your face is');
  expect(prompt.replace('under 200 words', '')).not.toMatch(/\d/);
});

test('a tap on an answer goes on, the keyboard stays, Back goes to the question before', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await toQuestions(page, 'Cut', "Women's styles");
  const count = page.getByText(COUNT);
  await expect(count).toHaveText(/^Question 1 of/);
  await expect(page.getByText('Tap an answer to go on')).toBeVisible();
  // The keyboard stays: Space on the first answer, and an arrow to the next.
  await tabIntoRadios(page);
  await page.keyboard.press('Space');
  await expect(page.locator('fieldset').first().locator('input[type="radio"]').first()).toBeChecked();
  await expect(count).toHaveText(/^Question 1 of/);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('fieldset').first().locator('input[type="radio"]').nth(1)).toBeChecked();
  await expect(count).toHaveText(/^Question 1 of/);
  // A tap on an answer goes on at once.
  await page.locator('fieldset').first().locator('label').nth(1).click();
  await expect(count).toHaveText(/^Question 2 of/);
  // Next and Skip share one row, and "Previous question" is gone from the pinned bar.
  await expect(button(page, 'Previous question')).toHaveCount(0);
  const [next, skip] = [await button(page, 'Next question').boundingBox(), await button(page, 'Skip to my ideas').boundingBox()];
  expect(Math.abs((next?.y ?? 0) - (skip?.y ?? 500)), 'Next and Skip share one row').toBeLessThan(12);
  // Back: the previous question while there is one, its answer kept, then the previous step.
  await button(page, 'Back').click();
  await expect(count).toHaveText(/^Question 1 of/);
  await expect(page.locator('fieldset').first().locator('input[type="radio"]').nth(1)).toBeChecked();
  await button(page, 'Back').click();
  await expect(heading(page)).toHaveText('Your goal');
});

test('a tap that opens a follow-up stays on the question; the tap on the follow-up goes on', async ({ page }) => {
  await toQuestions(page, 'Both', "Women's styles");
  const count = page.getByText(COUNT);
  const direction = 'What would you like your colour to do?';
  for (let i = 0; i < 12 && !(await page.getByText(direction, { exact: true }).isVisible()); i++) {
    const before = await count.innerText();
    const groups = page.locator('main fieldset');
    const single = (await groups.count()) === 1 && (await groups.first().locator('input[type="radio"]').count()) > 0;
    // One question of single choice goes on at a tap; two questions on one screen, or ticks, wait for Next.
    if (single) {
      await groups.first().locator('label').first().click();
      // A tap that opens a follow-up stays on the question, so the follow-up is answered too.
      await expect.poll(async () => (await count.innerText()) !== before || (await groups.count()) > 1).toBe(true);
      if ((await count.innerText()) === before) await groups.nth(1).locator('label').first().click();
    }
    else {
      for (const group of await groups.all()) await group.locator('label').first().click();
      await button(page, 'Next question').click();
    }
    await expect(count).not.toHaveText(before);
  }
  await expect(page.getByText(direction, { exact: true })).toBeVisible();
  const before = await count.innerText();
  await page.getByText('Cover or blend my grey', { exact: true }).click();
  await expect(count).toHaveText(before);
  const followUp = page.locator('fieldset').nth(1);
  await expect(followUp).toBeVisible();
  await followUp.locator('label').first().click();
  await expect(count).not.toHaveText(before);
});

test('Ideas does not scroll sideways at 320 px (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await toQuestions(page, 'Both', "Women's styles");
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(button(page, 'Try them on')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('colour ideas are short: shared reminders once above, the rest behind More', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await toQuestions(page, 'Colour', "Women's styles");
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page.getByText('Before any colour', { exact: true })).toBeVisible();
  const section = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'Colours', exact: true }) });
  const reminder = await section.getByRole('heading', { name: 'Before any colour' }).locator('xpath=following-sibling::ul[1]/li[1]').innerText();
  const card = section.locator('article').first();
  expect(await card.innerText(), 'the shared reminder is not repeated on the card').not.toContain(reminder);
  await expect(card.getByText('Why', { exact: true })).toBeVisible();
  await expect(card.getByText('What to ask', { exact: true })).toBeHidden();
  await card.locator('summary', { hasText: 'More' }).click();
  await expect(card.getByText('What to ask', { exact: true })).toBeVisible();
});

test('Improve my ideas shows the questions that would change the list first', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await toQuestions(page, 'Both', "Women's styles");
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await button(page, 'Improve my ideas').click();
  const sheet = page.getByRole('dialog', { name: 'Improve my ideas' });
  const first = await sheet.locator('fieldset').count();
  expect(first, 'some questions come first').toBeGreaterThan(0);
  await button(sheet, 'Show all').click();
  await expect.poll(() => sheet.locator('fieldset').count()).toBeGreaterThan(first);
});

test.describe('Try it on on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('Saved is said only once it is stored, and the Board action is quiet until a picture exists', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { releaseWrite?: boolean };
      const realPut = Reflect.get(IDBObjectStore.prototype, 'put') as (this: IDBObjectStore, value: unknown, key?: IDBValidKey) => IDBRequest;
      Reflect.set(IDBObjectStore.prototype, 'put', function hold(this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
        const request = realPut.call(this, value, key);
        // The transaction stays open while requests keep coming, so the write cannot finish until the test releases it.
        const spin = (): void => { if (!w.releaseWrite) this.get('current').onsuccess = spin; };
        spin();
        return request;
      });
    });
    await toQuestions(page, 'Colour', "Women's styles");
    await button(page, 'Skip to my ideas').click();
    await button(page, 'Try them on').click();
    await expect(heading(page)).toHaveText('Try it on');
    // with no picture, See your pictures side by side is not the strongest action on the screen.
    const board = button(page, 'See your pictures side by side');
    await expect(board).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    // The first write started with the first answer and is still held: only once it has succeeded does the screen say saved.
    await expect(page.getByText('Saving', { exact: true })).toBeVisible();
    await expect(page.getByText('Saved on this device', { exact: false })).toHaveCount(0);
    await page.evaluate(() => { (window as unknown as { releaseWrite: boolean }).releaseWrite = true; });
    await expect(page.getByText('Saved on this device until you delete it.')).toBeVisible();
    // One line here, after the step the person came in on; the same control a tap away.
    await button(page, 'Change saving').click();
    await expect(page.getByRole('radio', { name: "Delete and don't save" })).toBeVisible();
    await page.getByRole('tab', { name: 'My pictures', exact: true }).click();
    await page.getByRole('group', { name: /^Picture for / }).first().locator('input[type=file]').setInputFiles(SALON);
    await expect(board).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
});
