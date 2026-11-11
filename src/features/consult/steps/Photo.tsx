/**
 * My look: Photo: add photos, with no limit; once one is in, the photos added come
 * first, each one's hints in words and the main photo chosen, so the result of adding one is on a phone's first screen,
 * and adding more follows; the first-visit download line with its progress and Cancel; the photo guide and the privacy line. "Continue
 * without a photo" is offered only while there is none. After a reload it says why the photos are gone.
 */
import { PHONE_ANALYSED_PHOTOS, type ConsultContext } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { StepLayout } from '../StepLayout.tsx';
import { ToolsStatus } from '../ToolsStatus.tsx';
import type { StepProps } from '../useConsult.ts';
import routeStyles from '../ConsultRoute.module.css';
import { PhotoAdd } from './PhotoAdd.tsx';
import { PhotoAvoid, PhotoGuide } from './PhotoGuide.tsx';
import { PhotoList } from './PhotoList.tsx';

const t = en.consult.photo;

/** On phones only the 15 clearest photos are analysed, and the screen says so. */
const saysClearest = (c: ConsultContext): boolean => c.device.class === 'phone' && c.photos.length > PHONE_ANALYSED_PHOTOS;

export function Photo({ port, view }: StepProps) {
  const { context } = view;
  // A photo that failed still goes on: the face card step says what happened to it.
  const added = context.photos.length > 0;
  const actions = added ? (
    <Button onClick={() => { port.send({ type: 'NEXT' }); }}>
      {en.consult.continue}
    </Button>
  ) : (
    <Button variant="text" onClick={() => { port.send({ type: 'ANALYSIS.SKIP' }); }}>
      {t.withoutPhoto}
    </Button>
  );
  return (
    <StepLayout title={en.consult.steps.photo} onBack={port.back} actions={actions}>
      {view.reloaded && <p className={routeStyles.notice} data-tone="warn">{t.reloaded}</p>}
      {/* The list renders nothing until a photo is in, so putting it first never moves the picker's own node: it keeps its focus and busy state. */}
      <PhotoList port={port} view={view} />
      <PhotoAdd send={port.send} touch={context.device.touch} added={added} />
      {saysClearest(context) && <p>{t.clearest}</p>}
      <ToolsStatus view={view} port={port} />
      <PhotoGuide />
      <PhotoAvoid />
      <p className={routeStyles.small}>{t.privacy}</p>
    </StepLayout>
  );
}
