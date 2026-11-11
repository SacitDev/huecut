/**
 * `toFacts(answers, questions, faceFacts, bands) → Facts`: answers are `high` and `answered`; "Not sure" is absent; options with
 * `sets` write several facts; the wishes question writes one key per chosen option; a follow-up counts only while its parent option
 * is chosen. Measured face facts come through the bands; an answer to the same key wins.
 */
import type { Bands, Question, QuestionOption, SetsOption, ValueOption, WishOption } from '../content/types.ts';
import type { FaceFacts } from '../fuse/fuse.ts';
import { bandReadings, numericReadings } from '../measure/bands.ts';
import { FACTS, type Confidence, type Fact, type FactKey, type FactSource, type Facts } from './registry.ts';

export type QuestionId = string;

/** One answered question: indices into `question.options`, in the order chosen. */
export interface AnswerValue {
  readonly chosen: readonly number[];
  /** The parent question's id when this was answered as a follow-up under one of its options. */
  readonly under?: QuestionId;
}
export type Answers = Readonly<Partial<Record<QuestionId, AnswerValue>>>;

interface Written {
  readonly key: FactKey;
  readonly value: unknown;
}

const isNotSure = (o: QuestionOption): boolean => 'value' in o && !('fact' in o) && o.value === null;
const isSets = (o: QuestionOption): o is SetsOption => 'sets' in o;
const isNoneOfThese = (o: QuestionOption): boolean => 'none_of_these' in o;
const isWish = (o: QuestionOption): o is WishOption => 'fact' in o;
const isValue = (o: QuestionOption): o is ValueOption => 'value' in o && !('fact' in o);

/** Throws unless `value` fits the fact's spec: content is checked at build, so a misfit is a broken invariant. */
function assertFits(key: FactKey, value: unknown): void {
  const spec = FACTS[key];
  const members: readonly unknown[] = 'values' in spec ? spec.values : [];
  const fits =
    spec.type === 'enum' ? members.includes(value)
    : spec.type === 'set' ? Array.isArray(value) && new Set(value).size === value.length && value.every((v) => members.includes(v))
    : spec.type === 'number' ? typeof value === 'number' && value >= spec.range[0] && value <= spec.range[1]
    : typeof value === 'boolean';
  if (!fits) throw new Error(`Value ${JSON.stringify(value)} does not fit fact ${key}`);
}

/** A set that combines an exclusive value (such as `none`) with another is contradictory: unknown is the safe side. */
function contradicts(key: FactKey, members: readonly unknown[]): boolean {
  const spec = FACTS[key];
  const exclusive: readonly unknown[] = spec.type === 'set' && 'exclusive' in spec ? spec.exclusive : [];
  return members.length > 1 && members.some((m) => exclusive.includes(m));
}

/** What one option writes on its own. */
function optionWrites(q: Question, o: QuestionOption): Written[] {
  if (isSets(o)) return Object.entries(o.sets).map(([key, value]) => ({ key: key as FactKey, value }));
  if (isWish(o)) return [{ key: o.fact, value: o.value }];
  if (!q.fact) return [];
  const value = isValue(o) ? o.value : null;
  return [{ key: q.fact, value: FACTS[q.fact].type === 'set' ? [value] : value }];
}

/** A multi-select question: value options become one set; `sets` options add their own writes. */
function multiWrites(q: Question, options: readonly QuestionOption[]): Written[] {
  const none = options.some(isNoneOfThese);
  const members = options.filter(isValue).map((o) => o.value);
  const writes = options.filter((o) => isSets(o) || isWish(o)).flatMap((o) => optionWrites(q, o));
  if (!q.fact || (none && members.length > 0) || contradicts(q.fact, members)) return writes;
  return [...writes, { key: q.fact, value: members }];
}

/** True when the parent question's answer still chooses the option that opens `id` as its follow-up. */
function parentChooses(parentId: QuestionId, id: string, answers: Answers, byId: ReadonlyMap<string, Question>): boolean {
  const parent = byId.get(parentId);
  const chosen = answers[parentId]?.chosen ?? [];
  return parent !== undefined && chosen.some((i) => {
    const o = parent.options[i];
    return o !== undefined && 'follow_up' in o && o.follow_up === id;
  });
}

/** Everything one answered question writes; nothing for "Not sure", no option, or a stale follow-up. */
export function answerWrites(q: Question, answer: AnswerValue, answers: Answers, byId: ReadonlyMap<string, Question>): Written[] {
  if (answer.under !== undefined && !parentChooses(answer.under, q.id, answers, byId)) return [];
  const options = answer.chosen.map((i) => q.options[i]).filter((o): o is QuestionOption => o !== undefined);
  const [first] = options;
  if (!first || options.some(isNotSure)) return [];
  switch (q.type) {
    case 'wishes':
      return options.filter(isWish).map((o) => ({ key: o.fact, value: o.value }));
    case 'single':
      return optionWrites(q, first);
    case 'multi':
      return multiWrites(q, options);
  }
}

function put(out: Partial<Record<FactKey, Fact>>, key: FactKey, value: unknown, confidence: Confidence, source: FactSource, basis?: string): void {
  assertFits(key, value);
  out[key] = { key, value, confidence, source, ...(basis === undefined ? {} : { basis }) } as Fact;
}

/** All known facts: measured face facts from the bands, then every answer (answers win on a shared key). */
export function toFacts(answers: Answers, questions: readonly Question[], faceFacts: FaceFacts | null, bands: Bands | null): Facts {
  const out: Partial<Record<FactKey, Fact>> = {};
  if (faceFacts && bands) for (const r of bandReadings(bands, faceFacts)) put(out, r.fact, r.value, r.confidence, 'measured', r.basis);
  if (faceFacts) for (const r of numericReadings(faceFacts)) put(out, r.fact, r.value, r.confidence, 'measured', r.basis);
  const byId = new Map(questions.map((q) => [q.id, q]));
  for (const q of questions) {
    const answer = answers[q.id];
    if (answer) for (const w of answerWrites(q, answer, answers, byId)) put(out, w.key, w.value, 'high', 'answered');
  }
  return out as Facts;
}
