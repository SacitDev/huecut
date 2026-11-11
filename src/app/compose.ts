/**
 * The composition root of My look: the one machine, made with `provide()` (the worker
 * supervisor, the model loader and the photo analysis from `platform/analysis`, the `hasIdeas` guard, `releasePhoto` and
 * `disposePictures`), its selectors with the engine, the prompt builder and the stylist sheet, and the port the screens
 * use. Created once per app session, on first use, so Home and Explore never wait for it; leaving My look keeps it.
 */
import { createActor, type ActorRefFrom } from 'xstate';
import type { DeviceInfo } from '../domain/device.ts';
import type { PhotoId } from '../domain/ids.ts';
import { err } from '../domain/result.ts';
import type { ConsultPort, ConsultView, CoreState, Selectors } from '../features/consult/useConsult.ts';
import { consultMachine, currentStep, type ConsultSnapshot } from '../machine/consult.machine.ts';
import { createConsultSelectors } from '../machine/consult.selectors.ts';
import type { ConsultContext, ConsultEmitted, ExtrasPolicy, LoaderEvent, MachineEvent, WorkerRestartedEvent } from '../machine/consult.types.ts';
import { IDLE_MODELS } from '../machine/regions/models.ts';
import { analyseActor, loaderActor, supervisorActor, type AnalysePhoto, type LoadModels, type SuperviseWorker } from '../machine/setup.ts';
import { browserWorkerStarter } from '../platform/analysis/bootstrap.ts';
import { limitsFor } from '../platform/analysis/limits.ts';
import { superviseWorker as startSupervisor, type Supervisor } from '../platform/analysis/supervisor.ts';
import { content } from '../platform/content.ts';
import { readDevice } from '../platform/device.ts';
import * as resources from '../platform/resources.ts';
import type { HelpFacts } from '../features/help/Help.tsx';
import { extraBlock } from '../machine/consult.selectors.ts';
import type { AnalysisError, CoreModel, Diagnostics, ExtraModel, LoadProgress } from '../worker/protocol.ts';
import { connectExtras, type ExtraState } from '../features/consult/extras/connection.ts';
import { clearMarkerOnPageHide, crashedExtras, hairOnly, markRunningExtra } from '../platform/hair-tools.ts';
import { selectorDeps } from './consult-deps.ts';
import { playStepChange } from './router.ts';
import { followBrowser, restoreSession, startSessionSync } from './session-sync.ts';
import { subscribeLanguage } from '../strings/locale.ts';

/** The core tools in load order: face first (without it the load fails), then the hair outline, hands and pose. */
const CORE_MODELS: readonly CoreModel[] = ['face', 'segmenter', 'hand', 'pose'];
/**
 * Measured on throttled phone and tablet profiles, the extras missed their memory, first-tap
 * and depth limits, so depth (and with it the 3D view) and tap-to-select run on computers only; phones and tablets
 * show "Available on a computer".
 */
const EXTRAS_ON_COMPUTERS_ONLY = true;

export type ConsultActor = ActorRefFrom<typeof consultMachine>;

/** What the app holds: the port, which only router-sync may also send `NAVIGATE` through, and router-sync's reload flag. */
export interface ConsultHandle {
  readonly port: Omit<ConsultPort, 'send'> & { readonly send: (event: MachineEvent) => void };
  readonly markReloaded: () => void;
}

/** An extra whose marker was found at boot crashed the tab last time, so it is off for this tab. */
const extrasPolicy = (): ExtrasPolicy => ({ computersOnly: EXTRAS_ON_COMPUTERS_ONLY, crashed: crashedExtras() });

/** The session's supervisor, made when `session` is entered and ended when it is left (RESET). */
function supervision(device: DeviceInfo) {
  const limits = limitsFor(device.class);
  let current: Supervisor | null = null;
  let tell: ((event: WorkerRestartedEvent) => void) | null = null;
  const ensure = (): Supervisor =>
    (current ??= startSupervisor({
      limits,
      start: browserWorkerStarter(limits),
      onRestarted: (reason) => {
        tell?.({ type: 'WORKER.RESTARTED', reason });
      },
      onExtraRun: markRunningExtra,
    }));
  const supervise: SuperviseWorker = (send) => {
    tell = send;
    ensure();
    return () => {
      current?.stop();
      current = null;
      tell = null;
      resources.disposeAll();
    };
  };
  return { ensure, supervise, release: (id: PhotoId) => current?.release(id), diagnostics: () => current?.diagnostics() };
}

const notLoaded = (model: ExtraModel): AnalysisError => ({ code: 'internal', model, retryable: true, detail: `${model} is missing after its load` });

/** One download for the machine's loader actor; nothing is sent once its state has been left (`signal`). */
const loaderFor =
  (ensure: () => Supervisor): LoadModels =>
  (input, send, signal) => {
    const live = (event: LoaderEvent): void => {
      if (!signal.aborted) send(event);
    };
    const { model } = input;
    if (model === 'core') {
      void ensure()
        .load(CORE_MODELS, (progress) => {
          live({ type: 'MODELS.PROGRESS', progress });
        }, signal)
        .then((r) => {
          live(r.ok ? { type: 'MODELS.READY', loaded: r.value.loaded, missing: r.value.missing } : { type: 'MODELS.FAILED', error: r.error });
        });
      return;
    }
    void ensure()
      .load([model], (progress) => {
        live({ type: 'EXTRA.PROGRESS', model, progress });
      }, signal)
      .then((r) => {
        live(r.ok && r.value.loaded.includes(model) ? { type: 'EXTRA.READY', model } : { type: 'EXTRA.FAILED', model, error: r.ok ? notLoaded(model) : r.error });
      });
  };

/** The worker receives the photo's Blob and decodes it itself. */
const analyseWith =
  (ensure: () => Supervisor): AnalysePhoto =>
  async ({ photoId }, signal) => {
    const stored = resources.photo(photoId);
    if (!stored) return err({ code: 'internal', retryable: false, detail: `photo ${photoId} is not in the resource store` });
    return ensure().analyse({ id: photoId, blob: stored.blob }, signal);
  };

const CORE_STATES: readonly CoreState[] = ['idle', 'loading', 'ready', 'degraded', 'failed'];
const coreOf = (s: ConsultSnapshot): CoreState => CORE_STATES.find((c) => s.matches({ session: { models: { core: c } } })) ?? 'idle';

const EXTRA_STATES: readonly ExtraState[] = ['check', 'idle', 'downloading', 'ready', 'unsupported', 'failed'];
/** An extra's state in the `models` region; the context cannot tell it, because `ready` and `idle` hold the same status. */
const extraStateOf = (s: ConsultSnapshot, model: ExtraModel): ExtraState =>
  EXTRA_STATES.find((e) => (model === 'depth' ? s.matches({ session: { models: { depth: e } } }) : s.matches({ session: { models: { sam: e } } }))) ?? 'idle';

/** The core download as one fraction: each model in load order is one equal part, filled by its bytes. */
export function coreFraction(p: LoadProgress): number {
  const index = CORE_MODELS.findIndex((m) => m === p.model);
  const within = p.totalBytes > 0 ? Math.min(1, p.loadedBytes / p.totalBytes) : 0;
  return index < 0 ? 0 : (index + within) / CORE_MODELS.length;
}

const NOTICES = ['SHORTLIST.REFUSED'] as const satisfies readonly ConsultEmitted['type'][];

/** The screens' view of a snapshot: its step, the core tools' state, the reload flag. */
function viewOf(snapshot: ConsultSnapshot, flags: { readonly reloaded: boolean }): ConsultView {
  const { context } = snapshot;
  return {
    context,
    step: currentStep(snapshot),
    core: coreOf(snapshot),
    analysing: snapshot.matches({ session: { analysis: 'working' } }),
    reloaded: flags.reloaded && context.photos.length === 0,
  };
}

/** The two snapshots differ at most in download progress, so the screens have nothing new to draw. */
function sameButProgress(a: ConsultSnapshot, b: ConsultSnapshot): boolean {
  const states = (s: ConsultSnapshot): string => JSON.stringify([s.value, s.context.models], (key, value: unknown) => (key === 'progress' ? null : value));
  return (Object.keys(a.context) as (keyof ConsultContext)[]).every((key) => key === 'models' || a.context[key] === b.context[key]) && states(a) === states(b);
}

/**
 * One view object per snapshot the screens were told about, so `useSyncExternalStore` sees a stable value. A step change is told inside
 * its page transition, after the browser has captured the old screen; download progress alone tells them nothing.
 */
function viewSource(actor: ConsultActor) {
  const listeners = new Set<() => void>();
  const flags = { reloaded: false };
  let shown = actor.getSnapshot();
  let moving = false;
  let cached: { readonly snapshot: ConsultSnapshot; readonly reloaded: boolean; readonly view: ConsultView } | null = null;
  const notify = (): void => {
    for (const listener of listeners) listener();
  };
  const tell = (): void => {
    moving = false;
    shown = actor.getSnapshot();
    notify();
  };
  actor.subscribe((snapshot) => {
    if (moving || sameButProgress(shown, snapshot)) return;
    const [from, to] = [currentStep(shown), currentStep(snapshot)];
    if (from === to || from === null || to === null) {
      tell();
      return;
    }
    moving = true;
    playStepChange(from, to, tell);
  });
  const view = (): ConsultView => {
    if (cached?.snapshot !== shown || cached.reloaded !== flags.reloaded) cached = { snapshot: shown, reloaded: flags.reloaded, view: viewOf(shown, flags) };
    return cached.view;
  };
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const markReloaded = (): void => {
    flags.reloaded = true;
    notify();
  };
  return { view, subscribe, markReloaded };
}

/** The downloads for their progress lines, on a subscription of their own. */
function downloadSource(actor: ConsultActor): ConsultPort['download'] {
  const listeners = new Set<() => void>();
  let first = false;
  actor.subscribe((snapshot) => {
    if (snapshot.context.models.core.progress?.phase === 'download') first = true;
    for (const listener of listeners) listener();
  });
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    fraction: (model) => {
      const { progress } = actor.getSnapshot().context.models[model];
      if (!progress) return null;
      if (model === 'core') return coreFraction(progress);
      return progress.totalBytes > 0 ? progress.loadedBytes / progress.totalBytes : null;
    },
    firstCore: () => first,
  };
}

/** The port the screens and router-sync use. */
function portFor(actor: ConsultActor, selectors: () => Selectors): ConsultHandle {
  const { view, subscribe, markReloaded } = viewSource(actor);
  const port: ConsultHandle['port'] = {
    subscribe,
    view,
    download: downloadSource(actor),
    send: (event) => {
      actor.send(event);
    },
    get selectors() {
      return selectors();
    },
    on: (listener) => {
      const subscriptions = NOTICES.map((type) => actor.on(type, listener));
      return () => {
        for (const s of subscriptions) s.unsubscribe();
      };
    },
    back: () => {
      history.back();
    },
    hairOnly,
  };
  return { port, markReloaded };
}

let readDiagnostics: (() => Promise<Diagnostics> | undefined) | null = null;
/** The running session, whose context knows what has happened since boot; a marker read now could be a run in progress. */
let readContext: (() => ConsultSnapshot['context']) | null = null;

/** For Help: requests blocked so far in this session (0 before My look starts) and why each extra is off here. */
export async function helpFacts(): Promise<HelpFacts> {
  const diagnostics = await readDiagnostics?.();
  const blocked = Object.values(diagnostics?.blocked ?? {}).reduce((sum, n) => sum + n, 0);
  const c = readContext?.() ?? { device: readDevice(), extras: extrasPolicy(), models: IDLE_MODELS };
  return { blocked, extras: { depth: extraBlock(c, 'depth'), sam: extraBlock(c, 'sam') } };
}

async function boot(): Promise<ConsultHandle> {
  const device = readDevice();
  const loaded = Promise.all([content.consult(), content.index()]);
  const [[data, library], restore] = await Promise.all([loaded, restoreSession(Date.now(), loaded)]);
  if (!data.ok || !library.ok) throw new Error(`My look's content did not load: ${data.ok ? '' : data.error} ${library.ok ? '' : library.error}`);
  clearMarkerOnPageHide();
  const workers = supervision(device);
  readDiagnostics = workers.diagnostics;
  let selectors = createConsultSelectors(selectorDeps);
  // The engine copies reasons and notes from the content as it runs, so another language works them out again.
  subscribeLanguage(() => {
    selectors = createConsultSelectors(selectorDeps);
  });
  const machine = consultMachine.provide({
    actors: {
      superviseWorker: supervisorActor(workers.supervise),
      loadModels: loaderActor(loaderFor(workers.ensure)),
      analysePhoto: analyseActor(analyseWith(workers.ensure)),
    },
    guards: { hasIdeas: ({ context }) => selectors.hasIdeas(context) },
    actions: {
      releasePhoto: (_, { photoId }) => {
        resources.removePhoto(photoId);
        workers.release(photoId);
      },
      disposePictures: (_, { ids }) => {
        resources.disposePictures(ids);
      },
    },
  });
  const input = { content: { library: library.value, consult: data.value }, device, extras: extrasPolicy(), restore };
  const actor = createActor(machine, { input });
  actor.start();
  readContext = () => actor.getSnapshot().context;
  followBrowser(actor, startSessionSync(actor, restore));
  const handle = portFor(actor, () => selectors);
  connectExtras({ port: handle.port, extraState: (model) => extraStateOf(actor.getSnapshot(), model), worker: workers.ensure });
  return handle;
}

let booting: Promise<ConsultHandle> | null = null;
/**
 * The app's one My look machine, made on first use (a My look URL, or Explore adding to the list). A failed start (the
 * content could not be fetched, say offline on a first visit) is forgotten, so the next use tries again.
 */
export const consult = (): Promise<ConsultHandle> =>
  (booting ??= boot().catch((e: unknown) => {
    booting = null;
    throw e;
  }));
