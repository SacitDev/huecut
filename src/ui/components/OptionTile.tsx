/**
 * Question options: a `fieldset` with a visible legend, and 64 px rounded tiles over
 * native radios or checkboxes, optionally with a picture above the label. Selected: rose-soft fill,
 * 2 px cocoa border and a check icon, never colour alone.
 */
import { useId, useRef, type ReactNode } from 'react';
import { cx } from '../cx.ts';
import { Icon } from '../icons.tsx';
import styles from './OptionTile.module.css';

/** A number range such as "10-30%", "2-8" or "2–3": a narrow line would otherwise break it at the dash. */
const RANGE = /(\d+[-–]\d+%?)/;

/** A question's words as they read (its heading, its help and each answer), every number range kept on one line; the text, and so the accessible name, is unchanged. */
const withRanges = (label: string): ReactNode[] =>
  label.split(RANGE).map((part, i) => (i % 2 === 1 ? <span key={i} className={styles.range}>{part}</span> : part));

export interface OptionGroupProps {
  legend: string;
  /** Help text under the legend, linked with `aria-describedby`. */
  hint?: string;
  /** Two tiles per row for short answers (one per row in narrow containers). */
  twoPerRow?: boolean;
  /** The question is the screen's main content: its legend reads as a heading, set as an H2. */
  large?: boolean;
  children: ReactNode;
}

export function OptionGroup({ legend, hint, twoPerRow = false, large = false, children }: OptionGroupProps) {
  const hintId = useId();
  return (
    <fieldset className={cx(styles.group, large && styles.large)} aria-describedby={hint ? hintId : undefined}>
      <legend className={styles.legend}>{withRanges(legend)}</legend>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {withRanges(hint)}
        </p>
      )}
      <div className={cx(styles.options, twoPerRow && styles.two)}>{children}</div>
    </fieldset>
  );
}

export interface OptionTileProps<V extends string> {
  /** The group's input name. */
  name: string;
  value: V;
  label: string;
  /** A short line under the label, read with it. */
  note?: string | undefined;
  checked: boolean;
  /** Called with this tile's value when it is chosen (or toggled, with `multiple`). */
  onChange: (value: V) => void;
  /** A checkbox for questions with several answers; a radio otherwise. */
  multiple?: boolean;
  /** The URL of a 3:4 picture shown above the label; the label names it, so it has no alt text of its own. */
  image?: string | undefined;
  /** Called after `onChange` when a pointer tap or click chose the tile; never for keys or a click with no pointer (`detail` 0). */
  onTap?: (() => void) | undefined;
}

export function OptionTile<V extends string>({
  name,
  value,
  label,
  note,
  checked,
  onChange,
  multiple = false,
  image,
  onTap,
}: OptionTileProps<V>) {
  const tapped = useRef(false);
  const takeTap = (): void => {
    if (tapped.current) onTap?.();
    tapped.current = false;
  };
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the label forwards every activation to its native input; this only notes which click was a real press
    <label
      className={cx(styles.tile, 'press')}
      // The browser's own click on the input (keys, a forwarded label click) never counts: only a real press on the label.
      onClick={(event) => {
        if (event.detail > 0 && event.target !== event.currentTarget.control) tapped.current = true;
      }}
    >
      <input
        className="visually-hidden"
        type={multiple ? 'checkbox' : 'radio'}
        name={name}
        value={value}
        checked={checked}
        // A tap on the answer already chosen changes nothing, so it fires no change event, but it still means "go on".
        onClick={() => {
          if (checked) takeTap();
        }}
        onChange={() => {
          onChange(value);
          takeTap();
        }}
      />
      {/* Every question picture is 3:4 (photos 480 x 640, drawings 96 x 128), so the space is held before it loads. */}
      {image !== undefined && <img className={styles.picture} src={image} alt="" width={480} height={640} loading="lazy" />}
      <span className={styles.text}>{withRanges(label)}{note !== undefined && <small className={styles.note}>{note}</small>}</span>
      {checked && <Icon name="check" className={styles.check} />}
    </label>
  );
}
