/**
 * "Show your stylist" on a board tile: the shared button with the person's AI picture beside the
 * library pictures, and painted into the saved sheet too.
 */
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { StylistSheet as SheetModel } from '../../../domain/render-model/stylist-sheet.ts';
import { stylistSheetItems } from '../../../platform/render/export.ts';
import * as resources from '../../../platform/resources.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { picturesOf } from '../../shared/pictures.ts';
import { StylistButton as SharedButton } from '../../shared/StylistButton.tsx';
import { libraryPictures, savePainted } from './paint-pictures.ts';

export interface StylistButtonProps {
  readonly sheet: SheetModel;
  readonly library: LibraryIndex;
}

export function StylistButton({ sheet, library }: StylistButtonProps) {
  const entry = libraryPictures(library);
  const aiUrl = resources.useObjectUrl(sheet.aiPicture ? resources.picture(sheet.aiPicture.pictureId) : null);
  const files = Object.fromEntries(sheet.thumbnails.flatMap((thumb) => {
    const file = entry(thumb.key);
    return file ? [[thumb.key, file]] : [];
  }));
  return (
    <SharedButton
      sheet={sheet}
      pictures={picturesOf({ name: sheet.title, pictures: files }, library.models)}
      ai={aiUrl === null ? null : { src: aiUrl, alt: tryOnCopy.board.pictureAlt(sheet.title) }}
      save={() => savePainted(stylistSheetItems(sheet), sheet.export, { kind: 'stylist-sheet', title: sheet.title }, entry)}
    />
  );
}
