/**
 * The app root: reads the hash route, renders its screen inside the shell and an error boundary, holds the
 * Settings sheet, and moves focus to the new screen's heading after each navigation. A change of
 * language renders the screen again from scratch; answers and drafts live in the machine, so they stay.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { LanguageNotice, OfflineNotice } from '../features/help/OfflineNotice.tsx';
import { languageState, subscribeLanguage } from '../strings/locale.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { InAppBrowserNotice } from './InAppBrowser.tsx';
import { useHashLocation } from './router.ts';
import { boundaryKey, matchRoute, renderRoute, screenKey, sectionOf } from './routes.tsx';
import { SettingsSheet } from './SettingsSheet.tsx';
import { Shell } from './Shell.tsx';

export function App() {
  const location = useHashLocation();
  const route = matchRoute(location.segments);
  const screen = screenKey(route, location.raw);
  const mainRef = useRef<HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shown } = useSyncExternalStore(subscribeLanguage, languageState);
  useFocusOnNavigation(mainRef, screen);
  return (
    <>
      <Shell
        section={sectionOf(route)}
        mainRef={mainRef}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
      >
        <OfflineNotice />
        <LanguageNotice />
        <ErrorBoundary key={`${boundaryKey(route, screen)} ${shown}`} resetOn={screen}>{renderRoute(route, <InAppBrowserNotice />)}</ErrorBoundary>
      </Shell>
      <SettingsSheet
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
      />
    </>
  );
}

/**
 * After a navigation to another screen (not on first load), scroll to the top and focus the new screen's `h1`. A
 * change within a screen (Explore's filters, its detail) keeps the place and the focus.
 */
function useFocusOnNavigation(mainRef: RefObject<HTMLElement | null>, key: string) {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return undefined;
    previous.current = key;
    window.scrollTo(0, 0);
    const main = mainRef.current;
    if (!main || focusHeading(main)) return undefined;
    // A lazy screen (Explore, Saved, Help) commits a moment after this effect, and its heading comes with it.
    const observer = new MutationObserver(() => {
      if (focusHeading(main)) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [mainRef, key]);
}

function focusHeading(main: HTMLElement): boolean {
  const heading = main.querySelector('h1');
  if (!heading) return false;
  heading.tabIndex = -1;
  heading.focus();
  return true;
}
