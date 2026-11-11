/** How the session is saved, in the machine: what `SESSION.KEEP`, `SESSION.STORED`, `SESSION.TAKEN`, `SESSION.REPLACE` and `START_AGAIN` do to the context. */
import { expect, it } from 'vitest';
import { boot, sessionAt } from '../../tests/machine/consult.fakes.ts';

const STORED = { type: 'SESSION.STORED', latest: true, savedAt: 5 } as const;

it("a new session is saved by default, until I delete it; the browser's standing choice comes with START", () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  expect(t.snap().context).toMatchObject({ keep: 'until_deleted', keptStored: false, saveStatus: 'idle' });
  const off = boot();
  off.send({ type: 'START', source: 'photo', keep: 'off' });
  expect(off.snap().context.keep).toBe('off');
});

it('changing how long a stored session is kept leaves it stored; turning saving off forgets that, and on again is not stored until its next write', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  t.send({ type: 'SESSION.KEEP', keep: 'day' });
  expect(t.snap().context).toMatchObject({ keep: 'day', keptStored: false });
  t.send(STORED);
  expect(t.snap().context).toMatchObject({ keptStored: true, saveStatus: 'saved', savedAt: 5 });
  t.send({ type: 'SESSION.KEEP', keep: 'until_deleted' });
  expect(t.snap().context).toMatchObject({ keep: 'until_deleted', keptStored: true });
  t.send({ type: 'SESSION.KEEP', keep: 'off' });
  expect(t.snap().context).toMatchObject({ keep: 'off', keptStored: false, saveStatus: 'idle' });
  t.send({ type: 'SESSION.KEEP', keep: 'day' });
  expect(t.snap().context).toMatchObject({ keep: 'day', keptStored: false });
});

it('ANSWER stores and clears; a write landing after saving was turned off changes nothing; RESET clears every input; currentStep is null on intro', () => {
  const t = boot();
  t.send({ type: 'START', source: 'answers_only' });
  t.send({ type: 'ANSWER', question: 'texture', value: { chosen: [1] } });
  t.send({ type: 'ANSWER', question: 'density', value: { chosen: [0] } });
  t.send({ type: 'ANSWER', question: 'texture', value: null });
  expect(t.snap().context.answers).toEqual({ density: { chosen: [0] } });
  t.send(STORED);
  expect(t.snap().context.keptStored).toBe(true);
  t.send({ type: 'SESSION.KEEP', keep: 'off' });
  t.send(STORED);
  expect(t.snap().context).toMatchObject({ keep: 'off', keptStored: false, saveStatus: 'idle' });
  t.send({ type: 'RESET' });
  expect(t.step()).toBeNull();
  expect(t.snap().context.answers).toEqual({});
  expect(t.supervisors[0]?.stopped).toBe(true);
});

it('a write that found another session clears "stored"; the person\'s yes is held only until the next commit', () => {
  const t = boot({ restore: sessionAt('questions') });
  expect(t.snap().context).toMatchObject({ keptStored: true, saveStatus: 'saved' });
  t.send({ type: 'SESSION.TAKEN' });
  expect(t.snap().context).toMatchObject({ keptStored: false, saveStatus: 'taken', replaceSaved: false });
  t.send({ type: 'SESSION.REPLACE' });
  expect(t.snap().context.replaceSaved).toBe(true);
  t.send(STORED);
  expect(t.snap().context).toMatchObject({ keptStored: true, saveStatus: 'saved', replaceSaved: false });
});

it('a copy deleted elsewhere ends the saving of this session', () => {
  const t = boot({ restore: sessionAt('questions') });
  t.send({ type: 'SESSION.DELETE' });
  expect(t.snap().context).toMatchObject({ keep: 'off', keptStored: false, saveStatus: 'idle' });
});

it('START_AGAIN leaves the session for a fresh one with the yes held, and a RESET holds none', () => {
  const t = boot({ restore: sessionAt('ideas', { answers: { density: { chosen: [0] } } }) });
  t.send({ type: 'START_AGAIN' });
  expect(t.step()).toBeNull();
  expect(t.snap().context).toMatchObject({ answers: {}, keep: 'until_deleted', keptStored: false, replaceSaved: true, resumeAt: null });
  expect(t.supervisors[0]?.stopped).toBe(true);
  t.send({ type: 'START', source: 'photo' });
  expect(t.step()).toBe('photo');
  expect(t.snap().context.replaceSaved).toBe(true);
  t.send({ type: 'RESET' });
  expect(t.snap().context.replaceSaved).toBe(false);
});
