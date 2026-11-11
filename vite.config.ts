/**
 * Vite config. The Content-Security-Policy is injected at build only, because `vite dev` injects inline styles the
 * policy would block; preview, e2e and the deployed site run under it. The worker builds as an ES module so
 * `import.meta.url` stays a real URL under the blob bootstrap.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { contentCheck } from './scripts/content/vite-plugin.ts';
import { FIGURE_SIZES, FIRST_LOOK, srcSetUnder } from './src/features/home/looks.ts';

/** The site's one Content-Security-Policy. GitHub Pages cannot send headers, so it is a meta tag. */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "style-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
  'trusted-types worker-bootstrap',
].join('; ');

/** Adds the CSP meta tag as the first element of <head> in the built index.html only. */
function buildOnlyCsp(): Plugin {
  return {
    name: 'huecut-build-only-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`),
    },
  };
}

/**
 * The built index.html's two preloads: the text font's Latin file (the only font preloaded), and Home's first picture, both
 * of which the browser would otherwise find only after React renders. No `href`: a browser that cannot read `imagesrcset` fetches nothing.
 */
function preloads(): Plugin {
  let base = '/';
  return {
    name: 'huecut-preloads',
    apply: 'build',
    configResolved: (config) => {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler: (_html, ctx) => {
        const file = Object.keys(ctx.bundle ?? {}).find((name) => /figtree-latin-wght-normal-[\w-]+\.woff2$/.test(name));
        if (ctx.path !== '/index.html' || file === undefined) return [];
        return [
          { tag: 'link', attrs: { rel: 'preload', href: base + file, as: 'font', type: 'font/woff2', crossorigin: true }, injectTo: 'head' },
          { tag: 'link', attrs: { rel: 'preload', as: 'image', type: 'image/avif', imagesrcset: srcSetUnder(base, FIRST_LOOK), imagesizes: FIGURE_SIZES, fetchpriority: 'high' }, injectTo: 'head' },
        ];
      },
    },
  };
}

/**
 * ONNX Runtime's bundled build names its WASM in `new URL('ort-wasm-…wasm', import.meta.url)` fallbacks, which
 * would make Vite emit a second, unverified 26.9 MB copy into assets/. The worker always sets `wasmPaths` to the
 * registry's verified file, so those fallbacks never run; marking them `@vite-ignore` keeps the copy out.
 */
function ortWasmNotEmitted(): Plugin {
  return {
    name: 'huecut-ort-wasm-not-emitted',
    enforce: 'pre',
    transform: (code, id) =>
      /[\\/]onnxruntime-web[\\/]dist[\\/]/.test(id) ? code.replaceAll(/new URL\(("ort-wasm-[\w.-]+\.wasm"),\s*import\.meta\.url\)/g, 'new URL($1, /* @vite-ignore */ import.meta.url)') : null,
  };
}

/**
 * The service worker: `src/sw.ts` built to `sw.js` at the site root, because a worker controls only
 * its own folder and GitHub Pages cannot send `Service-Worker-Allowed`. Once the files are written, the placeholders get
 * the shell's file list, the Latvian chunks' names and a build id from all those files' bytes, so any change to them makes a new worker.
 */
function serviceWorker(): Plugin {
  let root = '';
  let outDir = '';
  return {
    name: 'huecut-service-worker',
    apply: 'build',
    configResolved: (config) => {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    buildStart() {
      this.emitFile({ type: 'chunk', id: resolve(root, 'src/sw.ts'), fileName: 'sw.js' });
    },
    writeBundle: {
      order: 'post',
      handler: (_options, bundle) => {
        // Depth and the 3D view are computer-only extras: phones would precache them for nothing, and `shell()` falls back to the network.
        // The licence texts are read when asked for, so they stay out of the shell too.
        const files = [...Object.keys(bundle).filter((name) => name !== 'sw.js' && !/transformers\.web|viewer3d|^licences\//.test(name)), 'manifest.webmanifest'].sort();
        // Only a person who chose Latvian keeps its two chunks, so they stay out of the shell every visit downloads.
        const latvian = files.filter((name) => /^assets\/lv-(?:strings|content)-[\w-]+\.js$/.test(name));
        // The app's own build must carry both, or Latvian would load half; a build of the test harness pages alone has neither.
        if ('index.html' in bundle && latvian.length !== 2) throw new Error(`the build has ${String(latvian.length)} Latvian chunks, not 2`);
        const hash = createHash('sha256');
        for (const name of files) hash.update(readFileSync(join(outDir, name)));
        const worker = join(outDir, 'sw.js');
        const source = readFileSync(worker, 'utf8');
        const code = source
          .replaceAll('__HUECUT_BUILD__', hash.digest('hex').slice(0, 12))
          .replace(/\[\s*["'`]__HUECUT_SHELL__["'`]\s*\]/, JSON.stringify(files.filter((name) => !latvian.includes(name))))
          .replace(/\[\s*["'`]__HUECUT_LATVIAN__["'`]\s*\]/, JSON.stringify(latvian));
        if (code.includes('__HUECUT')) throw new Error('sw.js still has a build placeholder');
        writeFileSync(worker, code);
      },
    },
  };
}

/** The app's licence and every third-party licence travel with the site, as their licences ask, as plain text Help links to. */
function licenceFiles(): Plugin {
  let root = '';
  return {
    name: 'huecut-licence-files',
    apply: 'build',
    configResolved: (config) => {
      root = config.root;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'licences/LICENSE.txt', source: readFileSync(resolve(root, 'LICENSE'), 'utf8') });
      this.emitFile({ type: 'asset', fileName: 'licences/THIRD_PARTY_LICENSES.txt', source: readFileSync(resolve(root, 'THIRD_PARTY_LICENSES.md'), 'utf8') });
    },
  };
}

export default defineConfig({
  base: '/huecut/',
  plugins: [react(), buildOnlyCsp(), preloads(), serviceWorker(), licenceFiles(), contentCheck()],
  worker: { format: 'es', plugins: () => [ortWasmNotEmitted()] },
  build: {
    target: 'es2023',
    sourcemap: false,
  },
  // The worker imports both runtimes lazily; found late, `vite dev` would re-optimise and reload the page mid-run.
  optimizeDeps: { include: ['@mediapipe/tasks-vision', '@mediapipe/tasks-vision/vision_wasm_module_internal.js', '@huggingface/transformers'] },
  // 127.0.0.1, not `localhost`: Vite binds `localhost` to the first address the system gives (`::1` on Linux), while Node's
  // fetch there asks only for configured addresses and gets 127.0.0.1, so the e2e specs' own requests were refused.
  // Browsers and fetch reach `localhost` on 127.0.0.1 everywhere, so the addresses in the docs and specs stay.
  preview: { host: '127.0.0.1', port: 4180, strictPort: true },
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
});
