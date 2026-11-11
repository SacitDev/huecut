/** The fetch allowlist and the worker URLs: manifest files go to the registry, foreign hosts are blocked and counted. */
import { describe, expect, it, vi } from 'vitest';
import { createFetchAllowlist, createRegistryFetch, installFetchAllowlist } from './allowlist.ts';
import { observeWorker } from './observe.ts';
import { extensionOf, siteUrls } from './urls.ts';

const urls = siteUrls('https://example.test', '/huecut/');
const METRICS = 'https://odml.pa.googleapis.com/v1/log';

function setup() {
  const observer = observeWorker(new EventTarget(), null);
  const respond = vi.fn((path: string) => Promise.resolve(new Response(path)));
  const registry = { entry: (path: string) => (path === 'mediapipe/a.wasm' ? { path, sha256: 'ab'.repeat(32), bytes: 1, contentType: 'application/wasm', source: '', licence: '' } : undefined), respond };
  const original = vi.fn((input: RequestInfo | URL) => Promise.resolve(new Response(`network:${input instanceof Request ? input.url : input.toString()}`)));
  const fenced = createFetchAllowlist({ urls, registry, fetch: original, onBlocked: observer.countBlocked, onServed: observer.countServed });
  return { observer, respond, original, fenced };
}

describe('worker URLs', () => {
  it('builds served and logical model URLs from the origin and base path, never from location.href', () => {
    expect(urls.base.href).toBe('https://example.test/huecut/');
    expect(urls.modelFile({ path: 'mediapipe/face_landmarker.task', sha256: 'abc' })).toBe('https://example.test/huecut/models/abc.task');
    expect(urls.logical('mediapipe/a.wasm')).toBe('https://example.test/huecut/models/mediapipe/a.wasm');
    expect(urls.logicalPathOf(new URL('https://example.test/huecut/models/mediapipe/a.wasm'))).toBe('mediapipe/a.wasm');
    expect(urls.logicalPathOf(new URL('https://example.test/huecut/assets/x.js'))).toBeNull();
    expect(urls.logicalPathOf(new URL('https://other.test/huecut/models/mediapipe/a.wasm'))).toBeNull();
    expect(extensionOf('mediapipe/selfie_multiclass_256x256.tflite')).toBe('.tflite');
    // The same extension `npm run models` stores the file under (Node's extname), so the served URL exists.
    expect(extensionOf('sam2.1-hiera-tiny/onnx/vision_encoder_int8.onnx_data')).toBe('.onnx_data');
    expect(urls.modelFile({ path: 'sam2.1-hiera-tiny/onnx/vision_encoder_int8.onnx_data', sha256: 'abc' })).toBe('https://example.test/huecut/models/abc.onnx_data');
  });
});

describe('Transformers.js fetch', () => {
  const entry = { path: 'depth-anything-v2-small/config.json', sha256: 'cd'.repeat(32), bytes: 2, contentType: 'application/json', source: '', licence: '' };
  const respond = vi.fn(() => Promise.resolve(new Response('{}', { headers: { 'Content-Type': entry.contentType, 'Content-Length': '2' } })));
  const make = () => {
    const observer = observeWorker(new EventTarget(), null);
    const registryFetch = createRegistryFetch({ urls, registry: { entry: (p) => (p === entry.path ? entry : undefined), respond }, onServed: observer.countServed, onUnlisted: observer.countUnlisted });
    return { observer, registryFetch };
  };

  it('answers a manifest file by its logical URL from the registry, with both headers, and counts it', async () => {
    const { observer, registryFetch } = make();
    const res = await registryFetch('https://example.test/huecut/models/depth-anything-v2-small/config.json', { headers: new Headers() });
    expect(res.headers.get('Content-Length')).toBe('2');
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(respond).toHaveBeenCalledWith(entry.path, null);
    expect(observer.snapshot().served).toEqual({ [entry.path]: 1 });
  });

  it('answers anything not in the manifest with a 404 of its own, never the network, and counts it', async () => {
    const { observer, registryFetch } = make();
    const missing = await registryFetch('https://example.test/huecut/models/depth-anything-v2-small/generation_config.json');
    const remote = await registryFetch('https://huggingface.co/x/resolve/main/config.json');
    expect([missing.status, remote.status]).toEqual([404, 404]);
    expect(observer.snapshot().unlisted).toEqual({ 'depth-anything-v2-small/generation_config.json': 1, 'https://huggingface.co/x/resolve/main/config.json': 1 });
    expect(observer.snapshot().blocked).toEqual({});
  });
});

describe('fetch allowlist', () => {
  it('blocks a foreign host, counts it by host and never reaches the network', async () => {
    const { observer, original, fenced } = setup();
    await expect(fenced(METRICS, { method: 'POST', body: 'x' })).rejects.toBeInstanceOf(TypeError);
    await expect(fenced(new Request(METRICS, { method: 'POST' }))).rejects.toBeInstanceOf(TypeError);
    await expect(fenced('https://cdn.example.org/model.task')).rejects.toBeInstanceOf(TypeError);
    expect(observer.snapshot().blocked).toEqual({ 'odml.pa.googleapis.com': 2, 'cdn.example.org': 1 });
    expect(original).not.toHaveBeenCalled();
  });

  it('answers a manifest file from the registry, by its logical URL, and counts it served', async () => {
    const { observer, respond, original, fenced } = setup();
    const res = await fenced('https://example.test/huecut/models/mediapipe/a.wasm', { credentials: 'same-origin' });
    expect(await res.text()).toBe('mediapipe/a.wasm');
    expect(respond).toHaveBeenCalledTimes(1);
    expect(original).not.toHaveBeenCalled();
    expect(observer.snapshot().served).toEqual({ 'mediapipe/a.wasm': 1 });
  });

  it('passes other same-origin requests, relative ones resolved against the site base', async () => {
    const { respond, original, fenced } = setup();
    await fenced('https://example.test/huecut/models/0123.task');
    await fenced('assets/chunk.js');
    expect(original).toHaveBeenCalledTimes(2);
    expect(respond).not.toHaveBeenCalled();
  });

  it('treats a malformed escape as an ordinary same-origin request instead of throwing', async () => {
    const { respond, original, fenced } = setup();
    const res = await fenced('https://example.test/huecut/models/%E0%A4%A');
    expect(await res.text()).toContain('network:');
    expect(original).toHaveBeenCalledOnce();
    expect(respond).not.toHaveBeenCalled();
  });

  it('replaces the scope fetch when installed', async () => {
    const { observer, respond } = setup();
    const scope = { fetch: vi.fn(() => Promise.resolve(new Response('raw'))) as typeof fetch };
    const original = scope.fetch;
    installFetchAllowlist(scope, { urls, registry: { entry: () => undefined, respond }, fetch: original, onBlocked: observer.countBlocked, onServed: observer.countServed });
    expect(scope.fetch).not.toBe(original);
    await expect(scope.fetch(METRICS)).rejects.toBeInstanceOf(TypeError);
    expect(observer.snapshot().blocked).toEqual({ 'odml.pa.googleapis.com': 1 });
  });
});

describe('worker observer', () => {
  it('records the worker’s own policy violations', () => {
    const scope = new EventTarget();
    const observer = observeWorker(scope, null);
    const event = Object.assign(new Event('securitypolicyviolation'), { effectiveDirective: 'connect-src', violatedDirective: 'connect-src', blockedURI: METRICS });
    scope.dispatchEvent(event);
    expect(observer.snapshot().violations).toEqual([{ directive: 'connect-src', blockedURI: METRICS }]);
  });

  it('counts WebGL contexts once each and the ones the browser lost', () => {
    class FakeCanvas extends EventTarget {
      lost = false;
      readonly gl = { isContextLost: () => this.lost };
      getContext(type: string): unknown {
        return type === '2d' ? {} : this.gl;
      }
    }
    const observer = observeWorker(new EventTarget(), FakeCanvas.prototype);
    const a = new FakeCanvas();
    const b = new FakeCanvas();
    a.getContext('webgl2');
    a.getContext('webgl2');
    b.getContext('webgl');
    b.getContext('2d');
    expect(observer.snapshot().webgl).toEqual({ created: 2, lost: 0 });
    a.dispatchEvent(new Event('webglcontextlost'));
    b.lost = true;
    expect(observer.snapshot().webgl).toEqual({ created: 2, lost: 2 });
  });
});
