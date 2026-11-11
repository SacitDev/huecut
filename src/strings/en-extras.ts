/** Copy of the colour preview, tap-to-select and the 3D view: imported directly, not through `en.ts`. */

export const extrasCopy = {
  notReady: 'This tool is not available yet.',
  preview: {
    label: 'Rough preview',
    placed: 'Your colourist places the highlights',
    busy: 'Putting this colour on your hair',
    shown: (name: string) => `${name}, rough preview on your photo`,
    familyLabel: 'Colour family',
    looksLabel: 'Colour looks',
    noLooks: 'No colour looks are ready to show yet.',
    notShowable: 'This look is placed by hand, so the rough preview cannot show it. Your colourist can show you how it would sit.',
    neutral: 'Neutral grey view',
    neutralHint: 'A plain grey surround, the way colourists judge colour.',
    compare: 'Before and after',
    compareValue: (percent: number) => `${String(percent)} percent of your own photo showing`,
    noBefore: 'Your own photo could not be shown here, so there is nothing to compare this with.',
    compareHint: 'Slide towards the right to see more of your own photo.',
    failed: 'The preview could not be made.',
    tryAgain: 'Try again',
  },
  refine: {
    open: 'Tap your hair to make the preview fit better',
    hint: (mb: number) => `Downloads the tap tool, about ${String(Math.round(mb))} MB the first time.`,
    back: 'Back to the preview',
    computerOnly: 'Tapping your hair to fit the preview is available on a computer.',
  },
  tap: {
    intro: 'Tap your hair to add it to the outline, or choose Not hair and tap what should come out.',
    photo: 'Your photo with the hair outline. Use the buttons below to mark a spot without tapping.',
    add: 'Hair',
    remove: 'Not hair',
    modeLabel: 'What a tap marks',
    move: { up: 'Up', down: 'Down', left: 'Left', right: 'Right' },
    moveLabel: 'Move the spot',
    mark: 'Mark this spot',
    busy: 'Reading your tap. The first one takes a few seconds.',
    spot: (across: number, down: number) => `Spot ${String(across)} percent across and ${String(down)} percent down.`,
    updated: 'Hair outline updated.',
    failed: 'That tap could not be read. Try again.',
    use: 'Use this outline',
    reset: 'Start over',
  },
  gate: {
    failed: 'This tool could not load. Everything else keeps working without it.',
  },
  threeD: {
    busy: 'Working out the depth of your photo',
    stage: 'Your photo in 3D',
    left: 'Turn left',
    right: 'Turn right',
    up: 'Tilt up',
    down: 'Tilt down',
    reset: 'Reset',
    controls: 'Move the view',
    facing: (yaw: number, tilt: number) => {
      const parts = [yaw === 0 ? '' : `turned ${String(Math.abs(yaw))} degrees ${yaw < 0 ? 'left' : 'right'}`, tilt === 0 ? '' : `tilted ${String(Math.abs(tilt))} degrees ${tilt > 0 ? 'up' : 'down'}`].filter(Boolean).join(', ');
      return parts === '' ? 'Facing front.' : `${parts.charAt(0).toUpperCase()}${parts.slice(1)}.`;
    },
    failed: 'The 3D view could not open in this browser. Your face card is ready without it.',
    lost: 'The 3D view stopped. Close this sheet to start again.',
  },
} as const;
