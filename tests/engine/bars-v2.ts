/**
 * The V2 list of engine bars, run by `node tests/engine/bars.ts --v2`: 10,000 seeded profiles of the five core sets, count 8, a
 * third with a medium face. Empty lists by goal and collection (and how many had eligible items), the labels seen, Plausible on a
 * guess or with a lift above 2, the engine invariants on every tenth profile, and three bars read as their intent: the
 * low-upkeep option, half good texture fits, and a witness profile for every shipped look.
 */
import type { Bands, QuestionsFile } from '../../src/domain/content/types.ts';
import { assessIdea, type EngineContent, type Idea, type Recommendation, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import type { EngineCut, EngineLook } from '../../src/domain/engine/derive-traits.ts';
import { toFacts, type AnswerValue, type Answers } from '../../src/domain/facts/answers-to-facts.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { answersFor, CORE, FACES, FACE_NAMES, faceFacts, type CoreSet } from './bars-profiles.ts';
import { random } from './engine-content.ts';
import { eligibleIds, invariants } from './invariants.ts';
import type { saidChecker } from './said.ts';

/** What the V2 list runs with: the content, the engine, the questions and bands, and the seed. */
export interface V2Run {
  readonly content: EngineContent;
  readonly recommend: (f: Facts, c: EngineContent, o: RecommendOptions) => Recommendation;
  readonly file: QuestionsFile;
  readonly bands: Bands;
  readonly seed: number;
  /** What the person said, on the library's own records; checked with the invariants. */
  readonly said?: ReturnType<typeof saidChecker>;
}

const cutPicks = (r: Recommendation): readonly Idea[] => r.picks.filter((p) => p.kind === 'cut');
/** A cut that works today and fits everything asked: what the selection's own priorities place first. */
const fitsToday = (i: Idea): boolean => i.kind === 'cut' && i.tradeOffs.length === 0 && i.feasibility?.status !== 'after_growth';
const relaxed = (r: Recommendation, what: string): boolean => r.relaxed.some((x) => x.kind === 'cut' && x.relaxed.includes(what as never));

/** A shortlist of 3 or more holds a low-upkeep option whenever an eligible one that works today exists; `null` when the bar does not apply. */
function lowMiss(r: Recommendation, all: Recommendation): boolean | null {
  const cs = cutPicks(r);
  if (cs.length < 3 || !all.pool.some((i) => fitsToday(i) && i.lowUpkeep)) return null;
  return !cs.some((p) => p.lowUpkeep) && !relaxed(r, 'low_upkeep');
}

/**
 * At least ceil(n/2) good texture fits in a list of n cuts, as many as the ideas that work today and fit everything hold; a
 * list the silhouette cap, distinct share or low-upkeep option kept below it is a constrained exception, counted apart.
 */
function textureBar(r: Recommendation, all: Recommendation): 'met' | 'missed' | 'constrained' | null {
  const cs = cutPicks(r);
  if (cs.length === 0 || cs.every((p) => p.goodFit === null)) return null;
  const target = Math.min(Math.ceil(cs.length / 2), all.pool.filter((i) => fitsToday(i) && i.goodFit === true).length);
  if (cs.filter((p) => p.goodFit === true).length >= target) return 'met';
  return relaxed(r, 'good_texture') ? 'constrained' : 'missed';
}

/** Whether the shown collections hold any item of the set's kinds that no exclusion leaves out: an empty list is then wrong. */
function eligibleIn(s: CoreSet, facts: Facts, content: EngineContent): boolean {
  const ids = eligibleIds(facts, content);
  const items = [...(s.kinds.includes('cut') ? content.cuts : []), ...(s.kinds.includes('colour') ? content.looks : [])];
  return items.some((i) => ids.has(i.id) && i.collections.some((x) => s.collections.includes(x)));
}

/** For a pick labelled Plausible: whether it rests on a guess (a fact it depends on, or no stated history), and whether its lift is unknown or above 2. */
function plausibleOff(p: Idea, facts: Facts): readonly [boolean, boolean] {
  if (p.label !== 'plausible') return [false, false];
  const lift = p.journey?.lift;
  return [(p.journey?.dependsOn.length ?? 0) > 0 || !facts['hair.chemical_history'], lift === null || (lift ?? 0) > 2];
}

/** The person's own answers as fact values: what a witness profile keeps. */
const said = (f: Facts): Record<string, unknown> => Object.fromEntries(Object.values(f).flatMap((x) => (x.source === 'answered' ? [[x.key, x.value]] : [])));

/** The answer that writes this fact value, as a person gives it; a follow-up is answered under the question that opens it. */
function answerTo(file: QuestionsFile, fact: string, value: unknown): [string, AnswerValue] | null {
  const same = (v: unknown): boolean => JSON.stringify(v) === JSON.stringify(value);
  for (const q of file.questions) {
    const i = q.options.findIndex((o) => ('value' in o && (q.fact === fact || ('fact' in o && o.fact === fact)) && same(o.value)) || ('sets' in o && fact in o.sets && same(o.sets[fact as keyof typeof o.sets])));
    if (i < 0) continue;
    const parent = file.questions.find((p) => p.options.some((o) => 'follow_up' in o && o.follow_up === q.id));
    return [q.id, { chosen: [i], ...(parent ? { under: parent.id } : {}) }];
  }
  return null;
}

/**
 * The answers to try for a cut with no witness yet: a texture, its own length today or long hair, its fringe and top, room for upkeep;
 * then each of those again with one more answer: a taste card, a recession stage or one wish.
 */
function cutTries(cut: EngineCut, file: QuestionsFile): Record<string, unknown>[] {
  const t = cut.traits;
  const own = t.length_class === 'buzz' ? 'very_short' : t.length_class === 'bob' ? 'shoulder' : t.length_class;
  const base = ['straight', 'wavy', 'curly', 'coily'].flatMap((texture) => [own, 'very_long'].flatMap((len) => (t.fringe === 'none' ? ['avoid', 'open'] : ['want', 'open']).map((fringe) => ({
    'hair.texture': texture, 'hair.current_length': len, 'hair.resting_length': len, 'pref.fringe': fringe, 'pref.top_length': t.top_length,
    'life.styling_minutes': 30, 'life.trim_weeks_ok': 3, 'pref.change_amount': 'bold', 'scalp.marks_cover': false, 'life.grow_out_goal': false,
  }))));
  const one = (id: string): Record<string, unknown>[] => {
    const q = file.questions.find((x) => x.id === id);
    return (q?.options ?? []).flatMap((o) => {
      const fact = 'fact' in o ? o.fact : q?.fact;
      return 'value' in o && o.value !== null && fact !== undefined ? [{ [fact]: o.value }] : [];
    });
  };
  const more = [...one('taste-cuts'), ...one('hair-recession-stage'), ...one('wishes')];
  return [...base, ...base.flatMap((b) => more.map((m) => ({ ...b, ...m })))];
}

/** The answers to try for a colour look: each direction, natural level and history, with healthy hair and no reaction. */
function lookTries(): Record<string, unknown>[] {
  const safe = { 'safety.dye_reaction': 'none', 'safety.henna_tattoo': false, 'hair.condition': 'healthy' };
  return ['lighter', 'darker', 'tone', 'refresh', 'grey', 'vivid', 'natural'].flatMap((way) => [2, 4, 6, 8].flatMap((natural) =>
    [['none', null], ...[3, 5, 7, 9].flatMap((lengths) => [['home_dye', lengths], ['highlights', lengths]])].flatMap(([history, lengths]) =>
      (way === 'grey' ? ['cover', 'blend', 'embrace', 'silver'] : [null]).map((goal) => ({
        ...safe, 'pref.colour_direction': way, 'colour.natural_level': natural, 'hair.chemical_history': history, 'colour.grey_percent': goal ? 40 : 0,
        ...(lengths === null ? {} : { 'colour.current_level_lengths': lengths }), ...(goal ? { 'colour.grey_goal': goal } : {}),
      })))));
}

/** A targeted search for a profile that puts this item in the delivered top 8; else what kept it out most often. */
function witnessFor(item: EngineCut | EngineLook, kind: 'cut' | 'colour', run: V2Run, rnd: () => number): { found: Record<string, unknown> | null; blocker: string } {
  const sets = CORE.filter((s) => s.kinds.includes(kind) && s.collections.some((c) => item.collections.includes(c)));
  const blocks = new Map<string, number>();
  const tries = kind === 'cut' ? cutTries(item as EngineCut, run.file) : lookTries();
  for (const s of sets) for (const [n, fixed] of tries.entries()) {
    const own: Answers = Object.fromEntries(Object.entries(fixed).flatMap(([fact, value]) => {
      const a = answerTo(run.file, fact, value);
      return a ? [a] : [];
    }));
    const facts = toFacts({ ...answersFor(run.file, s.name, rnd, n, false), ...own }, run.file.questions, null, run.bands);
    if (run.recommend(facts, run.content, { kinds: s.kinds, collections: s.collections, count: 8 }).picks.some((p) => p.id === item.id)) return { found: { set: s.name, ...said(facts) }, blocker: '' };
    const ids = assessIdea(item.id, facts, run.content)?.excluded.map((x) => x.ruleId) ?? [];
    const why = ids.length > 0 ? ids.join('+') : 'eligible, ranked below the top 8';
    blocks.set(why, (blocks.get(why) ?? 0) + 1);
  }
  return { found: null, blocker: [...blocks].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([w, k]) => `${w} (${String(k)})`).join('; ') };
}

/** What one profile's picks add: the first witness of each item, the labels seen, and Plausible on a guess or with a lift above 2. */
function notePicks(r: Recommendation, facts: Facts, s: CoreSet, t: { witness: Map<string, Record<string, unknown>>; labels: Set<string>; guess: boolean[]; lift: boolean[] }): void {
  for (const p of r.picks) {
    if (!t.witness.has(p.id)) t.witness.set(p.id, { set: s.name, ...said(facts) });
    if (p.label) t.labels.add(p.label);
    const [onGuess, onLift] = plausibleOff(p, facts);
    t.guess.push(onGuess);
    t.lift.push(onLift);
  }
}

/**
 * Looks no targeted search puts in a delivered top 8, each with its diagnosed blocker (an explicit exception, for a
 * stylist to check; never counted as reachable). "Twin": the same rules fire with the same points as on the looks named, so the
 * id decides among them and no answer the app asks tells them apart.
 */
const DEAD_EXCEPTIONS: Readonly<Record<string, string>> = {
  'mid-skin-fade': 'twin of high-skin-fade, low-skin-fade and low-taper-fade: no answer prefers a mid fade over a low or high one',
  'shadow-fade': 'twin of the skin and taper fades above, as above',
  'undercut-side-part': 'twin of the classic side parts and scissor tapers (the same rules fire); comb-over and hard-part fades add the short-trim fade favour (c05)',
};

/** The V2 list's numbers. */
export function v2(run: V2Run): Record<string, unknown> {
  const { content, file, bands } = run;
  const [rnd, check] = [random(run.seed + 7), random(run.seed + 11)];
  // One more run with room for every item: what the person could be offered, in the engine's own order.
  const roomy = { ...content, policy: { ...content.policy, pool_size: content.cuts.length + content.looks.length } };
  const labels = new Set<string>();
  const witness = new Map<string, Record<string, unknown>>();
  const empty: { readonly set: string; readonly eligible: boolean }[] = [];
  const [low, guess, lift]: [boolean[], boolean[], boolean[]] = [[], [], []];
  const texture: string[] = [];
  const broken: string[] = [];
  for (let n = 0; n < 10_000; n++) {
    const s = CORE[n % CORE.length];
    const face = FACE_NAMES[n % FACE_NAMES.length];
    if (!s || !face) throw new Error('no core set or face');
    const facts = toFacts(answersFor(file, s.name, rnd, n, false), file.questions, n % 3 === 0 ? faceFacts(FACES[face], 'medium') : null, bands);
    const options = { kinds: s.kinds, collections: s.collections, count: 8 };
    const [r, all] = [run.recommend(facts, content, options), run.recommend(facts, roomy, options)];
    if (r.picks.length === 0) empty.push({ set: s.name, eligible: eligibleIn(s, facts, content) });
    notePicks(r, facts, s, { witness, labels, guess, lift });
    const l = lowMiss(r, all);
    if (l !== null) low.push(l);
    texture.push(textureBar(r, all) ?? 'none');
    if (n % 10 === 0) broken.push(...invariants(facts, content, options, false, check, run.said).map((x) => `profile ${String(n)} ${s.name}: ${x}`));
  }
  const unseen = [...content.cuts.map((i) => [i, 'cut'] as const), ...content.looks.map((i) => [i, 'colour'] as const)].filter(([i]) => !witness.has(i.id));
  const searched = unseen.map(([i, kind]) => ({ id: i.id, ...witnessFor(i, kind, run, random(run.seed + 13)) }));
  for (const w of searched) if (w.found) witness.set(w.id, w.found);
  const count = (xs: readonly (boolean | string)[], v: boolean | string = true): number => xs.filter((x) => x === v).length;
  return {
    profiles: 10_000, labels: [...labels].sort(),
    empty: Object.fromEntries(CORE.map((s) => [s.name, { empty: empty.filter((e) => e.set === s.name).length, withEligible: empty.filter((e) => e.set === s.name && e.eligible).length }])),
    plausible_on_a_guess: count(guess), plausible_lift_over_2: count(lift),
    low_lists: low.length, low_missing: count(low),
    texture_lists: texture.length - count(texture, 'none'), texture_met: count(texture, 'met'), texture_missed: count(texture, 'missed'), texture_constrained: count(texture, 'constrained'),
    invariants_checked: 1000, invariant_breaks: broken.length, first_breaks: broken.slice(0, 5),
    shipped: content.cuts.length + content.looks.length, in_random_profiles: content.cuts.length + content.looks.length - unseen.length,
    found_by_search: searched.filter((w) => w.found).map((w) => w.id),
    dead_excepted: searched.filter((w) => !w.found && w.id in DEAD_EXCEPTIONS).map((w) => ({ id: w.id, blocker: w.blocker, exception: DEAD_EXCEPTIONS[w.id] })),
    dead_unexplained: searched.filter((w) => !w.found && !(w.id in DEAD_EXCEPTIONS)).map((w) => ({ id: w.id, blocker: w.blocker })),
    witnesses: Object.fromEntries(witness),
  };
}
