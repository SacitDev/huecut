/** The shipped examples as `scripts/examples.ts` wrote them: one per library model, valid records, and PNG masks with no metadata. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { parseSessionData, type SessionData } from '../src/domain/session/session-data.ts';

const root = join(import.meta.dirname, '..');
const models = JSON.parse(readFileSync(join(root, 'content', 'library-models.json'), 'utf8')) as readonly { readonly id: string; readonly collection: string }[];
const PNG_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);

function chunks(png: Buffer): string[] {
  const types: string[] = [];
  for (let at = 8; at < png.length; at += 12 + png.readUInt32BE(at)) types.push(png.toString('latin1', at + 4, at + 8));
  return types;
}

function record(id: string): SessionData {
  const parsed = parseSessionData(JSON.parse(readFileSync(join(root, 'content', 'examples', `${id}.json`), 'utf8')));
  if (!parsed.ok) throw new Error(`${id}: ${parsed.error.code} at ${parsed.error.path}`);
  return parsed.value;
}

it('there are four library models', () => {
  expect(models.length).toBe(4);
});

it.each(models.map((m) => [m.id, m.collection]))('%s is a valid example at the face card, on its own picture and mask', (id, collection) => {
  const data = record(id);
  expect(data).toMatchObject({ source: 'example', step: 'face', furthest: 1, savedAt: 0, slots: {}, grids: [], pair: null });
  expect(data.prefs.collections).toEqual([collection]);
  expect(data.photo?.id).toBe(`example-${id}`);
  expect(data.photo?.example).toEqual({ picture: `library/${id}/model-base-front-1086.avif`, mask: `examples/${id}-hair-mask.png` });
  expect(data.photo?.observation?.faces.length).toBe(1);
  expect(data.photo?.observation?.previewMask).toBeNull();
});

it.each(models.map((m) => [m.id]))('the mask of %s is an 8-bit grey PNG holding only the allowed chunks', (id) => {
  const png = readFileSync(join(root, 'public', 'examples', `${id}-hair-mask.png`));
  expect(chunks(png).filter((type) => !PNG_CHUNKS.has(type))).toEqual([]);
  expect([png[24], png[25]]).toEqual([8, 0]);
});
