/**
 * The details records the Ideas screen needs (stylist sheets, the pair's sheet, the second opinion), loaded through
 * `platform/content.ts`, which caches them; a record that failed is asked for again when the ids change.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Detail } from '../../../domain/content/output.ts';
import { content } from '../../../platform/content.ts';
import type { DetailsOf } from '../useConsult.ts';

export interface Details {
  readonly of: DetailsOf;
  /** The record could not be loaded (offline on a first visit, or a missing file). */
  readonly failed: (id: string) => boolean;
  /** Every id asked for has an answer, loaded or failed. */
  readonly settled: boolean;
}

/** Loads the details of `ids`; the result changes identity only when a record arrives. */
export function useDetails(ids: readonly string[]): Details {
  const [loaded, setLoaded] = useState<ReadonlyMap<string, Detail | null>>(() => new Map());
  const key = [...new Set(ids)].sort().join(' ');
  useEffect(() => {
    let live = true;
    for (const id of key === '' ? [] : key.split(' ')) {
      void content.detail(id).then((r) => {
        const value = r.ok ? r.value : null;
        if (live) setLoaded((m) => (m.has(id) && m.get(id) === value ? m : new Map(m).set(id, value)));
      });
    }
    return () => {
      live = false;
    };
  }, [key]);
  return useMemo(
    () => ({
      of: (id: string) => loaded.get(id) ?? undefined,
      failed: (id: string) => loaded.get(id) === null,
      settled: key === '' || key.split(' ').every((id) => loaded.has(id)),
    }),
    [loaded, key],
  );
}
