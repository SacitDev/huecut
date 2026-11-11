/**
 * One My look step's frame: Back (the browser's Back), the heading the app focuses
 * after each navigation, what `StepNotice` holds (before the step, so before any editable control, on the step the person came in on;
 * after it elsewhere, so the step's own first control comes first on a phone), the step's content, an optional aside (sticky on the left
 * from 840 px) and the actions, which sit in a sticky bottom bar on phones.
 */
import { createContext, use, type ReactNode } from 'react';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import styles from './ConsultRoute.module.css';

/** Shown on every step, so the steps need not know of it: the saving control, and whether it comes first. */
export const StepNotice = createContext<{ readonly node: ReactNode; readonly first: boolean }>({ node: null, first: true });

export interface StepLayoutProps {
  readonly title: string;
  readonly onBack: () => void;
  readonly aside?: ReactNode;
  /** Show the aside on phones too, above the content; by default it shows from 840 px only. */
  readonly asideOnPhones?: boolean;
  /** `start`: the sticky photo on the left (default); `end`: beside the content on the right, read after it. */
  readonly asideAt?: 'start' | 'end';
  /** The content takes the whole width (the Lines drawing lays out its own photo and list), not one reading measure. */
  readonly wide?: boolean;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
}

export function StepLayout(props: StepLayoutProps) {
  const { title, onBack, aside, asideOnPhones = false, asideAt = 'start', wide = false, actions, children } = props;
  const notice = use(StepNotice);
  const [before, after] = notice.first ? [notice.node, null] : [null, notice.node];
  const hasAside = aside !== undefined && aside !== null && aside !== false;
  const side = hasAside && (
    <div className={styles.aside} data-phones={asideOnPhones}>
      {aside}
    </div>
  );
  return (
    <div className={styles.route}>
      <header className={styles.header}>
        <Button variant="text" icon="arrowLeft" onClick={onBack}>
          {en.consult.back}
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </header>
      {before}
      <div className={styles.layout} data-aside={hasAside} data-at={asideAt}>
        {asideAt === 'start' && side}
        <div className={styles.content} data-wide={wide}>
          {children}
          {after}
        </div>
        {asideAt === 'end' && side}
        {/* Held by the whole step, not the content column: a sticky bar never rises above the top of what holds it, so under a tall photo it sank over the tab bar. */}
        {actions !== undefined && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
