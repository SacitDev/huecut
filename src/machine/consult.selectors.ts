/**
 * Derived data for the screens: selectors memoised on input identity, so nothing derived is stored
 * and every safety check runs again on every change. `createConsultSelectors(deps)` takes the engine, the prompt builder
 * and the stylist sheet model, so the machine's tests run on fakes and the screens get what `app/consult-deps.ts` shapes;
 * measure, fuse and toFacts are called directly.
 */
import { toFacts } from '../domain/facts/answers-to-facts.ts';
import type { Facts } from '../domain/facts/registry.ts';
import { fuse, type FaceFacts } from '../domain/fuse/fuse.ts';
import { idsOfLook, lookId, lookOf, slotKey, type ItemId, type Look, type PhotoId, type SlotKey } from '../domain/ids.ts';
import { measure, type PhotoMeasurements } from '../domain/measure/measure.ts';
import { BOARD_MAX_IDEAS, BOARD_MAX_TILES } from '../domain/render-model/board.ts';
import { SHOWN } from '../domain/render-model/copy.ts';
import { cardFacts, type CardFact } from '../domain/render-model/face-card.ts';
import { applyShortlist, colourChoiceOf, isUsable, kindOf, pairedLooks, pairIn, picksForCount, resultGoalOf, slotPhotoOf } from './consult.logic.ts';
import type { ColourChoice, ConsultContent, ConsultContext, ConsultGoal, Pair, PhotoEntry, Slot } from './consult.types.ts';

/** Pure rules the screens also need (features may import only this file and `consult.types.ts`). */
export { canAddToShortlist, colourChoiceOf, exampleMayOpen, isListedOnly, isUsable, reachedIdeas, resultGoalOf, slotPhotoOf } from './consult.logic.ts';
export { extraBlock } from './regions/models.ts';

// ── The injected parts and what the selectors need of them ──

/** One engine pick, in engine order. */
export interface EnginePick {
  readonly id: ItemId;
  readonly kind: 'cut' | 'colour';
}
/** What the selectors ask of the engine: `removed` goes into its select stage, so the count holds. */
export interface EngineRequest {
  readonly goal: ConsultGoal;
  readonly collections: ConsultContext['prefs']['collections'];
  readonly count: number;
  readonly removed: readonly ItemId[];
  /** The person's own additions, which the engine judges again like any idea (exclusions, labels). */
  readonly added: readonly ItemId[];
  /** "Colour in your results", null under the Colour goal. */
  readonly colours: ColourChoice | null;
}
export interface EngineResult {
  readonly picks: readonly EnginePick[];
  /** The colours the cuts can be paired with, best first; empty after the referral or when none fits. */
  readonly colours?: readonly EnginePick[];
  /** The engine's own result, where it says whether a referral replaced every colour suggestion. */
  readonly engine?: { readonly referral: unknown };
}

/** The list as shown: at most 8 ideas, the person's order first. */
export interface IdeaList {
  readonly ids: readonly ItemId[];
  readonly cuts: readonly ItemId[];
  readonly colours: readonly ItemId[];
  /** The person's own additions in the list; they stay when the count changes. */
  readonly own: readonly ItemId[];
}

export interface PromptInput<R> {
  readonly facts: Facts;
  readonly recommendation: R;
  /** The list, each cut with the colour chosen for it. */
  readonly looks: readonly Look[];
  /** Looks per picture on All together. */
  readonly perPicture: number | undefined;
  /** Only while both of its ideas are in the list; `try_on_both` is built for exactly this pair. */
  readonly pair: Pair | null;
  readonly content: ConsultContent;
  /** A usable photo exists (otherwise "2 Share photo" becomes "Open ChatGPT or Gemini"). */
  readonly hasPhoto: boolean;
}
export interface SheetInput<R> {
  /** The idea, or the cut of a "Try together" pair. */
  readonly id: ItemId;
  /** The pair's colour look, for the pair's one sheet. */
  readonly colour?: ItemId;
  readonly facts: Facts;
  readonly recommendation: R | null;
  readonly content: ConsultContent;
  /** The person's AI picture for this idea on the current main photo. */
  readonly picture: Slot | null;
}

export interface SelectorDeps<R extends EngineResult, P, S> {
  /** `domain/engine` `recommend()`. */
  readonly recommend: (facts: Facts, content: ConsultContent, request: EngineRequest) => R;
  /** `domain/prompts`: builds no colour prompt after the referral. */
  readonly buildPrompts: (input: PromptInput<R>) => P;
  /** `domain/render-model/stylist-sheet.ts`. */
  readonly stylistSheet: (input: SheetInput<R>) => S;
}

/** A board tile: one per idea in list order, the pair's first when its picture exists; at most 9. */
export interface BoardTile {
  readonly key: SlotKey;
  readonly ideas: readonly ItemId[];
  readonly picture: Slot | null;
}

type Of<T> = (c: ConsultContext) => T;
type Slots = Readonly<Partial<Record<SlotKey, Slot>>>;

export interface ConsultSelectors<R extends EngineResult, P, S> {
  readonly measurementsOf: (c: ConsultContext, photoId: PhotoId) => PhotoMeasurements | null;
  readonly faceFacts: Of<FaceFacts | null>;
  /** What the face card says about the main photo: the one source for the screen, the saved card and the explain prompt. */
  readonly cardFacts: Of<readonly CardFact[]>;
  readonly facts: Of<Facts>;
  readonly recommendation: Of<R | null>;
  /** The engine's picks for other facts, under the same request: how "Improve my ideas" tries an answer. */
  readonly picksFor: (c: ConsultContext, facts: Facts) => readonly string[];
  readonly ideas: Of<IdeaList>;
  /** The list as results: each cut with the colour chosen for it. */
  readonly looks: Of<readonly Look[]>;
  /** A colour was asked for and none fits: the screen says so and offers Keep. */
  readonly noColourFits: Of<boolean>;
  /** The machine's injected `hasIdeas` guard. */
  readonly hasIdeas: Of<boolean>;
  readonly pairIdea: Of<Pair | null>;
  readonly promptPack: Of<P | null>;
  /** One idea's sheet, or with `[cut, colour]` the "Try together" pair's one sheet. */
  readonly stylistSheet: (c: ConsultContext, idea: Look) => S;
  readonly slotsForMainPhoto: Of<Slots>;
  readonly boardLayout: Of<readonly BoardTile[]>;
}

/** Remembers the last result while every argument is the same object (or primitive). */
export function memoLast<A extends readonly unknown[], T>(fn: (...args: A) => T): (...args: A) => T {
  let last: { readonly args: A; readonly value: T } | null = null;
  return (...args: A): T => {
    if (last?.args.length === args.length && last.args.every((a, i) => Object.is(a, args[i]))) return last.value;
    const value = fn(...args);
    last = { args, value };
    return value;
  };
}

const NO_CARD_FACTS: readonly CardFact[] = [];

/** `measure(observation, edits, refined ?? automatic)` per photo, fused, and the main photo's card facts. */
function measuring(): Pick<ConsultSelectors<EngineResult, unknown, unknown>, 'measurementsOf' | 'faceFacts' | 'cardFacts'> {
  // Entries are immutable: a moved line or a refined outline makes a new entry, so the entry alone is the key.
  const measured = new WeakMap<PhotoEntry, PhotoMeasurements>();
  const of = (photo: PhotoEntry): PhotoMeasurements | null => {
    if (!photo.observation) return null;
    const hit = measured.get(photo);
    if (hit) return hit;
    const value = measure(photo.observation, photo.edits, photo.refined?.measures ?? photo.observation.hair, photo.sharpness);
    measured.set(photo, value);
    return value;
  };
  const fused = memoLast((photos: readonly PhotoEntry[], skipped: boolean) => {
    const usable = skipped ? [] : photos.filter(isUsable).flatMap((p) => of(p) ?? []);
    return usable.length === 0 ? null : fuse(usable);
  });
  // In the language the screens show: the selectors are made again when it changes.
  const stated = memoLast((m: PhotoMeasurements, bands: ConsultContent['consult']['bands']) => cardFacts(m, bands, SHOWN));
  return {
    measurementsOf: (c, photoId) => {
      const photo = c.photos.find((p) => p.id === photoId);
      return photo ? of(photo) : null;
    },
    faceFacts: (c) => fused(c.photos, c.skipped),
    cardFacts: (c) => {
      const main = c.photos.find((p) => p.id === c.mainPhotoId);
      const m = main && !c.skipped && isUsable(main) ? of(main) : null;
      return m ? stated(m, c.content.consult.bands) : NO_CARD_FACTS;
    },
  };
}

const EMPTY_LIST: IdeaList = { ids: [], cuts: [], colours: [], own: [] };

/** Facts, the engine's recommendation and the list built from it (the shortlist applied, at most 8). */
function recommending<R extends EngineResult>(
  recommend: SelectorDeps<R, unknown, unknown>['recommend'],
  faceFacts: Of<FaceFacts | null>,
) {
  const factsOf = memoLast((answers: ConsultContext['answers'], content: ConsultContent, face: FaceFacts | null) =>
    toFacts(answers, content.consult.questions.questions, face, content.consult.bands),
  );
  const facts: Of<Facts> = (c) => factsOf(c.answers, c.content, faceFacts(c));
  type Pref = ConsultContext['prefs'];
  // The preferences one by one: a change of tab or of looks per picture must not run the engine again.
  const recommendationOf = memoLast(
    (f: Facts, content: ConsultContent, goal: Pref['goal'], collections: Pref['collections'], count: number, colour: Pref['colour'], s: ConsultContext['shortlist']) => {
      const shown = resultGoalOf({ goal, ...(colour && { colour }) });
      if (shown === null || collections.length === 0) return null;
      return recommend(f, content, { goal: shown, collections, count, removed: s.removed, added: s.added, colours: colourChoiceOf({ goal, ...(colour && { colour }) }) });
    },
  );
  const recommendation: Of<R | null> = (c) => recommendationOf(facts(c), c.content, c.prefs.goal, c.prefs.collections, c.prefs.count, c.prefs.colour, c.shortlist);
  const picksFor = (c: ConsultContext, f: Facts): readonly string[] => {
    const shown = resultGoalOf(c.prefs);
    return shown === null || c.prefs.collections.length === 0 ? [] : recommend(f, c.content, { goal: shown, collections: c.prefs.collections, count: c.prefs.count, removed: c.shortlist.removed, added: c.shortlist.added, colours: colourChoiceOf(c.prefs) }).picks.map((p) => p.id);
  };
  const ideasOf = memoLast(
    (rec: R | null, goal: Pref['goal'], count: number, colour: Pref['colour'], s: ConsultContext['shortlist'], content: ConsultContent): IdeaList => {
      const prefs = { goal, ...(colour && { colour }) };
      const shown = resultGoalOf(prefs);
      // Keep and One colour show no colour idea of their own, the person's additions included.
      const noColours = (colourChoiceOf(prefs)?.mode ?? 'pick') !== 'pick';
      const ids = applyShortlist(rec && shown ? picksForCount(rec.picks, shown, count) : [], s).filter((id) => !noColours || kindOf(content, id) !== 'colour');
      if (ids.length === 0) return EMPTY_LIST;
      const of = (kind: 'cut' | 'colour'): ItemId[] => ids.filter((id) => kindOf(content, id) === kind);
      return { ids, cuts: of('cut'), colours: of('colour'), own: ids.filter((id) => s.added.includes(id)) };
    },
  );
  const ideas: Of<IdeaList> = (c) => ideasOf(recommendation(c), c.prefs.goal, c.prefs.count, c.prefs.colour, c.shortlist, c.content);
  // A pair the person made stays, blocked, after a referral takes its colour off the list.
  const pairOf = memoLast((content: ConsultContent, pair: Pair | null, list: IdeaList, referred: boolean) => pairIn(content, pair, referred && pair ? [...list.ids, pair.colour] : list.ids));
  const looksOf = memoLast((rec: R | null, list: IdeaList): readonly Look[] => {
    const eligible = (rec?.colours ?? []).map((p) => p.id);
    // Colours on the list first, in the person's order, then the engine's next ones.
    return pairedLooks(list.ids, list.cuts, [...list.colours.filter((id) => eligible.includes(id)), ...eligible.filter((id) => !list.colours.includes(id))]);
  });
  const looks: Of<readonly Look[]> = (c) => looksOf(recommendation(c), ideas(c));
  const noColourFits: Of<boolean> = (c) => {
    const rec = recommendation(c);
    return (colourChoiceOf(c.prefs)?.mode ?? 'keep') !== 'keep' && rec !== null && (rec.colours ?? []).length === 0 && ideas(c).cuts.length > 0;
  };
  return { facts, recommendation, picksFor, ideas, looks, noColourFits, pairIdea: (c: ConsultContext) => pairOf(c.content, c.pair, ideas(c), Boolean(recommendation(c)?.engine?.referral)) };
}

type Recommending<R extends EngineResult> = ReturnType<typeof recommending<R>>;

/** What the main photo's slots, the board, the prompts and the stylist sheets show. */
function presenting<R extends EngineResult, P, S>(deps: SelectorDeps<R, P, S>, r: Recommending<R>) {
  const slotsOf = memoLast((slots: ConsultContext['slots'], photo: PhotoId): Slots =>
    Object.fromEntries(Object.entries(slots).filter(([k]) => k.endsWith(`@${photo}`))),
  );
  const slotsForMainPhoto: Of<Slots> = (c) => slotsOf(c.slots, slotPhotoOf(c));
  const boardOf = memoLast((looks: readonly Look[], pair: Pair | null, slots: Slots, photo: PhotoId, removed: readonly ItemId[]): BoardTile[] => {
    const tile = (key: SlotKey, of: readonly ItemId[]): BoardTile => ({ key, ideas: of, picture: slots[key] ?? null });
    const pairKey = pair ? slotKey([pair.cut, pair.colour], photo) : null;
    const pairTile = pair && pairKey && slots[pairKey] ? [tile(pairKey, [pair.cut, pair.colour])] : [];
    const listed = [...pairTile, ...looks.map((l) => tile(slotKey(l, photo), idsOfLook(l))).filter((t) => t.key !== pairTile[0]?.key)];
    // A picture made under another "Colour in your results" choice stays, under the names it was made for.
    const older = (Object.keys(slots) as SlotKey[])
      .filter((k) => !listed.some((t) => t.key === k))
      .map((k) => tile(k, idsOfLook(lookOf(k.slice(0, k.lastIndexOf('@'))))))
      .filter((t) => !t.ideas.some((id) => removed.includes(id)));
    const all = [...listed, ...older];
    let spare = all.length - (pairTile.length > 0 ? BOARD_MAX_TILES : BOARD_MAX_IDEAS);
    // Over the limit, a tile without a picture gives way first, from the end.
    return all.reverse().filter((t) => t.picture !== null || spare-- <= 0).reverse().slice(0, BOARD_MAX_TILES);
  });
  const promptsOf = memoLast(
    (f: Facts, rec: R | null, looks: readonly Look[], perPicture: number | undefined, pair: Pair | null, content: ConsultContent, hasPhoto: boolean) =>
      rec === null ? null : deps.buildPrompts({ facts: f, recommendation: rec, looks, perPicture, pair, content, hasPhoto }),
  );
  type Sheet = (f: Facts, rec: R | null, content: ConsultContent, picture: Slot | null) => S;
  const sheets = new Map<string, Sheet>();
  const sheetOf = (idea: Look): Sheet => {
    const key = lookId(idea);
    const known = sheets.get(key);
    if (known) return known;
    const ids = typeof idea === 'string' ? { id: idea } : { id: idea[0], colour: idea[1] };
    const made = memoLast<Parameters<Sheet>, S>((f, rec, content, picture) =>
      deps.stylistSheet({ ...ids, facts: f, recommendation: rec, content, picture }),
    );
    sheets.set(key, made);
    return made;
  };
  return {
    slotsForMainPhoto,
    boardLayout: (c: ConsultContext) => boardOf(r.looks(c), r.pairIdea(c), slotsForMainPhoto(c), slotPhotoOf(c), c.shortlist.removed),
    promptPack: (c: ConsultContext) =>
      promptsOf(r.facts(c), r.recommendation(c), r.looks(c), c.prefs.perPicture, r.pairIdea(c), c.content, c.photos.some(isUsable)),
    stylistSheet: (c: ConsultContext, idea: Look) =>
      sheetOf(idea)(r.facts(c), r.recommendation(c), c.content, c.slots[slotKey(idea, slotPhotoOf(c))] ?? null),
  };
}

/** One set of selectors per machine; compose.ts also gives `hasIdeas` to the machine as its guard. */
export function createConsultSelectors<R extends EngineResult, P, S>(
  deps: SelectorDeps<R, P, S>,
): ConsultSelectors<R, P, S> {
  const m = measuring();
  const r = recommending(deps.recommend, m.faceFacts);
  return { ...m, ...r, ...presenting(deps, r), hasIdeas: (c) => r.ideas(c).ids.length > 0 };
}
