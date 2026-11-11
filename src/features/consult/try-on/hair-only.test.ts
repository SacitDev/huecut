/** The hair-only cache: one result per AI picture and outline of the photo; a refined outline makes it again; a failure is tried again. */
import { beforeEach, expect, it, vi } from 'vitest';
import { asPhotoId, type PictureId } from '../../../domain/ids.ts';
import * as resources from '../../../platform/resources.ts';
import { hairOnlyFor, hairOnlyMade, type HairOnlyTool } from './hair-only.ts';

const PHOTO = asPhotoId('photo-1');

beforeEach(async () => {
  resources.disposeAll();
  await resources.addPhoto(new Blob(['photo']), 'photo', PHOTO);
});

/** An AI picture in the store, with its Blob. */
function aiPicture(): { readonly id: PictureId; readonly blob: Blob } {
  const blob = new Blob(['an AI picture']);
  return { id: resources.addPicture(blob), blob };
}

it('is made once per outline: a refined outline makes it again, and the board never gets the old one', async () => {
  const [first, second] = [new Blob(['first']), new Blob(['second'])];
  const tool = vi.fn<HairOnlyTool>().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const picture = aiPicture();
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe(first);
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe(first);
  expect(tool).toHaveBeenCalledTimes(1);
  resources.setMask(PHOTO, { widthPx: 1, heightPx: 1, data: new Uint8Array(1) });
  await expect(hairOnlyMade(picture.blob), 'stale after the refinement').resolves.toBeNull();
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe(second);
  await expect(hairOnlyMade(picture.blob)).resolves.toBe(second);
});

it('a failed attempt is not kept: the next one tries again', async () => {
  const made = new Blob(['made']);
  const tool = vi.fn<HairOnlyTool>().mockResolvedValueOnce('failed').mockRejectedValueOnce(new Error('worker restarted')).mockResolvedValueOnce(made);
  const picture = aiPicture();
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe('failed');
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe('failed');
  await expect(hairOnlyFor(tool, PHOTO, picture.id)).resolves.toBe(made);
  expect(tool).toHaveBeenCalledTimes(3);
});
