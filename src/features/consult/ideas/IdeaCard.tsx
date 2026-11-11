/**
 * One idea on the list: the picture whole on its matching model, "Our pick" or "Also worth trying", the
 * name, its words (IdeaParts), a question open in place, and its actions: "See it on me" on a colour look, "Show your
 * stylist", then Move earlier / Move later (dragging the card does the same) and Remove as quiet text buttons on one row.
 */
import { useId, useMemo, type DragEvent } from 'react';
import type { CutIndexEntry, LookIndexEntry } from '../../../domain/content/output.ts';
import type { Idea } from '../../../domain/engine/recommend.ts';
import type { ItemId } from '../../../domain/ids.ts';
import type { StylistSheet } from '../../../domain/render-model/stylist-sheet.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { Arch } from '../../../ui/components/Arch.tsx';
import { Button } from '../../../ui/components/Button.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import { AskInPlace } from './AskInPlace.tsx';
import { Because, Depends, Journey, Misfit, Notes } from './IdeaParts.tsx';
import { picturesOf, type LibraryPicture } from '../../shared/pictures.ts';
import { StylistButton } from '../../shared/StylistButton.tsx';
import { beardPairings, entryOf, feasibilityText, ideaOf, moveTo, pictureKeyFor, previewPhoto, questionsFor, type Section } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import { SeeItOnMe } from './SeeItOnMe.tsx';
import { journeyLabelOf } from '../try-on/sheets.ts';
import styles from './ideas.module.css';

/** The drag payload type: only cards of this list are accepted as drops. */
const DRAG_TYPE = 'application/x-huecut-idea';
const PICTURE_SIZES = '(width >= 840px) 220px, 40vw';

export interface CardProps {
  readonly s: IdeasScreen;
  readonly id: ItemId;
  readonly section: Section;
  /** Sends `SHORTLIST.MOVE` and says where the idea went; `button` keeps focus on the Move button pressed. */
  readonly move: (id: ItemId, to: number, button: 'earlier' | 'later' | null) => void;
  readonly remove: (id: ItemId, name: string) => void;
  /** The reminders said once above the section, left off this card. */
  readonly shared: readonly string[];
}

/** What one card's parts share once the idea and its library entry are known. */
interface Known extends CardProps {
  readonly idea: Idea;
  readonly entry: CutIndexEntry | LookIndexEntry;
  readonly nameId: string;
  readonly sheet: StylistSheet | null;
  readonly pictures: readonly LibraryPicture[];
}

/** Dragging a card onto another of the same section takes that card's place (the buttons do the same, WCAG 2.5.7). */
function dragProps({ s, id, section, move }: CardProps) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData(DRAG_TYPE, id);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault();
    },
    onDrop: (e: DragEvent) => {
      const from = section.ids.find((x) => x === e.dataTransfer.getData(DRAG_TYPE));
      if (from === undefined || from === id) return;
      e.preventDefault();
      move(from, s.list.ids.indexOf(id), null);
    },
  };
}

function rankWords({ s, id, idea }: Known): string {
  if (s.list.own.includes(id)) return t.rank.yours;
  return s.engine.picks.find((p) => p.kind === idea.kind)?.id === id ? t.rank.ourPick : t.rank.alsoWorth;
}

/** The idea's picture on the matching model; none for an item without pictures. */
export function IdeaPicture({ s, entry, pictures }: Pick<Known, 's' | 'entry' | 'pictures'>) {
  const key = pictureKeyFor(entry, s.context.content.library.models, s.context.prefs.collections, s.facts['hair.texture']?.value);
  const p = pictures.find((x) => x.key === key);
  if (!p) return null;
  return (
    <Arch ratio={p.width / p.height} placeholder={p.placeholder} className={styles.picture}>
      <img src={p.src} srcSet={p.srcSet} sizes={PICTURE_SIZES} width={p.width} height={p.height} alt={p.alt} loading="lazy" decoding="async" />
    </Arch>
  );
}

/** The idea's words; a colour look's journey reads its "Before you book" section from the idea's stylist sheet. */
function Words({ s, id, idea, entry, sheet, shared }: Known) {
  const file = s.context.content.consult.questions;
  const beards = entry.kind === 'cut' ? beardPairings(entry, s.context.content.library, s.context.content.consult.rules.beard, s.facts, idea.beards) : [];
  const open = questionsFor(file, idea.journey?.dependsOn ?? []);
  const feasible = feasibilityText(idea.feasibility, idea.poorFit, idea.tradeOffs);
  return (
    <>
      <Misfit idea={idea} />
      {feasible !== null && <p>{feasible}</p>}
      {idea.kind === 'colour' && <Journey s={s} id={id} idea={idea} section={sheet?.sections.find((x) => x.id === 'journey') ?? null} open={open} shared={shared} />}
      <Because idea={idea} />
      <Notes idea={idea} beards={beards} />
      <Depends s={s} id={id} idea={idea} open={open} />
    </>
  );
}

/** "See it on me" (a colour look, once the main photo's hair outline is ready), the stylist sheet, Move and Remove. */
function Actions({ s, id, section, idea, entry, nameId, sheet, pictures, move, remove }: Known) {
  const photo = idea.kind === 'colour' && !idea.referral ? previewPhoto(s.context) : null;
  const earlier = moveTo(s.list.ids, section.ids, id, -1);
  const later = moveTo(s.list.ids, section.ids, id, 1);
  return (
    <div className={styles.actions}>
      {photo !== null && <SeeItOnMe photoId={photo} lookId={id} describedBy={nameId} />}
      {sheet ? <StylistButton sheet={sheet} pictures={pictures} /> : s.details.failed(id) ? <p className={styles.small}>{t.detailsFailed}</p> : <Progress label={t.detailsLoading} value={null} />}
      {/* Four outlined rows made each card a screen tall on a phone. */}
      <div className={styles.moves}>
        <span data-move="earlier">
          <Button variant="text" icon="arrowUp" unavailable={earlier === null} describedBy={nameId} onClick={() => { if (earlier !== null) move(id, earlier, 'earlier'); }}>
            {t.moveEarlier}
          </Button>
        </span>
        <span data-move="later">
          <Button variant="text" icon="arrowDown" unavailable={later === null} describedBy={nameId} onClick={() => { if (later !== null) move(id, later, 'later'); }}>
            {t.moveLater}
          </Button>
        </span>
        <Button variant="text" icon="trash" describedBy={nameId} onClick={() => { remove(id, entry.name); }}>
          {t.remove}
        </Button>
      </div>
    </div>
  );
}

export function IdeaCard(props: CardProps) {
  const { s, id } = props;
  const nameId = useId();
  const look = s.looks.find((l) => l === id || l[0] === id) ?? id;
  const sheetOf = s.port.selectors.stylistSheet(s.context, look);
  const sheet = useMemo(() => sheetOf(s.details.of), [sheetOf, s.details]);
  const entry = entryOf(s.context.content.library, id);
  const { library } = s.context.content;
  const colour = typeof look === 'string' ? null : entryOf(library, look[1]);
  // The pair's sheet shows both looks' pictures: the cut's views, then the colour's.
  const pictures = useMemo(() => (entry ? [...picturesOf(entry, library.models), ...(colour ? picturesOf(colour, library.models) : [])] : []), [entry, colour, library]);
  const idea = ideaOf(s.engine, id);
  if (!idea || !entry) return null;
  const known: Known = { ...props, idea, entry, nameId, sheet, pictures };
  const asking = s.asking?.idea === id ? s.context.content.consult.questions.questions.find((q) => q.id === s.asking?.question) : undefined;
  const done = () => {
    s.ask(null);
    s.focusAfter(() => document.getElementById(nameId));
  };
  return (
    <article className={styles.card} data-idea={id} aria-labelledby={nameId} {...dragProps(props)}>
      <IdeaPicture {...known} />
      <div className={styles.body}>
        <p className={styles.rank}>{rankWords(known)}</p>
        <h3 id={nameId} className={styles.name} tabIndex={-1}>
          {entry.name}
        </h3>
        {colour && <p>{t.colours.withColour(colour.name, journeyLabelOf(sheet) ?? '')}</p>}
        <Words {...known} />
        {asking && <AskInPlace s={s} question={asking} onDone={done} />}
        <Actions {...known} />
      </div>
    </article>
  );
}
