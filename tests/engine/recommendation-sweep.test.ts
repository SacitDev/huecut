/**
 * The recommendation sweep on the real content: seeded random answers over each core set, with no
 * "Not sure", no wishes and no photo. It is a stress sweep, not an estimate of how many real people get a result.
 */
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Question, QuestionsFile } from '../../src/domain/content/types.ts';
import { TRAITS } from '../../src/domain/content/traits.ts';
import type { Collection, CoreSetName } from '../../src/domain/content/values.ts';
import { cutTraits, feasibility, lookTraits, type EngineCut } from '../../src/domain/engine/derive-traits.ts';
import { recommend, type EngineContent, type Idea, type IdeaKind } from '../../src/domain/engine/recommend.ts';
import { exclusionsFor } from '../../src/domain/engine/score.ts';
import { toFacts, type AnswerValue, type Answers } from '../../src/domain/facts/answers-to-facts.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { coreQuestions, fitToPerson, isNotSure, orderOf } from '../../src/features/consult/questions.ts';
import { feasibilityText } from '../../src/features/consult/ideas/model.ts';
import { ideasCopy } from '../../src/strings/en-ideas.ts';
import { engineFrom, random } from './engine-content.ts';

const APP = fileURLToPath(new URL('../../', import.meta.url));
const loaded = engineFrom(join(APP, 'content'));
const file = JSON.parse(readFileSync(join(APP, 'content', 'questions.json'), 'utf8')) as QuestionsFile;
const PROFILES_PER_SET = 1500;
const SEED = 20261109;

interface SweepSet { readonly name: string; readonly set: CoreSetName; readonly kinds: readonly IdeaKind[]; readonly collections: readonly Collection[] }
const SETS: readonly SweepSet[] = [
  { name: "women's Both", set: 'both/salon', kinds: ['cut', 'colour'], collections: ['salon'] },
  { name: "men's Both", set: 'both/barbering', kinds: ['cut', 'colour'], collections: ['barbering'] },
  { name: "women's Cut", set: 'cut/salon', kinds: ['cut'], collections: ['salon'] },
  { name: "men's Cut", set: 'cut/barbering', kinds: ['cut'], collections: ['barbering'] },
  { name: 'Colour', set: 'colour/any', kinds: ['colour'], collections: ['salon', 'barbering'] },
];

/** One answer per core question, as the screens ask them; a follow-up is answered with its parent. */
function randomAnswers(set: CoreSetName, rnd: () => number): Answers {
  const answers: Record<string, AnswerValue> = {};
  const answer = (q: Question, order: readonly number[], under?: string): number | undefined => {
    if (q.type === 'wishes') {
      answers[q.id] = { chosen: [] };
      return undefined;
    }
    const sure = order.filter((i) => q.options[i] && !isNotSure(q.options[i]));
    const at = sure[Math.floor(rnd() * sure.length)] ?? 0;
    answers[q.id] = { chosen: [at], ...(under === undefined ? {} : { under }) };
    return at;
  };
  for (;;) {
    const facts = toFacts(answers, file.questions, null, null);
    const found = coreQuestions(file, set, facts).find((a) => answers[a.question.id] === undefined);
    if (!found) return answers;
    const next = fitToPerson(found, facts, [set.endsWith('barbering') ? 'barbering' : 'salon']);
    const at = answer(next.question, next.order);
    const follow = at === undefined ? undefined : next.followUps.get(at);
    if (follow) answer(follow, orderOf(follow), next.question.id);
  }
}

/** What each direction asks for, against the person's own hair region by region: darker takes some hair down and lifts none. */
// The lift a look really does in each known region (`known_lift`; a look without lightener lifts nothing).
/** Same depth: the lengths within a level of their own; the roots within a level of the natural level or the colour worn. */
const sameDepth = (t: ReturnType<typeof lookTraits>): boolean => Math.abs(t.lengths_lift ?? 99) <= 1 && (t.lengths_darken ?? 99) <= 1 && (t.roots_from_worn ?? 99) <= 1;
const SATISFIES: Readonly<Record<string, (t: ReturnType<typeof lookTraits>) => boolean>> = {
  lighter: (t) => (t.known_lift ?? -99) >= 1,
  darker: (t) => (t.darkens_by ?? 0) >= 1 && (t.known_lift ?? 99) <= 0,
  tone: sameDepth,
  refresh: sameDepth,
  // What the look does to grey, as authored, never a technique or family name.
  grey: (t) => t.grey_effect !== 'shows',
  vivid: (t) => t.vivid,
  natural: (t) => t.contrast_with_natural === 'low' && !t.vivid,
};

interface Tally {
  firstCut: number; poor: number; poorWithBetter: number; poorSaysToday: number; afterGrowth: number; afterGrowthWithToday: number;
  cutTied: number; cutTiedAtId: number; firstColour: number; colourTied: number; colourPicks: number; noBecause: number;
}
const emptyTally = (): Tally => ({ firstCut: 0, poor: 0, poorWithBetter: 0, poorSaysToday: 0, afterGrowth: 0, afterGrowthWithToday: 0, cutTied: 0, cutTiedAtId: 0, firstColour: 0, colourTied: 0, colourPicks: 0, noBecause: 0 });
interface Direction { asked: number; satisfiable: number; satisfied: number; unmet: string[] }
interface Buzz { profiles: number; first: number; examples: string[] }
interface Row { readonly set: SweepSet; readonly tally: Tally; readonly directions: Map<string, Direction>; readonly buzz: Buzz }

const LENGTHS: readonly string[] = TRAITS.cut.length_class.values;
const shownIn = (collections: readonly Collection[]) => (item: { readonly collections: readonly Collection[] }): boolean => item.collections.some((x) => collections.includes(x));

/** Steps of length from now, 0 when the length is unknown: the same comparison for every cut. */
const stepsOf = (cut: EngineCut, facts: Facts): number => {
  const now = facts['hair.current_length']?.value;
  return now === undefined ? 0 : Math.abs(LENGTHS.indexOf(cut.traits.length_class) - LENGTHS.indexOf(now));
};
const feasibleOrder = (i: Idea): number => (i.feasibility?.status === 'after_growth' ? 2 : i.feasibility?.status === 'needs_adapting' ? 1 : 0);

function countCut(first: Idea, r: ReturnType<typeof recommend>, s: SweepSet, d: Facts, c: EngineContent, t: Tally): void {
  const of = (i: Idea): EngineCut => {
    const found = c.cuts.find((x) => x.id === i.id);
    if (!found) throw new Error(`no cut ${i.id}`);
    return found;
  };
  const cut = of(first);
  const eligible = (): EngineCut[] => c.cuts.filter(shownIn(s.collections)).filter((x) => exclusionsFor('cut', cutTraits(x, d, c), c.rules.cut, d).length === 0);
  t.firstCut++;
  if (cutTraits(cut, d, c).texture_fit === 'poor') {
    t.poor++;
    if (eligible().some((x) => cutTraits(x, d, c).texture_fit !== 'poor')) t.poorWithBetter++;
  }
  t.poorSaysToday += r.picks.filter((p) => p.kind === 'cut' && cutTraits(of(p), d, c).texture_fit === 'poor' && feasibilityText(p.feasibility, p.poorFit) === ideasCopy.feasibility.today).length;
  if (first.feasibility?.status === 'after_growth') {
    t.afterGrowth++;
    // Someone who says they are growing it has asked for length; that answer is now in the core questions.
    if (d['life.grow_out_goal']?.value !== true && eligible().some((x) => feasibility(x, d, c.lengthBands, c.policy).length?.status === 'today')) t.afterGrowthWithToday++;
  }
  // Ties are measured on what decides the order: suitability, which the rule score feeds into as one factor.
  const others = r.pool.filter((p) => p.kind === 'cut' && p.id !== first.id && p.fitAt[0] === first.fitAt[0] && p.harmony === first.harmony);
  if (others.length > 0) t.cutTied++;
  if (others.some((p) => feasibleOrder(p) === feasibleOrder(first) && stepsOf(of(p), d) === stepsOf(cut, d))) t.cutTiedAtId++;
}

/** The grey goal and the direction are both asked: when they pull apart, honouring either is what was asked; neither is not. */
const honoured = (first: Idea, t1: ReturnType<typeof lookTraits> | undefined, satisfies: (t: ReturnType<typeof lookTraits>) => boolean): boolean =>
  (t1 !== undefined && satisfies(t1)) || first.contributions.some((x) => x.ruleId.startsWith('grey-goal-') && x.points > 0);

function countColour(first: Idea, r: ReturnType<typeof recommend>, s: SweepSet, d: Facts, c: EngineContent, t: Tally, directions: Map<string, Direction>): void {
  t.firstColour++;
  if (r.pool.some((p) => p.kind === 'colour' && p.id !== first.id && p.fitAt[0] === first.fitAt[0] && p.harmony === first.harmony)) t.colourTied++;
  // After a referral the referral replaces each look and its "Because" lines (no colour ideas, no colour prompts): no look is
  // offered to try, so neither its reasons nor the direction are judged.
  if (r.referral) return;
  const colours = r.picks.filter((p) => p.kind === 'colour');
  t.colourPicks += colours.length;
  t.noBecause += colours.filter((p) => p.reasons.length === 0).length;
  judgeDirection(first, r, s, d, c, directions);
}

/** Whether the first colour does the direction asked, whenever an eligible look in the shown collections can. */
function judgeDirection(first: Idea, r: ReturnType<typeof recommend>, s: SweepSet, d: Facts, c: EngineContent, directions: Map<string, Direction>): void {
  const asked = d['pref.colour_direction']?.value;
  if (asked === undefined) return;
  const satisfies = SATISFIES[asked];
  if (!satisfies) throw new Error(`no definition for the direction ${asked}`);
  const row = directions.get(asked) ?? { asked: 0, satisfiable: 0, satisfied: 0, unmet: [] };
  directions.set(asked, row);
  row.asked++;
  const lookOf = (id: string) => c.looks.find((l) => l.id === id);
  const traits = (id: string) => {
    const look = lookOf(id);
    return look ? lookTraits(look, d, c.shadeLevels) : undefined;
  };
  const eligible = c.looks.filter(shownIn(s.collections)).filter((l) => exclusionsFor('colour', lookTraits(l, d, c.shadeLevels), c.rules.colour, d).length === 0);
  if (!eligible.some((l) => satisfies(lookTraits(l, d, c.shadeLevels)))) return;
  row.satisfiable++;
  const t1 = traits(first.id);
  if (honoured(first, t1, satisfies)) row.satisfied++;
  else if (row.unmet.length < 3) row.unmet.push(`${first.id} (natural ${String(d['colour.natural_level']?.value)}, now ${String(d['colour.current_level_lengths']?.value)})`);
}

/** Hair past the shoulders, with no big change answered: the profiles where a Buzz cut must not come first. */
const longHairNoBoldAnswer = (d: Facts): boolean => ['long', 'very_long'].includes(d['hair.current_length']?.value ?? '') && d['pref.change_amount']?.value !== 'bold';

function countBuzz(s: SweepSet, d: Facts, cut: Idea | undefined, buzz: Buzz): void {
  if (s.collections.join() !== 'salon' || !longHairNoBoldAnswer(d)) return;
  buzz.profiles++;
  if (cut?.silhouette !== 'buzz') return;
  buzz.first++;
  if (buzz.examples.length < 3) buzz.examples.push(`${cut.id}: score ${String(cut.score)}, reasons ${JSON.stringify(cut.reasons.map((x) => x.ruleId))}`);
}

function sweep(c: EngineContent): Row[] {
  const rnd = random(SEED);
  // Ties are counted among every look that could be picked, not only the ten the AI prompt lists.
  const everyLook = { ...c, policy: { ...c.policy, pool_size: c.cuts.length + c.looks.length } };
  const rows: Row[] = SETS.map((s) => ({ set: s, tally: emptyTally(), directions: new Map<string, Direction>(), buzz: { profiles: 0, first: 0, examples: [] } }));
  for (const { set: s, tally, directions, buzz } of rows) {
    for (let n = 0; n < PROFILES_PER_SET; n++) {
      const facts = toFacts(randomAnswers(s.set, rnd), file.questions, null, null);
      const d = deriveFacts(facts);
      const r = recommend(facts, everyLook, { kinds: s.kinds, collections: s.collections, count: 4 });
      const cut = r.picks.find((p) => p.kind === 'cut');
      const colour = r.picks.find((p) => p.kind === 'colour');
      if (cut) countCut(cut, r, s, d, c, tally);
      if (colour) countColour(colour, r, s, d, c, tally, directions);
      countBuzz(s, d, cut, buzz);
    }
  }
  return rows;
}

/**
 * Ceilings in percent, so more ties or more ideas with no "Because" cannot come back unseen. A first pick still tied
 * here is decided by the later keys or the id, which is allowed; raise one only on purpose, with the reason in the commit.
 */
const CEILINGS: Readonly<Record<string, { readonly cutTied?: number; readonly cutTiedAtId?: number; readonly colourTied?: number; readonly noBecause?: number }>> = {
  // "No Because" counts looks shown with their reasons (none after a referral, which replaces them): 4.3% here on this seed (13.7%
  // before): grey is read from what a look does to it, a darkening of 4 levels or more and a retouch within a level of the
  // colour worn, with or without lightener, are named. Most of the rest lighten only the regrowth of lengths already at 9.
  "women's Both": { cutTied: 97, cutTiedAtId: 63, colourTied: 47, noBecause: 13 },
  "men's Both": { cutTied: 86, cutTiedAtId: 71, colourTied: 33, noBecause: 40 },
  "women's Cut": { cutTied: 90, cutTiedAtId: 54 },
  // One score, with no hidden traits or second pass to part barbering cuts of equal traits, so more first cuts tie all the way to the
  // id, which then decides, as is allowed: 38.8% on this seed now (57.3% when the one score came in, 40.1% before it); more cuts keep
  // the trim answer since each stores what it accepts.
  "men's Cut": { cutTied: 75, cutTiedAtId: 58 },
  // Counted on looks shown with their reasons, as above: 3.6% on this seed (9.4% before grey was read from what a look does to it and
  // a retouch within a level of the colour worn was named).
  Colour: { colourTied: 35, noBecause: 13 },
};

const percent = (n: number, of: number): string => `${String(n)} of ${String(of)} (${of === 0 ? '0.0' : ((n / of) * 100).toFixed(1)}%)`;
const within = (what: string, n: number, of: number, ceiling: number | undefined): void => {
  if (ceiling !== undefined) expect((n / of) * 100, what).toBeLessThanOrEqual(ceiling);
};
const app = loaded.content;

function printCut(t: Tally, log: (l: string) => void): void {
  if (t.firstCut === 0) return;
  log(`   first cut poor fit: ${percent(t.poor, t.firstCut)}; while another fit is eligible: ${percent(t.poorWithBetter, t.firstCut)}; poor fits told "today": ${String(t.poorSaysToday)}`);
  log(`   first cut after growth: ${percent(t.afterGrowth, t.firstCut)}; while a today cut exists: ${percent(t.afterGrowthWithToday, t.firstCut)}`);
  log(`   first cut tied at score and strong: ${percent(t.cutTied, t.firstCut)}; tied all the way to id: ${percent(t.cutTiedAtId, t.firstCut)}`);
}

function printColour(t: Tally, directions: ReadonlyMap<string, Direction>, log: (l: string) => void): void {
  if (t.firstColour === 0) return;
  log(`   first colour tied at score and strong (all the way to id): ${percent(t.colourTied, t.firstColour)}; colour ideas with no "Because": ${percent(t.noBecause, t.colourPicks)}`);
  for (const [dir, x] of [...directions.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    log(`   direction ${dir}: asked ${String(x.asked)}, an eligible look can satisfy it in ${String(x.satisfiable)}, first pick satisfies it in ${percent(x.satisfied, x.satisfiable)}${x.unmet.length > 0 ? `; for example ${x.unmet.join('; ')}` : ''}`);
  }
}

function checkRow({ set, tally: t, directions, buzz }: Row): void {
  expect(t.afterGrowthWithToday, `${set.name}: after growth first while a today cut exists`).toBe(0);
  expect(buzz.first, `${set.name}: Buzz cut first for long hair`).toBe(0);
  expect(t.poorSaysToday, `${set.name}: a poor fit told it works today`).toBe(0);
  expect(t.poorWithBetter, `${set.name}: a poor fit first while another fit is eligible`).toBe(0);
  for (const [dir, x] of directions) expect(x.satisfied, `${set.name}: direction ${dir}`).toBe(x.satisfiable);
  const c = CEILINGS[set.name];
  within(`${set.name}: first cut tied at score and strong`, t.cutTied, t.firstCut, c?.cutTied);
  within(`${set.name}: first cut tied to id`, t.cutTiedAtId, t.firstCut, c?.cutTiedAtId);
  within(`${set.name}: first colour tied`, t.colourTied, t.firstColour, c?.colourTied);
  within(`${set.name}: colour ideas with no "Because"`, t.noBecause, t.colourPicks, c?.noBecause);
}

it.runIf(app !== null && app.cuts.length > 0 && app.looks.length > 0)('recommendation sweep: what was asked, what fits and what is never first', { timeout: 600_000 }, () => {
  if (!app) return;
  const rows = sweep(app);
  const log = (l: string): void => { console.log(l); };
  log(`recommendation sweep: ${String(PROFILES_PER_SET)} profiles per set, seed ${String(SEED)}, ${String(app.cuts.length)} cuts and variants, ${String(app.looks.length)} looks; ${loaded.note}`);
  for (const { set, tally, directions, buzz } of rows) {
    log(`-- ${set.name} (${set.set}, ${set.collections.join(' and ')})`);
    printCut(tally, log);
    printColour(tally, directions, log);
    if (buzz.profiles > 0) log(`   Buzz cut first, hair past the shoulders, not a big change: ${percent(buzz.first, buzz.profiles)}${buzz.examples.length > 0 ? `; for example ${buzz.examples.join(' | ')}` : ''}`);
  }
  rows.forEach(checkRow);
});
