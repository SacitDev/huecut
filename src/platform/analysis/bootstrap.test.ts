/** Starting the worker: a browser that refuses it reports a failed boot through the normal handshake. */
import { afterEach, expect, it, vi } from 'vitest';
import { browserWorkerStarter } from './bootstrap.ts';
import { limitsFor } from './limits.ts';

vi.mock('../../worker/analysis.worker.ts?worker&url', () => ({ default: 'worker-chunk.js' }));

afterEach(() => {
  vi.unstubAllGlobals();
});

it('turns a throwing new Worker into boot_failed instead of throwing', async () => {
  vi.stubGlobal('document', { baseURI: 'https://example.test/huecut/' });
  vi.stubGlobal('Worker', function refused() {
    throw new DOMException('refused by the page', 'SecurityError');
  });
  const started = browserWorkerStarter(limitsFor('computer'))(() => undefined);
  const r = await started.client.ready;
  expect(r.ok ? 'ok' : r.error.code).toBe('boot_failed');
  started.terminate();
});
