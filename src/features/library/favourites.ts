/**
 * Favourites: the ids of saved styles, colour looks and beards, kept in localStorage as
 * `huecut:favourites` (a JSON list; nothing personal). When storage is blocked or full, saving still works for this
 * visit in memory. Other tabs' changes arrive through the `storage` event.
 */
import { useSyncExternalStore } from 'react';
import { readKey, writeKey } from '../../platform/storage.ts';

const NAME = 'favourites';
/** Content ids are kebab-case; anything else in storage is ignored. */
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The stored list, cleaned: unknown shapes and odd entries are dropped, duplicates removed. */
export function parseFavourites(raw: string | null): ReadonlySet<string> {
  if (raw === null) return new Set();
  try {
    const value: unknown = JSON.parse(raw);
    return new Set(Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string' && ID.test(x)) : []);
  } catch {
    return new Set();
  }
}

let saved: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

/** The same Set until something changes, as `useSyncExternalStore` needs. */
function snapshot(): ReadonlySet<string> {
  saved ??= parseFavourites(readKey(NAME));
  return saved;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== `huecut:${NAME}`) return;
  saved = parseFavourites(readKey(NAME));
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

/** Saves or unsaves `id` and returns whether it is saved now; the in-memory list changes even if storage refuses. */
export function toggleFavourite(id: string): boolean {
  const next = new Set(snapshot());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  saved = next;
  writeKey(NAME, JSON.stringify([...next]));
  emit();
  return next.has(id);
}

/** The saved ids; the component re-renders when they change, here or in another tab. */
export function useFavourites(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, snapshot);
}
