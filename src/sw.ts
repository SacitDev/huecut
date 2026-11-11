/**
 * The service worker: the app shell and the library pictures already viewed, same origin only.
 * It never caches a photo (photos are `blob:` URLs and never reach it) and never touches the model files (the worker's
 * registry owns `huecut-models`). The Latvian files are kept only for a person who chose Latvian: the page says which
 * language was chosen, and a new build keeps them when the build before it had them.
 */
export {};
declare const self: ServiceWorkerGlobalScope;

/** Written by the build (`vite.config.ts`): a hash of the files' bytes, the shell's files and the Latvian files, relative to the scope. */
const BUILD = '__HUECUT_BUILD__';
const SHELL_FILES: readonly string[] = ['__HUECUT_SHELL__'];
const LATVIAN_FILES: readonly string[] = ['__HUECUT_LATVIAN__'];

const SHELL_PREFIX = 'huecut-shell-';
const SHELL_CACHE = `${SHELL_PREFIX}${BUILD}`;
const PICTURES_CACHE = 'huecut-pictures';
const PICTURE_FOLDERS = /^(?:library|illustrations|examples|icons)\//;
const LATVIAN_FILE = /\/assets\/lv-(?:strings|content)-[\w-]+\.js$/;

const inScope = (file: string): string => new URL(file, self.registration.scope).href;
const shellUrls = new Set(SHELL_FILES.map(inScope));
// `reload` skips the HTTP cache, which could hand back an index.html that names chunks of an earlier build.
const fresh = (files: readonly string[]): Request[] => files.map((file) => new Request(inScope(file), { cache: 'reload' }));

/** Whether an earlier build's shell kept the Latvian files: then this person reads Latvian, offline too. */
async function keptLatvian(): Promise<boolean> {
  const names = (await caches.keys()).filter((name) => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE);
  const kept = await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).some((r) => LATVIAN_FILE.test(r.url))));
  return kept.includes(true);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const files = (await keptLatvian()) ? [...SHELL_FILES, ...LATVIAN_FILES] : SHELL_FILES;
      await (await caches.open(SHELL_CACHE)).addAll(fresh(files));
    })(),
  );
});

/*
 * No `skipWaiting` and no `clients.claim`: a new build waits until every page of the old one has closed, its safe restart, so an old page keeps the
 * chunks it was built with, and its memory-only work. The page has no reason to know: the next start simply runs the new build.
 */

self.addEventListener('activate', (event) => {
  // A new build may change a picture under the same name, and a cached picture is never checked again, so those go too.
  const stale = caches.keys().then((names) => names.filter((name) => name === PICTURES_CACHE || (name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)));
  event.waitUntil(stale.then((names) => Promise.all(names.map((name) => caches.delete(name)))));
});

/** The page's language choice: Latvian keeps its files in this build's shell, English lets them go. A failed Latvian download leaves the cache unchanged. */
self.addEventListener('message', (event) => {
  const data = event.data as { readonly type?: unknown; readonly language?: unknown } | null;
  if (data?.type !== 'language') return;
  const keep = data.language === 'lv';
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      if (keep) await cache.addAll(fresh(LATVIAN_FILES)).catch(() => undefined);
      else await Promise.all(LATVIAN_FILES.map((file) => cache.delete(inScope(file), { ignoreVary: true })));
    }),
  );
});

/*
 * Lookups ignore `Vary`: one URL here is one file, and a host's `Vary: Origin` would otherwise make a script requested
 * with `crossorigin` miss the entry stored by `install`.
 */

/** Network first, so the page and the server agree on chunk names; the cached shell only when the network fails. */
async function page(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(inScope('index.html'), { cacheName: SHELL_CACHE, ignoreVary: true })) ?? Response.error();
  }
}

/** A chunk of another build is not answered with HTML or kept: its import fails and the app says to reload. */
async function shell(request: Request): Promise<Response> {
  return (await caches.match(request, { cacheName: SHELL_CACHE, ignoreVary: true })) ?? fetch(request);
}

/** Only real images are kept, so a host's HTML fallback for a missing file never becomes a cached picture. */
async function picture(request: Request): Promise<Response> {
  const cache = await caches.open(PICTURES_CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  // A full cache (quota) only costs the next visit its copy; the person still gets the picture the network delivered.
  if (response.ok && response.headers.get('content-type')?.startsWith('image/')) await cache.put(request, response.clone()).catch(() => undefined);
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(page(request));
  else if (shellUrls.has(url.href)) event.respondWith(shell(request));
  else if (url.href.startsWith(inScope('assets/'))) event.respondWith(shell(request));
  else if (PICTURE_FOLDERS.test(url.href.slice(self.registration.scope.length))) event.respondWith(picture(request));
});
