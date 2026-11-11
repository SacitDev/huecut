/**
 * The engine's suitability score on the real content: the face reaches the picks, a stated limit is honoured, nothing is
 * counted twice, reasons stay true, and each component can be removed. Facts are fictional and hand-written.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { Question } from '../../src/domain/content/types.ts';
import type { Suitability } from '../../src/domain/content/suitability.ts';
import { rankBeards } from '../../src/domain/engine/beards.ts';
import { cutTraits } from '../../src/domain/engine/derive-traits.ts';
import { questionImpact, runImpact } from '../../src/domain/engine/impact.ts';
import { recommend, type EngineContent, type EngineComponent, type RecommendOptions } from '../../src/domain/engine/recommend.ts';
import { baseFit, frameFactor } from '../../src/domain/engine/suitability.ts';
import { similarity, type Rankable } from '../../src/domain/engine/select.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
if (!loaded.content) throw new Error(loaded.note);
const content: EngineContent = loaded.content;
const suitability: Suitability = (() => {
  if (!content.policy.suitability) throw new Error('the real policy has its ranking constants');
  return content.policy.suitability;
})();

const fact = (key: string, value: unknown, confidence: string, source: string) => [key, { key, value, confidence, source }] as const;
const answered = (values: Record<string, unknown>): Facts => Object.fromEntries(Object.entries(values).map(([k, v]) => fact(k, v, 'high', 'answered')));
const facePhoto = (w: number, j: number, confidence = 'high'): Facts => Object.fromEntries([fact('face.width_to_length', w, confidence, 'measured'), fact('face.jaw_to_cheek', j, confidence, 'measured')]);
const salon: RecommendOptions = { kinds: ['cut'], collections: ['salon'], count: 4 };
const barber: RecommendOptions = { kinds: ['cut'], collections: ['barbering'], count: 4 };
const SALON_HAIR = answered({ 'hair.texture': 'wavy', 'hair.current_length': 'shoulder', 'hair.density': 'medium', 'life.styling_minutes': 10, 'life.trim_weeks_ok': 8 });
const ids = (r: ReturnType<typeof recommend>) => r.picks.map((p) => p.id);
const without = (...off: EngineComponent[]): EngineContent => ({ ...content, off });

it('changes the picks with the face alone, and adds height from long to round', () => {
  const list = (w: number) => recommend({ ...SALON_HAIR, ...facePhoto(w, 0.85) }, content, salon);
  expect(ids(list(0.72))).not.toEqual(ids(list(0.95)));
  const height = (r: ReturnType<typeof recommend>) => r.picks.reduce((a, p) => a + ({ flat: 0, low: 1, medium: 2, high: 3 }[content.cuts.find((c) => c.id === p.id)?.traits.height_top ?? 'flat']), 0);
  expect(height(list(0.95))).toBeGreaterThan(height(list(0.72)));
});

it('gives the face one moderate rule\'s say at medium and at high, and a low reading none', () => {
  const f = (confidence: string) => ({ ...SALON_HAIR, ...facePhoto(0.95, 0.85, confidence) });
  expect(ids(recommend(f('low'), content, salon))).toEqual(ids(recommend(SALON_HAIR, content, salon)));
  for (const confidence of ['high', 'medium']) {
    const framed = recommend(f(confidence), content, salon).picks.flatMap((p) => (p.framing && p.factors ? [{ p, u: p.framing.at[0] ?? 1, base: baseFit(p.factors) }] : []));
    expect(framed.length).toBeGreaterThan(0);
    for (const { p, u, base } of framed) expect(p.fitAt[0]).toBeCloseTo(base * frameFactor(u, suitability.frame, suitability.rules, content.policy.weights.moderate), 12);
  }
});

it('honours a stated trim interval on the first pick whenever an eligible cut can', () => {
  // Shoulder length: an eligible cut that lasts 12 weeks works today. (At "short" none does, and a cut that needs growth never leads.)
  const f = answered({ 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'life.styling_minutes': 30, 'life.trim_weeks_ok': 12 });
  const first = recommend(f, content, barber).picks[0];
  expect(content.cuts.find((c) => c.id === first?.id)?.traits.trim_weeks[1]).toBeGreaterThanOrEqual(12);
});

it('never makes a poor texture fit the first pick while another fit is eligible', () => {
  const f = answered({ 'hair.texture': 'coily', 'hair.current_length': 'short' });
  const first = recommend(f, content, salon).picks[0];
  const cut = content.cuts.find((c) => c.id === first?.id);
  expect(cut && cutTraits(cut, { ...f }, content).texture_fit).not.toBe('poor');
});

it('allows only four listed rank-rule matches on factor-owned fields, and factors change the picks', () => {
  const owned = ['texture_fit', 'density_fit', 'trim_weeks', 'styling_minutes', 'growth_weeks', 'length_change'];
  const matches = content.rules.cut.flatMap((r) => (r.effect === 'rank' ? [...r.favour, ...r.disfavour].flatMap((m) => Object.keys(m).map((k) => `${r.id}:${k}`)) : []));
  expect(matches.filter((m) => owned.includes(m.split(':')[1] ?? '') && !['b19:trim_weeks', 'c03:styling_minutes', 'c05:trim_weeks', 'c06:trim_weeks'].includes(m))).toEqual([]);
  const f = answered({ 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'life.styling_minutes': 30, 'life.trim_weeks_ok': 12 });
  const one = recommend(f, content, { ...salon, count: 8 }).picks;
  const noFactors = recommend(f, without('factors'), { ...salon, count: 8 }).picks;
  expect(noFactors.map((p) => p.id)).not.toEqual(one.map((p) => p.id));
});

it('gives a decisive factor its own true line, with the real numbers, once in the list', () => {
  const f = answered({ 'hair.texture': 'straight', 'hair.current_length': 'shoulder', 'life.styling_minutes': 30, 'life.trim_weeks_ok': 12 });
  const picks = recommend(f, content, salon).picks;
  const line = picks[0]?.reasons.find((r) => r.ruleId === 'fit-trim');
  const first = content.cuts.find((c) => c.id === picks[0]?.id);
  expect(line?.text).toContain('12 weeks');
  expect(line?.text).toContain(`${String(first?.traits.trim_weeks[1])} weeks between trims`);
  expect(picks.filter((p) => p.reasons.some((r) => r.ruleId === 'fit-trim')).length).toBeLessThan(picks.length);
});

it('says what the cut does when the frame decides, with the app’s own preference named, and no number or verdict', () => {
  const lines = [0.72, 0.83, 0.95].flatMap((w) => recommend({ ...SALON_HAIR, ...facePhoto(w, 0.85) }, content, salon).picks.flatMap((p) => p.reasons.filter((r) => r.ruleId === 'fit-frame').map((r) => r.text)));
  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) {
    expect(line).toMatch(/this app’s own styling preference/);
    expect(line).not.toMatch(/\d|%|correct|ideal|flatter|too (long|round|wide)/i);
  }
});

it('keeps the cap and the low-upkeep option with the slate, and the slate is less alike than plain rank order', () => {
  const f = { ...SALON_HAIR, ...facePhoto(0.83, 0.85) };
  const mmr = recommend(f, content, salon);
  const plain = recommend(f, without('mmr'), salon);
  const per = new Map<string, number>();
  for (const p of mmr.picks) if (p.silhouette) per.set(p.silhouette, (per.get(p.silhouette) ?? 0) + 1);
  expect(Math.max(...per.values())).toBeLessThanOrEqual(content.policy.max_per_silhouette);
  expect(mmr.picks.some((p) => p.lowUpkeep)).toBe(true);
  const alike = (r: ReturnType<typeof recommend>) => {
    const xs: readonly Rankable[] = r.picks;
    return xs.flatMap((a, i) => xs.slice(i + 1).map((b) => similarity(a, b, suitability.slate.weights))).reduce((s, v) => s + v, 0);
  };
  expect(alike(mmr)).toBeLessThanOrEqual(alike(plain));
});

it('ranks beards for the whole cut and face: patchy growth never gets a full-cheek first, and the face changes the order', () => {
  const beards = content.beards;
  if (!beards) throw new Error('the real content has beards');
  const cut = content.cuts.find((c) => c.collections.includes('barbering') && c.pairs_with && c.pairs_with.beards.length > 2);
  if (!cut) throw new Error('a barbering cut with pairings');
  const rank = (f: Facts) => rankBeards(cut, f, beards, content.rules.beard ?? [], ['barbering'], suitability);
  const mid = (id: string | undefined): number => {
    const b = beards.find((x) => x.id === id);
    return b ? (b.zones_mm.cheeks[0] + b.zones_mm.cheeks[1]) / 2 : 0;
  };
  expect(mid(rank({ ...facePhoto(0.83, 0.85), ...answered({ 'beard.density': 'patchy' }) })[0])).toBeLessThanOrEqual(12);
  expect(rank(facePhoto(0.72, 0.85))).not.toEqual(rank(facePhoto(0.95, 0.85)));
  // The frame is a beard's main judge, and a medium width number is read there too.
  expect(rank(facePhoto(0.72, 0.85, 'medium'))).not.toEqual(rank(facePhoto(0.95, 0.85, 'medium')));
  expect(rank({})).toHaveLength(suitability.beards.shown);
});

it('keeps four picks with each component disabled individually, and omits disabled frame and colour output', () => {
  const f = { ...SALON_HAIR, ...facePhoto(0.95, 0.85) };
  for (const off of ['factors', 'frame', 'colour', 'mmr', 'beards'] as const) expect(recommend(f, without(off), salon).picks.length).toBe(4);
  expect(recommend(f, without('frame'), salon).picks.every((p) => p.framing === null)).toBe(true);
  expect(recommend(answered({ 'hair.texture': 'wavy' }), without('colour'), { kinds: ['colour'], collections: ['salon'], count: 2 }).picks.every((p) => p.fitAt.length === 0)).toBe(true);
});

it('orders questions by what could change the list: a question no rule reads scores 0, and a real one moves picks', () => {
  const unused: Question = { id: 'unused', type: 'single', goals: ['cut'], collections: ['salon'], prompt: 'Unused', fact: 'scalp.oil', options: [{ value: 'oily', label: 'Oily' }, { value: 'dry', label: 'Dry' }, { value: null, label: 'Not sure' }] };
  const texture: Question = { id: 'texture', type: 'single', goals: ['cut'], collections: ['salon'], prompt: 'Texture', fact: 'hair.texture', options: [{ value: 'straight', label: 'Straight' }, { value: 'coily', label: 'Coily' }] };
  const facts = answered({ 'hair.current_length': 'shoulder' });
  const picks = (f: Facts): readonly string[] => recommend(f, content, salon).picks.map((p) => p.id);
  const impact = runImpact(questionImpact([unused, texture], facts, {}, [unused, texture], picks));
  expect(impact.find((x) => x.question === 'unused')?.mean).toBe(0);
  expect(impact.find((x) => x.question === 'texture')?.mean).toBeGreaterThan(0);
  expect(impact[0]?.question).toBe('texture');
  // Nothing about the health question is ever pushed forward: an answer that only it writes is not tried.
  const health: Question = { id: 'health', type: 'single', goals: ['cut'], collections: ['salon'], prompt: 'Health', fact: 'safety.health_context', options: [{ value: true, label: 'Yes' }] };
  expect(runImpact(questionImpact([health], facts, {}, [health], picks))).toEqual([{ question: 'health', mean: 0, most: 0 }]);
});
