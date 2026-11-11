/**
 * Cross-file checks on records: every reference resolves, ids are unique and in `ids.lock`,
 * every checked item has its pictures and none is an orphan, every question illustration has its file, and client
 * text holds no banned word.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRAITS, TARGET_KINDS } from '../../src/domain/content/traits.ts';
import type { BeardStyle, ColourLook, Haircut, Review } from '../../src/domain/content/types.ts';
import { techniqueId } from './derive.ts';
import { pathOf, type At, type Ctx } from './load.ts';

const isChecked = (r: { readonly review: Review }): boolean => r.review.status === 'checked';

/** Reports an unknown id, or a checked record using a draft one. Returns whether the id resolved. */
function ref(ctx: Ctx, at: { file: string; path: string }, id: string, target: ReadonlyMap<string, At<{ review: Review }>>, what: string, fromChecked: boolean): boolean {
  const t = target.get(id);
  if (!t) ctx.sink.error(at.file, at.path, `unknown ${what} "${id}"`);
  else if (fromChecked && !isChecked(t.value)) ctx.sink.error(at.file, at.path, `a checked record cannot use the draft ${what} "${id}"; check it first`);
  return t !== undefined;
}

/** The model exists and shows the record's collection: each look on its matching model. */
function modelRef(ctx: Ctx, file: string, path: string, id: string, collections: readonly string[]): void {
  const m = ctx.ix.models.get(id);
  if (!m) ctx.sink.error(file, path, `unknown library model "${id}"`);
  else if (!collections.includes(m.value.collection)) ctx.sink.error(file, path, `the ${m.value.collection} model "${id}" does not show a ${collections.join(' or ')} record`);
}

function cutAndBeardRefs(ctx: Ctx): void {
  for (const { value: c, file, path } of ctx.content.cuts) {
    if (ctx.content.variantOf.has(c.id)) continue;
    modelRef(ctx, file, `${path}.images.model`, c.images.model, c.collections);
    c.pairs_with.beards.forEach((b, i) => ref(ctx, { file, path: pathOf(path, ['pairs_with', 'beards', i]) }, b, ctx.ix.beards, 'beard', isChecked(c)));
    c.pairs_with.looks.forEach((l, i) => ref(ctx, { file, path: pathOf(path, ['pairs_with', 'looks', i]) }, l, ctx.ix.looks, 'colour look', isChecked(c)));
  }
  for (const { value: b, file, path } of ctx.content.beards) {
    modelRef(ctx, file, `${path}.images.model`, b.images.model, b.collections);
    b.pairs_with.cuts.forEach((c, i) => ref(ctx, { file, path: pathOf(path, ['pairs_with', 'cuts', i]) }, c, ctx.ix.cuts, 'cut', isChecked(b)));
  }
}

/** Shades and technique records resolve, and each placement sits in a region its technique allows. */
function lookRefs(ctx: Ctx): void {
  for (const { value: l, file, path } of ctx.content.looks) {
    const checked = isChecked(l);
    l.images.models.forEach((m, i) => { modelRef(ctx, file, pathOf(path, ['images', 'models', i]), m, l.collections); });
    ref(ctx, { file, path: `${path}.base.shade` }, l.base.shade, ctx.ix.shades, 'shade', checked);
    if (l.base.on !== undefined) ref(ctx, { file, path: `${path}.base.on` }, l.base.on, ctx.ix.shades, 'shade', checked);
    if (l.base.technique !== 'none') ref(ctx, { file, path: `${path}.base.technique` }, techniqueId(l.base.technique), ctx.ix.techniques, 'technique', checked);
    l.placements.forEach((p, i) => {
      const at = pathOf(path, ['placements', i]);
      ref(ctx, { file, path: `${at}.shade` }, p.shade, ctx.ix.shades, 'shade', checked);
      const t = ctx.ix.techniques.get(techniqueId(p.technique));
      if (ref(ctx, { file, path: `${at}.technique` }, techniqueId(p.technique), ctx.ix.techniques, 'technique', checked) && t && !t.value.regions.includes(p.region)) {
        ctx.sink.error(file, `${at}.region`, `${p.technique} may be placed in ${t.value.regions.join(', ')}, not ${p.region}`);
      }
    });
  }
}

/** Technique ids are technique values in kebab-case; the full set has one record per value. */
function techniqueIds(ctx: Ctx): void {
  const values: readonly string[] = TRAITS.colour.technique.values;
  for (const { value: t, file, path } of ctx.content.techniques) {
    if (!values.includes(t.id.replaceAll('-', '_'))) ctx.sink.error(file, `${path}.id`, `"${t.id}" is not the kebab-case form of a technique value (${values.join(', ')})`);
  }
  if (ctx.options.complete ?? true) {
    for (const v of values) if (!ctx.ix.techniques.has(techniqueId(v))) ctx.sink.error('colours/techniques.json', '$', `no technique record for "${v}" (id "${techniqueId(v)}")`);
  }
}

/** A split record's `from` names its research rule or journey record. */
function fromRefs(ctx: Ctx): void {
  for (const k of TARGET_KINDS) for (const { value: r, file, path } of ctx.content.rules[k]) {
    if (r.from !== undefined && !ctx.ix.rules.has(r.from)) ctx.sink.error(file, `${path}.from`, `unknown rule "${r.from}"`);
  }
  for (const { value: j, file, path } of ctx.content.journey) {
    if (j.from !== undefined && !ctx.ix.journeyIds.has(j.from)) ctx.sink.error(file, `${path}.from`, `unknown journey record "${j.from}"`);
  }
}

/** A model's base pictures are keys of its own views in `pictures.json`. */
function basePictureRefs(ctx: Ctx): void {
  for (const { value: m, file, path } of ctx.content.models) {
    for (const [view, key] of Object.entries(m.base_pictures)) {
      if (!key.startsWith(`${m.id}/`) || !key.endsWith(`-${view}`)) ctx.sink.error(file, `${path}.base_pictures.${view}`, `expected a picture key "${m.id}/<name>-${view}"`);
      else if (!(key in ctx.content.pictures)) ctx.sink.error(file, `${path}.base_pictures.${view}`, `no picture "${key}" in pictures.json`);
    }
  }
}

/**
 * Every vivid look is lightened first: with `vivid-deep-on-dark` retired, the cautious label for very dark
 * hair comes from `vivid-on-dark`, which needs the `prelightening` trait.
 */
function vividPrelightened(ctx: Ctx): void {
  for (const { value: look, file, path } of ctx.content.looks) {
    const t = ctx.content.traits.colour.get(look.id);
    if (t?.vivid && !t.prelightening) ctx.sink.error(file, `${path}.required_base_level`, `${look.id} uses a vivid shade, so it must name a required base level`);
  }
}

/**
 * A look that keeps the person's own colour marks the words of its `prompt_spec` that picture the colour it is designed on, each
 * once and none inside another, so a person's prompt gives their own colour there. Where that colour shows (no root
 * placement, or not both the mids and the ends placed) at least one is marked.
 */
function baseWords(ctx: Ctx): void {
  for (const { value: look, file, path } of ctx.content.looks) {
    const words = look.base.on_words ?? [];
    words.forEach((w, i) => {
      const at = `${path}.base.on_words[${String(i)}]`;
      if (look.prompt_spec.split(w).length !== 2) ctx.sink.error(file, at, `"${w}" is not in the prompt_spec of ${look.id} exactly once`);
      if (words.some((other, j) => j !== i && other.includes(w))) ctx.sink.error(file, at, `"${w}" is inside another of ${look.id}'s base words`);
    });
    const placed = new Set(look.placements.map((p) => p.region));
    const shows = !placed.has('root') || !placed.has('mids') || !placed.has('ends');
    if (look.base.technique === 'none' && shows && words.length === 0) {
      ctx.sink.error(file, `${path}.base.on_words`, `${look.id} keeps the person's own colour where no placement covers it: mark the words of its prompt_spec that picture "${String(look.base.on)}"`);
    }
  }
}

/** Every reference resolves. */
export function checkReferences(ctx: Ctx): void {
  cutAndBeardRefs(ctx);
  lookRefs(ctx);
  techniqueIds(ctx);
  fromRefs(ctx);
  basePictureRefs(ctx);
  vividPrelightened(ctx);
  baseWords(ctx);
}

/** Ids are unique across kinds and listed in `ids.lock`; an id is retired, never silently removed. */
export function checkIds(ctx: Ctx): void {
  const c = ctx.content;
  const seen = new Map<string, string>();
  const lists: readonly (readonly At<{ id: string }>[])[] = [c.cuts, c.beards, c.shades, c.techniques, c.looks,
    ...TARGET_KINDS.map((k) => c.rules[k]), c.journey, c.reminders, c.questions, c.models];
  for (const { value: { id }, file, path } of lists.flat()) {
    const prev = seen.get(id);
    const lock = c.lock.get(id);
    if (prev) ctx.sink.error(file, `${path}.id`, `id "${id}" is also used at ${prev}; ids are unique across kinds`);
    else if (!lock) ctx.sink.error(file, `${path}.id`, `"${id}" is not in ids.lock`);
    else if (lock.retired) ctx.sink.error(file, `${path}.id`, `"${id}" is retired in ids.lock (line ${String(lock.line)})`);
    if (!prev) seen.set(id, `${file} ${path}`);
  }
  for (const [id, { retired, line }] of c.lock) {
    if (!retired && !seen.has(id)) ctx.sink.error('ids.lock', `line ${String(line)}`, `no record has the id "${id}"; an id is retired ("${id} retired"), never removed`);
  }
}

/** The `content/pictures.json` keys an item's images name. */
export const pictureKeys = (v: Haircut | BeardStyle | ColourLook): string[] =>
  v.kind === 'colour' ? v.images.models.map((m) => `${m}/${v.id}-${v.images.view}`) : v.images.views.map((view) => `${v.images.model}/${v.id}-${view}`);

/** Every checked item has its pictures and no picture is an orphan, from the index `scripts/images.ts` writes. */
export function checkPictures(ctx: Ctx): void {
  const expected = new Set<string>();
  const items: readonly At<Haircut | BeardStyle | ColourLook>[] = [...ctx.content.cuts, ...ctx.content.beards, ...ctx.content.looks];
  for (const at of items) {
    for (const key of pictureKeys(at.value)) {
      expected.add(key);
      if (isChecked(at.value) && !(key in ctx.content.pictures)) ctx.sink.error(at.file, `${at.path}.images`, `checked, but pictures.json has no "${key}"`);
    }
  }
  for (const { value: m } of ctx.content.models) for (const key of Object.values(m.base_pictures)) expected.add(key);
  for (const key of Object.keys(ctx.content.pictures)) {
    if (!expected.has(key)) ctx.sink.error('pictures.json', pathOf('$', [key]), `orphan picture: no record or model view "${key}"`);
  }
}

/** The app's question illustrations; the site serves them as `illustrations/`. */
const ILLUSTRATIONS = fileURLToPath(new URL('../../public/illustrations/', import.meta.url));

/** The file an illustration id names in `public/illustrations/`: its SVG drawing, else its AVIF photo; null when neither exists. */
export const illustrationFile = (id: string): string | null =>
  [`${id}.svg`, `${id}.avif`].find((name) => existsSync(join(ILLUSTRATIONS, name))) ?? null;

/** Every option that names an illustration has its file, the build shipping the file name; every library picture it names exists. */
export function checkIllustrations(ctx: Ctx): void {
  for (const { value: q, file, path } of ctx.content.questions) {
    q.options.forEach((o, i) => {
      for (const key of Object.values('picture' in o ? o.picture : {})) if (!(key in ctx.content.pictures)) ctx.sink.error(file, pathOf(path, ['options', i, 'picture']), `no picture "${key}" in pictures.json`);
      if (!('illustration' in o) || illustrationFile(o.illustration) !== null) return;
      ctx.sink.error(file, pathOf(path, ['options', i, 'illustration']), `no file public/illustrations/${o.illustration}.svg or .avif`);
    });
  }
}

/** Words client text never uses: they judge a face or hair, promise too much or sound like marketing. */
export const BANNED = [
  'slimming', 'slim', 'hides', 'hide', 'flaw', 'fix', 'perfect', 'ideal', 'average', 'receding', 'character', 'norwood',
  'consultation', 'problem area', 'needs a professional', 'ai-powered', 'magic', 'score', 'rate', 'oops',
  'something went wrong', 'elevate', 'seamless', 'unlock', 'effortless', 'powerful', 'delve', 'insights',
] as const;
const BANNED_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${BANNED.join('|')})(?![\\p{L}\\p{N}])|(${String.fromCodePoint(0x2014)})|(!)`, 'giu');
/** Keys whose values are never shown to the person. */
const NOT_CLIENT_TEXT = new Set(['sources', 'review', 'url']);

/** Banned words, em dashes and exclamation marks in every text value and prompt body. */
export function checkBannedWords(ctx: Ctx): void {
  const scan = (file: string, path: string, s: string) => {
    for (const m of s.matchAll(BANNED_RE)) {
      const what = m[1] ? `banned word "${m[1]}"` : m[2] ? 'an em dash' : 'an exclamation mark';
      ctx.sink.error(file, path, `${what} in client text`);
    }
  };
  const walk = (file: string, keys: PropertyKey[], v: unknown): void => {
    if (typeof v === 'string') scan(file, pathOf('$', keys), v);
    else if (Array.isArray(v)) v.forEach((x: unknown, i) => { walk(file, [...keys, i], x); });
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!NOT_CLIENT_TEXT.has(k)) walk(file, [...keys, k], x);
  };
  for (const [file, data] of ctx.raw) if (file !== 'pictures.json') walk(file, [], data);
  for (const { value: p, file } of ctx.content.prompts) scan(file, 'body', p.body);
}
