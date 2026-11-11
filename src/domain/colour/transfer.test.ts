/** The colour-statistics transfer: pixels outside the mask never change, hair moves to its targets, `none` keeps own colour. */
import { describe, expect, it } from 'vitest';
import type { RgbaImage } from '../measure/mask.ts';
import type { Lab } from '../measure/observation.ts';
import { srgbToLab } from './lab.ts';
import { featherInside, maskAt, measureHair, targetsFromLab, transferColour, type HairMask, type LabTargets } from './transfer.ts';

const W = 60;
const H = 48;

/** A repeatable pseudo-random generator, so every run sees the same picture. */
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** A noisy picture: brownish hair texture everywhere, so a change inside the mask is visible. */
function picture(seed = 7, base: readonly [number, number, number] = [70, 50, 35]): RgbaImage {
  const next = random(seed);
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const n = (next() - 0.5) * 40;
    data.set([base[0] + n, base[1] + n, base[2] + n, 200 + Math.floor(next() * 55)], i * 4);
  }
  return { widthPx: W, heightPx: H, data };
}

/** Hair is a cap: the top 30 rows between columns 10 and 50, values 0 or 255. */
function cap(): HairMask {
  const data = new Uint8Array(W * H);
  for (let y = 0; y < 30; y++) for (let x = 10; x < 50; x++) data[y * W + x] = 255;
  return { widthPx: W, heightPx: H, data };
}

const flat = (lab: Lab) => ({ shadows: lab, mid: lab, light: lab });
const blonde: Lab = { l: 75, a: 4, b: 25 };
const everywhere: LabTargets = { root: flat(blonde), mids: flat(blonde), ends: flat(blonde) };

const labAt = (image: RgbaImage, x: number, y: number): Lab => {
  const i = (y * image.widthPx + x) * 4;
  return srgbToLab(image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0);
};

describe('colour transfer', () => {
  it('leaves every pixel outside the hair mask exactly as it was, and every alpha value everywhere', () => {
    const image = picture();
    const mask = cap();
    const out = transferColour(image, mask, targetsFromLab(everywhere));
    let changedInside = 0;
    for (let i = 0; i < W * H; i++) {
      const pixel = Array.from(out.data.subarray(i * 4, i * 4 + 4));
      const before = Array.from(image.data.subarray(i * 4, i * 4 + 4));
      if (mask.data[i] === 0) expect(pixel).toEqual(before);
      else if (pixel.some((v, c) => v !== before[c])) changedInside++;
      expect(pixel[3]).toBe(before[3]);
    }
    expect(changedInside).toBeGreaterThan(0.9 * 30 * 40);
    expect(out.data).not.toBe(image.data);
  });

  it('keeps the outside unchanged when the mask comes at another size (a 256 px preview mask)', () => {
    const image = picture(3);
    const small: HairMask = { widthPx: 30, heightPx: 24, data: new Uint8Array(30 * 24).map((_, i) => (i % 30 < 15 ? 255 : 0)) };
    const out = transferColour(image, small, targetsFromLab(everywhere));
    for (let y = 0; y < H; y++) {
      for (let x = 30; x < W; x++) expect(Array.from(out.data.subarray((y * W + x) * 4, (y * W + x) * 4 + 4))).toEqual(Array.from(image.data.subarray((y * W + x) * 4, (y * W + x) * 4 + 4)));
    }
  });

  it('moves the hair to the target mean, deep inside the mask where the feather is full', () => {
    const image = picture();
    const out = transferColour(image, cap(), targetsFromLab(everywhere));
    const inner: Lab[] = [];
    for (let y = 8; y < 22; y++) for (let x = 18; x < 42; x++) inner.push(labAt(out, x, y));
    const mean = (c: keyof Lab): number => inner.reduce((s, v) => s + v[c], 0) / inner.length;
    expect(mean('l')).toBeCloseTo(blonde.l, 0);
    expect(Math.abs(mean('a') - blonde.a)).toBeLessThan(1.5);
    expect(Math.abs(mean('b') - blonde.b)).toBeLessThan(1.5);
  });

});

describe('deep shadows in the hair', () => {
  /** Warm brown hair with a strip of near-black, near-neutral hair in shadow, as beside the neck. */
  const shadowed = (): RgbaImage => {
    const image = picture(5, [110, 75, 50]);
    for (let y = 8; y < 22; y++) for (let x = 26; x < 30; x++) image.data.set([8, 8, 8], (y * W + x) * 4);
    return image;
  };
  const ash: Lab = { l: 65, a: -0.2, b: 10 };

  it('never gives near-black hair the opposite hue of a low-chroma target (the teal band by the neck)', () => {
    const out = transferColour(shadowed(), cap(), targetsFromLab({ root: flat(ash), mids: flat(ash), ends: flat(ash) }));
    const lab = labAt(out, 28, 15);
    expect(lab.a).toBeGreaterThan(-2);
    expect(lab.b).toBeGreaterThan(0);
  });

  it('accepted limit of the rough preview: strands of equal lightness and different hue take the same target hue, and keep their lightness', () => {
    const image = picture(5, [150, 100, 60]);
    for (let y = 8; y < 22; y++) for (let x = 26; x < 30; x++) image.data.set([95, 118, 150], (y * W + x) * 4);
    const out = transferColour(image, cap(), targetsFromLab({ root: flat(ash), mids: flat(ash), ends: flat(ash) }));
    const [strand, around] = [labAt(out, 28, 15), labAt(out, 40, 15)];
    expect(Math.abs(strand.a - around.a)).toBeLessThan(1);
    expect(Math.abs(strand.b - around.b)).toBeLessThan(1);
    expect(Math.abs(strand.l - around.l)).toBeLessThan(12);
  });

  it('keeps near-black hair darker than the hair around it', () => {
    const out = transferColour(shadowed(), cap(), targetsFromLab({ root: flat(ash), mids: flat(ash), ends: flat(ash) }));
    expect(labAt(out, 28, 15).l).toBeLessThan(labAt(out, 40, 15).l - 15);
  });
});

describe('colour transfer targets', () => {
  it('keeps the person’s own colour where a region has no target (a none base): the root rows stay', () => {
    const image = picture();
    const out = transferColour(image, cap(), targetsFromLab({ root: null, mids: flat(blonde), ends: flat(blonde) }));
    for (let x = 10; x < 50; x++) expect(Array.from(out.data.subarray(x * 4, x * 4 + 4))).toEqual(Array.from(image.data.subarray(x * 4, x * 4 + 4)));
    expect(labAt(out, 30, 29).l).toBeGreaterThan(labAt(image, 30, 29).l + 20);
  });

  it('returns an identical copy when no region has a target or the mask is empty', () => {
    const image = picture();
    const none = transferColour(image, cap(), targetsFromLab({ root: null, mids: null, ends: null }));
    expect(Array.from(none.data)).toEqual(Array.from(image.data));
    const empty = transferColour(image, { widthPx: W, heightPx: H, data: new Uint8Array(W * H) }, targetsFromLab(everywhere));
    expect(Array.from(empty.data)).toEqual(Array.from(image.data));
  });

  it('measures a picture’s own hair per band, and takes its colour over to the photo (hair-only version)', () => {
    const ai = picture(11, [200, 160, 110]);
    const target = measureHair(ai, cap());
    expect(target).not.toBeNull();
    const aiHair = srgbToLab(200, 160, 110);
    expect(target?.mids?.mid.mean.l).toBeCloseTo(aiHair.l, -1);
    expect(target?.mids?.mid.spread?.l).toBeGreaterThan(1);
    const out = transferColour(picture(), cap(), target ?? targetsFromLab(everywhere));
    expect(labAt(out, 30, 15).l).toBeGreaterThan(labAt(picture(), 30, 15).l + 20);
    expect(measureHair(ai, { widthPx: 2, heightPx: 2, data: new Uint8Array(4) })).toBeNull();
  });
});

describe('short hair', () => {
  const faceFrom = (row: number): HairMask => ({ widthPx: W, heightPx: H, data: new Uint8Array(W * H).map((_, i) => (i >= row * W ? 255 : 0)) });

  it('short hair that ends against the face takes one flat colour: no light band along the hairline', () => {
    const out = transferColour(picture(), columns(() => 16), gradient, faceFrom(16));
    expect(Math.abs(labAt(out, 30, 14).l - labAt(out, 30, 3).l)).toBeLessThan(12);
  });

  it('flat short hair still shows a look that has only an ends colour', () => {
    const tips = targetsFromLab({ root: null, mids: null, ends: flat(light) });
    expect(labAt(transferColour(picture(), columns(() => 16), tips, faceFrom(16)), 30, 3).l).toBeGreaterThan(labAt(picture(), 30, 3).l + 40);
  });

  it('a look with root and ends but no mids takes its root on short hair, never its light ends', () => {
    const rootAndEnds = targetsFromLab({ root: flat(dark), mids: null, ends: flat(light) });
    const out = transferColour(picture(), columns(() => 16), rootAndEnds, faceFrom(16));
    expect(labAt(out, 30, 14).l).toBeLessThan(40);
    expect(Math.abs(labAt(out, 30, 14).l - labAt(out, 30, 3).l)).toBeLessThan(12);
  });

  it('without a face mask (the hair-only version of an AI picture) short hair keeps its root-to-ends colours', () => {
    const out = transferColour(picture(), columns(() => 16), gradient);
    expect(labAt(out, 30, 14).l).toBeGreaterThan(labAt(out, 30, 3).l + 25);
  });

  it('hair that ends against the background, with the face elsewhere, still reaches its ends', () => {
    const out = transferColour(picture(), columns(() => 16), gradient, faceFrom(45));
    expect(labAt(out, 30, 14).l).toBeGreaterThan(labAt(out, 30, 3).l + 25);
  });
});

describe('mask helpers', () => {
  it('samples a mask of another size by nearest neighbour', () => {
    const mask: HairMask = { widthPx: 2, heightPx: 2, data: Uint8Array.from([255, 0, 0, 255]) };
    expect(Array.from(maskAt(mask, 4, 2))).toEqual([1, 1, 0, 0, 0, 0, 1, 1]);
  });

  it('feathers only inwards: 0 outside, below 1 at the edge, 1 deep inside', () => {
    const inside = maskAt(cap(), W, H);
    const alpha = featherInside(inside, W, H);
    expect(alpha[29 * W + 30]).toBeLessThan(1);
    expect(alpha[29 * W + 30]).toBeGreaterThan(0);
    expect(alpha[15 * W + 30]).toBe(1);
    expect(alpha[40 * W + 30]).toBe(0);
    expect(alpha[0 * W + 30]).toBe(1);
  });
});

const dark: Lab = { l: 20, a: 5, b: 10 };
const light: Lab = { l: 88, a: 2, b: 12 };
const gradient = targetsFromLab({ root: flat(dark), mids: flat(dark), ends: flat(light) });
/** Hair across columns 10 to 49, each `rows(x)` deep. */
const columns = (rows: (x: number) => number): HairMask => {
  const data = new Uint8Array(W * H);
  for (let x = 10; x < 50; x++) for (let y = 0; y < rows(x); y++) data[y * W + x] = 255;
  return { widthPx: W, heightPx: H, data };
};

describe('position along the hair', () => {
  it('does not give a short column at a parting the colour of the ends', () => {
    const out = transferColour(picture(), columns((x) => (x >= 25 && x < 35 ? 10 : 44)), gradient);
    expect(labAt(out, 30, 7).l).toBeLessThan(labAt(out, 15, 41).l - 25);
  });

  it('short hair all over still reaches its ends: shortness alone holds nothing back', () => {
    const out = transferColour(picture(), columns(() => 16), gradient);
    expect(labAt(out, 30, 14).l).toBeGreaterThan(labAt(out, 30, 3).l + 25);
  });

  it('one stray long column does not hold the rest of the hair back from its ends', () => {
    const plain = transferColour(picture(), columns(() => 24), gradient);
    const stray = transferColour(picture(), columns((x) => (x === 30 ? 47 : 24)), gradient);
    expect(Math.abs(labAt(stray, 15, 22).l - labAt(plain, 15, 22).l)).toBeLessThan(2);
  });

  it('a mask one row deep gives a defined position', () => {
    const data = new Uint8Array(W * H).map((_, i) => (i >= 5 * W + 10 && i < 5 * W + 50 ? 255 : 0));
    const out = transferColour(picture(), { widthPx: W, heightPx: H, data }, gradient);
    expect(Number.isFinite(labAt(out, 30, 5).l)).toBe(true);
    expect(labAt(out, 30, 5).l).toBeGreaterThan(0);
  });
});
