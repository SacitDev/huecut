/**
 * "Save my card": one tap, no choices. Busy on the button while the picture is made, then what happened,
 * announced. The card is the one on screen at the tap, so moving on before it is saved still saves that card.
 */
import { useState } from 'react';
import type { PhotoId } from '../../../domain/ids.ts';
import type { FaceCard } from '../../../domain/render-model/face-card.ts';
import * as resources from '../../../platform/resources.ts';
import { faceCopy } from '../../../strings/en-face.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import styles from './face.module.css';

const t = faceCopy.save;

export function SaveCard({ card, photoId }: { readonly card: FaceCard; readonly photoId: PhotoId }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const save = async () => {
    setBusy(true);
    setStatus('');
    try {
      // The export code loads only when a card is saved.
      const { saveFaceCard } = await import('./save-card.ts');
      const outcome = await saveFaceCard(card, resources.photo(photoId)?.blob, t.shareTitle);
      setStatus(outcome === 'shared' ? t.shared : outcome === 'downloaded' ? t.downloaded : '');
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="secondary" icon="downloadSimple" busy={busy} busyText={t.saving} onClick={() => void save()}>
        {t.button}
      </Button>
      <LiveRegion message={status} className={styles.status} />
    </>
  );
}
