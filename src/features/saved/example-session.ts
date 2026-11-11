/**
 * The bundled examples: one `SessionData` per library model. Its picture and
 * hair mask go into the resource store under the example photo's id before `START{source: 'example'}`, so "Try a colour on
 * your photo" works at once and no model is downloaded. `RESET` comes first, because leaving a session empties the store.
 */
import type { PhotoId } from '../../domain/ids.ts';
import type { PhotoObservation } from '../../domain/measure/observation.ts';
import { parseSessionData, type SavedPhoto, type SessionData } from '../../domain/session/session-data.ts';
import * as resources from '../../platform/resources.ts';
import { savingChoice } from '../../platform/storage.ts';
import type { Mask } from '../../worker/protocol.ts';
import type { SessionPort } from './model.ts';

/** The example records as Vite assets, fetched only when opened; keys are relative to this file. */
const RECORDS = import.meta.glob<string>('../../../content/examples/*.json', { query: '?url&no-inline', import: 'default', eager: true });
const recordKey = (modelId: string): string => `../../../content/examples/${modelId}.json`;
const siteFile = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

/** The model a running example shows, read back from the photo id `scripts/examples.ts` wrote. */
export const EXAMPLE_PHOTO_PREFIX = 'example-';

interface Prepared {
  readonly session: SessionData;
  readonly photo: SavedPhoto;
  readonly picture: Blob;
  readonly mask: Mask;
}

async function fetched(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${String(response.status)}`);
  return response;
}

/** The hair mask PNG as a 0 / 255 mask; any non-zero sample is hair. */
async function decodeMask(blob: Blob): Promise<Mask> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('no 2D canvas');
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { widthPx: bitmap.width, heightPx: bitmap.height, data: Uint8Array.from({ length: bitmap.width * bitmap.height }, (_, i) => ((data[i * 4] ?? 0) > 127 ? 255 : 0)) };
  } finally {
    bitmap.close();
  }
}

/** The record with the mask as its preview mask, so Lines offers the colour sheet as it does for a photo. */
async function prepare(modelId: string): Promise<Prepared> {
  const url = RECORDS[recordKey(modelId)];
  if (url === undefined) throw new Error(`no example for ${modelId}`);
  const parsed = parseSessionData(await (await fetched(url)).json());
  if (!parsed.ok) throw new Error(`example ${modelId}: ${parsed.error.code} at ${parsed.error.path}`);
  const photo = parsed.value.photo;
  if (!photo?.example || !photo.observation) throw new Error(`example ${modelId} has no picture`);
  const [picture, maskBlob] = await Promise.all([fetched(siteFile(photo.example.picture)).then((r) => r.blob()), fetched(siteFile(photo.example.mask)).then((r) => r.blob())]);
  const mask = await decodeMask(maskBlob);
  const observation: PhotoObservation = { ...photo.observation, previewMask: mask };
  const withMask: SavedPhoto = { ...photo, observation };
  return { session: { ...parsed.value, photo: withMask }, photo: withMask, picture, mask };
}

const prepared = new Map<string, Promise<Prepared>>();
/** One fetch per model; a failed one is forgotten, so "Try again" fetches it again. */
function prepareOnce(modelId: string): Promise<Prepared> {
  let pending = prepared.get(modelId);
  if (!pending) {
    pending = prepare(modelId).catch((e: unknown) => {
      prepared.delete(modelId);
      throw e;
    });
    prepared.set(modelId, pending);
  }
  return pending;
}

let opening: Promise<void> | null = null;

/** Opens a model's example; a second call while one is opening joins it, as React's double effects do in development. */
export function openExample(port: SessionPort, modelId: string): Promise<void> {
  opening ??= (async () => {
    const { session, photo, picture, mask } = await prepareOnce(modelId);
    if (port.view().step !== null) port.send({ type: 'RESET' });
    const id: PhotoId = photo.id;
    if (!(await resources.addPhoto(picture, '', id))) throw new Error(`example ${modelId}: the picture was refused`);
    resources.setMask(id, mask);
    port.send({ type: 'START', source: 'example', session });
  })().finally(() => {
    opening = null;
  });
  return opening;
}

/** "Start with my photo": leaves the example for a real session. */
export function startWithMyPhoto(port: SessionPort): void {
  port.send({ type: 'RESET' });
  port.send({ type: 'START', source: 'photo', keep: savingChoice() });
}
