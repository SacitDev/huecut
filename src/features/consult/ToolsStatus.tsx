/**
 * The face tools' status: the download with a determinate line and
 * Cancel (the first-visit sentence while bytes come from the network), what failed and the one next step, and what is
 * missing in degraded mode. Stage changes are announced politely; the progress itself is not.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { en } from '../../strings/en.ts';
import { Button } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { Progress } from '../../ui/components/Progress.tsx';
import type { AnalysisErrorCode, ModelId } from '../../worker/protocol.ts';
import { useDownloadFraction, type ConsultPort, type ConsultView } from './useConsult.ts';
import styles from './ConsultRoute.module.css';

const t = en.consult.tools;
type Fix = 'retry' | 'again' | 'reload' | 'skip';
/** A sentence or a label of `t` by its key, read when shown, so it follows the language. */
type Message = 'stopped' | 'stalled' | 'bootFailed' | 'unsupported' | 'failed';

/** What each failure says and the buttons it offers, in order; anything else is "could not load" with Try again. */
const FAILURES: Partial<Readonly<Record<AnalysisErrorCode, { readonly message: Message; readonly fixes: readonly Fix[] }>>> = {
  aborted: { message: 'stopped', fixes: ['again', 'skip'] },
  network: { message: 'stalled', fixes: ['again', 'skip'] },
  boot_failed: { message: 'bootFailed', fixes: ['reload'] },
  unsupported: { message: 'unsupported', fixes: ['skip'] },
};
const GENERIC = { message: 'failed', fixes: ['retry', 'skip'] } as const;
const FIX_LABELS: Readonly<Record<Fix, 'tryAgain' | 'downloadAgain' | 'reload' | 'answersOnly'>> = { retry: 'tryAgain', again: 'downloadAgain', reload: 'reload', skip: 'answersOnly' };
const MISSING: readonly Extract<ModelId, keyof typeof t.missing>[] = ['segmenter', 'hand', 'pose'];

interface Props {
  readonly view: ConsultView;
  readonly port: ConsultPort;
}

function Failed({ view, port }: Props) {
  const code = view.context.models.core.error?.code;
  const failure = (code && FAILURES[code]) ?? GENERIC;
  const act = (fix: Fix): void => {
    if (fix === 'reload') window.location.reload();
    else port.send(fix === 'skip' ? { type: 'ANALYSIS.SKIP' } : { type: 'MODELS.RETRY' });
  };
  // On a phone the failure can land under the action and tab bars: bring its next step into view (the page's scroll padding keeps
  // it clear of both bars). The worker may answer before the photo is in, and the photo list then appears above the notice, so
  // this runs again when the photos change. Focus stays where the person is; the status announces the failure.
  const notice = useRef<HTMLDivElement>(null);
  const photos = view.context.photos.length;
  useEffect(() => {
    notice.current?.scrollIntoView({ block: 'nearest' });
  }, [failure, photos]);
  return (
    <div ref={notice} className={styles.notice} data-tone="warn">
      <p>{t[failure.message]}</p>
      <div className={styles.noticeActions}>
        {failure.fixes.map((fix, i) => (
          <Button key={fix} variant={i === 0 ? 'secondary' : 'text'} onClick={() => { act(fix); }}>
            {t[FIX_LABELS[fix]]}
          </Button>
        ))}
      </div>
      {failure === GENERIC && code && <p className={styles.small}>{t.code(code)}</p>}
    </div>
  );
}

/** The one part of My look that follows every progress message, on a subscription of its own. */
function Loading({ port }: Pick<Props, 'port'>) {
  const value = useDownloadFraction(port, 'core');
  const first = useSyncExternalStore(port.download.subscribe, port.download.firstCore);
  return (
    <div className={styles.notice}>
      <Progress label={first ? t.firstTime : t.gettingReady} value={value} />
      <div className={styles.noticeActions}>
        <Button variant="secondary" onClick={() => { port.send({ type: 'CANCEL', model: 'core' }); }}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}

/** The parts degraded mode works without, each named in a sentence. */
function Missing({ view }: Pick<Props, 'view'>) {
  const missing = MISSING.filter((m) => view.context.models.core.missing.includes(m));
  if (missing.length === 0) return null;
  return (
    <div className={styles.notice}>
      {missing.map((m) => (
        <p key={m}>{t.missing[m]}</p>
      ))}
    </div>
  );
}

function announcement(view: ConsultView): string {
  if (view.core === 'ready' || view.core === 'degraded') return t.ready;
  const code = view.context.models.core.error?.code;
  if (view.core === 'failed') return t[(code && FAILURES[code]?.message) ?? 'failed'];
  return '';
}

/** Nothing while the tools are idle or ready; the live region stays mounted so each change is announced once. */
export function ToolsStatus({ view, port }: Props) {
  return (
    <>
      {view.core === 'loading' && <Loading port={port} />}
      {view.core === 'failed' && <Failed view={view} port={port} />}
      {view.core === 'degraded' && <Missing view={view} />}
      <LiveRegion message={announcement(view)} />
    </>
  );
}
