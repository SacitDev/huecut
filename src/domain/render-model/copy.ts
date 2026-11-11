/**
 * The words the render models and prompt builders use.
 * The domain imports no strings file, so each builder takes a typed copy argument; `EN` is the default English copy, which the
 * prompts always read, and `SHOWN` the copy the screens, the face card and the stylist sheet show, in their language.
 */
import type { FactValue, Facts } from '../facts/registry.ts';
import type { LineId } from '../measure/measure.ts';
import type { TRAITS } from '../content/traits.ts';
import type { CUT_NECKLINES, FADE_HEIGHTS, FADE_KINDS, FitValue, FringeKind, HEAT_USE, JourneyLabel, PerimeterLandmark, Region, Tone, ZONES } from '../content/values.ts';
import { REASON_WORDS, type ReasonWords } from '../engine/explain.ts';
import type { TradeOff } from '../engine/suitability.ts';
import { FACTS_COPY, type FactsCopy } from './facts-copy.ts';

/**
 * Every trade-off a cut misses in one sentence of fixed words, or `null` for none; `said` names who set the limits. The card
 * leaves the growth out (`withGrowth` false), since its length line already names it.
 */
export function tradeOffWords(tradeOffs: readonly TradeOff[], c: TradeOffCopy, said: string, withGrowth = true): string | null {
  const growth = withGrowth ? tradeOffs.find((t) => t.what === 'growth') : undefined;
  const limits = tradeOffs.flatMap((t) => (t.what === 'styling' ? [c.styling(t.minutes)] : t.what === 'trim' ? [c.trim(t.weeks[0], t.weeks[1])] : []));
  if (growth === undefined && limits.length === 0) return null;
  return c.sentence(growth?.what === 'growth' ? c.growth(growth.weeks) : null, limits, said);
}

/**
 * The person's own "What I need" answers in fixed words, in a fixed order: limits first, then at most `wishes` concrete wishes
 * (the AI pick prompt takes two, so its word budget holds).
 */
export function needWords(facts: Facts | undefined, c: NeedsCopy, most = Infinity): string[] {
  const said = <K extends keyof Facts>(key: K): NonNullable<Facts[K]>['value'] | undefined => (facts?.[key]?.source === 'answered' ? facts[key].value : undefined);
  const fringe = said('pref.fringe');
  const top = said('pref.top_length');
  const change = said('pref.change_amount');
  const trim = said('life.trim_weeks_ok');
  const minutes = said('life.styling_minutes');
  const wishes = Object.entries(c.wishes).flatMap(([at, words]) => {
    const [key, value] = at.split(':');
    return facts && Object.values(facts).some((f) => f.source === 'answered' && f.key === key && f.value === value) ? [words] : [];
  });
  return [
    ...(said('life.grow_out_goal') === true ? [c.growOut] : []), ...(said('scalp.marks_cover') === true ? [c.scars] : []),
    ...(trim === undefined ? [] : [c.trim(trim)]), ...(minutes === undefined ? [] : [c.styling(minutes)]),
    ...(said('life.tie_back_needed') === true ? [c.tieBack] : []), ...(fringe ? [c.fringe[fringe]] : []), ...(top ? [c.top[top]] : []),
    ...(change ? [c.change[change]] : []), ...wishes.slice(0, most),
  ];
}

/** Huecut and its link: every export's footer carries them. */
export interface FooterCopy { readonly app: string; readonly link: string }

/** The facts a face note reads: the face values (length to width, thirds, jaw to cheek), never the jaw angle. */
export type NoteFact = 'face.proportion' | 'face.forehead_share' | 'face.lower_share' | 'face.jaw_vs_cheek';
/** How sure a number is, in the card's three words. */
export type Sureness = 'steady' | 'estimate' | 'rough';
/** One reading of a topic: the words that finish the topic's sentence and one neutral line on what hair does. */
export interface NoteCopy { readonly words: string; readonly hair: string }
/** Each topic's name, sentence, number and readings. Observations only: no verdict, no norm, no score, nothing a face should change. */
export type FaceNotesCopy = {
  readonly [K in NoteFact]: {
    readonly name: string;
    readonly says: (words: string) => string;
    /** The sentence with the photo's own numbers (the length to width, else whole percentages); the word of sureness follows it. */
    readonly number: (...numbers: number[]) => string;
    readonly values: Readonly<Record<FactValue<K>, NoteCopy>>;
  };
};

/** The face card's own words. */
export interface FaceCardCopy {
  readonly heading: string;
  readonly footerNote: string;
  readonly closeUpLine: string;
  readonly lines: Readonly<Record<Exclude<LineId, 'brow_right' | 'brow_left'> | 'brows', string>>;
  readonly sureness: Readonly<Record<Sureness, string>>;
  /** For occlusion, a tiny face or a changed expression: unlike a rough number or a boundary, nothing can be stated. */
  readonly cannotRead: string;
  /** January to December, as the date names them. */
  readonly months: readonly string[];
  readonly date: (day: number, month: string, year: number) => string;
}

export interface SheetCopy {
  readonly headings: Readonly<Record<'lengths' | 'fade' | 'fringe' | 'layers' | 'yourHair' | 'upkeep' | 'stylist' | 'growOut' | 'colour' | 'journey' | 'colourist' | 'aboutMyHair', string>>;
  readonly zones: Readonly<Record<(typeof ZONES)[number] | 'perimeter' | 'basis', string>>;
  readonly basisNote: string;
  readonly cm: (min: number, max: number) => string;
  /** A clipper length: its guard number on the common eighth-of-an-inch scale and its millimetres. */
  readonly guard: (guard: number, mm: number) => string;
  /** Two clipper lengths as a range. */
  readonly guards: (from: string, to: string) => string;
  readonly landmarks: Readonly<Record<PerimeterLandmark, string>>;
  /** Where a fringe sits, by its snake_case landmark (`brow`). */
  readonly fringeLandmarks: Readonly<Record<string, string>>;
  readonly fadeKinds: Readonly<Record<(typeof FADE_KINDS)[number], string>>;
  readonly fadeHeights: Readonly<Record<(typeof FADE_HEIGHTS)[number], string>>;
  readonly necklines: Readonly<Record<(typeof CUT_NECKLINES)[number], string>>;
  readonly fringes: Readonly<Record<FringeKind, string>>;
  readonly layers: Readonly<Record<(typeof TRAITS.cut.layers.values)[number], string>>;
  readonly fits: Readonly<Record<FitValue, string>>;
  readonly heat: Readonly<Record<(typeof HEAT_USE)[number], string>>;
  readonly regions: Readonly<Record<Region, string>>;
  readonly journeyLabels: Readonly<Record<JourneyLabel, string>>;
  readonly rows: Readonly<Record<'framing' | 'tradeOff' | 'kind' | 'start' | 'note' | 'neckline' | 'sideburns' | 'sits' | 'alsoWorks' | 'layers' | 'texture' | 'density'
    | 'strand' | 'growth' | 'whorl' | 'glasses' | 'shrinkage' | 'styling' | 'trim' | 'heatUse' | 'products' | 'base' | 'lightenFirst'
    | 'visits' | 'label' | 'why' | 'ask' | 'reminder' | 'notes', string>>;
  readonly textureFor: (texture: string) => string;
  readonly minutes: (min: number, max: number) => string;
  readonly weeks: (min: number, max: number) => string;
  readonly percent: (min: number, max: number) => string;
  /** A shade with its levels (`min` to `max`) and its tone in words. */
  readonly shade: (name: string, min: number, max: number, tone: string) => string;
  /** Each tone value in words. */
  readonly tones: Readonly<Record<Tone, string>>;
  readonly applied: (technique: string, shade: string) => string;
  readonly ownBase: string;
  readonly lightenTo: (level: number) => string;
  readonly openAnswers: string;
  readonly noRecord: string;
  readonly healthLine: string;
  readonly pairTitle: (cut: string, colour: string) => string;
  readonly aiLabel: string;
}

export interface BoardCopy {
  readonly title: string;
  readonly aiLabel: string;
  /** The "Try together" pair. */
  readonly pairName: (cut: string, colour: string) => string;
  /** A cut with the colour chosen for it in "Colour in your results". */
  readonly lookName: (cut: string, colour: string) => string;
  readonly referenceTitle: string;
}

/**
 * "What I need": the person's limits and concrete wishes in fixed option words, never free text and never a health answer.
 * The AI pick prompt and the stylist sheet's "About my hair" use the same words.
 */
export interface NeedsCopy {
  readonly label: string;
  readonly growOut: string;
  readonly scars: string;
  readonly trim: (weeks: number) => string;
  readonly styling: (minutes: number) => string;
  readonly tieBack: string;
  readonly fringe: Readonly<Record<FactValue<'pref.fringe'>, string>>;
  readonly top: Readonly<Record<FactValue<'pref.top_length'>, string>>;
  readonly change: Readonly<Record<FactValue<'pref.change_amount'>, string>>;
  /** By `<wish key>:<value>`; the proportion wishes are left out, since they mean nothing without a reading of the face. */
  readonly wishes: Readonly<Record<string, string>>;
}

/** The words of a cut's trade-offs. */
export interface TradeOffCopy {
  readonly styling: (minutes: number) => string;
  /** A trim every `min` to `max` weeks. */
  readonly trim: (min: number, max: number) => string;
  readonly growth: (weeks: number | null) => string;
  readonly sentence: (growth: string | null, limits: readonly string[], said: string) => string;
  /** The AI pick's "What I need": the listed looks that miss each limit. */
  readonly listed: Readonly<Record<TradeOff['what'], (names: readonly string[]) => string>>;
  readonly youSaid: string;
  readonly iSaid: string;
}

export interface PromptCopy {
  readonly needs: NeedsCopy;
  readonly tradeOffs: TradeOffCopy;
  readonly answer: (label: string, value: string) => string;
  readonly noAnswers: string;
  readonly noFaceNotes: string;
  /** The card's upkeep line for a cut; one number when the ends match, "No styling" for 0. */
  readonly cutUpkeep: (styling: readonly [number, number], trim: readonly [number, number]) => string;
  readonly colourUpkeep: (weeks: readonly [number, number]) => string;
  /** What the card takes from the reference sheet; the sheet's hair colour never counts for a cut. */
  readonly sheetKeep: string;
  readonly sheetNamed: string;
  readonly sheetColours: string;
  /** A look that keeps the person's own colour: the words that stand where the look names the colour it was pictured on. */
  readonly ownBase: (level: number | null) => string;
}

export interface Copy {
  readonly footer: FooterCopy;
  readonly faceCard: FaceCardCopy;
  readonly faceNotes: FaceNotesCopy;
  readonly facts: FactsCopy;
  readonly sheet: SheetCopy;
  readonly board: BoardCopy;
  readonly prompts: PromptCopy;
}

const span = (min: number, max: number, unit: string): string => (min === max ? `${String(min)}${unit}` : `${String(min)}-${String(max)}${unit}`);
/** "every week", "every 6 weeks", "every 4-6 weeks". */
const weeksFrom = (min: number, max: number): string => (min === 1 && max === 1 ? 'every week' : `every ${span(min, max, '')} weeks`);
/** A clipper length or range in the copy's words, each end with its guard on the common eighth-of-an-inch scale (#1 = 3 mm, #2 = 6 mm), to the nearest half guard. */
export function guardWords(c: Pick<SheetCopy, 'guard' | 'guards'>, min: number, max = min): string {
  const one = (mm: number): string => c.guard(Math.round((mm / 3.175) * 2) / 2, mm);
  return min === max ? one(min) : c.guards(one(min), one(max));
}

const inThisPhoto = (subject: string) => (words: string): string => `In this photo, ${subject} is ${words}`;

const FACE_NOTES: FaceNotesCopy = {
  'face.proportion': {
    name: 'Length and width',
    says: inThisPhoto('your face'),
    number: (ratio) => `Your face is about ${ratio.toFixed(2)} times as long as it is wide`,
    values: {
      longer: { words: 'clearly longer than it is wide', hair: 'Volume at the sides makes a face look wider.' },
      balanced: { words: 'a little longer than it is wide', hair: 'Height on top makes a face look longer, and volume at the sides makes it look wider.' },
      rounder: { words: 'nearly as wide as it is long', hair: 'Height on top makes a face look longer.' },
    },
  },
  'face.forehead_share': {
    name: 'Forehead',
    says: inThisPhoto('your forehead section'),
    number: (upper, middle) => `This part takes up about ${String(upper)}% of your face height. Middle about ${String(middle)}%`,
    values: {
      longer: { words: 'longer than the other two sections', hair: 'A fringe makes a forehead look shorter.' },
      similar: { words: 'about the same as the other two sections', hair: 'A fringe covers part of the forehead, and an open front shows all of it.' },
      shorter: { words: 'shorter than the other two sections', hair: 'An open front shows all of the forehead.' },
    },
  },
  'face.lower_share': {
    name: 'Nose to chin',
    says: inThisPhoto('your nose-to-chin section'),
    number: (lower) => `This part takes up about ${String(lower)}% of your face height`,
    values: {
      longer: { words: 'longer than the other two sections', hair: 'Volume at the jaw makes the lower face look wider.' },
      similar: { words: 'about the same as the other two sections', hair: 'Where the hair ends draws the eye to that height.' },
      shorter: { words: 'shorter than the other two sections', hair: 'Length past the chin draws the eye down.' },
    },
  },
  'face.jaw_vs_cheek': {
    name: 'Jaw',
    says: inThisPhoto('your jaw'),
    number: (jaw) => `Your jaw is about ${String(jaw)}% as wide as your cheeks`,
    values: {
      narrower: { words: 'clearly narrower than the cheekbones', hair: 'Fullness at the jaw line makes the jaw look wider.' },
      similar: { words: 'a little narrower than the cheekbones', hair: 'Soft layers blur the jaw line, and blunt ends mark it.' },
      wider: { words: 'about as wide as the cheekbones', hair: 'Height on top and softness at the cheekbones draw the eye up.' },
    },
  },
};

const FACE_CARD: FaceCardCopy = {
  heading: 'What this photo shows',
  footerNote: 'Estimates from your photo, made on your device.',
  closeUpLine: 'Taken close up, so these are approximate (close-up photo).',
  lines: { face_outline: 'Face outline', hairline: 'Hairline', brows: 'Brows', eye_line: 'Eye line', nose_width: 'Nose width', lip_line: 'Lip line', jaw: 'Jaw', chin: 'Chin' },
  sureness: { steady: 'steady estimate', estimate: 'estimate', rough: 'rough estimate' },
  cannotRead: 'cannot read reliably',
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  date: (day, month, year) => `${String(day)} ${month} ${String(year)}`,
};

const SHEET: SheetCopy = {
  headings: {
    lengths: 'Lengths', fade: 'Fade', fringe: 'Fringe', layers: 'Layers', yourHair: 'For my hair', upkeep: 'Upkeep', stylist: 'For the stylist',
    growOut: 'Growing it out', colour: 'Colour', journey: 'Before you book', colourist: 'For the colourist', aboutMyHair: 'About my hair',
  },
  zones: { top: 'Top', fringe: 'Fringe', sides: 'Sides', back: 'Back', nape: 'Nape', perimeter: 'Length', basis: 'Measured' },
  basisNote: 'dry and stretched',
  cm: (min, max) => span(min, max, ' cm'),
  guard: (guard, mm) => (mm === 0 ? 'skin, 0 mm' : `#${String(guard)}, ${String(mm)} mm`),
  guards: (from, to) => `${from} to ${to}`,
  landmarks: {
    above_ear: 'above the ear', ear: 'at the ear', jaw: 'at the jaw', chin: 'at the chin', collarbone: 'at the collarbone',
    shoulder: 'at the shoulders', shoulder_blade: 'to the shoulder blades', mid_back: 'to the middle of the back', waist: 'to the waist',
  },
  fringeLandmarks: { brow: 'at the brow', above_brow: 'just above the brow', lash: 'at the lashes', cheekbone: 'at the cheekbones' },
  fadeKinds: { fade: 'fade', skin: 'skin fade', bald: 'bald fade', drop: 'drop fade', taper: 'taper', scissor_taper: 'scissor taper', undercut: 'undercut' },
  fadeHeights: { low: 'Low', mid: 'Mid', high: 'High' },
  necklines: { natural: 'natural', tapered: 'tapered', blocked: 'blocked', rounded: 'rounded' },
  fringes: {
    none: 'No fringe', micro: 'Micro fringe', short_blunt: 'Short blunt fringe', blunt_full: 'Full blunt fringe', bottleneck: 'Bottleneck fringe',
    wispy: 'Wispy fringe', curtain: 'Curtain fringe', side_swept: 'Side-swept fringe', long_side: 'Long side fringe',
    textured_forward: 'Textured fringe worn forward', curly: 'Curly fringe',
  },
  layers: {
    none: 'no layers', light: 'light layers', medium: 'medium layers', heavy: 'heavy layers', internal: 'internal layers', long_layers: 'long layers',
    face_framing: 'face-framing layers', shag: 'shag layers', chin_level: 'layers at the chin',
  },
  fits: { good: 'works as cut', adapt: 'needs adapting', poor: 'a harder match' },
  heat: { none: 'no heat styling', rare: 'heat now and then', weekly: 'heat about once a week', daily: 'heat most days' },
  regions: { root: 'Root', mids: 'Mid-lengths', ends: 'Ends', face_frame: 'Face-framing pieces', highlights: 'Fine highlights', lowlights: 'Fine lowlights' },
  journeyLabels: { plausible: 'Plausible', uncertain: 'Uncertain', needs_professional: 'Best done by a colourist' },
  rows: {
    kind: 'Fade', start: 'Starts at', note: 'Note', neckline: 'Neckline', sideburns: 'Sideburns', sits: 'Sits', alsoWorks: 'Also works as',
    layers: 'Layers', texture: 'Texture', density: 'Density', strand: 'Strand', growth: 'Growth', whorl: 'Crown whorl', glasses: 'Glasses',
    shrinkage: 'Shrinkage', styling: 'Styling', trim: 'Trim', heatUse: 'Heat', products: 'Products', base: 'Base', lightenFirst: 'Lightened first',
    visits: 'Visits', label: 'Journey', why: 'Why', ask: 'What to ask', reminder: 'Reminder', notes: 'Notes', framing: 'Framing', tradeOff: 'Trade-off',
  },
  textureFor: (texture) => `For ${texture} hair`,
  minutes: (min, max) => `${span(min, max, '')} minutes a day`,
  weeks: weeksFrom,
  percent: (min, max) => `about ${span(min, max, '%')} when dry`,
  shade: (name, min, max, tone) => `${name}, level ${span(min, max, '')}, ${tone} tone`,
  tones: {
    ash: 'ash', beige: 'beige', pearl: 'pearl', silver: 'silver', neutral: 'neutral', golden: 'golden', honey: 'honey', caramel: 'caramel',
    copper: 'copper', red: 'red', red_brown: 'red brown', chestnut: 'chestnut', chocolate: 'chocolate', mahogany: 'mahogany', burgundy: 'burgundy',
    plum: 'plum', rose: 'rose', pink: 'pink', lavender: 'lavender', teal: 'teal', blue: 'blue',
  },
  applied: (technique, shade) => `${technique} in ${shade}`,
  ownBase: 'Your own colour stays wherever no placement covers the hair',
  lightenTo: (n) => `to level ${String(n)} before the shades go on`,
  openAnswers: 'Some answers that could change this are still open.',
  noRecord: 'Your answers do not settle this look yet.',
  healthLine: 'If you are pregnant, breastfeeding or having medical treatment, tell your colourist first.',
  pairTitle: (cut, colour) => `Together: ${cut}, with ${colour}`,
  aiLabel: 'AI picture, an illustration of the look',
};

/** The default English copy. */
export const EN: Copy = {
  footer: { app: 'Huecut', link: 'https://sacitdev.github.io/huecut/' },
  faceCard: FACE_CARD,
  faceNotes: FACE_NOTES,
  facts: FACTS_COPY,
  sheet: SHEET,
  board: {
    title: 'My looks',
    aiLabel: 'AI picture, an illustration of the look',
    pairName: (cut, colour) => `Together: ${cut}, with ${colour}`,
    lookName: (cut, colour) => `${cut} in ${colour}`,
    referenceTitle: 'Hairstyle references',
  },
  prompts: {
    needs: {
      label: 'What I need',
      growOut: 'growing my hair out',
      scars: 'scalp scars covered',
      // The answers' own words: each stores the limit it accepts, not the figure its words name.
      trim: (weeks) => ({ 2: 'a trim every 2-4 weeks', 4: 'a trim every 4-6 weeks', 6: 'a trim every 6-8 weeks', 12: 'trims about every 3 months' } as Record<number, string>)[weeks] ?? `a trim every ${String(weeks)} weeks`,
      styling: (minutes) => ({ 7: 'about 5 minutes of styling', 12: 'about 10 minutes of styling', 20: 'styling up to 20 minutes', 60: 'I enjoy styling' } as Record<number, string>)[minutes] ?? `${String(minutes)} minutes styling a day`,
      tieBack: 'can tie it back',
      fringe: { want: 'a fringe', open: 'maybe a fringe', avoid: 'no fringe' },
      top: { very_short: 'very short on top', short: 'short on top', medium: 'medium on top', long: 'long on top' },
      change: { subtle: 'a gentle change', noticeable: 'a clear change', bold: 'a big change' },
      wishes: {
        'wish.face_length:soften': 'fullness at the sides', 'wish.face_length:emphasise': 'a long line down my face',
        'wish.face_width:soften': 'height and closer sides', 'wish.face_width:emphasise': 'a soft, rounded shape',
        'wish.forehead:soften': 'more of my forehead covered', 'wish.forehead:emphasise': 'my forehead open',
        'wish.jaw:emphasise': 'a clean line at my jaw', 'wish.jaw:soften': 'soft layers at my jaw',
        'wish.chin:emphasise': 'a clean line at my chin', 'wish.chin:soften': 'soft ends past my chin',
        'wish.height:soften': 'less height on top', 'wish.height:emphasise': 'more height on top', 'wish.fullness:emphasise': 'fuller-looking hair',
        'wish.ears:soften': 'my ears covered', 'wish.ears:emphasise': 'my ears showing', 'wish.hairline:soften': 'my hairline showing less',
      },
    },
    tradeOffs: {
      styling: (minutes) => `${String(minutes)} minutes of styling`,
      trim: (min, max) => `a trim every ${min === max ? String(min) : `${String(min)} to ${String(max)}`} weeks`,
      growth: (weeks) => (weeks === null ? 'more length first' : `${weeks <= 26 ? 'a few months' : weeks <= 52 ? 'up to a year' : 'more than a year'} of growth`),
      sentence: (growth, limits, said) =>
        `Needs ${[growth, limits.length === 0 ? null : `${limits.join(' and ')}, ${limits.length > 1 ? 'both ' : ''}more than ${said}`].filter((x) => x !== null).join(', and ')}`,
      listed: {
        styling: (names) => `${names.join(', ')} ${names.length > 1 ? 'need' : 'needs'} more styling time than I said`,
        trim: (names) => `${names.join(', ')} ${names.length > 1 ? 'need' : 'needs'} more trims than I said`,
        growth: (names) => `${names.join(', ')} ${names.length > 1 ? 'need' : 'needs'} my hair to grow first`,
      },
      youSaid: 'you said',
      iSaid: 'I said',
    },
    answer: (label, value) => `${label}: ${value}`,
    ownBase: (level) => (level === null ? 'my existing colour' : `my own level ${String(level)} colour`),
    noAnswers: 'none',
    noFaceNotes: 'none',
    cutUpkeep: ([min, max], [trimMin, trimMax]) =>
      `${max === 0 ? 'No styling' : `Styling ${span(min, max, ' min')}`}, trim ${weeksFrom(trimMin, trimMax)}`,
    colourUpkeep: ([min, max]) => `Colour ${weeksFrom(min, max)}`,
    sheetKeep: 'Copy only the haircut from each numbered picture on the sheet, never its face or hair colour. Keep my hair colour exactly as it is.',
    sheetNamed: 'Copy only the haircut or colour from each numbered picture on the sheet, never its face, and use the colour named for each look.',
    sheetColours: 'Copy only the hair colour from each numbered picture on the sheet, never its face or haircut, and keep my haircut exactly as it is.',
  },
};

/** A copy of words, so a language can be laid over it while the original stays English; a function is shared, since a language replaces it whole. */
const cloned = <T>(value: T): T =>
  value === null || typeof value !== 'object'
    ? value
    : ((Array.isArray(value) ? value.map(cloned) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloned(v)]))) as T);

/** The copy the screens, the face card and the stylist sheet show: English until the app lays the chosen language over it. */
export const SHOWN: Copy = cloned(EN);
/** The engine's joining words as the screens show them, laid over like `SHOWN`. */
export const SHOWN_REASONS: ReasonWords = cloned(REASON_WORDS);
/** The domain's words a language is laid over, by the name that starts their ids in `i18n/lv.md`. */
export const WORD_TREES: Readonly<Record<string, object>> = { copy: SHOWN, reasons: SHOWN_REASONS };
