/**
 * Board (`#/my-look/board`): one tile per idea in list order, the pair's first when its
 * picture exists, with the app's names; "Save board" paints the 2160 x 2700 board (Huecut and its link in the footer) and
 * saves it through the share sheet or a download; the empty state; "Tell us how it went".
 */
import { useMemo, useState } from 'react';
import { asItemId, lookOf, slotKey } from '../../../domain/ids.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import { buildBoard, type Board as BoardModel } from '../../../domain/render-model/board.ts';
import { isUsable, slotPhotoOf } from '../../../machine/consult.selectors.ts';
import { boardItems } from '../../../platform/render/export.ts';
import { en } from '../../../strings/en.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button, LinkButton } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { BoardTile } from '../try-on/BoardTile.tsx';
import { boardInput, isPairTile } from '../try-on/logic.ts';
import { namedOf } from '../try-on/names.ts';
import { savePainted } from '../try-on/paint-pictures.ts';
import { tileSheet } from '../try-on/sheets.ts';
import { useDetails } from '../try-on/useDetails.ts';
import { StepLayout } from '../StepLayout.tsx';
import { stepHref, type StepProps } from '../useConsult.ts';
import { cx } from '../../../ui/cx.ts';
import styles from '../try-on/try-on.module.css';

const b = tryOnCopy.board;

export function Board({ port, view }: StepProps) {
  const c = view.context;
  const { selectors } = port;
  const tiles = selectors.boardLayout(c);
  const library = c.content.library;
  const pair = selectors.pairIdea(c);
  const board = useMemo(() => buildBoard(boardInput(tiles, namedOf(library), isPairTile(pair)), SHOWN), [tiles, library, pair]);
  const details = useDetails(tiles.flatMap((t) => t.ideas));
  const photo = c.photos.some((p) => p.id === c.mainPhotoId && isUsable(p)) ? c.mainPhotoId : null;
  const slotsOf = slotPhotoOf(c);
  const tool = port.hairOnly;
  return (
    <StepLayout title={en.consult.steps.board} onBack={port.back} wide actions={board.empty ? undefined : <SaveBoard board={board} />}>
      {board.empty ? (
        <div className={styles.stack}>
          <p>{b.empty}</p>
          <LinkButton icon="image" href={stepHref('try-on')} onClick={() => { port.send({ type: 'PREFS.SET', tab: 'pictures' }); }}>
            {b.addPictures}
          </LinkButton>
        </div>
      ) : (
        <ul className={styles.board} aria-label={b.tilesLabel}>
          {board.tiles.map((tile) => (
            <BoardTile
              key={tile.key}
              tile={tile}
              slotKey={slotKey(lookOf(tile.key), slotsOf)}
              photo={photo}
              tool={tool}
              sheet={details.status === 'ready' ? tileSheet(port, c, details.of, tile.ideas.map(asItemId)) : null}
              library={library}
              send={port.send}
            />
          ))}
        </ul>
      )}
      <Feedback />
    </StepLayout>
  );
}

function SaveBoard({ board }: { readonly board: BoardModel }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      // The board shows AI pictures only (library pictures belong to the example), so no library file is needed.
      const outcome = await savePainted(boardItems(board), board.export, { kind: 'board', title: board.title }, () => undefined);
      setStatus(outcome === 'shared' ? b.shared : outcome === 'downloaded' ? b.downloaded : '');
    } catch {
      setStatus(b.saveFailed);
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Button icon="downloadSimple" busy={saving} busyText={b.saving} onClick={() => void save()}>
        {b.save}
      </Button>
      <LiveRegion message={status} className={cx(styles.status)} />
    </>
  );
}

function Feedback() {
  return (
    <p className={styles.small}>
      <a href={b.feedbackUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {b.feedback}
        <span className="visually-hidden"> {tryOnCopy.handoff.newTab}</span>
      </a>{' '}
      {b.feedbackHint}
    </p>
  );
}
