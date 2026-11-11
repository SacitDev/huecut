/**
 * Library pictures: 3:4 AVIF files in `public/library/<model>/<item>-<view>-<width>.avif`,
 * never cropped, in the widths the picture index lists (480, 960 and the 1086 px original), each with its average
 * colour for the placeholder block. Shared by Explore and My look.
 */
import type { LibraryModel, PictureEntry } from '../../domain/content/types.ts';
import { VIEWS, type View } from '../../domain/content/values.ts';
import type { Pictures } from '../../domain/content/output.ts';
import { en } from '../../strings/en.ts';

const t = en.explore;

export interface LibraryPicture {
  /** `<model-id>/<item-id>-<view>`, the key in `content/pictures.json`. */
  readonly key: string;
  readonly view: View;
  readonly model: LibraryModel | undefined;
  readonly src: string;
  readonly srcSet: string;
  readonly width: number;
  readonly height: number;
  readonly placeholder: string;
  readonly alt: string;
}

/** The URL of one width of a picture, under the site's base path. */
export const pictureUrl = (key: string, width: number): string => `${import.meta.env.BASE_URL}library/${key}-${String(width)}.avif`;

/** "Front view: Chin bob with a curtain fringe, on the straight-to-wavy model." */
export function pictureAlt(view: View, name: string, model: LibraryModel | undefined): string {
  return model ? t.alt(t.views[view], name, t.models[model.hair_group]) : `${t.views[view]}: ${name}.`;
}

/** The view a key ends with (`…-front`); keys come from the content build, so a stray suffix means front. */
function viewOf(key: string): View {
  const suffix = key.slice(key.lastIndexOf('-') + 1);
  return VIEWS.find((v) => v === suffix) ?? 'front';
}

function toPicture(key: string, entry: PictureEntry, name: string, models: readonly LibraryModel[]): LibraryPicture {
  const view = viewOf(key);
  const model = models.find((m) => m.id === key.slice(0, key.indexOf('/')));
  const smallest = entry.widths[0] ?? entry.widthPx;
  return {
    key,
    view,
    model,
    src: pictureUrl(key, smallest),
    srcSet: entry.widths.map((w) => `${pictureUrl(key, w)} ${String(w)}w`).join(', '),
    width: entry.widthPx,
    height: entry.heightPx,
    placeholder: entry.average,
    alt: pictureAlt(view, name, model),
  };
}

/** An item's pictures in the order the content build wrote them (front, side, back; one per model for a look). */
export function picturesOf(item: { readonly name: string; readonly pictures: Pictures }, models: readonly LibraryModel[]): LibraryPicture[] {
  return Object.entries(item.pictures).map(([key, entry]) => toPicture(key, entry, item.name, models));
}

/** The picture a grid tile shows: the front view, or a colour look's first model. */
export function tilePicture(item: { readonly name: string; readonly pictures: Pictures }, models: readonly LibraryModel[]): LibraryPicture | null {
  const all = picturesOf(item, models);
  return all.find((p) => p.view === 'front') ?? all[0] ?? null;
}
