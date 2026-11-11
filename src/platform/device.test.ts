/** The device-class rule and the in-app browser check. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deviceClassOf, isInAppBrowser, isWebKit, readDevice } from './device.ts';

describe('device class', () => {
  it('is phone with a coarse pointer and a shorter side under 600 px, tablet at 600 px or more, else computer', () => {
    expect(deviceClassOf(true, 390, 844)).toBe('phone');
    expect(deviceClassOf(true, 844, 390)).toBe('phone');
    expect(deviceClassOf(true, 599, 1000)).toBe('phone');
    expect(deviceClassOf(true, 600, 960)).toBe('tablet');
    expect(deviceClassOf(true, 1024, 768)).toBe('tablet');
    expect(deviceClassOf(false, 390, 844)).toBe('computer');
    expect(deviceClassOf(false, 1920, 1080)).toBe('computer');
  });
});

describe('reading the device', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks only for what switches a feature: no WebGPU adapter at boot, the worker chooses its own backend', () => {
    const requestAdapter = vi.fn(() => Promise.resolve(null));
    vi.stubGlobal('navigator', { gpu: { requestAdapter }, deviceMemory: 2, connection: { saveData: true }, maxTouchPoints: 0, userAgent: 'x', canShare: () => true });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('screen', { width: 1280, height: 800 });
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    expect(readDevice()).toEqual({ class: 'computer', webgl2: false, lowMemory: true, saveData: true, touch: false });
    expect(requestAdapter).not.toHaveBeenCalled();
  });
});

describe('in-app browser', () => {
  it('recognises the common in-app browsers and not the plain ones', () => {
    expect(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36 TikTok')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBe(false);
    expect(isInAppBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36')).toBe(false);
  });
});

describe('WebKit, where transitions do not play', () => {
  it('is Safari and every iPhone or iPad browser, never Chrome, Edge, Android browsers or Firefox', () => {
    expect(isWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15')).toBe(true);
    expect(isWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1')).toBe(true);
    expect(isWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15')).toBe(true);
    expect(isWebKit('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')).toBe(false);
    expect(isWebKit('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0')).toBe(false);
    expect(isWebKit('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36')).toBe(false);
    expect(isWebKit('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0')).toBe(false);
  });
});
