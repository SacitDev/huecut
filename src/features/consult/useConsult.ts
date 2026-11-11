/**
 * My look's port to its machine: the view the screens render, `send`, the selectors and the
 * machine's notices. `app/compose.ts` implements it. Screens render this state and send events; they never decide
 * the flow, and they reach the machine only through these types.
 */
import { useSyncExternalStore } from 'react';
import type { Detail } from '../../domain/content/output.ts';
import type { PhotoId, PictureId } from '../../domain/ids.ts';
import type { Recommendation } from '../../domain/engine/recommend.ts';
import type { PromptPack } from '../../domain/prompts/build.ts';
import type { StylistSheet } from '../../domain/render-model/stylist-sheet.ts';
import type { ConsultSelectors, EnginePick } from '../../machine/consult.selectors.ts';
import type { ConsultContext, ConsultEmitted, ConsultEvent, DownloadKey, Step } from '../../machine/consult.types.ts';

/** The engine's answer as the selectors take it: its picks in engine order, and the whole recommendation. */
export interface ConsultRecommendation {
  readonly picks: readonly EnginePick[];
  /** The colours the cuts can be paired with, best first; empty when none fits or after the referral. */
  readonly colours: readonly EnginePick[];
  readonly engine: Recommendation;
}
/** Details records by id, as `platform/content.ts` loads them: prompts and sheets need the full records. */
export type DetailsOf = (id: string) => Detail | undefined;
/** The prompt pack for the list, built once the screen has the ideas' details (a missing one is left out). */
export type ConsultPrompts = (details: DetailsOf) => PromptPack;
/** One idea's stylist sheet, once its details are loaded; null for an id that is not a cut or a colour look. */
export type ConsultSheet = (details: DetailsOf) => StylistSheet | null;
export type Selectors = ConsultSelectors<ConsultRecommendation, ConsultPrompts, ConsultSheet>;

/** The `core` sub-region: `ready` means available, not loaded in the worker right now. */
export type CoreState = 'idle' | 'loading' | 'ready' | 'degraded' | 'failed';

export interface ConsultView {
  readonly context: ConsultContext;
  /** The step shown, or null before My look has started. */
  readonly step: Step | null;
  readonly core: CoreState;
  /** True while the analysis region is working on a photo. */
  readonly analysing: boolean;
  /** This page was reloaded mid-flow with nothing kept, so the photos were cleared; until a photo is added. */
  readonly reloaded: boolean;
}

/** A step's link: links into the flow go through the URL, so router-sync sends `NAVIGATE` and Back works. */
export const stepHref = (step: Step): string => `#/my-look/${step}`;

export interface ConsultPort {
  readonly subscribe: (listener: () => void) => () => void;
  /** The same object until the machine, apart from download progress, or the reload flag changes (`useSyncExternalStore`). */
  readonly view: () => ConsultView;
  /** The downloads, apart from `view`, so a progress message re-renders only its progress line and not the whole step. */
  readonly download: {
    readonly subscribe: (listener: () => void) => () => void;
    /** How far one is, 0 to 1 (the core tools over their models in load order); null before its first progress. */
    readonly fraction: (model: DownloadKey) => number | null;
    /** The core tools come from the network this time (the first visit), not from the cache. */
    readonly firstCore: () => boolean;
  };
  readonly send: (event: ConsultEvent) => void;
  readonly selectors: Selectors;
  readonly on: (listener: (notice: ConsultEmitted) => void) => () => void;
  /** The in-app Back button: the browser's Back, so the two always agree. */
  readonly back: () => void;
  /** The hair-only version of an AI colour picture, or why there is none. */
  readonly hairOnly: (photo: PhotoId, picture: PictureId) => Promise<Blob | 'no_hair' | 'failed'>;
}

/** What every step screen gets: the port to send through and the view to render. */
export interface StepProps {
  readonly port: ConsultPort;
  readonly view: ConsultView;
}

/** The view, re-rendered on every change of the machine. */
export function useConsultView(port: ConsultPort): ConsultView {
  return useSyncExternalStore(port.subscribe, port.view);
}

/** How far a download is, re-rendering only the component that shows it. */
export function useDownloadFraction(port: ConsultPort, model: DownloadKey): number | null {
  return useSyncExternalStore(port.download.subscribe, () => port.download.fraction(model));
}
