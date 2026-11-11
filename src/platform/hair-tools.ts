/**
 * The per-use work of the extras: the colour preview, tap-to-select taps, one depth map per
 * photo and the hair-only version, as thin calls over the session's supervisor with the resource store's inputs. The
 * machine owns the downloads. The "running extra" marker is here too, set by the supervisor around each depth and SAM run.
 */
import type { PhotoId, PictureId } from '../domain/ids.ts';
import { err, ok, type Result } from '../domain/result.ts';
import type { AnalysisError, DepthMap, ExtraModel, HairSelection, Mask, PhotoInput, TapPoint, TintTargets } from '../worker/protocol.ts';
import type { Supervisor } from './analysis/supervisor.ts';
import * as resources from './resources.ts';
import { readKey, removeKey, writeKey } from './storage.ts';

/** `sessionStorage` key of the "running extra" marker, without the `huecut:` prefix. */
const RUNNING_EXTRA_KEY = 'running-extra';
/** A tint with no target and an empty mask returns the worker's own decode of the photo, pixel for pixel the same size. */
const NO_TARGETS: TintTargets = { root: null, mids: null, ends: null };

type ToolResult<T> = Result<T, AnalysisError>;
type Worker = Pick<Supervisor, 'tint' | 'selectHair' | 'depth'>;

let getWorker: (() => Worker) | null = null;

/** Called once by the composition root: `get` is the session's supervisor, started on first use. */
export function connectHairTools(get: () => Worker): void {
  getWorker = get;
}

/** Runs one worker call on a stored photo; a photo no longer in the store, or no session, is an error, never a throw. */
function withPhoto<T>(photoId: PhotoId, run: (worker: Worker, photo: PhotoInput) => Promise<ToolResult<T>>): Promise<ToolResult<T>> {
  const stored = resources.photo(photoId);
  if (!getWorker || !stored) return Promise.resolve(err({ code: 'internal', retryable: false, detail: `no session or no photo ${photoId}` }));
  return run(getWorker(), { id: photoId, blob: stored.blob });
}

let runningHere = false;

/** Names the extra now running in the worker, or clears it: if the run takes the tab down, the next boot switches it off. */
export function markRunningExtra(model: ExtraModel | null): void {
  runningHere = model !== null;
  if (model) writeKey(RUNNING_EXTRA_KEY, model, 'session');
  else removeKey(RUNNING_EXTRA_KEY, 'session');
}

/** The extra whose run the tab did not survive, if any. */
export function crashedExtras(): readonly ExtraModel[] {
  const marker = readKey(RUNNING_EXTRA_KEY, 'session');
  return marker === 'depth' || marker === 'sam' ? [marker] : [];
}

/** A reload or a closing tab during a run is not a crash: it fires `pagehide`, a real crash fires nothing. Only this page's own run is cleared. */
export function clearMarkerOnPageHide(): void {
  addEventListener('pagehide', () => {
    if (runningHere) markRunningExtra(null);
  });
}

/** The photo as the worker decodes it, so the "before" picture matches the preview pixel for pixel. */
export const photoPicture = (photoId: PhotoId, signal: AbortSignal): Promise<ToolResult<ImageBitmap>> => {
  const nothing: Mask = { widthPx: 1, heightPx: 1, data: new Uint8Array(1) };
  return withPhoto(photoId, (worker, photo) => worker.tint(photo, { kind: 'targets', targets: NO_TARGETS }, nothing, signal));
};

/** The photo with a look's Lab targets on its hair: the refined mask when there is one, else the segmenter's. */
export const tintedPicture = (photoId: PhotoId, targets: TintTargets, signal: AbortSignal): Promise<ToolResult<ImageBitmap>> =>
  withPhoto(photoId, (worker, photo) => worker.tint(photo, { kind: 'targets', targets }, resources.maskCopy(photoId) ?? 'auto', signal));

/** Tap-to-select: SAM's hair from all the taps so far, and its measures. */
export const selectHair = (photoId: PhotoId, points: readonly TapPoint[], signal: AbortSignal): Promise<ToolResult<HairSelection>> =>
  withPhoto(photoId, (worker, photo) => worker.selectHair(photo, points, signal));

/** The photo's depth map, with the foreground it was measured with when the segmenter ran; measured once and kept in the resource store. */
export async function depthLayers(photoId: PhotoId, signal: AbortSignal): Promise<ToolResult<DepthMap>> {
  const kept = resources.depth(photoId);
  if (kept) return ok(kept);
  const r = await withPhoto(photoId, (worker, photo) => worker.depth(photo, signal));
  if (!r.ok) return r;
  resources.setDepth(photoId, r.value);
  return ok(r.value);
}

/** A bitmap as a lossless PNG (so "unchanged" stays true of the file), closing the bitmap. */
function pngOf(bitmap: ImageBitmap): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * The hair-only version of an AI colour picture: the picture's own hair statistics moved onto the person's hair,
 * or why there is none: `no_hair` when the worker found no hair in the AI picture, `failed` for anything else. It goes with
 * its sources: the picture, the photo, or the photo's outline.
 */
export async function hairOnly(photoId: PhotoId, pictureId: PictureId): Promise<Blob | 'no_hair' | 'failed'> {
  const blob = resources.picture(pictureId);
  if (!blob) return 'failed';
  const r = await withPhoto(photoId, (worker, photo) => worker.tint(photo, { kind: 'picture', blob }, resources.maskCopy(photoId) ?? 'auto'));
  if (!r.ok) return r.error.code === 'decode_failed' ? 'no_hair' : 'failed';
  const made = await pngOf(r.value);
  if (!made) return 'failed';
  resources.derive(made, blob, resources.photo(photoId)?.blob);
  return made;
}
