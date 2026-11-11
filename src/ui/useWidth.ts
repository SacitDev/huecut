/** An element's content width in CSS px, kept current by a ResizeObserver: what the painter's canvases size themselves by. */
import { useEffect, useState, type RefObject } from 'react';

/** The element's content width in CSS px; 0 until it is measured. */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry?.contentRect.width ?? 0);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
}
