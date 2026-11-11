/** The trait lists: counts per kind and setter, and the facts per-person traits read. */
import { describe, expect, it } from 'vitest';
import { isFactKey } from '../facts/registry.ts';
import { TRAITS, TARGET_KINDS, traitBy, type AuthoredTraits, type TraitSpec } from './traits.ts';
import type { Match } from './types.ts';

const specs = (kind: keyof typeof TRAITS) => Object.entries(TRAITS[kind]) as [string, TraitSpec][];
const countBy = (kind: keyof typeof TRAITS) =>
  specs(kind).reduce<Record<string, number>>((n, [, s]) => ({ ...n, [traitBy(s)]: (n[traitBy(s)] ?? 0) + 1 }), {});

describe('TRAITS', () => {
  it('has 38 cut, 29 colour-look and 4 beard traits, 71 in all', () => {
    // Cut: 24 authored, 6 at build (length_class, top_length, top_cm, scalp_mm, hang_cm, sides), 8 per person (texture_fit,
    // daily_styling, density_fit, length_change, length_direction, trim_times, growth_weeks, liked).
    expect(countBy('cut')).toEqual({ authored: 24, build: 6, person: 8 });
    // Colour looks: none authored; 17 at build (base_technique, root_levels, lengths_levels, lighter_pieces and grey_effect among them);
    // 12 per person (lift_levels, known_lift, roots_lift, roots_darken, roots_from_worn, lengths_darken, lengths_lift, darkens_by,
    // reaches_shade, ends_darker, contrast_with_natural, placement_not_lighter).
    expect(countBy('colour')).toEqual({ build: 17, person: 12 });
    expect(countBy('beard')).toEqual({ authored: 4 });
    expect(TARGET_KINDS.reduce((n, k) => n + specs(k).length, 0)).toBe(71);
  });

  it('names real fact keys in every per-person trait, and only there', () => {
    for (const kind of TARGET_KINDS) {
      for (const [, s] of specs(kind)) {
        expect(s.reads !== undefined).toBe(traitBy(s) === 'person');
        for (const f of s.reads ?? []) expect(isFactKey(f)).toBe(true);
      }
    }
  });

  it('keeps "none" alone in the layers set', () => {
    expect(TRAITS.cut.layers.exclusive).toEqual(['none']);
    const authored: Pick<AuthoredTraits<'cut'>, 'layers' | 'styling_minutes'> = { layers: ['light'], styling_minutes: [3, 6] };
    expect(authored.layers).toEqual(['light']);
  });

  it('keeps the value lists in the types, also for traits declared without options', () => {
    const fine: Match<'cut'> = { height_top: { is: 'flat' }, perimeter: { not: ['blunt'] } };
    // @ts-expect-error `nonsense` is not a value of cut.height_top: a widened list would make this compile, and the unused directive would then fail.
    const wrong: Match<'cut'> = { height_top: { is: 'nonsense' } };
    // @ts-expect-error `nonsense` is not a value of beard.beard_length.
    const wrongBeard: Match<'beard'> = { beard_length: { in: ['nonsense'] } };
    expect([fine, wrong, wrongBeard]).toHaveLength(3);
  });
});
