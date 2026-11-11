/**
 * The Latvian round trip: the file keeps every text through escaping, each import check catches its planted mistake,
 * a merge never erases a translation, an export keeps Latvian it can keep and lists what changed, and the Latvian chunks in the
 * repository are the ones `i18n/lv.md` makes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportRows } from './export.ts';
import { checkRows, merge, tables } from './import.ts';
import { parseLv, writeLv, type Problem, type Row } from './lvmd.ts';
import { collect, type Source } from './source.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const SOURCE = collect(ROOT);
const FRESH = exportRows(SOURCE, []).rows;

/** The fresh file with some Latvian written in, by id. */
const withLatvian = (texts: Readonly<Record<string, string>>, rows: readonly Row[] = FRESH): Row[] =>
  rows.map((r) => (r.id in texts ? { ...r, latvian: texts[r.id] ?? '' } : r));
const errors = (problems: readonly Problem[]): string[] => problems.filter((p) => p.level === 'error').map((p) => `${p.id}: ${p.message.split(':')[0] ?? ''}`);
const row = (id: string, rows: readonly Row[] = FRESH): Row => {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`no row ${id}`);
  return found;
};

describe('the export', () => {
  it('has every text once, with its English, safety and plural forms', () => {
    expect(SOURCE.entries.length).toBeGreaterThan(3000);
    expect(new Set(FRESH.map((r) => r.id)).size).toBe(FRESH.length);
    expect(SOURCE.functions.length).toBeGreaterThan(80);
    // No stand-in number is left in an English text: every parameter shows as its placeholder.
    expect(SOURCE.entries.filter((e) => /9\d{3}/.test(e.english)).map((e) => e.id)).toEqual([]);
    expect(row('consult.photo.added:one').english).toBe('{n} photos added.');
    expect(row('consult.questions.limit/chosen:other').english).toBe('{n} of up to {max} chosen');
    expect(row('extras.threeD.facing/leftDown').english).toBe('Turned {yaw} degrees left, tilted {tilt} degrees down.');
    expect(row('tryOn.referral').notes).toContain('safety');
    expect(row('patch-test.text').notes).toContain('safety');
    expect(row('nav.explore').notes).toEqual([]);
  });
});

describe('the export of the domain words', () => {
  it('has the copy the screens show and the engine joining words, with one number or a range, and never the prompt-only copy', () => {
    expect(row('copy.sheet.cm/same').english).toBe('{max} cm');
    expect(row('copy.sheet.cm/range').english).toBe('{min}-{max} cm');
    expect(row('copy.sheet.weeks/one').english).toBe('every week');
    expect(row('copy.sheet.weeks/range:one').english).toBe('every {min}-{max} weeks');
    expect(row('copy.sheet.guard/guard').english).toBe('#{guard}, {mm} mm');
    expect(row('copy.facts.colour.bleach_count.value/some:other').english).toBe('{n} times');
    expect(row('copy.facts.hair.texture.values.curly').english).toBe('curly');
    expect(row('copy.faceCard.months.10').english).toBe('November');
    expect(row('copy.faceNotes.face.proportion.number').english).toBe('Your face is about {ratio} times as long as it is wide');
    expect(row('copy.prompts.needs.trim/w4').english).toBe('a trim every 4-6 weeks');
    expect(row('copy.prompts.tradeOffs.sentence/growthTwo').english).toBe('Needs {growth}, and {limits}, both more than {said}');
    expect(row('reasons.reason/cut').english).toBe('{reason}, so this cut has {phrases}.');
    expect(row('reasons.reason/none').english).toBe('{reason}.');
    expect(row('reasons.minutes/more:one').english).toBe('{n} minutes');
    expect(row('copy.sheet.journeyLabels.needs_professional').notes).toContain('safety');
    expect(FRESH.filter((r) => /^copy\.(?:prompts\.(?:answer|cutUpkeep|sheetKeep|tradeOffs\.listed)|board\.referenceTitle)/.test(r.id))).toEqual([]);
  });

  it('gives the built content the Latvian of the row it reads under a second id: the index lifts shown_on, a variant inherits', () => {
    expect(SOURCE.aliases.get('tapered-twa.shown_on')).toBe('tapered-twa.images.shown_on');
    expect(SOURCE.aliases.get('buzz-2-uniform.stylist')).toBe('buzz-1-uniform.stylist');
    const rows = withLatvian({ 'tapered-twa.images.shown_on': 'Parādīts uz 4A–4B cirtām' });
    expect(tables(rows, SOURCE).content['tapered-twa.shown_on']).toBe('Parādīts uz 4A–4B cirtām');
  });
});

describe("the export's file", () => {
  it('keeps a text through the file: pipes, new lines, backslashes and Markdown', () => {
    const planted = withLatvian({ 'nav.explore': 'a | b\nc \\ d *e* `f`' });
    const back = parseLv(writeLv(planted));
    expect(back.problems).toEqual([]);
    expect(row('nav.explore', back.rows).latvian).toBe('a | b\nc \\ d *e* `f`');
    expect(back.rows).toEqual(planted);
  });

  it('reports a row that lost a cell instead of guessing', () => {
    const text = writeLv(FRESH).replace('| nav.explore | Explore |  |', '| nav.explore | Explore | Izpēte | |');
    expect(parseLv(text).problems.map((p) => p.message)).toEqual([expect.stringContaining('needs 5 cells and has 6')]);
  });

  it('keeps Latvian whose English is the same, moves it to was: when the English changed, and moves a gone text to Removed', () => {
    const before = withLatvian({ 'nav.explore': 'Izpēte', 'nav.saved': 'Saglabāts' }).map((r) => (r.id === 'nav.saved' ? { ...r, source: '00000000' } : r));
    const gone: Row = { id: 'nav.gone', english: 'Gone', latvian: 'Prom', source: '11111111', notes: [], place: 'strings' };
    const out = exportRows(SOURCE, [...before, gone]);
    expect(row('nav.explore', out.rows).latvian).toBe('Izpēte');
    expect(row('nav.saved', out.rows)).toMatchObject({ latvian: '', notes: ['was: Saglabāts'] });
    expect(row('nav.gone', out.rows)).toMatchObject({ latvian: 'Prom', place: 'removed' });
    expect([out.changed, out.removed]).toEqual([['nav.saved'], ['nav.gone']]);
  });
});

describe('the import checks, each on a planted mistake', () => {
  const check = (rows: readonly Row[], source: Source = SOURCE) => errors(checkRows(rows, source));

  it('passes the fresh file and a good translation', () => {
    expect(check(FRESH)).toEqual([]);
    expect(check(withLatvian({ 'nav.explore': 'Izpēte', 'consult.photo.name': 'Foto {n}' }))).toEqual([]);
  });

  it('a duplicate id', () => {
    expect(check([...FRESH, row('nav.explore')])).toEqual(['nav.explore: duplicate id']);
  });

  it('an unknown id', () => {
    expect(check([...FRESH, { ...row('nav.explore'), id: 'nav.nowhere' }])).toEqual(['nav.nowhere: unknown id']);
  });

  it('a missing id', () => {
    expect(check(FRESH.filter((r) => r.id !== 'nav.explore'))).toEqual(['nav.explore: missing id']);
  });

  it('placeholder names', () => {
    expect(check(withLatvian({ 'consult.photo.name': 'Foto {numurs}' }))).toEqual(['consult.photo.name: placeholders']);
    expect(check(withLatvian({ 'consult.photo.name': 'Foto' }))).toEqual(['consult.photo.name: placeholders']);
  });

  it('every plural form', () => {
    const two = withLatvian({ 'consult.photo.added:one': 'Pievienota {n} fotogrāfija.', 'consult.photo.added:other': 'Pievienotas {n} fotogrāfijas.' });
    expect(check(two)).toEqual(['consult.photo.added:zero: plural form missing']);
  });

  it('a text the same as the English, unless it is meant', () => {
    expect(check(withLatvian({ 'nav.help': 'Help' }))).toEqual(['nav.help: same as the English']);
    expect(check(withLatvian({ 'nav.help': 'Help' }).map((r) => (r.id === 'nav.help' ? { ...r, notes: ['same'] } : r)))).toEqual([]);
    expect(check(withLatvian({ 'app.name': 'Huecut' }))).toEqual([]);
  });

  it('a stale source hash', () => {
    expect(check(FRESH.map((r) => (r.id === 'nav.help' ? { ...r, source: 'abcdef12' } : r)))).toEqual(['nav.help: stale']);
  });

  it('lists removed entries without failing', () => {
    const removed: Row = { id: 'nav.gone', english: 'Gone', latvian: 'Prom', source: '11111111', notes: [], place: 'removed' };
    const problems = checkRows([...FRESH, removed], SOURCE);
    expect(errors(problems)).toEqual([]);
    expect(problems.filter((p) => p.level === 'note').map((p) => p.id)).toEqual(['nav.gone']);
  });
});

describe('the merge of a translated chunk', () => {
  it('never erases a translation, and refuses unknown ids and rows translated from another export', () => {
    const base = withLatvian({ 'nav.explore': 'Izpēte', 'nav.saved': 'Saglabāts' });
    const chunk = [{ ...row('nav.explore'), latvian: '' }, { ...row('nav.saved'), latvian: 'Saglabātie' }, { ...row('nav.help'), id: 'nav.nowhere', latvian: 'X' }, { ...row('nav.help'), source: '00000000', latvian: 'Palīdzība' }];
    const out = merge(base, chunk);
    expect(row('nav.explore', out.rows).latvian).toBe('Izpēte');
    expect(row('nav.saved', out.rows).latvian).toBe('Saglabātie');
    expect(row('nav.help', out.rows).latvian).toBe('');
    expect(errors(out.problems)).toEqual(['nav.nowhere: unknown id', 'nav.help: stale']);
  });

  it('clears `checked` on a safety row whose Latvian changes, and keeps it when the Latvian is the same', () => {
    const base = withLatvian({ 'tryOn.referral': 'Labāk pie koloristes', 'patch-test.text': 'Ādas tests' }).map((r) =>
      r.id === 'tryOn.referral' || r.id === 'patch-test.text' ? { ...r, notes: [...r.notes, 'checked'] } : r);
    const out = merge(base, [{ ...row('tryOn.referral'), latvian: 'Labāk pie kolorista' }, { ...row('patch-test.text'), latvian: 'Ādas tests' }]);
    expect(row('tryOn.referral', out.rows)).toMatchObject({ latvian: 'Labāk pie kolorista', notes: ['safety'] });
    expect(row('patch-test.text', out.rows).notes).toEqual(['safety', 'checked']);
    expect(tables(out.rows, SOURCE).strings.strings['tryOn.referral'], 'held in English again').toBeUndefined();
  });
});

describe('the Latvian chunks', () => {
  it('hold translated texts and checked safety rows only, functions by case and form', () => {
    const rows = withLatvian({
      'nav.explore': 'Izpēte',
      'tryOn.referral': 'Labāk pie koloristes',
      'consult.photo.added:zero': 'Pievienotas {n} fotogrāfijas.',
      'consult.photo.added:one': 'Pievienota {n} fotogrāfija.',
      'consult.photo.added:other': 'Pievienotas {n} fotogrāfijas.',
      'frohawk.name': 'Frohauks',
    });
    const out = tables(rows, SOURCE);
    expect(out.strings.strings).toEqual({ 'nav.explore': 'Izpēte' });
    expect(out.content).toEqual({ 'frohawk.name': 'Frohauks' });
    expect(out.strings.functions['consult.photo.added']).toEqual({
      params: ['n'], count: 'n', cases: [{ when: {}, forms: { zero: 'Pievienotas {n} fotogrāfijas.', one: 'Pievienota {n} fotogrāfija.', other: 'Pievienotas {n} fotogrāfijas.' } }],
    });
    expect(out.strings.held).toBe(SOURCE.entries.filter((e) => e.safety).length);
    const checked = tables(rows.map((r) => (r.id === 'tryOn.referral' ? { ...r, notes: [...r.notes, 'checked'] } : r)), SOURCE);
    expect(checked.strings.strings['tryOn.referral']).toBe('Labāk pie koloristes');
    expect(checked.strings.held).toBe(out.strings.held - 1);
  });

  it('in the repository are what i18n/lv.md makes, with no Latvian left over from an older English', () => {
    const file = parseLv(readFileSync(join(ROOT, 'i18n', 'lv.md'), 'utf8'));
    expect(file.problems).toEqual([]);
    const translated = file.rows.filter((r) => r.place !== 'removed' && r.latvian !== '');
    const late = errors(checkRows(translated, { ...SOURCE, entries: SOURCE.entries.filter((e) => translated.some((r) => r.id === e.id)) }));
    expect(late, 'run npm run i18n:export, then npm run i18n:import').toEqual([]);
    const out = tables(file.rows, SOURCE);
    const read = (name: string): unknown => JSON.parse(readFileSync(join(ROOT, 'src', 'strings', name), 'utf8'));
    expect(read('lv-strings.json')).toEqual(out.strings);
    expect(read('lv-content.json')).toEqual(out.content);
  });
});
