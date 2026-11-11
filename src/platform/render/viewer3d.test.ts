/** The 3D surface's pure parts: percentile normalisation over the person's own depth, and bilinear sampling. */
import { describe, expect, it } from 'vitest';
import { bilinear, blurred, easedShare, normalisedDepth, personBox, reliefFor, spreadOutward } from './viewer3d.ts';
import { withoutHoles } from '../../domain/measure/mask.ts';

describe('normalisedDepth', () => {
  it('scales by the 2nd and 98th percentile, so one stray value cannot flatten the surface', () => {
    const values = Float32Array.from({ length: 101 }, (_, i) => (i === 100 ? 1000 : i));
    const out = normalisedDepth(values, null);
    expect(out[0]).toBe(0);
    expect(out[50]).toBeGreaterThan(0.45);
    expect(out[50]).toBeLessThan(0.55);
    expect(out[100]).toBe(1);
  });

  it('takes its range from the foreground only and clamps the background', () => {
    const data = Float32Array.from([0, 0, 10, 20, 30, 40]);
    const foreground = Uint8Array.from([0, 0, 255, 255, 255, 255]);
    const out = normalisedDepth(data, foreground);
    expect(out[0]).toBe(0);
    expect(out[2]).toBeCloseTo(0, 5);
    expect(out[5]).toBeCloseTo(1, 5);
    expect(out[3]).toBeGreaterThan(0);
    expect(out[3]).toBeLessThan(out[4] ?? 0);
  });

  it('is flat when there is no spread or no foreground', () => {
    expect(Array.from(normalisedDepth(Float32Array.from([3, 3, 3]), null))).toEqual([0, 0, 0]);
    expect(Array.from(normalisedDepth(Float32Array.from([1, 2]), new Uint8Array(2)))).toEqual([0, 0]);
  });
});

describe('bilinear', () => {
  const grid = [0, 100, 200, 300];

  it('returns the corners exactly', () => {
    expect(bilinear(grid, 2, 2, 0, 0)).toBe(0);
    expect(bilinear(grid, 2, 2, 1, 0)).toBe(100);
    expect(bilinear(grid, 2, 2, 0, 1)).toBe(200);
    expect(bilinear(grid, 2, 2, 1, 1)).toBe(300);
  });

  it('blends between them', () => {
    expect(bilinear(grid, 2, 2, 0.5, 0.5)).toBe(150);
    expect(bilinear(grid, 2, 2, 0.25, 0)).toBe(25);
  });
});

describe('the surface and framing', () => {
  it('blurred keeps a flat grid flat and softens a single spike', () => {
    expect(Array.from(blurred([5, 5, 5, 5], 2, 2, 2))).toEqual([5, 5, 5, 5]);
    const spike = blurred([0, 0, 0, 0, 90, 0, 0, 0, 0], 3, 3, 1);
    expect(spike[4]).toBe(10);
    expect(spike[0]).toBeCloseTo(90 / 4, 5);
  });

  it('spreadOutward carries depth over the background, a cell per pass, and leaves the person alone', () => {
    const out = spreadOutward(Float32Array.from([0, 0, 7, 0]), Uint8Array.from([0, 0, 255, 0]), 4, 1, 1);
    expect(Array.from(out)).toEqual([0, 7, 7, 7]);
    expect(Array.from(spreadOutward(Float32Array.from([0, 0, 7, 0]), Uint8Array.from([0, 0, 255, 0]), 4, 1, 2))).toEqual([7, 7, 7, 7]);
  });

  it('personBox ends where the person ends, so a body cut off inside the photo can be framed out', () => {
    const [w, h] = [4, 10];
    const mask = new Uint8Array(w * h);
    for (let y = 1; y < 6; y++) mask[y * w + 2] = 255;
    expect(personBox(mask, w, h).bottom).toBe(0.6);
  });

  it('personBox takes the width from the head and hair, so wide shoulders do not widen the frame', () => {
    const [w, h] = [10, 10];
    const mask = new Uint8Array(w * h);
    for (let y = 2; y < 6; y++) for (let x = 4; x < 7; x++) mask[y * w + x] = 255;
    for (let y = 8; y < 10; y++) for (let x = 0; x < 10; x++) mask[y * w + x] = 255;
    expect(personBox(mask, w, h)).toEqual({ top: 0.2, bottom: 1, left: 0.4, right: 0.7 });
    expect(personBox(null, w, h)).toEqual({ top: 0, bottom: 1, left: 0, right: 1 });
    expect(personBox(new Uint8Array(w * h), w, h)).toEqual({ top: 0, bottom: 1, left: 0, right: 1 });
  });
});

describe('the silhouette', () => {
  const ROWS = [
    [0, 0, 0, 0, 0],
    [0, 255, 255, 255, 0],
    [0, 255, 0, 255, 0],
    [0, 255, 255, 255, 0],
    [0, 0, 0, 0, 0],
  ];
  const mask = Uint8Array.from(ROWS.flat());

  it('withoutHoles fills background that cannot reach the border and keeps the outside', () => {
    const filled = withoutHoles(mask, 5, 5);
    expect(filled[12]).toBe(255);
    expect(filled[0]).toBe(0);
    expect(Array.from(filled).filter((v) => v === 255)).toHaveLength(9);
  });

  it('a person touching the border leaves the rest of the outside open', () => {
    const atEdge = Uint8Array.from([255, 255, 0, 0]);
    expect(Array.from(withoutHoles(atEdge, 2, 2))).toEqual([255, 255, 0, 0]);
  });
});

describe('reliefFor', () => {
  it('leaves an ordinary portrait alone and calms a head seen small', () => {
    expect(reliefFor(0.5)).toBe(reliefFor(0.35));
    expect(reliefFor(0.2)).toBeCloseTo(reliefFor(0.35) * (0.2 / 0.35), 5);
  });
});

describe('easedShare', () => {
  it('starts at 0, even for a frame timed just before the press, and ends at exactly 1', () => {
    expect(easedShare(-16)).toBe(0);
    expect(easedShare(0)).toBe(0);
    expect(easedShare(10_000)).toBe(1);
  });

  it('only ever moves forward', () => {
    expect(easedShare(100)).toBeGreaterThan(easedShare(50));
    expect(easedShare(200)).toBeLessThan(1);
  });
});
