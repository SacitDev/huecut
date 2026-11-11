/** The My look machine with fake actors injected through `provide()`. */
import { expect, it } from 'vitest';
import { asPictureId, slotKey } from '../domain/ids.ts';
import { err, ok } from '../domain/result.ts';
import {
  at as valueAt,
  boot,
  type Booted,
  colour,
  computer,
  cut,
  explore,
  observation,
  phone,
  photo,
  sessionAt,
  settle,
} from '../../tests/machine/consult.fakes.ts';
import { NO_PHOTO } from './consult.logic.ts';
import { extraBlock } from './regions/models.ts';
import type { LoaderEvent } from './consult.types.ts';

const last = <T>(xs: readonly T[]): T => {
  const x = xs.at(-1);
  if (x === undefined) throw new Error('nothing yet');
  return x;
};
/** The state of one region of the live actor (`session.models.core`). */
const at = (t: Booted, path: string): unknown => valueAt(t.snap(), path);
const loader = (t: Booted, model: string) => last(t.loaders.filter((l) => l.model === model));
const READY: LoaderEvent = { type: 'MODELS.READY', loaded: ['face', 'hand', 'pose', 'segmenter'], missing: [] };
const add = (t: Booted, ...ns: number[]): void => {
  t.send({ type: 'PHOTOS.ADD', files: ns.map((n) => ({ id: photo(n), sharpness: n })) });
};
async function analysed(t: Booted, faces = 1): Promise<void> {
  last(t.analyses).resolve(ok(observation(faces)));
  await settle();
}

it('START{photo}: the supervisor starts with the session, the core download at once, each photo as soon as the core is ready', async () => {
  const t = boot();
  expect(t.supervisors).toHaveLength(0);
  t.send({ type: 'START', source: 'photo' });
  expect(t.supervisors).toHaveLength(1);
  expect(t.loaders.map((l) => l.model)).toEqual(['core']);
  expect(t.step()).toBe('photo');
  add(t, 1);
  expect(t.analyses).toHaveLength(0);
  const progress = { model: 'face', phase: 'download', loadedBytes: 1, totalBytes: 2 } as const;
  loader(t, 'core').send({ type: 'MODELS.PROGRESS', progress });
  expect(t.snap().context.models.core.progress).toEqual(progress);
  loader(t, 'core').send(READY);
  expect(at(t, 'session.models.core')).toBe('ready');
  expect(t.analyses.map((a) => a.photoId)).toEqual([photo(1)]);
  await analysed(t);
  expect(t.snap().context.photos[0]?.status).toBe('done');
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('face');
  t.send({ type: 'NEXT' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('goal'); // no goal or collection chosen yet
});

it('on save-data devices the core waits for the first photo; from answers only it waits for a photo added later', () => {
  const saving = boot({ device: { ...computer, saveData: true } });
  saving.send({ type: 'START', source: 'photo' });
  expect(saving.loaders).toHaveLength(0);
  add(saving, 1);
  expect(saving.loaders.map((l) => l.model)).toEqual(['core']);
  const answers = boot();
  answers.send({ type: 'START', source: 'answers_only' });
  expect(answers.step()).toBe('goal');
  expect(answers.loaders).toHaveLength(0);
  add(answers, 1);
  expect(answers.loaders).toHaveLength(1);
});

it('MODELS.READY with only the face model is degraded and analysis runs; without the face model it fails; MODELS.RETRY loads again', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1);
  loader(t, 'core').send({ type: 'MODELS.READY', loaded: ['face', 'pose'], missing: ['hand', 'segmenter'] });
  expect(at(t, 'session.models.core')).toBe('degraded');
  expect(t.snap().context.models.core.missing).toEqual(['hand', 'segmenter']);
  expect(t.analyses).toHaveLength(1);
  const u = boot();
  u.send({ type: 'START', source: 'photo' });
  loader(u, 'core').send({ type: 'MODELS.READY', loaded: ['hand'], missing: ['face'] });
  expect(at(u, 'session.models.core')).toBe('failed');
  expect(u.snap().context.models.core.error?.code).toBe('unsupported');
  u.send({ type: 'MODELS.RETRY' });
  expect(at(u, 'session.models.core')).toBe('loading');
  expect(u.loaders).toHaveLength(2);
});

it('a photo tool asks for the core tools with MODELS.RETRY where wantsCore never started them, as in a restored answers-only session', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  expect(at(t, 'session.models.core')).toBe('idle');
  expect(t.loaders).toHaveLength(0);
  t.send({ type: 'MODELS.RETRY' });
  expect(at(t, 'session.models.core')).toBe('loading');
  expect(t.loaders.map((l) => l.model)).toEqual(['core']);
});

it('CANCEL{core} aborts that download only, as aborted; MODELS.FAILED keeps its code; RETRY downloads again', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  t.send({ type: 'EXTRA.REQUEST', model: 'depth' });
  t.send({ type: 'CANCEL', model: 'core' });
  expect(at(t, 'session.models.core')).toBe('failed');
  expect(t.snap().context.models.core.error?.code).toBe('aborted');
  expect(loader(t, 'core').signal.aborted).toBe(true);
  expect(loader(t, 'depth').signal.aborted).toBe(false);
  t.send({ type: 'MODELS.RETRY' });
  loader(t, 'core').send({
    type: 'MODELS.FAILED',
    error: { code: 'boot_failed', retryable: true, detail: 'stale chunk' },
  });
  expect(t.snap().context.models.core.error?.code).toBe('boot_failed');
});

it('out of memory reloads the core tools, and the second time in a session switches both extras off until RESET', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  loader(t, 'core').send(READY);
  t.send({ type: 'EXTRA.REQUEST', model: 'sam' });
  t.send({ type: 'WORKER.RESTARTED', reason: 'out_of_memory' });
  expect(at(t, 'session.models.core')).toBe('loading');
  expect(at(t, 'session.models.sam')).toBe('idle');
  t.send({ type: 'WORKER.RESTARTED', reason: 'crashed' }); // a crash is not memory running out
  expect(at(t, 'session.models.sam')).toBe('idle');
  t.send({ type: 'WORKER.RESTARTED', reason: 'out_of_memory' });
  expect([at(t, 'session.models.depth'), at(t, 'session.models.sam')]).toEqual(['unsupported', 'unsupported']);
  expect(extraBlock(t.snap().context, 'sam')).toBe('out_of_memory');
  t.send({ type: 'RESET' });
  t.send({ type: 'START', source: 'photo' });
  expect([at(t, 'session.models.depth'), at(t, 'session.models.sam')]).toEqual(['idle', 'idle']);
});

it('a worker restart does not restart a core download the person cancelled, and Download again still works', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  t.send({ type: 'CANCEL', model: 'core' });
  t.send({ type: 'WORKER.RESTARTED', reason: 'crashed' });
  expect(at(t, 'session.models.core')).toBe('failed');
  expect(t.snap().context.models.core.error?.code).toBe('aborted');
  expect(t.loaders.map((l) => l.model)).toEqual(['core']);
  t.send({ type: 'MODELS.RETRY' });
  expect(at(t, 'session.models.core')).toBe('loading');
  expect(t.loaders.map((l) => l.model)).toEqual(['core', 'core']);
});

it('an extra goes check → idle → downloading → ready, offers retry after a failure, and is unsupported where its rule says so', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  expect(at(t, 'session.models.depth')).toBe('idle');
  t.send({ type: 'EXTRA.REQUEST', model: 'sam' });
  loader(t, 'sam').send({
    type: 'EXTRA.FAILED',
    model: 'sam',
    error: { code: 'network', retryable: true, detail: 'stalled' },
  });
  expect(at(t, 'session.models.sam')).toBe('failed');
  t.send({ type: 'EXTRA.RETRY', model: 'depth' }); // the other extra's retry changes nothing here
  expect(t.loaders.filter((l) => l.model === 'sam')).toHaveLength(1);
  t.send({ type: 'EXTRA.RETRY', model: 'sam' });
  loader(t, 'sam').send({ type: 'EXTRA.READY', model: 'sam' });
  expect(at(t, 'session.models.sam')).toBe('ready');
  const p = boot({ device: phone, extras: { computersOnly: true, crashed: [] } });
  p.send({ type: 'START', source: 'photo' });
  expect([at(p, 'session.models.depth'), at(p, 'session.models.sam')]).toEqual(['unsupported', 'unsupported']);
  const w = boot({ device: { ...computer, webgl2: false }, extras: { computersOnly: false, crashed: ['sam'] } });
  w.send({ type: 'START', source: 'photo' });
  w.send({ type: 'EXTRA.REQUEST', model: 'sam' });
  expect([at(w, 'session.models.depth'), at(w, 'session.models.sam')]).toEqual(['unsupported', 'unsupported']);
  expect(w.loaders.map((l) => l.model)).toEqual(['core']);
});

it('the questions lead to Ideas whatever the goal, with or without a photo: there is no branch after them', () => {
  for (const [goal, photos, expected] of [
    ['cut', true, 'ideas'],
    ['both', true, 'ideas'],
    ['colour', true, 'ideas'],
    ['cut', false, 'ideas'],
  ] as const) {
    const t = boot();
    t.send({ type: 'START', source: photos ? 'photo' : 'answers_only' });
    if (photos) add(t, 1);
    if (photos) t.send({ type: 'NEXT' });
    t.send({ type: 'NEXT' });
    t.send({ type: 'PREFS.SET', goal, collections: ['salon'] });
    t.send({ type: 'NEXT' });
    expect(t.step()).toBe('questions');
    t.send({ type: 'NEXT' });
    expect(t.step()).toBe(expected);
  }
});

it('ANALYSIS.SKIP continues with answers only: no more analysis and Ideas after the questions; a new photo brings photos back', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1);
  t.send({ type: 'ANALYSIS.SKIP' });
  expect(t.step()).toBe('goal');
  loader(t, 'core').send(READY);
  expect(t.analyses).toHaveLength(0);
  t.send({ type: 'PREFS.SET', goal: 'cut', collections: ['barbering'] });
  t.send({ type: 'NEXT' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('ideas');
  add(t, 2);
  expect(t.snap().context.skipped).toBe(false);
  expect(t.analyses.map((a) => a.photoId)).toEqual([photo(1)]); // the main photo first
});

it('Ideas → Try it on needs a non-empty list; NAVIGATE past the furthest step is refused, Back is allowed', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  t.send({ type: 'NAVIGATE', to: 'ideas' });
  expect(t.step()).toBe('goal');
  t.send({ type: 'PREFS.SET', goal: 'colour', collections: ['salon'] });
  t.send({ type: 'NEXT' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('ideas');
  t.send({ type: 'NAVIGATE', to: 'board' });
  expect(t.step()).toBe('ideas');
  t.send({ type: 'NAVIGATE', to: 'goal' });
  expect(t.step()).toBe('goal');
  t.send({ type: 'NAVIGATE', to: 'ideas' });
  t.send({ type: 'NEXT' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('board');
  expect(t.snap().context.furthest).toBe(6);
  for (const id of t.selectors.ideas(t.snap().context).ids) t.send({ type: 'SHORTLIST.REMOVE', id });
  expect(t.selectors.ideas(t.snap().context).ids).toHaveLength(4); // removed ideas are replaced by the next picks
});

it('PHOTOS.REMOVE releases the photo; a new main photo drops and disposes the old slots; SLOT.ADD fills main-photo slots only', () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1, 2);
  const mine = slotKey(cut(1), photo(1));
  t.send({ type: 'SLOT.ADD', key: slotKey(cut(1), photo(2)), file: asPictureId('x') });
  expect(t.snap().context.slots).toEqual({});
  t.send({ type: 'SLOT.ADD', key: mine, file: asPictureId('a') });
  t.send({ type: 'SLOT.ADD', key: mine, file: asPictureId('b') });
  t.send({ type: 'SLOT.HAIR_ONLY', key: mine, on: true });
  expect(t.snap().context.slots).toEqual({ [mine]: { pictureId: 'b', hairOnly: true } });
  expect(t.disposed).toEqual(['a']);
  t.send({ type: 'PHOTOS.SET_MAIN', id: photo(2) });
  expect(t.snap().context.slots).toEqual({});
  expect(t.disposed).toEqual(['a', 'b']);
  t.send({ type: 'PHOTOS.REMOVE', id: photo(2) });
  expect(t.released).toEqual([photo(2)]);
  expect(t.snap().context.mainPhotoId).toBe(photo(1));
});

it('SHORTLIST.ADD works on the root before START and is refused with a notice once 8 additions are in', () => {
  const t = boot();
  t.send({ type: 'SHORTLIST.ADD', id: explore(1) });
  expect(t.snap().value).toBe('intro');
  t.send({ type: 'START', source: 'photo' });
  for (let n = 2; n <= 9; n++) t.send({ type: 'SHORTLIST.ADD', id: explore(n) });
  expect(t.snap().context.shortlist.added).toHaveLength(8);
  expect(t.emitted).toEqual([{ type: 'SHORTLIST.REFUSED', id: explore(9), reason: 'full' }]);
  t.send({ type: 'PAIR.SET', cut: cut(1), colour: cut(2) });
  expect(t.snap().context.pair).toBeNull();
  t.send({ type: 'PAIR.SET', cut: cut(1), colour: colour(1) });
  expect(t.snap().context.pair).toEqual({ cut: cut(1), colour: colour(1) });
  t.send({ type: 'PAIR.CLEAR' });
  expect(t.snap().context.pair).toBeNull();
});

async function onFace(): Promise<Booted> {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1, 2);
  loader(t, 'core').send(READY);
  await analysed(t);
  await analysed(t);
  t.send({ type: 'NEXT' });
  return t;
}

it('Move the lines applies each move at once to the main photo; one part or every line goes back as found; a stale edit is refused', async () => {
  const t = await onFace();
  expect(t.step()).toBe('face');
  const edits = (n: number) => t.snap().context.photos.find((p) => p.id === photo(n))?.edits ?? null;
  t.send({ type: 'POINTS.MOVE', photoId: photo(1), index: 4, to: { x: 0.4, y: 0.3 } });
  t.send({ type: 'POINTS.MOVE', photoId: photo(1), index: 5, to: { x: 0.5, y: 0.5 } });
  t.send({ type: 'HAIRLINE.MOVE', photoId: photo(1), to: [{ x: 0.4, y: 0.2 }, { x: 0.6, y: 0.2 }] });
  expect(edits(1)).toEqual({ points: { 4: { x: 0.4, y: 0.3 }, 5: { x: 0.5, y: 0.5 } }, hairline: [{ x: 0.4, y: 0.2 }, { x: 0.6, y: 0.2 }] });
  t.send({ type: 'POINTS.RESET', photoId: photo(1), part: 5 });
  t.send({ type: 'POINTS.RESET', photoId: photo(1), part: 'hairline' });
  expect(edits(1)).toEqual({ points: { 4: { x: 0.4, y: 0.3 } }, hairline: null });
  // Photo 2 is not the main photo: an edit for it is stale and changes nothing.
  t.send({ type: 'POINTS.MOVE', photoId: photo(2), index: 4, to: { x: 0.1, y: 0.1 } });
  expect(edits(2)).toBeNull();
  t.send({ type: 'PHOTOS.SET_MAIN', id: photo(2) });
  t.send({ type: 'POINTS.MOVE', photoId: photo(1), index: 6, to: { x: 0.2, y: 0.2 } });
  t.send({ type: 'POINTS.RESET', photoId: photo(1), part: 'all' });
  expect(edits(1)).toEqual({ points: { 4: { x: 0.4, y: 0.3 } }, hairline: null });
  t.send({ type: 'PHOTOS.SET_MAIN', id: photo(1) });
  t.send({ type: 'POINTS.RESET', photoId: photo(1), part: 'all' });
  expect(edits(1)).toBeNull();
  expect(t.step()).toBe('face');
  expect(t.emitted).toEqual([]);
});

it('a photo that failed before Continue still reaches the face card; after Ideas the face card leads back there', async () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1);
  loader(t, 'core').send(READY);
  last(t.analyses).resolve(err({ code: 'decode_failed', retryable: false, detail: 'HEIC outside Safari' }));
  await settle();
  expect(t.snap().context.photos[0]).toMatchObject({ status: 'failed' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('face');
  t.send({ type: 'NEXT' });
  t.send({ type: 'PREFS.SET', goal: 'cut', collections: ['salon'] });
  t.send({ type: 'NEXT' });
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('ideas');
  t.send({ type: 'NAVIGATE', to: 'face' });
  expect(t.step()).toBe('face');
  t.send({ type: 'NEXT' });
  expect(t.step()).toBe('ideas');
});

it('an analysis actor that throws marks its photo failed with internal, and the queue moves on', async () => {
  const t = boot();
  t.send({ type: 'START', source: 'photo' });
  add(t, 1, 2);
  loader(t, 'core').send(READY);
  last(t.analyses).reject(new Error('bug'));
  await settle();
  expect(t.snap().context.photos[0]).toMatchObject({ status: 'failed', error: 'internal' });
  expect(t.analyses.map((a) => a.photoId)).toEqual([photo(1), photo(2)]);
});

it('input.restore goes straight to the saved step with its furthest; the saved photo is not analysed again', () => {
  const t = boot({
    restore: sessionAt('ideas', { furthest: 6, shortlist: { added: [explore(1)], removed: [], order: [] } }),
  });
  expect(t.step()).toBe('ideas');
  expect(t.snap().context).toMatchObject({ furthest: 6, resumeAt: null, keptStored: true, mainPhotoId: photo(1) });
  expect(t.supervisors).toHaveLength(1);
  loader(t, 'core').send(READY);
  expect(t.analyses).toHaveLength(0);
  t.send({ type: 'NAVIGATE', to: 'try-on' });
  expect(t.step()).toBe('try-on');
  expect(t.selectors.ideas(t.snap().context).own).toEqual([explore(1)]);
});

it('a grid gets its names only on GRID.CONFIRM; a new picture for the same grid disposes the old one', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  t.send({ type: 'GRID.ADD', grid: 1, file: asPictureId('g1') });
  t.send({ type: 'GRID.ADD', grid: 0, file: asPictureId('g0') });
  t.send({ type: 'GRID.ADD', grid: 1, file: asPictureId('g1b') });
  expect(t.snap().context.grids).toEqual([
    { grid: 0, pictureId: 'g0', ideas: [], confirmed: false },
    { grid: 1, pictureId: 'g1b', ideas: [], confirmed: false },
  ]);
  expect(t.disposed).toEqual(['g1']);
  t.send({ type: 'GRID.CONFIRM', grid: 1, order: [cut(2), cut(1)] });
  expect(t.snap().context.grids[1]).toEqual({ grid: 1, pictureId: 'g1b', ideas: [cut(2), cut(1)], confirmed: true });
});

it('the first photo replaces the no-photo slots and disposes their pictures; a later photo leaves the main photo\'s slots alone', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  const none = slotKey(cut(1), NO_PHOTO);
  t.send({ type: 'SLOT.ADD', key: none, file: asPictureId('n') });
  expect(Object.keys(t.snap().context.slots)).toEqual([none]);
  add(t, 1);
  expect(t.snap().context.slots).toEqual({});
  expect(t.disposed).toEqual(['n']);
  const mine = slotKey(cut(1), photo(1));
  t.send({ type: 'SLOT.ADD', key: mine, file: asPictureId('a') });
  add(t, 2);
  expect(Object.keys(t.snap().context.slots)).toEqual([mine]);
  expect(t.disposed).toEqual(['n']);
});

it('RESET ends the session with its moved lines, saying nothing', async () => {
  const t = await onFace();
  t.send({ type: 'POINTS.MOVE', photoId: photo(1), index: 5, to: { x: 0.5, y: 0.5 } });
  t.send({ type: 'RESET' });
  expect(t.step()).toBeNull();
  expect(t.snap().context.photos).toEqual([]);
  expect(t.emitted).toEqual([]);
});
