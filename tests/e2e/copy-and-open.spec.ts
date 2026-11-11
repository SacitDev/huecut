/**
 * "Copy and open ChatGPT / Gemini" on every prompt, on a phone: each kind of prompt, each app once: the
 * click puts the same prompt as its Copy button on the clipboard and opens the app's start page in a new tab, with nothing of the prompt
 * or the answers in the URL. The other site is never reached: the tab's request is answered here by a stub, so nothing leaves the machine.
 */
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { answersToQuestions, button, heading, PHONE } from './failure/support.ts';
import { expect, test } from './guard.ts';
import { open, prefs, tab, toTryOn } from './real-content-support.ts';
import { APP_URL, PREVIEW_ORIGIN } from './server.ts';

const APPS = [
  ['Copy and open ChatGPT', 'https://chatgpt.com/'],
  ['Copy and open Gemini', 'https://gemini.google.com/'],
] as const;

test.use(PHONE);

/** Records every text the page puts on the clipboard (in both engines; only Chromium lets a test read the clipboard back). */
async function recordCopies(page: Page, context: BrowserContext, browserName: string): Promise<void> {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: PREVIEW_ORIGIN });
  await context.route(/^https:\/\/(chatgpt\.com|gemini\.google\.com)\//u, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>start page</title>' }));
  await page.addInitScript(() => {
    const w = window as unknown as { copied: string[] };
    w.copied = [];
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => { w.copied.push(text); await write(text); };
  });
}
const copies = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { copied: string[] }).copied);

/** The prompt the Copy button in `scope` puts on the clipboard. */
async function copiedBy(page: Page, copy: Locator): Promise<string> {
  const before = (await copies(page)).length;
  await copy.click();
  await expect.poll(async () => (await copies(page)).length).toBe(before + 1);
  return (await copies(page)).at(-1) ?? '';
}

/** Each app's link in `scope`, once each: the same prompt on the clipboard, and a new tab on the app's start page only. */
async function expectCopyAndOpen(page: Page, scope: Locator, prompt: string, browserName: string): Promise<void> {
  expect(prompt.length, 'a real prompt').toBeGreaterThan(100);
  for (const [name, url] of APPS) {
    const link = scope.getByRole('link', { name: `${name} (opens in a new tab)`, exact: true });
    await expect(link, `one ${name} for this prompt`).toHaveCount(1);
    const before = (await copies(page)).length;
    const [opened] = await Promise.all([page.context().waitForEvent('page'), link.click()]);
    await opened.waitForLoadState('domcontentloaded');
    expect(opened.url(), `${name}: the start page, with nothing of the prompt in it`).toBe(url);
    await opened.close();
    await expect.poll(async () => (await copies(page)).length, `${name} copies once`).toBe(before + 1);
    expect((await copies(page)).at(-1), `${name} copies the prompt`).toBe(prompt);
    // Read back from the system clipboard, which may turn line ends into CRLF.
    if (browserName === 'chromium') expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(prompt.replaceAll('\r\n', '\n'));
  }
}

/** The first look of One by one, by its name, so it stays the same section once its button says "Prompt copied". */
async function firstLook(page: Page): Promise<Locator> {
  const name = await page.getByRole('button', { name: '1 Copy prompt' }).first().locator('xpath=ancestor::section[1]').getByRole('heading').first().textContent();
  return section(page, name ?? '');
}
/** The innermost section headed `title`. */
const section = (page: Page, title: string): Locator => page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).last();

test('the AI pick, the card prompt and a look, with a photo', async ({ page, context, browserName }) => {
  await recordCopies(page, context, browserName);
  await open(page, { prefs: prefs('cut', 4) });
  const pick = button(page, 'Let ChatGPT or Gemini pick your best 3');
  await expect(pick).not.toHaveAttribute('aria-busy', 'true', { timeout: 30_000 });
  await expectCopyAndOpen(page, page.locator('main'), await copiedBy(page, pick), browserName);
  await toTryOn(page);
  const card = section(page, 'Your card');
  await expectCopyAndOpen(page, card, await copiedBy(page, card.getByRole('button', { name: '1 Copy prompt' })), browserName);
  await tab(page, 'One by one');
  const look = await firstLook(page);
  await expect(look.getByRole('button', { name: '2 Share photo' }), 'the share step stays beside the links').toBeVisible();
  await expectCopyAndOpen(page, look, await copiedBy(page, look.getByRole('button', { name: '1 Copy prompt' })), browserName);
});

test('a look with no photo to hand over', async ({ page, context, browserName }) => {
  await recordCopies(page, context, browserName);
  await answersToQuestions(page, 'Cut');
  await button(page, 'Skip to my ideas').click();
  await expect(heading(page)).toHaveText('Your ideas');
  await toTryOn(page);
  await tab(page, 'One by one');
  const look = await firstLook(page);
  await expectCopyAndOpen(page, look, await copiedBy(page, look.getByRole('button', { name: '1 Copy prompt' })), browserName);
});

test('the prompt that explains the face card', async ({ page, context, browserName }) => {
  await recordCopies(page, context, browserName);
  await page.goto(`${APP_URL}#/my-look/face?source=example`);
  await expect(heading(page)).toHaveText('Your face card');
  const explain = button(page, 'Copy a prompt to explain my face card');
  await expectCopyAndOpen(page, page.locator('main'), await copiedBy(page, explain), browserName);
});
