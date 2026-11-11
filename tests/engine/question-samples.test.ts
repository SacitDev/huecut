/** The samples on the answers: which questions show a swatch or a picture on every answer, which answers keep their words only, and which sample each shows. */
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { QuestionOption, QuestionsFile } from '../../src/domain/content/types.ts';

const file = JSON.parse(readFileSync(new URL('../../content/questions.json', import.meta.url), 'utf8')) as QuestionsFile;

/**
 * Every question whose answers a swatch or a picture makes clearer, with the answers left to their words: "Not sure" and the like
 * (value null) always, and these by label. Every other question keeps words only.
 */
const SAMPLED: Readonly<Record<string, readonly string[]>> = {
  'colour-natural-level': [], 'colour-current-level-lengths': [], 'colour-current-tone': [], 'grey-amount': [], 'colour-grey-goal': [],
  'colour-grey-pattern': [], 'look-skin-depth': [], 'look-undertone': [], 'look-eye-colour': ['Other or it varies'], 'pref-colour-direction': [],
  'colour-wanted': [], 'hair-texture': ['A mix'], 'hair-density': [], 'hair-strand': [], 'hair-current-length': [], 'hair-resting-length': [],
  'taste-cuts': [], 'pref-fringe': [], 'pref-top-length': [], 'beard-style': [], 'beard-density': [], 'beard-texture': [], 'head-occiput': [],
  'head-crown-shape': [], 'hair-crown-whorl': [], 'hair-part-side': [], 'hair-hairline-shape': [], 'hair-recession-stage': [],
  'hair-thinning-stage': [], 'hair-thinning-zone': ['No'], 'look-glasses-frame': [],
};

/** An answer's sample: its drawing, swatch or photo id, or its library pictures. */
const sampleOf = (o: QuestionOption): string | undefined => ('illustration' in o ? o.illustration : 'picture' in o ? JSON.stringify(o.picture) : undefined);
const illustrations = (id: string): (string | undefined)[] => (file.questions.find((q) => q.id === id)?.options ?? []).map((o) => ('illustration' in o ? o.illustration : undefined));

it('shows a sample on every answer of the listed questions except the named ones, a different one on each, and none elsewhere', () => {
  for (const q of file.questions) {
    const words = q.options.filter((o) => 'value' in o && o.value === null).map((o) => o.label).concat(SAMPLED[q.id] ?? q.options.map((o) => o.label));
    expect(q.options.filter((o) => sampleOf(o) === undefined).map((o) => o.label), q.id).toEqual(q.options.filter((o) => words.includes(o.label)).map((o) => o.label));
    const samples = q.options.flatMap((o) => sampleOf(o) ?? []);
    expect(new Set(samples).size, q.id).toBe(samples.length);
  }
  expect(Object.keys(SAMPLED).filter((id) => !file.questions.some((q) => q.id === id))).toEqual([]);
});

it('shows true colour on the colour answers and a drawing on the body answers', () => {
  expect(illustrations('colour-current-tone')).toEqual([...['warm', 'copper', 'neutral', 'cool', 'brassy'].map((t) => `q-swatch-tone-${t}`), undefined]);
  expect(illustrations('grey-amount')).toEqual([...[0, 10, 20, 40, 60, 90].map((share) => `q-swatch-grey-${String(share)}`), undefined]);
  expect(illustrations('pref-colour-direction')).toEqual([...['lighter', 'darker', 'tone', 'refresh', 'grey', 'vivid', 'natural'].map((d) => `q-swatch-direction-${d}`), undefined]);
  expect(illustrations('look-undertone')).toEqual([...['warm', 'cool', 'neutral', 'olive'].map((u) => `q-swatch-undertone-${u}`), undefined]);
  expect(illustrations('beard-style')).toEqual([...['none', 'stubble', 'short', 'medium', 'full'].map((b) => `q-beard-${b}`), undefined]);
  expect(illustrations('hair-part-side')).toEqual([...['left', 'right', 'centre', 'none'].map((p) => `q-part-${p}`), undefined]);
  expect(illustrations('hair-thinning-zone')).toEqual([undefined, 'q-thinning-crown', 'q-thinning-front', 'q-thinning-2', 'q-thinning-diffuse', undefined]);
});
