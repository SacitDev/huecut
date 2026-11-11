/** Ideas copy: imported directly, not through `en.ts`. */

const plural = (n: number, one: string, many: string): string => (n === 1 ? `1 ${one}` : `${String(n)} ${many}`);

/** Length estimates rest on coarse bands, so growth is said as a band, never a figure. */
const cmBand = (cm: number): string => (cm <= 5 ? 'up to about 5 cm' : cm <= 10 ? 'about 5 to 10 cm' : cm <= 20 ? 'about 10 to 20 cm' : 'more than 20 cm');
const timeBand = (weeks: number): string => (weeks <= 26 ? 'a few months' : weeks <= 52 ? 'up to a year' : 'more than a year');

export const ideasCopy = {
  count: {
    label: 'How many ideas?',
    fewer: 'Fewer',
    more: 'More',
    /** Said after Fewer and More to screen readers only, so each button's name stays whole. */
    unit: 'ideas',
    bothHint: 'Half are cuts and the rest colour looks; an odd number gives one more cut.',
  },
  colours: {
    legend: 'Colour in your results',
    hint: 'For every idea, prompt and card below.',
    modes: { keep: 'Keep my colour', one: 'One colour for all', pick: 'Pick colours for me' },
    which: 'Which colour?',
    /** The colour goes into the prompt and the card; the library picture keeps its model's own colour. */
    withColour: (name: string, label: string) => `In the prompt and the card: ${label === '' ? name : `${name} (${label})`}. The picture keeps the model's own colour.`,
    noneFits: 'None of these colours fits what you told us, so your ideas stay in your own colour.',
    referralKept: 'So your ideas stay in your own colour.',
    keep: 'Keep my colour',
  },
  sections: { cut: 'Cuts', colour: 'Colours' },
  rank: { ourPick: 'Our pick', alsoWorth: 'Also worth trying', yours: 'You added this' },
  because: 'Because…',
  feasibility: {
    today: 'Works with your hair today',
    poorFit: 'Not the best match for your hair texture',
    growth: (cm: number, weeks: number | null) =>
      weeks === null ? `Needs ${cmBand(cm)} more length` : `Needs ${cmBand(cm)} more length, ${timeBand(weeks)} of growth`,
    adapting: (notes: string) => `Needs adapting: ${notes}`,
    adaptingFor: { texture: 'for your hair texture', density: 'for your hair density' },
  },
  answerToKnow: (prompt: string) => `Answer ‘${prompt}’ to narrow it down`,
  dependsOn: (noun: string) => `Depends on your ${noun}`,
  dependsOnAnswer: (prompt: string) => `Depends on your answer to ‘${prompt}’`,
  answer: (prompt: string) => `Answer ‘${prompt}’`,
  /** Nouns for the facts that most often decide more ("Depends on your hair texture"); others name their question. */
  nouns: {
    'hair.texture': 'hair texture',
    'hair.current_length': 'current length',
    'hair.density': 'hair density',
    'hair.strand': 'strand thickness',
    'hair.condition': 'hair condition',
    'hair.chemical_history': 'colour history',
    'colour.natural_level': 'natural colour level',
    'colour.current_level_lengths': 'colour level at the lengths',
    'colour.current_tone': 'hair tone today',
    'look.undertone': 'undertone',
    'pref.colour_upkeep': 'colour upkeep',
    'pref.fringe': 'fringe choice',
    'life.styling_minutes': 'styling time',
  } as Readonly<Partial<Record<string, string>>>,
  closeQuestion: 'Done',
  answersUpdated: 'Your ideas are up to date.',
  excluded: 'This does not fit what you told us:',
  excludedKeep: 'It stays on your list unless you remove it.',
  beforeAnyColour: 'Before any colour',
  moreAboutLook: 'More',
  detailsLoading: 'Getting the details ready',
  detailsFailed: 'The details of this idea could not load. Reloading the page usually brings them back.',
  seeItOnMe: 'See it on me',
  remove: 'Remove',
  removed: (name: string) => `${name} removed from your list.`,
  moveEarlier: 'Move earlier',
  moveLater: 'Move later',
  moved: (name: string, n: number, total: number) => `${name} moved to ${String(n)} of ${String(total)}.`,
  addFromExplore: 'Add from Explore',
  listFull: 'Your list holds 8 ideas, the most it can. Remove one to add this.',
  together: {
    open: 'Pair a cut with a colour',
    title: 'Pair a cut with a colour',
    hint: 'Pick one cut and one colour look to try as one picture.',
    cut: 'Cut',
    colour: 'Colour',
    set: 'Try these together',
    change: 'Change',
    remove: 'Remove',
    saved: 'Pair saved. It comes first on Try it on.',
    removed: 'Pair removed.',
  },
  improve: {
    open: 'Improve my ideas',
    title: 'Improve my ideas',
    hint: 'Optional questions. Your ideas update as you answer.',
    none: 'There are no more questions for what you chose.',
    showAll: 'Show all',
    couldChange: (n: number) => (n === 1 ? 'Your answer could change 1 of your ideas.' : `Your answer could change up to ${String(n)} of your ideas.`),
  },
  shortfall: {
    found: (n: number) => (n === 0 ? 'No idea fits your hair and all your answers now, so change an answer or add one from Explore.' : n === 1 ? 'We found 1 that suits your hair and limits.' : `We found ${String(n)} that suit your hair and limits.`),
    answers: 'What you told us rules these out:',
    unmet: 'No idea here can do what you asked:',
    removed: (n: number) => `You removed ${plural(n, 'idea', 'ideas')}.`,
    library: (what: string) => `The library has no more ${what} for what you chose to see.`,
    kinds: { cut: 'cuts', colour: 'colour looks' },
  },
  aiPick: {
    action: (n: number) => `Let ChatGPT or Gemini pick your best ${n === 1 ? 'one' : String(n)}`,
    hint: 'Copy the prompt, then paste it into ChatGPT or Gemini with your photo.',
    copied: 'Prompt copied',
    copiedLive: 'Prompt copied. Now open ChatGPT or Gemini, add your photo and paste it.',
    refused: 'This browser did not allow copying. The prompt is selected in the box below: copy it from there.',
    selectAll: 'Select all',
    promptLabel: 'The prompt',
    failed: (code: string) => `The prompt could not be made. Error code: ${code}`,
  },
  faceCard: 'See my face card',
  worthAsking: {
    title: 'Worth asking a colourist about',
    intro: 'These are not full matches for what you asked. A colourist can tell you whether they would work for you.',
    why: {
      salon_look: 'This colour is from Women\'s styles, pictured on longer hair. It is one colour all over, so ask a colourist how it would look on your hair.',
    },
    add: 'Add to my ideas',
    added: (name: string) => `${name} added to your list.`,
  },
  /** Said once above the colours when no look here can take the hair the way asked: it is at that end of the scale, or what was told leaves those looks out. */
  givesWay: (way: 'darker' | 'lighter', atEnd: boolean) =>
    // A stated direction admits only looks that go that way, so no other colour idea stands in.
    atEnd ? `Your hair is already as ${way === 'darker' ? 'dark' : 'light'} as it gets, so no colour here can take it further.` : `No look here can make your hair ${way} with your answers.`,
  addPhoto: 'Add a photo',
  addAnother: 'Add another photo',
  next: 'Try them on',
} as const;
