/**
 * The question screen: a question set as a heading with real space above its answers at 375 px and on a laptop,
 * and moving between questions: a slide from the side it came from, only opacity and transform, and the reduced-motion version.
 * A double tap never answers a question the person has not seen, and a page change captures the old screen as the old one.
 */
import type { Locator, Page } from '@playwright/test';
import { answersToQuestions, button, go, heading, PHONE } from './failure/support.ts';
import { expect, test } from './guard.ts';
import { APP_URL } from './server.ts';

/** Where the question's own words end: the legend's box also holds the space under it. */
const legendTextBottom = (group: Locator): Promise<number> => group.locator('legend').evaluate((el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().bottom; });

/** The animation the element's style asks for: names and times. */
const motionOf = (element: Locator) => element.evaluate((el) => ({ name: getComputedStyle(el).animationName, duration: getComputedStyle(el).animationDuration }));

/** One animation that really started on the moving question: its name, the properties its keyframes change, and its offset (px) at its first frame. */
interface Started { readonly name: string; readonly properties: readonly string[]; readonly x: number; readonly y: number }
type StartsWindow = Window & { started?: Started[] };

/** From now on, records each animation as it starts on the moving question (a finished one is gone from `getAnimations()`). */
const recordStarts = (page: Page): Promise<void> => page.evaluate(() => {
  const w = window as StartsWindow;
  if (!w.started) {
    document.addEventListener('animationstart', (event) => {
      const el = event.target as Element;
      const animation = el.hasAttribute('data-moved') ? el.getAnimations().find((a) => (a as CSSAnimation).animationName === event.animationName) : undefined;
      if (!animation) return;
      const properties = (animation.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k)).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k));
      // It has just started: held at its first frame for one reading of the element's transform, then played on.
      animation.pause();
      animation.currentTime = 0;
      const first = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      animation.play();
      w.started?.push({ name: event.animationName, properties, x: first.m41, y: first.m42 });
    });
  }
  w.started = [];
});
const started = (page: Page): Promise<Started[]> => page.evaluate(() => (window as StartsWindow).started ?? []);

/** The animations that started: only opacity and transform move, and among them the `name` slide starts on `side` (1 the end, -1 the start), level. */
async function expectSlide(page: Page, name: RegExp, side: 1 | -1): Promise<void> {
  await expect.poll(async () => (await started(page)).map((s) => s.name).join(' '), 'the animations that started on the question').toMatch(name);
  const ran = await started(page);
  expect(ran.flatMap((s) => s.properties).filter((p) => p !== 'opacity' && p !== 'transform'), 'only opacity and transform move').toEqual([]);
  const slide = ran.find((s) => name.test(s.name));
  expect(Math.sign(slide?.x ?? 0), `the slide starts on the side the question comes from (${JSON.stringify(slide)})`).toBe(side);
  expect(slide?.y, 'and moves sideways only').toBe(0);
}

for (const { width, height, h2 } of [{ width: 375, height: 812, h2: 24 }, { width: 1280, height: 800, h2: 30 }]) {
  test.describe(`The questions at ${String(width)} px`, () => {
    test.use({ viewport: { width, height } });

    test('a question reads as a heading, with real space between it and its answers', async ({ page }) => {
      await answersToQuestions(page, 'Cut');
      const group = page.locator('fieldset').first();
      expect(await group.locator('legend').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(h2, 0);
      const first = await group.locator('label').first().boundingBox();
      expect((first?.y ?? 0) - (await legendTextBottom(group)), 'space between the question and its first answer').toBeGreaterThanOrEqual(24);
      const second = await group.locator('label').nth(1).boundingBox();
      if (!first || !second) throw new Error('the first question has fewer than two answers');
      // Side by side or one under the other, the space between two answers is the answers' gap: the design token --space-s.
      const inRow = Math.abs(second.y - first.y) < 1;
      const gap = inRow ? second.x - (first.x + first.width) : second.y - (first.y + first.height);
      const token = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-s')));
      expect(gap, `space between the first two answers (${inRow ? 'in a row' : 'stacked'}) against --space-s`).toBeCloseTo(token, 0);
    });

    test('going on and back asks for the slide from that side with no side scroll; reduced motion just fades', async ({ page }) => {
      await answersToQuestions(page, 'Cut');
      const moved = page.locator('[data-moved]');
      await button(page, 'Next question').click();
      await expect(moved).toHaveAttribute('data-moved', 'forward');
      const forward = await motionOf(moved);
      expect(forward.name).toMatch(/question-fade.*question-from-end/);
      expect(forward.duration).toBe('0.16s, 0.24s');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no side scroll during the slide').toBeLessThanOrEqual(0);
      await button(page, 'Back').click();
      await expect(moved).toHaveAttribute('data-moved', 'back');
      expect((await motionOf(moved)).name).toMatch(/question-from-start/);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await button(page, 'Next question').click();
      await expect(moved).toHaveAttribute('data-moved', 'forward');
      expect((await motionOf(moved)).duration, 'the slide takes no time; the fade stays at 120 ms').toBe('0.12s, 0s');
    });

    test('going back through the steps plays the slide the other way, on the browsers that animate steps', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'The step transition runs only on Chromium browsers');
      await answersToQuestions(page, 'Cut');
      await page.evaluate(() => {
        const w = window as unknown as { changes: (string | undefined)[] };
        w.changes = [];
        new MutationObserver(() => { w.changes.push(document.documentElement.dataset.pageChange); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-page-change'] });
      });
      await button(page, 'Back').click();
      await expect(heading(page)).toHaveText('Your goal');
      await expect.poll(() => page.evaluate(() => (window as unknown as { changes: (string | undefined)[] }).changes)).toContain('step-back');
    });
  });
}

for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
  test(`at ${String(viewport.width)} px the animations that really run on Next and Back: the slide starts on the side the question comes from, sideways only`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await answersToQuestions(page, 'Cut');
    await recordStarts(page);
    await button(page, 'Next question').click();
    await expectSlide(page, /question-from-end/, 1);
    await recordStarts(page);
    await button(page, 'Back').click();
    await expectSlide(page, /question-from-start/, -1);
  });
}

const count = (page: Page): Locator => page.getByText(/^Question \d+ of \d+$/);
const firstAnswer = (page: Page): Locator => page.locator('main fieldset label').first();
const chosen = (page: Page): Locator => page.locator('main fieldset input:checked');
/** Longer than a question takes to arrive, so whatever a stray tap did has happened by now. */
const PAST_ARRIVAL_MS = 600;

/**
 * Goal Both, Women's styles, by Next to question 13: the next one is the dye-reaction question, which is also the last. Nothing answered
 * leaves the hair history unknown, so the henna type and the bleach count are asked too: 14 questions.
 */
async function toQuestionBeforeDye(page: Page): Promise<void> {
  await answersToQuestions(page, 'Both');
  for (let n = 2; n <= 13; n++) {
    await button(page, 'Next question').click();
    await expect(count(page)).toHaveText(`Question ${String(n)} of 14`);
  }
}

/** The dye-reaction question is on screen, the last one, still unanswered and still there once a stray tap would have landed. */
async function expectDyeQuestionUnanswered(page: Page): Promise<void> {
  await expect(count(page)).toHaveText('Question 14 of 14');
  await expect(page.locator('main fieldset legend')).toContainText('Has hair dye');
  await page.waitForTimeout(PAST_ARRIVAL_MS);
  await expect(heading(page)).toHaveText('A few questions');
  await expect(count(page)).toHaveText('Question 14 of 14');
  await expect(chosen(page), 'the question nobody has seen stays unanswered').toHaveCount(0);
}

/** The answer given on the question before stands: one tap of the two went where the person meant. */
async function expectAnswerBeforeKept(page: Page): Promise<void> {
  await button(page, 'Back').click();
  await expect(count(page)).toHaveText('Question 13 of 14');
  await expect(chosen(page)).toHaveCount(1);
}

/** The goal screen of an answers-only session, with Both and Women's styles chosen. */
async function goalChosen(page: Page): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText('Both', { exact: true }).click();
  await page.getByText("Women's styles", { exact: true }).click();
}

/**
 * Every answer of question 13 that goes on at once, double tapped by `press`. Where the second tap lands on the next question depends on
 * the layout (most answers sit over one of its answers at phone width, a few over its words), so one answer proves nothing.
 */
async function doubleTapEveryAnswer(page: Page, press: (tile: Locator) => Promise<void>): Promise<void> {
  await toQuestionBeforeDye(page);
  const tiles = page.locator('main fieldset label');
  const answers = await tiles.count();
  expect(answers).toBeGreaterThan(3);
  for (let i = 0; i < answers; i++) {
    await press(tiles.nth(i));
    await expectDyeQuestionUnanswered(page);
    await expectAnswerBeforeKept(page);
  }
}

// A double tap.

test('a mouse double click answers one question and leaves the dye-reaction question empty, the last question included', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await doubleTapEveryAnswer(page, (tile) => tile.dblclick());
});

test('a double press of Continue lands on an unanswered first question, and a double press of Next moves one question', async ({ page }) => {
  await goalChosen(page);
  await button(page, 'Continue').dblclick();
  await expect(heading(page)).toHaveText('A few questions');
  await page.waitForTimeout(PAST_ARRIVAL_MS);
  await expect(count(page)).toHaveText('Question 1 of 14');
  await expect(chosen(page)).toHaveCount(0);
  await button(page, 'Next question').dblclick();
  await page.waitForTimeout(PAST_ARRIVAL_MS);
  await expect(count(page)).toHaveText('Question 2 of 14');
});

test('a question also ignores presses while it arrives under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await doubleTapEveryAnswer(page, (tile) => tile.dblclick());
});

test('a safety question never goes on by a tap: the answer stands and the person presses on', async ({ page }) => {
  await toQuestionBeforeDye(page);
  await button(page, 'Next question').click();
  await expect(count(page)).toHaveText('Question 14 of 14');
  await expect(page.getByText('Tap an answer to go on')).toHaveCount(0);
  await firstAnswer(page).click();
  await expect(chosen(page)).toHaveCount(1);
  await page.waitForTimeout(PAST_ARRIVAL_MS);
  await expect(heading(page)).toHaveText('A few questions');
  await expect(count(page)).toHaveText('Question 14 of 14');
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your ideas');
});

test.describe('on a phone', () => {
  test.use(PHONE);

  test('two touch taps on one spot answer one question and leave the dye-reaction question empty', async ({ page }) => {
    await doubleTapEveryAnswer(page, async (tile) => {
      await tile.scrollIntoViewIfNeeded();
      await page.waitForTimeout(PAST_ARRIVAL_MS);
      const box = await tile.boundingBox();
      if (!box) throw new Error('the answer is not on the page');
      const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(120);
      await page.touchscreen.tap(x, y);
    });
  });
});

// A page change, read from inside it: the h1 when it starts, when the browser has captured the old screen, and after the update.

interface PageChange { readonly atCall: string; inside: string; after: string; readonly kind: string | undefined; kindAtReady: string | undefined }
type WithChanges = typeof globalThis & { changes: PageChange[] };

/** Records every page transition from the first line of the page; the page change runs only on Chromium browsers. */
async function recordChanges(page: Page, browserName: string): Promise<void> {
  test.skip(browserName !== 'chromium', 'The page change runs only on Chromium browsers');
  await page.addInitScript(() => {
    const scope = window as unknown as WithChanges;
    scope.changes = [];
    const h1 = (): string => document.querySelector('h1')?.textContent ?? '';
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update: () => unknown) => {
      const change: PageChange = { atCall: h1(), inside: '', after: '', kind: document.documentElement.dataset.pageChange, kindAtReady: undefined };
      scope.changes.push(change);
      const transition = start(async () => {
        change.inside = h1();
        await update();
        change.after = h1();
      });
      void transition.ready.then(() => { change.kindAtReady = document.documentElement.dataset.pageChange; }, () => undefined);
      return transition;
    }) as typeof document.startViewTransition;
  });
}

const changes = (page: Page): Promise<PageChange[]> => page.evaluate(() => (window as unknown as WithChanges).changes);

/** The newest change has run its update: what it read is on record, and it was the only one since the step before. */
async function expectChange(page: Page, kind: string, [atCall, inside, after]: readonly [string, string, string], total: number): Promise<void> {
  await expect.poll(async () => (await changes(page)).at(-1)?.after).toBe(after);
  const all = await changes(page);
  expect(all.at(-1)).toMatchObject({ kind, atCall, inside, after });
  expect(all, 'one transition per step').toHaveLength(total);
}

test('going on captures the old screen as the old one in one transition, and Back stays right', async ({ page, browserName }) => {
  await recordChanges(page, browserName);
  await goalChosen(page);
  // Opening with `?source=answers` tidies the URL with a change of its own, before this test's first step.
  const before = (await changes(page)).length;
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
  await expectChange(page, 'step', ['Your goal', 'Your goal', 'A few questions'], before + 1);
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expectChange(page, 'step', ['A few questions', 'A few questions', 'Your ideas'], before + 2);
  await button(page, 'Try them on').click();
  await expect(heading(page)).toHaveText('Try it on');
  await expectChange(page, 'step', ['Your ideas', 'Your ideas', 'Try it on'], before + 3);
  await button(page, 'Back').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await expectChange(page, 'step-back', ['Try it on', 'Try it on', 'Your ideas'], before + 4);
  await expect(page).toHaveURL(/#\/my-look\/ideas$/);
});

test('a second quick change keeps its transition style until it is ready', async ({ page, browserName }) => {
  await recordChanges(page, browserName);
  await page.goto(`${APP_URL}#/help`);
  await expect(heading(page)).toBeVisible();
  await go(page, '#/saved');
  await page.waitForFunction(() => (window as unknown as WithChanges).changes.length === 1);
  await go(page, '#/explore');
  await expect.poll(async () => (await changes(page)).length).toBe(2);
  await expect.poll(async () => (await changes(page)).at(-1)?.kindAtReady).toBe('place');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.pageChange)).toBeUndefined();
});
