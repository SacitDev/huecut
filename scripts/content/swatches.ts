/**
 * The true-colour samples on the colour questions, drawn at build: hair from the shades' own root, mid and end
 * colours, skin and eyes from the values below, so every colour has one source. All sit on one neutral card, so pale and dark
 * both show in either theme. A guide, not a measurement.
 */
import { labToSrgb } from '../../src/domain/colour/lab.ts';
import type { Shade } from '../../src/domain/content/types.ts';

type Stops = Shade['swatch'];
type Span = readonly [number, number];
/** A lock's hair, its grey, and how many of its strands are grey. */
interface LockColours {
  readonly hair: Stops;
  readonly grey: Stops;
  readonly count: number;
}
/** A hair strand on the head: its curve's control point and end. */
type Strand = readonly [cx: number, cy: number, x: number, y: number];
/** Where a grey pattern greys the head: stretches of strands, each as the strands' indices and where it starts and ends along them. */
type GreyPattern = readonly (readonly [strands: readonly number[], from: number, to: number])[];

/** The card under every swatch: a warm mid grey that black hair and platinum hair both stand out on, in either theme. */
const CARD = '#b7afa5';
/**
 * The card's edge: 4.8:1 against the light tile and 3.3:1 against a chosen one, where the card alone is 2.1:1 and 1.4:1; on the
 * dark tile the card itself stands out (7.2:1, chosen 4.4:1).
 */
const EDGE = '#776f66';
/** The arrow from a before to an after, the eye's outline and the head's eyes: a dark brown that reads on the card. */
const INK = '#3d2420';

/** The shade that stands for each level, from 1 up. */
const LEVEL_SHADES = ['jet-black', 'darkest-brown', 'chocolate-brown', 'mocha-brown', 'light-brown', 'dark-blonde', 'sandy-blonde', 'beige-blonde', 'vanilla-blonde', 'platinum-blonde'];
/** The hair the grey samples start from (a medium brown, on which grey shows), and the grey drawn in it. */
const BASE = 'mocha-brown';
const GREY = 'silver-white';
/** Grey strands per ten for each grey amount: none, up to 10 %, 10-30 %, 30-50 %, 50-75 %, almost all. */
const GREY_TENTHS = [0, 1, 2, 4, 6, 9];
/** Grey strands of seven in a "before" lock with grey: about 40 %, so the grey clearly shows. */
const BEFORE_GREYS = 3;
/** Each colour direction's before and after, by shade id; `tone` is the same depth warmer and cooler, either way round. */
const DIRECTIONS = { lighter: [BASE, 'dark-blonde'], darker: ['light-brown', 'chocolate-brown'], tone: ['golden-brown', 'ash-brown'], refresh: ['chestnut-brown', 'chestnut-brown'], grey: [BASE, BASE], vivid: [BASE, 'teal'], natural: [BASE, BASE] } as const;
/** Faded lengths on the "refresh" before: the dull beige that colour fades towards. */
const FADED = '#cdbfae';
/** The dyed lengths on the "natural" before, grown out over the person's own root. */
const DYED = 'honey-blonde';
/** Each tone a person may see in their hair today, as a brown and a blonde of that tone, so the tone reads apart from the depth. */
const TONES = { warm: ['golden-brown', 'golden-blonde'], copper: ['auburn', 'copper'], neutral: ['light-brown', 'sandy-blonde'], cool: ['ash-brown', 'ash-blonde'], brassy: ['light-brown', 'sandy-blonde'] } as const;
/** The unwanted orange-yellow that lightened or faded hair turns: the brassy pair's lengths lean to it from a neutral root. */
const BRASS = '#c8822c';
/** The shade that stands for each colour family a person can ask for: a middle shade of the family, neither warm nor cool where one exists. */
const FAMILIES = { blonde: 'beige-blonde', brunette: BASE, 'red-copper': 'copper', black: 'soft-black', 'grey-silver': GREY } as const;
/**
 * Skin as CIE LCh (lightness, chroma, hue angle). Undertones at three depths (L* 80, 60, 38): warm leans golden, cool rosy, olive a
 * muted golden beige with a grey-green cast (hue 76°: at 86° it lost all redness and read as khaki), neutral between; drawn so the
 * answer rests on seeing, not on clues about jewellery or veins.
 */
const UNDERTONES = { warm: [24, 68], cool: [20, 36], neutral: [17, 54], olive: [18, 76] } as const;
const UNDERTONE_DEPTHS = [80, 60, 38];
/** Skin depths from very light to very deep: paler skin is less saturated, tan and olive lean yellow, deep skin keeps its warmth. */
const SKIN_DEPTHS = { 'very-light': [84, 14, 58], light: [74, 19, 58], medium: [63, 22, 60], 'tan-olive': [55, 24, 70], deep: [42, 21, 58], 'very-deep': [29, 15, 55] } as const;
/** The face under the grey patterns: a neutral light-medium skin, so the eye goes to the hair. */
const FACE = [70, 17, 54] as const;
/** Each eye colour as the iris's centre and rim: dark brown, amber, hazel (brown at the centre, green outside), green, blue, grey. */
const EYES = {
  'dark-brown': ['#4a2c1a', '#25160d'],
  'light-brown': ['#b47c30', '#77491d'],
  hazel: ['#9a6a2c', '#5c6e36'],
  green: ['#8a9a4e', '#476636'],
  blue: ['#9cc0e0', '#46719f'],
  grey: ['#b6bec2', '#6e7980'],
} as const;
/** The white of the eye, and the pupil. */
const SCLERA = '#f4f1ec';
const PUPIL = '#141010';

const svg = (defs: string, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="48" viewBox="0 0 96 48">${defs === '' ? '' : `<defs>${defs}</defs>`}<rect x=".5" y=".5" width="95" height="47" rx="7.5" fill="${CARD}" stroke="${EDGE}"/>${body}</svg>\n`;
const num = (v: number): string => String(Math.round(v * 10) / 10);
const gradient = (id: string, [x0, x1]: Span, s: Stops): string =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${num(x0)}" x2="${num(x1)}" y1="0" y2="0"><stop stop-color="${s.root}"/><stop offset=".5" stop-color="${s.mids}"/><stop offset="1" stop-color="${s.ends}"/></linearGradient>`;
const strands = (paths: readonly string[], stroke: string, width: number): string =>
  paths.length === 0 ? '' : `<g fill="none" stroke="${stroke}" stroke-width="${String(width)}" stroke-linecap="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const hex = (rgb: readonly number[]): string => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
/** A CIE LCh colour as #rrggbb. */
const lch = ([l, c, h]: readonly [number, number, number]): string => hex(labToSrgb({ l, a: c * Math.cos((h * Math.PI) / 180), b: c * Math.sin((h * Math.PI) / 180) }));

/** Mixes two #rrggbb colours, `t` of the way to `b`. */
function mix(a: string, b: string, t: number): string {
  const ch = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  return hex([0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)));
}
/** Each of a lock's three colours mixed `t` of the way to `b`. */
const mixStops = (s: Stops, b: string, t: number): Stops => ({ root: mix(s.root, b, t), mids: mix(s.mids, b, t), ends: mix(s.ends, b, t) });

/** `n` strands from x0 to x1, spread at the root and drawn together at the ends (seven across the card is the level swatch). */
function lock([x0, x1]: Span, n: number): string[] {
  const w = (x1 - x0) / 86;
  return Array.from({ length: n }, (_, k) => {
    const [root, tip] = [9 + (k * 30) / (n - 1), 19 + (k * 10.2) / (n - 1)];
    return `M${num(x0)} ${num(root)}C${num(x0 + 28 * w)} ${num(root - 4)} ${num(x0 + 53 * w)} ${num(tip + 4)} ${num(x1)} ${num(tip)}`;
  });
}

/** Strand indices of `count` greys spread evenly through `n` strands. */
const greyAt = (count: number, n: number): Set<number> => new Set(Array.from({ length: count }, (_, i) => Math.round(((i + 0.5) * n) / count - 0.5)));

/**
 * A lock of `n` strands, some grey (gradient ids `${id}h` and `${id}g`). The strands are painted in their own order: painting the
 * greys last laid them over the brown where the strands meet, so 40 % read as about 70 %.
 */
function greyLock(id: string, span: Span, { hair, grey, count }: LockColours, n: number, width: number): { defs: string; body: string } {
  const at = greyAt(count, n);
  return {
    defs: gradient(`${id}h`, span, hair) + (at.size > 0 ? gradient(`${id}g`, span, grey) : ''),
    body: `<g fill="none" stroke-width="${String(width)}" stroke-linecap="round">${lock(span, n).map((d, k) => `<path stroke="url(#${id}${at.has(k) ? 'g' : 'h'})" d="${d}"/>`).join('')}</g>`,
  };
}

/** One lock of seven strands across the card: a level, or a colour family. */
const oneLock = (hair: Stops): string => svg(gradient('h', [5, 91], hair), strands(lock([5, 91], 7), 'url(#h)', 5));

/** Two locks of seven strands side by side, with an arrow from the first to the second unless `arrow` is empty. */
function pair(before: LockColours, after: LockColours, arrow = 'M46 20l4 4-4 4'): string {
  const was = greyLock('a', [5, 41], before, 7, 4);
  const now = greyLock('b', [55, 91], after, 7, 4);
  const mark = arrow === '' ? '' : `<path d="${arrow}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(was.defs + now.defs, was.body + now.body + mark);
}

/**
 * The strands of a head of hair seen from the front, falling from a centre parting: [control, end] of each, from the back of
 * the left side over the temple and the forehead to the back of the right side. Indices 2-3 and 11-12 end at the temples, 5-9 at the front.
 */
const HEAD_STRANDS: readonly Strand[] = (() => {
  const left: readonly Strand[] = [[27, 12, 31.5, 46], [29.5, 14, 33, 46], [32, 16, 34.6, 40], [34, 15, 35, 33], [36, 12, 36.5, 25.5], [40, 10, 39.5, 19.8], [44, 9, 43.5, 18.2]];
  return [...left, [48, 10, 48, 17.6], ...left.toReversed().map(([cx, cy, x, y]): Strand => [96 - cx, cy, 96 - x, y])];
})();
/**
 * Where each grey pattern puts its grey: strands, and the stretch of each from the parting (0) to its end (1). Even streaks the sides
 * and front from a third of the way down, so it never reads as a white parting; temples and front are where their names say, on
 * both sides; patches are two clumps in unmatched places.
 */
const GREY_PATTERNS: Readonly<Record<string, GreyPattern>> = {
  even: [[[1, 4, 6, 8, 10, 13], 0.3, 1]],
  temples: [[[2, 3, 11, 12], 0.5, 1]],
  front: [[[5, 6, 7, 8, 9], 0.45, 1]],
  patches: [[[0, 1], 0.45, 0.85], [[9, 10], 0.1, 0.45]],
};

/** The stretch from `t0` to `t1` of a strand, the quadratic curve from the parting (48, 3) through its control point to its end. */
function strandPart([cx, cy, x, y]: Strand, t0: number, t1: number): string {
  const point = (t: number) => [(1 - t) ** 2 * 48 + 2 * (1 - t) * t * cx + t ** 2 * x, (1 - t) ** 2 * 3 + 2 * (1 - t) * t * cy + t ** 2 * y] as const;
  const [[x0, y0], [x1, y1]] = [point(t0), point(t1)];
  // A stretch of a quadratic is a quadratic whose control point lies along the tangent at its start, (t1 - t0) / 2 of the derivative away.
  const k = t1 - t0;
  const [dx, dy] = [(1 - t0) * (cx - 48) + t0 * (x - cx), (1 - t0) * (cy - 3) + t0 * (y - cy)];
  return `M${num(x0)} ${num(y0)}Q${num(x0 + k * dx)} ${num(y0 + k * dy)} ${num(x1)} ${num(y1)}`;
}

/** A head from the front with brown hair, its strand lines darker, and grey on the strands the pattern names. */
function head(hair: Stops, grey: string, pattern: GreyPattern): string {
  const cap = 'M31 46C27 28 31 2 48 2C65 2 69 28 65 46H61.5C61.5 36 61 27 58 21C53.5 17.5 42.5 17.5 38 21C35 27 34.5 36 34.5 46Z';
  const skin = lch(FACE);
  const lines = (indices: readonly number[], from: number, to: number) => indices.flatMap((i) => (HEAD_STRANDS[i] ? [strandPart(HEAD_STRANDS[i], from, to)] : [])).join('');
  // Drawn a quarter larger than the card and cut at its inner edge, so the hair fills the height and the chin falls off the card.
  return svg(
    '<clipPath id="k"><rect x="1" y="1" width="94" height="46" rx="7"/></clipPath>',
    `<g clip-path="url(#k)"><g transform="matrix(1.25 0 0 1.25 -12 -1.5)"><ellipse cx="48" cy="31" rx="12" ry="15.5" fill="${skin}"/><path d="${cap}" fill="${hair.mids}"/>` +
      `<path fill="none" stroke="${hair.root}" stroke-width=".8" d="${lines(HEAD_STRANDS.map((_, i) => i), 0, 1)}"/>` +
      `<path fill="none" stroke="${grey}" stroke-width="1.8" stroke-linecap="round" d="${pattern.map(([strands, from, to]) => lines(strands, from, to)).join('')}"/>` +
      `<circle cx="43.5" cy="30" r="1.1" fill="${INK}"/><circle cx="52.5" cy="30" r="1.1" fill="${INK}"/></g></g>`,
  );
}

/** The "before" of a colour direction from its first shade: faded for a refresh, dyed lengths over the root for going back, grey for grey. */
function directionBefore(direction: string, start: Stops, grey: Stops, dyed: Stops): LockColours {
  if (direction === 'grey') return { hair: start, grey, count: BEFORE_GREYS };
  const hair = direction === 'refresh' ? { root: start.root, mids: mix(start.mids, FADED, 0.45), ends: mix(start.ends, FADED, 0.6) } : direction === 'natural' ? { ...dyed, root: start.root } : start;
  return { hair, grey, count: 0 };
}

/** The hair samples (levels, families, grey amounts, colour directions, grey goals, tones and grey patterns), by file name. */
function hairSwatches(shade: (id: string) => Stops): [string, string][] {
  const [base, grey] = [shade(BASE), shade(GREY)];
  const plain = (hair: Stops): LockColours => ({ hair, grey, count: 0 });
  const withGrey: LockColours = { hair: base, grey, count: BEFORE_GREYS };
  // The grey goals start from the same lock with grey: covered, softened halfway into the brown, kept as it is, or all silver.
  const goals = { cover: plain(base), blend: { ...withGrey, grey: mixStops(grey, base.mids, 0.5) }, embrace: withGrey, silver: plain(grey) };
  const brassy = (s: Stops): Stops => ({ root: s.root, mids: mix(s.mids, BRASS, 0.5), ends: mix(s.ends, BRASS, 0.7) });
  return [
    ...LEVEL_SHADES.map((id, i): [string, string] => [`q-swatch-${String(i + 1)}.svg`, oneLock(shade(id))]),
    ...Object.entries(FAMILIES).map(([family, id]): [string, string] => [`q-swatch-family-${family}.svg`, oneLock(shade(id))]),
    ...GREY_TENTHS.map((tenths): [string, string] => {
      const { defs, body } = greyLock('', [5, 91], { hair: base, grey, count: tenths }, 10, 4);
      return [`q-swatch-grey-${String(tenths * 10)}.svg`, svg(defs, body)];
    }),
    ...Object.entries(DIRECTIONS).map(([direction, [from, to]]): [string, string] => [
      `q-swatch-direction-${direction}.svg`,
      pair(directionBefore(direction, shade(from), grey, shade(DYED)), plain(shade(to)), direction === 'tone' ? 'M46 20l-3 4 3 4M50 20l3 4-3 4' : undefined),
    ]),
    ...Object.entries(goals).map(([goal, after]): [string, string] => [`q-swatch-grey-goal-${goal}.svg`, pair(withGrey, after)]),
    ...Object.entries(TONES).map(([tone, ids]): [string, string] => {
      const [brown, blonde] = ids.map((id) => (tone === 'brassy' ? brassy(shade(id)) : shade(id)));
      return [`q-swatch-tone-${tone}.svg`, pair(plain(brown ?? base), plain(blonde ?? base), '')];
    }),
    ...Object.entries(GREY_PATTERNS).map(([pattern, where]): [string, string] => [`q-swatch-grey-pattern-${pattern}.svg`, head(base, grey.mids, where)]),
  ];
}

/** The skin depths, undertones and eye colours, by file name. */
function skinAndEyeSwatches(): [string, string][] {
  return [
    ...Object.entries(SKIN_DEPTHS).map(([depth, skin]): [string, string] => [`q-swatch-skin-${depth}.svg`, svg('', `<rect x="12" y="10" width="72" height="28" rx="14" fill="${lch(skin)}"/>`)]),
    ...Object.entries(UNDERTONES).map(([undertone, [c, h]]): [string, string] => [
      `q-swatch-undertone-${undertone}.svg`,
      svg('', UNDERTONE_DEPTHS.map((l, i) => `<circle cx="${String(22 + i * 26)}" cy="24" r="12" fill="${lch([l, c, h])}"/>`).join('')),
    ]),
    ...Object.entries(EYES).map(([eye, [centre, rim]]): [string, string] => [
      `q-swatch-eye-${eye}.svg`,
      svg(
        `<radialGradient id="i"><stop offset=".35" stop-color="${centre}"/><stop offset="1" stop-color="${rim}"/></radialGradient>`,
        `<path d="M18 24C30 10 66 10 78 24C66 38 30 38 18 24Z" fill="${SCLERA}" stroke="${INK}" stroke-width="1.5"/><circle cx="48" cy="24" r="10" fill="url(#i)" stroke="${rim}"/><circle cx="48" cy="24" r="4" fill="${PUPIL}"/><circle cx="51.5" cy="20.5" r="1.6" fill="${SCLERA}"/>`,
      ),
    ]),
  ];
}

/** Every swatch, by its file name in `public/illustrations/`. */
export function swatchFiles(shades: readonly Shade[]): ReadonlyMap<string, string> {
  const shade = (id: string): Stops => {
    const swatch = shades.find((s) => s.id === id)?.swatch;
    if (!swatch) throw new Error(`no shade ${id} for the swatches`);
    return swatch;
  };
  return new Map([...hairSwatches(shade), ...skinAndEyeSwatches()]);
}
