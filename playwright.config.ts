/**
 * Playwright: e2e runs against `vite preview` of a build, so the build-only CSP applies; each fixture suite and the harness
 * pages have a preview of their own (`tests/e2e/server.ts`), and the dev server is started too, because `s1.spec.ts` checks
 * that the worker also boots in dev and the painter check runs there. Build first. One worker: the suites measure timings and
 * memory. A server already on a port is an error unless `HUECUT_E2E_REUSE=1` says it may be reused, so a run never tests a
 * server another run left there.
 */
import { mkdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { APP_URL, DEV_ORIGIN, DEV_PORT, FIXTURE_SUITES, fixtureServer, HARNESS, PREVIEW_OUTDIR, PREVIEW_PORT } from './tests/e2e/server.ts';

const reuse = process.env.HUECUT_E2E_REUSE === '1';
const preview = (port: number, outDir: string) => `npx vite preview --port ${String(port)} --strictPort --outDir ${outDir}`;

export default defineConfig({
  testDir: 'tests/e2e',
  // One folder per port: a run wipes its output folder, so suites running side by side must not share one.
  outputDir: `test-results/${String(PREVIEW_PORT)}`,
  timeout: 300_000,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: { trace: 'off', viewport: { width: 1280, height: 800 } },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
    // The WebGPU path of `s2.spec.ts`, only with `HUECUT_E2E_EDGE=1`: it needs an installed Microsoft Edge with a shader-f16 WebGPU adapter
    // (Playwright's Chromium headless shell offers none), which most machines and CI lack.
    ...(process.env.HUECUT_E2E_EDGE === '1' ? [{ name: 'msedge', testMatch: /s2\.spec\.ts$/, use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 800 } } }] : []),
  ],
  webServer: [
    { command: preview(PREVIEW_PORT, PREVIEW_OUTDIR), url: APP_URL, reuseExistingServer: reuse, timeout: 60_000 },
    // A fixture suite and the harness fill their folder in beforeAll, so these start on an empty one and only the port can say they are up.
    ...[...FIXTURE_SUITES.map(fixtureServer), HARNESS].map(({ PREVIEW_PORT: port, PREVIEW_OUTDIR: outDir }) => {
      mkdirSync(outDir, { recursive: true });
      return { command: preview(port, outDir), port, reuseExistingServer: reuse, timeout: 60_000 };
    }),
    { command: `npx vite --port ${String(DEV_PORT)} --strictPort`, url: `${DEV_ORIGIN}/huecut/`, reuseExistingServer: reuse, timeout: 60_000 },
  ],
});
