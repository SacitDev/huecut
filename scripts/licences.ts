/**
 * `npm run licences`: writes THIRD_PARTY_LICENSES.md, with the licence texts of everything the site ships, from the
 * lockfile, the installed packages and models.manifest.json. It names every package whose licence it cannot determine, writes nothing and exits 1.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface LockEntry { readonly version: string; readonly license?: string; readonly dev?: boolean; readonly optional?: boolean }
interface Manifest {
  readonly runtimes: Readonly<Record<string, string>>;
  readonly files: readonly { readonly path: string; readonly source: string; readonly licence: string }[];
}
interface FontMetadata { readonly family: string; readonly license: { readonly attribution: string }; readonly source: string }
interface Package { readonly key: string; readonly name: string; readonly version: string; readonly licence: string; readonly optional: boolean }

const root = join(import.meta.dirname, '..');
const NODE_MODULES = 'node_modules/';
/** The name THIRD_PARTY_LICENSES.md gives each runtime and model folder; one with no name here stops the script. */
const NAMES: Readonly<Record<string, string>> = {
  '@mediapipe/tasks-vision': 'MediaPipe Tasks Vision',
  '@huggingface/transformers': 'Transformers.js',
  'onnxruntime-web': 'ONNX Runtime Web',
  mediapipe: 'MediaPipe',
  'depth-anything-v2-small': 'Depth Anything V2 Small',
  'sam2.1-hiera-tiny': 'SAM 2.1 Hiera Tiny',
};
/** A dev dependency whose files the site serves: `src/ui/icons.tsx` inlines these icons. */
const ICONS = '@phosphor-icons/core';
const FONT_SCOPE = '@fontsource-variable/';
/** One SPDX identifier or an AND/OR expression; "SEE LICENSE IN ..." and "UNLICENSED" say nothing a reader can use. */
const SPDX = /^\(?[\w.+-]+(?: (?:AND|OR) [\w.+-]+)*\)?$/;
/**
 * Lockfile paths of the code in the built site, measured from a build's source maps. Four never show there and were read from the bundles:
 * the bundle Transformers.js publishes inlines jinja and tokenizers, and onnxruntime-web, whose banner is in the worker's chunk, inlines its
 * nested onnxruntime-common. Measure again after any upgrade.
 */
const SHIPPED: ReadonlySet<string> = new Set([
  '@huggingface/jinja',
  '@huggingface/tokenizers',
  '@huggingface/transformers',
  '@mediapipe/tasks-vision',
  'comlink',
  'onnxruntime-common',
  'onnxruntime-web',
  'onnxruntime-web/node_modules/onnxruntime-common',
  'react',
  'react-dom',
  'scheduler',
  'three',
  'xstate',
].map((path) => `${NODE_MODULES}${path}`));
/** Licence, copying and notice files sit at a package's root; Apache-2.0 §4(d) makes a NOTICE as binding as the licence. */
const LEGAL_FILE = /^(?:licen[cs]e|copying)|notice/i;
/** Shipped packages that publish no licence file: the copyright line in their own files, which is checked, goes with the standard text. */
const NO_LICENCE_FILE: Readonly<Record<string, { readonly notice: string; readonly file: string }>> = {
  'node_modules/@mediapipe/tasks-vision': { notice: 'Copyright 2022 The MediaPipe Authors.', file: 'vision.d.ts' },
  'node_modules/onnxruntime-common': { notice: 'Copyright (c) Microsoft Corporation. All rights reserved.', file: 'lib/index.ts' },
  'node_modules/onnxruntime-web': { notice: 'Copyright (c) Microsoft Corporation. All rights reserved.', file: 'lib/index.ts' },
  'node_modules/onnxruntime-web/node_modules/onnxruntime-common': { notice: 'Copyright (c) Microsoft Corporation. All rights reserved.', file: 'lib/index.ts' },
};
/** What each model's upstream and the mirror it is downloaded from state, read from the model host's records. */
const MODEL_NOTES: readonly string[] = [
  'SAM 2.1 Hiera Tiny: the upstream model (https://huggingface.co/facebook/sam2.1-hiera-tiny) is under Apache-2.0, the licence shown above. The mirror the files are downloaded from (https://huggingface.co/onnx-community/sam2.1-hiera-tiny-ONNX) states no licence.',
  'Depth Anything V2 Small: the upstream model (https://huggingface.co/depth-anything/Depth-Anything-V2-Small) and the mirror the files are downloaded from (https://huggingface.co/onnx-community/depth-anything-v2-small) both state Apache-2.0.',
];

const problems: string[] = [];
const readText = (...path: string[]): string => readFileSync(join(root, ...path), 'utf8');
const readJson = (...path: string[]): unknown => JSON.parse(readText(...path));
const usable = (licence: unknown): licence is string => typeof licence === 'string' && SPDX.test(licence) && licence !== 'UNLICENSED';
const byName = (a: Package, b: Package): number => (a.name === b.name ? (a.version < b.version ? -1 : 1) : a.name < b.name ? -1 : 1);
const isFont = (p: Package): boolean => p.name.startsWith(FONT_SCOPE);
/** The same text on any system: packages differ in line endings and trailing spaces, and a checkout may convert them. */
const tidy = (text: string): string => text.replaceAll('\r\n', '\n').replace(/[ \t]+$/gm, '').trim();

/**
 * One lockfile entry with its licence from validated installed package metadata.
 * An absent optional package uses the lockfile licence if it is usable.
 */
function readPackage(key: string, entry: LockEntry): Package {
  const name = key.slice(key.lastIndexOf(NODE_MODULES) + NODE_MODULES.length);
  const result = { key, name, version: entry.version, optional: entry.optional === true };
  const fail = (why: string): Package => {
    problems.push(`${name}@${entry.version}: ${why}`);
    return { ...result, licence: 'unknown' };
  };
  const file = join(root, key, 'package.json');
  if (!existsSync(file)) return result.optional && usable(entry.license) ? { ...result, licence: entry.license } : fail('not installed');
  const { version, license } = JSON.parse(readFileSync(file, 'utf8')) as { version?: string; license?: unknown };
  if (version !== entry.version) return fail(`installed version ${String(version)}, lockfile version ${entry.version}`);
  if (!usable(license)) return fail(`package.json licence field is ${typeof license === 'string' ? `"${license}"` : 'missing or not text'}`);
  if (entry.license !== undefined && license !== entry.license) return fail(`package.json says ${license}, lockfile says ${entry.license}`);
  return { ...result, licence: license };
}

const table = (head: readonly string[], rows: readonly (readonly string[])[]): string =>
  [head, head.map(() => '---'), ...rows].map((r) => `| ${r.join(' | ')} |`).join('\n');

function nameOf(key: string): string {
  const name = NAMES[key];
  if (name === undefined) problems.push(`${key}: no display name in scripts/licences.ts`);
  return name ?? key;
}

function runtimeRows(manifest: Manifest, packages: readonly Package[]): string[][] {
  return Object.entries(manifest.runtimes).map(([name, version]) => {
    const found = packages.find((p) => p.name === name && p.version === version);
    if (!found) problems.push(`${name}@${version}: in models.manifest.json but not in the lockfile`);
    return [nameOf(name), name, version, found?.licence ?? 'unknown', `npm:${name}@${version}`];
  });
}

function modelRows(manifest: Manifest): string[][] {
  return manifest.files.map((f) => {
    if (!usable(f.licence)) problems.push(`${f.path}: no usable licence in models.manifest.json`);
    return [nameOf(f.path.split('/')[0] ?? f.path), f.path, f.licence, f.source];
  });
}

function fontRows(fonts: readonly Package[]): string[][] {
  return fonts.map((p) => {
    const meta = readJson('node_modules', ...p.name.split('/'), 'metadata.json') as FontMetadata;
    return [meta.family, p.name, p.version, p.licence, meta.license.attribution, meta.source];
  });
}

/** The standard text of a licence, from an installed package that carries it unaltered; MIT needs the holder's own copyright line. */
function standardText(licence: string, notice: string): string | undefined {
  if (licence === 'Apache-2.0') return tidy(readText(NODE_MODULES, '@huggingface/transformers', 'LICENSE'));
  if (licence !== 'MIT') return undefined;
  const reference = tidy(readText(NODE_MODULES, 'react', 'LICENSE'));
  const permission = reference.indexOf('Permission is hereby granted');
  if (permission < 0) problems.push('react: its LICENSE no longer has the MIT permission text');
  return `MIT License\n\n${notice}\n\n${reference.slice(permission)}`;
}

/** Every licence and notice text of one shipped package, with who it applies to. */
function legalTexts(p: Package): { readonly owner: string; readonly text: string }[] {
  const label = `\`${p.name}\` ${p.version}`;
  const files = readdirSync(join(root, p.key)).filter((f) => LEGAL_FILE.test(f)).sort();
  if (files.length > 0) return files.map((f) => ({ owner: files.length > 1 ? `${label} (${f})` : label, text: tidy(readText(p.key, f)) }));
  const missing = NO_LICENCE_FILE[p.key];
  const text = missing && standardText(p.licence, missing.notice);
  if (missing === undefined || text === undefined) {
    problems.push(`${p.name}@${p.version}: no licence file in the package and no standard text for ${p.licence}`);
    return [];
  }
  if (!readText(p.key, missing.file).includes(missing.notice)) problems.push(`${p.name}@${p.version}: "${missing.notice}" is not in ${missing.file}`);
  return [{ owner: `${label} (the package has no licence file; ${missing.notice} is from its ${missing.file})`, text }];
}

/** Each distinct text once, so the file stays a readable size, followed by what it applies to. */
function legalSection(shipped: readonly Package[]): string {
  const groups = new Map<string, { readonly licence: string; readonly owners: string[] }>();
  const add = (licence: string, owner: string, text: string): void => {
    const group = groups.get(text) ?? { licence, owners: [] };
    group.owners.push(owner);
    groups.set(text, group);
  };
  add('Apache-2.0', 'the Apache-2.0 models and MediaPipe files under "Models and runtime files"', standardText('Apache-2.0', '') ?? '');
  for (const p of shipped) for (const { owner, text } of legalTexts(p)) add(p.licence, owner, text);
  return [...groups]
    .sort(([textA, a], [textB, b]) => (a.licence === b.licence ? (textA < textB ? -1 : 1) : a.licence < b.licence ? -1 : 1))
    .map(([text, { licence, owners }]) => `### ${licence}\n\nApplies to: ${owners.join('; ')}.\n\n\`\`\`text\n${text}\n\`\`\``)
    .join('\n\n');
}

/** The whole file: no dates and sorted rows, so a re-run makes no change. */
function render(manifest: Manifest, packages: readonly Package[], icons: readonly Package[]): string {
  const fonts = packages.filter(isFont);
  const inSite = packages.filter((p) => SHIPPED.has(p.key));
  const rest = packages.filter((p) => !SHIPPED.has(p.key) && !isFont(p));
  const row = (p: Package): string[] => [p.name, p.version, p.licence];
  const sourced = (p: Package): string[] => [...row(p), `npm:${p.name}@${p.version}`];
  const ortCommit = readText(NODE_MODULES, 'onnxruntime-web', '__commit.txt').trim();
  return `${[
    '# Third-party licences',
    'Huecut itself is under the MIT licence (`LICENSE`). This file is built by `npm run licences` from `package-lock.json`, the installed packages and `models.manifest.json`; change those, not this file.',
    '## Runtimes',
    table(['Name', 'Package', 'Version', 'Licence', 'Source'], runtimeRows(manifest, packages)),
    '## Models and runtime files',
    'The app serves these from its own address. `npm run models` fetches each from the source shown.',
    table(['Name', 'File', 'Licence', 'Source'], modelRows(manifest)),
    ...MODEL_NOTES,
    `ONNX Runtime's WebAssembly file contains third-party libraries. Its npm package carries no notices for them; ONNX Runtime publishes them at https://github.com/microsoft/onnxruntime/blob/${ortCommit}/ThirdPartyNotices.txt. MediaPipe's WebAssembly file is also built with third-party libraries and its package carries no notices either; its source is at https://github.com/google-ai-edge/mediapipe.`,
    '## Fonts',
    'The full texts are under "Licence texts" below and are served with the site in `fonts/`.',
    table(['Font', 'Package', 'Version', 'Licence', 'Copyright', 'Source'], fontRows(fonts)),
    '## Icons',
    table(['Package', 'Version', 'Licence', 'Source'], icons.map(sourced)),
    '## Packages in the built site',
    '`@huggingface/jinja` and `@huggingface/tokenizers` reach the site inside the bundle Transformers.js publishes, whose copy can differ from the installed version shown by a patch release. ONNX Runtime Web does the same with its nested `onnxruntime-common`.',
    table(['Package', 'Version', 'Licence', 'Source'], inSite.map(sourced)),
    '## Packages not in the built site',
    'npm installs these as dependencies of the packages above, for Node.js or for building, or the app does not import them. A production build contains no code from them: its source maps name none of them and its files include no native binary. That covers `sharp` and the libvips binaries under LGPL-3.0-or-later. The site\'s pictures are prepared with `sharp` before publishing and contain none of its code.',
    '### Production packages',
    table(['Package', 'Version', 'Licence'], rest.filter((p) => !p.optional).map(row)),
    '### Optional production packages',
    'npm installs each of these only on a system it fits, so the licence shown is the one in the lockfile.',
    table(['Package', 'Version', 'Licence'], rest.filter((p) => p.optional).map(row)),
    '## Licence texts',
    'Every licence and notice file published by a package in the site, with line endings and trailing spaces made uniform. A text shared by several packages appears once.',
    legalSection([...inSite, ...fonts, ...icons].sort(byName)),
  ].join('\n\n')}\n`;
}

const lock = readJson('package-lock.json') as { readonly packages: Readonly<Record<string, LockEntry>> };
const entries = Object.entries(lock.packages).filter(([key]) => key !== '');
const packages = entries.filter(([, e]) => e.dev !== true).map(([key, e]) => readPackage(key, e)).sort(byName);
const icons = entries.filter(([key]) => key === `${NODE_MODULES}${ICONS}`).map(([key, e]) => readPackage(key, e));
if (icons.length !== 1) problems.push(`${ICONS}: not in the lockfile`);
for (const key of SHIPPED) if (!packages.some((p) => p.key === key)) problems.push(`${key}: listed as shipped but not a production package in the lockfile`);
// A new dependency must be measured before it can be called shipped or not, so its licence text cannot go missing unnoticed.
for (const name of Object.keys((readJson('package.json') as { readonly dependencies: Readonly<Record<string, string>> }).dependencies)) {
  if (!name.startsWith(FONT_SCOPE) && !SHIPPED.has(`${NODE_MODULES}${name}`)) problems.push(`${name}: a dependency that is not in SHIPPED`);
}
const text = render(readJson('models.manifest.json') as Manifest, packages, icons);

if (problems.length > 0) {
  console.error(`Cannot determine these licences, so THIRD_PARTY_LICENSES.md was not written:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
writeFileSync(join(root, 'THIRD_PARTY_LICENSES.md'), text);
console.log(`THIRD_PARTY_LICENSES.md: ${String(packages.length)} production packages, ${String(icons.length)} icon set, ${String(Buffer.byteLength(text))} bytes`);
