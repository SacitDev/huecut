/**
 * Prompt builders: one look, the "Try together" pair, quick grids of at most 4 tiles, final cards of at most 6, repair, second
 * opinion and explain card. Image prompts carry the look and the keep-list, never face measurements or answers, except that a look
 * keeping the person's own colour names their level when it is known. After the referral no colour-bearing prompt is built, in any of them.
 */
import { SHEET_FACTS, type Facts } from '../facts/registry.ts';
import type { PromptTemplate, Referral } from '../content/types.ts';
import type { PromptKind } from '../content/values.ts';
import { lookId } from '../ids.ts';
import { err, ok, type Result } from '../result.ts';
import { EN, needWords, type Copy } from '../render-model/copy.ts';
import { answerWords } from '../render-model/facts-copy.ts';
import type { TradeOff } from '../engine/suitability.ts';
import { factSentences, faceNotes, type CardFact } from '../render-model/face-card.ts';
import { countWords, fillTemplate, KEEP_COLOUR, keepListText } from './template.ts';

/** A look as a prompt needs it; a cut, colour look or beard details record fits as it is. */
export interface PromptLook {
  readonly id: string;
  readonly kind: 'cut' | 'colour' | 'beard';
  readonly name: string;
  readonly prompt_spec: string;
  /** The colour look this cut is paired with: its prompts use `try_on_both` and its name says both. */
  readonly colour?: PromptLook;
  /** The card's one line of upkeep, in words. */
  readonly upkeep?: string;
  /** A colour look that keeps the person's own colour: their level (`null` when not known) and the words of `prompt_spec` that picture the colour it was designed on. */
  readonly ownBase?: { readonly level: number | null; readonly words: readonly string[] };
  /** A cut on the list: the limits it misses that the person may accept. */
  readonly tradeOffs?: readonly TradeOff[];
}
/** An idea on the list: a cut or a colour look. */
export type IdeaLook = PromptLook & { readonly kind: 'cut' | 'colour' };
export type PromptTemplates = Partial<Readonly<Record<PromptKind, PromptTemplate>>>;
/** What safety precedence needs: the referral that applies now, if any; `Recommendation` fits as it is. */
export interface PromptSafety { readonly referral: Pick<Referral, 'id'> | null }

export interface BuiltPrompt {
  readonly kind: PromptKind;
  readonly text: string;
  readonly words: number;
  /** The looks the prompt names, in order (a grid's in reading order). */
  readonly ideas: readonly string[];
  /** Left out to stay within the word budget: fact keys, note facts, `prompt_spec` for a grid named by names only, or `upkeep`. */
  readonly omitted: readonly string[];
}
export type PromptRefusal =
  | 'referral' | 'missing_template' | 'bad_template' | 'missing_value' | 'over_budget' | 'not_a_pair' | 'bad_grid' | 'no_candidates' | 'no_face_notes';
export type Built = Result<BuiltPrompt, PromptRefusal>;

function finish(templates: PromptTemplates, kind: PromptKind, values: Readonly<Record<string, string>>, ideas: readonly string[], omitted: readonly string[] = []): Built {
  const t = templates[kind];
  if (!t) return err('missing_template');
  const filled = fillTemplate(t, values);
  if (!filled.ok) return err(filled.error.code === 'missing_value' ? 'missing_value' : 'bad_template');
  const words = countWords(filled.value);
  return words > t.word_budget ? err('over_budget') : ok({ kind, text: filled.value, words, ideas, omitted });
}

const carriesColour = (look: PromptLook): boolean => look.kind === 'colour' || look.colour !== undefined;
/** The one check every builder makes: after the referral, no prompt that names a hair colour, however it was reached. */
const refused = (looks: readonly PromptLook[], safety: PromptSafety): boolean => safety.referral !== null && looks.some(carriesColour);

/** A cut with the colour chosen for it: its id is `cut+colour`, as in its slot key, the board and the sheet. */
export const withColour = <L extends PromptLook>(cut: L, colour: PromptLook): L => ({ ...cut, id: lookId([cut.id, colour.id]), colour });
/** The look's name on a card, a grid and a list: the cut's alone, or both names. */
export const lookName = (look: Pick<PromptLook, 'name' | 'colour'>, copy: Pick<Copy, 'board'> = EN): string =>
  look.colour ? copy.board.lookName(look.name, look.colour.name) : look.name;

/**
 * A look's description as a prompt gives it: the one place a colour look's base enters a prompt. A look that keeps the person's own
 * colour was pictured on some base: the words for that base become the person's own colour, and every placement keeps its shade.
 */
function specText(look: PromptLook, copy: Pick<Copy, 'prompts'> = EN): string {
  const own = look.ownBase;
  if (own === undefined) return look.prompt_spec;
  const theirs = copy.prompts.ownBase(own.level);
  return own.words.reduce((spec, words) => spec.split(words).join(theirs), look.prompt_spec);
}

/** `try_on_both`: a cut with a colour, from the "Try together" pair or "Colour in your results". */
function bothPrompt(templates: PromptTemplates, cut: PromptLook, colour: PromptLook, ideas: readonly string[]): Built {
  const values = { cut_name: cut.name, cut_spec: cut.prompt_spec, colour_name: colour.name, colour_spec: specText(colour), keep_list: keepListText() };
  return finish(templates, 'try_on_both', values, ideas);
}

/** One look per chat: `try_on_both` for a cut with a colour, `try_on_cut` (which keeps the colour), `try_on_beard` (its keep-list leaves the beard out) or `try_on_colour`. */
export function buildTryOn(templates: PromptTemplates, look: PromptLook, safety: PromptSafety): Built {
  if (refused([look], safety)) return err('referral');
  if (look.colour) return bothPrompt(templates, look, look.colour, [look.id]);
  const values = { look_name: look.name, prompt_spec: specText(look) };
  if (look.kind === 'beard') return finish(templates, 'try_on_beard', { ...values, keep_list: keepListText({ beard: false }) }, [look.id]);
  if (look.kind === 'cut') return finish(templates, 'try_on_cut', { ...values, keep_list: `${keepListText()} ${KEEP_COLOUR}` }, [look.id]);
  return finish(templates, 'try_on_colour', { ...values, keep_list: keepListText() }, [look.id]);
}

/** `try_on_both` for exactly the "Try together" pair: one cut and one colour look; not after the referral. */
export function buildTryTogether(templates: PromptTemplates, pair: { readonly cut: PromptLook; readonly colour: PromptLook }, safety: PromptSafety): Built {
  if (pair.cut.kind !== 'cut' || pair.colour.kind !== 'colour') return err('not_a_pair');
  if (refused([pair.colour], safety)) return err('referral');
  return bothPrompt(templates, pair.cut, pair.colour, [pair.cut.id, pair.colour.id]);
}

/** Splits `items` evenly over the fewest groups of at most `max` (5 items at most 4 give 3 + 2, not 4 + 1), keeping their order. */
function spread<T>(items: readonly T[], max: number): T[][] {
  const groups = Math.ceil(items.length / max);
  const out: T[][] = [];
  for (let g = 0, start = 0; g < groups; g++) {
    const size = Math.floor(items.length / groups) + (g < items.length % groups ? 1 : 0);
    out.push(items.slice(start, start + size));
    start += size;
  }
  return out;
}

/** At most 4 tiles per grid. */
export const GRID_MAX_TILES = 4;
/** The layout asked for each tile count: 1 x 1, 1 x 2, 1 x 3 or 2 x 2. */
export const GRID_LAYOUTS: Readonly<Record<number, { readonly rows: number; readonly columns: number }>> = {
  1: { rows: 1, columns: 1 }, 2: { rows: 1, columns: 2 }, 3: { rows: 1, columns: 3 }, 4: { rows: 2, columns: 2 },
};
/** One grid picture: its ideas in reading order (left to right, top to bottom) and the layout the prompt asks for. */
export interface GridPlan { readonly kind: 'cut' | 'colour'; readonly rows: number; readonly columns: number; readonly ideas: readonly IdeaLook[] }

/**
 * The quick grids for the list: cuts and colour looks in separate grids, each of at most `maxTiles` ideas, spread evenly over the
 * fewest grids in list order.
 */
export function planGrids(ideas: readonly IdeaLook[], maxTiles = GRID_MAX_TILES): GridPlan[] {
  const max = Math.min(GRID_MAX_TILES, Math.max(1, Math.floor(maxTiles)));
  return (['cut', 'colour'] as const).flatMap((kind) =>
    spread(ideas.filter((i) => i.kind === kind), max).map((own) => ({ kind, ...(GRID_LAYOUTS[own.length] ?? { rows: 1, columns: own.length }), ideas: own })),
  );
}

const specOf = (look: PromptLook): string => (look.colour ? `${look.prompt_spec}; ${specText(look.colour)}` : specText(look));

/** One `quick_grid` prompt: names with their specs when that fits the budget, otherwise names only. */
export function buildQuickGrid(templates: PromptTemplates, plan: GridPlan, safety: PromptSafety): Built {
  const n = plan.ideas.length;
  const layout = GRID_LAYOUTS[n];
  if (layout?.rows !== plan.rows || layout.columns !== plan.columns || plan.ideas.some((i) => i.kind !== plan.kind)) return err('bad_grid');
  if (refused(plan.ideas, safety)) return err('referral');
  const ids = plan.ideas.map((i) => i.id);
  const keepsColour = plan.ideas.every((i) => !carriesColour(i));
  const values = { rows: String(plan.rows), columns: String(plan.columns), count: String(n), keep_list: keepsColour ? `${keepListText()} ${KEEP_COLOUR}` : keepListText() };
  const withSpecs = finish(templates, 'quick_grid', { ...values, ideas_in_reading_order: plan.ideas.map((i) => `${lookName(i)} (${specOf(i)})`).join('; ') }, ids);
  if (withSpecs.ok || withSpecs.error !== 'over_budget') return withSpecs;
  return finish(templates, 'quick_grid', { ...values, ideas_in_reading_order: plan.ideas.map((i) => lookName(i)).join('; ') }, ids, ['prompt_spec']);
}

/** At most 6 looks on one tall card; 7 or 8 ideas make a second card. */
export const CARD_MAX_TILES = 6;
/** Rows and columns of the tall card per tile count. */
const CARD_LAYOUTS: Readonly<Record<number, { readonly rows: number; readonly columns: number }>> = {
  1: { rows: 1, columns: 1 }, 2: { rows: 2, columns: 1 }, 3: { rows: 3, columns: 1 }, 4: { rows: 2, columns: 2 }, 5: { rows: 3, columns: 2 }, 6: { rows: 3, columns: 2 },
};
/** One final card: its looks in order, numbered from 1 as on its reference sheet. */
export interface CardPlan { readonly rows: number; readonly columns: number; readonly ideas: readonly IdeaLook[] }

/** The cards for the list, at most `perCard` looks each ("How many looks in one picture?"), spread evenly over the fewest cards in list order. */
export function planCards(ideas: readonly IdeaLook[], perCard: number = CARD_MAX_TILES): CardPlan[] {
  return spread(ideas, Math.min(CARD_MAX_TILES, Math.max(1, Math.floor(perCard)))).map((own) => ({ ...(CARD_LAYOUTS[own.length] ?? { rows: own.length, columns: 1 }), ideas: own }));
}

/** The splits "How many looks in one picture?" offers for a list of `n`: one from all together down to 2 a card, each once, none with a card of 1. */
export function cardSplits(n: number): readonly { readonly perCard: number; readonly sizes: readonly number[] }[] {
  const seen = new Set<string>();
  return Array.from({ length: Math.max(0, Math.min(CARD_MAX_TILES, n) - 1) }, (_, i) => Math.min(CARD_MAX_TILES, n) - i).flatMap((perCard) => {
    const sizes = spread(Array.from({ length: n }, () => 0), perCard).map((g) => g.length);
    if (seen.has(sizes.join()) || (sizes.length > 1 && sizes.includes(1))) return [];
    seen.add(sizes.join());
    return [{ perCard, sizes }];
  });
}

/** What the card takes from the reference sheet, by what is on it. */
function sheetLine(ideas: readonly IdeaLook[], copy: Pick<Copy, 'prompts'>): string {
  if (ideas.every((i) => !carriesColour(i))) return copy.prompts.sheetKeep;
  return ideas.every((i) => i.kind === 'colour') ? copy.prompts.sheetColours : copy.prompts.sheetNamed;
}

/** One `final_card` prompt: each look's name and its upkeep line, or names only when the upkeep would pass the budget. Names are never cut. */
export function buildFinalCard(templates: PromptTemplates, plan: CardPlan, safety: PromptSafety, copy: Pick<Copy, 'board' | 'prompts'> = EN): Built {
  const layout = CARD_LAYOUTS[plan.ideas.length];
  if (layout?.rows !== plan.rows || layout.columns !== plan.columns) return err('bad_grid');
  if (refused(plan.ideas, safety)) return err('referral');
  const ids = plan.ideas.map((i) => i.id);
  const lines = (upkeep: boolean) => plan.ideas.map((look, i) => `${String(i + 1)}. ${lookName(look, copy)}${upkeep && look.upkeep ? `. ${look.upkeep}.` : '.'}`).join('\n');
  const values = { rows: String(plan.rows), columns: String(plan.columns), count: String(plan.ideas.length), sheet_line: sheetLine(plan.ideas, copy), keep_list: keepListText() };
  const full = finish(templates, 'final_card', { ...values, looks: lines(true) }, ids);
  if (full.ok || full.error !== 'over_budget') return full;
  return finish(templates, 'final_card', { ...values, looks: lines(false) }, ids, ['upkeep']);
}

/** "Face looks different?": the short follow-up for the same chat. */
export const buildRepair = (templates: PromptTemplates): Built => finish(templates, 'repair', {}, []);

type SheetFactKey = (typeof SHEET_FACTS)[number];
/** Hair facts every pick needs; the colour facts of `SHEET_FACTS` follow only when a colour look is a candidate. */
const HAIR_FACTS: readonly SheetFactKey[] = ['hair.texture', 'hair.density', 'hair.strand', 'hair.current_length'];
interface Part { readonly key: string; readonly text: string; readonly list: 'answers' | 'needs' | 'notes' }

/** The person's own answers among `SHEET_FACTS`, in words; derived and measured values are not answers. */
function answerParts(facts: Facts, keys: readonly SheetFactKey[], copy: Pick<Copy, 'facts' | 'prompts'>): Part[] {
  return keys.flatMap((key) => {
    const fact = facts[key];
    if (fact?.source !== 'answered') return [];
    return [{ key, text: copy.prompts.answer(copy.facts[key].label, answerWords(copy.facts, key, fact.value)), list: 'answers' as const }];
  });
}

const sentenceList = (parts: readonly Part[], none: string): string => `${parts.length === 0 ? none : parts.map((p) => p.text).join('; ')}.`;

export interface SecondOpinionInput {
  /** The engine's top looks (`pool_size`), in its order, the second group of colours last. */
  readonly pool: readonly IdeaLook[];
  readonly facts: Facts;
}

/** The concrete wishes "What I need" carries in the AI pick prompt, so the longest prompt stays within its word budget. */
export const NEED_WISHES = 2;

/** How many looks the person's own AI is asked to pick; fewer only when fewer exist. */
export const AI_PICKS = 3;

/**
 * The copy-only prompt for the person's own ChatGPT or Gemini, used with their own photo: every look by name, then as many
 * answers, needs and face notes as the budget allows: hair facts first, then "What I need" (the person's limits and wishes), the
 * notes, then colour facts. After the referral colour looks are not listed.
 */
export function buildSecondOpinion(templates: PromptTemplates, input: SecondOpinionInput, safety: PromptSafety, copy: Pick<Copy, 'facts' | 'faceNotes' | 'prompts'> = EN): Built {
  const candidates = safety.referral ? input.pool.filter((i) => !carriesColour(i)) : input.pool;
  if (candidates.length === 0) return err(input.pool.length > 0 ? 'referral' : 'no_candidates');
  const withColours = candidates.some(carriesColour);
  const notes = faceNotes(input.facts, copy).map((n): Part => ({ key: n.fact, text: n.brief, list: 'notes' }));
  const colourKeys = withColours ? SHEET_FACTS.filter((k) => !HAIR_FACTS.includes(k)) : [];
  const needs = needWords(input.facts, copy.prompts.needs, NEED_WISHES).map((text, i): Part => ({ key: `need-${String(i)}`, text, list: 'needs' }));
  // The listed looks that miss a limit, by limit: part of "What I need", taken last when the budget is tight.
  const traded = (['styling', 'trim', 'growth'] as const).flatMap((what): Part[] => {
    const names = [...new Set(candidates.filter((c) => c.tradeOffs?.some((x) => x.what === what)).map((c) => c.name))];
    return names.length === 0 ? [] : [{ key: `trade-off-${what}`, text: copy.prompts.tradeOffs.listed[what](names), list: 'needs' }];
  });
  const parts = [...answerParts(input.facts, HAIR_FACTS, copy), ...needs, ...notes, ...answerParts(input.facts, colourKeys, copy), ...traded];
  const ids = candidates.map((c) => c.id);
  // A salon and a barbering version can share a name, and read as one look here.
  const names = [...new Set(candidates.map((c) => c.name))];
  const attempt = (chosen: readonly Part[]): Built => finish(templates, 'second_opinion', {
    pick_count: String(Math.min(names.length, AI_PICKS)), candidates: `${names.join('; ')}.`,
    answers: sentenceList(chosen.filter((p) => p.list === 'answers'), copy.prompts.noAnswers),
    needs: sentenceList(chosen.filter((p) => p.list === 'needs'), copy.prompts.noAnswers),
    face_notes: sentenceList(chosen.filter((p) => p.list === 'notes'), copy.prompts.noFaceNotes),
  }, ids, parts.filter((p) => !chosen.includes(p)).map((p) => p.key));
  let best = attempt([]);
  if (!best.ok) return best;
  let chosen: Part[] = [];
  for (const part of parts) {
    const next = attempt([...chosen, part]);
    if (next.ok) [best, chosen] = [next, [...chosen, part]];
  }
  return best;
}

/**
 * "Copy a prompt to explain my face card": the card's own facts that could be read, each in its card words, or
 * in its short form when the card words would pass the budget.
 */
export function buildExplainCard(templates: PromptTemplates, facts: readonly CardFact[]): Built {
  const notes = facts.filter((f) => f.sureness !== 'cannot_read');
  if (notes.length === 0) return err('no_face_notes');
  const attempt = (texts: readonly string[], omitted: readonly string[]): Built => finish(templates, 'explain_card', { face_notes: texts.join(' ') }, [], omitted);
  let texts: string[] = [];
  const omitted: string[] = [];
  for (const n of notes) {
    const fit = [factSentences(n), `${n.brief}.`].find((t) => attempt([...texts, t], omitted).ok);
    if (fit === undefined) omitted.push(n.fact);
    else texts = [...texts, fit];
  }
  return texts.length === 0 ? err('over_budget') : attempt(texts, omitted);
}

export interface PromptPackInput {
  /** The list, in shortlist order, each cut with its colour when it has one. */
  readonly ideas: readonly IdeaLook[];
  readonly pair: { readonly cut: IdeaLook; readonly colour: IdeaLook } | null;
  readonly pool: readonly IdeaLook[];
  readonly facts: Facts;
  /** `policy.grid_max_tiles`. */
  readonly gridMaxTiles?: number;
  /** Looks per picture on All together; default all 6. */
  readonly perCard?: number;
}
export interface PromptPack {
  readonly pair: Built | null;
  readonly cards: readonly { readonly plan: CardPlan; readonly prompt: Built }[];
  readonly grids: readonly { readonly plan: GridPlan; readonly prompt: Built }[];
  readonly looks: readonly { readonly id: string; readonly prompt: Built }[];
  readonly repair: Built;
  readonly secondOpinion: Built;
}

/** Every prompt for the list at once, each built with the same safety input, so a later answer changes them all. A colour look after the referral has no tile on a card. */
export function buildPromptPack(templates: PromptTemplates, input: PromptPackInput, safety: PromptSafety, copy: Pick<Copy, 'board' | 'facts' | 'faceNotes' | 'prompts'> = EN): PromptPack {
  const onCards = safety.referral ? input.ideas.filter((i) => !carriesColour(i)) : input.ideas;
  return {
    pair: input.pair ? buildTryTogether(templates, input.pair, safety) : null,
    cards: planCards(onCards, input.perCard).map((plan) => ({ plan, prompt: buildFinalCard(templates, plan, safety, copy) })),
    grids: planGrids(input.ideas, input.gridMaxTiles).map((plan) => ({ plan, prompt: buildQuickGrid(templates, plan, safety) })),
    looks: input.ideas.map((look) => ({ id: look.id, prompt: buildTryOn(templates, look, safety) })),
    repair: buildRepair(templates),
    secondOpinion: buildSecondOpinion(templates, input, safety, copy),
  };
}
