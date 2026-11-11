/**
 * "Try a colour on your photo": the button on Lines and the ready chip over the
 * questions both open one sheet, which tints the person's hair (`extras/ColourPreview.tsx`). Closing the sheet returns
 * to the same place.
 */
import { useState } from 'react';
import type { PhotoId } from '../../domain/ids.ts';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { Sheet } from '../../ui/components/Sheet.tsx';
import { ColourPreview } from './extras/ColourPreview.tsx';

export interface TryColourProps {
  readonly photoId: PhotoId;
  /** `button` on Lines; `chip` on the questions' progress line once the photo is ready. */
  readonly look: 'button' | 'chip';
}

export function TryColour({ photoId, look }: TryColourProps) {
  const [open, setOpen] = useState(false);
  const label = look === 'chip' ? en.consult.colour.ready : en.consult.colour.open;
  return (
    <>
      <Button variant={look === 'chip' ? 'text' : 'secondary'} onClick={() => { setOpen(true); }}>
        {label}
      </Button>
      <Sheet
        open={open}
        title={en.consult.colour.title}
        onClose={() => { setOpen(false); }}
        closeLabel={en.sheet.close}
        expandLabel={en.sheet.expand}
        collapseLabel={en.sheet.collapse}
        initialSnap="full"
      >
        {open && <ColourPreview photoId={photoId} note={en.consult.colour.realistic} />}
      </Sheet>
    </>
  );
}
