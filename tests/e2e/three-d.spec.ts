/**
 * The 3D view on the build (so the CSP applies), in Chromium, with the real depth model and fictional photos: the
 * picture at every limit, every control, failure and lifecycle, accessibility.
 */
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext, Page } from '@playwright/test';
import { expectNoViolations } from './extras-support.ts';
import { addPhotos, analysisWorker, ANALYSIS_TIMEOUT_MS, button, drawing, dropReported, expectAnalysed, heading, needsAnalysis, onNextDecode } from './failure/support.ts';
import { expect, noteScreenshot, requires, test } from './guard.ts';
import { shotsDir } from './shots.ts';
import { closeSheet, control, coverage, FRONT, menuFromLines, openAndWait, opener, photoOf, press, redrawn, refuseWebgl, said, settle, sheetOf, stageMiddle, stageOf, toMenu, type Redraw } from './three-d-support.ts';

const LOOKED_AT = ['one-face-salon-straight-wavy', 'curly-frontal', 'glasses', 'older-grey'] as const;
const BUSY = 'Working out the depth of your photo';
const STOPPED = 'The 3D view stopped. Close this sheet to start again.';
const COULD_NOT_OPEN = 'The 3D view could not open in this browser. Your face card is ready without it.';
const FULL_TURN = 3;
const FULL_TILT = 2;
/** Measured on the four faces: at most 14 hole pixels now, and 99 to 317 on the surface that tore; the rest of the margin is fine curls. */
const MAX_HOLE_PIXELS = 30;
const MAX_LOOSE_PIXELS = 60;
/** The body's or photo's end in view, as a share of the lowest row. Clear beside the person is framing, not a fault: a person with arms at their sides measured 0.31 clear with no edge in view. */
const MAX_CUT = 0.1;
/** Fixtures and made photos that once showed a copy of the person past the photo, or the photo's own end. */
const HARDER: readonly { readonly name: string; readonly from: string; readonly redraw?: Redraw }[] = [
  { name: 'close-up', from: 'close-up' },
  { name: 'far-1-5m', from: 'far-1-5m' },
  { name: 'one-face-salon-curly-coily', from: 'one-face-salon-curly-coily' },
  { name: 'a person near the left edge', from: 'glasses', redraw: { width: 1600, height: 1200, place: [0, 0, 900, 1200] } },
  { name: 'a body that ends inside the photo', from: 'glasses', redraw: { width: 1000, height: 1300, place: [180, 120, 640, 850] } },
  { name: 'something else in the photo', from: 'one-face-salon-straight-wavy', redraw: { width: 1050, height: 1400, patch: [120, 1250, 300, 150, 800, 180, 250, 300] } },
];
const POSES: readonly (readonly [string, readonly (readonly [string, number])[]])[] = [
  ['rest', []],
  ['left-up', [['Turn left', FULL_TURN], ['Tilt up', FULL_TILT]]],
  ['right-up', [['Turn right', FULL_TURN], ['Tilt up', FULL_TILT]]],
  ['left-down', [['Turn left', FULL_TURN], ['Tilt down', FULL_TILT]]],
  ['right-down', [['Turn right', FULL_TURN], ['Tilt down', FULL_TILT]]],
];

test.use({ viewport: { width: 1280, height: 900 } });

async function themed(page: Page, colorScheme: 'light' | 'dark', path: string): Promise<Buffer> {
  await page.emulateMedia({ colorScheme });
  await settle(page);
  return stageShot(page, path);
}

/** The stage's pixels, the screenshot noted for the guard. */
async function stageShot(page: Page, path?: string): Promise<Buffer> {
  const png = await stageOf(page).screenshot(path === undefined ? {} : { path });
  noteScreenshot();
  return png;
}

/** Every limit pose at this width: no hole, nothing torn off, no end of the body or photo in view. */
async function expectWhole(page: Page, context: BrowserContext, name: string, width: number): Promise<void> {
  const dir = shotsDir('three-d');
  for (const [pose, moves] of POSES) {
    await control(page, 'Reset').click();
    for (const [move, times] of moves) await press(page, move, times);
    const light = await themed(page, 'light', join(dir, `${name}-${pose}-${String(width)}-light.png`));
    const dark = await themed(page, 'dark', join(dir, `${name}-${pose}-${String(width)}-dark.png`));
    const seen = await coverage(context, light, dark);
    expect.soft(seen.holes, `holes, ${name} ${pose}`).toBeLessThanOrEqual(MAX_HOLE_PIXELS);
    expect.soft(seen.loose, `torn fragments, ${name} ${pose}`).toBeLessThanOrEqual(MAX_LOOSE_PIXELS);
    expect.soft(seen.cut, `the end of the body or photo, ${name} ${pose}`).toBeLessThan(MAX_CUT);
  }
}

for (const name of LOOKED_AT) {
  test(`${name} has no hole, no torn edge and no photo edge at any limit`, async ({ page, context }) => {
    await needsAnalysis(page);
    test.setTimeout(600_000);
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await toMenu(page, photoOf(name));
    await openAndWait(page);
    for (const width of [1280, 1024]) {
      await page.setViewportSize({ width, height: width === 1280 ? 900 : 768 });
      await expectWhole(page, context, name, width);
    }
    await expectNoViolations(page);
  });
}

for (const { name, from, redraw } of HARDER) {
  test(`harder: ${name} has no hole, no torn edge, no copy of the person and no photo edge at any limit`, async ({ page, context }) => {
    await needsAnalysis(page);
    test.setTimeout(600_000);
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await toMenu(page, redraw ? { name: `${from}-redrawn.jpg`, mimeType: 'image/jpeg', buffer: await redrawn(context, photoOf(from), redraw) } : photoOf(from));
    await openAndWait(page);
    await expectWhole(page, context, name.replaceAll(' ', '-'), 1280);
    await expectNoViolations(page);
  });
}

/** The stage is there while the depth is worked out, and a drag on it must not set a pose nobody can see. */
async function dragBeforeReady(page: Page): Promise<void> {
  const { x, y, width } = await stageMiddle(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + width / 2, y, { steps: 3 });
  await page.mouse.up();
}

async function dragPastLimits(page: Page): Promise<void> {
  const { x, y, width, height } = await stageMiddle(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 3 * width, y - 3 * height, { steps: 6 });
  await expect(said(page, 'Turned 15 degrees right, tilted 10 degrees up.')).toHaveCount(1);
  await page.mouse.move(x - 3 * width, y + 3 * height, { steps: 6 });
  await expect(said(page, 'Turned 15 degrees left, tilted 10 degrees down.')).toHaveCount(1);
  await page.mouse.up();
  await control(page, 'Reset').click();
  await expect(said(page, FRONT)).toHaveCount(1);
}

/** Reset by keyboard with the mouse still held: the next move of the mouse must not pull the view back. */
async function resetDuringDrag(page: Page): Promise<void> {
  const { x, y, width } = await stageMiddle(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + width / 4, y, { steps: 3 });
  await expect(said(page, 'Turned 8 degrees right.')).toHaveCount(1);
  await control(page, 'Reset').focus();
  await page.keyboard.press('Enter');
  await expect(said(page, FRONT)).toHaveCount(1);
  await page.mouse.move(x + width / 4 + 10, y, { steps: 2 });
  await settle(page);
  await expect(said(page, FRONT), 'the drag ended with Reset').toHaveCount(1);
  await page.mouse.up();
}

/** The browser can take the capture away with no pointer-up: the drag ends there, or moves with no button held would turn the view. */
async function lostCaptureEndsDrag(page: Page): Promise<void> {
  const { x, y, width } = await stageMiddle(page);
  await stageOf(page).evaluate((host) => {
    host.addEventListener('gotpointercapture', (e) => { host.releasePointerCapture((e as PointerEvent).pointerId); }, { once: true });
  });
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Capture events wait for the next pointer event: the first small move delivers the capture and its release, the second the loss.
  await page.mouse.move(x + 1, y);
  await page.mouse.move(x + 2, y);
  await page.mouse.move(x + width / 2, y, { steps: 3 });
  await settle(page);
  await expect(said(page, FRONT), 'a drag with no capture is over').toHaveCount(1);
  await page.mouse.up();
}

async function rapidPresses(page: Page): Promise<void> {
  await Promise.all(Array.from({ length: 12 }, () => control(page, 'Turn right').dispatchEvent('click')));
  await expect(said(page, 'Turned 15 degrees right.')).toHaveCount(1);
  await expect(control(page, 'Turn right')).toHaveAttribute('aria-disabled', 'true');
  await Promise.all([control(page, 'Reset').dispatchEvent('click'), control(page, 'Turn left').dispatchEvent('click'), control(page, 'Reset').dispatchEvent('click')]);
  await expect(said(page, FRONT)).toHaveCount(1);
}

test('a drag while the depth is worked out moves nothing', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await opener(page).click();
  await expect(said(page, BUSY)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await dragBeforeReady(page);
  await expect(said(page, FRONT)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
});

test('a drag stops at the limits, and rapid presses stay within them', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await openAndWait(page);
  await dragPastLimits(page);
  await rapidPresses(page);
});

test('a button pressed during a drag ends the drag', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await openAndWait(page);
  await resetDuringDrag(page);
});

test('a lost pointer capture ends the drag', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await openAndWait(page);
  await lostCaptureEndsDrag(page);
});

test("the app's own Reduce motion setting makes a press land in one drawing", async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await openAndWait(page);
  await page.evaluate(() => { document.documentElement.dataset.motion = 'reduce'; });
  await settle(page);
  const before = await page.evaluate(() => window.draws);
  await control(page, 'Turn left').click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.draws), 'one drawing, no easing').toBe(before + 1);
});

test('a lost context comes back by itself, in the same pose', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toMenu(page, photoOf('older-grey'));
  await openAndWait(page);
  await press(page, 'Turn left', 2);
  await expect(said(page, 'Turned 10 degrees left.')).toHaveCount(1);
  await settle(page);
  const turned = await stageShot(page);
  // Held on to: a lost context hands out no extensions, so the one that restores it has to be fetched first.
  const loser = await page.evaluateHandle(() => window.rec.contexts.at(-1)?.getExtension('WEBGL_lose_context'));
  await loser.evaluate((e) => { e?.loseContext(); });
  await expect(said(page, STOPPED)).toHaveCount(1);
  await expect(control(page, 'Turn left')).toHaveAttribute('aria-disabled', 'true');
  await loser.evaluate((e) => { e?.restoreContext(); });
  await expect(said(page, 'Turned 10 degrees left.'), 'the view is back').toHaveCount(1);
  await settle(page);
  expect((await stageShot(page)).equals(turned), 'the same picture as before the loss').toBe(true);
});

test('leaving during loading leaves nothing behind, and ten openings give every GPU object back', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(600_000);
  await toMenu(page, photoOf('curly-frontal'));
  await opener(page).click();
  await expect(said(page, BUSY)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await closeSheet(page);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('huecut:running-extra')), { timeout: ANALYSIS_TIMEOUT_MS }).toBeNull();
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => window.rec.contexts.length), 'no late viewer').toBe(0);
  expect(await page.locator('dialog canvas').count(), 'no late canvas').toBe(0);
  for (let i = 1; i <= 10; i++) {
    await openAndWait(page);
    await closeSheet(page);
    await expect.poll(() => page.evaluate(() => window.rec.contexts.every((c) => c.isContextLost()))).toBe(true);
    expect(await page.evaluate(() => window.rec.contexts.length), `contexts after opening ${String(i)}`).toBe(i);
  }
  const gl = await page.evaluate(() => window.rec.gl);
  expect(gl.deleteBuffer ?? 0, 'every buffer deleted').toBe(gl.createBuffer ?? -1);
  expect(gl.deleteProgram ?? 0, 'every program deleted').toBe(gl.createProgram ?? -1);
  // The photo's colours and shape each time; the renderer's own blank textures go with the context, checked as lost above.
  expect(gl.deleteTexture ?? 0, 'the photo deleted at every close').toBe(20);
  expect(await page.locator('dialog canvas').count(), 'no canvas left').toBe(0);
});

test('no WebGL at all: its reason replaces the button', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await refuseWebgl(page, 'every');
  await toMenu(page, photoOf('glasses'));
  await expect(opener(page)).toHaveCount(0);
  await expect(page.getByText('3D view needs WebGL, which this browser has turned off.', { exact: false })).toBeVisible();
});

test('WebGL refused after the check: the view says so, with no empty stage and no dead buttons', async ({ page, guard }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await refuseWebgl(page, 'connected');
  await toMenu(page, photoOf('glasses'));
  await opener(page).click();
  await expect(said(page, COULD_NOT_OPEN)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  await expect(sheetOf(page).locator('canvas')).toHaveCount(0);
  await expect(sheetOf(page).getByRole('group', { name: 'Move the view' })).toHaveCount(0);
  await expect(stageOf(page)).toHaveCount(0);
  dropReported(guard, /WebGL|THREE/i);
});

test('the depth worker crashes: the offer to get the tool again brings the view back', async ({ page, guard }) => {
  await needsAnalysis(page);
  test.setTimeout(300_000);
  await toMenu(page, photoOf('glasses'));
  await onNextDecode(await analysisWorker(page), 'crash');
  await opener(page).click();
  const again = sheetOf(page).getByRole('button', { name: 'Download again' });
  await expect(again).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  await again.click();
  await expect(said(page, FRONT)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
  dropReported(guard, /planted crash/);
});

test('a second photo chosen after the first was viewed shows the second', async ({ page }) => {
  await needsAnalysis(page);
  test.setTimeout(600_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toMenu(page, photoOf('glasses'));
  await openAndWait(page);
  await settle(page);
  const first = await stageShot(page);
  await press(page, 'Turn left', FULL_TURN);
  await closeSheet(page);
  while ((await heading(page).innerText()) !== 'Add your photo') await button(page, 'Back').click();
  await addPhotos(page, photoOf('older-grey'));
  await expectAnalysed(page, 'older-grey.jpg');
  await page.locator('fieldset li', { hasText: 'older-grey.jpg' }).getByRole('radio').check();
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  await menuFromLines(page);
  await openAndWait(page);
  await settle(page);
  expect((await stageShot(page)).equals(first), 'the picture is of the second photo').toBe(false);
});

/** Narrows the stage and, from a ResizeObserver that runs after the viewer's, reads the middle of the canvas before it can be shown. */
const drawnInTheResizeFrame = (page: Page): Promise<boolean> =>
  stageOf(page).evaluate(
    (host: HTMLElement) =>
      new Promise<boolean>((done) => {
        const start = host.clientWidth;
        const canvas = host.querySelector('canvas');
        const gl = canvas?.getContext('webgl2');
        if (!canvas || !gl) throw new Error('no canvas');
        const look = new ResizeObserver(() => {
          if (host.clientWidth === start) return;
          look.disconnect();
          const pixel = new Uint8Array(4);
          gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          done(pixel[3] === 255);
        });
        look.observe(host);
        host.style.inlineSize = `${String(start - 40)}px`;
      }),
  );

test('a resize is drawn in its own frame, and a change of pixel ratio is followed', async ({ page }) => {
  await requires(page, 'workerWebGL', 'cdp');
  test.setTimeout(300_000);
  await toMenu(page, photoOf('one-face-salon-straight-wavy'));
  await openAndWait(page);
  const canvas = stageOf(page).locator('canvas');
  expect(await drawnInTheResizeFrame(page), 'the picture is there in the frame of the resize').toBe(true);
  const cdp = await page.context().newCDPSession(page);
  // The window's width changes too: Chromium's emulation re-reads media queries only then, and the stage keeps its size at these widths, so only the ratio can resize the canvas.
  for (const [ratio, expected, width] of [[2, 2, 1270], [3, 2, 1260], [1, 1, 1250]] as const) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: ratio, mobile: false });
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => Math.round((c.width / c.clientWidth) * 10) / 10), { message: `pixel ratio ${String(ratio)}` }).toBe(expected);
  }
});

for (const [what, width, height] of [['a 50 MP-class photo', 6144, 8192], ['a small photo', 480, 640]] as const) {
  test(`${what} opens`, async ({ page, context }) => {
    await needsAnalysis(page);
    test.setTimeout(600_000);
    await toMenu(page, { name: 'scaled.jpg', mimeType: 'image/jpeg', buffer: await redrawn(context, photoOf('one-face-salon-straight-wavy'), { width, height }) });
    await openAndWait(page);
    expect(await stageOf(page).locator('canvas').evaluate((c: HTMLCanvasElement) => c.width), 'the canvas has its size').toBeGreaterThan(0);
    expect(await page.evaluate(() => window.rec.lost), 'no context lost').toBe(0);
    await expectNoViolations(page);
  });
}

/** With the sheet as it opens, nothing of the stage, the controls or the status is below the sheet's fold. */
async function expectAllInView(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
  const inView = await sheetOf(page).evaluate((sheet) => {
    const edge = Math.min(window.innerHeight, sheet.getBoundingClientRect().bottom);
    return ['[role="img"]', '[role="group"]', '[role="status"]'].map((s) => {
      const box = sheet.querySelector(s)?.getBoundingClientRect();
      return box !== undefined && box.top >= 0 && box.bottom <= edge;
    });
  });
  expect(inView, 'stage, controls and status').toEqual([true, true, true]);
}

for (const [width, height] of [[1280, 900], [1024, 768], [1280, 720]] as const) {
  test(`at ${String(width)} x ${String(height)}: all in view together; names, targets, focus and axe in both themes`, async ({ page }) => {
    await needsAnalysis(page);
    test.setTimeout(300_000);
    await page.setViewportSize({ width, height });
    await toMenu(page, photoOf('curly-frontal'));
    await opener(page).focus();
    await page.keyboard.press('Enter');
    await expect(said(page, FRONT)).toHaveCount(1, { timeout: ANALYSIS_TIMEOUT_MS });
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null), 'focus went into the sheet').toBe(true);
    await expectAllInView(page);
    for (const name of ['Turn left', 'Turn right', 'Tilt up', 'Tilt down', 'Reset', 'Close']) {
      const box = await sheetOf(page).getByRole('button', { name, exact: true }).boundingBox();
      expect(Math.min(box?.width ?? 0, box?.height ?? 0), `${name} is a 44 px target`).toBeGreaterThanOrEqual(44);
    }
    await expect(stageOf(page)).toHaveAccessibleName('Your photo in 3D');
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
      const { violations } = await new AxeBuilder({ page }).include('dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `axe, ${colorScheme}`).toEqual([]);
    }
    await page.keyboard.press('Escape');
    await expect(sheetOf(page)).toBeHidden();
    await expect(opener(page), 'focus came back to the button').toBeFocused();
  });
}
