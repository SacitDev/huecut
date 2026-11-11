/**
 * The coverage report (it fails the build) and the plausible check on each colour core set: every match, fact, phrase and question
 * has to be used and reachable. The plausible check: (1) every fact a "Plausible" record reads is asked by the set; (2) every fact a
 * more cautious record reads is asked, derived or offered under "Improve my ideas"; (3) through the engine's hook, core answers alone
 * leave some library look "Plausible".
 */
import { FACTS, FACT_KEYS, FEASIBILITY_FACTS, SHEET_FACTS, isFactKey, type FactKey, type Range } from '../../src/domain/facts/registry.ts';
import { TRAITS, TARGET_KINDS, traitBy, traitSpec, type TargetKind, type TraitSpec } from '../../src/domain/content/traits.ts';
import type { AnyTest, AnyTests, JourneyRecord, Question, When } from '../../src/domain/content/types.ts';
import type { CoreSetName } from '../../src/domain/content/values.ts';
import { NUMERIC_FACE_FACTS } from '../../src/domain/measure/bands.ts';
import { fits } from './check-rules.ts';
import { lookNeeds } from './derive.ts';
import { factsWritten, pathOf, type Ctx, type PlausibleInput, type PlausibleProof } from './load.ts';

const COLOUR_SETS: readonly CoreSetName[] = ['colour/any', 'both/salon', 'both/barbering'];
const derivedFrom = (k: FactKey): readonly FactKey[] | undefined => (FACTS[k] as { derivedFrom?: readonly FactKey[] }).derivedFrom;
const tests = (m: When | AnyTests): [string, AnyTest][] => Object.entries(m as AnyTests);

/** A value test on one item value: `is` contains on a set; `range` needs the whole range of a range trait inside. */
function passes(test: AnyTest, value: unknown, spec: TraitSpec): boolean {
  if (test.known !== undefined) return test.known === (value !== undefined);
  if (value === undefined) return false;
  const members = spec.type === 'set' ? (value as unknown[]) : [value];
  if (test.is !== undefined) return members.includes(test.is);
  if (test.in) return members.some((m) => test.in?.includes(m as string));
  if (test.not) return !members.some((m) => test.not?.includes(m as string));
  if (!test.range) return false;
  const [lo, hi] = spec.type === 'range' ? (value as Range) : [value as number, value as number];
  return lo >= test.range[0] && hi <= test.range[1];
}

/** Whether a match can hold on an item. Per-person traits depend on the facts, so they count as satisfiable here. */
function matchesItem(kind: TargetKind, match: AnyTests, traits: Readonly<Record<string, unknown>>): boolean {
  return tests(match).every(([k, t]) => {
    const spec = traitSpec(kind, k);
    return spec !== undefined && (traitBy(spec) === 'person' || passes(t, traits[k], spec));
  });
}

/** Every match a record holds, with its JSON sub-path. */
function matchesOf(rec: object): { match: AnyTests; sub: (string | number)[] }[] {
  const r = rec as { favour?: AnyTests[]; disfavour?: AnyTests[]; on?: AnyTests };
  return [
    ...(r.favour ?? []).map((match, i) => ({ match, sub: ['favour', i] })),
    ...(r.disfavour ?? []).map((match, i) => ({ match, sub: ['disfavour', i] })),
    ...(r.on ? [{ match: r.on, sub: ['on'] }] : []),
  ];
}

/** A fact is produced by a question, a measurement band or a derivation from produced facts. */
function producer(ctx: Ctx): (k: FactKey) => boolean {
  const bandFacts = new Set((ctx.content.bands?.bands ?? []).map((b) => b.fact));
  const produced = (k: FactKey, depth: number): boolean => {
    if (ctx.ix.writers.has(k)) return true;
    if (FACTS[k].from === 'measured') return bandFacts.has(k) || (Object.values(NUMERIC_FACE_FACTS) as readonly FactKey[]).includes(k);
    const inputs = derivedFrom(k);
    return inputs !== undefined && depth < 3 && inputs.every((d) => produced(d, depth + 1));
  };
  return (k) => produced(k, 0);
}

/** Matches that match no item, rule facts nothing produces and favour values without a phrase. Returns the facts read. */
function checkRecords(ctx: Ctx, produced: (k: FactKey) => boolean): Set<FactKey> {
  const items: Record<TargetKind, Readonly<Record<string, unknown>>[]> = {
    cut: [...ctx.content.traits.cut.values()], colour: [...ctx.content.traits.colour.values()], beard: [...ctx.content.traits.beard.values()],
  };
  const reads = new Set<FactKey>();
  const visitWhen = (rec: object, file: string, path: string) => {
    for (const k of Object.keys((rec as { when?: When }).when ?? {}) as FactKey[]) {
      reads.add(k);
      if (!produced(k)) ctx.sink.error(file, pathOf(`${path}.when`, [k]), `no question, measurement band or derivation produces ${k}`);
    }
  };
  const visit = (kind: TargetKind | null, rec: object, file: string, path: string) => {
    visitWhen(rec, file, path);
    if (!kind) return;
    for (const { match, sub } of matchesOf(rec)) {
      for (const f of Object.keys(match).flatMap((t) => traitSpec(kind, t)?.reads ?? [])) if (isFactKey(f)) reads.add(f);
      if (!items[kind].some((traits) => matchesItem(kind, match, traits))) ctx.sink.error(file, pathOf(path, sub), `matches no ${kind === 'colour' ? 'colour look' : kind} in the library`);
    }
  };
  for (const kind of TARGET_KINDS) for (const { value, file, path } of ctx.content.rules[kind]) visit(kind, value, file, path);
  for (const { value, file, path } of ctx.content.journey) visit('colour', value, file, path);
  for (const { value, file, path } of ctx.content.reminders) visit(value.kind === 'referral' ? null : 'colour', value, file, path);
  return reads;
}

/** Each `is`, `in` or `range` value in a rank rule's favour list has a phrase, and every phrase key is real. */
function checkPhrases(ctx: Ctx): void {
  const phrases = ctx.content.phrases ?? {};
  for (const kind of TARGET_KINDS) for (const { value: r, file, path } of ctx.content.rules[kind]) {
    if (r.effect !== 'rank') continue;
    r.favour.forEach((m, i) => {
      for (const [trait, t] of tests(m)) {
        const keys = t.range ? [`${trait}.${String(t.range[0])}-${String(t.range[1])}`] : t.is !== undefined ? [`${trait}.${String(t.is)}`] : (t.in ?? []).map((v) => `${trait}.${String(v)}`);
        for (const key of keys) if (!(key in phrases)) ctx.sink.error(file, pathOf(path, ['favour', i, trait]), `no phrase for the favour value "${key}" in phrases.json`);
      }
    });
  }
  for (const key of Object.keys(phrases)) {
    const dot = key.indexOf('.');
    const [trait, value] = [key.slice(0, dot), key.slice(dot + 1)];
    const spec = TARGET_KINDS.map((k) => traitSpec(k, trait)).find((s) => s !== undefined);
    const ok = spec !== undefined && (spec.type === 'enum' || spec.type === 'set' ? spec.values.includes(value)
      : spec.type === 'bool' ? value === 'true' || value === 'false' : /^-?\d+(\.\d+)?(--?\d+(\.\d+)?)?$/.test(value));
    if (!ok) ctx.sink.error('phrases.json', pathOf('$', [key]), `"${key}" is not "<trait>.<value>" over the trait lists`);
  }
}

/** The other readers of a fact: feasibility, the stylist sheet, `show_if`, prompt placeholders and derivations. */
function addReaders(ctx: Ctx, reads: Set<FactKey>): void {
  const showIf = ctx.content.questions.flatMap(({ value: q }) => Object.keys(q.show_if ?? {}));
  const placeholders = ctx.content.prompts.flatMap(({ value: p }) => p.variables);
  for (const k of [...FEASIBILITY_FACTS, ...SHEET_FACTS, ...showIf, ...placeholders]) if (isFactKey(k)) reads.add(k);
  // A derivation reads its inputs when what it derives is read.
  for (let size = -1; size !== reads.size;) {
    size = reads.size;
    for (const d of FACT_KEYS.filter((k) => reads.has(k)).flatMap((k) => derivedFrom(k) ?? [])) reads.add(d);
  }
}

/** A question whose fact nothing reads is removed, not kept as a warning: it would ask a person something for nothing. */
function checkQuestionsRead(ctx: Ctx, reads: Set<FactKey>): void {
  addReaders(ctx, reads);
  for (const { value: q, file, path } of ctx.content.questions) {
    for (const k of factsWritten(q).filter((f) => !reads.has(f))) {
      const i = q.options.findIndex((o) => 'fact' in o && o.fact === k);
      ctx.sink.error(file, i >= 0 ? pathOf(path, ['options', i]) : path, `nothing reads ${k}: a question whose fact nothing reads is removed`);
    }
  }
}

/** Warnings: a trait value no item has. */
function warnUnusedValues(ctx: Ctx): void {
  for (const kind of TARGET_KINDS) {
    const file = kind === 'cut' ? 'haircuts/' : kind === 'colour' ? 'colours/looks.json' : 'beards.json';
    const items = [...ctx.content.traits[kind].values()] as Readonly<Record<string, unknown>>[];
    if (items.length === 0) {
      ctx.sink.warn(file, '$', `no ${kind} items`);
      continue;
    }
    for (const [trait, spec] of Object.entries(TRAITS[kind]) as [string, TraitSpec][]) {
      if (traitBy(spec) === 'person' || (spec.type !== 'enum' && spec.type !== 'set')) continue;
      const have = new Set(items.flatMap((t) => [t[trait]].flat()));
      const missing = spec.values.filter((v) => !have.has(v));
      if (missing.length > 0) ctx.sink.warn(file, '$', `no ${kind} item has ${trait}: ${missing.join(', ')}`);
    }
  }
}

/** The coverage report: every fact produced and read, every phrase real; a trait value no item has is a warning. */
export function checkCoverage(ctx: Ctx): void {
  const produced = producer(ctx);
  const reads = checkRecords(ctx, produced);
  checkPhrases(ctx);
  checkQuestionsRead(ctx, reads);
  if (ctx.options.complete ?? true) for (const k of FACT_KEYS) if (!produced(k)) ctx.sink.error('questions.json', '$', `nothing produces ${k} (no question, measurement band or derivation)`);
  warnUnusedValues(ctx);
}

/** What one colour core set asks, derives from its answers and offers under "Improve my ideas". */
function setFacts(ctx: Ctx, set: CoreSetName): { core: Question[]; improve: Question[]; asked: Set<FactKey>; reachable: Set<FactKey> } {
  const core = (ctx.content.coreSets?.[set] ?? []).flatMap((id) => ctx.ix.questions.get(id)?.value ?? []);
  const followUps = core.flatMap((q) => q.options.flatMap((o) => ('follow_up' in o && o.follow_up ? (ctx.ix.questions.get(o.follow_up)?.value ?? []) : [])));
  const asked = new Set([...core, ...followUps].flatMap(factsWritten));
  const derived = FACT_KEYS.filter((k) => derivedFrom(k)?.every((d) => asked.has(d)));
  const ids = new Set(core.map((q) => q.id));
  const improve = ctx.content.questions.map((a) => a.value).filter((q) => !ids.has(q.id) && fits(q, set));
  return { core, improve, asked, reachable: new Set([...asked, ...derived, ...improve.flatMap(factsWritten)]) };
}

/** Point 1: a plausible record's facts, and those behind its per-person traits, are all asked by the set. */
function plausibleNeeds(j: JourneyRecord): FactKey[] {
  const reads = Object.keys(j.on ?? {}).flatMap((k) => (traitSpec('colour', k)?.reads ?? []).filter(isFactKey));
  return [...new Set([...(Object.keys(j.when) as FactKey[]), ...reads, ...reads.flatMap((k) => derivedFrom(k) ?? [])])];
}

/** Points 1 and 2 on one set, and the hook for point 3. */
function checkSet(ctx: Ctx, set: CoreSetName, looks: PlausibleInput['looks']): void {
  const { core, improve, asked, reachable } = setFacts(ctx, set);
  const notCore = new Set<FactKey>();
  for (const { value: j, file, path } of ctx.content.journey) {
    if (j.label === 'plausible') {
      for (const k of plausibleNeeds(j).filter((f) => !asked.has(f))) ctx.sink.error(file, path, `plausible check (${set}): this plausible record needs ${k}, which the core set does not ask (point 1)`);
      continue;
    }
    for (const k of (Object.keys(j.when) as FactKey[]).filter((f) => f !== 'safety.health_context' && !asked.has(f))) {
      notCore.add(k);
      if (!reachable.has(k)) ctx.sink.error(file, pathOf(`${path}.when`, [k]), `plausible check (${set}): ${k} is neither asked, derived nor offered under "Improve my ideas", so "Answer ... to narrow it down" would point nowhere (point 2)`);
    }
  }
  ctx.notes.push(`plausible check ${set}: facts of more cautious records that are not core: ${[...notCore].join(', ') || 'none'}`);
  const proof = ctx.options.plausibleReachable?.({ set, core, improve, looks, journey: ctx.content.journey.map((a) => a.value) });
  if (proof) checkProof(ctx, set, proof, asked);
}

/**
 * Point 3: the engine's surviving witness must be a library look and core answers alone; it is reported, so
 * the proof can be read. No witness, or a golden case that breaks an invariant, fails the check.
 */
function checkProof(ctx: Ctx, set: CoreSetName, proof: PlausibleProof, asked: ReadonlySet<FactKey>): void {
  const at = pathOf('$.core_sets', [set]);
  const fail = (m: string) => { ctx.sink.error('questions.json', at, `plausible check (${set}): ${m} (point 3)`); };
  for (const m of proof.problems) fail(m);
  const w = proof.witness;
  if (!w) {
    fail('no profile of core answers alone leaves any library look "Plausible"');
    return;
  }
  if (!ctx.ix.looks.has(w.look)) fail(`the witness look "${w.look}" is not in the library`);
  for (const k of Object.keys(w.answers).filter((f) => !isFactKey(f) || !asked.has(f))) fail(`the witness answers ${k}, which the core set does not ask`);
  ctx.notes.push(`plausible check ${set}: point 3 witness ${w.look} stays "Plausible" with ${JSON.stringify(w.answers)}`);
}

/** The plausible check on every core set that includes colour. */
export function checkPlausible(ctx: Ctx): void {
  if (!ctx.content.coreSets) {
    ctx.notes.push('plausible check not run: questions.json has no valid core sets');
    return;
  }
  const looks = ctx.content.looks.flatMap(({ value: look }) => {
    const traits = ctx.content.traits.colour.get(look.id);
    return traits ? [{ look, traits, needs: lookNeeds(look, ctx.content.parts) }] : [];
  });
  for (const set of COLOUR_SETS) checkSet(ctx, set, looks);
  if (!ctx.options.plausibleReachable) ctx.notes.push('plausible check point 3 (reachable with core answers, golden cases) not run: it needs the engine, passed in as plausibleReachable');
}
