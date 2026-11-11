/** The stylist sheet of a board tile: one idea's, or the "Try together" pair's one sheet. */
import type { ItemId } from '../../../domain/ids.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import type { StylistSheet } from '../../../domain/render-model/stylist-sheet.ts';
import type { ConsultContext } from '../../../machine/consult.types.ts';
import type { ConsultPort, DetailsOf } from '../useConsult.ts';

/** The sheet for a tile's ideas (one, or the pair's two); null while it cannot be made. */
export function tileSheet(port: ConsultPort, c: ConsultContext, details: DetailsOf, ideas: readonly ItemId[]): StylistSheet | null {
  const [a, b] = ideas;
  if (a === undefined) return null;
  return port.selectors.stylistSheet(c, b === undefined ? a : [a, b])(details);
}

/** The colour's journey label as the tile's sheet gives it for this person; null where the sheet has no colour. */
export const journeyLabelOf = (sheet: StylistSheet | null): string | null =>
  sheet?.sections.find((s) => s.id === 'journey')?.rows.find((r) => r.label === SHOWN.sheet.rows.label)?.value ?? null;
