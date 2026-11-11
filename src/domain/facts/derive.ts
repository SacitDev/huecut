/**
 * Derived facts: `look.contrast` from two answers; when the chemical history is known
 * to be `none`, the current level at the lengths (the natural level); and a last chemical service of `never` when the
 * known history has no perm, relaxer or keratin.
 */
import { CONFIDENCE_RANK, type Confidence, type FactValue, type Facts } from './registry.ts';

/**
 * Skin depth placed on the 1-10 hair level scale (1 black, 10 lightest blonde), so the two answers can be compared.
 * Design logic: no research source gives numbers for `contrast_estimate`, so these values are chosen.
 */
export const SKIN_ON_LEVEL_SCALE: Readonly<Record<FactValue<'look.skin_depth'>, number>> = {
  very_light: 9, light: 8, medium: 6, tan_olive: 5, deep: 3, very_deep: 2,
};
/** Level steps between skin and natural hair: up to `low` is low contrast, up to `medium` medium, beyond is high. */
export const CONTRAST_STEPS = { low: 2, medium: 4 } as const;

type Derived = { -readonly [K in keyof Facts]: Facts[K] };

const lower = (a: Confidence, b: Confidence): Confidence => (CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b);

/** `look.contrast` from a skin depth and a natural level: how many level steps lie between them. */
export function contrastOf(skin: FactValue<'look.skin_depth'>, naturalLevel: number): FactValue<'look.contrast'> {
  const steps = Math.abs(SKIN_ON_LEVEL_SCALE[skin] - naturalLevel);
  return steps <= CONTRAST_STEPS.low ? 'low' : steps <= CONTRAST_STEPS.medium ? 'medium' : 'high';
}

/** Adds a last chemical service of `never` for a known history with no perm, relaxer or keratin, unless it was answered. */
function addNeverChemical(out: Derived, history: Facts['hair.chemical_history']): void {
  if (!history || out['colour.last_chemical_service'] || history.value.some((v) => v === 'relaxer_perm' || v === 'keratin')) return;
  out['colour.last_chemical_service'] = { key: 'colour.last_chemical_service', value: 'never', confidence: history.confidence, source: 'derived' };
}

/**
 * The facts with every derivable fact added. A fact already present (an answer) is never replaced, so an answered
 * current level wins over the natural level. `look.contrast` is derived from answers only.
 */
export function deriveFacts(facts: Facts): Facts {
  const out: Derived = { ...facts };
  const history = facts['hair.chemical_history'];
  const natural = facts['colour.natural_level'];
  if (history?.value.length === 1 && history.value[0] === 'none') {
    if (!out['colour.current_level_lengths'] && natural) {
      out['colour.current_level_lengths'] = {
        key: 'colour.current_level_lengths', value: natural.value, confidence: lower(history.confidence, natural.confidence), source: 'derived',
      };
    }
  }
  addNeverChemical(out, history);
  const skin = facts['look.skin_depth'];
  if (!out['look.contrast'] && skin?.source === 'answered' && natural?.source === 'answered') {
    out['look.contrast'] = { key: 'look.contrast', value: contrastOf(skin.value, natural.value), confidence: lower(skin.confidence, natural.confidence), source: 'derived' };
  }
  return out;
}
