/** The person the 3D view cuts out: everything but the background that is joined to the face. */
import { describe, expect, it } from 'vitest';
import { SEGMENT, type CategoryMask } from '../domain/measure/mask.ts';
import { foregroundAt } from './service-extras.ts';

const { background: _, faceSkin: F, clothes: C } = SEGMENT;
const mask = (rows: readonly (readonly number[])[]): CategoryMask => ({ widthPx: rows[0]?.length ?? 0, heightPx: rows.length, data: Uint8Array.from(rows.flat()) });

describe('foregroundAt', () => {
  it('keeps what is joined to the face and drops the rest of the photo', () => {
    const out = foregroundAt(mask([[F, C, _, C], [C, C, _, C]]), 4, 2);
    expect(Array.from(out)).toEqual([255, 255, 0, 0, 255, 255, 0, 0]);
  });

  it('takes the part with the most face when something else has a patch of it', () => {
    const out = foregroundAt(mask([[F, F, _, F], [C, C, _, C]]), 4, 2);
    expect(Array.from(out)).toEqual([255, 255, 0, 0, 255, 255, 0, 0]);
  });

  it('keeps everything when there is no face to go by', () => {
    const out = foregroundAt(mask([[C, _, C]]), 3, 1);
    expect(Array.from(out)).toEqual([255, 0, 255]);
  });
});
