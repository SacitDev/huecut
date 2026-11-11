/**
 * What the person said, checked on every idea an automatic list shows: a stated colour direction or grey goal, a
 * referral, and the cut limits never relaxed. Read from the library's own records (placements by region, shade levels, the
 * authored grey effect, zones in cm and mm, fit flags), never from the engine's per-person traits, so a wrong trait cannot pass it.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyVariant } from '../../scripts/content/derive.ts';
import type { Bands, ColourLook, Fit, Haircut, Shade, Technique, Zone } from '../../src/domain/content/types.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import type { Idea, Recommendation } from '../../src/domain/engine/recommend.ts';

/** One shown idea against one thing the person said. */
export interface Breach {
  readonly id: string;
  readonly kind: 'eligibility' | 'referral' | 'prompt' | 'label' | 'manual' | 'beard' | 'capability' | 'direction' | 'grey_goal' | 'grow_out' | 'scars' | 'top_length' | 'tie_back' | 'fringe' | 'wash_and_go' | 'texture' | 'wish';
  readonly why: string;
}
type Kind = Breach['kind'];
type Range = readonly [number, number];

/** Regions woven from the root, so they colour the regrowth as well as the lengths. */
const FROM_ROOT = new Set(['root', 'highlights', 'lowlights', 'face_frame']);
const POSITION: Readonly<Record<string, number>> = { buzz: 0, very_short: 1, short: 2, chin: 3, bob: 4, shoulder: 4, long: 5, very_long: 6 };
const LANDMARK: Readonly<Record<string, string>> = { above_ear: 'very_short', ear: 'short', jaw: 'chin', chin: 'chin', collarbone: 'bob', shoulder: 'shoulder', shoulder_blade: 'long', mid_back: 'very_long', waist: 'very_long' };
/** The top lengths each answer names, in cm (clipper length, up to about 5, about 5-10, over 10). */
const TOP: Readonly<Record<string, Range>> = { very_short: [0, 2], short: [2, 5], medium: [5, 10], long: [10, 100] };
/** What each grey goal accepts of a look's authored grey effect. */
const GREY_OK: Readonly<Record<string, readonly string[]>> = { cover: ['covers'], blend: ['blends', 'tints'], embrace: ['shows', 'blends', 'silver'], silver: ['shows', 'blends', 'silver'] };

const json = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const cm = (z: Zone): Range => ('cm' in z ? z.cm : [z.guard_mm[0] / 10, z.guard_mm[1] / 10]);
/** An answer the person gave, never a measured or derived value. */
const said = (f: Facts, k: string): unknown => (f[k as keyof Facts]?.source === 'answered' ? f[k as keyof Facts]?.value : undefined);

/** The library's own records, read from one content folder. */
interface Library {
  readonly shades: ReadonlyMap<string, Shade>; readonly techniques: ReadonlyMap<string, Technique>; readonly looks: ReadonlyMap<string, ColourLook>;
  readonly cuts: ReadonlyMap<string, Haircut>; readonly beards: ReadonlySet<string>;
  /** The person's length classes in stretched cm. */
  readonly bands: Bands['current_length_cm'];
}

function libraryOf(dir: string): Library {
  const cuts = new Map<string, Haircut>();
  for (const f of readdirSync(join(dir, 'haircuts'))) {
    for (const c of json(join(dir, 'haircuts', f)) as Haircut[]) for (const x of [c, ...c.variants.map((v) => applyVariant(c, v))]) cuts.set(x.id, x);
  }
  return {
    shades: new Map((json(join(dir, 'colours', 'shades.json')) as Shade[]).map((s) => [s.id, s])),
    techniques: new Map((json(join(dir, 'colours', 'techniques.json')) as Technique[]).map((t) => [t.id.replaceAll('-', '_'), t])),
    looks: new Map((json(join(dir, 'colours', 'looks.json')) as ColourLook[]).map((l) => [l.id, l])),
    cuts,
    beards: new Set((json(join(dir, 'beards.json')) as { readonly id: string }[]).map((b) => b.id)),
    bands: (json(join(dir, 'bands.json')) as Bands).current_length_cm,
  };
}

// ── Colour: each region on its own, each shade it needs on its own ──

/** One shade a region needs, from the records: its levels, how far its technique lifts this hair, and whether it may take hair down. */
interface Need { readonly level: Range; readonly lift: number; readonly darkens: boolean }
/** One region: its level now (`undefined` while unknown, or while the history decides the lengths' lift and is not said) and its needs. */
interface Region { readonly now: number | undefined; readonly needs: readonly Need[] }

/** A look read against what the person said. */
interface LookCase {
  readonly look: ColourLook; readonly way: string | undefined; readonly goal: string | undefined; readonly history: readonly string[];
  readonly natural: number | undefined; readonly used: readonly string[]; readonly pieces: boolean; readonly lightener: boolean;
  readonly lifts: boolean; readonly grey: number | undefined;
  readonly vivid: boolean; readonly family: string | undefined; readonly regions: readonly Region[];
  /** The level of the lengths, the colour worn, when said: known even while their lift is not. */
  readonly worn: number | undefined;
}

/** Lightener lifts as far as a look needs. */
const LIGHTENER = 9;

/**
 * The shades a region needs, read from the look, shade and technique records: the applied base; the placements there; the level the hair
 * is lightened to first. A `none` base keeps the person's own colour, which needs nothing (`base.on` is the base it was pictured
 * on). `natural` says which lift of each technique record applies: never-coloured hair, or coloured.
 */
function needsOf(look: ColourLook, lib: Library, root: boolean, natural: boolean): Need[] {
  const level = (id: string): Range => lib.shades.get(id)?.level ?? [0, 0];
  const tech = (t: string): Technique | undefined => lib.techniques.get(t);
  const liftOf = (t: string): number => (natural ? tech(t)?.lifts.natural : tech(t)?.lifts.coloured) ?? 0;
  const piece = (t: string): boolean => tech(t)?.category === 'placement' && tech(t)?.lightening !== 'none';
  const placed = look.placements.filter((p) => (root ? FROM_ROOT.has(p.region) : p.region !== 'root'));
  const lightened = look.required_base_level !== null && (!root || look.base.technique !== 'none');
  const need = (shade: string, lift: number, darkens: boolean): Need => ({ level: level(shade), lift: lightened ? LIGHTENER : lift, darkens });
  const base = look.base.technique !== 'none' ? need(look.base.shade, liftOf(look.base.technique), true) : null;
  return [
    ...(base ? [base] : []), ...placed.map((p) => need(p.shade, liftOf(p.technique), !piece(p.technique))),
    ...(lightened ? [{ level: [look.required_base_level, look.required_base_level] as const, lift: LIGHTENER, darkens: false }] : []),
  ];
}

/** Never-coloured lengths by the history the person gave; with no history given, `virgin` names the case being judged. */
const virginLengths = (history: readonly string[], virgin: boolean): boolean => (history.length > 0 ? history.length === 1 && history[0] === 'none' : virgin);

function lookCase(look: ColourLook, f: Facts, lib: Library, virgin = false): LookCase {
  const history = (said(f, 'hair.chemical_history') as string[] | undefined) ?? [];
  const natural = said(f, 'colour.natural_level') as number | undefined;
  const lengths = (said(f, 'colour.current_level_lengths') as number | undefined) ?? (history.length === 1 && history[0] === 'none' ? natural : undefined);
  const tech = (t: string): Technique | undefined => lib.techniques.get(t);
  const used = [...(look.base.technique === 'none' ? [] : [look.base.technique]), ...look.placements.map((p) => p.technique)];
  const family = (id: string): string | undefined => lib.shades.get(id)?.family;
  return {
    look, way: said(f, 'pref.colour_direction') as string | undefined, goal: said(f, 'colour.grey_goal') as string | undefined, history, natural, used,
    pieces: look.placements.some((p) => tech(p.technique)?.category === 'placement' && tech(p.technique)?.lightening !== 'none'),
    lightener: look.required_base_level !== null || used.some((t) => tech(t)?.lightening === 'always'),
    lifts: look.required_base_level !== null || used.some((t) => tech(t)?.lightening !== 'none'), grey: said(f, 'colour.grey_percent') as number | undefined,
    vivid: look.base.technique === 'vivid_all_over' || [look.base.shade, ...look.placements.map((p) => p.shade)].some((s) => lib.shades.get(s)?.vivid === true),
    family: family(look.base.shade),
    // The regrowth at the roots has never been coloured.
    regions: [{ now: natural, needs: needsOf(look, lib, true, true) }, { now: lengths, needs: needsOf(look, lib, false, virginLengths(history, virgin)) }], worn: lengths,
  };
}

const known = (x: LookCase): readonly Region[] => x.regions.filter((r) => r.now !== undefined);
const allKnown = (x: LookCase): boolean => known(x).length === x.regions.length;
const treated = (r: Region): boolean => r.needs.length > 0;
/** Each need's highest level on this hair: its lightest, or the hair's level plus its lift if that is lower. */
const endOf = (n: Need, now: number): number => Math.min(n.level[1], now + n.lift);
/** The hair takes a shade when its deepest level is within the shade's lift of the hair. */
const takes = (n: Need, now: number): boolean => n.level[0] <= now + n.lift;
/**
 * Whether every shade a region needs can show, or, for a look that shows the person's own grey, finds grey where the hair cannot
 * take it; `undefined` while the level, or for such a look the grey amount, is not said.
 */
function shows(x: LookCase, r: Region): boolean | undefined {
  const now = r.now;
  if (!treated(r)) return true;
  if (now === undefined) return undefined;
  if (r.needs.every((n) => takes(n, now))) return true;
  return x.look.grey !== 'shows' ? false : x.grey === undefined ? undefined : x.grey > 0;
}
/** The levels a region shows: each shade the hair takes up to where it ends, any other as itself (on grey, if at all). */
const ends = (r: Region): readonly number[] => r.needs.flatMap((n) => (r.now !== undefined && takes(n, r.now) ? [n.level[0], endOf(n, r.now)] : [...n.level]));
/** The highest level a region ends at. */
const topOf = (r: Region): number => Math.max(...r.needs.map((n) => endOf(n, r.now ?? 0)), 0);
const lift = (r: Region): number => (treated(r) ? topOf(r) : 0) - (r.now ?? 0);
const lowOf = (r: Region): number => Math.min(...(r.needs.some((n) => n.darkens) ? r.needs.filter((n) => n.darkens) : r.needs).map((n) => n.level[0]));
const darken = (r: Region): number => (treated(r) ? Math.max(0, (r.now ?? 0) - lowOf(r)) : 0);
const sameDepth = (x: LookCase): boolean => x.way === 'tone' || x.way === 'refresh';
/** The levels a region ends away from `ref`, up or down; where the hair cannot take a shade it stays as it is. */
const away = (r: Region, ref: number): number =>
  (!treated(r) ? 0 : r.now !== undefined && !r.needs.every((n) => takes(n, r.now ?? 0)) ? Math.abs(r.now - ref) : Math.max(0, topOf(r) - ref, ref - lowOf(r)));
/**
 * Off the depth kept: the lengths two or more levels from their own; the roots two or more from both the natural level and,
 * when the lengths' level is known, the colour worn on them, so a retouch to the colour worn keeps the depth.
 */
function offDepth(x: LookCase): boolean {
  const [roots, lengths] = x.regions;
  if (!roots || !lengths) return false;
  const refs = [roots.now, x.worn].filter((l): l is number => l !== undefined);
  return (lengths.now !== undefined && away(lengths, lengths.now) >= 2) || (roots.now !== undefined && Math.min(...refs.map((ref) => away(roots, ref))) >= 2);
}
/** Grey on show (embrace, silver): the natural level is the darkest strands, so only a big lightening is far from it. */
const greyShown = (x: LookCase): boolean => x.goal === 'embrace' || x.goal === 'silver';
const far = (x: LookCase, by: number): boolean => x.natural !== undefined && x.regions.some((r) => ends(r).some((l) => Math.abs(l - (x.natural ?? 0)) > by));
/** Not darker: a treated region ends lighter, or all of them are known and none ends a level or more darker. */
const notDarker = (x: LookCase): boolean =>
  known(x).some((r) => treated(r) && lift(r) >= 1) || (allKnown(x) && x.regions.filter(treated).every((r) => lift(r) >= 0));

/** Each colour check: the kind of limit and, when the look breaks it, why. */
const COLOUR: readonly (readonly [Kind, (x: LookCase) => string | false])[] = [
  ['capability', (x) => x.regions.some((r) => shows(x, r) === false) && 'a shade lighter than its technique can take the hair it lands on'],
  ['direction', (x) => x.way === 'lighter' && !x.lifts && 'lighter: nothing in it lightens'],
  ['direction', (x) => x.way !== undefined && x.way !== 'vivid' && x.vivid && 'a bright colour not asked for'],
  ['direction', (x) => x.way === 'darker' && (x.pieces || x.lightener) && 'darker: lightens some hair'],
  ['direction', (x) => x.way === 'darker' && notDarker(x) && 'darker: lifts a region or ends none darker'],
  ['direction', (x) => x.way === 'tone' && x.pieces && 'tone: adds lighter pieces'],
  // A refresh keeps what the hair has: lighter pieces only where the history says it has highlights; an unknown history is not judged.
  ['direction', (x) => x.way === 'refresh' && x.pieces && x.history.length > 0 && !x.history.includes('highlights') && 'refresh: adds lighter pieces'],
  ['direction', (x) => sameDepth(x) && offDepth(x) && 'same depth: a region two or more levels from the depth kept'],
  ['direction', (x) => x.way === 'natural' && (x.pieces || x.vivid) && 'natural: lighter pieces or a bright colour'],
  ['direction', (x) => x.way === 'natural' && !greyShown(x) && far(x, 1) && 'natural: a level far from the natural one'],
  ['direction', (x) => x.way === 'natural' && greyShown(x) && x.lightener && far(x, 3) && 'natural with grey on show: lightened far from the natural level'],
  ['direction', (x) => x.way === 'lighter' && x.used.includes('lowlights') && 'lighter: adds darker pieces'],
  ['direction', (x) => x.way === 'lighter' && allKnown(x) && known(x).every((r) => lift(r) <= 0) && 'lighter: lifts nothing'],
  ['direction', (x) => x.way === 'lighter' && known(x).some((r) => darken(r) >= 2) && 'lighter: two or more levels darker'],
  ['direction', (x) => x.way === 'grey' && x.look.grey === 'shows' && 'grey: leaves the grey as it is'],
  ['direction', (x) => x.way === 'vivid' && !x.vivid && 'bright: not bright'],
  ['grey_goal', (x) => x.goal !== undefined && GREY_OK[x.goal] !== undefined && !GREY_OK[x.goal]?.includes(x.look.grey) && `${x.goal}: the look ${x.look.grey} grey`],
  ['grey_goal', (x) => x.goal === 'silver' && x.look.grey === 'shows' && x.family !== 'grey_silver' && 'silver: a coloured look that only leaves grey showing'],
  // No grey means no grey service, whether a direction was given or not; asking for grey cover with none is a conflict, left alone.
  ['grey_goal', (x) => x.grey === 0 && x.way !== 'grey' && x.used.some((t) => t === 'grey_coverage' || t === 'grey_blending') && 'no grey: a grey service'],
];

/** Artificial colour in the lengths, which dye cannot lift. */
const DYED = ['home_dye', 'home_dark_dye', 'salon_colour', 'vivid', 'colour_remover'];

/** What makes a colourist's label mandatory, judged on each region whose level is known: the reason when it holds. */
const PROFESSIONAL: readonly ((x: LookCase, f: Facts, most: number, lengths: Region) => string | false)[] = [
  (_x, _f, most) => most >= 5 && 'a lift of five levels or more',
  (x, _f, most) => most >= 1 && x.history.some((h) => h === 'relaxer_perm' || h === 'keratin') && 'lightener on straightened or permed hair',
  (_x, f, most) => most >= 1 && said(f, 'hair.condition') === 'damaged' && 'lightener on damaged hair',
  (x, _f, _m, lengths) => lengths.now !== undefined && lift(lengths) >= 1 && x.history.some((h) => DYED.includes(h)) && 'lighter over dyed lengths',
  (_x, _f, _m, lengths) => lengths.now !== undefined && lengths.now >= 8 && darken(lengths) >= 4 && 'a much darker shade over near-white lengths',
];

/** Why a colourist must do this look for this person; `false` when nothing requires it. */
function professionalReason(x: LookCase, f: Facts): string | false {
  const lifts = known(x).map(lift);
  const most = lifts.length > 0 ? Math.max(...lifts) : -9;
  const lengths = x.regions[1] ?? { now: undefined, needs: [] };
  return PROFESSIONAL.map((p) => p(x, f, most, lengths)).find((why) => why !== false) ?? false;
}

/** The safety answers that call for a referral instead of any colour idea, read from the answers, never from the engine. */
function referred(f: Facts): boolean {
  const history = (said(f, 'hair.chemical_history') as string[] | undefined) ?? [];
  const type = said(f, 'colour.henna_type');
  return ['mild', 'serious'].includes(String(said(f, 'safety.dye_reaction'))) || said(f, 'safety.henna_tattoo') === true || said(f, 'safety.scalp_irritation') === 'now'
    || history.includes('henna_compound') || type === 'compound' || (history.includes('henna_plant') && type === undefined);
}

// ── Cuts ──

/** A cut read against what the person said. */
interface CutCase {
  readonly cut: Haircut; readonly f: Facts; readonly clipper: boolean; readonly cls: string; readonly shorter: boolean; readonly shortest: number; readonly fits: readonly Fit[];
  /** A visible zone the cut leaves shorter than the hair is now, by its own cm. */
  readonly zoneShorter: string | null;
}

/** The answers for length, shortest first; from the shoulder down the back and sides hang at the length too. */
const LENGTHS = ['very_short', 'short', 'chin', 'shoulder', 'long', 'very_long'] as const;

/**
 * The first visible zone whose longest end is below where it is now: the top below the band of the stretched length; the back and a
 * salon cut's sides below it on hair to the shoulder or beyond, and below the band one class shorter on shorter hair (the head's shape).
 */
function zoneShorter(cut: Haircut, f: Facts, bands: Bands['current_length_cm']): string | null {
  const now = said(f, 'hair.current_length') as (typeof LENGTHS)[number] | undefined;
  if (now === undefined) return null;
  const at = LENGTHS.indexOf(now);
  const hangs = bands[at >= LENGTHS.indexOf('shoulder') ? now : (LENGTHS[at - 1] ?? now)][0];
  const zones: readonly (readonly [string, Zone | null, number])[] = [
    ['top', cut.zones.top, bands[now][0]], ['back', cut.zones.back, hangs], ...(cut.collections.includes('salon') ? [['sides', cut.zones.sides, hangs] as const] : []),
  ];
  // A clipped part (under 2 cm, fades and undercuts included) on hair to the chin or beyond takes length there too.
  if (at >= LENGTHS.indexOf('chin') && shortestMm(cut) < 20) return 'clipped part';
  return zones.find(([, z, floor]) => z !== null && cm(z)[1] < floor)?.[0] ?? null;
}

/** The length class from the cut's own zones: clipper all over is a buzz cut, whatever its outline; else its landmark, else its zones. */
function classOf(cut: Haircut): { readonly clipper: boolean; readonly cls: string } {
  const zones = [cut.zones.top, cut.zones.fringe, cut.zones.sides, cut.zones.back, cut.zones.nape].flatMap((z) => (z ? [z] : []));
  const clipper = zones.every((z) => 'guard_mm' in z);
  const zoneClass = Math.max(...zones.map((z) => (cm(z)[0] + cm(z)[1]) / 2)) < 5 ? 'very_short' : 'short';
  return { clipper, cls: clipper ? 'buzz' : cut.perimeter.landmark ? (LANDMARK[cut.perimeter.landmark] ?? 'short') : zoneClass };
}

/** Where the hair is now for this class: a landmark compares with where the hair rests (curls), a zone class with the stretched length. */
function nowFor(f: Facts, cls: string): string | undefined {
  const stretched = said(f, 'hair.current_length') as string | undefined;
  const resting = said(f, 'hair.resting_length') as string | undefined;
  const sits = resting !== undefined && stretched !== undefined && (POSITION[resting] ?? 0) <= (POSITION[stretched] ?? 0) ? resting : stretched;
  return ['buzz', 'very_short', 'short'].includes(cls) ? stretched : sits;
}

function cutCase(cut: Haircut, f: Facts, bands: Bands['current_length_cm']): CutCase {
  const { clipper, cls } = classOf(cut);
  const now = nowFor(f, cls);
  const texture = said(f, 'hair.texture') as string | undefined;
  const fits = texture === undefined ? [] : texture === 'mixed' ? [cut.texture_fit.wavy, cut.texture_fit.curly] : [cut.texture_fit[texture as 'straight']];
  return {
    cut, f, clipper, cls, fits, shorter: now !== undefined && (POSITION[cls] ?? 0) < (POSITION[now] ?? 0),
    shortest: shortestMm(cut), zoneShorter: zoneShorter(cut, f, bands),
  };
}

/**
 * The shortest exposed length in mm, from the cut's own record: the top, sides, back and nape; the start of a fade, skin, bald, drop or
 * undercut; a taper cut as a band into long sides; a nape undercut at a number 1.
 */
function shortestMm(cut: Haircut): number {
  const zones = [cut.zones.top, cut.zones.sides, cut.zones.back, cut.zones.nape].flatMap((z) => (z ? [cm(z)[0] * 10] : []));
  const fade = cut.fade;
  const band = fade !== null && (['fade', 'skin', 'bald', 'drop', 'undercut'].includes(fade.kind) || (cut.zones.sides !== null && cm(cut.zones.sides)[0] >= 10));
  return Math.min(...zones, ...(fade !== null && band ? [fade.start_mm] : []), ...(cut.traits.nape_style === 'undercut' ? [3] : []));
}

const answer = (x: CutCase, k: string): unknown => said(x.f, k);
const wantsLength = (x: CutCase): boolean => ((answer(x, 'hair.style_interest') as string[] | undefined) ?? []).some((v) => v === 'extensions' || v === 'weave');
const topMisses = (x: CutCase): boolean => {
  const want = TOP[String(answer(x, 'pref.top_length'))];
  const [lo, hi] = cm(x.cut.zones.top);
  return want !== undefined && (lo > want[1] || hi < want[0]);
};

/** Each cut check: the kind of limit and, when the cut breaks it, why. */
const CUT: readonly (readonly [Kind, (x: CutCase) => string | false])[] = [
  ['grow_out', (x) => answer(x, 'life.grow_out_goal') === true && (x.clipper || (x.cls === 'very_short' && !x.cut.traits.grow_out_friendly)) && 'a short crop kept short by cutting'],
  ['grow_out', (x) => answer(x, 'life.grow_out_goal') === true && x.shorter && `takes length off (${x.cls})`],
  ['grow_out', (x) => answer(x, 'life.grow_out_goal') === true && x.zoneShorter !== null && `takes length off the ${x.zoneShorter}`],
  ['grow_out', (x) => wantsLength(x) && (x.shorter || x.zoneShorter !== null) && 'takes the length extensions need'],
  ['scars', (x) => answer(x, 'scalp.marks_cover') === true && x.shortest < 10 && `scalp shows (${String(x.shortest)} mm)`],
  ['scars', (x) => answer(x, 'scalp.marks_cover') === true && answer(x, 'hair.density') === 'low' && x.shortest < 15 && `scalp shows through thin hair (${String(x.shortest)} mm)`],
  ['top_length', (x) => topMisses(x) && `top ${cm(x.cut.zones.top).join('-')} cm for ${String(answer(x, 'pref.top_length'))}`],
  ['tie_back', (x) => answer(x, 'life.tie_back_needed') === true && !x.cut.traits.tie_back && 'cannot be tied'],
  ['fringe', (x) => answer(x, 'pref.fringe') === 'avoid' && x.cut.traits.fringe !== 'none' && 'a fringe'],
  ['fringe', (x) => answer(x, 'pref.fringe') === 'want' && x.cut.traits.fringe === 'none' && 'no fringe'],
  ['wash_and_go', (x) => answer(x, 'life.styling_minutes') === 7 && x.fits.some((t) => t.daily === true) && 'shaped every day on this texture'],
  ['texture', (x) => x.fits.some((t) => t.fit === 'poor') && 'a poor fit for this texture'],
  ['wish', (x) => answer(x, 'wish.face_length') === 'soften' && x.cut.traits.sides_width === 'close' && 'close sides against fullness at the sides'],
];

/** The look as the person answered; with the history not given, as never-coloured and as coloured lengths both. */
const casesOf = (look: ColourLook, f: Facts, lib: Library): LookCase[] =>
  (said(f, 'hair.chemical_history') === undefined ? [lookCase(look, f, lib, true), lookCase(look, f, lib, false)] : [lookCase(look, f, lib)]);
/** A colour check breaks only where every case breaks it: an unknown history hides only what it changes. */
function inAll(cases: readonly LookCase[], check: (x: LookCase) => string | false): string | false {
  const whys = cases.map(check);
  return whys.every((w) => w !== false) ? (whys[0] ?? false) : false;
}

/** The checker over one content folder: `breaches` lists every automatically shown idea against what was said. */
export function saidChecker(contentDir: string): { readonly breaches: (r: Recommendation, facts: Facts) => Breach[]; readonly ofIdea: (id: string, facts: Facts) => Breach[] } {
  const lib = libraryOf(contentDir);
  const ofIdea = (id: string, f: Facts): Breach[] => {
    const look = lib.looks.get(id);
    const cut = lib.cuts.get(id);
    const cases = look ? casesOf(look, f, lib) : [];
    const hits = look ? COLOUR.map(([kind, check]) => [kind, inAll(cases, check)] as const) : cut ? CUT.map(([kind, check]) => [kind, check(cutCase(cut, f, lib.bands))] as const) : [];
    return hits.flatMap(([kind, why]) => (why === false ? [] : [{ id, kind, why }]));
  };
  const label = (i: Idea, f: Facts): Breach[] => {
    const look = lib.looks.get(i.id);
    const cases = look ? casesOf(look, f, lib) : [];
    const why = look && !i.referral ? inAll(cases, (x) => professionalReason(x, f)) : false;
    return [
      ...(why !== false && i.label !== 'needs_professional' ? [{ id: i.id, kind: 'label' as const, why: `labelled ${String(i.label)} with ${why}` }] : []),
      // "Plausible" is never a guess: not while the shade may not show on this hair in any case.
      ...(i.label === 'plausible' && cases.some((x) => x.regions.some((r) => shows(x, r) !== true)) ? [{ id: i.id, kind: 'label' as const, why: 'plausible while its shade may not show on this hair' }] : []),
    ];
  };
  // The person's own additions and pair stay on screen, so anything against what was said must show there as blocked.
  const manual = (i: Idea, f: Facts, safety: boolean): Breach[] => [
    ...(safety && i.kind === 'colour' && !i.referral ? [{ id: i.id, kind: 'referral' as const, why: 'an added or paired colour not replaced by the referral' }] : []),
    ...(i.excluded.length === 0 && ofIdea(i.id, f).length > 0 ? [{ id: i.id, kind: 'manual' as const, why: `an addition against what was said, not marked: ${ofIdea(i.id, f).map((b) => b.why).join('; ')}` }] : []),
    ...label(i, f),
  ];
  const beards = (r: Recommendation): Breach[] =>
    r.picks.flatMap((p) => p.beards.filter((b) => !lib.beards.has(b)).map((b) => ({ id: b, kind: 'beard' as const, why: `offered with ${p.id} but not a beard of the library` })));
  return {
    ofIdea,
    breaches: (r, f) => {
      const safety = referred(f);
      const shown = [...new Map([...r.picks, ...r.pool, ...r.worthAsking.map((w) => w.idea)].map((i) => [i.id, i])).values()];
      return [
        ...(safety !== (r.referral !== null) ? [{ id: '-', kind: 'referral' as const, why: safety ? 'the safety answers call for a referral and none was given' : 'a referral with no safety answer for it' }] : []),
        ...(safety && r.colourPrompts ? [{ id: '-', kind: 'prompt' as const, why: 'colour prompts enabled after a referral' }] : []),
        ...shown.flatMap((i) => [
          ...(i.excluded.length > 0 ? [{ id: i.id, kind: 'eligibility' as const, why: `shown while excluded by ${i.excluded.map((x) => x.ruleId).join(', ')}` }] : []),
          ...(safety && i.kind === 'colour' ? [{ id: i.id, kind: 'referral' as const, why: 'a colour shown after a referral' }] : []),
          ...ofIdea(i.id, f),
          ...label(i, f),
        ]),
        ...[...r.added, ...(r.pair ? [r.pair.cut, r.pair.colour] : [])].flatMap((i) => manual(i, f, safety)),
        ...beards(r),
      ];
    },
  };
}
