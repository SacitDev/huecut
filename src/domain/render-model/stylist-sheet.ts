/**
 * The stylist sheet view model: one cut, one colour look or the "Try together" pair on one sheet, with the library thumbnails, the
 * person's AI picture, the cut and colour details, the journey label, "About my hair" from `SHEET_FACTS` and the footer; plus the
 * plain text behind "Copy as text".
 */
import type { CutDetail, LookDetail, ShadeIndexEntry } from '../content/output.ts';
import type { JourneyRecord, Referral, Zone } from '../content/types.ts';
import type { JourneyLabel, View } from '../content/values.ts';
import { SHEET_FACTS, type Facts } from '../facts/registry.ts';
import type { Rect } from '../geometry/coords.ts';
import type { PictureId } from '../ids.ts';
import { EN, guardWords, needWords, type Copy, type SheetCopy } from './copy.ts';
import { answerWords } from './facts-copy.ts';
import { JPEG_EXPORT, type ExportSpec } from './face-card.ts';

export interface SheetCut {
  readonly kind: 'cut';
  readonly detail: CutDetail;
  /** What the cut does around the face, in the engine's own words, the app's own styling preference. */
  readonly framing?: string;
  /** Every limit the cut misses that the person may accept, in one sentence. */
  readonly tradeOffs?: string;
}
export type ShadeRef = Pick<ShadeIndexEntry, 'name' | 'level' | 'tone'>;
/** The engine's safety view of a look for this person; the engine's `Idea` fits as it is. */
export interface LookAssessment {
  readonly label: JourneyLabel | null;
  readonly journey: {
    readonly applied: readonly Pick<JourneyRecord, 'label' | 'because' | 'what_to_ask'>[];
    readonly dependsOn: readonly string[];
    readonly askHealth: boolean;
  } | null;
  readonly reminders: readonly string[];
  readonly referral: Pick<Referral, 'text'> | null;
}
export interface SheetLook {
  readonly kind: 'colour';
  readonly detail: LookDetail;
  /** Shades by id. A shade or technique the look names but these lack is broken content and throws. */
  readonly shades: Readonly<Record<string, ShadeRef>>;
  /** Technique names by technique id (the kebab-case trait value, `root-shadow`). */
  readonly techniques: Readonly<Record<string, string>>;
  readonly assessment: LookAssessment | null;
  /** The library model shown, the one matching the person; default the look's first. */
  readonly model?: string;
}
/** One cut, one colour look, or the "Try together" pair. */
export type SheetItems = SheetCut | SheetLook | readonly [SheetCut, SheetLook];
export interface SlotPicture { readonly pictureId: PictureId; readonly hairOnly: boolean }
/** The person's AI picture in the idea's (or the pair's) slot on the main photo. */
export interface SheetPictures { readonly ai: SlotPicture | null }

export interface SheetRow { readonly label: string; readonly value: string }
export type SheetSectionId = keyof SheetCopy['headings'];
export interface SheetSection { readonly id: SheetSectionId; readonly heading: string; readonly rows: readonly SheetRow[] }
/** `key` is the picture key in `content/pictures.json` (`<model-id>/<item-id>-<view>`); `rect` is card px, drawn whole. */
export interface SheetThumbnail { readonly itemId: string; readonly view: View; readonly key: string; readonly rect: Rect }
export interface StylistSheet {
  readonly title: string;
  readonly thumbnails: readonly SheetThumbnail[];
  readonly aiPicture: (SlotPicture & { readonly label: string; readonly rect: Rect }) | null;
  readonly sections: readonly SheetSection[];
  readonly footer: readonly string[];
  /** Card px: the pictures strip, the text flow the painter wraps, and the footer. */
  readonly layout: typeof STYLIST_SHEET_LAYOUT;
  readonly export: ExportSpec;
}

export const STYLIST_SHEET_LAYOUT = {
  pictures: { x: 120, y: 120, width: 1920, height: 720 },
  text: { x: 120, y: 900, width: 1920, height: 1560 },
  footer: { x: 120, y: 2500, width: 1920, height: 100 },
} as const satisfies Record<string, Rect>;
const PICTURE_GAP_PX = 24;
/** Library pictures are 3:4; AI pictures are drawn whole in the same frame. */
const PICTURE_ASPECT = 3 / 4;

type C = SheetCopy;
const row = (label: string, value: string | null | undefined): SheetRow[] => (value ? [{ label, value }] : []);
const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const known = <K extends keyof Facts>(facts: Facts | undefined, key: K): Facts[K] | undefined => facts?.[key];

function zoneText(z: Zone, c: C): string {
  if ('cm' in z) return c.cm(z.cm[0], z.cm[1]);
  return guardWords(c, z.guard_mm[0], z.guard_mm[1]);
}

function lengthRows(d: CutDetail, c: C): SheetRow[] {
  const zones = (['top', 'fringe', 'sides', 'back', 'nape'] as const).flatMap((k) => {
    const z = d.zones[k];
    return z ? row(c.zones[k], zoneText(z, c)) : [];
  });
  return [
    ...zones,
    ...row(c.zones.perimeter, d.perimeter.landmark ? c.landmarks[d.perimeter.landmark] : null),
    ...row(c.rows.neckline, d.neckline ? c.necklines[d.neckline] : null),
    ...row(c.rows.sideburns, d.sideburns),
    ...row(c.zones.basis, c.basisNote),
  ];
}

function fadeRows(d: CutDetail, c: C): SheetRow[] {
  if (!d.fade) return [];
  const kind = c.fadeKinds[d.fade.kind];
  return [
    ...row(c.rows.kind, d.fade.height ? `${c.fadeHeights[d.fade.height]} ${kind}` : capitalise(kind)),
    ...row(c.rows.start, guardWords(c, d.fade.start_mm)),
    ...row(c.rows.note, d.fade.note),
  ];
}

function fringeRows(d: CutDetail, c: C): SheetRow[] {
  if (!d.fringe) return [];
  return [
    ...row(c.headings.fringe, c.fringes[d.fringe.kind]),
    // A landmark the copy has no words for yet shows as itself, its underscores as spaces.
    ...row(c.rows.sits, d.fringe.landmark ? (c.fringeLandmarks[d.fringe.landmark] ?? d.fringe.landmark.replaceAll('_', ' ')) : null),
    ...row(c.rows.alsoWorks, d.fringe.options.map((o) => c.fringes[o]).join(', ')),
  ];
}

/** The fit and note for the person's texture; `mixed` shows the wavy and the curly line; unknown shows every note. */
function textureRows(d: CutDetail, facts: Facts | undefined, copy: Pick<Copy, 'sheet' | 'facts'>): SheetRow[] {
  const texture = known(facts, 'hair.texture')?.value;
  const all = ['straight', 'wavy', 'curly', 'coily'] as const;
  const shown = texture === undefined ? all.filter((t) => d.texture_fit[t].note) : texture === 'mixed' ? (['wavy', 'curly'] as const) : [texture];
  return shown.flatMap((t) => {
    const fit = d.texture_fit[t];
    return row(copy.sheet.textureFor(copy.facts['hair.texture'].values[t]), [copy.sheet.fits[fit.fit], fit.note].filter(Boolean).join('. '));
  });
}

/** The person's density fit when it is not plain good, then the cut's general density note. */
function densityText(d: CutDetail, facts: Facts | undefined, c: C): string {
  const density = known(facts, 'hair.density')?.value;
  const fit = density === undefined ? null : d.density_fit[density];
  const own = fit && fit.fit !== 'good' ? [c.fits[fit.fit], fit.note].filter(Boolean).join('. ') : null;
  return [own, d.density_note].filter(Boolean).join('. ');
}

/** Shrinkage for curly and coily hair (advisory); not shown for straight or wavy hair. */
function shrinkText(d: CutDetail, facts: Facts | undefined, c: C): string | null {
  const texture = known(facts, 'hair.texture')?.value;
  if (!d.shrinkage || texture === 'straight' || texture === 'wavy') return null;
  const [min, max] = texture === 'coily' ? d.shrinkage.coily_pct : d.shrinkage.curly_pct;
  return c.percent(min, max);
}

function hairRows(d: CutDetail, facts: Facts | undefined, copy: Pick<Copy, 'sheet' | 'facts'>): SheetRow[] {
  const c = copy.sheet;
  return [
    ...textureRows(d, facts, copy),
    ...row(c.rows.density, densityText(d, facts, c)),
    ...row(c.rows.strand, d.strand_note),
    ...row(c.rows.growth, d.growth.note),
    ...row(c.rows.whorl, known(facts, 'hair.crown_whorl')?.value === 'none' ? null : d.growth.whorl_note),
    ...row(c.rows.glasses, known(facts, 'look.glasses')?.value === 'none' ? null : d.glasses_note),
    ...row(c.rows.shrinkage, shrinkText(d, facts, c)),
  ];
}

function upkeepRows(d: CutDetail, c: C): SheetRow[] {
  const u = d.upkeep;
  return [
    ...row(c.rows.styling, c.minutes(u.styling_minutes[0], u.styling_minutes[1])),
    ...row(c.rows.trim, c.weeks(u.trim_weeks[0], u.trim_weeks[1])),
    ...row(c.rows.heatUse, c.heat[u.heat]),
    ...row(c.rows.products, u.products.join(', ')),
  ];
}

const section = (id: SheetSectionId, rows: readonly SheetRow[], c: C): SheetSection[] => (rows.length > 0 ? [{ id, heading: c.headings[id], rows }] : []);

function cutSections(cut: SheetCut, facts: Facts | undefined, copy: Pick<Copy, 'sheet' | 'facts'>): SheetSection[] {
  const c = copy.sheet;
  const d = cut.detail;
  return [
    ...section('lengths', lengthRows(d, c), c),
    ...section('fade', fadeRows(d, c), c),
    ...section('fringe', fringeRows(d, c), c),
    ...section('layers', row(c.rows.layers, d.traits.layers.map((l) => c.layers[l]).join(', ')), c),
    ...section('yourHair', [...hairRows(d, facts, copy), ...row(c.rows.framing, cut.framing), ...row(c.rows.tradeOff, cut.tradeOffs)], c),
    ...section('upkeep', upkeepRows(d, c), c),
    ...section('stylist', row(c.rows.notes, d.stylist), c),
    ...section('growOut', row(c.rows.notes, d.grow_out), c),
  ];
}

function colourRows(look: SheetLook, c: C): SheetRow[] {
  const shade = (id: string): string => {
    const s = look.shades[id];
    if (!s) throw new Error(`Look ${look.detail.id} names shade ${id}, which the sheet was not given`);
    return c.shade(s.name, s.level[0], s.level[1], c.tones[s.tone]);
  };
  const technique = (value: string): string => {
    const name = look.techniques[value.replaceAll('_', '-')];
    if (!name) throw new Error(`Look ${look.detail.id} names technique ${value}, which the sheet was not given`);
    return name;
  };
  const { base, placements, required_base_level: lighten, traits } = look.detail;
  return [
    ...row(c.rows.base, base.technique === 'none' ? c.ownBase : c.applied(technique(base.technique), shade(base.shade))),
    ...placements.flatMap((p) => row(c.regions[p.region], c.applied(technique(p.technique), shade(p.shade)))),
    ...row(c.rows.lightenFirst, lighten === null ? null : c.lightenTo(lighten)),
    ...row(c.rows.visits, c.weeks(traits.upkeep_weeks[0], traits.upkeep_weeks[1])),
  ];
}

/** The label with why and what to ask: the referral replaces it all; the health line ends "what to ask". */
function journeyRows(a: LookAssessment | null, c: C): SheetRow[] {
  if (!a) return [];
  if (a.referral) return [...row(c.rows.label, c.journeyLabels.needs_professional), ...row(c.rows.why, a.referral.text)];
  if (!a.label) return [];
  const records = (a.journey?.applied ?? []).filter((r) => r.label === a.label);
  const why = records.length > 0 ? [...new Set(records.map((r) => r.because))].join(' ') : (a.journey?.dependsOn.length ?? 0) > 0 ? c.openAnswers : c.noRecord;
  const ask = [...new Set(records.map((r) => r.what_to_ask)), ...(a.journey?.askHealth === false ? [] : [c.healthLine])].join(' ');
  return [
    ...row(c.rows.label, c.journeyLabels[a.label]),
    ...row(c.rows.why, why),
    ...row(c.rows.ask, ask),
    ...a.reminders.flatMap((r) => row(c.rows.reminder, r)),
  ];
}

/** A colour look's sections; after a referral only the referral stays, since its recipe and colourist notes would be instructions to colour. */
const lookSections = (look: SheetLook, c: C): SheetSection[] => look.assessment?.referral ? section('journey', journeyRows(look.assessment, c), c) : [
  ...section('colour', colourRows(look, c), c),
  ...section('journey', journeyRows(look.assessment, c), c),
  ...section('colourist', row(c.rows.notes, look.detail.stylist), c),
];

/** The person's own answers from the fixed list, then "What I need" in the AI pick prompt's own words; derived values are not answers. */
function aboutRows(facts: Facts | undefined, copy: Pick<Copy, 'facts' | 'prompts'>): SheetRow[] {
  const needs = needWords(facts, copy.prompts.needs);
  return [...SHEET_FACTS.flatMap((key) => {
    const fact = known(facts, key);
    if (fact?.source !== 'answered') return [];
    return row(copy.facts[key].label, answerWords(copy.facts, key, fact.value));
  }), ...row(copy.prompts.needs.label, needs.length > 0 ? needs.join('; ') : null)];
}

/** Library thumbnails, then the AI picture, side by side in the pictures strip, each drawn whole. */
function pictureSlots(entries: readonly Omit<SheetThumbnail, 'rect'>[], ai: SlotPicture | null, aiLabel: string): Pick<StylistSheet, 'thumbnails' | 'aiPicture'> {
  const strip = STYLIST_SHEET_LAYOUT.pictures;
  const count = entries.length + (ai ? 1 : 0);
  const width = Math.min((strip.width - (count - 1) * PICTURE_GAP_PX) / Math.max(1, count), strip.height * PICTURE_ASPECT);
  const left = strip.x + (strip.width - (count * width + (count - 1) * PICTURE_GAP_PX)) / 2;
  const rect = (i: number): Rect => ({ x: left + i * (width + PICTURE_GAP_PX), y: strip.y, width, height: strip.height });
  return {
    thumbnails: entries.map((e, i) => ({ ...e, rect: rect(i) })),
    aiPicture: ai ? { ...ai, label: aiLabel, rect: rect(entries.length) } : null,
  };
}

const cutThumbs = (d: CutDetail): Omit<SheetThumbnail, 'rect'>[] => d.images.views.map((view) => ({ itemId: d.id, view, key: `${d.images.model}/${d.id}-${view}` }));
function lookThumbs(look: SheetLook): Omit<SheetThumbnail, 'rect'>[] {
  const model = look.model ?? look.detail.images.models[0];
  const { id, images } = look.detail;
  return model ? [{ itemId: id, view: images.view, key: `${model}/${id}-${images.view}` }] : [];
}

/** The title, sections and thumbnails one part of the sheet adds. */
interface Part { readonly name: string; readonly sections: readonly SheetSection[]; readonly thumbs: readonly Omit<SheetThumbnail, 'rect'>[] }
const cutPart = (cut: SheetCut, facts: Facts | undefined, copy: Pick<Copy, 'sheet' | 'facts'>): Part =>
  ({ name: cut.detail.name, sections: cutSections(cut, facts, copy), thumbs: cutThumbs(cut.detail) });
const lookPart = (look: SheetLook, c: C): Part => ({ name: look.detail.name, sections: lookSections(look, c), thumbs: lookThumbs(look) });

/**
 * The sheet for one cut, one colour look or the "Try together" pair. `facts` adds the person's texture and density notes
 * and "About my hair"; `pictures` adds the AI picture from the slot.
 */
export function buildStylistSheet(items: SheetItems, facts?: Facts, pictures?: SheetPictures, copy: Pick<Copy, 'sheet' | 'facts' | 'footer' | 'prompts'> = EN): StylistSheet {
  const c = copy.sheet;
  const parts = 'kind' in items
    ? [items.kind === 'cut' ? cutPart(items, facts, copy) : lookPart(items, c)]
    : [cutPart(items[0], facts, copy), lookPart(items[1], c)];
  const [first, second] = parts;
  return {
    title: first && second ? c.pairTitle(first.name, second.name) : (first?.name ?? ''),
    sections: [...parts.flatMap((p) => p.sections), ...section('aboutMyHair', aboutRows(facts, copy), c)],
    ...pictureSlots(parts.flatMap((p) => p.thumbs), pictures?.ai ?? null, c.aiLabel),
    footer: [copy.footer.app, copy.footer.link], layout: STYLIST_SHEET_LAYOUT, export: JPEG_EXPORT,
  };
}

/** The sheet as plain text for "Copy as text": the title, each section's rows, and the footer. */
export function stylistSheetText(sheet: StylistSheet): string {
  const body = sheet.sections.flatMap((s) => [s.heading, ...s.rows.map((r) => `${r.label}: ${r.value}`), '']);
  return [sheet.title, '', ...body, sheet.footer.join(' ')].join('\n');
}
