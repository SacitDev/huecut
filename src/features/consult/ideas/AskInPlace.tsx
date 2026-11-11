/**
 * A question opened in place on an idea ("Answer *question* to know"): the same option tiles as the core
 * questions, sent as `ANSWER`, so the label and every other idea update at once. Focus moves to its first option; it
 * stays open while the answers change the idea, until "Done".
 */
import { useEffect, useRef } from 'react';
import type { Question } from '../../../domain/content/types.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { QuestionGroup } from '../steps/QuestionGroup.tsx';
import { askedOf } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

export function AskInPlace({ s, question, onDone }: { readonly s: IdeasScreen; readonly question: Question; readonly onDone: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector('input')?.focus();
  }, [question.id]);
  return (
    <div ref={box} className={styles.ask}>
      <QuestionGroup
        asked={askedOf(s.context.content.consult.questions, question)}
        answers={s.context.answers}
        onAnswer={(id, value) => {
          s.port.send({ type: 'ANSWER', question: id, value });
          s.announce(t.answersUpdated);
          // An answer can take the idea itself away (a referral leaves no colour idea): focus then goes to the screen's heading.
          s.focusAfter(() => (box.current?.isConnected ? null : document.querySelector('h1')));
        }}
        collections={s.context.prefs.collections}
      />
      <Button variant="secondary" onClick={onDone}>
        {t.closeQuestion}
      </Button>
    </div>
  );
}
