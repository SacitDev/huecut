/**
 * `npm run content:check`: validates every file in `content/` against the generated schemas, then runs the cross-file
 * checks, the coverage report and the plausible check. Exits 1 on any error.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { TARGET_KINDS } from '../../src/domain/content/traits.ts';
import type { ShadeLevels } from '../../src/domain/engine/derive-traits.ts';
import { plausibleProof } from '../../src/domain/engine/journey.ts';
import { checkBannedWords, checkIds, checkIllustrations, checkPictures, checkReferences } from './check-items.ts';
import { checkPrompts, checkRulesAndQuestions } from './check-rules.ts';
import { checkCoverage, checkPlausible } from './check-coverage.ts';
import { checkBuiltPrompts } from './check-built.ts';
import { indexes, loadContent, type At, type CheckOptions, type Content, type Ctx, type Problem } from './load.ts';

export type { At, CheckOptions, Content, PlausibleHook, PlausibleInput, PlausibleProof, PlausibleWitness, Problem } from './load.ts';

export interface CheckResult {
  readonly problems: readonly Problem[];
  /** Report lines that are neither errors nor warnings: the plausible check's per-set list, and what did not run. */
  readonly notes: readonly string[];
  /** One line per file: what it holds. */
  readonly counts: readonly string[];
  readonly content: Content;
}

const plural = (k: number, what: string): string => `${String(k)} ${k === 1 ? what.replace(/s$/, '') : what}`;

/** One line per file, as `file: N things`. */
function countLines(c: Content): string[] {
  const lines: string[] = [];
  const per = (list: readonly At<unknown>[], what: string, file?: string) => {
    const byFile = new Map<string, number>(file ? [[file, 0]] : []);
    for (const a of list) byFile.set(a.file, (byFile.get(a.file) ?? 0) + 1);
    for (const [f, k] of byFile) lines.push(`${f}: ${plural(k, what)}`);
  };
  per(c.cuts.filter((a) => !c.variantOf.has(a.value.id)), 'cuts');
  per(c.cuts.filter((a) => c.variantOf.has(a.value.id)), 'variants');
  per(c.beards, 'beards', 'beards.json');
  per(c.shades, 'shades', 'colours/shades.json');
  per(c.techniques, 'techniques', 'colours/techniques.json');
  per(c.looks, 'colour looks', 'colours/looks.json');
  for (const k of TARGET_KINDS) per(c.rules[k], 'rules', `rules/${k}s.json`);
  per(c.journey, 'journey records', 'rules/journey.json');
  per(c.reminders.filter((r) => r.value.kind === 'reminder'), 'reminders', 'rules/reminders.json');
  per(c.reminders.filter((r) => r.value.kind === 'referral'), 'referrals', 'rules/reminders.json');
  per(c.questions, 'questions', 'questions.json');
  per(c.models, 'library models', 'library-models.json');
  per(c.prompts, 'templates');
  const retired = [...c.lock.values()].filter((l) => l.retired).length;
  lines.push(`phrases.json: ${plural(Object.keys(c.phrases ?? {}).length, 'phrases')}`, `bands.json: ${plural(c.bands?.bands.length ?? 0, 'bands')}`,
    `pictures.json: ${plural(Object.keys(c.pictures).length, 'pictures')}`, `ids.lock: ${plural(c.lock.size, 'ids')} (${String(retired)} retired)`);
  return lines;
}

/** Loads and checks a content directory (`app/content/`, or a fixture set with the same layout). */
export function checkContent(contentDir: string, options: CheckOptions = {}): CheckResult {
  const problems: Problem[] = [];
  const sink = {
    error: (file: string, path: string, message: string) => { problems.push({ level: 'error', file, path, message }); },
    warn: (file: string, path: string, message: string) => { problems.push({ level: 'warning', file, path, message }); },
  };
  const { content, raw } = loadContent(contentDir, sink);
  const ctx: Ctx = { content, raw, ix: indexes(content), sink, notes: [], options };
  checkReferences(ctx);
  checkIds(ctx);
  checkPictures(ctx);
  checkIllustrations(ctx);
  checkBannedWords(ctx);
  checkRulesAndQuestions(ctx);
  checkPrompts(ctx);
  checkBuiltPrompts(ctx);
  checkCoverage(ctx);
  checkPlausible(ctx);
  return { problems, notes: ctx.notes, counts: countLines(content), content };
}

/** Prints a result as the command line shows it; returns the number of errors. */
export function report(result: CheckResult, log: (line: string) => void = console.log): number {
  for (const line of result.counts) log(line);
  for (const p of result.problems) log(`${p.level === 'error' ? 'ERROR' : 'warning'} ${p.file} ${p.path}: ${p.message}`);
  for (const n of result.notes) log(n);
  const errors = result.problems.filter((p) => p.level === 'error').length;
  log(`content check: ${String(errors)} errors, ${String(result.problems.length - errors)} warnings`);
  return errors;
}

/** Each shade's level range from `colours/shades.json`, read as data; the check itself reports a bad file. */
export function shadeLevelsIn(contentDir: string): ShadeLevels {
  const file = join(contentDir, 'colours', 'shades.json');
  const data: unknown = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const ok = (s: unknown): s is { id: string; level: [number, number] } => typeof s === 'object' && s !== null && 'id' in s && 'level' in s;
  return Object.fromEntries((Array.isArray(data) ? data : []).filter(ok).map((s) => [s.id, s.level]));
}

interface CaseFacts { readonly id?: string; readonly content?: string; readonly facts?: object; readonly measured?: Readonly<Record<string, { readonly value: unknown; readonly confidence: string }>> }

/** The facts of every golden case on `content/` in `casesDir` (format in `tests/engine/golden.test.ts`); none when it is missing. */
export function goldenFactsIn(casesDir: string): { readonly id: string; readonly facts: Facts }[] {
  const files = existsSync(casesDir) ? readdirSync(casesDir).filter((n) => n.endsWith('.json')).sort() : [];
  return files.flatMap((file) => {
    const data: unknown = JSON.parse(readFileSync(join(casesDir, file), 'utf8'));
    return (Array.isArray(data) ? data : [data] as unknown[]).flatMap((x) => {
      const c = x as CaseFacts;
      if ((c.content ?? 'app') !== 'app') return [];
      const facts = Object.fromEntries([
        ...Object.entries(c.facts ?? {}).map(([key, value]) => [key, { key, value: value as unknown, confidence: 'high', source: 'answered' }] as const),
        ...Object.entries(c.measured ?? {}).map(([key, m]) => [key, { key, value: m.value, confidence: m.confidence, source: 'measured' }] as const),
      ]) as Facts;
      return [{ id: `${file}: ${c.id ?? '?'}`, facts }];
    });
  });
}

if (import.meta.main) {
  // Point 3 of the plausible check runs through the engine, with the shade levels and the golden cases.
  const root = join(import.meta.dirname, '..', '..');
  const dir = join(root, 'content');
  const levels = shadeLevelsIn(dir);
  const golden = goldenFactsIn(join(root, 'tests', 'engine-cases'));
  if (report(checkContent(dir, { plausibleReachable: (input) => plausibleProof(input, levels, golden) })) > 0) process.exitCode = 1;
}
