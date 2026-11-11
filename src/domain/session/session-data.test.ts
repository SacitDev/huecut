/** The versioned round-trip record: parsing without Zod, typed arrays, expiry. */
import { expect, it } from 'vitest';
import { asItemId, asPhotoId, asPictureId } from '../ids.ts';
import type { PhotoObservation } from '../measure/observation.ts';
import { isExpired, parseSessionData, SESSION_SCHEMA_VERSION, SESSION_TTL_MS, type SessionData } from './session-data.ts';

const observation: PhotoObservation = {
  schemaVersion: 1,
  image: { widthPx: 1000, heightPx: 1250 },
  focal35mm: 26,
  faces: [{ landmarks: new Float32Array([0.25, 0.5, 0.0125]), matrix: null, expression: { mouthSmileLeft: 0.2 } }],
  hands: [new Float32Array([0.1, 0.2, 0])],
  pose: null,
  hair: {
    coverage: 0.3,
    extent: { top: 0.05, bottom: 0.6, left: 0.2, right: 0.8 },
    hairline: new Float32Array([0.4, 0.2, 0.6, 0.2]),
    hairlineVisible: true,
    colour: { hair: { l: 30, a: 10, b: 20 }, skin: null, eyes: null },
  },
  previewMask: { widthPx: 2, heightPx: 2, data: new Uint8Array([0, 255, 255, 0]) },
  ran: ['face', 'hand', 'pose', 'segmenter'],
};

const kept: SessionData = {
  schemaVersion: SESSION_SCHEMA_VERSION,
  savedAt: 1_700_000_000_000,
  source: 'photo',
  step: 'try-on',
  furthest: 6,
  answers: { texture: { chosen: [2] }, grey_amount: { chosen: [1], under: 'colour_direction' } },
  prefs: { goal: 'both', collections: ['salon', 'barbering'], count: 4 },
  shortlist: { added: [asItemId('long-layers')], removed: [asItemId('pixie')], order: [asItemId('long-layers')] },
  pair: { cut: asItemId('long-layers'), colour: asItemId('copper-balayage') },
  slots: { 'long-layers@p1': { pictureId: asPictureId('pic-1'), hairOnly: true } },
  grids: [{ grid: 0, pictureId: asPictureId('grid-0'), ideas: [asItemId('long-layers')], confirmed: true }],
  photo: {
    id: asPhotoId('p1'),
    sharpness: 180,
    observation,
    refined: null,
    example: null,
    edits: { points: { 152: { x: 0.5, y: 0.9 } }, hairline: [{ x: 0.4, y: 0.2 }] },
  },
};

/** The record as a bundled JSON file holds it: typed arrays written as plain number arrays. */
const asJson = (data: unknown): unknown =>
  JSON.parse(JSON.stringify(data, (_key, v: unknown) => (ArrayBuffer.isView(v) ? Array.from(v as Float32Array) : v)));

const shapeError = (raw: unknown): string | null => {
  const r = parseSessionData(raw);
  return r.ok ? null : `${r.error.code} ${r.error.path}`;
};

it('a session kept before the colour choice and the tabs restores without them; once there they are read and checked', () => {
  const r = parseSessionData(asJson(kept));
  expect(r.ok && Object.keys(r.value.prefs)).toEqual(['goal', 'collections', 'count']);
  const later = { ...kept, prefs: { ...kept.prefs, colour: { mode: 'one', shade: asItemId('jet-black-all-over') }, tab: 'single', perPicture: 3 } };
  expect(parseSessionData(later)).toEqual({ ok: true, value: later });
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, colour: { mode: 'dye', shade: null } } })).toBe('shape $.prefs.colour.mode');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, tab: 'grids' } })).toBe('shape $.prefs.tab');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, perPicture: 9 } })).toBe('shape $.prefs.perPicture');
});

it('parses a kept session with its typed arrays as stored, and the same record from JSON with plain number arrays', () => {
  const stored = parseSessionData(kept);
  expect(stored).toEqual({ ok: true, value: kept });
  const fromJson = parseSessionData(asJson(kept));
  expect(fromJson).toEqual({ ok: true, value: kept });
  if (!fromJson.ok) return;
  const face = fromJson.value.photo?.observation?.faces[0];
  expect(face?.landmarks).toBeInstanceOf(Float32Array);
  expect(fromJson.value.photo?.observation?.previewMask?.data).toBeInstanceOf(Uint8Array);
});

it('rejects another schema version, and names the first wrong field of a broken record', () => {
  // Version 1 had the Lines and What we see steps; such a record is refused, so the existing rule deletes it.
  expect(shapeError({ ...kept, schemaVersion: 1 })).toBe('version $.schemaVersion');
  expect(shapeError({ ...kept, schemaVersion: 3 })).toBe('version $.schemaVersion');
  expect(shapeError(null)).toBe('shape $');
  expect(shapeError({ ...kept, step: 'analysing' })).toBe('shape $.step');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, count: 9 } })).toBe('shape $.prefs.count');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, collections: ['salon', 'kids'] } })).toBe(
    'shape $.prefs.collections[1]',
  );
  expect(shapeError({ ...kept, slots: { 'no-photo-key': { pictureId: 'x', hairOnly: false } } })).toBe(
    'shape $.slots.no-photo-key',
  );
  expect(shapeError({ ...kept, answers: { texture: { chosen: ['2'] } } })).toBe('shape $.answers.texture.chosen[0]');
});

it('an integer field refuses a fraction, an id refuses the empty text, and the colour choice\'s shade must be an id or null', () => {
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, count: 2.5 } })).toBe('shape $.prefs.count');
  expect(shapeError({ ...kept, furthest: 5.5 })).toBe('shape $.furthest');
  expect(shapeError({ ...kept, pair: { cut: '', colour: 'copper-balayage' } })).toBe('shape $.pair.cut');
  expect(shapeError({ ...kept, shortlist: { ...kept.shortlist, added: [''] } })).toBe('shape $.shortlist.added[0]');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, colour: { mode: 'one', shade: 42 } } })).toBe('shape $.prefs.colour.shade');
  expect(shapeError({ ...kept, prefs: { ...kept.prefs, colour: { mode: 'keep', shade: null } } })).toBeNull();
});

it('a grid\'s confirmed tiles are looks: an idea\'s id or a cut with its colour', () => {
  const paired = { ...kept, grids: [{ grid: 0, pictureId: 'grid-0', ideas: ['long-layers', 'long-layers+copper-balayage'], confirmed: true }] };
  expect(shapeError(paired)).toBeNull();
  expect(shapeError({ ...paired, grids: [{ ...paired.grids[0], ideas: [''] }] })).toBe('shape $.grids[0].ideas[0]');
});

it('checks the observation inside: its version, the mask size, edited point indices and the tools that ran', () => {
  const photo = kept.photo;
  if (!photo) throw new Error('fixture has a photo');
  const withObservation = (o: object): unknown => ({
    ...kept,
    photo: { ...photo, observation: { ...observation, ...o } },
  });
  expect(shapeError(withObservation({ schemaVersion: 0 }))).toBe('shape $.photo.observation.schemaVersion');
  expect(shapeError(withObservation({ previewMask: { widthPx: 3, heightPx: 2, data: [0, 1] } }))).toBe(
    'shape $.photo.observation.previewMask.data',
  );
  expect(shapeError(withObservation({ ran: ['face', 'depth'] }))).toBe('shape $.photo.observation.ran[1]');
  expect(shapeError({ ...kept, photo: { ...photo, edits: { points: { 999: { x: 0, y: 0 } }, hairline: null } } })).toBe(
    'shape $.photo.edits.points.999',
  );
});

it('furthest covers the saved step: there is no optional view any more', () => {
  expect(shapeError({ ...kept, step: 'board', furthest: 5 })).toBe('shape $.furthest');
  expect(shapeError({ ...kept, step: 'face', furthest: 1 })).toBeNull();
});

it('how long it is kept: no choice counts as 24 hours, to the millisecond; until deleted never expires by time; anything else is refused', () => {
  const until = { ...kept, keep: 'until_deleted' as const };
  expect(parseSessionData(until)).toEqual({ ok: true, value: until });
  const older = parseSessionData(asJson(kept));
  expect(older.ok && 'keep' in older.value).toBe(false);
  expect(shapeError({ ...kept, keep: 'forever' })).toBe('shape $.keep');
  for (const day of [kept, { ...kept, keep: 'day' as const }]) {
    expect(isExpired(day, day.savedAt + SESSION_TTL_MS - 1)).toBe(false);
    expect(isExpired(day, day.savedAt + SESSION_TTL_MS)).toBe(true);
  }
  expect(isExpired(until, until.savedAt + 3650 * SESSION_TTL_MS)).toBe(false);
});

it('an unusable time counts as expired, whatever the period; a clock set back a little does not', () => {
  const dated = (savedAt: number, keep?: 'day' | 'until_deleted') => ({ ...kept, savedAt, ...(keep ? { keep } : {}) });
  for (const keep of [undefined, 'day', 'until_deleted'] as const) expect(isExpired(dated(Number.NaN, keep), kept.savedAt)).toBe(true);
  expect(isExpired(dated(kept.savedAt + 2 * SESSION_TTL_MS), kept.savedAt), 'two days ahead of the clock').toBe(true);
  expect(isExpired(dated(kept.savedAt + 1000), kept.savedAt), 'a second ahead').toBe(false);
  expect(isExpired(dated(kept.savedAt + 2 * SESSION_TTL_MS, 'until_deleted'), kept.savedAt), 'until deleted does not read the clock').toBe(false);
  expect(shapeError({ ...kept, savedAt: 'yesterday' })).toBe('shape $.savedAt');
});

it('a photo saved before its analysis finished is a valid record; an id, once there, is read and checked', () => {
  const photo = kept.photo;
  if (!photo) throw new Error('fixture has a photo');
  expect(parseSessionData({ ...kept, photo: { ...photo, observation: null } })).toMatchObject({ ok: true, value: { photo: { observation: null } } });
  expect(parseSessionData({ ...kept, id: 'one' })).toMatchObject({ ok: true, value: { id: 'one' } });
  expect(shapeError({ ...kept, id: '' })).toBe('shape $.id');
});

it('a bundled example names its picture and hair mask and never expires; a kept session expires after 24 h', () => {
  expect(shapeError({ ...kept, source: 'example' })).toBe('shape $.photo.example');
  const photo = kept.photo;
  if (!photo) throw new Error('fixture has a photo');
  const example = {
    ...kept,
    source: 'example' as const,
    savedAt: 0,
    photo: { ...photo, example: { picture: 'model-a/base-front', mask: 'examples/model-a-hair-mask.png' } },
  };
  const parsed = parseSessionData(asJson(example));
  expect(parsed.ok && parsed.value.photo?.example).toEqual(example.photo.example);
  expect(isExpired(example, Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isExpired(kept, kept.savedAt + SESSION_TTL_MS - 1)).toBe(false);
  expect(isExpired(kept, kept.savedAt + SESSION_TTL_MS)).toBe(true);
});
