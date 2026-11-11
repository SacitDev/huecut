/** The MediaPipe runner's start-up: which files it asks the registry for, and the runtime its tasks are created with. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import manifest from '../../../models.manifest.json';
import { ok, type Result } from '../../domain/result.ts';
import type { AnalysisError } from '../protocol.ts';

const FACTORY = vi.hoisted(() => () => 'the bundled loader');
const createFace = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
vi.mock('@mediapipe/tasks-vision', () => ({ FaceLandmarker: { createFromOptions: createFace } }));
vi.mock('@mediapipe/tasks-vision/vision_wasm_module_internal.js', () => ({ default: FACTORY }));

const codeOf = (r: Result<unknown, AnalysisError>): string => (r.ok ? 'ok' : r.error.code);
const signal = new AbortController().signal;

function deps() {
  const asked: string[] = [];
  return {
    asked,
    deps: {
      registry: {
        entry: () => undefined,
        bytes: (path: string) => {
          asked.push(path);
          return Promise.resolve(ok(new Uint8Array(4)));
        },
      },
      logicalUrl: (path: string) => `https://example.test/models/${path}`,
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('OffscreenCanvas', Object);
  vi.stubGlobal('self', globalThis);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('@mediapipe/tasks-vision');
  vi.resetModules();
});

it('runs the loader bundled with this build and asks the registry for data files only', async () => {
  const { createMediaPipe } = await import('./mediapipe.ts');
  const { deps: d, asked } = deps();
  const r = await createMediaPipe(d).load('face', signal, () => undefined);
  expect(codeOf(r)).toBe('ok');
  expect(asked).toEqual(['mediapipe/vision_wasm_module_internal.wasm', 'mediapipe/face_landmarker.task']);
  expect((globalThis as { ModuleFactory?: unknown }).ModuleFactory).toBe(FACTORY);
});

it('lists no script in the model manifest, so nothing is imported from the model files', () => {
  expect(manifest.files.map((f) => f.path).filter((p) => /\.m?js$/.test(p))).toEqual([]);
});

it('says boot_failed, and offers a reload, when a runtime chunk will not load', async () => {
  vi.doMock('@mediapipe/tasks-vision', () => {
    throw new TypeError('Failed to fetch dynamically imported module');
  });
  vi.resetModules();
  const { createMediaPipe } = await import('./mediapipe.ts');
  const r = await createMediaPipe(deps().deps).load('face', signal, () => undefined);
  expect(codeOf(r)).toBe('boot_failed');
});
