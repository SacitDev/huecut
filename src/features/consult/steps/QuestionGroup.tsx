/**
 * One question as option tiles: a radio group, or checkboxes for several answers, with the
 * visible legend, its help under it, each option's picture above its label and "Not sure" last; an
 * option's follow-up opens on the same screen under it. A question with a limit says how many are chosen and refuses one too many.
 */
import { useState } from 'react';
import type { ShippedOption } from '../../../domain/content/output.ts';
import type { Question, QuestionOption } from '../../../domain/content/types.ts';
import type { Collection } from '../../../domain/content/values.ts';
import type { AnswerValue } from '../../../domain/facts/answers-to-facts.ts';
import { en } from '../../../strings/en.ts';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { pictureUrl } from '../../shared/pictures.ts';
import { chosenAfter, goesOnByTap, isNotSure, orderOf, type AskedQuestion } from '../questions.ts';
import styles from './steps.module.css';

export interface QuestionGroupProps {
  readonly asked: Pick<AskedQuestion, 'question' | 'order'> & Partial<Pick<AskedQuestion, 'followUps'>>;
  readonly answers: Readonly<Partial<Record<string, AnswerValue>>>;
  /** Sends `ANSWER`; null clears it. */
  readonly onAnswer: (question: string, value: AnswerValue | null) => void;
  /** The parent question's id when this is a follow-up. */
  readonly under?: string;
  /** A pointer tap chose a single answer that opens no follow-up, on a question that goes on by a tap: go on. */
  readonly onTapped?: (() => void) | undefined;
  /** The collections shown: which library picture and note an option carries. Without it an option shows words and its illustration only. */
  readonly collections?: readonly Collection[] | undefined;
}

const t = en.consult.questions;
/** The smallest picture the library ships; a tile is never wider. */
const TILE_WIDTH = 480;

/**
 * Short option labels sit two to a row, and so do pictures, to be compared; others one per row. Never swatches,
 * however short their words: a swatch sits beside its label, which leaves no room for a second tile on a phone.
 */
const SHORT_LABEL = 18;
const isSwatch = (o: QuestionOption): boolean => 'illustration' in o && o.illustration.startsWith('q-swatch');
const twoPerRow = (q: Question): boolean =>
  !q.options.some(isSwatch) && (q.options.every((o) => o.label.length <= SHORT_LABEL) || q.options.some((o) => 'picture' in o || 'illustration' in o));
/** The URL of an option's picture: the file the build resolved, or the library look of the first collection shown that has one. */
function pictureOf(o: ShippedOption | undefined, collections: readonly Collection[] = []): string | undefined {
  if (o?.illustration_file !== undefined) return `${import.meta.env.BASE_URL}illustrations/${o.illustration_file}`;
  const key = o && 'picture' in o ? collections.flatMap((c) => o.picture?.[c] ?? [])[0] : undefined;
  return key === undefined ? undefined : pictureUrl(key, TILE_WIDTH);
}
/** The note an option carries for someone shown only one collection. */
function noteOf(o: QuestionOption | undefined, [only, other]: readonly Collection[] = []): string | undefined {
  return o && 'note' in o && only !== undefined && other === undefined ? o.note[only] : undefined;
}

export function QuestionGroup({ asked, answers, onAnswer, under, onTapped, collections }: QuestionGroupProps) {
  const { question, order, followUps } = asked;
  const [refused, setRefused] = useState(false);
  const answer = answers[question.id];
  const chosen = answer?.chosen ?? [];
  const picked = chosen.filter((i) => question.options[i] && !isNotSure(question.options[i])).length;
  const open = [...(followUps?.entries() ?? [])].filter(([i]) => chosen.includes(i));
  return (
    <div className={under === undefined ? undefined : styles.followUp}>
      <OptionGroup legend={question.prompt} {...(question.help === undefined ? {} : { hint: question.help })} twoPerRow={twoPerRow(question)} large={under === undefined}>
        {order.map((i) => (
          <OptionTile
            key={i}
            name={question.id}
            value={String(i)}
            label={question.options[i]?.label ?? ''}
            note={noteOf(question.options[i], collections)}
            checked={chosen.includes(i)}
            multiple={question.type !== 'single'}
            image={pictureOf(question.options[i], collections)}
            onChange={() => {
              const next = chosenAfter(question, answer, i, under);
              setRefused(next === answer);
              if (next !== answer) onAnswer(question.id, next);
            }}
            onTap={goesOnByTap(question) && !followUps?.has(i) ? onTapped : undefined}
          />
        ))}
      </OptionGroup>
      {question.max !== undefined && <LiveRegion className={styles.count} message={t.limit(refused, picked, question.max)} />}
      {open.map(([i, next]) => (
        <QuestionGroup key={i} asked={{ question: next, order: orderOf(next) }} answers={answers} onAnswer={onAnswer} under={question.id} onTapped={onTapped} collections={collections} />
      ))}
    </div>
  );
}
