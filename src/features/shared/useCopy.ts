/**
 * A copy action's result: "copied" for 2 s on the button and in a polite live region,
 * or "refused", after which the text is shown selected in a box so it can be copied by hand. The one
 * copy timer of every copy button.
 */
import { useEffect, useState } from 'react';
import { copyText, type CopyOutcome } from '../../platform/clipboard.ts';

/** How long the button says "Prompt copied". */
const COPIED_MS = 2000;
export type CopyState = 'idle' | 'copied' | 'refused';

/** The copy state, and the copy itself, which also resolves to its outcome for a caller with a status line of its own. */
export function useCopy(): readonly [CopyState, (text: string) => Promise<CopyOutcome>] {
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = window.setTimeout(() => {
      setState('idle');
    }, COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state]);
  const copy = async (text: string) => {
    const outcome = await copyText(text);
    setState(outcome === 'copied' ? 'copied' : 'refused');
    return outcome;
  };
  return [state, copy];
}
