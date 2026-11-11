/**
 * Saving an export: the share sheet with the files when `navigator.canShare` accepts them, a
 * download of each otherwise. Cancelling the share sheet is the person's choice and downloads nothing; any other failure (no
 * share target, the tap's activation spent while the picture was being made) falls back to the download.
 */
import { downloadBlob } from './files.ts';

export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled';
/** The parts of `navigator` saving uses; either may be missing (desktop Firefox has no `share`). */
export type ShareApi = Partial<Pick<Navigator, 'share' | 'canShare'>>;

/** Saves `files` through the share sheet in one go, or downloads each, and says which happened. */
export async function saveFiles(
  files: readonly File[],
  title: string,
  nav: ShareApi = navigator,
  download: (blob: Blob, fileName: string) => void = downloadBlob,
): Promise<SaveOutcome> {
  const data: ShareData = { files: [...files], title };
  if (nav.share !== undefined && nav.canShare?.(data) === true) {
    try {
      await nav.share(data);
      return 'shared';
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  for (const file of files) download(file, file.name);
  return 'downloaded';
}

/** Saves one file the same way. */
export const saveFile = (file: File, title: string, nav?: ShareApi, download?: (blob: Blob, fileName: string) => void): Promise<SaveOutcome> =>
  saveFiles([file], title, nav, download);
