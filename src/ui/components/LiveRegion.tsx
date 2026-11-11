/**
 * A polite live region: it stays mounted, so each new message is announced once. Stage
 * changes and results go here, never a running timer.
 */

export interface LiveRegionProps {
  message: string;
  /** Show the message on screen with this class; without it the region is for screen readers only. */
  className?: string | undefined;
}

export function LiveRegion({ message, className }: LiveRegionProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={className ?? 'visually-hidden'}>
      {message}
    </div>
  );
}
