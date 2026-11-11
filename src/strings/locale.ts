/**
 * The locale adapter. English stays the shape and the import of every screen: the chosen language is laid over those
 * objects in place before the first render, so `const t = en.x` kept at module level reads it too, and over each content file as
 * it loads. `english()` gives the English back for prompts and for the names a final card and its reference sheet print.
 * Latvian comes in two chunks of its own, loaded only when Latvian is chosen, so English start-up requests neither; when they
 * cannot load, English shows with one notice.
 */
import { en } from './en.ts';
import { extrasCopy } from './en-extras.ts';
import { faceCopy } from './en-face.ts';
import { helpCopy } from './en-help.ts';
import { ideasCopy } from './en-ideas.ts';
import { languageCopy } from './en-language.ts';
import { savedCopy, saveCopy } from './en-saved.ts';
import { tryOnCopy } from './en-try-on.ts';
import { keepRanges, lvFunction, rootOf, walkContent, walkStrings, type LvContent, type LvStrings } from './i18n.ts';

/** Every strings tree by its export name, which starts its ids (`rootOf`); `en` holds `exploreCopy` and `consultCopy`. */
export const STRING_TREES: Record<string, object> = { en, helpCopy, saveCopy, savedCopy, tryOnCopy, ideasCopy, faceCopy, extrasCopy, languageCopy };

/**
 * Adds the domain's own word trees (the copy the screens show and the engine's joining words), which the strings cannot
 * import: the app and `scripts/i18n` add the same trees, before any language is laid.
 */
export function addStringTrees(trees: Readonly<Record<string, object>>): void {
  Object.assign(STRING_TREES, trees);
}

/** The languages the app has; English is the default and the fallback for any text without Latvian. */
export const LANGUAGES = ['en', 'lv'] as const;
/** One of `LANGUAGES`. */
export type Language = (typeof LANGUAGES)[number];
/** Each language in its own words, as a language switch names them. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = { en: 'English', lv: 'Latviešu' };

/** The person's choice, the language shown, whether Latvian failed to load, and how many safety texts still show in English. */
export interface LanguageState {
  readonly chosen: Language;
  readonly shown: Language;
  readonly failed: boolean;
  readonly held: number;
}

/** localStorage `huecut:language` (nothing personal; Delete my data removes it with the other `huecut:*` keys). */
const KEY = 'huecut:language';
let state: LanguageState = { chosen: 'en', shown: 'en', failed: false, held: 0 };
const listeners = new Set<() => void>();

/** The same object until something changes, as `useSyncExternalStore` needs. */
export const languageState = (): LanguageState => state;

/** Calls `listener` after every change of the language state; returns the unsubscribe. */
export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: Partial<LanguageState>): void {
  state = { ...state, ...next };
  if (typeof document !== 'undefined') document.documentElement.lang = state.shown;
  for (const listener of listeners) listener();
}

const isLanguage = (value: unknown): value is Language => LANGUAGES.some((l) => l === value);

/** The saved choice, then a Latvian browser (the first of its languages that the app has), then English. */
export function chosenLanguage(): Language {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Storage is blocked: the browser's languages decide.
  }
  const asked = (navigator.languages.length > 0 ? navigator.languages : [navigator.language]).map((tag) => tag.split('-')[0]?.toLowerCase());
  return asked.find(isLanguage) ?? 'en';
}

/** English as first found, per object and key, so a language can be laid over it and taken off again. */
const originals = new WeakMap<object, Map<string, unknown>>();
let laid = false;

function put(parent: object, key: string, value: unknown): void {
  const record = parent as Record<string, unknown>;
  let kept = originals.get(parent);
  if (!kept) originals.set(parent, (kept = new Map<string, unknown>()));
  if (!kept.has(key)) kept.set(key, record[key]);
  record[key] = value;
  laid = true;
}

const englishAt = (parent: object, key: string): unknown => {
  const kept = originals.get(parent);
  return kept?.has(key) === true ? kept.get(key) : (parent as Readonly<Record<string, unknown>>)[key];
};

/** Lays the table's text over one place, or puts the English back where it has none. */
function layOne(parent: object, key: string, text: unknown): void {
  if (text !== undefined) put(parent, key, text);
  else if (originals.get(parent)?.has(key) === true) put(parent, key, englishAt(parent, key));
}

/** Lays `table` over every strings tree; null puts English back everywhere. */
function layStrings(table: LvStrings | null): void {
  for (const [name, tree] of Object.entries(STRING_TREES)) {
    walkStrings(tree, rootOf(name), (parent, key, id) => {
      const text = englishAt(parent, key);
      if (typeof text !== 'function') {
        layOne(parent, key, table?.strings[id]);
        return;
      }
      // Every function string, in either language, says its number ranges unbroken; `english()` still gives the plain original.
      const spec = table?.functions[id];
      const fn = spec ? lvFunction(spec, text as (...args: never[]) => unknown) : (text as (...args: unknown[]) => unknown);
      put(parent, key, (...args: unknown[]) => {
        const said = fn(...args);
        return typeof said === 'string' ? keepRanges(said) : said;
      });
    });
  }
}

/** Every content file loaded so far: a change of language is laid over each. */
const loaded: object[] = [];

function layContent(file: object, table: LvContent | null): void {
  walkContent(file, '', (parent, key, id) => {
    layOne(parent, key, table?.[id]);
  });
}

/** How long a Latvian chunk may take: start-up waits for it, so a stalled request gives English with the notice instead of no page. */
const LOAD_MS = 8000;

/** One load per chunk while it succeeds; a failed or late one is forgotten, so choosing Latvian again tries again. */
const once = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let pending: Promise<T> | null = null;
  const late = (): Promise<never> => new Promise((_, fail) => setTimeout(() => { fail(new Error('late')); }, LOAD_MS));
  return () =>
    (pending ??= Promise.race([load(), late()]).catch((e: unknown) => {
      pending = null;
      throw e;
    }));
};
const lvStrings = once(() => import('./lv-strings.json').then((m) => m.default as LvStrings));
const lvContent = once(() => import('./lv-content.json').then((m) => m.default as LvContent));

function layEnglish(failed: boolean): void {
  layStrings(null);
  for (const file of loaded) layContent(file, null);
  update({ shown: 'en', failed });
}

async function show(language: Language): Promise<void> {
  if (language === 'en') {
    layEnglish(false);
    return;
  }
  try {
    const strings = await lvStrings();
    const content = loaded.length > 0 ? await lvContent() : null;
    if (state.chosen !== language) return;
    layStrings(strings);
    for (const file of loaded) layContent(file, content);
    update({ shown: language, failed: false, held: strings.held });
  } catch {
    layEnglish(true);
  }
}

/** Before the first render: the chosen language, so the first screen already reads it. */
export async function startLanguage(): Promise<void> {
  update({ chosen: chosenLanguage() });
  if (state.chosen !== 'en') await show(state.chosen);
  else layStrings(null);
}

/** The switch in Settings: keeps the choice, then lays the language (English with the notice when Latvian cannot load). */
export async function chooseLanguage(language: Language): Promise<void> {
  try {
    localStorage.setItem(KEY, language);
  } catch {
    // Storage is blocked: the choice holds until the page reloads.
  }
  update({ chosen: language });
  await show(language);
}

/** For the content loader: lays the language shown over a file before anyone reads it. */
export async function localiseContent(file: unknown): Promise<void> {
  if (file === null || typeof file !== 'object') return;
  loaded.push(file);
  if (state.shown === 'en') return;
  try {
    const table = await lvContent();
    // English may have been chosen while the chunk loaded.
    if (languageState().shown !== 'en') layContent(file, table);
  } catch {
    layEnglish(true);
  }
}

/** Help says so in one line while Latvian shows and some safety texts are still held in English (not yet `checked`). */
export const safetyInEnglish = (): boolean => state.shown !== 'en' && state.held > 0;

/** `value` with the English put back wherever a language was laid over it: a copy, for prompts and the names a final card prints. */
export function english<T>(value: T): T {
  if (!laid || value === null || typeof value !== 'object') return value;
  const copy: Record<string, unknown> = Array.isArray(value) ? ([] as unknown as Record<string, unknown>) : {};
  for (const key of Object.keys(value)) copy[key] = english(englishAt(value, key));
  return copy as T;
}
