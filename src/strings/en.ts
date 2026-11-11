/**
 * Every UI string, in plain British English, sentence case, no exclamation marks.
 * Features and the app read these and pass them to `ui/` components as props.
 */

import { consultCopy } from './en-consult.ts';
import { exploreCopy } from './en-explore.ts';

export const en = {
  app: {
    name: 'Huecut',
    homeLink: 'Huecut, home',
    skipToContent: 'Skip to content',
    /** While a screen's own code loads; here, so the words do not wait for that code. */
    opening: { explore: 'Opening Explore', saved: 'Opening Saved', help: 'Opening Help' },
  },
  nav: {
    label: 'Main',
    explore: 'Explore',
    myLook: 'My look',
    saved: 'Saved',
    help: 'Help',
    settings: 'Settings',
  },
  sheet: {
    close: 'Close',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    themes: { system: 'System', light: 'Light', dark: 'Dark' },
    motion: 'Motion',
    motionHint: 'Reduce turns off movement in the app, even when your device allows it.',
    motions: { device: 'Follow my device', reduce: 'Reduce' },
  },
  home: {
    promiseLines: ['Find a cut and colour', 'that suit your hair,', 'and know why.'],
    subline: 'Advice from your photo and your answers. Free. The app never uploads your photos.',
    expectations:
      'Pictures of you with each look are made in your own ChatGPT or Gemini. The app writes the prompts and lines up the results.',
    findMyLook: 'Find my look',
    continueLook: 'Continue where you left off',
    startAgain: {
      action: 'Start again',
      title: 'Start again?',
      body: 'This replaces the session saved on this device. The saved one stays until your first new answer or photo is saved.',
      yes: 'Yes, start again',
      no: 'Keep my session',
    },
    explore: 'Explore styles and colours',
    scrollCue: 'Scroll',
    example: 'See an example first',
    answersOnly: 'No photo? Get ideas from answers only',
    wallTitle: 'More than 200 cuts and about 70 colour looks, for women and men.',
    /** The library looks Home names, so their names follow the language like the library's own. */
    looks: {
      frenchBob: 'French bob', auburnMoneyPiece: 'Auburn money piece', modernPompadour: 'Modern pompadour', silverGloss: 'Silver gloss',
      italianBob: 'Italian bob', afroBlowout: 'Afro blowout', curlyBobFringe: 'Curly bob with fringe', classicScissorTaper: 'Classic scissor taper',
      wolfCut: 'Wolf cut', burstFade: 'Burst fade', curtainFringeLob: 'Lob with a curtain fringe', charcoalGrey: 'Charcoal grey',
      greyBlendBlonde: 'Grey blending with blonde', modernPompadourFade: 'Modern pompadour with fade', longButterfly: 'Long butterfly cut', classicPixie: 'Classic pixie',
    },
    lines: {
      title: 'It starts with the lines of your face.',
      points: [
        'Hairline, brows, jaw: drawn on your own photo, on your own device.',
        'No scores. Just what a stylist would look at.',
        'Then cuts and colours picked for your hair, each with its reasons.',
      ],
    },
    colour: {
      title: 'Every colour gets an honest answer.',
      body: 'Each colour idea says how likely it is for your hair, why, and what to ask your colourist.',
      examples: [
        { name: 'Golden blonde', label: 'Plausible', why: 'Up to two levels lighter, on healthy hair that has not been coloured.' },
        { name: 'Plum violet', label: 'Best done by a colourist', why: 'Hair this dark has to be lightened first for a violet to show.' },
        { name: 'Mahogany', label: 'Plausible', why: 'Close to the depth you have now, so it needs no lightening.' },
        { name: 'Beige blonde', label: 'Uncertain', why: 'Three or four levels lighter, so it depends on your hair\'s history.' },
      ],
    },
    closing: {
      title: 'Then see it on you.',
      body: 'Copy a prompt into your own ChatGPT or Gemini, and put the results side by side.',
    },
    privacy:
      'The app never uploads your photos. It hands a copy only to the app you choose when you tap Share or Download.',
    trademark:
      'ChatGPT is a trademark of OpenAI and Gemini a trademark of Google; Huecut is not affiliated with either.',
  },
  inAppBrowser: {
    message: 'This page is open inside another app. Photos, saving and sharing work better in Safari or Chrome.',
    copyLink: 'Copy link',
    linkCopied: 'Link copied',
    copyFailed: 'This app does not allow copying. Press and hold the link to copy it:',
    howToOpen: 'How to open it',
    howToOpenSteps:
      "Tap this app's menu (often three dots or a share icon). Then choose Open in browser, Open in Safari or Open in Chrome.",
  },
  error: {
    title: 'This screen could not be shown',
    body: 'Part of the app stopped unexpectedly. Reloading the page usually brings it back.',
    action: 'Reload the page',
    code: 'Error code: screen_failed',
  },
  notFound: {
    title: 'There is no page at this address',
    body: 'The link may be out of date.',
    action: 'Go to Home',
  },
  explore: exploreCopy,
  consult: consultCopy,
} as const;
