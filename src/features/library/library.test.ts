/**
 * Explore's pure parts on the fixture content: the filter model and its URL, the caption words, the detail sections and
 * "Works with your hair if…", and favourites without storage. The index entries and details are the fixture records
 * with the values the content build derives for them (asserted in scripts/content/build.test.ts), so no file I/O.
 */
import { describe, expect, it } from 'vitest';
import bobFile from '../../../tests/fixtures/content/haircuts/bob.json';
import cropFile from '../../../tests/fixtures/content/haircuts/crop.json';
import looksFile from '../../../tests/fixtures/content/colours/looks.json';
import modelsFile from '../../../tests/fixtures/content/library-models.json';
import picturesFile from '../../../tests/fixtures/content/pictures.json';
import type { BeardDetail, BeardIndexEntry, CutDetail, CutIndexEntry, Detail, IndexEntry, LibraryIndex, LookDetail, LookIndexEntry } from '../../domain/content/output.ts';
import type { LibraryModel, PictureEntry } from '../../domain/content/types.ts';
import { beardMeta, cutMeta, lookMeta, techniqueNames, textureSummary } from './captions.ts';
import { detailSections, pairingsOf, promptLookOf, sheetFor, worksWith } from './detail-model.ts';
import { parseFavourites, toggleFavourite } from './favourites.ts';
import {
  activeFilters, applyFilters, cleared, entriesOf, needsPolicy, offeredOptions, parseState, SEARCH_MAX_LENGTH, searchText, toggled,
  toQuery, withSearch, withShow, withTab, without, type ExploreState,
} from './filters.ts';
import { pictureAlt, picturesOf, tilePicture } from '../shared/pictures.ts';
import { tilesOf } from './tiles.ts';

const POLICY = { max_styling_minutes: 10, min_trim_weeks: 8 };
const ALL_PICTURES = picturesFile as Record<string, PictureEntry>;
const [bobRaw] = bobFile;
const [cropRaw] = cropFile;
const [silverRaw, prelightRaw] = looksFile;
if (!bobRaw || !cropRaw || !silverRaw || !prelightRaw) throw new Error('fixture records missing');

/** A cut's details as the build writes them: its record without review, with the build's traits. */
function cutDetail(raw: { readonly traits: object }, over: Record<string, unknown>, build: Record<string, unknown>): CutDetail {
  const record = Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'review'));
  return { ...record, ...over, traits: { ...raw.traits, ...build }, variant_of: null, variants: [], required_cm: 0 } as unknown as CutDetail;
}
const BOB = cutDetail(bobRaw, {}, { length_class: 'chin', top_length: 'long', sides: 'none' });
const CROP = cutDetail(cropRaw, {}, { length_class: 'very_short', top_length: 'short', sides: 'drop_fade' });
const SKIN = cutDetail(cropRaw, { id: 'skin-fade-textured-crop', name: 'Skin fade with a longer textured crop' }, { length_class: 'short', top_length: 'medium', sides: 'skin_fade' });
/** Pictures in the order the build writes them: the record's views (front, side, back), or one per model for a look. */
const picturesFor = (keys: readonly string[]) => Object.fromEntries(keys.flatMap((k) => (ALL_PICTURES[k] ? [[k, ALL_PICTURES[k]]] : [])));
const cutEntry = (d: CutDetail): CutIndexEntry =>
  ({ ...d, kind: 'cut', pictures: picturesFor(d.images.views.map((v) => `${d.images.model}/${d.id}-${v}`)) });

const lookTraits = { family: 'red_copper', warmth: 'warm', technique_category: ['process', 'placement'], regions: ['ends'], lightening: 'some', vivid: false, salon_only: true };
const SILVER = { ...silverRaw, traits: { ...lookTraits, tone: ['silver', 'copper'], technique: ['all_over', 'balayage'], prelightening: false, target_level: 10, upkeep_weeks: [6, 8] } } as unknown as LookDetail;
const PRELIGHT = { ...prelightRaw, traits: { ...lookTraits, tone: ['copper'], technique: ['balayage'], prelightening: true, target_level: 9, upkeep_weeks: [12, 16] } } as unknown as LookDetail;
const lookEntry = (d: LookDetail): LookIndexEntry => ({ ...d, aliases: [], needs: { roots: [], lengths: [] }, pictures: picturesFor(d.images.models.map((m) => `${m}/${d.id}-${d.images.view}`)) });

const INDEX: LibraryIndex = {
  models: modelsFile as unknown as LibraryModel[],
  entries: [
    cutEntry(BOB), cutEntry(CROP), cutEntry(SKIN), lookEntry(SILVER), lookEntry(PRELIGHT),
    { kind: 'shade', id: 'ash-silver', name: 'Ash silver', level: [9, 10], tone: 'silver' },
    { kind: 'shade', id: 'copper-auburn', name: 'Copper auburn', level: [5, 7], tone: 'copper' },
    { kind: 'technique', id: 'all-over', name: 'All-over colour' },
    { kind: 'technique', id: 'balayage', name: 'Balayage' },
  ] as unknown as IndexEntry[],
};
const ids = (entries: readonly { id: string }[] | null) => entries?.map((e) => e.id) ?? null;
const state = (query: string): ExploreState => parseState(new URLSearchParams(query));
const styles = () => entriesOf(INDEX, 'styles');

describe('the URL state', () => {
  it('reads tab, Show and each group, dropping unknown keys and values', () => {
    expect(state('tab=colours&show=salon&family=red_copper,teal,red_copper&length=short')).toEqual({ tab: 'colours', show: 'salon', q: '', chosen: { family: ['red_copper'] } });
    expect(state('tab=nope&show=everyone')).toEqual({ tab: 'styles', show: 'all', q: '', chosen: {} });
    // Beards are one collection, so Show does not apply there.
    expect(state('tab=beards&show=salon').show).toBe('all');
    expect(parseState(new URLSearchParams(''), 'colours').tab).toBe('colours');
  });

  it('writes the query with defaults left out and options in group order, commas readable', () => {
    expect(toQuery(state(''))).toBe('');
    expect(toQuery(state('texture=curly,straight&show=barbering&length=long,short'))).toBe('show=barbering&length=short,long&texture=straight,curly');
    const round = 'tab=colours&show=salon&family=blonde,red_copper&upkeep=low';
    expect(toQuery(state(round))).toBe(round);
  });

  it('toggles, removes, switches tab and clears', () => {
    const s = toggled(toggled(state('show=salon'), 'length', 'long'), 'length', 'short');
    expect(s.chosen).toEqual({ length: ['short', 'long'] });
    expect(toggled(s, 'length', 'long').chosen).toEqual({ length: ['short'] });
    expect(toggled(s, 'nope', 'x')).toBe(s);
    expect(activeFilters(s)).toEqual([{ key: 'show', option: 'salon' }, { key: 'length', option: 'short' }, { key: 'length', option: 'long' }]);
    expect(without(s, { key: 'show', option: 'salon' }).show).toBe('all');
    expect(withTab(s, 'beards')).toEqual({ tab: 'beards', show: 'salon', q: '', chosen: {} });
    expect(cleared(s)).toEqual({ tab: 'styles', show: 'all', q: '', chosen: {} });
    expect(withShow(s, 'barbering').show).toBe('barbering');
  });

  it('keeps the search as typed, so the next word can be typed, and leaves it out when empty', () => {
    expect(state('q=korean+').q).toBe('korean ');
    expect(toQuery(state('q=korean+'))).toBe('q=korean+');
    expect(toQuery(withSearch(state('q=korean'), ''))).toBe('');
    expect(toQuery(state('tab=colours&q=ash&family=blonde'))).toBe('tab=colours&q=ash&family=blonde');
    // Characters that mean something in a query survive the round trip.
    const awkward = 'a&b=c#d,e%';
    expect(state(toQuery(withSearch(state(''), awkward))).q).toBe(awkward);
    expect(state(`q=${'x'.repeat(SEARCH_MAX_LENGTH + 5)}`).q).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it('carries the search to another tab, and "Clear filters" leaves it to its own button', () => {
    const s = toggled(state('q=bob&show=salon'), 'length', 'long');
    expect(withTab(s, 'colours')).toEqual({ tab: 'colours', show: 'salon', q: 'bob', chosen: {} });
    expect(cleared(s).q).toBe('bob');
    expect(activeFilters(s), 'the search is not one of the chips').toEqual([{ key: 'show', option: 'salon' }, { key: 'length', option: 'long' }]);
  });
});

const named = (id: string, name: string, aliases: readonly string[]): CutIndexEntry => ({ ...cutEntry(BOB), id, name, aliases });
/** Names and aliases as the library writes them. */
const SEARCHED = [
  named('hush-midi', 'Hush cut midi', ['hush cut', 'Korean-style layers', 'soft-framed layers']),
  named('wispy-brow-fringe-long', 'Wispy brow-grazing fringe on long hair', ['Birkin fringe', 'see-through bangs']),
  named('curtain-fringe-lob', 'Lob with a curtain fringe', ['curtain-bang lob', 'lob with curtain bangs']),
  named('curtains-middle-part', 'Curtains (middle part)', ['Curtain fringe', '90s middle part']),
  named('short-back-sides', 'Connected short back and sides', ["Gentleman's cut"]),
  named('soft-layered-bob', 'Soft layered bob', []),
  named('caramel-ombre', 'Caramel Ombré', []),
];
const found = (q: string, entries: readonly CutIndexEntry[] = SEARCHED) => ids(applyFilters(entries, withSearch(state(''), q), null));

describe('searching names and aliases', () => {
  it('finds what the words name, across the name and every alias, in any order', () => {
    expect(found('hush')).toEqual(['hush-midi']);
    expect(found('korean hush')).toEqual(['hush-midi']);
    expect(found('hush korean')).toEqual(['hush-midi']);
    expect(found('see-through')).toEqual(['wispy-brow-fringe-long']);
    expect(found('see through')).toEqual(['wispy-brow-fringe-long']);
    expect(found('curtain bangs')).toEqual(['curtain-fringe-lob']);
    expect(found('curtain')).toEqual(['curtain-fringe-lob', 'curtains-middle-part']);
    expect(found('hush bangs'), 'every word must be found').toEqual([]);
  });

  it('ignores case, accents, punctuation and curly apostrophes, on both sides', () => {
    expect(found('HUSH')).toEqual(['hush-midi']);
    expect(found('húsh')).toEqual(['hush-midi']);
    expect(found('húsh'), 'a separate combining accent').toEqual(['hush-midi']);
    expect(found('ombre')).toEqual(['caramel-ombre']);
    expect(found('OMBRÉ')).toEqual(['caramel-ombre']);
    expect(found('(middle-part)')).toEqual(['curtains-middle-part']);
    for (const q of ["gentleman's", 'gentleman’s', 'gentlemans']) expect(found(q), q).toEqual(['short-back-sides']);
  });

  it('matches short words at a word start only, and longer ones anywhere', () => {
    // "red" must not find every "layered" and "tapered".
    expect(found('red')).toEqual([]);
    expect(found('lay')).toEqual(['hush-midi', 'soft-layered-bob']);
    expect(found('lights', [named('babylights', 'Honey babylights', [])])).toEqual(['babylights']);
  });
});

describe('searching with the rest of Explore', () => {
  it('narrows nothing when there is nothing to search for', () => {
    for (const q of ['', '   ', '-', '()']) {
      expect(found(q), JSON.stringify(q)).toHaveLength(SEARCHED.length);
      expect(searchText(withSearch(state(''), q))).toBe('');
    }
    expect(searchText(withSearch(state(''), '  hush '))).toBe('hush');
  });

  it('works together with Show and the chips', () => {
    expect(ids(applyFilters(styles(), state('q=crop'), null))).toEqual(['mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    expect(ids(applyFilters(styles(), state('q=crop&length=short&show=barbering'), null))).toEqual(['mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    expect(applyFilters(styles(), state('q=crop&show=salon'), null)).toEqual([]);
    expect(applyFilters(styles(), state('q=crop&upkeep=low'), null), 'still waits for the policy').toBeNull();
    // The chips on offer do not change as the person types.
    expect(offeredOptions(styles(), state('q=crop'))).toEqual(offeredOptions(styles(), state('')));
  });

  it('searches colour looks and beards the same way', () => {
    const colours = entriesOf(INDEX, 'colours');
    expect(ids(applyFilters(colours, state('tab=colours&q=silver'), null))).toEqual(['copper-with-silver-ends']);
    const withAlias = colours.map((e) => ({ ...e, aliases: e.id === 'copper-balayage-prelightened' ? ['penny hair'] : [] }));
    expect(ids(applyFilters(withAlias, state('tab=colours&q=penny'), null))).toEqual(['copper-balayage-prelightened']);
    const beard = { kind: 'beard', id: 'boxed', name: 'Short boxed beard', aliases: ['corporate beard'], collections: ['barbering'] } as unknown as BeardIndexEntry;
    expect(ids(applyFilters([beard], state('tab=beards&q=corporate'), null))).toEqual(['boxed']);
  });
});

describe('filtering the fixture library', () => {
  it('lists each tab from the index, in index order', () => {
    expect(ids(styles())).toEqual(['chin-bob-curtain-fringe', 'mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    expect(ids(entriesOf(INDEX, 'colours'))).toEqual(['copper-with-silver-ends', 'copper-balayage-prelightened']);
    expect(entriesOf(INDEX, 'beards')).toEqual([]);
  });

  it('applies Show and every group (any within a group, all across groups)', () => {
    expect(ids(applyFilters(styles(), state('show=barbering'), null))).toEqual(['mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    // Length groups: chin is medium; very_short and short are short.
    expect(ids(applyFilters(styles(), state('length=medium'), null))).toEqual(['chin-bob-curtain-fringe']);
    expect(applyFilters(styles(), state('length=short,medium'), null)).toHaveLength(3);
    expect(applyFilters(styles(), state('show=barbering&length=medium'), null)).toEqual([]);
    // Texture is a good fit as cut: the crops are good for curly hair, the bob adapts.
    expect(ids(applyFilters(styles(), state('texture=curly'), null))).toEqual(['mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    expect(ids(applyFilters(styles(), state('works=hairline'), null))).toEqual(['mid-drop-fade-textured-crop', 'skin-fade-textured-crop']);
    expect(applyFilters(styles(), state('works=hairline,fine'), null)).toEqual([]);
    expect(applyFilters(styles(), state('fringe=none'), null)).toEqual([]);
  });

  it('waits for the policy before an upkeep filter answers, then reads it as the engine does', () => {
    const low = state('upkeep=low');
    expect(needsPolicy(low)).toBe(true);
    expect(applyFilters(styles(), low, null)).toBeNull();
    // At most 10 minutes of styling and trims at least 8 weeks apart: no fixture cut (trims from 6 and 2 weeks).
    expect(applyFilters(styles(), low, POLICY)).toEqual([]);
    // Colour: visits at least 8 weeks apart; the prelightened balayage revisits at 12-16 weeks.
    expect(ids(applyFilters(entriesOf(INDEX, 'colours'), state('tab=colours&upkeep=low'), POLICY))).toEqual(['copper-balayage-prelightened']);
  });

  it('offers only options some entry has, plus upkeep and anything already chosen', () => {
    expect(offeredOptions(styles(), state(''))).toEqual({
      length: ['short', 'medium'], texture: ['straight', 'wavy', 'curly'], fringe: ['fringe'], upkeep: ['low'], works: ['hairline'],
    });
    expect(offeredOptions(styles(), state('length=long')).length).toEqual(['short', 'medium', 'long']);
  });
});

describe('captions', () => {
  const fit = (good: readonly string[]) =>
    Object.fromEntries(['straight', 'wavy', 'curly', 'coily'].map((x) => [x, { fit: good.includes(x) ? 'good' : 'adapt' }])) as CutIndexEntry['texture_fit'];

  it('sums up the textures a cut fits as cut', () => {
    expect(textureSummary(fit(['straight', 'wavy', 'curly', 'coily']))).toBe('any texture');
    expect(textureSummary(fit(['straight', 'wavy']))).toBe('straight to wavy');
    expect(textureSummary(fit(['curly']))).toBe('curly');
    expect(textureSummary(fit(['straight', 'curly']))).toBe('straight or curly');
    expect(textureSummary(fit([]))).toBeNull();
  });

  it('writes the meta phrase, the model line and the alt text', () => {
    expect(cutMeta(cutEntry(BOB))).toBe('Medium length, straight to wavy');
    expect(cutMeta(cutEntry(SKIN))).toBe('Short, straight to curly');
    expect(lookMeta(lookEntry(SILVER), techniqueNames(INDEX))).toBe('Red and copper, all-over colour and balayage');
    const beard = { traits: { beard_length: 'short', beard_shape: 'short_along_jaw' } } as Parameters<typeof beardMeta>[0];
    expect(beardMeta(beard)).toBe('Short, kept along the jaw');
    const front = tilePicture(cutEntry(BOB), INDEX.models);
    expect(front).toMatchObject({ key: 'salon-straight-wavy/chin-bob-curtain-fringe-front', width: 1086, height: 1448, placeholder: '#6b5a4c' });
    expect(front?.alt).toBe('Front view: Chin bob with a curtain fringe, on the straight-to-wavy model.');
    expect(front?.srcSet).toBe(['480', '960', '1086'].map((w) => `/library/salon-straight-wavy/chin-bob-curtain-fringe-front-${w}.avif ${w}w`).join(', '));
    expect(front?.model?.shown_on).toBe('Shown on wavy 2B hair');
    expect(picturesOf(cutEntry(BOB), INDEX.models).map((p) => p.view)).toEqual(['front', 'side', 'back']);
    expect(pictureAlt('back', 'A look', undefined)).toBe('Back view: A look.');
  });

  it('a look with its own caption shows it instead of the model line', () => {
    const shownOn = (entry: CutIndexEntry) => tilesOf(INDEX, 'styles', [entry], '')[0]?.shownOn;
    expect(shownOn(cutEntry(BOB))).toBe('Shown on wavy 2B hair');
    expect(shownOn({ ...cutEntry(BOB), shown_on: 'Shown on 4A to 4B coils' })).toBe('Shown on 4A to 4B coils');
  });
});

describe('the detail', () => {
  it('shows lengths with guard numbers, the fade and upkeep from the stylist-sheet model', () => {
    const sections = detailSections(CROP, sheetFor(CROP, INDEX));
    expect(sections.map((s) => s.id)).toEqual(['lengths', 'fade', 'upkeep']);
    expect(sections[0]?.rows).toContainEqual({ label: 'Sides', value: '#1, 3 mm to #3, 9 mm' });
    expect(sections[0]?.rows).toContainEqual({ label: 'Top', value: '3-5 cm' });
    expect(sections[2]?.rows).toContainEqual({ label: 'Trim', value: 'every 2-4 weeks' });
  });

  it('shows a colour look its colour plan', () => {
    const [colour] = detailSections(SILVER, sheetFor(SILVER, INDEX));
    expect(colour?.rows).toEqual([
      { label: 'Base', value: 'All-over colour in Copper auburn, level 5-7, copper tone' },
      { label: 'Ends', value: 'Balayage in Ash silver, level 9-10, silver tone' },
      { label: 'Visits', value: 'every 6-8 weeks' },
    ]);
  });

  it('finishes "Works with your hair if…" from the fits, the density and the tags', () => {
    expect(worksWith(BOB)).toEqual({
      heading: 'Works with your hair if…',
      lines: ['it is straight or wavy', 'it is curly: Cut it dry, curl by curl.', 'it is coily: Allow for shrinkage at the ends.', 'its density is low or medium'],
      note: 'Fine hair keeps a fuller edge at this length.',
    });
    expect(worksWith(CROP)?.lines).toEqual([
      'it is straight, wavy or curly', 'it is coily: Sponge-friendly top length.', 'its density is low or medium', 'your hairline is higher at the temples',
    ]);
    expect(worksWith(SILVER)).toBeNull();
  });

  it('lists pairings that are in the library and gives the prompt its look', () => {
    expect(pairingsOf(BOB, INDEX)).toEqual([]);
    const beard = { kind: 'beard', pairs_with: { cuts: ['mid-drop-fade-textured-crop', 'not-in-the-library'] } } as unknown as BeardDetail;
    expect(pairingsOf(beard, INDEX)).toEqual([{ kind: 'style', id: 'mid-drop-fade-textured-crop', name: 'Mid drop fade with textured crop' }]);
    expect(promptLookOf(BOB)).toEqual({ id: BOB.id, kind: 'cut', name: BOB.name, prompt_spec: BOB.prompt_spec });
    expect(promptLookOf({ kind: 'technique' } as Detail)).toBeNull();
  });
});

describe('favourites', () => {
  it('cleans what storage holds', () => {
    expect([...parseFavourites('["chin-bob","chin-bob","Bad Id",3,"crop"]')]).toEqual(['chin-bob', 'crop']);
    expect([...parseFavourites('{"not":"a list"}')]).toEqual([]);
    expect([...parseFavourites('not json')]).toEqual([]);
    expect([...parseFavourites(null)]).toEqual([]);
  });

  it('saves and unsaves in memory where there is no storage (Node has no localStorage)', () => {
    expect(toggleFavourite('chin-bob-curtain-fringe')).toBe(true);
    expect(toggleFavourite('chin-bob-curtain-fringe')).toBe(false);
  });
});
