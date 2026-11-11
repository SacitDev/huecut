/**
 * Try it on and Board e2e: the build under the production CSP on test content made in
 * beforeAll (the fixture content plus the 13 looks of the four test grids, with their real names and prompt specs), never
 * `src/generated`. Each test opens a kept round-trip session restored from IndexedDB at Try it on, with its tabs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import sharp from 'sharp';
import { expect, noteScreenshot, test } from './guard.ts';
import { fixtureServer } from './server.ts';
import { shotsDir } from './shots.ts';
import { expectedTiles, fail, gridOf, nameOf, openTryOn, prepareSuite, SAMPLE_PX, sampleDistance, sessionExists, TILE_SAMPLE_MAX_DISTANCE } from './try-on-support.ts';

const { PREVIEW_ORIGIN } = fixtureServer('try-on');
const KEEP_LIST = 'We ask the AI to keep your face, skin tone, eye colour and glasses. It should also keep your hairline, density, curl pattern, beard and background.';
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click();

test.beforeAll(async () => {
  test.setTimeout(600_000);
  await prepareSuite();
});

/** A JPEG with that long side (or exactly that size), with no EXIF block and none of the planted values. */
async function expectCleanJpeg(bytes: Buffer, size: { readonly longSide: number } | { readonly width: number; readonly height: number }): Promise<void> {
  const meta = await sharp(bytes).metadata();
  expect(meta.format).toBe('jpeg');
  if ('longSide' in size) expect(Math.max(meta.width, meta.height)).toBe(size.longSide);
  else expect([meta.width, meta.height]).toEqual([size.width, size.height]);
  expect(meta.exif).toBeUndefined();
  expect(bytes.includes(Buffer.from('Exif\0\0')) || bytes.includes(Buffer.from('FictionalCam'))).toBe(false);
}

async function expectAxeClean(page: Page, screen: string): Promise<void> {
  // On phones the sticky action bar lies over whatever is under it at this scroll, and axe's target-size counts that as
  // obscured; at the end of the page the bar rests below the content.
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${screen}`).toEqual([]);
}
/** No horizontal page scroll at this width. */
const expectNoSideScroll = async (page: Page, screen: string): Promise<void> => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `side scroll on ${screen}`).toBeLessThanOrEqual(0);
};
async function shot(target: Page | Locator, name: string): Promise<void> {
  const path = join(shotsDir('try-on'), `${name}.png`);
  await ('goto' in target ? target.screenshot({ path, fullPage: true }) : target.screenshot({ path }));
  noteScreenshot();
}
/** Presses Tab until `target` has focus: the keyboard path a person takes, never a click. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < 80 && !(await target.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
}
/** A shown picture's real size and a small sample of its pixels, as the page holds them. */
const pictureOf = (img: Locator): Promise<{ readonly width: number; readonly height: number; readonly sample: number[] }> =>
  img.evaluate((el: HTMLImageElement, size) => {
    const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(el, 0, 0, size, size);
    return { width: el.naturalWidth, height: el.naturalHeight, sample: Array.from(ctx?.getImageData(0, 0, size, size).data ?? []) };
  }, SAMPLE_PX);

/** A board tile's picture, the one that opens the slider (its closed sheet holds more images). */
const tilePicture = (tile: Locator): Locator => tile.getByRole('button', { name: /^Compare / }).locator('img');
/** The picture is really on screen and whole: it has a real size, and `contain` crops no hair. */
async function expectShownWhole(img: Locator): Promise<void> {
  await expect(img).toBeVisible();
  expect((await img.boundingBox())?.width ?? 0).toBeGreaterThan(120);
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
}

/** Records what the page copies and shares (a share sheet that keeps the file); `setShare(false)` takes it away. */
async function recordHandoff(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { copied: string[]; shared: string[]; setShare: (on: boolean) => void };
    [w.copied, w.shared] = [[], []];
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => { w.copied.push(text); await write(text); };
    const base64 = (f: File) => new Promise<string>((done) => { const r = new FileReader(); r.onload = () => { done((r.result as string).split(',')[1] ?? ''); }; r.readAsDataURL(f); });
    const share = async (d: ShareData) => { for (const f of d.files ?? []) w.shared.push(`${f.name}|${f.type}|${await base64(f)}`); };
    const canShare = (d: ShareData) => (d.files?.length ?? 0) > 0;
    w.setShare = (on) => { for (const [key, value] of [['share', share], ['canShare', canShare]] as const) Object.defineProperty(navigator, key, { configurable: true, value: on ? value : undefined }); };
    w.setShare(false);
  });
}
const recorded = (page: Page, what: 'copied' | 'shared'): Promise<string[]> => page.evaluate((k) => (window as unknown as Record<string, string[]>)[k] ?? [], what);
const setShare = (page: Page, on: boolean): Promise<void> => page.evaluate((v) => { (window as unknown as { setShare: (on: boolean) => void }).setShare(v); }, on);
async function downloaded(page: Page, press: () => Promise<void>): Promise<{ readonly name: string; readonly bytes: Buffer }> {
  const [download] = await Promise.all([page.waitForEvent('download'), press()]);
  return { name: download.suggestedFilename(), bytes: readFileSync(await download.path()) };
}

/** The innermost section headed `title` (level 2 or 3): one look, one grid or the pair. */
const card = (page: Page, title: string): Locator => page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).last();
/** "Copy prompt" puts the card's prompt on the clipboard: recorded in both engines, read back where a test may (Chromium). */
async function expectCopied(page: Page, scope: Locator, label: string, browserName: string): Promise<void> {
  if (browserName === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: PREVIEW_ORIGIN });
  await scope.getByRole('button', { name: label }).click();
  await expect(scope.getByRole('button', { name: 'Prompt copied' })).toBeVisible();
  await expect(scope.getByText('Prompt copied. Now open ChatGPT or Gemini and paste it.')).toBeAttached();
  const prompt = await scope.locator('textarea').inputValue(); // the prompt's own box, folded under "Show the prompt"
  expect(prompt).toContain('Keep my face');
  expect((await recorded(page, 'copied')).at(-1)).toBe(prompt);
  // Read back from the system clipboard, which may turn line ends into CRLF.
  if (browserName === 'chromium') expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(prompt);
}

/** One click on a card puts its prompt on the clipboard, and the link goes to the app's plain start page in a new tab. */
async function expectCopyAndOpen(page: Page, scope: Locator): Promise<void> {
  for (const [name, url] of [['Copy and open ChatGPT', 'https://chatgpt.com/'], ['Copy and open Gemini', 'https://gemini.google.com/']] as const) {
    const link = scope.getByRole('link', { name: `${name} (opens in a new tab)`, exact: true });
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('target', '_blank');
    const before = (await recorded(page, 'copied')).length;
    // The click's own handlers run; only the real opening of the other site is stopped, so the test stays on this one.
    await page.evaluate(() => { document.addEventListener('click', (e) => { e.preventDefault(); }, { once: true }); });
    await link.click();
    await expect.poll(async () => (await recorded(page, 'copied')).length).toBe(before + 1);
    expect((await recorded(page, 'copied')).at(-1)).toBe(await scope.locator('textarea').inputValue());
  }
}

const PHONE = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true };

test.describe('phone', () => {
  test.use(PHONE);
  test('1 Copy prompt, 2 Share photo, its download without a share sheet, the saving control', async ({ page, browserName }) => {
    await recordHandoff(page);
    await openTryOn(page, [...gridOf(1).ideas, ...gridOf(0).ideas], 'cut');
    await tab(page, 'One by one');
    const steps = 'Tap 1, then tap 2 and choose ChatGPT or Gemini. Paste the prompt and send. No ChatGPT or Gemini in the list? Tap Copy and open ChatGPT or Gemini, attach your photo there and paste.';
    await expect(page.getByText(steps, { exact: true }), 'each look carries its own steps').toHaveCount(5);
    const look = card(page, nameOf('french-crop'));
    await expectCopied(page, look, '1 Copy prompt', browserName);
    await setShare(page, true);
    await look.getByRole('button', { name: '2 Share photo' }).click();
    await expect.poll(async () => (await recorded(page, 'shared')).length).toBe(1);
    const [name, type, base64] = (await recorded(page, 'shared'))[0]?.split('|') ?? [];
    expect([name, type]).toEqual(['huecut-photo.jpg', 'image/jpeg']);
    await expectCleanJpeg(Buffer.from(base64 ?? '', 'base64'), { longSide: 1536 });
    await setShare(page, false);
    const file = await downloaded(page, () => look.getByRole('button', { name: '2 Share photo' }).click());
    expect(file.name).toBe('huecut-photo.jpg');
    await expectCleanJpeg(file.bytes, { longSide: 1536 });
    await expect(look.getByText('Your photo is in your downloads. Attach it in ChatGPT or Gemini.')).toBeAttached();
    await expect(page.getByText(KEEP_LIST)).toHaveCount(5); // 5 looks: one under each prompt
    await tab(page, 'My pictures');
    await expect(page.getByText(KEEP_LIST)).toHaveCount(2); // and 2 grids
    await expect(page.getByText('To save a picture, press and hold it, then Save to Photos.')).toBeVisible();
    await tab(page, 'Tips');
    await page.getByRole('button', { name: 'Face looks different?' }).click();
    await expect.poll(async () => (await recorded(page, 'copied')).at(-1)).toContain('start again from my original photo');
    await expect(page.getByText('Repair prompt copied. Paste it into the same chat.')).toBeAttached();
    await expect(page.getByText('AI often gives more hair or a fuller hairline than you have. Your stylist knows what your hair can do.')).toBeVisible();
    await savingModes(page);
    await tab(page, 'One by one');
    await shot(page, `${browserName}-phone-try-on`);
    await expectNoSideScroll(page, 'Try it on, 375');
    await expectAxeClean(page, 'Try it on, phone');
    await page.getByRole('button', { name: 'See your pictures side by side' }).click();
    await expect(page.getByText('Your board is empty. Save the pictures your AI chat makes and add them on Try it on.')).toBeVisible();
    await expectAxeClean(page, 'Board, empty, phone');
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Try it on');
    await tab(page, 'My pictures');
    await phoneBoard(page, card(page, nameOf('french-crop')), browserName);
  });
});

test.describe('phone, no photo', () => {
  test.use(PHONE);
  test('no photo, and a past dye reaction: links instead of the share button, no colour prompt, no colour slot', async ({ page }) => {
    const [cut, look] = ['french-crop', 'bronde-balayage'];
    await openTryOn(page, [cut, look], 'both', [cut, look], { photo: null, source: 'answers_only', answers: { 'dye-reaction': { chosen: [2] } } });
    await expect(page.getByText('Best done by a colourist', { exact: true }).first(), 'the colour choice says why').toBeVisible();
    await tab(page, 'One by one');
    await expect(page.getByText('Tap 1, then open ChatGPT or Gemini and attach your own photo there. Paste the prompt and send.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2 Share photo' })).toHaveCount(0);
    const allowed = card(page, nameOf(cut));
    await expect(allowed.getByRole('button', { name: '1 Copy prompt' })).toBeVisible();
    await expect(allowed.getByRole('group', { name: '2 Open ChatGPT or Gemini' }).getByRole('link')).toHaveCount(2);
    for (const title of [`Together: ${nameOf(cut)}, with ${nameOf(look)}`, nameOf(look)]) {
      const refused = card(page, title);
      await expect(refused.getByText('Best done by a colourist', { exact: true })).toBeVisible();
      await expect(refused.getByText('please ask a doctor or allergy clinic before colouring')).toBeVisible();
      await expect(refused.getByRole('button', { name: /Copy prompt/u })).toHaveCount(0);
    }
    await tab(page, 'My pictures');
    await expect(card(page, nameOf(cut)).locator('input[type=file]'), 'the cut keeps its slot').toHaveCount(1);
    for (const title of [`Together: ${nameOf(cut)}, with ${nameOf(look)}`, nameOf(look)]) await expect(page.getByRole('heading', { name: title, exact: true, level: 3 }), 'no slot for a refused look').toHaveCount(0);
    await tab(page, 'One by one');
    await expectNoSideScroll(page, 'Try it on, no photo');
    await expectAxeClean(page, 'Try it on, no photo and a referral');
  });
});

/** A picture added on a phone: its tile at 375 px, the other tiles' empty frames, and Save board through the share sheet. */
async function phoneBoard(page: Page, look: Locator, browserName: string): Promise<void> {
  await look.locator('input[type=file]').setInputFiles(gridOf(0).path);
  await expect(look.getByRole('img', { name: `Your AI picture for ${nameOf('french-crop')}`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  const tiles = page.getByRole('list', { name: 'Your looks' }).locator('> li');
  await expect(tiles.getByText('AI picture, an illustration of the look')).toHaveCount(1);
  await expectShownWhole(tilePicture(tiles.first()));
  await expect(tiles.nth(1).getByText('No picture yet')).toBeVisible();
  await expectNoSideScroll(page, 'Board, 375');
  await shot(page, `${browserName}-phone-board`);
  await expectAxeClean(page, 'Board, phone');
  await setShare(page, true);
  await page.getByRole('button', { name: 'Save board' }).click();
  await expect.poll(async () => (await recorded(page, 'shared')).length).toBe(2);
  const [boardName, , boardBytes] = (await recorded(page, 'shared'))[1]?.split('|') ?? [];
  expect(boardName).toMatch(/^huecut-board-\d{4}-\d{2}-\d{2}\.jpg$/);
  await expectCleanJpeg(Buffer.from(boardBytes ?? '', 'base64'), { width: 2160, height: 2700 });
}

/** A restored session is saved: Don't save deletes it, 24 hours stores it again, and Don't save deletes it once more. */
async function savingModes(page: Page): Promise<void> {
  const [off, day] = [page.getByRole('radio', { name: "Delete and don't save" }), page.getByRole('radio', { name: 'Keep for 24 hours' })];
  await off.click();
  await expect.poll(() => sessionExists(page)).toBe(false);
  await expect(page.getByText('Not saved on this device.').first()).toBeVisible();
  await day.click();
  await expect.poll(() => sessionExists(page)).toBe(true);
  await off.click();
  await expect.poll(() => sessionExists(page)).toBe(false);
  await day.click();
  await expect.poll(() => sessionExists(page)).toBe(true);
}

/** Adds grid `n`'s picture, puts the names in the picture's order by keyboard, attaches them and checks each tile. */
async function confirmGrid(page: Page, title: string, n: number, browserName: string, nameIn: (id: string) => string = nameOf): Promise<void> {
  const want = gridOf(n).ideas.map(nameIn);
  const box = card(page, title);
  await box.locator('input[type=file]').setInputFiles(gridOf(n).path);
  const rows = box.locator('li').filter({ hasText: /^Tile \d+ is: / });
  await expect(rows).toHaveCount(want.length);
  const shown = async () => (await rows.locator('p').allTextContents()).map((t) => t.replace(/^Tile \d+ is: /, ''));
  expect(await shown(), 'the names start in list order, not the picture order').not.toEqual(want);
  await box.getByRole('heading', { level: 3 }).focus();
  for (const [i, name] of want.entries()) {
    const at = (await shown()).indexOf(name);
    if (at > i) await tabTo(page, rows.nth(at).getByRole('button', { name: 'Move earlier' }));
    for (let k = at; k > i; k--) await page.keyboard.press('Enter');
  }
  expect(await shown()).toEqual(want);
  await shot(box, `${browserName}-grid-${String(n + 1)}-confirm`);
  await tabTo(page, box.getByRole('button', { name: 'Attach these names' }));
  await page.keyboard.press('Enter');
  await expect(box.getByText(/^Tile \d+: /)).toHaveText(want.map((name, i) => `Tile ${String(i + 1)}: ${name}`));
  const tiles = await expectedTiles(n);
  for (const [i, name] of want.entries()) {
    const shownTile = await pictureOf(page.getByRole('img', { name: `Your AI picture for ${name}`, exact: true }));
    const expected = tiles[i] ?? fail(`tile ${String(i)}`);
    expect(Math.abs(shownTile.width - expected.width) + Math.abs(shownTile.height - expected.height), `${name}: the tile cut in the page`).toBeLessThanOrEqual(2);
    // The name's picture is this tile's pixels and no other tile's: equal sizes alone would not catch tiles in the wrong order.
    const distances = tiles.map((t) => sampleDistance(shownTile.sample, t.sample));
    expect(distances.indexOf(Math.min(...distances)), `${name}: shows its own tile (${distances.map((d) => d.toFixed(1)).join(', ')})`).toBe(i);
    expect(distances[i]).toBeLessThan(TILE_SAMPLE_MAX_DISTANCE);
  }
}

// Computers: the projects' own 1280 x 800 viewport.
test('desktop: grids of 3 and 2 cuts confirmed by keyboard; a dropped picture on the Board; Save board', async ({ page, browserName }) => {
  await recordHandoff(page);
  // The list order differs from each picture's tile order, so the confirmation has to move names.
  const order = ['ivy-league', 'french-crop', 'buzz-skin-fade', 'blunt-full-fringe-long', 'shingle-bob'];
  await openTryOn(page, order, 'cut');
  await tab(page, 'One by one');
  await expectCleanJpeg((await downloaded(page, () => page.getByRole('button', { name: 'Download photo for AI' }).click())).bytes, { longSide: 1536 });
  await tab(page, 'My pictures');
  await expectCopied(page, card(page, 'Picture 1 of 2: 3 cuts'), 'Copy prompt', browserName);
  await expectCopyAndOpen(page, card(page, 'Picture 1 of 2: 3 cuts'));
  await confirmGrid(page, 'Picture 1 of 2: 3 cuts', 1, browserName);
  await confirmGrid(page, 'Picture 2 of 2: 2 cuts', 0, browserName);
  await expectAxeClean(page, 'Try it on, grids named');
  const dropped = await dropPicture(page, nameOf('ivy-league'), gridOf(2).path);
  if (browserName === 'chromium') await pastePictures(page, ['french-crop', 'buzz-skin-fade'].map(nameOf));
  await expectNoSideScroll(page, 'Try it on, 1280');
  await shot(page, `${browserName}-desktop-try-on`);
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  const tiles = page.getByRole('list', { name: 'Your looks' }).locator('> li');
  await expect(tiles.locator('figcaption > span:first-child')).toHaveText(order.map(nameOf));
  await expect(tiles.getByText('AI picture, an illustration of the look')).toHaveCount(order.length);
  const shownDrop = await pictureOf(tilePicture(tiles.first()));
  for (const tile of await tiles.all()) await expectShownWhole(tilePicture(tile));
  expect({ width: shownDrop.width, height: shownDrop.height }, 'the dropped picture').toEqual(dropped);
  await expectNoSideScroll(page, 'Board, 1280');
  await boardActions(page, nameOf('ivy-league'), browserName);
});

test('desktop: the pair; Tiles look wrong?; grids of 4 cuts and 4 colours confirmed by keyboard', async ({ page, browserName }) => {
  const looks = ['curly-short-shag', 'curly-bob-rounded', 'shaped-round-afro', 'curly-butterfly', 'honey-blonde-foil-highlights', 'bronde-balayage', 'ash-blonde-root-shadow', 'strawberry-blonde-balayage'];
  // Under Both the app pairs each cut with a colour by rank; the pair is another match, so the board has all nine tiles.
  await openTryOn(page, looks, 'both', ['curly-bob-rounded', 'ash-blonde-root-shadow']);
  await tab(page, 'My pictures');
  const pairName = `Together: ${nameOf('curly-bob-rounded')}, with ${nameOf('ash-blonde-root-shadow')}`;
  const paired = (id: string): string => `${nameOf(id)} in ${nameOf(looks[looks.indexOf(id) + 4] ?? '')}`;
  await card(page, pairName).locator('input[type=file]').setInputFiles(gridOf(3).path);
  const colours = card(page, 'Picture 2 of 2: 4 colours');
  await colours.locator('input[type=file]').setInputFiles(gridOf(2).path);
  await expect(colours.getByText(/^Tile 4 is: /)).toBeVisible();
  await tabTo(page, colours.getByRole('button', { name: 'Tiles look wrong?' }));
  await page.keyboard.press('Enter');
  await expect(colours.getByText('One picture per look instead: use One by one, then the Add picture slots here.')).toBeVisible();
  await expect(colours.getByText(/^Tile \d+: /)).toHaveCount(0);
  await expect(page.getByRole('img', { name: /^Your AI picture for /u }), 'only the pair has a picture: no tile was attached').toHaveCount(1);
  await confirmGrid(page, 'Picture 1 of 2: 4 cuts', 2, browserName, paired);
  await confirmGrid(page, 'Picture 2 of 2: 4 colours', 3, browserName);
  await expectAxeClean(page, 'Try it on, pair and grids');
  await page.getByRole('button', { name: 'See your pictures side by side' }).click();
  const tiles = page.getByRole('list', { name: 'Your looks' }).locator('> li');
  await expect(tiles.locator('figcaption > span:first-child')).toHaveText([pairName, ...looks.slice(0, 4).map(paired), ...looks.slice(4).map(nameOf)]);
  for (const tile of await tiles.all()) await expectShownWhole(tilePicture(tile));
  const hairOnly = tiles.nth(5).getByRole('switch', { name: 'Hair-only version' });
  await hairOnly.check();
  await expect(hairOnly).toBeChecked();
  await shot(page, `${browserName}-desktop-board-pair`);
  await expectAxeClean(page, 'Board with the pair');
});

/**
 * A real Ctrl+V of an image (Chromium only: a test can put one on its clipboard there): first with the slot's button
 * focused, then with the pointer over the slot and focus elsewhere. Neither leaves the paste event on the slot itself.
 */
async function pastePictures(page: Page, [focused, hovered]: readonly string[]): Promise<void> {
  await page.evaluate(async () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 64, height: 80 });
    canvas.getContext('2d')?.fillRect(0, 0, 64, 80);
    const blob = await new Promise<Blob | null>((done) => { canvas.toBlob(done, 'image/png'); });
    if (blob) await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  });
  const slotOf = (name: string | undefined) => page.getByRole('group', { name: `Picture for ${name ?? ''}` });
  await slotOf(focused).getByRole('button', { name: 'Replace picture' }).focus();
  await page.keyboard.press('Control+V');
  await expect(page.getByText(`Picture added for ${focused ?? ''}.`)).toBeAttached();
  await page.getByRole('heading', { level: 1 }).focus();
  await slotOf(hovered).hover();
  await page.keyboard.press('Control+V');
  await expect(page.getByText(`Picture added for ${hovered ?? ''}.`)).toBeAttached();
}

/** Drops a picture on a look's slot and returns its size. */
async function dropPicture(page: Page, name: string, file: string): Promise<{ readonly width: number; readonly height: number }> {
  const data = await page.evaluateHandle((b64) => {
    const dt = new DataTransfer();
    dt.items.add(new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], 'from-the-chat.jpg', { type: 'image/jpeg' }));
    return dt;
  }, readFileSync(file).toString('base64'));
  await page.getByRole('group', { name: `Picture for ${name}` }).dispatchEvent('drop', { dataTransfer: data });
  await expect(page.getByText(`Picture added for ${name}.`)).toBeAttached();
  const meta = await sharp(file).metadata();
  return { width: meta.width, height: meta.height };
}

/** The slider by keyboard, the stylist sheet, and Save board as a clean 2160 x 2700 JPEG. */
async function boardActions(page: Page, name: string, browserName: string): Promise<void> {
  await page.getByRole('button', { name: `Compare ${name} with your photo` }).click();
  const slider = page.getByRole('slider', { name: 'Your photo or the AI picture' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('51');
  await expectAxeClean(page, 'Board, slider');
  await page.keyboard.press('Escape');
  await page.getByRole('list', { name: 'Your looks' }).locator('> li').first().getByRole('button', { name: 'Show your stylist' }).click();
  await expect(page.getByRole('dialog', { name }).getByRole('heading', { name })).toBeVisible();
  await page.keyboard.press('Escape');
  // Closed, not still fading out: axe would measure the sheet's text at the opacity of its exit animation.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await shot(page, `${browserName}-desktop-board`);
  await expectAxeClean(page, 'Board');
  const saved = await downloaded(page, () => page.getByRole('button', { name: 'Save board' }).click());
  expect(saved.name).toMatch(/^huecut-board-\d{4}-\d{2}-\d{2}\.jpg$/);
  await expectCleanJpeg(saved.bytes, { width: 2160, height: 2700 });
}
