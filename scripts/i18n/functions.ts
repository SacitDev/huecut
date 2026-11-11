/**
 * The function strings that need more in Latvian than their parameters as placeholders: the cases their arguments choose
 * from, the parameter whose Latvian plural forms are asked for, list parameters, and words the English shows in lower case.
 * Every other function string is one text with its parameters.
 */
import type { Condition } from '../../src/strings/i18n.ts';

/** How one function string is exported: its cases are tried in order and `{}` matches anything. */
export interface FunctionSpec {
  readonly cases?: Readonly<Record<string, Readonly<Record<string, Condition>>>>;
  /** The parameter whose plural forms (zero, one, other) a case asks for when the case shows it. */
  readonly count?: string;
  /** List parameters joined with "and", and those joined with "or". */
  readonly list?: readonly string[];
  readonly or?: readonly string[];
  readonly lower?: readonly string[];
  /** Numbers shown without their sign, because the case's words carry the direction. */
  readonly abs?: readonly string[];
  /** Numbers shown with up to this many decimals. */
  readonly decimals?: Readonly<Record<string, number>>;
  /** The English of a case the function writes out in full, so no placeholder could show it (a list said in English). */
  readonly english?: Readonly<Record<string, string>>;
}

const ONE_OR_MORE = { one: { n: 1 }, more: {} };
/** A range whose ends meet says one number, its `max`; otherwise both. */
const ONE_NUMBER_OR_RANGE = { same: { min: '=max' }, range: {} };

/** "Needs about 5 to 10 cm more length, a few months of growth": both bands are words, so each pair is its own sentence. */
const CM: readonly (readonly [string, Condition | undefined])[] = [['5', '<=5'], ['10', '<=10'], ['20', '<=20'], ['More', undefined]];
const WEEKS: readonly (readonly [string, Condition | undefined])[] = [['', null], ['Months', '<=26'], ['Year', '<=52'], ['Longer', undefined]];
const GROWTH = Object.fromEntries(
  WEEKS.flatMap(([w, weeks]) =>
    CM.map(([c, cm]) => [`cm${c}${w}`, { ...(weeks === undefined ? {} : { weeks }), ...(cm === undefined ? {} : { cm }) }] as const),
  ),
);

/** The 3D view's position: which way it is turned and tilted, each sentence whole. */
const FACING = {
  front: { yaw: 0, tilt: 0 },
  left: { yaw: '<0', tilt: 0 },
  right: { yaw: '>0', tilt: 0 },
  up: { yaw: 0, tilt: '>0' },
  down: { yaw: 0, tilt: '<0' },
  leftUp: { yaw: '<0', tilt: '>0' },
  leftDown: { yaw: '<0', tilt: '<0' },
  rightUp: { yaw: '>0', tilt: '>0' },
  rightDown: { yaw: '>0', tilt: '<0' },
};

/** The inventory, by function string id; `source.ts` refuses an id that is no function string. */
export const FUNCTIONS: Readonly<Record<string, FunctionSpec>> = {
  'explore.allFiltersOn': { count: 'n' },
  'explore.count.styles': { count: 'n' },
  'explore.count.colours': { count: 'n' },
  'explore.count.beards': { count: 'n' },
  'explore.noResults': { cases: { one: { filters: 1 }, two: { filters: 2 }, more: {} } },
  'explore.noSearchResults': { cases: { filtered: { withFilters: true }, all: { withFilters: false } } },
  'explore.removeQuestion': { or: ['labels'] },
  'explore.detail.works.growth': { cases: { none: { min: 0, max: 0 }, weeks: {} }, count: 'max' },
  'explore.detail.or': { or: ['items'] },
  'explore.caption.and': { list: ['items'] },
  'explore.detail.trimDays': { count: 'max' },
  'explore.detail.dailyMinutes': { count: 'n' },
  'consult.photo.added': { count: 'n' },
  'consult.questions.limit': { cases: { refused: { refused: true }, none: { refused: false, n: 0 }, chosen: { refused: false } }, count: 'n' },
  'save.status.hoursLeft': { count: 'hours' },
  'saved.example.on': { lower: ['model', 'collection'] },
  'tryOn.cards.split': { cases: { all: { sizes: 1 }, split: {} }, list: ['sizes'], english: { split: '{sizes}' } },
  'tryOn.cards.title': { cases: { one: { total: 1 }, more: {} } },
  'tryOn.grids.name': { cases: { cuts: { kind: 'cut' }, colours: {} }, count: 'count' },
  'tryOn.grids.splitFailed': { count: 'count' },
  'ideas.colours.withColour': { cases: { plain: { label: '' }, labelled: {} } },
  'ideas.feasibility.growth': { cases: GROWTH },
  'ideas.improve.couldChange': { cases: ONE_OR_MORE, count: 'n' },
  'ideas.shortfall.found': { cases: { none: { n: 0 }, some: {} }, count: 'n' },
  'ideas.shortfall.removed': { count: 'n' },
  'ideas.aiPick.action': { cases: ONE_OR_MORE, count: 'n' },
  'ideas.givesWay': {
    cases: {
      greyGoalGrey: { way: 'grey_goal', grey: true },
      greyGoal: { way: 'grey_goal', grey: false },
      darkerGrey: { way: 'darker', grey: true },
      darker: { way: 'darker', grey: false },
      lighterGrey: { way: 'lighter', grey: true },
      lighter: { way: 'lighter', grey: false },
    },
  },
  'face.canvas': { list: ['names'], lower: ['names'] },
  'face.colour.skin': { lower: ['depth'] },
  'face.colour.undertone': { lower: ['answer'] },
  'face.mover.moveLabel': { lower: ['part'] },
  'face.mover.putBack': { lower: ['part'] },
  'extras.threeD.facing': { cases: FACING, abs: ['yaw', 'tilt'] },
  // The engine's joining words and the copy the screens show.
  'reasons.reason': { cases: { none: { phrases: 0 }, cut: { kind: 'cut' }, colour: { kind: 'colour' }, beard: { kind: 'beard' } }, list: ['phrases'] },
  'reasons.both': { list: ['parts'] },
  'reasons.weeks': { cases: ONE_OR_MORE, count: 'n' },
  'reasons.minutes': { cases: ONE_OR_MORE, count: 'n' },
  'copy.faceNotes.face.proportion.number': { decimals: { ratio: 2 } },
  'copy.facts.colour.bleach_count.value': { cases: { never: { n: 0 }, once: { n: 1 }, many: { n: '>=4' }, some: {} }, count: 'n', english: { some: '{n} times' } },
  'copy.sheet.cm': { cases: ONE_NUMBER_OR_RANGE },
  'copy.sheet.guard': { cases: { skin: { mm: 0 }, guard: {} }, decimals: { guard: 1 } },
  'copy.sheet.minutes': { cases: ONE_NUMBER_OR_RANGE, count: 'max' },
  'copy.sheet.weeks': { cases: { one: { min: 1, max: 1 }, ...ONE_NUMBER_OR_RANGE }, count: 'max' },
  'copy.sheet.percent': { cases: ONE_NUMBER_OR_RANGE },
  'copy.sheet.shade': { cases: ONE_NUMBER_OR_RANGE },
  // The answers' own words for the limits they store, then any other number.
  'copy.prompts.needs.trim': { cases: { w2: { weeks: 2 }, w4: { weeks: 4 }, w6: { weeks: 6 }, w12: { weeks: 12 }, other: {} }, count: 'weeks' },
  'copy.prompts.needs.styling': { cases: { m7: { minutes: 7 }, m12: { minutes: 12 }, m20: { minutes: 20 }, m60: { minutes: 60 }, other: {} }, count: 'minutes' },
  'copy.prompts.tradeOffs.styling': { count: 'minutes' },
  'copy.prompts.tradeOffs.trim': { cases: ONE_NUMBER_OR_RANGE, count: 'max' },
  'copy.prompts.tradeOffs.growth': { cases: { first: { weeks: null }, months: { weeks: '<=26' }, year: { weeks: '<=52' }, longer: {} } },
  'copy.prompts.tradeOffs.sentence': {
    cases: { growth: { limits: 0 }, one: { growth: null, limits: 1 }, two: { growth: null, limits: 2 }, growthOne: { limits: 1 }, growthTwo: { limits: 2 } },
    list: ['limits'],
    english: { two: 'Needs {limits}, both more than {said}', growthTwo: 'Needs {growth}, and {limits}, both more than {said}' },
  },
};
