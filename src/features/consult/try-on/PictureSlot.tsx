/**
 * Adding an AI picture: `PictureDrop` takes one from the file picker (the photo library on phones), a
 * paste (Ctrl+V) while it has focus, or a drop; `PictureSlot` is the "Add picture" slot of one idea, or of the pair, on
 * the current main photo. The Blob goes into the resource store and the machine gets its id (`SLOT.ADD`), and disposes
 * the picture a new one replaces.
 */
import { useEffect, useEffectEvent, useRef, useState, type DragEvent, type ReactNode, type RefObject } from 'react';
import type { SlotKey } from '../../../domain/ids.ts';
import type { PictureRefusal } from '../../../domain/measure/picture-gate.ts';
import type { ConsultEvent, Slot } from '../../../machine/consult.types.ts';
import * as resources from '../../../platform/resources.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { cx } from '../../../ui/cx.ts';
import styles from './try-on.module.css';

const t = tryOnCopy.slot;

export interface PictureDropProps {
  /** Names the group: what the picture is for. */
  readonly label: string;
  readonly button: string;
  /** Paste and drop are offered in words on a computer; they work everywhere. */
  readonly desktop: boolean;
  /** Returns the sentence to announce. */
  readonly onPicture: (file: File) => string;
  /** The picture shown and its own controls. */
  readonly children?: ReactNode;
}

/**
 * Drop and paste on the slot: `over` while a drag is above it. A paste with nothing focused goes to the page, not to the
 * slot under the pointer, so the document is listened to and the slot takes the paste while it has focus or the pointer.
 */
function useDrop(box: RefObject<HTMLDivElement | null>, add: (files: readonly File[]) => void) {
  const [over, setOver] = useState(false);
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const files = [...(event.clipboardData?.files ?? [])];
    const slot = box.current;
    if (!slot || files.length === 0 || !(slot.contains(document.activeElement) || slot.matches(':hover'))) return;
    event.preventDefault();
    add(files);
  });
  useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('paste', onPaste);
    };
  }, []);
  const handlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setOver(true);
    },
    onDragLeave: () => {
      setOver(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setOver(false);
      add([...event.dataTransfer.files]);
    },
  };
  return { over, handlers };
}

export function PictureDrop({ label, button, desktop, onPicture, children }: PictureDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  // The first file through the picture gate; a picture is shown and painted at its own size, so it must fit whole. A picture read while the session
  // ended (Start again, Delete my data) belongs to none.
  const add = async (files: readonly File[]) => {
    const mine = resources.generation();
    let why: PictureRefusal | null = null;
    for (const file of files) {
      why = await resources.refusal(file, true);
      if (resources.generation() !== mine) return;
      if (!why) {
        setMessage(onPicture(file));
        return;
      }
    }
    if (why) setMessage(why === 'too_large' ? t.tooLarge : t.notImage);
  };
  const { over, handlers } = useDrop(box, (files) => {
    void add(files);
  });
  return (
    <div ref={box} className={styles.slot} data-over={over} role="group" aria-label={label} {...handlers}>
      {children}
      <Button variant="secondary" icon="image" onClick={() => input.current?.click()}>
        {button}
      </Button>
      {desktop && <p className={styles.small}>{t.dropHint}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void add([...(e.currentTarget.files ?? [])]);
          e.currentTarget.value = '';
        }}
      />
      <LiveRegion message={message} className={cx(styles.status)} />
    </div>
  );
}

export interface PictureSlotProps {
  readonly slotKey: SlotKey;
  /** The idea's name (or the pair's), for the slot's label, the picture's alt text and the announcements. */
  readonly name: string;
  readonly slot: Slot | undefined;
  readonly desktop: boolean;
  readonly send: (event: ConsultEvent) => void;
}

export function PictureSlot({ slotKey, name, slot, desktop, send }: PictureSlotProps) {
  const url = resources.useObjectUrl(slot ? resources.picture(slot.pictureId) : null);
  const [removed, setRemoved] = useState('');
  const onPicture = (file: File) => {
    send({ type: 'SLOT.ADD', key: slotKey, file: resources.addPicture(file) });
    setRemoved('');
    return t.added(name);
  };
  return (
    <PictureDrop label={t.label(name)} button={slot ? t.replace : t.add} desktop={desktop} onPicture={onPicture}>
      {url !== null && <img className={styles.slotPicture} src={url} alt={t.alt(name)} />}
      {slot && (
        <Button
          variant="text"
          icon="trash"
          onClick={() => {
            send({ type: 'SLOT.CLEAR', key: slotKey });
            setRemoved(t.removed(name));
          }}
        >
          {t.remove}
        </Button>
      )}
      <LiveRegion message={removed} />
    </PictureDrop>
  );
}
