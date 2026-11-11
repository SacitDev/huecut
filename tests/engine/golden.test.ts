/**
 * Golden engine cases: every JSON case in `tests/engine-cases/` runs through `recommend()` against its expectations and
 * the engine invariants (`invariants.ts`), then a seeded 2,000-profile sweep
 * runs over `content/` once it holds a library. Both use checked library records and shipped rules.
 *
 * A case file holds one case or an array of cases:
 * {
 *   "id": "kebab-case", "about": "what it shows and which rule texts give the expected values",
 *   "content": "app" | "fixture",                  // content/ (default) or tests/fixtures/content/
 *   "facts": { "<fact key>": <value> },            // answered, high confidence
 *   "measured": { "<fact key>": { "value": <value>, "confidence": "low" | "medium" | "high" } },
 *   "request": { "kinds": ["cut", "colour"], "collections": ["salon"], "count": 4,
 *                "removed": ["<id>"], "added": ["<id>"], "pair": { "cut": "<id>", "colour": "<id>" } },
 *   "expect": {                                    // every part optional; ids may be any library item
 *     "picks": ["<id>", ...],                      // exact, in order (cuts first under Both)
 *     "excluded": { "<id>": ["<rule id>"] }, "scores": { "<id>": 3 }, "labels": { "<look id>": "plausible" },
 *     "depends_on": { "<look id>": ["<fact key>"] }, "reasons": { "<id>": ["<text>"] }, "notes": { "<id>": ["<rule id>"] },
 *     "feasibility": { "<cut id>": "today" | "after_growth" | "needs_adapting" | null },
 *     "referral": "<referral id>" | null, "colour_prompts": true, "shortfall": [{ "kind": "cut", "requested": 4, "available": 1 }],
 *     "first_pick": { "colour": { "any_of": [{ "<trait>": { "range": [1, 9] } }], "status": "today" } }   // the "Our pick" of a kind: its traits, a cut's status
 *   },
 *   "why": { "<expect part>.<id>": "how the value follows from the rules" }   // optional, for people only: no code reads it
 * }
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FACTS, FACT_KEYS, isFactKey, type Confidence, type FactKey, type Facts } from '../../src/domain/facts/registry.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { AnyTests } from '../../src/domain/content/types.ts';
import type { JourneyLabel } from '../../src/domain/content/values.ts';
import { cutTraits, lookTraits } from '../../src/domain/engine/derive-traits.ts';
import { evalAny } from '../../src/domain/engine/match.ts';
import { assessIdea, recommend, type EngineContent, type IdeaKind, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { engineFrom, random } from './engine-content.ts';
import { invariants, oneOf, valuesOf } from './invariants.ts';
import { saidChecker } from './said.ts';

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

interface GoldenCase {
  readonly id: string;
  readonly about?: string;
  readonly content?: 'app' | 'fixture';
  readonly facts?: Readonly<Record<string, unknown>>;
  readonly measured?: Readonly<Record<string, { readonly value: unknown; readonly confidence: Confidence }>>;
  readonly request: { readonly kinds: readonly IdeaKind[]; readonly collections?: RecommendOptions['collections']; readonly count: number;
    readonly removed?: readonly string[]; readonly added?: readonly string[]; readonly pair?: RecommendOptions['pair'] };
  readonly expect?: {
    readonly picks?: readonly string[]; readonly excluded?: Readonly<Record<string, readonly string[]>>; readonly scores?: Readonly<Record<string, number>>;
    readonly labels?: Readonly<Record<string, JourneyLabel>>; readonly depends_on?: Readonly<Record<string, readonly string[]>>;
    readonly reasons?: Readonly<Record<string, readonly string[]>>; readonly notes?: Readonly<Record<string, readonly string[]>>;
    readonly feasibility?: Readonly<Record<string, string | null>>; readonly referral?: string | null; readonly colour_prompts?: boolean;
    readonly shortfall?: readonly unknown[];
    readonly first_pick?: Partial<Record<IdeaKind, { readonly any_of?: readonly AnyTests[]; readonly status?: string | null }>>;
  };
}

const APP = fileURLToPath(new URL('../../', import.meta.url));
const DIRS = { app: join(APP, 'content'), fixture: join(APP, 'tests', 'fixtures', 'content') } as const;
const CASES_DIR = join(APP, 'tests', 'engine-cases');

const fact =(key: string, value: unknown, confidence: Confidence, source: 'answered' | 'measured') => [key, { key, value, confidence, source }] as const;
const factsOf = (gc: GoldenCase): Facts => Object.fromEntries([
  ...Object.entries(gc.facts ?? {}).map(([k, v]) => fact(k, v, 'high', 'answered')),
  ...Object.entries(gc.measured ?? {}).map(([k, m]) => fact(k, m.value, m.confidence, 'measured')),
]);
const optionsOf = (gc: GoldenCase): RecommendOptions => ({
  kinds: gc.request.kinds, collections: gc.request.collections ?? [], count: gc.request.count,
  ...(gc.request.removed ? { removed: gc.request.removed } : {}), ...(gc.request.added ? { added: gc.request.added } : {}), ...(gc.request.pair ? { pair: gc.request.pair } : {}),
});

/** The item traits of a pick on the person's facts, as rule matches read them. */
function pickTraits(id: string, kind: IdeaKind, f: Facts, c: EngineContent): Readonly<Record<string, unknown>> {
  const d = deriveFacts(f);
  const cut = kind === 'cut' ? c.cuts.find((x) => x.id === id) : undefined;
  const look = kind === 'colour' ? c.looks.find((x) => x.id === id) : undefined;
  return cut ? cutTraits(cut, d, c) : look ? lookTraits(look, d, c.shadeLevels) : {};
}

/** Whether "Our pick" of each kind satisfies what the case asks of it, not just which id it is. */
function firstPickProblems(gc: GoldenCase, f: Facts, c: EngineContent, r: ReturnType<typeof recommend>): string[] {
  return Object.entries(gc.expect?.first_pick ?? {}).flatMap(([kind, want]) => {
    const first = r.picks.find((p) => p.kind === kind);
    if (!first) return [`first_pick ${kind}: no pick`];
    return [
      ...(want.any_of && evalAny(kind as IdeaKind, want.any_of, pickTraits(first.id, kind as IdeaKind, f, c)).result !== 'pass' ? [`first_pick ${kind}: ${first.id} matches none of ${JSON.stringify(want.any_of)}`] : []),
      ...(want.status !== undefined && first.feasibility?.status !== want.status ? [`first_pick ${kind}: ${first.id} has status ${String(first.feasibility?.status)}, expected ${String(want.status)}`] : []),
    ];
  });
}

/** A case's expectations and invariants; every mismatch is one line. */
function runCase(gc: GoldenCase, c: EngineContent, said = SAID[gc.content ?? 'app']): string[] {
  const problems = [...[...Object.keys(gc.facts ?? {}), ...Object.keys(gc.measured ?? {})].filter((k) => !isFactKey(k)).map((k) => `unknown fact key ${k}`)];
  const f = factsOf(gc);
  const r = recommend(f, c, optionsOf(gc));
  const idea = (id: string) => assessIdea(id, f, c);
  const eq = (what: string, got: unknown, want: unknown) => { if (!same(got, want)) problems.push(`${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); };
  const per = <T>(what: string, table: Readonly<Record<string, T>> | undefined, get: (id: string) => unknown) => { for (const [id, want] of Object.entries(table ?? {})) eq(`${what} ${id}`, get(id), want); };
  const e = gc.expect ?? {};
  if (e.picks) eq('picks', r.picks.map((p) => p.id), e.picks);
  per('excluded', e.excluded, (id) => idea(id)?.excluded.map((x) => x.ruleId));
  per('score', e.scores, (id) => idea(id)?.score);
  per('label', e.labels, (id) => idea(id)?.label);
  per('depends_on', e.depends_on, (id) => idea(id)?.journey?.dependsOn);
  per('reasons', e.reasons, (id) => idea(id)?.reasons.map((x) => x.text));
  per('notes', e.notes, (id) => idea(id)?.notes.map((x) => x.ruleId));
  per('feasibility', e.feasibility, (id) => idea(id)?.feasibility?.status);
  if (e.referral !== undefined) eq('referral', r.referral?.id ?? null, e.referral);
  if (e.colour_prompts !== undefined) eq('colour_prompts', r.colourPrompts, e.colour_prompts);
  if (e.shortfall) eq('shortfall', r.shortfall, e.shortfall);
  return [...problems, ...firstPickProblems(gc, f, c, r), ...invariants(f, c, optionsOf(gc), true, Math.random, said)];
}

const caseFiles = existsSync(CASES_DIR) ? readdirSync(CASES_DIR).filter((n) => n.endsWith('.json')).sort() : [];
const cases = caseFiles.flatMap((file) => {
  const data: unknown = JSON.parse(readFileSync(join(CASES_DIR, file), 'utf8'));
  return (Array.isArray(data) ? data : [data]).map((gc) => ({ file, gc: gc as GoldenCase }));
});
const loaded = { app: engineFrom(DIRS.app), fixture: engineFrom(DIRS.fixture) };
/** What the person said, read from each content folder's own records. */
const SAID = { app: saidChecker(DIRS.app), fixture: saidChecker(DIRS.fixture) };

describe('golden cases in tests/engine-cases/', () => {
  if (cases.length === 0) it.skip('no JSON cases in tests/engine-cases/ yet: nothing to run', () => undefined);
  for (const { file, gc } of cases) {
    it(`${file}: ${gc.id}`, () => {
      const source = loaded[gc.content ?? 'app'];
      expect(source.content, `content for ${gc.content ?? 'app'}: ${source.note}`).not.toBeNull();
      if (source.content) expect(runCase(gc, source.content)).toEqual([]);
    });
  }
});

it('the runner reports a wrong expectation and passes a right one (fixture content)', () => {
  const content = loaded.fixture.content;
  expect(content, loaded.fixture.note).not.toBeNull();
  if (!content) return;
  // c80 leaves out razor cuts after a relaxer: the crop and its variant use a razor. The bob's longest zone (sides,
  // 18-22 cm) needs 18 cm against the chin band's 15 cm, and it needs adapting for coily hair. b02 notes its shrinkage.
  const gc: GoldenCase = {
    id: 'self-check', content: 'fixture', facts: { 'hair.texture': 'coily', 'hair.chemical_history': ['relaxer_perm'], 'hair.current_length': 'chin' },
    request: { kinds: ['cut'], count: 4 },
    expect: { picks: ['chin-bob-curtain-fringe'], excluded: { 'mid-drop-fade-textured-crop': ['c80'], 'skin-fade-textured-crop': ['c80'] },
      scores: { 'chin-bob-curtain-fringe': 0 }, notes: { 'chin-bob-curtain-fringe': ['b02'] }, feasibility: { 'chin-bob-curtain-fringe': 'after_growth' },
      shortfall: [{ kind: 'cut', requested: 4, available: 1, because: ['Razor cutting can fray relaxed ends, so razor cuts are left out.'] }], referral: null },
  };
  expect(runCase(gc, content)).toEqual([]);
  expect(runCase({ ...gc, expect: { picks: ['mid-drop-fade-textured-crop'] } }, content)).toEqual(['picks: expected ["mid-drop-fade-textured-crop"], got ["chin-bob-curtain-fringe"]']);
  expect(runCase({ ...gc, expect: { first_pick: { cut: { any_of: [{ silhouette: { is: 'bob' } }], status: 'after_growth' } } } }, content)).toEqual([]);
  expect(runCase({ ...gc, expect: { first_pick: { cut: { any_of: [{ silhouette: { is: 'crop' } }], status: 'today' } } } }, content)).toEqual([
    'first_pick cut: chin-bob-curtain-fringe matches none of [{"silhouette":{"is":"crop"}}]',
    'first_pick cut: chin-bob-curtain-fringe has status after_growth, expected today',
  ]);
});

const app = loaded.app.content;
const library = app !== null && app.cuts.length > 0 && app.looks.length > 0;
const sweepName = `keeps every invariant over 2,000 seeded random profiles of content/ (${library ? `${String(app.cuts.length)} cuts and variants, ${String(app.looks.length)} looks` : 'not run: no library there yet'}; ${loaded.app.note})`;

/** A random profile; every fourth one answers the colour core like someone who could get "Plausible". */
function profile(rnd: () => number, n: number): Facts {
  const keys = FACT_KEYS.filter((k) => FACTS[k].from !== 'derived');
  const measured = (k: FactKey) => FACTS[k].from === 'measured';
  const confidence = (k: FactKey): Confidence => (measured(k) ? (['low', 'medium', 'high'] as const)[Math.floor(rnd() * 3)] ?? 'high' : 'high');
  const f = Object.fromEntries(keys.filter(() => rnd() < 0.45).map((k) => fact(k, oneOf(valuesOf(k), rnd)[0], confidence(k), measured(k) ? 'measured' : 'answered')));
  if (n % 4 !== 0) return f;
  const colour = { 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'colour.natural_level': 1 + Math.floor(rnd() * 10) };
  return { ...f, ...Object.fromEntries(Object.entries(colour).map(([k, v]) => fact(k, v, 'high', 'answered'))) };
}

it.runIf(library)(sweepName, { timeout: 600_000 }, () => {
  if (!app) return;
  const rnd = random(20261108);
  const failures: string[] = [];
  let plausible = 0;
  for (let n = 0; n < 2000; n++) {
    const f = profile(rnd, n);
    const kinds = ([['cut'], ['colour'], ['cut', 'colour']] as const)[Math.floor(rnd() * 3)] ?? ['cut'];
    failures.push(...invariants(f, app, { kinds, collections: [], count: 1 + Math.floor(rnd() * 8) }, false, rnd, SAID.app).map((x) => `profile ${String(n)}: ${x}`));
    plausible += app.looks.filter((l) => assessIdea(l.id, f, app)?.journey?.label === 'plausible').length;
  }
  console.log(`content/ sweep: 2000 profiles, ${String(plausible)} plausible labels, ${String(failures.length)} failures${failures[0] ? `, first: ${failures[0]}` : ''}`);
  expect(failures.slice(0, 5)).toEqual([]);
  expect(plausible).toBeGreaterThan(0);
});
