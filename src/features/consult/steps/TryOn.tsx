/**
 * Try it on (`#/my-look/try-on`): four tabs in plain words: All together (the finished card comes first), One by one, My pictures
 * and Tips, the tab chosen kept in the machine. It renders the machine's state through the selectors and sends events; "See your
 * board" is `NEXT`.
 */
import { useId, useMemo } from 'react';
import { idsOfLook } from '../../../domain/ids.ts';
import type { PromptPack } from '../../../domain/prompts/build.ts';
import { SHOWN } from '../../../domain/render-model/copy.ts';
import { buildBoard } from '../../../domain/render-model/board.ts';
import { isUsable, slotPhotoOf } from '../../../machine/consult.selectors.ts';
import type { TryOnTab } from '../../../machine/consult.types.ts';
import { en } from '../../../strings/en.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { Progress } from '../../../ui/components/Progress.tsx';
import { panelId, tabId, Tabs } from '../../../ui/components/Tabs.tsx';
import { ColourNotice } from '../ideas/ColourChoice.tsx';
import { Cards } from '../try-on/Cards.tsx';
import { boardInput, handoffOf, isPairTile } from '../try-on/logic.ts';
import { MyPictures } from '../try-on/MyPictures.tsx';
import { namedOf, nameOf as namesIn } from '../try-on/names.ts';
import { OneByOne } from '../try-on/OneByOne.tsx';
import { usePhotoForAi, type PhotoForAi } from '../try-on/photo-for-ai.ts';
import { samplePicture } from '../try-on/samples.ts';
import { journeyLabelOf, tileSheet } from '../try-on/sheets.ts';
import { Tips } from '../try-on/Tips.tsx';
import { useDetails, type Details } from '../try-on/useDetails.ts';
import { StepLayout } from '../StepLayout.tsx';
import type { StepProps } from '../useConsult.ts';
import styles from '../try-on/try-on.module.css';

const t = tryOnCopy;
const TABS: readonly TryOnTab[] = ['together', 'single', 'pictures', 'tips'];

/** Every usable photo, the main one first: the identity source of the card. */
function photoIdsOf(c: StepProps['view']['context']) {
  const usable = c.photos.filter(isUsable).map((p) => p.id);
  return [...usable.filter((id) => id === c.mainPhotoId), ...usable.filter((id) => id !== c.mainPhotoId)];
}

/** What the tabs share: the prompts once their details are in, the board's tiles and the photos for the AI chat. */
function useScreen({ port, view }: StepProps) {
  const c = view.context;
  const { selectors } = port;
  const tiles = selectors.boardLayout(c);
  const pair = selectors.pairIdea(c);
  const details = useDetails([...new Set([...selectors.looks(c).flatMap(idsOfLook), ...tiles.flatMap((x) => x.ideas)])]);
  const prompts = selectors.promptPack(c);
  const pack = useMemo(() => (prompts && details.status === 'ready' ? prompts(details.of) : null), [prompts, details]);
  const photoIds = photoIdsOf(c);
  const main = photoIds[0] === c.mainPhotoId ? c.mainPhotoId : null;
  const forAi = usePhotoForAi(main);
  const photo: PhotoForAi | 'none' = main === null ? 'none' : forAi;
  const { library } = c.content;
  const board = useMemo(() => buildBoard(boardInput(tiles, namedOf(library), isPairTile(pair)), SHOWN), [tiles, library, pair]);
  return { details, pack, pair, board, photoIds: main === null ? [] : photoIds, photo };
}

type Screen = ReturnType<typeof useScreen>;

/** The chosen tab's content. */
function Panel({ port, view, s, tab, pack }: StepProps & { readonly s: Screen; readonly tab: TryOnTab; readonly pack: PromptPack }) {
  const c = view.context;
  const { library } = c.content;
  const { selectors } = port;
  const texture = selectors.facts(c)['hair.texture']?.value;
  const sampleOf = (id: string) => samplePicture(library, c.prefs.collections, texture, id);
  const shared = { pack, handoff: handoffOf(c.device), referral: selectors.recommendation(c)?.engine.referral?.text ?? null };
  const nameOf = namesIn(library);
  const { details, photo } = s;
  switch (tab) {
    case 'together':
      return <Cards {...shared} photoIds={s.photoIds} sampleOf={sampleOf} library={library} send={port.send} />;
    case 'single':
      return <OneByOne {...shared} photo={photo} pair={s.pair} nameOf={nameOf} sampleOf={sampleOf} labelOf={(look) => (details.status === 'ready' ? journeyLabelOf(tileSheet(port, c, details.of, idsOfLook(look))) : null)} />;
    case 'pictures':
      return <MyPictures {...shared} photo={photo} board={s.board} pair={s.pair} grids={c.grids} slotsOf={slotPhotoOf(c)} slots={selectors.slotsForMainPhoto(c)} nameOf={nameOf} send={port.send} />;
    case 'tips':
      return <Tips repair={pack.repair} />;
  }
}

export function TryOn(step: StepProps) {
  const { port, view } = step;
  const c = view.context;
  const ids = useId();
  const s = useScreen(step);
  const tab = c.prefs.tab ?? 'together';
  // No picture yet: the Board would be empty, so it is not the strongest action on the screen.
  const hasPicture = Object.keys(port.selectors.slotsForMainPhoto(c)).length > 0;
  const next = (
    <Button variant={hasPicture ? 'primary' : 'text'} icon="arrowRight" onClick={() => { port.send({ type: 'NEXT' }); }}>
      {t.next}
    </Button>
  );
  return (
    <StepLayout title={en.consult.steps['try-on']} onBack={port.back} actions={next} wide>
      <p>{t.intro}</p>
      {port.selectors.noColourFits(c) && <ColourNotice referral={port.selectors.recommendation(c)?.engine.referral?.text ?? null} onKeep={() => { port.send({ type: 'PREFS.SET', colour: { mode: 'keep', shade: null } }); }} />}
      <Tabs tabs={TABS} tab={tab} labels={t.tabs.names} label={t.tabs.label} ids={ids} fit onTab={(chosen) => { port.send({ type: 'PREFS.SET', tab: chosen }); }} />
      {/* A stop of its own (WAI-ARIA tabs): One by one and Tips open with words, not with anything focusable. */}
      <div role="tabpanel" id={panelId(ids)} aria-labelledby={tabId(ids, tab)} className={styles.section} tabIndex={0}>
        <DetailsState details={s.details} />
        {s.pack ? <Panel {...step} s={s} tab={tab} pack={s.pack} /> : tab === 'tips' && <Tips repair={null} />}
      </div>
    </StepLayout>
  );
}

/** While the prompts' details load, and what to do when they cannot. */
function DetailsState({ details }: { readonly details: Details }) {
  if (details.status === 'ready') return null;
  if (details.status === 'loading') return <Progress label={t.details.loading} value={null} />;
  return (
    <div className={styles.notice}>
      <p>{`${t.details.failed} ${en.consult.tools.code(details.error)}`}</p>
      <Button variant="secondary" onClick={details.retry}>
        {t.details.retry}
      </Button>
    </div>
  );
}
