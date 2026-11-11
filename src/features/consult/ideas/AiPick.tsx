/**
 * "Let ChatGPT or Gemini pick your best 3" on Ideas: copies the text prompt, built when tapped
 * so the copy stays inside the tap, through the shared `CopyPrompt`.
 */
import { AI_PICKS } from '../../../domain/prompts/build.ts';
import { err } from '../../../domain/result.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { CopyPrompt } from '../../shared/CopyPrompt.tsx';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

const t = ideasCopy.aiPick;

export function AiPick({ s }: { readonly s: IdeasScreen }) {
  // After a dye referral under the Colour goal no look can be listed, so there is nothing to offer.
  if (s.engine.pool.length === 0) return null;
  const words = { ...t, button: t.action(Math.min(s.engine.pool.length, AI_PICKS)), box: t.promptLabel };
  return (
    <div className={styles.notice}>
      <CopyPrompt
        build={() => s.port.selectors.promptPack(s.context)?.(s.details.of).secondOpinion ?? err('no_candidates')}
        words={words}
        busy={!s.details.settled}
        busyText={ideasCopy.detailsLoading}
      />
    </div>
  );
}
