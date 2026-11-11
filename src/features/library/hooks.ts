/**
 * Explore's three hooks: content from `platform/content.ts` as a load state with "Try again", a media query (the
 * window class decides sheet or side panel), and a value that waits for quick changes to stop.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ContentError, Loaded } from '../../platform/content.ts';

export type Loadable<T> =
  | { readonly status: 'idle' | 'loading'; readonly retry: () => void }
  | { readonly status: 'ready'; readonly value: T; readonly retry: () => void }
  | { readonly status: 'error'; readonly error: ContentError; readonly retry: () => void };

/**
 * Loads with `load` while `key` is not null, again when `key` changes and on `retry()`. The state is derived from the
 * last result's key, so a new key reads as loading at once, with no state set during the effect.
 */
export function useContent<T>(key: string | null, load: () => Promise<Loaded<T>>): Loadable<T> {
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState<{ readonly tag: string; readonly result: Loaded<T> } | null>(null);
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  });
  const tag = key === null ? null : `${key}#${String(attempt)}`;
  useEffect(() => {
    if (tag === null) return;
    let live = true;
    void loader.current().then((result) => {
      if (live) setDone({ tag, result });
    });
    return () => {
      live = false;
    };
  }, [tag]);
  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);
  if (tag === null) return { status: 'idle', retry };
  if (done?.tag !== tag) return { status: 'loading', retry };
  return done.result.ok ? { status: 'ready', value: done.result.value, retry } : { status: 'error', error: done.result.error, retry };
}

/** `value`, once it has stayed the same for `ms`. */
export function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(value);
    }, ms);
    return () => {
      clearTimeout(timer);
    };
  }, [value, ms]);
  return settled;
}

/** Whether `query` matches now; re-renders when it starts or stops matching. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', listener);
      return () => {
        list.removeEventListener('change', listener);
      };
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
