/**
 * The servers the specs talk to, chosen here and nowhere else. The main preview, port `HUECUT_E2E_PORT` (default 4180)
 * serving the build in `HUECUT_E2E_OUTDIR` (default `dist`), has the real content; each fixture suite and the test harness
 * pages build into their own folder on their own port beside it, and the dev server sits 1000 above the main port, so runs
 * on different ports share no server.
 */
import { basename } from 'node:path';

const BASE_PORT = Number(process.env.HUECUT_E2E_PORT ?? 4180);
const BASE_OUTDIR = process.env.HUECUT_E2E_OUTDIR ?? 'dist';

/** One preview server: its port, its build folder (relative to the app root), its origin and the app on it (base `/huecut/`). */
const serverAt = (port: number, outDir: string) => ({
  PREVIEW_PORT: port,
  PREVIEW_OUTDIR: outDir,
  PREVIEW_ORIGIN: `http://localhost:${String(port)}`,
  APP_URL: `http://localhost:${String(port)}/huecut/`,
});

/** The main preview server, with the real content. */
export const { PREVIEW_PORT, PREVIEW_OUTDIR, PREVIEW_ORIGIN, APP_URL } = serverAt(BASE_PORT, BASE_OUTDIR);
/** The dev server (no CSP): the dev bar of `s1.spec.ts` and the painter check run on it. It follows the main port: a fixed port was borrowed by a run beside it. */
export const DEV_PORT = BASE_PORT + 1000;
/** The dev server's origin. */
export const DEV_ORIGIN = `http://localhost:${String(DEV_PORT)}`;

/** The specs that build fixture content before they run; each file `<suite>.spec.ts` gets a server of its own. */
export const FIXTURE_SUITES = ['explore', 'extras', 'ideas', 'saved-help', 'try-on'] as const;
type FixtureSuite = (typeof FIXTURE_SUITES)[number];

/** Keeps the fixture ports clear of 4190, which `fetch` refuses (WHATWG bad ports), from the default base port up. */
const FIXTURE_PORT_OFFSET = 11;

/** The server of one fixture suite: the build folder is ignored by git, as `dist-*`. */
export const fixtureServer = (suite: FixtureSuite) =>
  serverAt(BASE_PORT + FIXTURE_PORT_OFFSET + FIXTURE_SUITES.indexOf(suite), `${BASE_OUTDIR}-${suite}`);

/** The `s1` and `s2` harness pages (`harness-build.ts`), built for the e2e only, on the port after the fixture suites'. */
export const HARNESS = serverAt(BASE_PORT + FIXTURE_PORT_OFFSET + FIXTURE_SUITES.length, `${BASE_OUTDIR}-harness`);

/** The origin of the server a spec file talks to: what the guard calls the site's own. */
export function originOfSpec(specFile: string): string {
  const suite = FIXTURE_SUITES.find((s) => basename(specFile) === `${s}.spec.ts`);
  if (suite) return fixtureServer(suite).PREVIEW_ORIGIN;
  return basename(specFile) === 'painter.spec.ts' ? DEV_ORIGIN : PREVIEW_ORIGIN;
}
