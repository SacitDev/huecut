/**
 * The bundled examples: one `SessionData` per library model, from the app's own analysis of that model's checked front
 * picture in a real browser engine. The picture goes through My look like any photo, the session is saved by default and read
 * back from IndexedDB, and its hair mask becomes a PNG.
 * Usage: node scripts/examples.ts --url <the built app, base path included> [--only <model-id>,...] [--hash-log <file>]
 * `--hash-log` appends "<sha256>  <path>  source=<picture> via scripts/examples.ts" per mask, as scripts/images.ts does.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';
import sharp from 'sharp';
import { parseSessionData, type SessionData } from '../src/domain/session/session-data.ts';

const root = join(import.meta.dirname, '..');
/** First visit: the core tools come from the server, then one analysis. */
const ANALYSIS_TIMEOUT_MS = 300_000;
/** The widest shipped copy of a model's base picture (the original's width: never upscaled). */
const PICTURE_WIDTH = 1086;
/** PNG chunks allowed in a shipped mask (no text, time or colour-profile metadata). */
const PNG_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);
const PNG_SIGNATURE_BYTES = 8;
/** A chunk's length, type and checksum fields, around its data. */
const PNG_CHUNK_OVERHEAD = 12;
/** Landmarks keep 5 decimals, about 0.01 px on the analysis image; the JSON stays small. */
const DECIMALS = 1e5;

interface Model {
  readonly id: string;
  readonly collection: 'salon' | 'barbering';
  readonly hair_group: 'straight_wavy' | 'curly_coily';
}
interface Question {
  readonly id: string;
  readonly options: readonly { readonly label: string }[];
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(join(root, path), 'utf8'));
const questions = (readJson('content/questions.json') as { readonly questions: readonly Question[] }).questions;

/** The answers by option label, so a renamed option stops this script instead of shifting an index. */
function answer(question: string, ...labels: readonly string[]): [string, { readonly chosen: readonly number[] }] {
  const options = questions.find((q) => q.id === question)?.options;
  if (!options) throw new Error(`no question ${question}`);
  const chosen = labels.map((label) => {
    const i = options.findIndex((o) => o.label === label);
    if (i < 0) throw new Error(`${question} has no option "${label}"`);
    return i;
  });
  return [question, { chosen }];
}

/** A plain set of answers for the model's look: natural, healthy hair, no reaction to dye and no chemical history. */
function answersFor(model: Model): SessionData['answers'] {
  const salon = model.collection === 'salon';
  return Object.fromEntries([
    answer('hair-texture', model.hair_group === 'straight_wavy' ? 'Wavy' : 'Coily'),
    answer('hair-current-length', salon ? 'To my shoulders' : 'Above my chin'),
    answer('colour-natural-level', model.hair_group === 'straight_wavy' ? 'Medium brown' : 'Very dark brown or off-black'),
    answer('colour-current-level-lengths', model.hair_group === 'straight_wavy' ? 'Dark brown to medium brown' : 'Black or very dark'),
    answer('hair-chemical-history', 'Nothing, natural hair'),
    answer('hair-condition', 'Healthy, it behaves well'),
    answer('pref-colour-direction', 'Same depth, warmer or cooler'),
    answer('dye-reaction', 'No reaction, and my scalp is fine'),
    ...(salon
      ? [answer('hair-density', 'In between'), answer('upkeep', 'About 10 minutes, a trim every 6-8 weeks')]
      : [answer('hair-recession-stage', 'Full hairline'), answer('pref-top-length', 'Medium, about 5-10 cm')]),
  ]);
}

/** The kept session as JSON-safe data: typed arrays become number lists; the photo Blobs stay in the browser. */
async function readKept(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('huecut', 1);
        open.onerror = () => {
          reject(open.error ?? new Error('open failed'));
        };
        open.onsuccess = () => {
          const get = open.result.transaction('session').objectStore('session').get('current');
          get.onsuccess = () => {
            const plain = (value: unknown): unknown => {
              if (ArrayBuffer.isView(value)) return Array.from(value as unknown as ArrayLike<number>);
              if (Array.isArray(value)) return value.map(plain);
              if (typeof value !== 'object' || value === null || value instanceof Blob) return value instanceof Blob ? null : value;
              return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
            };
            open.result.close();
            resolve(plain((get.result as { readonly data?: unknown } | undefined)?.data ?? null));
          };
        };
      }),
  );
}

const SAVE_POLL_MS = 200;

async function keptSession(page: Page, picture: string): Promise<SessionData> {
  await page.goto(`${arg('--url') ?? ''}#/my-look/photo`);
  await page.locator('input[type=file]').first().setInputFiles(picture);
  await page.getByRole('radio', { name: 'Photo 1' }).waitFor({ state: 'attached' });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('canvas[role="img"]').waitFor({ timeout: ANALYSIS_TIMEOUT_MS });
  // Saved by default: the write after the analysis brings the observation into the record.
  for (let waited = 0; waited < ANALYSIS_TIMEOUT_MS; waited += SAVE_POLL_MS) {
    const parsed = parseSessionData(await readKept(page));
    if (parsed.ok && parsed.value.photo?.observation) return parsed.value;
    await page.waitForTimeout(SAVE_POLL_MS);
  }
  throw new Error('the session was not saved with its analysis');
}

const rounded = (value: unknown): unknown => {
  if (typeof value === 'number') return Number.isInteger(value) ? value : Math.round(value * DECIMALS) / DECIMALS;
  if (ArrayBuffer.isView(value)) return Array.from(value as unknown as ArrayLike<number>, rounded);
  if (Array.isArray(value)) return value.map(rounded);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rounded(v)]));
};

/** Encodes a 0 / 255 mask as an 8-bit grey PNG and keeps only the allowed chunks (sharp also writes pHYs). */
async function maskPng(mask: { readonly widthPx: number; readonly heightPx: number; readonly data: Uint8Array }): Promise<Buffer> {
  const png = await sharp(Buffer.from(mask.data), { raw: { width: mask.widthPx, height: mask.heightPx, channels: 1 } }).toColourspace('b-w').png({ compressionLevel: 9 }).toBuffer();
  const kept: Buffer[] = [png.subarray(0, PNG_SIGNATURE_BYTES)];
  for (let at = PNG_SIGNATURE_BYTES; at < png.length; at += PNG_CHUNK_OVERHEAD + png.readUInt32BE(at)) {
    if (PNG_CHUNKS.has(png.toString('latin1', at + 4, at + 8))) kept.push(png.subarray(at, at + PNG_CHUNK_OVERHEAD + png.readUInt32BE(at)));
  }
  return Buffer.concat(kept);
}

/** The kept session as this model's bundled example: at the face card, with the mask in its PNG and the model's answers. */
function exampleRecord(model: Model, kept: SessionData, picture: string, mask: string): SessionData {
  const photo = kept.photo;
  if (!photo?.observation?.previewMask || photo.observation.faces.length !== 1) throw new Error(`${model.id}: the analysis must find one face and a hair mask`);
  return {
    schemaVersion: kept.schemaVersion,
    savedAt: 0,
    source: 'example',
    step: 'face',
    furthest: 1,
    answers: answersFor(model),
    prefs: { goal: 'both', collections: [model.collection], count: 4 },
    shortlist: { added: [], removed: [], order: [] },
    pair: null,
    slots: {},
    grids: [],
    photo: { ...photo, id: `example-${model.id}` as typeof photo.id, observation: { ...photo.observation, previewMask: null }, edits: null, refined: null, example: { picture, mask } },
  };
}

/** One model: analyses its picture in a fresh browser context, then writes the record and the mask. */
async function makeExample(browser: Browser, model: Model, hashLog: string | undefined): Promise<void> {
  const name = `model-base-front-${String(PICTURE_WIDTH)}.avif`;
  const context = await browser.newContext();
  try {
    const kept = await keptSession(await context.newPage(), join(root, 'public', 'library', model.id, name));
    const preview = kept.photo?.observation?.previewMask;
    if (!preview) throw new Error(`${model.id}: no hair mask`);
    const png = await maskPng(preview);
    const maskFile = join('public', 'examples', `${model.id}-hair-mask.png`);
    writeFileSync(join(root, maskFile), png);
    const record = exampleRecord(model, kept, `library/${model.id}/${name}`, `examples/${model.id}-hair-mask.png`);
    const json = JSON.stringify(rounded(record));
    const checked = parseSessionData(JSON.parse(json));
    if (!checked.ok) throw new Error(`${model.id}: the record does not parse: ${checked.error.path}`);
    writeFileSync(join(root, 'content', 'examples', `${model.id}.json`), `${json}\n`);
    const sha = createHash('sha256').update(png).digest('hex');
    if (hashLog) appendFileSync(hashLog, `${sha}  ${relative(root, join(root, maskFile)).replaceAll('\\', '/')}  source=${model.id}/${name} via scripts/examples.ts\n`);
    console.log(`${model.id}: ${String(preview.widthPx)}x${String(preview.heightPx)} mask, ${String(png.length)} B png, ${String(json.length)} B json, sha256 ${sha}`);
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  if (!arg('--url')) throw new Error('usage: node scripts/examples.ts --url <the built app> [--only ids] [--hash-log file]');
  const only = arg('--only')?.split(',');
  const models = (readJson('content/library-models.json') as readonly Model[]).filter((m) => !only || only.includes(m.id));
  mkdirSync(join(root, 'public', 'examples'), { recursive: true });
  mkdirSync(join(root, 'content', 'examples'), { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const model of models) await makeExample(browser, model, arg('--hash-log'));
  } finally {
    await browser.close();
  }
}

await main();
