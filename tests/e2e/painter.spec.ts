/**
 * The painter in the browser on the test-only check page
 * (`tests/harness/painter-check.html` under `vite dev`, so without the build-only CSP): the face card of a fictional face, its two-tone
 * line pixels on screen and on the export, the mirror trace, the theme read at paint time, the canvas's accessible name,
 * and the exports: 2160 x 2700, JPEG at quality 0.92 by magic bytes, with no EXIF or other metadata.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, noteScreenshot, test } from './guard.ts';
import { DEV_ORIGIN } from './server.ts';
import { shotsDir } from './shots.ts';

const PAGE_URL = `${DEV_ORIGIN}/huecut/tests/harness/painter-check.html`;
/** The design token values: line core and casing (the same in both themes), and the grounds. */
const CORE = [0xff, 0xf6, 0xf3, 255];
const CASING = [0x3d, 0x24, 0x20, 255];
const GROUND_LIGHT = [0xfb, 0xed, 0xea, 255];
const GROUND_DARK = [0x23, 0x18, 0x16, 255];

interface Probe { readonly x: number; readonly core: number[]; readonly casing: number[] }
interface Exported {
  readonly base64: string;
  readonly mime: string;
  readonly width: number;
  readonly height: number;
  readonly probe: number[][];
  readonly samples: number[][];
  readonly offscreen: boolean;
}
type Kind = 'card' | 'sheet' | 'board';
interface Check {
  readonly probes: { readonly export: Probe; readonly screen: Probe };
  readonly screen: (x: number, rows: readonly number[]) => number[][];
  readonly exportFile: (kind: Kind, points?: readonly { x: number; y: number }[]) => Promise<Exported>;
  readonly referenceJpeg: (quality: number) => Promise<string>;
  readonly fonts: () => Promise<{ wanted: string[]; missing: string[]; loaded: boolean[]; element: number; offscreen: number | null; fallback: number }>;
}
type Win = Window & { readonly __painterCheck: Check };
/** When the replayed trace started and ended (page clock), how often it started, and the lip line's core rows 300 ms in. */
interface TraceMarks { playing: number; done: number; plays: number; early: number[][] }
/** A realistic bound on the trace: its cap is 1600 ms, and an end a frame or two later in WebKit (1716-1726 ms measured) is not noticed. */
const TRACE_ENDS_WITHIN_MS = 2_500;
/** Long enough after the end to see a second start, if there were one. */
const AFTER_END_MS = 500;
type TraceWin = Window & { __trace: Promise<TraceMarks> };

test.use({ deviceScaleFactor: 2, viewport: { width: 520, height: 1000 } });

const shots = (): string => shotsDir('painter');
const near = (a: readonly number[] | undefined, b: readonly number[], tolerance: number): boolean =>
  a?.length === b.length && a.every((v, i) => Math.abs(v - (b[i] ?? 0)) <= tolerance);

async function open(page: Page, query = ''): Promise<Probe> {
  await page.goto(PAGE_URL + query);
  await expect(page.locator('body')).toHaveAttribute('data-ready', /^(true|failed)$/);
  const error = await page.locator('body').getAttribute('data-error');
  expect(error, 'the check page failed to start').toBeNull();
  return page.evaluate(() => (window as unknown as Win).__painterCheck.probes.screen);
}
const screenRows = (page: Page, x: number, rows: readonly number[]) =>
  page.evaluate(([px, ys]) => (window as unknown as Win).__painterCheck.screen(px, ys), [x, rows] as const);
/** True once the probe's core rows show the core colour and its casing rows the casing colour, exactly (±1). */
const complete = async (page: Page, probe: Probe): Promise<boolean> => {
  const [core, casing] = [await screenRows(page, probe.x, probe.core), await screenRows(page, probe.x, probe.casing)];
  const all = (rows: number[][], expected: readonly number[], count: number) => rows.length === count && rows.every((p) => near(p, expected, 1));
  return all(core, CORE, probe.core.length) && all(casing, CASING, probe.casing.length);
};

test('paints the two-tone line on screen: whole device rows of core and casing, at a pixel ratio of 2', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const probe = await open(page);
  await expect.poll(() => complete(page, probe)).toBe(true);
  const root = page.locator('[data-trace]');
  await expect(root).toHaveAttribute('data-trace', 'done');
  const [core, casing] = [await screenRows(page, probe.x, probe.core), await screenRows(page, probe.x, probe.casing)];
  console.log(`screen probe x=${String(probe.x)} core rows ${probe.core.join(',')} = ${JSON.stringify(core)}; casing rows ${probe.casing.join(',')} = ${JSON.stringify(casing)}`);
  const canvas = page.getByRole('img', { name: 'The face card of a fictional face' });
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((c: HTMLCanvasElement) => [c.width, c.height, c.getBoundingClientRect().width])).toEqual([864, 1080, 432]);
  await page.locator('main').screenshot({ path: join(shots(), 'card-light.png') });
  noteScreenshot();
});

/** Notes when the trace starts and ends, every start, and the lip line's core rows 300 ms in, from the first frame of the page. */
const TRACE_MARKS = (afterEndMs: number): void => {
  const marks = { playing: 0, done: 0, plays: 0, early: [] as number[][] };
  let last: string | null | undefined = null;
  (window as unknown as TraceWin).__trace = new Promise((resolve) => {
    new MutationObserver(() => {
      const state = document.querySelector('[data-trace]')?.getAttribute('data-trace');
      if (state === 'playing' && last !== 'playing') marks.plays += 1;
      last = state;
      if (state === 'playing' && marks.playing === 0) {
        marks.playing = performance.now();
        setTimeout(() => {
          const check = (window as unknown as Win).__painterCheck;
          marks.early = check.screen(check.probes.screen.x, check.probes.screen.core);
        }, 300);
      } else if (state === 'done' && marks.playing > 0 && marks.done === 0) {
        marks.done = performance.now();
        setTimeout(() => { resolve(marks); }, afterEndMs);
      }
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-trace'] });
  });
};

test('plays the mirror trace once, ends within 2.5 s, and any key finishes it', async ({ page }) => {
  await page.addInitScript(TRACE_MARKS, AFTER_END_MS);
  const probe = await open(page);
  const t = await page.evaluate(() => (window as unknown as TraceWin).__trace);
  console.log(`trace: ${String(Math.round(t.done - t.playing))} ms from playing to done; lip core at +300 ms ${JSON.stringify(t.early)}`);
  expect(t.early.some((p) => !near(p, CORE, 1))).toBe(true);
  expect(t.plays, 'it plays once').toBe(1);
  expect(t.done - t.playing).toBeGreaterThanOrEqual(1500);
  expect(t.done - t.playing).toBeLessThanOrEqual(TRACE_ENDS_WITHIN_MS);
  expect(await complete(page, probe)).toBe(true);
  await open(page);
  await expect(page.locator('[data-trace]')).toHaveAttribute('data-trace', 'playing');
  // A key pressed while the trace is under way, as a person does: in WebKit the first frame can come before the listener (an effect after paint).
  await page.waitForTimeout(300);
  await page.keyboard.press('Shift');
  await expect(page.locator('[data-trace]')).toHaveAttribute('data-trace', 'done', { timeout: 300 });
  await expect.poll(() => complete(page, probe), { timeout: 300 }).toBe(true);
});

test('is complete at once under reduced motion, from the device or from the in-app setting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const probe = await open(page);
  await expect.poll(() => complete(page, probe), { timeout: 2000 }).toBe(true);
  await page.locator('main').screenshot({ path: join(shots(), 'card-reduced-motion.png') });
  noteScreenshot();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // An init script can run before <html> exists (it threw here, so the setting never applied): set it as soon as it does.
  await page.addInitScript(() => {
    const apply = (): boolean => {
      const root = document.documentElement as HTMLElement | null;
      if (root) root.dataset.motion = 'reduce';
      return root !== null;
    };
    if (!apply()) new MutationObserver((_, observer) => { if (apply()) observer.disconnect(); }).observe(document, { childList: true });
  });
  await open(page);
  await expect(page.locator('[data-trace]')).toHaveAttribute('data-trace', 'done', { timeout: 500 });
  await expect.poll(() => complete(page, probe), { timeout: 2000 }).toBe(true);
});

test('follows the theme at paint time', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const probe = await open(page);
  await expect.poll(() => complete(page, probe)).toBe(true);
  expect(near((await screenRows(page, 2, [2]))[0], GROUND_LIGHT, 1)).toBe(true);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect.poll(async () => near((await screenRows(page, 2, [2]))[0], GROUND_DARK, 1)).toBe(true);
  expect(await complete(page, probe)).toBe(true);
  await page.locator('main').screenshot({ path: join(shots(), 'card-dark.png') });
  noteScreenshot();
});

/**
 * The JPEG's header segments from SOI up to the start of scan: each marker, the identifier of each APPn segment (the
 * NUL-terminated name it starts with: `JFIF`, `Exif`, `ICC_PROFILE`, an XMP namespace), each DQT payload, and the size.
 */
function jpegSegments(bytes: Buffer): { markers: number[]; apps: string[]; dqt: string[]; size: [number, number] | null } {
  const markers: number[] = [];
  const apps: string[] = [];
  const dqt: string[] = [];
  let size: [number, number] | null = null;
  for (let i = 2; i + 4 <= bytes.length && bytes[i] === 0xff; ) {
    const marker = bytes[i + 1] ?? 0;
    const length = bytes.readUInt16BE(i + 2);
    markers.push(marker);
    if (marker >= 0xe0 && marker <= 0xef) {
      const payload = bytes.subarray(i + 4, i + 2 + length);
      apps.push(`APP${String(marker - 0xe0)}:${payload.toString('latin1', 0, Math.max(0, payload.indexOf(0)))}`);
    }
    if (marker === 0xdb) dqt.push(bytes.subarray(i + 4, i + 2 + length).toString('hex'));
    if (marker === 0xc0 || marker === 0xc2) size = [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)];
    if (marker === 0xda) break;
    i += 2 + length;
  }
  return { markers, apps, dqt, size };
}
const exportOf = (page: Page, kind: Kind, points: { x: number; y: number }[] = []) =>
  page.evaluate(([k, p]) => (window as unknown as Win).__painterCheck.exportFile(k, p), [kind, points] as const);
/** Just below the sheet's AI picture frame (x 1578-2040, foot at y 840), where an overflowing tag would show. */
const BELOW_AI_PICTURE = [{ x: 1700, y: 843 }, { x: 1900, y: 852 }];

test('exports the card, the stylist sheet and the board as 2160 x 2700 JPEGs at quality 0.92 with no EXIF', async ({ page }) => {
  await open(page, '?play=0');
  const reference = (q: number) => page.evaluate((quality) => (window as unknown as Win).__painterCheck.referenceJpeg(quality), q);
  const [q92, q80] = await Promise.all([reference(0.92), reference(0.8)]).then((r) => r.map((b) => jpegSegments(Buffer.from(b, 'base64')).dqt));
  expect(q92).not.toEqual(q80);
  for (const kind of ['card', 'sheet', 'board'] as const) {
    const jpeg = await exportOf(page, kind, kind === 'sheet' ? BELOW_AI_PICTURE : []);
    const bytes = Buffer.from(jpeg.base64, 'base64');
    writeFileSync(join(shots(), `export-${kind}.jpg`), bytes);
    const { markers, apps, dqt, size } = jpegSegments(bytes);
    console.log(`${kind}: JPEG ${String(bytes.length)} bytes, markers ${markers.map((m) => m.toString(16)).join(' ')}, ${apps.join(' ')}`);
    expect(jpeg.mime).toBe('image/jpeg');
    expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    expect(size).toEqual([2160, 2700]);
    expect([jpeg.width, jpeg.height]).toEqual([2160, 2700]);
    // No APP1 (EXIF or XMP) and no comment; the only application segments are the JFIF header and the encoder's
    // colour profile, which carry no camera, location or personal data.
    expect(markers.filter((m) => m === 0xe1 || m === 0xfe)).toEqual([]);
    expect(apps.filter((a) => a !== 'APP0:JFIF' && a !== 'APP2:ICC_PROFILE')).toEqual([]);
    expect(dqt).toEqual(q92);
    // The card's eye line: its three core rows and the casing row each side, through JPEG's loss.
    if (kind === 'card') {
      expect(jpeg.probe.slice(0, 3).every((p) => near(p, CORE, 24))).toBe(true);
      expect(jpeg.probe.slice(3).every((p) => near(p, CASING, 48))).toBe(true);
    }
    if (kind === 'sheet') expect(jpeg.samples.every((p) => near(p, GROUND_LIGHT, 4))).toBe(true);
  }
});

test('loads every font weight before painting, and the offscreen export measures text as the page does', async ({ page }) => {
  await open(page, '?play=0');
  const fonts = await page.evaluate(() => (window as unknown as Win).__painterCheck.fonts());
  const faces = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`));
  console.log(`fonts ${fonts.wanted.join(' | ')}; missing [${fonts.missing.join(' | ')}]; faces ${faces.join(', ')}`);
  console.log(`widths: page canvas ${String(fonts.element)}, offscreen ${String(fonts.offscreen)}, fallback face ${String(fonts.fallback)}`);
  expect(fonts.wanted.length).toBeGreaterThanOrEqual(4);
  expect(fonts.missing).toEqual([]);
  expect(fonts.loaded.every(Boolean)).toBe(true);
  expect(fonts.fallback).not.toBe(fonts.element);
  // Where there is no OffscreenCanvas (WebKit on Windows) the export paints on a detached page canvas, as the screen does.
  if (fonts.offscreen === null) console.log('no OffscreenCanvas in this browser: exports painted on a detached page canvas');
  else expect(fonts.offscreen).toBe(fonts.element);
});
