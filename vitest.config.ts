/**
 * Vitest: unit tests next to the code (`*.test.ts`) and the engine tests in `tests/engine/`, run in Node. Kept apart from
 * vite.config.ts so the build-only CSP plugin and React never load in unit tests; e2e is Playwright's.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/engine/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    restoreMocks: true,
  },
});
