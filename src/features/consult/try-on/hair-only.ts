/**
 * The hair-only version of an AI colour picture: the person's photo with the AI picture's hair colour
 * moved onto their own hair, by the port's `hairOnly`. Results are kept per AI picture and outline of the photo.
 */
import { useEffect, useState } from 'react';
import type { PhotoId, PictureId } from '../../../domain/ids.ts';
import * as resources from '../../../platform/resources.ts';
import type { ConsultPort } from '../useConsult.ts';

/** The port's call: the hair-only picture, or why there is none (no hair in the AI picture, or a failed call). */
export type HairOnlyTool = ConsultPort['hairOnly'];

/** What one attempt was made from: the photo and its outline's revision (a refinement makes the old one stale). */
interface Made {
  readonly photo: PhotoId;
  readonly revision: number;
  readonly result: ReturnType<HairOnlyTool>;
}

/** Keyed by the AI picture's Blob, so an entry goes when the resource store lets the picture go. */
const made = new WeakMap<Blob, Made>();
const current = (entry: Made | undefined, photo: PhotoId): entry is Made => entry?.photo === photo && entry.revision === resources.maskRevision(photo);

/** The hair-only version already made for this picture on the photo's current outline, if any (the board export uses it). */
export async function hairOnlyMade(picture: Blob): Promise<Blob | null> {
  const entry = made.get(picture);
  const result = entry && current(entry, entry.photo) ? await entry.result : null;
  return result instanceof Blob ? result : null;
}

/** The hair-only version on the photo's current outline: made once, again after a refinement, and tried again after a failure. Null without the picture. */
export function hairOnlyFor(tool: HairOnlyTool, photo: PhotoId, picture: PictureId): ReturnType<HairOnlyTool> | null {
  const blob = resources.picture(picture);
  if (!blob) return null;
  const kept = made.get(blob);
  if (current(kept, photo)) return kept.result;
  const entry: Made = { photo, revision: resources.maskRevision(photo), result: tool(photo, picture).catch(() => 'failed' as const) };
  made.set(blob, entry);
  void entry.result.then((m) => {
    if (m === 'failed' && made.get(blob) === entry) made.delete(blob);
  });
  return entry.result;
}

export type HairOnly =
  | { readonly state: 'off' | 'busy' | 'unavailable' | 'no_hair' }
  | { readonly state: 'ready'; readonly blob: Blob };

/** One settled attempt, for the picture and outline revision it was made for. */
interface Settled { readonly of: Blob; readonly revision: number; readonly made: Awaited<ReturnType<HairOnlyTool>> }

/** What the tile shows of a settled attempt: busy until the one for this picture and outline has settled. */
function shown(result: Settled | null, blob: Blob, revision: number): HairOnly {
  if (result?.of !== blob || result.revision !== revision) return { state: 'busy' };
  if (result.made === 'no_hair') return { state: 'no_hair' };
  return result.made === 'failed' ? { state: 'unavailable' } : { state: 'ready', blob: result.made };
}

/** The hair-only version while the switch is on: `unavailable` when there is no photo or picture. */
export function useHairOnly(tool: HairOnlyTool, photo: PhotoId | null, picture: PictureId | null, on: boolean): HairOnly {
  const blob = picture === null ? undefined : resources.picture(picture);
  const revision = photo === null ? 0 : resources.maskRevision(photo);
  const [result, setResult] = useState<Settled | null>(null);
  useEffect(() => {
    if (!on || photo === null || picture === null || blob === undefined) return;
    let live = true;
    void hairOnlyFor(tool, photo, picture)?.then((m) => {
      if (live) setResult({ of: blob, revision, made: m });
    });
    return () => {
      live = false;
    };
  }, [on, tool, photo, picture, blob, revision]);
  if (!on) return { state: 'off' };
  return photo === null || blob === undefined ? { state: 'unavailable' } : shown(result, blob, revision);
}
