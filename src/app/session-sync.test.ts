/**
 * The saved session's sync: written, debounced, from the first answer or photo; "saved" only after a commit; a delete always wins; another
 * session saved here is replaced only on a yes. Storage and the resource store are faked; the machine is the real one with the machine tests' fake actors.
 */
import { createActor } from 'xstate';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SessionData } from '../domain/session/session-data.ts';
import { createFakes, input, sessionAt } from '../../tests/machine/consult.fakes.ts';

const storage = vi.hoisted(() => ({
  readSession: vi.fn(),
  writeSession: vi.fn<(session: { readonly data: SessionData; readonly photo: Blob | null; readonly pictures: Readonly<Record<string, Blob>> }, overwriteOnly: boolean, mayReplace: boolean) => Promise<'stored' | 'gone' | 'taken' | 'refused'>>(() => Promise.resolve('stored')),
  deleteSession: vi.fn(() => Promise.resolve(true)),
  requestPersistOnce: vi.fn(),
  savingChoice: vi.fn(() => 'until_deleted'),
  rememberSaving: vi.fn<(mode: string, id: string | undefined) => void>(),
  deletedSince: vi.fn<(startedAt: number) => boolean>(() => false),
  SAVING_KEY: 'huecut:saving',
}));
const resources = vi.hoisted(() => ({
  addPhoto: vi.fn(() => Promise.resolve()),
  addPicture: vi.fn(),
  photo: vi.fn((): { blob: Blob } | undefined => undefined),
  picture: vi.fn<(id: string) => Blob | undefined>(() => undefined),
  shareCopy: vi.fn((): Promise<Blob | null> => Promise.resolve(null)),
}));
vi.mock('../platform/storage.ts', () => storage);
vi.mock('../platform/resources.ts', () => resources);

const { startSessionSync } = await import('./session-sync.ts');

function startedActor(source: 'answers_only' | 'photo' = 'answers_only') {
  const fakes = createFakes();
  const actor = createActor(fakes.machine, { input: input() }).start();
  actor.send({ type: 'START', source });
  return { actor, fakes };
}

/** A running session with its first answer given. */
function answered() {
  const { actor } = startedActor();
  startSessionSync(actor);
  actor.send({ type: 'PREFS.SET', goal: 'colour', collections: ['salon'] });
  return actor;
}

/** A saved session (`the-old-one`) with a photo, restored, its next write held open at the photo's copy. */
function savedWithHeldCopy() {
  const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
  let finishCopy: (copy: Blob) => void = () => undefined;
  resources.photo.mockReturnValue({ blob });
  resources.shareCopy.mockReturnValueOnce(new Promise<Blob>((resolve) => { finishCopy = resolve; }));
  const data = sessionAt('questions', { id: 'the-old-one' });
  const actor = createActor(createFakes().machine, { input: input({ restore: data }) }).start();
  startSessionSync(actor, data);
  return { actor, blob, finishCopy: (copy: Blob) => { finishCopy(copy); } };
}

const NOW = 1_800_000_000_000;

const lastWritten = (): SessionData | undefined => storage.writeSession.mock.calls.at(-1)?.[0].data;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

it('writes nothing until the first answer, then one debounced write per burst, until I delete it', async () => {
  const { actor } = startedActor();
  startSessionSync(actor);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession, 'opening and a count are no answer').not.toHaveBeenCalled();
  actor.send({ type: 'PREFS.SET', goal: 'colour', collections: ['salon'] });
  actor.send({ type: 'PREFS.SET', count: 6 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).toHaveBeenCalledTimes(1);
  expect(lastWritten()).toMatchObject({ step: 'goal', source: 'answers_only', keep: 'until_deleted', prefs: { count: 6 } });
  expect(typeof lastWritten()?.id).toBe('string');
});

it('a machine event that changes nothing saved does not put a save off (the debounce that a stream of progress events starved)', async () => {
  const { actor, fakes } = startedActor('photo');
  startSessionSync(actor);
  actor.send({ type: 'SESSION.KEEP', keep: 'until_deleted' });
  actor.send({ type: 'PREFS.SET', goal: 'cut', collections: ['salon'] });
  const core = fakes.loaders.find((l) => l.model === 'core');
  for (let i = 0; i < 20; i++) {
    core?.send({ type: 'MODELS.PROGRESS', progress: { model: 'face', phase: 'download', loadedBytes: i, totalBytes: 1000 } });
    await vi.advanceTimersByTimeAsync(100);
  }
  expect(storage.writeSession).toHaveBeenCalledTimes(1);
});

it("Don't save deletes the copy at once and drops the pending write; it asks for no persistent storage", async () => {
  const actor = answered();
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.deleteSession).toHaveBeenCalledTimes(1);
  expect(storage.writeSession).not.toHaveBeenCalled();
  expect(storage.requestPersistOnce).not.toHaveBeenCalled();
  actor.send({ type: 'PREFS.SET', goal: 'cut' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession, 'while off nothing is written').not.toHaveBeenCalled();
});

it('turning saving on again writes the session anew', async () => {
  const actor = answered();
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'SESSION.KEEP', keep: 'day' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).toHaveBeenCalledTimes(1);
  expect(storage.writeSession.mock.calls[0]?.[1], 'it may create the record').toBe(false);
  expect(lastWritten()?.keep).toBe('day');
});

it('a first write the browser refuses says so and stays on; a good one then clears it', async () => {
  const actor = answered();
  storage.writeSession.mockResolvedValueOnce('refused');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keep: 'until_deleted', keptStored: false, saveStatus: 'refused' });
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keptStored: true, saveStatus: 'saved' });
});

it('a later write refused keeps the last good save', async () => {
  const actor = answered();
  await vi.advanceTimersByTimeAsync(1_000);
  storage.writeSession.mockResolvedValueOnce('refused');
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keep: 'until_deleted', keptStored: true, saveStatus: 'refused' });
});

it('a delete the browser refuses is said too', async () => {
  const actor = answered();
  await vi.advanceTimersByTimeAsync(1_000);
  storage.deleteSession.mockResolvedValueOnce(false);
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keep: 'off', saveStatus: 'refused' });
});

it('marks the session stored only once the first write has succeeded, and writes once', async () => {
  const { actor } = startedActor();
  startSessionSync(actor);
  let finishWrite: (result: 'stored') => void = () => undefined;
  storage.writeSession.mockReturnValueOnce(new Promise<'stored'>((resolve) => { finishWrite = resolve; }));
  actor.send({ type: 'PREFS.SET', goal: 'colour' });
  expect(actor.getSnapshot().context).toMatchObject({ keptStored: false, saveStatus: 'saving' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keptStored: false, saveStatus: 'saving' });
  finishWrite('stored');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ keptStored: true, saveStatus: 'saved' });
  expect(storage.writeSession, 'the stored event schedules no second write').toHaveBeenCalledTimes(1);
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  expect(actor.getSnapshot().context.keptStored).toBe(false);
});

it('a write that committed while a newer change waits does not say saved, and persistent storage is asked for once, at the first', async () => {
  const actor = answered();
  let finishWrite: (result: 'stored') => void = () => undefined;
  storage.writeSession.mockReturnValueOnce(new Promise<'stored'>((resolve) => { finishWrite = resolve; }));
  await vi.advanceTimersByTimeAsync(500);
  actor.send({ type: 'PREFS.SET', count: 5 });
  finishWrite('stored');
  await vi.advanceTimersByTimeAsync(0);
  expect(actor.getSnapshot().context).toMatchObject({ keptStored: true, saveStatus: 'saving' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context.saveStatus).toBe('saved');
  expect(storage.requestPersistOnce).toHaveBeenCalledTimes(1);
});

it("Don't save while a write is making its copy: the photo is never stored again", async () => {
  const { actor, blob, finishCopy } = savedWithHeldCopy();
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  finishCopy(blob);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).not.toHaveBeenCalled();
  expect(storage.deleteSession).toHaveBeenCalledTimes(1);
});

it("Don't save while a write is being stored runs after it, so the delete is the last word", async () => {
  const actor = answered();
  let finishWrite: (result: 'stored') => void = () => undefined;
  storage.writeSession.mockReturnValueOnce(new Promise<'stored'>((resolve) => { finishWrite = resolve; }));
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).toHaveBeenCalledTimes(1);
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  await vi.advanceTimersByTimeAsync(0);
  expect(storage.deleteSession).not.toHaveBeenCalled();
  finishWrite('stored');
  await vi.advanceTimersByTimeAsync(0);
  expect(storage.deleteSession).toHaveBeenCalledTimes(1);
});

it('Delete my data (RESET) while a write is making its copy: nothing is stored either', async () => {
  const { actor, blob, finishCopy } = savedWithHeldCopy();
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'RESET' });
  finishCopy(blob);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).not.toHaveBeenCalled();
  expect(storage.deleteSession).toHaveBeenCalledTimes(1);
});

it('the delete RESET queues behind an old photo copy names the old session, so a record saved since by another session stays', async () => {
  const { actor, blob, finishCopy } = savedWithHeldCopy();
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'RESET' });
  actor.send({ type: 'START', source: 'answers_only' });
  finishCopy(blob);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.deleteSession.mock.calls).toEqual([[{ id: 'the-old-one' }]]);
});

it('only the first write may create the record: every later one replaces what is still there, or nothing', async () => {
  const actor = answered();
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls.map(([, overwriteOnly]) => overwriteOnly)).toEqual([false, true]);
});

it('a record deleted elsewhere (another tab) is not written back: saving ends, and it was no refusal', async () => {
  const data = sessionAt('questions');
  const actor = createActor(createFakes().machine, { input: input({ restore: data }) }).start();
  startSessionSync(actor, data);
  storage.writeSession.mockResolvedValueOnce('gone');
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls[0]?.[1]).toBe(true);
  expect(actor.getSnapshot().context).toMatchObject({ keep: 'off', keptStored: false, saveStatus: 'idle' });
  expect(storage.deleteSession, 'what another tab has saved since is not this tab\'s to delete').not.toHaveBeenCalled();
});

it('a tab that finds another session stops and asks; only a yes replaces it', async () => {
  const actor = answered();
  storage.writeSession.mockResolvedValueOnce('taken');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(actor.getSnapshot().context).toMatchObject({ saveStatus: 'taken', keptStored: false });
  expect(storage.writeSession.mock.calls[0]?.[2], 'not without a yes').toBe(false);
  actor.send({ type: 'SESSION.REPLACE' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls[1]?.[2]).toBe(true);
  expect(actor.getSnapshot().context).toMatchObject({ saveStatus: 'saved', keptStored: true, replaceSaved: false });
});

it('a yes covers only the first write, and an id stays with its session', async () => {
  const actor = answered();
  actor.send({ type: 'SESSION.REPLACE' });
  await vi.advanceTimersByTimeAsync(1_000);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls.map(([, , mayReplace]) => mayReplace)).toEqual([true, false]);
  expect(new Set(storage.writeSession.mock.calls.map(([session]) => session.data.id)).size).toBe(1);
});

it('Start again ends the session without touching the saved copy, and the new session has its own id', async () => {
  const data = sessionAt('questions', { id: 'the-old-one' });
  const actor = createActor(createFakes().machine, { input: input({ restore: data }) }).start();
  startSessionSync(actor, data);
  actor.send({ type: 'START_AGAIN' });
  actor.send({ type: 'START', source: 'answers_only' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.deleteSession).not.toHaveBeenCalled();
  actor.send({ type: 'PREFS.SET', goal: 'colour' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls[0]?.[1], 'it may create').toBe(false);
  expect(storage.writeSession.mock.calls[0]?.[2], 'and replace, on the yes').toBe(true);
  expect(lastWritten()?.id).not.toBe('the-old-one');
});

it('a period chosen while a session runs is remembered for that session alone; starting or ending one remembers nothing', async () => {
  const data = sessionAt('questions', { id: 'the-old-one', keep: 'day' });
  const actor = createActor(createFakes().machine, { input: input({ restore: data }) }).start();
  startSessionSync(actor, data);
  actor.send({ type: 'SESSION.KEEP', keep: 'until_deleted' });
  expect(storage.rememberSaving.mock.calls).toEqual([['until_deleted', 'the-old-one']]);
  actor.send({ type: 'START_AGAIN' });
  actor.send({ type: 'START', source: 'answers_only', keep: 'day' });
  expect(storage.rememberSaving, 'not on ending or starting a session').toHaveBeenCalledTimes(1);
  actor.send({ type: 'SESSION.KEEP', keep: 'until_deleted' });
  await vi.advanceTimersByTimeAsync(1_000);
  const [mode, chosenFor] = storage.rememberSaving.mock.calls[1] ?? [];
  expect([mode, typeof chosenFor]).toEqual(['until_deleted', 'string']);
  expect(chosenFor, 'for the new session, not the saved one').not.toBe('the-old-one');
  expect(storage.writeSession, 'and nothing of the new, empty session is written').not.toHaveBeenCalled();
});
