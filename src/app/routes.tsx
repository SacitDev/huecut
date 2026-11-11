/**
 * The route table: hash paths to screens.
 */
import { lazy, Suspense, type ReactNode } from 'react';
import type { ItemId } from '../domain/ids.ts';
import { Home } from '../features/home/Home.tsx';
import type { FindMyLookResult } from '../features/library/Explore.tsx';
import { toggleFavourite, useFavourites } from '../features/library/favourites.ts';
import { STEPS } from '../domain/session/session-data.ts';
import { en } from '../strings/en.ts';
import { LinkButton } from '../ui/components/Button.tsx';
import { Progress } from '../ui/components/Progress.tsx';
import { MyLookRoute, startedPort } from './MyLookRoute.tsx';
import { applyStoredPreferences } from './preferences.ts';
import { back, navigate, useHashLocation } from './router.ts';
import styles from './routes.module.css';

const EXPLORE_KINDS = ['style', 'colour', 'beard'] as const;
const HELP_TOPICS = ['privacy', 'method', 'prompts', 'credits'] as const;

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'explore' }
  | { readonly name: 'explore-item'; readonly kind: (typeof EXPLORE_KINDS)[number]; readonly id: string }
  | { readonly name: 'my-look'; readonly step: (typeof STEPS)[number] }
  | { readonly name: 'saved' }
  | { readonly name: 'help'; readonly topic: (typeof HELP_TOPICS)[number] | null }
  | { readonly name: 'not-found' };

/** The navigation section a route belongs to, for `aria-current` in the tab bar, rail and top bar. */
export type Section = 'explore' | 'my-look' | 'saved' | 'help' | null;

/**
 * Hrefs used by the shell and Home. `source` on the two My look entries tells the flow where it starts
 * (the machine's `start` state: the example opens at the face card, no photo opens at Goal).
 */
export const links = {
  home: '#/',
  explore: '#/explore',
  myLook: '#/my-look/photo',
  saved: '#/saved',
  help: '#/help',
  example: '#/my-look/face?source=example',
  answersOnly: '#/my-look/goal?source=answers',
} as const;

const NOT_FOUND: Route = { name: 'not-found' };

function pick<T extends string>(allowed: readonly T[], value: string | undefined): T | undefined {
  return allowed.find((item) => item === value);
}

function matchExplore(kindSegment: string | undefined, id: string | undefined): Route {
  if (kindSegment === undefined) return { name: 'explore' };
  const kind = pick(EXPLORE_KINDS, kindSegment);
  return kind && id ? { name: 'explore-item', kind, id } : NOT_FOUND;
}

function matchMyLook(stepSegment: string | undefined, extra: string | undefined): Route {
  const step = pick(STEPS, stepSegment);
  return step && extra === undefined ? { name: 'my-look', step } : NOT_FOUND;
}

function matchHelp(topicSegment: string | undefined, extra: string | undefined): Route {
  if (extra !== undefined) return NOT_FOUND;
  if (topicSegment === undefined) return { name: 'help', topic: null };
  const topic = pick(HELP_TOPICS, topicSegment);
  return topic ? { name: 'help', topic } : NOT_FOUND;
}

/** Matches path segments to a route; anything unknown, or a step or kind that does not exist, is not found. */
export function matchRoute(segments: readonly string[]): Route {
  const [first, second, third, ...rest] = segments;
  if (rest.length > 0) return NOT_FOUND;
  switch (first) {
    case undefined:
      return { name: 'home' };
    case 'explore':
      return matchExplore(second, third);
    case 'my-look':
      return matchMyLook(second, third);
    case 'saved':
      return second === undefined ? { name: 'saved' } : NOT_FOUND;
    case 'help':
      return matchHelp(second, third);
    default:
      return NOT_FOUND;
  }
}

/**
 * The screen a route shows, for App's error-boundary key and its focus move: the grid and its item detail are one
 * screen, so changing a filter or opening a detail keeps Explore mounted, scrolled and focused where it was.
 */
export function screenKey(route: Route, raw: string): string {
  return route.name === 'explore' || route.name === 'explore-item' ? 'explore' : raw;
}

/** The screen's error boundary: My look's steps share one, so a step mounts once however the URL catches up with the machine. */
export function boundaryKey(route: Route, screen: string): string {
  return route.name === 'my-look' ? 'my-look' : screen;
}

export function sectionOf(route: Route): Section {
  switch (route.name) {
    case 'explore':
    case 'explore-item':
      return 'explore';
    case 'my-look':
      return 'my-look';
    case 'saved':
      return 'saved';
    case 'help':
      return 'help';
    case 'home':
    case 'not-found':
      return null;
  }
}

/** Own chunks whose download starts with the app, as Explore's does, so the heading is there for the focus move. */
const savedChunk = import('../features/saved/Saved.tsx');
const Saved = lazy(() => savedChunk.then((m) => ({ default: m.Saved })));
const helpChunk = import('../features/help/Help.tsx');
const Help = lazy(() => helpChunk.then((m) => ({ default: m.Help })));
/** Reads compose.ts only when Help asks; it does not start My look. */
const helpFacts = () => import('./compose.ts').then((m) => m.helpFacts());

/**
 * While a screen's own code loads: its words and the moving line, where a slow connection showed a blank page for seconds.
 * No heading, so the focus move waits for the screen's own.
 */
function Opening({ words }: { readonly words: string }) {
  return (
    <div className={styles.page}>
      <Progress label={words} value={null} />
    </div>
  );
}

function SavedRoute() {
  const favourites = useFavourites();
  return (
    <Suspense fallback={<Opening words={en.app.opening.saved} />}>
      <Saved favourites={favourites} onRemove={toggleFavourite} port={startedPort()} onDeleted={applyStoredPreferences} />
    </Suspense>
  );
}

/**
 * Explore is its own chunk; its download starts with the app, so opening Explore rarely waits and
 * its opening line rarely shows.
 */
const exploreChunk = import('../features/library/Explore.tsx');
const Explore = lazy(() => exploreChunk.then((m) => ({ default: m.Explore })));

/**
 * "Find my look with this style": the item goes on My look's list (`SHORTLIST.ADD` works before My look starts) and
 * My look opens at the step it was on, or at Photo if it has not started. A full list keeps the person on Explore with
 * the machine's refusal in words.
 */
async function addToMyLook(id: ItemId): Promise<FindMyLookResult> {
  try {
    const { consult } = await import('./compose.ts');
    const { port } = await consult();
    // The machine handles `send` synchronously, so a refusal has been emitted by the time `send` returns.
    const refused: ItemId[] = [];
    // The machine's only notice is this refusal.
    const stop = port.on((notice) => {
      refused.push(notice.id);
    });
    port.send({ type: 'SHORTLIST.ADD', id });
    stop();
    if (refused.includes(id)) return 'full';
    navigate(`/my-look/${port.view().step ?? 'photo'}`);
    return 'added';
  } catch {
    return 'failed';
  }
}

/** "Start again" after the person's yes: a new session in the one machine, and My look opens on it. A failed start shows on My look, with Try again. */
function startAgain(): void {
  const open = (): void => { navigate(links.myLook.slice(1)); };
  void import('./compose.ts').then((m) => m.consult()).then(({ port }) => {
    port.send({ type: 'START_AGAIN' });
    open();
  }, open);
}

function ExploreRoute({ item }: { item: { readonly kind: (typeof EXPLORE_KINDS)[number]; readonly id: string } | null }) {
  const { query } = useHashLocation();
  return (
    <Suspense fallback={<Opening words={en.app.opening.explore} />}>
      <Explore query={query} item={item} navigate={navigate} back={back} onFindMyLook={addToMyLook} />
    </Suspense>
  );
}

function NotFound() {
  return (
    <section className={styles.page}>
      <h1>{en.notFound.title}</h1>
      <p className={styles.body}>{en.notFound.body}</p>
      <LinkButton variant="secondary" href={links.home}>
        {en.notFound.action}
      </LinkButton>
    </section>
  );
}

/** The screen for a route. `notice` is the in-app browser notice, shown on Home. */
export function renderRoute(route: Route, notice: ReactNode): ReactNode {
  switch (route.name) {
    case 'home':
      return (
        <Home
          links={{
            findMyLook: links.myLook,
            explore: links.explore,
            example: links.example,
            answersOnly: links.answersOnly,
          }}
          notice={notice}
          onStartAgain={startAgain}
        />
      );
    case 'explore':
      return <ExploreRoute item={null} />;
    case 'explore-item':
      return <ExploreRoute item={{ kind: route.kind, id: route.id }} />;
    case 'my-look':
      return <MyLookRoute />;
    case 'saved':
      return <SavedRoute />;
    case 'help':
      return (
        <Suspense fallback={<Opening words={en.app.opening.help} />}>
          <Help topic={route.topic} facts={helpFacts} />
        </Suspense>
      );
    case 'not-found':
      return <NotFound />;
  }
}
