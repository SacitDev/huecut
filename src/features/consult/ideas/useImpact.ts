/**
 * The questions of "Improve my ideas" ordered by what could change the list, worked out in the background
 * in short slices so the page never stops. `null` until the slices finish for the current answers.
 */
import { useEffect, useEffectEvent, useState } from 'react';
import { questionImpact, type QuestionImpact } from '../../../domain/engine/impact.ts';
import type { AskedQuestion } from '../questions.ts';
import type { IdeasScreen } from './screen.ts';

/** A slice of work per timeout: well under a frame, so taps and scrolling stay smooth. */
const SLICE_MS = 8;

export function useImpact(s: Pick<IdeasScreen, 'port' | 'context' | 'facts' | 'engine' | 'list'>, asked: readonly AskedQuestion[]): readonly QuestionImpact[] | null {
  const [impact, setImpact] = useState<{ readonly facts: IdeasScreen['facts']; readonly value: readonly QuestionImpact[] } | null>(null);
  const { facts, port, context } = s;
  // Each run reads the newest `port` and `context` when it starts; only new questions or a new list restart the work.
  const startImpact = useEffectEvent(() => questionImpact(asked.map((a) => a.question), facts, context.answers, context.content.consult.questions.questions, (f) => port.selectors.picksFor(context, f)));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const steps = startImpact();
    const slice = (): void => {
      const end = performance.now() + SLICE_MS;
      while (performance.now() < end) {
        const r = steps.next();
        if (r.done === true) {
          setImpact({ facts, value: r.value });
          return;
        }
      }
      timer = setTimeout(slice, 0);
    };
    timer = setTimeout(slice, 0);
    return () => { clearTimeout(timer); };
  }, [asked, facts]);
  return impact?.facts === facts ? impact.value : null;
}
