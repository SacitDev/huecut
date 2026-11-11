/**
 * What the app knows about the device, as a type. The detection lives in `platform/device.ts`; the type sits here so the machine
 * can read it without importing platform code.
 */

/** `phone`: coarse pointer and the shorter screen side under 600 CSS px; `tablet`: coarse, 600 px or more. */
export type DeviceClass = 'phone' | 'tablet' | 'computer';

export interface DeviceInfo {
  readonly class: DeviceClass;
  readonly webgl2: boolean;
  /** `navigator.deviceMemory` at most 2 GB, where the browser reports it (Safari does not). */
  readonly lowMemory: boolean;
  readonly saveData: boolean;
  readonly touch: boolean;
}
