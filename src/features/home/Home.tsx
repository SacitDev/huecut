/**
 * Home: full-screen panels that slide up over one another, each a solid colour with a photograph
 * filling its other half, so type never touches a face. The motion is all CSS scroll timelines (Home.module.css); without them,
 * or with reduced motion, the same page stands still and everything is readable.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { readSession } from '../../platform/storage.ts';
import { en } from '../../strings/en.ts';
import { Button, LinkButton } from '../../ui/components/Button.tsx';
import { Sheet } from '../../ui/components/Sheet.tsx';
import { cx } from '../../ui/cx.ts';
import { InstallOffer } from '../shared/InstallOffer.tsx';
import { FACE_LINES, FACE_LINES_SIZE } from './face-lines.ts';
import { CLOSING_LOOKS, COLOURS, FIGURE_SIZES, LINES_PICTURE, REST_LOOKS, srcSet, urlOf, WALL, type Look } from './looks.ts';
import styles from './Home.module.css';

export interface HomeLinks {
  findMyLook: string;
  explore: string;
  example: string;
  answersOnly: string;
}

export interface HomeProps {
  links: HomeLinks;
  /** The in-app browser notice when one is detected, otherwise nothing. */
  notice?: ReactNode;
  /** After the person's yes: a new session, which replaces the saved one with its first write. */
  onStartAgain: () => void;
}

/** Whether a session is saved; null until storage has answered. */
type Kept = boolean | null;

/** The look's place in its sequence, read by the CSS that times it. */
const at = (i: number): CSSProperties => ({ '--i': i } as CSSProperties);
const t = en.home;

/** Pictures stacked in one figure, each on its average colour until it loads; `layer` says how the stack changes. */
function Shots({ looks, layer, eager }: { readonly looks: readonly Look[]; readonly layer: string | undefined; readonly eager?: boolean }) {
  return looks.map((look, i) => (
    <img
      key={look.path}
      className={cx(styles.shot, layer)}
      style={{ ...at(i), backgroundColor: look.average }}
      src={urlOf(look.path, 960)}
      srcSet={srcSet(look.path)}
      sizes={FIGURE_SIZES}
      width={480}
      height={640}
      alt=""
      {...(eager && i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
    />
  ));
}

interface WaysProps {
  readonly links: HomeLinks;
  readonly kept: Kept;
  readonly ask: () => void;
  readonly className?: string | undefined;
}

/** To continue or start again with a session saved, else to start; held hidden until storage has answered, so a tap never lands on a button that changes. */
function Ways({ links, kept, ask, className }: WaysProps) {
  return (
    <div className={cx(styles.ways, className)} data-reading={kept === null}>
      <LinkButton href={links.findMyLook}>{kept === true ? t.continueLook : t.findMyLook}</LinkButton>
      {kept === true ? <Button variant="text" onClick={ask}>{t.startAgain.action}</Button> : <LinkButton variant="text" href={links.explore}>{t.explore}</LinkButton>}
    </div>
  );
}

function Hero({ links, kept, ask }: Omit<WaysProps, 'className'>) {
  return (
    <section className={cx(styles.track, styles.heroTrack)}>
      <div className={cx(styles.panel, styles.cream)}>
        <div className={styles.copy}>
          <h1 className={cx('t-display', styles.promise)}>
            {t.promiseLines.map((line) => <span key={line} className={styles.promiseLine}><span>{line}</span></span>)}
          </h1>
          <p className={cx('t-body-lg', styles.intro)}>{t.subline}</p>
          <Ways links={links} kept={kept} ask={ask} className={styles.intro} />
          <p className={cx(styles.expectations, styles.intro)}>{t.expectations}</p>
        </div>
        <div className={cx(styles.figure, styles.heroFigure)}>
          <Shots looks={REST_LOOKS} layer={styles.rest} eager />
          <ul className={styles.restNames} aria-hidden="true">
            {REST_LOOKS.map((look, i) => <li key={look.path} style={at(i)}>{look.name && t.looks[look.name]}</li>)}
          </ul>
        </div>
        <span className={styles.cue} aria-hidden="true">{t.scrollCue}</span>
      </div>
    </section>
  );
}

/** The app's real lines drawing themselves on a face as you scroll. */
function Lines() {
  return (
    <section className={cx(styles.track, styles.linesTrack)} aria-labelledby="home-lines">
      <div className={cx(styles.panel, styles.ink)}>
        <div className={styles.copy}>
          <h2 id="home-lines" className={cx('t-display', styles.bigTitle)}>{t.lines.title}</h2>
          <ul className={styles.points}>
            {t.lines.points.map((point, i) => <li key={point} className={cx('t-body-lg', styles.point)} style={at(i)}>{point}</li>)}
          </ul>
        </div>
        <div className={styles.figure}>
          <div className={styles.zoom}>
            <img className={styles.shotOn} src={urlOf(LINES_PICTURE.path, 960)} width={480} height={640} alt="" loading="lazy" />
            <svg className={styles.lines} viewBox={`0 0 ${String(FACE_LINES_SIZE.width)} ${String(FACE_LINES_SIZE.height)}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              {FACE_LINES.map((line, i) => <path key={line.id} d={line.d} pathLength={1} style={at(i)} />)}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The library, running past as you scroll, each look named. */
function Wall({ explore }: { readonly explore: string }) {
  return (
    <section className={cx(styles.track, styles.wallTrack)} aria-labelledby="home-wall">
      <div className={cx(styles.panel, styles.cream, styles.wallPanel)}>
        <div className={styles.wallHead}>
          <h2 id="home-wall" className={cx('t-display', styles.bigTitle)}>{t.wallTitle}</h2>
          <div className={styles.ways}><LinkButton href={explore}>{t.explore}</LinkButton></div>
        </div>
        <ul className={styles.wallRow}>
          {WALL.map((look) => (
            <li key={look.path} className={styles.tile}>
              <img src={urlOf(look.path, 480)} width={480} height={640} alt="" loading="lazy" />
              <span>{look.name && t.looks[look.name]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Colour by colour: the hair changes and the card says what the app would say. */
function Colours() {
  return (
    <section className={cx(styles.track, styles.colourTrack)} aria-labelledby="home-colour">
      <div className={cx(styles.panel, styles.rose)}>
        <div className={styles.copy}>
          <h2 id="home-colour" className={cx('t-display', styles.bigTitle)}>{t.colour.title}</h2>
          <p className="t-body-lg">{t.colour.body}</p>
          <ul className={styles.cards}>
            {t.colour.examples.map((idea, i) => (
              <li key={idea.name} className={styles.card} style={at(i)}>
                <div className={styles.cardTop}><strong>{idea.name}</strong><span className={styles.cardLabel}>{idea.label}</span></div>
                <p>{idea.why}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.figure}>
          <Shots looks={COLOURS} layer={styles.colourShot} />
        </div>
      </div>
    </section>
  );
}

function Closing({ links, kept, ask }: Omit<WaysProps, 'className'>) {
  return (
    <section className={cx(styles.panel, styles.ink, styles.closing)}>
      <h2 className={cx('t-display', styles.closingTitle)}>{t.closing.title}</h2>
      <div className={styles.closingMain}>
        <div className={styles.closingAct}>
          <p className="t-body-lg">{t.closing.body}</p>
          <Ways links={links} kept={kept} ask={ask} />
        </div>
        <ul className={styles.closingRow}>
          {CLOSING_LOOKS.map((look) => <li key={look.path}><img src={urlOf(look.path, 480)} width={480} height={640} alt={look.name ? t.looks[look.name] : ''} loading="lazy" /></li>)}
        </ul>
      </div>
      <footer className={styles.fine}>
        {kept === false && (
          <>
            <a href={links.example}>{t.example}</a>
            <a href={links.answersOnly}>{t.answersOnly}</a>
          </>
        )}
        <p>{t.privacy}</p>
        <p>{t.trademark}</p>
        <InstallOffer />
      </footer>
    </section>
  );
}

export function Home({ links, notice, onStartAgain }: HomeProps) {
  const [kept, setKept] = useState<Kept>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    void readSession(Date.now()).then((session) => { setKept(session !== null); });
  }, []);
  const ask = (): void => { setAsking(true); };
  const close = (): void => { setAsking(false); };
  return (
    <div className={styles.home}>
      {notice}
      <Hero links={links} kept={kept} ask={ask} />
      <Lines />
      <Wall explore={links.explore} />
      <Colours />
      <Closing links={links} kept={kept} ask={ask} />
      <Sheet open={asking} title={t.startAgain.title} onClose={close} closeLabel={en.sheet.close} expandLabel={en.sheet.expand} collapseLabel={en.sheet.collapse}>
        <p>{t.startAgain.body}</p>
        <div className={styles.ways}>
          <Button onClick={onStartAgain}>{t.startAgain.yes}</Button>
          <Button variant="text" onClick={close}>{t.startAgain.no}</Button>
        </div>
      </Sheet>
    </div>
  );
}
