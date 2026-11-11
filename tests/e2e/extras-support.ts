/**
 * Support for extras.spec.ts: its fixture build (the fixture content plus a hand-placed look, into the suite's own output
 * folder, never `dist`), what the page records (CSP violations, lost WebGL contexts, GPU objects made and deleted), and the
 * comparison of the preview's pictures against the hair outline.
 */
import { appendFileSync, cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import type { Locator, Page, Worker } from '@playwright/test';
import { build, type Plugin } from 'vite';
import { buildContent } from '../../scripts/content/build.ts';
import { expect } from './guard.ts';
import { fixtureServer } from './server.ts';

const { APP_URL, PREVIEW_OUTDIR } = fixtureServer('extras');
// The real path, as Vite reports module ids (see explore-build.ts): in a folder reached through a link the two differ and the content swap missed.
const app = realpathSync.native(resolve(import.meta.dirname, '..', '..'));
/** The look of the fixture content with a placement the preview draws (its ends). */
export const DRAWN = 'Copper with silver ends';
/** The look this suite adds: an all-over shade with a placement the preview does not draw. */
export const HIGHLIGHTS = 'Copper with fine silver highlights';

interface Rec { id: string; name: string; [key: string]: unknown }
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

/** The fixture set with the real bands, a hand-placed technique and a look using it. */
function testContent(contentDir: string): void {
  cpSync(join(app, 'tests', 'fixtures', 'content'), contentDir, { recursive: true });
  for (const name of readdirSync(join(app, 'content', 'prompts'))) cpSync(join(app, 'content', 'prompts', name), join(contentDir, 'prompts', name));
  // The face card states only facts with set cuts, and the fixture's bands are unset; the extras live on that card.
  cpSync(join(app, 'content', 'bands.json'), join(contentDir, 'bands.json'));
  const techniquesFile = join(contentDir, 'colours', 'techniques.json');
  const techniques = readJson(techniquesFile) as Rec[];
  const balayage = techniques.find((t) => t.id === 'balayage');
  writeFileSync(techniquesFile, JSON.stringify([...techniques, { ...balayage, id: 'foil-highlights', name: 'Foil highlights', regions: ['highlights'] }]));
  // The fixture's copper is pure #ff0000 for exact unit checks; this one carries the real shade's swatch, so the screenshot shows a true colour.
  const shadesFile = join(contentDir, 'colours', 'shades.json');
  const shades = readJson(shadesFile) as Rec[];
  const auburn = shades.find((s) => s.id === 'copper-auburn');
  writeFileSync(shadesFile, JSON.stringify([...shades, { ...auburn, id: 'natural-copper', name: 'Natural copper', swatch: { root: '#6b3318', mids: '#b4592b', ends: '#ce7240' } }]));
  const looksFile = join(contentDir, 'colours', 'looks.json');
  const looks = readJson(looksFile) as Rec[];
  const template = looks.find((l) => l.name === DRAWN);
  const id = 'copper-with-fine-silver-highlights';
  writeFileSync(looksFile, JSON.stringify([...looks, { ...template, id, name: HIGHLIGHTS, base: { shade: 'natural-copper', technique: 'all_over' }, placements: [{ technique: 'foil_highlights', shade: 'ash-silver', region: 'highlights' }] }]));
  appendFileSync(join(contentDir, 'ids.lock'), `foil-highlights\nnatural-copper\n${id}\n`);
  const picturesFile = join(contentDir, 'pictures.json');
  const pictures = readJson(picturesFile) as Record<string, unknown>;
  writeFileSync(picturesFile, JSON.stringify({ ...pictures, [`salon-straight-wavy/${id}-back`]: pictures['salon-straight-wavy/copper-with-silver-ends-back'] }));
}

/** The content loader's glob base (the app's one way into `src/generated`) points at `generated` instead. */
function generatedFrom(generated: string): Plugin {
  const loader = join(app, 'src', 'platform', 'content.ts');
  return {
    name: 'extras-e2e-generated',
    enforce: 'pre',
    transform(code, id) {
      if (resolve(id.split('?')[0] ?? '') !== loader) return null;
      if (!code.includes("base: '../generated/'")) throw new Error('content.ts no longer names its glob base as expected');
      return code.replace("base: '../generated/'", `base: '${relative(dirname(loader), generated).replaceAll('\\', '/')}/'`);
    },
  };
}

/** Builds the app on the test content into this suite's folder and checks the preview serves that very build. */
export async function buildOnFixtures(): Promise<void> {
  const out = join(app, PREVIEW_OUTDIR);
  const work = mkdtempSync(join(tmpdir(), 'huecut-extras-'));
  try {
    testContent(join(work, 'content'));
    const result = buildContent(join(work, 'content'), join(work, 'generated'), { complete: false });
    const errors = result.check.problems.filter((p) => p.level === 'error');
    expect(result.ok, errors.map((p) => `${p.file} ${p.message}`).join('; ')).toBe(true);
    // Replaced in place, not emptied first: the preview serves this folder meanwhile.
    await build({ root: app, configFile: join(app, 'vite.config.ts'), plugins: [generatedFrom(join(work, 'generated'))], logLevel: 'warn', build: { outDir: out, emptyOutDir: false } });
    expect(await (await fetch(`${APP_URL}index.html`)).text(), `the preview serves ${PREVIEW_OUTDIR}`).toBe(readFileSync(join(out, 'index.html'), 'utf8'));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

// ── What the page records ──

export interface Records {
  csp: string[];
  lost: number;
  contexts: WebGL2RenderingContext[];
  gl: Record<string, number>;
  kept: Record<string, ImageData>;
}
declare global {
  interface Window {
    /** The page's records, made by `instrument` before the app starts. */
    rec: Records;
  }
}

/** Records CSP violations, lost contexts, the page's WebGL contexts and how many GPU objects it made and deleted. */
export const instrument = (): void => {
  const rec: Records = { csp: [], lost: 0, contexts: [], gl: {}, kept: {} };
  window.rec = rec;
  document.addEventListener('securitypolicyviolation', (e) => rec.csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  window.addEventListener('webglcontextlost', () => { rec.lost++; }, true);
  const proto = WebGL2RenderingContext.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
  for (const method of ['createTexture', 'deleteTexture', 'createBuffer', 'deleteBuffer', 'createProgram', 'deleteProgram']) {
    const real = proto[method];
    if (real) {
      proto[method] = function counted(this: unknown, ...args: unknown[]) {
        rec.gl[method] = (rec.gl[method] ?? 0) + 1;
        return real.apply(this, args);
      };
    }
  }
  const getContext = Reflect.get(HTMLCanvasElement.prototype, 'getContext') as (this: HTMLCanvasElement, id: string, o?: unknown) => unknown;
  Reflect.set(HTMLCanvasElement.prototype, 'getContext', function record(this: HTMLCanvasElement, id: string, options?: unknown) {
    const made = getContext.call(this, id, options);
    if (id === 'webgl2' && made && this.isConnected) rec.contexts.push(made as WebGL2RenderingContext);
    return made;
  });
};

/** A worker's own policy violations never reach the page, so each worker is asked to collect them too. */
export const watchWorker = (w: Worker): Promise<unknown> =>
  w.evaluate(() => {
    const scope = self as unknown as { csp: string[]; addEventListener: (t: string, f: (e: SecurityPolicyViolationEvent) => void) => void };
    scope.csp = [];
    scope.addEventListener('securitypolicyviolation', (e) => { scope.csp.push(`${e.violatedDirective} ${e.blockedURI}`); });
  });

/** No policy violation in the page or in any worker. */
export async function expectNoViolations(page: Page): Promise<void> {
  expect(await page.evaluate(() => window.rec.csp), 'CSP violations in the page').toEqual([]);
  for (const w of page.workers()) expect(await w.evaluate(() => (self as unknown as { csp?: string[] }).csp ?? []), 'CSP violations in the worker').toEqual([]);
}

// ── The preview's pixels against the hair outline ──

/** Keeps the preview's two pictures under `name`, in the page. */
export const keepPictures = (page: Page, name: string): Promise<void> =>
  page.evaluate((key) => {
    for (const layer of ['before', 'after']) {
      const c = document.querySelector<HTMLCanvasElement>(`canvas[data-layer="${layer}"]`);
      const image = c?.getContext('2d')?.getImageData(0, 0, c.width, c.height);
      if (image) window.rec.kept[`${key}-${layer}`] = image;
    }
  }, name);

/** Keeps the outline on the tap screen under `name`: the automatic one (256 px) or a refined one (the photo's own size). */
export const keepOutline = (page: Page, name: string): Promise<{ readonly w: number; readonly h: number; readonly hair: number }> =>
  page.evaluate((key) => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="outline"]');
    const image = c?.getContext('2d')?.getImageData(0, 0, c.width, c.height);
    if (!image) throw new Error('no outline to keep');
    window.rec.kept[key] = image;
    let hair = 0;
    for (let i = 3; i < image.data.length; i += 4) if ((image.data[i] ?? 0) > 0) hair++;
    return { w: image.width, h: image.height, hair };
  }, name);

export interface Split {
  readonly width: number;
  readonly height: number;
  /** Pixels that differ between the two pictures and lie outside the outline. */
  readonly changedOutside: number;
  /** Pixels well inside the outline, and how many of those differ. */
  readonly inside: number;
  readonly changedInside: number;
}

/**
 * Compares two kept pictures against a kept outline. A pixel counts as inside when every outline cell within `margin` cells
 * is hair and as outside when none is, so a 256 px outline can be held against the picture's own 1400 px mask.
 */
export const splitByOutline = (page: Page, a: string, b: string, outline: string, margin: number): Promise<Split> =>
  page.evaluate(
    ([pa, pb, mask, m]) => {
      const { kept } = window.rec;
      const [x, y, o] = [kept[pa], kept[pb], kept[mask]];
      if (!x || !y || !o) throw new Error('a kept picture is missing');
      const hair = (cx: number, cy: number): boolean => (o.data[(cy * o.width + cx) * 4 + 3] ?? 0) > 0 && cx >= 0 && cx < o.width;
      const around = (cx: number, cy: number): readonly boolean[] => Array.from({ length: (2 * m + 1) ** 2 }, (_, n) => hair(cx - m + (n % (2 * m + 1)), cy - m + Math.floor(n / (2 * m + 1))));
      const differs = (i: number): boolean => x.data[i] !== y.data[i] || x.data[i + 1] !== y.data[i + 1] || x.data[i + 2] !== y.data[i + 2];
      const result = { width: x.width, height: x.height, changedOutside: 0, inside: 0, changedInside: 0 };
      for (let i = 0; i < x.width * x.height; i++) {
        const cells = around(Math.floor((((i % x.width) + 0.5) * o.width) / x.width), Math.floor(((Math.floor(i / x.width) + 0.5) * o.height) / x.height));
        const changed = differs(i * 4);
        if (changed && !cells.includes(true)) result.changedOutside++;
        if (!cells.includes(false)) { result.inside++; if (changed) result.changedInside++; }
      }
      return result;
    },
    [a, b, outline, margin] as const,
  );

/** Most of the hair took the new colour, and not one pixel outside it changed. */
export function expectTintedInsideOnly(split: Split, what: string): void {
  expect(split.inside, `${what}: the outline covers some hair`).toBeGreaterThan(2_000);
  expect(split.changedOutside, `${what}: pixels changed outside the hair`).toBe(0);
  expect(split.changedInside / split.inside, `${what}: share of the hair that changed`).toBeGreaterThan(0.9);
}

/** Nothing lost while open; after Close the context is given back and every buffer and program is deleted. */
export async function expectDisposedOnClose(page: Page, sheet: Locator): Promise<void> {
  expect(await page.evaluate(() => window.rec.lost), 'WebGL contexts lost while the view was open').toBe(0);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
  await expect.poll(() => page.evaluate(() => { const r = window.rec; return { contexts: r.contexts.length, gone: r.contexts.every((c) => c.isContextLost()) }; }), { timeout: 5_000 }).toEqual({ contexts: 1, gone: true });
  const gl = await page.evaluate(() => window.rec.gl);
  expect(gl.createTexture ?? 0, 'textures were made').toBeGreaterThan(0);
  expect(gl.deleteBuffer ?? 0, 'every buffer deleted').toBe(gl.createBuffer ?? -1);
  expect(gl.deleteProgram ?? 0, 'every program deleted').toBe(gl.createProgram ?? -1);
}
