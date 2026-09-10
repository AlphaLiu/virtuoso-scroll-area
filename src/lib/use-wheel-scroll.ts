import { useEffect } from 'react';

/**
 * When the library takes over wheel scrolling of a viewport.
 *
 * - `auto` (default): only when the viewport lives inside a Shadow DOM tree.
 * - `always`: unconditionally — for light-DOM viewports that sit under a body-scroll-lock.
 * - `never`: leave wheel handling entirely to the browser.
 */
export type WheelScrollMode = 'auto' | 'always' | 'never';

/** Firefox reports `DOM_DELTA_LINE` deltas in "lines"; one line is treated as 16px. */
const LINE_HEIGHT_PX = 16;

/**
 * A wheel gesture that started in this viewport keeps scrolling it, even at the boundary, for
 * as long as events keep arriving within this window (ms). Mirrors the browsers' scroll-chain
 * latching so trackpad inertia does not spill over to the host page.
 */
export const WHEEL_LATCH_MS = 150;

/** `true` when `node` is attached below a `ShadowRoot`. */
export function isInShadowRoot(node: Node | null | undefined): boolean {
  if (!node || typeof ShadowRoot === 'undefined') return false;
  return node.getRootNode() instanceof ShadowRoot;
}

function normalizeDeltaY(event: WheelEvent, viewport: HTMLElement): number {
  switch (event.deltaMode) {
    case 1: // WheelEvent.DOM_DELTA_LINE
      return event.deltaY * LINE_HEIGHT_PX;
    case 2: // WheelEvent.DOM_DELTA_PAGE
      return event.deltaY * viewport.clientHeight;
    default:
      return event.deltaY;
  }
}

/**
 * Takes over vertical wheel scrolling of `viewport`.
 *
 * Host pages and body-scroll-lock libraries (Radix Dialog's `react-remove-scroll`, …) listen
 * for `wheel` on `document` and `preventDefault()` events they cannot attribute to a scroller
 * they know. Events coming out of a Shadow DOM tree are retargeted to the shadow host, so they
 * are always "foreign" and get cancelled — the viewport never scrolls. This hook listens on the
 * viewport itself (capture, non-passive), consumes the event and writes `scrollTop` once per
 * frame, so scrolling works no matter what the document-level listeners decide.
 *
 * The browser's scroll chaining is preserved: when the viewport cannot move any further in the
 * wheel direction the event is left alone and bubbles to the ancestors — except in the middle
 * of a gesture that started here (see {@link WHEEL_LATCH_MS}). Pinch-zoom (`ctrlKey`) and pure
 * horizontal wheel events are never intercepted.
 *
 * @param viewport The scrolling element (the `ScrollArea` viewport or virtuoso's scroller).
 * @param mode See {@link WheelScrollMode}. Defaults to `'auto'`.
 */
export function useWheelScroll(
  viewport: HTMLElement | null,
  mode: WheelScrollMode = 'auto',
): void {
  useEffect(() => {
    if (!viewport || mode === 'never') return;
    if (mode === 'auto' && !isInShadowRoot(viewport)) return;

    let frame: number | null = null;
    let pendingDelta = 0;
    let lastConsumedAt = -Infinity;
    const options: AddEventListenerOptions = { passive: false, capture: true };

    const applyScroll = () => {
      frame = null;
      if (pendingDelta === 0) return;

      const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const current = viewport.scrollTop;
      const next = Math.max(0, Math.min(current + pendingDelta, maxScrollTop));
      pendingDelta = 0;

      if (Math.abs(next - current) > 0.001) viewport.scrollTop = next;
    };

    const handleWheel = (event: WheelEvent) => {
      // Pinch-zoom on trackpads arrives as a wheel event with ctrlKey; pure horizontal wheel
      // has nothing to do with a vertical viewport. Let the browser handle both.
      if (event.ctrlKey || event.deltaY === 0) return;

      const delta = normalizeDeltaY(event, viewport);
      const now = event.timeStamp;
      const latched = now - lastConsumedAt <= WHEEL_LATCH_MS;

      if (!latched) {
        const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        const predicted = viewport.scrollTop + pendingDelta;
        const atStart = delta < 0 && predicted <= 0;
        const atEnd = delta > 0 && predicted >= maxScrollTop;
        // Nothing left to scroll here: leave the event alone so the ancestors can chain.
        if (atStart || atEnd) return;
      }

      event.preventDefault();
      event.stopPropagation();
      lastConsumedAt = now;
      pendingDelta += delta;

      if (frame === null) frame = requestAnimationFrame(applyScroll);
    };

    viewport.addEventListener('wheel', handleWheel, options);
    return () => {
      viewport.removeEventListener('wheel', handleWheel, options);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [viewport, mode]);
}
