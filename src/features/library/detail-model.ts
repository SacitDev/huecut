/**
 * What an item's detail shows, built from its details record and the index: the sections (lengths with
 * guard numbers, fade, upkeep, colour), "Works with your hair if…", the pairings, the prompt's look and the stylist
 * sheet. Cut and colour sections come from the stylist-sheet model, so the detail and the sheet say the same thing.
 */
import type { BeardDetail, CutDetail, Detail, LibraryIndex } from '../../domain/content/output.ts';
import type { PromptLook } from '../../domain/prompts/build.ts';
import { guardWords, SHOWN } from '../../domain/render-model/copy.ts';
import { buildStylistSheet, type SheetSection, type ShadeRef, type StylistSheet } from '../../domain/render-model/stylist-sheet.ts';
import { en } from '../../strings/en.ts';
import { english } from '../../strings/locale.ts';
import { TEXTURES, type ItemKind } from './filters.ts';

const t = en.explore.detail;

export interface DetailSection {
  readonly id: string;
  readonly heading: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}
export interface Pairing { readonly kind: ItemKind; readonly id: string; readonly name: string }

/** The shades and technique names a look's sheet needs, from the index. */
function lookParts(index: LibraryIndex): { shades: Record<string, ShadeRef>; techniques: Record<string, string> } {
  const shades: Record<string, ShadeRef> = {};
  const techniques: Record<string, string> = {};
  for (const e of index.entries) {
    if (e.kind === 'shade') shades[e.id] = { name: e.name, level: e.level, tone: e.tone };
    if (e.kind === 'technique') techniques[e.id] = e.name;
  }
  return { shades, techniques };
}

/** The stylist sheet for a cut or a colour look, in the language shown; beards have no sheet model. */
export function sheetFor(detail: Detail, index: LibraryIndex): StylistSheet | null {
  if (detail.kind === 'cut') return buildStylistSheet({ kind: 'cut', detail }, undefined, undefined, SHOWN);
  if (detail.kind === 'colour') return buildStylistSheet({ kind: 'colour', detail, ...lookParts(index), assessment: null }, undefined, undefined, SHOWN);
  return null;
}

const pickSections = (sheet: StylistSheet, ids: readonly SheetSection['id'][]): DetailSection[] =>
  ids.flatMap((id) => sheet.sections.filter((s) => s.id === id));


function beardSections(d: BeardDetail): DetailSection[] {
  const zones = (Object.keys(t.beardZones) as (keyof typeof t.beardZones)[]).map((z) => ({ label: t.beardZones[z], value: guardWords(SHOWN.sheet, d.zones_mm[z][0], d.zones_mm[z][1]) }));
  const lengths = [...zones, { label: t.cheekLine, value: t.cheekLines[d.cheek_line] }, { label: t.neckline, value: t.necklines[d.neckline] }];
  const upkeep = [
    { label: t.trim, value: t.trimDays(d.upkeep.trim_days[0], d.upkeep.trim_days[1]) },
    { label: t.daily, value: t.dailyMinutes(d.upkeep.daily_minutes) },
    ...(d.upkeep.products.length > 0 ? [{ label: t.products, value: d.upkeep.products.join(', ') }] : []),
  ];
  return [{ id: 'lengths', heading: t.lengths, rows: lengths }, { id: 'upkeep', heading: t.upkeep, rows: upkeep }];
}

/** Lengths (with guard numbers), fade and upkeep for a cut; the colour plan for a look; zones and upkeep for a beard. */
export function detailSections(detail: Detail, sheet: StylistSheet | null): DetailSection[] {
  if (detail.kind === 'beard') return beardSections(detail);
  if (!sheet) return [];
  return pickSections(sheet, detail.kind === 'cut' ? ['lengths', 'fade', 'upkeep'] : ['colour']);
}

/** Each tag's line in `t.works`, read when it is shown, so it follows the language. */
const TAG_LINES = {
  recession_friendly: 'hairline',
  fine_hair_friendly: 'fine',
  thick_hair_friendly: 'thick',
  thinning_crown_friendly: 'crown',
} as const;

function cutWorks(d: CutDetail): string[] {
  const texture = (x: (typeof TEXTURES)[number]): string => en.explore.caption.textures[x];
  const good = TEXTURES.filter((x) => d.texture_fit[x].fit === 'good');
  const adapt = TEXTURES.flatMap((x) => {
    const fit = d.texture_fit[x];
    return fit.fit === 'adapt' && fit.note ? [t.works.adapt(texture(x), fit.note)] : [];
  });
  const densities = (['low', 'medium', 'high'] as const).filter((x) => d.density_fit[x].fit === 'good');
  const tags = (Object.keys(TAG_LINES) as (keyof typeof TAG_LINES)[]).filter((tag) => d.traits.tags.includes(tag));
  return [
    ...(good.length > 0 ? [t.works.textures(t.or(good.map(texture)))] : []),
    ...adapt,
    ...(densities.length > 0 && densities.length < 3 ? [t.works.density(t.or(densities.map((x) => t.densities[x])))] : []),
    ...tags.map((tag) => t.works[TAG_LINES[tag]]),
  ];
}

/** The "Works with your hair if…" lines, each finishing that sentence; a beard's say how long it needs to grow. */
export function worksWith(detail: Detail): { readonly heading: string; readonly lines: readonly string[]; readonly note: string | null } | null {
  if (detail.kind === 'cut') return { heading: t.worksIf, lines: cutWorks(detail), note: detail.strand_note };
  if (detail.kind === 'beard') {
    const [min, max] = detail.growth.weeks_needed;
    return { heading: t.worksIfBeard, lines: [t.works.growth(min, max)], note: detail.growth.note };
  }
  return null;
}

/** A cut's beard pairings, or a beard's cut pairings, in content order, keeping only those in the library. */
export function pairingsOf(detail: Detail, index: LibraryIndex): Pairing[] {
  const ids = detail.kind === 'cut' ? detail.pairs_with.beards : detail.kind === 'beard' ? detail.pairs_with.cuts : [];
  const kind = detail.kind === 'cut' ? 'beard' : 'cut';
  return ids.flatMap((id) => {
    const entry = index.entries.find((e) => e.id === id && e.kind === kind);
    return entry ? [{ kind: kind === 'cut' ? 'style' : 'beard', id, name: entry.name }] : [];
  });
}

/** The look as the prompt builder takes it; shades and techniques have no prompt. */
export function promptLookOf(detail: Detail): PromptLook | null {
  return detail.kind === 'cut' || detail.kind === 'colour' || detail.kind === 'beard'
    ? { id: detail.id, kind: detail.kind, name: english(detail).name, prompt_spec: detail.prompt_spec }
    : null;
}
