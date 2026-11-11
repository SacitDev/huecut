/**
 * Clipboard tests: a code for each outcome, so a refused or missing clipboard shows the text selected
 * with "Select all" instead.
 */
import { expect, it, vi } from 'vitest';
import { copyText } from './clipboard.ts';

it('copies the text when the clipboard takes it', async () => {
  const writeText = vi.fn(() => Promise.resolve());
  expect(await copyText('Show me long layers', { writeText })).toBe('copied');
  expect(writeText).toHaveBeenCalledWith('Show me long layers');
});

it('says refused when the browser rejects the write', async () => {
  const writeText = vi.fn(() => Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError')));
  expect(await copyText('Show me long layers', { writeText })).toBe('refused');
});

it('says unavailable where the page has no clipboard (an insecure context)', async () => {
  vi.stubGlobal('navigator', {});
  try {
    expect(await copyText('Show me long layers')).toBe('unavailable');
  } finally {
    vi.unstubAllGlobals();
  }
});
