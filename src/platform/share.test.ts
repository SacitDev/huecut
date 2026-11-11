/**
 * Saving tests: the share sheet when it can take the file, a download otherwise, nothing
 * when the person cancels, and a download when sharing fails for any other reason.
 */
import { expect, it, vi } from 'vitest';
import { saveFile, saveFiles, type ShareApi } from './share.ts';

const file = new File(['jpeg'], 'huecut-face-card-2026-11-08.jpg', { type: 'image/jpeg' });
const sharing = (share: ShareApi['share'], canShare = true) => ({ share: vi.fn(share), canShare: vi.fn(() => canShare) });

it('shares the file through the share sheet when canShare accepts it', async () => {
  const nav = sharing(() => Promise.resolve());
  const download = vi.fn();
  expect(await saveFile(file, 'My face card', nav, download)).toBe('shared');
  expect(nav.canShare).toHaveBeenCalledWith({ files: [file], title: 'My face card' });
  expect(nav.share).toHaveBeenCalledWith({ files: [file], title: 'My face card' });
  expect(download).not.toHaveBeenCalled();
});

it('downloads when files cannot be shared or there is no share sheet', async () => {
  const download = vi.fn();
  const refuses = sharing(() => Promise.resolve(), false);
  expect(await saveFile(file, 'My face card', refuses, download)).toBe('downloaded');
  expect(refuses.share).not.toHaveBeenCalled();
  expect(await saveFile(file, 'My face card', {}, download)).toBe('downloaded');
  expect(download).toHaveBeenCalledTimes(2);
  expect(download).toHaveBeenCalledWith(file, 'huecut-face-card-2026-11-08.jpg');
});

it('downloads nothing when the person cancels the share sheet', async () => {
  const download = vi.fn();
  const nav = sharing(() => Promise.reject(new DOMException('The share was cancelled', 'AbortError')));
  expect(await saveFile(file, 'My face card', nav, download)).toBe('cancelled');
  expect(download).not.toHaveBeenCalled();
});

it('downloads when sharing fails otherwise, for example once the tap\'s activation is spent', async () => {
  const download = vi.fn();
  const nav = sharing(() => Promise.reject(new DOMException('Must be handling a user gesture', 'NotAllowedError')));
  expect(await saveFile(file, 'My face card', nav, download)).toBe('downloaded');
  expect(download).toHaveBeenCalledWith(file, file.name);
});

it('shares several files in one go, and downloads each of them where they cannot be shared', async () => {
  const other = new File(['jpeg'], 'huecut-reference-sheet-2026-11-08.jpg', { type: 'image/jpeg' });
  const nav = sharing(() => Promise.resolve());
  const download = vi.fn();
  expect(await saveFiles([file, other], '', nav, download)).toBe('shared');
  expect(nav.share).toHaveBeenCalledWith({ files: [file, other], title: '' });
  expect(await saveFiles([file, other], '', {}, download)).toBe('downloaded');
  expect(download).toHaveBeenNthCalledWith(1, file, file.name);
  expect(download).toHaveBeenNthCalledWith(2, other, other.name);
});
