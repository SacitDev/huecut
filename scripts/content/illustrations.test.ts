/**
 * The question illustrations in `public/illustrations/`: the 51 drawings exist and keep the drawing
 * rules (only `svg` and `path`, `currentColor` only, one viewBox, no text, comments, rasters or styles, under 3 KB),
 * each rule shown to catch a planted case; every id resolves to its drawing or photo; and the 57 swatches are what the
 * build draws, each sample showing what its answer says.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { srgbToLab } from '../../src/domain/colour/lab.ts';
import type { Shade } from '../../src/domain/content/types.ts';
import { illustrationFile } from './check-items.ts';
import { swatchFiles } from './swatches.ts';

const DIR = fileURLToPath(new URL('../../public/illustrations/', import.meta.url));
const DRAWINGS = [
  'q-hairline-straight', 'q-hairline-rounded', 'q-hairline-peak', 'q-hairline-m',
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => `q-recession-${String(n)}`), ...[1, 2, 3].map((n) => `q-thinning-${String(n)}`),
  'q-crown-flat', 'q-crown-rounded', 'q-whorl-none', 'q-whorl-single', 'q-whorl-double',
  'q-occiput-flat', 'q-occiput-rounded', 'q-occiput-prominent',
  ...['very-short', 'short', 'chin', 'shoulder', 'long', 'very-long'].map((l) => `q-length-${l}`),
  ...['crown', 'front', 'diffuse'].map((z) => `q-thinning-${z}`), ...['fine', 'medium', 'coarse'].map((s) => `q-strand-${s}`),
  ...['none', 'stubble', 'short', 'medium', 'full', 'patchy'].map((b) => `q-beard-${b}`), ...['straight', 'wavy', 'curly', 'coily'].map((t) => `q-beard-texture-${t}`),
  ...['left', 'right', 'centre', 'none'].map((p) => `q-part-${p}`), ...['bold', 'thin', 'rimless'].map((g) => `q-glasses-${g}`),
];
const PHOTOS = ['q-texture-straight', 'q-texture-wavy', 'q-texture-curly', 'q-texture-coily', 'q-density-low', 'q-density-medium', 'q-density-high'];

/** 3 KB, counted as 1 KB = 1,000 bytes. */
const MAX_BYTES = 3_000;
const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" viewBox="0 0 96 128" ';
const ATTRIBUTES = new Set(['xmlns', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-opacity', 'fill-rule', 'd']);

/** The first capture group of every match of `pattern` in `svg`. */
const captures = (svg: string, pattern: RegExp): string[] => [...svg.matchAll(pattern)].map((m) => m[1] ?? '');

/** Each drawing rule: what it finds wrong in one SVG file's text. */
const RULES: readonly ((svg: string) => string[])[] = [
  (svg) => (Buffer.byteLength(svg) < MAX_BYTES ? [] : [`${String(Buffer.byteLength(svg))} bytes`]),
  (svg) => (svg.startsWith(OPEN) ? [] : ['not the shared root and viewBox']),
  (svg) => (/<[!?]/.test(svg) ? ['a comment or declaration'] : []),
  (svg) => captures(svg, /<\/?([^\s/>]+)/g).filter((tag) => tag !== 'svg' && tag !== 'path').map((tag) => `element ${tag}`),
  (svg) => captures(svg, /\s([\w:-]+)="[^"]*"/g).filter((name) => !ATTRIBUTES.has(name)).map((name) => `attribute ${name}`),
  (svg) => captures(svg, /\s(?:fill|stroke)="([^"]*)"/g).filter((v) => v !== 'currentColor' && v !== 'none').map((v) => `colour ${v}`),
  (svg) => (svg.replaceAll(/<[^>]*>/g, '').trim() === '' ? [] : ['text']),
];

/** What breaks the drawing rules in one SVG file's text; empty when it keeps them all. */
const drawingProblems = (svg: string): string[] => RULES.flatMap((rule) => rule(svg));

it('the 51 drawings exist and keep the drawing rules', () => {
  expect(DRAWINGS).toHaveLength(51);
  const svgs = readdirSync(DIR).filter((name) => name.endsWith('.svg') && !name.startsWith('q-swatch-')).sort();
  expect(svgs).toEqual(DRAWINGS.map((id) => `${id}.svg`).sort());
  for (const name of svgs) expect(drawingProblems(readFileSync(join(DIR, name), 'utf8')), name).toEqual([]);
});

it('each drawing rule catches a planted case', () => {
  const good = readFileSync(join(DIR, 'q-hairline-m.svg'), 'utf8');
  const plant = (from: string, to: string) => drawingProblems(good.replace(from, to));
  expect(drawingProblems(good)).toEqual([]);
  expect(plant('<path ', '<text>Drawing 1</text><path ')).toEqual(expect.arrayContaining(['element text', 'text']));
  expect(plant('<path ', '<metadata/><path ')).toEqual(['element metadata']);
  expect(plant('<path ', '<!-- made by hand --><path ')).toContain('a comment or declaration');
  expect(plant('<path ', '<image href="data:image/png;base64,AA"/><path ')).toEqual(['element image', 'attribute href']);
  expect(plant('<path ', '<style>path{fill:red}</style><path ')).toEqual(expect.arrayContaining(['element style', 'text']));
  expect(plant('<path ', '<path style="fill:red" ')).toEqual(['attribute style']);
  expect(plant('stroke="currentColor"', 'stroke="#2f1c19"')).toEqual(['colour #2f1c19']);
  expect(plant('viewBox="0 0 96 128"', 'viewBox="0 0 100 100"')).toEqual(['not the shared root and viewBox']);
  expect(plant('<path ', `<path d="M${'0 0L'.repeat(800)}0 0"/><path `)[0]).toMatch(/^\d+ bytes$/);
});

it('every id resolves to its drawing or its photo, and an unknown id to nothing', () => {
  for (const id of DRAWINGS) expect(illustrationFile(id)).toBe(`${id}.svg`);
  for (const id of PHOTOS) expect(illustrationFile(id)).toBe(`${id}.avif`);
  expect(illustrationFile('q-texture-nowhere')).toBeNull();
});

const shades = JSON.parse(readFileSync(fileURLToPath(new URL('../../content/colours/shades.json', import.meta.url)), 'utf8')) as Shade[];
const files = swatchFiles(shades);
const swatch = (name: string): string => files.get(`q-swatch-${name}.svg`) ?? '';
const hexes = (id: string): string[] => Object.values(shades.find((s) => s.id === id)?.swatch ?? {});
const silver = shades.find((s) => s.id === 'silver-white')?.swatch.mids ?? '';
/** CIE Lab of a #rrggbb colour, and its L*. */
const lab = (hex: string) => srgbToLab(...([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]));
const lightness = (hex: string): number => lab(hex).l;

describe('the swatches', () => {
  it('are the 57 the build draws, each in its file, small and with nothing but shapes', () => {
    expect([...files.keys()].sort()).toEqual(readdirSync(DIR).filter((name) => name.startsWith('q-swatch-')).sort());
    // 10 levels, 5 colour families, 6 grey amounts, 7 colour directions, 4 grey goals, 5 tones, 4 grey patterns, 6 skin depths, 4 undertones, 6 eye colours.
    expect(files.size).toBe(57);
    for (const [name, svg] of files) {
      expect(readFileSync(join(DIR, name), 'utf8'), name).toBe(svg);
      expect(Buffer.byteLength(svg), name).toBeLessThan(MAX_BYTES);
      expect(svg, name).not.toMatch(/<(text|image|script|style|metadata|foreignObject)|<!--|href=/);
    }
  });

  it('draw hair in the shades\' own colours: a level, a family, and a direction\'s before and after', () => {
    for (const hex of hexes('jet-black')) expect(swatch('1')).toContain(hex);
    for (const hex of hexes('copper')) expect(swatch('family-red-copper')).toContain(hex);
    for (const hex of [...hexes('mocha-brown'), ...hexes('dark-blonde')]) expect(swatch('direction-lighter')).toContain(hex);
    for (const hex of [...hexes('golden-brown'), ...hexes('ash-brown')]) expect(swatch('direction-tone')).toContain(hex);
    for (const hex of [...hexes('auburn'), ...hexes('copper')]) expect(swatch('tone-copper')).toContain(hex);
  });

  it('show each amount of grey as its share of ten strands, and each grey goal from the same lock with grey', () => {
    // Each strand's colour in the order it is painted: h brown, g grey. Painted in place, so no grey is laid over the brown.
    const order = (svg: string): string => [...svg.matchAll(/<path stroke="url\(#([hg])\)"/g)].map((m) => m[1]).join('');
    expect([0, 10, 20, 40, 60, 90].map((share) => order(swatch(`grey-${String(share)}`)).replaceAll('h', '').length)).toEqual([0, 1, 2, 4, 6, 9]);
    expect(order(swatch('grey-40'))).toBe('hghghhghgh');
    const before = (svg: string): string => svg.slice(svg.indexOf('stroke="url(#ah)"'), svg.indexOf('stroke="url(#bh)"'));
    const goals = ['cover', 'blend', 'embrace', 'silver'].map((g) => swatch(`grey-goal-${g}`));
    expect(new Set(goals.map(before)).size).toBe(1);
    expect(goals.map((svg) => svg.includes('url(#bg)'))).toEqual([false, true, true, false]);
    for (const hex of hexes('silver-white')) expect(swatch('grey-goal-silver').split('id="bh"')[1]).toContain(hex);
  });

  it('put each grey pattern\'s grey somewhere else on the head', () => {
    const grey = (svg: string): string => new RegExp(`stroke="${silver}"[^>]*d="([^"]*)"`).exec(svg)?.[1] ?? '';
    const where = ['even', 'temples', 'front', 'patches'].map((p) => grey(swatch(`grey-pattern-${p}`)));
    expect(where.every((d) => d.length > 0)).toBe(true);
    expect(new Set(where).size).toBe(4);
  });

});

describe('the skin and eye swatches', () => {
  it('run the skin depths from light to deep, show three depths of each undertone, and give each eye its own iris', () => {
    const skins = ['very-light', 'light', 'medium', 'tan-olive', 'deep', 'very-deep'].map((d) => lightness(/<rect x="12"[^>]*fill="(#[0-9a-f]{6})"/.exec(swatch(`skin-${d}`))?.[1] ?? '#000000'));
    expect(skins).toEqual(skins.toSorted((a, b) => b - a));
    expect(new Set(skins.map(Math.round)).size).toBe(6);
    const undertones = ['warm', 'cool', 'neutral', 'olive'].map((u) => [...swatch(`undertone-${u}`).matchAll(/<circle [^>]*fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]));
    for (const row of undertones) expect(new Set(row).size).toBe(3);
    expect(new Set(undertones.map((row) => row.join())).size).toBe(4);
    // Olive is a muted golden beige that keeps some redness (a* above 3): with none it read as khaki, not skin.
    expect(undertones[3]).toEqual(['#dbc3a6', '#a48d72', '#6a563d']);
    for (const hex of undertones[3] ?? []) expect(lab(hex ?? '').a).toBeGreaterThan(3);
    const irises = ['dark-brown', 'light-brown', 'hazel', 'green', 'blue', 'grey'].map((e) => /<radialGradient[^>]*>(.*?)<\/radialGradient>/.exec(swatch(`eye-${e}`))?.[1]);
    expect(new Set(irises).size).toBe(6);
  });
});
