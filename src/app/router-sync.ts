/**
 * The only code that knows both the machine and the URL. Machine → URL: a new step adds
 * a history entry. URL → machine: a My look URL sends `NAVIGATE`; when `canEnter` refuses, the URL is put back to the
 * machine's step with `replaceState`. The first My look URL starts the session: a kept session restores; `?source=
 * answers` starts from answers; a later step with nothing kept means the page was reloaded, so it shows Photo.
 */
import { exampleMayOpen } from '../machine/consult.logic.ts';
import { STEPS, type Step } from '../machine/consult.types.ts';
import { savingChoice } from '../platform/storage.ts';
import type { ConsultHandle } from './compose.ts';
import { navigate, subscribe } from './router.ts';

const PREFIX = '#/my-look/';

/** The My look step of a hash, or null for any other screen. */
export function stepOfHash(hash: string): Step | null {
  if (!hash.startsWith(PREFIX)) return null;
  const [segment = ''] = hash.slice(PREFIX.length).split(/[?/]/, 1);
  return STEPS.find((s) => s === segment) ?? null;
}

/** `?source=answers` (Home's "No photo?") and `?source=example` (Home's "See an example first"). */
export function sourceOfHash(hash: string): string | null {
  const query = hash.split('?', 2)[1];
  return query === undefined ? null : new URLSearchParams(query).get('source');
}

const hashOf = (step: Step): string => `${PREFIX}${step}`;
/** The step the machine shows, or null before My look has started. */
const stepOf = (h: ConsultHandle): Step | null => h.port.view().step;

/** Where the URL stands: the last hash handled, whether it was a My look URL, whether the page has booted, and whether
 * a URL is being handled now (its own corrections replace the entry, so the machine's moves add none meanwhile). */
interface Seen {
  hash: string | null;
  inMyLook: boolean;
  booted: boolean;
  arriving: boolean;
}

/** Changes the URL, recorded first, so the router's own notice of it is not taken for a new URL. */
function go(seen: Seen, step: Step, replace: boolean): void {
  seen.hash = hashOf(step);
  navigate(hashOf(step).slice(1), replace);
}

/** How the machine starts from its first My look URL. */
function start(h: ConsultHandle, hash: string, step: Step, atBoot: boolean): void {
  const answersOnly = sourceOfHash(hash) === 'answers';
  h.port.send({ type: 'START', source: answersOnly ? 'answers_only' : 'photo', keep: savingChoice() });
  if (atBoot && !answersOnly && step !== 'photo') h.markReloaded();
}

/**
 * "See an example first" goes to the example bar, which fetches the record, picture and mask before START: at the
 * start of My look, or over a session with nothing in it yet. A session that holds work stays as it is.
 */
function exampleAsked(h: ConsultHandle, hash: string): boolean {
  return sourceOfHash(hash) === 'example' && exampleMayOpen(h.port.view());
}

/** One My look URL: start, resume or `NAVIGATE`, then make the URL show the machine's step. */
function arrive(h: ConsultHandle, seen: Seen, hash: string, step: Step, from: Pick<Seen, 'inMyLook' | 'booted'>): void {
  if (exampleAsked(h, hash)) return;
  seen.arriving = true;
  try {
    const shown = stepOf(h);
    if (shown === null) start(h, hash, step, !from.booted);
    // Coming back from Explore or Home to "My look" resumes the step the work stands at.
    else if (step !== shown && !(step === 'photo' && !from.inMyLook)) h.port.send({ type: 'NAVIGATE', to: step });
  } finally {
    seen.arriving = false;
  }
  const now = stepOf(h);
  if (now !== null && (now !== step || hash !== hashOf(step))) go(seen, now, true);
}

/** Machine → URL: a new step adds a history entry while a My look URL is shown (transient steps never get one). */
function follow(h: ConsultHandle, seen: Seen): void {
  let last = stepOf(h);
  h.port.subscribe(() => {
    const step = stepOf(h);
    if (step === last) return;
    last = step;
    const shown = stepOfHash(window.location.hash);
    if (!seen.arriving && step !== null && shown !== null && shown !== step) go(seen, step, false);
  });
}

/** Starts both directions of the sync; returns the stop function. */
export function startRouterSync(getConsult: () => Promise<ConsultHandle>): () => void {
  const seen: Seen = { hash: null, inMyLook: false, booted: false, arriving: false };
  let handle: ConsultHandle | null = null;
  const onUrl = (): void => {
    const hash = window.location.hash;
    // A link click fires both `popstate` and `hashchange`, and our own changes come back: each is handled once.
    if (hash === seen.hash) return;
    const step = stepOfHash(hash);
    const from = { inMyLook: seen.inMyLook, booted: seen.booted };
    Object.assign(seen, { hash, inMyLook: step !== null, booted: true });
    if (step === null) return;
    if (handle) {
      arrive(handle, seen, hash, step, from);
      return;
    }
    void getConsult().then(
      (h) => {
        if (!handle) follow(h, seen);
        handle = h;
        if (window.location.hash === hash) arrive(h, seen, hash, step, from);
      },
      // My look could not start (its route says so and offers Try again); the next My look URL tries once more.
      () => {
        seen.hash = null;
      },
    );
  };
  // The router hears links, Back and Forward, and every `navigate()` (Explore's "Find my look with this style").
  const stop = subscribe(onUrl);
  onUrl();
  return stop;
}
