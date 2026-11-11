/**
 * Where an e2e test saves its screenshots: `$HUECUT_SHOTS_DIR/<area>/<project>` when that variable is set, else
 * Playwright's own output folder for the running test (git-ignored). Tests never name a machine path.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';

export function shotsDir(area: string): string {
  const info = test.info();
  const root = process.env.HUECUT_SHOTS_DIR;
  const dir = root ? join(root, area, info.project.name) : info.outputPath('shots');
  mkdirSync(dir, { recursive: true });
  return dir;
}
