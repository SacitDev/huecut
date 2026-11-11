/**
 * One quick grid: its prompt, "Add this picture", the cut into tiles and the
 * confirmation of which look each tile shows (Move earlier / Move later, by keyboard too). Only "Attach these names"
 * sends `GRID.CONFIRM`; each named tile then becomes its look's picture unless the look already has one. "Tiles look
 * wrong?" confirms no names, so the person uses one picture per look instead.
 */
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { lookId, type LookId, type PhotoId, type PictureId, type SlotKey } from '../../../domain/ids.ts';
import { lookName, type Built, type GridPlan } from '../../../domain/prompts/build.ts';
import type { ConsultEvent, Grid, Slot } from '../../../machine/consult.types.ts';
import * as resources from '../../../platform/resources.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { OnCard } from './Cards.tsx';
import { cutGrid, type CutProblem } from './grid-picture.ts';
import { gridStage, moved, tileFills } from './logic.ts';
import { PictureDrop } from './PictureSlot.tsx';
import { PromptCard, type PromptCardProps } from './PromptCard.tsx';
import { cx } from '../../../ui/cx.ts';
import styles from './try-on.module.css';

const t = tryOnCopy.grids;

export interface GridCardProps extends Omit<PromptCardProps, 'prompt'> {
  /** The grid's index in the prompt pack: its number in the machine (`GRID.ADD`, `GRID.CONFIRM`). */
  readonly index: number;
  /** How many grids there are, for its heading. */
  readonly total: number;
  readonly plan: GridPlan;
  readonly prompt: Built;
  readonly record: Grid | undefined;
  /** The main photo the slots belong to. */
  readonly slotsOf: PhotoId;
  readonly slots: Readonly<Partial<Record<SlotKey, Slot>>>;
  readonly nameOf: (id: string) => string;
  readonly send: (event: ConsultEvent) => void;
}

export function GridCard(props: GridCardProps) {
  const { index, total, plan, prompt, record, photo, handoff, referral, nameOf, send } = props;
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const picture = record ? resources.picture(record.pictureId) : undefined;
  const stage = gridStage(record, picture !== undefined, plan.ideas.map((i) => i.id));
  const title = t.name(index + 1, total, plan.ideas.length, plan.kind);
  const before = useRef(stage);
  useEffect(() => {
    // The confirmation's buttons are gone once it ends: focus goes to the grid's heading, not to the page.
    if (before.current === 'confirming' && stage !== 'confirming') heading.current?.focus();
    before.current = stage;
  }, [stage]);
  const onPicture = (file: File) => {
    send({ type: 'GRID.ADD', grid: index, file: resources.addPicture(file) });
    return t.cutting;
  };
  return (
    <section className={styles.card} aria-labelledby={id}>
      <h3 id={id} ref={heading} tabIndex={-1}>
        {title}
      </h3>
      <p className={styles.small}>{t.asks}</p>
      <ol className={styles.list}>
        {plan.ideas.map((i) => (
          <li key={i.id}>{nameOf(i.id)} <OnCard shown={nameOf(i.id)} printed={lookName(i)} /></li>
        ))}
      </ol>
      <PromptCard prompt={prompt} handoff={handoff} photo={photo} referral={referral} />
      {stage === 'confirming' && picture && <Confirm {...props} picture={picture} />}
      {stage === 'named' && record && <Named record={record} nameOf={nameOf} picture={picture} alt={t.pictureAlt(title)} />}
      {stage === 'lost' && <p className={styles.small}>{t.lost}</p>}
      <LiveRegion message={stage === 'per-idea' ? t.perIdea : ''} className={cx(styles.status)} />
      {stage !== 'confirming' && prompt.ok && (
        <PictureDrop label={title} button={stage === 'empty' ? t.add : t.replace} desktop={handoff === 'desktop'} onPicture={onPicture} />
      )}
    </section>
  );
}

interface NamedProps {
  readonly record: Grid;
  readonly nameOf: (id: string) => string;
  readonly picture: Blob | undefined;
  readonly alt: string;
}

/** The grid as named: the picture whole (while it is still on this device) and each tile's look. */
function Named({ record, nameOf, picture, alt }: NamedProps) {
  const url = resources.useObjectUrl(picture);
  return (
    <div className={styles.stack}>
      <p>{t.attached}</p>
      {url !== null && <img className={styles.gridPicture} src={url} alt={alt} />}
      <ol className={styles.list}>
        {record.ideas.map((idea, i) => (
          <li key={idea}>{t.tileNamed(i + 1, nameOf(idea))}</li>
        ))}
      </ol>
    </div>
  );
}

type Cut =
  | { readonly state: 'cutting' }
  | { readonly state: 'cut'; readonly tiles: readonly PictureId[] }
  | { readonly state: 'failed'; readonly problem: CutProblem };

/** Cuts the picture once; when the confirmation ends, every tile not handed to the machine (`kept`) is disposed. */
function useTiles(picture: Blob, layout: GridPlan, kept: RefObject<Set<PictureId>>): Cut {
  const [cut, setCut] = useState<{ readonly of: Blob; readonly cut: Cut } | null>(null);
  const { rows, columns } = layout;
  useEffect(() => {
    let live = true;
    let tiles: PictureId[] = [];
    const keep = kept.current;
    void cutGrid(picture, { rows, columns }).then((r) => {
      if (r.ok) tiles = r.value;
      if (!live) resources.disposePictures(tiles);
      else setCut({ of: picture, cut: r.ok ? { state: 'cut', tiles } : { state: 'failed', problem: r.error } });
    });
    return () => {
      live = false;
      resources.disposePictures(tiles.filter((p) => !keep.has(p)));
    };
  }, [picture, rows, columns, kept]);
  return cut?.of === picture ? cut.cut : { state: 'cutting' };
}

function Confirm({ index, plan, picture, slotsOf, slots, nameOf, send }: GridCardProps & { readonly picture: Blob }) {
  const kept = useRef(new Set<PictureId>());
  const cut = useTiles(picture, plan, kept);
  const [order, setOrder] = useState<LookId[]>(() => plan.ideas.map((i) => lookId(i.id)));
  const [message, setMessage] = useState('');
  const perIdea = () => {
    send({ type: 'GRID.CONFIRM', grid: index, order: [] });
  };
  if (cut.state !== 'cut') {
    return (
      <div className={styles.stack}>
        <p>{cut.state === 'cutting' ? t.cutting : t.splitFailed(plan.ideas.length)}</p>
        {cut.state === 'failed' && (
          <Button variant="text" onClick={perIdea}>
            {t.tilesWrong}
          </Button>
        )}
      </div>
    );
  }
  const attach = () => {
    const fills = tileFills(order, cut.tiles, slotsOf, slots);
    for (const f of fills) kept.current.add(f.picture);
    send({ type: 'GRID.CONFIRM', grid: index, order });
    for (const f of fills) send({ type: 'SLOT.ADD', key: f.key, file: f.picture });
  };
  const move = (i: number, step: -1 | 1) => {
    setOrder(moved(order, i, step));
    setMessage(t.moved(nameOf(order[i] ?? ''), i + step + 1));
  };
  return (
    <div className={styles.stack}>
      <h4 className={styles.strong}>{t.confirmTitle}</h4>
      <p className={styles.small}>{t.confirmHint}</p>
      <ConfirmRows tiles={cut.tiles} order={order} nameOf={nameOf} onMove={move} />
      <LiveRegion message={message} className={cx(styles.status)} />
      <div className={styles.buttons}>
        <Button icon="check" onClick={attach}>
          {t.confirm}
        </Button>
        <Button variant="text" onClick={perIdea}>
          {t.tilesWrong}
        </Button>
      </div>
    </div>
  );
}

interface RowsProps {
  readonly tiles: readonly PictureId[];
  readonly order: readonly LookId[];
  readonly nameOf: (id: string) => string;
  readonly onMove: (index: number, step: -1 | 1) => void;
}

/** One row per tile, fixed in reading order; the names move, and focus follows the name that moved. */
function ConfirmRows({ tiles, order, nameOf, onMove }: RowsProps) {
  const id = useId();
  const [follow, setFollow] = useState<{ readonly name: LookId; readonly step: -1 | 1 } | null>(null);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const f = follow;
    if (!f) return;
    const buttons = list.current?.children[order.indexOf(f.name)]?.querySelectorAll('button');
    const [earlier, later] = [buttons?.[0], buttons?.[1]];
    const wanted = f.step < 0 ? earlier : later;
    // At the end of the list that button is unavailable, so focus takes the other one.
    (wanted?.getAttribute('aria-disabled') === 'true' ? (f.step < 0 ? later : earlier) : wanted)?.focus();
  }, [order, follow]);
  return (
    <ol ref={list} className={styles.rows}>
      {tiles.map((tile, i) => {
        const name = order[i];
        const label = `${id}-${String(i)}`;
        const press = (step: -1 | 1) => () => {
          if (name === undefined) return;
          setFollow({ name, step });
          onMove(i, step);
        };
        return (
          <li key={tile} className={styles.row}>
            <TileImage tile={tile} n={i + 1} />
            <p id={label}>{t.tileIs(i + 1, nameOf(name ?? ''))}</p>
            <div className={styles.buttons}>
              <Button variant="secondary" icon="arrowUp" describedBy={label} unavailable={i === 0} onClick={press(-1)}>
                {t.moveEarlier}
              </Button>
              <Button variant="secondary" icon="arrowDown" describedBy={label} unavailable={i === tiles.length - 1} onClick={press(1)}>
                {t.moveLater}
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TileImage({ tile, n }: { readonly tile: PictureId; readonly n: number }) {
  const url = resources.useObjectUrl(resources.picture(tile));
  return url === null ? null : <img className={styles.tile} src={url} alt={t.tileAlt(n)} />;
}
