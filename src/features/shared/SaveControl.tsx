/**
 * The one status and control for how a session is saved: whole before the first editable control on every route into My look and on
 * Saved, one line on the later steps; a moving line under the status while a save is under way. The machine owns the choice when My look runs, so a
 * tap shows at once; with no machine on the page it acts on what storage holds. Every part keeps its place whatever the status says, so no save, failure or
 * later content can move a control under a tap.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { SaveMode } from '../../domain/session/session-data.ts';
import { changeSaving, readSession, rememberSaving, SAVING_KEY, savingChoice, type StoredSession } from '../../platform/storage.ts';
import { saveCopy as t } from '../../strings/en-saved.ts';
import { Button, LinkButton } from '../../ui/components/Button.tsx';
import { LiveRegion } from '../../ui/components/LiveRegion.tsx';
import { WaitLine } from '../../ui/components/Progress.tsx';
import { cx } from '../../ui/cx.ts';
import { statusLine, type SaveState, type SessionPort } from './save-status.ts';
import styles from './SaveControl.module.css';

const MODES: readonly SaveMode[] = ['until_deleted', 'day', 'off'];
const noSubscribe = (): (() => void) => () => undefined;
const noView = (): null => null;

const stateOf = (found: StoredSession | null): SaveState =>
  found ? { mode: found.data.keep ?? 'day', status: 'saved', stored: true, savedAt: found.data.savedAt } : { mode: savingChoice(), status: 'idle', stored: false, savedAt: null };

/** With no machine on the page: what storage holds (null while it is read), read again when another tab or "Delete my data" changes it. */
function useStoredSaving(active: boolean) {
  const [held, setHeld] = useState<SaveState | null>(null);
  /** The id of the session shown, so a choice made here reaches that session and no other. */
  const shown = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!active) return undefined;
    let live = true;
    const read = (): void => {
      void readSession().then((found) => {
        if (!live) return;
        shown.current = found?.data.id;
        setHeld(stateOf(found));
      });
    };
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key === SAVING_KEY) read();
    };
    read();
    window.addEventListener('storage', onStorage);
    return () => {
      live = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [active]);
  /** A choice is for the session shown; with none shown it stands for the next one. */
  const change = (mode: SaveMode): void => {
    rememberSaving(mode, shown.current);
    void changeSaving(mode, shown.current).then(async (done) => {
      const found = await readSession();
      shown.current = found?.data.id;
      const next = stateOf(found);
      setHeld(mode === 'off' && !done ? { ...next, mode, status: 'refused' } : next);
    });
  };
  return { held, change };
}

/** One place for what the screen shows and how a choice is made: the machine when My look runs, storage when it does not. */
function useSaving(port: SessionPort | null) {
  const view = useSyncExternalStore(port?.subscribe ?? noSubscribe, port?.view ?? noView);
  const context = view !== null && view.step !== null ? view.context : null;
  const stored = useStoredSaving(context === null);
  const state: SaveState = context ? { mode: context.keep, status: context.saveStatus, stored: context.keptStored, savedAt: context.savedAt } : (stored.held ?? stateOf(null));
  // With My look running the machine holds the choice, and the session sync remembers it for that session.
  const choose = (mode: SaveMode): void => {
    if (context) port?.send({ type: 'SESSION.KEEP', keep: mode });
    else stored.change(mode);
  };
  return { state, choose, running: context !== null, example: context?.source === 'example', reading: context === null && stored.held === null };
}

interface ActionProps {
  readonly state: SaveState;
  readonly full: boolean;
  readonly fold: boolean;
  readonly open: boolean;
  readonly running: boolean;
  readonly onToggle: () => void;
  readonly onReplace: () => void;
}

/** The status row's one action: replace another session, open or close the control or what saving keeps, or start when there is nothing yet. */
function Action({ state, full, fold, open, running, onToggle, onReplace }: ActionProps) {
  if (state.status === 'taken') return <Button variant="secondary" className={styles.action} onClick={onReplace}>{t.replace}</Button>;
  if (!full) return <Button variant="text" className={cx(styles.action, styles.link)} onClick={onToggle}>{open ? t.hide : t.change}</Button>;
  if (fold) return <Button variant="text" className={cx(styles.action, styles.link)} onClick={onToggle}>{open ? t.hide : t.more}</Button>;
  return !running && !state.stored ? <LinkButton variant="secondary" className={styles.start} href="#/my-look/photo">{t.start}</LinkButton> : null;
}

interface ChoicesProps {
  readonly mode: SaveMode;
  readonly reading: boolean;
  readonly choose: (mode: SaveMode) => void;
  /** All of what saving keeps, before the modes, and what two modes do, after them. */
  readonly more: boolean;
}

/** The shared-browser warning, what automatic saving keeps, the three modes and what two of them do. */
function Choices({ mode, reading, choose, more }: ChoicesProps) {
  const group = useId();
  return (
    <>
      <p className={styles.told}>{t.shared}</p>
      {more && <p className={styles.told}>{t.told}</p>}
      <fieldset className={styles.modes} disabled={reading}>
        <legend className="visually-hidden">{t.choose}</legend>
        {MODES.map((value) => (
          <label key={value} className={styles.mode}>
            <input type="radio" name={group} checked={mode === value} onChange={() => { choose(value); }} />
            <span>{t.modes[value]}</span>
          </label>
        ))}
      </fieldset>
      {more && <p className={styles.told}>{t.rules}</p>}
    </>
  );
}

/** All of what saving keeps: on Saved, once asked for, and while another session waits to be replaced; folded on My look's first step. */
const showsAll = (full: boolean, fold: boolean, open: boolean, state: SaveState): boolean => !full || !fold || open || state.status === 'taken';

/** What `SaveControl` takes. */
export interface SaveControlProps {
  /** My look's machine when it has started in this page. */
  readonly port: SessionPort | null;
  /** The whole text and the three modes; otherwise the status alone, with the rest behind Change. */
  readonly full: boolean;
  /**
   * Whole, but what saving keeps and what two modes do fold under "What is kept", so a phone's first screen also holds the step's first
   * control (My look): the status, the shared-browser warning and the three modes stay in the open.
   */
  readonly fold?: boolean;
}

/** The status row, the choices and what to say aloud. For the bundled example: one plain line where it is whole, nothing on a step. */
export function SaveControl({ port, full, fold = false }: SaveControlProps) {
  const { state, choose, running, example, reading } = useSaving(port);
  const [open, setOpen] = useState(false);
  const [nowMs] = useState(Date.now);
  if (example) return full ? <p>{t.example}</p> : null;
  const line = statusLine(state, nowMs);
  // Only what a person must hear: a failure or saving turned off. "Saved" after every answer would be noise.
  const said = state.status === 'taken' || state.status === 'refused' || state.mode === 'off' ? line : '';
  return (
    <section className={styles.box} aria-label={t.heading}>
      <div className={styles.row}>
        <p className={styles.line}>{line}</p>
        {state.status === 'saving' && <WaitLine className={styles.saving} />}
        <Action state={state} full={full} fold={fold} open={open} running={running} onToggle={() => { setOpen(!open); }} onReplace={() => { port?.send({ type: 'SESSION.REPLACE' }); }} />
      </div>
      {(full || open) && <Choices mode={state.mode} reading={reading} choose={choose} more={showsAll(full, fold, open, state)} />}
      <LiveRegion message={said} />
    </section>
  );
}
