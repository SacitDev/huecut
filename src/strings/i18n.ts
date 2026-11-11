/**
 * Latvian beside English, the part the app and `scripts/i18n` share: every text has one stable id (a string's
 * path in the strings tree; a content text's record id and field path), and a Latvian function string is data, run here.
 */

/** Latvian plural forms (`Intl.PluralRules('lv')`): zero for 0, 10-20, 30…; one for 1, 21, 31… but not 11; other for the rest. */
export const PLURAL_FORMS = ['zero', 'one', 'other'] as const;
/** One of `PLURAL_FORMS`. */
export type PluralForm = (typeof PLURAL_FORMS)[number];

/**
 * Holds when the argument equals it; for a list, when the list has that length; for a number, also a comparison: `<0`, `<=5`,
 * `>0`; and `=name` when it equals the argument `name` (a range whose ends meet, `min: '=max'`).
 */
export type Condition = string | number | boolean | null;

/** One case of a Latvian function string: its conditions, and one text or, when it shows the count, the plural forms. */
export interface LvCase {
  readonly when: Readonly<Record<string, Condition>>;
  readonly text?: string;
  readonly forms?: Readonly<Partial<Record<PluralForm, string>>>;
}

/** A Latvian function string: its placeholders in parameter order and its cases, tried in order. */
export interface LvFunction {
  readonly params: readonly string[];
  readonly cases: readonly LvCase[];
  /** The parameter that picks the plural form. */
  readonly count?: string;
  /** Lists joined with "or" rather than "and". */
  readonly or?: readonly string[];
  /** Words shown in lower case, as the English does. */
  readonly lower?: readonly string[];
  /** Numbers shown without their sign, because the words carry the direction. */
  readonly abs?: readonly string[];
  /** Numbers shown with up to this many decimals (a ratio, a clipper guard); the rest are whole. */
  readonly decimals?: Readonly<Record<string, number>>;
}

/** `lv-strings.json`: the Latvian strings and function strings by id, and how many safety rows still show in English. */
export interface LvStrings {
  readonly strings: Readonly<Record<string, string>>;
  readonly functions: Readonly<Record<string, LvFunction>>;
  readonly held: number;
}

/** `lv-content.json`: the Latvian content texts by id. */
export type LvContent = Readonly<Record<string, string>>;

/** Where a text sits: its parent object, its key there and its id. */
export type Visit = (parent: object, key: string, id: string) => void;

/** A strings module's export as the start of its ids: `en` adds nothing, `helpCopy` gives `help`. */
export const rootOf = (exportName: string): string => (exportName === 'en' ? '' : exportName.replace(/Copy$/, ''));

/** Every string and function string of a strings tree, with its id (`consult.photo.title`; list items by position). */
export function walkStrings(node: object, prefix: string, visit: Visit): void {
  for (const [key, value] of Object.entries(node)) {
    const id = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string' || typeof value === 'function') visit(node, key, id);
    else if (value !== null && typeof value === 'object') walkStrings(value as object, id, visit);
  }
}

/**
 * A list item's key: what a question's option sets (`fact`, `value`, `sets`, as `wish.jaw=soften`), else its position; an item
 * with an `id` starts its own ids anyway.
 */
function itemKey(item: unknown, index: string): string {
  if (item === null || typeof item !== 'object') return index;
  const { fact, value, sets } = item as Readonly<Record<string, unknown>>;
  const parts = [
    typeof fact === 'string' ? fact : undefined,
    'value' in item ? String(value) : undefined,
    sets !== null && typeof sets === 'object' ? Object.entries(sets).map(([k, v]) => `${k}=${String(v)}`).join(',') : undefined,
  ].filter((p) => p !== undefined);
  return parts.length > 0 ? parts.join('=') : index;
}

/** Every text of a content file as loaded, with its id: the nearest record id, then the path (`frohawk.texture_fit.curly.note`). */
export function walkContent(node: unknown, path: string, visit: Visit): void {
  if (node === null || typeof node !== 'object') return;
  const record = node as Readonly<Record<string, unknown>>;
  const scope = typeof record.id === 'string' ? record.id : path;
  for (const [key, value] of Object.entries(record)) {
    const at = Array.isArray(node) ? itemKey(value, key) : key;
    const id = scope === '' ? at : `${scope}.${at}`;
    if (typeof value === 'string') visit(node, key, id);
    else walkContent(value, id, visit);
  }
}

/**
 * A number range keeps together on screen ("6-10 weeks", "5–10 cm" never break at the dash): word joiners (U+2060) hold the dash to
 * both numbers. A non-breaking hyphen (U+2011) would be one character, but the shipped faces do not draw it.
 */
export const keepRanges = (text: string): string => text.replace(/(\d)([-–])(?=\d)/g, '$1\u2060$2\u2060');

/** The `{name}` placeholders of a text, sorted and once each. */
export const placeholdersOf = (text: string): string[] => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? ''))].sort();

/** A number condition that compares (`<=5`): the operator, then the bound. */
export const COMPARISON = /^([<>]=?)(-?\d+(?:\.\d+)?)$/;

/** Whether `arg` meets `condition` (see `Condition`); `named` holds the other arguments by name. */
export function holds(arg: unknown, condition: Condition, named: Readonly<Record<string, unknown>> = {}): boolean {
  if (Array.isArray(arg)) return arg.length === condition;
  if (typeof condition === 'string' && condition.startsWith('=')) return arg === named[condition.slice(1)];
  const m = typeof arg === 'number' && typeof condition === 'string' ? COMPARISON.exec(condition) : null;
  if (!m) return arg === condition;
  const bound = Number(m[2]);
  const n = arg as number;
  return m[1] === '<' ? n < bound : m[1] === '<=' ? n <= bound : m[1] === '>' ? n > bound : n >= bound;
}

const PLURAL = new Intl.PluralRules('lv');

/** One argument as Latvian shows it: numbers in Latvian format (a decimal comma), lists joined in Latvian. */
function show(spec: LvFunction, name: string, value: unknown): string {
  if (typeof value === 'number') {
    const number = new Intl.NumberFormat('lv', { maximumFractionDigits: spec.decimals?.[name] ?? 0 });
    return number.format(spec.abs?.includes(name) ? Math.abs(value) : value);
  }
  if (typeof value === 'string') return spec.lower?.includes(name) ? value.toLocaleLowerCase('lv') : value;
  if (!Array.isArray(value)) return String(value);
  const type = spec.or?.includes(name) ? 'disjunction' : 'conjunction';
  return new Intl.ListFormat('lv', { type }).format(value.map((item: unknown) => show(spec, name, item)));
}

/** The Latvian text for these arguments, or undefined when the case they meet has none. */
function textFor(spec: LvFunction, named: Readonly<Record<string, unknown>>): string | undefined {
  const match = spec.cases.find((c) => Object.entries(c.when).every(([name, condition]) => holds(named[name], condition, named)));
  const count = spec.count === undefined ? undefined : named[spec.count];
  return match?.forms && typeof count === 'number' ? match.forms[PLURAL.select(count) as PluralForm] : match?.text;
}

/** The Latvian function for `spec`; arguments whose case has no Latvian yet get the English function's words. */
export function lvFunction(spec: LvFunction, english: (...args: never[]) => unknown): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    const named = Object.fromEntries(spec.params.map((p, i) => [p, args[i]]));
    const text = textFor(spec, named);
    if (text === undefined) return english(...(args as never[]));
    return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in named ? show(spec, name, named[name]) : all));
  };
}
