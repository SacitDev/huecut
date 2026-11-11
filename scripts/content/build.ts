/**
 * `npm run content:build`: draws the colour swatches into `public/illustrations/`, runs the content check and stops on any
 * error, then writes `src/generated/`: the library index (checked records only), one `details/<id>.json` per shipped record,
 * and `consult.json`.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ItemTraits, TargetKind } from '../../src/domain/content/traits.ts';
import type { ConsultData, Detail, IndexEntry, LibraryIndex, Pictures, ShippedOption } from '../../src/domain/content/output.ts';
import type { BeardStyle, ColourLook, Haircut, Question, Review, Shade } from '../../src/domain/content/types.ts';
import { checkContent, goldenFactsIn, report, shadeLevelsIn, type CheckOptions, type CheckResult, type Content } from './check.ts';
import { plausibleProof } from '../../src/domain/engine/journey.ts';
import { illustrationFile, pictureKeys } from './check-items.ts';
import { lookLab, lookNeeds, requiredCm, shadeLab } from './derive.ts';
import { swatchFiles } from './swatches.ts';

export interface BuildResult {
  readonly check: CheckResult;
  /** False when the check found errors; nothing is written then. */
  readonly ok: boolean;
  readonly written: readonly string[];
  /** Library records left out of the index because they are drafts, as "<kind> <id>". */
  readonly drafts: readonly string[];
  /** Rules, journey records and reminders shipped in consult.json while still drafts, as ids. */
  readonly draftRules: readonly string[];
}

/** Writes a file, retrying the EPERM and EBUSY errors a synced folder gives while it scans a file. */
function writeOut(file: string, text: string): void {
  for (let attempt = 1; ; attempt += 1) {
    try {
      writeFileSync(file, text);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== 'EPERM' && code !== 'EBUSY')) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * attempt);
    }
  }
}

const isChecked = (r: { readonly review: Review }): boolean => r.review.status === 'checked';
/** The record without its review: review notes are for the content's authors, not for the app. */
function withoutReview<T extends { readonly review: Review }>(record: T): Omit<T, 'review'> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== 'review')) as Omit<T, 'review'>;
}
/** A derived value the check guarantees; a gap means the check and the build disagree. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`content build: ${what} is missing after a clean check`);
  return value;
}
const traitsOf = <T extends TargetKind>(c: Content, kind: T, id: string): ItemTraits<T> =>
  must((c.traits[kind] as Map<string, ItemTraits<T>>).get(id), `the ${kind} traits of ${id}`);
const picturesOf = (c: Content, item: Haircut | BeardStyle | ColourLook): Pictures =>
  Object.fromEntries(pictureKeys(item).map((k) => [k, must(c.pictures[k], `picture ${k}`)]));

/** Index entries and details of the checked cuts, variants and beards. */
function cutsAndBeards(c: Content, entries: IndexEntry[], details: Detail[]): void {
  for (const { value: cut } of c.cuts.filter((a) => isChecked(a.value))) {
    const traits = traitsOf(c, 'cut', cut.id);
    const shared = { traits, variant_of: c.variantOf.get(cut.id) ?? null, required_cm: requiredCm(cut.zones) };
    entries.push({ kind: 'cut', id: cut.id, name: cut.name, aliases: cut.aliases, collections: cut.collections, family: cut.family,
      texture_fit: cut.texture_fit, density_fit: cut.density_fit, pairs_with: cut.pairs_with, pictures: picturesOf(c, cut), ...shared,
      ...(cut.images.shown_on === undefined ? {} : { shown_on: cut.images.shown_on }) });
    details.push({ ...withoutReview(cut), ...shared, variants: cut.variants.map((v) => ({ id: v.id, name: v.name })) });
  }
  for (const { value: beard } of c.beards.filter((a) => isChecked(a.value))) {
    const traits = traitsOf(c, 'beard', beard.id);
    entries.push({ kind: 'beard', id: beard.id, name: beard.name, aliases: beard.aliases, collections: beard.collections, traits, zones_mm: beard.zones_mm, pairs_with: beard.pairs_with, pictures: picturesOf(c, beard) });
    details.push({ ...withoutReview(beard), traits });
  }
}

/** Index entries and details of the checked colour looks, shades and techniques, with their Lab targets. */
function colours(c: Content, entries: IndexEntry[], details: Detail[]): void {
  for (const { value: look } of c.looks.filter((a) => isChecked(a.value))) {
    const traits = traitsOf(c, 'colour', look.id);
    const lab = lookLab(look, c.parts);
    const placements = look.placements.map(({ technique, shade }) => ({ technique, shade }));
    entries.push({ kind: 'colour', id: look.id, name: look.name, aliases: look.aliases ?? [], collections: look.collections, traits, needs: lookNeeds(look, c.parts), placements, lab, pictures: picturesOf(c, look) });
    details.push({ ...withoutReview(look), traits, lab });
  }
  for (const { value: shade } of c.shades.filter((a) => isChecked(a.value))) {
    const lab = shadeLab(shade);
    entries.push({ kind: 'shade', id: shade.id, name: shade.name, aliases: shade.aliases, family: shade.family, level: shade.level, tone: shade.tone, warmth: shade.warmth, swatch: shade.swatch, lab });
    details.push({ ...withoutReview(shade), lab });
  }
  for (const { value: t } of c.techniques.filter((a) => isChecked(a.value))) {
    entries.push({ kind: 'technique', id: t.id, name: t.name, aliases: [], category: t.category, regions: t.regions, lightening: t.lightening, salon_only: t.salon_only });
    details.push(withoutReview(t));
  }
}

/** The question with each illustrated option's file name in `public/illustrations/`. */
const withIllustrationFiles = (q: Question): Question => ({
  ...q,
  options: q.options.map((o): ShippedOption =>
    'illustration' in o
      ? { ...o, illustration_file: must(illustrationFile(o.illustration) ?? undefined, `the file of illustration ${o.illustration}`) }
      : o),
});

/** `consult.json`: every validated rule, question and parameter; drafts ship here and are reported. */
function consult(c: Content): ConsultData {
  return {
    rules: { cut: c.rules.cut.map((a) => a.value), colour: c.rules.colour.map((a) => a.value), beard: c.rules.beard.map((a) => a.value) },
    journey: c.journey.map((a) => a.value),
    reminders: c.reminders.map((a) => a.value),
    phrases: must(c.phrases ?? undefined, 'phrases.json'),
    policy: must(c.policy ?? undefined, 'policy.json'),
    bands: must(c.bands ?? undefined, 'bands.json'),
    questions: { questions: c.questions.map((a) => withIllustrationFiles(a.value)), core_sets: must(c.coreSets ?? undefined, 'the core sets') },
    prompts: Object.fromEntries(c.prompts.map((a) => [a.value.template, a.value])),
  };
}

/** Checks `contentDir`, then writes the generated files to `outDir` unless the check found errors. */
export function buildContent(contentDir: string, outDir: string, options: CheckOptions = {}): BuildResult {
  const check = checkContent(contentDir, options);
  const c = check.content;
  if (check.problems.some((p) => p.level === 'error')) return { check, ok: false, written: [], drafts: [], draftRules: [] };
  const entries: IndexEntry[] = [];
  const details: Detail[] = [];
  cutsAndBeards(c, entries, details);
  colours(c, entries, details);
  const index: LibraryIndex = { models: c.models.map((a) => a.value), entries };
  const data = consult(c);
  const written: string[] = [];
  const out = (name: string, value: unknown) => {
    writeOut(join(outDir, name), JSON.stringify(value));
    written.push(join(outDir, name));
  };
  rmSync(join(outDir, 'details'), { recursive: true, force: true });
  mkdirSync(join(outDir, 'details'), { recursive: true });
  out('library-index.json', index);
  for (const d of details) out(join('details', `${d.id}.json`), d);
  out('consult.json', data);
  const drafts = [...c.cuts, ...c.beards, ...c.looks, ...c.shades, ...c.techniques].filter((a) => !isChecked(a.value)).map((a) => `${a.value.kind} ${a.value.id}`);
  const draftRules = [...data.rules.cut, ...data.rules.colour, ...data.rules.beard, ...data.journey, ...data.reminders].filter((r) => !isChecked(r)).map((r) => r.id);
  return { check, ok: true, written, drafts, draftRules };
}

if (import.meta.main) {
  const root = join(import.meta.dirname, '..', '..');
  const dir = join(root, 'content');
  const shades = JSON.parse(readFileSync(join(dir, 'colours', 'shades.json'), 'utf8')) as Shade[];
  for (const [name, svg] of swatchFiles(shades)) writeOut(join(root, 'public', 'illustrations', name), svg);
  // The build runs the same check as content:check, point 3 of the plausible check included.
  const levels = shadeLevelsIn(dir);
  const golden = goldenFactsIn(join(root, 'tests', 'engine-cases'));
  const result = buildContent(dir, join(root, 'src', 'generated'), { plausibleReachable: (input) => plausibleProof(input, levels, golden) });
  report(result.check);
  if (!result.ok) {
    console.log('content build: stopped, the content check found errors; no generated JSON written');
    process.exitCode = 1;
  } else {
    console.log(`content build: wrote ${String(result.written.length)} files to ${relative(process.cwd(), join(root, 'src', 'generated')) || '.'}`);
    console.log(`drafts left out of the library: ${result.drafts.join(', ') || 'none'}`);
    console.log(`draft rules shipped in consult.json, still to be checked: ${result.draftRules.join(', ') || 'none'}`);
  }
}
