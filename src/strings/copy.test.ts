/**
 * The copy check: every string in `src/strings/`, the face card's words and every content
 * text a person reads is at Flesch-Kincaid grade 8 or lower sentence by sentence, nothing holds a banned word, and an error asks for one action.
 */
import { expect, it } from 'vitest';
import type { AnyTests, Bands, RankRule } from '../domain/content/types.ts';
import { reasonText } from '../domain/engine/explain.ts';
import type { Confidence } from '../domain/facts/registry.ts';
import type { MeasureKey, PhotoMeasurements } from '../domain/measure/measure.ts';
import { EN } from '../domain/render-model/copy.ts';
import { cardFacts, NOTE_FACTS, type CardFact } from '../domain/render-model/face-card.ts';
import { ideasCopy } from './en-ideas.ts';

interface Piece { readonly where: string; readonly text: string }

// ── Reading grade ──

const BAR = 8;
/** Up to three words is a label or a name, not a sentence; the grade formula means nothing on it. */
const MIN_WORDS = 4;
/** Text with no end punctuation is a button, an option or a list line, so it takes more words to count as a sentence. */
const MIN_WORDS_UNPUNCTUATED = 6;
/** Flesch's rule: a hyphenated word, a figure or an abbreviation is one word. */
const WORD = /[\p{L}\p{N}]+(?:['’.+_-][\p{L}\p{N}]+)*/gu;
/** Product and format names cost one short word: the person has to use them, so no rewrite could remove them. */
const NAMES = new Set([
  'apache', 'bricolage', 'chatgpt', 'chrome', 'comlink', 'figtree', 'gemini', 'github', 'google', 'grotesque', 'hiera', 'huecut', 'iphone', 'jpeg',
  'mediapipe', 'onnx', 'phosphor', 'react', 'safari', 'three.js', 'third_party_licenses.md', 'transformers.js', 'webgl', 'webp', 'xstate',
]);
/** The words the spelling rules get wrong, with their dictionary count; each was checked by hand against this corpus. */
const SPOKEN: Readonly<Record<string, number>> = {
  anyone: 3, area: 3, areas: 3, bluer: 2, created: 3, creates: 2, creative: 3, dryers: 2, elsewhere: 2, every: 2, everything: 3, everywhere: 3, eyebrow: 2,
  eyes: 1, forehead: 2, idea: 3, ideas: 3, parietal: 4, reaction: 3, realistic: 4, rugged: 2, sideburns: 2, sideways: 2, something: 2, theatrical: 4,
  tier: 1, tiers: 1, trademark: 2,
};
/** A final e, es or ed that makes no syllable. Kept after a consonant cluster ending l or r (table, centre, tangled). */
const SILENT_END = /(?<![aeiouy]|[^aeiouy][lr])e$|(?<![aeiouysxzcg]|[cs]h|[^aeiouy][lr])es$|(?<![aeiouytd]|[^aeiouylr]l)ed$/;
/** Two written vowels that are two syllables: med-i-a, u-su-al, vi-o-let, go-ing, eas-i-er; not -tion or -cial. */
const HIATUS = /(?<![cst])ie(?=n[ct])|(?<![cst])ia|(?<![cstg])io(?!n)|(?<![cstghln])ion|iu|(?<!g)ua|[aeouy]ings?$|(?<=[^aeiouy])i(?:er|est)s?$/g;

function bySpelling(word: string): number {
  const w = word
    .replace(/qu/g, 'k')
    .replace(/^y/, '')
    .replace(/([aeiou])y(?=[aeiou])/g, '$1z')
    .replace(/(?<=[aeiouy][^aeiouy])e(?=(?:ly|less|ness|ment|ful|fully)$)/, '')
    .replace(SILENT_END, '');
  return Math.max(1, (w.match(/[aeiouy]+/g)?.length ?? 0) + (w.match(HIATUS)?.length ?? 0));
}

function partSyllables(part: string): number {
  const w = part.toLowerCase().replace(/['’]s?$/, '').replace(/['’]/g, '');
  const known = SPOKEN[w];
  if (known !== undefined) return known;
  return (part.length > 1 && part === part.toUpperCase()) || !/[aeiouy]/.test(w) ? w.length : bySpelling(w);
}

/** zero to nineteen, as read aloud. */
const SMALL = [2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3, 1, 2, 2, 2, 2, 3, 2, 2];
const below100 = (n: number): number => (n < 20 ? (SMALL[n] ?? 1) : (n >= 70 && n < 80 ? 3 : 2) + (n % 10 === 0 ? 0 : (SMALL[n % 10] ?? 1)));

/** A figure as read aloud: 38 is thir-ty-eight, 1.5 is one-point-five. */
function figure(text: string): number {
  const [whole = '0', fraction = ''] = text.split('.');
  const n = Number(whole);
  const spoken = n < 100 ? below100(n) : (SMALL[Math.floor(n / 100)] ?? 1) + 2 + (n % 100 === 0 ? 0 : 1 + below100(n % 100));
  return spoken + (fraction === '' ? 0 : 1 + fraction.length);
}

/** Syllables of a word as read aloud: figures in words, abbreviations letter by letter, a name as one short word. */
function syllables(token: string): number {
  if (NAMES.has(token.toLowerCase())) return 1;
  if (/\d/.test(token)) return (token.match(/\d+(?:\.\d+)?|\p{L}/gu) ?? []).reduce((n, t) => n + (/\d/.test(t) ? figure(t) : 1), 0);
  return token.split(/[-+_.]/).reduce((n, part) => n + partSyllables(part), 0);
}

const wordsOf = (s: string): string[] => s.match(WORD) ?? [];
/** Only . ? ! end a sentence: counting colons and semicolons would make sentences shorter and the grade easier. */
const sentencesOf = (text: string): string[] => text.split(/(?<=[.?!…]['"’”)]*)\s+/u).filter((s) => s.trim() !== '');

/** Flesch-Kincaid grade level of one sentence. */
function grade(sentence: string): number {
  const words = wordsOf(sentence);
  return 0.39 * words.length + (11.8 * words.reduce((n, w) => n + syllables(w), 0)) / words.length - 15.59;
}

const counts = (s: string): boolean => wordsOf(s).length >= (/[.?!…:]['"’”)]*$/u.test(s) ? MIN_WORDS : MIN_WORDS_UNPUNCTUATED);

/** Every sentence long enough to judge. */
const sentences = (pieces: readonly Piece[]): Piece[] =>
  pieces.flatMap(({ where, text }) => sentencesOf(text).filter(counts).map((s) => ({ where, text: s })));

const overBar = (pieces: readonly Piece[]): string[] =>
  sentences(pieces).flatMap(({ where, text }) => (grade(text) > BAR ? [`${grade(text).toFixed(1)} | ${where} | ${text}`] : []));

// ── src/strings ──

/** Realistic values per formatter parameter; a parameter with none fails the walk, so no new formatter goes unjudged. */
const SAMPLES: Readonly<Record<string, readonly unknown[]>> = {
  across: [40], answer: ['Warm'], cm: [5], code: ['e1'], collection: ["Women's styles"], colour: ['Golden blonde'], count: [1, 4], cut: ['Soft layered bob'],
  d: [new Date(2026, 10, 10)], day: [10], depth: ['Medium'], done: [2], down: [60], filters: [1, 2, 3, 11], from: ['1 cm'], grey: [false, true, true], atEnd: [false, true],
  grid: ['Picture 1 of 2'], hours: [1, 12], items: [['straight'], ['straight', 'wavy', 'curly']], kind: ['cut', 'colour'], label: ['Plausible'],
  labels: [['Coily'], ['Coily', 'Long', 'With a fringe']], left: ['About 12 hours left.'], list: ['straight or wavy'], max: [4, 3], mb: [34.2], min: [2, 3],
  model: ['Curly to coily hair'], month: ['November'], n: [1, 2], name: ['Soft layered bob'], names: [['Hairline', 'Brows', 'Jaw'], ['Face outline', 'Hairline', 'Brows', 'Eye line', 'Nose width', 'Lip line', 'Jaw', 'Chin']], note: ['Scissor cut a rounded top.'],
  notes: ['for your hair texture'], noun: ['hair texture'], part: ['Hairline', 'Left cheek'], percent: [40], prompt: ['How curly is your hair?'], refused: [true, false],
  search: ['bob'], seconds: [12], shade: ['golden blonde'], sizes: [[4], [3, 3], [4, 4, 2]], stage: ['Finding face points'], state: ['Works on this device.'],
  status: ['Running'], texture: ['curly'], tilt: [0, 10, -10], to: ['3 cm'], total: [4], view: ['Front view'], way: ['darker', 'lighter'],
  weeks: [null, 8], what: ['styles'], withFilters: [false, true], yaw: [0, -20, 20], year: [2026],
};

const paramsOf = (fn: (...args: never[]) => unknown): string[] =>
  (/^\(?([^)=]*?)\)?\s*=>/.exec(fn.toString())?.[1] ?? '').split(',').map((p) => p.trim()).filter(Boolean);

/** What one formatter says for its sample values, every branch the samples reach. */
function callSamples(fn: (...args: unknown[]) => unknown, where: string): Piece[] {
  const params = paramsOf(fn).map((p) => {
    const sample = SAMPLES[p];
    if (!sample) throw new Error(`${where}: no sample for parameter "${p}"`);
    return sample;
  });
  const calls = Math.max(...params.map((s) => s.length));
  return Array.from({ length: calls }, (_, i) => ({ where, text: String(fn(...params.map((s) => s[i % s.length]))) }));
}

function walkStrings(v: unknown, where: string): Piece[] {
  if (typeof v === 'string') return [{ where, text: v }];
  if (typeof v === 'function') return callSamples(v as (...args: unknown[]) => unknown, where);
  if (Array.isArray(v)) return v.flatMap((x: unknown, i) => walkStrings(x, `${where}[${String(i)}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => walkStrings(x, `${where}.${k}`));
  return [];
}

/** Every string once, under the first name it was found; `en.consult` is `consultCopy` again. */
function allStrings(): Piece[] {
  const modules = import.meta.glob<Record<string, unknown>>('./en*.ts', { eager: true });
  // Only "found" has a branch for zero; the other counts are not shown at zero.
  const found = [...Object.values(modules).flatMap((m) => Object.entries(m).flatMap(([name, v]) => walkStrings(v, name))), { where: 'ideasCopy.shortfall.found', text: ideasCopy.shortfall.found(0) }];
  return [...new Map(found.filter((p) => !p.text.startsWith('http')).map((p) => [p.text, p])).values()];
}

// ── content/ ──

const CONTENT = import.meta.glob<unknown>(
  ['../../content/**/*.json', '!../../content/schema/**', '!../../content/pictures.json', '!../../content/examples/**'],
  { eager: true, import: 'default' },
);
const PROMPTS = import.meta.glob<string>('../../content/prompts/*.md', { eager: true, import: 'default', query: '?raw' });
/** As in the content check: these keys are never shown to the person. */
const NOT_TEXT = new Set(['sources', 'review', 'url']);

interface Field { readonly file: string; readonly id: string; readonly key: string; readonly up: string; readonly parent: Readonly<Record<string, unknown>>; readonly text: string }

function fieldsOf(file: string, v: unknown, key: string, up: string, parent: Readonly<Record<string, unknown>>, id: string): Field[] {
  if (typeof v === 'string') return [{ file, id, key, up, parent, text: v }];
  if (Array.isArray(v)) return v.flatMap((x: unknown) => fieldsOf(file, x, key, up, parent, id));
  if (!v || typeof v !== 'object') return [];
  const record = v as Readonly<Record<string, unknown>>;
  const own = typeof record.id === 'string' ? record.id : id;
  return Object.entries(record).flatMap(([k, x]) => (NOT_TEXT.has(k) ? [] : fieldsOf(file, x, k, key, record, own)));
}

const short = (file: string): string => file.replace('../../content/', '');
const FIELDS = Object.entries(CONTENT).flatMap(([file, data]) => fieldsOf(short(file), data, '', '', {}, ''));

/** Fields a screen shows to the person (Explore detail, Ideas, the questions, the captions). */
const PERSON_FIELDS = new Set(['because', 'client', 'help', 'label', 'prompt', 'reason', 'shown_on', 'sideburns', 'strand_note', 'text', 'what_to_ask']);

function readByPerson(f: Field): boolean {
  if (PERSON_FIELDS.has(f.key)) return true;
  // A question option's note sits under its label, one per collection.
  if (f.up === 'note' && f.file === 'questions.json') return true;
  // Adapt notes go on Explore and Ideas, fade notes on Explore, a beard's growth note on Explore; the other notes only on the stylist sheet.
  return f.key === 'note' && (f.parent.fit === 'adapt' || f.up === 'fade' || (f.up === 'growth' && f.file === 'beards.json'));
}

/** A phrase is only ever read inside its reason: the real sentence, once per phrase the rule can name. */
function reasonSentences(): Piece[] {
  const phrases = CONTENT['../../content/phrases.json'] as Readonly<Record<string, string>>;
  const rules = Object.entries(CONTENT).filter(([file]) => file.includes('/rules/') && !/journey|reminders/.test(file));
  return rules.flatMap(([file, records]) => (records as readonly (RankRule<'cut'> | { readonly effect: 'note' | 'exclude' })[]).filter((r): r is RankRule<'cut'> => r.effect === 'rank').flatMap((rule) =>
    rule.favour.flatMap((match) => Object.entries(match as AnyTests).flatMap(([trait, test]) =>
      (test.in ?? [test.is ?? test.range]).map((value) => ({
        where: `${short(file)} ${rule.id} ${trait}`,
        text: reasonText(rule.target, { ...rule, favour: [{ [trait]: test }] }, [0], { [trait]: value }, phrases),
      }))))));
}

const contentPieces = (fields: readonly Field[]): Piece[] => fields.map((f) => ({ where: `${f.file} ${f.id} ${f.key}`, text: f.text }));

// ── The face card (render-model copy): the Face step's facts and the saved card's, through `cardFacts` ──

/** One photo's values, realistic for a front photo; each topic's own value is then moved into each of its bands. */
const PHOTO_VALUES: Readonly<Record<MeasureKey, number>> = {
  width_to_length: 0.73, length_to_width: 1.37, third_upper: 0.34, third_middle: 0.33, third_lower: 0.33,
  forehead_share: 1.03, lower_share: 0.98, jaw_to_cheek: 0.85, jaw_angle: 131.6, chin_to_jaw: 0.41,
};
const photoAt = (over: Readonly<Partial<Record<MeasureKey, number>>>, confidence: Confidence, issues: PhotoMeasurements['issues'] = []): PhotoMeasurements => ({
  view: 'frontal', lines: [], ticks: [], issues, confidence, weight: 1, approximate: false, camera: null, pose: null, face: null, hairlineVisible: true,
  values: Object.fromEntries(Object.entries({ ...PHOTO_VALUES, ...over }).map(([k, value]) => [k, { value, confidence, approximate: false }])),
});

/** Every reading of every topic at each confidence, and a photo that cannot be read. */
function everyCardFact(): CardFact[] {
  const bands = CONTENT['../../content/bands.json'] as Bands;
  const readings = bands.bands.filter((b) => (NOTE_FACTS as readonly string[]).includes(b.fact)).flatMap((b) => {
    const step = 2.5 * (b.margin ?? 0);
    return b.cuts.map((c, i) => ({ [b.from]: typeof c.below === 'number' ? c.below - step : (b.cuts[i - 1]?.below ?? 0) + step }));
  });
  return [
    ...readings.flatMap((over) => (['high', 'medium', 'low'] as const).flatMap((c) => cardFacts(photoAt(over, c), bands))),
    ...cardFacts(photoAt({}, 'high', ['hand_over_face']), bands),
  ];
}

const CARD_FACTS = everyCardFact();
/** The card's own words, then each fact's title, hair line, number and lead line, once each. */
const FACE = [...new Map([
  ...walkStrings(EN.faceCard, 'EN.faceCard'),
  ...walkStrings(EN.board, 'EN.board'),
  ...CARD_FACTS.flatMap((f) => [f.title, f.hair, f.number, f.brief].flatMap((text) => (text === null ? [] : [{ where: `cardFacts ${f.fact}`, text }]))),
].map((p) => [p.text, p])).values()];

// ── Banned words ──

const CHECK = import.meta.glob<{ BANNED: readonly string[] }>('../../scripts/content/check-items.ts', { eager: true });
/** Copy-rule phrases the content check's list does not carry. */
const ALSO_BANNED = ['your photos stay on this device', 'collection: salon', 'collection: barbering'];
const BANNED = [...(Object.values(CHECK)[0]?.BANNED ?? []), ...ALSO_BANNED];
/** The content check's pattern: whole words in any case, em dashes and exclamation marks. */
const BANNED_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${BANNED.join('|')})(?![\\p{L}\\p{N}])|—|!`, 'iu');

const withBanned = (pieces: readonly Piece[]): string[] => pieces.filter((p) => BANNED_RE.test(p.text)).map((p) => `${p.where} | ${p.text}`);

// ── One action per error ("one next step") ──

const ERROR_PATH = /\.(?:errors?|issues|blocked)\.|\.notfound\.|(?:failed|refused|notloaded|stopped|stalled|unsupported|lost|partly|notimage|listfull|haironlyoff|haironlynohair|reloaded)$|\.tools\.missing\./i;
const VERBS = ['add', 'allow', 'answer', 'ask', 'attach', 'check', 'choose', 'close', 'connect', 'continue', 'copy', 'delete', 'download', 'drop', 'enable', 'export', 'go', 'install', 'keep', 'make', 'move', 'open', 'paste', 'press', 'refresh', 'reload', 'remove', 'restart', 'save', 'select', 'share', 'start', 'switch', 'take', 'tap', 'try', 'turn', 'update', 'use', 'wait'];
/** An instruction starts a clause; a verb before a past tense is a noun ("Download stopped"). "Press and hold" is one gesture, so "hold" is not listed. */
const ACTION = new RegExp(`(?:^|[.?!:;,]\\s+|\\b(?:and|or|then)\\s+)(?:${VERBS.join('|')})\\b(?!\\s+\\w+ed\\b)`, 'gi');
const actionsIn = (text: string): number => text.match(ACTION)?.length ?? 0;

// ── The tests ──

const STRINGS = allStrings();
const PERSON = [...contentPieces(FIELDS.filter(readByPerson)), ...reasonSentences()];
/** The credits list is tool names and licence names, not prose; the trademark line is legal text fixed word for word. Neither is graded. */
const FIXED = new Set(['en.home.trademark']);
const READ = [...STRINGS.filter((p) => !p.where.includes('.credits.items[') && !FIXED.has(p.where)), ...FACE, ...PERSON];
const JUDGED = sentences(READ);
const ERRORS = STRINGS.filter((p) => ERROR_PATH.test(p.where));
const SCANNED = [...STRINGS, ...FACE, ...contentPieces(FIELDS), ...Object.entries(PROMPTS).map(([file, text]) => ({ where: short(file), text }))];

it('counts syllables and grades a sentence as worked by hand', () => {
  const counts: Readonly<Record<string, number>> = {
    the: 1, hair: 1, fringe: 1, blonde: 1, styles: 1, shades: 1, curled: 1, shaved: 1, dyed: 1, grey: 1, coils: 1, gloss: 1, bleach: 1, three: 1,
    colour: 2, colourist: 3, layers: 2, layered: 2, faces: 2, changes: 2, added: 2, little: 2, people: 2, table: 2, tangled: 2, centre: 2, ombre: 2, brunette: 2,
    coily: 2, stylist: 2, photos: 2, device: 2, moustache: 2, toner: 2, safely: 2, going: 2, trying: 2, hairline: 2, highlights: 2, texture: 2, sideburns: 2,
    undertone: 3, lightening: 3, balayage: 3, measured: 2, analysed: 3, proportions: 3, idea: 3, created: 3, favourite: 3, curlier: 3, violet: 3, opinion: 3,
    medium: 3, usual: 3, camera: 3, library: 3, memory: 3, approximate: 4, available: 4, realistic: 4, conditioner: 4, unexpectedly: 5,
  };
  for (const [word, n] of Object.entries(counts)) expect([word, syllables(word)]).toEqual([word, n]);
  // Abbreviations, figures and hyphens are read aloud: M-B, 3-D, one-point-five, face-fram-ing.
  expect(['MB', '3D', '1.5', 'face-framing'].map(syllables)).toEqual([2, 2, 3, 3]);
  // 13 words, 26 syllables, 1 sentence: 0.39 x 13 + 11.8 x 26 / 13 - 15.59 = 13.08, the published worked example.
  expect(grade('The Australian platypus is seemingly a hybrid of a mammal and reptilian creature.')).toBeCloseTo(13.08, 2);
  // 10 words, 15 syllables: 0.39 x 10 + 11.8 x 1.5 - 15.59 = 6.01.
  expect(grade('The colourist lightens your hair before the toner goes on.')).toBeCloseTo(6.01, 2);
  expect(sentencesOf('Stand about 1.5 m away. Is it "ready"? Yes.')).toEqual(['Stand about 1.5 m away.', 'Is it "ready"?', 'Yes.']);
});

it('catches a planted failure in each check', () => {
  expect(overBar([{ where: 'plant', text: 'Fine. Considerable pigmentation irregularities necessitate professional intervention.' }])).toHaveLength(1);
  expect(overBar([{ where: 'plant', text: 'Pigmentation irregularities.' }])).toHaveLength(0);
  for (const plant of ['A slimming cut', 'Oops', 'Hair — cut', 'Great!', 'Your photos stay on this device']) expect(plant).toMatch(BANNED_RE);
  expect('Styles that suit a slimmer rate of growth, not scores').not.toMatch(/\bslim\b/iu);
  expect([actionsIn('Reload the page and try again.'), actionsIn('Download stopped. Download again?'), actionsIn('Press and hold the link to copy it:'), actionsIn('The tools could not load.')]).toEqual([2, 1, 1, 0]);
  expect(ERROR_PATH.test('consultCopy.photo.errors.other')).toBe(true);
  expect(ERROR_PATH.test('consultCopy.photo.choose')).toBe(false);
});

it(`reading grade ${String(BAR)} or lower: ${String(JUDGED.length)} sentences from ${String(STRINGS.length)} strings, ${String(FACE.length)} face card texts and ${String(PERSON.length)} content texts`, () => {
  expect(STRINGS.length).toBeGreaterThan(750);
  // Every reading of every card topic was said, and "cannot read reliably" for each topic.
  const readings = NOTE_FACTS.reduce((n, fact) => n + Object.keys(EN.faceNotes[fact].values).length + 1, 0);
  expect(new Set(CARD_FACTS.map((f) => `${f.fact} ${f.words}`)).size).toBe(readings);
  expect(new Set(CARD_FACTS.map((f) => f.sureness))).toEqual(new Set(['steady', 'estimate', 'rough', 'cannot_read']));
  expect(PERSON.length).toBeGreaterThan(2000);
  expect(JUDGED.length).toBeGreaterThan(2000);
  expect(overBar(READ)).toEqual([]);
});

it(`no banned word in ${String(SCANNED.length)} texts`, () => {
  expect(BANNED.length).toBeGreaterThan(25);
  expect(SCANNED.length).toBeGreaterThan(15000);
  expect(withBanned(SCANNED)).toEqual([]);
});

/** The ids of the looks a person knows by name (cuts, beards, colour looks); shade and technique ids are plain words such as "all-over". */
const IDS = new Set(FIELDS.filter((f) => f.key === 'id' && f.text.includes('-') && /^(?:haircuts\/|beards\.json|colours\/looks\.json)/.test(f.file)).map((f) => f.text));
const withIds = (pieces: readonly Piece[]): string[] =>
  pieces.flatMap(({ where, text }) => ((text.match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) ?? []).some((t) => IDS.has(t)) ? [`${where} | ${text}`] : []));

it(`no record id in the ${String(READ.length)} texts a person reads`, () => {
  expect(IDS.size).toBeGreaterThan(300);
  expect(withIds([{ where: 'plant', text: 'cut dry; see curly-wolf-cut' }])).toHaveLength(1);
  expect(withIds(READ)).toEqual([]);
});

it(`at most one action in each of ${String(ERRORS.length)} error messages`, () => {
  expect(ERRORS.length).toBeGreaterThan(70);
  expect(ERRORS.filter((p) => actionsIn(p.text) > 1).map((p) => `${p.where} | ${p.text}`)).toEqual([]);
});
