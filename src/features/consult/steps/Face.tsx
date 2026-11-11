/**
 * Your face card (`#/my-look/face`): the main photo with its lines, what it shows as facts with their
 * numbers, Move the lines, Save my card and "More with your photo". While the photo is read: one line and the download. When
 * it cannot be read: one sentence on why and one way on, above the fold on a phone. Continue never waits, and a photo that
 * failed never sends anyone back.
 */
import { reachedIdeas } from '../../../machine/consult.selectors.ts';
import { en } from '../../../strings/en.ts';
import { faceCopy as t } from '../../../strings/en-face.ts';
import { Button, LinkButton } from '../../../ui/components/Button.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import { FaceFacts } from '../face/FaceFacts.tsx';
import { faceState, isMeasured, mainEntry, type UnreadReason } from '../face/model.ts';
import { More } from '../face/More.tsx';
import { MoveLines } from '../face/MoveLines.tsx';
import { Portrait } from '../face/Portrait.tsx';
import { SaveCard } from '../face/SaveCard.tsx';
import { useFaceCard } from '../face/usePainting.ts';
import { PhotoFigure } from '../PhotoFigure.tsx';
import { StepLayout } from '../StepLayout.tsx';
import { ToolsStatus } from '../ToolsStatus.tsx';
import { stepHref, type StepProps } from '../useConsult.ts';
import styles from '../face/face.module.css';

const p = en.consult.photo;
/** Why a photo cannot be read, in the photo step's own sentences, and one more for when none could be; read when shown, so it follows the language. */
const unread = (reason: UnreadReason): string =>
  ({
    none_read: t.noneRead,
    no_face: p.issues.no_face,
    turned: p.issues.turned,
    several_faces: p.issues.several_faces,
    decode_failed: p.errors.decode_failed,
    out_of_memory: p.errors.out_of_memory,
    failed: p.errors.other,
  })[reason];

/**
 * The one sentence, its one way on, and the photo whole and smaller under them; or, while it is read, the download too. When the face
 * tools failed nothing is being read, so their own sentence and next step stand alone: no moving line, no card promised.
 */
function NotYet({ step, reason }: { readonly step: StepProps; readonly reason: UnreadReason | null }) {
  const main = mainEntry(step.view.context);
  const reading = reason === null && step.view.context.models.core.error === null;
  return (
    <div className={styles.section}>
      {reading && <Progress label={t.reading} value={null} />}
      {reason !== null && <p className={styles.lead}>{unread(reason)}</p>}
      {reason !== null && (
        <LinkButton variant="secondary" href={stepHref('photo')}>
          {reason === 'none_read' ? t.addAnother : t.chooseAnother}
        </LinkButton>
      )}
      <ToolsStatus view={step.view} port={step.port} />
      {reading && <p className={styles.small}>{t.wait}</p>}
      <div className={styles.photo}>
        <PhotoFigure photoId={main?.id ?? null} />
      </div>
    </div>
  );
}

export function Face(step: StepProps) {
  const { port, view } = step;
  const { context } = view;
  const main = mainEntry(context);
  const m = main ? port.selectors.measurementsOf(context, main.id) : null;
  const state = faceState(context, m, port.selectors.cardFacts(context));
  const card = useFaceCard(view, port.selectors);
  const ready = state.kind === 'ready' && card !== null && isMeasured(main) && m !== null;
  const actions = (
    <>
      <Button onClick={() => { port.send({ type: 'NEXT' }); }}>{reachedIdeas(context) ? t.backToIdeas : t.next}</Button>
      {ready && <SaveCard card={card} photoId={main.id} />}
    </>
  );
  if (!ready) {
    return (
      <StepLayout title={en.consult.steps.face} onBack={port.back} actions={actions}>
        <NotYet step={step} reason={state.kind === 'unread' ? state.reason : null} />
      </StepLayout>
    );
  }
  const aside = (
    <div className={styles.stack}>
      <Portrait card={card} photoId={main.id} />
      <MoveLines step={step} entry={main} card={card} />
    </div>
  );
  const note = m.approximate ? en.consult.photo.issues.close_selfie : m.issues.filter((i) => i !== 'close_selfie').map((i) => p.issues[i])[0];
  return (
    <StepLayout title={en.consult.steps.face} onBack={port.back} aside={aside} asideOnPhones actions={actions}>
      <ToolsStatus view={view} port={port} />
      <FaceFacts facts={port.selectors.cardFacts(context)} />
      {note !== undefined && <p>{note}</p>}
      <p className={styles.small}>{p.privacy}</p>
      <More step={step} entry={main} m={m} />
    </StepLayout>
  );
}
