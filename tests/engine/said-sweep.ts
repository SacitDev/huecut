/**
 * The said sweep: seeded profiles of the five core sets as the screens ask them, "Not sure" one time in ten, a medium
 * face reading on a third, wishes on half, no reaction, tattoo or sore scalp on four in five (as most people answer, so the colour
 * lists are reached), and on half the profiles extra answers to the limit questions the core sets leave out (growing out, scars, top
 * length, fringe, tie-back, styling, trim, density, grey, style interest), so contradictory combinations occur. Every automatic slot
 * of every list (picks, the AI pool, lent looks) is checked against what was said by the independent `said.ts`.
 */
import type { Bands, QuestionsFile } from '../../src/domain/content/types.ts';
import { assessIdea, recommend, type EngineContent, type Recommendation } from '../../src/domain/engine/recommend.ts';
import { toFacts } from '../../src/domain/facts/answers-to-facts.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { answersFor, CORE, FACES, FACE_NAMES, faceFacts, type CoreSet } from './bars-profiles.ts';
import { random } from './engine-content.ts';
import type { saidChecker } from './said.ts';

/** Limit questions a core set may not ask; the sweep answers some of them at random, as a person who opened more questions would. */
const EXTRA = ['life-grow-out-goal', 'scalp-marks-cover', 'pref-top-length', 'pref-fringe', 'life-tie-back-needed', 'styling-time', 'trim-interval', 'hair-density',
  'grey-amount', 'colour-grey-goal', 'hair-style-interest', 'pref-change-amount', 'hair-current-length', 'hair-resting-length'];

const answered = (values: Readonly<Record<string, unknown>>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
/** No past reaction, no black-henna tattoo and a scalp that is fine. */
const SAFE = answered({ 'safety.dye_reaction': 'none', 'safety.henna_tattoo': false, 'safety.scalp_irritation': 'none' });

/** What one option of a question writes; an option with no value ("Not sure") writes nothing. */
function written(q: QuestionsFile['questions'][number], at: number): Record<string, unknown> {
  const o = q.options[at];
  if (!o) return {};
  if ('sets' in o) return { ...o.sets };
  return 'value' in o && o.value !== null && q.fact !== undefined ? { [q.fact]: q.type === 'multi' ? [o.value] : o.value } : {};
}

/** One random option of about four in ten of the extra questions, as answered facts. */
function extraFacts(file: QuestionsFile, rnd: () => number): Facts {
  const picked = file.questions.filter((q) => EXTRA.includes(q.id) && rnd() >= 0.6);
  return answered(Object.fromEntries(picked.flatMap((q) => Object.entries(written(q, Math.floor(rnd() * q.options.length))))));
}

/** Lists by core set: how many, how many empty or short, and what emptied a kind. */
interface Row { lists: number; empty: number; short: number; readonly causes: Record<string, number> }

/** What the sweep found: breaches by kind with a few examples, and the empty or short lists by core set with their causes. */
export interface SaidSweep {
  readonly profiles: number;
  readonly breaches: Readonly<Record<string, number>>;
  readonly examples: readonly string[];
  readonly empty: Readonly<Record<string, Row>>;
  readonly positives: number;
}

/**
 * Why a kind came back empty: the referral, the library (nothing was left out), each rule that alone keeps some item out (the
 * nearest misses), else each pair of rules that together keep some item out (two answers that conflict), else several
 * limits together; `null` assessment: not analysed (another copy of the engine).
 */
function causesOf(r: Recommendation, s: CoreSet, facts: Facts, content: EngineContent, assess: typeof assessIdea | null): string[] {
  return r.shortfall.filter((x) => x.available === 0).flatMap((sf) => {
    if (r.referral && sf.kind === 'colour') return ['referral'];
    if (!assess) return [`${sf.kind}:not analysed`];
    const items = (sf.kind === 'cut' ? content.cuts : content.looks).filter((x) => x.collections.some((c) => s.collections.includes(c)));
    const excluded = items.map((x) => assess(x.id, facts, content)?.excluded ?? []);
    if (excluded.every((ex) => ex.length === 0)) return [`${sf.kind}:library`];
    const alone = [...new Set(excluded.flatMap((ex) => (ex.length === 1 && ex[0] ? [ex[0].ruleId] : [])))];
    const pairs = [...new Set(excluded.flatMap((ex) => (ex.length === 2 ? [ex.map((x) => x.ruleId).sort().join(' + ')] : [])))];
    return alone.length > 0 ? alone.map((id) => `${sf.kind}:${id}`) : pairs.length > 0 ? pairs.map((p) => `${sf.kind}:${p}`) : [`${sf.kind}:several limits together`];
  });
}

/** One sweep profile: core answers, a face on a third, the safety answers on four in five, extra limits on every other pair. */
function profileOf(file: QuestionsFile, bands: Bands, rnd: () => number, i: number, s: CoreSet): { readonly facts: Facts; readonly extra: boolean } {
  const face = FACE_NAMES[i % FACE_NAMES.length] ?? 'balanced';
  const answers = answersFor(file, s.name, rnd, i, i % 2 === 0);
  const extra = Math.floor(i / 2) % 2 === 0;
  const facts = { ...toFacts(answers, file.questions, i % 3 === 0 ? faceFacts(FACES[face], 'medium') : null, bands), ...(i % 5 === 0 ? {} : SAFE), ...(extra ? extraFacts(file, rnd) : {}) };
  return { facts, extra };
}

/** Adds one list to its row. */
function count(row: Row, r: Recommendation, causes: readonly string[]): void {
  row.lists++;
  row.empty += r.picks.length === 0 ? 1 : 0;
  row.short += r.picks.length > 0 && r.shortfall.length > 0 ? 1 : 0;
  for (const c of causes) row.causes[c] = (row.causes[c] ?? 0) + 1;
}

/** Runs `n` profiles from `seed` and checks every automatic slot; `positives` counts lists that showed at least one idea. */
export function saidSweep(
  content: EngineContent, file: QuestionsFile, bands: Bands, check: ReturnType<typeof saidChecker>, seed: number, n: number,
  run: typeof recommend = recommend, assess: typeof assessIdea | null = assessIdea,
): SaidSweep {
  const rnd = random(seed);
  const breaches: Record<string, number> = {};
  const examples: string[] = [];
  const empty: Record<string, Row> = {};
  let positives = 0;
  for (let i = 0; i < n; i++) {
    const s = CORE[i % CORE.length];
    if (!s) throw new Error('no core set');
    const { facts, extra } = profileOf(file, bands, rnd, i, s);
    const r = run(facts, content, { kinds: s.kinds, collections: s.collections, count: 8 });
    positives += r.picks.length > 0 ? 1 : 0;
    for (const b of check.breaches(r, facts)) {
      breaches[b.kind] = (breaches[b.kind] ?? 0) + 1;
      if (examples.length < 12) examples.push(`${s.name} #${String(i)} ${b.id}: ${b.why}`);
    }
    count((empty[`${s.name}${extra ? ' + limits' : ''}`] ??= { lists: 0, empty: 0, short: 0, causes: {} }), r, causesOf(r, s, facts, content, assess));
  }
  return { profiles: n, breaches, examples, empty, positives };
}
