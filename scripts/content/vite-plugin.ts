/**
 * Runs the content check inside `vite dev`: once at start and again whenever a file in `content/`
 * changes. Problems go to the dev server's log; the server keeps running, and `content:build` is what refuses them.
 */
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { checkContent, report, type CheckOptions } from './check.ts';

export function contentCheck(options: CheckOptions = {}): Plugin {
  return {
    name: 'huecut-content-check',
    apply: 'serve',
    configureServer(server) {
      const dir = join(server.config.root, 'content');
      const run = () =>
        report(checkContent(dir, options), (line) => {
          if (line.startsWith('ERROR')) server.config.logger.error(line);
          else server.config.logger.info(line);
        });
      run();
      server.watcher.add(dir);
      server.watcher.on('change', (file) => {
        if (file.startsWith(dir) && !file.startsWith(join(dir, 'schema'))) run();
      });
    },
  };
}
