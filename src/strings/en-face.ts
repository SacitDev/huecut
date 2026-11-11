/** The face card step's copy; imported directly, not through `en.ts`. */

/** "about 34 MB the first time": an extra's first download, rounded to whole MB. */
const firstTime = (mb: number): string => `about ${String(Math.round(mb))} MB the first time`;
/** "a, b and c". */
const listed = (names: readonly string[]): string => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`);

/** Every sentence and label on Your face card. */
export const faceCopy = {
  next: 'Choose what to change',
  backToIdeas: 'Back to my ideas',
  canvas: (names: readonly string[]) => `Your photo with lines on the ${listed(names.map((n) => n.toLowerCase()))}.`,
  reading: 'Reading your photo.',
  wait: 'You can go on. Your card will wait for you.',
  noneRead: 'None of your photos could be read, so your ideas will come from your answers.',
  chooseAnother: 'Choose another photo',
  addAnother: 'Add another photo',
  save: {
    button: 'Save my face card',
    saving: 'Making your face card',
    shareTitle: 'My face card',
    shared: 'Face card shared.',
    downloaded: 'Face card saved to your downloads.',
    failed: 'The face card could not be made in this browser.',
  },
  more: {
    heading: 'More with your photo',
    refine: 'Refine my hair outline',
    refineHint: (mb: number) => `Tap your hair so the outline fits it better; ${firstTime(mb)}.`,
    threeD: 'See it in 3D',
    threeDHint: (mb: number) => `To look at, not to measure; ${firstTime(mb)}.`,
    blocked: {
      computer_only: 'Available on a computer',
      no_webgl2: '3D view needs WebGL, which this browser has turned off. Your face card is ready without it.',
      low_memory: 'The 3D view needs more memory than this device has. Your face card is ready without it.',
      crashed_last_time: 'This tool stopped the page last time, so it is off for now on this device.',
      out_of_memory: 'This device ran out of memory twice, so this tool is off until you start again.',
    },
  },
  extra: {
    downloading: 'Getting this tool ready. First time only.',
    threeDName: '3D view of your photo, for looking only, not for measuring.',
  },
  explain: {
    button: 'Copy a prompt to explain my face card',
    hint: 'Paste it into ChatGPT or Gemini. The app does not read the answer.',
    copied: 'Prompt copied',
    copiedLive: 'Prompt copied. Now open ChatGPT or Gemini and paste it.',
    refused: 'This browser did not allow copying. The prompt is selected in the box below: copy it from there.',
    box: 'The prompt',
    selectAll: 'Select all',
    failed: (code: string) => `The prompt to explain your face card could not be made. Error code: prompt_${code}`,
  },
  colour: {
    heading: 'Colour hints',
    intro: 'Read from your photo in its own light, so they are hints only.',
    hair: (shade: string) => `Hair colour: close to ${shade} (hint)`,
    skin: (depth: string) => `Skin tone: ${depth.toLowerCase()} (hint)`,
    undertone: (answer: string) => `Undertone: ${answer.toLowerCase()} (your answer)`,
  },
  mover: {
    ask: 'Do the lines sit in the wrong place?',
    open: 'Move the lines',
    intro: 'Drag a dot to the right place, or pick a part and use the arrows. Left and right are as you see the photo. Your facts update as you go.',
    canvas: 'Your photo with its lines and a dot on each part you can move',
    partLegend: 'Part to move',
    parts: { hairline: 'Hairline', chin: 'Chin', cheek_left: 'Left cheek', cheek_right: 'Right cheek', jaw_left: 'Left jaw', jaw_right: 'Right jaw' },
    moveLabel: (part: string) => `Move the ${part.toLowerCase()}`,
    nudge: { up: 'Up', down: 'Down', left: 'Left', right: 'Right' },
    moved: (part: string) => `${part} moved`,
    putBack: (part: string) => `Put the ${part.toLowerCase()} back`,
    putAllBack: 'Put all the lines back as found',
    putBackDone: (part: string) => `${part} is back where it was found.`,
    allBackDone: 'All the lines are back where they were found.',
    done: 'Done',
  },
} as const;
