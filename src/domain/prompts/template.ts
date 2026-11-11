/**
 * Prompt templates: reads the header of a `content/prompts/*.md` file, fills
 * its `{{placeholders}}`, writes the keep-list and counts words the same way the content check does.
 */
import type { PromptTemplate } from '../content/types.ts';
import { PROMPT_BUDGETS, PROMPT_KINDS, type PromptKind } from '../content/values.ts';
import { err, ok, type Result } from '../result.ts';

/** `{{name}}`; the name is trimmed. */
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;
const HEADER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const VARIABLE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/;

export interface TemplateProblem {
  readonly code: 'no_header' | 'bad_header_line' | 'bad_header';
  /** The line or key at fault, for the build log. */
  readonly detail: string;
}

type HeaderValue = string | number | boolean | readonly string[];

/** One `key: value` line: `true`/`false`, whole numbers, `[a, b]` lists, otherwise text. */
function headerValue(raw: string): HeaderValue {
  const v = raw.trim();
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^\d+$/.test(v)) return Number(v);
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
  return v;
}

const isKind = (v: HeaderValue | undefined): v is PromptKind => typeof v === 'string' && (PROMPT_KINDS as readonly string[]).includes(v);
const isList = (v: HeaderValue | undefined): v is readonly string[] => Array.isArray(v);

/** The header's keys checked against `PromptHeader`; a budget above the kind's maximum is broken content. */
function checkHeader(h: ReadonlyMap<string, HeaderValue>, body: string): Result<PromptTemplate, TemplateProblem> {
  const bad = (detail: string) => err({ code: 'bad_header' as const, detail });
  const unknown = [...h.keys()].find((k) => !['template', 'kind', 'word_budget', 'keep_list', 'variables'].includes(k));
  if (unknown !== undefined) return bad(unknown);
  const [template, kind, budget, keep, variables] = ['template', 'kind', 'word_budget', 'keep_list', 'variables'].map((k) => h.get(k));
  if (!isKind(template)) return bad('template');
  if (kind !== 'image' && kind !== 'text') return bad('kind');
  if (typeof budget !== 'number' || budget < 1 || budget > PROMPT_BUDGETS[template]) return bad('word_budget');
  if (typeof keep !== 'boolean') return bad('keep_list');
  if (!isList(variables) || !variables.every((v) => VARIABLE.test(v))) return bad('variables');
  return ok({ template, kind, word_budget: budget, keep_list: keep, variables, body });
}

/** Reads a template file: a header block of `key: value` lines between two `---` lines, then the body. */
export function parseTemplate(src: string): Result<PromptTemplate, TemplateProblem> {
  const m = HEADER.exec(src);
  if (!m) return err({ code: 'no_header', detail: 'a template starts with a header block between two "---" lines' });
  const header = new Map<string, HeaderValue>();
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = /^([a-z_]+):(.*)$/.exec(line.trim());
    if (!kv?.[1]) return err({ code: 'bad_header_line', detail: line });
    header.set(kv[1], headerValue(kv[2] ?? ''));
  }
  return checkHeader(header, (m[2] ?? '').trim());
}

export interface FillProblem {
  readonly code: 'missing_value' | 'unknown_placeholder';
  readonly name: string;
}

/**
 * Fills every `{{name}}` from `values`. A template may name only its `variables`, plus `keep_list` when its header says
 * so; a missing or blank value is refused rather than sent as a gap.
 */
export function fillTemplate(t: PromptTemplate, values: Readonly<Record<string, string>>): Result<string, FillProblem> {
  const allowed = new Set([...t.variables, ...(t.keep_list ? ['keep_list'] : [])]);
  for (const match of t.body.matchAll(PLACEHOLDER)) {
    const name = (match[1] ?? '').trim();
    if (!allowed.has(name)) return err({ code: 'unknown_placeholder', name });
    if (!values[name]?.trim()) return err({ code: 'missing_value', name });
  }
  return ok(t.body.replace(PLACEHOLDER, (_, name: string) => values[name.trim()]?.trim() ?? ''));
}

/** Words as the content check counts them: runs of non-space characters. */
export const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** What every image prompt asks the AI to keep, in this order. */
export const KEEP_LIST = ['face', 'skin tone', 'eye colour', 'hairline', 'hair density', 'curl pattern', 'glasses', 'beard', 'background'] as const;

/** Added to every prompt for a cut with no colour of its own: `try_on_cut` never says to keep the colour otherwise. */
export const KEEP_COLOUR = 'Keep my hair colour exactly as it is.';

/**
 * The keep-list sentence. `beard: false` leaves the beard out, for a look that changes the beard: asking the AI to keep
 * the beard exactly would contradict the look.
 */
export function keepListText(options: { readonly beard: boolean } = { beard: true }): string {
  const parts = KEEP_LIST.filter((p) => options.beard || p !== 'beard');
  return `Keep my ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] ?? ''} exactly as in my photo.`;
}
