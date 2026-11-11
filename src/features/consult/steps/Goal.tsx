/**
 * The goal question: Cut, Colour or Both, and "Show me: Women's styles / Men's styles / All", the
 * person's own choice, which the app never guesses. Nothing is preselected; Continue is offered once both are chosen.
 */
import { useId } from 'react';
import type { Collection } from '../../../domain/content/values.ts';
import { CONSULT_GOALS } from '../../../domain/session/session-data.ts';
import { en } from '../../../strings/en.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { PhotoFigure } from '../PhotoFigure.tsx';
import { StepLayout } from '../StepLayout.tsx';
import type { StepProps } from '../useConsult.ts';
import routeStyles from '../ConsultRoute.module.css';

const t = en.consult.goal;
type Show = keyof typeof t.collections;
const SHOWS: Readonly<Record<Show, readonly Collection[]>> = { salon: ['salon'], barbering: ['barbering'], all: ['salon', 'barbering'] };
const SHOW_ORDER: readonly Show[] = ['salon', 'barbering', 'all'];

/** Which "Show me" option the chosen collections are, or null before a choice. */
function showOf(collections: readonly Collection[]): Show | null {
  if (collections.length === 0) return null;
  return collections.length > 1 ? 'all' : (collections[0] ?? null);
}

export function Goal({ port, view }: StepProps) {
  const { prefs, mainPhotoId, skipped } = view.context;
  const hintId = useId();
  const show = showOf(prefs.collections);
  const ready = prefs.goal !== null && show !== null;
  const actions = (
    <Button unavailable={!ready} {...(ready ? {} : { describedBy: hintId })} onClick={() => { port.send({ type: 'NEXT' }); }}>
      {en.consult.continue}
    </Button>
  );
  return (
    <StepLayout title={en.consult.steps.goal} onBack={port.back} aside={skipped || mainPhotoId === null ? null : <PhotoFigure photoId={mainPhotoId} />} actions={actions}>
      <OptionGroup legend={t.goalLegend} twoPerRow>
        {CONSULT_GOALS.map((goal) => (
          <OptionTile key={goal} name="goal" value={goal} label={t.goals[goal]} checked={prefs.goal === goal} onChange={(value) => { port.send({ type: 'PREFS.SET', goal: value }); }} />
        ))}
      </OptionGroup>
      <OptionGroup legend={t.collectionLegend} twoPerRow>
        {SHOW_ORDER.map((s) => (
          <OptionTile key={s} name="show" value={s} label={t.collections[s]} checked={show === s} onChange={(value) => { port.send({ type: 'PREFS.SET', collections: SHOWS[value] }); }} />
        ))}
      </OptionGroup>
      {!ready && (
        <p id={hintId} className={routeStyles.small}>
          {t.needBoth}
        </p>
      )}
    </StepLayout>
  );
}
