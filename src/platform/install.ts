/**
 * Installing the site as an app: the browser's offer is caught once at start-up and used only after a click, then discarded, so nothing nags and nothing
 * repeats; on iPhone and iPad, where there is no such offer, the screen shows the words instead; and neither when the app already runs installed.
 */
/** The offer Chromium browsers make; not in the DOM types because it is not a standard. */
interface InstallPromptEvent extends Event {
  readonly prompt: () => Promise<unknown>;
}

let offer: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = (): void => {
  for (const listener of listeners) listener();
};

/** Catches the browser's offer; once only, because after the person's answer there is nothing more to ask. */
export function watchInstall(): void {
  window.addEventListener(
    'beforeinstallprompt',
    (event) => {
      // Stops the browser's own banner: the offer waits for the person's click on our button.
      event.preventDefault();
      offer = event as InstallPromptEvent;
      notify();
    },
    { once: true },
  );
}

/** Shows the browser's install dialog and lets the offer go; call it only from a click. */
export function install(): void {
  const prompt = offer;
  offer = null;
  notify();
  void prompt?.prompt().catch(() => undefined);
}

/** Calls `listener` when the offer comes or goes. */
export function subscribeOffer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while the browser's offer waits for a click. */
export const isOffered = (): boolean => offer !== null;

/** Running from the Home Screen or as an installed app: nothing more to offer. */
export const runsInstalled = (): boolean => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { readonly standalone?: boolean }).standalone === true;

/** iPhone or iPad, where only the Share menu installs: an iPad's Safari says it is a Mac, and only its touch screen tells it apart. */
export const isIosDevice = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
