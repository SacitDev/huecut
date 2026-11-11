/** The derivation branches the fixture set does not reach: buzz cuts, landmarks, plain fades and the Lab clamps. */
import { describe, expect, it } from 'vitest';
import type { Haircut, Zones } from '../../src/domain/content/types.ts';
import { hexToLab, labBands, lengthClass, requiredCm, scalpMm, sides, topLength } from './derive.ts';

const zones = (top: Zones['top'], rest: Partial<Zones> = {}): Zones =>
  ({ basis: 'dry_stretched', top, fringe: null, sides: null, back: null, nape: null, ...rest });

describe('cut derivations', () => {
  it('a cut in clipper guards only is a buzz; a landmark decides before the zones', () => {
    expect(lengthClass({ zones: zones({ guard_mm: [3, 3] }, { sides: { guard_mm: [1, 3] } }), perimeter: { landmark: null } })).toBe('buzz');
    expect(lengthClass({ zones: zones({ cm: [20, 30] }), perimeter: { landmark: 'shoulder_blade' } })).toBe('long');
    expect(lengthClass({ zones: zones({ cm: [4, 6] }), perimeter: { landmark: 'collarbone' } })).toBe('bob');
    // Top 4-6 cm: middle 5 is not under 5, so short.
    expect(lengthClass({ zones: zones({ cm: [4, 6] }), perimeter: { landmark: null } })).toBe('short');
  });

  it('top length bands: under 2, 2-5, 5-10 and over 10 cm, from the middle of the top zone', () => {
    // A 12 mm guard is 1.2 cm.
    expect(topLength(zones({ guard_mm: [12, 12] }))).toBe('very_short');
    expect(topLength(zones({ cm: [1, 3] }))).toBe('short');
    expect(topLength(zones({ cm: [8, 12] }))).toBe('medium');
    expect(topLength(zones({ cm: [9, 13] }))).toBe('long');
  });

  it('sides from the fade: a plain fade by its height; taper, scissor taper and undercut by kind', () => {
    const fade = (kind: NonNullable<Haircut['fade']>['kind'], height: 'low' | 'mid' | 'high' | null = null) => ({ kind, height, start_mm: 1, note: null });
    expect(sides(fade('fade', 'high'))).toBe('high_fade');
    expect(sides(fade('bald', 'low'))).toBe('bald_fade');
    expect(sides(fade('scissor_taper'))).toBe('scissor_taper');
    expect(sides(fade('undercut'))).toBe('undercut');
    expect(() => sides(fade('fade'))).toThrow('a plain fade names its height');
  });

  it('the shortest exposed length: every zone, a fade or undercut by its start, a taper band in long sides, a nape undercut', () => {
    const fade = (kind: NonNullable<Haircut['fade']>['kind'], start_mm: number) => ({ kind, height: kind === 'fade' ? ('low' as const) : null, start_mm, note: null });
    const cut = (z: Zones, f: Haircut['fade'], nape_style: Haircut['traits']['nape_style'] = 'tapered') => scalpMm({ zones: z, fade: f, traits: { nape_style } });
    expect(cut(zones({ cm: [3, 5] }, { sides: { cm: [2, 4] }, nape: { cm: [0.5, 1] } }), null)).toBe(5);
    expect(cut(zones({ cm: [6, 12] }, { sides: { cm: [2, 5] } }), fade('fade', 0.5))).toBe(0.5);
    // A hairline taper is already in the zones; a taper cut as a band into long sides counts by its start.
    expect(cut(zones({ cm: [6, 12] }, { sides: { cm: [2, 4] } }), fade('taper', 6))).toBe(20);
    expect(cut(zones({ cm: [30, 50] }, { sides: { cm: [40, 60] } }), fade('taper', 5))).toBe(5);
    expect(cut(zones({ cm: [30, 50] }, { sides: { cm: [40, 60] } }), null, 'undercut')).toBe(3);
  });

  it('required length is the lower end of the zone with the largest upper end', () => {
    expect(requiredCm(zones({ cm: [3, 5] }, { back: { cm: [6, 12] }, nape: { guard_mm: [0, 3] } }))).toBe(6);
  });
});

describe('Lab conversion', () => {
  it('maps greys to a = b = 0 and keeps L* in 0-100 in the bands', () => {
    const [, a, b] = hexToLab('#5a5a5a');
    expect(a).toBeCloseTo(0, 10);
    expect(b).toBeCloseTo(0, 10);
    expect(labBands('#000000')).toEqual({ shadows: [0, 0, 0], mid: [0, 0, 0], light: [12, 0, 0] });
    expect(labBands('#ffffff')).toEqual({ shadows: [85, 0, 0], mid: [100, 0, 0], light: [100, 0, 0] });
  });

  it('uses the linear part of the sRGB curve near black', () => {
    // #010101: 1/255 = 0.0039216 <= 0.04045, so linear = 0.0039216 / 12.92 = 0.00030353, below (6/29)^3 = 0.0088565:
    // f = t / (3 * (6/29)^2) + 4/29 = 0.00030353 / 0.128419 + 0.137931 = 0.140295; L = 116 * 0.140295 - 16 = 0.2742.
    expect(hexToLab('#010101')[0]).toBeCloseTo(0.2742, 3);
  });
});
