/**
 * Adding photos: the file picker, the camera on touch devices, drag and drop, and paste; no limit.
 * Each photo goes into the resource store first (its Blob stays there) and the machine gets its id and sharpness.
 */
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import type { ConsultEvent } from '../../../machine/consult.types.ts';
import * as resources from '../../../platform/resources.ts';
import { en } from '../../../strings/en.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { cx } from '../../../ui/cx.ts';
import styles from './steps.module.css';

const t = en.consult.photo;

/**
 * Adds files one at a time through the picture gate, so each photo is analysed as soon as it is in; the button shows its busy state. The import belongs to
 * the session it began in: after Start again or Delete my data it stops, and none of its photos reach the new session.
 */
function useAdding(send: (event: ConsultEvent) => void) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [refused, setRefused] = useState('');
  const add = useCallback(
    async (files: readonly File[]) => {
      if (files.length === 0) return;
      const mine = resources.generation();
      setBusy(true);
      let added = 0;
      let sentence = '';
      try {
        for (const file of files) {
          const why = await resources.refusal(file);
          if (resources.generation() !== mine) return;
          if (why) {
            sentence = why === 'too_large' ? t.tooLarge : t.notPhoto;
            continue;
          }
          const stored = await resources.addPhoto(file, file.name, undefined, mine);
          if (!stored) return;
          send({ type: 'PHOTOS.ADD', files: [{ id: stored.id, sharpness: stored.sharpness }] });
          added++;
        }
      } catch {
        // A file that can no longer be read (moved or deleted since it was chosen) ends the import with the not-a-photo sentence.
        sentence = t.notPhoto;
      } finally {
        setBusy(false);
        if (resources.generation() === mine) {
          setMessage(added > 0 ? t.added(added) : '');
          setRefused(sentence);
        }
      }
    },
    [send],
  );
  return { busy, message, refused, add };
}

/** A pasted image anywhere on the Photo step is added. */
function usePaste(add: (files: readonly File[]) => Promise<void>): void {
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0) return;
      event.preventDefault();
      void add(files);
    };
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
    };
  }, [add]);
}

/** `added`: a photo is in, so Continue is the screen's one filled button and adding more is secondary. */
export function PhotoAdd({ send, touch, added }: { readonly send: (event: ConsultEvent) => void; readonly touch: boolean; readonly added: boolean }) {
  const { busy, message, refused, add } = useAdding(send);
  const [over, setOver] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  usePaste(add);
  const take = (input: HTMLInputElement) => {
    void add([...(input.files ?? [])]);
    input.value = '';
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    void add([...event.dataTransfer.files]);
  };
  return (
    <div className={styles.drop} data-over={over} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => { setOver(false); }} onDrop={drop}>
      <div className={styles.buttons}>
        <Button variant={added ? 'secondary' : 'primary'} icon="image" busy={busy} busyText={t.adding} onClick={() => pick.current?.click()}>
          {t.choose}
        </Button>
        {touch && (
          <Button variant="secondary" icon="camera" busy={busy} busyText={t.adding} onClick={() => camera.current?.click()}>
            {t.camera}
          </Button>
        )}
      </div>
      <p className={styles.dropWords}>{t.drop}</p>
      <input ref={pick} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { take(e.currentTarget); }} />
      {touch && <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => { take(e.currentTarget); }} />}
      <LiveRegion message={message} />
      <LiveRegion message={refused} className={cx(styles.refused)} />
    </div>
  );
}
