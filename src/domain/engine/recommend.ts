/**
 * `recommend()` composes the pure engine stages: derive facts, eligibility
 * (exclusions on answered facts), one score, labels, select and explain. Safety (excludes, referral, labels) is computed afresh
 * for every idea it returns, through the one assessment.
 */
import type { FactKey, Facts } from '../facts/registry.ts';
import { FACT_KEYS } from '../facts/registry.ts';
import { deriveFacts } from '../facts/derive.ts';
import { usable } from './match.ts';
import type { TargetKind } from '../content/traits.ts';
import type { Bands, JourneyRecord, Policy, RankRule, Referral, Reminder, RuleFor } from '../content/types.ts';
import type { Suitability } from '../content/suitability.ts';
import type { ConsultData } from '../content/output.ts';
import type { Collection, JourneyLabel } from '../content/values.ts';
import { cutTraits, feasibility, lengthSteps, lookTraits, poorFitNotes, shorterSteps, type EngineCut, type EngineLook, type Feasibility, type ShadeLevels } from './derive-traits.ts';
import { exclusionsFor, notesFor, resultNotes, scoreItem, suppressedOn, type Contribution, type Exclusion, type ItemNote } from './score.ts';
import { labelLook, referralFor, remindersFor, type JourneyResult } from './journey.ts';
import { rank, select, splitCount, type Relaxation } from './select.ts';
import { explain, REASON_WORDS, type Reason, type ReasonWords } from './explain.ts';
import { rankBeards, type EngineBeard } from './beards.ts';
import { baseFit, cutFactors, frameFactor, frameFit, frameWords, hairShape, harmony, lookFit, rulesFactor, tradeOffsOf, type CutFactors, type FrameFit, type TradeOff } from './suitability.ts';

/** The parts of the ranking that a test-only switch can remove, to measure each one's contribution; never a setting. */
export type EngineComponent = 'factors' | 'frame' | 'colour' | 'mmr' | 'beards';

/** Everything the engine reads: the library's cuts and looks, shade levels, rules, journey set, phrases and policy. */
export interface EngineContent {
  readonly cuts: readonly EngineCut[];
  readonly looks: readonly EngineLook[];
  readonly shadeLevels: ShadeLevels;
  readonly rules: { readonly cut: readonly RuleFor<'cut'>[]; readonly colour: readonly RuleFor<'colour'>[]; readonly beard?: readonly RuleFor<'beard'>[] };
  readonly journey: readonly JourneyRecord[];
  readonly reminders: readonly (Reminder | Referral)[];
  readonly phrases: Readonly<Record<string, string>>;
  readonly policy: Policy;
  readonly lengthBands: Bands['current_length_cm'];
  readonly beards?: readonly EngineBeard[];
  /** Test-only: components left out, for the ablation runs. */
  readonly off?: readonly EngineComponent[];
  /** The answers' own words by `<fact>:<value>`, so a reason quotes what the person chose. */
  readonly answerWords?: Readonly<Record<string, string>>;
  /** The words that join the reasons; English when left out. */
  readonly words?: ReasonWords;
}

/** The engine's content from `consult.json` and the library, with the words that join its reasons. */
export const engineContent = (consult: ConsultData, library: Pick<EngineContent, 'cuts' | 'looks' | 'shadeLevels' | 'beards'>, words: ReasonWords = REASON_WORDS): EngineContent => ({
  ...library, words, rules: { cut: consult.rules.cut, colour: consult.rules.colour, beard: consult.rules.beard }, journey: consult.journey, reminders: consult.reminders,
  phrases: consult.phrases, policy: consult.policy, lengthBands: consult.bands.current_length_cm,
  answerWords: Object.fromEntries(consult.questions.questions.flatMap((q) => q.options.flatMap((o) => {
    const sets: Readonly<Record<string, unknown>> = 'sets' in o ? o.sets : 'value' in o && q.fact !== undefined && o.value !== null ? { [q.fact]: o.value } : {};
    return Object.entries(sets).map(([fact, value]) => [`${fact}:${String(value)}`, o.label]);
  }))),
});

export type IdeaKind = 'cut' | 'colour';

/** One assessed idea, with everything the screens and prompts need to show it safely. */
export interface Idea {
  readonly id: string;
  readonly kind: IdeaKind;
  /** Non-empty: left out of the picks; an idea the person added stays, with these reasons shown. */
  readonly excluded: readonly Exclusion[];
  readonly score: number;
  readonly strongFired: number;
  readonly contributions: readonly Contribution[];
  readonly reasons: readonly Reason[];
  readonly notes: readonly ItemNote[];
  /** Facts that would let more rank rules or the feasibility line decide, in registry order. */
  readonly dependsOn: readonly FactKey[];
  /** Cuts only. */
  readonly feasibility: Feasibility | null;
  /** Cuts only: the record's notes when its texture fit is `poor`, shown instead of "works today"; `null` otherwise. */
  readonly poorFit: readonly string[] | null;
  /** Cuts only: length classes from the current length, the last tie-break before the id; `null` when that is unknown. */
  readonly lengthSteps: number | null;
  /** Colour looks only: the journey as the rules give it. */
  readonly journey: JourneyResult | null;
  /** Colour looks only: the label shown, "needs_professional" for every look after the referral. */
  readonly label: JourneyLabel | null;
  readonly reminders: readonly string[];
  /** Colour looks after a referral: the referral replaces the suggestion and its prompt. */
  readonly referral: Referral | null;
  readonly silhouette: string | null;
  readonly lowUpkeep: boolean;
  /** Suitability; a single value. Never shown. */
  readonly fitAt: readonly number[];
  /** Tie-break from a confirmed undertone. */
  readonly harmony: number;
  /** What the item is, for how alike two items are. */
  readonly facets: Readonly<Record<string, string>>;
  /** Cuts only: what the factors said, for the decisive "Because" lines. */
  readonly factors: CutFactors | null;
  /** Cuts only: the face factor per aim and what the cut does in words, when a face reading is known. */
  readonly framing: (FrameFit & { readonly words: string }) | null;
  /** Cuts in the picks: the beards to show, best first; empty means the library's own pairing order. */
  readonly beards: readonly string[];
  /** Cuts only: every stated limit the cut misses that the person may accept; the card names each one. */
  readonly tradeOffs: readonly TradeOff[];
  /** Cuts only: whether the texture fit is good; `null` while the texture is unknown. */
  readonly goodFit: boolean | null;
}

/** A salon look lent to a barbering colour list that fell short (one colour all over, so hair length does not matter). */
export interface Compromise {
  readonly idea: Idea;
  readonly why: 'salon_look';
}

export interface RecommendOptions {
  readonly kinds: readonly IdeaKind[];
  /** The collections shown; empty means all. */
  readonly collections: readonly Collection[];
  readonly count: number;
  readonly removed?: readonly string[];
  readonly added?: readonly string[];
  readonly pair?: { readonly cut: string; readonly colour: string } | null;
}

export interface Recommendation {
  /** The engine's picks: cuts first, then colour looks, each in selection order. */
  readonly picks: readonly Idea[];
  /** The person's own additions, each assessed in full; an excluded one keeps its reasons. */
  readonly added: readonly Idea[];
  readonly pair: { readonly cut: Idea; readonly colour: Idea } | null;
  /** The looks listed for the person's own AI: at most `pool_size` eligible ideas, lent looks inside the bound. */
  readonly pool: readonly Idea[];
  /** Fewer eligible items than requested, said plainly, with the sentences of the exclusions that left that kind's ideas out (after a referral, colour has its reason alone). */
  readonly shortfall: readonly { readonly kind: IdeaKind; readonly requested: number; readonly available: number; readonly because: readonly string[] }[];
  readonly relaxed: readonly { readonly kind: IdeaKind; readonly relaxed: readonly Relaxation[] }[];
  /** Notes for the whole result (note rules without `on`). */
  readonly notes: readonly ItemNote[];
  /** Salon looks lent to a barbering colour list that fell short; eligible, never after the referral. */
  readonly worthAsking: readonly Compromise[];
  /** What was asked that no eligible idea does: the colour direction's rule id when no look here can take the hair that way. */
  readonly unmet: readonly { readonly kind: IdeaKind; readonly what: readonly string[] }[];
  readonly referral: Referral | null;
  /** False after the referral: no colour prompt is built. */
  readonly colourPrompts: boolean;
}

const inOrder = (keys: Iterable<FactKey>): FactKey[] => {
  const set = new Set(keys);
  return FACT_KEYS.filter((k) => set.has(k));
};
const rankRules = <T extends TargetKind>(rules: readonly RuleFor<T>[]): Map<string, RankRule<T>> =>
  new Map(rules.flatMap((r) => (r.effect === 'rank' ? [[r.id, r] as const] : [])));

/** The parts every kind shares: exclusions, suppression, the one score, notes and the reasons of the rules that scored. */
function rulesStage<T extends TargetKind>(kind: T, traits: Readonly<Record<string, unknown>>, rules: readonly RuleFor<T>[], facts: Facts, content: EngineContent) {
  const suppressed = suppressedOn(kind, traits, rules, facts);
  const scored = scoreItem(kind, traits, rules, facts, content.policy, suppressed);
  return {
    excluded: exclusionsFor(kind, traits, rules, facts),
    ...scored,
    notes: notesFor(kind, traits, rules, facts, suppressed),
    reasons: explain(kind, scored.contributions, rankRules(rules), traits, content.phrases, content.policy, content.words),
  };
}

const isOn = (content: EngineContent, component: EngineComponent): boolean => !content.off?.includes(component);

/** A cut's place in the order: the rule score, the practical factors and the face's bounded say, multiplied. */
function cutRanking(cut: EngineCut, traits: ReturnType<typeof cutTraits>, feasible: Feasibility, facts: Facts, points: number, content: EngineContent): Pick<Idea, 'factors' | 'fitAt' | 'framing'> {
  const s = content.policy.suitability;
  if (!s) return { factors: null, fitAt: [], framing: null };
  const factors = isOn(content, 'factors') ? cutFactors(cut, traits, feasible, shorterSteps(cut, facts), facts, points, s) : { rules: rulesFactor(points, s.rules) };
  const frame = isOn(content, 'frame') ? frameFit(hairShape(cut.traits, facts, s.frame), facts, s.frame, undefined, cut.traits) : null;
  return {
    factors, fitAt: [baseFit(factors) * (frame ? frameFactor(frame.at[0] ?? 1, s.frame, s.rules, content.policy.weights.moderate) : 1)],
    framing: frame ? { ...frame, words: frameWords(cut.traits, s.because.does, content.words?.both) } : null,
  };
}

function assessCut(cut: EngineCut, facts: Facts, content: EngineContent): Idea {
  const feasible = feasibility(cut, facts, content.lengthBands, content.policy);
  const traits = cutTraits(cut, facts, content);
  const r = rulesStage('cut', traits, content.rules.cut, facts, content);
  const low = content.policy.low_upkeep;
  const ranking = cutRanking(cut, traits, feasible, facts, r.score, content);
  return {
    id: cut.id, kind: 'cut', ...r, dependsOn: inOrder([...r.dependsOn, ...feasible.dependsOn]), feasibility: feasible,
    poorFit: poorFitNotes(cut, facts), lengthSteps: lengthSteps(cut, facts),
    journey: null, label: null, reminders: [], referral: null, silhouette: cut.traits.silhouette, harmony: 0,
    facets: Object.fromEntries((['silhouette', 'length_class', 'fringe', 'height_top', 'sides_width', 'perimeter'] as const).map((k) => [k, cut.traits[k]])),
    ...ranking, beards: [], tradeOffs: ranking.factors ? tradeOffsOf(cut, feasible, ranking.factors, facts) : [],
    goodFit: traits.texture_fit === undefined ? null : traits.texture_fit === 'good',
    lowUpkeep: cut.traits.styling_minutes[1] <= low.max_styling_minutes && cut.traits.trim_weeks[0] >= low.min_trim_weeks,
  };
}

function assessLook(look: EngineLook, facts: Facts, content: EngineContent, referral: Referral | null): Idea {
  const traits = lookTraits(look, facts, content.shadeLevels);
  const r = rulesStage('colour', traits, content.rules.colour, facts, content);
  const journey = labelLook(traits, content.journey, facts);
  const label = referral ? 'needs_professional' : journey.label;
  const s = content.policy.suitability;
  const ranked = s && isOn(content, 'colour');
  return {
    id: look.id, kind: 'colour', ...r, feasibility: null, poorFit: null, lengthSteps: null, journey, label,
    reminders: remindersFor(content.reminders, traits).map((m) => m.text), referral, silhouette: null,
    lowUpkeep: look.traits.upkeep_weeks[0] >= content.policy.low_upkeep.min_trim_weeks,
    facets: { family: look.traits.family, base_technique: look.traits.base_technique, warmth: look.traits.warmth, level_band: String(Math.ceil(look.traits.target_level / 3)) },
    factors: null, framing: null, beards: [], tradeOffs: [], goodFit: null,
    fitAt: ranked ? [lookFit(r.score, label, journey.lift, s.colour)] : [], harmony: ranked ? harmony(look.lab, facts, s.colour.harmony) : 0,
  };
}

/** Assesses one cut or colour look by id on already derived facts, or `null` for an id the library lacks. */
function assess(id: string, facts: Facts, content: EngineContent, referral: Referral | null): Idea | null {
  const cut = content.cuts.find((c) => c.id === id);
  if (cut) return assessCut(cut, facts, content);
  const look = content.looks.find((l) => l.id === id);
  return look ? assessLook(look, facts, content, referral) : null;
}

/** Any idea (added from Explore, restored, or in the pair) with its safety computed again from the facts. */
export function assessIdea(id: string, facts: Facts, content: EngineContent): Idea | null {
  const derived = deriveFacts(facts);
  return assess(id, derived, content, referralFor(content.reminders, derived));
}

/** Every idea of one kind in the chosen collections, assessed. */
function assessAll(kind: IdeaKind, facts: Facts, content: EngineContent, collections: readonly Collection[], referral: Referral | null): Idea[] {
  const shown = (c: readonly Collection[]) => collections.length === 0 || c.some((x) => collections.includes(x));
  return kind === 'cut'
    ? content.cuts.filter((c) => shown(c.collections)).map((c) => assessCut(c, facts, content))
    : content.looks.filter((l) => shown(l.collections)).map((l) => assessLook(l, facts, content, referral));
}

const median = (xs: readonly number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 1;
const fill = (text: string, values: Readonly<Record<string, number | string>>): string => text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k]));
const reasonOf = (ruleId: string, text: string): Reason => ({ ruleId, group: 'C', strength: 'strong', text });

/** A factor that really set this cut apart gets its own true line, ahead of the rules' reasons, within `max_reasons`. */
function withDecisiveReasons(open: readonly Idea[], facts: Facts, content: EngineContent): Idea[] {
  const s = content.policy.suitability;
  if (!s || !isOn(content, 'factors')) return [...open];
  const cuts = open.filter((i) => i.factors !== null);
  const typical = new Map((['trim', 'styling', 'density'] as const).map((f) => [f, median(cuts.flatMap((i) => i.factors?.[f] ?? []))]));
  const beats = (i: Idea, f: 'trim' | 'styling' | 'density'): boolean => i.factors?.[f] === 1 && (typical.get(f) ?? 1) * s.because.decisive_ratio <= 1;
  const byId = new Map(content.cuts.map((c) => [c.id, c]));
  const words = content.words ?? REASON_WORDS;
  // The answer as chosen, in its own words; the stored number where a copy has no words for it.
  const said = (key: 'life.trim_weeks_ok' | 'life.styling_minutes'): string => {
    const value = String(facts[key]?.value ?? 0);
    return content.answerWords?.[`${key}:${value}`] ?? value;
  };
  return open.map((i) => {
    const cut = byId.get(i.id);
    if (!cut) return i;
    const lines = [
      ...(beats(i, 'trim') ? [reasonOf('fit-trim', fill(s.because.trim, { said: said('life.trim_weeks_ok'), longest: words.weeks(cut.traits.trim_weeks[1]) }))] : []),
      ...(beats(i, 'styling') ? [reasonOf('fit-styling', fill(s.because.styling, { said: said('life.styling_minutes'), fastest: words.minutes(cut.traits.styling_minutes[0]) }))] : []),
      ...(beats(i, 'density') ? [reasonOf('fit-density', s.because.density)] : []),
    ];
    return lines.length === 0 ? i : { ...i, reasons: [...lines, ...i.reasons].slice(0, content.policy.max_reasons) };
  });
}

const capitalised = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/** The picks as shown: a framing line where the face set the cut apart, and the beards to show with each cut. */
function finished(picks: readonly Idea[], ranked: readonly Idea[], facts: Facts, content: EngineContent, collections: readonly Collection[]): Idea[] {
  const s = content.policy.suitability;
  if (!s) return [...picks];
  const byId = new Map(content.cuts.map((c) => [c.id, c]));
  return picks.map((p) => {
    const cut = byId.get(p.id);
    const beards = cut && isOn(content, 'beards') ? rankBeards(cut, facts, content.beards ?? [], content.rules.beard ?? [], collections, s) : [];
    const framing = p.framing;
    if (!framing) return { ...p, beards };
    const at = (i: Idea): number => i.framing?.at[0] ?? 0;
    const middle = median(ranked.filter((i) => i.framing).map(at));
    const aim = framing.aims[0];
    if (aim === undefined || at(p) < s.because.decisive_ratio * middle) return { ...p, beards };
    const line = reasonOf('fit-frame', `${capitalised(framing.words)}. ${s.because.aim[aim]}`);
    return { ...p, beards, reasons: [line, ...p.reasons].slice(0, content.policy.max_reasons) };
  });
}

/** A decisive line every pick would carry says nothing about any one of them: it stays on the first pick only. */
function withoutRepeats(picks: readonly Idea[]): Idea[] {
  const all = (id: string): boolean => picks.length > 1 && picks.every((p) => p.reasons.some((r) => r.ruleId === id));
  return picks.map((p, i) => (i === 0 ? p : { ...p, reasons: p.reasons.filter((r) => !r.ruleId.startsWith('fit-') || !all(r.ruleId)) }));
}

/** The slate constants; without MMR relevance alone orders the picks. */
function slateOf(content: EngineContent): Suitability['slate'] | null {
  const slate = content.policy.suitability?.slate ?? null;
  return slate && !isOn(content, 'mmr') ? { ...slate, lambda: 1 } : slate;
}

/**
 * Salon looks lent to a barbering colour list that fell short: one colour all over (no sections or highlights, so hair length does
 * not matter), each eligible for this person, none after the referral, and only up to the places left.
 */
function lent(picked: readonly Idea[], requested: number, removed: ReadonlySet<string>, facts: Facts, content: EngineContent, collections: readonly Collection[], referral: Referral | null): readonly Compromise[] {
  const room = requested - picked.length;
  if (room <= 0 || referral || collections.length === 0 || collections.includes('salon')) return [];
  const taken = new Set([...picked.map((i) => i.id), ...removed]);
  const looks = content.looks.filter((l) => l.collections.includes('salon') && l.placements.length === 0 && !l.collections.some((c) => collections.includes(c)) && !taken.has(l.id));
  return rank(looks.map((l) => assessLook(l, facts, content, referral)).filter((i) => i.excluded.length === 0)).slice(0, room).map((idea) => ({ idea, why: 'salon_look' }));
}

/**
 * The colour direction asked that no eligible look does: lighter when none lifts any region, darker when none takes any down.
 * The direction is never removed; the screen says it once instead.
 */
function directionUnmet(colours: readonly Idea[], facts: Facts, content: EngineContent): Recommendation['unmet'] {
  const way = usable(facts, 'pref.colour_direction');
  if (way !== 'lighter' && way !== 'darker') return [];
  const looks = new Map(content.looks.map((l) => [l.id, l]));
  // An unknown lift or darkening is possible: the line is only for a direction no look can take.
  const does = colours.some((i) => {
    const look = looks.get(i.id);
    const t = look ? lookTraits(look, facts, content.shadeLevels) : null;
    const v = way === 'lighter' ? t?.lift_levels : t?.darkens_by;
    return t !== null && (v === undefined || v >= 1);
  });
  return does ? [] : [{ kind: 'colour', what: [`direction-${way}`] }];
}

/** The top `size` of the cuts and colours selected at that size: cuts take the first half, a kind that runs short leaves its places to the other. */
function topLooks(cuts: readonly Idea[], colours: readonly Idea[], size: number): Idea[] {
  const cutPlaces = Math.max(splitCount(size, ['cut', 'colour']).cut, size - colours.length);
  return [...cuts.slice(0, cutPlaces), ...colours.slice(0, size - Math.min(cuts.length, cutPlaces))];
}

/** The cut and colour paired on the screen, assessed again; `null` when none is paired or either has left the library. */
function pairOf(pair: RecommendOptions['pair'], one: (id: string) => Idea | null): Recommendation['pair'] {
  const cut = pair ? one(pair.cut) : null;
  const colour = pair ? one(pair.colour) : null;
  return cut && colour ? { cut, colour } : null;
}

/** The engine: picks for the count (Both: cuts take the first half), additions, the pair, the pool and the referral. */
export function recommend(facts: Facts, content: EngineContent, options: RecommendOptions): Recommendation {
  const derived = deriveFacts(facts);
  const { policy } = content;
  const referral = referralFor(content.reminders, derived);
  const removed = new Set(options.removed ?? []);
  const count = Math.min(policy.count.max, Math.max(policy.count.min, options.count));
  const split = splitCount(count, options.kinds);
  const kinds = (['cut', 'colour'] as const).filter((k) => options.kinds.includes(k));
  const assessed = new Map(kinds.map((k) => [k, assessAll(k, derived, content, options.collections, referral)]));
  // The one gate of every automatic output (picks, pool, lent looks): eligible ideas only, and after a referral no colour idea
  // at all, so the referral is said once instead of on six looks. The person's own additions and pair stay, visibly blocked.
  const offered = (k: IdeaKind): Idea[] => (k === 'colour' && referral ? [] : (assessed.get(k) ?? []).filter((i) => i.excluded.length === 0));
  const ranked = new Map(kinds.map((k) => [k, rank(withDecisiveReasons(offered(k), derived, content))]));
  const slate = slateOf(content);
  const chosen = kinds.map((k) => ({ kind: k, sel: select(ranked.get(k) ?? [], split[k], policy, removed, slate) }));
  const one = (id: string) => assess(id, derived, content, referral);
  const colours = chosen.find((c) => c.kind === 'colour')?.sel.picks ?? [];
  const selected = (k: IdeaKind): readonly Idea[] => select(ranked.get(k) ?? [], policy.pool_size, policy, removed, slate).picks;
  const asking = kinds.includes('colour') ? lent(colours, split.colour, removed, derived, content, options.collections, referral) : [];
  // The referral's reason, or the sentences of the exclusions that left this kind's ideas out, once each and in the rules' own order.
  const because = (k: IdeaKind): string[] => {
    if (k === 'colour' && referral) return [referral.text];
    const fired = new Set((assessed.get(k) ?? []).flatMap((i) => i.excluded.map((x) => x.ruleId)));
    return [...new Set((k === 'cut' ? content.rules.cut : content.rules.colour).flatMap((r) => (r.effect === 'exclude' && fired.has(r.id) ? [r.because] : [])))];
  };
  return {
    picks: chosen.flatMap((c) => withoutRepeats(finished(c.sel.picks, ranked.get(c.kind) ?? [], derived, content, options.collections))),
    added: (options.added ?? []).flatMap((id) => one(id) ?? []),
    pair: pairOf(options.pair, one),
    pool: [...topLooks(selected('cut'), selected('colour'), policy.pool_size), ...asking.map((c) => c.idea)].slice(0, policy.pool_size),
    shortfall: chosen.filter((c) => c.sel.shortfall > 0).map((c) => ({ kind: c.kind, requested: split[c.kind], available: split[c.kind] - c.sel.shortfall, because: because(c.kind) })),
    relaxed: chosen.filter((c) => c.sel.relaxed.length > 0).map((c) => ({ kind: c.kind, relaxed: c.sel.relaxed })),
    notes: [...(kinds.includes('cut') ? resultNotes(content.rules.cut, derived) : []), ...(kinds.includes('colour') ? resultNotes(content.rules.colour, derived) : [])],
    worthAsking: asking,
    unmet: kinds.includes('colour') && !referral ? directionUnmet(ranked.get('colour') ?? [], derived, content) : [],
    referral,
    colourPrompts: referral === null,
  };
}
