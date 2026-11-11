/**
 * The hash router: the path and query live after `#`, so GitHub Pages needs no
 * rewrites. One navigation path: links and `navigate()` add history entries, and Back is `history.back()`.
 */
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { STEPS, type Step } from '../domain/session/session-data.ts';
import { transitionsPlay } from '../platform/device.ts';

/** The part of the URL after `#`: the raw text, its path segments and its query. */
export interface HashLocation {
  readonly raw: string;
  readonly segments: readonly string[];
  readonly query: URLSearchParams;
}

const listeners = new Set<() => void>();
/** What the screen shows; during a page transition it changes inside the transition, so quick changes apply in order. */
let current: HashLocation | undefined;
/** The newest place the URL has reported. */
let latest: HashLocation | undefined;
/** True while a page transition's update runs: a change made then joins that transition instead of starting another. */
let changing = false;
/** The newest page transition: an older one's end must not clear the style this one still needs. */
let newest: ViewTransition | null = null;

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function parse(hash: string): HashLocation {
  const raw = hash.replace(/^#/, '') || '/';
  const [path = '/', search = ''] = raw.split('?', 2);
  return { raw, segments: path.split('/').filter(Boolean).map(decode), query: new URLSearchParams(search) };
}

function snapshot(): HashLocation {
  current ??= parse(window.location.hash);
  latest ??= current;
  return current;
}

type PageChange = 'place' | 'step' | 'step-back';

/** Which page transition a change plays, if any: Explore's grid and detail have their own morph, first load has none, and only where `transitionsPlay`. */
function changeKind(from: HashLocation | undefined, to: HashLocation): PageChange | null {
  if (!from || (from.segments[0] === 'explore' && to.segments[0] === 'explore') || !transitionsPlay()) return null;
  if (from.segments[0] !== to.segments[0]) return 'place';
  // Going back through My look plays the same slide the other way.
  const stepAt = (l: HashLocation): number => STEPS.findIndex((s) => s === l.segments[1]);
  return stepAt(to) < stepAt(from) ? 'step-back' : 'step';
}

/** Runs `change` inside one page transition of `kind`, or at once when there is no kind or one is already running its update. */
function play(kind: PageChange | null, change: () => void): void {
  if (!kind || changing) {
    change();
    return;
  }
  const root = document.documentElement;
  root.dataset.pageChange = kind;
  const transition = document.startViewTransition(() => {
    changing = true;
    try {
      flushSync(change);
    } finally {
      changing = false;
    }
  });
  newest = transition;
  const done = (): void => { if (newest === transition) root.removeAttribute('data-page-change'); };
  // A newer change skips this one: the page still changes, only its animation is dropped.
  void transition.ready.catch(() => undefined);
  void transition.finished.then(done, done);
}

function update(): void {
  const next = parse(window.location.hash);
  if (next.raw === latest?.raw) return;
  const kind = changeKind(latest, next);
  latest = next;
  play(kind, () => {
    current = next;
    for (const listener of listeners) listener();
  });
}

/**
 * My look's machine has moved on while its URL is on screen: `show` tells the screens inside the page transition, so the browser captures
 * the old step as the old one, and the URL's own change joins the same transition.
 */
export function playStepChange(from: Step, to: Step, show: () => void): void {
  play(latest?.segments[0] === 'my-look' ? changeKind(parse(`/my-look/${from}`), parse(`/my-look/${to}`)) : null, show);
}

/** Calls `listener` after every change of the location: links, Back and Forward, and `navigate()` alike. */
export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.removeEventListener('popstate', update);
    window.removeEventListener('hashchange', update);
  };
}

/** Goes to `to`, a path such as `/explore`; `replace` corrects the URL without a new history entry. */
export function navigate(to: string, replace = false): void {
  if (replace) history.replaceState(null, '', `#${to}`);
  else history.pushState(null, '', `#${to}`);
  update();
}

/** The in-app Back button: the browser's Back, so the two always agree. */
export function back(): void {
  history.back();
}

/** The current location; the component re-renders on every change. */
export function useHashLocation(): HashLocation {
  return useSyncExternalStore(subscribe, snapshot);
}
