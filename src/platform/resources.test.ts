/** The resource store against RESET: an import still decoding when the store is emptied must not refill it. */
import { afterEach, expect, it, vi } from 'vitest';
import { asPhotoId } from '../domain/ids.ts';
import * as resources from './resources.ts';

const FIRST = asPhotoId('first');
const SECOND = asPhotoId('second');

/** `createImageBitmap` held on a gate per call, as a large photo's decode is. */
function heldDecodes() {
  const opens: (() => void)[] = [];
  const decode = vi.fn(
    () =>
      new Promise<ImageBitmap>((_, reject) => {
        opens.push(() => {
          reject(new Error('cannot decode here'));
        });
      }),
  );
  vi.stubGlobal('createImageBitmap', decode);
  return { decode, opens };
}

const turns = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
/** Lets every held decode end, including those that only start because an earlier one ended. */
async function drain(opens: (() => void)[]): Promise<void> {
  await turns();
  while (opens.length > 0) {
    opens.shift()?.();
    await turns();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  resources.disposeAll();
});

it('does not store a photo whose import was still decoding when RESET emptied the store', async () => {
  const { opens } = heldDecodes();
  const importing = resources.addPhoto(new Blob(['a']), 'a', FIRST);
  await turns();
  resources.disposeAll();
  await drain(opens);
  await expect(importing).resolves.toBeNull();
  expect(resources.photo(FIRST)).toBeUndefined();
});

it('does not even decode an import that was still queued when RESET came', async () => {
  const { decode, opens } = heldDecodes();
  const running = resources.addPhoto(new Blob(['a']), 'a', FIRST);
  const queued = resources.addPhoto(new Blob(['b']), 'b', SECOND);
  await turns();
  const before = decode.mock.calls.length;
  resources.disposeAll();
  await drain(opens);
  await expect(running).resolves.toBeNull();
  await expect(queued).resolves.toBeNull();
  expect(resources.photo(SECOND)).toBeUndefined();
  expect(decode.mock.calls.length).toBeLessThanOrEqual(before + 1); // the first import's retry at full size, nothing for the second
});

it('stores an import that finished before any RESET', async () => {
  const stored = await resources.addPhoto(new Blob(['a']), 'a', FIRST);
  expect(stored?.id).toBe(FIRST);
  expect(resources.photo(FIRST)?.blob).toBeDefined();
});

/** A PNG head naming `w` x `h`; the door reads no further. */
const pngFile = (w: number, h: number): File => {
  const v = new DataView(new ArrayBuffer(24));
  [0x89504e47, 0x0d0a1a0a, 13, 0x49484452, w, h].forEach((n, i) => { v.setUint32(i * 4, n); });
  return new File([v], 'x.png', { type: 'image/png' });
};

it('the door refuses by the bytes themselves, and says which', async () => {
  await expect(resources.refusal(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }))).resolves.toBe('not_picture');
  await expect(resources.refusal(new File(['<svg/>'], 'a.png', { type: 'image/png' }))).resolves.toBe('not_picture');
  await expect(resources.refusal(new File(['%PDF'], 'a.pdf', { type: 'application/pdf' }))).resolves.toBe('not_picture');
  await expect(resources.refusal(pngFile(16000, 12000))).resolves.toBe('too_large');
  await expect(resources.refusal(pngFile(8192, 6144))).resolves.toBeNull();
});

/** A HEIC head as a phone writes it: `ftyp` with the `heic` brand, then the image size in an `ispe` box. */
const heicHead = (): ArrayBuffer => {
  const v = new DataView(new ArrayBuffer(44));
  [24, 0x66747970, 0x68656963].forEach((n, i) => { v.setUint32(i * 4, n); });
  [20, 0x69737065, 0, 4032, 3024].forEach((n, i) => { v.setUint32(24 + i * 4, n); });
  return v.buffer;
};

// Corrected rule: this test used to assert that any file named .heic came in unread, which skipped the size check.
it('a file named HEIC comes in only with a HEIF head, which goes on to the sentence that explains it', async () => {
  await expect(resources.refusal(new File(['not really a heic'], 'IMG_1.HEIC'))).resolves.toBe('not_picture');
  await expect(resources.refusal(new File([heicHead()], 'IMG_1.HEIC'))).resolves.toBeNull();
  await expect(resources.refusal(new File([heicHead()], 'IMG_1.HEIC', { type: 'image/heic' }))).resolves.toBeNull();
});

it('the bytes decide, not the name or the declared type: a real raster under another name comes in, anything else stays out', async () => {
  const png = await pngFile(800, 600).arrayBuffer();
  await expect(resources.refusal(new File([png], 'a.jpg', { type: 'image/jpeg' }))).resolves.toBeNull();
  await expect(resources.refusal(new File([heicHead()], 'a.jpg', { type: 'image/jpeg' }))).resolves.toBeNull();
  await expect(resources.refusal(new File([png], 'a.heic'))).resolves.toBeNull();
  await expect(resources.refusal(new File(['<svg/>'], 'a.jpg', { type: 'image/jpeg' }))).resolves.toBe('not_picture');
  await expect(resources.refusal(new File([png], 'a.png', { type: 'image/png' }))).resolves.toBeNull();
});

it('the bytes alone decide: JPEG bytes with no declared type, or a generic one, come in; SVG, PDF and text bytes stay out under any name or type', async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 8, 600 >> 8, 600 & 255, 800 >> 8, 800 & 255, 3]);
  await expect(resources.refusal(new File([jpeg], 'photo')), 'no type').resolves.toBeNull();
  await expect(resources.refusal(new File([jpeg], 'photo.bin', { type: 'application/octet-stream' })), 'a generic type').resolves.toBeNull();
  for (const bytes of ['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', '%PDF-1.4', 'plain words']) {
    for (const [name, type] of [['a.jpg', 'image/jpeg'], ['a.png', 'image/png'], ['a', ''], ['a.bin', 'application/octet-stream'], ['a.heic', '']] as const) {
      await expect(resources.refusal(new File([bytes], name, { type })), `${bytes.slice(0, 8)} as ${name} (${type})`).resolves.toBe('not_picture');
    }
  }
});

it('an import passes the session it began in: once the session has gone, nothing it reads is stored', async () => {
  const mine = resources.generation();
  resources.disposeAll();
  expect(resources.generation()).not.toBe(mine);
  await expect(resources.addPhoto(new Blob(['a']), 'a', FIRST, mine)).resolves.toBeNull();
  expect(resources.photo(FIRST)).toBeUndefined();
  await expect(resources.addPhoto(new Blob(['a']), 'a', FIRST, resources.generation())).resolves.not.toBeNull();
});

it('a picture made from stored ones loses its object URL with any of them, and with a new outline of the photo', async () => {
  const revoked: string[] = [];
  let n = 0;
  vi.stubGlobal('URL', { createObjectURL: () => `blob:${String(++n)}`, revokeObjectURL: (u: string) => revoked.push(u) });
  for (const goes of ['picture', 'photo', 'outline'] as const) {
    await resources.addPhoto(new Blob(['a']), 'a', FIRST);
    const picture = resources.addPicture(new Blob(['p']));
    const made = new Blob(['hair only']);
    resources.derive(made, resources.picture(picture), resources.photo(FIRST)?.blob);
    const url = resources.useObjectUrl(made);
    const revisionBefore = resources.maskRevision(FIRST);
    if (goes === 'picture') resources.disposePictures([picture]);
    else if (goes === 'photo') resources.removePhoto(FIRST);
    else resources.setMask(FIRST, { widthPx: 1, heightPx: 1, data: new Uint8Array(1) });
    expect(revoked, goes).toContain(url);
    if (goes === 'outline') expect(resources.maskRevision(FIRST)).not.toBe(revisionBefore);
    resources.disposeAll();
  }
});

it('a 200 MP JPEG comes in only where it can be scaled, and a picture must fit whole', async () => {
  const head = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 8, 12240 >> 8, 12240 & 255, 16320 >> 8, 16320 & 255, 3]);
  const jpeg = new File([head], 'a.jpg', { type: 'image/jpeg' });
  await expect(resources.refusal(jpeg)).resolves.toBe('too_large');
  vi.stubGlobal('ImageDecoder', vi.fn());
  await expect(resources.refusal(jpeg)).resolves.toBeNull();
  await expect(resources.refusal(jpeg, true)).resolves.toBe('too_large');
  // The bytes decide, not the declared type: the same JPEG with an empty, a generic or a wrong type is scaled too.
  for (const type of ['', 'application/octet-stream', 'image/png']) await expect(resources.refusal(new File([head], 'a.bin', { type }))).resolves.toBeNull();
});

it('keeps no depth map for a photo removed while it was measured', async () => {
  await resources.addPhoto(new Blob(['a']), 'a', FIRST);
  resources.removePhoto(FIRST);
  resources.setDepth(FIRST, { widthPx: 1, heightPx: 1, data: new Float32Array(1) });
  expect(resources.depth(FIRST)).toBeUndefined();
});
