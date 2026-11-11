/**
 * The test-only build of the `s1` and `s2` harness pages (`tests/harness/`): the app's own Vite config, CSP included, with these two
 * pages as its only inputs, into the harness server's folder (`server.ts`), never `dist`. s1.spec.ts and s2.spec.ts run it in
 * beforeAll, as the fixture suites build theirs, so `npm run build` and the published site hold no harness.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect } from '@playwright/test';
import { build } from 'vite';
import { HARNESS } from './server.ts';

// The real path, as Vite reports importers (see explore-build.ts).
const app = realpathSync.native(resolve(import.meta.dirname, '..', '..'));
const PAGES = ['s1', 's2'] as const;

/** The URL of one harness page on the harness server. */
export const harnessPage = (page: (typeof PAGES)[number]): string => `${HARNESS.APP_URL}tests/harness/${page}.html`;

/** Builds both pages and checks that the harness server serves this very build. */
export async function buildHarness(): Promise<void> {
  const input = Object.fromEntries(PAGES.map((p) => [`harness-${p}`, join(app, 'tests', 'harness', `${p}.html`)]));
  await build({ root: app, configFile: join(app, 'vite.config.ts'), logLevel: 'warn', build: { outDir: HARNESS.PREVIEW_OUTDIR, emptyOutDir: true, rolldownOptions: { input } } });
  for (const p of PAGES) {
    const served = await (await fetch(harnessPage(p))).text();
    expect(served, `${HARNESS.PREVIEW_ORIGIN} serves ${HARNESS.PREVIEW_OUTDIR}`).toBe(readFileSync(join(app, HARNESS.PREVIEW_OUTDIR, 'tests', 'harness', `${p}.html`), 'utf8'));
  }
}
