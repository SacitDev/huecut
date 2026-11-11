/**
 * The original-against-result slider of a board tile: the person's photo over the AI picture, both
 * whole in the same 4:5 frame (never cropped); a range input (arrow keys, or a drag) sets how much of the photo shows.
 * On screen only; the saved board has no slider.
 */
import { useId, useState } from 'react';
import { en } from '../../../strings/en.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import styles from './try-on.module.css';

const b = tryOnCopy.board;

export interface CompareSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly name: string;
  readonly photo: string;
  readonly picture: string;
  readonly pictureAlt: string;
}

export function CompareSheet({ open, onClose, name, photo, picture, pictureAlt }: CompareSheetProps) {
  const id = useId();
  const [split, setSplit] = useState(50);
  return (
    <Sheet
      open={open}
      title={b.compareTitle(name)}
      onClose={onClose}
      closeLabel={en.sheet.close}
      expandLabel={en.sheet.expand}
      collapseLabel={en.sheet.collapse}
      initialSnap="full"
    >
      <div className={styles.compare}>
        <img className={styles.compareLayer} src={picture} alt={pictureAlt} />
        <img className={styles.compareLayer} src={photo} alt={b.photoAlt} style={{ clipPath: `inset(0 ${String(100 - split)}% 0 0)` }} />
      </div>
      <label className={styles.compareControl} htmlFor={id}>
        <span>{b.compareLabel}</span>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={split}
          aria-valuetext={b.compareValue(split)}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            setSplit(Number(e.currentTarget.value));
          }}
        />
      </label>
      <p id={`${id}-hint`} className={styles.small}>
        {b.compareHint}
      </p>
    </Sheet>
  );
}
