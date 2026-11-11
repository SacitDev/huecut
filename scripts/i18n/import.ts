/**
 * `npm run i18n:import [chunk.md …]` merges translated chunks into `i18n/lv.md` (an empty Latvian cell never erases one), checks
 * the whole file against the app's English (duplicate, unknown and missing ids, placeholder names, every plural form, text
 * the same as the English unless meant, stale source hashes; removed entries listed) and only with no error writes the two
 * Latvian chunks the app loads. A safety row goes in only once its Latvian has passed the back-translation check and
 * is marked `checked`; a changed Latvian text clears `checked`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { placeholdersOf, PLURAL_FORMS, type LvCase, type LvContent, type LvFunction, type LvStrings, type PluralForm } from '../../src/strings/i18n.ts';
import { parseLv, writeLv, type Problem, type Row } from './lvmd.ts';
import { collect, rowId, type Entry, type FunctionSource, type Source } from './source.ts';

const error = (id: string, message: string): Problem => ({ level: 'error', id, message });

function duplicates(rows: readonly Row[]): Problem[] {
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      return [];
    }
    return [error(r.id, 'duplicate id: the row is in the file twice')];
  });
}

/** `checked` belongs to the Latvian a check read: another Latvian drops it, so that text is checked again. */
const withLatvian = (own: Row, latvian: string): Row =>
  latvian === own.latvian ? own : { ...own, latvian, notes: own.notes.filter((n) => n !== 'checked') };

/** Merges the Latvian of translated rows into the file's rows; an empty cell keeps what the file has, a changed one clears `checked`. */
export function merge(rows: readonly Row[], incoming: readonly Row[]): { readonly rows: Row[]; readonly problems: Problem[] } {
  const merged = new Map(rows.map((r) => [r.id, r]));
  const problems = duplicates(incoming);
  for (const r of incoming.filter((x) => x.latvian !== '')) {
    const own = merged.get(r.id);
    if (!own || own.place === 'removed') problems.push(error(r.id, 'unknown id: i18n/lv.md has no such row'));
    else if (own.source !== r.source) problems.push(error(r.id, 'stale: translated from another export of this row; translate the English of the current file'));
    else merged.set(r.id, withLatvian(own, r.latvian));
  }
  return { rows: [...merged.values()], problems };
}

/** A text's placeholders as a reader sees them: `{n} {total}`, or none. */
const named = (text: string): string => {
  const names = placeholdersOf(text);
  return names.length === 0 ? 'none' : names.map((n) => `{${n}}`).join(' ');
};

function rowProblems(r: Row, e: Entry): Problem[] {
  const out: Problem[] = [];
  if (r.source !== e.hash) out.push(error(r.id, 'stale: the English changed since this row was exported (npm run i18n:export)'));
  if (r.latvian === '') return out;
  const [want, got] = [named(e.english), named(r.latvian)];
  if (want !== got) out.push(error(r.id, `placeholders: the English has ${want}, the Latvian ${got}`));
  if (r.latvian === e.english && !e.same && !r.notes.includes('same')) out.push(error(r.id, 'same as the English: translate it, or add `same` to its notes when that is meant'));
  return out;
}

/** A case with plural forms: once one form has Latvian, every form needs it. */
function pluralProblems(rows: readonly Row[]): Problem[] {
  const cases = new Map<string, Row[]>();
  for (const r of rows) {
    const base = /^(.*):(?:zero|one|other)$/.exec(r.id)?.[1];
    if (base !== undefined) cases.set(base, [...(cases.get(base) ?? []), r]);
  }
  return [...cases.values()].flatMap((forms) => {
    const done = forms.filter((r) => r.latvian !== '');
    return done.length === 0 ? [] : forms.filter((r) => r.latvian === '').map((r) => error(r.id, 'plural form missing: the other forms of this text have Latvian'));
  });
}

/** Every check of the file against the app's English; removed entries come back as notes. */
export function checkRows(rows: readonly Row[], source: Source): Problem[] {
  const entries = new Map(source.entries.map((e) => [e.id, e]));
  const live = rows.filter((r) => r.place !== 'removed');
  const ids = new Set(live.map((r) => r.id));
  return [
    ...duplicates(live),
    ...live.filter((r) => !entries.has(r.id)).map((r) => error(r.id, 'unknown id: the app has no such text (npm run i18n:export moves it to Removed)')),
    ...source.entries.filter((e) => !ids.has(e.id)).map((e) => error(e.id, 'missing id: the file has no row for this text (npm run i18n:export)')),
    ...live.flatMap((r) => {
      const e = entries.get(r.id);
      return e ? rowProblems(r, e) : [];
    }),
    ...pluralProblems(live),
    ...rows.filter((r) => r.place === 'removed').map((r): Problem => ({ level: 'note', id: r.id, message: 'removed: the app no longer has this text; its Latvian is kept' })),
  ];
}

/** The Latvian the app may show for each id: translated, and for a safety row `checked`. */
function usable(rows: readonly Row[], source: Source): ReadonlyMap<string, string> {
  const safety = new Set(source.entries.filter((e) => e.safety).map((e) => e.id));
  return new Map(rows.filter((r) => r.place !== 'removed' && r.latvian !== '' && (!safety.has(r.id) || r.notes.includes('checked'))).map((r) => [r.id, r.latvian]));
}

function lvFunctionOf(f: FunctionSource, latvian: ReadonlyMap<string, string>): LvFunction | null {
  const cases = f.cases.map((c): LvCase => {
    if (!c.forms) {
      const text = latvian.get(rowId(f.id, c.name));
      return { when: c.when, ...(text === undefined ? {} : { text }) };
    }
    const forms: Partial<Record<PluralForm, string>> = {};
    for (const form of PLURAL_FORMS) {
      const text = latvian.get(rowId(f.id, c.name, form));
      if (text !== undefined) forms[form] = text;
    }
    return { when: c.when, ...(Object.keys(forms).length === 0 ? {} : { forms }) };
  });
  if (!cases.some((c) => c.text !== undefined || c.forms !== undefined)) return null;
  const { count, or, lower, abs, decimals } = f.spec;
  return {
    params: f.params, cases, ...(count === undefined ? {} : { count }), ...(or ? { or } : {}), ...(lower ? { lower } : {}), ...(abs ? { abs } : {}),
    ...(decimals ? { decimals } : {}),
  };
}

/** The two Latvian chunks from a checked file. */
export function tables(rows: readonly Row[], source: Source): { readonly strings: LvStrings; readonly content: LvContent } {
  const latvian = usable(rows, source);
  const fnRows = new Set(source.functions.flatMap((f) => f.cases.flatMap((c) => (c.forms ? PLURAL_FORMS.map((form) => rowId(f.id, c.name, form)) : [rowId(f.id, c.name)]))));
  const textOf = (section: Entry['section']) =>
    Object.fromEntries(source.entries.flatMap((e) => (e.section === section && !fnRows.has(e.id) && latvian.has(e.id) ? [[e.id, latvian.get(e.id) ?? '']] : [])));
  const functions = Object.fromEntries(source.functions.flatMap((f) => {
    const fn = lvFunctionOf(f, latvian);
    return fn ? [[f.id, fn]] : [];
  }));
  const held = rows.filter((r) => r.place !== 'removed' && r.notes.includes('safety') && !r.notes.includes('checked')).length;
  const aliased = [...source.aliases].flatMap(([alias, id]): [string, string][] => (latvian.has(id) ? [[alias, latvian.get(id) ?? '']] : []));
  return { strings: { strings: textOf('strings'), functions, held }, content: { ...textOf('content'), ...Object.fromEntries(aliased) } };
}

if (import.meta.main) {
  const root = join(import.meta.dirname, '..', '..');
  const file = join(root, 'i18n', 'lv.md');
  const base = parseLv(readFileSync(file, 'utf8'));
  const chunks = process.argv.slice(2).map((path) => parseLv(readFileSync(path, 'utf8')));
  const merged = chunks.reduce((acc, c) => {
    const m = merge(acc.rows, c.rows);
    return { rows: m.rows, problems: [...acc.problems, ...c.problems, ...m.problems] };
  }, { rows: base.rows, problems: base.problems });
  const source = collect(root);
  const problems = [...merged.problems, ...checkRows(merged.rows, source)];
  for (const p of problems) console.log(`${p.level.toUpperCase()} ${p.id}: ${p.message}`);
  const errors = problems.filter((p) => p.level === 'error').length;
  if (errors > 0) {
    console.log(`i18n import: stopped, ${String(errors)} errors; nothing written`);
    process.exitCode = 1;
  } else {
    if (chunks.length > 0) writeFileSync(file, writeLv(merged.rows));
    const out = tables(merged.rows, source);
    writeFileSync(join(root, 'src', 'strings', 'lv-strings.json'), `${JSON.stringify(out.strings, null, 1)}\n`);
    writeFileSync(join(root, 'src', 'strings', 'lv-content.json'), `${JSON.stringify(out.content, null, 1)}\n`);
    const translated = merged.rows.filter((r) => r.place !== 'removed' && r.latvian !== '').length;
    console.log(`i18n import: 0 errors; ${String(translated)} of ${String(source.entries.length)} rows have Latvian; ${String(out.strings.held)} safety rows show in English until checked`);
    console.log(`wrote src/strings/lv-strings.json (${String(Object.keys(out.strings.strings).length)} strings, ${String(Object.keys(out.strings.functions).length)} function strings) and src/strings/lv-content.json (${String(Object.keys(out.content).length)} texts)`);
  }
}
