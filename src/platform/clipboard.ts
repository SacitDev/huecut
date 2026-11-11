/**
 * Copying text ("Copy prompt", "Copy as text"): the async Clipboard API. When the browser refuses or
 * has no clipboard (an insecure context, an in-app browser), the code tells the UI to show the text selected in a text
 * box with "Select all".
 */

export type CopyOutcome = 'copied' | 'refused' | 'unavailable';
export type ClipboardApi = Pick<Clipboard, 'writeText'>;

/** The page's clipboard, or undefined where the browser offers none. */
const pageClipboard = (): ClipboardApi | undefined => (navigator as Partial<Navigator>).clipboard;

/** Writes `text` to the clipboard and says whether it worked. */
export async function copyText(text: string, clipboard: ClipboardApi | undefined = pageClipboard()): Promise<CopyOutcome> {
  if (clipboard === undefined) return 'unavailable';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'refused';
  }
}
