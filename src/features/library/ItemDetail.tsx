/**
 * Item detail: a bottom sheet on phones and a side panel from 840 px. The pictures first (front,
 * side and back for a style, one view on each model for a colour look) with Previous and Next, then the description,
 * Copy prompt with its steps, Show your stylist, Save, "Find my look with this style" (cuts and colour looks: the
 * ideas My look lists), and the lengths, upkeep, "Works with your hair if…" and pairings.
 */
import { useMemo, useState } from 'react';
import type { BeardIndexEntry, CutIndexEntry, LibraryIndex, LookIndexEntry } from '../../domain/content/output.ts';
import { asItemId, type ItemId } from '../../domain/ids.ts';
import { content } from '../../platform/content.ts';
import { en } from '../../strings/en.ts';
import { Arch } from '../../ui/components/Arch.tsx';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { Progress } from '../../ui/components/Progress.tsx';
import { Sheet } from '../../ui/components/Sheet.tsx';
import { cx } from '../../ui/cx.ts';
import { beardMeta, cutMeta, lookMeta, techniqueNames } from './captions.ts';
import { detailSections, pairingsOf, promptLookOf, sheetFor, worksWith, type Pairing } from './detail-model.ts';
import { DetailInfo, FindMyLookButton, SaveButton } from './DetailInfo.tsx';
import { useContent, useMediaQuery } from './hooks.ts';
import { LoadProblem } from './LoadProblem.tsx';
import { picturesOf, type LibraryPicture } from '../shared/pictures.ts';
import { PromptBlock } from './PromptBlock.tsx';
import { SidePanel } from './SidePanel.tsx';
import { StylistButton } from '../shared/StylistButton.tsx';
import type { FindMyLookResult } from './Explore.tsx';
import type { ItemKind } from './filters.ts';
import styles from './library.module.css';

const t = en.explore.detail;
type ItemEntry = CutIndexEntry | LookIndexEntry | BeardIndexEntry;
const ENTRY_KIND = { style: 'cut', colour: 'colour', beard: 'beard' } as const;
const HERO_SIZES = '(width >= 1200px) 420px, (width >= 840px) 360px, min(560px, calc(100vw - 88px))';

export interface ItemDetailProps {
  readonly kind: ItemKind;
  readonly id: string;
  readonly open: boolean;
  readonly index: LibraryIndex;
  readonly onClose: () => void;
  /** Another item from a pairing link: replaces this one. */
  readonly onOpenItem: (kind: ItemKind, id: string) => void;
  readonly hrefOf: (kind: ItemKind, id: string) => string;
  readonly onFindMyLook: (id: ItemId) => Promise<FindMyLookResult>;
}

export function findEntry(index: LibraryIndex, kind: ItemKind, id: string): ItemEntry | undefined {
  return index.entries.find((e): e is ItemEntry => e.id === id && e.kind === ENTRY_KIND[kind]);
}

export function ItemDetail(props: ItemDetailProps) {
  const { kind, id, open, index, onClose } = props;
  const wide = useMediaQuery('(width >= 840px)');
  const entry = findEntry(index, kind, id);
  const title = entry?.name ?? t.notFound.title;
  const body = entry ? <DetailBody key={`${kind}/${id}`} entry={entry} {...props} /> : <NotFound onClose={onClose} />;
  if (wide) {
    return (
      <SidePanel open={open} title={title} onClose={onClose} closeLabel={en.sheet.close}>
        {body}
      </SidePanel>
    );
  }
  return (
    <Sheet open={open} title={title} onClose={onClose} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse} initialSnap="full">
      {body}
    </Sheet>
  );
}

function NotFound({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.detail}>
      <p>{t.notFound.body}</p>
      <Button variant="secondary" onClick={onClose}>
        {t.notFound.action}
      </Button>
    </div>
  );
}

function metaOf(entry: ItemEntry, index: LibraryIndex): string {
  if (entry.kind === 'cut') return cutMeta(entry);
  if (entry.kind === 'colour') return lookMeta(entry, techniqueNames(index));
  return beardMeta(entry);
}

function DetailBody({ entry, index, hrefOf, onOpenItem, onFindMyLook }: ItemDetailProps & { entry: ItemEntry }) {
  const detail = useContent(entry.id, () => content.detail(entry.id));
  const consult = useContent('consult', () => content.consult());
  const pictures = useMemo(() => picturesOf(entry, index.models), [entry, index.models]);
  const loaded = detail.status === 'ready' ? detail.value : null;
  const sheet = useMemo(() => (loaded ? sheetFor(loaded, index) : null), [loaded, index]);
  return (
    <div className={styles.detail}>
      <Viewer pictures={pictures} kind={entry.kind} />
      <p className={styles.detailMeta}>{metaOf(entry, index)}</p>
      {loaded && <p>{loaded.client}</p>}
      {detail.status === 'loading' && <Progress label={t.loading} value={null} />}
      {detail.status === 'error' && <LoadProblem error={detail.error} onRetry={detail.retry} />}
      <PromptBlock look={loaded ? promptLookOf(loaded) : null} consult={consult} />
      <div className={styles.detailActions}>
        {sheet && <StylistButton sheet={sheet} pictures={pictures} />}
        <SaveButton id={entry.id} name={entry.name} />
      </div>
      {entry.kind !== 'beard' && <FindMyLookButton id={asItemId(entry.id)} onFind={onFindMyLook} />}
      {loaded && <DetailInfo sections={detailSections(loaded, sheet)} works={worksWith(loaded)} />}
      {loaded && <Pairings items={pairingsOf(loaded, index)} kind={entry.kind} hrefOf={hrefOf} onOpenItem={onOpenItem} />}
    </div>
  );
}

/** "Front view, 1 of 3" with its count kept on one line ("1 of 3", "1 no 3"): the spaces around the count's word do not break. */
const keepCount = (position: string): string => position.replace(/(\d+) (\S+) (\d+)$/u, '$1 $2 $3');

/** The pictures one at a time, whole in the hero arch, with Previous and Next (WCAG 2.5.7) and where you are. */
function Viewer({ pictures, kind }: { pictures: readonly LibraryPicture[]; kind: ItemEntry['kind'] }) {
  const [at, setAt] = useState(0);
  const picture = pictures[Math.min(at, pictures.length - 1)];
  if (!picture) return null;
  const what = kind === 'colour' && picture.model ? t.onModel(en.explore.models[picture.model.hair_group]) : en.explore.views[picture.view];
  return (
    <figure className={styles.viewer} aria-label={t.picturesLabel}>
      <div className={styles.hero}>
        <Arch ratio={picture.width / picture.height} placeholder={picture.placeholder}>
          <img key={picture.key} src={picture.src} srcSet={picture.srcSet} sizes={HERO_SIZES} width={picture.width} height={picture.height} alt={picture.alt} fetchPriority="high" />
        </Arch>
      </div>
      {pictures.length > 1 && (
        <div className={styles.viewerControls}>
          <Button variant="secondary" unavailable={at === 0} onClick={() => { setAt(at - 1); }}>
            {t.previous}
          </Button>
          <LiveRegion message={keepCount(t.position(what, at + 1, pictures.length))} className={cx(styles.viewerPosition)} />
          <Button variant="secondary" unavailable={at === pictures.length - 1} onClick={() => { setAt(at + 1); }}>
            {t.next}
          </Button>
        </div>
      )}
    </figure>
  );
}

interface PairingsProps {
  readonly items: readonly Pairing[];
  readonly kind: ItemEntry['kind'];
  readonly hrefOf: ItemDetailProps['hrefOf'];
  readonly onOpenItem: ItemDetailProps['onOpenItem'];
}

/** Men's styles list their beard pairings; a beard lists the cuts it goes with. */
function Pairings({ items, kind, hrefOf, onOpenItem }: PairingsProps) {
  if (items.length === 0) return null;
  return (
    <section className={styles.infoSection}>
      <h3 className={styles.infoHeading}>{kind === 'beard' ? t.pairs.cuts : t.pairs.beards}</h3>
      <ul className={styles.pairings}>
        {items.map((p) => (
          <li key={p.id}>
            <a
              href={hrefOf(p.kind, p.id)}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpenItem(p.kind, p.id);
              }}
            >
              {p.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
