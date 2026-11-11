/**
 * A very large portrait, in Chromium with real analysis: a 6048 x 8064 portrait made from a fictional fixture. The analysis image is
 * 1050 x 1400 and the round-trip copy 1152 x 1536, read back from what a kept session really stored; one face.
 */
import sharp from 'sharp';
import { expect, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, button, drawing, FACE, needsAnalysis, openPhoto } from './support.ts';

test('a 6048 x 8064 portrait: analysed at 1050 x 1400, copied at 1152 x 1536, face found', async ({ page }) => {
  await needsAnalysis(page);
  const buffer = await sharp(FACE).resize(6048, 8064, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
  expect(await sharp(buffer).metadata()).toMatchObject({ width: 6048, height: 8064 });
  await openPhoto(page);
  await addPhotos(page, { name: 'large-portrait.jpg', mimeType: 'image/jpeg', buffer });
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });

  // Saved by default, written again once the analysis is in.
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).some((d) => d.name === 'huecut') && new Promise<boolean>((resolve) => {
    const open = indexedDB.open('huecut', 1);
    open.onsuccess = () => {
      const get = open.result.transaction('session').objectStore('session').get('current');
      get.onsuccess = () => { open.result.close(); resolve(((get.result as { data: { photo: { observation: unknown } | null } } | undefined)?.data.photo?.observation ?? null) !== null); };
    };
  })), { timeout: 30_000 }).toBe(true);
  const stored = await page.evaluate(() => new Promise<{ image: unknown; faces: number; copy: number[] }>((resolve, reject) => {
    const open = indexedDB.open('huecut', 1);
    open.onerror = () => { reject(open.error ?? new Error('open failed')); };
    open.onsuccess = () => {
      const get = open.result.transaction('session').objectStore('session').get('current');
      get.onsuccess = async () => {
        const record = get.result as { data: { photo: { observation: { image: unknown; faces: unknown[] } } }; photo: Blob };
        const bitmap = await createImageBitmap(record.photo);
        open.result.close();
        resolve({ image: record.data.photo.observation.image, faces: record.data.photo.observation.faces.length, copy: [bitmap.width, bitmap.height] });
      };
    };
  }));
  expect(stored.image).toEqual({ widthPx: 1050, heightPx: 1400 });
  expect(stored.faces).toBe(1);
  expect(stored.copy).toEqual([1152, 1536]);
});
