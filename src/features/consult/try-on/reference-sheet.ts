/**
 * The numbered reference sheet of one final card: painted from the fictional library pictures through the shared painter, as a
 * JPEG with no metadata. It is made when the card shows, so a tap on Share reaches the share sheet while it still counts as the person's
 * gesture, once per plan: the finished file outlives the panel, which unmounts with its tab.
 */
import { idsOfLook, lookOf } from '../../../domain/ids.ts';
import { useEffect, useState } from 'react';
import type { LibraryIndex } from '../../../domain/content/output.ts';
import type { CardPlan } from '../../../domain/prompts/build.ts';
import { buildReferenceSheet } from '../../../domain/render-model/board.ts';
import { asFile, exportFileName } from '../../../platform/files.ts';
import { referenceSheetItems } from '../../../platform/render/export.ts';
import { libraryPictures, painted } from './paint-pictures.ts';

/** The look's picture on the sheet: a cut's own, also for a cut with a colour, whose colour comes from its name. */
const referenceId = (id: string): string => idsOfLook(lookOf(id))[0];

/** `null` while it is being made; `failed` when this browser cannot make it. */
export type Sheet = File | 'failed' | null;

/** Finished sheets by plan: library pictures only, nothing of the person's. A megabyte or two each, so the oldest goes once there are more than a person is still choosing between. */
const finished = new Map<string, File>();
const MOST_KEPT = 8;

function keep(key: string, file: File): void {
  finished.set(key, file);
  for (const old of finished.keys()) if (finished.size > MOST_KEPT) finished.delete(old);
}

export function useReferenceSheet(plan: CardPlan, pictureOf: (id: string) => string | null, library: LibraryIndex): Sheet {
  const key = plan.ideas.map((look) => look.id).join('|');
  const [state, setState] = useState<{ readonly key: string; readonly sheet: Sheet } | null>(null);
  useEffect(() => {
    if (finished.has(key)) return;
    // Each paint is its own generation: leaving the tab or changing the plan makes it stale, and it stops at its next picture.
    const paint = new AbortController();
    const sheet = buildReferenceSheet(plan.ideas.map((look) => ({ name: look.name, picture: pictureOf(referenceId(look.id)) })));
    // A sheet with blank frames would mislead the chat, so it is refused rather than handed over.
    painted(referenceSheetItems(sheet), sheet.export, libraryPictures(library), true, paint.signal).then(
      (blob) => {
        const file = asFile(blob, exportFileName('reference-sheet', sheet.export.mime, new Date()));
        keep(key, file);
        if (!paint.signal.aborted) setState({ key, sheet: file });
      },
      () => { if (!paint.signal.aborted) setState({ key, sheet: 'failed' }); },
    );
    return () => {
      paint.abort();
    };
    // The looks' ids say all that the sheet shows; a new `plan` object with the same ids paints nothing again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, library]);
  return finished.get(key) ?? (state?.key === key ? state.sheet : null);
}
