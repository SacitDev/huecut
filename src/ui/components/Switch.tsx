/** An on/off setting as a native checkbox with the switch role ("Show lines"); the label is the target. */
import styles from './Switch.module.css';

/** A switch's label, value and optional hint. */
export interface SwitchProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly describedBy?: string;
}

/** The switch itself. */
export function Switch({ label, checked, onChange, describedBy }: SwitchProps) {
  return (
    <label className={styles.switch}>
      <input type="checkbox" role="switch" checked={checked} aria-describedby={describedBy} onChange={(e) => { onChange(e.currentTarget.checked); }} />
      <span>{label}</span>
    </label>
  );
}
