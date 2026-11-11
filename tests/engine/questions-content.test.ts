/** The real question file as the screens ask it: follow-ups on the same screen, who is asked what, and the agreed words. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { QuestionsFile } from '../../src/domain/content/types.ts';
import { CORE_SETS, type Collection, type CoreSetName } from '../../src/domain/content/values.ts';
import { toFacts, type Answers } from '../../src/domain/facts/answers-to-facts.ts';
import { recommend, type EngineContent } from '../../src/domain/engine/recommend.ts';
import type { Facts } from '../../src/domain/facts/registry.ts';
import { chosenAfter, coreQuestions, fitToPerson } from '../../src/features/consult/questions.ts';
import { engineFrom } from './engine-content.ts';

const loaded = engineFrom(join(fileURLToPath(new URL('../../', import.meta.url)), 'content'));
if (!loaded.content) throw new Error(loaded.note);
const content: EngineContent = loaded.content;

const file = JSON.parse(readFileSync(new URL('../../content/questions.json', import.meta.url), 'utf8')) as QuestionsFile;
const question = (id: string) => {
  const q = file.questions.find((x) => x.id === id);
  if (!q) throw new Error(`no question ${id}`);
  return q;
};
const facts = (values: Readonly<Record<string, unknown>>): Facts =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'answered' }]));
const ids = (set: CoreSetName, f: Facts = {}): string[] => coreQuestions(file, set, f).map((a) => a.question.id);
/** The follow-ups a question opens in this set, as [the option's value, the follow-up's id]. */
const opens = (set: CoreSetName, id: string): (readonly [unknown, string])[] => {
  const asked = coreQuestions(file, set, {}).find((a) => a.question.id === id);
  return [...(asked?.followUps ?? [])].map(([i, f]) => [(asked?.question.options[i] as { value?: unknown }).value, f.id] as const);
};

describe('the grey goal sits on the grey screen', () => {
  it('opens under every amount of grey, not under none or not sure', () => {
    expect(opens('colour/any', 'grey-amount')).toEqual([5, 20, 40, 62.5, 87.5].map((v) => [v, 'colour-grey-goal']));
  });

  it('is asked once in Colour, under the amount; in Both, where the amount is not asked, under the grey direction', () => {
    expect(opens('colour/any', 'pref-colour-direction').some(([, id]) => id === 'colour-grey-goal')).toBe(false);
    expect(opens('both/salon', 'pref-colour-direction')).toContainEqual(['grey', 'colour-grey-goal']);
  });
});

describe('"when was your perm" only follows a perm, relaxer or keratin', () => {
  const asked = (value?: readonly string[]) => ids('colour/any', value === undefined ? {} : facts({ 'hair.chemical_history': value })).includes('colour-last-chemical-service');

  it('is skipped after dye alone and after nothing; asked after those three, and while the history is unknown', () => {
    expect([asked(['home_dye', 'bleach']), asked(['none'])]).toEqual([false, false]);
    expect([asked(['relaxer_perm']), asked(['keratin', 'home_dye']), asked()]).toEqual([true, true, true]);
  });
});

describe('the hairline follow-up', () => {
  it('opens under the later recession stages only', () => {
    expect(opens('cut/barbering', 'hair-recession-stage')).toEqual([3, 4, 5, 6, 7].map((v) => [v, 'wish-hairline']));
  });

  it('writes the hairline wish, in both directions', () => {
    const q = question('wish-hairline');
    expect(q.fact).toBe('wish.hairline');
    expect(q.options.map((o) => ('value' in o ? o.value : undefined))).toEqual(['soften', 'emphasise', null]);
  });
});

/** The agreed wording of the changed questions, word for word. */
const WORDING: readonly (readonly [id: string, prompt: string, help: string | undefined, labels: readonly string[] | null])[] = [
  ['hair-current-length', 'How far does your hair reach when you gently pull it straight?', 'Go by the longest part. Curls count stretched out.', ['A few centimetres', 'Above my chin', 'To my chin', 'To my shoulders', 'Past my shoulders', 'Halfway down my back or longer', 'Not sure']],
  ['hair-resting-length', 'Now where does it sit when it is dry and you leave it alone?', "Curls spring up, so this is often shorter. Don't pull it.", ['A few centimetres', 'Above my chin', 'To my chin', 'To my shoulders', 'Past my shoulders', 'Halfway down my back or longer', 'Not sure']],
  ['pref-fringe', 'Would you like a fringe?', 'A fringe (bangs) is hair cut to fall over your forehead.', ['Yes, I would like one', 'Maybe, show me some', 'No fringe, please', 'Not sure']],
  ['pref-change-amount', 'How different do you want to look?', undefined, ['Much the same, just fresher', 'Clearly different, still easy to wear', 'A big change', 'Not sure']],
  ['life-grow-out-goal', 'Are you letting your hair grow longer?', undefined, ['Yes, I am growing it', 'No', 'Not sure']],
  ['pref-top-length', 'How long would you like the hair on top?', 'A finger is about 7 cm long.', ['Very short, clipper length', 'Short, up to about 5 cm', 'Medium, about 5-10 cm', 'Long, over 10 cm', 'Not sure']],
  ['wish-hairline', 'Would you like your hairline to show less?', undefined, ['Yes, show it less', 'No, I am happy to show it', 'Not sure']],
  ['beard-style', 'What facial hair do you have now?', undefined, ['Clean shaven, or only a moustache or goatee', 'Stubble', 'A short beard', 'A medium beard', 'A full beard', 'Not sure']],
  ['colour-natural-level', 'What colour does your hair grow at the roots, before any dye?', 'Look at new growth. Between two? Choose the darker. If you have grey, go by the darkest hair you see. These shades are a guide, not a measurement.', null],
  ['colour-current-level-lengths', 'How light or dark is the rest of your hair today, away from the roots?', 'Sun and dye can change it. Between two? Choose the darker. These shades are a guide, not a measurement.', null],
  ['pref-colour-direction', 'What would you like your colour to do?', undefined, ['Go lighter', 'Go darker', 'Same depth, warmer or cooler', 'Refresh what I have', 'Cover or blend my grey', 'Try a bright colour', 'Go back to my natural colour', 'Not sure, show me ideas']],
];

describe('the agreed words', () => {
  it.each(WORDING)('%s', (id, prompt, help, labels) => {
    const q = question(id);
    expect(q.prompt).toBe(prompt);
    expect(q.help).toBe(help);
    if (labels) expect(q.options.map((o) => o.label)).toEqual(labels);
  });

  it('names the darkening products in plain words on the history question, and keeps the undertone question as it was', () => {
    expect(question('hair-chemical-history').options.map((o) => o.label)).toContain('Black or coloured henna, or a product that darkens grey');
    expect(question('look-undertone').options.map((o) => o.label)).toEqual(['Warm', 'Cool', 'Neutral', 'Olive', 'Not sure']);
  });

  it('keeps density and strand as two questions on one screen', () => {
    expect(opens('cut/salon', 'hair-density').map(([, id]) => id)).toEqual(['hair-strand', 'hair-strand', 'hair-strand', 'hair-strand']);
    expect(question('hair-strand').fact).toBe('hair.strand');
    expect(question('hair-density').fact).toBe('hair.density');
  });
});

describe('resting length', () => {
  it('is on every set that picks a cut', () => {
    for (const set of ['cut/salon', 'cut/barbering', 'both/salon', 'both/barbering'] as const) expect(file.core_sets[set]).toContain('hair-resting-length');
  });

  it('is asked of curly and coily hair and skipped for very short hair', () => {
    const asked = (texture: string, length: string) => ids('cut/barbering', facts({ 'hair.texture': texture, 'hair.current_length': length })).includes('hair-resting-length');
    expect([asked('curly', 'chin'), asked('coily', 'long')]).toEqual([true, true]);
    expect([asked('coily', 'very_short'), asked('straight', 'chin'), asked('wavy', 'long')]).toEqual([false, false, false]);
  });
});

describe('wanted colour family', () => {
  it('opens on the direction screen under lighter, darker, tone and not sure', () => {
    expect(opens('both/salon', 'pref-colour-direction').filter(([, id]) => id === 'colour-wanted').map(([value]) => value)).toEqual(['lighter', 'darker', 'tone', null]);
    expect(opens('colour/any', 'pref-colour-direction').map(([, id]) => id)).toEqual(['colour-wanted', 'colour-wanted', 'colour-wanted', 'colour-wanted']);
  });

  it('offers every family, up to two, with "any or not sure" as the way out', () => {
    const q = question('colour-wanted');
    expect(q.max).toBe(2);
    expect(q.options.map((o) => o.label)).toEqual(['Blonde', 'Brown', 'Red or copper', 'Black', 'Grey or silver', 'Any, or not sure']);
  });

  it('says so plainly exactly where a collection has no looks in a family', () => {
    const has = (family: unknown, collection: Collection) => content.looks.some((l) => l.traits.family === family && l.collections.includes(collection));
    for (const o of question('colour-wanted').options) {
      if (!('value' in o) || o.value === null || 'fact' in o) continue;
      for (const c of ['salon', 'barbering'] as const) expect(o.note?.[c] !== undefined, `${String(o.value)} in ${c}`).toBe(!has(o.value, c));
    }
  });

  // Medium brown: at the same depth a brown and a red both fit, so the wish decides which comes first (lighter pieces stay out).
  const asked = { 'colour.natural_level': 4, 'colour.current_level_lengths': 4, 'hair.chemical_history': ['none'], 'hair.condition': 'healthy', 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none', 'pref.colour_direction': 'tone' };
  const colours = (extra: Readonly<Record<string, unknown>>, collection: Collection) => recommend(facts({ ...asked, ...extra }), content, { kinds: ['colour'], collections: [collection], count: 6 }).picks;
  const family = (id: string) => content.looks.find((l) => l.id === id)?.traits.family;

  it('puts the wanted family first without faulting or relabelling the rest', () => {
    const [before, after] = [colours({}, 'salon'), colours({ 'pref.colour_family': ['brunette'] }, 'salon')];
    expect(family(after[0]?.id ?? '')).toBe('brunette');
    expect(family(before[0]?.id ?? '')).not.toBe('brunette');
    expect(after.every((p) => p.excluded.length === 0)).toBe(true);
    const labels = new Map(before.map((p) => [p.id, p.label]));
    for (const p of after) if (labels.has(p.id)) expect(p.label).toBe(labels.get(p.id));
  });

  it('leaves a list unchanged when the collection has none of that family', () => {
    expect(colours({ 'pref.colour_family': ['red_copper'] }, 'barbering').map((p) => p.id)).toEqual(colours({}, 'barbering').map((p) => p.id));
  });
});

describe('the core sets', () => {
  it.each([
    // Measured when the sets were chosen: growing longer moved 28.5% of picks for people growing it, glasses 4.2% of all, so glasses go
    // to Improve. Density and strand stay, on one screen; styling time and the trim interval are two questions on one screen.
    ['cut/salon', ['hair-texture', 'hair-current-length', 'hair-resting-length', 'taste-cuts', 'hair-density', 'pref-fringe', 'pref-change-amount', 'life-grow-out-goal', 'styling-time', 'wishes']],
    // Fringe moved 23.1% of picks, more than density (6.2%) and how different (8.1%) together. Growing out is asked under the current length.
    // Scars to cover is asked of every barbering cut client, at 11 questions (a barber's objections to earlier lists turned on scars).
    ['cut/barbering', ['hair-texture', 'hair-current-length', 'hair-resting-length', 'taste-cuts', 'pref-top-length', 'pref-fringe', 'styling-time', 'hair-recession-stage', 'scalp-marks-cover', 'beard-style', 'wishes']],
    // A stylist's review: the henna type and the bleach count follow the history, each shown only to those it concerns; scars in
    // barbering Both.
    ['colour/any', ['pref-colour-direction', 'colour-natural-level', 'hair-chemical-history', 'colour-henna-type', 'colour-bleach-count', 'colour-current-level-lengths', 'colour-last-chemical-service', 'hair-condition', 'grey-amount', 'look-undertone', 'pref-colour-upkeep', 'dye-reaction']],
    // Women in Both keep density.
    ['both/salon', ['hair-texture', 'hair-current-length', 'hair-resting-length', 'taste-cuts', 'hair-density', 'styling-time', 'pref-colour-direction', 'colour-natural-level', 'hair-chemical-history', 'colour-henna-type', 'colour-bleach-count', 'colour-current-level-lengths', 'hair-condition', 'dye-reaction']],
    // Upkeep moved 28.4% of picks for men in Both, recession 2.6%.
    ['both/barbering', ['hair-texture', 'hair-current-length', 'hair-resting-length', 'taste-cuts', 'pref-top-length', 'styling-time', 'scalp-marks-cover', 'pref-colour-direction', 'colour-natural-level', 'hair-chemical-history', 'colour-henna-type', 'colour-bleach-count', 'colour-current-level-lengths', 'hair-condition', 'dye-reaction']],
  ] as const)('%s', (set, list) => { expect(file.core_sets[set]).toEqual(list); });
});

/** The questions only people with henna or lightened hair see. */
const ONLY_SOME = new Set(['colour-henna-type', 'colour-bleach-count']);

describe('every conditional path through a core set', () => {
  /**
   * Every conditional path through a core set: each answer that a later `show_if` reads or that opens a follow-up is tried,
   * "Not sure" included. A screen is a core question with the follow-ups its answer opens; questions counts those follow-ups too.
   */
  function paths(set: CoreSetName): { screens: number[]; questions: number[]; extra: number[] } {
    const read = new Set(file.questions.flatMap((q) => Object.keys(q.show_if ?? {})));
    const signature = (q: QuestionsFile['questions'][number], i: number): string => {
      const o = q.options[i];
      const writes = !o ? [] : 'sets' in o ? Object.entries(o.sets) : q.fact && 'value' in o ? [[q.fact, o.value]] : [];
      return JSON.stringify([o && 'follow_up' in o ? o.follow_up : null, writes.filter(([k]) => read.has(String(k)))]);
    };
    const out = { screens: [] as number[], questions: [] as number[], extra: [] as number[] };
    const walk = (answers: Answers, screens: number, questions: number): void => {
      const next = coreQuestions(file, set, toFacts(answers, file.questions, null, null)).find((a) => answers[a.question.id] === undefined);
      if (!next) {
        out.screens.push(screens);
        out.questions.push(questions);
        out.extra.push(Object.keys(answers).filter((id) => ONLY_SOME.has(id)).length);
        return;
      }
      const tried = new Set<string>();
      next.question.options.forEach((_, i) => {
        const sig = next.question.type === 'wishes' ? 'one' : signature(next.question, i);
        if (tried.has(sig)) return;
        tried.add(sig);
        walk({ ...answers, [next.question.id]: { chosen: [i] } }, screens + 1, questions + 1 + (next.followUps.has(i) ? 1 : 0));
      });
    };
    walk({}, 0, 0);
    return out;
  }

  it('keeps every conditional path within the limit: 10 screens for Cut and Colour, 11 for barbering cuts, 12 for Both, 13 for barbering Both, one more for each of the henna type and the bleach count a path opens', () => {
    // Scars to cover are asked in both barbering sets; the henna type and the bleach count only after henna or lightening, a screen
    // each where a person needs them.
    const BASE: Readonly<Record<CoreSetName, number>> = { 'cut/salon': 10, 'cut/barbering': 11, 'colour/any': 10, 'both/salon': 12, 'both/barbering': 13 };
    const counts = CORE_SETS.map((set) => {
      const p = paths(set);
      const over = p.screens.map((s, i) => s - (p.extra[i] ?? 0));
      return { set, paths: p.screens.length, screens: [Math.min(...p.screens), Math.max(...p.screens)], questions: [Math.min(...p.questions), Math.max(...p.questions)], base: Math.max(...over), both: p.extra.filter((e) => e === 2).length };
    });
    for (const c of counts) console.log(`core set ${c.set}: ${String(c.paths)} paths, ${String(c.screens[0])}-${String(c.screens[1])} screens, ${String(c.questions[0])}-${String(c.questions[1])} questions answered, ${String(c.both)} paths open both the henna type and the bleach count`);
    for (const c of counts) expect(c.base, c.set).toBeLessThanOrEqual(BASE[c.set]);
  });
});

describe('pictures and swatches', () => {
  const pictures = JSON.parse(readFileSync(new URL('../../content/pictures.json', import.meta.url), 'utf8')) as Readonly<Record<string, unknown>>;
  const illustrations = (id: string) => question(id).options.map((o) => ('illustration' in o ? o.illustration : undefined));
  const LENGTHS = ['very-short', 'short', 'chin', 'shoulder', 'long', 'very-long'].map((l) => `q-length-${l}`);

  it('draws the six lengths on both length questions, and leaves "Not sure" to its words', () => {
    expect(illustrations('hair-current-length')).toEqual([...LENGTHS, undefined]);
    expect(illustrations('hair-resting-length')).toEqual([...LENGTHS, undefined]);
  });

  it('shows a shade swatch for each level on both colour questions', () => {
    expect(illustrations('colour-natural-level')).toEqual([...Array.from({ length: 10 }, (_, i) => `q-swatch-${String(i + 1)}`), undefined]);
    expect(illustrations('colour-current-level-lengths')).toEqual([1, 3, 5, 7, 9].map((n) => `q-swatch-${String(n)}`).concat([undefined as unknown as string]));
  });

  it('shows real looks on fringe and top length, each picture from the library and for its collection', () => {
    const keys = ['pref-fringe', 'pref-top-length'].flatMap((id) => question(id).options.flatMap((o) => Object.entries('picture' in o ? o.picture : {})));
    expect(keys).toHaveLength(10);
    for (const [collection, key] of keys) {
      expect(key.startsWith(`${collection}-`), key).toBe(true);
      expect(key in pictures, key).toBe(true);
    }
  });

  it('every picture and swatch keeps a label of its own', () => {
    for (const q of file.questions) for (const o of q.options) if ('illustration' in o || 'picture' in o) expect(o.label.trim().length, q.id).toBeGreaterThan(1);
  });

  it('tells people what to look for on the two answers they get wrong most', () => {
    expect(question('hair-texture').help).toBe('Let it dry with no products. Go by most of your hair. Straight falls flat, wavy bends in loose S shapes, curly makes loops, coily makes tight zigzags or tiny coils.');
    expect(question('hair-chemical-history').options.map((o) => o.label)).toEqual(expect.arrayContaining(['Colour done at a salon', 'Highlights or balayage (lighter streaks)', 'Bright colour, such as pink or blue', 'Colour remover, to take dye out', 'Plant henna (red-orange powder)']));
  });
});

describe('what each person is shown', () => {
  const asked = (set: CoreSetName, id: string) => {
    const a = coreQuestions(file, set, {}).find((x) => x.question.id === id);
    if (!a) throw new Error(`${id} is not in ${set}`);
    return a;
  };
  const cards = (texture: string | undefined, collections: readonly Collection[], set: CoreSetName = 'cut/salon') => {
    const a = fitToPerson(asked(set, 'taste-cuts'), facts(texture === undefined ? {} : { 'hair.texture': texture }), collections);
    return a.order.flatMap((i) => { const o = a.question.options[i]; return o && 'value' in o && o.value !== null ? [String(o.value)] : []; });
  };

  it('shows the six cards of the person\'s own collection and texture, and never another person\'s', () => {
    expect(cards('wavy', ['salon'])).toEqual(['classic-pixie', 'french-bob', 'collarbone-lob-blunt', 'classic-shag', 'long-u-layers', 'long-wolf-cut']);
    expect(cards('coily', ['barbering'], 'cut/barbering')).toEqual(['curly-taper-defined', 'afro-taper-round', 'curly-quiff', 'short-twists-fade', 'curly-flow', 'waves-360']);
  });

  it('shares six between the models in play when the person shows both collections, or has not said their texture', () => {
    expect(cards('straight', ['salon', 'barbering'])).toEqual(['classic-pixie', 'buzz-tapered', 'french-bob', 'textured-crop-low-taper', 'collarbone-lob-blunt', 'side-part-classic']);
    expect(cards(undefined, ['salon'])).toEqual(['classic-pixie', 'tapered-twa', 'french-bob', 'shaped-round-afro', 'collarbone-lob-blunt', 'curly-bob-rounded']);
  });

  it('keeps "None of these" last, and stops at three taps', () => {
    const a = fitToPerson(asked('cut/salon', 'taste-cuts'), facts({ 'hair.texture': 'wavy' }), ['salon']);
    expect(a.question.options[a.order.at(-1) ?? -1]?.label).toBe('None of these, or not sure');
    const [one, two, three, four] = a.order as [number, number, number, number];
    const full = { chosen: [one, two, three] };
    expect(chosenAfter(a.question, full, four)).toBe(full);
    expect(chosenAfter(a.question, full, one)).toEqual({ chosen: [two, three] });
    expect(chosenAfter(a.question, full, a.order.at(-1) ?? -1)).toEqual({ chosen: [a.order.at(-1)] });
  });

});

describe('the wish list', () => {
  const asked = (set: CoreSetName) => {
    const a = coreQuestions(file, set, {}).find((x) => x.question.id === 'wishes');
    if (!a) throw new Error(`no wishes in ${set}`);
    return a;
  };
  const measured = (values: Readonly<Record<string, unknown>>): Facts => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { key, value, confidence: 'high', source: 'measured' }]));
  const wishes = (f: Facts, set: CoreSetName = 'cut/salon') => {
    const a = fitToPerson(asked(set), f, ['salon']);
    const key = (i: number) => { const o = a.question.options[i]; return o && 'fact' in o ? `${o.fact}:${o.value}` : ''; };
    return { shown: a.order.map(key), all: a.question.options.length };
  };

  it('shows the whole wish list in its own order, and a reading of the face changes nothing (no rule ties a wish to the face)', () => {
    const { shown, all } = wishes({});
    expect(shown).toHaveLength(all);
    for (const value of ['longer', 'similar']) expect(wishes(measured({ 'face.forehead_share': value })).shown).toEqual(shown);
  });

  it('does not ask the hairline wish twice at a later recession stage', () => {
    const hairline = (stage: number) => wishes(facts({ 'hair.recession_stage': stage }), 'cut/barbering').shown.filter((k) => k.startsWith('wish.hairline'));
    expect(hairline(4)).toEqual([]);
    expect(hairline(2)).toHaveLength(2);
  });
});
