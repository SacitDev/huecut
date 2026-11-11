/**
 * The shipped content end to end (the "Try together" refusals once hid because tests ran on samples): a kept session of real looks
 * through Ideas, Try it on and Board on the production build. It asserts the prompts' words and the saved pictures' pixels, never just that a button exists.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { asItemId } from '../../src/domain/ids.ts';
import { EN } from '../../src/domain/render-model/copy.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { addPhotos, button, expectAnalysed, FACE, needsAnalysis, openPhoto, OTHER_FACE } from './failure/support.ts';
import { axeClean, backToIdeas, CUTS, downloaded, expectCleanExport, expectSheetPictures, heading, longestSpec, LOOKS, open, PICTURES, prefs, promptsOn, say, settled, sheetOf, storedPlace, tab, toTryOn, words } from './real-content-support.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const KEEP_COLOUR = 'Keep my hair colour exactly as it is.';
const DYE_ANSWER = { 'dye-reaction': { chosen: [2] } };
const PHONE = { viewport: { width: 375, height: 812 }, screen: { width: 375, height: 812 }, isMobile: true, hasTouch: true };
const section = (page: Page, name: string): Locator => page.locator('section', { has: page.getByRole('heading', { level: 2, name, exact: true }) });

test('a long "Try together" pair builds: both specs in full (the colour on their own colour), within 300 words and over the old 150', async ({ page }) => {
  const [cut, colour] = [longestSpec(CUTS), longestSpec(LOOKS)];
  const ids = [asItemId(cut.id), asItemId(colour.id)];
  await open(page, { prefs: { goal: 'both', collections: ['salon', 'barbering'], count: 2 }, shortlist: { added: ids, removed: [], order: ids }, pair: { cut: asItemId(cut.id), colour: asItemId(colour.id) } });
  await expect(page.getByRole('heading', { level: 2, name: `Together: ${cut.name}, with ${colour.name}` })).toBeVisible();
  await toTryOn(page);
  await tab(page, 'One by one');
  const pair = page.locator('section').filter({ has: page.getByRole('heading', { level: 3, name: `Together: ${cut.name}, with ${colour.name}`, exact: true }) }).last();
  const prompt = await pair.locator('textarea').inputValue();
  // A look that keeps the person's own colour gives it where its words name the colour it was pictured on; no level is answered here.
  const pictured = colour.base?.on_words ?? [];
  expect(prompt).toContain(cut.prompt_spec);
  expect(prompt).toContain(pictured.reduce((spec, w) => spec.split(w).join(EN.prompts.ownBase(null)), colour.prompt_spec));
  for (const w of pictured) expect(prompt).not.toContain(w);
  expect(words(prompt)).toBeGreaterThan(150);
  expect(words(prompt)).toBeLessThanOrEqual(300);
  expect(prompt).not.toContain(KEEP_COLOUR);
});

test('Pick colours: each cut carries a colour with its label, no keep sentence; the colour looks stay', async ({ page }) => {
  await open(page, { prefs: prefs('both', 4) });
  await expect(page.getByRole('radio', { name: 'Pick colours for me' })).toBeChecked();
  await expect(section(page, 'Colours').locator('article')).toHaveCount(2);
  const cuts = section(page, 'Cuts').locator('article');
  await expect(cuts).toHaveCount(2);
  // The colour goes into the prompt and the card; the library picture keeps its model's own colour.
  await expect(cuts.first()).toContainText(/In the prompt and the card: .+ \((Plausible|Uncertain|Best done by a colourist)\)\. The picture keeps the model's own colour\./);
  await toTryOn(page);
  await tab(page, 'One by one');
  const picked = await promptsOn(page);
  expect(picked.filter((p) => p.includes('The haircut:') && p.includes('The colour:')), 'each cut carries its colour').toHaveLength(2);
  expect(picked.some((p) => p.includes(KEEP_COLOUR))).toBe(false);
});

test('Keep my colour: only cuts, and every cut prompt, grid and card keeps the colour', async ({ page }) => {
  await open(page, { prefs: prefs('both', 4) });
  await say(page, 'Keep my colour');
  await expect(section(page, 'Colours'), 'Keep shows no colour ideas').toHaveCount(0);
  await expect(section(page, 'Cuts').locator('article'), 'the count stays the count, all cuts').toHaveCount(4);
  await toTryOn(page);
  await tab(page, 'One by one');
  const kept = await promptsOn(page);
  expect(kept).toHaveLength(4);
  for (const p of kept) {
    expect(p).toContain(KEEP_COLOUR);
    expect(p).not.toContain('The colour:');
  }
  await tab(page, 'All together');
  const [card = ''] = await promptsOn(page);
  expect(card).toContain(KEEP_COLOUR);
  expect(card).toContain('never its face or hair colour');
  await tab(page, 'My pictures');
  for (const p of await promptsOn(page)) expect(p).toContain(KEEP_COLOUR);
});

test('One colour for all: every cut in that colour, on the card too, and the machine remembers the choice', async ({ page }) => {
  await open(page, { prefs: prefs('both', 4) });
  await say(page, 'One colour for all');
  await expect(page.getByRole('combobox', { name: 'Which colour?' }).locator('option'), 'the 14 all-over shades').toHaveCount(14);
  await page.getByRole('combobox', { name: 'Which colour?' }).selectOption({ label: 'Auburn all over' });
  await expect(section(page, 'Colours')).toHaveCount(0);
  await expect(section(page, 'Cuts').locator('article').first()).toContainText('In the prompt and the card: Auburn all over (');
  await toTryOn(page);
  await tab(page, 'One by one');
  const one = await promptsOn(page);
  expect(one).toHaveLength(4);
  for (const p of one) {
    expect(p).toContain('The colour: Auburn all over, that is');
    expect(p).not.toContain(KEEP_COLOUR);
  }
  await tab(page, 'All together');
  const [card = ''] = await promptsOn(page);
  expect(card.match(/ in Auburn all over\./g)).toHaveLength(4);
  await backToIdeas(page);
  await expect(page.getByRole('radio', { name: 'One colour for all' })).toBeChecked();
});

test('after a dye reaction no colour idea, colour-bearing prompt or reference exists, and Keep still works', async ({ page }) => {
  await open(page, { prefs: prefs('both', 4), answers: DYE_ANSWER });
  await expect(page.getByText('So your ideas stay in your own colour.', { exact: true }), 'the screen says so and offers Keep').toBeVisible();
  // The referral leaves no colour idea to show; it is said instead.
  const colourNames = LOOKS.map((l) => l.name);
  await expect(section(page, 'Colours').locator('article')).toHaveCount(0);
  await toTryOn(page);
  const free = (prompts: readonly string[]) => {
    for (const p of prompts) {
      expect(p).not.toContain('The colour:');
      for (const name of colourNames) expect(p).not.toContain(name);
    }
  };
  const [card = ''] = await promptsOn(page);
  expect(card).toContain(KEEP_COLOUR);
  free(await promptsOn(page));
  const sheet = await sheetOf(page);
  if (sheet) await expectCleanExport(sheet);
  await tab(page, 'One by one');
  free(await promptsOn(page));
  // Once, above the tabs: there is no colour look to repeat it on.
  await expect(page.getByText('Best done by a colourist', { exact: true })).toHaveCount(1);
  await tab(page, 'My pictures');
  free(await promptsOn(page));
  await page.getByRole('button', { name: 'Keep my colour' }).click();
  await expect(page.getByText('So your ideas stay in your own colour.', { exact: true }), 'Keep is a real choice').toHaveCount(0);
  await tab(page, 'One by one');
  await expect(page.getByText('Best done by a colourist', { exact: true })).toHaveCount(0);
  const kept = await promptsOn(page);
  expect(kept).toHaveLength(4);
  for (const p of kept) expect(p).toContain(KEEP_COLOUR);
});

test('the card prompt and its numbered sheet exist for 6 ideas, and split into 3 and 3 at the person\'s choice', async ({ page }) => {
  await open(page, { prefs: prefs('cut', 6) });
  const names = await section(page, 'Cuts').locator('article h3').allTextContents();
  expect(names).toHaveLength(6);
  await toTryOn(page);
  await expect(page.getByRole('tab', { name: 'All together' }), 'the card comes first').toHaveAttribute('aria-selected', 'true');
  // Level 2 under the screen's own heading.
  await expect(page.getByRole('heading', { level: 2, name: 'Your card' })).toBeVisible();
  await expect(page.getByText('Grid 1')).toHaveCount(0);
  await expect(page.getByText(/^These are AI pictures, illustrations of the looks\. /)).toBeVisible();
  const [prompt = ''] = await promptsOn(page);
  names.forEach((name, i) => { expect(prompt).toContain(`${String(i + 1)}. ${name}`); });
  expect(prompt).toContain('exactly 6 tiles, 2 across and 3 down');
  expect(words(prompt)).toBeLessThanOrEqual(250);
  await expect(page.locator('ol li img')).toHaveCount(6);
  const sheet = await sheetOf(page);
  if (sheet) {
    await expectCleanExport(sheet);
    writeFileSync(join(shotsDir('real-content'), 'reference-sheet.jpg'), sheet);
    await expectSheetPictures(sheet, await page.locator('ol li img').evaluateAll((els) => els.map((e) => /library\/(.+)-\d+\.avif/.exec((e as HTMLImageElement).src)?.[1] ?? '')));
  }
  await say(page, '3 and 3');
  await expect(page.getByRole('heading', { level: 2, name: 'Picture 2 of 2' })).toBeVisible();
  await expect(page.getByRole('radio', { name: '3 and 3' })).toBeChecked();
  const three = await promptsOn(page);
  expect(three).toHaveLength(2);
  expect(three[0]).toContain('exactly 3 tiles, 1 across and 3 down');
  expect(three[1]).toContain(`1. ${names[3] ?? ''}`);
});

test('a real saved Board of 6; the tab stays through Back and a reload; the tabs by keyboard', async ({ page }) => {
  await open(page, { prefs: prefs('cut', 6) });
  await toTryOn(page);
  await tab(page, 'My pictures');
  const boxes = page.locator('input[type=file]');
  for (const [i, picture] of PICTURES.entries()) await boxes.nth(i).setInputFiles(picture);
  await expect(page.getByRole('img', { name: /^Your AI picture for / })).toHaveCount(6);
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  await expect(heading(page)).toHaveText('Board');
  const saved = await downloaded(page, () => page.getByRole('button', { name: 'Save board' }).click());
  await expectCleanExport(saved.bytes);
  writeFileSync(join(shotsDir('real-content'), 'board-6.jpg'), saved.bytes);
  await page.goBack();
  await expect(heading(page)).toHaveText('Try it on');
  await expect(page.getByRole('tab', { name: 'My pictures' }), 'the machine remembers the tab').toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => storedPlace(page), { timeout: 15_000 }).toBe('try-on/pictures');
  await page.reload();
  await expect(heading(page)).toHaveText('Try it on');
  await expect(page.getByRole('tab', { name: 'My pictures' }), 'and the kept session too').toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'My pictures' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Tips' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Tips' })).toContainText('Start a new chat for each look.');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'All together' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'One by one' })).toHaveAttribute('tabindex', '-1');
});

test('8 ideas make two cards, each with its own prompt and sheet', async ({ page }) => {
  await open(page, { prefs: prefs('cut', 8) });
  await toTryOn(page);
  for (const title of ['Picture 1 of 2', 'Picture 2 of 2']) await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  const prompts = await promptsOn(page);
  expect(prompts).toHaveLength(2);
  for (const p of prompts) expect(p).toContain('exactly 4 tiles, 2 across and 2 down');
  for (const title of ['Picture 1 of 2', 'Picture 2 of 2']) {
    const sheet = await sheetOf(page, page.locator('section').filter({ has: page.getByRole('heading', { level: 2, name: title }) }).last());
    if (sheet) await expectCleanExport(sheet);
  }
});

test('every usable photo goes with the card, main photo first, each without EXIF', async ({ page }) => {
  await needsAnalysis(page);
  await openPhoto(page);
  await addPhotos(page, [FACE, OTHER_FACE]);
  for (const f of [FACE, OTHER_FACE]) await expectAnalysed(page, f.split(/[\\/]/).at(-1) ?? '');
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  await button(page, 'Choose what to change').click();
  await say(page, 'Cut');
  await say(page, "Women's styles");
  await button(page, 'Continue').click();
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await toTryOn(page);
  const press = page.getByRole('button', { name: 'Download my photos' });
  await expect(press).not.toHaveAttribute('aria-busy', 'true', { timeout: 60_000 });
  const saved: { name: string; path: Promise<string> }[] = [];
  const both = new Promise<void>((done) => { page.on('download', (d) => { saved.push({ name: d.suggestedFilename(), path: d.path() }); if (saved.length === 2) done(); }); });
  await press.click();
  await both;
  expect(saved.map((s) => s.name)).toEqual(['huecut-photo.jpg', 'huecut-photo-2.jpg']);
  for (const s of saved) expect(Buffer.from(readFileSync(await s.path)).includes(Buffer.from('Exif\0\0'))).toBe(false);
});

test.describe('phone', () => {
  test.use(PHONE);
  test('Share photos and reference sheet hands over both files, and saves them where there is no share sheet', async ({ page }) => {
    // The sheet is painted from the library's AVIF pictures.
    await requires(page, 'avif');
    await page.addInitScript(() => {
      const w = window as unknown as { shared: string[] };
      w.shared = [];
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d: ShareData) => (d.files?.length ?? 0) > 0 });
      Object.defineProperty(navigator, 'share', { configurable: true, value: (d: ShareData) => { for (const f of d.files ?? []) w.shared.push(`${f.name}|${f.type}`); return Promise.resolve(); } });
    });
    await open(page, { prefs: prefs('cut', 6) });
    await toTryOn(page);
    const share = page.getByRole('button', { name: '2 Share photos and reference sheet' });
    await expect(share).not.toHaveAttribute('aria-busy', 'true', { timeout: 60_000 });
    await share.click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { shared: string[] }).shared.length)).toBe(2);
    const files = await page.evaluate(() => (window as unknown as { shared: string[] }).shared);
    expect(files[0]).toBe('huecut-photo.jpg|image/jpeg');
    expect(files[1]).toMatch(/^huecut-reference-sheet-\d{4}-\d{2}-\d{2}\.jpg\|image\/jpeg$/);
    await page.evaluate(() => { Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined }); });
    const names: string[] = [];
    const twoSaved = new Promise<void>((done) => { page.on('download', (d) => { names.push(d.suggestedFilename()); if (names.length === 2) done(); }); });
    await share.click();
    await twoSaved;
    expect(names[0]).toBe('huecut-photo.jpg');
    expect(names[1]).toMatch(/^huecut-reference-sheet-/);
    await expect(page.getByText('Your files are in your downloads. Attach them in ChatGPT or Gemini.')).toBeAttached();
  });
});

for (const { label, size } of [{ label: '375', size: { width: 375, height: 812 } }, { label: 'laptop', size: { width: 1280, height: 800 } }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${label} ${colorScheme}`, () => {
      test.use({ viewport: size, colorScheme, ...(label === '375' ? { isMobile: true, hasTouch: true, screen: size } : {}) });
      test('every tab: no side scroll, axe clean, and the screenshots to judge by eye', async ({ page }) => {
        await open(page, { prefs: prefs('both', 6) });
        await settled(page);
        await page.screenshot({ path: join(shotsDir('real-content'), `ideas-${label}-${colorScheme}.png`), fullPage: true });
        noteScreenshot();
        await toTryOn(page);
        for (const [name, file] of [['All together', 'together'], ['One by one', 'single'], ['My pictures', 'pictures'], ['Tips', 'tips']] as const) {
          await tab(page, name);
          await expect(page.getByRole('tabpanel')).toBeVisible();
          await settled(page);
          // decode() of a lazy picture far below the fold can wait for ever in WebKit: a screenshot does not need that one.
          await page.locator('img').evaluateAll((els) => Promise.race([Promise.all(els.map((e) => (e as HTMLImageElement).decode().catch(() => undefined))), new Promise((done) => { setTimeout(done, 3000); })]));
          await page.screenshot({ path: join(shotsDir('real-content'), `${file}-${label}-${colorScheme}.png`), fullPage: true });
          noteScreenshot();
          expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `side scroll on ${name}, ${label}`).toBeLessThanOrEqual(0);
          await axeClean(page, `${name}, ${label}, ${colorScheme}`);
        }
      });
      test('the questions, to judge by eye', async ({ page }) => {
        await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
        await say(page, 'Both');
        await say(page, "Women's styles");
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(heading(page)).toHaveText('A few questions');
        await settled(page);
        await page.screenshot({ path: join(shotsDir('real-content'), `questions-${label}-${colorScheme}.png`) });
        noteScreenshot();
      });
    });
  }
}
