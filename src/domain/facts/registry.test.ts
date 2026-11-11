/** The fact registry holds exactly its 91 keys (the two numeric face facts and the tattoo fact among them), with their producers and limits. */
import { expect, it } from 'vitest';
import { FACTS, FACT_KEYS, SHEET_FACTS, isFactKey, type Fact, type FactValue } from './registry.ts';

it('FACTS holds the 91 keys, the two numeric face facts and the tattoo fact, section by section', () => {
  expect(FACT_KEYS).toHaveLength(91);
  const byNamespace: Record<string, number> = {};
  for (const k of FACT_KEYS) {
    const ns = k.slice(0, k.indexOf('.'));
    byNamespace[ns] = (byNamespace[ns] ?? 0) + 1;
  }
  // Face 6 + 2 numeric; head 2 + hair 19 + scalp 2 = 23; beard 4 + look 6 = 10; colour 11 + safety 4 (the tattoo) = 15;
  // pref 8 + life 12 = 20; wish 15. 8 + 23 + 10 + 15 + 20 + 15 = 91.
  expect(byNamespace).toEqual({ face: 8, head: 2, hair: 19, scalp: 2, beard: 4, look: 6, colour: 11, safety: 4, pref: 8, life: 12, wish: 15 });
});

it('measures only the six face keys and the two numeric ones, with their minimum confidence', () => {
  const measured = Object.fromEntries(FACT_KEYS.filter((k) => FACTS[k].from === 'measured').map((k) => [k, (FACTS[k] as { min?: string }).min]));
  expect(measured).toEqual({
    'face.proportion': 'medium', 'face.forehead_share': 'medium', 'face.lower_share': 'medium',
    'face.jaw_vs_cheek': 'high', 'face.jaw_angle': 'high', 'face.chin_width': 'high',
    'face.width_to_length': 'medium', 'face.jaw_to_cheek': 'medium',
  });
});

it('derives look.contrast, and also the current level and last chemical service from answers, from known keys', () => {
  const derived = FACT_KEYS.filter((k) => 'derivedFrom' in FACTS[k]);
  expect(derived).toEqual(['look.contrast', 'colour.current_level_lengths', 'colour.last_chemical_service']);
  for (const k of derived) for (const d of (FACTS[k] as { derivedFrom: readonly string[] }).derivedFrom) expect(isFactKey(d)).toBe(true);
  expect(FACTS['look.contrast'].from).toBe('derived');
});

it('keeps exclusive values inside the set and gives every number a unit and a range', () => {
  expect(FACTS['hair.chemical_history'].exclusive).toEqual(['none']);
  expect(FACTS['hair.chemical_history'].values).toContain('none');
  for (const k of FACT_KEYS) {
    const s = FACTS[k];
    if (s.type === 'number') {
      expect(s.unit.length).toBeGreaterThan(0);
      expect(s.range[0]).toBeLessThan(s.range[1]);
    }
  }
  expect(SHEET_FACTS).toHaveLength(12);
});

it('types a fact by its key', () => {
  const fact: Fact = { key: 'hair.chemical_history', value: ['bleach', 'home_dye'], confidence: 'high', source: 'answered' };
  const level: FactValue<'colour.natural_level'> = 6;
  // @ts-expect-error a texture value is not a chemical history value
  const wrong: Fact = { key: 'hair.chemical_history', value: ['curly'], confidence: 'high', source: 'answered' };
  // @ts-expect-error not a fact key
  const unknown: FactValue<'hair.textur'> = 'curly';
  expect([fact.key, level, wrong.key, unknown]).toHaveLength(4);
});
