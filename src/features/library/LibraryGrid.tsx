/**
 * The library grid: a uniform grid of arches, 2 / 3 / 3-4 / 4-5 columns per
 * window class, each picture whole at its 3:4 aspect over its average colour, then the name, the meta phrase and the
 * model line, with the save heart in the arch's bottom corner. Tiles below the fold load lazily and render lazily.
 */
import { useId, useRef, type MouseEvent } from 'react';
import { Arch } from '../../ui/components/Arch.tsx';
import { cx } from '../../ui/cx.ts';
import { Icon } from '../../ui/icons.tsx';
import type { ItemKind } from './filters.ts';
import type { LibraryPicture } from '../shared/pictures.ts';
import styles from './library.module.css';

export interface GridTile {
  readonly id: string;
  readonly kind: ItemKind;
  readonly href: string;
  readonly name: string;
  readonly meta: string;
  readonly shownOn: string | null;
  readonly picture: LibraryPicture | null;
}

export interface LibraryGridProps {
  readonly tiles: readonly GridTile[];
  readonly label: string;
  readonly saved: ReadonlySet<string>;
  readonly saveLabel: (name: string) => string;
  readonly onToggleSave: (id: string) => void;
  /** A plain click on a tile; `frame` is its arch, for the shared-element morph. Modified clicks follow the link. */
  readonly onOpen: (tile: GridTile, frame: HTMLElement | null) => void;
}

/** Tiles in the first rows load at once (one or two rows by window class); the rest wait until scrolled near. */
const EAGER_TILES = 4;
/**
 * Rendered picture width per window class: half the screen less margins and gutter on phones, a third on medium,
 * the grid beside the 280 px filter panel on expanded, at most about 280 px on large screens.
 */
const SIZES = '(width >= 1200px) min(18vw, 280px), (width >= 840px) calc((100vw - 380px) / 3.5), (width >= 600px) calc((100vw - 104px) / 3), calc((100vw - 52px) / 2)';

export function LibraryGrid({ tiles, label, saved, saveLabel, onToggleSave, onOpen }: LibraryGridProps) {
  return (
    <div className={styles.gridFrame}>
      <ul className={styles.grid} aria-label={label}>
        {tiles.map((tile, i) => (
          <Tile
            key={tile.id}
            tile={tile}
            eager={i < EAGER_TILES}
            first={i === 0}
            saved={saved.has(tile.id)}
            saveLabel={saveLabel(tile.name)}
            onToggleSave={onToggleSave}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </div>
  );
}

interface TileProps {
  readonly tile: GridTile;
  readonly eager: boolean;
  readonly first: boolean;
  readonly saved: boolean;
  readonly saveLabel: string;
  readonly onToggleSave: (id: string) => void;
  readonly onOpen: LibraryGridProps['onOpen'];
}

function Tile({ tile, eager, first, saved, saveLabel, onToggleSave, onOpen }: TileProps) {
  const ids = useId();
  const frame = useRef<HTMLSpanElement>(null);
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // Safari does not focus a link on click; the detail returns focus to whatever had it when it opened.
    event.currentTarget.focus();
    onOpen(tile, frame.current);
  };
  const described = [`${ids}meta`, tile.shownOn === null ? null : `${ids}model`].filter(Boolean).join(' ');
  return (
    <li className={styles.tile}>
      <a href={tile.href} className={styles.tileLink} aria-labelledby={`${ids}name`} aria-describedby={described} data-focus="photo" onClick={open}>
        <span ref={frame} className={styles.tileArch}>
          <TilePicture picture={tile.picture} eager={eager} first={first} />
        </span>
        <span id={`${ids}name`} className={styles.tileName}>
          {tile.name}
        </span>
      </a>
      <p id={`${ids}meta`} className={styles.tileMeta}>
        {tile.meta}
      </p>
      {tile.shownOn !== null && (
        <p id={`${ids}model`} className={styles.tileModel}>
          {tile.shownOn}
        </p>
      )}
      <button
        type="button"
        className={cx(styles.heart, 'press')}
        aria-pressed={saved}
        aria-label={saveLabel}
        data-focus="photo"
        onClick={() => {
          onToggleSave(tile.id);
        }}
      >
        <Icon name="heart" className={styles.heartIcon} />
      </button>
    </li>
  );
}

function TilePicture({ picture, eager, first }: { picture: LibraryPicture | null; eager: boolean; first: boolean }) {
  if (picture === null) return <Arch ratio={3 / 4} />;
  return (
    <Arch ratio={picture.width / picture.height} placeholder={picture.placeholder}>
      <img
        src={picture.src}
        srcSet={picture.srcSet}
        sizes={SIZES}
        width={picture.width}
        height={picture.height}
        alt={picture.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={first ? 'high' : 'auto'}
      />
    </Arch>
  );
}
