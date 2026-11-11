/**
 * Painter geometry tests: trace dash lengths, pictures drawn whole, the photo's
 * part of a crop that reaches past it, and the fonts to load per face and weight.
 */
import { expect, it, vi } from 'vitest';
import { containRect, fontsFor, loadFonts, pathLength, photoRects, type PainterItem, type PainterTokens } from './painter.ts';

const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

it('measures a line for its dash, with the closing segment when closed', () => {
  expect(pathLength(square, false)).toBe(30);
  expect(pathLength(square, true)).toBe(40);
  expect(pathLength([{ x: 0, y: 0 }, { x: 3, y: 4 }], false)).toBe(5);
  expect(pathLength([{ x: 1, y: 1 }], false)).toBe(0);
});

it('draws a picture whole and centred inside its rectangle', () => {
  expect(containRect({ widthPx: 300, heightPx: 400 }, { x: 0, y: 0, width: 1000, height: 1000 })).toEqual({ x: 125, y: 0, width: 750, height: 1000 });
  expect(containRect({ widthPx: 800, heightPx: 400 }, { x: 10, y: 20, width: 100, height: 100 })).toEqual({ x: 10, y: 45, width: 100, height: 50 });
});

it('maps a crop inside the photo onto the whole area', () => {
  const area = { x: 420, y: 240, width: 1320, height: 1500 };
  const r = photoRects({ crop: { x: 0.2, y: 0.1, width: 0.6, height: 0.5 }, area }, { widthPx: 1000, heightPx: 1400 });
  const close = (rect: typeof area | undefined, expected: typeof area) => {
    for (const k of ['x', 'y', 'width', 'height'] as const) expect(rect?.[k]).toBeCloseTo(expected[k], 9);
  };
  close(r?.source, { x: 200, y: 140, width: 600, height: 700 });
  close(r?.target, area);
});

it('keeps the scale where the crop reaches past the photo, leaving the rest of the area to the neutral ground', () => {
  const area = { x: 0, y: 0, width: 1200, height: 1000 };
  const r = photoRects({ crop: { x: -0.1, y: 0, width: 1.2, height: 1 }, area }, { widthPx: 500, heightPx: 400 });
  expect(r?.source).toEqual({ x: 0, y: 0, width: 500, height: 400 });
  expect(r?.target.x).toBeCloseTo(100, 9);
  expect(r?.target.width).toBeCloseTo(1000, 9);
  expect(photoRects({ crop: { x: 1.2, y: 0, width: 0.5, height: 1 }, area }, { widthPx: 500, heightPx: 400 })).toBeNull();
});

it('loads one font per face and weight that the text, labels and picture tags use', () => {
  const tokens = { fonts: { display: "'Display'", text: "'Text'" } } as PainterTokens;
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  const items: PainterItem[] = [
    { type: 'text', rect, blocks: [{ role: 'heading', text: 'What this photo shows' }, { role: 'hair', text: 'a' }, { role: 'hair', text: 'b' }] },
    { type: 'label', id: 'jaw', text: 'Jaw', anchor: { x: 0, y: 0 }, align: 'left', maxWidthPx: 100, leaderTo: { x: 1, y: 1 } },
    { type: 'text', rect, blocks: [{ role: 'app', text: 'Huecut' }, { role: 'link', text: 'x' }, { role: 'fact', text: 'c' }] },
  ];
  expect(fontsFor(items, tokens)).toEqual([
    "semi-condensed 700 16px 'Display'",
    "normal 400 16px 'Text'",
    "normal 600 16px 'Text'",
    "normal 500 16px 'Text'",
    "normal 650 16px 'Text'",
  ]);
  const plain: PainterItem = { type: 'picture', ref: null, rect };
  const tagged: PainterItem = { type: 'picture', ref: null, rect, tag: 'AI picture' };
  expect(fontsFor([plain], tokens)).toEqual([]);
  expect(fontsFor([tagged], tokens)).toEqual(["normal 600 16px 'Text'"]);
});

it('waits only for the web font: the local fallbacks after it in the theme are left out', () => {
  const tokens = { fonts: { display: "'Display', 'Local fallback', system-ui, sans-serif", text: "'Text', 'Local fallback', sans-serif" } } as PainterTokens;
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  const items: PainterItem[] = [{ type: 'text', rect, blocks: [{ role: 'app', text: 'Huecut' }, { role: 'hair', text: 'a' }] }];
  expect(fontsFor(items, tokens)).toEqual(["semi-condensed 700 16px 'Display'", "normal 400 16px 'Text'"]);
});

it('loads each font with the letters set in it, so the Latin Extended faces come for Latvian', async () => {
  const tokens = { fonts: { display: "'Display'", text: "'Text'" } } as PainterTokens;
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  const items: PainterItem[] = [{ type: 'text', rect, blocks: [{ role: 'hair', text: 'Ķēde' }, { role: 'hair', text: 'ļoti' }] }];
  const load = vi.fn(() => Promise.resolve([{}]));
  await loadFonts(items, tokens, { load } as unknown as FontFaceSet);
  expect(load).toHaveBeenCalledWith("normal 400 16px 'Text'", 'Ķēdeļoti');
});

it('waits for every font weight and reports, without throwing, the ones that failed or matched no face', async () => {
  const tokens = { fonts: { display: "'Display'", text: "'Text'" } } as PainterTokens;
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  const items: PainterItem[] = [{ type: 'text', rect, blocks: [{ role: 'heading', text: 'a' }, { role: 'hair', text: 'b' }, { role: 'footer', text: 'c' }] }];
  const load = vi.fn((font: string) =>
    font.includes('700') ? Promise.reject(new DOMException('bad font', 'NetworkError')) : Promise.resolve(font.includes('500') ? [] : [{}]),
  );
  const missing = await loadFonts(items, tokens, { load } as unknown as FontFaceSet);
  expect(load).toHaveBeenCalledTimes(3);
  expect(missing).toEqual(["semi-condensed 700 16px 'Display'", "normal 500 16px 'Text'"]);
});
