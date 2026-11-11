/**
 * The production prompt builder on the shipped records: every look, every cut x colour pair, the longest cards and grids of
 * composite names and the longest second opinion must build within their word budgets. A word count is a sum over the names, so the
 * longest case that builds proves every shorter one does. A look that keeps the person's own base builds with the wordiest base a
 * person can have, as its prompt does on a list.
 */
import { FACTS, SHEET_FACTS, type Facts, type Range, type ValueSpec } from '../../src/domain/facts/registry.ts';
import type { Built, CardPlan, IdeaLook, PromptTemplates } from '../../src/domain/prompts/build.ts';
import { buildFinalCard, buildQuickGrid, buildSecondOpinion, buildTryOn, buildTryTogether, lookName, planCards, planGrids, withColour } from '../../src/domain/prompts/build.ts';
import { countWords } from '../../src/domain/prompts/template.ts';
import { EN } from '../../src/domain/render-model/copy.ts';
import { answerWords } from '../../src/domain/render-model/facts-copy.ts';
import { NOTE_FACTS } from '../../src/domain/render-model/face-card.ts';
import type { Ctx } from './load.ts';

const SAFE = { referral: null };
/** A broken template refuses every pair: the first few are enough to act on. */
const SHOWN = 20;
const SECOND_OPINION_FILE = 'prompts/second_opinion.md';

/** Why a build failed, or `null`; a missing template is its own error of `checkPrompts`, and an empty library builds no list. */
const refusal = (b: Built): string | null => (b.ok || b.error === 'missing_template' || b.error === 'no_candidates' ? null : b.error);
const longest = (looks: readonly IdeaLook[], n: number): IdeaLook[] => [...looks].sort((a, b) => countWords(lookName(b)) - countWords(lookName(a))).slice(0, n);
const wordiest = <T>(options: readonly T[], say: (option: T) => string): T | undefined => [...options].sort((a, b) => countWords(say(b)) - countWords(say(a)))[0];
const span = ([min, max]: Range): number[] => Array.from({ length: max - min + 1 }, (_, i) => min + i);
/** The person's base at its wordiest: every level the lengths or the natural colour can have, or not known. */
const OWN_BASE = wordiest<number | null>([null, ...span(FACTS['colour.current_level_lengths'].range), ...span(FACTS['colour.natural_level'].range)], (level) => EN.prompts.ownBase(level)) ?? null;

/** "What I need" at its longest: every limit at its wordiest, and the two wordiest concrete wishes the prompt carries. */
function longestNeeds(): [string, unknown][] {
  const c = EN.prompts.needs;
  const wishes = Object.entries(c.wishes).sort(([, a], [, b]) => countWords(b) - countWords(a)).slice(0, 2).map(([at]) => at.split(':'));
  return [
    ['life.grow_out_goal', true], ['scalp.marks_cover', true], ['life.tie_back_needed', true],
    ['life.trim_weeks_ok', wordiest(FACTS['life.trim_weeks_ok'].range, (n) => c.trim(n))], ['life.styling_minutes', wordiest(FACTS['life.styling_minutes'].range, (n) => c.styling(n))],
    ['pref.fringe', wordiest(Object.keys(c.fringe), (v) => c.fringe[v as keyof typeof c.fringe])], ['pref.top_length', wordiest(Object.keys(c.top), (v) => c.top[v as keyof typeof c.top])],
    ['pref.change_amount', wordiest(Object.keys(c.change), (v) => c.change[v as keyof typeof c.change])],
    ...wishes.map(([key = '', value]): [string, unknown] => [key, value]),
  ];
}

/** Every answer the second opinion can carry, "What I need" and every face note, each at its longest wording; a set counts with all its members. */
function longestFacts(): Facts {
  const answers = SHEET_FACTS.map((key) => {
    const spec: ValueSpec = FACTS[key];
    const say = (v: unknown): string => answerWords(EN.facts, key, v as never);
    const options: readonly unknown[] = spec.type === 'enum' ? spec.values : spec.type === 'set' ? [spec.values.filter((v) => !spec.exclusive?.includes(v))] : spec.range;
    return [key, { key, value: wordiest(options, say), confidence: 'high', source: 'answered' }];
  });
  const notes = NOTE_FACTS.map((key) => {
    const words: Readonly<Record<string, { readonly words: string }>> = EN.faceNotes[key].values;
    return [key, { key, value: wordiest(Object.keys(words), (v) => words[v]?.words ?? ''), confidence: 'high', source: 'measured' }];
  });
  const needs = longestNeeds().map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]);
  return Object.fromEntries([...answers, ...needs, ...notes]) as Facts;
}

/** The longest second opinion anyone can get, at 10 looks: the wordiest colour, so the colour answers count, and the 9 wordiest names of the rest; nothing may be left out. */
function checkSecondOpinion(ctx: Ctx, templates: PromptTemplates, cuts: readonly IdeaLook[], colours: readonly IdeaLook[]): void {
  const colour = longest(colours, 1);
  const pool = [...colour, ...longest([...cuts, ...colours].filter((l) => !colour.includes(l)), 9)];
  const built = buildSecondOpinion(templates, { pool, facts: longestFacts() }, SAFE);
  const why = refusal(built);
  if (why !== null) ctx.sink.error(SECOND_OPINION_FILE, 'body', `the production builder refuses the longest list: prompt_${why}`);
  else if (built.ok && built.value.omitted.length > 0) ctx.sink.error(SECOND_OPINION_FILE, 'body', `the longest list leaves out ${built.value.omitted.join(', ')}: shorten the template or raise its budget`);
  else if (built.ok) ctx.notes.push(`prompt check: the longest second opinion is ${String(built.value.words)} words of ${String(templates.second_opinion?.word_budget)}`);
}

/** Reports build failures. Lists the first `SHOWN` failures and counts any remaining failures. */
function reporter(ctx: Ctx, file: string, path: string) {
  let bad = 0;
  return {
    built: (what: string, b: Built) => {
      const why = refusal(b);
      if (why === null) return;
      bad += 1;
      if (bad <= SHOWN) ctx.sink.error(file, path, `the production builder refuses ${what}: prompt_${why}`);
    },
    done: () => { if (bad > SHOWN) ctx.sink.error(file, path, `${String(bad - SHOWN)} more refusals like these`); },
  };
}

/** The longest card and grid for a list of looks, as the builders would plan them. */
function worstCases(ctx: Ctx, templates: PromptTemplates, what: string, looks: readonly IdeaLook[]): void {
  const longestCard: CardPlan | undefined = planCards(longest(looks, 6))[0];
  const r = reporter(ctx, 'prompts/final_card.md', 'body');
  if (longestCard) r.built(`the longest card of ${what}`, buildFinalCard(templates, longestCard, SAFE));
  for (const plan of planGrids(longest(looks, 4))) r.built(`the longest grid of ${what}`, buildQuickGrid(templates, plan, SAFE));
  r.done();
}

/** Every look and pair through the builders that ship; any refusal fails the check, because a person would see an error instead of a prompt. */
export function checkBuiltPrompts(ctx: Ctx): void {
  const { content } = ctx;
  const templates = Object.fromEntries(content.prompts.map(({ value: p }) => [p.template, p])) as PromptTemplates;
  const cuts = content.cuts.map(({ value: c, file, path }) => ({ file, path, look: { id: c.id, kind: 'cut', name: c.name, prompt_spec: c.prompt_spec, upkeep: EN.prompts.cutUpkeep(c.upkeep.styling_minutes, c.upkeep.trim_weeks) } satisfies IdeaLook }));
  const looks = content.looks.map(({ value: l, file, path }) => {
    const upkeep = content.traits.colour.get(l.id)?.upkeep_weeks;
    const own = l.base.on_words === undefined ? {} : { ownBase: { level: OWN_BASE, words: l.base.on_words } };
    return { file, path, look: { id: l.id, kind: 'colour', name: l.name, prompt_spec: l.prompt_spec, ...own, ...(upkeep ? { upkeep: EN.prompts.colourUpkeep(upkeep) } : {}) } satisfies IdeaLook };
  });
  for (const { value: b, file, path } of content.beards) {
    const why = refusal(buildTryOn(templates, { id: b.id, kind: 'beard', name: b.name, prompt_spec: b.prompt_spec }, SAFE));
    if (why !== null) ctx.sink.error(file, `${path}.prompt_spec`, `the production builder refuses ${b.id}: prompt_${why}`);
  }
  for (const { look, file, path } of [...cuts, ...looks]) {
    const why = refusal(buildTryOn(templates, look, SAFE));
    if (why !== null) ctx.sink.error(file, `${path}.prompt_spec`, `the production builder refuses ${look.id}: prompt_${why}`);
  }
  const pairs = reporter(ctx, 'prompts/try_on_both.md', 'body');
  for (const { look: cut } of cuts) for (const { look: colour } of looks) pairs.built(`${cut.id} with ${colour.id}`, buildTryTogether(templates, { cut, colour }, SAFE));
  pairs.done();
  const cutLooks = cuts.map((c) => c.look);
  const colourLooks = looks.map((l) => l.look);
  const worstColour = longest(colourLooks, 1)[0];
  worstCases(ctx, templates, 'cuts', cutLooks);
  worstCases(ctx, templates, 'colour looks', colourLooks);
  if (worstColour) worstCases(ctx, templates, 'cuts in one colour', cutLooks.map((c) => withColour(c, worstColour)));
  checkSecondOpinion(ctx, templates, cutLooks, colourLooks);
  ctx.notes.push(`prompt check: ${String(cuts.length + looks.length + content.beards.length)} looks and ${String(cuts.length * looks.length)} cut x colour pairs built with the production builder`);
}
