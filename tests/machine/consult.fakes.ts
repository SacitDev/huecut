/**
 * Test support only (never imported by the app): content and device fixtures and fake actors for the machine tests,
 * built with the machine's own actor constructors and injected through `provide()`, so they type-check against the
 * signatures `app/compose.ts` implements.
 */
import { createActor } from 'xstate';
import type { ConsultData, IndexEntry, LibraryIndex } from '../../src/domain/content/output.ts';
import type { Bands, Policy } from '../../src/domain/content/types.ts';
import type { DeviceInfo } from '../../src/domain/device.ts';
import { asItemId, asPhotoId, type ItemId, type PhotoId, type PictureId } from '../../src/domain/ids.ts';
import type { PhotoObservation } from '../../src/domain/measure/observation.ts';
import type { Result } from '../../src/domain/result.ts';
import { SESSION_SCHEMA_VERSION, STEPS, type SessionData, type Step } from '../../src/domain/session/session-data.ts';
import type { AnalysisError } from '../../src/worker/protocol.ts';
import { consultMachine, currentStep } from '../../src/machine/consult.machine.ts';
import {
  createConsultSelectors,
  type EnginePick,
  type EngineResult,
  type PromptInput,
  type SheetInput,
} from '../../src/machine/consult.selectors.ts';
import type {
  ConsultContent,
  ConsultEmitted,
  ConsultInput,
  DownloadKey,
  LoaderEvent,
  MachineEvent,
  WorkerRestartedEvent,
} from '../../src/machine/consult.types.ts';
import {
  analyseActor,
  loaderActor,
  supervisorActor,
  type AnalysePhoto,
  type LoadModels,
  type SuperviseWorker,
} from '../../src/machine/setup.ts';

export const cut = (n: number): ItemId => asItemId(`cut-${String(n)}`);
export const colour = (n: number): ItemId => asItemId(`colour-${String(n)}`);
/** Cuts a person adds from Explore. */
export const explore = (n: number): ItemId => asItemId(`explore-${String(n)}`);
export const photo = (n: number): PhotoId => asPhotoId(`p${String(n)}`);

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);
/** The machine reads only `id` and `kind` of library entries; the engine is faked. */
const entry = (id: ItemId, kind: 'cut' | 'colour'): IndexEntry => ({ id, kind }) as unknown as IndexEntry;
const library: LibraryIndex = {
  models: [],
  entries: [
    ...range(10).map((n) => entry(cut(n), 'cut')),
    ...range(10).map((n) => entry(colour(n), 'colour')),
    ...range(9).map((n) => entry(explore(n), 'cut')),
  ],
};

const policy: Policy = {
  weights: { weak: 1, moderate: 2, strong: 3 },
  count: { min: 1, default: 4, max: 8 },
  both_split: 'cut_first_half',
  grid_max_tiles: 4,
  max_per_silhouette: 2,
  min_distinct_silhouettes_share: 0.5,
  low_upkeep: { max_styling_minutes: 10, min_trim_weeks: 8 },
  max_reasons: 3,
  reason_group_order: ['B', 'C', 'A', 'D', 'E'],
  pool_size: 14,
  change_span: null,
  length_span: null,
  colour_variety: null,
  upkeep_stack: null,
  growth_cm_per_month: null,
};
/** No bands and no questions: facts come from the answers fixture only (none here), so the fake engine decides. */
const bands = { bands: [], current_length_cm: {} } as unknown as Bands;
const consult: ConsultData = {
  rules: { cut: [], colour: [], beard: [] },
  journey: [],
  reminders: [],
  phrases: {},
  policy,
  bands,
  questions: {
    questions: [],
    core_sets: { 'cut/salon': [], 'cut/barbering': [], 'colour/any': [], 'both/salon': [], 'both/barbering': [] },
  },
  prompts: {},
};
export const content: ConsultContent = { library, consult };

export const computer: DeviceInfo = {
  class: 'computer',
  webgl2: true,
  lowMemory: false,
  saveData: false,
  touch: false,
};
export const phone: DeviceInfo = { ...computer, class: 'phone', touch: true };

export const input = (over: Partial<ConsultInput> = {}): ConsultInput => ({
  content,
  device: computer,
  extras: { computersOnly: false, crashed: [] },
  restore: null,
  ...over,
});

/** An observation with `faces` faces (tiny meshes: the machine only counts them). */
export const observation = (faces = 1): PhotoObservation => ({
  schemaVersion: 1,
  image: { widthPx: 1000, heightPx: 1250 },
  focal35mm: null,
  faces: range(faces).map(() => ({ landmarks: new Float32Array([0.5, 0.5, 0]), matrix: null, expression: {} })),
  hands: [],
  pose: null,
  hair: null,
  previewMask: null,
  ran: ['face', 'hand', 'pose', 'segmenter'],
});

/** A kept session (or the example) at `step`, with one analysed photo and a Cut goal. */
export function sessionAt(step: Step, over: Partial<SessionData> = {}): SessionData {
  const furthest = STEPS.indexOf(step);
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: 1_700_000_000_000,
    source: 'photo',
    step,
    furthest,
    answers: {},
    prefs: { goal: 'cut', collections: ['salon'], count: 4 },
    shortlist: { added: [], removed: [], order: [] },
    pair: null,
    slots: {},
    grids: [],
    photo: { id: photo(1), sharpness: 120, observation: observation(), edits: null, refined: null, example: null },
    ...over,
  };
}

/** The fake engine: the fixture's picks in a fixed order, minus the removed ones. */
export const enginePicks: readonly EnginePick[] = [
  ...range(10).map((n) => ({ id: cut(n), kind: 'cut' as const })),
  ...range(10).map((n) => ({ id: colour(n), kind: 'colour' as const })),
];

export interface LoaderRun {
  readonly model: DownloadKey;
  readonly send: (event: LoaderEvent) => void;
  readonly signal: AbortSignal;
}
export interface AnalyseRun {
  readonly photoId: PhotoId;
  readonly signal: AbortSignal;
  readonly resolve: (r: Result<PhotoObservation, AnalysisError>) => void;
  readonly reject: (e: unknown) => void;
  /** The run replied (resolved or rejected); a run neither settled nor aborted is still running. */
  settled: boolean;
}
export interface SupervisorRun {
  readonly send: (event: WorkerRestartedEvent) => void;
  stopped: boolean;
}

/** Fake actors that record every run and never reply on their own: each test drives every reply itself. */
function recordingActors() {
  const loaders: LoaderRun[] = [];
  const analyses: AnalyseRun[] = [];
  const supervisors: SupervisorRun[] = [];
  const load: LoadModels = (i, send, signal) => {
    loaders.push({ model: i.model, send, signal });
  };
  const analyse: AnalysePhoto = (i, signal) =>
    new Promise((resolve, reject) => {
      const run: AnalyseRun = {
        photoId: i.photoId,
        signal,
        resolve: (r) => {
          run.settled = true;
          resolve(r);
        },
        reject: (e) => {
          run.settled = true;
          reject(e instanceof Error ? e : new Error(String(e)));
        },
        settled: false,
      };
      analyses.push(run);
    });
  const supervise: SuperviseWorker = (send) => {
    const run: SupervisorRun = { send, stopped: false };
    supervisors.push(run);
    return () => {
      run.stopped = true;
    };
  };
  const actors = {
    loadModels: loaderActor(load),
    analysePhoto: analyseActor(analyse),
    superviseWorker: supervisorActor(supervise),
  };
  return { actors, loaders, analyses, supervisors };
}

/** One machine with the recording fakes and a fake engine, injected through `provide()` as compose.ts does. */
export function createFakes() {
  const { actors, ...runs } = recordingActors();
  const released: PhotoId[] = [];
  const disposed: PictureId[] = [];
  const emitted: ConsultEmitted[] = [];
  const selectors = createConsultSelectors({
    recommend: (_facts, _content, request): EngineResult => ({
      picks: enginePicks.filter((p) => !request.removed.includes(p.id)),
    }),
    buildPrompts: (i: PromptInput<EngineResult>) => i,
    stylistSheet: (i: SheetInput<EngineResult>) => i,
  });
  const machine = consultMachine.provide({
    actors,
    guards: { hasIdeas: ({ context }) => selectors.hasIdeas(context) },
    actions: {
      releasePhoto: (_, params) => {
        released.push(params.photoId);
      },
      disposePictures: (_, params) => {
        disposed.push(...params.ids);
      },
    },
  });
  return { machine, selectors, ...runs, released, disposed, emitted };
}

/** The machine running on fake actors, started, with short ways to send to it and read it. */
export function boot(over: Partial<ConsultInput> = {}) {
  const f = createFakes();
  const actor = createActor(f.machine, { input: input(over) });
  actor.on('*', (e) => {
    f.emitted.push(e);
  });
  actor.start();
  const send = (e: MachineEvent): void => {
    actor.send(e);
  };
  return { ...f, actor, send, snap: () => actor.getSnapshot(), step: () => currentStep(actor.getSnapshot()) };
}
export type Booted = ReturnType<typeof boot>;

export const exampleSession: SessionData = sessionAt('face', {
  source: 'example',
  savedAt: 0,
  furthest: 1,
  prefs: { goal: null, collections: [], count: 4 },
  photo: {
    id: photo(7),
    sharpness: 300,
    observation: observation(),
    edits: null,
    refined: null,
    example: { picture: 'model-a/base-front', mask: 'examples/model-a-hair-mask.png' },
  },
});

/** The state of one region, by a dotted path into a snapshot's value (`session.models.core`). */
export const at = (s: { readonly value: unknown }, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), s.value);

/** Lets promise replies and the actors they wake settle. */
export const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
