/**
 * "Try together": once the list holds a cut and a colour look, the person picks one of each in a
 * sheet (`PAIR.SET`); the pair then shows first, "Together: …, with …", with its colour part's journey label, its one
 * stylist sheet, Change and Remove (`PAIR.CLEAR`). The machine drops the pair when either idea leaves the list.
 */
import { useId, useMemo, useRef, useState } from 'react';
import type { ItemId } from '../../../domain/ids.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import type { Pair } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import { picturesOf } from '../../shared/pictures.ts';
import { StylistButton } from '../../shared/StylistButton.tsx';
import { entryOf, ideaOf } from './model.ts';

import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

const t = ideasCopy.together;

const nameOf = (s: IdeasScreen, id: ItemId): string => entryOf(s.context.content.library, id)?.name ?? id;

/** The pair's one stylist sheet, with the colour look's safety view and the pair's AI picture on the main photo. */
function PairStylist({ s, pair }: { readonly s: IdeasScreen; readonly pair: Pair }) {
  const { library } = s.context.content;
  const sheet = useMemo(() => s.port.selectors.stylistSheet(s.context, [pair.cut, pair.colour])(s.details.of), [s.port, s.context, pair, s.details]);
  const pictures = useMemo(() => [pair.cut, pair.colour].flatMap((id) => {
    const entry = entryOf(library, id);
    return entry ? picturesOf(entry, library.models) : [];
  }), [pair, library]);
  return sheet ? <StylistButton sheet={sheet} pictures={pictures} /> : null;
}

/** The picker: one cut and one colour look from the list, as two radio groups; nothing changes until "Try these together". */
function PairPicker({ s, draft, setDraft, onClose }: { readonly s: IdeasScreen; readonly draft: Pair | null; readonly setDraft: (p: Pair) => void; readonly onClose: () => void }) {
  const save = () => {
    if (draft) s.port.send({ type: 'PAIR.SET', cut: draft.cut, colour: draft.colour });
    s.announce(t.saved);
    onClose();
  };
  return (
    <Sheet open={draft !== null} title={t.title} onClose={onClose} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
      <p className={styles.small}>{t.hint}</p>
      {draft && (
        <>
          <OptionGroup legend={t.cut}>
            {s.list.cuts.map((id) => <OptionTile key={id} name="pair-cut" value={id} label={nameOf(s, id)} checked={draft.cut === id} onChange={(cut) => { setDraft({ ...draft, cut }); }} />)}
          </OptionGroup>
          <OptionGroup legend={t.colour}>
            {s.list.colours.map((id) => <OptionTile key={id} name="pair-colour" value={id} label={nameOf(s, id)} checked={draft.colour === id} onChange={(colour) => { setDraft({ ...draft, colour }); }} />)}
          </OptionGroup>
          <Button onClick={save}>{t.set}</Button>
        </>
      )}
    </Sheet>
  );
}

/**
 * "Try together" and "Change" are one button in one place, so the picker hands focus back to it when it closes; Remove
 * puts focus on it too.
 */
/** The pair's title and its colour part's journey label; the referral wins, as on every colour idea. */
function PairHead({ s, pair, titleId }: { readonly s: IdeasScreen; readonly pair: Pair; readonly titleId: string }) {
  const colour = ideaOf(s.engine, pair.colour);
  // After a referral the colour is on no list, and the referral replaces it.
  const label = colour?.referral || s.engine.referral ? 'needs_professional' : (colour?.label ?? 'uncertain');
  return (
    <>
      <h2 id={titleId} className={styles.pairTitle}>{SHOWN.sheet.pairTitle(nameOf(s, pair.cut), nameOf(s, pair.colour))}</h2>
      <p>{`${t.colour}: ${SHOWN.sheet.journeyLabels[label]}`}</p>
    </>
  );
}

export function PairPanel({ s }: { readonly s: IdeasScreen }) {
  const [draft, setDraft] = useState<Pair | null>(null);
  const titleId = useId();
  const opener = useRef<HTMLDivElement>(null);
  const pair = s.port.selectors.pairIdea(s.context);
  const [cut] = s.list.cuts;
  const [colour] = s.list.colours;
  // After a referral no colour is listed, but a pair the person made stays, blocked, until they remove it.
  if (cut === undefined || (colour === undefined && pair === null)) return null;
  const clear = () => {
    s.port.send({ type: 'PAIR.CLEAR' });
    s.announce(t.removed);
    s.focusAfter(() => opener.current?.querySelector('button') ?? document.querySelector('h1'));
  };
  // The pair's title grows above the buttons while the picker is open; focus() alone may leave them under the sticky
  // bars, so they are scrolled into view within the page's scroll padding (WCAG 2.4.11).
  const close = () => {
    setDraft(null);
    opener.current?.scrollIntoView({ block: 'nearest' });
  };
  return (
    <section className={pair ? styles.pair : styles.stack} aria-labelledby={pair ? titleId : undefined}>
      {pair && <PairHead s={s} pair={pair} titleId={titleId} />}
      <div ref={opener} className={styles.actions}>
        {colour !== undefined && <Button variant="secondary" onClick={() => { setDraft(pair ?? { cut, colour }); }}>{pair ? t.change : t.open}</Button>}
        {pair && <PairStylist s={s} pair={pair} />}
        {pair && <Button variant="text" icon="x" describedBy={titleId} onClick={clear}>{t.remove}</Button>}
      </div>
      <PairPicker s={s} draft={draft} setDraft={setDraft} onClose={close} />
    </section>
  );
}
