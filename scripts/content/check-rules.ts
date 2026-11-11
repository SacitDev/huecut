/**
 * Checks on rules, questions and prompt templates: wish gating, strength,
 * answered excludes, `suppresses`, follow-ups, the core-set limit, placeholders and word budgets.
 */
import { FACTS, isFactKey, type FactKey } from '../../src/domain/facts/registry.ts';
import type { PromptTemplate, Question } from '../../src/domain/content/types.ts';
import { COLLECTIONS, CORE_SETS, PROMPT_BUDGETS, PROMPT_KINDS, type CoreSetName, type PromptKind } from '../../src/domain/content/values.ts';
import { pathOf, type Ctx } from './load.ts';

/** Templates that carry the keep-list; `repair` follows in the same chat within 40 words. */
const KEEP_LIST_TEMPLATES: readonly PromptKind[] = ['try_on_cut', 'try_on_beard', 'try_on_colour', 'try_on_both', 'quick_grid', 'final_card'];
const IMAGE_TEMPLATES: readonly PromptKind[] = [...KEEP_LIST_TEMPLATES, 'repair'];
/**
 * Both is two jobs, so its sets may ask more; the barbering sets also ask about scars to cover; the colour sets list the henna type
 * and the bleach count, which only people with henna or lightened hair see. What one person sees is held apart by the path test in
 * `tests/engine/questions-content.test.ts`: 10 screens for Cut and Colour, 11 for barbering cuts, 12 for Both and 13 for barbering
 * Both, one more for each of the henna type and the bleach count a path opens.
 */
const MAX_CORE: Readonly<Record<CoreSetName, number>> = { 'cut/salon': 10, 'cut/barbering': 11, 'colour/any': 12, 'both/salon': 14, 'both/barbering': 15 };
const maxCore = (set: CoreSetName): number => MAX_CORE[set];

/** Wish gating, and the unsourced-weak rule: a rank rule with no source is weak unless it states policy. */
function checkRuleShapes(ctx: Ctx): void {
  for (const { value: r, file, path } of ctx.ix.rules.values()) {
    if (r.group === 'A' && !Object.keys(r.when).some((k) => k.startsWith('wish.'))) ctx.sink.error(file, `${path}.when`, 'every group-A rule is wish-gated: its when needs a wish.* key');
    if (r.effect === 'rank' && (r.sources ?? []).length === 0 && r.strength !== 'weak' && r.evidence !== 'policy') ctx.sink.error(file, `${path}.strength`, 'a rank rule with no source is weak');
  }
}

/** Exclude rules use answered facts only: facts a question writes. */
function checkExcludes(ctx: Ctx): void {
  for (const { value: r, file, path } of ctx.ix.rules.values()) {
    if (r.effect !== 'exclude') continue;
    for (const k of Object.keys(r.when) as FactKey[]) {
      const from = FACTS[k].from;
      if (from !== 'question' || !ctx.ix.writers.has(k)) {
        ctx.sink.error(file, pathOf(`${path}.when`, [k]), `exclude rules use answered facts only; ${k} is ${from === 'question' ? 'not asked by any question' : from}`);
      }
    }
  }
}

/** Why `id` cannot be suppressed by a rule of `target`, or `null`. */
function suppressProblem(ctx: Ctx, id: string, target: string): string | null {
  const t = ctx.ix.rules.get(id);
  if (ctx.ix.journeyIds.has(id)) return `"${id}" is a journey record; journey records are never suppressed`;
  if (ctx.ix.referralIds.has(id)) return `"${id}" is the referral; the referral is never suppressed`;
  if (ctx.ix.reminderIds.has(id)) return `"${id}" is a reminder, not a rule`;
  if (!t) return `unknown rule "${id}"`;
  if (t.value.target !== target) return `"${id}" targets ${t.value.target}; suppresses names records of the same target (${target})`;
  if (t.value.effect === 'exclude') return `"${id}" is an exclude; excludes are never suppressed`;
  return null;
}

/** `suppresses` names records of the same target, never an exclude, a journey record or the referral, and no cycle. */
function checkSuppresses(ctx: Ctx): void {
  for (const { value: r, file, path } of ctx.ix.rules.values()) {
    (r.suppresses ?? []).forEach((s, i) => {
      const problem = suppressProblem(ctx, s, r.target);
      if (problem) ctx.sink.error(file, pathOf(path, ['suppresses', i]), problem);
    });
  }
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string, trail: readonly string[]): void => {
    const at = ctx.ix.rules.get(id);
    if (!at || state.get(id) === 'done') return;
    if (state.get(id) === 'open') {
      ctx.sink.error(at.file, `${at.path}.suppresses`, `suppresses forms a cycle: ${[...trail.slice(trail.indexOf(id)), id].join(' -> ')}`);
      return;
    }
    state.set(id, 'open');
    for (const s of at.value.suppresses ?? []) visit(s, [...trail, id]);
    state.set(id, 'done');
  };
  for (const id of ctx.ix.rules.keys()) visit(id, []);
}

/** The question an option opens, if any. */
const followUpOf = (o: Question['options'][number]): string | undefined => ('follow_up' in o ? o.follow_up : undefined);

/** A follow-up exists and has no follow-up of its own; several options may open the same one. */
function checkFollowUps(ctx: Ctx): void {
  for (const { value: q, file, path } of ctx.content.questions) {
    q.options.forEach((o, i) => {
      const id = followUpOf(o);
      if (id === undefined) return;
      const at = pathOf(path, ['options', i, 'follow_up']);
      const f = ctx.ix.questions.get(id);
      if (!f) ctx.sink.error(file, at, `unknown question "${id}"`);
      else if (f.value.id === q.id) ctx.sink.error(file, at, 'a question cannot be its own follow-up');
      else if (f.value.options.some((x) => followUpOf(x) !== undefined)) ctx.sink.error(file, at, `"${id}" has a follow-up of its own; a follow-up has none`);
    });
  }
}

/** Whether a question is offered for a core set's goal and collection; the Colour set needs both collections. */
export function fits(q: Question, set: CoreSetName): boolean {
  const [goal, coll] = set.split('/');
  const goalOk = goal === 'both' || q.goals.some((g) => g === goal);
  return goalOk && (coll === 'any' ? COLLECTIONS.every((c) => q.collections.includes(c)) : q.collections.some((c) => c === coll));
}

/** Each listed question exists, fits the set and is listed once; at most `maxCore`, a follow-up counting with its question. */
function checkCoreSets(ctx: Ctx): void {
  const sets = ctx.content.coreSets;
  if (!sets) return;
  for (const set of CORE_SETS) {
    const list = sets[set];
    const at = pathOf('$.core_sets', [set]);
    list.forEach((id, i) => {
      const q = ctx.ix.questions.get(id);
      if (!q) ctx.sink.error('questions.json', pathOf(at, [i]), `unknown question "${id}"`);
      else if (!fits(q.value, set)) ctx.sink.error('questions.json', pathOf(at, [i]), `"${id}" is not offered for ${set} (its goals and collections)`);
      if (list.indexOf(id) !== i) ctx.sink.error('questions.json', pathOf(at, [i]), `"${id}" is listed twice`);
    });
    if (list.length > maxCore(set)) ctx.sink.error('questions.json', at, `${String(list.length)} questions; a core set holds at most ${String(maxCore(set))}, a follow-up counting with its question`);
  }
}

/** Every rule, question and core-set check of this module. */
export function checkRulesAndQuestions(ctx: Ctx): void {
  checkRuleShapes(ctx);
  checkExcludes(ctx);
  checkSuppresses(ctx);
  checkFollowUps(ctx);
  checkCoreSets(ctx);
}

const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

/** Why a `{{name}}` in the body is wrong, or `null`. */
function placeholderProblem(name: string, p: { variables: readonly string[]; keep_list: boolean }): string | null {
  if (name.includes('.') && !isFactKey(name)) return `{{${name}}} names no fact key`;
  if (name === 'keep_list') return p.keep_list ? null : '{{keep_list}} needs keep_list: true';
  return p.variables.includes(name) ? null : `{{${name}}} is not listed in variables`;
}

/** Placeholders and variables match both ways; a dotted placeholder is a fact key; `{{keep_list}}` needs keep_list. */
function checkPlaceholders(ctx: Ctx, file: string, p: { body: string; variables: readonly string[]; keep_list: boolean }): void {
  const used = new Set([...p.body.matchAll(PLACEHOLDER)].map((m) => (m[1] ?? '').trim()));
  if (/\{\{|\}\}/.test(p.body.replace(PLACEHOLDER, ''))) ctx.sink.error(file, 'body', 'unbalanced {{ or }}');
  for (const problem of [...used].map((name) => placeholderProblem(name, p))) if (problem) ctx.sink.error(file, 'body', problem);
  for (const v of p.variables) {
    if (v === 'keep_list') ctx.sink.error(file, 'header.variables', 'keep_list is not a variable; keep_list: true provides {{keep_list}}');
    else if (!used.has(v)) ctx.sink.error(file, 'header.variables', `"${v}" is listed but the body never uses {{${v}}}`);
  }
  if (p.keep_list && !used.has('keep_list')) ctx.sink.error(file, 'body', 'keep_list is true but the body has no {{keep_list}}');
}

/** One template's header against its kind: file name, kind, keep-list and budget. */
function checkHeader(ctx: Ctx, file: string, p: PromptTemplate): void {
  const budget = PROMPT_BUDGETS[p.template];
  const kind = IMAGE_TEMPLATES.includes(p.template) ? 'image' : 'text';
  if (file !== `prompts/${p.template}.md`) ctx.sink.error(file, 'header.template', `the template "${p.template}" is in ${file}; the file is named after its template`);
  if (p.kind !== kind) ctx.sink.error(file, 'header.kind', `${p.template} is ${kind === 'image' ? 'an image' : 'a text'} prompt`);
  if (KEEP_LIST_TEMPLATES.includes(p.template) && !p.keep_list) ctx.sink.error(file, 'header.keep_list', `${p.template} carries the keep-list`);
  if (p.word_budget > budget) ctx.sink.error(file, 'header.word_budget', `${String(p.word_budget)} words; ${p.template} has at most ${String(budget)}`);
}

/** Each template's header, placeholders and word budget; the full set has one template per kind. */
export function checkPrompts(ctx: Ctx): void {
  const seen = new Map<PromptKind, string>();
  for (const { value: p, file } of ctx.content.prompts) {
    const other = seen.get(p.template);
    if (other) ctx.sink.error(file, 'header.template', `"${p.template}" is also defined in ${other}`);
    seen.set(p.template, file);
    checkHeader(ctx, file, p);
    checkPlaceholders(ctx, file, p);
    const fixed = p.body.replace(PLACEHOLDER, ' ').split(/\s+/).filter(Boolean).length;
    if (fixed > p.word_budget) ctx.sink.error(file, 'body', `${String(fixed)} words before any placeholder is filled; the budget is ${String(p.word_budget)}`);
  }
  if (ctx.options.complete ?? true) for (const k of PROMPT_KINDS) if (!seen.has(k)) ctx.sink.error(`prompts/${k}.md`, '$', `missing template for ${k}`);
}
