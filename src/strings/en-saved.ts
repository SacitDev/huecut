/** Saved and example copy: imported directly, not through `en.ts`. */

/** The one control for how a session is saved: what automatic saving keeps, the three modes and each status, one text everywhere. */
export const saveCopy = {
  heading: 'Saving this session',
  /** Said first, in the open: what matters most for privacy; the rest of what saving keeps is one tap away in My look. */
  shared: 'Saving keeps your answers and a smaller photo of your face. Anyone using this browser can see them, so do not use it on a shared computer.',
  told: 'When saving is on, it keeps your ideas and any AI pictures you add too. They stay in this browser on this device until you delete them or the browser clears them. So this is not a backup.',
  more: 'What is kept',
  choose: 'How long to keep this session',
  modes: { until_deleted: 'Keep until I delete it', day: 'Keep for 24 hours', off: "Delete and don't save" },
  rules: "Keep for 24 hours deletes it the next time the app runs after 24 hours. Delete and don't save removes any saved copy now, for good. Then nothing is saved until you choose a period again.",
  change: 'Change saving',
  hide: 'Close',
  replace: 'Replace it',
  start: 'Find my look',
  example: 'You are looking at an example, so nothing is saved.',
  status: {
    nothing: 'Nothing is saved yet.',
    saving: 'Saving',
    untilDeleted: 'Saved on this device until you delete it.',
    day: (left: string) => `Saved on this device. ${left}`,
    hoursLeft: (hours: number) => (hours === 1 ? 'About 1 hour left.' : `About ${String(hours)} hours left.`),
    underAnHour: 'Less than an hour left.',
    off: 'Not saved on this device.',
    undeleted: 'Could not delete it. Close other tabs and reload.',
    lastGood: 'Could not save. Your last save is still here.',
    notSaved: 'Could not save. Keep this tab open.',
    taken: 'Another session is saved here. Replace it?',
  },
} as const;

export const savedCopy = {
  title: 'Saved',
  favourites: {
    heading: 'Your favourites',
    groups: { cut: 'Styles', colour: 'Colour looks', beard: 'Beards' },
    empty: 'No favourites yet. Tap the heart on a style, colour look or beard in Explore to keep it here.',
    explore: 'Explore styles and colours',
    failed: 'Your favourites could not be shown. They need a connection the first time.',
    remove: (name: string) => `Remove ${name}`,
    removed: (name: string) => `${name} removed from Saved.`,
  },
  session: { heading: 'This session' },
  data: {
    heading: 'Your data on this device',
    delete: 'Delete my data',
    ask: "This deletes your favourites and your theme and motion settings. It deletes your saved session with its photo and pictures, and your saving choice. It also deletes the library pictures you have viewed and the face tools you downloaded. The photos open in My look are cleared too. If you chose Delete and don't save, that choice stays, so nothing is saved until you choose a period again.",
    yes: 'Yes, delete my data',
    no: 'Keep my data',
    busy: 'Deleting your data',
    done: 'Your data was deleted from this device.',
    partly: 'Some of your data could not be deleted. Try again with other tabs of this app closed.',
  },
  example: {
    badge: 'Example',
    on: (model: string, collection: string) => `On a fictional model: ${model.toLowerCase()}, ${collection.toLowerCase()}.`,
    another: 'Try another model',
    mine: 'Start with my photo',
    failed: 'The example could not open. It needs a connection the first time.',
    tryAgain: 'Try again',
  },
} as const;
