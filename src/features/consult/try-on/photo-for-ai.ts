/**
 * The photos handed to ChatGPT or Gemini: the resource store's share copies, at most 1536 px on
 * the long side and re-encoded without EXIF. They are made when the screen opens, so a tap on "2 Share photo" calls the share sheet
 * at once, while the tap still counts as the person's gesture.
 */
import { useEffect, useState } from 'react';
import { asPhotoId, type PhotoId } from '../../../domain/ids.ts';
import { asFile, downloadBlob } from '../../../platform/files.ts';
import * as resources from '../../../platform/resources.ts';
import { saveFile, type SaveOutcome } from '../../../platform/share.ts';

/** The file name the AI chat sees: nothing about the person or the original file. */
export const PHOTO_FOR_AI_NAME = 'huecut-photo.jpg';

/** `null` while the copy is being made; `failed` when this browser cannot decode the photo. */
export type PhotoForAi = File | 'failed' | null;

const made = new WeakMap<Blob, Promise<File | null>>();
/** One copy per photo Blob for the life of the page; the store drops the Blob, and so this entry, with the photo. */
function copyOf(blob: Blob): Promise<File | null> {
  let file = made.get(blob);
  if (!file) {
    file = resources.shareCopy(blob).then((copy) => (copy ? asFile(copy, PHOTO_FOR_AI_NAME) : null));
    made.set(blob, file);
  }
  return file;
}

/** The main photo's copy for the AI chat; `failed` without a photo in the store. */
export function usePhotoForAi(photoId: PhotoId | null): PhotoForAi {
  const blob = photoId === null ? undefined : resources.photo(photoId)?.blob;
  const [state, setState] = useState<{ readonly blob: Blob | undefined; readonly file: PhotoForAi }>({ blob, file: null });
  useEffect(() => {
    if (!blob) return;
    let live = true;
    void copyOf(blob).then((file) => {
      if (live) setState({ blob, file: file ?? 'failed' });
    });
    return () => {
      live = false;
    };
  }, [blob]);
  if (!blob) return 'failed';
  return state.blob === blob ? state.file : null;
}

/** A chat takes only so many attachments; the sheet goes with these. A chosen limit, not one measured in each app. */
const MOST_PHOTOS = 9;

/** The copies of the first nine photos (main photo first), for the card; `failed` when none could be made, null while any is being made. */
export function usePhotosForAi(photoIds: readonly PhotoId[]): readonly File[] | 'failed' | null {
  const key = photoIds.slice(0, MOST_PHOTOS).join('|');
  const [state, setState] = useState<{ readonly key: string; readonly files: readonly File[] | 'failed' } | null>(null);
  useEffect(() => {
    let live = true;
    const blobs = key === '' ? [] : key.split('|').flatMap((id) => resources.photo(asPhotoId(id))?.blob ?? []);
    void Promise.all(blobs.map(copyOf)).then((files) => {
      const made = files.flatMap((file, i) => (file ? [i === 0 ? file : asFile(file, PHOTO_FOR_AI_NAME.replace('.jpg', `-${String(i + 1)}.jpg`))] : []));
      if (live) setState({ key, files: made.length > 0 ? made : 'failed' });
    });
    return () => {
      live = false;
    };
  }, [key]);
  return state?.key === key ? state.files : null;
}

/** "2 Share photo": the share sheet with the copy, or a download where there is none. */
// No title: some apps paste a shared title into the message.
export const sharePhoto = (file: File): Promise<SaveOutcome> => saveFile(file, '');

/** "Download photo for AI" on a computer. */
export function downloadPhoto(file: File): void {
  downloadBlob(file, file.name);
}
