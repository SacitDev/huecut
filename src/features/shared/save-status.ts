/**
 * What the saving control knows and says: My look's port as the screens outside its feature see it, the state of the session's saving, and the
 * one short line that states it. Pure, so the rules are unit-tested.
 */
import { SESSION_TTL_MS, type SaveMode } from '../../domain/session/session-data.ts';
import type { ConsultContext, ConsultEvent, SaveStatus, Step } from '../../machine/consult.types.ts';
import { saveCopy } from '../../strings/en-saved.ts';

/**
 * What these screens need of My look's machine; `features/consult` implements a wider port, and features may not import
 * each other. Null where My look has not started in this page.
 */
export interface SessionPort {
  readonly subscribe: (listener: () => void) => () => void;
  readonly view: () => { readonly context: ConsultContext; readonly step: Step | null };
  readonly send: (event: ConsultEvent) => void;
}

/** How one session is saved, whether a machine holds it or it only lies in storage. */
export interface SaveState {
  readonly mode: SaveMode;
  readonly status: SaveStatus;
  /** A good save exists, so a refused write has not cost it. */
  readonly stored: boolean;
  readonly savedAt: number | null;
}

const HOUR_MS = 3_600_000;
const t = saveCopy.status;

/** "About 22 hours left.", from when a session kept for 24 hours was last saved. It is deleted at the next run after that. */
export function timeLeftWords(savedAt: number, nowMs: number): string {
  const left = savedAt + SESSION_TTL_MS - nowMs;
  return left < HOUR_MS ? t.underAnHour : t.hoursLeft(Math.round(left / HOUR_MS));
}

/** The status in one short line. A save is "saved" only after it committed; "Saving" stands until then. */
export function statusLine({ mode, status, stored, savedAt }: SaveState, nowMs: number): string {
  if (mode === 'off') return status === 'refused' ? t.undeleted : t.off;
  switch (status) {
    case 'idle':
      return t.nothing;
    case 'saving':
      return t.saving;
    case 'refused':
      return stored ? t.lastGood : t.notSaved;
    case 'taken':
      return t.taken;
    case 'saved':
      return mode === 'until_deleted' ? t.untilDeleted : t.day(timeLeftWords(savedAt ?? nowMs, nowMs));
  }
}
