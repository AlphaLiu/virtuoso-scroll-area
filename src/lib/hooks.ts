import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

/** Layout effect that degrades to a passive effect on the server (avoids SSR warnings). */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Keeps a stable identity while always calling the latest `callback`. */
export function useCallbackRef<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useMemo(() => ((...args) => callbackRef.current?.(...args)) as T, []);
}

/** Returns a stable function that debounces `callback` by `delay` ms. */
export function useDebounceCallback(callback: () => void, delay: number): () => void {
  const handleCallback = useCallbackRef(callback);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(handleCallback, delay);
  }, [handleCallback, delay]);
}

/** Calls `onResize` (batched into an animation frame) whenever `element` is resized. */
export function useResizeObserver(
  element: HTMLElement | null,
  onResize: () => void,
): void {
  const handleResize = useCallbackRef(onResize);

  useIsomorphicLayoutEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(handleResize);
    });
    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [element, handleResize]);
}
