/**
 * The ideas' details records (prompt specs, stylist sheets), loaded through the content loader once per set of ids. The
 * prompts and sheets are built only from complete details, so a missing record is an error, never a silent gap.
 */
import { useEffect, useState } from 'react';
import type { Detail } from '../../../domain/content/output.ts';
import { content, type ContentError } from '../../../platform/content.ts';
import type { DetailsOf } from '../useConsult.ts';

export type Details =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly of: DetailsOf }
  | { readonly status: 'error'; readonly error: ContentError; readonly retry: () => void };

/** Loads every id's details; `ids` is compared by value, so a new array with the same ids loads nothing again. */
export function useDetails(ids: readonly string[]): Details {
  const key = ids.join('|');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ readonly key: string; readonly details: Details }>({
    key: '',
    details: { status: 'loading' },
  });
  useEffect(() => {
    let live = true;
    const wanted = key === '' ? [] : key.split('|');
    void Promise.all(wanted.map((id) => content.detail(id))).then((loaded) => {
      if (!live) return;
      const failed = loaded.find((r) => !r.ok);
      const error = failed?.error ?? null;
      const retry = () => {
        setAttempt((n) => n + 1);
      };
      if (error !== null) {
        setState({ key, details: { status: 'error', error, retry } });
        return;
      }
      const map = new Map<string, Detail>(loaded.flatMap((r) => (r.ok ? [[r.value.id, r.value] as const] : [])));
      setState({ key, details: { status: 'ready', of: (id) => map.get(id) } });
    });
    return () => {
      live = false;
    };
  }, [key, attempt]);
  return state.key === key ? state.details : { status: 'loading' };
}
