/**
 * Try it on's tabs on the real content: All together paints each plan's reference sheet once, however often the person
 * comes back, and a paint left behind stops between pictures; the tab control leaves browser shortcuts alone, stays readable in forced
 * colours and is big enough on a phone.
 */
import type { Locator, Page } from '@playwright/test';
import sharp from 'sharp';
import { answersToQuestions, button, heading } from './failure/support.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';

interface Counts { encodes: number; made: number; closed: number }
type Counted = typeof globalThis & { counts: Counts; sheetAsked: string[] };

/**
 * Counts each encoded picture and each bitmap made and closed, and lists the library pictures the sheet asks for: it loads them through
 * `new Image()`, where the screen's own pictures are elements of the page.
 */
const countPaints = (page: Page): Promise<unknown> =>
  page.addInitScript(() => {
    const counts: Counts = { encodes: 0, made: 0, closed: 0 };
    const scope = window as unknown as Counted;
    scope.counts = counts;
    scope.sheetAsked = [];
    const made = new WeakSet<HTMLImageElement>();
    const RealImage = window.Image;
    Reflect.set(window, 'Image', function Image(width?: number, height?: number) { const image = new RealImage(width, height); made.add(image); return image; });
    const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...src, set(this: HTMLImageElement, value: string) { src?.set?.call(this, value); if (made.has(this)) scope.sheetAsked.push(this.src); } });
    type Encode = OffscreenCanvas['convertToBlob'];
    const encode = Reflect.get<OffscreenCanvas, 'convertToBlob'>(OffscreenCanvas.prototype, 'convertToBlob');
    Reflect.set(OffscreenCanvas.prototype, 'convertToBlob', function counted(this: OffscreenCanvas, ...args: Parameters<Encode>) {
      counts.encodes += 1;
      return encode.apply(this, args);
    });
    const make = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (...args: Parameters<typeof make>) => {
      const bitmap = await make(...args);
      counts.made += 1;
      const close = bitmap.close.bind(bitmap);
      bitmap.close = () => { counts.closed += 1; close(); };
      return bitmap;
    }) as typeof createImageBitmap;
  });
/** The sheet is painted from the library's AVIF files, and these tests count OffscreenCanvas encodes (a browser with one in a worker has one on the page). */
const paints = (page: Page): Promise<void> => requires(page, 'avif', 'workerWebGL');
const counts = (page: Page): Promise<Counts> => page.evaluate(() => ({ ...(window as unknown as Counted).counts }));
/** The library pictures the sheet has asked for so far. */
const sheetAsked = (page: Page): Promise<string[]> => page.evaluate(() => [...(window as unknown as Counted).sheetAsked]);
const tab = (page: Page, name: string): Locator => page.getByRole('tab', { name, exact: true });
const sheetReady = (page: Page): Promise<void> => expect(button(page, 'Download reference sheet').first()).toBeVisible({ timeout: 60_000 });

async function toTryOn(page: Page): Promise<void> {
  await answersToQuestions(page, 'Both');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await button(page, 'Try them on').click();
  await expect(heading(page)).toHaveText('Try it on');
}

test('the reference sheet is painted once per plan from the 960 px files, and coming back paints and fetches nothing', async ({ page }) => {
  await paints(page);
  await countPaints(page);
  await toTryOn(page);
  await sheetReady(page);
  const plans = await button(page, 'Download reference sheet').count();
  const first = await counts(page);
  const fetched = await sheetAsked(page);
  expect(first.encodes, 'one paint per plan').toBe(plans);
  expect(fetched.length).toBeGreaterThan(0);
  expect(fetched.filter((url) => !url.endsWith('-960.avif')), 'a tile under 960 px wide needs no larger file').toEqual([]);
  const seen = fetched.length;
  for (let round = 0; round < 3; round++) {
    await tab(page, 'One by one').click();
    await expect(tab(page, 'One by one')).toHaveAttribute('aria-selected', 'true');
    await tab(page, 'All together').click();
    await sheetReady(page);
  }
  expect(await counts(page), 'three returns repaint nothing').toEqual(first);
  expect(await sheetAsked(page), 'three returns fetch nothing').toHaveLength(seen);
  expect(first.closed, 'every bitmap is closed').toBe(first.made);
});

test.describe('with the pictures held', () => {
  // `page.route` does not see what a service worker fetches.
  test.use({ serviceWorkers: 'block' });

  test('a paint left behind stops between pictures and encodes nothing; coming back paints it once', async ({ page }) => {
    await paints(page);
    await countPaints(page);
    let release = (): void => undefined;
    const gate = new Promise<void>((done) => { release = done; });
    let asked = 0;
    await page.route(/\/library\/.*\.avif$/, async (route) => {
      if (!(await sheetAsked(page)).includes(route.request().url())) { await route.fallback(); return; }
      asked += 1;
      await gate;
      await route.continue();
    });
    await toTryOn(page);
    await expect.poll(() => asked).toBe(1);
    await tab(page, 'One by one').click();
    await expect(tab(page, 'One by one')).toHaveAttribute('aria-selected', 'true');
    release();
    await page.waitForTimeout(1500);
    const left = await counts(page);
    expect(left.encodes, 'nothing is encoded for a tab that was left').toBe(0);
    expect(asked, 'no further picture is fetched').toBe(1);
    expect(left.closed).toBe(left.made);
    await tab(page, 'All together').click();
    await sheetReady(page);
    expect((await counts(page)).encodes).toBe(1);
  });
});

test('the tabs leave browser shortcuts alone, and the panel can take focus', async ({ page }) => {
  await toTryOn(page);
  await tab(page, 'One by one').click();
  await tab(page, 'One by one').focus();
  for (const key of ['Alt+ArrowLeft', 'Control+End', 'Meta+ArrowRight']) {
    await page.keyboard.press(key);
    await expect(tab(page, 'One by one'), key).toHaveAttribute('aria-selected', 'true');
  }
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, 'All together'), 'a plain arrow still moves').toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
});

test('the chosen tab is painted differently in forced colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Forced colours are emulated in Chromium only');
  await toTryOn(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.mouse.move(0, 0);
  // Long enough for the tabs' own colour transition to finish under the new palette.
  await page.waitForTimeout(800);
  // Pixels, because the computed style still reports the author's colours in forced colours: inside the tab, clear of its words and its rounded end.
  const paint = async (name: string): Promise<string> => {
    const png = await tab(page, name).screenshot();
    noteScreenshot();
    const shot = sharp(png);
    const { height } = await shot.metadata();
    return (await shot.extract({ left: 7, top: Math.floor(height / 2), width: 1, height: 1 }).raw().toBuffer()).join();
  };
  expect(await paint('All together')).not.toBe(await paint('One by one'));
  expect(await paint('One by one')).toBe(await paint('Tips'));
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the tabs are at least 44 x 44 px and at least 8 px apart', async ({ page }) => {
    await toTryOn(page);
    const boxes = await page.getByRole('tab').evaluateAll((all) => all.map((el) => { const { x, y, width, height } = el.getBoundingClientRect(); return { x, y, width, height }; }));
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const [i, box] of boxes.entries()) {
      const next = boxes[i + 1];
      if (next?.y === box.y) expect(next.x - (box.x + box.width)).toBeGreaterThanOrEqual(8);
    }
  });
});
