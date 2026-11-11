/**
 * Copy tests: the default English copy holds none of the never-words, no em dash and no
 * exclamation mark, and its formatters read as the screens say them.
 */
import { expect, it } from 'vitest';
import { EN, guardWords, SHOWN } from './copy.ts';
import { answerWords } from './facts-copy.ts';

/** The never-words list of `scripts/content/check-items.ts`, kept in step by hand. */
const BANNED = [
  'slimming', 'slim', 'hides', 'hide', 'flaw', 'fix', 'perfect', 'ideal', 'average', 'receding', 'character', 'norwood',
  'consultation', 'problem area', 'needs a professional', 'ai-powered', 'magic', 'score', 'rate', 'oops',
  'something went wrong', 'elevate', 'seamless', 'unlock', 'effortless', 'powerful', 'delve', 'insights',
];
const BANNED_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${BANNED.join('|')})(?![\\p{L}\\p{N}])|—|!`, 'iu');

/** Every string in the copy, and what each formatter says for a few sample values. */
function allText(): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(EN);
  const s = EN.sheet;
  const f = EN.faceCard;
  out.push(
    s.cm(3, 5), guardWords(s, 6), guardWords(s, 0, 3), s.minutes(3, 6), s.weeks(2, 4), s.percent(20, 30), s.shade('Copper auburn', 5, 7, s.tones.red_brown),
    s.applied('Balayage', 'Copper'), s.lightenTo(10), s.textureFor('curly'), s.pairTitle('A', 'B'),
    f.date(31, f.months[0] ?? '', 2026), EN.board.pairName('A', 'B'), EN.prompts.answer('Texture', 'curly'),
    ...Object.values(EN.faceNotes).flatMap((t) => [t.says('a little longer'), t.number(1.3, 30)]),
  );
  return out;
}

it('holds no never-word, em dash or exclamation mark, formatters included', () => {
  const text = allText();
  expect(text.length).toBeGreaterThan(150);
  for (const t of text) expect(t).not.toMatch(BANNED_RE);
});

it('formats as the screens say it', () => {
  expect(EN.faceCard.date(31, EN.faceCard.months[0] ?? '', 2026)).toBe('31 January 2026');
  expect(EN.sheet.shade('Copper auburn', 5, 7, EN.sheet.tones.red_brown)).toBe('Copper auburn, level 5-7, red brown tone');
  expect(EN.sheet.cm(4, 4)).toBe('4 cm');
  expect(guardWords(EN.sheet, 3, 6)).toBe('#1, 3 mm to #2, 6 mm');
  expect(answerWords(EN.facts, 'hair.chemical_history', [])).toBe('none of these');
  expect(answerWords(EN.facts, 'hair.chemical_history', ['bleach', 'henna_compound'])).toBe('bleach, compound henna');
  expect([0, 1, 2, 4].map((n) => answerWords(EN.facts, 'colour.bleach_count', n))).toEqual(['never', 'once', '2 times', '4 or more times']);
  expect(answerWords(EN.facts, 'colour.last_dye', 'months_6_plus')).toBe('more than 6 months ago');
  expect(answerWords(EN.facts, 'hair.texture', 'curly')).toBe('curly');
  expect(EN.footer).toEqual({ app: 'Huecut', link: 'https://sacitdev.github.io/huecut/' });
});

it('gives the screens a copy of their own, so a language laid over it leaves the English for the prompts', () => {
  expect(SHOWN).toEqual(EN);
  expect(SHOWN).not.toBe(EN);
  expect(SHOWN.sheet).not.toBe(EN.sheet);
  expect(SHOWN.faceCard.months).not.toBe(EN.faceCard.months);
  expect(SHOWN.sheet.cm).toBe(EN.sheet.cm);
});
