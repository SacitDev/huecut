/**
 * A late dye reaction, in Chromium and WebKit at 375 and 1280 px (no analysis needed): a dye reaction answered after the ideas were
 * chosen and a pair was made. The referral removes every colour idea, refuses the pair's colour half and every colour prompt.
 */
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../guard.ts';
import { answersToQuestions, button, heading, PHONE } from './support.ts';

/** The referral's own sentence in the shipped content (content/rules/reminders.json). */
const REFERRAL = 'You told us hair dye or black henna has made your skin react before. Please ask a doctor or allergy clinic before you colour your hair. Do not test hair colour on your skin yourself.';
const COLOURIST = 'Best done by a colourist';
const DYE_QUESTION = 'Has hair dye or a black henna tattoo ever made your skin react? And is your scalp sore now?';

const section = (page: Page, name: 'Cuts' | 'Colours'): Locator => page.locator('section', { has: page.getByRole('heading', { level: 2, name, exact: true }) });
const cardNames = (list: Locator): Promise<string[]> => list.locator('article h3').allTextContents();

/** A pair of the first cut and the first colour look; returns its title. */
async function makePair(page: Page, cut: string, colour: string): Promise<string> {
  await button(page, 'Pair a cut with a colour').click();
  const sheet = page.getByRole('dialog', { name: 'Pair a cut with a colour' });
  await expect(sheet).toBeVisible();
  await sheet.getByText(cut, { exact: true }).click();
  await sheet.getByText(colour, { exact: true }).click();
  await button(sheet, 'Try these together').click();
  await expect(sheet).toBeHidden();
  return `Together: ${cut}, with ${colour}`;
}

/** The answer given late: back on the questions, on to the dye question (a core question), a mild reaction, and on to the ideas again. */
async function answerReaction(page: Page): Promise<void> {
  await page.goBack();
  await expect(heading(page)).toHaveText('A few questions');
  const question = page.getByRole('group', { name: DYE_QUESTION });
  // Up to the 14 questions of the Both set with the history unknown (the henna type and the bleach count are asked too).
  for (let i = 0; i < 14 && (await question.count()) === 0; i++) await button(page, 'Next question').click();
  // By keyboard, which stays on the question: a tap goes on by itself, and from the last question that is already the ideas.
  const answer = question.getByRole('radio', { name: 'Yes, a mild reaction' });
  await answer.focus();
  await page.keyboard.press('Space');
  await expect(answer).toBeChecked();
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
}

for (const device of [PHONE, { viewport: { width: 1280, height: 900 } }]) {
  test.describe(`at ${String(device.viewport.width)} px`, () => {
    test.use(device);

    test('the late answer replaces every colour idea, the pair and every colour prompt', async ({ page }) => {
      await answersToQuestions(page, 'Both');
      await button(page, 'Skip to my ideas').click();
      await expect(heading(page)).toHaveText('Your ideas');
      const [cuts, colours] = [await cardNames(section(page, 'Cuts')), await cardNames(section(page, 'Colours'))];
      expect(colours.length, 'colour ideas chosen before the answer').toBeGreaterThan(0);
      await expect(section(page, 'Colours').getByText(COLOURIST, { exact: true })).toHaveCount(0);
      const pairTitle = await makePair(page, cuts[0] ?? '', colours[0] ?? '');
      const pair = page.locator('section', { has: page.getByRole('heading', { level: 2, name: pairTitle }) });
      await expect(pair).toBeVisible();

      await button(page, 'Try them on').click();
      await expect(heading(page)).toHaveText('Try it on');
      await page.getByRole('tab', { name: 'One by one', exact: true }).click();
      await expect(page.getByRole('button', { name: /Copy prompt/u }).first()).toBeVisible();
      const promptsBefore = await page.getByRole('button', { name: /Copy prompt/u }).count();
      await page.goBack();
      await expect(heading(page)).toHaveText('Your ideas');

      await answerReaction(page);
      // A referral offers no colour idea at all (one gate for picks, pool and lent looks): the colour cards go, the
      // referral is said instead, and the pair the person made stays with its colour half refused.
      await expect(page.getByText(REFERRAL).first()).toBeVisible();
      await expect(section(page, 'Colours').locator('article')).toHaveCount(0);
      for (const name of colours) await expect(page.getByRole('heading', { level: 3, name, exact: true })).toHaveCount(0);
      await expect(page.getByText('Because…')).toHaveCount(0);
      await expect(page.getByText('Plausible', { exact: true })).toHaveCount(0);
      await expect(pair.getByText(`Colour: ${COLOURIST}`)).toBeVisible();

      await button(page, 'Try them on').click();
      await expect(heading(page)).toHaveText('Try it on');
      await expect(page.getByRole('tab', { name: 'One by one', exact: true }), 'the machine remembers the tab').toHaveAttribute('aria-selected', 'true');
      // Try it on says why and offers no colour: the pair has no prompt and no picture to add (it is not offered here at all
      // while its colour is refused), and the colour looks the referral removed are not offered either.
      await expect(page.getByText(REFERRAL).first()).toBeVisible();
      const pairHere = page.locator('section').filter({ has: page.getByRole('heading', { name: pairTitle, exact: true }) });
      await expect(pairHere.getByRole('button', { name: /Copy prompt/u })).toHaveCount(0);
      await expect(pairHere.locator('input[type=file]')).toHaveCount(0);
      for (const name of colours) await expect(page.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(0);
      const promptsAfter = await page.getByRole('button', { name: /Copy prompt/u }).count();
      expect(promptsAfter, 'colour prompts are gone, the cuts keep theirs').toBeLessThan(promptsBefore);
      expect(promptsAfter).toBeGreaterThan(0);
    });
  });
}
