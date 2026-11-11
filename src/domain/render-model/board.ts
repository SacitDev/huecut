/**
 * The board view model: the "Try together" tile first when its picture exists, then one tile per idea in shortlist order, at most
 * 9; the app's own names under each, the AI label on AI tiles, the hair-only switch on colour ideas and paired cuts, and the
 * footer, laid out on the 2160 x 2700 export. Also the numbered reference sheet of a final card, laid out the same way.
 */
import type { Rect } from '../geometry/coords.ts';
import { lookId, type PictureId } from '../ids.ts';
import { EN, type Copy } from './copy.ts';
import { JPEG_EXPORT, type ExportSpec } from './face-card.ts';

/** At most 8 ideas on the list, plus the pair's tile. */
export const BOARD_MAX_IDEAS = 8;
export const BOARD_MAX_TILES = 9;

/** An AI picture from the idea's slot, or (on the example) the library picture by its key. */
export type BoardPicture =
  | { readonly source: 'ai'; readonly pictureId: PictureId; readonly hairOnly: boolean }
  | { readonly source: 'library'; readonly key: string };
export interface BoardIdea {
  readonly id: string;
  readonly kind: 'cut' | 'colour';
  readonly name: string;
  readonly picture: BoardPicture | null;
  /** The colour this picture of a cut was made with; the tile is named for both and keeps that name. */
  readonly colour?: { readonly id: string; readonly name: string };
}
export interface BoardPair {
  readonly cut: { readonly id: string; readonly name: string };
  readonly colour: { readonly id: string; readonly name: string };
  readonly picture: Extract<BoardPicture, { readonly source: 'ai' }> | null;
}

export interface BoardTile {
  /** The idea's id, or `cut+colour` for the pair (as in its slot key). */
  readonly key: string;
  readonly ideas: readonly string[];
  readonly name: string;
  readonly picture: BoardPicture | null;
  /** "AI picture, an illustration of the look" on every AI tile; null on library pictures and empty tiles. */
  readonly aiLabel: string | null;
  /** The hair-only switch: shown on AI colour tiles and the pair, with its state; null where it does not apply. */
  readonly hairOnly: boolean | null;
  /** Card px: the picture, drawn whole (never cropped), and the name under it. */
  readonly pictureRect: Rect;
  readonly nameRect: Rect;
}
export interface Board {
  readonly title: string;
  readonly tiles: readonly BoardTile[];
  /** No tile has a picture: the screen shows the empty state and there is nothing to save. */
  readonly empty: boolean;
  readonly columns: number;
  readonly rows: number;
  readonly footer: readonly string[];
  readonly layout: typeof BOARD_LAYOUT;
  readonly export: ExportSpec;
}

export const BOARD_LAYOUT = {
  title: { x: 120, y: 100, width: 1920, height: 120 },
  grid: { x: 120, y: 260, width: 1920, height: 2200 },
  footer: { x: 120, y: 2500, width: 1920, height: 100 },
} as const satisfies Record<string, Rect>;
const GAP_PX = 32;
const NAME_HEIGHT_PX = 110;
/** Picture frames are 4:5 like the person's portrait; a picture of another shape is drawn whole inside, on neutral ground. */
const FRAME_ASPECT = 4 / 5;

/** 1 tile: 1 column; up to 4: 2; up to 9: 3. */
const columnsFor = (n: number): number => (n <= 1 ? 1 : n <= 4 ? 2 : 3);

function place(n: number): { columns: number; rows: number; at: (i: number) => Pick<BoardTile, 'pictureRect' | 'nameRect'> } {
  const columns = columnsFor(n);
  const rows = Math.max(1, Math.ceil(n / columns));
  const grid = BOARD_LAYOUT.grid;
  const cellHeight = (grid.height - (rows - 1) * GAP_PX) / rows;
  const width = Math.min((grid.width - (columns - 1) * GAP_PX) / columns, (cellHeight - NAME_HEIGHT_PX) * FRAME_ASPECT);
  const height = width / FRAME_ASPECT;
  const left = grid.x + (grid.width - (columns * width + (columns - 1) * GAP_PX)) / 2;
  const at = (i: number) => {
    const x = left + (i % columns) * (width + GAP_PX);
    const y = grid.y + Math.floor(i / columns) * (height + NAME_HEIGHT_PX + GAP_PX);
    return { pictureRect: { x, y, width, height }, nameRect: { x, y: y + height, width, height: NAME_HEIGHT_PX } };
  };
  return { columns, rows, at };
}

type TileContent = Omit<BoardTile, 'pictureRect' | 'nameRect'>;

const ideaTile = ({ id, kind, name, picture, colour }: BoardIdea, copy: Copy['board']): TileContent => ({
  key: lookId(colour ? [id, colour.id] : id),
  ideas: colour ? [id, colour.id] : [id],
  name: colour ? copy.lookName(name, colour.name) : name,
  picture,
  aiLabel: picture?.source === 'ai' ? copy.aiLabel : null,
  hairOnly: (kind === 'colour' || colour) && picture?.source === 'ai' ? picture.hairOnly : null,
});

/** The board for the list in shortlist order and the pair; a pair without a picture has no tile. */
export function buildBoard(input: { readonly ideas: readonly BoardIdea[]; readonly pair: BoardPair | null }, copy: Pick<Copy, 'board' | 'footer'> = EN): Board {
  const { pair } = input;
  const pairTile: TileContent[] = pair?.picture
    ? [{
      key: lookId([pair.cut.id, pair.colour.id]), ideas: [pair.cut.id, pair.colour.id], name: copy.board.pairName(pair.cut.name, pair.colour.name),
      picture: pair.picture, aiLabel: copy.board.aiLabel, hairOnly: pair.picture.hairOnly,
    }]
    : [];
  const content = [...pairTile, ...input.ideas.slice(0, BOARD_MAX_IDEAS).map((i) => ideaTile(i, copy.board))].slice(0, BOARD_MAX_TILES);
  const grid = place(content.length);
  return {
    title: copy.board.title,
    tiles: content.map((t, i) => ({ ...t, ...grid.at(i) })),
    empty: content.every((t) => t.picture === null),
    columns: grid.columns,
    rows: grid.rows,
    footer: [copy.footer.app, copy.footer.link],
    layout: BOARD_LAYOUT,
    export: JPEG_EXPORT,
  };
}

export interface ReferenceTile {
  /** Its number on the card and in the card's prompt. */
  readonly number: number;
  readonly name: string;
  /** The picture key in `content/pictures.json`; null when the item has none. */
  readonly picture: string | null;
  readonly pictureRect: Rect;
  readonly nameRect: Rect;
}
export interface ReferenceSheet {
  readonly title: string;
  readonly tiles: readonly ReferenceTile[];
  readonly footer: readonly string[];
  readonly layout: typeof BOARD_LAYOUT;
  readonly export: ExportSpec;
}

/** The numbered sheet a final card's prompt names: the library's fictional front views, in the prompt's order, numbers from 1. */
export function buildReferenceSheet(looks: readonly { readonly name: string; readonly picture: string | null }[], copy: Pick<Copy, 'board' | 'footer'> = EN): ReferenceSheet {
  const grid = place(looks.length);
  return {
    title: copy.board.referenceTitle,
    tiles: looks.map((look, i) => ({ number: i + 1, name: look.name, picture: look.picture, ...grid.at(i) })),
    footer: [copy.footer.app, copy.footer.link],
    layout: BOARD_LAYOUT,
    export: JPEG_EXPORT,
  };
}
