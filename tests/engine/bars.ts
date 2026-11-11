/**
 * The engine's numeric bars: seeded fictional profiles run through the app's own questions and `toFacts`,
 * measured on the real content. `node tests/engine/bars.ts --set dev|frozen [--off frame,mmr] [--engine <recommend.ts>] [--v2]`.
 * `--engine` and `--content` run another copy of the engine and content (an older `src/domain` and `content`, for "today"); `--off` removes components for ablation.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import type { Bands, QuestionsFile } from '../../src/domain/content/types.ts';
import type { Collection } from '../../src/domain/content/values.ts';
import { cutTraits, feasibility, lookTraits, type EngineCut, type EngineLook } from '../../src/domain/engine/derive-traits.ts';
import { labelLook } from '../../src/domain/engine/journey.ts';
import { exclusionsFor } from '../../src/domain/engine/score.ts';
import type { EngineContent, Idea, Recommendation, RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { toFacts, type Answers } from '../../src/domain/facts/answers-to-facts.ts';
import { deriveFacts } from '../../src/domain/facts/derive.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import type { FaceFacts } from '../../src/domain/fuse/fuse.ts';
import { improveQuestions } from '../../src/features/consult/ideas/model.ts';
import { questionImpact, runImpact } from '../../src/domain/engine/impact.ts';
import { answersFor, CORE, FACES, FACE_NAMES, faceFacts, type CoreSet, type FaceName } from './bars-profiles.ts';
import { engineFrom, random } from './engine-content.ts';
import { v2 } from './bars-v2.ts';
import { saidChecker } from './said.ts';

const { values: args } = parseArgs({ options: { set: { type: 'string', default: 'dev' }, off: { type: 'string', default: '' }, engine: { type: 'string' }, content: { type: 'string' }, v2: { type: 'boolean', default: false }, quick: { type: 'boolean', default: false } } });
const APP = fileURLToPath(new URL('../../', import.meta.url));
const CONTENT_DIR = args.content ?? join(APP, 'content');
const loaded = engineFrom(CONTENT_DIR);
if (!loaded.content) throw new Error(loaded.note);
const file = JSON.parse(readFileSync(join(CONTENT_DIR, 'questions.json'), 'utf8')) as QuestionsFile;
const bands = JSON.parse(readFileSync(join(CONTENT_DIR, 'bands.json'), 'utf8')) as Bands;
type Recommend = (f: Facts, c: EngineContent, o: RecommendOptions) => Recommendation;
const engine = (await import(args.engine ? pathToFileURL(args.engine).href : '../../src/domain/engine/recommend.ts')) as { readonly recommend: Recommend };
const off = args.off ? args.off.split(',') : [];
/** The content the engine sees: the switch is test-only, it never reaches `consult.json`. */
const content = { ...loaded.content, ...(off.length > 0 ? { off } : {}) } as EngineContent;

const SETS = {
  dev: { seed: 20261201, perSet: 80, wishes: 30 },
  frozen: { seed: 20261202, perSet: 120, wishes: 45 },
} as const;
const set = SETS[args.set === 'frozen' ? 'frozen' : 'dev'];

const HEIGHT: Readonly<Record<string, number>> = { flat: 0, low: 1, medium: 2, high: 3 };
const CAUTION = { plausible: 0, uncertain: 1, needs_professional: 2 } as const;
const cuts = new Map(content.cuts.map((c) => [c.id, c]));
const cutOf = (id: string): EngineCut => {
  const c = cuts.get(id);
  if (!c) throw new Error(`no cut ${id}`);
  return c;
};
const shown = (cs: readonly Collection[]) => (item: { readonly collections: readonly Collection[] }): boolean => item.collections.some((x) => cs.includes(x));
const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const pct = (n: number, of: number): number => (of === 0 ? 0 : Math.round((n / of) * 1000) / 10);
const r3 = (x: number): number => Math.round(x * 1000) / 1000;

/** The same trait similarity MMR uses: silhouette 3, length 3, fringe 2, top height, sides width and perimeter 1 each. */
function similarity(a: EngineCut, b: EngineCut): number {
  const t = (k: 'silhouette' | 'length_class' | 'fringe' | 'height_top' | 'sides_width' | 'perimeter', w: number): number => (a.traits[k] === b.traits[k] ? w : 0);
  return (t('silhouette', 3) + t('length_class', 3) + t('fringe', 2) + t('height_top', 1) + t('sides_width', 1) + t('perimeter', 1)) / 11;
}

interface Run { readonly set: CoreSet; readonly n: number; readonly face: FaceName | 'none'; readonly facts: Facts; readonly result: Recommendation }

const options = (s: CoreSet): RecommendOptions => ({ kinds: s.kinds, collections: s.collections, count: 4 });
const runOne = (s: CoreSet, n: number, face: FaceName | 'none', answers: Answers, ff: FaceFacts | null): Run => {
  const facts = toFacts(answers, file.questions, ff, bands);
  return { set: s, n, face, facts, result: engine.recommend(facts, content, options(s)) };
};
const cutPicks = (r: Recommendation): readonly Idea[] => r.picks.filter((p) => p.kind === 'cut');
const colourPicks = (r: Recommendation): readonly Idea[] => r.picks.filter((p) => p.kind === 'colour');
const key = (r: Recommendation): string => r.picks.map((p) => p.id).join(',');

function eligibleCuts(run: Run): EngineCut[] {
  const d = deriveFacts(run.facts);
  return content.cuts.filter(shown(run.set.collections)).filter((x) => exclusionsFor('cut', cutTraits(x, d, content), content.rules.cut, d).length === 0);
}

/** Bars 1a, 1b and 1c for one core set. */
function faceBars(runs: readonly Run[], s: CoreSet, answers: readonly Answers[]): Record<string, unknown> {
  const of = (face: string) => runs.filter((r) => r.set === s && r.face === face);
  if (s.kinds.includes('cut')) {
    const lon = of('long');
    const rou = of('round');
    const differ = lon.filter((r, i) => key(r.result) !== key(rou[i]?.result ?? r.result)).length;
    const height = (rs: readonly Run[]) => mean(rs.flatMap((r) => cutPicks(r.result).map((p) => HEIGHT[cutOf(p.id).traits.height_top] ?? 0)));
    const none = of('none');
    const medium = answers.filter((a, i) => {
      const r = runOne(s, i, 'none', a, faceFacts(FACES.round, 'medium'));
      return key(r.result) === key(none[i]?.result ?? r.result);
    }).length;
    return { differ_pct: pct(differ, lon.length), height_long: r3(height(lon)), height_round: r3(height(rou)), height_rise: r3(height(rou) - height(lon)), medium_equals_none_pct: pct(medium, answers.length) };
  }
  return {};
}

/** One run's first cut against what was stated: poor fit, trim, styling and growth while a compliant cut exists. */
function firstCutMisses(r: Run): { poor: boolean; trim: boolean; style: boolean; growth: boolean } {
  const d = deriveFacts(r.facts);
  const first = cutPicks(r.result)[0];
  const none = { poor: false, trim: false, style: false, growth: false };
  if (!first) return none;
  const c = cutOf(first.id);
  const elig = eligibleCuts(r);
  const stated = d['life.trim_weeks_ok']?.value;
  const minutes = d['life.styling_minutes']?.value;
  return {
    poor: cutTraits(c, d, content).texture_fit === 'poor' && elig.some((x) => cutTraits(x, d, content).texture_fit !== 'poor'),
    trim: stated !== undefined && c.traits.trim_weeks[1] < stated && elig.some((x) => x.traits.trim_weeks[1] >= stated),
    style: minutes !== undefined && c.traits.styling_minutes[0] > minutes && elig.some((x) => x.traits.styling_minutes[0] <= minutes),
    growth: first.feasibility?.status === 'after_growth' && elig.some((x) => feasibility(x, d, content.lengthBands, content.policy).length?.status === 'today'),
  };
}

function firstPickBars(runs: readonly Run[], s: CoreSet): Record<string, unknown> {
  const rows = runs.filter((r) => r.set === s);
  const cut = rows.filter((r) => s.kinds.includes('cut') && cutPicks(r.result).length > 0);
  const misses = cut.map(firstCutMisses);
  const [poor, trim, style, growth] = (['poor', 'trim', 'style', 'growth'] as const).map((k) => misses.filter((m) => m[k]).length);
  const colour = rows.filter((r) => colourPicks(r.result).length > 0);
  const firstColour = colour.flatMap((r) => (colourPicks(r.result)[0]?.label ? [colourPicks(r.result)[0]] : []));
  const out: Record<string, unknown> = {};
  if (cut.length > 0) Object.assign(out, { first_poor_pct: pct(poor ?? 0, cut.length), first_trim_over_pct: pct(trim ?? 0, cut.length), first_style_over_pct: pct(style ?? 0, cut.length), first_growth_with_today: growth ?? 0 });
  if (firstColour.length > 0) Object.assign(out, { first_colour_caution: r3(mean(firstColour.map((c) => CAUTION[c?.label ?? 'uncertain']))), first_colour_plausible_pct: pct(firstColour.filter((c) => c?.label === 'plausible').length, firstColour.length) });
  return out;
}

function diversityBars(runs: readonly Run[], s: CoreSet): Record<string, unknown> {
  if (!s.kinds.includes('cut')) return {};
  const rows = runs.filter((r) => r.set === s);
  const pairs = rows.flatMap((r) => {
    const cs = cutPicks(r.result).map((p) => cutOf(p.id));
    return cs.flatMap((a, i) => cs.slice(i + 1).map((b) => similarity(a, b)));
  });
  const distinct = (get: (c: EngineCut) => string) => mean(rows.map((r) => new Set(cutPicks(r.result).map((p) => get(cutOf(p.id)))).size));
  const firsts = rows.flatMap((r) => cutPicks(r.result)[0]?.id ?? []);
  const counts = new Map<string, number>();
  firsts.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return {
    silhouettes: r3(distinct((c) => c.traits.silhouette)), fringes: r3(distinct((c) => c.traits.fringe)), pair_sim: r3(mean(pairs)), distinct_first: counts.size,
    top_first_pct: pct(Math.max(0, ...counts.values()), firsts.length), distinct_any: new Set(rows.flatMap((r) => cutPicks(r.result).map((p) => p.id))).size,
  };
}

/** Today's engine has no `fitAt` or `beards`, so the harness reads them as optional. */
const fitAt = (p: Partial<Idea>, slot: number): number => (p.fitAt ?? [])[slot % ((p.fitAt ?? []).length || 1)] ?? 0;
const beardsOf = (p: Partial<Idea> | undefined): readonly string[] => p?.beards ?? [];
/** A low-upkeep option this person could be offered: one their stated answers have not left out. */
const lowUpkeepExists = (collections: readonly Collection[], facts: Facts): boolean => {
  const d = deriveFacts(facts);
  return content.cuts.filter(shown(collections)).filter((x) => exclusionsFor('cut', cutTraits(x, d, content), content.rules.cut, d).length === 0).some((x) => x.traits.styling_minutes[1] <= content.policy.low_upkeep.max_styling_minutes && x.traits.trim_weeks[0] >= content.policy.low_upkeep.min_trim_weeks);
};

/** One list against the cap and the low-upkeep rule, unless the selection recorded relaxing them. */
function slateBreaks(r: Run, anyLow: boolean): { cap: boolean; low: boolean } {
  const cs = cutPicks(r.result);
  const per = new Map<string, number>();
  for (const p of cs) if (p.silhouette) per.set(p.silhouette, (per.get(p.silhouette) ?? 0) + 1);
  const relaxed = r.result.relaxed.find((x) => x.kind === 'cut')?.relaxed ?? [];
  return {
    cap: !relaxed.includes('max_per_silhouette') && [...per.values()].some((v) => v > content.policy.max_per_silhouette),
    low: cs.length >= 2 && anyLow && !cs.some((p) => p.lowUpkeep) && !relaxed.includes('low_upkeep') && r.result.shortfall.length === 0,
  };
}

/** Bars 6a and the slate's mean suitability (bar 6b compares it with `--off mmr`). */
function slateBars(runs: readonly Run[], s: CoreSet): Record<string, unknown> {
  if (!s.kinds.includes('cut')) return {};
  const rows = runs.filter((r) => r.set === s);
  const breaks = rows.map((r) => slateBreaks(r, lowUpkeepExists(s.collections, r.facts)));
  return {
    cap_breaks: breaks.filter((b) => b.cap).length, low_breaks: breaks.filter((b) => b.low).length,
    mean_pick_fit: r3(mean(rows.flatMap((r) => cutPicks(r.result).map((p, slot) => fitAt(p, slot))))),
  };
}

/** Bars 8a-8c, on the barbering sets. */
function beardBars(runs: readonly Run[], s: CoreSet): Record<string, unknown> {
  if (!s.kinds.includes('cut') || !s.collections.includes('barbering') || !content.beards) return {};
  const beards = new Map(content.beards.map((b) => [b.id, b]));
  const mid = (r: readonly [number, number]): number => (r[0] + r[1]) / 2;
  const rows = runs.filter((r) => r.set === s && cutPicks(r.result)[0]);
  const firstBeards = (r: Run): readonly string[] => beardsOf(cutPicks(r.result)[0]);
  let patchyBad = 0;
  const seen = new Set<string>();
  for (const r of rows) {
    cutPicks(r.result).forEach((p) => { beardsOf(p).forEach((b) => seen.add(b)); });
    const facts: Facts = { ...r.facts, 'beard.density': { key: 'beard.density', value: 'patchy', confidence: 'high', source: 'answered' } };
    const top = beards.get(beardsOf(cutPicks(engine.recommend(facts, content, options(s)))[0])[0] ?? '');
    if (top && mid(top.zones_mm.cheeks) > 12) patchyBad++;
  }
  const of = (face: string) => rows.filter((r) => r.face === face);
  const lon = of('long');
  const rou = of('round');
  const differ = lon.filter((r, i) => firstBeards(r).join() !== (rou[i] ? firstBeards(rou[i]).join() : firstBeards(r).join())).length;
  return { beard_patchy_full_first: patchyBad, beard_differ_pct: pct(differ, lon.length), beards_reached: seen.size, beards_seen: [...seen].sort() };
}

// ── Bars 9a-9h: practical fit holds first, measured over all picks of the kind ──

/** How many picks break a limit while an acceptable item remains unpicked (by default, one that does not break it), and how many picks there are. */
function overLimit<T extends { readonly id: string }>(picks: readonly Idea[], eligible: readonly T[], isBad: (x: T) => boolean, isGood: (x: T) => boolean = (x) => !isBad(x)): { n: number; picks: number } {
  const byId = new Map(eligible.map((x) => [x.id, x]));
  const bad = picks.filter((p) => { const x = byId.get(p.id); return x !== undefined && isBad(x); }).length;
  const remaining = eligible.filter((x) => !picks.some((p) => p.id === x.id) && isGood(x)).length;
  return { n: Math.min(bad, remaining), picks: picks.length };
}

const satisfies: Readonly<Record<string, (t: ReturnType<typeof lookTraits>) => boolean>> = {
  lighter: (t) => (t.lift_levels ?? -99) >= 1,
  darker: (t) => (t.darkens_by ?? 0) >= 1 && (t.lift_levels ?? 99) <= 0,
  tone: (t) => Math.abs(t.lift_levels ?? 99) <= 1 && (t.darkens_by ?? 99) <= 1,
  refresh: (t) => Math.abs(t.lift_levels ?? 99) <= 1 && (t.darkens_by ?? 99) <= 1,
  grey: (t) => t.technique.includes('grey_coverage') || t.technique.includes('grey_blending') || t.family === 'grey_silver',
  vivid: (t) => t.vivid,
  natural: (t) => t.contrast_with_natural === 'low' && !t.vivid,
};

interface Tally { n: number; picks: number }
const add = (t: Tally, x: { n: number; picks: number }): void => { t.n += x.n; t.picks += x.picks; };
const tally = (): Tally => ({ n: 0, picks: 0 });
const rate = (t: Tally): number => pct(t.n, t.picks);

/** Whether a cut misses the stated trim interval or styling time. */
const upkeepMiss = (x: EngineCut, weeks: number | undefined, minutes: number | undefined): boolean =>
  (weeks !== undefined && x.traits.trim_weeks[1] < weeks) || (minutes !== undefined && x.traits.styling_minutes[0] > minutes);

/** Whether a cut is made for thicker hair than this person's: a poor density fit, or a thick-hair cut on low density or fine strands. */
function densityMiss(x: EngineCut, d: Facts): boolean {
  const density = d['hair.density']?.value;
  const thin = density === 'low' || d['hair.strand']?.value === 'fine';
  return (density !== undefined && x.density_fit[density].fit === 'poor') || (thin && x.traits.tags.includes('thick_hair_friendly'));
}

function cutPractical(r: Run, out: Record<'growth' | 'event' | 'poor' | 'curly' | 'density' | 'upkeep', Tally>): void {
  const d = deriveFacts(r.facts);
  const picks = cutPicks(r.result);
  const elig = eligibleCuts(r);
  const needsGrowth = (x: EngineCut): boolean => feasibility(x, d, content.lengthBands, content.policy).length?.status === 'after_growth';
  if (d['life.grow_out_goal']?.value !== true) add(out.growth, overLimit(picks, elig, needsGrowth));
  const event: Facts = { ...r.facts, 'life.event_soon': { key: 'life.event_soon', value: true, confidence: 'high', source: 'answered' } };
  add(out.event, overLimit(cutPicks(engine.recommend(event, content, options(r.set))), elig, needsGrowth));
  add(out.poor, overLimit(picks, elig, (x) => cutTraits(x, d, content).texture_fit === 'poor'));
  const texture = d['hair.texture']?.value;
  if (texture === 'straight' || texture === 'wavy') add(out.curly, overLimit(picks, elig, (x) => x.traits.tags.includes('curly_first') || x.traits.tags.includes('perm_dependent')));
  add(out.density, overLimit(picks, elig, (x) => densityMiss(x, d)));
  const stated = d['life.trim_weeks_ok']?.value;
  const minutes = d['life.styling_minutes']?.value;
  if (stated !== undefined || minutes !== undefined) add(out.upkeep, overLimit(picks, elig, (x) => upkeepMiss(x, stated, minutes)));
}

function colourPractical(r: Run, out: Record<'direction' | 'refresh' | 'colourist', Tally>): void {
  const d = deriveFacts(r.facts);
  const picks = colourPicks(r.result);
  if (picks.length === 0) return;
  const elig = content.looks.filter(shown(r.set.collections)).filter((l) => exclusionsFor('colour', lookTraits(l, d, content.shadeLevels), content.rules.colour, d).length === 0);
  const traitsOf = (l: EngineLook) => lookTraits(l, d, content.shadeLevels);
  const asked = d['pref.colour_direction']?.value;
  // A grey look held back when grey was not asked is not an option the slot could have held (the direction rules disfavour it).
  const greyHeldBack = (t: ReturnType<typeof traitsOf>): boolean => asked !== 'grey' && d['colour.grey_percent']?.value !== undefined && d['colour.grey_percent'].value > 0 ? false : asked !== 'grey' && (t.family === 'grey_silver' || t.technique.includes('grey_coverage') || t.technique.includes('grey_blending'));
  const meets = asked === undefined ? (): boolean => true : (l: EngineLook): boolean => (satisfies[asked]?.(traitsOf(l)) ?? true) && !greyHeldBack(traitsOf(l));
  if (asked !== undefined) add(out.direction, overLimit(picks, elig, (l) => !meets(l)));
  const looksById = new Map(elig.map((l) => [l.id, l]));
  const suitableRefresh = (l: EngineLook): boolean => { const t = traitsOf(l); return t.lift_levels === 0 && !t.vivid && t.family !== 'grey_silver' && !t.technique.includes('grey_coverage') && !t.technique.includes('grey_blending'); };
  if (asked === 'refresh' && elig.some(suitableRefresh)) {
    const first = looksById.get(picks[0]?.id ?? '');
    out.refresh.picks++;
    if (first && (traitsOf(first).lift_levels ?? 0) < 0) out.refresh.n++;
  }
  const labelOf = (l: EngineLook) => labelLook(traitsOf(l), content.journey, d).label;
  add(out.colourist, overLimit(picks, elig, (l) => labelOf(l) === 'needs_professional' && meets(l), (l) => meets(l) && labelOf(l) !== 'needs_professional'));
}

/** Bars 9a-9h over all picks of the kind, with today's engine read the same way. */
function practicalBars(runs: readonly Run[], s: CoreSet): Record<string, unknown> {
  const rows = runs.filter((r) => r.set === s);
  const cut = { growth: tally(), event: tally(), poor: tally(), curly: tally(), density: tally(), upkeep: tally() };
  const colour = { direction: tally(), refresh: tally(), colourist: tally() };
  for (const r of rows) {
    if (s.kinds.includes('cut')) cutPractical(r, cut);
    if (s.kinds.includes('colour')) colourPractical(r, colour);
  }
  return {
    ...(s.kinds.includes('cut') ? { p_growth_pct: rate(cut.growth), p_event_pct: rate(cut.event), p_poor_pct: rate(cut.poor), p_curly_on_straight_pct: rate(cut.curly), p_density_pct: rate(cut.density), p_upkeep_pct: rate(cut.upkeep) } : {}),
    ...(s.kinds.includes('colour') ? { p_colour_direction_pct: rate(colour.direction), p_refresh_darker: colour.refresh.n, p_refresh_cases: colour.refresh.picks, p_colourist_pct: rate(colour.colourist) } : {}),
  };
}

/** Bars 7b and 7c: how often the top Improve question could move a pick, and what ordering the questions costs in Node. */
function impactBars(s: CoreSet, answers: readonly Answers[]): Record<string, unknown> {
  const goal = s.kinds.length === 2 ? 'both' : s.kinds[0] === 'cut' ? 'cut' : 'colour';
  let moved = 0; let n = 0; let ms = 0;
  for (const a of answers.slice(0, 15)) {
    const facts = toFacts(a, file.questions, null, bands);
    const asked = improveQuestions(file, goal, s.collections, facts).map((x) => x.question);
    const picks = (f: Facts): readonly string[] => engine.recommend(f, content, options(s)).picks.map((p) => p.id);
    const started = performance.now();
    const impact = runImpact(questionImpact(asked, facts, a, file.questions, picks));
    ms += performance.now() - started;
    n++;
    if ((impact[0]?.most ?? 0) >= 1) moved++;
  }
  return { impact_top_moves_pct: pct(moved, n), impact_ms_per_profile: Math.round(ms / Math.max(n, 1)) };
}

/** Bars 4a-4c: W and J each moved by their own band margin, both ways. */
function noiseBars(runs: readonly Run[], s: CoreSet, answers: readonly Answers[]): Record<string, unknown> {
  if (!s.kinds.includes('cut')) return {};
  let kept = 0; let total = 0; let sameFirst = 0; let wild = 0; let runsN = 0;
  for (const face of FACE_NAMES) {
    const base = runs.filter((r) => r.set === s && r.face === face);
    const [w, j, a, c] = FACES[face];
    for (const [i, ans] of answers.entries()) {
      const b = cutPicks(base[i]?.result ?? ({ picks: [] } as unknown as Recommendation)).map((p) => p.id);
      for (const [dw, dj] of [[0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02]] as const) {
        const m = cutPicks(runOne(s, i, face, ans, faceFacts([w + dw, j + dj, a, c])).result).map((p) => p.id);
        const hit = b.filter((id) => m.includes(id)).length;
        kept += hit; total += b.length; runsN++;
        if (b[0] === m[0]) sameFirst++;
        if (hit * 2 < b.length) wild++;
      }
    }
  }
  return { noise_kept: r3(kept / total), noise_same_first_pct: pct(sameFirst, runsN), noise_wild_pct: pct(wild, runsN) };
}

function run(): Record<string, unknown> {
  const rnd = random(set.seed);
  const out: Record<string, unknown> = {};
  for (const s of CORE) {
    const answers = Array.from({ length: set.perSet }, (_, n) => answersFor(file, s.name, rnd, n, false));
    const runs: Run[] = answers.flatMap((a, n) => [
      runOne(s, n, 'none', a, null),
      ...FACE_NAMES.map((f) => runOne(s, n, f, a, faceFacts(FACES[f]))),
    ]);
    const wishAnswers = s.kinds.includes('cut') ? Array.from({ length: set.wishes }, (_, n) => answersFor(file, s.name, rnd, n, true)) : [];
    const wishRuns = wishAnswers.flatMap((a, n) => ([['long', FACES.long], ['round', FACES.round]] as const).map(([f, v]) => runOne(s, n, f, a, faceFacts(v))));
    const wished = wishRuns.flatMap((r) => r.result.picks.filter((p) => p.kind === 'cut'));
    const wishHit = wished.filter((p) => p.contributions.some((c) => c.points > 0 && (c.group === 'A' || c.ruleId === 'd17' || c.ruleId === 'b13'))).length;
    out[s.name] = {
      ...faceBars(runs, s, answers), ...firstPickBars(runs, s), ...diversityBars(runs, s), ...slateBars(runs, s), ...practicalBars(runs, s), ...beardBars(runs, s), ...(args.quick ? {} : { ...noiseBars(runs, s, answers), ...impactBars(s, answers) }),
      ...(wished.length > 0 ? { wish_favoured_pct: pct(wishHit, wished.length) } : {}),
    };
  }
  return out;
}

const started = performance.now();
const report = { set: args.set, engine: args.engine ?? 'current', off, ...(args.v2 ? { v2: v2({ content, recommend: engine.recommend, file, bands, seed: set.seed, said: saidChecker(CONTENT_DIR) }) } : { bars: run() }), ms: Math.round(performance.now() - started) };
console.log(JSON.stringify(report, null, 1));
