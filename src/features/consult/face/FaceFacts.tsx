/**
 * What this photo shows: the card's facts as full-width tiles, from the same `cardFacts` the saved card paints, so this
 * list is the card's text. Each tile names its topic, says what the photo shows, what hair does there, and the number with how
 * sure it is; "Cannot read reliably" stands alone.
 */
import { useId } from 'react';
import type { CardFact } from '../../../domain/render-model/face-card.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import styles from './face.module.css';

export function FaceFacts({ facts }: { readonly facts: readonly CardFact[] }) {
  const headingId = useId();
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{SHOWN.faceCard.heading}</h2>
      <ul className={styles.facts}>
        {facts.map((f) => (
          <li key={f.fact} className={styles.fact}>
            <h3 className={styles.factName}>{f.name}</h3>
            <p className={styles.factTitle}>{f.title}</p>
            {f.hair !== null && <p>{f.hair}</p>}
            {f.number !== null && <p className={styles.small}>{f.number}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
