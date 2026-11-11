/**
 * Build-derived traits and Lab targets. The check matches rules against these traits
 * and the build writes them, so both use this one module. sRGB to CIE L*a*b* lives here, at build time only.
 */
import type { Range } from '../../src/domain/facts/registry.ts';
import { TRAITS, type BuildTraits } from '../../src/domain/content/traits.ts';
import type { Lab, LabBands, LookLab, LookNeeds, ShadeLab, ShadeNeed } from '../../src/domain/content/output.ts';
import type { ColourLook, Haircut, Shade, Technique, Variant, Zone, Zones } from '../../src/domain/content/types.ts';
import { SWATCH_REGIONS, ZONES, type PerimeterLandmark, type SwatchRegion, type TechniqueValue } from '../../src/domain/content/values.ts';

// ── Colour ──

/** sRGB to XYZ (IEC 61966-2-1, 4-decimal matrix). The D65 white is the matrix's own row sums, so greys get a = b = 0. */
const M = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
] as const;
const WHITE = M.map((row) => row[0] + row[1] + row[2]);
const EPS = (6 / 29) ** 3;

const toLinear = (c8: number): number => {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const f = (t: number): number => (t > EPS ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);
/** Two decimals; `+ 0` turns -0 into 0. */
const round2 = (x: number): number => Math.round(x * 100) / 100 + 0;

/** `#rrggbb` to unrounded L*a*b*. */
export function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(Number.parseInt(hex.slice(i, i + 2), 16))) as [number, number, number];
  const [x, y, z] = M.map((row, i) => (row[0] * r + row[1] * g + row[2] * b) / (WHITE[i] ?? 1)) as [number, number, number];
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** The brightness-band offsets on L*: how far a shade's shadows and highlights sit from its swatch. */
const LAB_BAND_OFFSETS = { shadows: -15, mid: 0, light: 12 } as const;

/** Three brightness-band targets from one swatch colour: L* moved by the band offset (kept in 0-100), a* and b* kept. */
export function labBands(hex: string): LabBands {
  const [l, a, b] = hexToLab(hex);
  const at = (offset: number): Lab => [round2(Math.min(100, Math.max(0, l + offset))), round2(a), round2(b)];
  return { shadows: at(LAB_BAND_OFFSETS.shadows), mid: at(LAB_BAND_OFFSETS.mid), light: at(LAB_BAND_OFFSETS.light) };
}

export const shadeLab = (shade: Shade): ShadeLab =>
  Object.fromEntries(SWATCH_REGIONS.map((r) => [r, labBands(shade.swatch[r])])) as Record<SwatchRegion, LabBands>;

// ── Cuts ──

type LengthClass = BuildTraits<'cut'>['length_class'];

/** Perimeter landmark to length class, in the order of both lists; jaw and chin are both chin length. */
const LANDMARK_CLASS: Record<PerimeterLandmark, LengthClass> = {
  above_ear: 'very_short', ear: 'short', jaw: 'chin', chin: 'chin', collarbone: 'bob', shoulder: 'shoulder',
  shoulder_blade: 'long', mid_back: 'very_long', waist: 'very_long',
};

/** A zone in cm; a clipper guard in mm counts as mm / 10. */
const zoneCm = (z: Zone): Range => ('cm' in z ? z.cm : [z.guard_mm[0] / 10, z.guard_mm[1] / 10]);
const middle = (r: Range): number => (r[0] + r[1]) / 2;
const zonesOf = (zones: Zones): Zone[] => ZONES.flatMap((k) => (zones[k] ? [zones[k]] : []));

/**
 * `length_class`: `buzz` when every zone is a clipper guard, whatever its outline (a landmark never lifts a clipper cut out of
 * the buzz class); else the perimeter landmark when there is one; else `very_short` when no zone's middle reaches 5 cm, and `short` otherwise.
 */
export function lengthClass(cut: Pick<Haircut, 'zones' | 'perimeter'>): LengthClass {
  const zones = zonesOf(cut.zones);
  if (zones.every((z) => 'guard_mm' in z)) return 'buzz';
  if (cut.perimeter.landmark) return LANDMARK_CLASS[cut.perimeter.landmark];
  return Math.max(...zones.map((z) => middle(zoneCm(z)))) < 5 ? 'very_short' : 'short';
}

/** `top_length` from the middle of `zones.top`: under 2 cm, 2-5 cm, 5-10 cm, over 10 cm. */
export function topLength(zones: Zones): BuildTraits<'cut'>['top_length'] {
  const cm = middle(zoneCm(zones.top));
  return cm < 2 ? 'very_short' : cm < 5 ? 'short' : cm <= 10 ? 'medium' : 'long';
}

/** `sides` from the fade: a plain fade is named by its height; no fade is `none`. */
export function sides(fade: Haircut['fade']): BuildTraits<'cut'>['sides'] {
  if (!fade) return 'none';
  switch (fade.kind) {
    case 'fade': return `${fade.height ?? fail('a plain fade names its height')}_fade`;
    case 'skin': case 'bald': case 'drop': return `${fade.kind}_fade`;
    case 'taper': case 'scissor_taper': case 'undercut': return fade.kind;
  }
}

/** Fades that take hair to the skin or close to it wherever they sit, so their start counts whatever the zones say. */
const EXPOSING_FADES: ReadonlySet<string> = new Set(['fade', 'skin', 'bald', 'drop', 'undercut']);
/** A nape undercut, hidden under the hair but shown when it is tied up, clipped to about a number 1 (3 mm). */
const NAPE_UNDERCUT_MM = 3;

/**
 * The shortest exposed length in mm, which scars to cover are judged by: the lower end of the top, side, back and nape zones; the start of a fade, skin, bald,
 * drop or undercut; a taper's start where it is a band cut into long sides (a hairline taper is already in the zones); a nape undercut.
 */
export function scalpMm(cut: Pick<Haircut, 'zones' | 'fade'> & { readonly traits: Pick<Haircut['traits'], 'nape_style'> }): number {
  const { zones, fade } = cut;
  const parts = [zones.top, zones.sides, zones.back, zones.nape].flatMap((z) => (z ? [zoneCm(z)[0] * 10] : []));
  const band = fade !== null && (EXPOSING_FADES.has(fade.kind) || (zones.sides !== null && zoneCm(zones.sides)[0] >= 10));
  return round2(Math.min(...parts, ...(band ? [fade.start_mm] : []), ...(cut.traits.nape_style === 'undercut' ? [NAPE_UNDERCUT_MM] : [])));
}

/**
 * The length the hanging zones keep: the shortest upper end of the back and, where a salon cut keeps them long, the sides;
 * barbering sides are short by design. One length class misses a mullet's short back on long hair, so growing out reads this too.
 */
function hangCm(cut: Pick<Haircut, 'zones' | 'collections'>): number {
  const { zones } = cut;
  const hanging = [zones.back, ...(cut.collections.includes('salon') ? [zones.sides] : [])].flatMap((z) => (z ? [zoneCm(z)[1]] : []));
  // With no back or sides recorded, the top is all that shows.
  return round2(hanging.length > 0 ? Math.min(...hanging) : zoneCm(zones.top)[1]);
}

export const deriveCutTraits = (cut: Pick<Haircut, 'zones' | 'perimeter' | 'fade' | 'traits' | 'collections'>): BuildTraits<'cut'> => ({
  length_class: lengthClass(cut),
  top_length: topLength(cut.zones),
  top_cm: zoneCm(cut.zones.top),
  scalp_mm: scalpMm(cut),
  hang_cm: hangCm(cut),
  sides: sides(cut.fade),
});

/** Feasibility's required length: the lower end of the longest zone (largest upper end), in cm. */
export function requiredCm(zones: Zones): number {
  const longest = zonesOf(zones).map(zoneCm).reduce((a, b) => (b[1] > a[1] ? b : a));
  return round2(longest[0]);
}

/** A variant as a whole cut: its changes laid over the cut, its own id, name and prompt; no variants of its own. */
export function applyVariant(cut: Haircut, variant: Variant): Haircut {
  const c = variant.changes;
  return {
    ...cut,
    id: variant.id,
    name: variant.name,
    aliases: [],
    prompt_spec: variant.prompt_spec,
    client: variant.client ?? cut.client,
    zones: { ...cut.zones, ...c.zones },
    perimeter: c.perimeter ?? cut.perimeter,
    fade: c.fade === undefined ? cut.fade : c.fade === null ? null : ({ ...cut.fade, ...c.fade } as Haircut['fade']),
    fringe: c.fringe === undefined ? cut.fringe : c.fringe,
    neckline: c.neckline === undefined ? cut.neckline : c.neckline,
    traits: { ...cut.traits, ...c.traits },
    variants: [],
  };
}

// ── Colour looks ──

/** A technique record's id is the kebab-case form of its trait value. */
export const techniqueId = (value: string): string => value.replaceAll('_', '-');

export interface LookParts {
  readonly shades: ReadonlyMap<string, Shade>;
  readonly techniques: ReadonlyMap<string, Technique>;
}

const inOrder = <V extends string>(order: readonly V[], picked: Iterable<V>): V[] => {
  const set = new Set(picked);
  return order.filter((v) => set.has(v));
};
const LIGHTENING = TRAITS.colour.lightening.values;

/** The look's shades and techniques; throws on a reference the check has not resolved. */
function partsOf(look: ColourLook, parts: LookParts) {
  const shade = (id: string): Shade => parts.shades.get(id) ?? fail(`${look.id}: unknown shade ${id}`);
  const technique = (v: string): Technique => parts.techniques.get(techniqueId(v)) ?? fail(`${look.id}: no technique record for ${v}`);
  const ownBase = look.base.technique === 'none';
  const applied = [...(ownBase ? [] : [look.base.shade]), ...look.placements.map((p) => p.shade)].map(shade);
  const techniqueValues = inOrder<TechniqueValue>(TRAITS.colour.technique.values, [
    ...(ownBase ? [] : [look.base.technique as TechniqueValue]), ...look.placements.map((p) => p.technique),
  ]);
  return { base: shade(look.base.shade), all: [look.base.shade, ...look.placements.map((p) => p.shade)].map(shade), applied, techniqueValues, techniques: techniqueValues.map(technique) };
}

function fail(message: string): never {
  throw new Error(message);
}

/** Placement regions woven from the root, so they colour the regrowth too; every region but `root` reaches the lengths. */
const FROM_ROOT: ReadonlySet<string> = new Set(['root', 'highlights', 'lowlights', 'face_frame']);

/** A placement that lightens pieces: a placement technique with lightener, lighter than the hair it sits on whatever its shade. */
const isPiece = (p: ColourLook['placements'][number], parts: LookParts): boolean => {
  const t = parts.techniques.get(techniqueId(p.technique));
  return t?.category === 'placement' && t.lightening !== 'none';
};

/** A pre-lightened region takes any shade. */
const LIGHTENED: Technique['lifts'] = { natural: 9, coloured: 9 };

/**
 * Every shade a look applies where `reaches` holds, each with the lift of the technique that puts it there: the applied
 * base; the placements there; and the required base level with a base or on the lengths, where the hair is lightened first. A `none`
 * base keeps the person's own colour: `base.on` is only the base the look was designed and pictured on, never a target. Lighter pieces
 * and the lightened level never take hair down.
 */
function needsWhere(look: ColourLook, parts: LookParts, reaches: (region: string) => boolean, lengths: boolean): ShadeNeed[] {
  const level = (id: string): Range => (parts.shades.get(id) ?? fail(`${look.id}: unknown shade ${id}`)).level;
  const lifts = (v: string): Technique['lifts'] => (parts.techniques.get(techniqueId(v)) ?? fail(`${look.id}: no technique record for ${v}`)).lifts;
  const placed = look.placements.filter((p) => reaches(p.region));
  const lightened = look.required_base_level !== null && (lengths || look.base.technique !== 'none');
  const need = (shade: string, by: Technique['lifts'], darkens: boolean): ShadeNeed => ({ level: level(shade), lifts: lightened ? LIGHTENED : by, darkens });
  const base = look.base.technique !== 'none' ? need(look.base.shade, lifts(look.base.technique), true) : null;
  return [
    ...(base ? [base] : []),
    ...placed.map((p) => need(p.shade, lifts(p.technique), !isPiece(p, parts))),
    ...(lightened ? [{ level: [look.required_base_level, look.required_base_level] as const, lifts: LIGHTENED, darkens: false }] : []),
  ];
}

/** The shades a look needs at the roots and on the lengths, each judged on its own by the engine and the check. */
export const lookNeeds = (look: ColourLook, parts: LookParts): LookNeeds =>
  ({ roots: needsWhere(look, parts, (r) => FROM_ROOT.has(r), false), lengths: needsWhere(look, parts, (r) => r !== 'root', true) });

/** The deepest and lightest levels of a region's needs: the deepest over those that take hair down, else over all; `[0, 0]` for none. */
function levelsOf(needs: readonly ShadeNeed[]): Range {
  if (needs.length === 0) return [0, 0];
  const darkening = needs.filter((n) => n.darkens);
  return [Math.min(...(darkening.length > 0 ? darkening : needs).map((n) => n.level[0])), Math.max(...needs.map((n) => n.level[1]))];
}

/**
 * The colour-look traits: family and warmth from the base shade; tone over every shade in the look; technique over the
 * base (unless `none`) and the placements; target level over the applied shades and the required base level; root and
 * lengths levels from what each region needs. Upkeep is the soonest revisit of its techniques; lightening the most of its
 * techniques, or `always` when the hair is lightened first.
 */
export function deriveLookTraits(look: ColourLook, parts: LookParts): BuildTraits<'colour'> {
  const p = partsOf(look, parts);
  const needs = lookNeeds(look, parts);
  const most = Math.max(...p.techniques.map((t) => LIGHTENING.indexOf(t.lightening)), 0);
  const top = Math.max(...p.applied.map((s) => s.level[1]), look.required_base_level ?? 0);
  if (top < 1) fail(`${look.id}: the look applies no shade`);
  return {
    family: p.base.family,
    warmth: p.base.warmth,
    tone: inOrder(TRAITS.colour.tone.values, p.all.map((s) => s.tone)),
    technique: p.techniqueValues,
    base_technique: look.base.technique,
    technique_category: inOrder(TRAITS.colour.technique_category.values, p.techniques.map((t) => t.category)),
    regions: inOrder(TRAITS.colour.regions.values, look.placements.map((pl) => pl.region)),
    lightening: look.required_base_level !== null ? 'always' : (LIGHTENING[most] ?? 'none'),
    lighter_pieces: look.placements.some((pl) => isPiece(pl, parts)),
    grey_effect: look.grey,
    prelightening: look.required_base_level !== null,
    target_level: top,
    root_levels: levelsOf(needs.roots),
    lengths_levels: levelsOf(needs.lengths),
    upkeep_weeks: [Math.min(...p.techniques.map((t) => t.revisit_weeks[0])), Math.min(...p.techniques.map((t) => t.revisit_weeks[1]))],
    vivid: p.applied.some((s) => s.vivid),
    salon_only: p.techniques.some((t) => t.salon_only),
  };
}

/**
 * Lab targets per region: the first placement in a region wins, also over a `none` base; an uncovered region
 * takes the base shade's swatch, or keeps the person's own colour (`null`) with a `none` base.
 */
export function lookLab(look: ColourLook, parts: LookParts): LookLab {
  const target = (region: SwatchRegion): LabBands | null => {
    const id = look.placements.find((pl) => pl.region === region)?.shade ?? (look.base.technique === 'none' ? null : look.base.shade);
    const shade = id === null ? null : (parts.shades.get(id) ?? fail(`${look.id}: unknown shade ${id}`));
    return shade ? labBands(shade.swatch[region]) : null;
  };
  return { root: target('root'), mids: target('mids'), ends: target('ends') };
}
