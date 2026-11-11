/**
 * A phone's first screen of each My look step: at 375 x 812 and 320 x 640, light and dark, the step's first
 * control and its first answer or idea start above the pinned action bar, with at least a 24 px slice of each showing (WCAG 2.5.8's
 * smallest target), and the bar sits right on the tab bar, never over it. Measured as boxes on the screen (geometry, not names), on the
 * build with the real content, along the way a person goes: the saving notice whole on the step they came in on, one line after it.
 * A step that opens on its picture (the face card's portrait, the Board's first tile, an idea's picture) is held to its picture: the
 * controls under a picture come after it on any screen. The face card is measured and saved once the painter says its trace is done,
 * with every line group drawn. Each screen is also checked by axe and saved for the review.
 */
import AxeBuilder from '@axe-core/playwright';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { addPhotos, ANALYSIS_TIMEOUT_MS, answersToQuestions, button, drawing, FACE, heading, openPhoto } from './failure/support.ts';
import { capabilities, expect, noteScreenshot, test } from './guard.ts';
import { PICTURES } from './real-content-support.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

const PHONES = [
  { width: 375, height: 812 },
  { width: 320, height: 640 },
] as const;
/** WCAG 2.5.8's smallest target: at least this much of the control or answer shows above the bar, or all of it when it is smaller. */
const TARGET_PX = 24;
/** The tab bar's top line and a sub-pixel more: how far the pinned bar may reach into the tab bar without covering any of its items. */
const TAB_LINE_PX = 2;

interface Edges { readonly top: number; readonly bottom: number; readonly what: string }
interface FirstScreen {
  readonly control: Edges | null;
  /** The control comes after the item in the page: the step opens with its answer, idea or picture. */
  readonly itemFirst: boolean;
  readonly item: Edges | null;
  readonly bar: Edges | null;
  readonly tabs: Edges | null;
  readonly height: number;
  readonly sideways: boolean;
}

/**
 * The screen as it stands at the top of the page: the step's first control (the first one a person reaches after the heading, outside
 * the saving control and the pinned bar; a hidden radio counts as its tile), the item `item` selects, the pinned bar (the step's sticky
 * part) and the tab bar.
 */
const measureInPage = (item: string | null): FirstScreen => {
  const edges = (el: Element | null | undefined, what = ''): Edges | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, what: what || el.textContent.trim().slice(0, 60) };
  };
  const main = document.querySelector('main');
  const h1 = main?.querySelector('h1');
  if (!main || !h1) throw new Error('no screen heading');
  const shown = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden';
  };
  const bar = [...main.querySelectorAll('*')].filter((el) => getComputedStyle(el).position === 'sticky' && shown(el)).at(-1) ?? null;
  const save = main.querySelector('section[aria-label="Saving this session"]');
  const after = (el: Element): boolean => (h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  const control = [...main.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex="0"]')]
    .map((el) => (el instanceof HTMLInputElement ? (el.labels?.[0] ?? el) : el))
    .find((el) => after(el) && !save?.contains(el) && !bar?.contains(el) && shown(el));
  const found = item === null ? null : main.querySelector(item);
  return {
    control: edges(control),
    itemFirst: found !== null && control !== undefined && (found === control || found.contains(control) || (found.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0),
    item: edges(found),
    bar: edges(bar, 'the pinned bar'),
    tabs: edges(document.querySelector('nav[aria-label="Main"]'), 'the tab bar'),
    height: window.innerHeight,
    sideways: document.documentElement.scrollWidth > window.innerWidth,
  };
};

/** The page change and the question's arrival have played; a wait's endless line may go on. */
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));

/** A line the painter stroked whole in its latest paint of the portrait: its points in canvas px, and the canvas's size. */
interface Stroke { readonly points: readonly (readonly [number, number])[]; readonly width: number; readonly height: number }
type StrokeWindow = Window & { __strokes?: Stroke[] };

/**
 * Notes, from outside the app, each line the painter strokes whole in its latest paint of a traced canvas (no dash: a line part-way
 * through the trace has one). The painter clears the canvas first, then strokes each line twice with one path, casing then core.
 */
const NOTE_STROKES = (): void => {
  const points = new WeakMap<Path2D, [number, number][]>();
  const path = Object.getOwnPropertyDescriptors(Path2D.prototype);
  const ctx = Object.getOwnPropertyDescriptors(CanvasRenderingContext2D.prototype);
  const [moveTo, lineTo, clearRect, stroke] = [path.moveTo.value, path.lineTo.value, ctx.clearRect.value, ctx.stroke.value];
  if (!moveTo || !lineTo || !clearRect || !stroke) throw new Error('the canvas lacks its own methods');
  const win = window as StrokeWindow;
  const note = (p: Path2D, x: number, y: number): void => { points.set(p, [...(points.get(p) ?? []), [x, y]]); };
  Path2D.prototype.moveTo = function (this: Path2D, x: number, y: number) { note(this, x, y); moveTo.call(this, x, y); };
  Path2D.prototype.lineTo = function (this: Path2D, x: number, y: number) { note(this, x, y); lineTo.call(this, x, y); };
  CanvasRenderingContext2D.prototype.clearRect = function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    if (this.canvas.closest('[data-trace]')) win.__strokes = [];
    clearRect.call(this, x, y, w, h);
  };
  let previous: Path2D | undefined;
  CanvasRenderingContext2D.prototype.stroke = function (this: CanvasRenderingContext2D, p?: Path2D) {
    if (p && p === previous && this.getLineDash().length === 0 && this.globalAlpha > 0 && this.canvas.closest('[data-trace]')) {
      const m = this.getTransform();
      const at = (points.get(p) ?? []).map(([x, y]): [number, number] => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
      win.__strokes?.push({ points: at, width: this.canvas.width, height: this.canvas.height });
    }
    previous = p;
    Reflect.apply(stroke, this, p ? [p] : []);
  };
};

/** The groups every read card draws, as its picture's name says them; the hairline is drawn only when it shows. */
const ALWAYS_DRAWN = ['face outline', 'brows', 'eye line', 'nose width', 'lip line', 'jaw', 'chin'];
/** How many lines the painter draws for a group: the brows are two. */
const linesOf = (group: string): number => (group === 'brows' ? 2 : 1);
/** The thirds: four ticks on the midline, drawn when the card states the forehead and lower thirds. */
const THIRDS_TICKS = 4;

/**
 * After the painter's own done signal, its latest paint drew every line group of the card whole and inside the portrait, in its order:
 * the groups its picture's name says (face outline, hairline when it shows, brows, eye line, nose width, lip line, jaw, chin), then the
 * thirds' ticks when the card states the thirds. A group missing here is the app's bug, not the test's.
 */
async function expectEveryLineDrawn(page: Page): Promise<void> {
  await expect(page.locator('main [data-trace]')).toHaveAttribute('data-trace', 'done');
  // The finished drawing is painted on the frame after the signal.
  await page.evaluate(() => new Promise((resolve) => { requestAnimationFrame(() => { requestAnimationFrame(resolve); }); }));
  const name = (await drawing(page).getAttribute('aria-label')) ?? '';
  const groups = (/^Your photo with lines on the (.+)\.$/u.exec(name)?.[1] ?? '').split(/, | and /u);
  for (const group of ALWAYS_DRAWN) expect.soft(groups, `the portrait's name says the ${group}: "${name}"`).toContain(group);
  const thirds = (await page.getByRole('region', { name: 'What this photo shows' }).getByRole('heading', { name: 'Forehead' }).count()) > 0 ? THIRDS_TICKS : 0;
  const strokes = await page.evaluate(() => (window as StrokeWindow).__strokes ?? []);
  const lines = groups.reduce((n, group) => n + linesOf(group), 0);
  console.log(`portrait after the trace: ${String(strokes.length)} whole strokes for ${groups.join(', ')} (${String(lines)} lines) and ${String(thirds)} thirds ticks`);
  expect(strokes.length, `${String(lines)} lines and ${String(thirds)} ticks drawn whole after the trace ended`).toBe(lines + thirds);
  const inside = (s: Stroke): boolean => s.points.length >= 2 && s.points.every(([x, y]) => x >= 0 && y >= 0 && x <= s.width && y <= s.height);
  let at = 0;
  for (const group of [...groups, ...(thirds > 0 ? ['thirds'] : [])]) {
    const own = strokes.slice(at, (at += group === 'thirds' ? thirds : linesOf(group)));
    expect.soft(own.length > 0 && own.every(inside), `the ${group} is drawn whole inside the portrait: ${JSON.stringify(own)}`).toBe(true);
  }
}

/** The checks on one measured first screen; soft, so one walk reports every screen that fails, not only the first. */
function expectMeasured(m: FirstScreen, what: string, hasItem: boolean): void {
  const said = `${what}: ${JSON.stringify(m)}`;
  expect.soft(m.sideways, `${said}: no sideways scroll`).toBe(false);
  expect.soft(m.tabs, `${said}: the tab bar`).not.toBeNull();
  const tabs = m.tabs ?? { top: m.height, bottom: m.height, what: '' };
  expect.soft(tabs.bottom, `${said}: the tab bar is on the screen`).toBeLessThanOrEqual(m.height + 0.5);
  const limit = m.bar?.top ?? tabs.top;
  const held = [...(m.itemFirst ? [] : [['first control', m.control] as const]), ...(hasItem ? [['first answer, idea or picture', m.item] as const] : [])];
  for (const [name, box] of held) {
    expect.soft(box, `${said}: the ${name} is on the page`).not.toBeNull();
    if (!box) continue;
    expect.soft(box.top, `${said}: the ${name} starts on the screen`).toBeGreaterThanOrEqual(0);
    expect.soft(box.top + Math.min(TARGET_PX, box.bottom - box.top), `${said}: a tap target of the ${name} shows above the bar`).toBeLessThanOrEqual(limit + 0.5);
  }
  // The bar may rest on the tab bar's 1 px top line, never over its items: WebKit placed a sticky bar 1.5 px lower than Chromium (measured, 320 x 640).
  if (m.bar) expect.soft(m.bar.bottom, `${said}: the bar never covers the tab bar`).toBeLessThanOrEqual(tabs.top + TAB_LINE_PX);
}

/**
 * The step's first control (and `item`, its first answer, idea or picture) start above the pinned bar with a tap target of each showing,
 * and the bar is on the screen right on the tab bar, never over it; with no bar, above the tab bar. Saves the first screen for the review,
 * then runs axe at the end of the page, where the pinned bar rests below the content and covers no target.
 */
async function expectFirstScreen(page: Page, what: string, item: string | null = null): Promise<void> {
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await settled(page);
  const m = await page.evaluate(measureInPage, item);
  const shot = join(shotsDir('first-screen'), `${what}-${test.info().titlePath.at(-2)?.replaceAll(/[^\w]+/g, '-') ?? ''}`);
  await page.screenshot({ path: `${shot}.png` });
  noteScreenshot();
  await page.screenshot({ path: `${shot}-whole.png`, fullPage: true });
  noteScreenshot();
  expectMeasured(m, what, item !== null);
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  await settled(page);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect.soft(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${what}: axe`).toEqual([]);
}

/** Photo with the saving notice whole (the step this way in starts on), before and after a photo, then the face card. */
async function photoAndFaceCard(page: Page): Promise<void> {
  await page.addInitScript(NOTE_STROKES);
  await openPhoto(page);
  await expectFirstScreen(page, 'photo');
  await addPhotos(page, FACE);
  await expect(page.locator('main fieldset li')).toHaveCount(1);
  await expectFirstScreen(page, 'photo-added');
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  // Where the probe finds the face tools, the card as it is once read, held to its portrait; elsewhere the card as that browser shows it.
  const read = (await capabilities(page)).workerWebGL;
  if (read) {
    await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
    await expectEveryLineDrawn(page);
  }
  await expectFirstScreen(page, 'face-card', read ? 'main canvas[role="img"]' : null);
}

/** Every question of the Both set for one collection, each one's first answer held, from an answers-only start. */
async function everyQuestion(page: Page, show: string): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await page.getByText('Both', { exact: true }).click();
  await page.getByText(show, { exact: true }).click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
  const set = show.startsWith('Women') ? 'women' : 'men';
  for (let n = 1; ; n++) {
    await expect(page.getByText(new RegExp(`^Question ${String(n)} of \\d+$`, 'u'))).toBeVisible();
    await expectFirstScreen(page, `${set}-question-${String(n)}`, 'main fieldset label');
    const next = button(page, 'Next question');
    if ((await next.count()) === 0) break;
    await next.click();
  }
}

/** Ideas (its first idea held), Try it on and the Board (its first tile held) after an answers-only start, one AI picture added. */
async function ideasToBoard(page: Page): Promise<void> {
  await answersToQuestions(page, 'Both');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  // The idea's picture, not its card: the card's top padding alone passed while no idea showed.
  await expectFirstScreen(page, 'ideas', 'main article[data-idea] img');
  await button(page, 'Try them on').click();
  await expect(heading(page)).toHaveText('Try it on');
  await expect(page.getByRole('tablist')).toBeVisible();
  await expectFirstScreen(page, 'try-on');
  await page.getByRole('tab', { name: 'One by one', exact: true }).click();
  await expectFirstScreen(page, 'try-on-one-by-one');
  await page.getByRole('tab', { name: 'My pictures', exact: true }).click();
  await page.locator('main input[type=file]').first().setInputFiles(PICTURES[0] ?? '');
  await expect(page.getByRole('img', { name: /^Your AI picture for / })).toHaveCount(1);
  await button(page, 'See your pictures side by side').click();
  await expect(heading(page)).toHaveText('Board');
  await expectFirstScreen(page, 'board', 'main ul li');
}

for (const size of PHONES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${String(size.width)} x ${String(size.height)} ${colorScheme}`, () => {
      test.use({ viewport: size, screen: size, isMobile: true, hasTouch: true, colorScheme });

      test('Photo, before and after a photo is added, with the saving notice whole, then the face card', async ({ page }) => {
        await photoAndFaceCard(page);
      });

      test("every question, women's and men's, with the saving status on one line", async ({ page }) => {
        for (const show of ["Women's styles", "Men's styles"]) await everyQuestion(page, show);
      });

      test('Ideas, Try it on and the Board, after the step the person came in on', async ({ page }) => {
        await ideasToBoard(page);
      });
    });
  }
}
