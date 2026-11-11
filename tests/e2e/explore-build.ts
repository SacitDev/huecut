/**
 * Test setup of the Explore e2e (explore.spec.ts runs it as a child process; Node runs this file as TypeScript):
 * builds the app on the fixture content into its own output folder, never `dist`, without touching `src/generated`.
 * The content build writes the fixture set, plus the app's prompt templates the fixture lacks, into a temporary
 * folder; a Vite plugin points every `src/generated` import and the content loader's glob there; the fixture pictures
 * `public/library` lacks are written into the output as solid blocks in their average colour, so the page makes no
 * failing request.
 * Usage: node tests/e2e/explore-build.ts <work folder> <output folder, relative to the app>
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { build, type Plugin } from 'vite';
import { buildContent } from '../../scripts/content/build.ts';
import type { PictureEntry } from '../../src/domain/content/types.ts';

// The real path: Vite reports importers by it, and a folder reached through a link or a redirected profile has another one.
const app = realpathSync.native(resolve(import.meta.dirname, '..', '..'));
const fail = (message: string): never => {
  throw new Error(message);
};
const USAGE = 'usage: node tests/e2e/explore-build.ts <work folder> <output folder>';
const work: string = process.argv[2] ?? fail(USAGE);
const outDir: string = process.argv[3] ?? fail(USAGE);
// `dist` is the shared build other suites serve; this fixture build must never replace it.
if (resolve(app, outDir) === resolve(app, 'dist') || !resolve(app, outDir).startsWith(app + sep)) fail(`explore-build: refusing output folder ${outDir}`);
const real = join(app, 'src', 'generated');
const generated = join(work, 'generated');
const contentDir = join(work, 'content');
const posix = (p: string): string => p.replaceAll('\\', '/');

/** The fixture content with the app's own prompt templates for the kinds the fixture has none of (Copy prompt), and its bands. */
function fixtureContent(): void {
  rmSync(work, { recursive: true, force: true });
  cpSync(join(app, 'tests', 'fixtures', 'content'), contentDir, { recursive: true });
  for (const name of readdirSync(join(app, 'content', 'prompts'))) {
    const target = join(contentDir, 'prompts', name);
    if (!existsSync(target)) cpSync(join(app, 'content', 'prompts', name), target);
  }
  // The face card states only facts with set cuts, and the fixture's bands are unset: the suites that reach the card need them.
  cpSync(join(app, 'content', 'bands.json'), join(contentDir, 'bands.json'));
  const result = buildContent(contentDir, generated, { complete: false });
  const errors = result.check.problems.filter((p) => p.level === 'error');
  if (!result.ok) throw new Error(`fixture content build failed: ${errors.map((p) => `${p.file} ${p.message}`).join('; ')}`);
  console.log(`explore-build: content ${String(result.written.length)} files in the work folder`);
}

/** Every import that resolves into `src/generated`, and the content loader's glob base, go to the temporary folder. */
function generatedFromWork(): Plugin {
  const loader = join(app, 'src', 'platform', 'content.ts');
  return {
    name: 'explore-e2e-generated',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer === undefined || !source.includes('generated/')) return null;
      const [path = '', query] = source.split('?', 2);
      const target = resolve(dirname(importer), path);
      if (!target.startsWith(real + sep)) return null;
      return join(generated, relative(real, target)) + (query === undefined ? '' : `?${query}`);
    },
    transform(code, id) {
      if (resolve(id.split('?')[0] ?? '') !== loader) return null;
      const base = `base: '${posix(relative(dirname(loader), generated))}/'`;
      if (!code.includes("base: '../generated/'")) throw new Error('content.ts no longer names its glob base as expected');
      return code.replace("base: '../generated/'", base);
    },
  };
}

/** Solid placeholders, at every width the picture index lists, for fixture pictures the library folder lacks. */
async function placeholderPictures(): Promise<number> {
  const pictures = JSON.parse(readFileSync(join(contentDir, 'pictures.json'), 'utf8')) as Record<string, PictureEntry>;
  let written = 0;
  for (const [key, entry] of Object.entries(pictures)) {
    for (const width of entry.widths) {
      const name = `${key}-${String(width)}.avif`;
      if (existsSync(join(app, 'public', 'library', name))) continue;
      const file = join(app, outDir, 'library', name);
      mkdirSync(dirname(file), { recursive: true });
      const height = Math.round((width * entry.heightPx) / entry.widthPx);
      await sharp({ create: { width, height, channels: 3, background: entry.average } }).avif({ quality: 40 }).toFile(file);
      written += 1;
    }
  }
  return written;
}

fixtureContent();
const started = Date.now();
await build({ root: app, configFile: join(app, 'vite.config.ts'), plugins: [generatedFromWork()], logLevel: 'warn', build: { outDir, emptyOutDir: true } });
console.log(`explore-build: vite build into ${outDir} in ${String(Math.round((Date.now() - started) / 1000))} s`);
console.log(`explore-build: ${String(await placeholderPictures())} placeholder pictures in ${outDir}/library`);
