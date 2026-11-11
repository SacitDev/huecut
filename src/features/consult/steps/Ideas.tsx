/**
 * Ideas (`#/my-look/ideas`): the ideas first, in "Cuts" and "Colours", with what limited a short
 * list above them and the "Try together" pair between them, under the cuts, so a phone's first screen shows the first idea;
 * then "How many ideas?" 1 to 8 (under Both the total, cuts first) and the colour in the results, the action that lets the
 * person's own AI pick, "Add from Explore" with the 8-idea limit, "Improve my ideas", the face card and "Try them on". The screen
 * renders the machine's state and sends events.
 */
import { useMemo } from 'react';
import { resultGoalOf } from '../../../machine/consult.selectors.ts';
import { MAX_IDEAS } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { ideasCopy as t } from '../../../strings/en-ideas.ts';
import { Button, LinkButton } from '../../../ui/components/Button.tsx';
import { LiveRegion } from '../../../ui/components/LiveRegion.tsx';
import { Stepper } from '../../../ui/components/Stepper.tsx';
import { AiPick } from '../ideas/AiPick.tsx';
import { ColourChoice } from '../ideas/ColourChoice.tsx';
import { IdeaSections } from '../ideas/IdeaList.tsx';
import { WorthAsking } from '../ideas/WorthAsking.tsx';
import { ImproveSheet } from '../ideas/ImproveSheet.tsx';
import { givesWayLine, photoLink, sectionsOf, shortfallOf } from '../ideas/model.ts';
import { PairPanel } from '../ideas/PairPanel.tsx';
import { useIdeasScreen, type IdeasScreen } from '../ideas/screen.ts';
import { StepLayout } from '../StepLayout.tsx';
import { stepHref, type StepProps } from '../useConsult.ts';
import styles from '../ideas/ideas.module.css';

const EXPLORE = '#/explore';

/** The count: 1 to 8, at least 2 under Both (half rounded up are cuts); the machine keeps it within the policy. */
function Count({ s }: { readonly s: IdeasScreen }) {
  const { count } = s.context.content.consult.policy;
  const min = s.goal === 'both' ? Math.max(2, count.min) : count.min;
  return (
    <div className={styles.stack}>
      <Stepper
        label={t.count.label}
        value={s.context.prefs.count}
        min={min}
        max={Math.min(count.max, MAX_IDEAS)}
        decreaseLabel={t.count.fewer}
        increaseLabel={t.count.more}
        unit={t.count.unit}
        onChange={(value) => { s.port.send({ type: 'PREFS.SET', count: value }); }}
      />
      {resultGoalOf(s.context.prefs) === 'both' && <p className={styles.small}>{t.count.bothHint}</p>}
    </div>
  );
}

/**
 * "We found 3 that suit your hair and limits", with what limited them; the limits are never relaxed. The count is of the shown
 * ideas the app picked (a look the person added counts only when the app picked it too, since an addition may not fit); after a
 * referral an empty list is the referral's to explain, so the line that invites changing an answer is left out.
 */
function Shortfall({ s }: { readonly s: IdeasScreen }) {
  const picked = new Set(s.engine.picks.map((p) => p.id));
  const own = s.list.ids.filter((id) => picked.has(id)).length;
  const short = useMemo(() => shortfallOf(s.engine, own, s.context.content, s.facts, s.context), [s.engine, own, s.context, s.facts]);
  if (!short) return null;
  return (
    <div className={styles.notice}>
      {!(short.found === 0 && s.engine.referral !== null) && <p>{t.shortfall.found(short.found)}</p>}
      {short.reasons.length > 0 && (
        <>
          <p>{t.shortfall.answers}</p>
          <ul className={styles.lines}>{short.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </>
      )}
      {short.unmet.length > 0 && (
        <>
          <p>{t.shortfall.unmet}</p>
          <ul className={styles.lines}>{short.unmet.map((r) => <li key={r}>{r}</li>)}</ul>
        </>
      )}
      {short.removed > 0 && <p>{t.shortfall.removed(short.removed)}</p>}
      {short.library.map((kind) => <p key={kind}>{t.shortfall.library(t.shortfall.kinds[kind])}</p>)}
    </div>
  );
}

/** Why the colour direction gave way, notes for the whole result and the no-photo link. */
function Top({ s }: { readonly s: IdeasScreen }) {
  const link = photoLink(s.context);
  const givesWay = s.list.colours.length > 0 ? givesWayLine(s.engine, s.facts) : null;
  return (
    <>
      {givesWay !== null && <div className={styles.notice}><p>{givesWay}</p></div>}
      <Shortfall s={s} />
      {s.engine.notes.length > 0 && <ul className={styles.lines}>{s.engine.notes.map((n) => <li key={n.ruleId}>{n.because}</li>)}</ul>}
      {link !== null && (
        <p>
          <LinkButton variant="text" href={stepHref('photo')}>{t[link]}</LinkButton>
        </p>
      )}
    </>
  );
}

/** "Add from Explore", the 8-idea limit once the person's own additions fill the list, Improve and the face card. */
function Bottom({ s }: { readonly s: IdeasScreen }) {
  const full = s.context.shortlist.added.length >= MAX_IDEAS;
  // The face card opens while there is a photo and it was not skipped (its `canEnter`): every photo has a screen there.
  const card = !s.context.skipped && s.context.photos.length > 0;
  return (
    <div className={styles.stack}>
      <LinkButton variant="secondary" href={EXPLORE}>{t.addFromExplore}</LinkButton>
      {full && <p className={styles.small}>{t.listFull}</p>}
      <ImproveSheet s={s} />
      {card && <LinkButton variant="text" href={stepHref('face')}>{t.faceCard}</LinkButton>}
    </div>
  );
}

export function Ideas(step: StepProps) {
  const { port } = step;
  const { screen: s, message } = useIdeasScreen(step);
  if (s === null) {
    return (
      <StepLayout title={en.consult.steps.ideas} onBack={port.back}>
        <p>{en.consult.goal.needBoth}</p>
        <LinkButton variant="secondary" href={stepHref('goal')}>{en.consult.steps.goal}</LinkButton>
      </StepLayout>
    );
  }
  const empty = s.list.ids.length === 0;
  // A pair needs a cut and a colour, so when it shows, the first section is the cuts and the colours follow it.
  const [first, ...after] = sectionsOf(resultGoalOf(s.context.prefs) ?? s.goal, s.list);
  const actions = (
    <Button unavailable={empty} onClick={() => { port.send({ type: 'NEXT' }); }}>
      {t.next}
    </Button>
  );
  return (
    <StepLayout title={en.consult.steps.ideas} onBack={port.back} actions={actions} wide>
      <Top s={s} />
      <IdeaSections s={s} sections={first ? [first] : []} />
      <PairPanel s={s} />
      <IdeaSections s={s} sections={after} />
      <Count s={s} />
      <ColourChoice s={s} />
      <WorthAsking s={s} />
      <AiPick s={s} />
      <Bottom s={s} />
      <LiveRegion message={message} />
    </StepLayout>
  );
}
