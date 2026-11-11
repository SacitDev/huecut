/**
 * Test support of real-content.spec.ts: the shipped records, a kept session of real looks restored at Ideas, and the checks on a saved
 * picture (a clean JPEG of the export size, each reference tile showing its own look's library picture).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import sharp from 'sharp';
import type { SessionData } from '../../src/domain/session/session-data.ts';
import { sessionAt } from '../machine/consult.fakes.ts';
import { capabilities, expect } from './guard.ts';
import { APP_URL } from './server.ts';
import { keepSession } from './try-on-support.ts';

const app = resolve(import.meta.dirname, '..', '..');
interface Rec { readonly id: string; readonly name: string; readonly prompt_spec: string; readonly base?: { readonly on_words?: readonly string[] } }
const readJson = (file: string): unknown => JSON.parse(readFileSync(join(app, 'content', file), 'utf8'));
/** Every shipped cut. */
export const CUTS = readdirSync(join(app, 'content', 'haircuts')).flatMap((f) => readJson(`haircuts/${f}`) as Rec[]);
/** Every shipped colour look. */
export const LOOKS = readJson('colours/looks.json') as Rec[];
/** Words as the prompt builder counts them. */
export const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;
/** The record with the longest prompt spec. */
export function longestSpec(list: readonly Rec[]): Rec {
  const longest = [...list].sort((a, b) => words(b.prompt_spec) - words(a.prompt_spec))[0];
  if (!longest) throw new Error('no real content');
  return longest;
}
const FACES = join(app, 'tests', 'fixtures', 'faces');
const PHOTO = readFileSync(join(FACES, 'one-face-salon-straight-wavy.jpg'));
/** Six fictional pictures for the Board's slots. */
export const PICTURES = ['one-face-salon-straight-wavy', 'one-face-salon-curly-coily', 'one-face-barbering-straight-wavy', 'one-face-barbering-curly-coily', 'far-1-5m', 'older-grey'].map((n) => join(FACES, `${n}.jpg`));

/** The screen's one level-1 heading. */
export const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
/** Chooses a Try it on tab. */
export const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click();
/** Every prompt's text on the screen, also the ones folded under "Show the prompt". */
export const promptsOn = (page: Page): Promise<string[]> => page.locator('textarea').evaluateAll((els) => els.map((e) => (e as HTMLTextAreaElement).value));
/** Clicks the words, as a person taps an option tile. */
export const say = (page: Page, text: string) => page.getByText(text, { exact: true }).click();
/** Resolves once no animation runs but a wait's endless line, which ends only with its wait: for a screenshot or axe. */
export const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));

/** A kept session of real looks, restored at Ideas (the engine picks what it would for these answers). */
export async function open(page: Page, over: Partial<SessionData>): Promise<void> {
  await page.goto(`${APP_URL}#/`);
  await keepSession(page, sessionAt('ideas', { savedAt: Date.now(), ...over }), PHOTO);
  await page.goto(`${APP_URL}#/my-look/ideas`);
  await expect(heading(page)).toHaveText('Your ideas');
}
/** The step and tab the kept session has stored; it is written after a short quiet spell, so a test waits for it before a reload. */
export const storedPlace = (page: Page): Promise<string> =>
  page.evaluate(async () => {
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const db = await settle(indexedDB.open('huecut', 1));
    const kept = await settle(db.transaction('session').objectStore('session').get('current') as IDBRequest<{ data: { step: string; prefs: { tab?: string } } } | undefined>);
    db.close();
    return `${kept?.data.step ?? ''}/${kept?.data.prefs.tab ?? ''}`;
  });

/** A session's preferences. */
export const prefs = (goal: 'cut' | 'both', count: number): SessionData['prefs'] => ({ goal, collections: ['salon'], count });

/** "Try them on", until the tabs show. */
export async function toTryOn(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Try them on' }).click();
  await expect(heading(page)).toHaveText('Try it on');
  await expect(page.getByRole('tablist', { name: 'Ways to try your looks' })).toBeVisible();
}
/** The browser's Back, onto Ideas. */
export async function backToIdeas(page: Page): Promise<void> {
  await page.goBack();
  await expect(heading(page)).toHaveText('Your ideas');
}

/** What a press downloaded. */
export async function downloaded(page: Page, press: () => Promise<void>): Promise<{ readonly name: string; readonly bytes: Buffer }> {
  const [download] = await Promise.all([page.waitForEvent('download'), press()]);
  return { name: download.suggestedFilename(), bytes: readFileSync(await download.path()) };
}

/** A JPEG of exactly the export size, with no EXIF block. */
export async function expectCleanExport(bytes: Buffer): Promise<void> {
  const meta = await sharp(bytes).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(['jpeg', 2160, 2700]);
  expect(meta.exif).toBeUndefined();
  expect(bytes.includes(Buffer.from('Exif\0\0'))).toBe(false);
}

/** A tile's picture on the sheet for 6 tiles (the board layout): the library pictures are 3:4, whole in the 4:5 frame, so they fill its height. */
function tileRect(i: number) {
  const [columns, rows, gap, nameH] = [3, 2, 32, 110];
  const cellH = (2200 - (rows - 1) * gap) / rows;
  const width = Math.min((1920 - (columns - 1) * gap) / columns, (cellH - nameH) * 0.8);
  const height = width / 0.8;
  const left = 120 + (1920 - (columns * width + (columns - 1) * gap)) / 2;
  const drawn = height * 0.75;
  return { left: Math.round(left + (i % columns) * (width + gap) + (width - drawn) / 2), top: Math.round(260 + Math.floor(i / columns) * (height + nameH + gap)), width: Math.floor(drawn), height: Math.round(height) };
}

/** Each tile on the sheet is nearest to its own look's library picture of all six: the pictures are real, and in the prompt's order. */
export async function expectSheetPictures(bytes: Buffer, keys: readonly string[]): Promise<void> {
  const size = 40;
  const expected = await Promise.all(keys.map((k) => sharp(join(app, 'public', 'library', `${k}-480.avif`)).resize(size, size, { fit: 'fill' }).removeAlpha().raw().toBuffer()));
  for (const [i] of keys.entries()) {
    const shown = await sharp(bytes).extract(tileRect(i)).resize(size, size, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const distances = expected.map((e) => e.reduce((sum, v, k) => sum + Math.abs(v - (shown[k] ?? 0)), 0) / e.length);
    expect(distances.indexOf(Math.min(...distances)), `tile ${String(i + 1)} shows its own look (${distances.map((d) => d.toFixed(1)).join(', ')})`).toBe(i);
  }
}

/** Where the probe finds no AVIF decode, no sheet can be painted from the library's AVIF files: the app says so and offers no blank sheet. */
const NO_SHEET = 'The reference sheet could not be made in this browser. One by one still works.';

/** Presses the card's download, once its sheet is painted, and returns the reference sheet; where it cannot be made, proves the app says so. */
export async function sheetOf(page: Page, scope: Locator | Page = page): Promise<Buffer | null> {
  const press = scope.getByRole('button', { name: 'Download reference sheet' }).first();
  if (!(await capabilities(page)).avif) {
    await expect(scope.getByText(NO_SHEET).first()).toBeVisible({ timeout: 60_000 });
    await expect(press).toHaveAttribute('aria-disabled', 'true');
    return null;
  }
  await expect(press).not.toHaveAttribute('aria-busy', 'true', { timeout: 60_000 });
  return (await downloaded(page, () => press.click())).bytes;
}

/** No WCAG 2.2 AA violation that axe can see, with the page at rest. */
export async function axeClean(page: Page, where: string): Promise<void> {
  // At the end of the page the phone's action bar rests below the content, so axe's target size does not count it as covering anything.
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  await settled(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe on ${where}`).toEqual([]);
}
