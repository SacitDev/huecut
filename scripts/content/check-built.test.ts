/**
 * The built-prompt check on a planted copy of the fixture set: a look that keeps the person's own base builds with that base in
 * its prompt, as a list builds it, so a spec that fits only without the base fails the check.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { ColourLook } from '../../src/domain/content/types.ts';
import { buildTryOn } from '../../src/domain/prompts/build.ts';
import { parseTemplate } from '../../src/domain/prompts/template.ts';
import { checkContent, type CheckResult } from './check.ts';

const FIXTURE = fileURLToPath(new URL('../../tests/fixtures/content/', import.meta.url));
const REAL_PROMPTS = fileURLToPath(new URL('../../content/prompts/', import.meta.url));
/** The templates the fixture leaves out, from the real content, so the check runs every builder. */
const TEMPLATES = ['try_on_cut', 'try_on_colour', 'try_on_both', 'try_on_beard', 'final_card'];

/** Checks a copy of the fixture with its colour looks changed by `edit`; the fixture itself is never changed. */
function planted(edit: (looks: readonly ColourLook[]) => ColourLook[]): CheckResult {
  const dir = mkdtempSync(join(tmpdir(), 'huecut-check-built-'));
  try {
    cpSync(FIXTURE, dir, { recursive: true });
    for (const name of TEMPLATES) writeFileSync(join(dir, 'prompts', `${name}.md`), readFileSync(join(REAL_PROMPTS, `${name}.md`), 'utf8'));
    const file = join(dir, 'colours', 'looks.json');
    writeFileSync(file, JSON.stringify(edit(JSON.parse(readFileSync(file, 'utf8')) as ColourLook[]), null, 2));
    return checkContent(dir, { complete: false });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

it("plant: a look that keeps the person's own base is checked with that base in its prompt, as a list builds it", () => {
  const template = parseTemplate(readFileSync(join(REAL_PROMPTS, 'try_on_colour.md'), 'utf8'));
  if (!template.ok) throw new Error('try_on_colour does not parse');
  const t = template.value;
  /** A spec with the look's base words that makes its own prompt exactly its budget when no base is said. */
  const atBudget = (look: ColourLook): string => {
    const words = (look.base.on_words ?? []).join(' ');
    const one = buildTryOn({ try_on_colour: t }, { id: 'probe', kind: 'colour', name: look.name, prompt_spec: `${words} copper`.trim() }, { referral: null });
    if (!one.ok) throw new Error(one.error);
    return [words, ...Array.from({ length: t.word_budget - one.value.words + 1 }, () => 'copper')].join(' ').trim();
  };
  let bases: string[] = [];
  const r = planted((looks) => {
    bases = looks.map((l) => l.base.technique);
    return looks.map((l) => ({ ...l, prompt_spec: atBudget(l) }));
  });
  const refused = (i: number): boolean =>
    r.problems.some((p) => p.level === 'error' && p.file === 'colours/looks.json' && p.path === `$[${String(i)}].prompt_spec` && p.message.includes('prompt_over_budget'));
  // The first look applies its base and fits at its budget; the second keeps the person's own, and their colour's words take it over.
  expect(bases).toEqual(['all_over', 'none']);
  expect([refused(0), refused(1)]).toEqual([false, true]);
});

it("plant: a look that keeps the person's own colour marks the words that picture its design base, each once", () => {
  const errorsAt = (r: CheckResult, path: string): string[] => r.problems.filter((p) => p.level === 'error' && p.file === 'colours/looks.json' && p.path === path).map((p) => p.message);
  const unmarked = planted((looks) => looks.map((l, i) => (i === 1 ? { ...l, base: { ...l.base, on_words: [] } } : l)));
  expect(errorsAt(unmarked, '$[1].base.on_words')).toEqual([expect.stringContaining('mark the words of its prompt_spec that picture "copper-auburn"')]);
  const missing = planted((looks) => looks.map((l, i) => (i === 1 ? { ...l, base: { ...l.base, on_words: ['a dark blonde base'] } } : l)));
  expect(errorsAt(missing, '$[1].base.on_words[0]')).toEqual(['"a dark blonde base" is not in the prompt_spec of copper-balayage-prelightened exactly once']);
  expect(errorsAt(planted((looks) => [...looks]), '$[1].base.on_words')).toEqual([]);
});
