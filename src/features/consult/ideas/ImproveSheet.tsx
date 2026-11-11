/**
 * "Improve my ideas": the optional questions for the goal and collections in a sheet,
 * on the same option tiles as the core questions; each answer is an `ANSWER`, so the ideas behind update as it is given.
 * The questions that could change this list come first, most first, the rest behind "Show all".
 */
import { useMemo, useState } from 'react';
import { en } from '../../../strings/en.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import { QuestionGroup } from '../steps/QuestionGroup.tsx';
import { ideaOf, improveFirst, improveQuestions, orderByImpact } from './model.ts';
import { useImpact } from './useImpact.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

const t = ideasCopy.improve;

export function ImproveSheet({ s }: { readonly s: IdeasScreen }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Set when the sheet opens: an answered question must not jump away while the person is reading the sheet.
  const [first, setFirst] = useState<ReadonlySet<string>>(() => new Set());
  const [couldChange, setCouldChange] = useState<ReadonlyMap<string, number>>(() => new Map());
  const { questions } = s.context.content.consult;
  const { collections } = s.context.prefs;
  const asked = useMemo(() => improveQuestions(questions, s.goal, collections, s.facts), [questions, s.goal, collections, s.facts]);
  const impact = useImpact(s, asked);
  const dependsOn = s.list.ids.map((id) => ideaOf(s.engine, id)?.dependsOn ?? []);
  const ordered = orderByImpact(asked, couldChange);
  const shown = showAll || first.size === 0 ? ordered : ordered.filter((a) => first.has(a.question.id));
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          s.ask(null);
          const moving = new Map((impact ?? []).filter((x) => x.most > 0).map((x) => [x.question, x.most]));
          setCouldChange(moving);
          setFirst(moving.size > 0 ? new Set(moving.keys()) : improveFirst(asked, dependsOn));
          setShowAll(false);
          setOpen(true);
        }}
      >
        {t.open}
      </Button>
      <Sheet open={open} title={t.title} onClose={() => { setOpen(false); }} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
        <p className={styles.small}>{t.hint}</p>
        {asked.length === 0 && <p>{t.none}</p>}
        {/* Only while open: an option tile's name is its question id, so no closed copy may sit beside an open one. */}
        {open && (
          <div className={styles.questions}>
            {shown.map((a) => (
              <div key={a.question.id}>
                {couldChange.has(a.question.id) && <p className={styles.small}>{t.couldChange(couldChange.get(a.question.id) ?? 0)}</p>}
                <QuestionGroup asked={a} answers={s.context.answers} onAnswer={(question, value) => { s.port.send({ type: 'ANSWER', question, value }); }} collections={collections} />
              </div>
            ))}
            {shown.length < asked.length && <Button variant="secondary" onClick={() => { setShowAll(true); }}>{t.showAll}</Button>}
          </div>
        )}
      </Sheet>
    </>
  );
}
