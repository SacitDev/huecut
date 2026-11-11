/**
 * Loads `content/` for the check: each file parsed against its generated schema one record at a
 * time, every problem reported with file and JSON path, and the build-derived traits worked out for what loaded.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import type { FactKey } from '../../src/domain/facts/registry.ts';
import type { LookNeeds } from '../../src/domain/content/output.ts';
import { TARGET_KINDS, type ItemTraits, type TargetKind } from '../../src/domain/content/traits.ts';
import type {
  Bands, BeardStyle, ColourLook, Haircut, JourneyRecord, LibraryModel, PictureEntry, Policy, PromptTemplate, Question,
  QuestionsFile, Referral, Reminder, Rule, RuleFor, Shade, Technique,
} from '../../src/domain/content/types.ts';
import type { CoreSetName } from '../../src/domain/content/values.ts';
import {
  bandsSchema, beardSchema, coreSetsSchema, haircutSchema, journeySchema, lookSchema, modelSchema, phrasesSchema,
  pictureEntrySchema, pictureKeySchema, policySchema, promptHeaderSchema, questionSchema, reminderSchema, ruleSchema, shadeSchema, techniqueSchema,
} from './schema.ts';
import { applyVariant, deriveCutTraits, deriveLookTraits, techniqueId, type LookParts } from './derive.ts';

export interface Problem {
  readonly level: 'error' | 'warning';
  /** Relative to `content/`, with forward slashes. */
  readonly file: string;
  /** A JSON path (`$[2].when["hair.texture"]`), `header` or `body` in a template, or `line N` in `ids.lock`. */
  readonly path: string;
  readonly message: string;
}
export interface Sink {
  error(file: string, path: string, message: string): void;
  warn(file: string, path: string, message: string): void;
}
/** A record with where it came from. */
export interface At<T> { readonly value: T; readonly file: string; readonly path: string }

/** Everything the check loaded and derived; the build writes from it. */
export interface Content {
  /** Cuts, each followed by its variants laid over it. */
  readonly cuts: At<Haircut>[];
  readonly variantOf: Map<string, string>;
  readonly beards: At<BeardStyle>[];
  readonly shades: At<Shade>[];
  readonly techniques: At<Technique>[];
  readonly looks: At<ColourLook>[];
  readonly rules: { [T in TargetKind]: At<RuleFor<T>>[] };
  readonly journey: At<JourneyRecord>[];
  readonly reminders: At<Reminder | Referral>[];
  readonly questions: At<Question>[];
  readonly coreSets: QuestionsFile['core_sets'] | null;
  readonly phrases: Readonly<Record<string, string>> | null;
  readonly bands: Bands | null;
  readonly policy: Policy | null;
  readonly models: At<LibraryModel>[];
  readonly prompts: At<PromptTemplate>[];
  readonly pictures: Readonly<Record<string, PictureEntry>>;
  readonly lock: Map<string, { readonly retired: boolean; readonly line: number }>;
  readonly traits: { cut: Map<string, ItemTraits<'cut'>>; colour: Map<string, ItemTraits<'colour'>>; beard: Map<string, ItemTraits<'beard'>> };
  readonly parts: LookParts;
}

/** What point 3 of the plausible check needs; the engine fills it. */
export interface PlausibleInput {
  readonly set: CoreSetName;
  readonly core: readonly Question[];
  readonly improve: readonly Question[];
  readonly looks: readonly { readonly look: ColourLook; readonly traits: ItemTraits<'colour'>; readonly needs: LookNeeds }[];
  readonly journey: readonly JourneyRecord[];
}
/** Core answers alone under which a library look stays "Plausible" through every journey record. */
export interface PlausibleWitness {
  readonly look: string;
  /** Fact key to the answered value; only facts the core set asks. */
  readonly answers: Readonly<Partial<Record<FactKey, unknown>>>;
}
/** What the engine proves for one set: a surviving witness (or `null`), and golden cases that break an invariant. */
export interface PlausibleProof {
  readonly witness: PlausibleWitness | null;
  readonly problems: readonly string[];
}
export type PlausibleHook = (input: PlausibleInput) => PlausibleProof;

export interface CheckOptions {
  /**
   * The full content set: every `FACTS` key has a producer, every prompt kind a template and every technique value a
   * record. Default `true`; the small fixture sets turn it off, because they cover a few facts only.
   */
  readonly complete?: boolean;
  /** Point 3 of the plausible check. Without it the check says that point 3 did not run. */
  readonly plausibleReachable?: PlausibleHook;
}

/** Lookups every cross-file check uses. */
export interface Indexes {
  readonly cuts: Map<string, At<Haircut>>;
  readonly beards: Map<string, At<BeardStyle>>;
  readonly shades: Map<string, At<Shade>>;
  readonly techniques: Map<string, At<Technique>>;
  readonly looks: Map<string, At<ColourLook>>;
  readonly models: Map<string, At<LibraryModel>>;
  readonly questions: Map<string, At<Question>>;
  readonly rules: Map<string, At<Rule>>;
  readonly journeyIds: Set<string>;
  readonly referralIds: Set<string>;
  readonly reminderIds: Set<string>;
  /** The questions that write each fact. */
  readonly writers: Map<FactKey, Question[]>;
}

/** What a check module works on. */
export interface Ctx {
  readonly content: Content;
  readonly raw: ReadonlyMap<string, unknown>;
  readonly ix: Indexes;
  readonly sink: Sink;
  readonly notes: string[];
  readonly options: CheckOptions;
}

const seg = (k: PropertyKey): string =>
  typeof k === 'number' ? `[${String(k)}]` : /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(k)) ? `.${String(k)}` : `[${JSON.stringify(String(k))}]`;
/** `base` followed by `keys` as a JSON path: `pathOf('$', [2, 'when', 'hair.texture'])` is `$[2].when["hair.texture"]`. */
export const pathOf = (base: string, keys: readonly PropertyKey[]): string => base + keys.map(seg).join('');

/** Zod issues with paths; a union reports the branch that fits the input's keys, or its own message. */
function flatten(issues: readonly z.core.$ZodIssue[], prefix: readonly PropertyKey[] = []): { path: PropertyKey[]; message: string }[] {
  return issues.flatMap((iss) => {
    const path = [...prefix, ...iss.path];
    if (iss.code === 'invalid_union' && iss.errors.length > 0) {
      const fits = iss.errors.filter((b) => !b.some((x) => x.path.length === 0 && ['unrecognized_keys', 'invalid_type', 'invalid_value'].includes(x.code)));
      const best = fits.reduce<z.core.$ZodIssue[] | null>((a, b) => (a === null || b.length < a.length ? b : a), null);
      if (best) return flatten(best, path);
    }
    return [{ path, message: iss.message }];
  });
}

/** The tiny header format of `content/prompts/*.md`: `key: value` lines between `---` lines. */
function parsePrompt(src: string): { header: Record<string, unknown>; body: string } | string {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (!m) return 'a template starts with a header block between two "---" lines';
  const header: Record<string, unknown> = {};
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (!kv?.[1]) return `cannot read the header line "${line}"`;
    const v = (kv[2] ?? '').trim();
    header[kv[1]] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? Number(v)
      : /^\[.*\]$/.test(v) ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean) : v;
  }
  return { header, body: (m[2] ?? '').trim() };
}

interface LoadCtx { readonly dir: string; readonly sink: Sink; readonly raw: Map<string, unknown> }

function readJson(ctx: LoadCtx, file: string, required: boolean): unknown {
  const full = join(ctx.dir, file);
  if (!existsSync(full)) {
    if (required) ctx.sink.error(file, '$', 'missing file');
    return undefined;
  }
  try {
    const data: unknown = JSON.parse(readFileSync(full, 'utf8'));
    ctx.raw.set(file, data);
    return data;
  } catch (e) {
    ctx.sink.error(file, '$', `not valid JSON: ${(e as Error).message}`);
    return undefined;
  }
}

function parse<T>(ctx: LoadCtx, schema: z.ZodType<T>, data: unknown, file: string, path: string): T | null {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const i of flatten(r.error.issues)) ctx.sink.error(file, pathOf(path, i.path), i.message);
  return null;
}

/** An array file, one record at a time, so one bad record does not hide the others from the cross-file checks. */
function records<T>(ctx: LoadCtx, file: string, schema: z.ZodType<T>, data: unknown = readJson(ctx, file, true), base = '$'): At<T>[] {
  if (data === undefined) return [];
  if (!Array.isArray(data)) {
    ctx.sink.error(file, base, 'expected an array of records');
    return [];
  }
  return data.flatMap((d: unknown, i) => {
    const path = pathOf(base, [i]);
    const v = parse(ctx, schema, d, file, path);
    return v === null ? [] : [{ value: v, file, path }];
  });
}

const files = (ctx: LoadCtx, dir: string, ext: string): string[] =>
  existsSync(join(ctx.dir, dir)) ? readdirSync(join(ctx.dir, dir)).filter((f) => f.endsWith(ext)).sort().map((f) => `${dir}/${f}`) : [];

/** `haircuts/<family>.json`; each variant is laid over its cut and checked as a whole cut. */
function loadHaircuts(ctx: LoadCtx): { cuts: At<Haircut>[]; variantOf: Map<string, string> } {
  const cuts: At<Haircut>[] = [];
  const variantOf = new Map<string, string>();
  const list = files(ctx, 'haircuts', '.json');
  if (list.length === 0) ctx.sink.error('haircuts/', '$', 'no haircut files (content/haircuts/<family>.json)');
  for (const file of list) {
    const family = file.slice('haircuts/'.length, -'.json'.length);
    for (const at of records(ctx, file, haircutSchema)) {
      const cut = at.value;
      if (cut.family !== family) ctx.sink.error(file, `${at.path}.family`, `"${cut.family}" is in haircuts/${family}.json; a cut's family is its file name`);
      cuts.push(at);
      cut.variants.forEach((v, i) => {
        const path = pathOf(at.path, ['variants', i]);
        const merged = parse(ctx, haircutSchema, applyVariant(cut, v), file, path);
        if (merged) {
          cuts.push({ value: merged, file, path });
          variantOf.set(v.id, cut.id);
        }
      });
    }
  }
  return { cuts, variantOf };
}

function loadQuestions(ctx: LoadCtx): { questions: At<Question>[]; coreSets: QuestionsFile['core_sets'] | null } {
  const data = readJson(ctx, 'questions.json', true);
  if (data === undefined) return { questions: [], coreSets: null };
  const { questions, core_sets: sets, ...rest } = data as Record<string, unknown>;
  for (const k of Object.keys(rest)) ctx.sink.error('questions.json', pathOf('$', [k]), `unknown key: ${k}`);
  return {
    questions: records(ctx, 'questions.json', questionSchema, questions ?? null, '$.questions'),
    coreSets: parse(ctx, coreSetsSchema, sets, 'questions.json', '$.core_sets'),
  };
}

function loadPrompts(ctx: LoadCtx): At<PromptTemplate>[] {
  return files(ctx, 'prompts', '.md').flatMap((file) => {
    const parsed = parsePrompt(readFileSync(join(ctx.dir, file), 'utf8'));
    if (typeof parsed === 'string') {
      ctx.sink.error(file, 'header', parsed);
      return [];
    }
    const header = parse(ctx, promptHeaderSchema, parsed.header, file, 'header');
    return header ? [{ value: { ...header, body: parsed.body }, file, path: 'header' }] : [];
  });
}

/** `ids.lock`: one id per line with an optional ` retired`; blank lines and `#` comments are skipped. */
function loadLock(ctx: LoadCtx): Content['lock'] {
  const lock: Content['lock'] = new Map();
  if (!existsSync(join(ctx.dir, 'ids.lock'))) {
    ctx.sink.error('ids.lock', '$', 'missing file');
    return lock;
  }
  readFileSync(join(ctx.dir, 'ids.lock'), 'utf8').split('\n').forEach((raw, i) => {
    const t = raw.replace(/\r$/, '');
    const where = `line ${String(i + 1)}`;
    if (t.trim() === '' || t.startsWith('#')) return;
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)( retired)?$/.exec(t);
    const first = m?.[1] === undefined ? undefined : lock.get(m[1]);
    if (!m?.[1]) ctx.sink.error('ids.lock', where, `expected "<id>" or "<id> retired", found "${t}"`);
    else if (first) ctx.sink.error('ids.lock', where, `"${m[1]}" is listed twice (first on line ${String(first.line)})`);
    else lock.set(m[1], { retired: m[2] !== undefined, line: i + 1 });
  });
  return lock;
}

/** `pictures.json`, written by `scripts/images.ts`, one entry at a time; absent before any picture exists. */
function loadPictures(ctx: LoadCtx): Record<string, PictureEntry> {
  const data = readJson(ctx, 'pictures.json', false);
  if (data === undefined) return {};
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    ctx.sink.error('pictures.json', '$', 'expected an object of picture entries');
    return {};
  }
  return Object.fromEntries(Object.entries(data).flatMap(([key, value]: [string, unknown]) => {
    const path = pathOf('$', [key]);
    const ok = parse(ctx, pictureKeySchema, key, 'pictures.json', path) !== null;
    const entry = parse(ctx, pictureEntrySchema, value, 'pictures.json', path);
    return ok && entry ? [[key, entry]] : [];
  }));
}

const KNOWN = /^(beards|phrases|bands|policy|questions|library-models|pictures)\.json$|^colours\/(shades|techniques|looks)\.json$|^rules\/(cuts|colours|beards|journey|reminders)\.json$|^ids\.lock$|^haircuts\/[^/]+\.json$|^prompts\/[^/]+\.md$|^examples\/[^/]+\.json$|^schema\//;

function warnUnknownFiles(ctx: LoadCtx): void {
  const walk = (dir: string): string[] => readdirSync(join(ctx.dir, dir)).flatMap((f) => {
    const rel = dir ? `${dir}/${f}` : f;
    return statSync(join(ctx.dir, rel)).isDirectory() ? walk(rel) : [rel];
  });
  for (const f of existsSync(ctx.dir) ? walk('') : []) if (!KNOWN.test(f)) ctx.sink.warn(f, '$', 'unknown file: the check and the build ignore it');
}

/** A look's shades and technique records all exist, so its traits can be derived. */
const resolves = (look: ColourLook, parts: LookParts): boolean =>
  [look.base.shade, ...look.placements.map((p) => p.shade)].every((s) => parts.shades.has(s))
  && [...(look.base.technique === 'none' ? [] : [look.base.technique]), ...look.placements.map((p) => p.technique)].every((t) => parts.techniques.has(techniqueId(t)));

function deriveTraits(content: Omit<Content, 'traits'>): Content['traits'] {
  return {
    cut: new Map(content.cuts.map(({ value: c }) => [c.id, { ...c.traits, ...deriveCutTraits(c) }])),
    beard: new Map(content.beards.map(({ value: b }) => [b.id, b.traits])),
    colour: new Map(content.looks.filter(({ value: l }) => resolves(l, content.parts)).map(({ value: l }) => [l.id, deriveLookTraits(l, content.parts)])),
  };
}

/** Loads and derives everything in `dir`; problems go to `sink`. */
export function loadContent(dir: string, sink: Sink): { content: Content; raw: ReadonlyMap<string, unknown> } {
  const ctx: LoadCtx = { dir, sink, raw: new Map() };
  const single = <T>(file: string, schema: z.ZodType<T>): T | null => {
    const data = readJson(ctx, file, true);
    return data === undefined ? null : parse(ctx, schema, data, file, '$');
  };
  const shades = records(ctx, 'colours/shades.json', shadeSchema);
  const techniques = records(ctx, 'colours/techniques.json', techniqueSchema);
  const base = {
    ...loadHaircuts(ctx), beards: records(ctx, 'beards.json', beardSchema), shades, techniques,
    looks: records(ctx, 'colours/looks.json', lookSchema),
    rules: { cut: records(ctx, 'rules/cuts.json', ruleSchema('cut')), colour: records(ctx, 'rules/colours.json', ruleSchema('colour')), beard: records(ctx, 'rules/beards.json', ruleSchema('beard')) },
    journey: records(ctx, 'rules/journey.json', journeySchema), reminders: records(ctx, 'rules/reminders.json', reminderSchema),
    ...loadQuestions(ctx), phrases: single('phrases.json', phrasesSchema), bands: single('bands.json', bandsSchema),
    policy: single('policy.json', policySchema), models: records(ctx, 'library-models.json', modelSchema), prompts: loadPrompts(ctx),
    pictures: loadPictures(ctx),
    lock: loadLock(ctx),
    parts: { shades: new Map(shades.map((a) => [a.value.id, a.value])), techniques: new Map(techniques.map((a) => [a.value.id, a.value])) },
  };
  warnUnknownFiles(ctx);
  return { content: { ...base, traits: deriveTraits(base) }, raw: ctx.raw };
}

/** The lookups of `Indexes`. */
export function indexes(c: Content): Indexes {
  const byId = <T extends { id: string }>(list: readonly At<T>[]) => new Map(list.map((a) => [a.value.id, a]));
  const writers = new Map<FactKey, Question[]>();
  for (const { value: q } of c.questions) for (const k of factsWritten(q)) writers.set(k, [...(writers.get(k) ?? []), q]);
  const reminders = (kind: string) => new Set(c.reminders.filter((r) => r.value.kind === kind).map((r) => r.value.id));
  return {
    cuts: byId(c.cuts), beards: byId(c.beards), shades: byId(c.shades), techniques: byId(c.techniques), looks: byId(c.looks),
    models: byId(c.models), questions: byId(c.questions), rules: byId(TARGET_KINDS.flatMap((k): At<Rule>[] => c.rules[k])),
    journeyIds: new Set(c.journey.map((j) => j.value.id)), referralIds: reminders('referral'), reminderIds: reminders('reminder'), writers,
  };
}

/** The facts a question writes: its fact, the keys of its `sets` options or its wish options' facts. */
export function factsWritten(q: Question): FactKey[] {
  const out = new Set<FactKey>(q.fact ? [q.fact] : []);
  for (const o of q.options) {
    if ('sets' in o) for (const k of Object.keys(o.sets) as FactKey[]) out.add(k);
    if ('fact' in o) out.add(o.fact);
  }
  return [...out];
}
