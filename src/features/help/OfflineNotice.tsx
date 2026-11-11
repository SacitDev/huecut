/** The offline line and the one Latvian-load line, each in a live region that stays mounted so a change is announced once. */
import { useSyncExternalStore } from 'react';
import { helpCopy } from '../../strings/en-help.ts';
import { languageCopy } from '../../strings/en-language.ts';
import { languageState, subscribeLanguage } from '../../strings/locale.ts';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import styles from './Help.module.css';

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  return <LiveRegion message={online ? '' : helpCopy.offline} className={styles.offline ?? ''} />;
}

/** Latvian was chosen but could not load: the app works in English, the choice is kept, and a reload tries again. */
export function LanguageNotice() {
  const { failed } = useSyncExternalStore(subscribeLanguage, languageState);
  return <LiveRegion message={failed ? languageCopy.failed : ''} className={styles.offline ?? ''} />;
}
