/** The fictional profiles of the engine bars: the core sets, the face cases and one seeded answer profile as the screens ask it. */
import type { Question, QuestionsFile } from '../../src/domain/content/types.ts';
import type { Collection, CoreSetName } from '../../src/domain/content/values.ts';
import type { IdeaKind } from '../../src/domain/engine/recommend.ts';
import { toFacts, type AnswerValue, type Answers } from '../../src/domain/facts/answers-to-facts.ts';
import type { Confidence } from '../../src/domain/facts/registry.ts';
import type { FaceFacts, FusedValue } from '../../src/domain/fuse/fuse.ts';
import { coreQuestions, fitToPerson, isNotSure, orderOf } from '../../src/features/consult/questions.ts';

/** One core set the bars run on. */
export interface CoreSet { readonly name: CoreSetName; readonly kinds: readonly IdeaKind[]; readonly collections: readonly Collection[] }
/** The five core sets. */
export const CORE: readonly CoreSet[] = [
  { name: 'cut/salon', kinds: ['cut'], collections: ['salon'] },
  { name: 'cut/barbering', kinds: ['cut'], collections: ['barbering'] },
  { name: 'both/salon', kinds: ['cut', 'colour'], collections: ['salon'] },
  { name: 'both/barbering', kinds: ['cut', 'colour'], collections: ['barbering'] },
  { name: 'colour/any', kinds: ['colour'], collections: ['salon', 'barbering'] },
];

/** The harness's fictional faces: the app itself never names a face shape. */
export const FACES = {
  long: [0.72, 0.84, 132, 0.38], balanced: [0.83, 0.85, 132, 0.38], round: [0.95, 0.88, 146, 0.38],
  square: [0.87, 0.95, 120, 0.46], narrow: [0.82, 0.74, 132, 0.3],
} as const;
export type FaceName = keyof typeof FACES;
/** The face case names. */
export const FACE_NAMES = Object.keys(FACES) as readonly FaceName[];

/** Fused face numbers at one confidence, for one fictional face. */
export function faceFacts([w, j, angle, chin]: readonly number[], confidence: Confidence = 'high'): FaceFacts {
  const v = (value: number | undefined): FusedValue => ({ value: value ?? 0, confidence, photos: 3, agreeing: 3, approximate: false });
  return {
    frontal: { hairlineVisible: true, values: { width_to_length: v(w), length_to_width: v(1 / (w ?? 1)), forehead_share: v(1), lower_share: v(1), jaw_to_cheek: v(j), jaw_angle: v(angle), chin_to_jaw: v(chin) } },
    profile: { hairlineVisible: false, values: {} },
  };
}

const TEXTURES = ['straight', 'wavy', 'curly', 'coily', 'mixed'];

/** One core-answers profile as the screens ask it; texture cycles, "Not sure" one time in ten, wishes as given. */
export function answersFor(file: QuestionsFile, setName: CoreSetName, rnd: () => number, n: number, wish: boolean): Answers {
  const answers: Record<string, AnswerValue> = {};
  const answer = (q: Question, order: readonly number[], under?: string): number | undefined => {
    if (q.type === 'wishes') {
      const at = wish ? Math.floor(rnd() * q.options.length) : -1;
      answers[q.id] = { chosen: at < 0 ? [] : [at] };
      return undefined;
    }
    const sure = order.filter((i) => q.options[i] && !isNotSure(q.options[i]));
    const unsure = q.options.findIndex(isNotSure);
    const textureAt = q.fact === 'hair.texture' ? q.options.findIndex((o) => 'value' in o && o.value === TEXTURES[n % TEXTURES.length]) : -1;
    const at = textureAt >= 0 ? textureAt : unsure >= 0 && rnd() < 0.1 ? unsure : (sure[Math.floor(rnd() * sure.length)] ?? 0);
    answers[q.id] = { chosen: [at], ...(under === undefined ? {} : { under }) };
    return at;
  };
  for (;;) {
    const facts = toFacts(answers, file.questions, null, null);
    const found = coreQuestions(file, setName, facts).find((a) => answers[a.question.id] === undefined);
    if (!found) return answers;
    const next = fitToPerson(found, facts, [setName.endsWith('barbering') ? 'barbering' : 'salon']);
    const at = answer(next.question, next.order);
    const follow = at === undefined ? undefined : next.followUps.get(at);
    if (follow) answer(follow, orderOf(follow), next.question.id);
  }
}
