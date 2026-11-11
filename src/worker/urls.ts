/**
 * Every URL the worker uses. Built from `self.location.origin` plus Vite's
 * `BASE_URL`, never from `location.href`, which is the `blob:` bootstrap URL inside this worker.
 */
import type { ManifestEntry } from './registry.ts';

/** Site URLs for one origin and base path; pure, so tests pass their own origin. */
export interface SiteUrls {
  /** The site root, for example `https://example.github.io/huecut/`. */
  readonly base: URL;
  /** The served, content-addressed file: `<base>models/<sha256>.<ext>`. */
  readonly modelFile: (entry: Pick<ManifestEntry, 'path' | 'sha256'>) => string;
  /** The URL a runtime asks for by logical path: `<base>models/<logical path>`; only the allowlist answers it. */
  readonly logical: (path: string) => string;
  /** The logical path of a request URL, or null when the URL is not under `<base>models/`. */
  readonly logicalPathOf: (url: URL) => string | null;
}

/** File extension of a logical path, with its dot (`.task`, `.onnx_data`), or '' when it has none; the same as Node's `extname` for manifest paths. */
export const extensionOf = (path: string): string => /\.[a-z0-9_]+$/i.exec(path)?.[0] ?? '';

/** Builds the site's URLs from an origin and a base path such as `/huecut/`. */
export function siteUrls(origin: string, basePath: string): SiteUrls {
  const base = new URL(basePath, origin);
  const models = new URL('models/', base);
  return {
    base,
    modelFile: (entry) => new URL(`${entry.sha256}${extensionOf(entry.path)}`, models).href,
    logical: (path) => new URL(path, models).href,
    logicalPathOf: (url) => {
      if (url.origin !== models.origin || !url.pathname.startsWith(models.pathname)) return null;
      try {
        return decodeURIComponent(url.pathname.slice(models.pathname.length));
      } catch {
        return null; // a malformed escape names no manifest file
      }
    },
  };
}

/** The URLs of the running worker. */
export const workerUrls = (): SiteUrls => siteUrls(self.location.origin, import.meta.env.BASE_URL);
