/**
 * "Colour in your results" on Ideas: Keep my colour, One colour for all (with the colour chosen from the 14 all-over
 * shades) or Pick colours for me, for the goals Cut and Both. When no colour fits, or after a dye reaction, the screen says so and offers Keep.
 */
import { useId, useMemo } from 'react';
import { asItemId } from '../../../domain/ids.ts';
import { colourChoiceOf } from '../../../machine/consult.selectors.ts';
import type { ColourMode } from '../../../machine/consult.types.ts';
import { tryOnCopy } from '../../../strings/en-try-on.ts';
import { ideasCopy } from '../../../strings/en-ideas.ts';
import { Button } from '../../../ui/components/Button.tsx';
import { OptionGroup, OptionTile } from '../../../ui/components/OptionTile.tsx';
import { allOverLooks } from './model.ts';
import type { IdeasScreen } from './screen.ts';
import styles from './ideas.module.css';

const t = ideasCopy.colours;
const MODES: readonly ColourMode[] = ['keep', 'one', 'pick'];
/** The colour offered first for One colour. */
const FIRST_SHADE = 'jet-black-all-over';

/** Why the looks stay in the person's own colour, and the offer of Keep. */
export function ColourNotice({ referral, onKeep }: { readonly referral: string | null; readonly onKeep: () => void }) {
  return (
    <div className={styles.notice}>
      {referral !== null && <p className={styles.pairTitle}>{tryOnCopy.referral}</p>}
      {referral !== null && <p>{referral}</p>}
      <p>{referral !== null ? t.referralKept : t.noneFits}</p>
      <div><Button variant="secondary" onClick={onKeep}>{t.keep}</Button></div>
    </div>
  );
}

export function ColourChoice({ s }: { readonly s: IdeasScreen }) {
  const id = useId();
  const { library } = s.context.content;
  const shades = useMemo(() => allOverLooks(library), [library]);
  const choice = colourChoiceOf(s.context.prefs);
  if (!choice) return null;
  const first = shades.find((x) => x.id === FIRST_SHADE)?.id ?? shades[0]?.id;
  const set = (mode: ColourMode, shade: string | null) => { s.port.send({ type: 'PREFS.SET', colour: { mode, shade: shade === null ? null : asItemId(shade) } }); };
  return (
    <div className={styles.colourChoice}>
      {/* One per row: two to a row broke "Pick colours for me" over three lines on a phone. */}
      <OptionGroup legend={t.legend} hint={t.hint}>
        {MODES.filter((m) => m !== 'one' || first !== undefined).map((mode) => (
          <OptionTile key={mode} name="colour-in-results" value={mode} label={t.modes[mode]} checked={choice.mode === mode} onChange={() => { set(mode, mode === 'one' ? (choice.shade ?? first ?? null) : choice.shade); }} />
        ))}
      </OptionGroup>
      {choice.mode === 'one' && (
        <label className={styles.promptLabel} htmlFor={id}>
          {t.which}
          <select id={id} className={styles.select} value={choice.shade ?? first ?? ''} onChange={(e) => { set('one', e.currentTarget.value); }}>
            {shades.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
      )}
      {s.port.selectors.noColourFits(s.context) && <ColourNotice referral={s.engine.referral?.text ?? null} onKeep={() => { set('keep', null); }} />}
    </div>
  );
}
