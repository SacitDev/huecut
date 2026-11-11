/**
 * "See it on me" on a colour idea: one look's rough colour preview on the person's own photo.
 */
import { useState } from 'react';
import type { PhotoId } from '../../../domain/ids.ts';
import { en } from '../../../strings/en.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Sheet } from '../../../ui/components/Sheet.tsx';
import { ColourPreview } from '../extras/ColourPreview.tsx';

export interface SeeItOnMeProps {
  readonly photoId: PhotoId;
  readonly lookId: string;
  /** The card's name element, so the button reads with the look's name. */
  readonly describedBy: string;
}

export function SeeItOnMe({ photoId, lookId, describedBy }: SeeItOnMeProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" describedBy={describedBy} onClick={() => { setOpen(true); }}>
        {ideasCopy.seeItOnMe}
      </Button>
      <Sheet
        open={open}
        title={ideasCopy.seeItOnMe}
        onClose={() => { setOpen(false); }}
        closeLabel={en.sheet.close}
        expandLabel={en.sheet.expand}
        collapseLabel={en.sheet.collapse}
        initialSnap="full"
      >
        {open && <ColourPreview photoId={photoId} lookId={lookId} />}
      </Sheet>
    </>
  );
}
