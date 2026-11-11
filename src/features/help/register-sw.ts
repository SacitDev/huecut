/**
 * Registers the service worker in a build. `scriptUrl` is the page's Trusted Types conversion: the
 * CSP requires a TrustedScriptURL for `register` and the one allowed policy belongs to the platform layer. It waits for the
 * `load` event, so installing the shell never competes with the first screen.
 */

export function registerServiceWorker(scriptUrl: (url: string) => string): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const url = new URL(`${import.meta.env.BASE_URL}sw.js`, location.origin).href;
  // Without a service worker the app still runs; it only loses the offline shell.
  const register = (): void => { navigator.serviceWorker.register(scriptUrl(url), { scope: import.meta.env.BASE_URL }).catch(() => undefined); };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** Tells the service worker which language the person chose, so it keeps that language's files and lets the other's go. */
export function tellServiceWorker(language: string): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'language', language });
  });
}
