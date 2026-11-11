/**
 * The content build on the fixture set: derived traits and Lab targets checked against values worked out by hand,
 * only checked records in the library index, and no output at all when the check fails.
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
import type { ConsultData, CutIndexEntry, LibraryIndex, LookIndexEntry, ShadeIndexEntry, ShippedOption } from '../../src/domain/content/output.ts';
import { buildContent, type BuildResult } from './build.ts';

const FIXTURE = fileURLToPath(new URL('../../tests/fixtures/content/', import.meta.url));
const read = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

let out: string;
let result: BuildResult;
let index: LibraryIndex;
const entry = (id: string): unknown => index.entries.find((e) => e.id === id);
const cutEntry = (id: string) => entry(id) as CutIndexEntry;
const lookEntry = (id: string) => entry(id) as LookIndexEntry;
const shadeEntry = (id: string) => entry(id) as ShadeIndexEntry;

beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'huecut-build-'));
  result = buildContent(FIXTURE, out, { complete: false });
  index = read(join(out, 'library-index.json')) as LibraryIndex;
});
afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

it('the build ships checked records only and reports the drafts', () => {
  expect(result.ok).toBe(true);
  // Haircut files in file-name order (bob.json, crop.json), each cut followed by its variants.
  expect(index.entries.map((e) => `${e.kind} ${e.id}`)).toEqual([
    'cut chin-bob-curtain-fringe', 'cut mid-drop-fade-textured-crop', 'cut skin-fade-textured-crop',
    'colour copper-with-silver-ends', 'colour copper-balayage-prelightened', 'shade ash-silver', 'shade copper-auburn',
    'technique all-over', 'technique balayage',
  ]);
  expect(result.drafts).toEqual(['beard beard-short-boxed']);
  expect(result.draftRules).toEqual(['e40']);
  expect(index.models.map((m) => m.id)).toEqual(['salon-straight-wavy', 'barbering-straight-wavy']);
  expect(readdirSync(join(out, 'details')).sort()).toEqual(index.entries.map((e) => `${e.id}.json`).sort());
  expect(read(join(out, 'details', 'balayage.json'))).not.toHaveProperty('review');
});

it('derives length_class, top_length and sides from the zones and the fade', () => {
  // Crop: zone middles in cm are top (3+5)/2 = 4, fringe (2+4)/2 = 3, sides and back 3-9 mm = 0.3-0.9 cm so 0.6,
  // nape 0-3 mm so 0.15. No perimeter landmark and the top is in cm (not all clipper), and the largest middle 4 < 5
  // gives very_short. Top middle 4 is in [2, 5): short. A drop fade gives drop_fade. Required length: the zone with
  // the largest upper end is the top (5 cm), whose lower end is 3 cm.
  expect(cutEntry('mid-drop-fade-textured-crop')).toMatchObject({
    traits: { length_class: 'very_short', top_length: 'short', sides: 'drop_fade', silhouette: 'crop' },
    required_cm: 3, variant_of: null,
  });
  // Its variant: top 5-7 cm, middle 6 >= 5 gives short; 6 is in [5, 10]: medium. The fade becomes
  // { kind: skin, height: mid, start_mm: 0 }: skin_fade. Required: the top's upper end 7 is largest, lower end 5.
  expect(cutEntry('skin-fade-textured-crop')).toMatchObject({
    name: 'Skin fade with a longer textured crop',
    traits: { length_class: 'short', top_length: 'medium', sides: 'skin_fade', silhouette: 'crop' },
    required_cm: 5, variant_of: 'mid-drop-fade-textured-crop',
  });
  // Bob: the perimeter landmark chin gives chin. Top middle (15+20)/2 = 17.5 > 10: long. No fade: none. Upper ends
  // are top 20, fringe 10, sides 22, back 22, nape 18; the first largest is the sides, lower end 18.
  expect(cutEntry('chin-bob-curtain-fringe')).toMatchObject({
    traits: { length_class: 'chin', top_length: 'long', sides: 'none' }, required_cm: 18, variant_of: null,
  });
  expect(Object.keys(cutEntry('chin-bob-curtain-fringe').pictures)).toEqual([
    'salon-straight-wavy/chin-bob-curtain-fringe-front', 'salon-straight-wavy/chin-bob-curtain-fringe-side', 'salon-straight-wavy/chin-bob-curtain-fringe-back',
  ]);
});

it('derives the colour-look traits from base, placements, shades and techniques', () => {
  // Copper with silver ends: base copper-auburn all_over, ends balayage in ash-silver, no required base level.
  // family and warmth from the base shade (red_copper, warm); tone over every shade: silver and copper (list order);
  // technique all_over + balayage, categories process + placement; regions: the one placement, ends.
  // Lightening: max(all-over none, balayage some) = some. Target level: max(copper 7, silver 10) = 10.
  // Upkeep: soonest revisit [min(6, 12), min(8, 16)] = [6, 8]. Salon only: balayage is. Roots: the base only, copper 5-7;
  // lengths: the base and the ends, 5 to the silver's 10.
  expect(lookEntry('copper-with-silver-ends').traits).toEqual({
    family: 'red_copper', warmth: 'warm', tone: ['silver', 'copper'], technique: ['all_over', 'balayage'], base_technique: 'all_over',
    technique_category: ['process', 'placement'], regions: ['ends'], lightening: 'some', lighter_pieces: true, grey_effect: 'covers', prelightening: false,
    target_level: 10, root_levels: [5, 7], lengths_levels: [5, 10], upkeep_weeks: [6, 8], vivid: false, salon_only: true,
  });
  // Prelightened copper balayage: a none base adds no technique and keeps the person's own roots, so nothing is put there (the
  // copper it was designed on is no target), and the lengths go from the copper's 5 to the required base level 9. Required base level 9 sets prelightening and
  // lightening always, and raises the target above the shade's 7: max(7, 9) = 9. Upkeep: balayage alone, [12, 16].
  expect(lookEntry('copper-balayage-prelightened').traits).toEqual({
    family: 'red_copper', warmth: 'warm', tone: ['copper'], technique: ['balayage'], base_technique: 'none', technique_category: ['placement'],
    regions: ['mids', 'ends'], lightening: 'always', lighter_pieces: true, grey_effect: 'shows', prelightening: true, root_levels: [0, 0], lengths_levels: [5, 9], target_level: 9, upkeep_weeks: [12, 16],
    vivid: false, salon_only: true,
  });
  // The engine reads each placement's technique and shade (placement_not_lighter); the region stays in the details.
  expect(lookEntry('copper-with-silver-ends').placements).toEqual([{ technique: 'balayage', shade: 'ash-silver' }]);
});

it('writes the Lab targets per region and brightness band, chroma kept', () => {
  // sRGB to XYZ with the 4-decimal matrix; the white is its row sums: Xn = 0.4124 + 0.3576 + 0.1805 = 0.9505,
  // Yn = 0.2126 + 0.7152 + 0.0722 = 1, Zn = 0.0193 + 0.1192 + 0.9505 = 1.0890. f(t) = cbrt(t) above (6/29)^3.
  // #ff0000: linear (1, 0, 0), so X/Xn = 0.4124 / 0.9505 = 0.433877, Y = 0.2126, Z/Zn = 0.0193 / 1.0890 = 0.017723.
  //   fx = cbrt(0.433877) = 0.757048, fy = cbrt(0.2126) = 0.596834, fz = cbrt(0.017723) = 0.260720.
  //   L = 116 * 0.596834 - 16 = 53.233; a = 500 * (0.757048 - 0.596834) = 80.107; b = 200 * (0.596834 - 0.260720) = 67.223.
  // #808080: 128/255 = 0.501961; linear ((0.501961 + 0.055) / 1.055)^2.4 = 0.527925^2.4 = exp(2.4 * -0.638800) = 0.215861
  //   on all three channels, so a = b = 0 and L = 116 * cbrt(0.215861) - 16 = 116 * 0.599871 - 16 = 53.585.
  // #ffffff: L = 100, a = b = 0. #000000: t = 0, f = 4/29, L = 116 * 4/29 - 16 = 0.
  // Bands: shadows L - 15, mid L, light L + 12, L kept in 0-100, a and b unchanged.
  const red = (l: number) => [l, 80.11, 67.22];
  const grey = { shadows: [53.585 - 15, 0, 0], mid: [53.585, 0, 0], light: [53.585 + 12, 0, 0] };
  const near = (actual: unknown, expected: unknown) => {
    const flat = (x: unknown): number[] => (Array.isArray(x) ? x.flatMap(flat) : x && typeof x === 'object' ? Object.values(x).flatMap(flat) : [x as number]);
    const [a, e] = [flat(actual), flat(expected)];
    expect(a).toHaveLength(e.length);
    a.forEach((v, i) => {
      expect(v).toBeCloseTo(e[i] ?? Number.NaN, 1);
    });
  };
  const silver = shadeEntry('ash-silver').lab;
  near(silver.root, grey);
  near(silver.mids, grey);
  near(silver.ends, { shadows: [85, 0, 0], mid: [100, 0, 0], light: [100, 0, 0] });
  // Copper with silver ends: no root or mids placement, so the all_over base shade copper-auburn gives the root
  // (#000000: shadows clamp to 0, light 12) and the mids (#ff0000); the ends placement wins with ash-silver's #ffffff.
  const a = lookEntry('copper-with-silver-ends').lab;
  near(a.root, { shadows: [0, 0, 0], mid: [0, 0, 0], light: [12, 0, 0] });
  near(a.mids, { shadows: red(53.233 - 15), mid: red(53.233), light: red(53.233 + 12) });
  near(a.ends, { shadows: [85, 0, 0], mid: [100, 0, 0], light: [100, 0, 0] });
  // Prelightened balayage: a none base and no root placement keep the person's own root (null).
  const b = lookEntry('copper-balayage-prelightened').lab;
  expect(b.root).toBeNull();
  near(b.mids, { shadows: red(38.233), mid: red(53.233), light: red(65.233) });
  near(b.ends, b.mids);
  // Written rounded to two decimals.
  expect(a.mids?.mid).toEqual([53.23, 80.11, 67.22]);
});

it('writes consult.json with rules, journey, reminders, phrases, policy, bands, questions and prompts', () => {
  const consult = read(join(out, 'consult.json')) as ConsultData;
  expect(consult.rules.cut.map((r) => r.id)).toEqual(['b01', 'b02', 'c80']);
  expect(consult.rules.colour.map((r) => r.id)).toEqual(['e40']);
  expect(consult.rules.beard.map((r) => r.id)).toEqual(['d02']);
  expect(consult.journey).toHaveLength(6);
  expect(consult.reminders.map((r) => r.kind)).toEqual(['reminder', 'reminder', 'referral']);
  expect(consult.phrases['texture_fit.good']).toBe('a shape made for your hair texture');
  expect(consult.policy.weights).toEqual({ weak: 1, moderate: 2, strong: 3 });
  expect(consult.policy.change_span).toBeNull();
  expect(consult.bands.current_length_cm.chin).toEqual([8, 15]);
  expect(consult.questions.core_sets['colour/any']).toEqual(['chemical-history', 'dye-reaction']);
  // Each option naming an illustration ships the file it resolves to in public/illustrations/; the others ship none.
  expect(consult.questions.questions[0]?.options.map((o: ShippedOption) => o.illustration_file)).toEqual([
    'q-texture-straight.avif', 'q-texture-wavy.avif', 'q-texture-curly.avif', 'q-texture-coily.avif', undefined, undefined,
  ]);
  expect(consult.questions.questions.slice(1).flatMap((q) => q.options).some((o: ShippedOption) => 'illustration_file' in o)).toBe(false);
  expect(Object.keys(consult.prompts).sort()).toEqual(['quick_grid', 'second_opinion']);
  expect(consult.prompts.quick_grid?.body).toContain('{{keep_list}}');
});

it('writes nothing when the check finds an error', () => {
  const dir = mkdtempSync(join(tmpdir(), 'huecut-build-bad-'));
  const target = mkdtempSync(join(tmpdir(), 'huecut-build-out-'));
  try {
    cpSync(FIXTURE, dir, { recursive: true });
    const file = join(dir, 'colours', 'looks.json');
    writeFileSync(file, readFileSync(file, 'utf8').replace('"copper-auburn", "technique": "all_over"', '"copper-autumn", "technique": "all_over"'));
    const bad = buildContent(dir, target, { complete: false });
    expect(bad.ok).toBe(false);
    expect(bad.check.problems).toContainEqual(expect.objectContaining({ message: 'unknown shade "copper-autumn"' }));
    expect(bad.written).toEqual([]);
    expect(existsSync(join(target, 'library-index.json'))).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  }
});
