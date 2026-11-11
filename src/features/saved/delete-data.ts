/**
 * "Delete my data": every `huecut:*` key but a "Don't save" choice, the `huecut` database, every `huecut*` cache
 * and this app's service worker, and nothing else: other sites share this origin, so their storage is left alone. The time of the delete stays.
 */
import { markDeleted, SAVING_KEY } from '../../platform/storage.ts';

const KEY_PREFIX = 'huecut:';
const CACHE_PREFIX = 'huecut';
const DATABASE = 'huecut';

/**
 * Removes the `huecut:*` keys of one storage area; a key of another site stays. A "Don't save" choice stays too: it is nothing personal, and without it
 * the next session would be saved by surprise.
 */
export function clearKeys(area: Pick<Storage, 'length' | 'key' | 'getItem' | 'removeItem'>): void {
  const names = Array.from({ length: area.length }, (_, i) => area.key(i));
  for (const name of names) if (name?.startsWith(KEY_PREFIX) && !(name === SAVING_KEY && area.getItem(name) === 'off')) area.removeItem(name);
}

function clearStorage(): void {
  try {
    clearKeys(localStorage);
    clearKeys(sessionStorage);
  } catch {
    // Storage is blocked (private mode), so it holds nothing of ours either.
  }
}

/** Rejects when another tab keeps the database open: the delete then waits for it and is not done yet, so it is never said to be. */
function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB delete failed'));
    };
    request.onblocked = () => {
      reject(new Error('IndexedDB delete blocked by another tab'));
    };
  });
}

async function deleteCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)));
}

/** Without the service worker the next visit starts clean; the registration is this app's scope, not the origin's. */
async function unregisterWorker(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
  await registration?.unregister();
}

/**
 * Deletes everything; true when every part succeeded. The same-tab favourites list hears the change through the
 * `storage` event that another tab's clear would send, because a tab gets no such event for its own changes.
 */
export async function deleteMyData(): Promise<boolean> {
  clearStorage();
  // Before the database goes: a first write begun earlier in another tab finds it and stores nothing.
  markDeleted();
  const results = await Promise.allSettled([deleteDatabase(), deleteCaches(), unregisterWorker()]);
  // Last, so what reads the database on hearing this finds it gone.
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
  return results.every((r) => r.status === 'fulfilled');
}
