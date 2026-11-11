/**
 * One prompt on Try it on: "Copy prompt" ("1 Copy prompt" on touch devices, with "2 Share
 * photo" beside it), "Copy and open ChatGPT" and "Copy and open Gemini" on every device (a share sheet offers neither app
 * where it is not installed), its own steps in one short line, and under "Show the prompt" the keep-list in words and the prompt in a
 * readable box, selected with "Select all" when the browser refuses to copy. A colour prompt after a dye reaction is "Best done by a colourist".
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Built } from '../../../domain/prompts/build.ts';
import { en } from '../../../strings/en.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { AiAppLinks } from '../../shared/AiAppLinks.tsx';
import { sharePhoto, type PhotoForAi } from './photo-for-ai.ts';
import { useCopy } from '../../shared/useCopy.ts';
import { cx } from '../../../ui/cx.ts';
import styles from './try-on.module.css';

const t = tryOnCopy.handoff;
const d = en.explore.detail;

export interface PromptCardProps {
  readonly prompt: Built;
  readonly handoff: 'touch' | 'desktop';
  /** The photo for the AI chat; `none` on the no-photo path, where the person attaches their own photo there. */
  readonly photo: PhotoForAi | 'none';
  /** Why colour is best done by a colourist (the referral's text), shown when the prompt was refused for it. */
  readonly referral: string | null;
  /** The option's own steps, in one short line. */
  readonly steps?: string;
  /** Takes the place of "2 Share photo" on touch devices (the card shares its photos and sheet). */
  readonly share?: ReactNode;
  /** Beside the links on a computer (the card's downloads). */
  readonly downloads?: ReactNode;
}

export function PromptCard({ prompt, referral, ...rest }: PromptCardProps) {
  if (prompt.ok) return <PromptActions text={prompt.value.text} {...rest} />;
  if (prompt.error !== 'referral') return <p className={styles.problem}>{tryOnCopy.promptFailed(prompt.error)}</p>;
  return (
    <div className={styles.referral}>
      <p className={styles.strong}>{tryOnCopy.referral}</p>
      {referral !== null && <p>{referral}</p>}
    </div>
  );
}

/** The usual steps line for the device and whether there is a photo to hand over. */
function usualSteps(touch: boolean, photo: PhotoForAi | 'none'): string {
  const none = photo === 'none' || photo === 'failed';
  if (touch) return none ? t.steps.touchNoPhoto : t.steps.touch;
  return none ? t.steps.desktopNoPhoto : t.steps.desktop;
}

function PromptActions({ text, handoff, photo, steps, share, downloads }: { readonly text: string } & Omit<PromptCardProps, 'prompt' | 'referral'>) {
  const [state, copy] = useCopy();
  const [shared, setShared] = useState('');
  const touch = handoff === 'touch';
  const live = state === 'copied' ? d.promptCopiedLive : state === 'refused' ? d.copyRefused : shared;
  return (
    <div className={styles.prompt}>
      <div className={styles.buttons}>
        <Button icon="copy" onClick={() => void copy(text)}>
          {state === 'copied' ? d.promptCopied : touch ? t.copyPrompt : d.copyPrompt}
        </Button>
        <Handoff touch={touch} photo={photo} share={share} downloads={downloads} onShared={setShared} onOpen={() => void copy(text)} />
      </div>
      <p className={styles.small}>{steps ?? usualSteps(touch, photo)}</p>
      <LiveRegion message={live} className={cx(styles.status)} />
      <PromptText text={text} select={state === 'refused'} />
    </div>
  );
}

interface HandoffProps extends Pick<PromptCardProps, 'photo' | 'share' | 'downloads'> {
  readonly touch: boolean;
  readonly onShared: (status: string) => void;
  readonly onOpen: () => void;
}

/**
 * What follows Copy: on a computer the two app links and the card's downloads; on a touch device the share step, then the same two links,
 * because one click opens ChatGPT or Gemini on every prompt and a share sheet offers neither where it is not installed.
 * With no photo to hand over, the share step already is those links.
 */
function Handoff({ touch, photo, share, downloads, onShared, onOpen }: HandoffProps) {
  if (!touch) return <><AiAppLinks onOpen={onOpen} />{downloads}</>;
  const stepIsLinks = share === undefined && (photo === 'none' || photo === 'failed');
  return <>{share ?? <ShareStep photo={photo} onResult={onShared} onOpen={onOpen} />}{!stepIsLinks && <AiAppLinks onOpen={onOpen} />}</>;
}

/** "2 Share photo", or "2 Open ChatGPT or Gemini" where there is no photo to hand over. */
function ShareStep({ photo, onResult, onOpen }: { readonly photo: PhotoForAi | 'none'; readonly onResult: (status: string) => void; readonly onOpen: () => void }) {
  if (photo === 'none' || photo === 'failed') return <AiAppLinks label={t.openAnApp} onOpen={onOpen} />;
  const share = async (file: File) => {
    onResult('');
    const outcome = await sharePhoto(file);
    onResult(outcome === 'shared' ? t.shared : outcome === 'downloaded' ? t.downloaded : '');
  };
  return (
    <Button
      variant="secondary"
      icon="shareNetwork"
      busy={photo === null}
      busyText={t.preparing}
      onClick={() => {
        if (photo) void share(photo);
      }}
    >
      {t.sharePhoto}
    </Button>
  );
}

function PromptText({ text, select }: { readonly text: string; readonly select: boolean }) {
  const box = useRef<HTMLTextAreaElement>(null);
  const selectAll = () => {
    box.current?.focus();
    box.current?.select();
  };
  useEffect(() => {
    if (select) selectAll();
  }, [select]);
  return (
    <details className={styles.promptText} open={select || undefined}>
      <summary className={styles.summary}>{d.showPrompt}</summary>
      <p className={styles.small}>{tryOnCopy.keepList}</p>
      <textarea ref={box} className={styles.promptBox} readOnly value={text} aria-label={d.promptLabel} rows={6} />
      {select && (
        <Button variant="text" onClick={selectAll}>
          {t.selectAll}
        </Button>
      )}
    </details>
  );
}
