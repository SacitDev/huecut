/**
 * The content-addressed model registry: logical path → SHA-256 → Cache Storage
 * `huecut-models`, keyed by the hash. Verified on a miss and again on a hit, so the bytes that run are the
 * bytes that were checked; every Response carries Content-Length and Content-Type.
 */
import { err, ok, type Result } from '../domain/result.ts';
import type { AnalysisError, AnalysisErrorCode } from './protocol.ts';

/** One file a runtime may request (`models.manifest.json`). */
export interface ManifestEntry {
  /** The path the runtime asks for, for example `mediapipe/face_landmarker.task`. */
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
  /** Pinned origin: a URL, or `npm:<package>@<version>/<file>`. */
  readonly source: string;
  readonly licence: string;
}

export interface ModelManifest {
  readonly schemaVersion: 1;
  readonly files: readonly ManifestEntry[];
}

/** The parts of a Cache the registry uses, so tests can pass a fake. */
export interface CacheLike {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<readonly { readonly url: string }[]>;
}

export interface CacheStorageLike {
  open(name: string): Promise<CacheLike>;
}

/** Progress of one file: bytes received so far (against the manifest's count), then the hash check. */
export type BytesProgress = (loadedBytes: number, phase: 'download' | 'verify') => void;

export interface RegistryDeps {
  readonly manifest: ModelManifest;
  readonly caches: CacheStorageLike;
  /** The worker's own fetch, captured before the allowlist replaced it. */
  readonly fetch: (url: string, init: RequestInit) => Promise<Response>;
  /** The served, content-addressed URL of a file; also its cache key. */
  readonly fileUrl: (entry: ManifestEntry) => string;
}

export interface Registry {
  entry(path: string): ManifestEntry | undefined;
  /** Verified bytes of a manifest file, from the cache or the network; never throws. */
  bytes(path: string, signal: AbortSignal | null, onProgress?: BytesProgress): Promise<Result<Uint8Array<ArrayBuffer>, AnalysisError>>;
  /** The fetch-shaped answer the allowlist gives: a verified Response, or a rejection like fetch's. */
  respond(path: string, signal: AbortSignal | null): Promise<Response>;
  /** Deletes cache keys whose hash is not in this manifest; returns how many went (0 when the cache is refused); never throws. */
  prune(): Promise<number>;
}

export const MODELS_CACHE = 'huecut-models';

const fail = (code: AnalysisErrorCode, detail: string): AnalysisError => ({ code, retryable: code !== 'internal', detail });

/** Lower-case hex SHA-256. */
export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A Response the runtimes can read: Transformers.js needs both headers. */
export const responseOf = (bytes: Uint8Array<ArrayBuffer>, entry: ManifestEntry): Response =>
  new Response(bytes, { status: 200, headers: { 'Content-Type': entry.contentType, 'Content-Length': String(entry.bytes) } });

const isAbort = (e: unknown, signal: AbortSignal | null): boolean => signal?.aborted === true || (e instanceof Error && e.name === 'AbortError');

/**
 * Streams one file into a buffer of the manifest's size. Returns `ok(null)` when the size is wrong, which
 * counts as a failed check; a network or abort failure returns its code.
 */
async function download(deps: RegistryDeps, entry: ManifestEntry, reload: boolean, signal: AbortSignal | null, onProgress?: BytesProgress): Promise<Result<Uint8Array<ArrayBuffer> | null, AnalysisError>> {
  try {
    const res = await deps.fetch(deps.fileUrl(entry), { signal, credentials: 'same-origin', cache: reload ? 'reload' : 'default' });
    if (!res.ok || !res.body) return err(fail('network', `HTTP ${String(res.status)} for ${entry.path}`));
    const out = new Uint8Array(entry.bytes);
    const reader = res.body.getReader();
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (loaded + value.byteLength > out.byteLength) {
        await reader.cancel();
        return ok(null);
      }
      out.set(value, loaded);
      loaded += value.byteLength;
      onProgress?.(loaded, 'download');
    }
    return ok(loaded === entry.bytes ? out : null);
  } catch (e) {
    if (isAbort(e, signal)) return err(fail('aborted', `download of ${entry.path} stopped`));
    return err(fail('network', `${entry.path}: ${e instanceof Error ? e.message : String(e)}`));
  }
}

const verified = async (bytes: Uint8Array<ArrayBuffer>, entry: ManifestEntry): Promise<boolean> => bytes.byteLength === entry.bytes && (await sha256Hex(bytes)) === entry.sha256;

/** Cache Storage only saves a download (quota denied or private mode): a refusal reads as a miss or "not cached". */
async function quietly<T>(work: () => Promise<T> | undefined): Promise<T | undefined> {
  try {
    return await work();
  } catch {
    return undefined;
  }
}

/** Verified bytes of one entry. Integrity rule: a bad copy is deleted and fetched once more; a second bad one is `integrity`. */
async function verifiedBytes(deps: RegistryDeps, store: CacheLike | undefined, entry: ManifestEntry, signal: AbortSignal | null, onProgress?: BytesProgress): Promise<Result<Uint8Array<ArrayBuffer>, AnalysisError>> {
  const key = deps.fileUrl(entry);
  let failures = 0;
  const hit = await quietly(() => store?.match(key));
  const body = hit && (await quietly(() => hit.arrayBuffer()));
  if (body) {
    const data = new Uint8Array(body);
    onProgress?.(entry.bytes, 'verify');
    if (await verified(data, entry)) return ok(data);
    await quietly(() => store?.delete(key));
    failures++;
  }
  while (failures < 2) {
    if (signal?.aborted) return err(fail('aborted', `download of ${entry.path} stopped`));
    const got = await download(deps, entry, failures > 0, signal, onProgress);
    if (!got.ok) return got;
    onProgress?.(entry.bytes, 'verify');
    const fresh = got.value;
    if (fresh && (await verified(fresh, entry))) {
      await quietly(() => store?.put(key, responseOf(fresh, entry)));
      return ok(fresh);
    }
    failures++;
  }
  return err(fail('integrity', `SHA-256 of ${entry.path} did not match the manifest twice`));
}

/** Deletes cache keys whose file name does not start with a hash in `hashes`. */
async function prune(store: CacheLike, hashes: ReadonlySet<string>): Promise<number> {
  let deleted = 0;
  for (const request of await store.keys()) {
    const name = new URL(request.url).pathname.split('/').pop() ?? '';
    if (!hashes.has(name.split('.')[0] ?? '') && (await store.delete(request.url))) deleted++;
  }
  return deleted;
}

/** Creates the registry over one manifest. */
export function createRegistry(deps: RegistryDeps): Registry {
  const byPath = new Map(deps.manifest.files.map((f) => [f.path, f]));
  const hashes = new Set(deps.manifest.files.map((f) => f.sha256));
  let cache: CacheLike | undefined;
  const open = async (): Promise<CacheLike | undefined> => (cache ??= await quietly(() => deps.caches.open(MODELS_CACHE)));
  const bytes: Registry['bytes'] = async (path, signal, onProgress) => {
    const entry = byPath.get(path);
    return entry ? verifiedBytes(deps, await open(), entry, signal, onProgress) : err(fail('internal', `not in the manifest: ${path}`));
  };
  return {
    entry: (path) => byPath.get(path),
    bytes,
    async respond(path, signal) {
      const got = await bytes(path, signal);
      if (!got.ok) throw got.error.code === 'aborted' ? new DOMException(got.error.detail, 'AbortError') : new TypeError(got.error.detail);
      const entry = byPath.get(path);
      if (!entry) throw new TypeError(`not in the manifest: ${path}`);
      return responseOf(got.value, entry);
    },
    prune: async () => (await quietly(async () => {
      const store = await open();
      return store && prune(store, hashes);
    })) ?? 0,
  };
}
