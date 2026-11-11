/**
 * `npm run i18n:export` writes `i18n/lv.md` from the app's English. A row keeps its Latvian while its English is the
 * same; when the English changed, the old Latvian moves to `was:` in the notes and the row asks again; a text the app no longer
 * has moves to Removed with its Latvian. No translation is ever dropped, and the run lists what is new, changed and removed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseLv, writeLv, type Row } from './lvmd.ts';
import { collect, type Entry, type Source } from './source.ts';

/** The numbers each Latvian plural form is for. */
const FORM_NUMBERS = { zero: '0, 10-20, 30, 40…', one: '1, 21, 31, 41… (not 11)', other: '2-9, 22-29, 32-39…' } as const;

/** Notes a person adds; they stay while the English is the same. */
const KEPT = new Set(['checked', 'same']);

const notesFor = (e: Entry, kept: readonly string[]): string[] => [
  ...(e.safety ? ['safety'] : []),
  ...(e.same && !kept.includes('same') ? ['same'] : []),
  ...(e.form === undefined ? [] : [`plural ${e.form}: ${FORM_NUMBERS[e.form]}`]),
  ...kept,
];

/** The export's rows, and the ids it found new, changed and removed. */
export interface Exported {
  readonly rows: readonly Row[];
  readonly added: readonly string[];
  readonly changed: readonly string[];
  readonly removed: readonly string[];
}

/** One row for one English text, from the row the file had for it. */
function rowFor(e: Entry, old: Row | undefined): Row {
  const base = { id: e.id, english: e.english, source: e.hash, place: e.section };
  if (old?.source === e.hash) {
    const was = old.latvian === '' ? old.notes.filter((n) => n.startsWith('was: ')) : [];
    return { ...base, latvian: old.latvian, notes: notesFor(e, [...old.notes.filter((n) => KEPT.has(n)), ...was]) };
  }
  const was = old?.latvian ? `was: ${old.latvian}` : old?.notes.find((n) => n.startsWith('was: '));
  return { ...base, latvian: '', notes: notesFor(e, was === undefined ? [] : [was]) };
}

/** The new file's rows from the English and the rows the file had. */
export function exportRows(source: Source, previous: readonly Row[]): Exported {
  const before = new Map(previous.map((r) => [r.id, r]));
  const rows = source.entries.map((e) => rowFor(e, before.get(e.id)));
  const current = new Set(source.entries.map((e) => e.id));
  const gone = previous.filter((r) => !current.has(r.id));
  return {
    rows: [...rows, ...gone.map((r): Row => ({ ...r, place: 'removed' }))],
    added: source.entries.filter((e) => !before.has(e.id)).map((e) => e.id),
    changed: source.entries.filter((e) => before.has(e.id) && before.get(e.id)?.source !== e.hash).map((e) => e.id),
    removed: gone.filter((r) => r.place !== 'removed').map((r) => r.id),
  };
}

/** The counts the export prints: rows, safety rows, function strings and their rows. */
export function counts(source: Source): string {
  const strings = source.entries.filter((e) => e.section === 'strings').length;
  const safety = source.entries.filter((e) => e.safety).length;
  const forms = source.entries.filter((e) => e.form !== undefined).length;
  const fnRows = source.functions.reduce((n, f) => n + f.cases.filter((c) => c.english !== '').reduce((m, c) => m + (c.forms ? 3 : 1), 0), 0);
  return `${String(source.entries.length)} entries (${String(strings)} strings, ${String(source.entries.length - strings)} content), ${String(safety)} safety, ${String(source.functions.length)} function strings in ${String(fnRows)} rows (${String(forms)} plural-form rows)`;
}

if (import.meta.main) {
  const root = join(import.meta.dirname, '..', '..');
  const file = join(root, 'i18n', 'lv.md');
  const previous = existsSync(file) ? parseLv(readFileSync(file, 'utf8')) : { rows: [], problems: [] };
  const source = collect(root);
  const padded = source.entries.filter((e) => e.english !== e.english.trim()).map((e) => e.id);
  if (previous.problems.length > 0 || padded.length > 0) {
    for (const p of previous.problems) console.log(`ERROR ${p.id}: ${p.message}`);
    if (padded.length > 0) console.log(`ERROR texts with spaces at an end, which a table cell cannot keep: ${padded.join(', ')}`);
    console.log('i18n export: stopped; nothing written');
    process.exitCode = 1;
  } else {
    const out = exportRows(source, previous.rows);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, writeLv(out.rows));
    console.log(`i18n export: wrote i18n/lv.md: ${counts(source)}`);
    console.log(`new ${String(out.added.length)}, changed ${String(out.changed.length)} (their Latvian kept under was:), removed ${String(out.removed.length)}`);
    for (const [what, ids] of [['changed', out.changed], ['removed', out.removed]] as const) if (ids.length > 0) console.log(`${what}: ${ids.join(', ')}`);
  }
}
