import type { HTMLAttributes, Ref } from 'react';

import { forwardRef, useEffect, useRef, useState } from 'react';

import { useComposedRef } from '../lib/compose-refs';
import { cx } from '../lib/cx';
import { useResizeObserver } from '../lib/hooks';
import { useScrollContext } from '../scroll-context';
import { useInjectedStyles } from '../use-injected-styles';
import {
  DEFAULT_SCROLL_HIDE_DELAY,
  ScrollAreaContext,
  useScrollAreaContextValue,
} from './context';
import { ScrollAreaScrollbar } from './scrollbar';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Class name for the inner scrolling viewport (padding here scrolls with the content). */
  viewportClassName?: string;
  /**
   * Ref to the element that actually scrolls (the viewport, not the outer container).
   * Use it to scroll imperatively: `viewportRef.current?.scrollTo({ top: 0 })`.
   */
  viewportRef?: Ref<HTMLDivElement>;
  scrollbarClassName?: string;
  scrollbarThumbClassName?: string;
  /** Delay (ms) before the scrollbar fades out. Defaults to `600`. */
  scrollHideDelay?: number;
}

/**
 * Non-virtualized scroll container with the hover-revealed overlay scrollbar.
 *
 * @example
 * <ScrollArea className="h-64">
 *   <LongContent />
 * </ScrollArea>
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      children,
      viewportClassName,
      viewportRef,
      scrollbarClassName,
      scrollbarThumbClassName,
      scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
      ...props
    },
    forwardedRef,
  ) => {
    useInjectedStyles();
    const [scrollArea, setScrollArea] = useState<HTMLDivElement | null>(null);
    const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
    const [content, setContent] = useState<HTMLDivElement | null>(null);
    const resizeCallbackRef = useRef<(() => void) | null>(null);

    const composedRef = useComposedRef(forwardedRef, setScrollArea);
    const composedViewportRef = useComposedRef(viewportRef, setViewport);

    // Register the viewport with a surrounding `ScrollContextProvider` (a no-op without one) so
    // `useScrollToTop()` / `useScrollToBottom()` work for non-virtualized areas too.
    const { setScrollAreaElement } = useScrollContext();
    useEffect(() => {
      setScrollAreaElement(viewport);
      return () => setScrollAreaElement(null);
    }, [setScrollAreaElement, viewport]);

    // Recompute the scrollbar when the content size changes (lazy loading, expand/collapse, …).
    useResizeObserver(content, () => resizeCallbackRef.current?.());

    const contextValue = useScrollAreaContextValue({
      scrollHideDelay,
      scrollArea,
      viewport,
      onViewportChange: setViewport,
    });

    return (
      <ScrollAreaContext.Provider value={contextValue}>
        <div
          ref={composedRef}
          data-slot="scroll-area"
          {...props}
          className={cx('vsa-scroll-area', 'vsa-scroll-area-layout', className)}
        >
          <div
            ref={composedViewportRef}
            data-slot="scroll-area-viewport"
            className={cx('vsa-viewport', viewportClassName)}
          >
            <div ref={setContent} className="vsa-content">
              {children}
            </div>
          </div>

          <ScrollAreaScrollbar
            className={scrollbarClassName}
            thumbClassName={scrollbarThumbClassName}
            resizeCallbackRef={resizeCallbackRef}
          />
        </div>
      </ScrollAreaContext.Provider>
    );
  },
);
ScrollArea.displayName = 'ScrollArea';
