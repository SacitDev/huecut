/**
 * Entry point: the self-hosted fonts (Latin and Latin Extended by unicode-range, font-display swap), the token,
 * base and motion styles, the stored theme and motion settings, the chosen language (laid over the English before the first
 * render), then the React root.
 */
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/figtree/wght.css';
import '../ui/tokens.css';
import '../ui/base.css';
import '../ui/motion.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { applyStoredPreferences } from './preferences.ts';
import { startRouterSync } from './router-sync.ts';
import { registerServiceWorker, tellServiceWorker } from '../features/help/register-sw.ts';
import { localiseContentWith } from '../platform/content.ts';
import { watchInstall } from '../platform/install.ts';
import { readSession } from '../platform/storage.ts';
import { trustedScriptUrl } from '../platform/trusted-url.ts';
import { WORD_TREES } from '../domain/render-model/copy.ts';
import { addStringTrees, languageState, localiseContent, startLanguage, subscribeLanguage } from '../strings/locale.ts';

applyStoredPreferences();
localiseContentWith(localiseContent);
// The copy the screens show and the engine's joining words live in the domain, so they join the strings here.
addStringTrees(WORD_TREES);
registerServiceWorker(trustedScriptUrl);
watchInstall();
// A radio, checkbox or answer tile is seen as its whole label, not its small input: focus keeps that label clear of the fixed bars by the
// page's scroll padding (WCAG 2.4.11). WebKit does not scroll at all when arrow keys move focus within a group, so this scrolls it.
document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLInputElement) event.target.closest('label')?.scrollIntoView({ block: 'nearest' });
});
// Reading a saved session deletes it once it is past its period: done here, so that holds whichever page the app opens on.
void readSession();
await startLanguage();
// The service worker keeps the chosen language's files for offline use and lets the other's go.
let told = languageState().chosen;
tellServiceWorker(told);
subscribeLanguage(() => {
  if (languageState().chosen !== told) tellServiceWorker((told = languageState().chosen));
});
// My look's machine and the URL stay in step from the first My look URL on. The machine and its
// tools load only then, so Home and Explore never carry them.
startRouterSync(() => import('./compose.ts').then((m) => m.consult()));

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
