/**
 * "Copy prompt" on a library item: the one-look prompt from `buildTryOn`, the steps line beside it,
 * "Prompt copied" on the button for 2 s with the same in a polite live region, and the prompt itself in a text box
 * (selected when the browser refuses to copy, so it can be copied by hand).
 */
import { useEffect, useRef } from 'react';
import type { ConsultData } from '../../domain/content/output.ts';
import { buildTryOn, type PromptLook } from '../../domain/prompts/build.ts';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { cx } from '../../ui/cx.ts';
import { AiAppLinks } from '../shared/AiAppLinks.tsx';
import { useCopy } from '../shared/useCopy.ts';
import type { Loadable } from './hooks.ts';
import { LoadProblem } from './LoadProblem.tsx';
import styles from './library.module.css';

const t = en.explore.detail;

export interface PromptBlockProps {
  /** Null until the item's details are loaded. */
  readonly look: PromptLook | null;
  readonly consult: Loadable<ConsultData>;
}

/** The prompt's text when it can be made, or why not: still loading, or a refusal code from the builder. */
function promptOf(look: PromptLook | null, consult: Loadable<ConsultData>): { text: string | null; refusal: string | null } {
  if (look === null || consult.status !== 'ready') return { text: null, refusal: null };
  // An Explore look is shown to anyone, so no referral applies here: the colour safety rules run on My look's answers.
  const built = buildTryOn(consult.value.prompts, look, { referral: null });
  return built.ok ? { text: built.value.text, refusal: null } : { text: null, refusal: built.error };
}


export function PromptBlock({ look, consult }: PromptBlockProps) {
  const [state, copy] = useCopy();
  const { text, refusal } = promptOf(look, consult);
  const waiting = text === null && refusal === null && consult.status !== 'error';
  const copyPrompt = (): void => {
    if (text !== null) void copy(text);
  };
  return (
    <div className={styles.prompt}>
      <Button icon="copy" busy={waiting} busyText={t.promptPreparing} unavailable={text === null} onClick={copyPrompt}>
        {state === 'copied' ? t.promptCopied : t.copyPrompt}
      </Button>
      {text !== null && <AiAppLinks onOpen={copyPrompt} />}
      <p className={styles.steps}>{t.promptSteps}</p>
      <LiveRegion message={state === 'idle' ? '' : state === 'copied' ? t.promptCopiedLive : t.copyRefused} className={cx(styles.status)} />
      {consult.status === 'error' && <LoadProblem error={consult.error} onRetry={consult.retry} />}
      {refusal !== null && <p className={styles.problem}>{`${t.promptFailed} ${en.explore.errors.code(`prompt_${refusal}`)}`}</p>}
      {text !== null && <PromptText text={text} select={state === 'refused'} />}
    </div>
  );
}

function PromptText({ text, select }: { text: string; select: boolean }) {
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!select) return;
    box.current?.focus();
    box.current?.select();
  }, [select]);
  return (
    <details className={styles.promptText} open={select || undefined}>
      <summary className={styles.summary}>{t.showPrompt}</summary>
      <textarea ref={box} className={styles.promptBox} readOnly value={text} aria-label={t.promptLabel} rows={6} />
    </details>
  );
}
