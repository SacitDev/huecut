/**
 * Count stepper ("How many ideas?", 1 to 8): two labelled buttons around the value, with short words so the row
 * stays one line on a phone. The buttons stay focusable at the ends of the range (`aria-disabled`), and the value is an
 * `<output>`, announced politely.
 */
import { useId } from 'react';
import { Button } from './Button.tsx';
import styles from './Stepper.module.css';

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  /** What is counted: said after each button's words to screen readers only, so its name is whole ("Fewer ideas"). */
  unit?: string;
  min?: number;
  max?: number;
}

export function Stepper({ label, value, onChange, decreaseLabel, increaseLabel, unit, min = 1, max = 8 }: StepperProps) {
  const labelId = useId();
  const named = (words: string) => (unit === undefined ? words : <>{words}<span className="visually-hidden"> {unit}</span></>);
  return (
    <div className={styles.stepper} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.row}>
        <Button
          variant="secondary"
          icon="minus"
          unavailable={value <= min}
          onClick={() => {
            onChange(value - 1);
          }}
        >
          {named(decreaseLabel)}
        </Button>
        <output className={styles.value} aria-labelledby={labelId}>
          {value}
        </output>
        <Button
          variant="secondary"
          icon="plus"
          unavailable={value >= max}
          onClick={() => {
            onChange(value + 1);
          }}
        >
          {named(increaseLabel)}
        </Button>
      </div>
    </div>
  );
}
