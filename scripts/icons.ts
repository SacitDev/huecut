/**
 * Site icons: renders the brand SVGs in `public/icons/` to the PNG sizes the page and the web manifest name, with no
 * metadata chunks (only IHDR, PLTE, tRNS, IDAT, IEND). Below 40 px the bolder favicon drawing is used (brand rules).
 * Usage: node scripts/icons.ts [--hash-log <file>]   (appends "<sha256>  <path>  source=<svg> via scripts/icons.ts")
 */
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'public', 'icons');

/** Output name, pixel size and source drawing of every icon. */
const ICONS = [
  ['icon-16.png', 16, 'huecut-favicon.svg'],
  ['icon-32.png', 32, 'huecut-favicon.svg'],
  ['apple-touch-icon.png', 180, 'huecut-app-icon.svg'],
  ['icon-192.png', 192, 'huecut-app-icon.svg'],
  ['icon-512.png', 512, 'huecut-app-icon.svg'],
  ['maskable-192.png', 192, 'huecut-maskable.svg'],
  ['maskable-512.png', 512, 'huecut-maskable.svg'],
] as const;

/** The PNG chunks a shipped icon may hold; anything else (a density chunk, text) is dropped. */
const KEEP = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);
const SIGNATURE = 8;

/** Rebuilds a PNG from only the allowed chunks, so no metadata can ship. */
export function stripPng(png: Buffer): Buffer {
  const parts = [png.subarray(0, SIGNATURE)];
  for (let at = SIGNATURE; at < png.length; ) {
    const size = png.readUInt32BE(at) + 12;
    if (KEEP.has(png.toString('latin1', at + 4, at + 8))) parts.push(png.subarray(at, at + size));
    at += size;
  }
  return Buffer.concat(parts);
}

/** Renders every icon; the output is the same bytes on every run for the same drawings. */
export async function renderIcons(hashLog: string | undefined): Promise<void> {
  for (const [name, size, svg] of ICONS) {
    const density = Math.ceil((72 * size * 4) / 796);
    const png = await sharp(readFileSync(join(dir, svg)), { density }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    const out = stripPng(png);
    writeFileSync(join(dir, name), out);
    if (hashLog) {
      const sha = createHash('sha256').update(out).digest('hex');
      appendFileSync(hashLog, `${sha}  ${relative(root, join(dir, name)).replaceAll('\\', '/')}  source=${svg} via scripts/icons.ts\n`);
    }
    console.log(`${name}: ${String(size)} px, ${String(out.length)} bytes`);
  }
}

if (import.meta.main) {
  const i = process.argv.indexOf('--hash-log');
  await renderIcons(i >= 0 ? process.argv[i + 1] : undefined);
}
