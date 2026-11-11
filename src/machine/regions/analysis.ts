/**
 * The `analysis` region: the photo queue, one photo at a time, each analysed as soon as
 * it is added once the core tools are ready or degraded. Results are stored by photo id; a removed photo's late result
 * is dropped, and a photo whose run ended in a worker crash or watchdog expiry goes back in the queue once.
 */
import { and, or, stateIn } from 'xstate';
import { consultSetup, inFlightId } from '../setup.ts';

const coreAvailable = or([
  stateIn('#consult.session.models.core.ready'),
  stateIn('#consult.session.models.core.degraded'),
]);

export const analysisRegion = consultSetup.createStateConfig({
  initial: 'idle',
  states: {
    idle: { always: { guard: and([coreAvailable, 'hasNextPhoto']), target: 'working' } },
    working: {
      // Superseded work is not cancelled: PHOTOS.REMOVE leaves this run alone and its reply is dropped.
      entry: 'claimPhoto',
      invoke: {
        id: 'analyse',
        src: 'analysePhoto',
        input: ({ context }) => ({ photoId: inFlightId(context) }),
        onDone: {
          target: 'idle',
          actions: { type: 'storeAnalysis', params: ({ event }) => ({ output: event.output }) },
        },
        onError: { target: 'idle', actions: 'failInFlight' },
      },
    },
  },
});
