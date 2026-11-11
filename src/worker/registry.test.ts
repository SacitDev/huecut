/**
 * The registry over a fake Cache Storage and a fake server: verify on a miss and on a hit, both headers on
 * every Response, the integrity rule (delete, fetch once more, then `integrity`) and stale-key eviction.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Result } from '../domain/result.ts';
import type { AnalysisError } from './protocol.ts';
import { createRegistry, MODELS_CACHE, sha256Hex, type CacheLike, type ManifestEntry } from './registry.ts';

/** The error code of a result, or 'ok'. */
const codeOf = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);
const BYTES = new Uint8Array(70_000).map((_, i) => (i * 7) % 251);
const ORIGIN = 'https://example.test/huecut/models/';

async function entryFor(bytes: Uint8Array<ArrayBuffer>, path = 'mediapipe/face_landmarker.task'): Promise<ManifestEntry> {
  return { path, sha256: await sha256Hex(bytes), bytes: bytes.byteLength, contentType: 'application/octet-stream', source: 'test', licence: 'Apache-2.0' };
}

/** A Map-backed Cache; stores copies of the bodies, as Cache Storage does. */
function fakeCaches() {
  const store = new Map<string, Uint8Array<ArrayBuffer>>();
  const opened: string[] = [];
  const cache: CacheLike = {
    match: (key) => Promise.resolve(store.has(key) ? new Response(store.get(key)) : undefined),
    put: async (key, response) => {
      store.set(key, new Uint8Array(await response.arrayBuffer()));
    },
    delete: (key) => Promise.resolve(store.delete(key)),
    keys: () => Promise.resolve([...store.keys()].map((url) => ({ url }))),
  };
  return { caches: { open: (name: string) => (opened.push(name), Promise.resolve(cache)) }, store, opened };
}

/** A server that answers each request with the next body in `bodies` (the last one repeats), in 4 KB chunks. */
function fakeServer(bodies: Uint8Array[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const body = bodies[Math.min(calls.length - 1, bodies.length - 1)] ?? new Uint8Array(0);
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (init.signal?.aborted) {
          controller.error(new DOMException('aborted', 'AbortError'));
          return;
        }
        if (offset >= body.byteLength) {
          controller.close();
          return;
        }
        controller.enqueue(body.slice(offset, offset + 4096));
        offset += 4096;
      },
    });
    return Promise.resolve(new Response(stream, { status: 200 }));
  });
  return { fetch, calls };
}

async function setup(bodies: Uint8Array[]) {
  const entry = await entryFor(BYTES);
  const { caches, store, opened } = fakeCaches();
  const server = fakeServer(bodies);
  const registry = createRegistry({ manifest: { schemaVersion: 1, files: [entry] }, caches, fetch: server.fetch, fileUrl: (e) => `${ORIGIN}${e.sha256}.task` });
  return { entry, registry, store, opened, server, key: `${ORIGIN}${entry.sha256}.task` };
}

it('downloads on a miss with progress against the manifest byte count, verifies, then caches by hash', async () => {
  const { entry, registry, store, opened, key } = await setup([BYTES]);
  const progress: [number, string][] = [];
  const r = await registry.bytes(entry.path, null, (loaded, phase) => progress.push([loaded, phase]));
  expect(r.ok && Array.from(r.value)).toEqual(Array.from(BYTES));
  expect(opened).toEqual([MODELS_CACHE]);
  expect(store.has(key)).toBe(true);
  expect(progress.at(-2)).toEqual([BYTES.byteLength, 'download']);
  expect(progress.at(-1)).toEqual([BYTES.byteLength, 'verify']);
});

it('verifies again on a hit and serves from the cache without the network', async () => {
  const { entry, registry, server } = await setup([BYTES]);
  await registry.bytes(entry.path, null);
  const r = await registry.bytes(entry.path, null);
  expect(r.ok).toBe(true);
  expect(server.calls).toHaveLength(1);
});

it('deletes a corrupt cached copy and fetches once more, bypassing the HTTP cache', async () => {
  const { entry, registry, store, server, key } = await setup([BYTES]);
  store.set(key, new Uint8Array(BYTES.byteLength));
  const r = await registry.bytes(entry.path, null);
  expect(r.ok).toBe(true);
  expect(server.calls).toHaveLength(1);
  expect(server.calls[0]?.init.cache).toBe('reload');
  expect(Array.from(store.get(key) ?? [])).toEqual(Array.from(BYTES));
});

it('gives integrity after two bad downloads and caches nothing', async () => {
  const bad = BYTES.slice();
  bad[100] = (bad[100] ?? 0) ^ 1;
  const { entry, registry, store, server } = await setup([bad, bad]);
  const r = await registry.bytes(entry.path, null);
  expect(codeOf(r)).toBe('integrity');
  expect(server.calls).toHaveLength(2);
  expect(store.size).toBe(0);
});

it('accepts the second download when only the first was bad, and treats a wrong size as a failed check', async () => {
  const { entry, registry, server } = await setup([BYTES.slice(0, 1000), BYTES]);
  const r = await registry.bytes(entry.path, null);
  expect(r.ok).toBe(true);
  expect(server.calls).toHaveLength(2);
});

it('serves the allowlist a Response with Content-Length and Content-Type', async () => {
  const { entry, registry } = await setup([BYTES]);
  const res = await registry.respond(entry.path, null);
  expect(res.headers.get('Content-Length')).toBe(String(BYTES.byteLength));
  expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  expect((await res.arrayBuffer()).byteLength).toBe(BYTES.byteLength);
  await expect(registry.respond('not/in/manifest.bin', null)).rejects.toBeInstanceOf(TypeError);
});

it('stops a download when its signal aborts', async () => {
  const { entry, registry, store } = await setup([BYTES]);
  const controller = new AbortController();
  const r = await registry.bytes(entry.path, controller.signal, (loaded) => {
    if (loaded > 8000) controller.abort();
  });
  expect(codeOf(r)).toBe('aborted');
  expect(store.size).toBe(0);
  await expect(registry.respond(entry.path, AbortSignal.abort())).rejects.toMatchObject({ name: 'AbortError' });
});

describe('when the browser refuses Cache Storage (everything else works online)', () => {
  const refused = (): Promise<never> => Promise.reject(new DOMException('refused', 'QuotaExceededError'));
  async function withCache(cache: Partial<CacheLike>, open?: () => Promise<CacheLike>) {
    const entry = await entryFor(BYTES);
    const base = fakeCaches();
    const merged = { ...(await base.caches.open(MODELS_CACHE)), ...cache };
    const server = fakeServer([BYTES]);
    const registry = createRegistry({ manifest: { schemaVersion: 1, files: [entry] }, caches: { open: open ?? (() => Promise.resolve(merged)) }, fetch: server.fetch, fileUrl: (e) => `${ORIGIN}${e.sha256}.task` });
    return { entry, registry, server, merged };
  }

  it('returns the verified bytes when the write is refused', async () => {
    const { entry, registry } = await withCache({ put: refused });
    const r = await registry.bytes(entry.path, null);
    expect(r.ok && Array.from(r.value)).toEqual(Array.from(BYTES));
  });

  it('treats a read that throws as a miss, and still verifies what it downloads', async () => {
    const { entry, registry, server } = await withCache({ match: refused });
    expect((await registry.bytes(entry.path, null)).ok).toBe(true);
    expect(server.calls).toHaveLength(1);
  });

  it('works with no cache at all when opening it is refused, and tries again next time', async () => {
    const { caches } = fakeCaches();
    const open = vi.fn<() => Promise<CacheLike>>().mockImplementationOnce(refused).mockImplementation(() => caches.open(MODELS_CACHE));
    const { entry, registry, server } = await withCache({}, open);
    expect((await registry.bytes(entry.path, null)).ok).toBe(true);
    expect(server.calls).toHaveLength(1);
    expect((await registry.bytes(entry.path, null)).ok).toBe(true);
    expect(open).toHaveBeenCalledTimes(2); // the refusal was not remembered
  });

  it('prunes nothing instead of rejecting', async () => {
    expect(await (await withCache({ keys: refused })).registry.prune()).toBe(0);
    expect(await (await withCache({}, refused)).registry.prune()).toBe(0);
  });
});

it('deletes cache keys whose hash is not in the manifest', async () => {
  const { entry, registry, store, key } = await setup([BYTES]);
  await registry.bytes(entry.path, null);
  store.set(`${ORIGIN}${'0'.repeat(64)}.task`, new Uint8Array(1));
  store.set(`${ORIGIN}${'f'.repeat(64)}.wasm`, new Uint8Array(1));
  expect(await registry.prune()).toBe(2);
  expect([...store.keys()]).toEqual([key]);
});
