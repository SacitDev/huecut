/**
 * The list of ideas: "Cuts" then "Colours", each an ordered list of idea cards, with Move and Remove
 * sent to the machine (`SHORTLIST.MOVE`, `SHORTLIST.REMOVE`; the next pick takes a removed idea's place), said in the
 * screen's live region, and focus kept on the button pressed or moved to the idea now in the removed one's place.
 */
import { useId } from 'react';
import type { ItemId } from '../../../domain/ids.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { IdeaCard } from './IdeaCard.tsx';
import { entryOf, sharedReminders, type Section } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

function SectionList({ s, section }: { readonly s: IdeasScreen; readonly section: Section }) {
  const headingId = useId();
  const name = (id: ItemId): string => entryOf(s.context.content.library, id)?.name ?? id;
  const shared = section.kind === 'colour' ? sharedReminders(s.engine, section.ids) : [];
  const move = (id: ItemId, to: number, button: 'earlier' | 'later' | null) => {
    s.port.send({ type: 'SHORTLIST.MOVE', id, to, shown: s.list.ids });
    const after = s.list.ids.filter((x) => x !== id);
    const placed = [...after.slice(0, to), id, ...after.slice(to)].filter((x) => section.ids.includes(x));
    s.announce(t.moved(name(id), placed.indexOf(id) + 1, placed.length));
    if (button) s.focusAfter(() => document.querySelector(`[data-idea="${id}"] [data-move="${button}"] button`));
  };
  const remove = (id: ItemId, label: string) => {
    const at = section.ids.indexOf(id);
    s.port.send({ type: 'SHORTLIST.REMOVE', id });
    s.announce(t.removed(label));
    s.focusAfter(() => {
      const names = document.querySelectorAll<HTMLElement>(`#${CSS.escape(headingId)} ~ ol h3`);
      return names[Math.min(at, names.length - 1)] ?? document.getElementById(headingId);
    });
  };
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.sectionTitle} tabIndex={-1}>
        {t.sections[section.kind]}
      </h2>
      {shared.length > 0 && (
        <div className={styles.notice}>
          <h3 className={styles.pairTitle}>{t.beforeAnyColour}</h3>
          <ul className={styles.lines}>{shared.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
      <ol className={styles.list}>
        {section.ids.map((id) => (
          <li key={id}>
            <IdeaCard s={s} id={id} section={section} move={move} remove={remove} shared={shared} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export function IdeaSections({ s, sections }: { readonly s: IdeasScreen; readonly sections: readonly Section[] }) {
  return sections.map((section) => <SectionList key={section.kind} s={s} section={section} />);
}
