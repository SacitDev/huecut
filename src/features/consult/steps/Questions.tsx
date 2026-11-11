/**
 * The core questions: one question per screen, "Question 3 of 9" counting only the
 * questions that apply, on one line with the tap hint and the "Your photo is ready: try a colour" chip, follow-ups on the same
 * screen, the tools' progress line under the question (so the question and its first answer lead a phone's first screen),
 * and "Skip to my ideas" always there. A pointer tap on a single answer goes on at once, except
 * on a safety question; the keyboard stays and uses Next. Back goes to the question before while there is one. Questions never wait for analysis.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { isUsable } from '../../../machine/consult.selectors.ts';
import type { ConsultContext } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { cx } from '../../../ui/cx.ts';
import { PhotoFigure } from '../PhotoFigure.tsx';
import { coreQuestions, coreSetOf, fitToPerson, goesOnByTap, startIndex } from '../questions.ts';
import { StepLayout } from '../StepLayout.tsx';
import { ToolsStatus } from '../ToolsStatus.tsx';
import { TryColour } from '../TryColour.tsx';
import type { StepProps } from '../useConsult.ts';
import { QuestionGroup } from './QuestionGroup.tsx';
import styles from './steps.module.css';

const t = en.consult.questions;

/** How long a newly shown question takes presses from nobody: longer than the gap inside a double tap, under reduced motion too. */
const ARRIVAL_MS = 350;

/** True from the first render of a new question until it has arrived; the keyboard and screen readers are not held up, only presses. */
function useArriving(question: string | undefined): boolean {
  const [arrived, setArrived] = useState<string | undefined>();
  useEffect(() => {
    const timer = setTimeout(() => { setArrived(question); }, ARRIVAL_MS);
    return () => { clearTimeout(timer); };
  }, [question]);
  return arrived !== question;
}

/** The main photo once its hair outline is ready: the colour preview can start. */
function readyPhoto(c: ConsultContext) {
  const main = c.photos.find((p) => p.id === c.mainPhotoId);
  return main && !c.skipped && isUsable(main) && main.observation?.previewMask ? main.id : null;
}

/** The questions to ask now, the one shown and which way the last move went; moving keeps focus on the count, so the new question is read next. */
function usePaging({ port, view }: StepProps) {
  const { context } = view;
  const { goal, collections } = context.prefs;
  const facts = port.selectors.facts(context);
  const file = context.content.consult.questions;
  const asked = useMemo(() => (goal === null ? [] : coreQuestions(file, coreSetOf(goal, collections), facts).map((a) => fitToPerson(a, facts, collections))), [file, goal, collections, facts]);
  const [place, setPlace] = useState<{ readonly index: number; readonly moved: 'forward' | 'back' | null }>(() => ({ index: startIndex(asked, context.answers), moved: null }));
  const at = Math.min(place.index, Math.max(0, asked.length - 1));
  const count = useRef<HTMLParagraphElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) count.current?.focus();
  }, [at]);
  const go = (to: number) => {
    moved.current = true;
    setPlace({ index: to, moved: to < at ? 'back' : 'forward' });
  };
  return { asked, at, count, go, direction: place.moved };
}

export function Questions(step: StepProps) {
  const { port, view } = step;
  const { context } = view;
  const { asked, at, count, go, direction } = usePaging(step);
  const current = asked[at];
  const last = at >= asked.length - 1;
  const ready = readyPhoto(context);
  const arriving = useArriving(current?.question.id) && styles.arriving;
  const goOn = () => { if (last) port.send({ type: 'NEXT' }); else go(at + 1); };
  const goBack = () => { if (at > 0) go(at - 1); else port.back(); };
  const actions = (
    <>
      <Button className={cx(arriving)} onClick={goOn}>{last ? en.consult.continue : t.next}</Button>
      <Button variant="text" onClick={() => { port.send({ type: 'NEXT' }); }}>{t.skip}</Button>
    </>
  );
  return (
    <StepLayout title={en.consult.steps.questions} onBack={goBack} aside={context.skipped || context.mainPhotoId === null ? null : <PhotoFigure photoId={context.mainPhotoId} />} actions={actions}>
      {current ? (
        <>
          <div className={styles.questionMeta}>
            <p ref={count} className={styles.count} tabIndex={-1}>
              {t.count(at + 1, asked.length)}
            </p>
            {goesOnByTap(current.question) && <p className={styles.count}>{t.tapHint}</p>}
            {ready !== null && <TryColour photoId={ready} look="chip" />}
          </div>
          {/* A new key per question, so the arrival plays once for each; the way it slides says whether the person went on or back. The outer box clips the slide. */}
          <div className={styles.question}>
            <div key={current.question.id} className={cx(arriving)} data-moved={direction ?? undefined}>
              <QuestionGroup asked={current} answers={context.answers} onAnswer={(question, value) => { port.send({ type: 'ANSWER', question, value }); }} onTapped={goOn} collections={context.prefs.collections} />
            </div>
          </div>
        </>
      ) : (
        <p>{t.none}</p>
      )}
      <ToolsStatus view={view} port={port} />
    </StepLayout>
  );
}
