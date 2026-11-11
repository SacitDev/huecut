/**
 * My pictures: one "Add picture" slot per look and the pair, in board order, and the quick grids as the
 * secondary way to make several pictures at once. A look refused after a dye reaction gets no slot unless it already holds a picture.
 */
import { useId } from 'react';
import { asItemId, lookId, lookOf, slotKey, type PhotoId, type SlotKey } from '../../../domain/ids.ts';
import type { PromptPack } from '../../../domain/prompts/build.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import type { Board } from '../../../domain/render-model/board.ts';
import type { ConsultEvent, Grid, Pair, Slot } from '../../../machine/consult.types.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { GridCard } from './GridCard.tsx';
import { PictureSlot } from './PictureSlot.tsx';
import type { PromptCardProps } from './PromptCard.tsx';
import styles from './try-on.module.css';

const t = tryOnCopy.pictures;

export interface MyPicturesProps extends Pick<PromptCardProps, 'handoff' | 'photo' | 'referral'> {
  readonly pack: PromptPack;
  readonly board: Board;
  readonly pair: Pair | null;
  readonly grids: readonly Grid[];
  readonly slotsOf: PhotoId;
  readonly slots: Readonly<Partial<Record<SlotKey, Slot>>>;
  readonly nameOf: (id: string) => string;
  readonly send: (event: ConsultEvent) => void;
}

export function MyPictures(props: MyPicturesProps) {
  const { pack, board, pair, slotsOf, slots, nameOf, handoff, send } = props;
  const id = useId();
  const listId = useId();
  const refused = new Set([...pack.looks, ...(pair && pack.pair ? [{ id: lookId([pair.cut, pair.colour]), prompt: pack.pair }] : [])].filter((l) => !l.prompt.ok).map((l) => l.id));
  const key = (tile: string) => slotKey(lookOf(tile), slotsOf);
  const pairKey = pair && pack.pair?.ok && !slots[slotKey([pair.cut, pair.colour], slotsOf)] ? slotKey([pair.cut, pair.colour], slotsOf) : null;
  const tiles = board.tiles.filter((tile) => !refused.has(tile.key) || tile.picture !== null);
  return (
    <div className={styles.section}>
      <p>{t.intro}</p>
      {handoff === 'touch' && <p className={styles.small}>{t.touchHow}</p>}
      <section className={styles.section} aria-labelledby={listId}>
        <h2 id={listId}>{t.list}</h2>
        <div className={styles.looks}>
          {pair && pairKey && <PictureSlotCard slot={slots[pairKey]} slotKey={pairKey} name={SHOWN.board.pairName(nameOf(asItemId(pair.cut)), nameOf(asItemId(pair.colour)))} desktop={handoff === 'desktop'} send={send} />}
          {tiles.map((tile) => (
            <PictureSlotCard key={tile.key} slot={slots[key(tile.key)]} slotKey={key(tile.key)} name={tile.name} desktop={handoff === 'desktop'} send={send} />
          ))}
        </div>
      </section>
      {pack.grids.length > 0 && (
        <section className={styles.section} aria-labelledby={id}>
          <h2 id={id}>{tryOnCopy.grids.title}</h2>
          <p>{tryOnCopy.grids.intro}</p>
          {pack.grids.map((g, i) => (
            <GridCard key={g.plan.ideas.map((x) => x.id).join('|')} {...props} index={i} total={pack.grids.length} plan={g.plan} prompt={g.prompt} record={props.grids.find((r) => r.grid === i)} />
          ))}
        </section>
      )}
    </div>
  );
}

function PictureSlotCard(props: Parameters<typeof PictureSlot>[0]) {
  const id = useId();
  return (
    <section className={styles.card} aria-labelledby={id}>
      <h3 id={id}>{props.name}</h3>
      <PictureSlot {...props} />
    </section>
  );
}
