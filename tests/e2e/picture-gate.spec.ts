/**
 * What comes in and what goes: an expired kept session is deleted whichever page the app opens on, and the
 * one gate for a picture turns a non-raster, oversized or mislabelled file away in words while a very large JPEG is read at a small scale,
 * and a photo stored sideways with an EXIF orientation is read upright. The files are made here from a fictional face and never stored.
 */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { SESSION_SCHEMA_VERSION } from '../../src/domain/session/session-data.ts';
import { addPhotos, ANALYSIS_TIMEOUT_MS, button, drawing, FACE, heading, needsAnalysis, openPhoto } from './failure/support.ts';
import { expect, requires, test } from './guard.ts';
import { APP_URL } from './server.ts';
import { open, prefs, tab, toTryOn } from './real-content-support.ts';

const HOUR_MS = 3_600_000;
const NOT_A_PHOTO = 'The app can only add photos saved as JPEG, PNG, WebP or HEIC.';
const PHOTO_TOO_LARGE = 'That photo is too large to open here, so add a smaller copy of it.';
const NOT_A_PICTURE = 'That file is not a picture. Choose a JPEG, PNG or WebP picture.';
const PICTURE_TOO_LARGE = 'That picture is too large to open here, so add a smaller copy of it.';
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" onload="window.__ran=1"><script>window.__ran=2</script><circle cx="400" cy="400" r="300"/></svg>');

const png192mp = (): Promise<Buffer> => sharp({ create: { width: 16000, height: 12000, channels: 3, background: '#808080' }, limitInputPixels: false }).png({ compressionLevel: 1, effort: 1 }).toBuffer();
const photoRows = (page: Page) => page.locator('fieldset li');

/** Writes a kept session with a photo, last saved `ageHours` ago, as session-sync would have, or null for just the count of records. */
const keptRecords = (page: Page, ageHours: number | null): Promise<number> =>
  page.evaluate(async ([age, hour, version]) => {
    const settle = <T,>(r: IDBRequest<T>) => new Promise<T>((done, no) => { r.onsuccess = () => { done(r.result); }; r.onerror = () => { no(r.error ?? new Error('IndexedDB')); }; });
    const request = indexedDB.open('huecut', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('session');
    const db = await settle(request);
    const store = () => db.transaction('session', 'readwrite').objectStore('session');
    if (age !== null) {
      // The current version, so only its age can make it go (an older version is deleted on sight).
      const data = { schemaVersion: version, savedAt: Date.now() - age * hour, source: 'answers_only', step: 'goal', furthest: 2, answers: {}, prefs: { goal: null, collections: [], count: 4 }, shortlist: { added: [], removed: [], order: [] }, pair: null, slots: {}, grids: [], photo: null };
      await settle(store().put({ data, photo: new Blob(['a fictional photo'], { type: 'image/jpeg' }), pictures: {} }, 'current'));
    }
    const count = await settle(store().count());
    db.close();
    return count;
  }, [ageHours, HOUR_MS, SESSION_SCHEMA_VERSION] as const);

interface Decode { readonly source: string; readonly type: string; readonly pixels: number }
/** Records every main-thread `createImageBitmap`: what it was given and the raster it made. */
async function watchDecodes(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: Decode[] = [];
    (window as unknown as { __decodes: Decode[] }).__decodes = seen;
    const real = window.createImageBitmap.bind(window) as (...args: unknown[]) => Promise<ImageBitmap>;
    window.createImageBitmap = async (...args: unknown[]) => {
      const bitmap = await real(...args);
      const source = args[0] as object;
      seen.push({ source: source.constructor.name, type: source instanceof Blob ? source.type : '', pixels: bitmap.width * bitmap.height });
      return bitmap;
    };
  });
}
const decodes = (page: Page): Promise<Decode[]> => page.evaluate(() => (window as unknown as { __decodes: Decode[] }).__decodes);

for (const [name, hash] of [['Explore', '#/explore'], ['Help', '#/help']] as const) {
  test(`a kept session past its 24 hours goes with its photo when the app opens at ${name}, and a younger one stays`, async ({ page }) => {
    await requires(page, 'idbBlob');
    await page.goto(`${APP_URL}${hash}`);
    await expect(heading(page)).toBeVisible();
    expect(await keptRecords(page, 2)).toBe(1);
    await page.reload();
    await expect(heading(page)).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(await keptRecords(page, null), 'younger than 24 hours').toBe(1);
    expect(await keptRecords(page, 25)).toBe(1);
    await page.reload();
    await expect(heading(page)).toBeVisible();
    await expect.poll(() => keptRecords(page, null), { message: 'older than 24 hours' }).toBe(0);
  });
}

test('an SVG under its own type or a photo name, a PDF and a HEIC name with no HEIF head are turned away in words, and nothing is parsed', async ({ page }) => {
  for (const file of [
    { name: 'drawing.svg', mimeType: 'image/svg+xml', buffer: SVG },
    { name: 'drawing.png', mimeType: 'image/png', buffer: SVG },
    { name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') },
    // A name alone never lets a file in; only a raster head with its size does.
    { name: 'IMG_0002.HEIC', mimeType: '', buffer: Buffer.from('not really a heic') },
  ]) {
    await openPhoto(page);
    await addPhotos(page, file);
    await expect(page.getByText(NOT_A_PHOTO), file.name).toBeVisible();
    await expect(photoRows(page), file.name).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __ran?: number }).__ran), file.name).toBeUndefined();
  }
});

/** Chooses one file declared exactly as `type`, the empty type too, which Playwright would fill in from the name; returns the type the page sees. */
const chooseExactly = (page: Page, name: string, type: string, buffer: Buffer): Promise<string> =>
  page.locator('input[type=file]').first().evaluate((input: HTMLInputElement, [n, t, b64]) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], n, { type: t }));
    input.files = transfer.files;
    // Read before the change: the app empties the input as it takes the files.
    const seen = input.files[0]?.type ?? 'no file';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return seen;
  }, [name, type, buffer.toString('base64')] as const);

test('the bytes alone let a photo in: JPEG bytes with no declared type, or as photo.bin with a generic one, come in', async ({ page }) => {
  await openPhoto(page);
  for (const [i, [name, type]] of ([['photo', ''], ['photo.bin', 'application/octet-stream']] as const).entries()) {
    expect(await chooseExactly(page, name, type, readFileSync(FACE)), name).toBe(type);
    await expect(photoRows(page), name).toHaveCount(i + 1);
  }
  await expect(page.getByText(NOT_A_PHOTO)).toHaveCount(0);
});

test('SVG, PDF and text bytes stay out under a photo name, no declared type or a generic one', async ({ page }) => {
  await openPhoto(page);
  for (const [bytes, name, type] of [[SVG, 'photo', ''], [SVG, 'photo.bin', 'application/octet-stream'], [Buffer.from('%PDF-1.4'), 'scan', ''], [Buffer.from('%PDF-1.4'), 'scan.jpg', 'image/jpeg'], [Buffer.from('plain words'), 'notes.jpg', 'image/jpeg'], [Buffer.from('plain words'), 'notes', '']] as const) {
    expect(await chooseExactly(page, name, type, bytes), name).toBe(type);
    await expect(page.getByText(NOT_A_PHOTO), `${name} (${type})`).toBeVisible();
    await expect(photoRows(page), `${name} (${type})`).toHaveCount(0);
  }
  expect(await page.evaluate(() => (window as unknown as { __ran?: number }).__ran)).toBeUndefined();
});

test('a real photo saved under another type (PNG bytes named .jpg, as messengers do) comes in: the bytes decide', async ({ page }) => {
  const png = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#a07060' } }).png().toBuffer();
  await openPhoto(page);
  await addPhotos(page, { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: png });
  await expect(photoRows(page)).toHaveCount(1);
  await expect(page.getByText(NOT_A_PHOTO)).toHaveCount(0);
});

test('a real HEIC that this browser cannot open, listed with no type as some browsers do, still comes in and gets its steps', async ({ page }) => {
  await needsAnalysis(page);
  await openPhoto(page);
  // A HEIC head as a phone writes it: `ftyp` with the `heic` brand, and the image size in an `ispe` box.
  const be32 = (n: number): Buffer => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const heic = Buffer.concat([be32(24), Buffer.from('ftypheic'), Buffer.alloc(12), be32(20), Buffer.from('ispe'), Buffer.alloc(4), be32(4032), be32(3024), Buffer.alloc(4000, 7)]);
  expect(await chooseExactly(page, 'IMG_0001.HEIC', '', heic)).toBe('');
  await expect(photoRows(page)).toHaveCount(1);
  await expect(page.getByText(NOT_A_PHOTO)).toHaveCount(0);
  await button(page, 'Continue').click();
  await expect(page.getByText('This browser could not open this photo.', { exact: false })).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
});

/** The small grey picture each rotation of the upright face makes: a thumbnail is upright when it is nearest to the first. */
const ROTATIONS = [0, 90, 180, 270] as const;
const tiny = async (picture: Buffer, angle: number): Promise<Buffer> => sharp(await sharp(picture).rotate(angle).toBuffer()).resize(24, 32, { fit: 'fill' }).greyscale().raw().toBuffer();
const distance = (a: Buffer, b: Buffer): number => a.reduce((sum, v, i) => sum + Math.abs(v - (b[i] ?? 0)), 0) / a.length;

test('phone photos stored sideways or upside down with EXIF orientation 3, 6 and 8 are read upright: face points found, upright thumbnails', async ({ page }) => {
  await needsAnalysis(page);
  const upright = await sharp(FACE).resize({ height: 2400 }).jpeg({ quality: 85 }).toBuffer();
  // The stored pixels for each tag, so that the tag turns them upright again; sharp's own reading of each file is checked first.
  const stored = { 3: 180, 6: -90, 8: 90 } as const;
  const files = await Promise.all(Object.entries(stored).map(async ([tag, angle]) => {
    const buffer = await sharp(await sharp(upright).rotate(angle).toBuffer()).withMetadata({ orientation: Number(tag) }).jpeg({ quality: 85 }).toBuffer();
    expect((await sharp(buffer).metadata()).orientation, `tag ${tag}`).toBe(Number(tag));
    expect(distance(await tiny(await sharp(buffer).rotate().toBuffer(), 0), await tiny(upright, 0)), `tag ${tag} as sharp shows it`).toBeLessThan(8);
    return { name: `orientation-${tag}.jpg`, mimeType: 'image/jpeg', buffer };
  }));
  const references = await Promise.all(ROTATIONS.map((angle) => tiny(upright, angle)));
  await openPhoto(page);
  await addPhotos(page, files);
  for (const { name } of files) {
    const row = photoRows(page).filter({ hasText: name });
    await expect(row, name).toContainText('Face points found', { timeout: ANALYSIS_TIMEOUT_MS });
    // Drawn as the page shows it (the CSP lets no fetch read a blob: URL).
    const shown = await row.locator('img').evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [img.naturalWidth, img.naturalHeight];
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    });
    const thumbnail = Buffer.from(shown.slice(shown.indexOf(',') + 1), 'base64');
    const near = await Promise.all(references.map(async (reference) => distance(await tiny(thumbnail, 0), reference)));
    const nearest = ROTATIONS[near.indexOf(Math.min(...near))];
    console.log(`${name}: thumbnail distance to each turn of the upright face ${JSON.stringify(Object.fromEntries(ROTATIONS.map((r, i) => [r, Math.round(near[i] ?? 0)])))}`);
    expect(nearest, `${name} shows the face upright`).toBe(0);
  }
});

test('a 192 MP PNG is refused from its header, in one sentence, with no decode', async ({ page }) => {
  await watchDecodes(page);
  await openPhoto(page);
  await addPhotos(page, { name: 'bomb.png', mimeType: 'image/png', buffer: await png192mp() });
  await expect(page.getByText(PHOTO_TOO_LARGE)).toBeVisible();
  await expect(photoRows(page)).toHaveCount(0);
  expect(await decodes(page)).toEqual([]);
});

test('a 200 MP JPEG is read at a small scale: no full raster on the main thread, analysed, shown bounded and kept at 1536 px', async ({ page }) => {
  await needsAnalysis(page);
  const buffer = await sharp(await sharp(FACE).resize(4080, 3060, { fit: 'contain', background: '#808080' }).toBuffer(), { limitInputPixels: false }).resize(16320, 12240, { kernel: 'nearest' }).jpeg({ quality: 70 }).toBuffer();
  expect(await sharp(buffer, { limitInputPixels: false }).metadata()).toMatchObject({ width: 16320, height: 12240 });
  await watchDecodes(page);
  await openPhoto(page);
  await addPhotos(page, { name: 'very-large.jpg', mimeType: 'image/jpeg', buffer });
  await expect(photoRows(page).locator('img')).toHaveCount(1, { timeout: 60_000 });
  await button(page, 'Continue').click();
  await expect(drawing(page)).toBeVisible({ timeout: ANALYSIS_TIMEOUT_MS });
  await button(page, 'Choose what to change').click();
  await expect(heading(page)).toHaveText('Your goal');
  const shown = page.locator('figure img').first();
  await expect(shown).toBeVisible();
  expect(await shown.evaluate((i) => Math.max((i as HTMLImageElement).naturalWidth, (i as HTMLImageElement).naturalHeight)), 'the preview on screen').toBe(1536);

  // Saved by default: the stored copy is there from the first write on.
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).some((d) => d.name === 'huecut') && new Promise<boolean>((resolve) => {
    const request = indexedDB.open('huecut', 1);
    request.onsuccess = () => {
      const get = request.result.transaction('session').objectStore('session').get('current');
      get.onsuccess = () => { request.result.close(); resolve((get.result as { photo: unknown } | undefined)?.photo instanceof Blob); };
    };
  })), { timeout: 30_000 }).toBe(true);
  const kept = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('huecut', 1);
    request.onerror = () => { reject(request.error ?? new Error('open failed')); };
    request.onsuccess = () => {
      const get = request.result.transaction('session').objectStore('session').get('current');
      get.onsuccess = async () => {
        const bitmap = await createImageBitmap((get.result as { photo: Blob }).photo);
        request.result.close();
        resolve(Math.max(bitmap.width, bitmap.height));
      };
    };
  }));
  expect(kept).toBe(1536);

  const made = (await decodes(page)).slice(0, -1); // the last one is this test's own, just above
  expect(made.length).toBeGreaterThan(0);
  expect(made.filter((d) => d.source === 'Blob'), 'the JPEG itself never went to a whole decode').toEqual([]);
  expect(Math.max(...made.map((d) => d.pixels)), 'the largest raster made').toBeLessThanOrEqual(2040 * 1530);
});

test('Try it on takes pictures through the same gate', async ({ page }) => {
  await open(page, { prefs: prefs('cut', 6) });
  await toTryOn(page);
  await tab(page, 'My pictures');
  const box = page.locator('input[type=file]').first();
  await box.setInputFiles({ name: 'drawing.svg', mimeType: 'image/svg+xml', buffer: SVG });
  await expect(page.getByText(NOT_A_PICTURE)).toBeVisible();
  await box.setInputFiles({ name: 'bomb.png', mimeType: 'image/png', buffer: await png192mp() });
  await expect(page.getByText(PICTURE_TOO_LARGE)).toBeVisible();
  await expect(page.getByRole('img', { name: /^Your AI picture for / })).toHaveCount(0);
  await box.setInputFiles(FACE);
  await expect(page.getByRole('img', { name: /^Your AI picture for / })).toHaveCount(1);
});
