/** The in-app browser notice uses the one user-agent rule the platform layer tests. */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { InAppBrowserNotice } from './InAppBrowser.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

const noticeFor = (userAgent: string): string => {
  vi.stubGlobal('navigator', { userAgent });
  vi.stubGlobal('window', { location: { href: 'https://example.test/huecut/' } });
  return renderToStaticMarkup(createElement(InAppBrowserNotice));
};

it('shows the notice for every in-app browser the platform rule knows, Twitter and WeChat included', () => {
  expect(noticeFor('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Twitter for iPhone')).not.toBe('');
  expect(noticeFor('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 MicroMessenger/8.0.50')).not.toBe('');
  expect(noticeFor('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36')).toBe('');
});
