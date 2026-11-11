/** The content loader over a fake fetch: one request per file, errors as data, and a retry after a failure. */
import { describe, expect, it, vi } from 'vitest';
import { createContentLoader, type ContentUrls } from './content.ts';

const URLS: ContentUrls = {
  index: '/huecut/assets/library-index-a1.json',
  consult: '/huecut/assets/consult-b2.json',
  detail: (id) => (id === 'chin-bob' ? '/huecut/assets/chin-bob-c3.json' : undefined),
};
const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('createContentLoader', () => {
  it('fetches the index once and serves the cached value after that', async () => {
    const fetcher = vi.fn(() => Promise.resolve(json({ models: [], entries: [{ id: 'chin-bob' }] })));
    const loader = createContentLoader(URLS, fetcher);
    const [a, b] = await Promise.all([loader.index(), loader.index()]);
    expect(a).toEqual({ ok: true, value: { models: [], entries: [{ id: 'chin-bob' }] } });
    expect(b).toBe(a);
    await loader.index();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/huecut/assets/library-index-a1.json');
  });

  it('loads a detail by id from its own URL and says missing for an id the build has no file for', async () => {
    const fetcher = vi.fn((url: string) => Promise.resolve(json({ id: url })));
    const loader = createContentLoader(URLS, fetcher);
    expect(await loader.detail('chin-bob')).toEqual({ ok: true, value: { id: '/huecut/assets/chin-bob-c3.json' } });
    expect(await loader.detail('../consult')).toEqual({ ok: false, error: 'missing' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('says not_built when the build has no generated content, without a request', async () => {
    const fetcher = vi.fn(() => Promise.resolve(json({})));
    const loader = createContentLoader({ index: undefined, consult: undefined, detail: () => undefined }, fetcher);
    expect(await loader.index()).toEqual({ ok: false, error: 'not_built' });
    expect(await loader.consult()).toEqual({ ok: false, error: 'not_built' });
    expect(await loader.detail('chin-bob')).toEqual({ ok: false, error: 'not_built' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps a network failure, a 404, a server error and broken JSON to their codes', async () => {
    const offline = createContentLoader(URLS, () => Promise.reject(new TypeError('Failed to fetch')));
    expect(await offline.index()).toEqual({ ok: false, error: 'offline' });
    const notFound = createContentLoader(URLS, () => Promise.resolve(json({}, 404)));
    expect(await notFound.consult()).toEqual({ ok: false, error: 'missing' });
    const serverError = createContentLoader(URLS, () => Promise.resolve(json({}, 500)));
    expect(await serverError.index()).toEqual({ ok: false, error: 'failed' });
    const broken = createContentLoader(URLS, () => Promise.resolve(new Response('{ not json', { status: 200 })));
    expect(await broken.index()).toEqual({ ok: false, error: 'failed' });
  });

  it('forgets a failed load, so Try again fetches the file again', async () => {
    const fetcher = vi.fn<(url: string) => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json({ models: [], entries: [] }));
    const loader = createContentLoader(URLS, fetcher);
    expect(await loader.index()).toEqual({ ok: false, error: 'offline' });
    expect(await loader.index()).toEqual({ ok: true, value: { models: [], entries: [] } });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
