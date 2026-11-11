/**
 * The core questions for a goal and collection: the core set's questions in
 * list order whose `show_if` is true or unknown (asking is the safe side), each with the follow-ups its options open on
 * the same screen. "Question 3 of 9" counts only these, so the total can shrink as answers come in.
 */
import type { Question, QuestionOption, QuestionsFile, WishOption } from '../../domain/content/types.ts';
import type { Collection, CoreSetName } from '../../domain/content/values.ts';
import { evalWhen, usable } from '../../domain/engine/match.ts';
import type { AnswerValue, Answers } from '../../domain/facts/answers-to-facts.ts';
import { FACTS, type Facts } from '../../domain/facts/registry.ts';
import type { ConsultGoal } from '../../machine/consult.types.ts';

/** One question as asked: its options in display order and the follow-up each option opens, by option index. */
export interface AskedQuestion {
  readonly question: Question;
  /** Option indices with "Not sure" last. */
  readonly order: readonly number[];
  readonly followUps: ReadonlyMap<number, Question>;
}

/** The core set for the goal and the collections shown; "All" uses the women's set of that goal. */
export function coreSetOf(goal: ConsultGoal, collections: readonly Collection[]): CoreSetName {
  if (goal === 'colour') return 'colour/any';
  const mensOnly = collections.length === 1 && collections[0] === 'barbering';
  return mensOnly ? `${goal}/barbering` : `${goal}/salon`;
}

/** "Not sure": a value option whose value is null, stored as absence. */
export const isNotSure = (o: QuestionOption): boolean => 'value' in o && !('fact' in o) && o.value === null;

/** Options that stand alone in a multi question: "Not sure", "None of these" and the fact's exclusive values (`none`). */
function isExclusive(q: Question, o: QuestionOption | undefined): boolean {
  if (o === undefined) return false;
  if (isNotSure(o) || 'none_of_these' in o) return true;
  const spec = q.fact === undefined ? undefined : FACTS[q.fact];
  const exclusive: readonly unknown[] = spec?.type === 'set' && 'exclusive' in spec ? spec.exclusive : [];
  return 'value' in o && exclusive.includes(o.value);
}

/** A question is asked while its `show_if` is true or unknown on the facts so far. */
export const applies = (q: Question, facts: Facts): boolean => q.show_if === undefined || evalWhen(q.show_if, facts).result !== 'fail';

/** Option indices in display order: "Not sure" last. */
export function orderOf(q: Question): number[] {
  const sure = q.options.flatMap((o, i) => (isNotSure(o) ? [] : [i]));
  const notSure = q.options.flatMap((o, i) => (isNotSure(o) ? [i] : []));
  return [...sure, ...notSure];
}

/**
 * A tap on one answer goes on at once, but never from a safety question: a wrong answer there can remove the referral
 * the colour safety rests on, so it takes a deliberate press of Next.
 */
export function goesOnByTap(q: Question): boolean {
  const safety = (fact: string): boolean => fact.startsWith('safety.');
  const writesSafety = (q.fact !== undefined && safety(q.fact)) || q.options.some((o) => ('sets' in o && Object.keys(o.sets).some(safety)) || ('fact' in o && safety(o.fact)));
  return q.type === 'single' && !writesSafety;
}

/** The questions to ask now, in core-set order; a follow-up that is itself in the set is asked there, not repeated. */
export function coreQuestions(file: QuestionsFile, set: CoreSetName, facts: Facts): AskedQuestion[] {
  const byId = new Map(file.questions.map((q) => [q.id, q]));
  const ids = file.core_sets[set];
  const inSet = new Set(ids);
  // A follow-up two questions of the set can open sits under the later one, so it is asked once.
  const home = new Map(ids.flatMap((id) => (byId.get(id)?.options ?? []).flatMap((o) => ('follow_up' in o && o.follow_up ? [[o.follow_up, id] as const] : []))));
  return ids.flatMap((id) => {
    const question = byId.get(id);
    if (!question || !applies(question, facts)) return [];
    const followUps = new Map(
      question.options.flatMap((o, i) => {
        const next = 'follow_up' in o ? byId.get(o.follow_up) : undefined;
        return next && !inSet.has(next.id) && home.get(next.id) === id ? [[i, next] as const] : [];
      }),
    );
    return [{ question, order: orderOf(question), followUps }];
  });
}

/** The taste cards shown at once; with several models in play they take turns. */
const CARDS = 6;

/** The six taste cards of the collections shown and the person's texture group, with "None of these" after them. */
function tasteOrder(a: AskedQuestion, facts: Facts, collections: readonly Collection[]): number[] {
  const texture = usable(facts, 'hair.texture');
  const group = texture === 'straight' || texture === 'wavy' ? '-straight-wavy' : texture === 'curly' || texture === 'coily' ? '-curly-coily' : '';
  const modelOf = (i: number): string => {
    const o = a.question.options[i];
    return (o && 'picture' in o ? Object.values(o.picture)[0]?.split('/')[0] : undefined) ?? '';
  };
  const cards = a.order.filter((i) => modelOf(i).endsWith(group) && collections.some((c) => modelOf(i).startsWith(c)));
  const turn = (i: number): number => cards.filter((j) => modelOf(j) === modelOf(i)).indexOf(i);
  return [...cards.sort((x, y) => turn(x) - turn(y)).slice(0, CARDS), ...a.order.filter((i) => modelOf(i) === '')];
}

/**
 * What this person is shown of a question: only the taste cards for their "Show" choice and texture; on the wish list every wish in
 * its own order (no rule ties a wish to the face), but no hairline wish after the recession follow-up asked it.
 */
export function fitToPerson(a: AskedQuestion, facts: Facts, collections: readonly Collection[]): AskedQuestion {
  if (a.question.id === 'taste-cuts') return { ...a, order: tasteOrder(a, facts, collections) };
  if (a.question.type !== 'wishes') return a;
  const stage = usable(facts, 'hair.recession_stage') as number | undefined;
  return { ...a, order: a.order.filter((i) => (a.question.options[i] as WishOption).fact !== 'wish.hairline' || stage === undefined || stage < 3) };
}

/** Where the questions open: the first one not answered yet, or the last when all are (coming back keeps the place). */
export function startIndex(asked: readonly AskedQuestion[], answers: Answers): number {
  const open = asked.findIndex((a) => answers[a.question.id] === undefined);
  return open >= 0 ? open : Math.max(0, asked.length - 1);
}

/** A tap on `index` would go past the question's limit; "Not sure" and the like neither count towards it nor are held back by it. */
const isFull = (q: Question, chosen: readonly number[], index: number): boolean =>
  q.max !== undefined && !chosen.includes(index) && !isExclusive(q, q.options[index]) && chosen.filter((i) => !isExclusive(q, q.options[i])).length >= q.max;

/**
 * The answer after a tap: one option for a single question; for a multi or wishes question the option toggles, and
 * "Not sure" or "None of these" stands alone. Null clears the answer (nothing chosen). A tap past the question's `max` changes nothing: `current` comes back.
 */
export function chosenAfter(q: Question, current: AnswerValue | undefined, index: number, under?: string): AnswerValue | null {
  const base = under === undefined ? {} : { under };
  if (q.type === 'single') return { chosen: [index], ...base };
  const before = current?.chosen ?? [];
  const toggled = before.includes(index) ? before.filter((i) => i !== index) : [...before, index];
  const alone = isExclusive(q, q.options[index]);
  if (current && isFull(q, before, index)) return current;
  const chosen = alone ? (before.includes(index) ? [] : [index]) : toggled.filter((i) => !isExclusive(q, q.options[i]));
  return chosen.length === 0 ? null : { chosen, ...base };
}
