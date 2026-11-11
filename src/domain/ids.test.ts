/** The one pairing representation: a look as one string and back, and the slot key built from it. */
import { expect, it } from 'vitest';
import { asItemId, asPhotoId, idsOfLook, lookId, lookOf, slotKey } from './ids.ts';

const [cut, colour] = [asItemId('long-layers'), asItemId('copper-balayage')];

it('a look goes to one string and back: an item stays itself, a pairing is cut+colour', () => {
  expect(lookId(cut)).toBe('long-layers');
  expect(lookId([cut, colour])).toBe('long-layers+copper-balayage');
  expect(lookOf('long-layers')).toBe(cut);
  expect(lookOf('long-layers+copper-balayage')).toEqual([cut, colour]);
  expect(lookOf(lookId([cut, colour]))).toEqual([cut, colour]);
});

it('a slot key is the look on a photo; the ids of a look are the item, or the cut then the colour', () => {
  expect(slotKey(cut, asPhotoId('p1'))).toBe('long-layers@p1');
  expect(slotKey([cut, colour], asPhotoId('p1'))).toBe('long-layers+copper-balayage@p1');
  expect(idsOfLook(cut)).toEqual([cut]);
  expect(idsOfLook([cut, colour])).toEqual([cut, colour]);
});
