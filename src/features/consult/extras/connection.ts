/**
 * How the extras reach the session: `app/compose.ts` hands over the port, each extra's machine
 * state and the worker once, when the machine starts. `TryColour` and the sheets it opens then read the machine through
 * this hook; screens still only render its state and send events.
 */
import { useSyncExternalStore } from 'react';
import type { ConsultEvent } from '../../../machine/consult.types.ts';
import type { Supervisor } from '../../../platform/analysis/supervisor.ts';
import { connectHairTools } from '../../../platform/hair-tools.ts';
import type { ExtraModel } from '../../../worker/protocol.ts';
import type { ConsultPort, ConsultView } from '../useConsult.ts';

/** One extra's state in the `models` region. */
export type ExtraState = 'check' | 'idle' | 'downloading' | 'ready' | 'unsupported' | 'failed';

export interface ExtrasConnection {
  readonly port: ConsultPort;
  readonly extraState: (model: ExtraModel) => ExtraState;
  /** The session's supervisor, started on first use. */
  readonly worker: () => Supervisor;
}

let connection: ExtrasConnection | null = null;

/** Called once by the composition root, before any screen renders. */
export function connectExtras(made: ExtrasConnection): void {
  connection = made;
  connectHairTools(made.worker);
}

/** What the extras' screens read and send. */
export interface Extras {
  readonly port: ConsultPort;
  readonly view: ConsultView;
  readonly send: (event: ConsultEvent) => void;
  readonly extraState: (model: ExtraModel) => ExtraState;
}

const noSubscription = (): (() => void) => () => undefined;
const noView = (): null => null;

/** The machine's view while the screen is mounted, or null before the composition root has connected. */
export function useExtras(): Extras | null {
  const view = useSyncExternalStore(connection?.port.subscribe ?? noSubscription, connection?.port.view ?? noView);
  if (!connection || !view) return null;
  return { port: connection.port, view, send: connection.port.send, extraState: connection.extraState };
}
