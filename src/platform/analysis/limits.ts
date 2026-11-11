/**
 * Time limits of the analysis worker, per device class, set from measured runs: the phone and tablet compute
 * watchdogs are 10 times that operation's measured median on the class's profile, and computers copy the tablet's; the 30 s stall timer
 * and the 20 s boot timeout were checked on the throttled phone profile and kept.
 */
import type { DeviceClass } from '../device.ts';

/** The calls that run in the serial compute lane, each under its own watchdog. */
export type ComputeOp = 'analyse' | 'depth' | 'selectHair' | 'tint';

export interface Limits {
  /** No `ready` within this time means `boot_failed` (a backstop behind the bootstrap's `.catch`). */
  readonly bootMs: number;
  /** A download with no progress for this long is aborted with `network`; a slow, moving one never is. */
  readonly stallMs: number;
  /** Watchdog per compute call, started when the lane dispatches it. */
  readonly computeMs: Readonly<Record<ComputeOp, number>>;
}

/** 20 s boot timeout; the slowest boot measured was 119 ms, on the phone profile at 6x. */
export const BOOT_TIMEOUT_MS = 20_000;
/**
 * 30 s without progress. Measured on the phone profile at 6x: a 48.7 MB download at about 1.2 MB/s took 40 s and
 * finished; the longest gap without progress in any load was 6.1 s (starting depth or SAM); a held request was
 * stopped with `network` 31.4-31.8 s after its last progress.
 */
export const STALL_TIMEOUT_MS = 30_000;

/**
 * Phones and tablets: 10 x the measured median of each operation (final run: Chromium 158 headless shell, WASM path, desktop
 * emulation), rounded up to the next second. `selectHair` uses the first tap (image encoder and decoder), because any tap
 * can be a first tap; later taps take 0.15-1 s. `tint` uses its slower variant, the `auto` mask (the segmenter runs again).
 * - tablet: the tablet profile at 4x: analyse 1,499 ms, depth 6,879, first tap 29,938, tint 3,479.
 * - phone: the phone profile at 6x, the slower of its two: analyse 2,181 ms, depth 10,097, first tap 48,180,
 *   tint 5,879.
 * - computer: a copy of the tablet profile measured at 4x, chosen after a first analysis at 6x took 3,965 ms and the
 *   computer's old 4 s limit, set from its own unthrottled run, timed out at 4,448 ms and restarted the worker. An interim choice
 *   from one run per rate, not validated laptop coverage.
 */
const TABLET_MS: Readonly<Record<ComputeOp, number>> = { analyse: 15_000, depth: 69_000, selectHair: 300_000, tint: 35_000 };
const COMPUTE_MS: Readonly<Record<DeviceClass, Readonly<Record<ComputeOp, number>>>> = {
  computer: TABLET_MS,
  tablet: TABLET_MS,
  phone: { analyse: 22_000, depth: 101_000, selectHair: 482_000, tint: 59_000 },
};

/** The limits for one device class. */
export function limitsFor(deviceClass: DeviceClass): Limits {
  return { bootMs: BOOT_TIMEOUT_MS, stallMs: STALL_TIMEOUT_MS, computeMs: COMPUTE_MS[deviceClass] };
}
