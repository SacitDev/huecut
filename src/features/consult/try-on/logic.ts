/**
 * Pure rules of Try it on and Board: which hand-off the device gets, where a
 * quick grid stands, moving a name in the tile-order confirmation, which ideas take their grid tile, and the board input.
 */
import type { DeviceInfo } from '../../../domain/device.ts';
import { lookOf, slotKey, type LookId, type PhotoId, type PictureId, type SlotKey } from '../../../domain/ids.ts';
import type { BoardIdea, BoardPair } from '../../../domain/render-model/board.ts';
import type { BoardTile } from '../../../machine/consult.selectors.ts';
import type { Grid, Pair, Slot } from '../../../machine/consult.types.ts';

/**
 * `touch`: phones and tablets get "1 Copy prompt" and "2 Share photo" and the round-trip offer, because switching apps
 * there can reload the tab; `desktop`: Copy prompt, Open ChatGPT or Gemini, Download photo for AI, paste or drop.
 */
export const handoffOf = (device: Pick<DeviceInfo, 'class'>): 'touch' | 'desktop' =>
  device.class === 'computer' ? 'desktop' : 'touch';

/**
 * Where a quick grid stands: no picture yet (or its picture is gone after a reload), tiles waiting for the person to
 * confirm the names, names attached, or switched to one picture per look ("Tiles look wrong?"). The machine records the
 * switch as a confirmation that names no tile (`GRID.CONFIRM` with an empty order), so nothing is attached. Grids are
 * numbered by their place in the list, so after the list changes a named record can belong to other looks: then it is empty.
 */
export type GridStage = 'empty' | 'lost' | 'confirming' | 'named' | 'per-idea';
export function gridStage(record: Grid | undefined, hasPicture: boolean, ideas: readonly string[]): GridStage {
  if (!record) return 'empty';
  if (!record.confirmed) return hasPicture ? 'confirming' : 'lost';
  if (record.ideas.length === 0) return 'per-idea';
  return record.ideas.length === ideas.length && record.ideas.every((id) => ideas.includes(id)) ? 'named' : 'empty';
}

/** Moves the entry at `index` one place earlier (-1) or later (+1); the list is unchanged at its ends. */
export function moved<T>(list: readonly T[], index: number, step: -1 | 1): T[] {
  const to = index + step;
  const next = [...list];
  const [a, b] = [next[index], next[to]];
  if (a === undefined || b === undefined) return next;
  next[index] = b;
  next[to] = a;
  return next;
}

/** The grid's tiles that become slot pictures once named: each look takes its tile unless its slot already has one. */
export function tileFills(
  order: readonly LookId[],
  tiles: readonly PictureId[],
  photo: PhotoId,
  slots: Readonly<Partial<Record<SlotKey, Slot>>>,
): { readonly key: SlotKey; readonly picture: PictureId }[] {
  return order.flatMap((id, i) => {
    const picture = tiles[i];
    const key = slotKey(lookOf(id), photo);
    return picture !== undefined && slots[key] === undefined ? [{ key, picture }] : [];
  });
}

/** The ideas' names and kinds, from the library index. */
export type Named = (id: string) => { readonly name: string; readonly kind: 'cut' | 'colour' } | null;

/** Whether a tile holds the "Try together" pair rather than a cut with the colour chosen for it. */
export const isPairTile = (pair: Pair | null) => (tile: BoardTile): boolean =>
  pair !== null && tile.ideas[0] === pair.cut && tile.ideas[1] === pair.colour;

/** What `buildBoard` takes, from the board layout selector: a two-idea tile is the "Try together" pair when `isPair` says so, otherwise a cut with its colour. */
export function boardInput(tiles: readonly BoardTile[], named: Named, isPair: (tile: BoardTile) => boolean = () => true): { readonly ideas: BoardIdea[]; readonly pair: BoardPair | null } {
  const ai = (slot: Slot | null) =>
    slot === null ? null : { source: 'ai' as const, pictureId: slot.pictureId, hairOnly: slot.hairOnly };
  const ideas: BoardIdea[] = [];
  let pair: BoardPair | null = null;
  for (const t of tiles) {
    const [a, b] = t.ideas;
    const first = a === undefined ? null : named(a);
    const second = b === undefined ? null : named(b);
    if (a === undefined || !first) continue;
    if (b === undefined) ideas.push({ id: a, kind: first.kind, name: first.name, picture: ai(t.picture) });
    else if (second && isPair(t)) pair = { cut: { id: a, name: first.name }, colour: { id: b, name: second.name }, picture: ai(t.picture) };
    else if (second) ideas.push({ id: a, kind: first.kind, name: first.name, picture: ai(t.picture), colour: { id: b, name: second.name } });
  }
  return { ideas, pair };
}
