/**
 * Beard ranking: every beard of the collection judged with the cut as one composition, after density and
 * the person's wishes, read from the same notes the card shows (suppression included). The frame is the main judge here and
 * reads the width number from medium confidence. The 190 mm face scale and the jaw term are assumptions flagged for the stylist check.
 */
import type { BeardIndexEntry, CutIndexEntry } from '../content/output.ts';
import type { RuleFor } from '../content/types.ts';
import type { Suitability } from '../content/suitability.ts';
import type { Collection } from '../content/values.ts';
import type { FactValue, Facts, Range } from '../facts/registry.ts';
import { usable } from './match.ts';
import { exclusionsFor, notesFor, suppressedOn } from './score.ts';
import { frameFit, hairShape } from './suitability.ts';

/** A beard as the ranking reads it. */
export type EngineBeard = Pick<BeardIndexEntry, 'id' | 'collections' | 'traits' | 'zones_mm'>;

const mid = ([a, b]: Range): number => (a + b) / 2;

/** The beards to show with one cut, best first: an excluded beard never; density and wishes order the rest by factor. */
export function rankBeards(
  cut: Pick<CutIndexEntry, 'traits'> & Partial<Pick<CutIndexEntry, 'pairs_with'>>, facts: Facts, beards: readonly EngineBeard[],
  rules: readonly RuleFor<'beard'>[], collections: readonly Collection[], s: Suitability,
): readonly string[] {
  const density = usable(facts, 'beard.density') as FactValue<'beard.density'> | undefined;
  const paired = cut.pairs_with?.beards ?? [];
  const byId = new Map(rules.map((r) => [r.id, r]));
  const hair = hairShape(cut.traits, facts, s.frame);
  const fitOf = (b: EngineBeard): number => {
    const cheeks = mid(b.zones_mm.cheeks);
    const patchy = density !== 'patchy' ? 1 : cheeks > s.beards.patchy.full_mm ? s.beards.patchy.full : cheeks > s.beards.patchy.some_mm ? s.beards.patchy.some : 1;
    const wished = notesFor('beard', b.traits, rules, facts, suppressedOn('beard', b.traits, rules, facts)).some((n) => Object.keys(byId.get(n.ruleId)?.when ?? {}).some((k) => k.startsWith('wish.')));
    const frame = frameFit(hair, facts, s.frame, {
      width: (cheeks + 0.3 * mid(b.zones_mm.sideburns)) / s.beards.scale_mm, chin: mid(b.zones_mm.chin) / s.beards.scale_mm, jaw: cheeks / s.beards.scale_mm, sigma: s.beards.sigma,
    });
    // A longer lower third keeps the chin short: the same miss the cut's lower-third reading uses.
    const chin = usable(facts, 'face.lower_share') === 'longer' && mid(b.zones_mm.chin) > s.beards.short_chin_mm ? s.frame.thirds.miss : 1;
    return patchy * (paired.includes(b.id) ? 1 : s.beards.not_paired) * (wished ? s.beards.wish_note : 1) * (frame?.at[0] ?? 1) * chin;
  };
  const shown = beards.filter((b) => (collections.length === 0 || b.collections.some((c) => collections.includes(c))) && exclusionsFor('beard', b.traits, rules, facts).length === 0);
  return shown
    .map((b) => ({ id: b.id, fit: fitOf(b), order: paired.indexOf(b.id) }))
    .sort((a, b) => b.fit - a.fit || (a.order < 0 ? 1 : 0) - (b.order < 0 ? 1 : 0) || a.order - b.order || (a.id < b.id ? -1 : 1))
    .slice(0, s.beards.shown)
    .map((b) => b.id);
}
