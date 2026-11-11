/**
 * Pseudo-Latvian, for tests only: every text `i18n/lv.md` exports (strings, function strings, content and the domain's
 * copy) as a marked stand-in about 35 % longer that uses the Latvian letters, served in place of the build's two Latvian chunks.
 * It is made here from the export's own source and never written into `i18n/lv.md` or the `lv-*.json` files.
 */
import type { Page } from '@playwright/test';
import { join } from 'node:path';
import { exportRows } from '../../scripts/i18n/export.ts';
import { tables } from '../../scripts/i18n/import.ts';
import { collect } from '../../scripts/i18n/source.ts';

const SWAP: Readonly<Record<string, string>> = {
  a: 'ā', c: 'č', e: 'ē', g: 'ģ', i: 'ī', k: 'ķ', l: 'ļ', n: 'ņ', s: 'š', u: 'ū', z: 'ž',
  A: 'Ā', C: 'Č', E: 'Ē', G: 'Ģ', I: 'Ī', K: 'Ķ', L: 'Ļ', N: 'Ņ', S: 'Š', U: 'Ū', Z: 'Ž',
};
/** What each word grows by: 35 % of its length, rounded up, in Latvian letters, so a word never reads as plain ASCII. */
const LONGER = 'āčēģīķļņšūž';

/** One English text as the pseudo-Latvian shows it: `⟦…⟧`, every word swapped and longer; placeholders and line breaks kept. */
export const lv = (english: string): string =>
  `⟦${english.replace(/\{\w+\}|[A-Za-z]+/g, (w) => (w.startsWith('{') ? w : w.replace(/[acegiklnsuz]/gi, (c) => SWAP[c] ?? c) + LONGER.slice(0, Math.ceil(w.length * 0.35))))}⟧`;

/**
 * The two Latvian chunks with every row filled: a row that is only names and placeholders keeps its English, as a translation
 * would; safety rows are marked `checked`, so they show, and the walk checks their length too.
 */
function pseudoTables() {
  const source = collect(join(import.meta.dirname, '..', '..'));
  const rows = exportRows(source, []).rows.map((r) => {
    const entry = source.entries.find((e) => e.id === r.id);
    return { ...r, latvian: entry?.same ? r.english : lv(r.english), notes: [...r.notes, 'checked'] };
  });
  return tables(rows, source);
}

let made: ReturnType<typeof pseudoTables> | undefined;
const LATVIAN_CHUNK = /\/assets\/lv-(?:strings|content)-[\w-]+\.js$/;

/** Serves the pseudo-Latvian for the build's Latvian chunks and starts the page in Latvian; returns how many rows of each it holds. */
export async function plantPseudoLatvian(page: Page): Promise<{ readonly strings: number; readonly functions: number; readonly content: number }> {
  made ??= pseudoTables();
  const { strings, content } = made;
  await page.route(LATVIAN_CHUNK, (route) =>
    route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: `export default ${JSON.stringify(route.request().url().includes('/lv-strings-') ? strings : content)};` }));
  await page.addInitScript(() => {
    localStorage.setItem('huecut:language', 'lv');
  });
  return { strings: Object.keys(strings.strings).length, functions: Object.keys(strings.functions).length, content: Object.keys(content).length };
}
