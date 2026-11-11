/**
 * One board tile: the AI picture whole in its arch with the app's name, the colour's journey label and "AI picture, an
 * illustration of the look" under it; a tap opens the slider against the person's photo; colour ideas and the pair have the "Hair-only
 * version" switch (`SLOT.HAIR_ONLY`); "Show your stylist" opens the tile's sheet.
 */
import { useId, useState } from 'react';
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { PhotoId, SlotKey } from '../../../domain/ids.ts';
import type { BoardTile as Tile } from '../../../domain/render-model/board.ts';
import type { StylistSheet } from '../../../domain/render-model/stylist-sheet.ts';
import type { ConsultEvent } from '../../../machine/consult.types.ts';
import * as resources from '../../../platform/resources.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Arch } from '../../../ui/components/Arch.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import { CompareSheet } from './CompareSheet.tsx';
import { useHairOnly, type HairOnly, type HairOnlyTool } from './hair-only.ts';
import { journeyLabelOf } from './sheets.ts';
import { StylistButton } from './StylistButton.tsx';
import { cx } from '../../../ui/cx.ts';
import styles from './try-on.module.css';

const b = tryOnCopy.board;
const RATIO = 4 / 5;

export interface BoardTileProps {
  readonly tile: Tile;
  readonly slotKey: SlotKey;
  /** The main photo, for the slider and the hair-only version; null on the no-photo path. */
  readonly photo: PhotoId | null;
  readonly tool: HairOnlyTool;
  readonly sheet: StylistSheet | null;
  readonly library: LibraryIndex;
  readonly send: (event: ConsultEvent) => void;
}

/**
 * What the tile shows: the hair-only version while it is switched on and made, otherwise the AI picture. The hair-only
 * picture's URL is kept like the session's other pictures, until the session ends (`disposeAll`).
 */
function useTilePicture(tile: Tile, photo: PhotoId | null, tool: HairOnlyTool) {
  const ai = tile.picture?.source === 'ai' ? tile.picture : null;
  const pictureUrl = resources.useObjectUrl(ai ? resources.picture(ai.pictureId) : null);
  const photoUrl = resources.useObjectUrl(photo === null ? null : resources.photo(photo)?.preview);
  const hair = useHairOnly(tool, photo, ai?.pictureId ?? null, tile.hairOnly === true);
  const hairUrl = resources.useObjectUrl(hair.state === 'ready' ? hair.blob : null);
  const alt = hairUrl === null ? b.pictureAlt(tile.name) : b.hairOnlyAlt(tile.name);
  return { shown: hairUrl ?? pictureUrl, photoUrl, hair, alt };
}

export function BoardTile({ tile, slotKey, photo, tool, sheet, library, send }: BoardTileProps) {
  const [comparing, setComparing] = useState(false);
  const { shown, photoUrl, hair, alt } = useTilePicture(tile, photo, tool);
  // The slider needs both pictures: none on the no-photo path.
  const compare = shown !== null && photoUrl !== null ? { shown, photoUrl } : null;
  const label = journeyLabelOf(sheet);
  return (
    <li className={styles.boardTile}>
      <figure className={styles.stack}>
        <Arch ratio={RATIO}>
          {compare && (
            <button type="button" className={styles.tileButton} aria-label={b.compare(tile.name)} onClick={() => { setComparing(true); }}>
              <img src={compare.shown} alt="" />
            </button>
          )}
          {!compare && shown !== null && <img src={shown} alt={alt} />}
          {shown === null && <span className={styles.noPicture}>{b.noPicture}</span>}
        </Arch>
        <figcaption className={styles.caption}>
          <span className={styles.strong}>{tile.name}</span>
          {label !== null && <span className={styles.small}>{tryOnCopy.looks.journey(label)}</span>}
          {tile.aiLabel !== null && <span className={styles.small}>{tile.aiLabel}</span>}
        </figcaption>
      </figure>
      {tile.hairOnly !== null && <HairOnlySwitch on={tile.hairOnly} hair={hair} onChange={(on) => { send({ type: 'SLOT.HAIR_ONLY', key: slotKey, on }); }} />}
      {sheet && <StylistButton sheet={sheet} library={library} />}
      {compare && (
        <CompareSheet open={comparing} onClose={() => { setComparing(false); }} name={tile.name} photo={compare.photoUrl} picture={compare.shown} pictureAlt={alt} />
      )}
    </li>
  );
}

/** What the hair-only switch says in each state, read when shown, so it follows the language. */
const hairStatus = (state: HairOnly['state']): string =>
  ({ off: '', ready: '', busy: b.hairOnlyBusy, unavailable: b.hairOnlyOff, no_hair: b.hairOnlyNoHair })[state];

function HairOnlySwitch({ on, hair, onChange }: { readonly on: boolean; readonly hair: HairOnly; readonly onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <div className={styles.switchRow}>
      <label className={styles.switch} htmlFor={id}>
        <input id={id} type="checkbox" role="switch" checked={on} aria-describedby={`${id}-hint`} onChange={(e) => { onChange(e.currentTarget.checked); }} />
        <span>{b.hairOnly}</span>
      </label>
      <p id={`${id}-hint`} className={styles.small}>
        {b.hairOnlyHint}
      </p>
      {hair.state === 'busy' && <Progress label={b.hairOnlyBusy} value={null} />}
      <LiveRegion message={hairStatus(hair.state)} className={hair.state === 'busy' ? undefined : cx(styles.status)} />
    </div>
  );
}
