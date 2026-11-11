/**
 * Colour journeys: the label of a look, reminders, the referral, and point 3 of the plausible check (a core-answers profile that
 * reaches "Plausible").
 */
import { FACTS, FACT_KEYS, isFactKey, type FactKey, type Facts } from '../facts/registry.ts';
import { toFacts, type AnswerValue, type Answers } from '../facts/answers-to-facts.ts';
import { deriveFacts } from '../facts/derive.ts';
import type { LookNeeds } from '../content/output.ts';
import type { ItemTraits } from '../content/traits.ts';
import type { AnyTests, ColourLook, JourneyRecord, Question, Referral, Reminder } from '../content/types.ts';
import type { JourneyLabel } from '../content/values.ts';
import { evalMatch, evalWhen, traitReads, usable } from './match.ts';
import { lookTraits, type EngineLook, type ShadeLevels } from './derive-traits.ts';

type Traits = Readonly<Record<string, unknown>>;

/** How cautious a label is: the most cautious applying record wins. */
export const LABEL_RANK: Readonly<Record<JourneyLabel, number>> = { plausible: 0, uncertain: 1, needs_professional: 2 };
/** Optional for privacy: never in `dependsOn`, named in every "what to ask" instead. */
export const PRIVACY_OPTIONAL: ReadonlySet<FactKey> = new Set<FactKey>(['safety.health_context']);
/** What "Plausible" promises about a look for this person, so neither may be unknown behind it. */
const PROMISED = ['lift_levels', 'reaches_shade'] as const;
/** The most a "Plausible" look may lift. */
const SMALL_LIFT = 2;

export interface JourneyResult {
  readonly label: JourneyLabel;
  /** Every record whose `when` and `on` hold on known values, in record order. */
  readonly applied: readonly JourneyRecord[];
  /** Facts a more cautious record could not be evaluated without ("Answer *question* to know"), in registry order. */
  readonly dependsOn: readonly FactKey[];
  /** The look's lift for this person, or `null` while the current level is unknown. */
  readonly lift: number | null;
  /** Whether "what to ask" ends with the health line: unless the person answered that none of it applies. */
  readonly askHealth: boolean;
}

const inRegistryOrder = (keys: ReadonlySet<FactKey>): FactKey[] => (keys.size === 0 ? [] : FACT_KEYS.filter((k) => keys.has(k)));

/**
 * One record on one look: `applies`, or the facts it is waiting for when it is more cautious than plausible: an unknown answer in its
 * `when`, or the facts behind a trait of its `on` that is still unknown (an unknown lift is never read as no lift).
 */
function evalRecord(r: JourneyRecord, traits: Traits, facts: Facts): { applies: boolean; waits: readonly FactKey[] } {
  const w = evalWhen(r.when, facts);
  const o = evalMatch('colour', (r.on ?? {}), traits);
  if (w.result === 'pass' && o.result === 'pass') return { applies: true, waits: [] };
  if (LABEL_RANK[r.label] === LABEL_RANK.plausible || w.result === 'fail' || o.result === 'fail') return { applies: false, waits: [] };
  const waits = [...(w.result === 'unknown' ? w.missing : []), ...o.unknown.flatMap((t) => traitReads('colour', t)).filter((k) => usable(facts, k) === undefined)];
  return { applies: false, waits: waits.filter((k) => !PRIVACY_OPTIONAL.has(k)) };
}

/**
 * The label of a look: the most cautious applying record, `uncertain` when none applies, and never
 * "plausible" on a guess: a more cautious record left unknown puts its facts in `dependsOn` and makes it uncertain.
 */
export function labelLook(traits: Traits, records: readonly JourneyRecord[], facts: Facts): JourneyResult {
  let best: JourneyLabel | null = null;
  const applied: JourneyRecord[] = [];
  const waits = new Set<FactKey>();
  for (const r of records) {
    const e = evalRecord(r, traits, facts);
    if (e.applies) {
      applied.push(r);
      if (best === null || LABEL_RANK[r.label] > LABEL_RANK[best]) best = r.label;
    }
    e.waits.forEach((k) => waits.add(k));
  }
  const lift = traits.lift_levels;
  if (best === 'plausible') promised(traits, facts).forEach((k) => waits.add(k));
  const label = best === 'plausible' && (waits.size > 0 || broken(traits)) ? 'uncertain' : (best ?? 'uncertain');
  return { label, applied, dependsOn: inRegistryOrder(waits), lift: typeof lift === 'number' ? lift : null, askHealth: usable(facts, 'safety.health_context') !== false };
}

/**
 * "Plausible" promises a known small lift on hair the shade can reach: while either is unknown it waits for the facts they read;
 * a shade the hair cannot reach, or one that needs more than a small lift, is never plausible.
 */
const promised = (traits: Traits, facts: Facts): FactKey[] =>
  PROMISED.flatMap((t) => (traits[t] === undefined ? traitReads('colour', t).filter((k) => usable(facts, k) === undefined) : []));
const broken = (traits: Traits): boolean => traits.reaches_shade === false || (typeof traits.lift_levels === 'number' && traits.lift_levels > SMALL_LIFT);

/** The referral that applies, if any: a past reaction replaces every colour suggestion and prompt. */
export function referralFor(reminders: readonly (Reminder | Referral)[], facts: Facts): Referral | null {
  return reminders.find((r): r is Referral => r.kind === 'referral' && evalWhen(r.when, facts).result === 'pass') ?? null;
}

/** The reminders shown on a look: on every look, or where `on` matches. Reminders never take part in labels. */
export function remindersFor(reminders: readonly (Reminder | Referral)[], traits: Traits): Reminder[] {
  return reminders.filter((r): r is Reminder => r.kind === 'reminder'
    && (r.applies_to === 'every_colour_look' || (r.on !== undefined && evalMatch('colour', r.on as AnyTests, traits).result === 'pass')));
}

// ── Point 3 of the plausible check: a core-answers witness per colour core set ──

/** What the search reads: one core set's questions, the questions it may open, the looks and the journey set. */
export interface PlausibleSetInput {
  readonly core: readonly Question[];
  readonly improve: readonly Question[];
  readonly looks: readonly EngineLook[];
  readonly journey: readonly JourneyRecord[];
  readonly shadeLevels: ShadeLevels;
}
export interface PlausibleSearch {
  /** A core-answers profile and a look it labels "Plausible", or `null`. */
  readonly witness: { readonly lookId: string; readonly facts: Facts } | null;
  readonly profiles: number;
  /** `false` when the profile budget ran out before the search ended. */
  readonly complete: boolean;
  /** Breaks of the journey invariants on the profiles visited, each once. */
  readonly violations: readonly string[];
}

const isNotSure = (o: Question['options'][number]): boolean => 'value' in o && !('fact' in o) && o.value === null;
const followUp = (o: Question['options'][number] | undefined): string | undefined => (o && 'follow_up' in o ? o.follow_up : undefined);
function writes(q: Question): FactKey[] {
  return [...(q.fact ? [q.fact] : []), ...q.options.flatMap((o) => ('sets' in o ? (Object.keys(o.sets) as FactKey[]) : 'fact' in o ? [o.fact] : []))];
}
const derivedFrom = (k: FactKey): readonly FactKey[] => ((FACTS[k] as { readonly derivedFrom?: readonly string[] }).derivedFrom ?? []).filter(isFactKey);

/** The answers a profile may give: every option but "Not sure"; on a multi question, one or two options. */
function choices(q: Question): number[][] {
  const real = q.options.flatMap((o, i) => (isNotSure(o) ? [] : [i]));
  if (q.type !== 'multi') return real.map((i) => [i]);
  const spec = q.fact ? FACTS[q.fact] : undefined;
  const exclusive = spec?.type === 'set' && 'exclusive' in spec ? (spec.exclusive as readonly unknown[]) : [];
  const alone = (i: number) => { const o = q.options[i]; return o !== undefined && ('none_of_these' in o || ('value' in o && exclusive.includes(o.value))); };
  return [...real.map((i) => [i]), ...real.flatMap((i, n) => real.slice(n + 1).filter((j) => !alone(i) && !alone(j)).map((j) => [i, j]))];
}


interface Step { readonly q: Question; readonly under?: string }
interface Search {
  readonly input: PlausibleSetInput;
  readonly all: readonly Question[];
  readonly byId: ReadonlyMap<string, Question>;
  /** Facts some journey record reads, directly, through a per-person trait or through a derivation. */
  readonly relevant: ReadonlySet<FactKey>;
  readonly budget: number;
  profiles: number;
  exhausted: boolean;
  witness: PlausibleSearch['witness'];
  readonly violations: Set<string>;
}

const opens = (s: Search, q: Question): Question[] => q.options.flatMap((o) => s.byId.get(followUp(o) ?? '') ?? []);
const recordNeeds = (r: JourneyRecord): string[] => [...Object.keys(r.when), ...Object.keys(r.on ?? {}).flatMap((t) => traitReads('colour', t))];

function newSearch(input: PlausibleSetInput, budget: number): Search {
  const all = [...input.core, ...input.improve];
  // The lift is always relevant: a "Plausible" witness needs a known lift of at most 2.
  const relevant = new Set<FactKey>([...input.journey.flatMap(recordNeeds).filter(isFactKey), ...traitReads('colour', 'lift_levels')]);
  for (let size = -1; size !== relevant.size;) {
    size = relevant.size;
    for (const k of [...relevant]) derivedFrom(k).forEach((d) => relevant.add(d));
  }
  return { input, all, byId: new Map(all.map((q) => [q.id, q])), relevant, budget, profiles: 0, exhausted: false, witness: null, violations: new Set() };
}

/** Facts later questions of this branch may still write, and the facts derived from them. */
function pendingOf(s: Search, queue: readonly Step[]): Set<FactKey> {
  const p = new Set(queue.flatMap(({ q }) => [q, ...opens(s, q)].flatMap(writes)));
  for (const k of FACT_KEYS) if (derivedFrom(k).some((d) => p.has(d))) p.add(k);
  return p;
}

/** Every look already has a more cautious record that applies, or waits on a fact no later question writes. */
function blocked(s: Search, facts: Facts, pending: ReadonlySet<FactKey>): boolean {
  return s.input.looks.every((look) => {
    const traits = lookTraits(look, facts, s.input.shadeLevels);
    return s.input.journey.some((r) => {
      if (r.label === 'plausible' || recordNeeds(r).some((k) => isFactKey(k) && pending.has(k))) return false;
      const e = evalRecord(r, traits, facts);
      return e.applies || e.waits.length > 0;
    });
  });
}

/** The journey invariants on one labelled look: "Plausible" means a lift of at most 2, an empty `dependsOn` and a known history. */
export function journeyBreaks(lookId: string, res: JourneyResult, facts: Facts): string[] {
  if (res.label !== 'plausible') return [];
  const out: string[] = [];
  if (res.lift === null || res.lift > SMALL_LIFT || res.dependsOn.length > 0) out.push(`${lookId} is plausible with lift ${String(res.lift)} and dependsOn [${res.dependsOn.join(', ')}]`);
  if (!facts['hair.chemical_history']) out.push(`${lookId} is plausible with the chemical history unknown`);
  return out;
}

/**
 * One finished profile: every "Plausible" is checked against the journey invariants; the first one that keeps them is the witness.
 * Returns whether there is a witness now.
 */
function leaf(s: Search, facts: Facts): boolean {
  s.profiles += 1;
  for (const look of s.input.looks) {
    const res = labelLook(lookTraits(look, facts, s.input.shadeLevels), s.input.journey, facts);
    if (res.label !== 'plausible') continue;
    const breaks = journeyBreaks(look.id, res, facts);
    breaks.forEach((b) => s.violations.add(b));
    if (breaks.length === 0) s.witness ??= { lookId: look.id, facts };
  }
  return s.witness !== null;
}

/** Depth first over the questions in order; a chosen option's follow-up is asked next. Returns true to stop. */
function dfs(s: Search, queue: readonly Step[], answers: Answers): boolean {
  if (s.profiles >= s.budget) s.exhausted = true;
  if (s.witness !== null || s.exhausted) return true;
  const facts = deriveFacts(toFacts(answers, s.all, null, null));
  const [step, ...rest] = queue;
  if (!step) return leaf(s, facts);
  const relevant = [step.q, ...opens(s, step.q)].some((x) => writes(x).some((k) => s.relevant.has(k)));
  if (!relevant || evalWhen(step.q.show_if ?? {}, facts).result === 'fail') return dfs(s, rest, answers);
  if (blocked(s, facts, pendingOf(s, queue))) return false;
  return choices(step.q).some((chosen) => {
    const next = chosen.flatMap((i) => s.byId.get(followUp(step.q.options[i]) ?? '') ?? []).map((q) => ({ q, under: step.q.id }));
    const answer: AnswerValue = step.under === undefined ? { chosen } : { chosen, under: step.under };
    return dfs(s, [...next, ...rest], { ...answers, [step.q.id]: answer });
  });
}

/**
 * Searches the profiles of core answers alone (options in content order; "Not sure" is left out, because an unknown
 * never helps a look to "Plausible") for one that labels a library look "Plausible". A branch is cut once every look
 * has a more cautious record settled by the answers so far. Stops at the first witness or after `budget` profiles.
 */
export function searchPlausible(input: PlausibleSetInput, budget = 50_000): PlausibleSearch {
  const s = newSearch(input, budget);
  const followUps = new Set(input.core.flatMap((q) => opens(s, q).map((f) => f.id)));
  dfs(s, input.core.filter((q) => !followUps.has(q.id)).map((q) => ({ q })), {});
  return { witness: s.witness, profiles: s.profiles, complete: !s.exhausted, violations: [...s.violations] };
}

/** What the content check's point 3 hands over (`PlausibleInput` in `scripts/content/load.ts`), as the engine reads it. */
export interface PlausibleCheckInput {
  readonly core: readonly Question[];
  readonly improve: readonly Question[];
  readonly looks: readonly { readonly look: Pick<ColourLook, 'id' | 'collections' | 'placements'>; readonly traits: ItemTraits<'colour'>; readonly needs: LookNeeds }[];
  readonly journey: readonly JourneyRecord[];
}
/** The witness (a library look and the core answers that leave it "Plausible") and every problem found. */
export interface PlausibleProof {
  readonly witness: { readonly look: string; readonly answers: Readonly<Partial<Record<FactKey, unknown>>> } | null;
  readonly problems: readonly string[];
}

/**
 * Point 3 of the plausible check: a core-answers witness for one set, no journey invariant
 * broken on the profiles searched, and none broken by a golden case's facts on any library look.
 */
export function plausibleProof(input: PlausibleCheckInput, shadeLevels: ShadeLevels, golden: readonly { readonly id: string; readonly facts: Facts }[] = []): PlausibleProof {
  const looks: EngineLook[] = input.looks.map(({ look, traits, needs }) => ({ id: look.id, kind: 'colour', collections: look.collections, traits, needs, placements: look.placements }));
  const s = searchPlausible({ core: input.core, improve: input.improve, looks, journey: input.journey, shadeLevels });
  const cases = golden.flatMap(({ id, facts }) => {
    const d = deriveFacts(facts);
    return looks.flatMap((l) => journeyBreaks(l.id, labelLook(lookTraits(l, d, shadeLevels), input.journey, d), d)).map((b) => `golden case ${id}: ${b}`);
  });
  const answered = (f: Facts) => Object.fromEntries(Object.values(f).filter((x) => x.source === 'answered').map((x) => [x.key, x.value]));
  return {
    witness: s.witness ? { look: s.witness.lookId, answers: answered(s.witness.facts) } : null,
    problems: [
      ...(s.witness || s.complete ? [] : [`the search stopped after ${String(s.profiles)} profiles without a witness`]),
      ...s.violations.map((v) => `invariant broken on a core-answers profile: ${v}`),
      ...cases,
    ],
  };
}
