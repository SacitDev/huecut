/**
 * The `flow` region: what the person sees, one child per URL `#/my-look/<step>`.
 * `NAVIGATE` (from the router only) sits on this compound, one guarded transition per step, so it never re-enters
 * `models` or `analysis`. There is no Analysing step and `NEXT` never waits for analysis.
 */
import { and, not, stateIn } from 'xstate';
import { STEPS, type Step } from '../consult.types.ts';
import { consultSetup } from '../setup.ts';

const reach = (step: Step) => ({ type: 'reach', params: { step } }) as const;
const needsIdeas = (step: Step): boolean => step === 'try-on' || step === 'board';

/** Back, forward and deep links: `canEnter(step)`, and never to the step already shown (no needless re-entry). */
const navigate = STEPS.map((step) => {
  const here = not(stateIn(`#consult.session.flow.${step}`));
  const allowed = { type: 'canNavigateTo', params: { step } } as const;
  return { guard: needsIdeas(step) ? and([allowed, here, 'hasIdeas']) : and([allowed, here]), target: `.${step}` };
});

/** Where a session starts: the restored step, the face card for the example, Goal from answers only, else Photo. */
const start = [
  ...STEPS.map((step) => ({
    guard: { type: 'isResumeAt', params: { step } } as const,
    target: step,
    actions: 'clearResume' as const,
  })),
  { guard: { type: 'isSource', params: { source: 'example' } } as const, target: 'face' },
  { guard: { type: 'isSource', params: { source: 'answers_only' } } as const, target: 'goal' },
  { target: 'photo' },
];

export const flowRegion = consultSetup.createStateConfig({
  initial: 'start',
  on: { NAVIGATE: navigate, 'ANALYSIS.SKIP': { actions: 'skipAnalysis' } },
  states: {
    start: { always: start },
    photo: {
      entry: reach('photo'),
      on: {
        NEXT: { guard: 'hasPhoto', target: 'face' },
        'ANALYSIS.SKIP': { target: 'goal', actions: 'skipAnalysis' },
      },
    },
    // After Ideas, the face card leads back there; before, on to the goal. Its moves of the lines are session inputs.
    face: {
      entry: reach('face'),
      on: {
        NEXT: [{ guard: and(['reachedIdeas', 'hasGoal']), target: 'ideas' }, { target: 'goal' }],
        'ANALYSIS.SKIP': [{ guard: and(['reachedIdeas', 'hasGoal']), target: 'ideas', actions: 'skipAnalysis' }, { target: 'goal', actions: 'skipAnalysis' }],
      },
    },
    goal: { entry: reach('goal'), on: { NEXT: { guard: 'hasGoal', target: 'questions' } } },
    questions: { entry: reach('questions'), on: { NEXT: { guard: 'hasGoal', target: 'ideas' } } },
    ideas: { entry: reach('ideas'), on: { NEXT: { guard: 'hasIdeas', target: 'try-on' } } },
    'try-on': { entry: reach('try-on'), on: { NEXT: 'board' } },
    board: { entry: reach('board') },
  },
});
