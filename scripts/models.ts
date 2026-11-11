/**
 * `npm run models`: gets every file in models.manifest.json once (npm files are
 * copied from node_modules, the rest downloaded from their pinned source), checks size and SHA-256, and writes
 * it to public/models/<sha256>.<ext>. It never writes anywhere else.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** One manifest record (the worker's registry reads the same file). */
interface Entry {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
  readonly source: string;
  readonly licence: string;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public', 'models');

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** The served file name: content-addressed, so a changed file can never hide behind an old name. */
const storedName = (entry: Pick<Entry, 'path' | 'sha256'>): string => `${entry.sha256}${extname(entry.path)}`;

/** A sync client or antivirus can briefly lock new files; retry the few errors it causes. */
async function retry<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (attempt >= 5 || (code !== 'EPERM' && code !== 'EBUSY')) throw e;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}

/** The installed package.json of one package. */
const installedVersion = async (name: string): Promise<{ version: string; dependencies?: Record<string, string> }> =>
  JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8')) as { version: string; dependencies?: Record<string, string> };

/** Reads `npm:<package>@<version>/<file>` from node_modules, after checking the installed version. */
async function fromNpm(name: string, version: string, file: string): Promise<Uint8Array> {
  const pkg = await installedVersion(name);
  if (pkg.version !== version) throw new Error(`${name} is ${pkg.version} in node_modules, the manifest pins ${version}`);
  return new Uint8Array(await readFile(join(root, 'node_modules', name, file)));
}

async function fromSource(source: string): Promise<{ bytes: Uint8Array; how: string }> {
  const [, name, version, file] = /^npm:((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/.exec(source) ?? [];
  if (name && version && file) return { bytes: await fromNpm(name, version, file), how: 'copied' };
  if (!source.startsWith('https://')) throw new Error(`unknown source ${source}`);
  const res = await fetch(source);
  if (!res.ok) throw new Error(`HTTP ${String(res.status)} from ${source}`);
  return { bytes: new Uint8Array(await res.arrayBuffer()), how: 'downloaded' };
}

/** Returns how the file got there: present (already verified), copied or downloaded. */
async function ensure(entry: Entry): Promise<string> {
  const target = join(outDir, storedName(entry));
  const existing = await readFile(target).catch(() => null);
  if (existing?.byteLength === entry.bytes && sha256(existing) === entry.sha256) return 'present';
  const { bytes, how } = await fromSource(entry.source);
  if (bytes.byteLength !== entry.bytes) throw new Error(`${entry.path}: ${String(bytes.byteLength)} bytes, manifest says ${String(entry.bytes)}`);
  const actual = sha256(bytes);
  if (actual !== entry.sha256) throw new Error(`${entry.path}: SHA-256 ${actual}, manifest says ${entry.sha256}`);
  const part = `${target}.part`;
  await retry(() => writeFile(part, bytes));
  await retry(() => rename(part, target));
  return how;
}

/**
 * The runtime pins: each installed package must be the pinned version, and ONNX Runtime
 * must be the build Transformers.js itself pins (a development build: 1.31.0-dev.20260914). Returns the problems.
 */
async function checkPins(pins: Readonly<Record<string, string>>): Promise<string[]> {
  const problems: string[] = [];
  for (const [name, version] of Object.entries(pins)) {
    const installed = await installedVersion(name);
    console.log(`pin     ${name}@${version}  installed ${installed.version}`);
    if (installed.version !== version) problems.push(`${name} is ${installed.version} in node_modules, the manifest pins ${version}`);
  }
  const ort = pins['onnxruntime-web'];
  const tjs = pins['@huggingface/transformers'] ? (await installedVersion('@huggingface/transformers')).dependencies?.['onnxruntime-web'] : undefined;
  if (ort !== undefined && tjs !== undefined && tjs !== ort) problems.push(`Transformers.js pins onnxruntime-web ${tjs}, the manifest pins ${ort}`);
  return problems;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(join(root, 'models.manifest.json'), 'utf8')) as { runtimes?: Record<string, string>; files: readonly Entry[] };
  await mkdir(outDir, { recursive: true });
  const pinProblems = await checkPins(manifest.runtimes ?? {});
  for (const problem of pinProblems) console.error(`FAILED  ${problem}`);
  let failed = pinProblems.length;
  let total = 0;
  for (const entry of manifest.files) {
    try {
      const how = await ensure(entry);
      total += entry.bytes;
      console.log(`ok      ${entry.path}  ${String(entry.bytes)} B  ${entry.sha256.slice(0, 12)}  ${how}`);
    } catch (e) {
      failed++;
      console.error(`FAILED  ${entry.path}: ${e instanceof Error ? e.message : String(e)}`);
      await rm(join(outDir, `${storedName(entry)}.part`), { force: true });
    }
  }
  const known = new Set(manifest.files.map(storedName));
  const stale = (await readdir(outDir)).filter((name) => !known.has(name));
  if (stale.length > 0) console.warn(`not in the manifest (left alone, delete them by hand): ${stale.join(', ')}`);
  const filesFailed = failed - pinProblems.length;
  console.log(`models: ${String(manifest.files.length - filesFailed)} of ${String(manifest.files.length)} files verified, ${String(total)} bytes in public/models`);
  if (failed > 0) process.exitCode = 1;
}

await main();
