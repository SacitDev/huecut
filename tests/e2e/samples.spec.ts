/**
 * The samples on the answers on the build, so the CSP applies: on every question that gained one, each answer shows its
 * swatch or drawing, loaded and silent (`alt=""`, the words stay the name), a swatch in its own colours in the dark and a drawing
 * inverted; swatches one to a row and drawings two, every tile holding its sample, no sideways scroll, axe clean. Each question is
 * saved at 320 x 640 and 375 x 812 in both themes, on the question screens and in "Improve my ideas".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import type { Question, QuestionsFile } from '../../src/domain/content/types.ts';
import { button, heading } from './failure/support.ts';
import { expect, noteScreenshot, test } from './guard.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const { questions } = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'content', 'questions.json'), 'utf8')) as QuestionsFile;
const SIZES = [[320, 640], [375, 812]] as const;
const MAX_QUESTIONS = 15;

function question(id: string): Question {
  const q = questions.find((x) => x.id === id);
  if (!q) throw new Error(`no question ${id}`);
  return q;
}
const group = (scope: Page | Locator, id: string): Locator => scope.getByRole('group', { name: question(id).prompt, exact: true });
const answer = (scope: Page | Locator, id: string, label: string): Locator => scope.getByRole(question(id).type === 'single' ? 'radio' : 'checkbox', { name: label, exact: true });

/** Checks an answer as the keyboard does, so no tap moves the screen on. */
async function choose(page: Page, id: string, label: string, scope: Page | Locator = page): Promise<void> {
  const input = answer(group(scope, id), id, label);
  await input.focus();
  await page.keyboard.press('Space');
  await expect(input).toBeChecked();
}

/** From a new answers-only session to the first question of this goal and collection. */
async function start(page: Page, goal: 'Cut' | 'Colour', styles: "Women's styles" | "Men's styles"): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText(goal, { exact: true }).click();
  await page.getByText(styles, { exact: true }).click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
}

/** Presses Next until the question is on screen, answering nothing. */
async function reach(page: Page, id: string): Promise<void> {
  const wanted = group(page, id);
  for (let n = 0; n < MAX_QUESTIONS && !(await wanted.isVisible()); n++) await button(page, 'Next question').click();
  await expect(wanted).toBeVisible();
}

/** "Skip to my ideas", then "Improve my ideas" with all its questions. */
async function improve(page: Page): Promise<Locator> {
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await button(page, 'Improve my ideas').click();
  const sheet = page.getByRole('dialog', { name: 'Improve my ideas' });
  await expect(sheet.locator('fieldset').first()).toBeVisible();
  if (await button(sheet, 'Show all').isVisible()) await button(sheet, 'Show all').click();
  return sheet;
}

/** Each answer's sample is its own file, loaded and silent; the words stay the answer's name; the layout holds every sample. */
async function expectSamples(page: Page, scope: Page | Locator, id: string, scheme: 'light' | 'dark'): Promise<void> {
  const q = question(id);
  const g = group(scope, id);
  const swatches = q.options.some((o) => 'illustration' in o && o.illustration.startsWith('q-swatch'));
  for (const o of q.options) {
    const input = answer(g, id, o.label);
    await expect(input, `${id}: ${o.label} is named by its words`).toHaveCount(1);
    // A `has` locator is matched inside each tile, so it starts from the page, not from the group.
    const img = g.locator('label').filter({ has: answer(page, id, o.label) }).locator('img');
    if (!('illustration' in o)) {
      await expect(img, `${id}: ${o.label} has no sample`).toHaveCount(0);
      continue;
    }
    await expect(img, `${id}: ${o.label} shows its sample`).toHaveCount(1);
    await img.scrollIntoViewIfNeeded({ timeout: 10_000 });
    await expect(img).toHaveAttribute('src', new RegExp(`/illustrations/${o.illustration}\\.svg$`));
    await expect(img).toHaveAttribute('alt', '');
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), `${o.illustration} loads`).toBe(true);
    expect(await img.evaluate((el) => getComputedStyle(el).filter), `${o.illustration} in the ${scheme} theme`).toBe(swatches || scheme === 'light' ? 'none' : 'invert(1)');
  }
  const tiles = await g.locator('label:has(img)').evaluateAll((labels) =>
    labels.map((label) => {
      const [tile, picture] = [label.getBoundingClientRect(), label.querySelector('img')?.getBoundingClientRect()];
      return { x: Math.round(tile.x), height: tile.height, holds: picture !== undefined && picture.left >= tile.left && picture.right <= tile.right && picture.bottom <= tile.bottom };
    }),
  );
  // The tiles' own rule (OptionTile.module.css): drawings two to a row once the question is 17rem wide, swatches always one.
  const wide = await g.evaluate((el) => el.clientWidth >= 17 * parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(new Set(tiles.map((t) => t.x)).size, `${id}: ${swatches || !wide ? 'one' : 'two'} to a row`).toBe(swatches || !wide ? 1 : 2);
  for (const t of tiles) expect(t.height, `${id}: tile height`).toBeGreaterThanOrEqual(44);
  expect(tiles.every((t) => t.holds), `${id}: every tile holds its sample`).toBe(true);
  const broken = await g.locator('label [class*="range"]').evaluateAll((spans) => spans.filter((s) => s.getClientRects().length > 1).map((s) => s.textContent));
  expect(broken, `${id}: number ranges stay on one line`).toEqual([]);
}

async function expectAxeClean(page: Page, what: string): Promise<void> {
  // A question fades in as it arrives: axe would measure its text at the opacity of the fade.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
  // From the top of the screen: at the scroll a previous step left, a control can sit behind the sticky question and tab bars,
  // which axe counts as a small target (measured: the saving card's 44 px button with 21.5 px uncovered). A person scrolls it
  // into view, and a control reached by keyboard is kept clear of the bars.
  await page.evaluate(() => { window.scrollTo(0, 0); });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${what}`).toEqual([]);
}

/** Saves the screen as a phone shows it, focus taken off so no focus-only control shows. */
async function save(page: Page, name: string): Promise<void> {
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
  await page.screenshot({ path: join(shotsDir('samples'), `${name}.png`), animations: 'disabled' });
  noteScreenshot();
}

/**
 * At each size and theme: the questions' samples checked, no sideways scroll, axe clean, and each question saved as the screen shows
 * it from its top, and again at its last answer when it is taller than the screen.
 */
async function checkAndSave(page: Page, ids: readonly string[], sheet?: Locator): Promise<void> {
  for (const [width, height] of SIZES) {
    for (const scheme of ['light', 'dark'] as const) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: scheme });
      for (const id of ids) await expectSamples(page, sheet ?? page, id, scheme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${ids.join(', ')} at ${String(width)}`).toBeLessThanOrEqual(0);
      await expectAxeClean(page, `${ids.join(', ')} at ${String(width)} ${scheme}`);
      for (const id of ids) {
        const [g, name] = [group(sheet ?? page, id), `${id}-${String(width)}x${String(height)}-${scheme}`];
        await g.evaluate((el) => { el.scrollIntoView({ block: 'start' }); });
        await save(page, name);
        if (((await g.boundingBox())?.height ?? 0) <= height * 0.7) continue;
        await g.locator('label').last().evaluate((el) => { el.scrollIntoView({ block: 'end' }); });
        await save(page, `${name}-end`);
      }
    }
  }
}

test('colour: true colours on the direction and the colour in mind, the grey and its goal, the undertone; and on tone, skin, eyes and grey pattern', async ({ page }) => {
  await start(page, 'Colour', "Women's styles");
  await group(page, 'pref-colour-direction').locator('label').filter({ hasText: 'Go lighter' }).click();
  await expect(group(page, 'colour-wanted')).toBeVisible();
  await checkAndSave(page, ['pref-colour-direction', 'colour-wanted']);
  await reach(page, 'grey-amount');
  await group(page, 'grey-amount').locator('label').filter({ hasText: 'Some, about 10-30%' }).click();
  await expect(group(page, 'colour-grey-goal')).toBeVisible();
  await expect(group(page, 'grey-amount').locator('label [class*="range"]')).toHaveText(['10-30%', '30-50%', '50-75%']);
  await checkAndSave(page, ['grey-amount', 'colour-grey-goal']);
  await reach(page, 'look-undertone');
  await checkAndSave(page, ['look-undertone']);
  const sheet = await improve(page);
  for (const id of ['colour-current-tone', 'look-skin-depth', 'look-eye-colour', 'colour-grey-pattern']) await checkAndSave(page, [id], sheet);
});

test('men\'s cut: drawings on the beard; and on beard growth and hair, the parting, glasses frames and thinning', async ({ page }) => {
  await start(page, 'Cut', "Men's styles");
  await reach(page, 'beard-style');
  await choose(page, 'beard-style', 'A short beard');
  await checkAndSave(page, ['beard-style']);
  const sheet = await improve(page);
  await choose(page, 'look-glasses', 'Every day', sheet);
  await expect(group(sheet, 'look-glasses-frame')).toBeVisible();
  for (const id of ['beard-density', 'beard-texture', 'hair-part-side', 'look-glasses-frame', 'hair-thinning-zone']) await checkAndSave(page, [id], sheet);
});

test('women\'s cut: strand thickness under the amount of hair', async ({ page }) => {
  await start(page, 'Cut', "Women's styles");
  await reach(page, 'hair-density');
  await group(page, 'hair-density').locator('label').filter({ hasText: 'In between' }).click();
  await expect(group(page, 'hair-strand')).toBeVisible();
  // The amount of hair keeps its photos, which Playwright's WebKit on Windows cannot decode (illustrations.spec.ts): only the strands are checked.
  await checkAndSave(page, ['hair-strand']);
});
