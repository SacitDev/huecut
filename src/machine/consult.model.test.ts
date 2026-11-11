/**
 * Model-based tests with `xstate/graph` over exactly the listed sequences. Each path comes from
 * the machine's pure transitions (`getPathsFromEvents`), is replayed on a live actor with fake actors (state value and
 * context compared after every step, `consult.replay.ts`), and every step of every path is held to the invariants.
 */
import { beforeAll, expect, it } from 'vitest';
import { err, ok } from '../domain/result.ts';
import type { Step as FlowStep } from '../domain/session/session-data.ts';
import type { ExtraModel } from '../worker/protocol.ts';
import { at, exampleSession, explore, observation, photo, sessionAt } from '../../tests/machine/consult.fakes.ts';
import { canEnter, stepReady, wantsCore } from './consult.logic.ts';
import { currentStep } from './consult.machine.ts';
import {
  both,
  child,
  done,
  LOADERS,
  play,
  sameChildren,
  sameContextBut,
  type Played,
  type Sequence,
} from '../../tests/machine/consult.replay.ts';
import { STEPS, type ConsultEmitted, type MachineEvent, type DownloadKey } from './consult.types.ts';

// ── Events ──
const START: MachineEvent = { type: 'START', source: 'photo' };
const NEXT: MachineEvent = { type: 'NEXT' };
const RESET: MachineEvent = { type: 'RESET' };
const READY: MachineEvent = { type: 'MODELS.READY', loaded: ['face', 'hand', 'pose', 'segmenter'], missing: [] };
const RESTARTED: MachineEvent = { type: 'WORKER.RESTARTED', reason: 'crashed' };
/** Photos in the order added; the first is the clearest (sharpness 99, 98, …). */
const add = (...ns: number[]): MachineEvent => ({
  type: 'PHOTOS.ADD',
  files: ns.map((n) => ({ id: photo(n), sharpness: 100 - n })),
});
const nav = (to: FlowStep): MachineEvent => ({ type: 'NAVIGATE', to });
const request = (model: ExtraModel): MachineEvent => ({ type: 'EXTRA.REQUEST', model });
const cancel = (model: DownloadKey): MachineEvent => ({ type: 'CANCEL', model });
const goal: MachineEvent = { type: 'PREFS.SET', goal: 'cut', collections: ['salon'] };
const shortlist = (n: number): MachineEvent => ({ type: 'SHORTLIST.ADD', id: explore(n) });
const OK = done(ok(observation()));
const CRASHED = done(err({ code: 'crashed', retryable: true, detail: 'the worker crashed' }));
const UNREADABLE = done(err({ code: 'decode_failed', retryable: false, detail: 'HEIC outside Safari' }));

const cancelling = (model: DownloadKey): Sequence => ({
  name: `cancel of the ${model} download while the others run`,
  events: [START, request('depth'), request('sam'), cancel(model)],
  then: ({ live, fakes }) => {
    const runs = fakes.loaders.map((l) => [l.model, l.signal.aborted]);
    expect(runs).toEqual((['core', 'depth', 'sam'] as const).map((m) => [m, m === model])); // only it was aborted
    expect(at(live, `session.models.${model}`)).toBe(model === 'core' ? 'failed' : 'idle');
    if (model === 'core') expect(live.context.models.core.error?.code).toBe('aborted');
  },
});

const refreshing = (step: FlowStep): Sequence => ({
  name: `refresh at ${step}`,
  input: { restore: sessionAt(step) },
  events: [],
  then: ({ live, fakes }) => {
    expect(currentStep(live)).toBe(step);
    const { furthest, resumeAt, keptStored, photos } = live.context;
    expect({ furthest, resumeAt, keptStored }).toEqual({ furthest: sessionAt(step).furthest, resumeAt: null, keptStored: true });
    expect(photos).toMatchObject([{ id: photo(1), status: 'done' }]);
    expect(fakes.analyses).toHaveLength(0); // the saved photo is not queued again
  },
});

const SEQUENCES: readonly Sequence[] = [
  {
    name: 'reset during analysis',
    events: [START, add(1), READY, RESET],
    then: ({ live, fakes }) => {
      expect(live.value).toBe('intro');
      expect(fakes.analyses).toHaveLength(1);
      expect(live.context.photos).toEqual([]);
    },
  },
  {
    name: 'Back during loading',
    events: [START, add(1), NEXT, nav('photo'), nav('face'), READY],
    then: ({ live, fakes }) => {
      expect(currentStep(live)).toBe('face');
      expect(fakes.loaders.map((l) => l.model)).toEqual(['core']); // one download, never restarted
      expect(fakes.analyses.map((a) => a.photoId)).toEqual([photo(1)]);
    },
  },
  cancelling('core'),
  cancelling('depth'),
  cancelling('sam'),
  {
    name: 'a worker restart during analysis',
    events: [START, add(1), READY, RESTARTED, CRASHED, READY, OK],
    then: ({ live, fakes }) => {
      expect(live.context.photos[0]).toMatchObject({ status: 'done', tries: 1 });
      expect(fakes.loaders.map((l) => l.model)).toEqual(['core', 'core']);
      expect(fakes.analyses.map((a) => a.photoId)).toEqual([photo(1), photo(1)]);
      expect(fakes.supervisors).toHaveLength(1);
    },
  },
  ...STEPS.map(refreshing),
  {
    name: 'a photo removed while in flight',
    events: [START, add(1, 2), READY, { type: 'PHOTOS.REMOVE', id: photo(1) }, OK],
    then: ({ live, fakes }) => {
      expect(live.context.photos.map((p) => [p.id, p.status])).toEqual([[photo(2), 'queued']]);
      expect(live.context.inFlight).toEqual({ photoId: photo(2) });
      expect(fakes.released).toEqual([photo(1)]);
      expect(fakes.analyses.map((a) => [a.photoId, a.signal.aborted, a.settled])).toEqual([
        [photo(1), false, true],
        [photo(2), false, false],
      ]);
    },
  },
  {
    name: 'the example start',
    events: [{ type: 'START', source: 'example', session: exampleSession }],
    then: ({ live, fakes }) => {
      expect(currentStep(live)).toBe('face');
      expect(live.context).toMatchObject({ source: 'example', mainPhotoId: photo(7), keptStored: false, furthest: 1 });
      expect([at(live, 'session.models.core'), fakes.loaders.length, fakes.analyses.length]).toEqual(['idle', 0, 0]);
      expect(fakes.supervisors).toHaveLength(1); // the worker runs `tint` with the example's mask copy, no model
    },
  },
  {
    name: 'the last photo failing on the face card',
    events: [START, add(1), NEXT, goal, READY, UNREADABLE, NEXT],
    then: (p) => {
      const failedOn = p.steps[5]?.after;
      expect(failedOn && currentStep(failedOn)).toBe('face'); // never bounced back to Photo
      expect(currentStep(p.live)).toBe('goal'); // on, with the answers
      expect(p.live.context.photos[0]).toMatchObject({ status: 'failed', error: 'decode_failed' });
    },
  },
  {
    name: 'a photo that failed before Continue reaches the face card',
    events: [START, add(1), READY, UNREADABLE, NEXT],
    then: (p) => {
      expect(currentStep(p.live)).toBe('face');
      expect(p.live.context.furthest).toBe(1);
    },
  },
  {
    name: 'the face card after Ideas leads back to Ideas',
    events: [START, add(1), READY, OK, NEXT, NEXT, goal, NEXT, NEXT, nav('face'), NEXT],
    then: (p) => {
      expect(p.steps[9]?.after && currentStep(p.steps[9].after)).toBe('face');
      expect(currentStep(p.live)).toBe('ideas');
    },
  },
  {
    name: 'a stale line edit after PHOTOS.SET_MAIN',
    events: [
      START,
      add(1, 2),
      READY,
      OK,
      OK,
      NEXT,
      { type: 'POINTS.MOVE', photoId: photo(1), index: 4, to: { x: 0.4, y: 0.3 } },
      { type: 'PHOTOS.SET_MAIN', id: photo(2) },
      { type: 'POINTS.MOVE', photoId: photo(1), index: 5, to: { x: 0.5, y: 0.5 } },
      { type: 'POINTS.RESET', photoId: photo(1), part: 'all' },
      { type: 'HAIRLINE.MOVE', photoId: photo(2), to: [{ x: 0.4, y: 0.2 }] },
    ],
    then: ({ live, fakes }) => {
      expect(currentStep(live)).toBe('face');
      expect(live.context.mainPhotoId).toBe(photo(2));
      expect(live.context.photos.map((p) => p.edits)).toEqual([{ points: { 4: { x: 0.4, y: 0.3 } }, hairline: null }, { points: {}, hairline: [{ x: 0.4, y: 0.2 }] }]);
      expect(fakes.emitted).toEqual<ConsultEmitted[]>([]);
    },
  },
  {
    name: 'SHORTLIST.ADD from Explore before My look starts and at 8 ideas',
    events: [shortlist(1), START, goal, ...[2, 3, 4, 5, 6, 7, 8].map(shortlist), shortlist(9)],
    filter: (s, e) =>
      e.type !== 'SHORTLIST.ADD' || s.context.shortlist.added.length === Math.min(Number(e.id.split('-')[1]) - 1, 8),
    then: (p) => {
      expect(p.steps[0]?.after.value).toBe('intro');
      expect(p.steps[0]?.after.context.shortlist.added).toEqual([explore(1)]);
      expect(p.live.context.shortlist.added).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map(explore));
      expect(p.fakes.selectors.ideas(p.live.context).own).toHaveLength(8); // engine picks made room
      expect(p.fakes.emitted).toEqual<ConsultEmitted[]>([
        { type: 'SHORTLIST.REFUSED', id: explore(9), reason: 'full' },
      ]);
    },
  },
];

const played = new Map<string, Played | Error>();
beforeAll(async () => {
  for (const seq of SEQUENCES)
    played.set(seq.name, await play(seq).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e)))));
}, 60_000);

const get = (name: string): Played => {
  const p = played.get(name);
  if (!p) throw new Error(`${name} was not played`);
  if (p instanceof Error) throw p;
  return p;
};
const everyStep = () => SEQUENCES.flatMap((s) => get(s.name).steps.map((step) => ({ ...step, p: get(s.name) })));

for (const seq of SEQUENCES) {
  it(`sequence: ${seq.name}`, () => {
    seq.then(get(seq.name));
  });
}

it('invariant: no step is entered when canEnter is false', () => {
  let navigations = 0;
  for (const { event, before, after, p } of everyStep()) {
    const from = currentStep(before);
    const to = currentStep(after);
    const ideas = p.fakes.selectors.hasIdeas;
    if (event.type === 'NAVIGATE') {
      navigations++;
      const allowed = event.to !== from && canEnter(before.context, event.to, ideas(before.context));
      expect(to).toBe(allowed ? event.to : from);
    }
    if (to !== null && to !== from && event.type !== 'RESET')
      expect(stepReady(after.context, to, ideas(after.context))).toBe(true);
  }
  expect(navigations).toBeGreaterThan(0);
});

it('invariant: NAVIGATE never re-enters models or analysis', () => {
  const steps = everyStep().filter((s) => s.event.type === 'NAVIGATE');
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    for (const region of ['session.models', 'session.analysis']) {
      expect(at(step.after, region)).toEqual(at(step.before, region));
      expect(at(step.live, region)).toEqual(at(step.liveBefore, region));
    }
    sameChildren(step, [...Object.values(LOADERS), 'analyse', 'supervisor']);
    expect(step.loaders).toBe(0);
  }
});

it('invariant: WORKER.RESTARTED re-enters only models, once', () => {
  const steps = everyStep().filter((s) => s.event.type === 'WORKER.RESTARTED');
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    for (const region of ['session.analysis', 'session.flow'])
      expect(at(step.after, region)).toEqual(at(step.before, region));
    sameContextBut(step, (key) => key === 'models');
    sameChildren(step, ['analyse', 'supervisor']);
    expect(wantsCore(step.live.context)).toBe(true);
    expect(child(step.live, 'loadCore')).toBeDefined();
    expect(child(step.live, 'loadCore')).not.toBe(child(step.liveBefore, 'loadCore')); // re-entered: a fresh core loader
    expect(step.loaders).toBe(1); // exactly one new download (from the registry cache in the real app)
    for (const extra of ['depth', 'sam'])
      expect(['idle', 'unsupported']).toContain(at(step.after, `session.models.${extra}`));
  }
});

it('invariant: CANCEL{model} changes no other region', () => {
  const steps = everyStep().filter((s) => s.event.type === 'CANCEL');
  expect(new Set(steps.map((s) => (s.event.type === 'CANCEL' ? s.event.model : null)))).toEqual(
    new Set(['core', 'depth', 'sam']),
  );
  for (const step of steps) {
    const { event, before, after } = step;
    if (event.type !== 'CANCEL') continue;
    for (const region of ['session.analysis', 'session.flow']) expect(at(after, region)).toEqual(at(before, region));
    const others = (['core', 'depth', 'sam'] as const).filter((m) => m !== event.model);
    for (const m of others) {
      expect(at(after, `session.models.${m}`)).toEqual(at(before, `session.models.${m}`));
      expect(step.live.context.models[m]).toBe(step.liveBefore.context.models[m]);
    }
    sameContextBut(step, (key) => key === 'models');
    sameChildren(step, [...others.map((m) => LOADERS[m]), 'analyse', 'supervisor']);
  }
});

it('invariant: a line edit changes only the main photo, and one for another photo changes nothing', () => {
  const edits = everyStep().filter((s) => s.event.type === 'POINTS.MOVE' || s.event.type === 'HAIRLINE.MOVE' || s.event.type === 'POINTS.RESET');
  let stale = 0;
  for (const { event, before, after } of edits) {
    if (event.type !== 'POINTS.MOVE' && event.type !== 'HAIRLINE.MOVE' && event.type !== 'POINTS.RESET') continue;
    const main = event.photoId === before.context.mainPhotoId;
    if (!main) stale++;
    for (const [i, p] of after.context.photos.entries()) {
      if (!main || p.id !== event.photoId) expect(p).toBe(before.context.photos[i]);
    }
    expect(at(after, 'session.flow')).toEqual(at(before, 'session.flow'));
  }
  expect(stale).toBeGreaterThan(0);
});

it('invariant: the list never holds more than 8 ideas', () => {
  const all = everyStep();
  expect(Math.max(...all.map((s) => s.after.context.shortlist.added.length))).toBe(8);
  for (const step of all)
    both(step, (s) => {
      expect(s.context.shortlist.added.length).toBeLessThanOrEqual(8);
      expect(step.p.fakes.selectors.ideas(s.context).ids.length).toBeLessThanOrEqual(8);
    });
});

it('invariant: RESET leaves no invoked actor running and no worker alive', () => {
  const steps = everyStep().filter((s) => s.event.type === 'RESET');
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    both(step, (s) => {
      expect(s.children).toEqual({});
    });
    const { loaders, analyses, supervisors } = step.p.fakes;
    expect(loaders.every((l) => l.signal.aborted)).toBe(true);
    expect(analyses.every((a) => a.signal.aborted || a.settled)).toBe(true);
    expect(analyses.some((a) => a.signal.aborted)).toBe(true); // the run in flight was stopped, not left to finish
    expect(supervisors.length > 0 && supervisors.every((s) => s.stopped)).toBe(true);
  }
});
