/**
 * Pure helpers of the Ideas screen: the sections, each idea's assessment, Move earlier / Move later, the questions that settle an
 * idea, "Improve my ideas", the picture on the matching model, beard pairings and what limited a short list. No React here, so each
 * rule is tested on its own.
 */
import type { BeardIndexEntry, CutIndexEntry, IndexEntry, LibraryIndex, LookIndexEntry } from '../../../domain/content/output.ts';
import type { LibraryModel, Question, QuestionsFile, RuleFor } from '../../../domain/content/types.ts';
import type { Collection } from '../../../domain/content/values.ts';
import type { Feasibility } from '../../../domain/engine/derive-traits.ts';
import type { TradeOff } from '../../../domain/engine/suitability.ts';
import { SHOWN, tradeOffWords } from '../../../domain/render-model/copy.ts';
import type { Idea, IdeaKind, Recommendation } from '../../../domain/engine/recommend.ts';
import { notesFor, suppressedOn } from '../../../domain/engine/score.ts';
import { deriveFacts } from '../../../domain/facts/derive.ts';
import type { FactKey, Facts } from '../../../domain/facts/registry.ts';
import type { ItemId, PhotoId } from '../../../domain/ids.ts';
import { isUsable, type IdeaList } from '../../../machine/consult.selectors.ts';
import type { ConsultContent, ConsultContext, ConsultGoal } from '../../../machine/consult.types.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { applies, coreSetOf, orderOf, type AskedQuestion } from '../questions.ts';

const entries = new WeakMap<LibraryIndex, ReadonlyMap<string, IndexEntry>>();
/** The library index entry of a cut or colour look on the list; null for any other id. */
export function entryOf(library: LibraryIndex, id: string): CutIndexEntry | LookIndexEntry | null {
  let map = entries.get(library);
  if (!map) entries.set(library, (map = new Map(library.entries.map((e) => [e.id, e]))));
  const entry = map.get(id);
  return entry?.kind === 'cut' || entry?.kind === 'colour' ? entry : null;
}

/** The looks "One colour for all" offers: the 14 solid all-over colours, jet black among them, by their id ending. */
export const allOverLooks = (library: LibraryIndex): readonly LookIndexEntry[] =>
  library.entries.filter((e): e is LookIndexEntry => e.kind === 'colour' && e.id.endsWith('-all-over'));

/** The engine's assessment of an idea on the list; the person's own additions are assessed in full. */
export const ideaOf = (engine: Recommendation, id: string): Idea | null =>
  engine.added.find((i) => i.id === id) ?? engine.picks.find((i) => i.id === id) ?? null;

export interface Section {
  readonly kind: IdeaKind;
  readonly ids: readonly ItemId[];
}
const wants = (goal: ConsultGoal, kind: IdeaKind): boolean => goal === 'both' || goal === kind;
/** "Cuts" then "Colours": the kinds the goal asks for, and any other kind the person added from Explore. */
export const sectionsOf = (goal: ConsultGoal, list: IdeaList): Section[] =>
  (['cut', 'colour'] as const)
    .map((kind) => ({ kind, ids: kind === 'cut' ? list.cuts : list.colours }))
    .filter((s) => wants(goal, s.kind) || s.ids.length > 0);

/**
 * The list index that Move earlier (-1) or Move later (+1) sends `id` to: its neighbour's place within its section, so
 * `SHORTLIST.MOVE` lands it just past that neighbour; null at either end of the section.
 */
export function moveTo(ids: readonly ItemId[], section: readonly ItemId[], id: ItemId, step: -1 | 1): number | null {
  const at = section.indexOf(id);
  const neighbour = at < 0 ? undefined : section[at + step];
  return neighbour === undefined ? null : ids.indexOf(neighbour);
}

const followUpsOf = (q: Question): string[] => q.options.flatMap((o) => ('follow_up' in o && o.follow_up ? [o.follow_up] : []));
const writesFact = (q: Question, fact: FactKey): boolean =>
  q.fact === fact || q.options.some((o) => ('sets' in o && fact in o.sets) || ('fact' in o && o.fact === fact));

/** A question as asked: its options with "Not sure" last and the follow-up each option opens (as on the core questions). */
export function askedOf(file: QuestionsFile, question: Question): AskedQuestion {
  const byId = new Map(file.questions.map((q) => [q.id, q]));
  const followUps = new Map(
    question.options.flatMap((o, i) => {
      const next = 'follow_up' in o && o.follow_up ? byId.get(o.follow_up) : undefined;
      return next ? [[i, next] as const] : [];
    }),
  );
  return { question, order: orderOf(question), followUps };
}

/** The questions that write `facts` (a question's fact, an option's `sets` or a wish), each once, in the facts' order. */
export function questionsFor(file: QuestionsFile, facts: readonly FactKey[]): Question[] {
  const found = facts.flatMap((f) => file.questions.find((q) => writesFact(q, f)) ?? []);
  return found.filter((q, i) => found.indexOf(q) === i);
}

const fits = (q: Question, goal: ConsultGoal, collections: readonly Collection[]): boolean =>
  (goal === 'both' || q.goals.includes(goal)) && q.collections.some((c) => collections.includes(c));

/**
 * "Improve my ideas": every question that fits the goal and the collections shown, is neither in
 * the core set nor a follow-up of one (those are asked with their parent), and applies now; a follow-up of an optional
 * question is asked under its parent, not on its own.
 */
export function improveQuestions(file: QuestionsFile, goal: ConsultGoal, collections: readonly Collection[], facts: Facts): AskedQuestion[] {
  const core = new Set(file.core_sets[coreSetOf(goal, collections)]);
  const coreFollowUps = new Set(file.questions.filter((q) => core.has(q.id)).flatMap(followUpsOf));
  const optional = file.questions.filter((q) => !core.has(q.id) && !coreFollowUps.has(q.id) && fits(q, goal, collections));
  const nested = new Set(optional.flatMap(followUpsOf));
  return optional.filter((q) => !nested.has(q.id) && applies(q, facts)).map((q) => askedOf(file, q));
}

/** For each idea on the list, the first open fact an improve question can write: those questions move the list most, so they come before "Show all". */
export function improveFirst(asked: readonly AskedQuestion[], ideas: readonly (readonly FactKey[])[]): ReadonlySet<string> {
  const writers = (fact: FactKey): AskedQuestion[] => asked.filter((a) => writesFact(a.question, fact));
  return new Set(ideas.flatMap((facts) => facts.map(writers).find((w) => w.length > 0) ?? []).map((a) => a.question.id));
}

/** The questions with the ones that could change the list first, most first; the rest keep the content order. */
export function orderByImpact(asked: readonly AskedQuestion[], couldChange: ReadonlyMap<string, number>): readonly AskedQuestion[] {
  if (couldChange.size === 0) return asked;
  const at = (a: AskedQuestion): number => [...couldChange.keys()].indexOf(a.question.id);
  const moving = asked.filter((a) => couldChange.has(a.question.id)).sort((a, b) => at(a) - at(b));
  return [...moving, ...asked.filter((a) => !couldChange.has(a.question.id))];
}

/** The reminders every colour idea on the list shares, in the first one's order: said once above the Colours, not on each card. */
export function sharedReminders(engine: Recommendation, ids: readonly ItemId[]): readonly string[] {
  const [first, ...others] = ids.map((id) => ideaOf(engine, id)?.reminders ?? []);
  return first === undefined || others.length === 0 ? [] : first.filter((r) => others.every((o) => o.includes(r)));
}

/** Library models by texture group; "a mix" prefers neither. */
const GROUP_OF: Readonly<Partial<Record<string, LibraryModel['hair_group']>>> = {
  straight: 'straight_wavy',
  wavy: 'straight_wavy',
  curly: 'curly_coily',
  coily: 'curly_coily',
};

/**
 * The picture an idea shows: a cut's front view; a colour look on the model of the person's collection
 * and texture group, else its first picture. Null for an item without pictures.
 */
export function pictureKeyFor(
  entry: Pick<CutIndexEntry | LookIndexEntry, 'pictures'>,
  models: readonly LibraryModel[],
  collections: readonly Collection[],
  texture: string | undefined,
): string | null {
  const group = texture === undefined ? undefined : GROUP_OF[texture];
  const score = (key: string): number => {
    const model = models.find((m) => key.startsWith(`${m.id}/`));
    return (key.endsWith('-front') ? 4 : 0) + (model && collections.includes(model.collection) ? 2 : 0) + (model?.hair_group === group ? 1 : 0);
  };
  return Object.keys(entry.pictures).reduce<string | null>((best, key) => (best === null || score(key) > score(best) ? key : best), null);
}

export interface BeardPairing {
  readonly id: string;
  readonly name: string;
  /** The beard's design notes that the answers make apply. */
  readonly notes: readonly string[];
}

/** A cut's beards, the engine's ranking when it gave one, each with the design notes its rules give for these answers. */
export function beardPairings(cut: CutIndexEntry, library: LibraryIndex, rules: readonly RuleFor<'beard'>[], facts: Facts, ranked: readonly string[] = []): BeardPairing[] {
  const derived = deriveFacts(facts);
  return (ranked.length > 0 ? ranked : cut.pairs_with.beards).flatMap((id) => {
    const beard = library.entries.find((e): e is BeardIndexEntry => e.kind === 'beard' && e.id === id);
    if (!beard) return [];
    const traits = beard.traits as Readonly<Record<string, unknown>>;
    const notes = notesFor('beard', traits, rules, derived, suppressedOn('beard', traits, rules, derived));
    return [{ id, name: beard.name, notes: notes.filter((n) => n.kind === 'design').map((n) => n.because) }];
  });
}

export interface Shortfall {
  /** The ideas shown. */
  readonly found: number;
  /** The exclude rules' sentences that left library items of the short kinds out, each once. */
  readonly reasons: readonly string[];
  /** What was asked that no idea here does, in words: the colour direction no look can take the hair. */
  readonly unmet: readonly string[];
  readonly removed: number;
  /** Kinds the library simply has no more of for the collections shown (nothing else limited them). */
  readonly library: readonly IdeaKind[];
}

const ruleReason = (rules: readonly RuleFor<'colour'>[], id: string): string | undefined => rules.flatMap((r) => (r.id === id && r.effect === 'rank' ? [r.reason] : []))[0];

/**
 * Fewer ideas than asked: how many were found and what limited them, from the engine's own reasons (its exclusions, or the referral); null when the
 * count is met. `facts` stays in the signature the screen calls with.
 */
export function shortfallOf(engine: Recommendation, found: number, content: ConsultContent, _facts: Facts, ctx: Pick<ConsultContext, 'prefs' | 'shortlist'>): Shortfall | null {
  if (engine.shortfall.length === 0) return null;
  const reasons = [...new Set(engine.shortfall.flatMap((s) => s.because))];
  const removed = ctx.shortlist.removed.length;
  const unmet = engine.unmet.flatMap(({ what }) => what.flatMap((w) => ruleReason(content.consult.rules.colour, w) ?? []));
  return { found, reasons, unmet, removed, library: reasons.length === 0 && unmet.length === 0 && removed === 0 ? engine.shortfall.map((s) => s.kind) : [] };
}

/** The one line that says the colour direction asked is one no look here can do: at the end of the level scale, or left out for what was told; null otherwise. */
export function givesWayLine(engine: Recommendation, facts: Facts): string | null {
  const way = engine.unmet.flatMap((u) => u.what).find((w) => w === 'direction-darker' || w === 'direction-lighter');
  if (way === undefined) return null;
  const level = deriveFacts(facts)['colour.current_level_lengths']?.value;
  const darker = way === 'direction-darker';
  return t.givesWay(darker ? 'darker' : 'lighter', level === (darker ? 1 : 10));
}

/** An author's closing pointer to another record ("; see curly-bob", "use bixie"): for the library, not for the card. */
const POINTER = /(?:^|[,;]\s*(?:so\s+)?)(?:see|use|choose)\s+[a-z0-9-]+(?:\s+(?:or\s+[a-z0-9-]+|instead))*\.?$/;

/** What a poor fit says instead of "today": the record's own notes, in words the person can read. */
function poorFitText(notes: readonly string[]): string {
  const text = notes.map((n) => n.replace(POINTER, '').trim()).filter(Boolean).join(' ');
  return text === '' ? t.feasibility.poorFit : `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

/** A cut's one feasibility line: after growth, else needs adapting, else today; null while the length is unknown. */
export function feasibilityText(f: Feasibility | null, poorFit: readonly string[] | null = null, tradeOffs: readonly TradeOff[] = []): string | null {
  // Every limit the cut misses that the person may accept, after the length line, which already names any growth.
  const traded = tradeOffWords(tradeOffs, SHOWN.prompts.tradeOffs, SHOWN.prompts.tradeOffs.youSaid, false);
  const line = lengthLine(f, poorFit);
  return line === null || traded === null ? (line ?? traded) : `${line}. ${traded}`;
}

function lengthLine(f: Feasibility | null, poorFit: readonly string[] | null): string | null {
  if (f === null) return null;
  switch (f.status) {
    case 'today':
      return poorFit === null ? t.feasibility.today : poorFitText(poorFit);
    case 'after_growth':
      return f.length?.status === 'after_growth' ? t.feasibility.growth(f.length.cm, f.length.weeks) : null;
    case 'needs_adapting':
      return t.feasibility.adapting(f.adapting.map((a) => a.note ?? t.feasibility.adaptingFor[a.what]).join(' '));
    case null:
      return null;
  }
}

/** The main photo once its hair outline is ready, so the colour preview can tint it; null otherwise. */
export function previewPhoto(c: Pick<ConsultContext, 'photos' | 'mainPhotoId' | 'skipped'>): PhotoId | null {
  const main = c.photos.find((p) => p.id === c.mainPhotoId);
  return main && !c.skipped && isUsable(main) && main.observation?.previewMask ? main.id : null;
}

/** The photo link on Ideas: none while a photo is usable or on its way; "Add another photo" after every one failed. */
export function photoLink(c: Pick<ConsultContext, 'photos' | 'skipped'>): 'addPhoto' | 'addAnother' | null {
  if (c.skipped || c.photos.length === 0) return 'addPhoto';
  return c.photos.some((p) => isUsable(p) || p.status === 'queued') ? null : 'addAnother';
}
