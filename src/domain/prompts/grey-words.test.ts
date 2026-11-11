/**
 * The colour looks' own words about grey, on the real content: a look that keeps, blends or tints the person's grey never invents
 * how much grey there is and never lays grey-white over all of their hair. Checked in single, paired and grid prompts, at a dark and a
 * light level, at every grey answer and none, and for dark hair whose grey is to be embraced. Each prompt must carry the look's words.
 */
import { expect, it } from 'vitest';
import type { ColourLook } from '../content/types.ts';
import { PROMPT_KINDS } from '../content/values.ts';
import type { Facts } from '../facts/registry.ts';
import { EN } from '../render-model/copy.ts';
import { buildPromptPack, type IdeaLook, type PromptTemplates } from './build.ts';
import { parseTemplate } from './template.ts';

const node = (globalThis as unknown as {
  process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string } };
}).process;
const read = (path: string): string => node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/content/${path}`, 'utf8');
const TEMPLATES: PromptTemplates = Object.fromEntries(PROMPT_KINDS.map((kind) => {
  const r = parseTemplate(read(`prompts/${kind}.md`));
  if (!r.ok) throw new Error(`${kind}: ${r.error.detail}`);
  return [kind, r.value];
}));
const LOOKS = JSON.parse(read('colours/looks.json')) as ColourLook[];
const CUT: IdeaLook = { id: 'mid-drop-fade-textured-crop', kind: 'cut', name: 'Mid drop fade with textured crop', prompt_spec: 'a mid drop fade with a short textured crop' };

/** An invented share of grey, and grey-white laid over all of the hair (lower case, hyphens as spaces). */
const FIXED_SHARE = /\b(?:a|one|two|three) (?:third|quarter)s?\b|\bhalf\b|\b\d+(?:\.\d+)? ?(?:%|per ?cent)/;
const BLANKET = /\bgrey and white hair\b|\bgrey white\b|\bsilver blend\b/;
/** Looks that keep, blend or tint the person's grey; a look that covers it or takes the hair to silver names its own result. */
const KEEPS_GREY: ReadonlySet<string> = new Set(['shows', 'blends', 'tints']);

const answered = <const K extends keyof Facts, const V>(key: K, value: V) => ({ key, value, confidence: 'high', source: 'answered' }) as const;
interface Case { readonly level: number; readonly grey: number | null; readonly embrace?: true }
/** A dark and a light level at none, few, some, a fair amount, mostly, almost all, all and unknown grey; and dark hair embracing its grey. */
const CASES: readonly Case[] = [
  ...[3, 8].flatMap((level) => [0, 5, 20, 40, 62.5, 87.5, 100, null].map((grey) => ({ level, grey }))),
  { level: 3, grey: 20, embrace: true }, { level: 3, grey: 40, embrace: true },
];
const factsOf = (c: Case): Facts => ({
  'hair.chemical_history': answered('hair.chemical_history', ['none']), 'colour.natural_level': answered('colour.natural_level', c.level),
  ...(c.grey === null ? {} : { 'colour.grey_percent': answered('colour.grey_percent', c.grey) }),
  ...(c.embrace ? { 'colour.grey_goal': answered('colour.grey_goal', 'embrace') } : {}),
});

/** The look as the person's prompt gives it: its words for the colour it was pictured on become theirs. */
const ideaOf = (l: ColourLook, level: number): IdeaLook =>
  ({ id: l.id, kind: 'colour', name: l.name, prompt_spec: l.prompt_spec, ...(l.base.on_words ? { ownBase: { level, words: l.base.on_words } } : {}) });
const wordsOf = (l: ColourLook, level: number): string => (l.base.on_words ?? []).reduce((spec, w) => spec.split(w).join(EN.prompts.ownBase(level)), l.prompt_spec);

/** What each prompt of each look says wrongly about the person's grey, or that it left the look's words out. */
function greyProblems(looks: readonly ColourLook[]): string[] {
  return looks.flatMap((l) => CASES.flatMap((c) => {
    const look = ideaOf(l, c.level);
    const pack = buildPromptPack(TEMPLATES, { ideas: [look], pair: { cut: CUT, colour: look }, pool: [look], facts: factsOf(c), gridMaxTiles: 1 }, { referral: null });
    const at = `${l.id} (level ${String(c.level)}, grey ${c.grey === null ? 'not known' : String(c.grey)}${c.embrace ? ', embrace' : ''})`;
    return ([['single', pack.looks[0]?.prompt], ['paired', pack.pair], ['grid', pack.grids[0]?.prompt]] as const).flatMap(([kind, b]) => {
      if (!b?.ok) return [`${at}: no ${kind} prompt`];
      if (!b.value.text.includes(wordsOf(l, c.level))) return [`${at}: the ${kind} prompt leaves out the look's words`];
      const said = b.value.text.toLowerCase().replaceAll('-', ' ');
      return [
        ...(FIXED_SHARE.test(said) ? [`${at}: the ${kind} prompt invents a share of grey`] : []),
        ...(KEEPS_GREY.has(l.grey) && BLANKET.test(said) ? [`${at}: the ${kind} prompt lays grey-white over all the hair`] : []),
      ];
    });
  }));
}

it('no look invents a share of grey or lays grey-white over hair whose grey it keeps, in any prompt, at any level or grey answer', () => {
  expect(LOOKS).toHaveLength(68);
  expect(greyProblems(LOOKS)).toEqual([]);
}, 60_000);

it('plant: the fixed third and the blanket grey-white restored are caught in every prompt', () => {
  const restored = LOOKS.flatMap((l) => {
    if (l.id === 'grey-blend-blonde') return [{ ...l, prompt_spec: l.prompt_spec.replace('my own natural grey, if any, in its existing amount and distribution', 'about a third natural grey, most at the front hairline and the parting') }];
    if (l.id === 'natural-silver-gloss') return [{ ...l, prompt_spec: 'natural grey and white hair all over, roots, mids and ends a clean silvery grey-white with a cool shine, no yellowing, soft and glossy' }];
    return [];
  });
  const found = greyProblems(restored);
  expect(found).toHaveLength(2 * CASES.length * 3);
  expect(found).toContain('grey-blend-blonde (level 3, grey 40, embrace): the paired prompt invents a share of grey');
  expect(found).toContain('natural-silver-gloss (level 8, grey not known): the grid prompt lays grey-white over all the hair');
});
