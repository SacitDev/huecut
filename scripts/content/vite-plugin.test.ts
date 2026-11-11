/** The content check runs when the dev server starts, writing to the server's log. */
import { fileURLToPath } from 'node:url';
import { createServer, type Logger } from 'vite';
import { expect, it } from 'vitest';
import { contentCheck } from './vite-plugin.ts';

it('runs the check in vite dev only and logs its counts and errors', async () => {
  expect(contentCheck().apply).toBe('serve');
  const lines: { info: string[]; error: string[] } = { info: [], error: [] };
  const logger: Logger = {
    hasWarned: false,
    info: (m) => void lines.info.push(m),
    warn: () => undefined,
    warnOnce: () => undefined,
    error: (m) => void lines.error.push(m),
    clearScreen: () => undefined,
    hasErrorLogged: () => false,
  };
  // The fixture folder holds `content/`, as the app folder does; complete mode makes the unproduced facts errors.
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../tests/fixtures/', import.meta.url)),
    customLogger: logger,
    plugins: [contentCheck()],
    server: { watch: null },
  });
  await server.close();
  expect(lines.info).toContain('haircuts/crop.json: 1 cut');
  expect(lines.error).toContain('ERROR questions.json $: nothing produces hair.cowlick_nape (no question, measurement band or derivation)');
  expect(lines.info.at(-1)).toMatch(/^content check: \d+ errors, \d+ warnings$/);
});
