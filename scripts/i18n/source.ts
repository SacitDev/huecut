/**
 * The English that `i18n/lv.md` translates: every string and function string of the strings trees and of the domain's word
 * trees (the copy the screens show and the engine's joining words), and every content text a person reads, each with its
 * stable id, a source hash, and whether it carries safety (dye reaction, allergy, patch and strand tests, referrals, scalp, the
 * journey labels): a safety row shows in English in the Latvian interface until its Latvian passes the back-translation check
 * and `checked` is in its notes; importing a changed Latvian text for it clears `checked`.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { COMPARISON, placeholdersOf, PLURAL_FORMS, rootOf, walkContent, walkStrings, type Condition, type PluralForm } from '../../src/strings/i18n.ts';
import { WORD_TREES } from '../../src/domain/render-model/copy.ts';
import { addStringTrees, STRING_TREES } from '../../src/strings/locale.ts';
import { FUNCTIONS, type FunctionSpec } from './functions.ts';

/** Where a text comes from: the strings trees or the content files. */
export type Section = 'strings' | 'content';

/** One row's source: its id, its English, a hash of that English, and what the notes column says about it. */
export interface Entry {
  readonly id: string;
  readonly section: Section;
  readonly english: string;
  readonly hash: string;
  readonly safety: boolean;
  /** Only names and placeholders: a Latvian identical to the English is meant. */
  readonly same: boolean;
  readonly form?: PluralForm;
}

/** One case of a function string, with the English its words take. */
export interface FunctionCase {
  readonly name: string | null;
  readonly when: Readonly<Record<string, Condition>>;
  readonly english: string;
  /** The case shows the count, so it has a row per plural form. */
  readonly forms: boolean;
}

/** A function string: its id, its parameter names in order, its inventory entry and its cases. */
export interface FunctionSource {
  readonly id: string;
  readonly params: readonly string[];
  readonly spec: FunctionSpec;
  readonly cases: readonly FunctionCase[];
}

/** Every row's English and every function string, from the app as it is now. */
export interface Source {
  readonly entries: readonly Entry[];
  readonly functions: readonly FunctionSource[];
  /** Ids the app also reads a row's text under (see `aliasesOf`), with the row's id. */
  readonly aliases: ReadonlyMap<string, string>;
}

/** A function string's row id: `<id>`, `/<case>` when it has cases, `:<form>` for a plural form. */
export const rowId = (fn: string, caseName: string | null, form?: PluralForm): string =>
  `${fn}${caseName === null ? '' : `/${caseName}`}${form === undefined ? '' : `:${form}`}`;

/** Words that make a text a safety text wherever it is; the journey labels' names are among them. */
const SAFETY_WORDS =
  /\b(?:allerg\w*|reactions?|patch tests?|skin tests?|strand tests?|pregnan\w*|breastfeed\w*|medical|doctors?|itch\w*|rash\w*|irritat\w*|sunburn\w*|blisters?|sore|plausible|uncertain)\b|best done by a colourist/i;
const NAMES_AND_PLACEHOLDERS = /\{\w+\}|\b(?:Huecut|ChatGPT|Gemini)\b/g;

function entry(id: string, section: Section, english: string, safety = false, form?: PluralForm): Entry {
  const hash = createHash('sha256').update(english).digest('hex').slice(0, 8);
  const same = !/\p{L}/u.test(english.replace(NAMES_AND_PLACEHOLDERS, ''));
  return { id, section, english, hash, safety: safety || SAFETY_WORDS.test(english), same, ...(form === undefined ? {} : { form }) };
}

// ── Function strings ──

/** The parameter names of an English function string, as Node reads its source (types are stripped to spaces). */
const paramsOf = (fn: (...args: never[]) => unknown): string[] =>
  (/^\(?([^)=]*?)\)?\s*=>/.exec(fn.toString())?.[1] ?? '').split(',').map((p) => p.trim().split(/[\s:]/)[0] ?? '').filter(Boolean);

addStringTrees(WORD_TREES);

/**
 * The parts of the shown copy that only the prompts and the AI's reference sheet read: never on a screen, so never translated (the
 * prompts are always English).
 */
const PROMPT_ONLY = /^copy\.(?:prompts\.(?:tradeOffs\.listed|answer|noAnswers|noFaceNotes|cutUpkeep|colourUpkeep|sheetKeep|sheetNamed|sheetColours)|board\.referenceTitle)\b/;

const STAND_IN = 9001;
/** Stands in for a parameter: reads as `{name}`, counts as a number no condition expects (and none of the English says). */
const standIn = (name: string, n: number): unknown => {
  const text = (): string => `{${name}}`;
  return { toString: text, valueOf: () => n, toLowerCase: text, toFixed: text };
};

/** A number that meets a comparison: a stand-in of the right sign against 0 (`<0`), else the bound itself (`<=5` gives 5). */
function meeting(name: string, n: number, m: RegExpExecArray): unknown {
  const op = m[1] ?? '';
  const bound = Number(m[2]);
  if (bound === 0) return standIn(name, op.startsWith('<') ? -n : n);
  return op === '<' ? bound - 1 : op === '>' ? bound + 1 : bound;
}

/** One argument for the English of a case: the value its condition asks for, else a stand-in. */
function argFor(spec: FunctionSpec, name: string, i: number, condition: Condition | undefined): unknown {
  const n = STAND_IN + i;
  if ([...(spec.list ?? []), ...(spec.or ?? [])].includes(name)) {
    return Array.from({ length: typeof condition === 'number' ? condition : 1 }, () => standIn(name, n));
  }
  const m = typeof condition === 'string' ? COMPARISON.exec(condition) : null;
  if (m) return meeting(name, n, m);
  return condition === undefined ? standIn(name, n) : condition;
}

/** The English of one case, with each parameter shown as its placeholder; `=name` passes that argument itself (one stand-in for both). */
function render(fn: (...args: unknown[]) => unknown, params: readonly string[], spec: FunctionSpec, when: Readonly<Record<string, Condition>>): string {
  const own = params.map((p, i) => argFor(spec, p, i, typeof when[p] === 'string' && when[p].startsWith('=') ? undefined : when[p]));
  const args = own.map((arg, i) => {
    const same = when[params[i] ?? ''];
    return typeof same === 'string' && same.startsWith('=') ? own[params.indexOf(same.slice(1))] : arg;
  });
  const text = String(fn(...args));
  return params.reduce((t, p, i) => t.replaceAll(String(STAND_IN + i), `{${p}}`), text);
}

function functionSource(id: string, fn: (...args: unknown[]) => unknown): FunctionSource {
  const params = paramsOf(fn);
  const spec = FUNCTIONS[id] ?? {};
  const cases = Object.entries(spec.cases ?? { '': {} }).map(([name, when]): FunctionCase => {
    const english = spec.english?.[name] ?? render(fn, params, spec, when);
    const forms = spec.count !== undefined && placeholdersOf(english).includes(spec.count);
    return { name: spec.cases ? name : null, when, english, forms };
  });
  return { id, params, spec, cases };
}

/** The rows of a function string: one per case, or one per plural form of a case that shows the count; a case that says nothing has none. */
const functionRows = (f: FunctionSource): Entry[] =>
  f.cases.filter((c) => c.english !== '').flatMap((c) =>
    (c.forms ? PLURAL_FORMS : [undefined]).map((form) => entry(rowId(f.id, c.name, form), 'strings', c.english, false, form)));

function strings(): Pick<Source, 'entries' | 'functions'> {
  const entries: Entry[] = [];
  const functions: FunctionSource[] = [];
  const seen = new Set<string>();
  for (const [name, tree] of Object.entries(STRING_TREES)) {
    walkStrings(tree, rootOf(name), (parent, key, id) => {
      if (seen.has(id) || PROMPT_ONLY.test(id)) return;
      seen.add(id);
      const value = (parent as Readonly<Record<string, unknown>>)[key];
      if (typeof value === 'function') functions.push(functionSource(id, value as (...args: unknown[]) => unknown));
      else if (typeof value === 'string' && !/^https?:\/\//.test(value)) entries.push(entry(id, 'strings', value));
    });
  }
  const unknown = Object.keys(FUNCTIONS).filter((id) => !functions.some((f) => f.id === id));
  if (unknown.length > 0) throw new Error(`i18n: functions.ts lists ids that are not function strings: ${unknown.join(', ')}`);
  return { entries: [...entries, ...functions.flatMap(functionRows)], functions };
}

// ── Content ──

/** The fields a screen shows to the person, as the copy test reads them (`src/strings/copy.test.ts`), look names included. */
const PERSON_KEYS = new Set(['name', 'client', 'help', 'prompt', 'because', 'reason', 'what_to_ask', 'text', 'sideburns', 'strand_note', 'shown_on']);
/** The fields only the stylist sheet shows, which is in the language shown too. */
const SHEET_KEYS = new Set(['density_note', 'whorl_note', 'glasses_note', 'grow_out', 'stylist']);

function personFacing(file: string, parent: Readonly<Record<string, unknown>>, key: string, id: string): boolean {
  if (file === 'phrases.json') return true;
  if (file === 'policy.json') return id.startsWith('policy.suitability.because.');
  // A product's name shows in the upkeep rows of Explore and the stylist sheet.
  if (PERSON_KEYS.has(key) || SHEET_KEYS.has(key) || /\.products\.\d+$/.test(id)) return true;
  // A journey record's `label` is a value (plausible), a question option's or a model's is words.
  if (key === 'label') return parent.effect !== 'label';
  // A question option's note sits under its label, one per collection.
  if (key !== 'note') return file === 'questions.json' && /\.note\.\w+$/.test(id);
  // An item's notes show on Explore, Ideas or the stylist sheet; a review's note and a rule's own note are the authors'.
  return !id.endsWith('.review.note') && !file.startsWith('rules/');
}

/**
 * Records whose every text carries safety: reminders and referrals (patch and strand tests), journey labels, and every record that
 * reads or sets a safety answer (the dye reaction and scalp question, the health question, rules and labels on them).
 */
function safetyRecords(node: unknown, found: Set<string>): Set<string> {
  if (node === null || typeof node !== 'object') return found;
  const r = node as Readonly<Record<string, unknown>>;
  const safety = r.kind === 'reminder' || r.kind === 'referral' || r.effect === 'label' || JSON.stringify(r).includes('safety.');
  if (typeof r.id === 'string' && safety) found.add(r.id);
  for (const value of Object.values(r)) safetyRecords(value, found);
  return found;
}

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.isDirectory()) return d.name === 'schema' || d.name === 'examples' ? [] : jsonFiles(join(dir, d.name));
    return d.name.endsWith('.json') && d.name !== 'pictures.json' ? [join(dir, d.name)] : [];
  });
}

/**
 * The ids the built content reads a text under besides its row's: the library index lifts a cut's `images.shown_on` to
 * `shown_on`, and a variant is built as a whole cut, with its `changes` and every other text of its base cut under its own id.
 */
function aliasesOf(data: unknown, found: readonly Entry[]): [string, string][] {
  const has = new Set(found.map((e) => e.id));
  return (Array.isArray(data) ? (data as unknown[]) : []).flatMap((record) => {
    const { id, variants } = (record ?? {}) as { readonly id?: unknown; readonly variants?: readonly { readonly id: string }[] };
    if (typeof id !== 'string') return [];
    const own = found.filter((e) => e.id.startsWith(`${id}.`) && !e.id.startsWith(`${id}.variants.`)).map((e) => e.id.slice(id.length + 1));
    const lifted: [string, string][] = own.includes('images.shown_on') ? [[`${id}.shown_on`, `${id}.images.shown_on`]] : [];
    return [...lifted, ...(variants ?? []).flatMap((v): [string, string][] => {
      const changed = found.filter((e) => e.id.startsWith(`${v.id}.changes.`)).map((e): [string, string] => [`${v.id}.${e.id.slice(v.id.length + 9)}`, e.id]);
      const inherited = own.filter((path) => !has.has(`${v.id}.${path}`) && !changed.some(([alias]) => alias === `${v.id}.${path}`));
      return [...changed, ...inherited.map((path): [string, string] => [`${v.id}.${path}`, `${id}.${path}`])];
    })];
  });
}

function content(dir: string): { readonly entries: Entry[]; readonly aliases: [string, string][] } {
  const files = jsonFiles(dir).map((path) => {
    const file = relative(dir, path).split(/[\\/]/).join('/');
    const data: unknown = JSON.parse(readFileSync(path, 'utf8'));
    const safety = safetyRecords(data, new Set());
    // `consult.json` holds the phrases and the policy under these names, so their ids start with them.
    const root = file === 'phrases.json' || file === 'policy.json' ? file.replace('.json', '') : '';
    const found: Entry[] = [];
    walkContent(data, root, (parent, key, id) => {
      const text = (parent as Readonly<Record<string, string>>)[key] ?? '';
      if (personFacing(file, parent as Readonly<Record<string, unknown>>, key, id)) found.push(entry(id, 'content', text, safety.has(id.split('.')[0] ?? '')));
    });
    return { found, aliases: file.startsWith('haircuts/') ? aliasesOf(data, found) : [] };
  });
  return { entries: files.flatMap((f) => f.found), aliases: files.flatMap((f) => f.aliases) };
}

/** Every row's source, strings first, from the app at `root`. */
export function collect(root: string): Source {
  const s = strings();
  const c = content(join(root, 'content'));
  const entries = [...s.entries, ...c.entries];
  const ids = new Set<string>();
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error(`i18n: two texts share the id ${e.id}`);
    ids.add(e.id);
  }
  return { entries, functions: s.functions, aliases: new Map(c.aliases) };
}
