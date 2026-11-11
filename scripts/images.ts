/**
 * Library pictures: re-encodes checked originals into AVIF at the shipped widths with every metadata
 * block stripped, and records each picture's size and average colour in `content/pictures.json`
 * (the placeholder colour; alt text is built from content data at run time).
 * Usage: node scripts/images.ts --originals <dir> [--out public/library] [--only <model>/<item>-<view>,...]
 *        [--hash-log <file>]   (appends "<sha256>  <path>  source=<original name>" per output)
 *        [--quality <key>=<q>,...]  (a per-picture AVIF quality, kept in pictures.json for later runs)
 * Originals are named `<model-id>/<item-id>-<view>.png` (view: front, side, back).
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import sharp from 'sharp';

/** Shipped widths. Never upscaled: a width above the original's is replaced by the original's width. */
export const WIDTHS = [480, 960, 1440] as const;
const AVIF = { quality: 52, effort: 6, chromaSubsampling: '4:2:0' } as const;
const VIEWS = new Set(['front', 'side', 'back']);

export interface PictureEntry {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly widths: readonly number[];
  readonly average: string;
  readonly bytes: number;
  /** AVIF quality when it differs from the default (kept so a later run makes the same bytes). */
  readonly quality?: number;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * Library pictures keep the originals' own frame (3:4): never cropped, padded or upscaled. Padding to 4:5 was tried three ways (a mean colour, mirroring, edge copy with blur) and each
 * left a visible mark where the top meets the frame edge, so tiles use the pictures' own aspect instead.
 */
async function decodeWhole(src: string): Promise<{ buf: Buffer; widthPx: number; heightPx: number }> {
  const { data, info } = await sharp(src).removeAlpha().png().toBuffer({ resolveWithObject: true });
  return { buf: data, widthPx: info.width, heightPx: info.height };
}

/** Returns the sRGB average colour of an image as `#rrggbb`. */
async function averageHex(input: string | Buffer): Promise<string> {
  const { channels } = await sharp(input).removeAlpha().stats();
  return '#' + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
}

const root = join(import.meta.dirname, '..');

/** The command line, with its defaults. */
function readOptions() {
  const originals = arg('--originals');
  if (!originals) throw new Error('usage: node scripts/images.ts --originals <dir> [--out public/library] [--only ids] [--hash-log file]');
  const qualities = (arg('--quality')?.split(',') ?? []).map((kv): [string, number] => [kv.slice(0, kv.lastIndexOf('=')), Number(kv.slice(kv.lastIndexOf('=') + 1))]);
  return {
    originals,
    out: arg('--out') ?? join(root, 'public', 'library'),
    only: arg('--only')?.split(','),
    hashLog: arg('--hash-log'),
    quality: new Map(qualities),
    indexFile: arg('--index') ?? join(root, 'content', 'pictures.json'),
  };
}

/** Encodes one original at every shipped width; logs each output's hash when asked. */
async function encode(src: string, model: string, stem: string, out: string, quality: number, hashLog: string | undefined): Promise<PictureEntry> {
  const whole = await decodeWhole(src);
  const { widthPx, heightPx } = whole;
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, widthPx)))];
  mkdirSync(join(out, model), { recursive: true });
  let bytes = 0;
  for (const w of widths) {
    const target = join(out, model, `${stem}-${String(w)}.avif`);
    // sharp writes no EXIF, XMP, ICC or C2PA data unless withMetadata() is called, which it never is here.
    const buf = await sharp(whole.buf).resize({ width: w }).avif({ ...AVIF, quality }).toBuffer();
    writeFileSync(target, buf);
    bytes += buf.length;
    if (hashLog) {
      const sha = createHash('sha256').update(buf).digest('hex');
      appendFileSync(hashLog, `${sha}  ${relative(root, target).replaceAll('\\', '/')}  source=${model}/${basename(src)} via scripts/images.ts\n`);
    }
  }
  const average = await averageHex(whole.buf);
  return quality === AVIF.quality ? { widthPx, heightPx, widths, average, bytes } : { widthPx, heightPx, widths, average, bytes, quality };
}

async function main(): Promise<void> {
  const o = readOptions();
  const index: Record<string, PictureEntry> = existsSync(o.indexFile)
    ? (JSON.parse(readFileSync(o.indexFile, 'utf8')) as Record<string, PictureEntry>)
    : {};
  for (const model of readdirSync(o.originals, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    for (const file of readdirSync(join(o.originals, model)).filter((f) => f.endsWith('.png'))) {
      const stem = file.slice(0, -4);
      if (!VIEWS.has(stem.slice(stem.lastIndexOf('-') + 1))) throw new Error(`${model}/${file}: the name must end in -front, -side or -back`);
      const key = `${model}/${stem}`;
      if (o.only && !o.only.includes(key)) continue;
      const entry = await encode(join(o.originals, model, file), model, stem, o.out, o.quality.get(key) ?? index[key]?.quality ?? AVIF.quality, o.hashLog);
      index[key] = entry;
      console.log(`${key}: ${entry.widths.join('/')} px, ${(entry.bytes / 1000).toFixed(0)} kB`);
    }
  }
  const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(o.indexFile), { recursive: true });
  writeFileSync(o.indexFile, JSON.stringify(sorted, null, 2) + '\n');
  const total = Object.values(sorted).reduce((s, e) => s + e.bytes, 0);
  console.log(`pictures: ${String(Object.keys(sorted).length)}; library bytes: ${(total / 1e6).toFixed(1)} MB`);
}

await main();
