/**
 * The content loader: the generated library index once, one details file per id when a
 * screen asks for it, and `consult.json` (prompts, policy) on demand. Cached in memory; failures come back as data.
 */
import type { ConsultData, Detail, LibraryIndex } from '../domain/content/output.ts';
import { err, ok, type Result } from '../domain/result.ts';

/**
 * `not_built`: this build has no generated content; `missing`: no such file (an unknown id, or a 404);
 * `offline`: the request never reached the site; `failed`: any other answer that was not the JSON expected.
 */
export type ContentError = 'not_built' | 'missing' | 'offline' | 'failed';
export type Loaded<T> = Result<T, ContentError>;

/** Where each generated file is served; `undefined` when the build has no such file. */
export interface ContentUrls {
  readonly index: string | undefined;
  readonly consult: string | undefined;
  readonly detail: (id: string) => string | undefined;
}

export interface ContentLoader {
  index(): Promise<Loaded<LibraryIndex>>;
  detail(id: string): Promise<Loaded<Detail>>;
  consult(): Promise<Loaded<ConsultData>>;
}

type Fetch = (url: string) => Promise<Response>;

/** What each loaded file passes through before anyone reads it: the app lays the chosen language over it. */
let localise: (file: unknown) => Promise<void> = () => Promise.resolve();

/** Sets `localise`, once, at start-up. */
export function localiseContentWith(fn: (file: unknown) => Promise<void>): void {
  localise = fn;
}

async function fetchJson(fetcher: Fetch, url: string): Promise<Loaded<unknown>> {
  let response: Response;
  try {
    response = await fetcher(url);
  } catch {
    return err('offline');
  }
  if (response.status === 404) return err('missing');
  if (!response.ok) return err('failed');
  try {
    // The files were validated by the content build: one typed cast at this boundary, no schema here.
    return ok((await response.json()) as unknown);
  } catch {
    return err('failed');
  }
}

/**
 * A loader over `urls`. Each file is fetched at most once while it succeeds; a failed load is forgotten, so the next
 * call (a "Try again") fetches it again.
 */
export function createContentLoader(urls: ContentUrls, fetcher: Fetch = (url) => fetch(url)): ContentLoader {
  const cache = new Map<string, Promise<Loaded<unknown>>>();
  const load = <T>(url: string | undefined, absent: ContentError): Promise<Loaded<T>> => {
    if (url === undefined) return Promise.resolve(err(absent));
    let pending = cache.get(url);
    if (!pending) {
      pending = fetchJson(fetcher, url).then(async (result) => {
        if (!result.ok) cache.delete(url);
        else await localise(result.value);
        return result;
      });
      cache.set(url, pending);
    }
    return pending as Promise<Loaded<T>>;
  };
  return {
    index: () => load<LibraryIndex>(urls.index, 'not_built'),
    detail: (id) => load<Detail>(urls.detail(id), urls.index === undefined ? 'not_built' : 'missing'),
    consult: () => load<ConsultData>(urls.consult, 'not_built'),
  };
}

/**
 * The generated files as Vite assets: each is emitted with a content hash and its URL carries the base path
 * (`import.meta.env.BASE_URL`, `/huecut/`). `no-inline` keeps small files out of `data:` URLs, which the CSP's
 * `connect-src 'self'` would refuse. Keys are relative to `base`, so `./details/<id>.json`.
 */
const FILES = import.meta.glob<string>(['./library-index.json', './consult.json', './details/*.json'], {
  base: '../generated/',
  query: '?url&no-inline',
  import: 'default',
  eager: true,
});

/** The app's loader over this build's generated content. */
export const content: ContentLoader = createContentLoader({
  index: FILES['./library-index.json'],
  consult: FILES['./consult.json'],
  detail: (id) => FILES[`./details/${id}.json`],
});
