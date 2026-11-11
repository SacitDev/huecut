/**
 * Zod schemas for every content file, generated from `FACTS` and `TRAITS` so the registry stays their one source, and
 * annotated `z.ZodType<T>` against the registry-derived types. Run directly to write `content/schema/*.schema.json` for editor help.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { Suitability } from '../../src/domain/content/suitability.ts';
import { FACTS, FACT_KEYS, type FactValue, type Range, type ValueSpec } from '../../src/domain/facts/registry.ts';
import { TRAITS, traitBy, type RangeSpec, type TargetKind, type TraitBy, type TraitSpec } from '../../src/domain/content/traits.ts';
import type * as C from '../../src/domain/content/types.ts';
import * as V from '../../src/domain/content/values.ts';

type Spec = ValueSpec | RangeSpec;
type Raw = Parameters<NonNullable<Exclude<z.core.$ZodObjectParams['error'], string>>>[0];

export const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are kebab-case: a-z, 0-9 and single hyphens');
const snake = z.string().regex(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/, 'expected snake_case');
const text = z.string().min(1, 'text cannot be empty');
export const hex = z.string().regex(/^#[0-9a-f]{6}$/, 'expected a colour as #rrggbb in lower case');
const count = (lo: number, hi: number) => z.int().min(lo).max(hi);
const enumOf = <const V extends readonly string[]>(values: V) => z.enum(values);

/** `[min, max]` inside `[lo, hi]`, with min <= max. */
export const range = (lo: number, hi: number): z.ZodType<Range> =>
  z.tuple([z.number().min(lo).max(hi), z.number().min(lo).max(hi)]).refine(([a, b]) => a <= b, 'a range is [min, max] with min <= max');

/** Unknown keys: a plain message, and a hint for the two keys rules most often get wrong. */
const keyError = (what: string) => (iss: Raw) => {
  if (iss.code !== 'unrecognized_keys') return undefined;
  if (iss.keys.includes('strength')) return 'strength belongs on rank rules only';
  if (iss.keys.includes('suppresses')) return 'journey records and referrals are never suppressed and suppress nothing; write the exception as mutually exclusive conditions';
  return `unknown ${what}: ${iss.keys.join(', ')}`;
};
const strict = <S extends z.core.$ZodLooseShape>(shape: S, what = 'key') => z.strictObject(shape, { error: keyError(what) });

/** A set value: distinct members; an exclusive value stands alone, and a set with one is never empty. */
const setValue = (values: readonly string[], exclusive: readonly string[] = []) =>
  z.array(z.enum(values)).superRefine((v, ctx) => {
    if (new Set(v).size !== v.length) ctx.addIssue({ code: 'custom', message: 'set members must be distinct' });
    for (const x of exclusive) if (v.includes(x) && v.length > 1) ctx.addIssue({ code: 'custom', message: `"${x}" cannot be combined with other values` });
    if (exclusive.length > 0 && v.length === 0) ctx.addIssue({ code: 'custom', message: `an empty set is written as ["${exclusive.join('", "')}"]` });
  });

/** The schema of a value of `spec`: what a fact or an item trait holds. */
export function valueOf(spec: Spec): z.ZodType {
  switch (spec.type) {
    case 'enum': return z.enum(spec.values);
    case 'set': return setValue(spec.values, spec.exclusive);
    case 'number': return z.number().min(spec.range[0]).max(spec.range[1]);
    case 'bool': return z.boolean();
    case 'range': return range(...spec.range);
  }
}

const tests = new Map<string, z.ZodType>();
/** The one value test a key may hold: `is`, `in`, `not` and `range` by spec type, `known` always. */
function testOf(spec: Spec): z.ZodType {
  const key = JSON.stringify([spec.type, 'values' in spec ? spec.values : 'range' in spec ? spec.range : null]);
  const cached = tests.get(key);
  if (cached) return cached;
  const one = <K extends string>(k: K, s: z.ZodType) => z.strictObject({ [k]: s } as Record<K, z.ZodType>);
  const scalar = spec.type === 'enum' || spec.type === 'set' ? z.enum(spec.values)
    : spec.type === 'bool' ? z.boolean() : z.number().min(spec.range[0]).max(spec.range[1]);
  const list = z.array(scalar).min(1);
  const forms: [string, z.ZodType][] = [['known', z.boolean()]];
  if (spec.type !== 'range') forms.push(['is', scalar]);
  if (spec.type !== 'range' && spec.type !== 'bool') forms.push(['in', list], ['not', list]);
  if (spec.type === 'number' || spec.type === 'range') forms.push(['range', range(...spec.range)]);
  const schema = z.union(forms.map(([k, f]) => one(k, f)), { error: `a value test is exactly one of: ${forms.map(([k]) => k).join(', ')}` });
  tests.set(key, schema);
  return schema;
}

/** A strict object of optional value tests over `specs` (a `when` map or a match). */
const testsOver = (specs: Record<string, Spec>, what: string) =>
  strict(Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, testOf(s).exactOptional()])), what);

export const whenSchema = testsOver(FACTS, 'fact key') as unknown as z.ZodType<C.When>;

const traitsOf = (kind: TargetKind) => TRAITS[kind] as Record<string, TraitSpec>;
/** A match over the traits of one target kind; it names at least one trait. */
const matchOf = <T extends TargetKind>(kind: T): z.ZodType<C.Match<T>> =>
  testsOver(traitsOf(kind), `${kind} trait`)
    .refine((m) => Object.keys(m).length > 0, 'a match names at least one trait') as unknown as z.ZodType<C.Match<T>>;
/** `on` holds one match; an OR becomes separate records with `from`. */
const onOf = <T extends TargetKind>(kind: T): z.ZodType<C.Match<T>> =>
  z.unknown().superRefine((v, ctx) => {
    if (Array.isArray(v)) ctx.addIssue({ code: 'custom', message: 'on holds one match; write an OR as separate records with from' });
  }).pipe(matchOf(kind));

/** The item traits written by `by` (all required), or a partial of them for variant changes. */
const itemTraits = (kind: TargetKind, by: TraitBy, partial = false) =>
  strict(Object.fromEntries(Object.entries(traitsOf(kind)).filter(([, s]) => traitBy(s) === by)
    .map(([k, s]) => [k, partial ? valueOf(s).exactOptional() : valueOf(s)])), `${kind} trait`);

// ── Shared parts ──

const reviewSchema: z.ZodType<C.Review> = strict({ status: enumOf(V.REVIEW_STATUSES), date: z.iso.date(), note: text.exactOptional() });
const sourceSchema: z.ZodType<C.Source> = strict({ url: z.url(), supports: text, level: enumOf(V.EVIDENCE) });
const collections = z.array(enumOf(V.COLLECTIONS)).min(1);
const aliases = z.array(text);
const fit: z.ZodType<C.Fit> = strict({ fit: enumOf(V.FITS), note: text.exactOptional(), daily: z.literal(true).exactOptional() });
const zone: z.ZodType<C.Zone> = z.union([strict({ cm: range(0, 150) }), strict({ guard_mm: range(0, 40) })], { error: 'a zone is { "cm": [min, max] } or { "guard_mm": [min, max] }' });
const fadeShape = { kind: enumOf(V.FADE_KINDS), height: enumOf(V.FADE_HEIGHTS).nullable(), start_mm: z.number().min(0).max(25), note: text.nullable() };
const fade: z.ZodType<C.Fade> = strict(fadeShape).refine((f) => f.kind !== 'fade' || f.height !== null, 'a plain fade names its height');
const fringeKind = enumOf(TRAITS.cut.fringe.values);
const fringe: z.ZodType<C.Fringe> = strict({ kind: fringeKind, landmark: snake.nullable(), options: z.array(fringeKind) });
const perimeter = strict({ landmark: enumOf(V.PERIMETER_LANDMARKS).nullable() });
const neckline = enumOf(V.CUT_NECKLINES).nullable();
const images: z.ZodType<C.Images> = strict({ model: kebab, views: z.array(enumOf(V.VIEWS)).min(1), shown_on: text.exactOptional() });
const otherZones = { fringe: zone.nullable(), sides: zone.nullable(), back: zone.nullable(), nape: zone.nullable() };

const variantSchema: z.ZodType<C.Variant> = strict({
  id: kebab,
  name: text,
  changes: strict({
    zones: strict(Object.fromEntries(V.ZONES.map((k) => [k, (k === 'top' ? zone : zone.nullable()).exactOptional()]))).exactOptional(),
    perimeter: perimeter.exactOptional(),
    fade: strict(Object.fromEntries(Object.entries(fadeShape).map(([k, s]) => [k, s.exactOptional()]))).nullable().exactOptional(),
    fringe: fringe.nullable().exactOptional(),
    neckline: neckline.exactOptional(),
    traits: itemTraits('cut', 'authored', true).exactOptional(),
  }),
  prompt_spec: text,
  client: text.exactOptional(),
});

// ── Items ──

export const haircutSchema: z.ZodType<C.Haircut> = strict({
  id: kebab, kind: z.literal('cut'), name: text, aliases, collections, family: snake,
  zones: strict({ basis: z.literal('dry_stretched'), top: zone, ...otherZones }),
  perimeter, fade: fade.nullable(), neckline, sideburns: text.nullable(), fringe: fringe.nullable(),
  texture_fit: strict({ straight: fit, wavy: fit, curly: fit, coily: fit }),
  density_fit: strict({ low: fit, medium: fit, high: fit }),
  shrinkage: strict({ curly_pct: range(0, 100), coily_pct: range(0, 100) }).nullable(),
  growth: strict({ recession_stage_max: count(1, 7).nullable(), whorl_note: text.nullable(), note: text.nullable() }),
  strand_note: text.nullable(), density_note: text.nullable(), glasses_note: text.nullable(),
  upkeep: strict({ styling_minutes: range(0, 60), trim_weeks: range(1, 26), heat: enumOf(V.HEAT_USE), products: z.array(text) }),
  grow_out: text.nullable(), era: snake,
  pairs_with: strict({ beards: z.array(kebab), looks: z.array(kebab) }),
  traits: itemTraits('cut', 'authored') as unknown as z.ZodType<C.Haircut['traits']>,
  variants: z.array(variantSchema),
  client: text, stylist: text, images, prompt_spec: text, sources: z.array(sourceSchema), review: reviewSchema,
});

export const beardSchema: z.ZodType<C.BeardStyle> = strict({
  id: kebab, kind: z.literal('beard'), name: text, aliases, collections,
  zones_mm: strict(Object.fromEntries(V.BEARD_ZONES.map((k) => [k, range(0, 200)])) as Record<(typeof V.BEARD_ZONES)[number], z.ZodType<Range>>),
  cheek_line: enumOf(TRAITS.beard.cheek_line.values), neckline: enumOf(TRAITS.beard.neckline.values),
  growth: strict({ weeks_needed: range(0, 52), note: text.nullable() }),
  upkeep: strict({ trim_days: range(1, 90), daily_minutes: z.number().min(0).max(60), products: z.array(text) }),
  pairs_with: strict({ cuts: z.array(kebab) }),
  traits: itemTraits('beard', 'authored') as unknown as z.ZodType<C.BeardStyle['traits']>,
  client: text, stylist: text, images, prompt_spec: text, sources: z.array(sourceSchema), review: reviewSchema,
});

export const shadeSchema: z.ZodType<C.Shade> = strict({
  id: kebab, kind: z.literal('shade'), name: text, aliases,
  family: enumOf(TRAITS.colour.family.values), level: range(1, 10), tone: enumOf(TRAITS.colour.tone.values),
  warmth: enumOf(TRAITS.colour.warmth.values), tone_description: text,
  swatch: strict({ root: hex, mids: hex, ends: hex }),
  maintenance: strict({
    fade_speed: enumOf(V.FADE_SPEEDS), gloss_weeks: range(1, 52).nullable(), retouch_weeks: range(1, 52).nullable(),
    regrowth_visibility: enumOf(V.LEVELS), upkeep_level: count(1, 5),
  }),
  risks: z.array(text), vivid: z.boolean(), client: text, stylist: text, sources: z.array(sourceSchema),
  evidence: enumOf(V.EVIDENCE), review: reviewSchema,
});

const families = z.array(enumOf(TRAITS.colour.family.values));
export const techniqueSchema: z.ZodType<C.Technique> = strict({
  id: kebab, kind: z.literal('technique'), name: text, category: enumOf(TRAITS.colour.technique_category.values),
  how: text, regions: z.array(enumOf(V.REGIONS)).min(1), lightening: enumOf(TRAITS.colour.lightening.values),
  lifts: strict({ natural: count(0, 9), coloured: count(0, 9) }), pairs_with: strict({ families, avoid: families }), regrowth_friendliness: count(1, 5),
  revisit_weeks: range(1, 26), session_hours: range(0, 12), damage_risk: enumOf(V.LEVELS), salon_only: z.boolean(),
  client: text, stylist: text, sources: z.array(sourceSchema), evidence: enumOf(V.EVIDENCE), review: reviewSchema,
});

export const lookSchema: z.ZodType<C.ColourLook> = strict({
  id: kebab, kind: z.literal('colour'), name: text, aliases: aliases.exactOptional(), collections,
  base: strict({ shade: kebab, technique: enumOf(V.BASE_TECHNIQUES), on: kebab.exactOptional(), on_words: z.array(text).exactOptional() }),
  placements: z.array(strict({ technique: enumOf(TRAITS.colour.technique.values), shade: kebab, region: enumOf(V.REGIONS) })),
  required_base_level: count(1, 10).nullable(), grey: enumOf(V.GREY_EFFECTS),
  client: text, stylist: text,
  images: strict({ models: z.array(kebab).min(1), view: enumOf(V.VIEWS) }),
  prompt_spec: text, sources: z.array(sourceSchema).exactOptional(), review: reviewSchema,
}).refine((l) => l.base.technique !== 'none' || l.placements.length > 0, 'a look with a "none" base needs at least one placement')
  .refine((l) => (l.base.technique === 'none') === (l.base.on !== undefined) && (l.base.on === undefined) === (l.base.on_words === undefined), 'a look names the colour it is designed on ("base.on") and the words that picture it ("base.on_words") exactly when its base is "none"');

// ── Rules ──

const common = {
  id: kebab, from: kebab.exactOptional(), group: enumOf(V.RULE_GROUPS), when: whenSchema,
  min: strict(Object.fromEntries(FACT_KEYS.map((k) => [k, enumOf(['low', 'medium', 'high']).exactOptional()])), 'fact key').exactOptional(),
  suppresses: z.array(kebab).min(1).exactOptional(), evidence: enumOf(V.EVIDENCE), sources: z.array(z.url()).exactOptional(),
  review: reviewSchema,
};

/** The rank, note and exclude records of one rules file; `target` must be that file's kind. */
export const ruleSchema = <T extends TargetKind>(kind: T): z.ZodType<C.RuleFor<T>> => {
  const target = z.literal(kind);
  const rank = strict({ ...common, target, effect: z.literal('rank'), strength: enumOf(V.STRENGTHS), favour: z.array(matchOf(kind)), disfavour: z.array(matchOf(kind)), reason: text })
    .refine((r) => r.favour.length + r.disfavour.length > 0, 'a rank rule has at least one favour or disfavour match');
  const note = strict({ ...common, target, effect: z.literal('note'), note: enumOf(V.NOTE_KINDS), on: onOf(kind).exactOptional(), because: text });
  const exclude = strict({ ...common, target, effect: z.literal('exclude'), on: onOf(kind), because: text });
  return z.discriminatedUnion('effect', [rank, note, exclude], { error: 'effect is rank, note or exclude' });
};

export const journeySchema: z.ZodType<C.JourneyRecord> = strict({
  id: kebab, from: kebab.exactOptional(), effect: z.literal('label'), label: enumOf(V.JOURNEY_LABELS), when: whenSchema,
  on: onOf('colour').exactOptional(), because: text, what_to_ask: text, evidence: enumOf(V.EVIDENCE),
  sources: z.array(z.url()).exactOptional(), review: reviewSchema,
});

const reminder: z.ZodType<C.Reminder> = strict({
  id: kebab, kind: z.literal('reminder'), text, applies_to: z.literal('every_colour_look').exactOptional(),
  on: onOf('colour').exactOptional(), review: reviewSchema,
}).refine((r) => (r.applies_to === undefined) !== (r.on === undefined), 'a reminder has exactly one of applies_to and on');
const referral: z.ZodType<C.Referral> = strict({ id: kebab, kind: z.literal('referral'), when: whenSchema, text, replaces_suggestions: z.literal(true), review: reviewSchema });
export const reminderSchema: z.ZodType<C.Reminder | C.Referral> = z.union([reminder, referral], { error: 'kind is reminder or referral' });

// ── Questions ──
export const pictureKeySchema = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+-(front|side|back)$/, 'a picture key is <model-id>/<item-id>-<view>');
const perCollection = (value: z.ZodType<string>) => strict(Object.fromEntries(V.COLLECTIONS.map((c) => [c, value.exactOptional()])) as unknown as Record<V.Collection, z.ZodType<string>>, 'collection').exactOptional();
const optionExtras = { label: text, illustration: kebab.exactOptional(), follow_up: kebab.exactOptional() };
const option = z.union([
  strict({ value: z.union([z.string(), z.number(), z.boolean()]).nullable(), picture: perCollection(pictureKeySchema), note: perCollection(text), ...optionExtras }),
  strict({ sets: z.record(z.string(), z.unknown()), ...optionExtras }),
  strict({ none_of_these: z.literal(true), label: text }),
  strict({ label: text, fact: enumOf(FACT_KEYS.filter((k) => k.startsWith('wish.'))), value: enumOf(['preserve', 'emphasise', 'soften']) }),
], { error: 'an option is { value, label }, { sets, label }, { none_of_these, label } or a wish { label, fact, value }' });

type Add = (message: string, path?: (string | number)[]) => void;

/** A value option writes a value of the question's fact; a set fact takes one member per option. */
function checkValue(q: C.Question, value: C.OptionValue, at: (string | number)[], add: Add): void {
  const spec = q.fact ? FACTS[q.fact] : undefined;
  const member = spec === undefined ? undefined : spec.type === 'set' ? z.enum(spec.values) : valueOf(spec);
  if (!member) add('an option with a value needs the question to name its fact', at);
  else if (!member.safeParse(value).success) add(`${JSON.stringify(value)} is not a value of ${q.fact ?? ''}`, at);
}

/** A sets option writes known facts with valid values, on a question that names no fact of its own. */
function checkSets(q: C.Question, sets: Readonly<Record<string, unknown>>, at: (string | number)[], add: Add): void {
  if (q.fact) add('a question that names its fact uses value options, not sets', at);
  for (const [k, v] of Object.entries(sets)) {
    const s = (FACTS as Partial<Record<string, ValueSpec>>)[k];
    if (!s) add(`unknown fact key: ${k}`, [...at, k]);
    else if (!valueOf(s).safeParse(v).success) add(`${JSON.stringify(v)} is not a value of ${k}`, [...at, k]);
  }
}

/** One option against the question's fact and the registry. */
function checkOption(q: C.Question, o: C.QuestionOption, at: (string | number)[], add: Add): void {
  const spec = q.fact ? FACTS[q.fact] : undefined;
  if ((q.type === 'wishes') !== ('fact' in o)) add(q.type === 'wishes' ? 'the wishes question has wish options only' : 'wish options belong to the wishes question', at);
  if ('value' in o && o.value !== null && !('fact' in o)) checkValue(q, o.value, [...at, 'value'], add);
  if ('sets' in o) checkSets(q, o.sets, [...at, 'sets'], add);
  if ('none_of_these' in o && (spec?.type !== 'set' || (spec.values as readonly string[]).includes('none'))) {
    add('"None of these" belongs on a set without a "none" value; elsewhere write the "none" value', at);
  }
}

/** The options against the question's fact, using the registry: "Not sure" once, no repeated value. */
function checkOptions(q: C.Question, ctx: z.core.$RefinementCtx<C.Question>): void {
  const add: Add = (message, path = []) => { ctx.addIssue({ code: 'custom', message, path }); };
  const spec = q.fact ? FACTS[q.fact] : undefined;
  const seen = new Set<string>();
  q.options.forEach((o, i) => {
    const key = JSON.stringify('sets' in o ? o.sets : 'fact' in o ? [o.fact, o.value] : 'value' in o ? o.value : 'none');
    if (seen.has(key)) add('two options write the same value', ['options', i]);
    seen.add(key);
    checkOption(q, o, ['options', i], add);
  });
  const notSure = q.options.filter((o) => 'value' in o && o.value === null).length;
  if (q.type === 'wishes' && q.fact) add('the wishes question names no fact; each option names its own', ['fact']);
  if (q.type !== 'wishes' && notSure !== 1) add('every question offers "Not sure" exactly once ({ "value": null })', ['options']);
  if (spec && (spec.type === 'set') !== (q.type === 'multi')) add(`${q.fact ?? ''} is ${spec.type === 'set' ? 'a set, asked as multi' : 'one value, asked as single'}`, ['type']);
}

export const questionSchema: z.ZodType<C.Question> = strict({
  id: kebab, fact: enumOf(FACT_KEYS).exactOptional(), type: enumOf(['single', 'multi', 'wishes']),
  goals: z.array(enumOf(V.GOALS)).min(1), collections, prompt: text, help: text.exactOptional(), max: count(1, 6).exactOptional(),
  show_if: whenSchema.exactOptional(), options: z.array(option).min(1),
}).superRefine(checkOptions);

export const coreSetsSchema: z.ZodType<C.QuestionsFile['core_sets']> = strict(
  Object.fromEntries(V.CORE_SETS.map((s) => [s, z.array(kebab)])) as unknown as Record<V.CoreSetName, z.ZodType<string[]>>,
  'core set',
);

// ── Bands, policy, phrases, models, pictures, prompt headers ──

export const bandsSchema: z.ZodType<C.Bands> = strict({
  bands: z.array(strict({
    fact: enumOf(FACT_KEYS), from: snake, view: enumOf(V.MEASURE_VIEWS),
    cuts: z.array(strict({ below: z.number().nullable().exactOptional(), value: snake })).min(2),
    margin: z.number().min(0).nullable(), requires: z.array(enumOf(V.BAND_GATES)).exactOptional(),
  }).superRefine((b, ctx) => {
    const spec: ValueSpec = FACTS[b.fact];
    if (FACTS[b.fact].from !== 'measured') ctx.addIssue({ code: 'custom', message: `${b.fact} is not a measured fact`, path: ['fact'] });
    const values = b.cuts.map((c) => c.value);
    if (spec.type !== 'enum' || values.some((v) => !spec.values.includes(v))) ctx.addIssue({ code: 'custom', message: `every value must be a value of ${b.fact}`, path: ['cuts'] });
    if (new Set(values).size !== values.length) ctx.addIssue({ code: 'custom', message: 'band values must be distinct', path: ['cuts'] });
    b.cuts.forEach((c, i) => {
      const last = i === b.cuts.length - 1;
      if (last === ('below' in c)) ctx.addIssue({ code: 'custom', message: last ? 'the last cut has no "below"' : 'every cut but the last has "below" (a number, or null until step 2)', path: ['cuts', i] });
    });
    const belows = b.cuts.flatMap((c) => (typeof c.below === 'number' ? [c.below] : []));
    if (belows.some((x, i) => i > 0 && x <= (belows[i - 1] ?? -Infinity))) ctx.addIssue({ code: 'custom', message: 'thresholds must ascend', path: ['cuts'] });
  })),
  current_length_cm: strict(Object.fromEntries(FACTS['hair.current_length'].values.map((v) => [v, range(0, 200)])) as Record<FactValue<'hair.current_length'>, z.ZodType<Range>>)
    .refine((m) => Object.values(m).every((r, i, all) => r[0] >= (all[i - 1]?.[0] ?? 0)), 'the cm bands must ascend in the order of the length values'),
});

const share = z.number().min(0).max(1);
const factors = <K extends string>(keys: readonly K[]) => strict(Object.fromEntries(keys.map((k) => [k, z.number().min(0)])) as Record<K, z.ZodNumber>);
const AIMS = ['soften', 'between', 'preserve', 'emphasise'] as const, CHANGE_ROWS = ['subtle', 'noticeable', 'bold', 'unknown'] as const, FITS = ['good', 'adapt', 'poor'] as const, tauCap = strict({ tau: z.number().positive(), cap: z.number().positive() });

/** The ranking constants of the suitability score; the because lines stay client text, so the banned-word check reads them. */
const suitabilitySchema: z.ZodType<Suitability> = strict({
  rules: tauCap, texture_fit: factors(FITS), density_fit: factors(FITS),
  trim: strict({ power: z.number().positive(), floor: share, miss: share }), styling: strict({ grace_minutes: z.number().min(0), power: z.number().positive(), floor: share, miss: share }), growth_weeks: z.number().positive(),
  change: strict(Object.fromEntries(CHANGE_ROWS.map((k) => [k, z.array(share).min(1)])) as Record<(typeof CHANGE_ROWS)[number], z.ZodArray<typeof share>>),
  frame: strict({
    balance: z.number().positive(), jaw_balance: z.number().positive(), sigma: z.number().positive(), jaw_sigma: z.number().positive(), floor: share, emphasise: z.number().min(0),
    no_wish_aims: z.array(enumOf(AIMS)).min(1),
    sides: factors(['close', 'medium', 'full']), height: factors(['flat', 'low', 'medium', 'high']), length: factors(TRAITS.cut.length_class.values),
    fringe: factors(['none', 'micro', 'short_blunt', 'blunt_full', 'bottleneck', 'wispy', 'curtain', 'side_swept', 'long_side', 'textured_forward', 'curly']),
    zones: factors(['sides', 'temples', 'crown', 'jaw', 'ends']), texture: factors(['straight', 'wavy', 'curly', 'coily', 'mixed']),
    jaw_clear: range(0.5, 1.3), thirds: strict({ miss: share, heavy_fringes: z.array(enumOf(TRAITS.cut.fringe.values)) }) }),
  colour: strict({ tau: z.number().positive(), cap: z.number().positive(), lift_step: z.number().min(0), label: factors(['plausible', 'uncertain', 'needs_professional']), harmony: strict({ sigma: z.number().positive(), lightness: z.number().min(0), targets: strict({ warm: z.number(), neutral: z.number(), olive: z.number(), cool: z.number() }) }) }),
  slate: strict({ lambda: share, floor: share, weights: z.record(z.string(), z.number().positive()) }),
  beards: strict({ scale_mm: z.number().positive(), sigma: z.number().positive(), shown: count(1, 18),
    patchy: strict({ full_mm: z.number().min(0), full: share, some_mm: z.number().min(0), some: share }), not_paired: share, wish_note: z.number().min(1), short_chin_mm: z.number().min(0) }),
  because: strict({ trim: text, styling: text, density: text,
    does: strict({ adds_height: text, keeps_top_low: text, sides_close: text, adds_width: text, fringe_line: text, balanced: text }),
    aim: strict({ soften: text, between: text, preserve: text, emphasise: text }), decisive_ratio: z.number().min(1) }),
  sources: z.record(z.string(), text),
});

export const policySchema: z.ZodType<C.Policy> = strict({
  weights: strict({ weak: z.number().positive(), moderate: z.number().positive(), strong: z.number().positive() }),
  count: strict({ min: count(1, 20), default: count(1, 20), max: count(1, 20) }).refine((c) => c.min <= c.default && c.default <= c.max, 'count needs min <= default <= max'),
  both_split: z.literal('cut_first_half'), grid_max_tiles: count(1, 4), max_per_silhouette: count(1, 20),
  min_distinct_silhouettes_share: share,
  low_upkeep: strict({ max_styling_minutes: count(0, 60), min_trim_weeks: count(1, 26) }),
  max_reasons: count(1, 10), reason_group_order: z.array(enumOf(V.RULE_GROUPS)).refine((g) => new Set(g).size === g.length && g.length === V.RULE_GROUPS.length, 'list every rule group once'),
  pool_size: count(1, 100),
  change_span: z.number().nullable(), length_span: z.number().nullable(), colour_variety: z.number().nullable(),
  upkeep_stack: z.number().nullable(), growth_cm_per_month: z.number().positive().nullable(),
  suitability: suitabilitySchema.exactOptional(),
});

export const phrasesSchema: z.ZodType<Record<string, string>> = z.record(
  z.string().regex(/^[a-z_]+\.[a-z0-9_-]+$/, 'a phrase key is "<trait>.<value>" or "<trait>.<min>-<max>"'), text);

export const modelSchema: z.ZodType<C.LibraryModel> = strict({
  id: kebab, collection: enumOf(V.COLLECTIONS), hair_group: enumOf(V.HAIR_GROUPS), label: text, shown_on: text,
  base_pictures: strict({ front: z.string(), side: z.string(), back: z.string() }),
  example: z.string().regex(/^examples\/[a-z0-9-]+\.json$/, 'expected examples/<model-id>.json'), licence: text,
}).refine((m) => m.example === `examples/${m.id}.json`, 'the example is examples/<model-id>.json');

export const pictureEntrySchema: z.ZodType<C.PictureEntry> = strict({
  widthPx: count(1, 20000), heightPx: count(1, 20000), widths: z.array(count(1, 20000)).min(1), average: hex, bytes: count(1, 1e9),
  quality: count(1, 100).exactOptional(),
});
const picturesSchema: z.ZodType<Record<string, C.PictureEntry>> = z.record(pictureKeySchema, pictureEntrySchema);

export const promptHeaderSchema: z.ZodType<C.PromptHeader> = strict({
  template: enumOf(V.PROMPT_KINDS), kind: enumOf(['image', 'text']), word_budget: count(1, 1000), keep_list: z.boolean(),
  variables: z.array(z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/, 'a variable is snake_case or a fact key')),
}, 'header key');

/** The schema of every JSON content file, for editor help. Array files hold one record per element. */
export const FILE_SCHEMAS = {
  haircuts: z.array(haircutSchema), beards: z.array(beardSchema), shades: z.array(shadeSchema),
  techniques: z.array(techniqueSchema), looks: z.array(lookSchema),
  'rules-cuts': z.array(ruleSchema('cut')), 'rules-colours': z.array(ruleSchema('colour')), 'rules-beards': z.array(ruleSchema('beard')),
  journey: z.array(journeySchema), reminders: z.array(reminderSchema),
  questions: strict({ questions: z.array(questionSchema), core_sets: coreSetsSchema }),
  bands: bandsSchema, policy: policySchema, phrases: phrasesSchema, 'library-models': z.array(modelSchema), pictures: picturesSchema,
} as const satisfies Record<string, z.ZodType>;

/** Writes `content/schema/<name>.schema.json` for each file schema. */
export function writeJsonSchemas(contentDir: string): string[] {
  const dir = join(contentDir, 'schema');
  mkdirSync(dir, { recursive: true });
  return Object.entries(FILE_SCHEMAS).map(([name, schema]) => {
    const file = join(dir, `${name}.schema.json`);
    writeFileSync(file, `${JSON.stringify(z.toJSONSchema(schema, { reused: 'ref', unrepresentable: 'any' }), null, 2)}\n`);
    return file;
  });
}

if (import.meta.main) {
  for (const file of writeJsonSchemas(join(import.meta.dirname, '..', '..', 'content'))) console.log(`wrote ${file}`);
}
