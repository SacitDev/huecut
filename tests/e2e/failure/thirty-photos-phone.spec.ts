/**
 * Thirty photos on a phone, in Chromium with real analysis, at 375 px with touch and a 4x CPU throttle: 30 photos with known blur
 * (made with sharp). The main photo counts inside the 15, the rest stay listed, and choosing a listed photo queues it.
 */
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { expect, requires, test } from '../guard.ts';
import { ANALYSIS_TIMEOUT_MS, addPhotos, FACE, openPhoto, PHONE, photoRow } from './support.ts';

const CLEAREST = 'We looked at your 15 clearest photos. The others stay here; make one your main photo to analyse it.';
const LISTED = 'Not analysed yet. Make it your main photo to analyse it.';
const PENDING = /^(Waiting to be analysed|Finding face points)$/;
const PERSONS = [FACE, FACE.replace('one-face-salon-straight-wavy', 'glasses'), FACE.replace('one-face-salon-straight-wavy', 'beard')];
/** Far apart, so that the 15 clearest are known by construction across the three people: 15 photos with a blur of at most 0.7 px, 15 of at least 9 px. */
const SHARP_SIGMAS = Array.from({ length: 15 }, (_, i) => i * 0.05);
const BLURRED_SIGMAS = Array.from({ length: 15 }, (_, i) => 9 + i * 0.35);

interface Shot { readonly name: string; readonly mimeType: string; readonly buffer: Buffer }

async function photo(kind: 'sharp' | 'blurred', i: number): Promise<Shot> {
  const sigma = (kind === 'sharp' ? SHARP_SIGMAS : BLURRED_SIGMAS)[i] ?? 0;
  const base = sharp(PERSONS[i % PERSONS.length]).resize({ height: 1400 });
  const buffer = await (sigma >= 0.3 ? base.blur(sigma) : base).jpeg({ quality: 85 }).toBuffer();
  return { name: `${kind}-${String(i).padStart(2, '0')}.jpg`, mimeType: 'image/jpeg', buffer };
}

const shots = (kind: 'sharp' | 'blurred'): Promise<Shot[]> => Promise.all(Array.from({ length: 15 }, (_, i) => photo(kind, i)));

/** What each file's row says, once nothing is waiting or being analysed. */
async function settledRows(page: Page, names: readonly string[]): Promise<Map<string, string>> {
  const read = async (): Promise<Map<string, string>> =>
    new Map(await Promise.all(names.map(async (n): Promise<[string, string]> => [n, await photoRow(page, n).locator('p').first().innerText()])));
  await expect.poll(async () => [...(await read()).values()].filter((t) => PENDING.test(t)).length, { timeout: ANALYSIS_TIMEOUT_MS, intervals: [500] }).toBe(0);
  return read();
}

const listed = (rows: Map<string, string>): string[] => [...rows].filter(([, t]) => t === LISTED).map(([n]) => n).sort();

test.describe('30 photos on a phone (375 px, touch, 4x CPU)', () => {
  test.use(PHONE);
  test.beforeEach(async ({ page }) => { await requires(page, 'workerWebGL', 'cdp'); });

  async function start(page: Page, files: readonly Shot[]): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await openPhoto(page);
    await addPhotos(page, [...files]);
    await expect(page.locator('fieldset li')).toHaveCount(30, { timeout: ANALYSIS_TIMEOUT_MS });
    await expect(page.getByText(CLEAREST)).toBeVisible();
  }

  test('a clear main photo: exactly the 15 least blurred are analysed, the others stay listed', async ({ page }) => {
    const [sharpShots, blurred] = [await shots('sharp'), await shots('blurred')];
    await start(page, [...sharpShots, ...blurred]);
    const rows = await settledRows(page, [...sharpShots, ...blurred].map((f) => f.name));
    expect(listed(rows), 'the 15 most blurred stay listed').toEqual(blurred.map((f) => f.name).sort());
  });

  test('a blurred main photo counts inside the 15 (the 14 clearest join it), and a listed photo chosen as main is analysed', async ({ page }) => {
    const [sharpShots, blurred] = [await shots('sharp'), await shots('blurred')];
    await start(page, [...blurred, ...sharpShots]);
    const names = [...blurred, ...sharpShots].map((f) => f.name);
    const rows = await settledRows(page, names);
    const listedNow = listed(rows);
    expect(listedNow, '30 photos, 15 analysed').toHaveLength(15);
    expect(listedNow, 'the blurred main photo was analysed').not.toContain(blurred[0]?.name);
    expect(listedNow.filter((n) => n.startsWith('sharp')), 'one clear photo gives way to the main photo').toHaveLength(1);

    const chosen = listedNow.find((n) => n.startsWith('blurred')) ?? '';
    await photoRow(page, chosen).getByRole('radio').check();
    await expect(photoRow(page, chosen).locator('p').first()).not.toHaveText(LISTED, { timeout: ANALYSIS_TIMEOUT_MS });
    const after = await settledRows(page, names);
    expect(listed(after), 'exactly the chosen photo left the list').toEqual(listedNow.filter((n) => n !== chosen));
  });
});
