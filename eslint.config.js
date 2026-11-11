/**
 * ESLint flat config: type-aware TypeScript rules over the four tsconfigs, the binding layer matrix (eslint-plugin-boundaries;
 * docs/architecture.md describes the layers), and the safety and size rules: the CSP, worker URLs, erasable syntax, file size.
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TS_FILES = ['**/*.ts', '**/*.tsx'];
const ZOD_ALLOWED = ['scripts/**', 'tests/**', '**/*.test.ts', '**/*.test.tsx'];
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.json'];

// ---------------------------------------------------------------------------------------------------------------
// Layers and the dependency matrix (binding)
// ---------------------------------------------------------------------------------------------------------------

/**
 * Element types. Matching starts at the file and the first descriptor that matches wins, so the single-file
 * elements come first (`mode: 'full'` is the only way the plugin matches one file as its own element).
 * Unit tests sit next to the code, so every `*.test.ts(x)` is a `tests` element wherever it lives.
 */
const elements = [
  { type: 'tests', pattern: '**/*.test.{ts,tsx}', mode: 'full' },
  { type: 'protocol', pattern: 'src/worker/protocol.ts', mode: 'full' },
  { type: 'worker', pattern: 'src/sw.ts', mode: 'full' },
  { type: 'domain', pattern: 'src/domain', partialMatch: false },
  { type: 'worker', pattern: 'src/worker', partialMatch: false },
  { type: 'machine', pattern: 'src/machine', partialMatch: false },
  { type: 'platform', pattern: 'src/platform', partialMatch: false },
  { type: 'ui', pattern: 'src/ui', partialMatch: false },
  // Reusable feature composition, before `features` so it is never taken for a screen feature.
  { type: 'features-shared', pattern: 'src/features/shared', partialMatch: false },
  // One element per feature folder: imports inside a folder are internal, imports between folders are disallowed.
  { type: 'features', pattern: 'src/features/*', partialMatch: false, capture: ['feature'] },
  { type: 'app', pattern: 'src/app', partialMatch: false },
  { type: 'generated', pattern: 'src/generated', partialMatch: false },
  { type: 'strings', pattern: 'src/strings', partialMatch: false },
  { type: 'scripts', pattern: 'scripts', partialMatch: false },
  { type: 'tests', pattern: 'tests', partialMatch: false },
];

/** @param {string} type */
const to = (type) => ({ to: { element: { type } } });
/** `worker/protocol.ts` is types only: every edge to it must be `import type`, so it is never a runtime edge. */
const protocolTypes = { ...to('protocol'), dependency: { kind: 'type' } };
/** Features may read the machine only through its two public files. */
const machinePublic = {
  to: { element: { type: 'machine', fileInternalPath: ['consult.types.ts', 'consult.selectors.ts'] } },
};
/**
 * @param {string} type
 * @param {object[]} allow
 */
const from = (type, ...allow) => ({ from: { element: { type } }, allow });

/** The matrix row by row. `domain`, `ui`, `generated` and `strings` have no row: they import nothing outside. */
const policies = [
  from('worker', to('domain'), protocolTypes),
  from('protocol', { ...to('domain'), dependency: { kind: 'type' } }),
  from('machine', to('domain'), protocolTypes),
  from('platform', to('domain'), protocolTypes, to('generated')),
  from('features', to('domain'), protocolTypes, machinePublic, to('platform'), to('ui'), to('strings'), to('features-shared')),
  from('features-shared', to('domain'), protocolTypes, machinePublic, to('platform'), to('ui'), to('strings')),
  from('app', protocolTypes, ...['domain', 'machine', 'platform', 'ui', 'features', 'generated', 'strings'].map(to)),
  from('scripts', to('domain'), to('strings')),
  // Tests import every element type; protocol, like everywhere, as types only.
  from('tests', protocolTypes, ...[...new Set(elements.map((e) => e.type))].filter((t) => t !== 'protocol').map(to)),
];

// ---------------------------------------------------------------------------------------------------------------
// Banned syntax: what the CSP, the worker's blob bootstrap and Node's type stripping cannot take
// ---------------------------------------------------------------------------------------------------------------

const HTML_MESSAGE = 'No HTML strings: build nodes or JSX. The CSP requires Trusted Types.';
const EVAL_MESSAGE = 'No eval or Function: the CSP allows only wasm-unsafe-eval.';

const bannedSyntax = [
  { selector: 'MemberExpression[property.name=/^(inner|outer)HTML$/]', message: HTML_MESSAGE },
  { selector: 'MemberExpression[property.value=/^(inner|outer)HTML$/]', message: HTML_MESSAGE },
  { selector: "MemberExpression[property.name='insertAdjacentHTML']", message: HTML_MESSAGE },
  { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: HTML_MESSAGE },
  {
    selector: "CallExpression[callee.name='eval'], CallExpression[callee.property.name='eval']",
    message: EVAL_MESSAGE,
  },
  {
    selector:
      ":matches(CallExpression, NewExpression):matches([callee.name='Function'], [callee.property.name='Function'])",
    message: EVAL_MESSAGE,
  },
  { selector: 'TSEnumDeclaration', message: 'No enums: use an `as const` union (erasable syntax only).' },
];

const WORKER_URL_MESSAGE =
  'Inside the worker every URL comes from worker/urls.ts, built from import.meta.url or self.location.origin plus ' +
  'import.meta.env.BASE_URL: under the blob: bootstrap a relative URL or location.href points at the blob.';
/** A string with no scheme (`./x`, `../x`, `/x`, `x/y`) is relative. Template literals count by their first part. */
const NO_SCHEME = '/^(?![a-zA-Z][a-zA-Z0-9+.-]*:)/';
const NO_SCHEME_NON_EMPTY = '/^(?![a-zA-Z][a-zA-Z0-9+.-]*:)./';
/** For import() a bare package name is a module specifier, not a URL, so only path-like strings count. */
const PATH_LIKE = '/^[.]{0,2}\\//';

/** @param {string} callee esquery selector of the call */
const relativeFirstArgument = (callee) => [
  { selector: `${callee}[arguments.0.type='Literal'][arguments.0.value=${NO_SCHEME}]`, message: WORKER_URL_MESSAGE },
  {
    selector: `${callee}[arguments.0.type='TemplateLiteral'][arguments.0.quasis.0.value.raw=${NO_SCHEME_NON_EMPTY}]`,
    message: WORKER_URL_MESSAGE,
  },
];

/** `location.href` is the blob: URL under the bootstrap, everywhere in the worker, urls.ts included. */
const workerLocation = [
  { selector: "MemberExpression[object.name='location'][property.name='href']", message: WORKER_URL_MESSAGE },
  { selector: "MemberExpression[object.property.name='location'][property.name='href']", message: WORKER_URL_MESSAGE },
];

/**
 * Relative URLs built at run time. A literal `import('./x.ts')` is resolved by the bundler against the worker
 * chunk's own http(s) URL, so it is allowed; a computed (template) import() is not. `worker/urls.ts` is the one
 * file that builds URLs, from an absolute base, so it is exempt from the URL and fetch selectors.
 */
const workerSyntax = [
  ...relativeFirstArgument("NewExpression[callee.name='URL']"),
  ...relativeFirstArgument("CallExpression:matches([callee.name='fetch'], [callee.property.name='fetch'])"),
  {
    selector: `ImportExpression[source.type='TemplateLiteral'][source.quasis.0.value.raw=${PATH_LIKE}]`,
    message: WORKER_URL_MESSAGE,
  },
  ...workerLocation,
];

const ZOD_MESSAGE = 'Zod is for scripts/ and tests only; the app reads content already validated at build.';

export default defineConfig([
  globalIgnores([
    'dist/',
    'dist-*/',
    'public/models/',
    'src/generated/',
    'node_modules/',
    'content/schema/',
    'coverage/',
    'test-results/',
    'playwright-report/',
    'blob-report/',
  ]),

  js.configs.recommended,

  {
    name: 'huecut/typescript',
    files: TS_FILES,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        // The project service finds only files named tsconfig.json, and there is none, so the four configs are
        // listed. A file in several programs takes the first: domain/ is checked without the DOM, as tsc does.
        project: ['./tsconfig.domain.json', './tsconfig.worker.json', './tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
    },
  },

  { name: 'huecut/react-hooks', files: ['src/**/*.{ts,tsx}', 'tests/harness/**/*.{ts,tsx}'], extends: [reactHooks.configs.flat.recommended] },
  { name: 'huecut/jsx-a11y', files: ['**/*.tsx'], extends: [jsxA11y.flatConfigs.recommended] },

  {
    name: 'huecut/all-files',
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': elements,
      // Silences the one deprecation notice for `mode: 'full'`, which 7.4.2 still needs for single-file elements.
      'boundaries/legacy-warnings': false,
      'import/resolver': { node: { extensions: RESOLVE_EXTENSIONS } },
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies }],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'zod', message: ZOD_MESSAGE }], patterns: [{ group: ['zod/*'], message: ZOD_MESSAGE }] },
      ],
      'no-restricted-syntax': ['error', ...bannedSyntax],
      // Every rule here is an error: a warning never fails a check, so warnings would only pile up (`npm run lint` fails on any).
      'max-lines': ['error', 400],
      'max-lines-per-function': ['error', 50],
      complexity: ['error', 12],
    },
  },

  { name: 'huecut/zod-allowed', files: ZOD_ALLOWED, rules: { 'no-restricted-imports': 'off' } },

  {
    name: 'huecut/worker-urls',
    files: ['src/worker/**/*.ts'],
    ignores: ['src/worker/urls.ts'],
    rules: { 'no-restricted-syntax': ['error', ...bannedSyntax, ...workerSyntax] },
  },
  {
    name: 'huecut/worker-url-builder',
    files: ['src/worker/urls.ts'],
    rules: { 'no-restricted-syntax': ['error', ...bannedSyntax, ...workerLocation] },
  },

  {
    name: 'huecut/domain-no-cycle',
    files: ['src/domain/**/*.ts'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/extensions': ['.ts', '.tsx'],
      'import-x/resolver-next': [createNodeResolver({ extensions: RESOLVE_EXTENSIONS })],
    },
    rules: { 'import-x/no-cycle': 'error' },
  },

  { name: 'huecut/node-scripts', files: ['*.js'], languageOptions: { globals: globals.node } },
]);
