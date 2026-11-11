/**
 * Ideas e2e, on the fixture content built in beforeAll into this suite's own folder (server.ts), at
 * 375 and 1280 px, under the CSP. Answers only (Chromium, WebKit): count, Try together, Uncertain answered in place, the referral
 * (no colour idea left, said once, the pair's colour replaced), reorder and remove, the stylist sheet, the AI pick action, all by keyboard; a fictional
 * photo in Chromium.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { fixtureServer } from './server.ts';
import { shotsDir } from './shots.ts';

const { APP_URL, PREVIEW_OUTDIR } = fixtureServer('ideas');
const app = resolve(import.meta.dirname, '..', '..');
const PHOTO = join(app, 'tests', 'fixtures', 'faces', 'one-face-salon-straight-wavy.jpg');
const VIEWPORTS = [{ width: 375, height: 812 }, { width: 1280, height: 900 }] as const;
const MAX_TABS = 250;
/** First visit: the core tools come from the preview server, then one analysis (as in mylook-a.spec.ts). */
const ANALYSIS_TIMEOUT_MS = 180_000;
const HISTORY_Q = 'What has your hair had in the last 2 to 3 years?';
const DYE_Q = 'Has hair dye or a black henna tattoo ever made your skin react? And is your scalp sore now?';
const REFERRAL = 'If you reacted to hair dye or black henna before, please ask a doctor or allergy clinic before colouring.';
const HEALTH = 'If you are pregnant, breastfeeding or having medical treatment, tell your colourist first.';
const MEDIAPIPE_INFO = 'INFO: Created TensorFlow Lite XNNPACK delegate for CPU.';
const AI_PICK = 'Let ChatGPT or Gemini pick your best 3';
const AI_PICK_HINT = 'Copy the prompt, then paste it into ChatGPT or Gemini with your photo.';

let work = '';
test.beforeAll(async () => {
  test.setTimeout(300_000);
  work = mkdtempSync(join(tmpdir(), 'huecut-ideas-'));
  execFileSync(process.execPath, [join(app, 'tests', 'e2e', 'explore-build.ts'), work, PREVIEW_OUTDIR], { cwd: app, encoding: 'utf8' });
  // The preview must serve this very build, or every check below would test something else.
  expect(await (await fetch(`${APP_URL}index.html`)).text(), `the preview serves ${PREVIEW_OUTDIR}`).toBe(readFileSync(join(app, PREVIEW_OUTDIR, 'index.html'), 'utf8'));
});
test.afterAll(() => { if (work) rmSync(work, { recursive: true, force: true }); });

const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
const section = (page: Page, name: 'Cuts' | 'Colours'): Locator => page.locator('section', { has: page.getByRole('heading', { level: 2, name, exact: true }) });
const cards = (page: Page, name: 'Cuts' | 'Colours'): Locator => section(page, name).locator('article');
const names = (list: Locator): Promise<string[]> => list.locator('h3').allTextContents();
const card = (page: Page, name: string): Locator => page.locator('article', { has: page.getByRole('heading', { level: 3, name, exact: true }) });
const isFocused = (target: Locator): Promise<boolean> => target.evaluate((el) => el === document.activeElement);
/** Every animation has played but a wait's endless line, which ends only with its wait. */
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));

async function axe(page: Page, where: string): Promise<void> {
  // At the end of the page the phone's action bar rests below the content, so axe's target size counts no control as under it
  // (as real-content-support.ts does): WebKit left Move earlier and Move later under the bar here (measured, 17 px showing).
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  await settled(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${where}`).toEqual([]);
}

async function shot(page: Page, name: string, width: number): Promise<void> {
  await settled(page);
  await page.screenshot({ path: join(shotsDir('ideas'), `${name}-${String(width)}.png`), fullPage: true });
  noteScreenshot();
}

/** Presses Tab until `target` has focus: the keyboard path a person takes, never a click. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}

const press = (page: Page, target: Locator) => tabTo(page, target).then(() => page.keyboard.press('Enter'));

/** Chooses an option as a keyboard user does: Tab into its radio group and arrow to it, or Tab to a checkbox; Space. `stays`: false when the answer takes the option's own card away. */
async function choose(page: Page, option: Locator, stays = true): Promise<void> {
  if ((await option.getAttribute('type')) === 'radio') {
    const group = page.locator(`input[type="radio"][name="${(await option.getAttribute('name')) ?? ''}"]`);
    for (let i = 0; i < MAX_TABS && !(await group.evaluateAll((els) => els.some((el) => el === document.activeElement))); i++) await page.keyboard.press('Tab');
    // An arrow key checks the radio it lands on, so an answer that takes the card away ends the walk with the option gone (null).
    const focused = (): Promise<boolean | null> => option.evaluate((el) => el === document.activeElement, undefined, { timeout: 2_000 }).catch(() => null);
    for (let i = 0; i < MAX_TABS && (await focused()) === false; i++) await page.keyboard.press('ArrowDown');
  } else {
    await tabTo(page, option);
  }
  if (!(await option.isChecked({ timeout: 2_000 }).catch(() => true))) await page.keyboard.press('Space');
  if (stays) await expect(option).toBeChecked();
}

/** Goal and collection by keyboard, then "Skip to my ideas" on the questions. */
async function toIdeas(page: Page, goal: 'Both' | 'Colour', show: 'All' | "Women's styles"): Promise<void> {
  await expect(heading(page)).toHaveText('Your goal');
  await choose(page, page.getByRole('radio', { name: goal, exact: true }));
  await choose(page, page.getByRole('radio', { name: show, exact: true }));
  await press(page, page.getByRole('button', { name: 'Continue', exact: true }));
  await expect(heading(page)).toHaveText('A few questions');
  await press(page, page.getByRole('button', { name: 'Skip to my ideas' }));
  await expect(heading(page)).toHaveText('Your ideas');
  await expect(page).toHaveURL(/#\/my-look\/ideas$/);
}

// ── The answers-only path ──

/** Under Both the count is the total, and half of it rounded up are cuts. */
async function countByKeyboard(page: Page): Promise<void> {
  const shown = async () => `${await page.locator('output').innerText()}: ${String(await cards(page, 'Cuts').count())} + ${String(await cards(page, 'Colours').count())}`;
  await expect.poll(shown).toBe('4: 2 + 2');
  await press(page, page.getByRole('button', { name: 'Fewer ideas' }));
  await expect.poll(shown).toBe('3: 2 + 1');
  await press(page, page.getByRole('button', { name: 'More ideas' }));
  await expect.poll(shown).toBe('4: 2 + 2');
}

/** "Uncertain. Answer ‘…’ to narrow it down" opens the question in place; the answers turn the label, then the referral takes every colour idea away. */
async function answerInPlace(page: Page, width: number): Promise<void> {
  const [look = ''] = await names(cards(page, 'Colours'));
  const one = card(page, look);
  await expect(one.getByText('Uncertain', { exact: true })).toBeVisible();
  await press(page, one.locator('summary', { hasText: 'More' }));
  await expect(one.getByText(HEALTH, { exact: false })).toBeVisible();
  await press(page, one.getByRole('button', { name: `Answer ‘${HISTORY_Q}’ to narrow it down` }));
  await expect(one.getByRole('group', { name: HISTORY_Q })).toBeVisible();
  await choose(page, one.getByRole('checkbox', { name: 'Nothing' }));
  await press(page, one.getByRole('button', { name: 'Done' }));
  await expect(one.getByRole('group', { name: HISTORY_Q })).toHaveCount(0);
  await expect(one.getByText('Uncertain', { exact: true })).toBeVisible();
  await press(page, one.getByRole('button', { name: `Answer ‘${DYE_Q}’ to narrow it down` }));
  await choose(page, one.getByRole('radio', { name: 'No reaction, and my scalp is fine' }));
  // The lift needs the natural colour, still unanswered here, so the look stays Uncertain: never Plausible on a guess.
  await expect(one.getByText('Uncertain', { exact: true })).toBeVisible();
  await expect(one.getByText('Plausible', { exact: true })).toHaveCount(0);
  await shot(page, 'answered-in-place', width);
  await axe(page, 'Ideas, a question open in place');
  // The same open question: a past reaction is a referral, so no colour idea is suggested and its reason is said once; focus,
  // inside the card that went, moves to the screen's heading, and the colour choice offers to keep the person's own colour. The pair
  // the person made stays, its colour replaced by the referral.
  await choose(page, one.getByRole('radio', { name: 'Yes, a mild reaction' }), false);
  await expect(cards(page, 'Colours')).toHaveCount(0);
  await expect(page.getByRole('listitem').filter({ hasText: REFERRAL }), 'said once, in the short-list line').toHaveCount(1);
  await expect(heading(page)).toBeFocused();
  await expect(page.getByText('So your ideas stay in your own colour.', { exact: true })).toBeVisible();
  await expect(page.getByText('Colour: Best done by a colourist')).toBeVisible();
  await shot(page, 'referral', width);
}

async function reorderAndRemove(page: Page): Promise<string> {
  const [first = '', second = ''] = await names(cards(page, 'Cuts'));
  const later = card(page, first).getByRole('button', { name: 'Move later' });
  await press(page, later);
  await expect.poll(() => names(cards(page, 'Cuts'))).toEqual([second, first]);
  expect(await isFocused(later), 'focus stays on Move later').toBe(true);
  await expect(page.getByRole('status').filter({ hasText: `${first} moved to 2 of 2.` })).toHaveCount(1);
  // The next pick takes a removed idea's place, so the count holds; focus goes to the idea now in its place.
  await press(page, card(page, second).getByRole('button', { name: 'Remove', exact: true }));
  await expect.poll(async () => (await names(cards(page, 'Cuts'))).map((n) => (n === first || n === second ? n : 'next'))).toEqual([first, 'next']);
  expect(await isFocused(card(page, first).getByRole('heading', { level: 3 })), 'focus on the idea now first').toBe(true);
  const [, next = ''] = await names(cards(page, 'Cuts'));
  await press(page, card(page, next).getByRole('button', { name: 'Remove', exact: true }));
  await expect.poll(() => names(cards(page, 'Cuts'))).toEqual([first]);
  await expect(page.getByText('We found 1 that suits your hair and limits.')).toBeVisible();
  await expect(page.getByText('You removed 2 ideas.')).toBeVisible();
  return first;
}

async function stylistSheet(page: Page, cut: string, chromium: boolean): Promise<void> {
  const open = card(page, cut).getByRole('button', { name: 'Show your stylist' });
  await press(page, open);
  const dialog = page.getByRole('dialog', { name: cut });
  await expect(dialog.getByText('Lengths', { exact: true })).toBeVisible();
  await axe(page, 'Show your stylist');
  await press(page, dialog.getByRole('button', { name: 'Copy as text' }));
  if (chromium) {
    await expect(dialog.getByRole('button', { name: 'Sheet copied' })).toBeVisible();
    // The Windows clipboard hands the text back with CRLF line ends.
    const copied = (await page.evaluate(() => navigator.clipboard.readText())).split(/\r?\n/);
    expect(copied[0], 'the copied sheet starts with its title').toBe(cut);
    expect(copied.at(-1)).toContain('Huecut');
  } else {
    await expect(dialog.getByText(/^(Stylist sheet copied as text\.|This browser did not allow copying\. Use Save as image instead\.)$/)).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await isFocused(open), 'focus back on Show your stylist').toBe(true);
}

/** The action in the open, with its one line of what to do; here one cut is left, so it asks for one. */
async function aiPick(page: Page, cut: string, chromium: boolean): Promise<void> {
  await expect(page.getByText(AI_PICK_HINT, { exact: true })).toBeVisible();
  await press(page, page.getByRole('button', { name: 'Let ChatGPT or Gemini pick your best one' }));
  if (!chromium) return expect(page.getByText(/^(Prompt copied\. Now open ChatGPT or Gemini, add your photo and paste it\.|This browser did not allow copying\..*)$/)).toBeVisible();
  await expect(page.getByText('Prompt copied. Now open ChatGPT or Gemini, add your photo and paste it.')).toBeVisible();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain(cut);
  expect(prompt).toContain('Pick the 1 that');
  // After the referral no colour look is a candidate.
  for (const look of await names(cards(page, 'Colours'))) expect(prompt).not.toContain(look);
}

/** Pairs the first cut with the second colour; the pair stays for the referral that follows. */
async function tryTogether(page: Page, width: number): Promise<string> {
  const [cut = ''] = await names(cards(page, 'Cuts'));
  const [, colour = ''] = await names(cards(page, 'Colours'));
  await press(page, page.getByRole('button', { name: 'Pair a cut with a colour' }));
  const sheet = page.getByRole('dialog', { name: 'Pair a cut with a colour' });
  await choose(page, sheet.getByRole('radio', { name: colour }));
  await press(page, sheet.getByRole('button', { name: 'Try these together' }));
  await expect(sheet).toBeHidden();
  const title = `Together: ${cut}, with ${colour}`;
  const pair = page.locator('section', { has: page.getByRole('heading', { level: 2, name: title }) });
  await expect(pair).toBeVisible();
  // The picker hands focus back to Change.
  await expect.poll(() => isFocused(pair.getByRole('button', { name: 'Change' }))).toBe(true);
  await shot(page, 'pair', width);
  await axe(page, 'Ideas with a pair');
  return title;
}

/** The pair made before the referral is removed; with no colour left to pair, focus goes to the screen's heading. */
async function removePair(page: Page, title: string): Promise<void> {
  const pair = page.locator('section', { has: page.getByRole('heading', { level: 2, name: title }) });
  await press(page, pair.getByRole('button', { name: 'Remove', exact: true }));
  await expect(page.getByRole('heading', { level: 2, name: title })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pair a cut with a colour' })).toHaveCount(0);
  await expect.poll(() => isFocused(heading(page))).toBe(true);
}

for (const viewport of VIEWPORTS) {
  test(`Ideas from answers only at ${String(viewport.width)} px`, async ({ page, context, browserName }) => {
    const chromium = browserName === 'chromium';
    if (chromium) await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize(viewport);
    await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
    await toIdeas(page, 'Both', 'All');
    await expect(page.getByRole('link', { name: 'Add a photo', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: AI_PICK })).toBeVisible();
    await expect(page.locator('details', { has: page.getByRole('button', { name: AI_PICK }) }), 'not inside a menu').toHaveCount(0);
    await shot(page, 'ideas', viewport.width);
    await axe(page, 'Ideas');
    await countByKeyboard(page);
    const pair = await tryTogether(page, viewport.width);
    await answerInPlace(page, viewport.width);
    await removePair(page, pair);
    const cut = await reorderAndRemove(page);
    await stylistSheet(page, cut, chromium);
    await aiPick(page, cut, chromium);
    await axe(page, 'Ideas at the end');
  });
}

test('a refused copy leaves the AI pick prompt selected in a box', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'one browser is enough for the refused path');
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('refused')) } }); });
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await toIdeas(page, 'Both', 'All');
  await press(page, page.getByRole('button', { name: AI_PICK }));
  await expect(page.getByText(/^This browser did not allow copying\./)).toBeVisible();
  const box = page.getByRole('textbox', { name: 'The prompt' });
  await expect(box).toBeFocused();
  const [cut = ''] = await names(cards(page, 'Cuts'));
  expect(await box.inputValue()).toContain(cut);
  expect(await box.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd)), 'the whole prompt is selected').toBe(await box.inputValue());
  await axe(page, 'Ideas with the prompt in a box');
});

test('after a dye reaction under the Colour goal no look is listed: the referral is said once and the AI pick action is not offered', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the rule is the same in every browser');
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await toIdeas(page, 'Colour', 'All');
  const pick = page.getByRole('button', { name: 'Let ChatGPT or Gemini pick your best 2' });
  await expect(pick, 'the fixture has two colour looks, so it asks for two').toBeVisible();
  const [look = ''] = await names(cards(page, 'Colours'));
  const one = card(page, look);
  await press(page, one.locator('summary', { hasText: 'More' }));
  await press(page, one.getByRole('button', { name: `Answer ‘${DYE_Q}’ to narrow it down` }));
  await choose(page, one.getByRole('radio', { name: 'Yes, a mild reaction' }), false);
  await expect(cards(page, 'Colours')).toHaveCount(0);
  await expect(page.getByText(REFERRAL)).toHaveCount(1);
  await expect(pick).toHaveCount(0);
  // The referral explains the empty list: nothing invites a change to the answer that protects the person.
  await expect(page.getByText(/change an answer/)).toHaveCount(0);
});

// ── A fictional photo (Chromium: MediaPipe needs OffscreenCanvas, which Playwright WebKit on Windows lacks) ──

for (const viewport of VIEWPORTS) {
  test(`Ideas with a photo at ${String(viewport.width)} px`, async ({ page, guard }) => {
    await requires(page, 'workerWebGL');
    test.setTimeout(300_000);
    await page.setViewportSize(viewport);
    await page.goto(`${APP_URL}#/my-look/photo`);
    await page.locator('input[type=file]').first().setInputFiles(PHOTO);
    await expect(page.getByRole('radio', { name: 'Photo 1' })).toBeChecked();
    await press(page, page.getByRole('button', { name: 'Continue', exact: true }));
    await expect(heading(page)).toHaveText('Your face card');
    await press(page, page.getByRole('button', { name: 'Choose what to change' }));
    // The heading's text comes first and the URL change, its remount and the focus move a moment later: the keys wait for those.
    await expect(heading(page)).toHaveText('Your goal');
    await expect(heading(page)).toBeFocused();
    await toIdeas(page, 'Colour', "Women's styles");
    await expect(page.getByRole('link', { name: 'Add a photo', exact: true })).toHaveCount(0);
    // "See it on me" appears on each colour idea once the main photo's hair outline is ready.
    const see = cards(page, 'Colours').first().getByRole('button', { name: 'See it on me' });
    await expect(see).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
    const preview = page.getByRole('dialog', { name: 'See it on me' });
    await press(page, see).then(() => expect(preview).toBeVisible());
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await press(page, page.getByRole('button', { name: 'Improve my ideas' }));
    const improve = page.getByRole('dialog', { name: 'Improve my ideas' });
    await choose(page, improve.getByRole('radio', { name: 'Straight', exact: true }));
    await axe(page, 'Improve my ideas');
    await page.keyboard.press('Escape');
    await tabTo(page, page.getByRole('link', { name: 'See my face card' }));
    await shot(page, 'photo-ideas', viewport.width);
    await axe(page, 'Ideas with a photo');
    // MediaPipe logs this info line at error level once per core task (face, hair, hand, pose); the guard accepts it.
    expect(guard.errors.filter((e) => e === MEDIAPIPE_INFO).length, 'one info line per core task at most').toBeLessThanOrEqual(4);
    guard.errors.splice(0, guard.errors.length, ...guard.errors.filter((e) => e !== MEDIAPIPE_INFO));
  });
}
