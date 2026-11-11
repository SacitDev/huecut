/** Selectors: memoised on input identity, the 8 cap, the pair, the board and the main photo's slots. */
import { expect, it } from 'vitest';
import { asPictureId, slotKey } from '../domain/ids.ts';
import { colour, createFakes, cut, enginePicks, explore, input, observation, photo } from '../../tests/machine/consult.fakes.ts';
import { NO_PHOTO } from './consult.logic.ts';
import { freshContext } from './consult.machine.ts';
import { createConsultSelectors, type EnginePick, type EngineRequest } from './consult.selectors.ts';
import type { ConsultContext, PhotoEntry } from './consult.types.ts';

const base = freshContext(input());
const withGoal = (over: Partial<ConsultContext> = {}): ConsultContext => ({
  ...base,
  prefs: { goal: 'cut', collections: ['salon'], count: 4 },
  ...over,
});
const done = (n: number, over: Partial<PhotoEntry> = {}): PhotoEntry => ({
  id: photo(n),
  status: 'done',
  sharpness: 200,
  observation: observation(),
  edits: null,
  refined: null,
  error: null,
  tries: 0,
  ...over,
}) as PhotoEntry;

it('every selector returns the same object while its inputs are the same objects, and a new one when one changes', () => {
  const s = createFakes().selectors;
  const c = withGoal();
  expect(s.facts(c)).toBe(s.facts({ ...c, keptStored: true }));
  expect(s.recommendation(c)).toBe(s.recommendation({ ...c, furthest: 3 }));
  expect(s.ideas(c)).toBe(s.ideas({ ...c, inFlight: null }));
  expect(s.boardLayout(c)).toBe(s.boardLayout({ ...c }));
  expect(s.promptPack(c)).toBe(s.promptPack({ ...c }));
  const more = { ...c, answers: { texture: { chosen: [0] } } };
  expect(s.facts(more)).not.toBe(s.facts(c));
  expect(s.ideas({ ...c, prefs: { ...c.prefs, count: 2 } }).ids).toEqual([cut(1), cut(2)]);
});

it('ideas: the engine picks for the count, at most 8 with the person own additions kept, cuts and colours apart', () => {
  const s = createFakes().selectors;
  expect(s.ideas(base).ids).toEqual([]); // no goal yet: no engine call
  const both = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 5 } });
  expect(s.ideas(both)).toMatchObject({ cuts: [cut(1), cut(2), cut(3)], colours: [colour(1), colour(2)], own: [] });
  const added = Array.from({ length: 7 }, (_, i) => explore(i + 1));
  const full = s.ideas(withGoal({ shortlist: { added, removed: [], order: [] } }));
  expect(full.ids).toEqual([cut(1), ...added]);
  expect(full.own).toEqual(added);
  expect(s.ideas({ ...base, shortlist: { added: [explore(1)], removed: [], order: [] } }).ids).toEqual([explore(1)]); // from Explore, before a goal
});

it('recommendation asks the engine once per input change, with removed and added; promptPack is null without a goal', () => {
  const requests: EngineRequest[] = [];
  const s = createConsultSelectors({
    recommend: (_facts, _content, request) => {
      requests.push(request);
      return { picks: enginePicks.filter((p) => !request.removed.includes(p.id)) };
    },
    buildPrompts: (i) => i,
    stylistSheet: (i) => i,
  });
  const c = withGoal({ shortlist: { added: [explore(1)], removed: [cut(1)], order: [] } });
  expect(s.ideas(c).ids).toEqual([cut(2), cut(3), cut(4), cut(5), explore(1)]);
  expect(s.ideas({ ...c, keptStored: true }).ids).toHaveLength(5);
  expect(requests).toEqual([{ goal: 'cut', collections: ['salon'], count: 4, removed: [cut(1)], added: [explore(1)], colours: { mode: 'keep', shade: null } }]);
  expect(s.promptPack(base)).toBeNull();
  expect(s.promptPack(c)).toMatchObject({ pair: null, hasPhoto: false });
});

it('pairIdea is the pair only while both ideas are in the list', () => {
  const s = createFakes().selectors;
  const c = withGoal({
    prefs: { goal: 'both', collections: ['salon'], count: 4 },
    pair: { cut: cut(1), colour: colour(1) },
  });
  expect(s.pairIdea(c)).toEqual({ cut: cut(1), colour: colour(1) });
  expect(s.pairIdea({ ...c, shortlist: { added: [], removed: [colour(1)], order: [] } })).toBeNull();
});

it('boardLayout: the pair first when its picture exists, then one tile per idea in list order; at most 9', () => {
  const s = createFakes().selectors;
  const pairKey = slotKey([cut(1), colour(1)], photo(1));
  const c = withGoal({
    prefs: { goal: 'both', collections: ['salon'], count: 8 },
    photos: [done(1)],
    mainPhotoId: photo(1),
    pair: { cut: cut(1), colour: colour(1) },
    slots: {
      [pairKey]: { pictureId: asPictureId('pair'), hairOnly: false },
      [slotKey(cut(2), photo(1))]: { pictureId: asPictureId('c2'), hairOnly: true },
    },
  });
  const tiles = s.boardLayout(c);
  expect(tiles).toHaveLength(9);
  expect(tiles[0]).toEqual({
    key: pairKey,
    ideas: [cut(1), colour(1)],
    picture: { pictureId: 'pair', hairOnly: false },
  });
  expect(tiles[2]).toEqual({
    key: slotKey(cut(2), photo(1)),
    ideas: [cut(2)],
    picture: { pictureId: 'c2', hairOnly: true },
  });
  expect(s.boardLayout({ ...c, slots: {} })).toHaveLength(8);
});

it('slotsForMainPhoto shows only the main photo slots, and the no-photo slots without a photo', () => {
  const s = createFakes().selectors;
  const one = slotKey(cut(1), photo(1));
  const none = slotKey(cut(1), NO_PHOTO);
  const slots = {
    [one]: { pictureId: asPictureId('a'), hairOnly: false },
    [none]: { pictureId: asPictureId('b'), hairOnly: false },
  };
  expect(Object.keys(s.slotsForMainPhoto({ ...base, slots, mainPhotoId: photo(1) }))).toEqual([one]);
  expect(Object.keys(s.slotsForMainPhoto({ ...base, slots }))).toEqual([none]);
  expect(s.stylistSheet({ ...base, slots, mainPhotoId: photo(1) }, cut(1))).toMatchObject({
    id: cut(1),
    picture: { pictureId: 'a' },
  });
  const paired = { [slotKey([cut(1), colour(1)], photo(1))]: { pictureId: asPictureId('p'), hairOnly: false } };
  expect(s.stylistSheet({ ...base, slots: paired, mainPhotoId: photo(1) }, [cut(1), colour(1)])).toMatchObject({
    id: cut(1),
    colour: colour(1),
    picture: { pictureId: 'p' },
  });
});

it('cardFacts states nothing when skipped, without a main photo or with a main photo that has no face', () => {
  const s = createFakes().selectors;
  const c = { ...base, photos: [done(1)], mainPhotoId: photo(1) };
  expect(s.cardFacts(c)).toEqual([]);
  expect(s.cardFacts({ ...c, skipped: true })).toEqual([]);
  expect(s.cardFacts({ ...c, mainPhotoId: photo(9) })).toEqual([]);
});

it('measurementsOf follows the photo\'s moved lines; faceFacts is null when skipped or without a usable photo', () => {
  const s = createFakes().selectors;
  const c = { ...base, photos: [done(1)], mainPhotoId: photo(1) };
  const saved = s.measurementsOf(c, photo(1));
  expect(saved).not.toBeNull();
  expect(s.measurementsOf({ ...c }, photo(1))).toBe(saved);
  const moved = { ...c, photos: [done(1, { edits: { points: { 1: { x: 0.5, y: 0.5 } }, hairline: null } })] };
  expect(s.measurementsOf(moved, photo(1))).not.toBe(saved);
  expect(s.measurementsOf(c, photo(9))).toBeNull();
  expect(s.faceFacts(c)).not.toBeNull();
  expect(s.faceFacts({ ...c, skipped: true })).toBeNull();
  expect(s.faceFacts({ ...c, photos: [done(1, { observation: observation(0) })] })).toBeNull();
});

/** A fake that honours the request as the real engine does: `count` picks of the kinds asked for, Both's first half cuts; the colours are the test's. The rule for which colours apply is the real wiring's (`tests/engine/consult-deps.test.ts`). */
function countingEngine(colours: readonly EnginePick[], requests: EngineRequest[] = []) {
  return createConsultSelectors({
    recommend: (_f, _c, r) => {
      requests.push(r);
      const of = (kind: 'cut' | 'colour', n: number) => enginePicks.filter((p) => p.kind === kind && !r.removed.includes(p.id)).slice(0, n);
      const cuts = r.goal === 'both' ? Math.ceil(r.count / 2) : r.goal === 'cut' ? r.count : 0;
      return { picks: [...of('cut', cuts), ...of('colour', r.count - cuts)], colours };
    },
    buildPrompts: (i) => i,
    stylistSheet: (i) => i,
  });
}
const COLOURS = enginePicks.filter((p) => p.kind === 'colour');
const pickColours = (...ns: number[]) => ns.map((n) => ({ id: colour(n), kind: 'colour' as const }));

it('colour in the results: Keep and One colour show only cuts and keep the count, Pick keeps the colours; a tab change runs no engine', () => {
  const requests: EngineRequest[] = [];
  const s = countingEngine(COLOURS.slice(0, 2), requests);
  const both = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 6 } });
  expect(s.ideas(both)).toMatchObject({ cuts: [cut(1), cut(2), cut(3)], colours: [colour(1), colour(2), colour(3)] });
  expect(s.looks(both)).toEqual([[cut(1), colour(1)], [cut(2), colour(2)], [cut(3), colour(1)], colour(1), colour(2), colour(3)]);
  expect(requests).toHaveLength(1);
  expect(s.ideas({ ...both, prefs: { ...both.prefs, tab: 'tips', perPicture: 2 } })).toBe(s.ideas(both));
  expect(requests, 'the tab and looks per picture are not engine inputs').toHaveLength(1);
  const keep = { ...both, prefs: { ...both.prefs, colour: { mode: 'keep', shade: null } } } satisfies ConsultContext;
  expect(s.ideas(keep).ids, 'the count stays 6, all cuts').toEqual([cut(1), cut(2), cut(3), cut(4), cut(5), cut(6)]);
  expect(requests.at(-1), 'the engine is asked for cuts and told the choice').toMatchObject({ goal: 'cut', count: 6, colours: { mode: 'keep', shade: null } });
  const unpaired = countingEngine([]);
  expect(unpaired.looks(keep)).toEqual(unpaired.ideas(keep).ids);
  const one = { ...both, prefs: { ...both.prefs, colour: { mode: 'one', shade: colour(5) } } } satisfies ConsultContext;
  expect(s.ideas(one).colours, 'One colour shows no other colour').toEqual([]);
  expect(s.ideas(one).ids).toHaveLength(6);
  expect(requests.at(-1)).toMatchObject({ goal: 'cut', count: 6, colours: { mode: 'one', shade: colour(5) } });
  expect(s.noColourFits(both)).toBe(false);
});

it('Keep and One colour hide the person\'s added colours too and keep their added cuts; Pick keeps both', () => {
  const s = countingEngine(COLOURS);
  const shortlist = { added: [colour(9), explore(1)], removed: [], order: [] };
  for (const choice of [{ mode: 'keep', shade: null }, { mode: 'one', shade: colour(5) }] as const) {
    const c = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 2, colour: choice }, shortlist });
    expect(s.ideas(c)).toMatchObject({ ids: [cut(1), cut(2), explore(1)], colours: [], own: [explore(1)] });
  }
  const pick = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 2 }, shortlist });
  expect(s.ideas(pick)).toMatchObject({ colours: [colour(1), colour(9)], own: [colour(9), explore(1)] });
});

it('cuts pair first with the colours on the list, in the person\'s order, then with the engine\'s next ones', () => {
  const s = countingEngine(pickColours(1, 2, 3));
  const c = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 4 }, shortlist: { added: [], removed: [], order: [colour(2), cut(1), cut(2), colour(1)] } });
  expect(s.looks(c)).toEqual([colour(2), [cut(1), colour(2)], [cut(2), colour(1)], colour(1)]);
  const next = countingEngine(pickColours(2, 3, 4));
  const few = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 5 }, shortlist: { added: [], removed: [colour(1)], order: [colour(3)] } });
  expect(next.ideas(few).colours).toEqual([colour(3), colour(2)]);
  expect(next.looks(few).filter((l) => typeof l !== 'string'), 'the list\'s two, then the engine\'s next').toEqual([[cut(1), colour(3)], [cut(2), colour(2)], [cut(3), colour(4)]]);
});

it('the notice that no colour fits needs a cut to pair: with no cut on the list there is nothing to say', () => {
  const s = countingEngine([]);
  const c = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 2 } });
  expect(s.noColourFits(c)).toBe(true);
  const noCuts = { ...c, shortlist: { added: [], removed: Array.from({ length: 10 }, (_, i) => cut(i + 1)), order: [] } };
  expect(s.ideas(noCuts).cuts).toEqual([]);
  expect(s.ideas(noCuts).ids).toEqual([colour(1)]);
  expect(s.noColourFits(noCuts)).toBe(false);
});

it('no eligible colour leaves the cuts alone and the screen is told, under Pick and One colour but never under Keep', () => {
  const s = createConsultSelectors({
    recommend: (_f, _c, r) => ({ picks: enginePicks.filter((p) => r.goal === 'both' || p.kind === r.goal), colours: [] }),
    buildPrompts: (i) => i,
    stylistSheet: (i) => i,
  });
  const both = withGoal({ prefs: { goal: 'both', collections: ['salon'], count: 2 } });
  expect(s.noColourFits(both)).toBe(true);
  expect(s.looks(both)).toEqual([cut(1), colour(1)]);
  expect(s.noColourFits({ ...both, prefs: { ...both.prefs, colour: { mode: 'keep', shade: null } } })).toBe(false);
  expect(s.noColourFits(withGoal({ prefs: { goal: 'colour', collections: ['salon'], count: 2 } })), 'goal Colour has no control').toBe(false);
});

it('a board tile keeps the pairing it was made with when the choice changes; a removed idea does not come back; pictures win over empty tiles at the limit', () => {
  const s = createFakes().selectors;
  const old = slotKey([cut(1), colour(1)], photo(1));
  const c = withGoal({ photos: [done(1)], mainPhotoId: photo(1), slots: { [old]: { pictureId: asPictureId('old'), hairOnly: false } } });
  expect(s.boardLayout(c).map((t) => t.key)).toEqual([...[1, 2, 3, 4].map((n) => slotKey(cut(n), photo(1))), old]);
  expect(s.boardLayout(c).at(-1)).toEqual({ key: old, ideas: [cut(1), colour(1)], picture: { pictureId: 'old', hairOnly: false } });
  expect(s.boardLayout({ ...c, shortlist: { added: [], removed: [cut(1)], order: [] } }).map((t) => t.key)).not.toContain(old);
  const full = withGoal({ prefs: { goal: 'cut', collections: ['salon'], count: 8 }, photos: [done(1)], mainPhotoId: photo(1), slots: c.slots });
  const tiles = s.boardLayout(full);
  expect(tiles).toHaveLength(8);
  expect(tiles.map((t) => t.key)).toContain(old);
  expect(tiles.map((t) => t.key)).not.toContain(slotKey(cut(8), photo(1)));
});
