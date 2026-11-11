/**
 * "Delete my data" removes this app's keys only (other sites share the origin), keeps a "Don't save" choice, leaves the time of the delete for a
 * first write in another tab to check, and never says "deleted" while another tab holds the database open.
 */
import { expect, it, vi } from 'vitest';
import { clearKeys, deleteMyData } from './delete-data.ts';

function area(entries: readonly (readonly [string, string])[]) {
  const held = new Map(entries);
  return {
    held,
    get length() {
      return held.size;
    },
    key: (i: number) => [...held.keys()][i] ?? null,
    getItem: (name: string) => held.get(name) ?? null,
    setItem: (name: string, value: string) => {
      held.set(name, value);
    },
    removeItem: (name: string) => {
      held.delete(name);
    },
  };
}

it('clearKeys removes every huecut: key and nothing else', () => {
  const store = area([['huecut:favourites', '[]'], ['other-site:x', '1'], ['huecut:theme', 'dark'], ['huecutx', '1'], ['huecut:motion', 'reduce'], ['huecut:saving', 'day']]);
  clearKeys(store);
  expect([...store.held.keys()]).toEqual(['other-site:x', 'huecutx']);
});

it("clearKeys keeps a Don't save choice, so the next session is not saved by surprise", () => {
  const store = area([['huecut:favourites', '[]'], ['huecut:saving', 'off']]);
  clearKeys(store);
  expect([...store.held]).toEqual([['huecut:saving', 'off']]);
});

/** The browser around `deleteMyData`; `deleted` is how its database delete ends. */
function browser(deleted: 'success' | 'blocked') {
  const local = area([['huecut:favourites', '[]'], ['huecut:saving', 'day']]);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('sessionStorage', area([]));
  vi.stubGlobal('indexedDB', {
    deleteDatabase: () => {
      const request: { onsuccess?: () => void; onblocked?: () => void } = {};
      setTimeout(() => {
        if (deleted === 'success') request.onsuccess?.();
        else request.onblocked?.();
      });
      return request;
    },
  });
  vi.stubGlobal('caches', { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) });
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => Promise.resolve(undefined) } });
  vi.stubGlobal('window', { dispatchEvent: () => true });
  vi.stubGlobal('StorageEvent', class { readonly key = null; });
  return local;
}

it('a database delete that another tab blocks is reported as partial, never as deleted', async () => {
  browser('blocked');
  await expect(deleteMyData()).resolves.toBe(false);
});

it('leaves the time of the delete, which a first write begun earlier in another tab checks', async () => {
  const before = Date.now();
  const local = browser('success');
  await expect(deleteMyData()).resolves.toBe(true);
  expect(Number(local.held.get('huecut:deleted-at'))).toBeGreaterThanOrEqual(before);
  expect(local.held.has('huecut:favourites')).toBe(false);
});
