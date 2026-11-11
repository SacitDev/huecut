/**
 * All together: "How many looks in one picture?", then each finished card with its sample pictures, names and
 * upkeep lines, its own copy and open buttons and its steps: on touch devices "Share photos and reference sheet" with a save fallback, on
 * computers the downloads. The app's own disclosure stays on screen, because the words in a generated picture can change.
 */
import { useId, useState } from 'react';
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { PhotoId } from '../../../domain/ids.ts';
import { cardSplits, lookName, type PromptPack } from '../../../domain/prompts/build.ts';
import type { ConsultEvent } from '../../../machine/consult.types.ts';
import { downloadBlob } from '../../../platform/files.ts';
import { saveFiles } from '../../../platform/share.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { keepRanges } from '../../../strings/i18n.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { cx } from '../../../ui/cx.ts';
import type { LibraryPicture } from '../../shared/pictures.ts';
import { usePhotosForAi } from './photo-for-ai.ts';
import { PromptCard } from './PromptCard.tsx';
import { nameOf } from './names.ts';
import { useReferenceSheet, type Sheet } from './reference-sheet.ts';
import styles from './try-on.module.css';

const t = tryOnCopy.cards;
const SAMPLE_SIZES = '(width >= 840px) 12vw, 30vw';

type Card = PromptPack['cards'][number];
export interface CardsProps {
  readonly pack: PromptPack;
  readonly handoff: 'touch' | 'desktop';
  /** Every usable photo, main photo first; empty on the no-photo path. */
  readonly photoIds: readonly PhotoId[];
  readonly referral: string | null;
  readonly sampleOf: (id: string) => LibraryPicture | null;
  readonly library: LibraryIndex;
  readonly send: (event: ConsultEvent) => void;
}

export function Cards(props: CardsProps) {
  const { pack, referral, send } = props;
  const n = pack.cards.reduce((sum, c) => sum + c.plan.ideas.length, 0);
  const splits = cardSplits(n);
  const shown = pack.cards.map((c) => c.plan.ideas.length).join();
  if (pack.cards.length === 0) {
    return referral === null ? <p>{t.none}</p> : <PromptCard prompt={{ ok: false, error: 'referral' }} handoff={props.handoff} photo="none" referral={referral} />;
  }
  return (
    <div className={styles.section}>
      {splits.length > 1 && (
        <div className={styles.splits}>
          <OptionGroup legend={t.howMany} twoPerRow>
            {splits.map((s) => (
              <OptionTile key={s.perCard} name="looks-per-picture" value={String(s.perCard)} label={t.split(s.sizes)} checked={s.sizes.join() === shown} onChange={() => { send({ type: 'PREFS.SET', perPicture: s.perCard }); }} />
            ))}
          </OptionGroup>
        </div>
      )}
      {pack.cards.map((card, i) => (
        <FinalCard key={card.plan.ideas.map((x) => x.id).join('|')} {...props} card={card} index={i} total={pack.cards.length} />
      ))}
    </div>
  );
}

/**
 * The card the AI makes prints each look's English name and upkeep line, as the prompt asks: where the screen shows another
 * language, the printed name follows the shown one, marked as English.
 */
export function OnCard({ shown, printed }: { readonly shown: string; readonly printed: string }) {
  return shown === printed ? null : <span className={styles.small}>{t.onCard} <span lang="en">{printed}</span></span>;
}

function FinalCard({ card, index, total, handoff, photoIds, referral, sampleOf, library }: CardsProps & { readonly card: Card; readonly index: number; readonly total: number }) {
  const id = useId();
  const sheet = useReferenceSheet(card.plan, (look) => sampleOf(look)?.key ?? null, library);
  const shown = nameOf(library);
  const photos = usePhotosForAi(photoIds);
  const withPhotos = photoIds.length > 0;
  const steps = handoff === 'touch' ? (withPhotos ? t.steps.touch : t.steps.touchNoPhoto) : withPhotos ? t.steps.desktop : t.steps.desktopNoPhoto;
  return (
    <section className={styles.card} aria-labelledby={id}>
      {/* Level 2 under the screen's heading, set as an H3. */}
      <h2 id={id} className="t-h3">{t.title(index + 1, total)}</h2>
      <div className={styles.cardLayout}>
        <ol className={styles.samples}>
          {card.plan.ideas.map((look, i) => (
            <li key={look.id} className={styles.sample}>
              <Sample picture={sampleOf(look.id)} />
              <span className={styles.strong}>{`${String(i + 1)}. ${shown(look.id)}`}</span>
              <OnCard shown={shown(look.id)} printed={lookName(look)} />
              {look.upkeep !== undefined && <span className={styles.small} lang="en">{keepRanges(look.upkeep)}</span>}
            </li>
          ))}
        </ol>
        <div className={styles.stack}>
          <PromptCard
            prompt={card.prompt}
            handoff={handoff}
            photo={withPhotos ? null : 'none'}
            referral={referral}
            steps={steps}
            share={<ShareFiles sheet={sheet} photos={withPhotos ? photos : []} withPhotos={withPhotos} />}
            downloads={<DownloadFiles sheet={sheet} photos={withPhotos ? photos : []} withPhotos={withPhotos} />}
          />
          {sheet === 'failed' && <p className={styles.problem}>{t.sheetFailed}</p>}
          {withPhotos && <p className={styles.small}>{tryOnCopy.handoff.privacy}</p>}
          <p className={styles.small}>{t.disclosure}</p>
        </div>
      </div>
    </section>
  );
}

function Sample({ picture }: { readonly picture: LibraryPicture | null }) {
  if (!picture) return <div className={styles.sampleFrame} />;
  return (
    <div className={styles.sampleFrame} style={{ backgroundColor: picture.placeholder }}>
      <img src={picture.src} srcSet={picture.srcSet} sizes={SAMPLE_SIZES} width={picture.width} height={picture.height} alt={picture.alt} loading="lazy" decoding="async" />
    </div>
  );
}

interface FilesProps {
  readonly sheet: Sheet;
  readonly photos: readonly File[] | 'failed' | null;
  readonly withPhotos: boolean;
}

/** "2 Share photos and reference sheet": the share sheet with all of them, or a download of each where there is none. */
function ShareFiles({ sheet, photos, withPhotos }: FilesProps) {
  const [status, setStatus] = useState('');
  const files = sheet instanceof File && photos !== null && photos !== 'failed' ? [...photos, sheet] : null;
  const share = async () => {
    if (!files) return;
    setStatus('');
    const outcome = await saveFiles(files, '');
    setStatus(outcome === 'shared' ? t.shared : outcome === 'downloaded' ? t.downloaded : '');
  };
  return (
    <>
      <Button variant="secondary" icon="shareNetwork" busy={files === null && sheet !== 'failed'} unavailable={sheet === 'failed'} busyText={tryOnCopy.handoff.preparing} onClick={() => void share()}>
        {withPhotos ? t.share : t.shareSheet}
      </Button>
      <LiveRegion message={status} className={cx(styles.status)} />
    </>
  );
}

/** On a computer: the reference sheet and the photos, each its own download, so each has its own click. */
function DownloadFiles({ sheet, photos, withPhotos }: FilesProps) {
  const [status, setStatus] = useState('');
  return (
    <>
      <Button
        variant="secondary"
        icon="downloadSimple"
        busy={sheet === null}
        unavailable={sheet === 'failed'}
        busyText={tryOnCopy.handoff.preparing}
        onClick={() => {
          if (!(sheet instanceof File)) return;
          downloadBlob(sheet, sheet.name);
          setStatus(t.sheetSaved);
        }}
      >
        {t.downloadSheet}
      </Button>
      {withPhotos && (
        <Button
          variant="secondary"
          icon="downloadSimple"
          busy={photos === null}
          unavailable={photos === 'failed'}
          busyText={tryOnCopy.handoff.preparing}
          onClick={() => {
            if (photos === null || photos === 'failed') return;
            for (const photo of photos) downloadBlob(photo, photo.name);
            setStatus(t.photosSaved);
          }}
        >
          {t.downloadPhotos}
        </Button>
      )}
      <LiveRegion message={status} className={cx(styles.status)} />
    </>
  );
}
