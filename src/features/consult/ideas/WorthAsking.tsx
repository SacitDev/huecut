/**
 * "Worth asking a colourist about": colour looks offered after the matches when those fall short, kept apart from them, each
 * with the one thing a colourist would have to judge and its journey label. One of them can be added to the person's list.
 */
import { useId, useMemo } from 'react';
import type { Compromise } from '../../../domain/engine/recommend.ts';
import { asItemId } from '../../../domain/ids.ts';
import { MAX_IDEAS } from '../../../machine/consult.types.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { picturesOf } from '../../shared/pictures.ts';
import { IdeaPicture } from './IdeaCard.tsx';
import { Journey } from './IdeaParts.tsx';
import { entryOf } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

function AskCard({ s, compromise, headingId }: { readonly s: IdeasScreen; readonly compromise: Compromise; readonly headingId: string }) {
  const { idea, why } = compromise;
  const id = asItemId(idea.id);
  const nameId = useId();
  const { library } = s.context.content;
  const entry = entryOf(library, id);
  const sheetOf = s.port.selectors.stylistSheet(s.context, id);
  const sheet = useMemo(() => sheetOf(s.details.of), [sheetOf, s.details]);
  const pictures = useMemo(() => (entry ? picturesOf(entry, library.models) : []), [entry, library]);
  if (!entry) return null;
  const add = () => {
    s.port.send({ type: 'SHORTLIST.ADD', id });
    s.announce(t.worthAsking.added(entry.name));
    s.focusAfter(() => document.getElementById(headingId));
  };
  return (
    <article className={styles.card} data-idea={id} aria-labelledby={nameId}>
      <IdeaPicture s={s} entry={entry} pictures={pictures} />
      <div className={styles.body}>
        <h3 id={nameId} className={styles.name} tabIndex={-1}>{entry.name}</h3>
        <p>{t.worthAsking.why[why]}</p>
        <Journey s={s} id={id} idea={idea} section={sheet?.sections.find((x) => x.id === 'journey') ?? null} open={[]} shared={[]} />
        <div className={styles.actions}>
          <Button variant="secondary" unavailable={s.context.shortlist.added.length >= MAX_IDEAS} describedBy={nameId} onClick={add}>{t.worthAsking.add}</Button>
        </div>
      </div>
    </article>
  );
}

export function WorthAsking({ s }: { readonly s: IdeasScreen }) {
  const headingId = useId();
  const offered = s.engine.worthAsking.filter((c) => !s.list.ids.includes(asItemId(c.idea.id)));
  if (offered.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.sectionTitle} tabIndex={-1}>{t.worthAsking.title}</h2>
      <p>{t.worthAsking.intro}</p>
      <ol className={styles.list}>
        {offered.map((c) => <li key={c.idea.id}><AskCard s={s} compromise={c} headingId={headingId} /></li>)}
      </ol>
    </section>
  );
}
