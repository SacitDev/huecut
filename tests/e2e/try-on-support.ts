/**
 * Test support of the Try it on and Board e2e (try-on.spec.ts): its test content (the fixture content plus the 13 looks of
 * the four test grids, with their real names and prompt specs), its build on that content, and the kept session each test opens.
 */
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { build, type Plugin } from 'vite';
import { buildContent } from '../../scripts/content/build.ts';
import { splitGrid } from '../../src/domain/board/grid-split.ts';
import type { PictureEntry } from '../../src/domain/content/types.ts';
import type { ItemId } from '../../src/domain/ids.ts';
import type { SessionData } from '../../src/domain/session/session-data.ts';
import { sessionAt } from '../machine/consult.fakes.ts';
import { expect } from './guard.ts';
import { fixtureServer } from './server.ts';

const { APP_URL, PREVIEW_ORIGIN, PREVIEW_OUTDIR } = fixtureServer('try-on');
// The real path, as Vite reports importers (see explore-build.ts).
const app = realpathSync.native(resolve(import.meta.dirname, '..', '..'));
interface GridFixture { readonly file: string; readonly rows: number; readonly columns: number; readonly ideas: readonly string[] }
interface Rec { id: string; name: string; prompt_spec: string; collections: string[]; images: { model?: string; models?: string[]; views?: string[]; view?: string }; [key: string]: unknown }
type Pictures = Record<string, PictureEntry>;
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const GRIDS = readJson(join(app, 'tests', 'fixtures', 'grids', 'grids.json')) as GridFixture[];
/** Grid `n` of the test grids, with its file. */
export const gridOf = (n: number): GridFixture & { readonly path: string } => {
  const g = GRIDS[n] ?? fail(`grid ${String(n)}`);
  return { ...g, path: join(app, 'tests', 'fixtures', 'grids', g.file) };
};
const names = new Map<string, string>();
/** The real name of a test look. */
export const nameOf = (id: string): string => names.get(id) ?? fail(`no name for ${id}`);
let ideaIds: string[] = [];
let photo = Buffer.alloc(0);
/** Stops the test with `message`. */
export function fail(message: string): never {
  throw new Error(message);
}
const keysOf = (r: Rec): string[] =>
  r.images.models ? r.images.models.map((m) => `${m}/${r.id}-${r.images.view ?? ''}`) : (r.images.views ?? []).map((v) => `${r.images.model ?? ''}/${r.id}-${v}`);

/** The fixture content plus a record per test-grid look, cloned from a fixture record with the real name and spec. */
function testContent(content: string): void {
  cpSync(join(app, 'tests', 'fixtures', 'content'), content, { recursive: true });
  for (const name of readdirSync(join(app, 'content', 'prompts'))) if (!existsSync(join(content, 'prompts', name))) cpSync(join(app, 'content', 'prompts', name), join(content, 'prompts', name));
  const cuts = readdirSync(join(app, 'content', 'haircuts')).flatMap((f) => readJson(join(app, 'content', 'haircuts', f)) as Rec[]);
  const real = [...cuts, ...(readJson(join(app, 'content', 'colours', 'looks.json')) as Rec[])];
  const files = { bob: 'haircuts/bob.json', crop: 'haircuts/crop.json', colour: 'colours/looks.json' } as const;
  const lists = { bob: readJson(join(content, files.bob)) as Rec[], crop: readJson(join(content, files.crop)) as Rec[], colour: readJson(join(content, files.colour)) as Rec[] };
  const pictures = readJson(join(content, 'pictures.json')) as Pictures;
  for (const id of GRIDS.flatMap((g) => g.ideas)) {
    const r = real.find((x) => x.id === id) ?? fail(`no record ${id}`);
    const family = r.images.models ? 'colour' : r.collections.includes('barbering') ? 'crop' : 'bob';
    const template = lists[family][0] ?? fail(`no ${family} fixture`);
    const extra = family === 'colour' ? {} : { variants: [], pairs_with: { beards: [], looks: [] } };
    const clone: Rec = { ...structuredClone(template), id, name: r.name, prompt_spec: r.prompt_spec, aliases: [], ...extra };
    keysOf(clone).forEach((k, i) => (pictures[k] = pictures[keysOf(template)[i] ?? ''] ?? fail(`picture ${k}`)));
    lists[family].push(clone);
    appendFileSync(join(content, 'ids.lock'), `${id}\n`);
    names.set(id, r.name);
  }
  for (const f of ['bob', 'crop', 'colour'] as const) writeFileSync(join(content, files[f]), JSON.stringify(lists[f]));
  writeFileSync(join(content, 'pictures.json'), JSON.stringify(pictures));
  ideaIds = [...lists.bob, ...lists.crop, ...lists.colour].map((r) => r.id);
}

/** The build into this suite's own folder, `src/generated` pointed at the test content (as explore-build.ts does). */
async function buildApp(work: string): Promise<void> {
  const [real, generated, loader] = [join(app, 'src', 'generated'), join(work, 'generated'), join(app, 'src', 'platform', 'content.ts')];
  const result = buildContent(join(work, 'content'), generated, { complete: false });
  if (!result.ok) fail(`test content: ${result.check.problems.map((p) => `${p.file} ${p.message}`).join('; ')}`);
  const plugin: Plugin = {
    name: 'try-on-e2e-generated',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer === undefined || !source.includes('generated/')) return null;
      const [path = '', query] = source.split('?', 2);
      const target = resolve(dirname(importer), path);
      return target.startsWith(real + sep) ? join(generated, relative(real, target)) + (query === undefined ? '' : `?${query}`) : null;
    },
    transform: (code, id) => (resolve(id.split('?')[0] ?? '') === loader ? code.replace("base: '../generated/'", `base: '${relative(dirname(loader), generated).replaceAll('\\', '/')}/'`) : null),
  };
  await build({ root: app, configFile: join(app, 'vite.config.ts'), plugins: [plugin], logLevel: 'warn', build: { outDir: PREVIEW_OUTDIR, emptyOutDir: true } });
  // Library pictures the stylist sheet shows: solid blocks in their average colour where `public/library` has no file.
  for (const [key, e] of Object.entries(readJson(join(work, 'content', 'pictures.json')) as Pictures)) {
    for (const w of e.widths.filter((x) => !existsSync(join(app, 'public', 'library', `${key}-${String(x)}.avif`)))) {
      const file = join(app, PREVIEW_OUTDIR, 'library', `${key}-${String(w)}.avif`);
      mkdirSync(dirname(file), { recursive: true });
      await sharp({ create: { width: w, height: Math.round((w * e.heightPx) / e.widthPx), channels: 3, background: e.average } }).avif({ quality: 40 }).toFile(file);
    }
  }
}

/** Builds the app on the test content and makes the test photo: larger than 1536 px, with EXIF the copy for the AI must drop. */
export async function prepareSuite(): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), 'huecut-try-on-'));
  testContent(join(work, 'content'));
  await buildApp(work);
  expect(await (await fetch(`${APP_URL}index.html`)).text(), `${PREVIEW_ORIGIN} serves ${PREVIEW_OUTDIR}`).toBe(readFileSync(join(app, PREVIEW_OUTDIR, 'index.html'), 'utf8'));
  // A fictional photo, larger than 1536 px, with planted EXIF (camera and location) that the copy for the AI must drop.
  const exif = { IFD0: { Make: 'FictionalCam', Model: 'Planted' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 30/1 0/1' } };
  photo = await sharp(join(app, 'tests', 'fixtures', 'faces', 'one-face-salon-straight-wavy.jpg')).resize({ height: 2400 }).withExif(exif).jpeg().toBuffer();
  expect((await sharp(photo).metadata()).exif !== undefined && photo.includes(Buffer.from('FictionalCam')), 'the planted EXIF').toBe(true);
}

/** The side of the pixel samples that compare a shown tile with the grid picture. */
export const SAMPLE_PX = 32;
/**
 * Only catches a picture unlike any tile: its own crop measured 2.8-7.7 on the test grids in Chromium and WebKit. Telling
 * tiles apart is the nearest-tile check, because a neighbouring tile of the same model can be under 1 further away.
 */
export const TILE_SAMPLE_MAX_DISTANCE = 9;

/**
 * IndexedDB `huecut`, store `session`, key `current`: writes `record`, or says whether one exists.
 * Playwright's WebKit test build refuses Blobs there, which Safari stores: the photo then goes in as bytes, the app reads
 * a Blob back and its own writes leave the pictures out. `shimmed` says that happened, so the run can name it.
 */
const sessionStore = (page: Page, record: { data: unknown; photo: string } | null): Promise<{ readonly found: boolean; readonly shimmed: boolean }> =>
  page.evaluate(async (put) => {
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const open = indexedDB.open('huecut', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('session');
    const db = await settle(open);
    const store = () => db.transaction('session', put ? 'readwrite' : 'readonly').objectStore('session');
    let shimmed = false;
    if (put) {
      const bytes = Uint8Array.from(atob(put.photo), (c) => c.charCodeAt(0));
      const write = (photo: Blob | ArrayBuffer) => settle(store().put({ data: put.data, photo, pictures: {} }, 'current'));
      await write(new Blob([bytes], { type: 'image/jpeg' })).catch(async () => {
        shimmed = true;
        await write(bytes.buffer);
        const native = Object.getOwnPropertyDescriptors(IDBObjectStore.prototype);
        const [save, read, result] = [native.put.value, native.get.value, Object.getOwnPropertyDescriptors(IDBRequest.prototype).result.get];
        if (!save || !read || !result) throw new Error('IndexedDB lacks its own methods');
        IDBObjectStore.prototype.put = function (this: IDBObjectStore, value: object, key?: IDBValidKey) { return save.call(this, { ...value, photo: null, pictures: {} }, key); };
        IDBObjectStore.prototype.get = function (this: IDBObjectStore, key: IDBValidKey) {
          const request = read.call(this, key);
          Object.defineProperty(request, 'result', { get: () => { const r = result.call(request) as { photo?: unknown } | undefined; return r?.photo instanceof ArrayBuffer ? { ...r, photo: new Blob([r.photo], { type: 'image/jpeg' }) } : r; } });
          return request;
        };
      });
    }
    const found = (await settle(store().get('current'))) !== undefined;
    db.close();
    return { found, shimmed };
  }, record);
/** Whether a kept session is in IndexedDB. */
export const sessionExists = async (page: Page): Promise<boolean> => (await sessionStore(page, null)).found;

/** Stores `data` as the kept session, with `photo` as its picture, for a page on the app's origin. */
export const keepSession = async (page: Page, data: SessionData, photo: Buffer): Promise<void> => {
  await sessionStore(page, { data: JSON.parse(JSON.stringify(data, (_k, v: unknown) => (ArrayBuffer.isView(v) ? Array.from(v as Float32Array) : v))), photo: photo.toString('base64') });
};

/** A kept session at Try it on with `order` as the list (the engine's other picks removed), restored from IndexedDB. */
export async function openTryOn(page: Page, order: readonly string[], goal: 'cut' | 'both', pair: readonly [string, string] | null = null, over: Partial<SessionData> = {}): Promise<void> {
  const ids = order as readonly ItemId[];
  const data = sessionAt('try-on', {
    savedAt: Date.now(),
    prefs: { goal, collections: ['salon', 'barbering'], count: goal === 'both' ? 2 : 1 },
    shortlist: { added: ids, removed: ideaIds.filter((id) => !order.includes(id)) as ItemId[], order: ids },
    pair: pair && { cut: pair[0] as ItemId, colour: pair[1] as ItemId },
    ...over,
  });
  await page.goto(`${APP_URL}#/`);
  const { shimmed } = await sessionStore(page, { data: JSON.parse(JSON.stringify(data, (_k, v: unknown) => (ArrayBuffer.isView(v) ? Array.from(v as Float32Array) : v))), photo: photo.toString('base64') });
  if (shimmed) console.log('NOTE: this WebKit build refuses Blobs in IndexedDB: the kept session ran through the test shim, so storing it is not proven here');
  await page.goto(`${APP_URL}#/my-look/try-on`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Try it on');
  await expect(page.getByRole('tablist', { name: 'Ways to try your looks' })).toBeVisible();
}

/** The splitter on the same picture in Node: each tile about an equal share, its size and a sample of its pixels. */
export async function expectedTiles(n: number): Promise<{ readonly width: number; readonly height: number; readonly sample: Buffer }[]> {
  const g = gridOf(n);
  const { data, info } = await sharp(g.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const split = splitGrid({ widthPx: info.width, heightPx: info.height, data: new Uint8Array(data) }, g);
  if (!split.ok) fail(split.error);
  return Promise.all(split.value.tiles.map(async ({ x, y, width, height }) => {
    expect(Math.abs(width - info.width / g.columns)).toBeLessThan(0.03 * info.width);
    expect(Math.abs(height - info.height / g.rows)).toBeLessThan(0.03 * info.height);
    return { width, height, sample: await sharp(g.path).extract({ left: x, top: y, width, height }).resize(SAMPLE_PX, SAMPLE_PX, { fit: 'fill' }).ensureAlpha().raw().toBuffer() };
  }));
}
/** Mean difference per channel, 0-255, between two RGBA samples of the same size (alpha is left out). */
export const sampleDistance = (a: readonly number[], b: Buffer): number => a.reduce((sum, v, i) => (i % 4 === 3 ? sum : sum + Math.abs(v - (b[i] ?? 0))), 0) / ((a.length * 3) / 4);
