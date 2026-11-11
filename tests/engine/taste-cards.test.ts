/**
 * "Tap the looks you like" on the real library: the fixed cards, a tap only ever as a plus inside the existing tiers,
 * and the cards checked against the looks that are not on them. Every person here is fictional and hand-written.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { QuestionsFile } from '../../src/domain/content/types.ts';
import type { Collection } from '../../src/domain/content/values.ts';
import { assessIdea, recommend, type EngineContent } from '../../src/domain/engine/recommend.ts';
import { FACTS, type Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const loaded = engineFrom(join(root, 'content'));
if (!loaded.content) throw new Error(loaded.note);
const content: EngineContent = loaded.content;
const file = JSON.parse(readFileSync(join(root, 'content', 'questions.json'), 'utf8')) as QuestionsFile;
const pictures = JSON.parse(readFileSync(join(root, 'content', 'pictures.json'), 'utf8')) as Readonly<Record<string, unknown>>;
const question = file.questions.find((q) => q.id === 'taste-cuts');
if (!question) throw new Error('no taste question');

const facts = (values: Readonly<Record<string, unknown>>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const cards = (model: string): string[] => question.options.flatMap((o) => ('picture' in o && Object.values(o.picture)[0]?.startsWith(`${model}/`) ? [String(o.value)] : []));

const MODELS: readonly (readonly [model: string, collection: Collection, texture: string, lengths: readonly string[]])[] = [
  ['salon-straight-wavy', 'salon', 'wavy', ['short', 'chin', 'shoulder', 'long']],
  ['salon-curly-coily', 'salon', 'coily', ['short', 'chin', 'shoulder', 'long']],
  ['barbering-straight-wavy', 'barbering', 'straight', ['very_short', 'short', 'chin']],
  ['barbering-curly-coily', 'barbering', 'curly', ['very_short', 'short', 'chin']],
];

describe('the cards', () => {
  it('are six per model, up to three taps, with a way out for none', () => {
    expect(question.type).toBe('multi');
    expect(question.max).toBe(3);
    expect(question.options.at(-1)).toEqual({ value: null, label: 'None of these, or not sure' });
    for (const [model] of MODELS) expect(cards(model), model).toHaveLength(6);
  });

  it('are real looks of their model, each with its own picture and name, that suit at least one texture of that model', () => {
    for (const [model, collection] of MODELS) for (const id of cards(model)) {
      const cut = content.cuts.find((c) => c.id === id);
      const textures = model.endsWith('straight-wavy') ? (['straight', 'wavy'] as const) : (['curly', 'coily'] as const);
      expect(cut?.collections, id).toContain(collection);
      expect(`${model}/${id}-front` in pictures, id).toBe(true);
      expect(textures.some((t) => cut?.texture_fit[t].fit !== 'poor'), id).toBe(true);
    }
  });

  it('come only from an answer, never the photo', () => {
    expect(FACTS['wish.liked_cuts'].from).toBe('question');
  });
});

describe('a tap', () => {
  const person = { 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'hair.density': 'medium', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8 };
  const tapped = facts({ ...person, 'wish.liked_cuts': ['french-bob', 'long-wolf-cut'] });
  const plain = facts(person);

  it('adds to what it matches, takes nothing from any look that was not tapped, and leaves nothing out', () => {
    for (const cut of content.cuts) {
      const [before, after] = [assessIdea(cut.id, plain, content), assessIdea(cut.id, tapped, content)];
      expect(after?.contributions.filter((c) => c.ruleId.startsWith('taste-')).every((c) => c.points > 0), cut.id).toBe(true);
      expect(after?.score ?? 0, cut.id).toBeGreaterThanOrEqual(before?.score ?? 0);
      expect(after?.excluded, cut.id).toEqual(before?.excluded);
    }
  });

  it('gives its reason in plain words', () => {
    const reasons = assessIdea('french-bob', tapped, content)?.reasons.map((r) => r.text) ?? [];
    expect(reasons).toContain('You tapped looks you like, so this cut has the same shape as one of them.');
  });
});

describe('the cards against the looks not on them', () => {
  /** For each model: of the picks a tap brings in, how many are not on the cards; and the looks on no card that a card's shape reaches. */
  const measure = (model: string, collection: Collection, texture: string, lengths: readonly string[]) => {
    const onCards = new Set(cards(model));
    let [brought, broughtOff, picks, firstTapped, runs] = [0, 0, 0, 0, 0];
    for (const length of lengths) for (const minutes of [5, 20]) {
      const person = { 'hair.texture': texture, 'hair.current_length': length, 'hair.resting_length': length, 'hair.density': 'medium', 'life.styling_minutes': minutes, 'life.trim_weeks_ok': 8 };
      const list = (extra: Readonly<Record<string, unknown>>) => recommend(facts({ ...person, ...extra }), content, { kinds: ['cut'], collections: [collection], count: 6 }).picks.map((p) => p.id);
      const before = new Set(list({}));
      for (const id of onCards) {
        const after = list({ 'wish.liked_cuts': [id] });
        const fresh = after.filter((x) => !before.has(x));
        [brought, broughtOff, picks, runs] = [brought + fresh.length, broughtOff + fresh.filter((x) => !onCards.has(x)).length, picks + after.length, runs + 1];
        if (after[0] === id) firstTapped += 1;
      }
    }
    const shapes = new Set(content.cuts.filter((c) => onCards.has(c.id)).map((c) => c.traits.silhouette));
    const others = content.cuts.filter((c) => c.collections.includes(collection) && !onCards.has(c.id));
    return { model, runs, picksPerRun: picks / runs, broughtIn: brought, offCardShare: broughtOff / Math.max(1, brought), firstIsTapped: firstTapped / runs, othersSharingAShape: others.filter((c) => shapes.has(c.traits.silhouette)).length / others.length };
  };

  it.each(MODELS)('%s: a tap mostly brings in looks that are not on the cards', (model, collection, texture, lengths) => {
    const m = measure(model, collection, texture, lengths);
    console.log(JSON.stringify(m));
    expect(m.broughtIn).toBeGreaterThan(0);
    expect(m.offCardShare).toBeGreaterThan(0.5);
    expect(m.firstIsTapped).toBeLessThan(0.75);
  });
});
