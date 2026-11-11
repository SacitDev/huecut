/** What the engine tests share: the engine's content as the app ships it, built from a content directory, and a seeded random generator. */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContent } from '../../scripts/content/build.ts';
import { libraryOf } from '../../src/app/consult-deps.ts';
import type { ConsultData, LibraryIndex } from '../../src/domain/content/output.ts';
import type { EngineContent } from '../../src/domain/engine/recommend.ts';
import type { ConsultContent } from '../../src/machine/consult.types.ts';

/**
 * The engine's content through the shipped path, so a test sees what the app sees: the content build writes `library-index.json` and `consult.json` (checked
 * library records only, rules as shipped) to a temporary folder, and the app's own `libraryOf` turns them into the engine's content.
 * `note` names the first build error; a content that does not build gives no content.
 */
export function engineFrom(dir: string): { readonly content: EngineContent | null; readonly shipped: ConsultContent | null; readonly note: string } {
  const out = mkdtempSync(join(tmpdir(), 'huecut-engine-content-'));
  try {
    const built = buildContent(dir, out, { complete: false });
    const errors = built.check.problems.filter((p) => p.level === 'error');
    const note = `${String(errors.length)} build errors${errors[0] ? `, first: ${errors[0].file} ${errors[0].path}: ${errors[0].message}` : ''}`;
    if (!built.ok) return { content: null, shipped: null, note };
    const read = (name: string): unknown => JSON.parse(readFileSync(join(out, name), 'utf8'));
    const shipped: ConsultContent = { library: read('library-index.json') as LibraryIndex, consult: read('consult.json') as ConsultData };
    return { content: libraryOf(shipped).engine, shipped, note };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/** mulberry32, seeded, so a sweep is the same on every run. */
export function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
