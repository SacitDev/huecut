/** Saved's pure helpers: the words for the time left and each save status, the grouping of favourites and each tile's picture. */
import { describe, expect, it } from 'vitest';
import type { IndexEntry, LibraryIndex } from '../../domain/content/output.ts';
import { SESSION_TTL_MS } from '../../domain/session/session-data.ts';
import { statusLine, timeLeftWords, type SaveState } from '../shared/save-status.ts';
import { detailHref, savedGroups, tilePictureKey, type SavedEntry } from './model.ts';

const HOUR = 3_600_000;
const NOW = 1_000 * HOUR;

describe('statusLine', () => {
  const state = (over: Partial<SaveState>): SaveState => ({ mode: 'until_deleted', status: 'saved', stored: true, savedAt: NOW, ...over });
  it('says each status in one short line, and Saved only for a committed write', () => {
    const lines: readonly (readonly [Partial<SaveState>, string])[] = [
      [{}, 'Saved on this device until you delete it.'],
      [{ mode: 'day', savedAt: NOW - 2 * HOUR }, 'Saved on this device. About 22 hours left.'],
      [{ status: 'saving' }, 'Saving'],
      [{ status: 'idle', stored: false }, 'Nothing is saved yet.'],
      [{ status: 'refused' }, 'Could not save. Your last save is still here.'],
      [{ status: 'refused', stored: false }, 'Could not save. Keep this tab open.'],
      [{ status: 'taken', stored: false }, 'Another session is saved here. Replace it?'],
      [{ mode: 'off', status: 'idle', stored: false }, 'Not saved on this device.'],
      [{ mode: 'off', status: 'refused', stored: false }, 'Could not delete it. Close other tabs and reload.'],
    ];
    for (const [over, line] of lines) expect(statusLine(state(over), NOW)).toBe(line);
  });
});

describe('timeLeftWords', () => {
  it('rounds to whole hours, says 1 hour in the singular and gives less than an hour at the end', () => {
    expect(timeLeftWords(NOW, NOW)).toBe('About 24 hours left.');
    expect(timeLeftWords(NOW - 2 * HOUR, NOW)).toBe('About 22 hours left.');
    expect(timeLeftWords(NOW - SESSION_TTL_MS + HOUR, NOW)).toBe('About 1 hour left.');
    expect(timeLeftWords(NOW - SESSION_TTL_MS + HOUR - 1, NOW)).toBe('Less than an hour left.');
  });
});

const entry = (id: string, kind: SavedEntry['kind']): IndexEntry => ({ id, kind, name: id, pictures: {} }) as unknown as IndexEntry;
const index = (entries: readonly IndexEntry[]): LibraryIndex => ({ models: [], entries });

describe('savedGroups', () => {
  it('keeps the order cut, colour, beard, drops empty kinds and ids the library no longer has', () => {
    const groups = savedGroups(index([entry('b1', 'beard'), entry('c1', 'cut'), entry('l1', 'colour'), entry('x', 'cut')]), new Set(['b1', 'c1', 'gone']));
    expect(groups.map((g) => [g.kind, g.entries.map((e) => e.id)])).toEqual([['cut', ['c1']], ['beard', ['b1']]]);
  });
});

it('detailHref uses the Explore route name of each kind', () => {
  expect(detailHref('cut', 'a')).toBe('#/explore/style/a');
  expect(detailHref('colour', 'a')).toBe('#/explore/colour/a');
  expect(detailHref('beard', 'a')).toBe('#/explore/beard/a');
});

it('tilePictureKey takes the front view, else the first picture, else nothing', () => {
  const picture = { widthPx: 1, heightPx: 1, widths: [1], average: '#000000', bytes: 1 };
  expect(tilePictureKey({ 'm/a-side': picture, 'm/a-front': picture })).toBe('m/a-front');
  expect(tilePictureKey({ 'm/a-side': picture })).toBe('m/a-side');
  expect(tilePictureKey({})).toBeNull();
});
