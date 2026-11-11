/**
 * The mirror arch, the design's signature: a decorative frame drawn behind a picture. It never
 * clips or masks the picture, so a person's hair is never cut off.
 */
import type { ReactNode } from 'react';
import { cx } from '../cx.ts';
import styles from './Arch.module.css';

export interface ArchProps {
  /** The picture's width over its height, for example 4 / 5. */
  ratio: number;
  /**
   * The picture's average colour from its data file, shown in the final aspect ratio until the picture loads
   * (no shimmer). Without it the block uses the library backdrop grey.
   */
  placeholder?: string;
  /** The picture (an `<img>` with `alt`); without one the arch holds only its colour block. */
  children?: ReactNode;
  className?: string | undefined;
}

export function Arch({ ratio, placeholder, children, className }: ArchProps) {
  return (
    <div className={cx(styles.arch, className)}>
      <span className={styles.frame} aria-hidden="true" />
      <div
        className={styles.picture}
        style={
          placeholder ? { aspectRatio: String(ratio), backgroundColor: placeholder } : { aspectRatio: String(ratio) }
        }
      >
        {children}
      </div>
    </div>
  );
}
