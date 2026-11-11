/**
 * Copy a prompt: the prompt is built on the tap, so the copy stays inside it; the button says
 * "Prompt copied" for 2 s and a polite live line says what to do next; when the browser refuses to copy, the prompt waits
 * selected in a box, with Select all, to copy by hand. "Copy and open ChatGPT" and "Copy and open Gemini" do the same copy and open the
 * app's start page; a prompt that cannot be made opens nothing. The face card's explain prompt and the AI pick on Ideas share it.
 * Always a secondary button: it sits beside a step's one filled button, never in its place.
 */
import { useEffect, useRef, useState } from 'react';
import type { Built } from '../../domain/prompts/build.ts';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { AiAppLinks } from './AiAppLinks.tsx';
import { useCopy } from './useCopy.ts';
import styles from './CopyPrompt.module.css';

/** What a copy button says in each of its states. */
export interface CopyPromptWords {
  readonly button: string;
  readonly hint: string;
  readonly copied: string;
  readonly copiedLive: string;
  readonly refused: string;
  readonly box: string;
  readonly selectAll: string;
  readonly failed: (code: string) => string;
}

export interface CopyPromptProps {
  /** Builds the prompt on the tap; a refusal is said in words. */
  readonly build: () => Built;
  readonly words: CopyPromptWords;
  /** The prompt cannot be built yet (its details are loading). */
  readonly busy?: boolean;
  readonly busyText?: string;
}

export function CopyPrompt({ build, words: t, busy = false, busyText }: CopyPromptProps) {
  const [state, copy] = useCopy();
  const [made, setMade] = useState<{ readonly text: string } | { readonly failed: string } | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const refused = state === 'refused' && made !== null && 'text' in made;
  useEffect(() => {
    if (refused) box.current?.select();
  }, [refused]);
  const take = async (built: Built): Promise<void> => {
    setMade(built.ok ? { text: built.value.text } : { failed: built.error });
    if (built.ok) await copy(built.value.text);
  };
  const live = made !== null && 'failed' in made ? t.failed(made.failed) : state === 'copied' ? t.copiedLive : refused ? t.refused : '';
  return (
    <div className={styles.copy}>
      <Button variant="secondary" icon="copy" busy={busy} {...(busyText === undefined ? {} : { busyText })} onClick={() => void take(build())}>
        {state === 'copied' ? t.copied : t.button}
      </Button>
      {/* Not while the prompt cannot be made yet: a tab opened then would have nothing to paste. */}
      {!busy && (
        <AiAppLinks
          onOpen={(event) => {
            const built = build();
            if (!built.ok) event.preventDefault();
            void take(built);
          }}
        />
      )}
      <p className={styles.small}>{t.hint}</p>
      <LiveRegion message={live} className={styles.small} />
      {refused && (
        <>
          <label className={styles.label}>
            {t.box}
            <textarea ref={box} className={styles.box} readOnly value={made.text} rows={8} />
          </label>
          <Button variant="secondary" onClick={() => { box.current?.focus(); box.current?.select(); }}>{t.selectAll}</Button>
        </>
      )}
    </div>
  );
}
