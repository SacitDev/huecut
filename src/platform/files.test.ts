/**
 * File helper tests: export names, object URLs revoked once, and a download whose URL lives
 * until after the browser has read it.
 */
import { expect, it, vi } from 'vitest';
import { asFile, DOWNLOAD_URL_LIFETIME_MS, downloadBlob, exportFileName, objectUrl } from './files.ts';

it('names exports by kind, local date and type', () => {
  expect(exportFileName('face-card', 'image/jpeg', new Date(2026, 10, 8))).toBe('huecut-face-card-2026-11-08.jpg');
  expect(exportFileName('face-lines', 'image/png', new Date(2027, 0, 3, 23, 59))).toBe('huecut-face-lines-2027-01-03.png');
  expect(exportFileName('board', 'image/jpeg', new Date(2026, 11, 31))).toBe('huecut-board-2026-12-31.jpg');
});

it('revokes an object URL once, however often revoke is called', () => {
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const link = objectUrl(new Blob(['x'], { type: 'text/plain' }));
  expect(link.url).toMatch(/^blob:/);
  link.revoke();
  link.revoke();
  expect(revoke).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledWith(link.url);
});

it('downloads through a hidden link it removes at once, and revokes the URL only after its lifetime', () => {
  vi.useFakeTimers();
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const anchor = { href: '', download: '', hidden: false, click: vi.fn(), remove: vi.fn() };
  const append = vi.fn();
  const doc = { createElement: () => anchor, body: { append } } as unknown as Document;
  downloadBlob(new Blob(['x'], { type: 'image/png' }), 'huecut-face-lines-2026-11-08.png', doc);
  expect(append).toHaveBeenCalledWith(anchor);
  expect(anchor).toMatchObject({ download: 'huecut-face-lines-2026-11-08.png', hidden: true });
  expect(anchor.href).toMatch(/^blob:/);
  expect(anchor.click).toHaveBeenCalledTimes(1);
  expect(anchor.remove).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(DOWNLOAD_URL_LIFETIME_MS - 1);
  expect(revoke).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(revoke).toHaveBeenCalledWith(anchor.href);
  vi.useRealTimers();
});

it('names the file for the share sheet and keeps its type', () => {
  const file = asFile(new Blob(['x'], { type: 'image/jpeg' }), 'huecut-board-2026-11-08.jpg');
  expect(file.name).toBe('huecut-board-2026-11-08.jpg');
  expect(file.type).toBe('image/jpeg');
});
