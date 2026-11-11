/**
 * The locale adapter on planted Latvian: laid over the English in place (a module-level alias reads it), function
 * strings by case, plural form, list and number format, content by record id and field, the domain's copy for the screens and the
 * engine's joining words with the prompts' English kept, and English laid back over all of it.
 */
import { describe, expect, it, vi } from 'vitest';
import { REASON_WORDS } from '../domain/engine/explain.ts';
import { EN, SHOWN, SHOWN_REASONS, WORD_TREES } from '../domain/render-model/copy.ts';
import { en } from './en.ts';
import { ideasCopy } from './en-ideas.ts';
import { holds, keepRanges, lvFunction, walkContent, type LvFunction } from './i18n.ts';
import { addStringTrees, chooseLanguage, english, languageState, localiseContent, safetyInEnglish } from './locale.ts';

vi.mock('./lv-strings.json', () => ({
  default: {
    strings: { 'nav.explore': 'Izpēte', 'consult.questions.next': 'Nākamais jautājums', 'copy.faceCard.heading': 'Ko rāda šī fotogrāfija', 'copy.faceCard.months.10': 'novembra' },
    functions: {
      'reasons.both': { params: ['parts'], cases: [{ when: {}, text: '{parts}' }] },
      'copy.sheet.cm': { params: ['min', 'max'], cases: [{ when: { min: '=max' }, text: '{max} cm' }, { when: {}, text: '{min}–{max} cm' }] },
      'consult.photo.added': { params: ['n'], count: 'n', cases: [{ when: {}, forms: { zero: '{n} fotogrāfiju', one: '{n} fotogrāfija', other: '{n} fotogrāfijas' } }] },
      'ideas.aiPick.action': { params: ['n'], count: 'n', cases: [{ when: { n: 1 } }, { when: {}, forms: { one: 'Labākā {n}', other: 'Labākās {n}', zero: 'Labāko {n}' } }] },
    },
    held: 3,
  },
}));
vi.mock('./lv-content.json', () => ({ default: { 'frohawk.name': 'Frohauks', 'hair-texture.options.curly.label': 'Cirtaini' } }));

/** Kept at module level the way screens keep it: the same object, so it reads the language laid over it. */
const nav = en.nav;
addStringTrees(WORD_TREES);

describe('a Latvian function string', () => {
  const english = (n: number) => `${String(n)} in English`;

  it('picks the plural form for each number, and the English for a case with no Latvian', () => {
    const fn = lvFunction({ params: ['n'], count: 'n', cases: [{ when: { n: 1 } }, { when: {}, forms: { zero: 'z{n}', one: 'o{n}', other: 'x{n}' } }] }, english);
    expect([0, 1, 2, 10, 11, 21, 22, 100].map((n) => fn(n))).toEqual(['z0', '1 in English', 'x2', 'z10', 'z11', 'o21', 'x22', 'z100']);
  });

  it('says lists, lower case and unsigned numbers the Latvian way', () => {
    const spec: LvFunction = { params: ['items', 'part', 'yaw'], cases: [{ when: { yaw: '<0' }, text: '{items}: {part}, {yaw} pa kreisi' }], or: ['items'], lower: ['part'], abs: ['yaw'] };
    expect(lvFunction(spec, () => 'English')(['taisni', 'viļņaini', 'cirtaini'], 'Zods', -20)).toBe('taisni, viļņaini vai cirtaini: zods, 20 pa kreisi');
    expect(lvFunction(spec, () => 'English')(['a'], 'Zods', 20)).toBe('English');
  });

  it('meets conditions on values, list lengths and comparisons', () => {
    expect([holds(null, null), holds([1, 2], 2), holds(5, '<=5'), holds(6, '<=5'), holds(-1, '<0'), holds('cut', 'cut'), holds(true, false)]).toEqual([true, true, true, false, true, true, false]);
  });

  it('keeps a number range together on screen, and nothing else', () => {
    expect(keepRanges('every 6-10 weeks, 5–10 cm, level 5-7')).toBe('every 6\u2060-\u206010 weeks, 5\u2060–\u206010 cm, level 5\u2060-\u20607');
    expect(keepRanges('face-framing, 1 - 2, Picture 1 of 2')).toBe('face-framing, 1 - 2, Picture 1 of 2');
  });

  it('meets a range whose ends meet, and shows the decimals a number asks for with a decimal comma', () => {
    expect([holds(5, '=max', { max: 5 }), holds(4, '=max', { max: 5 })]).toEqual([true, false]);
    const ratio = lvFunction({ params: ['ratio'], cases: [{ when: {}, text: 'apmēram {ratio} reizes' }], decimals: { ratio: 2 } }, () => 'English');
    expect(ratio(1.3)).toBe('apmēram 1,3 reizes');
  });
});

it('gives content texts their record id and field, options by what they set', () => {
  const ids: string[] = [];
  walkContent({ questions: [{ id: 'wishes', prompt: 'P', options: [{ fact: 'wish.jaw', value: 'soften', label: 'L' }, { value: null, label: 'N' }] }] }, '', (_p, _k, id) => ids.push(id));
  const option = 'wishes.options.wish.jaw=soften';
  expect(ids).toEqual(['wishes.id', 'wishes.prompt', `${option}.fact`, `${option}.value`, `${option}.label`, 'wishes.options.null.label']);
});

describe('choosing a language', () => {
  const question = { id: 'hair-texture', prompt: 'How curly is your hair?', options: [{ value: 'curly', label: 'Curly' }] };
  const index = { entries: [{ id: 'frohawk', kind: 'cut', name: 'Frohawk' }] };

  it('lays Latvian over the strings, the function strings and the content, and keeps the English for prompts', async () => {
    await localiseContent(index);
    await chooseLanguage('lv');
    expect(languageState()).toMatchObject({ chosen: 'lv', shown: 'lv', failed: false, held: 3 });
    expect([nav.explore, en.nav.saved, en.consult.questions.next]).toEqual(['Izpēte', 'Saved', 'Nākamais jautājums']);
    expect([en.consult.photo.added(1), en.consult.photo.added(5), ideasCopy.aiPick.action(1), ideasCopy.aiPick.action(3)]).toEqual([
      '1 fotogrāfija', '5 fotogrāfijas', 'Let ChatGPT or Gemini pick your best one', 'Labākās 3',
    ]);
    expect(index.entries[0]?.name).toBe('Frohauks');
    await localiseContent(question);
    expect(question.options[0]?.label).toBe('Cirtaini');
    expect(english(index).entries[0]?.name).toBe('Frohawk');
    expect(english(question)).toEqual({ id: 'hair-texture', prompt: 'How curly is your hair?', options: [{ value: 'curly', label: 'Curly' }] });
    expect(safetyInEnglish()).toBe(true);
    expect([SHOWN.faceCard.heading, SHOWN.faceCard.months[10], SHOWN.sheet.cm(4, 4), SHOWN.sheet.cm(3, 5), SHOWN_REASONS.both(['a', 'b'])]).toEqual([
      'Ko rāda šī fotogrāfija', 'novembra', '4 cm', '3\u2060–\u20605 cm', 'a un b',
    ]);
    expect([EN.faceCard.heading, EN.sheet.cm(3, 5), REASON_WORDS.both(['a', 'b'])], 'the prompts keep the English copy').toEqual(['What this photo shows', '3-5 cm', 'a and b']);
  });

  it('lays English back over all of it', async () => {
    await chooseLanguage('en');
    expect(languageState()).toMatchObject({ chosen: 'en', shown: 'en', failed: false });
    expect([nav.explore, en.consult.photo.added(1), ideasCopy.aiPick.action(3), index.entries[0]?.name, question.options[0]?.label]).toEqual([
      'Explore', 'Photo added.', 'Let ChatGPT or Gemini pick your best 3', 'Frohawk', 'Curly',
    ]);
    expect(safetyInEnglish()).toBe(false);
    expect([SHOWN.faceCard.heading, SHOWN.sheet.cm(3, 5), SHOWN_REASONS.both(['a', 'b'])]).toEqual(['What this photo shows', '3\u2060-\u20605 cm', 'a and b']);
  });
});
