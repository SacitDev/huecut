/**
 * The worker's fetch allowlist, installed before any model runtime is imported: a
 * manifest file is answered by the registry, another same-origin request passes, and anything else is
 * rejected and counted by host. MediaPipe's metrics POSTs to odml.pa.googleapis.com end here. Transformers.js
 * gets a stricter fetch of its own: manifest files only, everything else a 404 without the network.
 */
import type { Registry } from './registry.ts';
import type { SiteUrls } from './urls.ts';

export interface AllowlistDeps {
  /** The site's URLs; relative requests resolve against its base. */
  readonly urls: Pick<SiteUrls, 'base' | 'logicalPathOf'>;
  readonly registry: Pick<Registry, 'entry' | 'respond'>;
  /** The original fetch, for same-origin requests that are not manifest files. */
  readonly fetch: typeof fetch;
  /** Counts a rejected request by host (shown in Help and asserted by the e2e suite). */
  readonly onBlocked: (host: string) => void;
  /** Counts a manifest file answered from the registry, by logical path. */
  readonly onServed: (path: string) => void;
}

const urlOf = (input: RequestInfo | URL, base: URL): URL => new URL(input instanceof Request ? input.url : String(input), base);
const signalOf = (input: RequestInfo | URL, init?: RequestInit): AbortSignal | null => init?.signal ?? (input instanceof Request ? input.signal : null);

/** Builds the fenced fetch. */
export function createFetchAllowlist(deps: AllowlistDeps): typeof fetch {
  return (input, init) => {
    const url = urlOf(input, deps.urls.base);
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const path = deps.urls.logicalPathOf(url);
    if (method === 'GET' && path !== null && deps.registry.entry(path)) {
      deps.onServed(path);
      return deps.registry.respond(path, signalOf(input, init));
    }
    if (url.origin === deps.urls.base.origin) return deps.fetch(input, init);
    const host = url.host || url.protocol;
    deps.onBlocked(host);
    return Promise.reject(new TypeError(`Blocked by the Huecut fetch allowlist: ${host}`));
  };
}

/** Replaces `scope.fetch` with the allowlist; `deps.fetch` is the original, captured by the caller first. */
export function installFetchAllowlist(scope: { fetch: typeof fetch }, deps: AllowlistDeps): void {
  scope.fetch = createFetchAllowlist(deps);
}

export interface RegistryFetchDeps extends Pick<AllowlistDeps, 'urls' | 'registry' | 'onServed'> {
  /** Counts a request for a file the manifest does not list (its logical path, or the URL). */
  readonly onUnlisted: (pathOrUrl: string) => void;
}

/**
 * Transformers.js's `env.fetch`: a manifest file by its logical URL comes from the registry, verified,
 * with Content-Length and Content-Type; anything else is answered 404 here and never reaches the network.
 */
export function createRegistryFetch(deps: RegistryFetchDeps): typeof fetch {
  return (input, init) => {
    const url = urlOf(input, deps.urls.base);
    const path = deps.urls.logicalPathOf(url);
    if (path !== null && deps.registry.entry(path)) {
      deps.onServed(path);
      return deps.registry.respond(path, signalOf(input, init));
    }
    deps.onUnlisted(path ?? url.href);
    return Promise.resolve(new Response(null, { status: 404, statusText: 'Not in the model manifest' }));
  };
}
