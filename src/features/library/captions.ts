/**
 * The words under each library tile: the meta phrase ("Medium length, straight to wavy")
 * and the technique names a colour look's phrase uses.
 */
import type { BeardIndexEntry, CutIndexEntry, LibraryIndex, LookIndexEntry } from '../../domain/content/output.ts';
import { en } from '../../strings/en.ts';
import { lengthGroupOf, TEXTURES, type Texture } from './filters.ts';

const t = en.explore;

/**
 * The textures a cut is a good fit for, as a short phrase: "any texture", a run ("straight to wavy"), one texture, or
 * a list; null when it fits none as cut.
 */
export function textureSummary(fit: CutIndexEntry['texture_fit']): string | null {
  const good = TEXTURES.filter((x) => fit[x].fit === 'good');
  const first = good[0];
  const last = good.at(-1);
  if (first === undefined || last === undefined) return null;
  if (good.length === TEXTURES.length) return t.caption.anyTexture;
  const word = (x: Texture): string => t.caption.textures[x];
  if (good.length === 1) return word(first);
  const run = TEXTURES.indexOf(last) - TEXTURES.indexOf(first) + 1 === good.length;
  return run ? t.caption.range(word(first), word(last)) : t.detail.or(good.map(word));
}

/** "Medium length, straight to wavy". */
export function cutMeta(entry: CutIndexEntry): string {
  const length = t.options.length[lengthGroupOf(entry.traits.length_class)];
  const textures = textureSummary(entry.texture_fit);
  return textures === null ? length : `${length}, ${textures}`;
}

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** Technique names by trait value (`root_shadow`), from the index's technique records (`root-shadow`). */
export function techniqueNames(index: LibraryIndex): ReadonlyMap<string, string> {
  return new Map(index.entries.flatMap((e) => (e.kind === 'technique' ? [[e.id.replaceAll('-', '_'), e.name] as const] : [])));
}

/** "Red and copper, all-over colour and balayage": the family, then the look's techniques by name. */
export function lookMeta(entry: LookIndexEntry, names: ReadonlyMap<string, string>): string {
  const family = t.options.family[entry.traits.family];
  const techniques = entry.traits.technique.flatMap((v) => {
    const name = names.get(v);
    return name === undefined ? [] : [lowerFirst(name)];
  });
  return techniques.length === 0 ? family : `${family}, ${t.caption.and(techniques)}`;
}

/** "Short, kept along the jaw". */
export function beardMeta(entry: BeardIndexEntry): string {
  return `${t.options.beardLength[entry.traits.beard_length]}, ${t.caption.beardShape[entry.traits.beard_shape]}`;
}