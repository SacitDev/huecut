/**
 * The `models` region and its rules: `core` (the MediaPipe set, started by
 * `wantsCore` or by a photo tool that needs it) and the extras `depth` and `sam`, built by the typed `extraRegion(model)` factory. Each downloading state
 * invokes the loader; leaving it (CANCEL, RESET, a restart) stops the actor, whose cleanup aborts that download only.
 */
import type { ExtraModel, ModelId } from '../../worker/protocol.ts';
import type {
  ConsultContext,
  MachineEvent,
  DownloadKey,
  ExtraBlock,
  ModelStatus,
  ModelsStatus,
} from '../consult.types.ts';
import { consultSetup } from '../setup.ts';

const CORE_MODELS: readonly ModelId[] = ['face', 'hand', 'pose', 'segmenter'];
const IDLE: ModelStatus = { progress: null, error: null, missing: [] };
export const IDLE_MODELS: ModelsStatus = { core: IDLE, depth: IDLE, sam: IDLE, outOfMemory: 0 };
/** Out of memory this many times in one session switches the extras off. */
const OUT_OF_MEMORY_LIMIT = 2;
const NO_FACE = { code: 'unsupported', model: 'face', retryable: true, detail: 'the face model did not load' } as const;
const STOPPED = { code: 'aborted', retryable: true, detail: 'the person stopped the download' } as const;

/** `MODELS.READY` → `ready` with every core model, `degraded` with the face model only, else `failed`. */
export function coreOutcome(loaded: readonly ModelId[]): 'ready' | 'degraded' | 'failed' {
  if (!loaded.includes('face')) return 'failed';
  return CORE_MODELS.every((m) => loaded.includes(m)) ? 'ready' : 'degraded';
}

/** The status of one download after a loader event or CANCEL; other events leave it as it is. */
export function modelStatusAfter(s: ModelStatus, e: MachineEvent): ModelStatus {
  if (e.type === 'MODELS.PROGRESS' || e.type === 'EXTRA.PROGRESS') return { ...s, progress: e.progress };
  if (e.type === 'MODELS.READY') {
    return { progress: null, error: coreOutcome(e.loaded) === 'failed' ? NO_FACE : null, missing: e.missing };
  }
  if (e.type === 'MODELS.FAILED' || e.type === 'EXTRA.FAILED') return { ...s, progress: null, error: e.error };
  if (e.type === 'CANCEL') return { ...s, progress: null, error: STOPPED };
  return e.type === 'EXTRA.READY' ? IDLE : s;
}

/** Why an extra is off on this device, or null when it may be offered. */
export function extraBlock(c: Pick<ConsultContext, 'device' | 'extras' | 'models'>, model: ExtraModel): ExtraBlock | null {
  if (c.extras.crashed.includes(model)) return 'crashed_last_time';
  if (c.models.outOfMemory >= OUT_OF_MEMORY_LIMIT) return 'out_of_memory';
  if (c.extras.computersOnly && c.device.class !== 'computer') return 'computer_only';
  if (model === 'depth' && !c.device.webgl2) return 'no_webgl2';
  if (model === 'depth' && c.device.lowMemory) return 'low_memory';
  return null;
}

const reset = (model: DownloadKey) =>
  consultSetup.assign({ models: ({ context }) => ({ ...context.models, [model]: IDLE }) });
const store = (model: DownloadKey) =>
  consultSetup.assign({
    models: ({ context, event }) => ({ ...context.models, [model]: modelStatusAfter(context.models[model], event) }),
  });
const countOutOfMemory = consultSetup.assign({
  models: ({ context, event }) => (event.type === 'WORKER.RESTARTED' && event.reason === 'out_of_memory' ? { ...context.models, outOfMemory: context.models.outOfMemory + 1 } : context.models),
});
/** The event names this download (`EXTRA.*` and `CANCEL` carry a model; both extras see them). */
const isFor =
  (model: DownloadKey) =>
  ({ event }: { readonly event: MachineEvent }): boolean =>
    'model' in event && event.model === model;
const isCore =
  (outcome: 'ready' | 'degraded') =>
  ({ event }: { readonly event: MachineEvent }): boolean =>
    event.type === 'MODELS.READY' && coreOutcome(event.loaded) === outcome;

/** The core tools: `ready` means available, not "loaded in the worker right now". */
export const coreRegion = consultSetup.createStateConfig({
  initial: 'idle',
  states: {
    idle: {
      always: [
        // A worker restart re-enters this state; a download the person stopped stays stopped until "Download again".
        { guard: ({ context }) => context.models.core.error?.code === 'aborted', target: 'failed' },
        { guard: 'wantsCore', target: 'loading' },
      ],
      // A photo tool asks for them where `wantsCore` never did: a restored answers-only session with its photo.
      on: { 'MODELS.RETRY': 'loading' },
    },
    loading: {
      entry: reset('core'),
      invoke: { id: 'loadCore', src: 'loadModels', input: { model: 'core' } },
      on: {
        'MODELS.PROGRESS': { actions: store('core') },
        'MODELS.READY': [
          { guard: isCore('ready'), target: 'ready', actions: store('core') },
          { guard: isCore('degraded'), target: 'degraded', actions: store('core') },
          { target: 'failed', actions: store('core') },
        ],
        'MODELS.FAILED': { target: 'failed', actions: store('core') },
        // "Download stopped": `aborted`, with "Download again" and "Continue with answers only".
        CANCEL: { guard: isFor('core'), target: 'failed', actions: store('core') },
      },
    },
    ready: {},
    /** The face model loaded but hand, pose or the segmenter did not; the face card names the missing part. */
    degraded: {},
    failed: { on: { 'MODELS.RETRY': 'loading' } },
  },
});

/** One extra's lifecycle: `check → idle → downloading → ready | unsupported | failed`. */
export function extraRegion(model: ExtraModel) {
  const mine = isFor(model);
  return consultSetup.createStateConfig({
    initial: 'check',
    states: {
      check: {
        always: [
          { guard: ({ context }) => extraBlock(context, model) !== null, target: 'unsupported' },
          { target: 'idle' },
        ],
      },
      idle: { on: { 'EXTRA.REQUEST': { guard: mine, target: 'downloading' } } },
      downloading: {
        entry: reset(model),
        invoke: { id: model === 'depth' ? 'loadDepth' : 'loadSam', src: 'loadModels', input: { model } },
        on: {
          'EXTRA.PROGRESS': { guard: mine, actions: store(model) },
          'EXTRA.READY': { guard: mine, target: 'ready', actions: store(model) },
          'EXTRA.FAILED': { guard: mine, target: 'failed', actions: store(model) },
          // An extra goes back to idle: its button offers the download again.
          CANCEL: { guard: mine, target: 'idle', actions: reset(model) },
        },
      },
      ready: {},
      /** The reason is `extraBlock(context, model)`, shown in place of the button. */
      unsupported: {},
      failed: { on: { 'EXTRA.RETRY': { guard: mine, target: 'downloading' } } },
    },
  });
}

/**
 * The region. `WORKER.RESTARTED` (a watchdog expiry, a crash or memory running out) is the one transition that
 * re-enters `models` on purpose: `core` reloads from the registry cache and the extras return to idle. It
 * targets the three sub-regions, so its domain is `models`: a self-transition with `reenter: true` would take the
 * parallel `session` as its domain and re-enter `analysis` and `flow` too (caught by an invariant test in `consult.model.test.ts`).
 */
export const modelsRegion = consultSetup.createStateConfig({
  type: 'parallel',
  on: { 'WORKER.RESTARTED': { target: ['.core', '.depth', '.sam'], actions: countOutOfMemory } },
  states: { core: coreRegion, depth: extraRegion('depth'), sam: extraRegion('sam') },
});
