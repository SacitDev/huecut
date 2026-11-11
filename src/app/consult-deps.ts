/**
 * The engine, the prompt builder and the stylist sheet as the machine's selectors take them: the
 * engine content comes from the library index and `consult.json`, once per content; prompts and sheets are built when
 * the screen that shows them has the ideas' details records. Prompts read the English content and copy, whatever language
 * the screens show; the engine's reasons and the stylist sheet are in the language shown.
 */
import type { BeardIndexEntry, CutIndexEntry, LookIndexEntry, ShadeIndexEntry, TechniqueIndexEntry } from '../domain/content/output.ts';
import { assessIdea, engineContent, recommend, type EngineContent, type Idea, type IdeaKind, type Recommendation } from '../domain/engine/recommend.ts';
import { deriveFacts } from '../domain/facts/derive.ts';
import type { Facts } from '../domain/facts/registry.ts';
import { asItemId } from '../domain/ids.ts';
import { buildPromptPack, withColour, type IdeaLook } from '../domain/prompts/build.ts';
import { EN, SHOWN, SHOWN_REASONS, tradeOffWords } from '../domain/render-model/copy.ts';
import { buildStylistSheet, type ShadeRef, type SheetLook } from '../domain/render-model/stylist-sheet.ts';
import type { DetailsOf, ConsultPrompts, ConsultRecommendation, ConsultSheet } from '../features/consult/useConsult.ts';
import type { EngineRequest, PromptInput, SelectorDeps, SheetInput } from '../machine/consult.selectors.ts';
import { english, languageState, type Language } from '../strings/locale.ts';
import type { ConsultContent, ConsultGoal } from '../machine/consult.types.ts';

/** The kinds of idea each result goal asks the engine for. */
const KINDS: Readonly<Record<ConsultGoal, readonly IdeaKind[]>> = { cut: ['cut'], colour: ['colour'], both: ['cut', 'colour'] };

interface Library {
  /** The language its words were read in: the answers' own words and the sheet's shade and technique names. */
  readonly shown: Language;
  readonly engine: EngineContent;
  readonly shades: Readonly<Record<string, ShadeRef>>;
  readonly techniques: Readonly<Record<string, string>>;
}
const libraries = new WeakMap<ConsultContent, Library>();

/** The engine content and the sheet's shade and technique names, worked out once per content and language. */
export function libraryOf(content: ConsultContent): Library {
  const shown = languageState().shown;
  const known = libraries.get(content);
  if (known?.shown === shown) return known;
  const { entries } = content.library;
  const cuts = entries.filter((e): e is CutIndexEntry => e.kind === 'cut');
  const looks = entries.filter((e): e is LookIndexEntry => e.kind === 'colour');
  const shadeEntries = entries.filter((e): e is ShadeIndexEntry => e.kind === 'shade');
  const techniqueEntries = entries.filter((e): e is TechniqueIndexEntry => e.kind === 'technique');
  const beards = entries.filter((e): e is BeardIndexEntry => e.kind === 'beard');
  // A checked look names only checked shades (the content check), so the index has every level the engine reads.
  const shadeLevels = Object.fromEntries(shadeEntries.map((s) => [s.id, s.level]));
  const made: Library = {
    shown,
    engine: engineContent(content.consult, { cuts, looks, shadeLevels, beards }, SHOWN_REASONS),
    shades: Object.fromEntries(shadeEntries.map((s) => [s.id, { name: s.name, level: s.level, tone: s.tone }])),
    techniques: Object.fromEntries(techniqueEntries.map((t) => [t.id, t.name])),
  };
  libraries.set(content, made);
  return made;
}

/**
 * The colours a cut can be paired with for "Colour in your results": the chosen look, or the engine's best for this person,
 * none after the referral or when the chosen look is ruled out; each carries its own assessment, so its label is this person's.
 */
function coloursFor(facts: Facts, library: EngineContent, request: EngineRequest, own: Recommendation): readonly Idea[] {
  const choice = request.colours;
  if (choice === null || choice.mode === 'keep' || own.referral) return [];
  if (choice.mode === 'one') {
    const idea = choice.shade === null ? null : assessIdea(choice.shade, facts, library);
    return idea?.kind === 'colour' && idea.excluded.length === 0 ? [idea] : [];
  }
  // The person's own additions count too; an addition a rule rules out does not get chosen for them.
  const colours = [...own.picks, ...own.added].filter((idea) => idea.kind === 'colour' && idea.excluded.length === 0);
  return colours.length > 0 ? colours : recommend(facts, library, { kinds: ['colour'], collections: request.collections, count: request.count, removed: request.removed }).picks;
}

const engineOf = (idea: Idea) => ({ id: asItemId(idea.id), kind: idea.kind });

/** `recommend()` for the result goal's kinds; `removed` and `added` go in, so the count holds and additions are judged. */
function recommendFor(facts: Facts, content: ConsultContent, request: EngineRequest): ConsultRecommendation {
  const library = libraryOf(content).engine;
  const engine = recommend(facts, library, {
    kinds: KINDS[request.goal],
    collections: request.collections,
    count: request.count,
    removed: request.removed,
    added: request.added,
  });
  return { picks: engine.picks.map(engineOf), colours: coloursFor(facts, library, request, engine).map(engineOf), engine };
}

/**
 * The person's own colour where a look leaves the hair untreated: the natural level at untreated roots, the level worn on
 * untreated lengths. Without a root placement the upper lengths stay untreated too, so both levels apply. `null` ("my existing colour")
 * when one level is not true of every such region, or a level it needs is not known.
 */
function baseOf(facts: Facts, placements: readonly { readonly region: string }[]): number | null {
  const d = deriveFacts(facts);
  const at = new Set(placements.map((p) => p.region));
  const roots = !at.has('root');
  const levels = [...(roots ? [d['colour.natural_level']?.value] : []), ...(roots || !at.has('mids') || !at.has('ends') ? [d['colour.current_level_lengths']?.value] : [])];
  const [one] = levels;
  return one !== undefined && levels.every((l) => l === one) ? one : null;
}

/**
 * A cut or colour look's details as a prompt names it, with its upkeep line for the card; null for anything else or details not loaded.
 * A colour look that keeps the person's own base carries that base, so the prompt keeps it.
 */
const ideaLook =
  (details: DetailsOf, facts: Facts) =>
  (id: string): IdeaLook | null => {
    const d = english(details(id));
    if (d?.kind === 'cut') return { id: d.id, kind: d.kind, name: d.name, prompt_spec: d.prompt_spec, upkeep: EN.prompts.cutUpkeep(d.upkeep.styling_minutes, d.upkeep.trim_weeks) };
    if (d?.kind !== 'colour') return null;
    return { id: d.id, kind: d.kind, name: d.name, prompt_spec: d.prompt_spec, upkeep: EN.prompts.colourUpkeep(d.traits.upkeep_weeks), ...(d.base.on_words === undefined ? {} : { ownBase: { level: baseOf(facts, d.placements), words: d.base.on_words } }) };
  };

/** Every prompt for the list, with the engine's safety input (no colour prompt after the referral). */
const promptsFor =
  (input: PromptInput<ConsultRecommendation>): ConsultPrompts =>
  (details) => {
    const look = ideaLook(details, input.facts);
    const cut = input.pair ? look(input.pair.cut) : null;
    const colour = input.pair ? look(input.pair.colour) : null;
    const pack = {
      ideas: input.looks.flatMap((l) => {
        if (typeof l === 'string') return look(l) ?? [];
        const [c, shade] = [look(l[0]), look(l[1])];
        return c && shade ? withColour(c, shade) : [];
      }),
      pair: cut && colour ? { cut, colour } : null,
      // A cut's trade-offs go with it, for the AI pick's "What I need".
      pool: input.recommendation.engine.pool.flatMap((idea) => {
        const l = look(idea.id);
        return l ? [{ ...l, tradeOffs: idea.tradeOffs }] : [];
      }),
      facts: input.facts,
      gridMaxTiles: input.content.consult.policy.grid_max_tiles,
      ...(input.perPicture === undefined ? {} : { perCard: input.perPicture }),
    };
    return buildPromptPack(input.content.consult.prompts, pack, input.recommendation.engine);
  };

/** The framing line of a pick, for the stylist sheet: what the cut does, the app's own styling preference. */
const framingOf = (engine: Recommendation | undefined, id: string): { framing?: string } => {
  const text = engine?.picks.find((idea) => idea.id === id)?.reasons.find((r) => r.ruleId === 'fit-frame')?.text;
  return text === undefined ? {} : { framing: text };
};

/** A pick's trade-offs in the person's own words, for the stylist sheet. */
const tradeOffsOf = (engine: Recommendation | undefined, id: string): { tradeOffs?: string } => {
  const idea = [...(engine?.picks ?? []), ...(engine?.added ?? [])].find((i) => i.id === id);
  const text = idea ? tradeOffWords(idea.tradeOffs, SHOWN.prompts.tradeOffs, SHOWN.prompts.tradeOffs.iSaid) : null;
  return text === null ? {} : { tradeOffs: text };
};

/** One idea's or a pair's sheet, in the language shown; a colour look carries the engine's safety view of it, computed again from the facts. */
const sheetFor =
  (input: SheetInput<ConsultRecommendation>): ConsultSheet =>
  (details) => {
    const library = libraryOf(input.content);
    const engine = input.recommendation?.engine;
    const lookOf = (id: string): SheetLook | null => {
      const d = details(id);
      if (d?.kind !== 'colour') return null;
      const known = [...(engine?.picks ?? []), ...(engine?.added ?? [])].find((idea) => idea.id === id);
      return { kind: 'colour', detail: d, shades: library.shades, techniques: library.techniques, assessment: known ?? assessIdea(id, input.facts, library.engine) };
    };
    const first = details(input.id);
    const cut = first?.kind === 'cut' ? { kind: 'cut' as const, detail: first, ...framingOf(engine, input.id), ...tradeOffsOf(engine, input.id) } : null;
    const look = lookOf(input.colour ?? input.id);
    const parts = input.colour === undefined ? (cut ?? look) : cut && look && ([cut, look] as const);
    return parts ? buildStylistSheet(parts, input.facts, { ai: input.picture }, SHOWN) : null;
  };

export const selectorDeps: SelectorDeps<ConsultRecommendation, ConsultPrompts, ConsultSheet> = {
  recommend: recommendFor,
  buildPrompts: promptsFor,
  stylistSheet: sheetFor,
};
