/**
 * `i18n/lv.md`, the one file a translator fills: a Markdown table per section, one row per stable id (never a row
 * number), with the English, the Latvian, the English's source hash and notes. A cell escapes `\` as `\\`, `|` as `\|` and a
 * new line as `\n`, so pipes, new lines and Markdown survive the round trip; a row that lost a cell is reported, not guessed.
 */
import type { Section } from './source.ts';

/** Where a row sits: a section the app reads, or the entries the English no longer has (kept with their Latvian). */
export type Place = Section | 'removed';

/** One row of the file, its cells unescaped. */
export interface Row {
  readonly id: string;
  readonly english: string;
  readonly latvian: string;
  readonly source: string;
  readonly notes: readonly string[];
  readonly place: Place;
}

/** A problem the round trip found: errors stop the import, notes are listed. */
export interface Problem {
  readonly level: 'error' | 'note';
  readonly id: string;
  readonly message: string;
}

const HEADINGS: Readonly<Record<Place, string>> = { strings: '## Strings', content: '## Content', removed: '## Removed' };
const COLUMNS = ['id', 'English', 'Latvian', 'source', 'notes'];
const HEAD = `| ${COLUMNS.join(' | ')} |`;
const RULE = `|${' --- |'.repeat(COLUMNS.length)}`;

const INTRO = [
  '# Huecut in Latvian',
  '',
  'Every text the app shows, one row each. Fill only the Latvian column; keep the id, English, source and notes as they are.',
  '',
  '- Keep every `{placeholder}` exactly as it is: the app puts a name or a number there.',
  '- `\\|` is a | in the text and `\\n` a new line: keep both written that way.',
  '- `plural zero`, `plural one`, `plural other` in the notes: the Latvian form for those numbers, each with its `{placeholder}`.',
  '- `safety`: shown in English in the app until its Latvian passes the back-translation check and `checked` is in the notes. Importing a changed Latvian text for it clears `checked`.',
  '- `same`: the Latvian may be the same as the English.',
  '- `was:` the Latvian before the English changed: translate the new English.',
  '',
  'Then `npm run i18n:import` checks the file and builds the app\'s Latvian.',
  '',
];

/** A text as a table cell: backslash, pipe and new line escaped. */
const escapeCell = (text: string): string => text.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', '\\n');
/** A table cell back to its text. */
const unescapeCell = (text: string): string => text.replace(/\\([\\|n])/g, (_, c: string) => (c === 'n' ? '\n' : c));

/** The notes cell: `safety; plural one: 1, 21…; was: …`, with `was:` last because its text may hold anything. */
const notesCell = (notes: readonly string[]): string => escapeCell(notes.join('; '));
const notesOf = (cell: string): string[] => {
  const text = unescapeCell(cell);
  const was = text.indexOf('was: ');
  const head = (was < 0 ? text : text.slice(0, was)).split(';').map((n) => n.trim()).filter(Boolean);
  return was < 0 ? head : [...head, text.slice(was)];
};

const rowLine = (r: Row): string => `| ${[r.id, r.english, r.latvian].map(escapeCell).join(' | ')} | ${r.source} | ${notesCell(r.notes)} |`;

/** The whole file, rows in the order given. */
export function writeLv(rows: readonly Row[]): string {
  const parts = (['strings', 'content', 'removed'] as const).flatMap((place) => {
    const own = rows.filter((r) => r.place === place);
    return own.length === 0 ? [] : [HEADINGS[place], '', HEAD, RULE, ...own.map(rowLine), ''];
  });
  return [...INTRO, ...parts].join('\n');
}

/** The cells of a table line, split at the pipes that are not escaped; null for a line that is no table row. */
function cellsOf(line: string): string[] | null {
  const text = line.trim();
  if (!text.startsWith('|') || !text.endsWith('|') || text.length < 2) return null;
  const cells: string[] = [];
  let cell = '';
  for (let i = 1; i < text.length; i++) {
    const c = text[i] ?? '';
    if (c === '\\') {
      cell += c + (text[i + 1] ?? '');
      i++;
    } else if (c === '|') {
      cells.push(cell.trim());
      cell = '';
    } else cell += c;
  }
  return cells;
}

const placeOf = (line: string): Place | undefined => (Object.keys(HEADINGS) as Place[]).find((p) => HEADINGS[p] === line.trim());

function rowOf(cells: readonly string[], place: Place): Row {
  const [id = '', english = '', latvian = '', source = '', notes = ''] = cells;
  return { id: unescapeCell(id), english: unescapeCell(english), latvian: unescapeCell(latvian), source, notes: notesOf(notes), place };
}

/** The rows of a file or of a translated chunk of one; a row with the wrong number of cells is a problem, never a guess. */
export function parseLv(text: string): { readonly rows: Row[]; readonly problems: Problem[] } {
  const rows: Row[] = [];
  const problems: Problem[] = [];
  let place: Place | undefined;
  text.split(/\r?\n/).forEach((line, i) => {
    place = placeOf(line) ?? place;
    const cells = cellsOf(line);
    if (cells === null || line.trim() === HEAD || /^\|[\s|:-]+\|$/.test(line.trim())) return;
    if (cells.length !== COLUMNS.length) {
      problems.push({ level: 'error', id: cells[0] ?? '', message: `line ${String(i + 1)}: a row needs ${String(COLUMNS.length)} cells and has ${String(cells.length)} (an unescaped | or a lost cell)` });
    } else rows.push(rowOf(cells, place ?? 'strings'));
  });
  return { rows, problems };
}
