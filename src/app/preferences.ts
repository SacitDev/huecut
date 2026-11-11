/**
 * Theme and motion settings: kept in localStorage as `huecut:theme` and `huecut:motion` (nothing personal) and applied as
 * `data-theme` and `data-motion` on <html>, which tokens.css follows.
 */

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const MOTIONS = ['device', 'reduce'] as const;
export type Motion = (typeof MOTIONS)[number];

const THEME_KEY = 'huecut:theme';
const MOTION_KEY = 'huecut:motion';

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return allowed.find((value) => value === stored) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is blocked (private mode or a full quota): the choice still applies until the page reloads.
  }
}

export function readTheme(): Theme {
  return read(THEME_KEY, THEMES, 'system');
}

export function readMotion(): Motion {
  return read(MOTION_KEY, MOTIONS, 'device');
}

/** System removes the attribute, so the `prefers-color-scheme` block of tokens.css decides. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Reduce forces the reduced-motion tokens; Follow my device leaves `prefers-reduced-motion` in charge. */
export function applyMotion(motion: Motion): void {
  const root = document.documentElement;
  if (motion === 'reduce') root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
}

export function saveTheme(theme: Theme): void {
  write(THEME_KEY, theme);
  applyTheme(theme);
}

export function saveMotion(motion: Motion): void {
  write(MOTION_KEY, motion);
  applyMotion(motion);
}

/** Runs before the first render, so the stored theme paints from the start. */
export function applyStoredPreferences(): void {
  applyTheme(readTheme());
  applyMotion(readMotion());
}
