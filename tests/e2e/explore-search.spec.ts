/**
 * Explore's search on the shipped library, because fixtures hide what the real names do: the words people really use find
 * the looks by name and alias, and on the full-length page typing does not move the field under the person's fingers.
 */
import { expect, test } from './guard.ts';
import { APP_URL } from './server.ts';

/** Ids stay when a look is renamed; other looks may join these results, so each asks only that its look is there. */
const SEARCHES = [
  ['hush', 'hush-midi'],
  ['korean hush', 'hush-midi'],
  ['see-through', 'wispy-brow-fringe-long'],
  ['curtain bangs', 'curtain-fringe-lob'],
  ['curtain bangs', 'long-curtain-layers'],
] as const;

test.describe('Search on the shipped library', () => {
  test.use({ serviceWorkers: 'block' });

  for (const [words, id] of SEARCHES) {
    test(`"${words}" finds ${id}, by name or alias`, async ({ page }) => {
      await page.goto(`${APP_URL}#/explore`);
      await page.getByRole('searchbox', { name: 'Search by name' }).pressSequentially(words);
      const results = page.locator('a[aria-labelledby]');
      await expect(results.and(page.locator(`[href*="/explore/style/${id}?"]`))).toBeVisible();
      expect(await results.count(), 'it narrows the 200 or so styles to a few').toBeLessThan(12);
    });
  }

  for (const [width, height] of [[375, 812], [768, 1024]] as const) {
    test.describe(`${String(width)} wide, field at the top of the screen`, () => {
      test.use({ viewport: { width, height } });

      test('typing does not move the field when the page gets short, or when nothing is found', async ({ page }) => {
        await page.goto(`${APP_URL}#/explore`);
        const input = page.getByRole('searchbox', { name: 'Search by name' });
        const results = page.locator('a[aria-labelledby]');
        await expect(results.first()).toBeVisible();
        await input.evaluate((e) => { e.scrollIntoView({ block: 'start' }); });
        const before = await input.boundingBox();
        expect(await page.evaluate(() => window.scrollY), 'the page really is scrolled').toBeGreaterThan(0);
        await input.pressSequentially('rapunzel');
        await expect(results).toHaveCount(1);
        expect((await input.boundingBox())?.y, 'one result').toBe(before?.y);
        await input.pressSequentially('zzz');
        await expect(results).toHaveCount(0);
        expect((await input.boundingBox())?.y, 'no results').toBe(before?.y);
      });
    });
  }
});
