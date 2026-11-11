/**
 * Saved: how the session is saved, favourites of styles, colour looks and beards, and "Delete my data". The
 * favourites come in as props because they belong to Explore, and features do not import each other. "Delete my data" never waits
 * for the library; the favourites, which do, come last, so nothing already on the screen moves when they arrive.
 */
import { useEffect, useState } from 'react';
import type { LibraryIndex } from '../../domain/content/output.ts';
import { content } from '../../platform/content.ts';
import { en } from '../../strings/en.ts';
import { savedCopy as t } from '../../strings/en-saved.ts';
import { Arch } from '../../ui/components/Arch.tsx';
import { Button, LinkButton } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { Progress } from '../../ui/components/Progress.tsx';
import { SaveControl } from '../shared/SaveControl.tsx';
import { DeleteData } from './DeleteData.tsx';
import { detailHref, savedGroups, tilePictureKey, type SavedEntry, type SavedGroup, type SessionPort } from './model.ts';
import styles from './Saved.module.css';

export interface SavedProps {
  /** The ids of the saved items. */
  readonly favourites: ReadonlySet<string>;
  readonly onRemove: (id: string) => void;
  /** My look's machine when it has started in this page; Saved never starts it. */
  readonly port: SessionPort | null;
  /** Applied after "Delete my data": the settings went with the rest, so the page falls back to the defaults. */
  readonly onDeleted: () => void;
}

/** Tiles fill about two columns on phones and five on wide screens. */
const SIZES = '(width >= 840px) 220px, calc((100vw - 52px) / 2)';
const pictureUrl = (key: string, width: number): string => `${import.meta.env.BASE_URL}library/${key}-${String(width)}.avif`;

/** The Saved screen. */
export function Saved({ favourites, onRemove, port, onDeleted }: SavedProps) {
  const index = useLibrary();
  return (
    <div className={styles.page}>
      <h1>{t.title}</h1>
      <section className={styles.section}>
        <h2 className="t-h2">{t.session.heading}</h2>
        <SaveControl port={port} full />
      </section>
      <DeleteData port={port} onDeleted={onDeleted} />
      {index === null ? <Progress label={en.explore.loading} value={null} /> : <Favourites index={index} favourites={favourites} onRemove={onRemove} />}
    </div>
  );
}

/** The library index is loaded here, not passed in: this screen needs it only for names and pictures. */
function useLibrary(): LibraryIndex | 'failed' | null {
  const [index, setIndex] = useState<LibraryIndex | 'failed' | null>(null);
  useEffect(() => {
    let live = true;
    void content.index().then((r) => {
      if (live) setIndex(r.ok ? r.value : 'failed');
    });
    return () => {
      live = false;
    };
  }, []);
  return index;
}

function Favourites({ index, favourites, onRemove }: Pick<SavedProps, 'favourites' | 'onRemove'> & { readonly index: LibraryIndex | 'failed' }) {
  const [message, setMessage] = useState('');
  const remove = (entry: SavedEntry): void => {
    onRemove(entry.id);
    setMessage(t.favourites.removed(entry.name));
  };
  const groups = index === 'failed' ? [] : savedGroups(index, favourites);
  return (
    <section className={styles.section}>
      <h2 className="t-h2">{t.favourites.heading}</h2>
      {index === 'failed' && <p>{t.favourites.failed}</p>}
      {index !== 'failed' && groups.length === 0 && (
        <div className={styles.empty}>
          <p>{t.favourites.empty}</p>
          <LinkButton variant="secondary" href="#/explore">
            {t.favourites.explore}
          </LinkButton>
        </div>
      )}
      {groups.map((group) => (
        <Group key={group.kind} group={group} onRemove={remove} />
      ))}
      <LiveRegion message={message} />
    </section>
  );
}

function Group({ group, onRemove }: { readonly group: SavedGroup; readonly onRemove: (entry: SavedEntry) => void }) {
  return (
    <div className={styles.group}>
      <h3 className="t-h3">{t.favourites.groups[group.kind]}</h3>
      <ul className={styles.grid}>
        {group.entries.map((entry) => (
          <Tile key={entry.id} kind={group.kind} entry={entry} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
}

interface TileProps {
  readonly kind: SavedGroup['kind'];
  readonly entry: SavedEntry;
  readonly onRemove: (entry: SavedEntry) => void;
}

/** The picture is decorative (empty `alt`): the name beside it names the link. */
function Tile({ kind, entry, onRemove }: TileProps) {
  const key = tilePictureKey(entry.pictures);
  const picture = key === null ? undefined : entry.pictures[key];
  return (
    <li className={styles.tile}>
      <a href={detailHref(kind, entry.id)} className={styles.tileLink}>
        {key !== null && picture && (
          <Arch ratio={picture.widthPx / picture.heightPx} placeholder={picture.average}>
            <img
              src={pictureUrl(key, picture.widths[0] ?? picture.widthPx)}
              srcSet={picture.widths.map((w) => `${pictureUrl(key, w)} ${String(w)}w`).join(', ')}
              sizes={SIZES}
              width={picture.widthPx}
              height={picture.heightPx}
              alt=""
              loading="lazy"
            />
          </Arch>
        )}
        <span className={styles.tileName}>{entry.name}</span>
      </a>
      <Button variant="text" onClick={() => { onRemove(entry); }}>
        {t.favourites.remove(entry.name)}
      </Button>
    </li>
  );
}
