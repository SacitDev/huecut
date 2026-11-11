/**
 * What the worker watches about itself for `diagnostics()`: requests the allowlist blocked, by host; the manifest files it served
 * by logical path and the unlisted ones it refused; its own `securitypolicyviolation` events, which never reach the page; and the
 * WebGL contexts its tasks open, so a context the browser force-drops is counted, not silent.
 */
import type { Diagnostics } from './protocol.ts';

export interface WorkerObserver {
  /** Counts one request the allowlist rejected. */
  readonly countBlocked: (host: string) => void;
  /** Counts one manifest file answered from the registry by its logical path. */
  readonly countServed: (path: string) => void;
  /** Counts one request Transformers.js's fetch got for a file not in the manifest (answered 404, no network). */
  readonly countUnlisted: (pathOrUrl: string) => void;
  readonly snapshot: () => Diagnostics;
}

/** The scope the observer listens on: the worker global in production, an EventTarget in tests. */
export interface ObservedScope {
  addEventListener(type: 'securitypolicyviolation', listener: (event: Event) => void): void;
}

/** The canvas prototype whose `getContext` is wrapped (OffscreenCanvas in the worker). */
export interface CanvasPrototype {
  getContext: (this: EventTarget, type: string, options?: unknown) => unknown;
}

interface GlContext {
  isContextLost(): boolean;
}

/** Wraps `getContext` so every WebGL context is recorded and its `webglcontextlost` event counted. */
function watchWebGl(proto: CanvasPrototype | null): () => Diagnostics['webgl'] {
  const contexts: { readonly gl: GlContext; lost: boolean }[] = [];
  const seen = new WeakSet<object>();
  if (proto) {
    const original = proto.getContext;
    proto.getContext = function (this: EventTarget, type: string, options?: unknown): unknown {
      const context = original.call(this, type, options);
      if ((type === 'webgl' || type === 'webgl2') && typeof context === 'object' && context !== null && !seen.has(context)) {
        seen.add(context);
        const record = { gl: context as GlContext, lost: false };
        contexts.push(record);
        this.addEventListener('webglcontextlost', () => {
          record.lost = true;
        });
      }
      return context;
    };
  }
  return () => ({ created: contexts.length, lost: contexts.filter((c) => c.lost || c.gl.isContextLost()).length });
}

/** Starts observing; call it first in the worker, before any runtime can open a context. */
export function observeWorker(scope: ObservedScope, canvasProto: CanvasPrototype | null): WorkerObserver {
  const blocked: Record<string, number> = {};
  const served: Record<string, number> = {};
  const unlisted: Record<string, number> = {};
  const violations: { directive: string; blockedURI: string }[] = [];
  scope.addEventListener('securitypolicyviolation', (event) => {
    const e = event as SecurityPolicyViolationEvent;
    violations.push({ directive: e.effectiveDirective || e.violatedDirective, blockedURI: e.blockedURI });
  });
  const webgl = watchWebGl(canvasProto);
  const counter = (counts: Record<string, number>) => (key: string) => {
    counts[key] = (counts[key] ?? 0) + 1;
  };
  return {
    countBlocked: counter(blocked),
    countServed: counter(served),
    countUnlisted: counter(unlisted),
    snapshot: () => ({ blocked: { ...blocked }, served: { ...served }, unlisted: { ...unlisted }, violations: violations.map((v) => ({ ...v })), webgl: webgl() }),
  };
}
