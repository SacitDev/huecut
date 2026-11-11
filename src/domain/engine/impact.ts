/**
 * "Improve my ideas" ordered by what could change the list: each open question is tried with each of its
 * valid answers, one at a time, and scored by how many picks would leave. It says what could change, never what is better.
 * It is a generator so the screen can run it in slices and keep the page responsive.
 */
import type { Question } from '../content/types.ts';
import { answerWrites, type Answers } from '../facts/answers-to-facts.ts';
import type { Fact, Facts } from '../facts/registry.ts';
import { PRIVACY_OPTIONAL } from './journey.ts';

/** How much a question could change the list: the mean and the most picks that left, over its valid answers. */
export interface QuestionImpact { readonly question: string; readonly mean: number; readonly most: number }

/** The real answers a question offers: every option except "Not sure", one at a time. */
function optionsOf(q: Question): readonly number[] {
  return q.options.flatMap((o, i) => ('value' in o && !('fact' in o) && o.value === null ? [] : [i]));
}

/** Facts with one answer laid over them, as `toFacts` writes it: answers are high confidence and answered. */
function withAnswer(facts: Facts, writes: readonly { readonly key: Fact['key']; readonly value: unknown }[]): Facts {
  return { ...facts, ...Object.fromEntries(writes.map((w) => [w.key, { key: w.key, value: w.value, confidence: 'high', source: 'answered' }])) };
}

/**
 * Yields once per answer tried, then returns the questions by impact, largest first; the content order breaks ties, and a
 * question only the privacy-optional health answer writes scores 0, so it is never pushed forward. `picks` is the engine call.
 */
export function* questionImpact(asked: readonly Question[], facts: Facts, answers: Answers, all: readonly Question[], picks: (f: Facts) => readonly string[]): Generator<void, readonly QuestionImpact[]> {
  const byId = new Map(all.map((q) => [q.id, q]));
  const now = picks(facts);
  yield;
  const scored: QuestionImpact[] = [];
  for (const q of asked) {
    const moved: number[] = [];
    for (const chosen of optionsOf(q)) {
      const writes = answerWrites(q, { chosen: [chosen] }, answers, byId);
      if (writes.length === 0 || writes.every((w) => PRIVACY_OPTIONAL.has(w.key))) continue;
      const after = picks(withAnswer(facts, writes));
      moved.push(now.filter((id) => !after.includes(id)).length);
      yield;
    }
    scored.push({ question: q.id, mean: moved.length === 0 ? 0 : moved.reduce((a, b) => a + b, 0) / moved.length, most: Math.max(0, ...moved) });
  }
  return scored.sort((a, b) => b.mean - a.mean);
}

/** Runs the generator to its end, for tests and the bars. */
export function runImpact(g: Generator<void, readonly QuestionImpact[]>): readonly QuestionImpact[] {
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}
