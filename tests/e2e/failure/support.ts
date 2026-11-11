/**
 * Shared by the failure specs: the way to the lines on a real photo, the skip where the probe finds no face
 * tools, held model requests, faults planted inside the real worker, and the browser's own report of a failure a test injected.
 */
import { join } from 'node:path';
import type { Locator, Page, Worker } from '@playwright/test';
import manifest from '../../../models.manifest.json' with { type: 'json' };
import { expect, requires, type Guard } from '../guard.ts';
import { APP_URL } from '../server.ts';

const FACES = join(import.meta.dirname, '..', '..', 'fixtures', 'faces');
/** Fictional fixtures: one clear face, and a second person. */
export const FACE = join(FACES, 'one-face-salon-straight-wavy.jpg');
export const OTHER_FACE = join(FACES, 'one-face-barbering-straight-wavy.jpg');
/** A hidden hairline makes the automatic outline unsure, so the face card offers both extras. */
export const HIDDEN_HAIRLINE = join(FACES, 'fringe-hidden-hairline.jpg');
/** A phone: `screen` too, because the device class reads the screen and the project's desktop device says 1920 x 1080. */
export const PHONE = { viewport: { width: 375, height: 812 }, screen: { width: 375, height: 812 }, isMobile: true, hasTouch: true };
/** First visit: the core tools come from the preview server, then one analysis. */
export const ANALYSIS_TIMEOUT_MS = 180_000;
/** The line Photo shows after a reload with nothing kept. */
export const RELOADED = 'No photo is open here.';

/** The screen's one level-1 heading. */
export const heading = (page: Page): Locator => page.getByRole('heading', { level: 1 });
/** A button by its exact name. */
export const button = (scope: Page | Locator, name: string): Locator => scope.getByRole('button', { name, exact: true });
/** The lines drawn on the photo, on the face card. */
export const drawing = (page: Page): Locator => page.locator('canvas[role="img"]');
/** The row of the photo list that shows this file name. */
export const photoRow = (page: Page, fileName: string): Locator => page.locator('fieldset li', { hasText: fileName });

/** The photo's row has left the queue with a result; a clear fixture can still carry hints (a close-up, say), so the words vary. */
export const expectAnalysed = (page: Page, fileName: string): Promise<void> =>
  expect
    .poll(() => photoRow(page, fileName).locator('p').first().innerText(), { timeout: ANALYSIS_TIMEOUT_MS, intervals: [100, 250, 500] })
    .not.toMatch(/^(Waiting to be analysed|Finding face points|Not analysed yet|This photo could not be analysed)/);

/** Changes the route the way a link does: an in-page URL change, so nothing is reloaded. */
export const go = (page: Page, hash: string): Promise<void> =>
  page.evaluate((h) => {
    window.location.hash = h;
  }, hash);

/** A test that needs real analysis skips where the probe finds no OffscreenCanvas with WebGL in a worker. */
export const needsAnalysis = (page: Page): Promise<void> => requires(page, 'workerWebGL');

/** Opens My look on Photo, from a new page. */
export async function openPhoto(page: Page): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/photo`);
  await expect(heading(page)).toHaveText('Add your photo');
}

/** Adds photos through the file input, as Choose photos does. */
export const addPhotos = (page: Page, files: Parameters<Locator['setInputFiles']>[0]): Promise<void> =>
  page.locator('input[type=file]').first().setInputFiles(files);

/** Photo to the face card on a real photo, until the lines are drawn from the real analysis. */
export async function toLines(page: Page, file: string = FACE): Promise<void> {
  await openPhoto(page);
  await addPhotos(page, file);
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('Your face card');
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
}

/** Goal and collection by pointer, from a session started on answers only, to the question screen. */
export async function answersToQuestions(page: Page, goal: 'Cut' | 'Colour' | 'Both'): Promise<void> {
  await page.goto(`${APP_URL}#/my-look/goal?source=answers`);
  await expect(heading(page)).toHaveText('Your goal');
  await chooseGoal(page, goal);
}

/** The goal and "Women's styles", then Continue. */
export async function chooseGoal(page: Page, goal: 'Cut' | 'Colour' | 'Both'): Promise<void> {
  await page.getByText(goal, { exact: true }).click();
  await page.getByText("Women's styles", { exact: true }).click();
  await button(page, 'Continue').click();
  await expect(heading(page)).toHaveText('A few questions');
}

/** The manifest files whose path matches, by the hash that names them on the server. */
const hashesOf = (path: RegExp): string[] => manifest.files.filter((f) => path.test(f.path)).map((f) => f.sha256);
/** The core tools' files (the WASM and the four models), by manifest path. */
export const CORE_FILES = manifest.files.filter((f) => f.path.startsWith('mediapipe/'));

/** True for a request of one of the manifest files whose path matches. */
export const isModelRequest = (path: RegExp): ((url: string) => boolean) => {
  const hashes = hashesOf(path);
  return (url) => hashes.some((h) => url.includes(h));
};

/** A named failure: every request for those model files stays open with no response until `release()`. */
export async function holdModel(page: Page, path: RegExp): Promise<{ readonly release: () => void; readonly held: () => number }> {
  const isHeld = isModelRequest(path);
  let count = 0;
  let open = (): void => undefined;
  const gate = new Promise<void>((done) => {
    open = done;
  });
  await page.route(
    (url) => isHeld(url.href),
    async (route) => {
      count++;
      await gate;
      await route.continue().catch(() => undefined);
    },
  );
  return { release: () => { open(); }, held: () => count };
}

/** The analysis worker of this page, once it exists. */
export async function analysisWorker(page: Page): Promise<Worker> {
  await expect.poll(() => page.workers().length).toBeGreaterThan(0);
  const worker = page.workers()[0];
  if (!worker) throw new Error('the analysis worker is gone');
  return worker;
}

type DecodeHook = 'crash' | 'hold';
interface WorkerScope {
  createImageBitmap: typeof createImageBitmap;
  ImageDecoder: unknown;
  setTimeout: typeof setTimeout;
  releaseDecode?: () => void;
  decoded?: boolean;
}

/**
 * Plants a fault at the next photo decode in the worker, which only analysis does, so it lands mid-analysis with no race:
 * `crash` raises a real uncaught error while the decode is under way; `hold` keeps the decode waiting until
 * `releaseDecode()` and then records `decoded`.
 */
export const onNextDecode = (worker: Worker, hook: DecodeHook): Promise<void> =>
  worker.evaluate((kind) => {
    const scope = self as unknown as WorkerScope;
    const [bitmap, decoder] = [scope.createImageBitmap, scope.ImageDecoder];
    const restore = (): void => {
      scope.createImageBitmap = bitmap;
      scope.ImageDecoder = decoder;
    };
    const held = new Promise<void>((done) => {
      scope.releaseDecode = done;
    });
    const planted = async (): Promise<void> => {
      restore();
      if (kind === 'crash') {
        scope.setTimeout(() => {
          throw new Error('planted crash during analysis');
        }, 0);
        return;
      }
      await held;
      scope.decoded = true;
    };
    scope.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      await planted();
      return bitmap(...args);
    }) as typeof createImageBitmap;
    // WebCodecs takes the large JPEGs: without it the decode falls back to `createImageBitmap`, planted above.
    scope.ImageDecoder = new Proxy(decoder as object, {
      construct(target, args: unknown[]) {
        void planted();
        return Reflect.construct<unknown[], object>(target as new (...a: unknown[]) => object, args);
      },
    });
  }, hook);

/** Takes out of the guard's list the lines the browser reports because this test injected that failure; the guard checks the rest. */
export function dropReported(guard: Guard, expected: RegExp): void {
  const rest = guard.errors.filter((e) => !expected.test(e));
  guard.errors.length = 0;
  guard.errors.push(...rest);
}
