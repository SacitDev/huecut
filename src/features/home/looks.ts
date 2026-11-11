/** The fictional library pictures the homepage shows: both collections, every texture, cuts and colours. */
import type { en } from '../../strings/en.ts';

/** One look's picture in `public/library`, the key of its name in `en.home.looks` (none when it goes unnamed), and the block shown until it loads. */
export interface Look {
  readonly path: string;
  readonly name?: keyof (typeof en)['home']['looks'];
  readonly average: string;
}

const WIDTHS = [480, 960, 1086];
/** The URL of one width of a library picture. */
export const urlOf = (path: string, width: number): string => `${import.meta.env.BASE_URL}library/${path}-${String(width)}.avif`;
/** Every width of a library picture, under the site's path `base`: the build's preload reads this too. */
export const srcSetUnder = (base: string, path: string): string => WIDTHS.map((w) => `${base}library/${path}-${String(w)}.avif ${String(w)}w`).join(', ');
/** Every width of a library picture. */
export const srcSet = (path: string): string => srcSetUnder(import.meta.env.BASE_URL, path);
/** How wide a photograph on Home is drawn. */
export const FIGURE_SIZES = '(min-width: 640px) 56vw, 100vw';
/** The picture of the first screen, preloaded by the build. */
export const FIRST_LOOK = 'salon-straight-wavy/french-bob-front';

/** The looks the first screen moves through on its own: a woman, then a man, each with a change of hair. */
export const REST_LOOKS: readonly Look[] = [
  { path: FIRST_LOOK, name: 'frenchBob', average: '#a1938c' },
  { path: 'salon-straight-wavy/auburn-money-piece-front', name: 'auburnMoneyPiece', average: '#a08e86' },
  { path: 'barbering-straight-wavy/pompadour-modern-front', name: 'modernPompadour', average: '#ada19d' },
  { path: 'barbering-straight-wavy/natural-silver-gloss-front', name: 'silverGloss', average: '#b2a7a3' },
];

/** The base picture the app's own face lines were measured on. */
export const LINES_PICTURE: Look = { path: 'salon-straight-wavy/model-base-front', average: '#9a8c84' };

export const WALL: readonly Look[] = [
  { path: 'salon-straight-wavy/italian-bob-front', name: 'italianBob', average: '#a4958e' },
  { path: 'barbering-curly-coily/afro-blowout-front', name: 'afroBlowout', average: '#8e827e' },
  { path: 'salon-curly-coily/curly-bob-with-fringe-front', name: 'curlyBobFringe', average: '#928884' },
  { path: 'barbering-straight-wavy/scissor-taper-classic-front', name: 'classicScissorTaper', average: '#ac9f9b' },
  { path: 'salon-straight-wavy/wolf-cut-front', name: 'wolfCut', average: '#9b8c84' },
  { path: 'barbering-straight-wavy/burst-fade-front', name: 'burstFade', average: '#aca09b' },
  { path: 'salon-straight-wavy/curtain-fringe-lob-front', name: 'curtainFringeLob', average: '#9e8f86' },
  { path: 'barbering-straight-wavy/charcoal-grey-all-over-front', name: 'charcoalGrey', average: '#aba09d' },
  { path: 'salon-straight-wavy/grey-blend-blonde-front', name: 'greyBlendBlonde', average: '#a4958d' },
  { path: 'barbering-straight-wavy/pompadour-modern-front', name: 'modernPompadourFade', average: '#ada19d' },
];

/** One face, three haircuts: what the last panel promises. */
export const CLOSING_LOOKS: readonly Look[] = [
  { path: 'salon-straight-wavy/french-bob-front', name: 'frenchBob', average: '#a1938c' },
  { path: 'salon-straight-wavy/long-butterfly-front', name: 'longButterfly', average: '#9a897f' },
  { path: 'salon-straight-wavy/classic-pixie-front', name: 'classicPixie', average: '#aa9e98' },
];

export const COLOURS: readonly Look[] = [
  { path: 'salon-straight-wavy/golden-blonde-foilayage-back', average: '#b2a194' },
  { path: 'salon-straight-wavy/plum-violet-all-over-back', average: '#8f7988' },
  { path: 'salon-straight-wavy/mahogany-demi-refresh-back', average: '#887c7c' },
  { path: 'salon-straight-wavy/beige-blonde-colour-correction-back', average: '#aea49d' },
];
