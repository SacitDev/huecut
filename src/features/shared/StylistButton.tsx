/**
 * "Show your stylist": opens the stylist sheet built by `buildStylistSheet`, with "Copy as text"
 * (`stylistSheetText`) and "Save as image" (the painter's export, then share or download). Shared by Explore and My look.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { stylistSheetText, type StylistSheet as SheetModel } from '../../domain/render-model/stylist-sheet.ts';
import type { SaveOutcome } from '../../platform/share.ts';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { StylistSheet, type StylistSheetPicture } from '../../ui/components/StylistSheet.tsx';
import type { LibraryPicture } from './pictures.ts';
import { useCopy } from './useCopy.ts';

const t = en.explore.stylist;
const THUMB_SIZES = '(width >= 600px) 190px, calc((100vw - 64px) / 3)';
/** The person's AI picture's frame until it loads: the portrait's 4:5. */
const AI_FRAME = { width: 1080, height: 1350 };

export interface StylistButtonProps {
  readonly sheet: SheetModel;
  /** The item's library pictures; the sheet shows those its thumbnails name. */
  readonly pictures: readonly LibraryPicture[];
  /** The person's AI picture for this idea, shown after the library pictures. */
  readonly ai?: { readonly src: string; readonly alt: string } | null;
  /** How "Save as image" makes the file, when it holds more than the library thumbnails. */
  readonly save?: () => Promise<SaveOutcome>;
}

const thumbnailsOf = ({ sheet, pictures, ai }: StylistButtonProps): StylistSheetPicture[] => [
  ...sheet.thumbnails.flatMap((thumb) => {
    const p = pictures.find((x) => x.key === thumb.key);
    return p ? [{ key: p.key, src: p.src, srcSet: p.srcSet, sizes: THUMB_SIZES, width: p.width, height: p.height, placeholder: p.placeholder, alt: p.alt }] : [];
  }),
  ...(ai ? [{ key: 'ai', src: ai.src, srcSet: '', sizes: THUMB_SIZES, ...AI_FRAME, placeholder: '', alt: ai.alt }] : []),
];

/** Copy as text and Save as image, with the result of the last one as a status line. */
function useSheetActions({ sheet, pictures, save: makeFile }: StylistButtonProps) {
  const [status, setStatus] = useState('');
  const [copyState, copyToClipboard] = useCopy();
  const [saving, setSaving] = useState(false);
  const copy = async () => {
    setStatus((await copyToClipboard(stylistSheetText(sheet))) === 'copied' ? t.textCopiedLive : t.copyRefused);
  };
  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      // The painter loads only when a sheet is saved, so Explore does not carry it.
      const outcome = makeFile ? await makeFile() : await (await import('./sheet-image.ts')).saveSheetImage(sheet, pictures);
      setStatus(outcome === 'shared' ? t.shared : outcome === 'downloaded' ? t.downloaded : '');
    } catch {
      setStatus(t.saveFailed);
    } finally {
      setSaving(false);
    }
  };
  const actions = (
    <>
      <Button icon="copy" onClick={() => void copy()}>{copyState === 'copied' ? t.textCopied : t.copyText}</Button>
      <Button variant="secondary" icon="downloadSimple" busy={saving} busyText={t.saving} onClick={() => void save()}>
        {t.saveImage}
      </Button>
    </>
  );
  return { actions, status, reset: () => { setStatus(''); } };
}

export function StylistButton(props: StylistButtonProps) {
  const { sheet } = props;
  const [open, setOpen] = useState(false);
  const { actions, status, reset } = useSheetActions(props);
  return (
    <>
      <Button
        variant="secondary"
        onClick={(event) => {
          // Safari does not focus a button on click; the sheet returns focus to whatever had it when it opened.
          event.currentTarget.focus();
          reset();
          setOpen(true);
        }}
      >
        {en.explore.detail.showStylist}
      </Button>
      {/* In <body>, not inside a dialog or card: one modal above another, each its own subtree. */}
      {createPortal(
        <StylistSheet
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          title={sheet.title}
          pictures={thumbnailsOf(props)}
          picturesLabel={t.picturesLabel}
          sections={sheet.sections}
          footer={sheet.footer}
          closeLabel={en.sheet.close}
          actions={actions}
          status={status}
        />,
        document.body,
      )}
    </>
  );
}
