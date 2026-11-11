/**
 * Starts the analysis worker from a `blob:` bootstrap: a same-origin worker would take its CSP from response headers, which GitHub
 * Pages does not send, while a blob worker inherits the page's policy. The bootstrap is made through the Trusted Types policy
 * `worker-bootstrap`.
 */
import type { BootMessage } from '../../worker/protocol.ts';
import workerChunkUrl from '../../worker/analysis.worker.ts?worker&url';
import { trustedScriptUrl } from '../trusted-url.ts';
import { createAnalysisClient, type AnalysisClient } from './client.ts';
import type { Limits } from './limits.ts';
import type { StartedWorker } from './supervisor.ts';

/** The one-line module: import the real worker chunk, or say `boot_failed` if it cannot load. */
export const bootstrapSource = (absoluteChunkUrl: string): string =>
  `import(${JSON.stringify(absoluteChunkUrl)}).catch(() => postMessage({ type: 'boot_failed' }));`;

/**
 * Starts a module worker that imports `chunkUrl` (by default the built analysis worker, from `?worker&url`).
 * The blob URL is revoked once the worker has said `ready` or `boot_failed`, or failed.
 */
export function startAnalysisWorker(chunkUrl: string = workerChunkUrl): Worker {
  const absolute = new URL(chunkUrl, document.baseURI).href;
  const blobUrl = URL.createObjectURL(new Blob([bootstrapSource(absolute)], { type: 'text/javascript' }));
  const worker = new Worker(trustedScriptUrl(blobUrl), { type: 'module', name: 'huecut-analysis' });
  const revoke = (): void => {
    URL.revokeObjectURL(blobUrl);
    worker.removeEventListener('message', revoke);
    worker.removeEventListener('error', revoke);
  };
  worker.addEventListener('message', revoke);
  worker.addEventListener('error', revoke);
  return worker;
}

/** No worker could be made: a client on a port of its own says `boot_failed` through the normal handshake. */
function refusedWorker(limits: Limits, onCrash: () => void): StartedWorker {
  const { port1, port2 } = new MessageChannel();
  const client = createAnalysisClient({ endpoint: port1, limits, onCrash });
  port1.start();
  port2.postMessage({ type: 'boot_failed' } satisfies BootMessage);
  return { client, terminate: () => { port1.close(); } };
}

/** The supervisor's `start` for the browser: a bootstrapped worker and its client. It never throws, for the machine has no state for that. */
export function browserWorkerStarter(limits: Limits, chunkUrl?: string): (onCrash: () => void) => StartedWorker {
  return (onCrash) => {
    try {
      const worker = startAnalysisWorker(chunkUrl);
      const client: AnalysisClient = createAnalysisClient({ endpoint: worker, limits, onCrash });
      return { client, terminate: () => { worker.terminate(); } };
    } catch {
      return refusedWorker(limits, onCrash);
    }
  };
}
