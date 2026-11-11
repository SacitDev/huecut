/** The pure rules of the My look machine, each on its own. */
import { expect, it } from 'vitest';
import { asPictureId, slotKey } from '../domain/ids.ts';
import { err, ok } from '../domain/result.ts';
import { colour, computer, content, cut, exampleSession, explore, input, observation, phone, photo } from '../../tests/machine/consult.fakes.ts';
import * as L from './consult.logic.ts';
import { freshContext, restoredContext, sessionDataOf } from './consult.machine.ts';
import { coreOutcome, extraBlock, IDLE_MODELS } from './regions/models.ts';
import type { ConsultContext, ConsultEvent, PhotoEntry, Shortlist } from './consult.types.ts';

const ctx = (over: Partial<ConsultContext> = {}): ConsultContext => ({ ...freshContext(input()), ...over });
const entry = (n: number, over: Partial<PhotoEntry> = {}): PhotoEntry => ({
  id: photo(n),
  status: 'queued',
  sharpness: n,
  observation: null,
  edits: null,
  refined: null,
  error: null,
  tries: 0,
  ...over,
}) as PhotoEntry;
const done = (n: number): PhotoEntry => entry(n, { status: 'done', observation: observation() });
const list = (
  added: Shortlist['added'] = [],
  removed: Shortlist['removed'] = [],
  order: Shortlist['order'] = [],
): Shortlist => ({ added, removed, order });

it('canEnter: only steps reached so far, and only when the step has its data', () => {
  const c = ctx({ furthest: L.stepIndex('goal'), photos: [entry(1)] });
  expect(L.canEnter(c, 'photo', false)).toBe(true);
  expect(L.canEnter(c, 'face', false)).toBe(true);
  expect(L.canEnter(c, 'questions', false)).toBe(false); // beyond furthest
  // The face card has a screen for every outcome, a failed photo too (an existence guard); not after "answers only".
  const failed = ctx({ furthest: 1, photos: [entry(1, { status: 'failed', error: 'decode_failed' })] });
  expect(L.canEnter(failed, 'face', false)).toBe(true);
  expect(L.canEnter({ ...failed, skipped: true }, 'face', false)).toBe(false);
  expect(L.canEnter(ctx({ furthest: 1 }), 'face', false)).toBe(false);
  const goal = ctx({ furthest: L.stepIndex('board'), prefs: { goal: 'colour', collections: ['salon'], count: 4 } });
  expect(L.canEnter(goal, 'ideas', false)).toBe(true);
  expect(L.canEnter(goal, 'try-on', false)).toBe(false);
  expect(L.canEnter(goal, 'board', true)).toBe(true);
  expect(L.canEnter(ctx({ furthest: L.stepIndex('board') }), 'ideas', true)).toBe(false); // no goal yet
});

it('the queue takes the main photo first, then the clearest; a phone analyses 15: the main photo and the 14 clearest of the rest', () => {
  const photos = [
    entry(1, { sharpness: 10 }),
    entry(2, { sharpness: 50 }),
    entry(3, { sharpness: null }),
    entry(4, { sharpness: 30 }),
  ];
  expect(L.analysisQueue(ctx({ photos, mainPhotoId: photo(1) })).map((p) => p.id)).toEqual([
    photo(1),
    photo(2),
    photo(4),
    photo(3),
  ]);
  const many = Array.from({ length: 20 }, (_, i) => entry(i + 1, { sharpness: i + 1 }));
  const onPhone = ctx({ device: phone, photos: many, mainPhotoId: photo(1) });
  const queue = L.analysisQueue(onPhone).map((p) => p.id);
  // "The 15 clearest": the screen says 15, so the blurriest main photo counts inside them.
  expect(queue).toHaveLength(15);
  expect(queue[0]).toBe(photo(1));
  expect(queue.slice(1)).toEqual(Array.from({ length: 14 }, (_, i) => photo(20 - i)));
  const listed = many.filter((p) => L.isListedOnly(onPhone, p)).map((p) => p.id);
  expect(listed).toEqual([photo(2), photo(3), photo(4), photo(5), photo(6)]);
  expect(L.analysisQueue(ctx({ device: computer, photos: many })).length).toBe(20);
  // Once those are done, choosing a listed photo as the main photo queues exactly that one.
  const done = many.map((p) => (queue.includes(p.id) ? { ...p, status: 'done' as const, observation: observation(), error: null } : p));
  expect(L.analysisQueue(ctx({ device: phone, photos: done, mainPhotoId: photo(4) })).map((p) => p.id)).toEqual([photo(4)]);
});

it('out of memory retries the in-flight photo once, then it fails with that code', () => {
  const c = ctx({ photos: [entry(1)], inFlight: { photoId: photo(1) } });
  const noMemory = err({ code: 'out_of_memory' as const, retryable: true, detail: '' });
  const once = L.withAnalysis(c, noMemory);
  expect(once.photos?.[0]).toMatchObject({ status: 'queued', tries: 1 });
  expect(L.withAnalysis({ ...c, photos: once.photos ?? [] }, noMemory).photos?.[0]).toMatchObject({ status: 'failed', error: 'out_of_memory' });
});

it('a crash or watchdog expiry retries the in-flight photo once, then it fails with its code; a removed photo is dropped', () => {
  const c = ctx({ photos: [entry(1)], inFlight: { photoId: photo(1) } });
  const crashed = err({ code: 'crashed' as const, retryable: true, detail: '' });
  const once = L.withAnalysis(c, crashed);
  expect(once.photos?.[0]).toMatchObject({ status: 'queued', tries: 1 });
  const twice = L.withAnalysis(
    { ...c, photos: once.photos ?? [] },
    err({ code: 'timeout' as const, retryable: true, detail: '' }),
  );
  expect(twice.photos?.[0]).toMatchObject({ status: 'failed', error: 'timeout', tries: 1 });
  expect(
    L.withAnalysis(c, err({ code: 'decode_failed' as const, retryable: false, detail: '' })).photos?.[0],
  ).toMatchObject({ status: 'failed', error: 'decode_failed' });
  expect(L.withAnalysis(c, ok(observation())).photos?.[0]).toMatchObject({ status: 'done', error: null });
  const removed = L.withAnalysis({ ...c, photos: [entry(2)] }, ok(observation()));
  expect(removed).toEqual({ photos: [entry(2)], inFlight: null });
});

it('the shortlist: removals are replaced by the next pick, additions stay and are appended, then the order is applied', () => {
  const picks = [cut(1), cut(2), cut(3), cut(4)];
  expect(L.applyShortlist(picks, list())).toEqual(picks);
  // The engine already skips removed ids; the list filters them again.
  expect(L.applyShortlist([cut(1), cut(3), cut(4), cut(5)], list([], [cut(2)]))).toEqual([
    cut(1),
    cut(3),
    cut(4),
    cut(5),
  ]);
  expect(L.applyShortlist(picks, list([explore(1)]))).toEqual([...picks, explore(1)]);
  expect(L.applyShortlist(picks, list([], [], [cut(3), explore(9)]))).toEqual([cut(3), cut(1), cut(2), cut(4)]);
});

it('the list never holds more than 8: engine picks are dropped from the end of the engine order, additions stay', () => {
  const picks = [cut(1), cut(2), cut(3), cut(4), cut(5), cut(6)];
  const added = [explore(1), explore(2), explore(3), explore(4)];
  expect(L.applyShortlist(picks, list(added))).toEqual([cut(1), cut(2), cut(3), cut(4), ...added]);
  const eight = Array.from({ length: 8 }, (_, i) => explore(i + 1));
  expect(L.applyShortlist(picks, list(eight))).toEqual(eight);
  expect(L.canAddToShortlist(list(eight), explore(9))).toBe(false);
  expect(L.canAddToShortlist(list(eight), explore(8))).toBe(true); // already there: nothing to refuse
  expect(L.withAdded(list([], [cut(2)]), cut(2))).toEqual(list([cut(2)], []));
  expect(L.withRemoved(list([explore(1)], [], [explore(1)]), explore(1))).toEqual(list([], [explore(1)], []));
});

it('an addition the engine also picked is never the one dropped to stay within 8', () => {
  const picks = [cut(1), cut(2), cut(3), cut(4), cut(5), cut(6), explore(1)];
  expect(L.applyShortlist(picks, list([explore(1), explore(2), explore(3)]))).toEqual([cut(1), cut(2), cut(3), cut(4), cut(5), explore(1), explore(2), explore(3)]);
});

it('a kept session writes only the slots of the photo it keeps', () => {
  const mine = slotKey(cut(1), photo(1));
  const slots = { [mine]: { pictureId: asPictureId('mine'), hairOnly: false }, [slotKey(cut(2), photo(2))]: { pictureId: asPictureId('other'), hairOnly: false } };
  expect(sessionDataOf(ctx({ photos: [done(1)], mainPhotoId: photo(1), slots }), 'ideas', 1)?.slots).toEqual({ [mine]: slots[mine] });
});

it('SHORTLIST.MOVE turns the list as shown into the person order', () => {
  const shown = [cut(1), cut(2), cut(3)];
  expect(L.withMoved(list(), shown, cut(3), 0).order).toEqual([cut(3), cut(1), cut(2)]);
  expect(L.withMoved(list(), shown, cut(1), 9).order).toEqual([cut(2), cut(3), cut(1)]);
  expect(L.withMoved(list(), shown, explore(1), 0)).toEqual(list()); // not shown: nothing moves
});

it('under Both, half the count rounded up are cuts and the rest colour looks', () => {
  const picks = [cut(1), colour(1), cut(2), colour(2), cut(3), colour(3)].map((id) => ({
    id,
    kind: id.startsWith('cut') ? ('cut' as const) : ('colour' as const),
  }));
  expect(L.picksForCount(picks, 'both', 3)).toEqual([cut(1), cut(2), colour(1)]);
  expect(L.picksForCount(picks, 'both', 4)).toEqual([cut(1), cut(2), colour(1), colour(2)]);
  expect(L.picksForCount(picks, 'colour', 2)).toEqual([colour(1), colour(2)]);
});

it('the pair is one cut and one colour look, and only while both are in the list', () => {
  const pair = { cut: cut(1), colour: colour(1) };
  expect(L.pairIn(content, pair, [cut(1), colour(1)])).toBe(pair);
  expect(L.pairIn(content, pair, [cut(1)])).toBeNull();
  expect(L.isPairOfKinds(content, { cut: colour(1), colour: cut(1) })).toBe(false);
  expect(L.pairIn(content, { cut: cut(1), colour: cut(2) }, [cut(1), cut(2)])).toBeNull();
});

it('extras are off without WebGL2, on low memory, by the computers-only rule and after the running-extra marker', () => {
  const models = IDLE_MODELS;
  const base = { device: computer, extras: { computersOnly: false, crashed: [] }, models };
  expect(extraBlock(base, 'depth')).toBeNull();
  expect(extraBlock({ ...base, models: { ...models, outOfMemory: 1 } }, 'depth')).toBeNull();
  expect(extraBlock({ ...base, models: { ...models, outOfMemory: 2 } }, 'sam')).toBe('out_of_memory');
  expect(extraBlock({ ...base, device: { ...computer, webgl2: false } }, 'depth')).toBe('no_webgl2');
  expect(extraBlock({ ...base, device: { ...computer, webgl2: false } }, 'sam')).toBeNull();
  expect(extraBlock({ ...base, device: { ...computer, lowMemory: true } }, 'depth')).toBe('low_memory');
  expect(extraBlock({ device: phone, extras: { computersOnly: true, crashed: [] }, models }, 'sam')).toBe('computer_only');
  expect(extraBlock({ device: computer, extras: { computersOnly: true, crashed: ['sam'] }, models }, 'sam')).toBe(
    'crashed_last_time',
  );
  expect(coreOutcome(['face', 'hand', 'pose', 'segmenter'])).toBe('ready');
  expect(coreOutcome(['face', 'pose'])).toBe('degraded');
  expect(coreOutcome(['hand', 'pose', 'segmenter'])).toBe('failed');
});

it('PREFS.SET keeps the count within 1-8, at least 2 under Both, and keeps unnamed fields', () => {
  const c = ctx();
  expect(c.prefs.count).toBe(4);
  expect(L.withPrefs(c, { count: 12 }).count).toBe(8);
  expect(L.withPrefs(c, { count: 0 }).count).toBe(1);
  expect(L.withPrefs(ctx({ prefs: { goal: null, collections: [], count: 1 } }), { goal: 'both' })).toEqual({
    goal: 'both',
    collections: [],
    count: 2,
  });
  expect(L.withPrefs(c, { collections: ['salon', 'salon', 'barbering'] }).collections).toEqual(['salon', 'barbering']);
});

it('wantsCore: a photo source at once (save-data: the first photo), a photo added later, never for the example alone', () => {
  expect(L.wantsCore(ctx({ source: 'photo' }))).toBe(true);
  expect(L.wantsCore(ctx({ source: 'photo', device: { ...computer, saveData: true } }))).toBe(false);
  expect(L.wantsCore(ctx({ source: 'photo', device: { ...computer, saveData: true }, photos: [entry(1)] }))).toBe(true);
  expect(L.wantsCore(ctx({ source: 'answers_only' }))).toBe(false);
  expect(L.wantsCore(ctx({ source: 'answers_only', photos: [entry(1)] }))).toBe(true);
  expect(L.wantsCore(ctx({ source: 'example', photos: [done(1)] }))).toBe(false);
});

it('a saved session maps to SessionData and back; the example is never written, and neither is a session with saving off', () => {
  const c = ctx({
    photos: [done(1)],
    mainPhotoId: photo(1),
    furthest: 5,
    prefs: { goal: 'cut', collections: ['salon'], count: 3 },
    shortlist: list([explore(1)], [cut(2)], [explore(1)]),
    slots: { [slotKey(cut(1), photo(1))]: { pictureId: asPictureId('pic-1'), hairOnly: true } },
  });
  const data = sessionDataOf(c, 'ideas', 42);
  if (!data) throw new Error('a kept photo session is written');
  expect(data).toMatchObject({ step: 'ideas', furthest: 5, savedAt: 42, photo: { id: photo(1), example: null } });
  const back = restoredContext(input(), data);
  expect(back).toMatchObject({
    photos: [{ id: photo(1), status: 'done' }],
    shortlist: c.shortlist,
    slots: c.slots,
    resumeAt: 'ideas',
    keptStored: true,
    saveStatus: 'saved',
    savedAt: 42,
  });
  expect(restoredContext(input(), exampleSession), 'the example is not stored').toMatchObject({ keptStored: false, saveStatus: 'idle' });
  expect(sessionDataOf(ctx({ source: 'example' }), 'face', 1)).toBeNull();
  expect(sessionDataOf(ctx({ keep: 'off' }), 'face', 1)).toBeNull();
});

it('a screen cannot send what only the router, session-sync or an actor sends: these lines fail to compile if it could', () => {
  const sent: ConsultEvent[] = [];
  const send = (e: ConsultEvent): void => {
    sent.push(e);
  };
  // @ts-expect-error NAVIGATE is the router's.
  send({ type: 'NAVIGATE', to: 'goal' });
  // @ts-expect-error SESSION.STORED is session-sync's.
  send({ type: 'SESSION.STORED' });
  // @ts-expect-error MODELS.READY is a loader actor's.
  send({ type: 'MODELS.READY', loaded: ['face'], missing: [] });
  expect(sent).toHaveLength(3);
});

it('the kept period goes into the record and comes back from it; a record with no period counts as 24 hours', () => {
  const data = sessionDataOf(ctx({ keep: 'until_deleted' }), 'ideas', 42);
  if (!data) throw new Error('a kept session is written');
  expect(data.keep).toBe('until_deleted');
  expect(restoredContext(input(), data).keep).toBe('until_deleted');
  expect(restoredContext(input(), { ...data, keep: undefined } as never).keep).toBe('day');
});

it('colour in the results: the goal default, the result goal, pairing by rank with repeats, and the new preferences kept', () => {
  expect(L.colourChoiceOf({ goal: 'cut' })).toEqual({ mode: 'keep', shade: null });
  expect(L.colourChoiceOf({ goal: 'both' })).toEqual({ mode: 'pick', shade: null });
  expect(L.colourChoiceOf({ goal: 'colour' })).toBeNull();
  expect(L.colourChoiceOf({ goal: null })).toBeNull();
  expect(L.colourChoiceOf({ goal: 'both', colour: { mode: 'one', shade: colour(1) } })).toEqual({ mode: 'one', shade: colour(1) });
  expect(L.resultGoalOf({ goal: 'both' })).toBe('both');
  expect(L.resultGoalOf({ goal: 'both', colour: { mode: 'keep', shade: null } })).toBe('cut');
  expect(L.resultGoalOf({ goal: 'cut', colour: { mode: 'pick', shade: null } })).toBe('cut');
  expect(L.pairedLooks([cut(1), cut(2), cut(3), colour(1)], [cut(1), cut(2), cut(3)], [colour(1), colour(2)])).toEqual([[cut(1), colour(1)], [cut(2), colour(2)], [cut(3), colour(1)], colour(1)]);
  expect(L.pairedLooks([cut(1)], [cut(1)], [])).toEqual([cut(1)]);
  const c = ctx({ prefs: { goal: 'both', collections: ['salon'], count: 4 } });
  const set = L.withPrefs(c, { colour: { mode: 'keep', shade: null }, tab: 'pictures', perPicture: 3 });
  expect(set).toEqual({ ...c.prefs, colour: { mode: 'keep', shade: null }, tab: 'pictures', perPicture: 3 });
  expect(L.withPrefs({ ...c, prefs: set }, { count: 6 }), 'a later change keeps them').toEqual({ ...set, count: 6 });
});
