/**
 * "About my hair" in words: each `SHEET_FACTS` answer's label and words, which the stylist sheet and the second
 * opinion prompt share; per value for a choice, so a language can be laid over them.
 */
import type { FactValue, SHEET_FACTS } from '../facts/registry.ts';

type SheetFactKey = (typeof SHEET_FACTS)[number];
/** An answer's words: per value for a choice, per item and for none for a list, else a sentence with its number. */
type AnswerCopy<V> = [V] extends [string]
  ? { readonly values: Readonly<Record<V, string>> }
  : [V] extends [readonly (infer E extends string)[]]
    ? { readonly values: Readonly<Record<E, string>>; readonly none: string }
    : { readonly value: (v: V) => string };
/** "About my hair" and the second opinion's answers: a label and the answer's words for each `SHEET_FACTS` key. */
export type FactsCopy = { readonly [K in SheetFactKey]: { readonly label: string } & AnswerCopy<FactValue<K>> };

/** A `SHEET_FACTS` answer in the copy's words; a list's items joined by commas. */
export function answerWords<K extends SheetFactKey>(facts: FactsCopy, key: K, value: FactValue<K>): string {
  const words = facts[key] as { readonly values?: Readonly<Record<string, string>>; readonly none?: string; readonly value?: (v: FactValue<K>) => string };
  if (words.value) return words.value(value);
  const items = (Array.isArray(value) ? value : [value]) as readonly string[];
  return items.length === 0 ? (words.none ?? '') : items.map((v) => words.values?.[v] ?? v).join(', ');
}

const level = (n: number): string => `level ${String(n)} of 10`;
const SINCE = { weeks_0_2: 'in the last 2 weeks', weeks_2_8: '2-8 weeks ago', months_2_6: '2-6 months ago', months_6_plus: 'more than 6 months ago', never: 'never' } as const;
const HISTORY: Readonly<Record<FactValue<'hair.chemical_history'>[number], string>> = {
  none: 'none', home_dye: 'home dye', home_dark_dye: 'dark home dye', salon_colour: 'salon colour', bleach: 'bleach', highlights: 'highlights',
  vivid: 'vivid colours', colour_remover: 'colour remover', henna_plant: 'plant henna', henna_compound: 'compound henna',
  relaxer_perm: 'relaxer or perm', keratin: 'keratin treatment',
};

/** The English words. */
export const FACTS_COPY: FactsCopy = {
  'hair.texture': { label: 'Texture', values: { straight: 'straight', wavy: 'wavy', curly: 'curly', coily: 'coily', mixed: 'mixed, wavy and curly' } },
  'hair.density': { label: 'Density', values: { low: 'low', medium: 'medium', high: 'high' } },
  'hair.strand': { label: 'Strand', values: { fine: 'fine', medium: 'medium', coarse: 'coarse' } },
  'hair.current_length': {
    label: 'Current length',
    values: { very_short: 'very short', short: 'short', chin: 'to the chin', shoulder: 'to the shoulders', long: 'long', very_long: 'very long' },
  },
  'colour.natural_level': { label: 'Natural level', value: level },
  'hair.chemical_history': { label: 'Colour history, last 2-3 years', none: 'none of these', values: HISTORY },
  'colour.current_level_lengths': { label: 'Current level at the lengths', value: level },
  'colour.last_dye': { label: 'Last dye', values: SINCE },
  'colour.last_chemical_service': { label: 'Last chemical service', values: SINCE },
  'colour.bleach_count': { label: 'Times bleached', value: (n) => (n === 0 ? 'never' : n === 1 ? 'once' : n >= 4 ? '4 or more times' : `${String(n)} times`) },
  'colour.grey_percent': { label: 'Grey', value: (n) => `about ${String(n)}%` },
  'colour.grey_texture': { label: 'Grey texture', values: { same: 'same as the rest', wiry: 'wiry', dry: 'dry' } },
};
