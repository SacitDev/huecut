/** The extras' pure rules: which looks the preview shows, its targets, the sentence for hand-placed colour, the turn and the spot. */
import { describe, expect, it } from 'vitest';
import type { IndexEntry, LabBands, LookIndexEntry, LookLab } from '../../../domain/content/output.ts';
import { byFamily, clampPoint, clampTurn, movedSpot, placedByColourist, pointIn, previewLooks, SPOT_STEP, tintTargets, TURN_LIMIT_DEG } from './model.ts';

const bands = (l: number): LabBands => ({ shadows: [l - 15, 10, 20], mid: [l, 10, 20], light: [l + 12, 10, 20] });
const look = (id: string, family: string, lab: LookLab, regions: readonly string[] = []): LookIndexEntry => ({ id, kind: 'colour', name: id, lab, traits: { family, regions } }) as unknown as LookIndexEntry;
const ALL: LookLab = { root: bands(40), mids: bands(50), ends: bands(60) };
const NONE: LookLab = { root: null, mids: null, ends: null };

describe('the looks the preview can show', () => {
  it('keeps colour looks with at least one drawn region and leaves out every other kind', () => {
    const cut = { id: 'bob', kind: 'cut' } as unknown as IndexEntry;
    const rootOnly = look('root', 'brunette', { root: bands(30), mids: null, ends: null });
    expect(previewLooks([cut, look('all', 'blonde', ALL), look('placed', 'blonde', NONE), rootOnly]).map((l) => l.id)).toEqual(['all', 'root']);
  });

  it('once a collection is chosen, offers the looks of that collection only; before the choice, all of them', () => {
    const salon = { ...look('a', 'blonde', ALL), collections: ['salon'] } as unknown as LookIndexEntry;
    const barbering = { ...look('b', 'black', ALL), collections: ['barbering'] } as unknown as LookIndexEntry;
    const both = { ...look('c', 'brunette', ALL), collections: ['salon', 'barbering'] } as unknown as LookIndexEntry;
    expect(previewLooks([salon, barbering, both], ['barbering']).map((l) => l.id)).toEqual(['b', 'c']);
    expect(previewLooks([salon, barbering, both], []).map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('groups by family in order of the first look', () => {
    const groups = byFamily([look('a', 'blonde', ALL), look('b', 'black', ALL), look('c', 'blonde', ALL)]);
    expect(groups.map((g) => [g.family, g.looks.map((l) => l.id)])).toEqual([['blonde', ['a', 'c']], ['black', ['b']]]);
  });
});

describe('the worker targets of a look', () => {
  it('turns content triples into Lab objects band by band', () => {
    const targets = tintTargets(ALL);
    expect(targets.root?.mid).toEqual({ l: 40, a: 10, b: 20 });
    expect(targets.ends?.shadows).toEqual({ l: 45, a: 10, b: 20 });
    expect(targets.ends?.light).toEqual({ l: 72, a: 10, b: 20 });
  });

  it('keeps null where the person’s own colour stays (a none base)', () => {
    expect(tintTargets({ root: null, mids: bands(50), ends: null })).toMatchObject({ root: null, ends: null });
  });
});

describe('what the preview cannot draw', () => {
  it('says the colourist places face framing, highlights and lowlights', () => {
    for (const region of ['face_frame', 'highlights', 'lowlights']) expect(placedByColourist(look('x', 'blonde', ALL, ['mids', region]))).toBe(true);
  });

  it('stays quiet for root, mids and ends', () => {
    expect(placedByColourist(look('x', 'blonde', ALL, ['root', 'mids', 'ends']))).toBe(false);
  });
});

describe('the 3D turn', () => {
  it('stays within the limit and on whole degrees', () => {
    expect(clampTurn(TURN_LIMIT_DEG + 4, TURN_LIMIT_DEG)).toBe(TURN_LIMIT_DEG);
    expect(clampTurn(-TURN_LIMIT_DEG - 0.5, TURN_LIMIT_DEG)).toBe(-TURN_LIMIT_DEG);
    expect(clampTurn(3.6, TURN_LIMIT_DEG)).toBe(4);
  });
});

describe('the tap-to-select spot', () => {
  it('normalises a press inside the photo and keeps it there', () => {
    const box = { left: 100, top: 50, width: 200, height: 400 };
    expect(pointIn(box, 200, 150)).toEqual({ x: 0.5, y: 0.25 });
    expect(pointIn(box, 90, 500)).toEqual({ x: 0, y: 1 });
  });

  it('moves one step per press and stops at the edges', () => {
    expect(movedSpot({ x: 0.5, y: 0.5 }, 'right').x).toBeCloseTo(0.5 + SPOT_STEP, 6);
    expect(movedSpot({ x: 0.5, y: 0.5 }, 'up').y).toBeCloseTo(0.5 - SPOT_STEP, 6);
    expect(movedSpot({ x: 0, y: 0 }, 'left')).toEqual({ x: 0, y: 0 });
    expect(clampPoint({ x: 1.2, y: -1 })).toEqual({ x: 1, y: 0 });
  });
});
