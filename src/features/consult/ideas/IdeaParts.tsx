/**
 * The words on one idea: an added idea's misfit with its reason, a cut's feasibility,
 * a colour look's journey label with why, what to ask and its reminders ("Uncertain. Answer *question* to know" opens
 * that question in place), up to 3 "Because…" lines, notes, beard pairings and "Depends on your hair texture".
 */
import type { Idea } from '../../../domain/engine/recommend.ts';
import type { Question } from '../../../domain/content/types.ts';
import type { JourneyLabel } from '../../../domain/content/values.ts';
import type { ItemId } from '../../../domain/ids.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import type { SheetRow, SheetSection } from '../../../domain/render-model/stylist-sheet.ts';
import { en } from '../../../strings/en.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Icon, type IconName } from '../../../ui/icons.tsx';
import { questionsFor, type BeardPairing } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

/** Each journey label has its own neutral icon shape, in the text colour (no traffic lights). */
const LABEL_ICON: Readonly<Record<JourneyLabel, IconName>> = { plausible: 'check', uncertain: 'question', needs_professional: 'info' };

/** An added idea a stated limit rules out: the reason, and that it stays unless the person removes it. */
export function Misfit({ idea }: { readonly idea: Idea }) {
  if (idea.excluded.length === 0) return null;
  return (
    <div className={styles.notice}>
      <p>{t.excluded}</p>
      <ul className={styles.lines}>
        {idea.excluded.map((x) => <li key={x.ruleId}>{x.because}</li>)}
      </ul>
      <p className={styles.small}>{t.excludedKeep}</p>
    </div>
  );
}

/** One "Answer ‘question’" button per question; it opens that question in place on this idea. */
function Openers({ s, id, questions, words }: { readonly s: IdeasScreen; readonly id: ItemId; readonly questions: readonly Question[]; readonly words: (prompt: string) => string }) {
  return questions.map((q) => (
    <Button key={q.id} variant="text" className={styles.opener} onClick={() => { s.ask({ idea: id, question: q.id }); }}>
      {words(q.prompt)}
    </Button>
  ));
}

export interface JourneyProps {
  readonly s: IdeasScreen;
  readonly id: ItemId;
  readonly idea: Idea;
  /** The stylist sheet's "Before you book" section: why, what to ask (with the health line) and the reminders. */
  readonly section: SheetSection | null;
  readonly open: readonly Question[];
  /** Reminders said once above the Colours; left off this card. */
  readonly shared: readonly string[];
}

/** One label and its text. */
function Row({ row }: { readonly row: SheetRow }) {
  return (
    <div>
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    </div>
  );
}

/** A colour idea's journey: the label and the first Why line, the rest behind More; never "Plausible" on a guess; after a past reaction, the referral's reason only. */
export function Journey({ s, id, idea, section, open, shared }: JourneyProps) {
  const label = idea.referral ? 'needs_professional' : (idea.label ?? 'uncertain');
  const rows = (section?.rows ?? []).filter((r) => r.label !== SHOWN.sheet.rows.label && !(r.label === SHOWN.sheet.rows.reminder && shared.includes(r.value)));
  const [why, ...rest] = rows;
  return (
    <div className={styles.journey}>
      <p className={styles.label}>
        <Icon name={LABEL_ICON[label]} className={styles.labelIcon} />
        <strong>{SHOWN.sheet.journeyLabels[label]}</strong>
      </p>
      {label === 'uncertain' && <Openers s={s} id={id} questions={open.slice(0, 1)} words={t.answerToKnow} />}
      {why && <dl className={styles.rows}><Row row={why} /></dl>}
      {(rest.length > 0 || open.length > 1) && (
        <details className={styles.journeyMore}>
          <summary className={styles.journeyMoreSummary}>{t.moreAboutLook}</summary>
          {label === 'uncertain' && <Openers s={s} id={id} questions={open.slice(1)} words={t.answerToKnow} />}
          <dl className={styles.rows}>
            {rest.map((r) => <Row key={`${r.label}:${r.value}`} row={r} />)}
          </dl>
        </details>
      )}
    </div>
  );
}

/** Up to 3 "Because…" lines, each naming only what this look has; none after the referral replaced the look. */
export function Because({ idea }: { readonly idea: Idea }) {
  if (idea.referral || idea.reasons.length === 0) return null;
  return (
    <div className={styles.because}>
      <p className={styles.small}>{t.because}</p>
      <ul className={styles.lines}>
        {idea.reasons.map((r) => <li key={r.ruleId}>{r.text}</li>)}
      </ul>
    </div>
  );
}

/** The item's notes (cautions and design notes whose `on` matched), and a men's cut's beard pairings with their notes. */
export function Notes({ idea, beards }: { readonly idea: Idea; readonly beards: readonly BeardPairing[] }) {
  const notes = idea.referral ? [] : idea.notes.map((n) => n.because);
  if (notes.length === 0 && beards.length === 0) return null;
  return (
    <ul className={styles.lines}>
      {notes.map((n) => <li key={n}>{n}</li>)}
      {beards.length > 0 && <li>{`${en.explore.detail.pairs.beards}: ${beards.map((b) => b.name).join(', ')}.`}</li>}
      {beards.flatMap((b) => b.notes.map((n) => <li key={`${b.id}:${n}`}>{`${b.name}: ${n}`}</li>))}
    </ul>
  );
}

/**
 * "Depends on your hair texture": the first unanswered fact that would decide more (registry order), with its question
 * to open in place unless the journey line already offers it. None after the referral replaced the look.
 */
export function Depends({ s, id, idea, open }: { readonly s: IdeasScreen; readonly id: ItemId; readonly idea: Idea; readonly open: readonly Question[] }) {
  const fact = idea.dependsOn[0];
  if (fact === undefined || idea.referral) return null;
  const question = questionsFor(s.context.content.consult.questions, [fact])[0] ?? null;
  const noun = t.nouns[fact];
  const words = noun === undefined ? (question ? t.dependsOnAnswer(question.prompt) : null) : t.dependsOn(noun);
  if (words === null) return null;
  return (
    <div className={styles.depends}>
      <p className={styles.small}>{words}</p>
      {question && !open.includes(question) && <Openers s={s} id={id} questions={[question]} words={t.answer} />}
    </div>
  );
}
