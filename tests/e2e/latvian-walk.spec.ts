/**
 * Latvian everywhere a person reads, with the pseudo-Latvian of `pseudo-latvian.ts`: every screen of the walk, at 320 and
 * 375 px, light and dark, holds no English beyond the allow-list and is laid out as well as the same walk in English (no side scroll,
 * no text cut off or on top of other text, type and controls at their sizes); the fonts draw the Latvian letters. Screenshots: `shotsDir('latvian')`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser, Locator, Page } from '@playwright/test';
import { FACE, PHONE } from './failure/support.ts';
import { capabilities, expect, noteScreenshot, test } from './guard.ts';
import { lv, plantPseudoLatvian } from './pseudo-latvian.ts';
import { APP_URL } from './server.ts';
import { shotsDir } from './shots.ts';

/**
 * The whole allow-list of words that stay English, by design: the app's name (its wordmark too), the two AI apps it hands prompts
 * to (product names), and "English", the language's own name in the language switch. "un" and "vai" are Latvian: the
 * platform's `Intl.ListFormat('lv')` joins lists with them. Links (the footer's web address) are not words. The prompts sit in
 * read-only text boxes (`textarea`), which are not read, and the names and upkeep lines the AI's card prints are marked
 * `lang="en"`: both stay English by design. The safety rows show here because the fixture marks them checked.
 */
const ALLOWED = new Set(['huecut', 'chatgpt', 'gemini', 'english', 'un', 'vai']);
console.log('allow-list: Huecut, ChatGPT, Gemini, English (the switch), un and vai (Intl.ListFormat), links; the prompt boxes (textarea) and the printed names and upkeep lines of the AI card (lang="en") stay English');

const SIZES = [{ width: 320, height: 640 }, { width: 375, height: 812 }] as const;
const THEMES = ['light', 'dark'] as const;
const ANALYSIS_TIMEOUT_MS = 180_000;

interface Rect { readonly l: number; readonly t: number; readonly r: number; readonly b: number }
/** One run of text as the page lays it out. */
interface TextRun {
  readonly path: string;
  /** Marked as English on purpose (`lang="en"`): what the AI's card prints. */
  readonly english: boolean;
  readonly text: string;
  readonly size: number;
  readonly ellipsis: boolean;
  readonly cutBy: string | null;
  /** Cut by the top of the screen with nothing scrolled: no way to bring it whole into view (text wholly above it, the skip link, waits for focus). */
  readonly above: boolean;
  readonly layered: boolean;
  readonly rects: readonly Rect[];
}
/** One problem: its words, and a key that names the same place in either language. */
interface Problem { readonly key: string; readonly text: string }

/** Every visible run of text in the open sheet, or the page: where it is, its words, its type size, and what cuts it off. */
const collectTexts = (): TextRun[] => {
  const scope = [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body;
  const path = (el: Element): string => {
    const parts: string[] = [];
    for (let e: Element | null = el; e && e !== document.body && parts.length < 7; e = e.parentElement) parts.unshift(`${e.tagName}.${[...e.classList].join('.')}:${String(e.parentElement ? [...e.parentElement.children].indexOf(e) : 0)}`);
    return parts.join('>');
  };
  const tiny = (el: Element): boolean => {
    for (let e: Element | null = el; e; e = e.parentElement) if (e.getBoundingClientRect().width <= 1 && e.getBoundingClientRect().height <= 1) return true;
    return false;
  };
  const clipper = (el: Element, r: DOMRect): string | null => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      const b = a.getBoundingClientRect();
      if (/hidden|clip/.test(`${s.overflowX} ${s.overflowY}`) && (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)) return path(a);
    }
    return null;
  };
  const layered = (el: Element): boolean => {
    for (let e: Element | null = el; e; e = e.parentElement) if (['fixed', 'sticky'].includes(getComputedStyle(e).position)) return true;
    return false;
  };
  const scrolled = (el: Element): boolean => {
    for (let e: Element | null = el; e; e = e.parentElement) if (e.scrollTop > 0) return true;
    return false;
  };
  const runs: TextRun[] = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    const text = node.textContent ?? '';
    if (!el || !/\p{L}/u.test(text) || el.closest('script, style, textarea, template') || !el.checkVisibility({ visibilityProperty: true }) || tiny(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1);
    const s = getComputedStyle(el);
    const ellipsis = s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
    const above = rects.some((r) => r.top < -1 && r.bottom > 1) && !scrolled(el);
    runs.push({ path: path(el), english: el.closest('[lang="en"]') !== null, text, size: parseFloat(s.fontSize), ellipsis, cutBy: rects.map((r) => clipper(el, r)).find((c) => c !== null) ?? null, above, layered: layered(el), rects: rects.map((r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom })) });
  }
  return runs;
};

/** Buttons, links set as buttons, tabs, chips and answer tiles: their size against their minimum, and whether their words fit. */
const collectControls = () => {
  const scope = [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body;
  const scrolls = (el: Element): boolean => {
    for (let a = el.parentElement; a; a = a.parentElement) if (/auto|scroll/.test(getComputedStyle(a).overflowX) && a.scrollWidth > a.clientWidth) return true;
    return false;
  };
  return [...scope.querySelectorAll<HTMLElement>('button, a[class*="button"], [role="tab"], [class*="chip"], label[class*="tile"]')]
    .filter((el) => el.checkVisibility({ visibilityProperty: true }) && el.getBoundingClientRect().width > 1)
    .map((el, i) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        key: `${el.tagName}.${[...el.classList].join('.')}#${String(i)}`, label: (el.innerText.trim() === '' ? (el.getAttribute('aria-label') ?? '') : el.innerText.trim()).slice(0, 60),
        small: r.height + 0.5 < parseFloat(s.minBlockSize) || r.width + 0.5 < parseFloat(s.minInlineSize),
        overflows: el.scrollWidth > el.clientWidth + 1 && !/auto|scroll/.test(s.overflowX),
        outside: !scrolls(el) && (r.right > innerWidth + 1 || r.left < -1),
      };
    });
};

/** A word that is plain ASCII is English: every pseudo-Latvian word carries a Latvian letter. Links are not words. */
const englishWords = (text: string): string[] =>
  text.replace(/https?:\/\/\S+/g, '').split(/[^\p{L}]+/u).filter((w) => /^[A-Za-z]+$/.test(w) && !ALLOWED.has(w.toLowerCase()));

/** Two lines of text on top of each other, more than a sliver of each; sorted by top, each line meets only those starting above its bottom. */
function overlaps(runs: readonly TextRun[]): Problem[] {
  const lines = runs.filter((r) => !r.layered).flatMap((run) => run.rects.map((rect) => ({ run, rect }))).sort((a, b) => a.rect.t - b.rect.t);
  const found: Problem[] = [];
  lines.forEach((a, i) => {
    for (const b of lines.slice(i + 1)) {
      if (b.rect.t >= a.rect.b) break;
      const w = Math.min(a.rect.r, b.rect.r) - Math.max(a.rect.l, b.rect.l);
      const h = Math.min(a.rect.b, b.rect.b) - Math.max(a.rect.t, b.rect.t);
      if (a.run !== b.run && w > 2 && h > Math.min(a.rect.b - a.rect.t, b.rect.b - b.rect.t) / 3) {
        found.push({ key: `overlap ${a.run.path} | ${b.run.path}`, text: `text on text: "${a.run.text.trim().slice(0, 60)}" and "${b.run.text.trim().slice(0, 60)}"` });
      }
    }
  });
  return found;
}

/** What one screen shows wrong now: in Latvian, English words too. */
async function audit(page: Page, latvian: boolean): Promise<Problem[]> {
  const width = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  const smallest = await page.evaluate(() => Math.min(...['--text-tab', '--text-fine'].map((t) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) * 16)));
  const runs = await page.evaluate(collectTexts);
  const controls = await page.evaluate(collectControls);
  const say = (run: TextRun): string => `"${run.text.trim().slice(0, 80)}"`;
  return [
    ...((width[0] ?? 0) > (width[1] ?? 0) ? [{ key: 'side scroll', text: `side scroll: the page is ${String(width[0])} px wide in ${String(width[1])} px` }] : []),
    ...runs.flatMap((r): Problem[] => [
      ...(latvian && !r.english && englishWords(r.text).length > 0 ? [{ key: `english ${r.path}`, text: `English: ${say(r)}` }] : []),
      ...(r.size < smallest - 0.1 ? [{ key: `type ${r.path}`, text: `type ${String(r.size)} px under the scale: ${say(r)}` }] : []),
      ...(r.ellipsis ? [{ key: `ellipsis ${r.path}`, text: `cut off with an ellipsis: ${say(r)}` }] : []),
      ...(r.cutBy === null ? [] : [{ key: `cut ${r.path}`, text: `cut off by ${r.cutBy.split('>').at(-1) ?? ''}: ${say(r)}` }]),
      ...(r.above ? [{ key: `above ${r.path}`, text: `above the top of the screen: ${say(r)}` }] : []),
    ]),
    ...overlaps(runs),
    ...controls.flatMap((c): Problem[] => [
      ...(c.small ? [{ key: `small ${c.key}`, text: `under its size: "${c.label}"` }] : []),
      ...(c.overflows ? [{ key: `wide ${c.key}`, text: `words wider than it: "${c.label}"` }] : []),
      ...(c.outside ? [{ key: `outside ${c.key}`, text: `off the screen: "${c.label}"` }] : []),
    ]),
  ];
}

/** One walk: its language, what the English walk found per screen, and what the Latvian adds. */
interface Walk { readonly latvian: boolean; readonly english: Map<string, Set<string>>; readonly found: string[] }

/** Audits the screen at each size and theme and saves its screenshot (the English one ends in `-en`); the Latvian walk keeps only what the English lacks. */
async function check(page: Page, name: string, walk: Walk): Promise<void> {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    for (const theme of THEMES) {
      await page.emulateMedia({ colorScheme: theme });
      // The new size and theme laid out and painted, and every animation that ends (a sheet rising, say) ended.
      // Only animations on the clock: a scroll-driven one ends only where the page is scrolled to; two seconds at most.
      await page.evaluate(() => Promise.race([
        Promise.all(document.getAnimations().filter((x) => x.timeline instanceof DocumentTimeline && x.effect?.getComputedTiming().endTime !== Infinity).map((x) => x.finished.catch(() => undefined))),
        new Promise((done) => setTimeout(done, 2000)),
      ]));
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const at = `${name} at ${String(size.width)} px, ${theme}`;
      const problems = await audit(page, walk.latvian);
      if (walk.latvian) {
        const added = problems.filter((p) => p.key.startsWith('english') || !walk.english.get(at)?.has(p.key)).map((p) => `${at}: ${p.text}`);
        for (const line of added) console.log(line);
        walk.found.push(...added);
      } else walk.english.set(at, new Set(problems.map((p) => p.key)));
      // A sheet as it shows; a page whole, unless it runs past twelve screens (Explore's grid), then its first screen.
      const tall = await page.evaluate(() => document.querySelector('dialog[open]') !== null || document.documentElement.scrollHeight > 12 * innerHeight);
      await page.screenshot({ path: `${shotsDir('latvian')}/${name}-${String(size.width)}-${theme}${walk.latvian ? '' : '-en'}.png`, fullPage: !tall });
      if (walk.latvian) noteScreenshot();
    }
  }
  await page.setViewportSize(SIZES[1]);
}

const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
/** The words of `english` in the walk's language. */
const say = (walk: Walk, english: string): string => (walk.latvian ? lv(english) : english);
const button = (scope: Page | Locator, walk: Walk, english: string): Locator => scope.getByRole('button', { name: say(walk, english), exact: true });

test.use({ ...PHONE, serviceWorkers: 'block' });
// Every screen four times over, in English and then in Latvian, with first-visit analysis on each goal.
test.describe.configure({ timeout: 1_200_000 });

/** The page of a walk: the English one in a context of its own, so nothing it saves reaches the Latvian walk on `page`. */
async function walkPage(browser: Browser, page: Page, latvian: boolean): Promise<Page> {
  if (!latvian) return (await browser.newContext({ ...PHONE, serviceWorkers: 'block' })).newPage();
  const counts = await plantPseudoLatvian(page);
  console.log(`pseudo-Latvian laid in: ${String(counts.strings)} strings, ${String(counts.functions)} function strings, ${String(counts.content)} content texts`);
  return page;
}

/** Runs `steps` in English, then in Latvian, and expects the Latvian to add nothing. */
async function bothWalks(browser: Browser, page: Page, steps: (page: Page, walk: Walk) => Promise<void>): Promise<void> {
  const english = new Map<string, Set<string>>();
  const base = await walkPage(browser, page, false);
  await steps(base, { latvian: false, english, found: [] });
  await base.context().close();
  const walk: Walk = { latvian: true, english, found: [] };
  await steps(await walkPage(browser, page, true), walk);
  expect(walk.found, 'what the Latvian adds to the English').toEqual([]);
}

/** Every weight the type scale uses, light and dark, from the tokens themselves. */
const WEIGHTS = [...new Set([...readFileSync(join(import.meta.dirname, '..', '..', 'src', 'ui', 'tokens.css'), 'utf8').matchAll(/--weight-[\w-]+:\s*(\d+)/g)].map((m) => m[1] ?? ''))];
const LATVIAN_LETTERS = 'āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ';
/** A planted letter in the faces' Latin Extended range that neither font draws (an IPA letter), so the check shows it can fail. */
const PLANTED = 'ʬ';

/**
 * Fonts to fall back on. Generic families differ by system (in the Linux test image `serif` and `monospace` are one CJK font that
 * draws a letter the same either way), so each letter uses the first two of these that measure it differently on their own.
 */
const FALLBACKS = ['monospace', 'serif', 'sans-serif', '"Courier New"', '"Times New Roman"', '"Liberation Mono"', '"Liberation Serif"', '"DejaVu Sans Mono"', '"DejaVu Serif"', '"FreeMono"', '"FreeSerif"'];

/** A letter the face lacks is drawn by the next family in the list: with two fallbacks that draw it differently, its width would differ. */
const missingLetters = async ({ weights, letters, fallbacks }: { readonly weights: readonly string[]; readonly letters: string; readonly fallbacks: readonly string[] }) => {
  const root = getComputedStyle(document.documentElement);
  const families = ['--font-text', '--font-display'].map((t) => root.getPropertyValue(t).split(',')[0]?.trim().replaceAll(/["']/g, '') ?? '');
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('no 2D canvas');
  const width = (font: string, letter: string): number => {
    context.font = font;
    return context.measureText(letter).width;
  };
  // A named font that is not installed measures like one that does not exist (the browser's default): it is left out.
  const sample = 'AaBbMmWw0123';
  const absent = width('40px "huecut-no-such-font"', sample);
  const installed = fallbacks.filter((f) => !f.startsWith('"') || Math.abs(width(`40px ${f}`, sample) - absent) > 0.01);
  const pairs = installed.flatMap((a, i) => installed.slice(i + 1).map((b) => [a, b] as const));
  const missing: string[] = [];
  const unmeasured: string[] = [];
  const faces: string[] = [];
  for (const family of families) {
    for (const weight of weights) {
      const loaded = await document.fonts.load(`${weight} 40px "${family}"`, letters);
      faces.push(...loaded.map((f) => `${f.family} ${f.weight} ${f.status}`));
      if (loaded.length === 0) missing.push(`${family} ${weight}: no face for these letters`);
      for (const letter of letters) {
        const pair = pairs.find(([a, b]) => Math.abs(width(`${weight} 40px ${a}`, letter) - width(`${weight} 40px ${b}`, letter)) > 0.01);
        if (!pair) unmeasured.push(`${family} ${weight}: ${letter}`);
        else if (Math.abs(width(`${weight} 40px "${family}", ${pair[0]}`, letter) - width(`${weight} 40px "${family}", ${pair[1]}`, letter)) > 0.01) missing.push(`${family} ${weight}: ${letter}`);
      }
    }
  }
  return { families, missing, unmeasured, faces: [...new Set(faces)] };
};

test('the shipped fonts draw every Latvian letter in every weight the app uses', async ({ page }) => {
  await page.goto(APP_URL);
  await expect(heading(page)).toBeVisible();
  const result = await page.evaluate(missingLetters, { weights: WEIGHTS, letters: LATVIAN_LETTERS + PLANTED, fallbacks: FALLBACKS });
  console.log(`fonts: ${result.families.join(' and ')} at weights ${WEIGHTS.join(', ')}; faces used: ${result.faces.join('; ')}`);
  expect(result.families).toHaveLength(2);
  expect(result.unmeasured, 'letters no two fallback fonts here draw differently, so the check cannot see them').toEqual([]);
  expect(result.missing.filter((m) => !m.endsWith(PLANTED)), 'Latvian letters a shipped face does not draw').toEqual([]);
  expect(result.missing.filter((m) => m.endsWith(PLANTED)), 'the planted letter, caught in every face and weight').toHaveLength(2 * WEIGHTS.length);
});

/** Explore's grid, a style, a colour and a beard, and the stylist sheet of each that has one. */
async function exploreSteps(page: Page, walk: Walk): Promise<void> {
  await page.goto(`${APP_URL}#/explore`);
  await expect(heading(page)).toHaveText(say(walk, 'Explore styles and colours'));
  await check(page, 'explore', walk);
  const items = [['style', 'frohawk', 'Frohawk'], ['colour', 'golden-blonde-foilayage', 'Golden blonde foilayage with a root shadow'], ['beard', 'beard-stubble-short', 'Short stubble']] as const;
  for (const [kind, id, name] of items) {
    await page.goto(`${APP_URL}#/explore/${kind}/${id}`);
    // The panel named for this item: a change of hash alone does not reload, so the last item's panel may still be closing.
    const panel = page.getByRole('dialog', { name: say(walk, name) });
    await expect(panel).toBeVisible();
    await check(page, `explore-${kind}`, walk);
    if (kind === 'beard') continue;
    await button(panel, walk, 'Show your stylist').click();
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await check(page, `explore-${kind}-stylist-sheet`, walk);
  }
}

/** Home, Settings, Help and Saved, then Explore. */
async function sharedSteps(page: Page, walk: Walk): Promise<void> {
  await page.goto(APP_URL);
  await expect(heading(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe(walk.latvian ? 'lv' : 'en');
  await check(page, 'home', walk);
  await button(page, walk, 'Settings').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await check(page, 'settings', walk);
  await page.keyboard.press('Escape');
  // A change of hash alone does not reload: wait for the new page's own heading, or the old page is checked again under the new name.
  for (const [route, name] of [['help', 'Help'], ['saved', 'Saved']] as const) {
    await page.goto(`${APP_URL}#/${route}`);
    await expect(heading(page)).toHaveText(say(walk, name));
    await check(page, route, walk);
  }
  await exploreSteps(page, walk);
}

test('Home, Settings, Help, Saved, and Explore with a style, a colour and a beard and their stylist sheets', async ({ browser, page }) => {
  await bothWalks(browser, page, sharedSteps);
});

/** Answers each question with its first answer, checking every question screen, until Ideas. */
async function answerAll(page: Page, goal: string, walk: Walk): Promise<void> {
  const legend = (): Promise<string> => page.locator('main fieldset legend').first().innerText().catch(() => '');
  const atIdeas = async (): Promise<boolean> => (await heading(page).innerText()) === say(walk, 'Your ideas');
  for (let n = 1; n < 40; n++) {
    if (await atIdeas()) return;
    const asked = await legend();
    await check(page, `${goal}-question-${String(n)}`, walk);
    // Past the question's arrival, when a tap counts.
    await page.waitForTimeout(400);
    await page.locator('main fieldset label').first().click();
    // A question that takes several answers goes on by Next, or by Continue on the last one.
    const next = button(page, walk, 'Next question').or(button(page, walk, 'Continue'));
    if ((await legend()) === asked && (await next.isVisible())) await next.click();
    await expect.poll(async () => (await atIdeas()) || (await legend()) !== asked).toBe(true);
  }
  throw new Error('the questions never reached Ideas');
}

/** The photo, the face card and the goal, to the first question. */
async function photoSteps(page: Page, goal: 'Cut' | 'Colour' | 'Both', walk: Walk): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/photo`);
  await expect(heading(page)).toHaveText(say(walk, 'Add your photo'));
  if (goal === 'Cut') await check(page, 'photo', walk);
  await page.locator('input[type=file]').first().setInputFiles(FACE);
  await button(page, walk, 'Continue').click();
  await expect(heading(page)).toHaveText(say(walk, 'Your face card'));
  await expect(page.locator('canvas[role="img"]')).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  if (goal === 'Cut') await check(page, 'face', walk);
  await button(page, walk, 'Choose what to change').click();
  await expect(heading(page)).toHaveText(say(walk, 'Your goal'));
  await page.getByText(say(walk, goal), { exact: true }).click();
  await page.getByText(say(walk, "Women's styles"), { exact: true }).click();
  await check(page, `${goal.toLowerCase()}-goal`, walk);
  await button(page, walk, 'Continue').click();
  await expect(heading(page)).toHaveText(say(walk, 'A few questions'));
}

/** One goal's walk: the photo to the questions, every question, the ideas, a look's detail, its stylist sheet and Try it on. */
const goalSteps = (goal: 'Cut' | 'Colour' | 'Both') => async (page: Page, walk: Walk): Promise<void> => {
  const g = goal.toLowerCase();
  await photoSteps(page, goal, walk);
  await answerAll(page, g, walk);
  await check(page, `${g}-ideas`, walk);
  const more = page.locator('main details summary').first();
  if (await more.isVisible()) {
    await more.click();
    await check(page, `${g}-look-detail`, walk);
  }
  await button(page, walk, 'Show your stylist').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await check(page, `${g}-stylist-sheet`, walk);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await button(page, walk, 'Try them on').click();
  await expect(heading(page)).toHaveText(say(walk, 'Try it on'));
  await check(page, `${g}-try-on`, walk);
};

for (const goal of ['Cut', 'Colour', 'Both'] as const) {
  test(`${goal}: the photo, the face card, every question, the ideas, a look's detail and its stylist sheet, and Try it on`, async ({ browser, page }) => {
    test.skip(!(await capabilities(page)).workerWebGL, 'Capability probe: no OffscreenCanvas with WebGL in a worker, so the face tools cannot run in this browser');
    await bothWalks(browser, page, goalSteps(goal));
  });
}
