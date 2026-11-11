/** The serial compute lane: FIFO order, one call at a time, and a watchdog that starts at dispatch. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { err, ok, type Result } from '../../domain/result.ts';
import type { AnalysisError } from '../../worker/protocol.ts';
import { createLane } from './lane.ts';

/** The error code of a result, or 'ok'. */
const codeOf = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);

/** A call that answers `value` after `ms` of (fake) work, logging when it starts and ends. */
const work =
  (log: string[], name: string, ms: number) =>
  (): Promise<Result<string, AnalysisError>> => {
    log.push(`start ${name}`);
    return new Promise((resolve) =>
      setTimeout(() => {
        log.push(`end ${name}`);
        resolve(ok(name));
      }, ms),
    );
  };

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it('runs calls one at a time in the order they were queued', async () => {
  const log: string[] = [];
  const lane = createLane({ onExpire: () => undefined });
  const results = Promise.all([
    lane.enqueue({ limitMs: 10_000, run: work(log, 'a', 300) }),
    lane.enqueue({ limitMs: 10_000, run: work(log, 'b', 100) }),
    lane.enqueue({ limitMs: 10_000, run: work(log, 'c', 200) }),
  ]);
  expect(lane.running).toBe(true);
  expect(lane.queued).toBe(2);
  await vi.advanceTimersByTimeAsync(600);
  expect(await results).toEqual([ok('a'), ok('b'), ok('c')]);
  expect(log).toEqual(['start a', 'end a', 'start b', 'end b', 'start c', 'end c']);
  expect(lane.running).toBe(false);
});

it('starts the watchdog at dispatch, not while the call waits', async () => {
  const log: string[] = [];
  const expired = vi.fn();
  const lane = createLane({ onExpire: expired });
  // b waits 8 s behind a, then works 5 s: 13 s after queueing, but only 5 s of its 10 s watchdog.
  const a = lane.enqueue({ limitMs: 10_000, run: work(log, 'a', 8_000) });
  const b = lane.enqueue({ limitMs: 10_000, run: work(log, 'b', 5_000) });
  await vi.advanceTimersByTimeAsync(13_000);
  expect(await a).toEqual(ok('a'));
  expect(await b).toEqual(ok('b'));
  expect(expired).not.toHaveBeenCalled();
});

it('expires a call that outlives its watchdog, reports it and moves on', async () => {
  const log: string[] = [];
  const expired = vi.fn();
  const lane = createLane({ onExpire: expired });
  const hang = lane.enqueue({ limitMs: 10_000, run: () => new Promise<Result<string, AnalysisError>>(() => undefined) });
  const next = lane.enqueue({ limitMs: 10_000, run: work(log, 'next', 100) });
  await vi.advanceTimersByTimeAsync(9_999);
  expect(expired).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(expired).toHaveBeenCalledOnce();
  const r = await hang;
  expect(codeOf(r)).toBe('timeout');
  await vi.advanceTimersByTimeAsync(100);
  expect(await next).toEqual(ok('next'));
});

it('drops a waiting call when its signal aborts, without ever sending it', async () => {
  const log: string[] = [];
  const lane = createLane({ onExpire: () => undefined });
  const controller = new AbortController();
  const a = lane.enqueue({ limitMs: 10_000, run: work(log, 'a', 100) });
  const b = lane.enqueue({ limitMs: 10_000, run: work(log, 'b', 100), signal: controller.signal });
  controller.abort();
  const rb = await b;
  expect(codeOf(rb)).toBe('aborted');
  await vi.advanceTimersByTimeAsync(200);
  expect(await a).toEqual(ok('a'));
  expect(log).toEqual(['start a', 'end a']);
});

it('answers an aborted running call at once and keeps its slot until the worker replies', async () => {
  const log: string[] = [];
  const lane = createLane({ onExpire: () => undefined });
  const stop = new AbortController();
  let reply: (r: Result<string, AnalysisError>) => void = () => undefined;
  const a = lane.enqueue({ limitMs: 10_000, signal: stop.signal, run: () => new Promise<Result<string, AnalysisError>>((resolve) => (reply = resolve)) });
  const b = lane.enqueue({ limitMs: 10_000, run: work(log, 'b', 100) });
  stop.abort();
  expect(codeOf(await a)).toBe('aborted');
  await vi.advanceTimersByTimeAsync(5_000);
  expect(log).toEqual([]);
  expect(lane.running).toBe(true);
  reply(ok('late'));
  await vi.advanceTimersByTimeAsync(100);
  expect(await b).toEqual(ok('b'));
  expect(log).toEqual(['start b', 'end b']);
});

it('closes a bitmap that arrives for a call already answered aborted, and only then', async () => {
  const lane = createLane({ onExpire: () => undefined });
  const close = vi.fn();
  const bitmap = { close } as unknown as ImageBitmap;
  const stop = new AbortController();
  let reply: (r: Result<ImageBitmap, AnalysisError>) => void = () => undefined;
  const cancelled = lane.enqueue({ limitMs: 10_000, signal: stop.signal, run: () => new Promise<Result<ImageBitmap, AnalysisError>>((resolve) => (reply = resolve)) });
  stop.abort();
  await cancelled;
  reply(ok(bitmap));
  await vi.advanceTimersByTimeAsync(0);
  expect(close).toHaveBeenCalledOnce();
  const wanted = await lane.enqueue({ limitMs: 10_000, run: () => Promise.resolve(ok(bitmap)) });
  expect(wanted).toEqual(ok(bitmap));
  expect(close).toHaveBeenCalledOnce();
});

it('expires an aborted running call that never replies', async () => {
  const expired = vi.fn();
  const lane = createLane({ onExpire: expired });
  const stop = new AbortController();
  const a = lane.enqueue({ limitMs: 10_000, signal: stop.signal, run: () => new Promise<Result<string, AnalysisError>>(() => undefined) });
  stop.abort();
  expect(codeOf(await a)).toBe('aborted');
  await vi.advanceTimersByTimeAsync(10_000);
  expect(expired).toHaveBeenCalledOnce();
  expect(lane.running).toBe(false);
});

it('fails the running call and every waiting one at once with failAll', async () => {
  const log: string[] = [];
  const lane = createLane({ onExpire: () => undefined });
  const a = lane.enqueue({ limitMs: 10_000, run: work(log, 'a', 1_000) });
  const b = lane.enqueue({ limitMs: 10_000, run: work(log, 'b', 1_000) });
  const crash: AnalysisError = { code: 'crashed', retryable: true, detail: 'test' };
  lane.failAll(crash);
  expect(await a).toEqual(err(crash));
  expect(await b).toEqual(err(crash));
  await vi.advanceTimersByTimeAsync(2_000);
  expect(log).toEqual(['start a', 'end a']);
  expect(lane.running).toBe(false);
});

