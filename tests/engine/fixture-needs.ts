/** The shades a hand-made test look needs, from its region levels, for the engine's unit tests. */
import type { LookNeeds } from '../../src/domain/content/output.ts';
import type { ItemTraits } from '../../src/domain/content/traits.ts';

/**
 * One shade per region the look treats, lifted as its technique would: lightener as far as needed, permanent all-over or grey cover
 * up to two levels on natural hair only, anything else not at all.
 */
export function needsOf(t: Pick<ItemTraits<'colour'>, 'lightening' | 'base_technique' | 'root_levels' | 'lengths_levels'>): LookNeeds {
  const permanent = t.base_technique === 'all_over' || t.base_technique === 'grey_coverage';
  const lifts = t.lightening !== 'none' ? { natural: 9, coloured: 9 } : permanent ? { natural: 2, coloured: 0 } : { natural: 0, coloured: 0 };
  return { roots: t.root_levels[1] > 0 ? [{ level: t.root_levels, lifts, darkens: true }] : [], lengths: [{ level: t.lengths_levels, lifts, darkens: true }] };
}
