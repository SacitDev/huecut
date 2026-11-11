/**
 * Help, privacy and method: `#/help` has How it works, the topics and Feedback;
 * `#/help/privacy`, `/method`, `/prompts` and `/credits` have one topic each.
 */
import { useEffect, useState } from 'react';
import type { ExtraBlock } from '../../machine/consult.types.ts';
import { en } from '../../strings/en.ts';
import { helpCopy as t } from '../../strings/en-help.ts';
import { tryOnCopy } from '../../strings/en-try-on.ts';
import { faceCopy } from '../../strings/en-face.ts';
import { languageCopy } from '../../strings/en-language.ts';
import { safetyInEnglish } from '../../strings/locale.ts';
import type { ExtraModel } from '../../worker/protocol.ts';
import { InstallOffer } from '../shared/InstallOffer.tsx';
import styles from './Help.module.css';

/** The topics that have their own page. */
export type HelpTopic = keyof typeof t.topics;

/** What only this session and device can tell Help. */
export interface HelpFacts {
  /** Requests the worker's fetch allowlist has blocked in this session; 0 before My look has started. */
  readonly blocked: number;
  /** Why each extra is off on this device, or null when it is offered. */
  readonly extras: Readonly<Record<ExtraModel, ExtraBlock | null>>;
}

export interface HelpProps {
  readonly topic: HelpTopic | null;
  readonly facts: () => Promise<HelpFacts>;
}

type Facts = HelpFacts | 'failed' | null;

function useFacts(facts: HelpProps['facts']): Facts {
  const [value, setValue] = useState<Facts>(null);
  useEffect(() => {
    let live = true;
    facts().then(
      (next) => {
        if (live) setValue(next);
      },
      () => {
        if (live) setValue('failed');
      },
    );
    return () => {
      live = false;
    };
  }, [facts]);
  return value;
}

export function Help({ topic, facts }: HelpProps) {
  if (topic === null) return <Overview />;
  return (
    <article className={styles.page}>
      <a href="#/help">{t.all}</a>
      <h1>{t.topics[topic]}</h1>
      {topic === 'privacy' && <Privacy facts={facts} />}
      {topic === 'method' && <Method facts={facts} />}
      {topic === 'prompts' && <Prompts />}
      {topic === 'credits' && <Credits />}
    </article>
  );
}

function Overview() {
  return (
    <div className={styles.page}>
      <h1>{t.title}</h1>
      {safetyInEnglish() && <p>{languageCopy.safetyInEnglish}</p>}
      <section className={styles.section}>
        <h2 className="t-h2">{t.how.heading}</h2>
        <ol className={styles.list}>
          {t.how.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <nav aria-label={t.topicsLabel} className={styles.section}>
        <ul className={styles.list}>
          {(Object.keys(t.topics) as HelpTopic[]).map((key) => (
            <li key={key}>
              <a href={`#/help/${key}`}>{t.topics[key]}</a>
            </li>
          ))}
        </ul>
      </nav>
      <section className={styles.section}>
        <h2 className="t-h2">{t.feedback.heading}</h2>
        <p>{t.feedback.body}</p>
        <p>
          <a href={tryOnCopy.board.feedbackUrl} target="_blank" rel="noreferrer">
            {tryOnCopy.board.feedback}
          </a>
        </p>
        <p className={styles.small}>{tryOnCopy.board.feedbackHint}</p>
      </section>
      <section className={styles.section}>
        <h2 className="t-h2">{t.install.heading}</h2>
        <p>{t.install.body}</p>
        <InstallOffer />
      </section>
    </div>
  );
}

function blockedLine(facts: Facts): string {
  if (facts === 'failed') return t.privacy.blockedUnknown;
  return facts === null ? '' : t.privacy.blocked(facts.blocked);
}

function Privacy({ facts }: Pick<HelpProps, 'facts'>) {
  const known = useFacts(facts);
  const p = t.privacy;
  return (
    <>
      <p className={styles.line}>{en.home.privacy}</p>
      <section className={styles.section}>
        <h2 className="t-h2">{p.metricsHeading}</h2>
        <p>{p.noAccounts}</p>
        <p>{p.metrics}</p>
        <p data-testid="blocked-count">{blockedLine(known)}</p>
      </section>
      <section className={styles.section}>
        <h2 className="t-h2">{p.storedHeading}</h2>
        <ul className={styles.list}>
          {p.stored.map((item) => (
            <li key={item.what}>
              <strong>{item.what}.</strong> {item.where}
            </li>
          ))}
        </ul>
        <p>{p.deleteHint}</p>
        <p className={styles.small}>{p.safari}</p>
        <p className={styles.small}>{p.sharedOrigin}</p>
      </section>
      <section className={styles.section}>
        <h2 className="t-h2">{p.testHeading}</h2>
        <p>{p.airplane}</p>
        <p>{p.offline}</p>
      </section>
    </>
  );
}

function toolState(known: Facts, model: ExtraModel): string {
  if (known === null || known === 'failed') return t.method.toolsReading;
  const block = known.extras[model];
  return block === null ? t.method.toolOn : faceCopy.more.blocked[block];
}

function Method({ facts }: Pick<HelpProps, 'facts'>) {
  const known = useFacts(facts);
  const m = t.method;
  return (
    <>
      <p>{m.intro}</p>
      <Part heading={m.estimatesHeading} lines={[m.estimates]} />
      <Part heading={m.hintsHeading} lines={[m.hints]} />
      <Part heading={m.preferenceHeading} lines={[m.preference]} />
      <Part heading={m.phonesHeading} lines={[m.phones]} />
      <Part heading={m.labelsHeading} lines={[m.labels, m.silver]} />
      <section className={styles.section}>
        <h2 className="t-h2">{m.toolsHeading}</h2>
        <ul className={styles.list}>
          {(['depth', 'sam'] as const).map((model) => (
            <li key={model}>{m.toolLine(m.tools[model], toolState(known, model))}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Part({ heading, lines }: { readonly heading: string; readonly lines: readonly string[] }) {
  return (
    <section className={styles.section}>
      <h2 className="t-h2">{heading}</h2>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}

function Prompts() {
  const p = t.prompts;
  return (
    <>
      <section className={styles.section}>
        <h2 className="t-h2">{p.stepsHeading}</h2>
        <ol className={styles.list}>
          {p.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section className={styles.section}>
        <h2 className="t-h2">{p.tipsHeading}</h2>
        <ul className={styles.list}>
          {p.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Credits() {
  const c = t.credits;
  return (
    <>
      <section className={styles.section}>
        <h2 className="t-h2">{c.authorHeading}</h2>
        <p>{c.author}</p>
        <p className={styles.small}>{c.keepNotice}</p>
      </section>
      <p>{c.app}</p>
      <p>{c.pictures}</p>
      <section className={styles.section}>
        <h2 className="t-h2">{c.heading}</h2>
        <ul className={styles.list}>
          {c.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.small}>
          {c.more} <a href="licences/THIRD_PARTY_LICENSES.txt" target="_blank" rel="noreferrer">{c.licenceLinks.thirdParty}</a>,{' '}
          <a href="licences/LICENSE.txt" target="_blank" rel="noreferrer">{c.licenceLinks.own}</a>
        </p>
      </section>
      <p className={styles.line}>{en.home.trademark}</p>
    </>
  );
}
