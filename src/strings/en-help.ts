/**
 * Help, privacy and method copy: imported directly, not through `en.ts`.
 * The privacy and trademark lines are `en.home.privacy` and `en.home.trademark`, one text each across the app.
 */
export const helpCopy = {
  title: 'Help',
  all: 'All help',
  topicsLabel: 'Help topics',
  topics: {
    privacy: 'Privacy',
    method: 'How this is measured',
    prompts: 'Using prompts',
    credits: 'Credits and licences',
  },
  how: {
    heading: 'How it works',
    steps: [
      'Add a photo. The app finds your face points and hair outline on your device.',
      'Answer a few questions about your hair and your routine.',
      'See ideas that suit your hair, with the reasons and what to ask your stylist.',
      'Try them on. The app writes the prompts, and pictures of you are made in your own ChatGPT or Gemini. Add them to your board.',
    ],
  },
  feedback: {
    heading: 'Feedback',
    body: 'Tell us what worked and what did not. It helps the next person.',
  },
  privacy: {
    metricsHeading: 'What the app does not do',
    noAccounts: 'There are no analytics and no accounts.',
    metrics: 'MediaPipe, the tool that finds your face points, has built-in usage metrics. The app blocks them, so they are never sent.',
    blocked: (count: number) => `Blocked in this session: ${String(count)}.`,
    blockedUnknown: 'The count for this session could not be read.',
    storedHeading: 'What is stored, and where',
    stored: [
      {
        what: 'Your saved session',
        where:
          "Saving is automatic. Opening Huecut saves nothing about you. Saving starts with your first answer or photo. It keeps your answers, your ideas, your AI pictures and one smaller photo of your face. That photo has no camera data and no record of where it was taken. All of it is kept in your browser on this device. By default it stays until you delete it or your browser clears it, so it is not a backup. If you choose Keep for 24 hours, it is deleted the next time the app runs after 24 hours. If you choose Delete and don't save, any saved copy is deleted. Nothing more is saved until you choose a period again.",
      },
      {
        what: 'Your other photos, previews and hair masks',
        where: 'In this page only. They go when you remove them, start again or close the tab.',
      },
      {
        what: 'Favourites and settings',
        where: 'The names of what you saved, your theme and motion settings and your last Explore filters, in your browser. Nothing personal. They stay until you delete them.',
      },
      {
        what: 'App files, library pictures you have viewed and the face tools',
        where: 'In your browser, so the app opens quickly and works offline. They stay until you delete them or your browser clears them.',
      },
    ],
    deleteHint: 'Delete my data on the Saved screen removes all of this.',
    safari: 'Safari may clear stored data after 7 days without a visit.',
    sharedOrigin:
      'This site shares its web address with other small sites by the same author. Sites on one address can read each other\'s browser storage, and they can change the offline copy of this app. If you do not want your session stored here, choose Delete and don\'t save; it does not protect the offline copy.',
    testHeading: 'Test it yourself',
    airplane: 'After the face tools have loaded once, switch on airplane mode. The app still opens and reads your photo. Pictures and extra tools you have not opened yet need a connection.',
    offline: 'After the first visit, what you have used works offline.',
  },
  method: {
    intro: 'The app finds points on your face and an outline of your hair, on your device. It turns them into a few proportions. They are compared only with your own face, never with anyone else.',
    estimatesHeading: 'Estimates',
    estimates: 'Every number is an estimate. Without your camera\u2019s details we cannot tell how far away it was. So treat the readings as a good guess. A photo taken close up bends the proportions. When we can tell, the reading says "approximate (close-up photo)". Treat every result as an opinion to take to your stylist.',
    hintsHeading: 'Hints',
    hints: 'Colour readings are hints, because the light in a photo changes them. Your undertone is always your own answer. It is never read from the photo.',
    preferenceHeading: 'Our styling preference',
    preference: 'Your hair, your routine and what you asked for come first. When a photo gives face numbers, the app also sorts the cuts that fit those by what each cut does around your face. That part is this app\u2019s own styling preference, and no face needs changing. If you tell us what you want, you can keep your proportions, play them up or balance them. With no wish, you get a mix of those.',
    phonesHeading: 'Phones and tablets',
    phones: 'The 3D view and Refine my hair outline run on computers only in this version. In a test that slowed a computer down to act like a phone, they used too much memory or ran too slowly. That test is preliminary, and the app has not been tried on real phones.',
    labelsHeading: 'Colour labels',
    labels: 'Each colour idea has one of three labels. They are Plausible, Uncertain or Best done by a colourist. Each says why and what to ask. Plausible is never shown on a guess. If a missing answer could change it, the label is Uncertain until you answer.',
    silver: 'With mostly grey hair, a silver gloss mostly tones the grey you already have. The label counts it as lightening from your darkest strands, so it can be more cautious than you need.',
    toolsHeading: 'Tools on this device',
    toolOn: 'Works on this device.',
    tools: { depth: 'See it in 3D', sam: 'Refine my hair outline' },
    toolLine: (name: string, state: string) => `${name}: ${state}`,
    toolsReading: 'Checking this device.',
  },
  prompts: {
    stepsHeading: 'From prompt to picture',
    steps: [
      'Tap Copy prompt on an idea.',
      'Open ChatGPT or Gemini and start a new chat.',
      'Attach your photo and paste the prompt.',
      'Save the picture it makes, then come back and add it on Try it on.',
    ],
    tipsHeading: 'Tips',
    tips: [
      'Start a new chat for each look.',
      'Always attach your own photo, never an AI picture.',
      'We ask the AI to keep your face, skin tone, eye colour and glasses. It should also keep your hairline, density, curl pattern, beard and background.',
      'If the face looks different, Face looks different? copies a short repair prompt for the same chat.',
      'AI often gives more hair or a fuller hairline than you have. Your stylist knows what your hair can do.',
    ],
  },
  credits: {
    authorHeading: 'Developed by Michael',
    author: 'Huecut is designed and developed by Michael (SacitDev on GitHub).',
    keepNotice: 'If you reuse or change this code, the MIT licence says you must keep this notice. Copyright (c) 2026 Michael (SacitDev)',
    app: 'Huecut is free and open source under the MIT licence.',
    pictures: 'The models in the library are fictional. Their pictures are made as illustrations. They use the same licence as the app.',
    heading: 'Tools and fonts the app runs on',
    items: [
      'MediaPipe Tasks Vision with its face, hand, pose and hair models: Apache 2.0.',
      'ONNX Runtime Web: MIT.',
      'Transformers.js: Apache 2.0.',
      'Depth Anything V2 Small: Apache 2.0.',
      'SAM 2.1 Hiera Tiny: Apache 2.0.',
      'React, XState and Three.js: MIT.',
      'Comlink: Apache 2.0.',
      'Bricolage Grotesque and Figtree fonts: SIL Open Font License 1.1.',
      'Phosphor icons: MIT.',
    ],
    more: 'Every licence in full:',
    licenceLinks: { thirdParty: 'tools, fonts and models', own: 'Huecut (MIT)' },
  },
  install: {
    heading: 'Use it like an app',
    body: 'You can add Huecut to your phone or computer and open it like an app. An installed app still keeps your data only on this device, so it is not a backup. On iPhone, installing makes it less likely that the browser clears your data, but it can still happen.',
    button: 'Install Huecut',
    ios: 'Share, then Add to Home Screen',
  },
  offline: 'You are offline. Explore and anything you have already used still work.',
} as const;
