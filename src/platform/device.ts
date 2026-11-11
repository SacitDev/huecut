/**
 * What the app knows about the device: its class, by the rule below, and the
 * few capabilities that switch features. Read once at start; the pure rules below are unit-tested. The types live in
 * `domain/device.ts` and are re-exported here for platform callers.
 */
import type { DeviceClass, DeviceInfo } from '../domain/device.ts';

export type { DeviceClass, DeviceInfo };

/** The phone / tablet threshold on the shorter screen side, in CSS px. */
export const PHONE_MAX_SHORT_SIDE_PX = 600;
/** `navigator.deviceMemory` at or below this counts as low memory. */
export const LOW_MEMORY_GB = 2;

/** The device class: without a coarse pointer a computer; with one, a phone below 600 px on the screen's shorter side, else a tablet. */
export function deviceClassOf(coarsePointer: boolean, screenWidthPx: number, screenHeightPx: number): DeviceClass {
  if (!coarsePointer) return 'computer';
  return Math.min(screenWidthPx, screenHeightPx) < PHONE_MAX_SHORT_SIDE_PX ? 'phone' : 'tablet';
}

/** An app's built-in browser (Instagram, Facebook and so on), where downloads and sharing often fail, names itself in the user agent. */
export function isInAppBrowser(userAgent: string): boolean {
  return /\b(FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|TikTok|BytedanceWebview|musical_ly|Pinterest|Line\/|MicroMessenger|Twitter)\b/i.test(userAgent);
}

interface NavigatorExtras {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
}

function hasWebGl2(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2');
  // Give the probe context back at once: contexts are a limited resource.
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

/** Reads the device once. */
export function readDevice(): DeviceInfo {
  const nav = navigator as Navigator & NavigatorExtras;
  return {
    class: deviceClassOf(matchMedia('(pointer: coarse)').matches, screen.width, screen.height),
    webgl2: hasWebGl2(),
    lowMemory: nav.deviceMemory !== undefined && nav.deviceMemory <= LOW_MEMORY_GB,
    saveData: nav.connection?.saveData === true,
    touch: navigator.maxTouchPoints > 0,
  };
}

/**
 * WebKit, the engine of Safari and of every browser on iPhone and iPad: its user agent names AppleWebKit without Chrome, Chromium or Edge (Firefox names none
 * of them). No feature test reveals the crash below, so the user agent is the only way to tell.
 */
export const isWebKit = (userAgent: string = navigator.userAgent): boolean => userAgent.includes('AppleWebKit/') && !/(Chrome|Chromium|Edg)\//.test(userAgent);

/**
 * Whether page and element transitions play: every browser that has them except WebKit, with motion on. WebKit crashed the tab on a view
 * transition into Explore and on Explore's own morph followed by Back, so there a change happens at once. Read at each change, as the motion setting can change.
 */
export const transitionsPlay = (): boolean =>
  'startViewTransition' in document && !isWebKit() && document.documentElement.dataset.motion !== 'reduce' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
