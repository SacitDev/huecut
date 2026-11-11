/**
 * The saved session's sync, continued: the clock and the period across a restore, every AI picture, and what comes back on boot. Storage and
 * the resource store are faked; the machine is the real one with the machine tests' fake actors.
 */
import { createActor } from 'xstate';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { asPictureId, slotKey } from '../domain/ids.ts';
import type { SessionData } from '../domain/session/session-data.ts';
import { createFakes, cut, input, photo, sessionAt } from '../../tests/machine/consult.fakes.ts';

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
  removePhoto: vi.fn(),
  disposePictures: vi.fn(),
  photo: vi.fn((): { blob: Blob } | undefined => undefined),
  picture: vi.fn<(id: string) => Blob | undefined>(() => undefined),
  shareCopy: vi.fn((): Promise<Blob | null> => Promise.resolve(null)),
}));
vi.mock('../platform/storage.ts', () => storage);
vi.mock('../platform/resources.ts', () => resources);

const { restoreSession, startSessionSync } = await import('./session-sync.ts');

const HOUR = 3_600_000;
const NOW = 1_800_000_000_000;

/** A session restored from a record last saved 20 hours ago, unless `over` says otherwise, with the sync running. */
function restored(over: Partial<SessionData> = {}) {
  const data = sessionAt('questions', { savedAt: NOW - 20 * HOUR, ...over });
  const actor = createActor(createFakes().machine, { input: input({ restore: data }) }).start();
  startSessionSync(actor, data);
  return { actor, data };
}
const lastWritten = (): SessionData | undefined => storage.writeSession.mock.calls.at(-1)?.[0].data;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

it('moving between steps after a restore is written and never restarts the clock', async () => {
  const { actor, data } = restored();
  actor.send({ type: 'NAVIGATE', to: 'goal' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()).toMatchObject({ step: 'goal', savedAt: data.savedAt });
});

it('changing Try it on tab is where the person stands, not a change: the clock stays', async () => {
  const { actor, data } = restored();
  actor.send({ type: 'PREFS.SET', tab: 'pictures' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()).toMatchObject({ savedAt: data.savedAt, prefs: { tab: 'pictures' } });
});

it('a real change is a save, so the 24 hours count from it', async () => {
  const { actor } = restored();
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()?.savedAt).toBe(NOW + 400);
});

it('a record saved before the choice existed counts as 24 hours and keeps its clock when it is next written', async () => {
  const { actor, data } = restored();
  expect(data.keep).toBeUndefined();
  expect(actor.getSnapshot().context.keep).toBe('day');
  actor.send({ type: 'NAVIGATE', to: 'goal' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()).toMatchObject({ keep: 'day', savedAt: data.savedAt });
});

it('deleted and saved again is a new session with a new clock', async () => {
  const { actor } = restored();
  actor.send({ type: 'SESSION.KEEP', keep: 'off' });
  actor.send({ type: 'SESSION.KEEP', keep: 'day' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()?.savedAt).toBe(NOW + 400);
});

it('the choice is restored and written back; switching to 24 hours sets the expiry from that save', async () => {
  const { actor, data } = restored({ keep: 'until_deleted', savedAt: NOW - 900 * HOUR });
  expect(actor.getSnapshot().context.keep).toBe('until_deleted');
  actor.send({ type: 'NAVIGATE', to: 'goal' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()).toMatchObject({ keep: 'until_deleted', savedAt: data.savedAt });
  actor.send({ type: 'SESSION.KEEP', keep: 'day' });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lastWritten()).toMatchObject({ keep: 'day', savedAt: NOW + 1_400 });
});

it('opening a session already saved asks for nothing, and an overwrite is not a first write', async () => {
  const { actor } = restored({ keep: 'until_deleted' });
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.requestPersistOnce).not.toHaveBeenCalled();
});

it('a photo saved before its analysis finished comes back queued, and restoring it writes nothing', async () => {
  const saved = sessionAt('questions').photo;
  if (!saved) throw new Error('the fixture has a photo');
  const { actor } = restored({ photo: { ...saved, observation: null } });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession).not.toHaveBeenCalled();
  expect(actor.getSnapshot().context.photos[0]?.status).toBe('queued');
});

const [slotId, gridId] = [asPictureId('picture-slot'), asPictureId('picture-grid')];
const saved = sessionAt('try-on', {
  slots: { [slotKey(cut(1), photo(1))]: { pictureId: slotId, hairOnly: false } },
  grids: [{ grid: 0, pictureId: gridId, ideas: [], confirmed: false }],
});

it('a slot picture and a grid picture still waiting for its names are both stored', async () => {
  const [slot, grid, copy] = [new Blob(['slot']), new Blob(['grid']), new Blob(['copy'])];
  resources.picture.mockImplementation((id) => (id === slotId ? slot : id === gridId ? grid : undefined));
  resources.shareCopy.mockResolvedValue(copy);
  const actor = createActor(createFakes().machine, { input: input({ restore: saved }) }).start();
  startSessionSync(actor, saved);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(storage.writeSession.mock.calls[0]?.[0].pictures).toEqual({ [slotId]: copy, [gridId]: copy });
});

it('however many pictures a session has had, one record stores at most 24 of them', async () => {
  const slots = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [slotKey(cut(i + 1), photo(1)), { pictureId: asPictureId(`picture-${String(i)}`), hairOnly: false }]));
  const many = { ...saved, slots, grids: [] };
  resources.picture.mockReturnValue(new Blob(['x']));
  resources.shareCopy.mockResolvedValue(new Blob(['copy']));
  const actor = createActor(createFakes().machine, { input: input({ restore: many }) }).start();
  startSessionSync(actor, many);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(Object.keys(storage.writeSession.mock.calls[0]?.[0].pictures ?? {})).toHaveLength(24);
});

it('what came back from storage goes back as it is: a long-kept session is not re-encoded on every save', async () => {
  const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
  storage.readSession.mockResolvedValueOnce({ data: saved, photo: blob, pictures: { [slotId]: blob, [gridId]: blob } });
  await restoreSession(0);
  resources.photo.mockReturnValue({ blob });
  resources.picture.mockReturnValue(blob);
  const actor = createActor(createFakes().machine, { input: input({ restore: saved }) }).start();
  startSessionSync(actor, saved);
  actor.send({ type: 'PREFS.SET', count: 5 });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(resources.shareCopy).not.toHaveBeenCalled();
  const written = storage.writeSession.mock.calls[0]?.[0];
  expect(written?.photo).toBe(blob);
  expect(written?.pictures[slotId]).toBe(blob);
});

it('puts the saved photo and pictures back under their ids before the machine starts', async () => {
  const data = sessionAt('questions');
  const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
  storage.readSession.mockResolvedValueOnce({ data, photo: blob, pictures: { [asPictureId('picture-1')]: blob } });
  await expect(restoreSession(0)).resolves.toBe(data);
  expect(resources.addPhoto).toHaveBeenCalledWith(blob, '', photo(1));
  expect(resources.addPicture).toHaveBeenCalledWith(blob, 'picture-1');
});

it('a restore that Delete my data overtakes keeps nothing: held at the read, no photo is even decoded; held at the photo, it goes again and no picture comes in; held at the content, photo and pictures go again', async () => {
  const data = sessionAt('questions');
  const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
  const kept = { data, photo: blob, pictures: { [asPictureId('picture-1')]: blob } };
  let deletedAt = Number.NEGATIVE_INFINITY;
  storage.deletedSince.mockImplementation((startedAt: number) => deletedAt >= startedAt);
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });

  storage.readSession.mockReturnValueOnce(held.then(() => kept));
  const atRead = restoreSession(NOW);
  deletedAt = NOW + 1;
  release();
  await expect(atRead).resolves.toBeNull();
  expect(resources.addPhoto).not.toHaveBeenCalled();

  deletedAt = Number.NEGATIVE_INFINITY;
  let decoded: () => void = () => undefined;
  storage.readSession.mockResolvedValueOnce(kept);
  resources.addPhoto.mockReturnValueOnce(new Promise<void>((resolve) => { decoded = resolve; }));
  const atPhoto = restoreSession(NOW);
  await vi.advanceTimersByTimeAsync(0);
  expect(resources.addPhoto).toHaveBeenCalledTimes(1);
  deletedAt = NOW + 1;
  decoded();
  await expect(atPhoto).resolves.toBeNull();
  expect(resources.removePhoto).toHaveBeenCalledWith(photo(1));
  expect(resources.addPicture).not.toHaveBeenCalled();

  deletedAt = Number.NEGATIVE_INFINITY;
  resources.removePhoto.mockClear();
  let contentIn: () => void = () => undefined;
  storage.readSession.mockResolvedValueOnce(kept);
  const atContent = restoreSession(NOW, new Promise<void>((resolve) => { contentIn = resolve; }));
  await vi.advanceTimersByTimeAsync(0);
  expect(resources.addPicture).toHaveBeenCalledWith(blob, 'picture-1');
  deletedAt = NOW + 1;
  contentIn();
  await expect(atContent).resolves.toBeNull();
  expect(resources.removePhoto).toHaveBeenCalledWith(photo(1));
  expect(resources.disposePictures).toHaveBeenCalledWith(['picture-1']);
});

it('gives nothing back when no session is saved or it has expired (storage deletes it)', async () => {
  storage.readSession.mockResolvedValueOnce(null);
  await expect(restoreSession(0)).resolves.toBeNull();
});
