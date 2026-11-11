/**
 * My look (`#/my-look/:step`): renders the machine's current step, never the URL's; router-sync
 * keeps the two in step. Before My look has started (the first moment after a link) it names the screen and waits.
 * The saving control is whole on the step this route opened on, however the person came in; on the others it is one
 * line, after the step.
 */
import { useState } from 'react';
import { en } from '../../strings/en.ts';
import type { Step } from '../../machine/consult.types.ts';
import { Progress } from '../../ui/components/Progress.tsx';
import { SaveControl } from '../shared/SaveControl.tsx';
import { StepNotice } from './StepLayout.tsx';
import { Board } from './steps/Board.tsx';
import { Face } from './steps/Face.tsx';
import { Goal } from './steps/Goal.tsx';
import { Ideas } from './steps/Ideas.tsx';
import { Photo } from './steps/Photo.tsx';
import { Questions } from './steps/Questions.tsx';
import { TryOn } from './steps/TryOn.tsx';
import { useConsultView, type ConsultPort, type StepProps } from './useConsult.ts';
import styles from './ConsultRoute.module.css';

/** The screen while My look opens: its name and the words with a moving line, no spinner. */
export function ConsultStarting() {
  return (
    <div className={styles.route}>
      <header className={styles.header}>
        <h1 className={styles.title}>{en.nav.myLook}</h1>
      </header>
      <Progress label={en.consult.starting} value={null} />
    </div>
  );
}

function CurrentStep({ port, view }: StepProps) {
  switch (view.step) {
    case null:
      return <ConsultStarting />;
    case 'photo':
      return <Photo port={port} view={view} />;
    case 'face':
      return <Face port={port} view={view} />;
    case 'goal':
      return <Goal port={port} view={view} />;
    case 'questions':
      return <Questions port={port} view={view} />;
    case 'ideas':
      return <Ideas port={port} view={view} />;
    case 'try-on':
      return <TryOn port={port} view={view} />;
    case 'board':
      return <Board port={port} view={view} />;
  }
}

export function ConsultRoute({ port }: { readonly port: ConsultPort }) {
  const view = useConsultView(port);
  const [entered, setEntered] = useState<Step | null>(view.step);
  if (entered === null && view.step !== null) setEntered(view.step);
  const first = view.step === entered;
  return (
    <StepNotice value={{ node: <SaveControl port={port} full={first} fold />, first }}>
      <CurrentStep port={port} view={view} />
    </StepNotice>
  );
}
