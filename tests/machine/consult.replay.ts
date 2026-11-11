/**
 * Test support only (never imported by the app): replays one sequence of `src/machine/consult.model.test.ts`. `xstate/graph` computes its path from the
 * machine's pure transitions; the same events then drive a live actor with the recording fakes, and the live state value
 * and context must equal the model's after every step. The analysis reply resolves the fake actor's promise.
 */
import { createActor, type ActorLogic } from 'xstate';
import { TestModel } from 'xstate/graph';
import { expect } from 'vitest';
import type { PhotoObservation } from '../../src/domain/measure/observation.ts';
import type { Result } from '../../src/domain/result.ts';
import type { AnalysisError } from '../../src/worker/protocol.ts';
import { createFakes, input as baseInput, settle } from './consult.fakes.ts';
import type { ConsultMachine, ConsultSnapshot as Snap } from '../../src/machine/consult.machine.ts';
import type { MachineEvent, ConsultInput } from '../../src/machine/consult.types.ts';

type Fakes = ReturnType<typeof createFakes>;

export interface Sequence {
  readonly name: string;
  readonly input?: Partial<ConsultInput>;
  readonly events: readonly MachineEvent[];
  /** Keeps the traversal to the sequence where its events would otherwise combine without end. */
  readonly filter?: (s: Snap, e: MachineEvent) => boolean;
  readonly then: (p: Played) => void;
}
/** One step: the model's states before and after, the live actor's before and after, and the loader runs it started. */
export interface PlayedStep {
  readonly event: MachineEvent;
  readonly before: Snap;
  readonly after: Snap;
  readonly liveBefore: Snap;
  readonly live: Snap;
  readonly loaders: number;
}
export interface Played {
  readonly steps: readonly PlayedStep[];
  readonly live: Snap;
  readonly fakes: Fakes;
}

/** The analysis actor's reply as XState delivers it (`xstate.done.actor.analyse`). */
export const done = (output: Result<PhotoObservation, AnalysisError>): MachineEvent =>
  ({ type: 'xstate.done.actor.analyse', output, actorId: 'analyse' }) as unknown as MachineEvent;

/** States are told apart by value and context; the content and device are the same in every state of a sequence. */
const serialize = (s: Snap): string =>
  JSON.stringify({ value: s.value, context: { ...s.context, content: null, device: null } });

type Scope = Parameters<ConsultMachine['transition']>[2];
/**
 * The machine as plain actor logic with its input bound: the graph helpers build a machine's first state without an
 * input, which this machine needs. The graph's mock scope emits nothing, so its emitted type is widened here.
 */
function logicOf(machine: ConsultMachine, input: ConsultInput): ActorLogic<Snap, MachineEvent, unknown> {
  return {
    config: machine.config,
    transition: (snapshot, event, scope) => machine.transition(snapshot, event, scope as unknown as Scope),
    getInitialSnapshot: (scope) => machine.getInitialSnapshot(scope as unknown as Scope, input),
    getPersistedSnapshot: (snapshot) => machine.getPersistedSnapshot(snapshot),
  };
}

async function exec(event: MachineEvent, actor: { send: (e: MachineEvent) => void }, fakes: Fakes): Promise<void> {
  if ((event.type as string) === 'xstate.done.actor.analyse') {
    const { output } = event as unknown as { output: Result<PhotoObservation, AnalysisError> };
    fakes.analyses.findLast((a) => !a.settled && !a.signal.aborted)?.resolve(output);
  } else actor.send(event);
  await settle();
}

/** The one path `xstate/graph` finds for exactly these events. */
function pathOf(seq: Sequence, logic: ActorLogic<Snap, MachineEvent, unknown>) {
  const model = new TestModel(logic, { serializeState: serialize });
  const filter = seq.filter ? { filterEvents: seq.filter } : {};
  const paths = model.getPathsFromEvents([...seq.events], { serializeState: serialize, ...filter });
  const [path] = paths;
  if (!path || paths.length !== 1) throw new Error(`${seq.name}: expected one path, got ${String(paths.length)}`);
  return path;
}

export async function play(seq: Sequence): Promise<Played> {
  const fakes = createFakes();
  const input = baseInput(seq.input);
  const path = pathOf(seq, logicOf(fakes.machine, input));
  const actor = createActor(fakes.machine, { input });
  actor.on('*', (e) => {
    fakes.emitted.push(e);
  });
  actor.start();
  const lives: { snap: Snap; loaders: number }[] = [];
  const run = (step: { event: MachineEvent }) => exec(step.event, actor, fakes);
  const check = (predicted: Snap): void => {
    const live = actor.getSnapshot();
    expect(live.value).toEqual(predicted.value);
    expect(live.context).toEqual(predicted.context);
    lives.push({ snap: live, loaders: fakes.loaders.length });
  };
  await path.test({ events: Object.fromEntries(seq.events.map((e) => [e.type, run])), states: { '*': check } });
  const steps = seq.events.map((event, i): PlayedStep => {
    const [before, after] = [path.steps[i]?.state, path.steps[i + 1]?.state];
    const [was, live] = [lives[i], lives[i + 1]];
    if (!before || !after || !was || !live) throw new Error(`${seq.name}: step ${String(i)} missing`);
    return { event, before, after, liveBefore: was.snap, live: live.snap, loaders: live.loaders - was.loaders };
  });
  return { steps, live: actor.getSnapshot(), fakes };
}

// ── Checks shared by the invariants ──

export const LOADERS = { core: 'loadCore', depth: 'loadDepth', sam: 'loadSam' } as const;
export const child = (s: Snap, id: string): unknown => (s.children as Record<string, unknown>)[id];

/**
 * The context outside `keep` is unchanged: equal on the model path (its states are deduplicated by value, so object
 * identity is not kept between them) and the very same objects on the live actor.
 */
export function sameContextBut(step: PlayedStep, keep: (key: string) => boolean): void {
  for (const [key, value] of Object.entries(step.before.context))
    if (!keep(key)) expect(step.after.context[key as keyof Snap['context']]).toEqual(value);
  for (const [key, value] of Object.entries(step.liveBefore.context))
    if (!keep(key)) expect(step.live.context[key as keyof Snap['context']]).toBe(value);
}
/** The same actor runs (live, by identity) before and after a step. */
export function sameChildren(step: PlayedStep, ids: readonly string[]): void {
  for (const id of ids) expect(child(step.live, id)).toBe(child(step.liveBefore, id));
}
/** Asserts on the model's after-state and on the live one. */
export function both(step: PlayedStep, check: (s: Snap) => void): void {
  check(step.after);
  check(step.live);
}
