/**
 * One by one: the "Try together" pair first, then every look with its sample picture from the library, its
 * name and its own copy and open buttons. On a computer "Download photo for AI" sits once, above them. A prompt refused after a dye
 * reaction shows "Best done by a colourist".
 */
import { useId, useState } from 'react';
import { lookId, lookOf, type Look as LookRef } from '../../../domain/ids.ts';
import type { Built, PromptPack } from '../../../domain/prompts/build.ts';
import type { Pair } from '../../../machine/consult.types.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { cx } from '../../../ui/cx.ts';
import type { LibraryPicture } from '../../shared/pictures.ts';
import { downloadPhoto, type PhotoForAi } from './photo-for-ai.ts';
import { PromptCard, type PromptCardProps } from './PromptCard.tsx';
import styles from './try-on.module.css';

const t = tryOnCopy.handoff;
const SIZES = '(width >= 840px) 160px, 120px';

export interface OneByOneProps extends Pick<PromptCardProps, 'handoff' | 'photo' | 'referral'> {
  readonly pack: PromptPack;
  readonly pair: Pair | null;
  readonly nameOf: (id: string) => string;
  readonly sampleOf: (id: string) => LibraryPicture | null;
  /** The colour's journey label for this person, on a look that has a colour. */
  readonly labelOf: (look: LookRef) => string | null;
}

export function OneByOne(props: OneByOneProps) {
  const { pack, pair, nameOf, handoff, photo, sampleOf } = props;
  const id = useId();
  const pairId = pair ? lookId([pair.cut, pair.colour]) : null;
  return (
    <div className={styles.section}>
      {handoff === 'desktop' && <PhotoDownload photo={photo} />}
      {photo === 'failed' && <p className={styles.problem}>{t.photoFailed}</p>}
      {photo !== 'none' && <p className={styles.small}>{t.privacy}</p>}
      {pair && pack.pair && (
        <section className={styles.section} aria-labelledby={id}>
          <h2 id={id}>{tryOnCopy.pair.title}</h2>
          <div className={styles.looks}>
            <LookCard {...props} prompt={pack.pair} name={SHOWN.board.pairName(nameOf(pair.cut), nameOf(pair.colour))} pictures={[sampleOf(pair.cut), sampleOf(pair.colour)]} look={[pair.cut, pair.colour]} inPair />
          </div>
        </section>
      )}
      <div className={styles.looks}>
        {pack.looks.filter((l) => l.id !== pairId).map((l) => (
          <LookCard key={l.id} {...props} prompt={l.prompt} name={nameOf(l.id)} pictures={[sampleOf(l.id)]} look={lookOf(l.id)} />
        ))}
      </div>
    </div>
  );
}

/** One look; its name is a level-2 heading under the screen's own, or level 3 inside the pair's section, set as an H3 either way. */
function LookCard({ prompt, name, pictures, look, handoff, photo, referral, labelOf, inPair = false }: OneByOneProps & { readonly prompt: Built; readonly name: string; readonly pictures: readonly (LibraryPicture | null)[]; readonly look: LookRef; readonly inPair?: boolean }) {
  const id = useId();
  const label = labelOf(look);
  const Name = inPair ? 'h3' : 'h2';
  return (
    <section className={styles.lookCard} aria-labelledby={id}>
      <div className={styles.lookHead}>
        <div className={styles.lookPictures} data-count={pictures.length}>
          {pictures.map((p) => p && (
            <div key={p.key} className={styles.sampleFrame} style={{ backgroundColor: p.placeholder }}>
              <img src={p.src} srcSet={p.srcSet} sizes={SIZES} width={p.width} height={p.height} alt={p.alt} loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
        <div className={styles.stack}>
          <Name id={id} className="t-h3">{name}</Name>
          {label !== null && <p className={styles.small}>{tryOnCopy.looks.journey(label)}</p>}
        </div>
      </div>
      <PromptCard prompt={prompt} handoff={handoff} photo={photo} referral={referral} />
    </section>
  );
}

/** "Download photo for AI": the copy without EXIF, once for all the looks. */
function PhotoDownload({ photo }: { readonly photo: PhotoForAi | 'none' }) {
  const [status, setStatus] = useState('');
  if (photo === 'none' || photo === 'failed') return null;
  return (
    <div className={styles.buttons}>
      <Button
        variant="secondary"
        icon="downloadSimple"
        busy={photo === null}
        busyText={t.preparing}
        onClick={() => {
          if (!photo) return;
          downloadPhoto(photo);
          setStatus(t.downloaded);
        }}
      >
        {t.downloadPhoto}
      </Button>
      <LiveRegion message={status} className={cx(styles.status)} />
    </div>
  );
}
