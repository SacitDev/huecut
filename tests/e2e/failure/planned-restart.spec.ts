/**
 * The planned restart, in Chromium with real analysis: the worker is no longer restarted to free memory for an extra, and the extras
 * run on computers only instead, so phones and tablets show "Available on a computer" in place of every extra.
 */
import { expect, test } from '../guard.ts';
import { button, HIDDEN_HAIRLINE, needsAnalysis, toLines } from './support.ts';

for (const { width, height } of [{ width: 375, height: 812 }, { width: 768, height: 1024 }]) {
  test.describe(`at ${String(width)} px with touch`, () => {
    // `screen` too: the device class reads it, and the project's desktop device says 1920 x 1080.
    test.use({ viewport: { width, height }, screen: { width, height }, isMobile: true, hasTouch: true });

    test('every extra says "Available on a computer"', async ({ page }) => {
      await needsAnalysis(page);
      await toLines(page, HIDDEN_HAIRLINE);
      await expect(page.getByText('Available on a computer')).toHaveCount(2);
      await expect(button(page, 'See it in 3D')).toHaveCount(0);
      await expect(button(page, 'Refine my hair outline')).toHaveCount(0);
    });
  });
}
