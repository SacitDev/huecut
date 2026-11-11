/**
 * Stylist sheet tests on an example cut and colour look: thumbnails, zones and guards, fade, fringe, the person's notes, colour
 * placements, journey, pair and text.
 */
import { expect, it } from 'vitest';
import type { CutDetail, LookDetail } from '../content/output.ts';
import type { Facts } from '../facts/registry.ts';
import { asPictureId } from '../ids.ts';
import { EN, guardWords } from './copy.ts';
import { buildStylistSheet, stylistSheetText, type LookAssessment, type SheetCut, type SheetLook, type StylistSheet } from './stylist-sheet.ts';

/** The example cut, with its build traits. */
const CUT: CutDetail = {
  id: 'mid-drop-fade-textured-crop', kind: 'cut', name: 'Mid drop fade with textured crop', aliases: ['drop fade crop'], collections: ['barbering'], family: 'crop',
  zones: { basis: 'dry_stretched', top: { cm: [3, 5] }, fringe: { cm: [2, 4] }, sides: { guard_mm: [3, 9] }, back: { guard_mm: [3, 9] }, nape: { guard_mm: [0, 3] } },
  perimeter: { landmark: null }, fade: { kind: 'drop', height: 'mid', start_mm: 0.5, note: 'Drop the line behind the ear.' },
  neckline: 'tapered', sideburns: 'Tapered to the fade.', fringe: { kind: 'textured_forward', landmark: 'brow', options: ['curtain', 'none'] },
  texture_fit: { straight: { fit: 'good' }, wavy: { fit: 'good' }, curly: { fit: 'good', note: 'Keep 1 cm more on top.' }, coily: { fit: 'adapt', note: 'Sponge-friendly top length.' } },
  density_fit: { low: { fit: 'good' }, medium: { fit: 'good' }, high: { fit: 'adapt', note: 'Remove bulk on top.' } },
  shrinkage: null, growth: { recession_stage_max: 3, whorl_note: 'Leave 5 mm more at a crown whorl.', note: null },
  strand_note: null, density_note: null, glasses_note: 'Keep the sides tight above the arms.',
  upkeep: { styling_minutes: [3, 6], trim_weeks: [2, 4], heat: 'none', products: ['matte paste'] },
  grow_out: 'Let the sides grow to a scissor taper in 6-8 weeks.', era: 'current', pairs_with: { beards: ['beard-short-boxed'], looks: [] },
  traits: {
    height_top: 'medium', volume_zone: ['crown'], sides_width: 'close', perimeter: 'soft', part: 'none', fringe: 'textured_forward', layers: ['light'],
    silhouette: 'crop', weight_removal: 'medium', cut_method: ['point_cut'], nape_style: 'tapered', shrinkage_risk: 'low', tension: 'none',
    heat_dependent: false, grow_out_friendly: true, tie_back: false, covers_forehead: true, covers_ears: false, tucked_behind_ear: false,
    beard_blend: true, lineup: false, styling_minutes: [3, 6], trim_weeks: [2, 4], tags: ['textured_top'], length_class: 'short', top_length: 'short', top_cm: [3, 5], scalp_mm: 0, hang_cm: 5, sides: 'drop_fade',
  },
  client: 'Short, textured top with sides that fade and curve down behind the ear.', stylist: 'Drop the fade line behind the ear; point-cut the top for separation.',
  images: { model: 'barbering-straight-wavy', views: ['front', 'side', 'back'] },
  prompt_spec: 'a mid drop fade with a short textured crop', sources: [], variant_of: null, variants: [], required_cm: 3,
};
/** The example colour look. */
const LOOK: LookDetail = {
  id: 'copper-balayage-root-shadow', kind: 'colour', name: 'Copper balayage with a root shadow', collections: ['salon'],
  base: { shade: 'chestnut-brown', technique: 'none', on: 'chestnut-brown', on_words: [] }, grey: 'tints',
  placements: [
    { technique: 'root_shadow', shade: 'chestnut-brown', region: 'root' }, { technique: 'balayage', shade: 'copper-auburn', region: 'mids' },
    { technique: 'balayage', shade: 'copper', region: 'ends' },
  ],
  required_base_level: null, client: 'Copper through the lengths.', stylist: 'Paint the balayage from mid-lengths; keep the root soft.',
  images: { models: ['salon-straight-wavy', 'salon-curly-coily'], view: 'back' }, prompt_spec: 'a copper balayage over a soft root shadow',
  traits: {
    family: 'brunette', warmth: 'warm', tone: ['chestnut', 'copper'], technique: ['root_shadow', 'balayage'], base_technique: 'none', technique_category: ['placement', 'blending'],
    regions: ['root', 'mids', 'ends'], lightening: 'some', lighter_pieces: true, grey_effect: 'shows', prelightening: false, target_level: 7, root_levels: [4, 5], lengths_levels: [4, 7], upkeep_weeks: [12, 16], vivid: false, salon_only: true,
  },
  lab: { root: null, mids: null, ends: null },
};
const UNCERTAIN: LookAssessment = {
  label: 'uncertain', reminders: ['Ask for a skin test 48 hours before.'], referral: null,
  journey: { applied: [{ label: 'uncertain', because: 'Copper over highlights can grab unevenly.', what_to_ask: 'Ask for a strand test first.' }], dependsOn: [], askHealth: true },
};
const sheetLook = (assessment: LookAssessment | null, extra: Partial<SheetLook> = {}): SheetLook => ({
  kind: 'colour', detail: LOOK, assessment, ...extra,
  shades: { 'chestnut-brown': { name: 'Chestnut brown', level: [4, 5], tone: 'chestnut' }, 'copper-auburn': { name: 'Copper auburn', level: [5, 7], tone: 'copper' }, copper: { name: 'Copper', level: [6, 7], tone: 'copper' } },
  techniques: { 'root-shadow': 'Root shadow', balayage: 'Balayage' },
});
const SHEET_CUT: SheetCut = { kind: 'cut', detail: CUT };
const FACTS: Facts = {
  'hair.texture': { key: 'hair.texture', value: 'curly', confidence: 'high', source: 'answered' },
  'hair.density': { key: 'hair.density', value: 'high', confidence: 'high', source: 'answered' },
  'colour.current_level_lengths': { key: 'colour.current_level_lengths', value: 6, confidence: 'high', source: 'derived' },
  'look.glasses': { key: 'look.glasses', value: 'none', confidence: 'high', source: 'answered' },
};
const rows = (s: StylistSheet, id: string): Record<string, string> =>
  Object.fromEntries((s.sections.find((x) => x.id === id)?.rows ?? []).map((r) => [r.label, r.value]));

it('shows clipper guards with mm on the eighth-inch scale', () => {
  expect(['#2, 6 mm', '#1, 3 mm', '#0.5, 1.5 mm', '#1.5, 4.5 mm', '#4, 13 mm', 'skin, 0 mm']).toEqual([6, 3, 1.5, 4.5, 13, 0].map((mm) => guardWords(EN.sheet, mm)));
});

it('a cut sheet: front, side and back thumbnails, zone lengths in cm, guards with mm, fade and fringe', () => {
  const s = buildStylistSheet(SHEET_CUT);
  expect(s.title).toBe('Mid drop fade with textured crop');
  expect(s.thumbnails.map((t) => t.key)).toEqual(['front', 'side', 'back'].map((v) => `barbering-straight-wavy/mid-drop-fade-textured-crop-${v}`));
  expect(rows(s, 'lengths')).toEqual({
    Top: '3-5 cm', Fringe: '2-4 cm', Sides: '#1, 3 mm to #3, 9 mm', Back: '#1, 3 mm to #3, 9 mm', Nape: 'skin, 0 mm to #1, 3 mm',
    Neckline: 'tapered', Sideburns: 'Tapered to the fade.', Measured: 'dry and stretched',
  });
  expect(rows(s, 'fade')).toEqual({ Fade: 'Mid drop fade', 'Starts at': '#0, 0.5 mm', Note: 'Drop the line behind the ear.' });
  expect(rows(s, 'fringe')).toEqual({ Fringe: 'Textured fringe worn forward', Sits: 'at the brow', 'Also works as': 'Curtain fringe, No fringe' });
  expect(rows(s, 'layers')).toEqual({ Layers: 'light layers' });
  expect(rows(s, 'upkeep')).toEqual({ Styling: '3-6 minutes a day', Trim: 'every 2-4 weeks', Heat: 'no heat styling', Products: 'matte paste' });
  expect(rows(s, 'stylist')).toEqual({ Notes: 'Drop the fade line behind the ear; point-cut the top for separation.' });
  expect(s.aiPicture).toBeNull();
  expect(s.sections.some((x) => x.id === 'aboutMyHair')).toBe(false);
});

it('with the person\'s answers: the note for their texture and density, and "About my hair" from their own answers only', () => {
  const s = buildStylistSheet(SHEET_CUT, FACTS);
  expect(rows(s, 'yourHair')).toEqual({ 'For curly hair': 'works as cut. Keep 1 cm more on top.', Density: 'needs adapting. Remove bulk on top.', 'Crown whorl': 'Leave 5 mm more at a crown whorl.' });
  expect(rows(s, 'aboutMyHair')).toEqual({ Texture: 'curly', Density: 'high' });
  const unknown = rows(buildStylistSheet(SHEET_CUT), 'yourHair');
  expect(unknown).toEqual({ 'For curly hair': 'works as cut. Keep 1 cm more on top.', 'For coily hair': 'needs adapting. Sponge-friendly top length.', 'Crown whorl': 'Leave 5 mm more at a crown whorl.', Glasses: 'Keep the sides tight above the arms.' });
});

it('a colour sheet: one view on the matching model, base and placements with levels and tones, the journey with why and what to ask', () => {
  const s = buildStylistSheet(sheetLook(UNCERTAIN, { model: 'salon-curly-coily' }));
  expect(s.thumbnails.map((t) => t.key)).toEqual(['salon-curly-coily/copper-balayage-root-shadow-back']);
  expect(rows(s, 'colour')).toEqual({
    Base: 'Your own colour stays wherever no placement covers the hair', Root: 'Root shadow in Chestnut brown, level 4-5, chestnut tone',
    'Mid-lengths': 'Balayage in Copper auburn, level 5-7, copper tone', Ends: 'Balayage in Copper, level 6-7, copper tone', Visits: 'every 12-16 weeks',
  });
  expect(rows(s, 'journey')).toEqual({
    Journey: 'Uncertain', Why: 'Copper over highlights can grab unevenly.',
    'What to ask': 'Ask for a strand test first. If you are pregnant, breastfeeding or having medical treatment, tell your colourist first.',
    Reminder: 'Ask for a skin test 48 hours before.',
  });
  expect(buildStylistSheet(sheetLook(null)).thumbnails.map((t) => t.key)).toEqual(['salon-straight-wavy/copper-balayage-root-shadow-back']);
});

it('after the referral the journey is "Best done by a colourist" with its reason; an open answer says so', () => {
  const referred = buildStylistSheet(sheetLook({ ...UNCERTAIN, label: 'needs_professional', referral: { text: 'You told us about a reaction to hair dye.' } }));
  expect(rows(referred, 'journey')).toEqual({ Journey: 'Best done by a colourist', Why: 'You told us about a reaction to hair dye.' });
  // A recipe or colourist notes after a referral would be instructions to colour: only the referral stays.
  expect(referred.sections.map((s) => s.id).filter((id) => id === 'colour' || id === 'colourist')).toEqual([]);
  expect(buildStylistSheet(sheetLook(UNCERTAIN)).sections.map((s) => s.id)).toEqual(expect.arrayContaining(['colour', 'journey', 'colourist']));
  const open = buildStylistSheet(sheetLook({ ...UNCERTAIN, reminders: [], journey: { applied: [], dependsOn: ['colour.current_tone'], askHealth: false } }));
  expect(rows(open, 'journey')).toEqual({ Journey: 'Uncertain', Why: 'Some answers that could change this are still open.' });
});

it('a look naming a shade the sheet was not given is broken content', () => {
  expect(() => buildStylistSheet({ ...sheetLook(null), shades: {} })).toThrow(/chestnut-brown/);
});

it('the pair has one sheet with both parts, the pair\'s AI picture labelled, and the footer', () => {
  const s = buildStylistSheet([SHEET_CUT, sheetLook(UNCERTAIN)], FACTS, { ai: { pictureId: asPictureId('p1'), hairOnly: true } });
  expect(s.title).toBe('Together: Mid drop fade with textured crop, with Copper balayage with a root shadow');
  expect(s.thumbnails).toHaveLength(4);
  expect(s.aiPicture).toMatchObject({ pictureId: 'p1', hairOnly: true, label: 'AI picture, an illustration of the look' });
  expect(s.sections.map((x) => x.id)).toEqual(['lengths', 'fade', 'fringe', 'layers', 'yourHair', 'upkeep', 'stylist', 'growOut', 'colour', 'journey', 'colourist', 'aboutMyHair']);
  expect(s.footer).toEqual(['Huecut', 'https://sacitdev.github.io/huecut/']);
  expect(s.export).toEqual({ widthPx: 2160, heightPx: 2700, mime: 'image/jpeg', quality: 0.92 });
  const pics = [...s.thumbnails.map((t) => t.rect), s.aiPicture?.rect];
  pics.slice(1).forEach((r, i) => { expect(r?.x).toBeGreaterThan((pics[i]?.x ?? 0) + (pics[i]?.width ?? 0)); });
});

it('copies as plain text with every row and the footer', () => {
  const t = stylistSheetText(buildStylistSheet([SHEET_CUT, sheetLook(UNCERTAIN)], FACTS));
  const lines = t.split('\n');
  expect(lines[0]).toBe('Together: Mid drop fade with textured crop, with Copper balayage with a root shadow');
  expect(lines).toContain('Lengths');
  expect(lines).toContain('Sides: #1, 3 mm to #3, 9 mm');
  expect(lines).toContain('Mid-lengths: Balayage in Copper auburn, level 5-7, copper tone');
  expect(lines).toContain('About my hair');
  expect(lines).toContain('Texture: curly');
  expect(lines.at(-1)).toBe('Huecut https://sacitdev.github.io/huecut/');
});

it('shows the framing line among the notes on the person\u2019s hair when the engine gave one, and no row otherwise', () => {
  const words = 'Adds height and keeps the sides close. That is this app\u2019s own styling preference for your proportions.';
  expect(rows(buildStylistSheet({ ...SHEET_CUT, framing: words }), 'yourHair')[EN.sheet.rows.framing]).toBe(words);
  expect(rows(buildStylistSheet(SHEET_CUT), 'yourHair')[EN.sheet.rows.framing]).toBeUndefined();
});

it('shows the trade-off line beside it when the cut misses a limit the person may accept, and no row otherwise', () => {
  const words = 'Needs 15 minutes of styling, more than I said';
  expect(rows(buildStylistSheet({ ...SHEET_CUT, tradeOffs: words }), 'yourHair')[EN.sheet.rows.tradeOff]).toBe(words);
  expect(rows(buildStylistSheet(SHEET_CUT), 'yourHair')[EN.sheet.rows.tradeOff]).toBeUndefined();
});
