/**
 * Branded ids. Brands stop a photo id being passed where an item id is meant;
 * they cost nothing at run time.
 */
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

/** One photo in this session, made by the resource store. */
export type PhotoId = Brand<string, 'PhotoId'>;
/** A content id (cut, colour look, beard, shade, technique), kebab-case and listed in `content/ids.lock`. */
export type ItemId = Brand<string, 'ItemId'>;
/** A picture the person added (an AI result or a quick-grid tile), kept in the resource store. */
export type PictureId = Brand<string, 'PictureId'>;
/** Caller-chosen id of one worker call, so a late or superseded reply can be discarded. */
export type OpId = Brand<number, 'OpId'>;

export const asPhotoId = (s: string): PhotoId => s as PhotoId;
export const asItemId = (s: string): ItemId => s as ItemId;
export const asPictureId = (s: string): PictureId => s as PictureId;
export const asOpId = (n: number): OpId => n as OpId;

/**
 * One result on the list: an idea, or a cut with its colour look. "Try together" and "Colour in your results" share this one
 * form, and the slot key, the prompts, the board and the stylist sheet all read it.
 */
export type Look = ItemId | readonly [cut: ItemId, colour: ItemId];

/** A look as one string, for a prompt's id, a board tile or a grid's tile: an item's id, or `cut+colour`. */
export type LookId = ItemId | Brand<string, 'LookId'>;
/** The only place the `cut+colour` form is written. */
export const lookId = (look: string | readonly [cut: string, colour: string]): LookId =>
  (typeof look === 'string' ? look : `${look[0]}+${look[1]}`) as LookId;
/** The only place the `cut+colour` form is read. */
export function lookOf(id: string): Look {
  const [cut = id, colour] = id.split('+');
  return colour === undefined ? asItemId(cut) : [asItemId(cut), asItemId(colour)];
}

/** Picture slot key: an idea, or a paired look, on the current main photo. */
export type SlotKey = `${string}@${string}`;
export const slotKey = (idea: Look, photo: PhotoId): SlotKey => `${lookId(idea)}@${photo}`;
/** The ids a look holds: the item, or the cut then its colour look. */
export const idsOfLook = (look: Look): readonly [ItemId] | readonly [cut: ItemId, colour: ItemId] => (typeof look === 'string' ? [look] : look);
