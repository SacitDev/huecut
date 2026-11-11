/**
 * "Copy and open ChatGPT" and "Copy and open Gemini": each app's start page in a new tab, and
 * the one click also puts the prompt on the clipboard, so the person only has to paste. Never a prefilled link, which would put the
 * prompt and the person's answers in a URL.
 */
import { useId, type MouseEvent } from 'react';
import { tryOnCopy } from '../../strings/en-try-on.ts';
import buttonStyles from '../../ui/components/Button.module.css';
import { cx } from '../../ui/cx.ts';
import styles from './AiAppLinks.module.css';

const t = tryOnCopy.handoff;
const APPS = [
  { name: 'copyOpenChatGpt', url: 'https://chatgpt.com/' },
  { name: 'copyOpenGemini', url: 'https://gemini.google.com/' },
] as const;

/** The two links; with `label` ("2 Open ChatGPT or Gemini" on touch devices) they are a group named by it. `onOpen` copies, and may keep the tab shut. */
export function AiAppLinks({ label, onOpen }: { readonly label?: string; readonly onOpen: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const id = useId();
  const links = (
    <div className={styles.buttons}>
      {APPS.map((app) => (
        <a
          key={app.url}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonStyles.button, buttonStyles.secondary, 'press')}
          onClick={onOpen}
        >
          <span>{t[app.name]}</span>
          <span className="visually-hidden"> {t.newTab}</span>
        </a>
      ))}
    </div>
  );
  if (label === undefined) return links;
  return (
    <div role="group" aria-labelledby={id} className={styles.group}>
      <span id={id} className={styles.label}>
        {label}
      </span>
      {links}
    </div>
  );
}
