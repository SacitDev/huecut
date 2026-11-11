/**
 * The photo guide: sample pictures on fictional models showing which photos to take and which to
 * avoid, before the person adds any, so the analysis and the try-on prompts get better photos.
 */
import { useId } from 'react';
import { en } from '../../../strings/en.ts';
import { Arch } from '../../../ui/components/Arch.tsx';
import styles from './steps.module.css';

const t = en.consult.photo.guide;
const picture = (id: string): string => `${import.meta.env.BASE_URL}illustrations/${id}.avif`;

const GOOD = [
  ['guide-front', t.good.front],
  ['guide-side', t.good.side],
  ['guide-back', t.good.back],
  ['guide-distance', t.good.distance],
] as const;
const AVOID = [
  ['guide-avoid-close', t.avoid.close],
  ['guide-avoid-hand', t.avoid.hand],
  ['guide-avoid-turned', t.avoid.turned],
  ['guide-avoid-hidden', t.avoid.hidden],
] as const;

/** Which photos to take, above the add button. The pictures are samples described by their captions, so they carry no alt text. */
export function PhotoGuide() {
  const titleId = useId();
  return (
    <section className={styles.guide} aria-labelledby={titleId}>
      <h2 id={titleId} className="t-h3">{t.title}</h2>
      <p>{t.lead}</p>
      <ul className={styles.guideGood}>
        {GOOD.map(([id, caption]) => (
          <li key={id}>
            <Arch ratio={3 / 4}>
              <img src={picture(id)} alt="" width={480} height={640} />
            </Arch>
            <span>{caption}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What to avoid, under the add button so that it stays within reach on a phone. */
export function PhotoAvoid() {
  const titleId = useId();
  return (
    <section className={styles.guide} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.guideAvoidTitle}>{t.avoidTitle}</h2>
      <ul className={styles.guideAvoid}>
        {AVOID.map(([id, caption]) => (
          <li key={id}>
            <img src={picture(id)} alt="" width={480} height={480} loading="lazy" />
            <span>{caption}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
