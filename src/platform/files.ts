/**
 * Files the person saves: object URLs with an explicit lifetime, a download through a
 * temporary link, and the export file names.
 */

/** How long a download link's URL stays alive after the click: browsers start reading it after `click()` returns. */
export const DOWNLOAD_URL_LIFETIME_MS = 60_000;

export interface ObjectUrl {
  readonly url: string;
  /** Revokes the URL; safe to call more than once. */
  readonly revoke: () => void;
}

/** An object URL for `blob`. The caller revokes it when it is no longer shown (on unmount, `RESET`, or after a download). */
export function objectUrl(blob: Blob): ObjectUrl {
  const url = URL.createObjectURL(blob);
  let live = true;
  return {
    url,
    revoke: () => {
      if (!live) return;
      live = false;
      URL.revokeObjectURL(url);
    },
  };
}

/** Downloads `blob` as `fileName` through a temporary link, and revokes its URL after `DOWNLOAD_URL_LIFETIME_MS`. */
export function downloadBlob(blob: Blob, fileName: string, doc: Document = document): void {
  const link = objectUrl(blob);
  const a = doc.createElement('a');
  a.href = link.url;
  a.download = fileName;
  a.hidden = true;
  doc.body.append(a);
  a.click();
  a.remove();
  setTimeout(link.revoke, DOWNLOAD_URL_LIFETIME_MS);
}

export type ExportKind = 'face-card' | 'face-lines' | 'stylist-sheet' | 'board' | 'reference-sheet';
const EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png' } as const;
const pad = (n: number): string => String(n).padStart(2, '0');

/** `huecut-face-card-2026-11-08.jpg`: the export, the local date and the extension of its type. */
export const exportFileName = (kind: ExportKind, mime: keyof typeof EXTENSION, date: Date): string =>
  `huecut-${kind}-${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.${EXTENSION[mime]}`;

/** The blob as a named `File`, the form the share sheet takes. */
export const asFile = (blob: Blob, fileName: string): File => new File([blob], fileName, { type: blob.type });
