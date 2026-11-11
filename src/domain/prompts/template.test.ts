/**
 * Template tests: the real `content/prompts/*.md` files parse with their kind's budget, placeholders fill or are
 * refused, and the keep-list reads in its fixed order.
 */
import { expect, it } from 'vitest';
import { PROMPT_BUDGETS, PROMPT_KINDS, type PromptKind } from '../content/values.ts';
import type { PromptTemplate } from '../content/types.ts';
import { countWords, fillTemplate, keepListText, parseTemplate } from './template.ts';

/** Node's fs through `process.getBuiltinModule`: the domain tsconfig has no Node types, and the domain uses none. */
const node = (globalThis as unknown as {
  process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } };
}).process;
const readTemplate = (kind: PromptKind): string => node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/content/prompts/${kind}.md`, 'utf8');

it('parses every prompt template in the content, with its own kind, its budget and its fixed words under it', () => {
  for (const kind of PROMPT_KINDS) {
    const parsed = parseTemplate(readTemplate(kind));
    if (!parsed.ok) throw new Error(`${kind}: ${parsed.error.code} ${parsed.error.detail}`);
    const t = parsed.value;
    expect(t.template).toBe(kind);
    expect(t.word_budget).toBeLessThanOrEqual(PROMPT_BUDGETS[kind]);
    expect(t.body.startsWith('---')).toBe(false);
    expect(countWords(t.body.replace(/\{\{[^{}]*\}\}/g, ' '))).toBeLessThan(t.word_budget);
    expect(t.keep_list).toBe(t.body.includes('{{keep_list}}'));
  }
});

it('reads header values as the content build does: booleans, numbers and lists', () => {
  const r = parseTemplate('---\ntemplate: quick_grid\nkind: image\nword_budget: 150\nkeep_list: true\nvariables: [count, rows]\n---\nA {{count}} {{rows}} {{keep_list}}\n');
  expect(r).toEqual({ ok: true, value: { template: 'quick_grid', kind: 'image', word_budget: 150, keep_list: true, variables: ['count', 'rows'], body: 'A {{count}} {{rows}} {{keep_list}}' } });
});

it('refuses a missing header, an unreadable line, an unknown kind or key, and a budget above the kind', () => {
  const head = (lines: string) => `---\n${lines}\n---\nBody`;
  expect(parseTemplate('No header').ok).toBe(false);
  const code = (src: string) => { const r = parseTemplate(src); return r.ok ? null : `${r.error.code}:${r.error.detail}`; };
  expect(code(head('template quick_grid'))).toBe('bad_header_line:template quick_grid');
  expect(code(head('template: try_on_hat\nkind: image\nword_budget: 10\nkeep_list: false\nvariables: []'))).toBe('bad_header:template');
  expect(code(head('template: repair\nkind: image\nword_budget: 41\nkeep_list: false\nvariables: []'))).toBe('bad_header:word_budget');
  expect(code(head('template: repair\nkind: image\nword_budget: 40\nkeep_list: false\nvariables: []\ncolour: red'))).toBe('bad_header:colour');
  expect(code(head('template: repair\nkind: video\nword_budget: 40\nkeep_list: false\nvariables: []'))).toBe('bad_header:kind');
});

const T: PromptTemplate = { template: 'try_on_cut', kind: 'image', word_budget: 150, keep_list: true, variables: ['look_name', 'prompt_spec'], body: 'Cut {{look_name}}, that is {{ prompt_spec }}. {{keep_list}}' };

it('fills placeholders, including a spaced name, and refuses a blank value or a name the header does not list', () => {
  expect(fillTemplate(T, { look_name: 'Bob', prompt_spec: 'a chin bob', keep_list: 'Keep it.' })).toEqual({ ok: true, value: 'Cut Bob, that is a chin bob. Keep it.' });
  expect(fillTemplate(T, { look_name: 'Bob', prompt_spec: '  ', keep_list: 'Keep it.' })).toEqual({ ok: false, error: { code: 'missing_value', name: 'prompt_spec' } });
  expect(fillTemplate({ ...T, keep_list: false }, { look_name: 'Bob', prompt_spec: 'x', keep_list: 'Keep it.' })).toEqual({ ok: false, error: { code: 'unknown_placeholder', name: 'keep_list' } });
});

it('writes the keep-list, and leaves the beard out only when asked', () => {
  expect(keepListText()).toBe('Keep my face, skin tone, eye colour, hairline, hair density, curl pattern, glasses, beard and background exactly as in my photo.');
  expect(keepListText({ beard: false })).toBe('Keep my face, skin tone, eye colour, hairline, hair density, curl pattern, glasses and background exactly as in my photo.');
});

it('counts words as runs of non-space characters', () => {
  expect(countWords('  Mid drop fade (mid-drop-fade);\n\nnext  ')).toBe(5);
  expect(countWords('')).toBe(0);
});
