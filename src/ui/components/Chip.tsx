/**
 * Filter chip: a 44 px pill toggle with `aria-pressed`. Selected chips are cocoa with a check
 * icon, so the state never rests on colour alone.
 */
import { cx } from '../cx.ts';
import { Icon } from '../icons.tsx';
import styles from './Chip.module.css';

export interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function Chip({ label, selected, onToggle }: ChipProps) {
  return (
    <button type="button" className={cx(styles.chip, 'press')} aria-pressed={selected} onClick={onToggle}>
      {selected && <Icon name="check" className={styles.check} />}
      <span>{label}</span>
    </button>
  );
}
