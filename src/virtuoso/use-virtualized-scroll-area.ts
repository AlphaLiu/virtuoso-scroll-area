import type { ForwardedRef, RefObject } from 'react';

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useScrollAreaContextValue } from '../scroll-area';
import type { ScrollAreaContextValue } from '../scroll-area';
import { useScrollContext } from '../scroll-context';

type ScrollBehaviorOption = 'auto' | 'smooth';

/** Props shared by `VirtuosoScrollArea` and `VirtuosoGridScrollArea`. */
export interface VirtualizedScrollAreaBaseProps {
  /** Class name for the outer container. */
  className?: string;
  /** Class name applied to the scroll-to-top `<button>`. */
  scrollToTopButtonClassName?: string;
  /** Class name applied to the scroll-to-top icon. */
  scrollToTopButtonIconClassName?: string;
  /** Pixel offset of the scroll-to-top button. Defaults to `{ x: -12, y: 0 }`. */
  buttonOffset?: { x?: number; y?: number };
  scrollbarThumbClassName?: string;
  scrollbarClassName?: string;
  /** Delay (ms) before the scrollbar fades out. Defaults to `600`. */
  scrollHideDelay?: number;
  /** Set to `false` to render your own floating affordance. Defaults to `true`. */
  showScrollToTopButton?: boolean;
  /** Registers this region in the scroll context under this id. */
  scrollContextInstanceId?: string;
}

/** Imperative API exposed through the `ref` of both virtualized scroll areas. */
export interface VirtualizedScrollAreaHandle {
  scrollToIndex: (index: number, behavior?: ScrollBehaviorOption) => void;
  scrollToTop: () => void;
}

/** The part of react-virtuoso's `VirtuosoHandle` / `VirtuosoGridHandle` we rely on. */
interface ScrollToIndexTarget {
  scrollToIndex: (location: { index: number; behavior?: ScrollBehaviorOption }) => void;
}

export interface UseVirtualizedScrollAreaOptions {
  /** The component's forwarded ref; receives the {@link VirtualizedScrollAreaHandle}. */
  handleRef: ForwardedRef<VirtualizedScrollAreaHandle>;
  /** Ref to the underlying `Virtuoso` / `VirtuosoGrid` instance. */
  virtuosoRef: RefObject<ScrollToIndexTarget | null>;
  /** Number of items; `scrollToBottom` targets the last one. */
  itemCount: number;
  /** Delay (ms) before the scrollbar fades out. */
  scrollHideDelay: number;
  /** When set, the region is registered in the scroll context under this id. */
  scrollContextInstanceId?: string;
  /**
   * Delay (ms) before recomputing the scrollbar after `itemCount` changes (filtering, paging, …).
   * `0` (the default) disables the recompute.
   */
  recountDelay?: number;
}

export interface VirtualizedScrollAreaState {
  /** Smoothly scrolls to the first item. */
  scrollToTop: () => void;
  /** Attach to the outer container: the hover target that reveals the scrollbar. */
  setScrollArea: (element: HTMLDivElement | null) => void;
  /** Pass as react-virtuoso's `scrollerRef`. */
  handleScrollerRef: (element: HTMLElement | Window | null) => void;
  /** Virtuoso's scroller element, for `ScrollToTopButton`. */
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Pass to `ScrollAreaScrollbar` so the geometry can be recomputed on demand. */
  resizeCallbackRef: RefObject<(() => void) | null>;
  /** Provide through `ScrollAreaContext`. */
  scrollAreaContextValue: ScrollAreaContextValue;
}

/**
 * Shared wiring for the react-virtuoso based scroll areas: it exposes the imperative handle,
 * turns virtuoso's own scroller element into the "viewport" the overlay scrollbar measures,
 * keeps the thumb geometry in sync while scrolling, and registers the region in the scroll
 * context.
 *
 * Internal — not part of the public API.
 */
export function useVirtualizedScrollArea({
  handleRef,
  virtuosoRef,
  itemCount,
  scrollHideDelay,
  scrollContextInstanceId,
  recountDelay = 0,
}: UseVirtualizedScrollAreaOptions): VirtualizedScrollAreaState {
  const { setScrollAreaElement, registerInstance, unregisterInstance } =
    useScrollContext();
  const [scrollArea, setScrollArea] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const resizeCallbackRef = useRef<(() => void) | null>(null);

  // --- Imperative commands ----------------------------------------------------------------------

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehaviorOption = 'smooth') => {
      virtuosoRef.current?.scrollToIndex({ index, behavior });
    },
    [virtuosoRef],
  );

  const scrollToTop = useCallback(() => scrollToIndex(0), [scrollToIndex]);

  const scrollToBottom = useCallback(
    () => scrollToIndex(itemCount - 1),
    [scrollToIndex, itemCount],
  );

  useImperativeHandle(handleRef, () => ({ scrollToIndex, scrollToTop }), [
    scrollToIndex,
    scrollToTop,
  ]);

  // --- Viewport wiring --------------------------------------------------------------------------

  const handleScrollerRef = useCallback(
    (element: HTMLElement | Window | null) => {
      const next = (element as HTMLDivElement | null) ?? null;
      if (scrollerRef.current === next) return;

      scrollerRef.current = next;
      setViewport(next);
      setScrollAreaElement(next);
    },
    [setScrollAreaElement],
  );

  // Virtuoso keeps changing the scroller's `scrollHeight` as rows come and go, so the geometry
  // has to be re-measured while scrolling (once per frame).
  useEffect(() => {
    if (!viewport) return;

    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resizeCallbackRef.current?.());
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [viewport]);

  // Recompute after the data set shrinks or grows (for example when a filter removes content
  // and the scrollbar has to disappear).
  useEffect(() => {
    if (!recountDelay || itemCount <= 0) return;

    const timer = setTimeout(() => resizeCallbackRef.current?.(), recountDelay);
    return () => clearTimeout(timer);
  }, [itemCount, recountDelay]);

  // --- Scroll context registration --------------------------------------------------------------

  useEffect(() => {
    if (!scrollContextInstanceId) return;

    registerInstance(scrollContextInstanceId, {
      scrollToTop,
      scrollToBottom,
      setScrollAreaElement,
    });
    return () => unregisterInstance(scrollContextInstanceId);
  }, [
    scrollContextInstanceId,
    registerInstance,
    unregisterInstance,
    scrollToTop,
    scrollToBottom,
    setScrollAreaElement,
  ]);

  const scrollAreaContextValue = useScrollAreaContextValue({
    scrollHideDelay,
    scrollArea,
    viewport,
    onViewportChange: setViewport,
  });

  return {
    scrollToTop,
    setScrollArea,
    handleScrollerRef,
    scrollerRef,
    resizeCallbackRef,
    scrollAreaContextValue,
  };
}
