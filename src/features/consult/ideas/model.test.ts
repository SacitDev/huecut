/** The Ideas screen's pure helpers: sections, moves, questions, pictures, lines. */
import { describe, expect, it } from 'vitest';
import type { LibraryModel, Question, QuestionsFile } from '../../../domain/content/types.ts';
import type { Feasibility } from '../../../domain/engine/derive-traits.ts';
import type { Recommendation } from '../../../domain/engine/recommend.ts';
import type { Facts } from '../../../domain/facts/registry.ts';
import { asItemId, type ItemId } from '../../../domain/ids.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { content, observation, photo } from '../../../../tests/machine/consult.fakes.ts';
import { withMoved } from '../../../machine/consult.logic.ts';
import type { IdeaList } from '../../../machine/consult.selectors.ts';
import type { PhotoEntry } from '../../../machine/consult.types.ts';
import { EN, tradeOffWords } from '../../../domain/render-model/copy.ts';
import { allOverLooks, feasibilityText, givesWayLine, improveFirst, improveQuestions, moveTo, orderByImpact, photoLink, pictureKeyFor, previewPhoto, questionsFor, sectionsOf, sharedReminders, shortfallOf } from './model.ts';

const id = (s: string): ItemId => asItemId(s);
const list = (cuts: readonly string[], colours: readonly string[]): IdeaList => ({
  ids: [...cuts, ...colours].map(id),
  cuts: cuts.map(id),
  colours: colours.map(id),
  own: [],
});

describe('allOverLooks', () => {
  it('offers the solid all-over colour looks, not balayages or cuts', () => {
    const library = { models: [], entries: [{ id: 'jet-black-all-over', kind: 'colour' }, { id: 'copper-balayage', kind: 'colour' }, { id: 'odd-all-over', kind: 'cut' }] } as unknown as Parameters<typeof allOverLooks>[0];
    expect(allOverLooks(library).map((l) => l.id)).toEqual(['jet-black-all-over']);
  });
});

describe('sectionsOf', () => {
  it('under Both shows Cuts then Colours, even when one is empty', () => {
    expect(sectionsOf('both', list(['a'], [])).map((s) => [s.kind, s.ids])).toEqual([['cut', ['a']], ['colour', []]]);
  });
  it('under one goal shows that kind, plus another kind only when the person added one', () => {
    expect(sectionsOf('cut', list(['a'], [])).map((s) => s.kind)).toEqual(['cut']);
    expect(sectionsOf('cut', list(['a'], ['x'])).map((s) => s.kind)).toEqual(['cut', 'colour']);
  });
});

describe('moveTo', () => {
  const ids = ['c1', 'k1', 'c2', 'k2', 'c3'].map(id);
  const cuts = ['c1', 'c2', 'c3'].map(id);
  const shortlist = { added: [], removed: [], order: [] };
  const after = (item: string, step: -1 | 1): readonly ItemId[] => {
    const to = moveTo(ids, cuts, id(item), step);
    if (to === null) throw new Error('no move');
    return withMoved(shortlist, ids, id(item), to).order.filter((x) => cuts.includes(x));
  };
  it('swaps an idea with its neighbour in its own section, whatever lies between them', () => {
    expect(after('c2', -1)).toEqual(['c2', 'c1', 'c3']);
    expect(after('c2', 1)).toEqual(['c1', 'c3', 'c2']);
    expect(after('c1', 1)).toEqual(['c2', 'c1', 'c3']);
  });
  it('is null at either end of the section and for an id outside it', () => {
    expect(moveTo(ids, cuts, id('c1'), -1)).toBeNull();
    expect(moveTo(ids, cuts, id('c3'), 1)).toBeNull();
    expect(moveTo(ids, cuts, id('k1'), 1)).toBeNull();
  });
});

const NOT_SURE = { value: null, label: 'Not sure' } as const;
const q = (qid: string, over: Partial<Question> = {}): Question => ({
  id: qid,
  type: 'single',
  goals: ['cut', 'colour'],
  collections: ['salon', 'barbering'],
  prompt: `Prompt of ${qid}`,
  options: [{ value: 'a', label: 'A' }, NOT_SURE],
  ...over,
});
const texture = q('hair-texture', { fact: 'hair.texture' });
const history = q('hair-chemical-history', { fact: 'hair.chemical_history', goals: ['colour'] });
const dye = q('dye-reaction', {
  goals: ['colour'],
  options: [{ label: 'No reaction', sets: { 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none' } }, NOT_SURE],
});
const wishes = q('wishes', { type: 'wishes', options: [{ label: 'Soften the look of length', fact: 'wish.face_length', value: 'soften' }] });
const direction = q('pref-colour-direction', {
  fact: 'pref.colour_direction',
  goals: ['colour'],
  options: [{ value: 'grey', label: 'Cover or blend my grey', follow_up: 'grey-amount' }, NOT_SURE],
});
const grey = q('grey-amount', { fact: 'colour.grey_percent', goals: ['colour'] });
const upkeep = q('pref-colour-upkeep', { fact: 'pref.colour_upkeep', goals: ['colour'], options: [{ value: 'low', label: 'Low', follow_up: 'grey-texture' }, NOT_SURE] });
const greyTexture = q('grey-texture', { fact: 'colour.grey_texture', goals: ['colour'] });
const top = q('pref-top-length', { fact: 'pref.top_length', goals: ['cut'], collections: ['barbering'] });
const level = q('colour-current-level-lengths', { fact: 'colour.current_level_lengths', goals: ['colour'], show_if: { 'hair.chemical_history': { not: ['none'] } } });
const file: QuestionsFile = {
  questions: [texture, history, dye, wishes, direction, grey, upkeep, greyTexture, top, level],
  core_sets: {
    'cut/salon': ['hair-texture', 'wishes'],
    'cut/barbering': ['hair-texture'],
    'colour/any': ['hair-chemical-history', 'pref-colour-direction', 'dye-reaction'],
    'both/salon': ['hair-texture', 'hair-chemical-history', 'pref-colour-direction', 'dye-reaction'],
    'both/barbering': [],
  },
};

describe('questionsFor', () => {
  it('finds the question by its fact, by an option that sets the fact, and by a wish option, each once', () => {
    expect(questionsFor(file, ['hair.chemical_history', 'safety.scalp_irritation', 'safety.dye_reaction', 'wish.face_length']).map((x) => x.id)).toEqual([
      'hair-chemical-history',
      'dye-reaction',
      'wishes',
    ]);
  });
  it('leaves out a fact that no question writes', () => {
    expect(questionsFor(file, ['face.proportion'])).toEqual([]);
  });
});

describe('sharedReminders', () => {
  const engineWith = (...reminders: readonly (readonly string[])[]) => ({
    picks: reminders.map((r, i) => ({ id: `look-${String(i)}`, reminders: r })),
    added: [],
  }) as unknown as Recommendation;
  it('keeps what every colour idea says, in the first idea\'s order', () => {
    expect(sharedReminders(engineWith(['skin test', 'strand test'], ['strand test', 'skin test', 'only here']), [id('look-0'), id('look-1')])).toEqual(['skin test', 'strand test']);
  });
  it('is empty with no ideas, or with one idea alone (nothing is shared)', () => {
    expect(sharedReminders(engineWith(['skin test']), [])).toEqual([]);
    expect(sharedReminders(engineWith(['skin test']), [id('look-0')])).toEqual([]);
  });
});

describe('orderByImpact', () => {
  const asked = (ids: readonly string[]) => ids.map((id) => ({ question: { id } })) as unknown as Parameters<typeof orderByImpact>[0];
  const ids = (xs: ReturnType<typeof orderByImpact>) => xs.map((a) => a.question.id);

  it('puts the questions that could change the list first, most first, and keeps the rest in content order', () => {
    expect(ids(orderByImpact(asked(['a', 'b', 'c']), new Map([['c', 2], ['a', 1]])))).toEqual(['c', 'a', 'b']);
  });

  it('leaves the order alone when nothing could change', () => {
    expect(ids(orderByImpact(asked(['a', 'b']), new Map()))).toEqual(['a', 'b']);
  });
});

describe('improveFirst', () => {
  const asked = improveQuestions(file, 'colour', ['salon'], {});
  it('picks the optional questions that write a fact the ideas on the list still depend on', () => {
    expect(improveFirst(asked, [['hair.texture']])).toEqual(new Set(['hair-texture']));
  });
  it('for each idea takes its first open fact that an optional question can write', () => {
    expect(improveFirst(asked, [['face.proportion', 'hair.texture', 'wish.face_length'], ['pref.colour_upkeep']])).toEqual(new Set(['hair-texture', 'pref-colour-upkeep']));
  });
  it('is empty when no optional question would change the list', () => {
    expect(improveFirst(asked, [['face.proportion']]).size).toBe(0);
  });
});

describe('improveQuestions', () => {
  const none = { 'hair.chemical_history': { key: 'hair.chemical_history', value: ['none'], confidence: 'high', source: 'answered' } } as const;
  it('offers what fits the goal and collections outside the core set, never a core follow-up, with nested follow-ups once', () => {
    const asked = improveQuestions(file, 'colour', ['salon'], {});
    expect(asked.map((a) => a.question.id)).toEqual(['hair-texture', 'wishes', 'pref-colour-upkeep', 'colour-current-level-lengths']);
    expect([...(asked.find((a) => a.question.id === 'pref-colour-upkeep')?.followUps.values() ?? [])].map((x) => x.id)).toEqual(['grey-texture']);
  });
  it('drops a question whose show_if is false, and offers the men\'s questions under All', () => {
    expect(improveQuestions(file, 'colour', ['salon'], none).map((a) => a.question.id)).not.toContain('colour-current-level-lengths');
    expect(improveQuestions(file, 'both', ['salon', 'barbering'], {}).map((a) => a.question.id)).toEqual(['wishes', 'pref-colour-upkeep', 'pref-top-length', 'colour-current-level-lengths']);
  });
});

describe('pictureKeyFor', () => {
  const model = (mid: string, collection: LibraryModel['collection'], group: LibraryModel['hair_group']): LibraryModel => ({
    id: mid, collection, hair_group: group, label: mid, shown_on: mid, base_pictures: { front: '', side: '', back: '' }, example: '', licence: '',
  });
  const models = [model('salon-sw', 'salon', 'straight_wavy'), model('salon-cc', 'salon', 'curly_coily'), model('barb-sw', 'barbering', 'straight_wavy')];
  const entry = (keys: readonly string[]) => ({
    pictures: Object.fromEntries(keys.map((k) => [k, { widthPx: 3, heightPx: 4, widths: [480], average: '#888888', bytes: 1 }])),
  });
  it("shows a cut's front view", () => {
    expect(pictureKeyFor(entry(['salon-sw/bob-side', 'salon-sw/bob-front', 'salon-sw/bob-back']), models, ['salon'], undefined)).toBe('salon-sw/bob-front');
  });
  it('shows a colour look on the model of the collection and the texture group, else the first that fits', () => {
    const look = entry(['barb-sw/look-front', 'salon-sw/look-front', 'salon-cc/look-front']);
    expect(pictureKeyFor(look, models, ['salon'], 'coily')).toBe('salon-cc/look-front');
    expect(pictureKeyFor(look, models, ['salon'], 'mixed')).toBe('salon-sw/look-front');
    expect(pictureKeyFor(look, models, ['barbering'], 'curly')).toBe('barb-sw/look-front');
    expect(pictureKeyFor(entry([]), models, ['salon'], undefined)).toBeNull();
  });
});

describe('feasibilityText', () => {
  const f = (over: Partial<Feasibility>): Feasibility => ({ length: null, adapting: [], status: null, dependsOn: [], ...over });
  it('says growth as a band, never a precise figure: the length estimates are too coarse for one', () => {
    const line = (cm: number, weeks: number | null) => feasibilityText(f({ status: 'after_growth', length: { status: 'after_growth', cm, weeks } }));
    expect(line(9, 39)).toBe('Needs about 5 to 10 cm more length, up to a year of growth');
    expect(line(16, 70)).toBe('Needs about 10 to 20 cm more length, more than a year of growth');
    expect(line(30, null)).toBe('Needs more than 20 cm more length');
    for (const [cm, weeks] of [[3, 13], [7, 31], [12, 52], [25, 108]] as const) expect(line(cm, weeks)).not.toMatch(new RegExp(`\\b${String(weeks)}\\b`));
  });
  it('says each status in words, with the growth said as a band when the policy gives a rate', () => {
    expect(feasibilityText(f({ status: 'today' }))).toBe('Works with your hair today');
    expect(feasibilityText(f({ status: 'after_growth', length: { status: 'after_growth', cm: 4, weeks: 18 } }))).toBe('Needs up to about 5 cm more length, a few months of growth');
    expect(feasibilityText(f({ status: 'after_growth', length: { status: 'after_growth', cm: 4, weeks: null } }))).toBe('Needs up to about 5 cm more length');
    expect(feasibilityText(f({ status: 'needs_adapting', adapting: [{ what: 'texture', note: 'Cut dry.' }, { what: 'density', note: null }] }))).toBe(
      'Needs adapting: Cut dry. for your hair density',
    );
  });
  it('says nothing while the length is unknown', () => {
    expect(feasibilityText(f({}))).toBeNull();
    expect(feasibilityText(null)).toBeNull();
  });
});

describe('feasibilityText: trade-offs and poor fits', () => {
  const f = (over: Partial<Feasibility>): Feasibility => ({ length: null, adapting: [], status: null, dependsOn: [], ...over });
  it('names every trade-off the cut misses after the length line, which already names any growth', () => {
    const styling = { what: 'styling', minutes: 15, factor: 0.5 } as const;
    const trim = { what: 'trim', weeks: [4, 6], factor: 0.6 } as const;
    const growth = { what: 'growth', weeks: 18, factor: 0.7 } as const;
    expect(feasibilityText(f({ status: 'today' }), null, [styling, trim])).toBe('Works with your hair today. Needs 15 minutes of styling and a trim every 4 to 6 weeks, both more than you said');
    expect(feasibilityText(f({ status: 'today' }), null, [trim])).toBe('Works with your hair today. Needs a trim every 4 to 6 weeks, more than you said');
    expect(feasibilityText(f({ status: 'after_growth', length: { status: 'after_growth', cm: 4, weeks: 18 } }), null, [growth])).toBe('Needs up to about 5 cm more length, a few months of growth');
    expect(tradeOffWords([growth, trim], EN.prompts.tradeOffs, EN.prompts.tradeOffs.iSaid)).toBe('Needs a few months of growth, and a trim every 4 to 6 weeks, more than I said');
    expect(tradeOffWords([], EN.prompts.tradeOffs, EN.prompts.tradeOffs.iSaid)).toBeNull();
  });
  it('never tells a poor fit it works today: the record\'s own note instead', () => {
    const today = f({ status: 'today', length: { status: 'today' } });
    expect(feasibilityText(today, ['Not suited.'])).toBe('Not suited.');
    expect(feasibilityText(today, ['blunt lines turn triangular on curls, use curly-bob-rounded'])).toBe('Blunt lines turn triangular on curls');
    expect(feasibilityText(today, ['too short to allow for coil shrinkage; see coily-sculpted-chin-bob or tapered-twa'])).toBe('Too short to allow for coil shrinkage');
  });
  it('does not show an author\'s pointer to another record, and has a plain line for a poor fit with no note', () => {
    const today = f({ status: 'today', length: { status: 'today' } });
    expect(feasibilityText(today, ['see tapered-twa'])).toBe('Not the best match for your hair texture');
    expect(feasibilityText(today, ['use bixie'])).toBe('Not the best match for your hair texture');
    expect(feasibilityText(today, ['the shape depends on curl, so use classic-pixie'])).toBe('The shape depends on curl');
    expect(feasibilityText(today, [])).toBe('Not the best match for your hair texture');
  });
  it('keeps a note that names no record, and only touches the today line', () => {
    const today = f({ status: 'today', length: { status: 'today' } });
    expect(feasibilityText(today, ['Straight hair lacks the spring; use a French crop instead.'])).toBe('Straight hair lacks the spring; use a French crop instead.');
    expect(feasibilityText(f({ status: 'after_growth', length: { status: 'after_growth', cm: 4, weeks: 18 } }), ['Not suited.'])).toBe('Needs up to about 5 cm more length, a few months of growth');
    expect(feasibilityText(today, null)).toBe('Works with your hair today');
  });
});

const entryOf = (n: number, over: Partial<PhotoEntry> = {}): PhotoEntry => ({
  id: photo(n), status: 'done', sharpness: 1, observation: observation(), edits: null, refined: null, error: null, tries: 0, ...over,
}) as PhotoEntry;

describe('photoLink and previewPhoto', () => {
  it('offers a photo on the no-photo path and after a skip, another photo once every photo failed, nothing otherwise', () => {
    expect(photoLink({ photos: [], skipped: false })).toBe('addPhoto');
    expect(photoLink({ photos: [entryOf(1)], skipped: true })).toBe('addPhoto');
    expect(photoLink({ photos: [entryOf(1, { status: 'failed', observation: null })], skipped: false })).toBe('addAnother');
    expect(photoLink({ photos: [entryOf(1, { observation: observation(0) })], skipped: false })).toBe('addAnother');
    expect(photoLink({ photos: [entryOf(1, { status: 'queued', observation: null })], skipped: false })).toBeNull();
    expect(photoLink({ photos: [entryOf(1)], skipped: false })).toBeNull();
  });
  it('offers the colour preview only on a usable main photo with its hair outline, never after a skip', () => {
    const mask = { ...observation(), previewMask: { width: 1, height: 1, data: new Uint8Array(1) } } as unknown as PhotoEntry['observation'];
    const ready = entryOf(1, { observation: mask });
    expect(previewPhoto({ photos: [ready], mainPhotoId: photo(1), skipped: false })).toBe(photo(1));
    expect(previewPhoto({ photos: [ready], mainPhotoId: photo(1), skipped: true })).toBeNull();
    expect(previewPhoto({ photos: [entryOf(1)], mainPhotoId: photo(1), skipped: false })).toBeNull();
  });
});

describe('shortfallOf', () => {
  const engine = (shortfall: Recommendation['shortfall']): Recommendation =>
    ({ picks: [], added: [], pair: null, pool: [], shortfall, relaxed: [], notes: [], referral: null, colourPrompts: true, worthAsking: [], unmet: [] });
  const ctx = (removed: readonly string[]) => ({ prefs: { goal: 'cut' as const, collections: ['salon' as const], count: 4 }, shortlist: { added: [], removed: removed.map(id), order: [] } });
  // The engine names no exclusion here, so only the removals or the library itself limit the list.
  const bare = { ...content, library: { models: [], entries: [] } };
  it('is null when the count is met', () => {
    expect(shortfallOf(engine([]), 4, bare, {}, ctx([]))).toBeNull();
  });
  it('names the removed ideas, or else the library, as what limited the list', () => {
    const short = engine([{ kind: 'cut', requested: 4, available: 2, because: [] }]);
    expect(shortfallOf(short, 2, bare, {}, ctx(['x']))).toEqual({ found: 2, reasons: [], unmet: [], removed: 1, library: [] });
    expect(shortfallOf(short, 2, bare, {}, ctx([]))).toEqual({ found: 2, reasons: [], unmet: [], removed: 0, library: ['cut'] });
  });
  it('gives the engine\'s own exclusion sentences once each, the direction no look can do, and then does not blame the library', () => {
    const rules = { ...content.consult.rules, colour: [{ id: 'direction-lighter', effect: 'rank', reason: 'You would like to go lighter' }] } as unknown as typeof content.consult.rules;
    const withRules = { ...bare, consult: { ...content.consult, rules } };
    const because = ['Your hair is damaged, so looks that lighten the lengths are left out.'];
    const short = { ...engine([{ kind: 'colour', requested: 6, available: 1, because }, { kind: 'cut', requested: 3, available: 0, because }]), unmet: [{ kind: 'colour', what: ['direction-lighter'] }] } as Recommendation;
    const got = shortfallOf(short, 1, withRules, {}, ctx([]));
    expect(got).toMatchObject({ reasons: because, unmet: ['You would like to go lighter'], library: [] });
  });
  it('says why an empty list is empty and what to do, in one sentence', () => {
    expect(ideasCopy.shortfall.found(0)).toBe('No idea fits your hair and all your answers now, so change an answer or add one from Explore.');
  });
});

describe('givesWayLine', () => {
  const engine = (what: readonly string[]) => ({ unmet: what.length === 0 ? [] : [{ kind: 'colour', what }] }) as unknown as Recommendation;
  const level = (n: number): Facts => ({ 'colour.current_level_lengths': { key: 'colour.current_level_lengths', value: n, confidence: 'high', source: 'answered' } });
  it('says once, plainly, that no look here can take the hair the way asked (no other colour stands in)', () => {
    expect(givesWayLine(engine(['direction-darker']), level(1))).toBe('Your hair is already as dark as it gets, so no colour here can take it further.');
    expect(givesWayLine(engine(['direction-lighter']), level(10))).toBe('Your hair is already as light as it gets, so no colour here can take it further.');
    expect(givesWayLine(engine(['direction-lighter']), level(7))).toBe('No look here can make your hair lighter with your answers.');
    expect(givesWayLine(engine([]), level(7))).toBeNull();
  });
});
