/**
 * The better questions in the real app: drawings, swatches and library looks on their options, the wanted colour on the
 * direction screen, "Tap the looks you like" with its limit said out loud, each clear and clean at phone widths in both themes.
 */
import AxeBuilder from '@axe-core/playwright';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { button, chooseGoal, heading, toLines } from './failure/support.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const FACES = join(import.meta.dirname, '..', 'fixtures', 'faces');

const group = (page: Page, prompt: string | RegExp): Locator => page.getByRole('group', { name: prompt });
const tile = (scope: Locator, label: string): Locator => scope.locator('label').filter({ hasText: label });

/** From a new answers-only session to the first question of this goal and collection. */
async function start(page: Page, goal: 'Cut' | 'Colour' | 'Both', styles: "Women's styles" | "Men's styles"): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText(goal, { exact: true }).click();
  await page.getByText(styles, { exact: true }).click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
}

/** Presses Next until the question is on screen, answering nothing except what `answer` names. */
async function reach(page: Page, prompt: string | RegExp, answer: Readonly<Record<string, string>> = {}): Promise<Locator> {
  const wanted = group(page, prompt);
  for (let n = 0; n < 12 && !(await wanted.isVisible()); n++) {
    const legend = await page.locator('main fieldset legend').first().innerText();
    for (const [q, label] of Object.entries(answer)) if (legend.includes(q)) await tile(page.locator('main fieldset').first(), label).click();
    if (await wanted.isVisible()) break;
    await page.waitForTimeout(400);
    if (await wanted.isVisible()) break;
    if (await page.locator('main fieldset legend').first().innerText() === legend) await button(page, 'Next question').click();
  }
  await expect(wanted).toBeVisible();
  return wanted;
}

/** No sideways scroll, every option at least 44 px tall, and axe finds nothing at this width and theme. */
async function expectClear(page: Page, scope: Locator, width: number, scheme: 'light' | 'dark', shot: string): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width, height: 800 });
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${shot} at ${String(width)}`).toBeLessThanOrEqual(0);
  for (const box of await scope.locator('label').evaluateAll((all) => all.map((l) => l.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(44);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => v.id), `${shot} at ${String(width)} ${scheme}`).toEqual([]);
  await page.screenshot({ path: join(shotsDir('better-questions'), `${shot}-${String(width)}-${scheme}.png`), fullPage: true });
  noteScreenshot();
}

/** The picture has really loaded and is shown. */
const expectLoaded = async (picture: Locator): Promise<void> => {
  await picture.scrollIntoViewIfNeeded();
  await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
};

for (const width of [320, 360]) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`the picture questions stay clear at ${String(width)} px in the ${scheme} theme`, async ({ page }) => {
      await start(page, 'Cut', "Women's styles");
      const length = await reach(page, 'How far does your hair reach when you gently pull it straight?');
      await expectClear(page, length, width, scheme, 'length');
      const taste = await reach(page, 'Tap the looks you like.');
      await expectClear(page, taste, width, scheme, 'taste');
      await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
      await chooseGoal(page, 'Colour');
      const natural = await reach(page, 'What colour does your hair grow at the roots, before any dye?');
      await expectClear(page, natural, width, scheme, 'swatches');
    });
  }
}

test('the six length drawings are labelled, and the second length question is for curls only', async ({ page }) => {
  await start(page, 'Cut', "Women's styles");
  await tile(page.locator('main fieldset').first(), 'Coily').click();
  const length = await reach(page, 'How far does your hair reach when you gently pull it straight?');
  for (const [label, file] of [['A few centimetres', 'very-short'], ['Above my chin', 'short'], ['To my chin', 'chin'], ['To my shoulders', 'shoulder'], ['Past my shoulders', 'long'], ['Halfway down my back or longer', 'very-long']] as const) {
    const picture = tile(length, label).locator('img');
    await expect(picture).toHaveAttribute('src', new RegExp(`/illustrations/q-length-${file}\\.svg$`));
    await expectLoaded(picture);
  }
  await tile(length, 'To my shoulders').click();
  await expect(group(page, 'Now where does it sit when it is dry and you leave it alone?')).toBeVisible();
  await button(page, 'Back').click();
  await button(page, 'Back').click();
  await tile(page.locator('main fieldset').first(), 'Straight').click();
  await tile(await reach(page, 'How far does your hair reach when you gently pull it straight?'), 'To my shoulders').click();
  await expect(group(page, 'Tap the looks you like.')).toBeVisible();
});

test('swatches keep their words, are said to be a guide, and are not inverted in the dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await start(page, 'Colour', "Women's styles");
  const natural = await reach(page, 'What colour does your hair grow at the roots, before any dye?');
  await expect(natural.getByText('These shades are a guide, not a measurement.')).toBeVisible();
  const black = tile(natural, 'Black').locator('img').first();
  await expectLoaded(black);
  await expect(black).toHaveAttribute('src', /q-swatch-1\.svg$/);
  expect(await black.evaluate((img) => getComputedStyle(img).filter)).toBe('none');
  await expect(natural.locator('img')).toHaveCount(10);
});

test('the taste cards: up to three, refused and announced after that, "None" stands alone, and only the person\'s own looks', async ({ page }) => {
  await start(page, 'Cut', "Women's styles");
  await tile(page.locator('main fieldset').first(), 'Wavy').click();
  const taste = await reach(page, 'Tap the looks you like.');
  await expect(taste.locator('label')).toHaveCount(7);
  await expect(taste.getByText('Pick up to 3, or none.', { exact: false })).toBeVisible();
  await expect(taste.getByText('Tapered buzz', { exact: false })).toHaveCount(0);
  const status = page.getByRole('status').filter({ hasText: /chosen|choose up to/ });
  for (const [name, count] of [['Classic pixie', 1], ['French bob', 2], ['Classic 70s shag', 3]] as const) {
    await tile(taste, name).click();
    await expect(status).toHaveText(`${String(count)} of up to 3 chosen`);
  }
  await tile(taste, 'Long wolf cut').click();
  await expect(status).toHaveText('You can choose up to 3. Untick one to choose another.');
  await expect(taste.locator('input:checked')).toHaveCount(3);
  await expect(taste.getByRole('checkbox', { name: 'Long wolf cut' })).not.toBeChecked();
  await tile(taste, 'None of these, or not sure').click();
  await expect(taste.locator('input:checked')).toHaveCount(1);
  await taste.getByRole('checkbox', { name: 'French bob' }).press('Space');
  await expect(taste.getByRole('checkbox', { name: 'French bob' })).toBeChecked();
  await expect(taste.getByRole('checkbox', { name: 'None of these, or not sure' })).not.toBeChecked();
});

test('fringe shows a real look for the person\'s collection, on the men\'s and the women\'s set', async ({ page }) => {
  await requires(page, 'avif');
  await start(page, 'Cut', "Men's styles");
  const fringe = await reach(page, 'Would you like a fringe?');
  const picture = tile(fringe, 'No fringe, please').locator('img');
  await expect(picture).toHaveAttribute('src', /library\/barbering-straight-wavy\/quiff-classic-front-480\.avif$/);
  await expectLoaded(picture);
  await start(page, 'Cut', "Women's styles");
  await expect(tile(await reach(page, 'Would you like a fringe?'), 'No fringe, please').locator('img')).toHaveAttribute('src', /library\/salon-straight-wavy\/long-u-layers-front-480\.avif$/);
});

test('the wanted colour opens on the direction screen, and men are told plainly there is no red', async ({ page }) => {
  await start(page, 'Colour', "Men's styles");
  const direction = group(page, 'What would you like your colour to do?');
  await tile(direction, 'Go lighter').click();
  const wanted = group(page, 'Which is closest to what you have in mind?');
  await expect(wanted).toBeVisible();
  await expect(tile(wanted, 'Red or copper')).toContainText("We have no men's looks in this colour yet.");
  await tile(wanted, 'Blonde').click();
  await tile(wanted, 'Brown').click();
  await tile(wanted, 'Black').click();
  await expect(wanted.locator('input:checked')).toHaveCount(2);
  await expect(page.getByRole('status').filter({ hasText: 'You can choose up to 2.' })).toBeVisible();
});

test('women are not told there is no red', async ({ page }) => {
  await start(page, 'Colour', "Women's styles");
  await tile(group(page, 'What would you like your colour to do?'), 'Go darker').click();
  await expect(tile(group(page, 'Which is closest to what you have in mind?'), 'Red or copper')).toHaveText('Red or copper');
});

test('the grey goal opens under the amount of grey, and the hairline follow-up under a later stage', async ({ page }) => {
  await start(page, 'Colour', "Women's styles");
  const amount = await reach(page, 'How much grey or white hair do you have, roughly?');
  await tile(amount, 'Some, about 10-30%').click();
  await expect(group(page, 'What would you like to do about grey?')).toBeVisible();
  await start(page, 'Cut', "Men's styles");
  const stage = await reach(page, 'Which drawing is closest to your hairline and crown?');
  await tile(stage, 'Higher at the temples, a small thin patch on the crown').click();
  await expect(group(page, 'Would you like your hairline to show less?')).toBeVisible();
});

test('a reading leaves the whole wish list in place: every concrete wish acts as stated, never waiting for the face', async ({ page }) => {
  await requires(page, 'workerWebGL');
  test.setTimeout(240_000);
  // The fixture faces all read in the middle bands: this one band is moved so the real analysis reads "longer" before the questions.
  await page.route('**/consult-*.json', async (route) => {
    const response = await route.fetch();
    const data = (await response.json()) as { bands: { bands: { fact: string; cuts: unknown[] }[] } };
    for (const band of data.bands.bands) if (band.fact === 'face.proportion') band.cuts = [{ below: 8, value: 'longer' }, { below: 9, value: 'balanced' }, { value: 'rounder' }];
    await route.fulfill({ response, json: data });
  });
  await toLines(page, join(FACES, 'far-1-5m.jpg'));
  await button(page, 'Choose what to change').click();
  await expect(heading(page)).toHaveText('Your goal');
  await chooseGoal(page, 'Cut');
  const wishes = await reach(page, 'Is there anything you would like your hair to do for your face?');
  await expect(wishes.locator('label')).toHaveCount(26);
  for (const wish of ['Hair that adds fullness at the sides', 'Hair that keeps a long line down my face', 'Hair that covers more of my forehead']) await expect(tile(wishes, wish)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show all', exact: true })).toHaveCount(0);
});
