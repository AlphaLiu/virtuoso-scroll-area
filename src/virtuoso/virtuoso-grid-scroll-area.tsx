import type { FC, HTMLAttributes, Key, ReactNode, RefObject } from 'react';
import type { VirtuosoGridHandle } from 'react-virtuoso';

import { forwardRef, useEffect, useMemo, useRef } from 'react';

import { VirtuosoGrid } from 'react-virtuoso';

import { useComposedRef } from '../lib/compose-refs';
import { cx } from '../lib/cx';
import {
  DEFAULT_SCROLL_HIDE_DELAY,
  ScrollAreaContext,
  ScrollAreaScrollbar,
  Scroller,
} from '../scroll-area';
import { DEFAULT_BUTTON_OFFSET, ScrollToTopButton } from '../scroll-to-top-button';
import { useVirtualizedScrollArea } from './use-virtualized-scroll-area';
import type {
  VirtualizedScrollAreaBaseProps,
  VirtualizedScrollAreaHandle,
} from './use-virtualized-scroll-area';

const GridItem: FC<HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

/**
 * react-virtuoso drives the list's `paddingTop`/`paddingBottom` to make room for the rows it does
 * not render; when it reports `0` (the first/last row is rendered) we keep 4px of breathing room
 * at that edge instead.
 */
const GRID_EDGE_PADDING = 4;

/** Grid wrapper handed to react-virtuoso; created per `gridClassName` so it stays referentially stable. */
function createGridList(gridClassName?: string) {
  const GridList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className, style, ...props }, ref) => {
      const paddedStyle = { ...style };
      if (paddedStyle.paddingTop === 0) paddedStyle.paddingTop = GRID_EDGE_PADDING;
      if (paddedStyle.paddingBottom === 0) paddedStyle.paddingBottom = GRID_EDGE_PADDING;

      return (
        <div
          ref={ref}
          {...props}
          className={cx('vsa-grid-list', gridClassName, className)}
          style={paddedStyle}
        >
          {children}
        </div>
      );
    },
  );
  GridList.displayName = 'VirtuosoGridList';
  return GridList;
}

// Rows are measured in pixels, so a row that is only partially visible may not be rendered at
// all. Rendering extra rows above and below the viewport keeps partially visible rows complete.
const DEFAULT_OVERSCAN = { main: 200, reverse: 200 };
const DEFAULT_INCREASE_VIEWPORT_BY = { bottom: 200, top: 200 };

/** Fallback delay for reduced-motion setups or animations that finished before mounting. */
const RELAYOUT_FALLBACK_DELAY = 600;

/**
 * Entrance animations of dialogs/panels are `transform` animations: they do not change the
 * layout, so react-virtuoso's internal ResizeObserver never fires. The viewport width gets
 * published once, mid-animation, at its scaled size while item sizes are published at their
 * final size — and the column count `floor((viewportWidth + gap) / (itemWidth + gap))` then
 * stays wrong forever (for example 51 items rendered in 4 columns leave a last row of 4).
 *
 * After the animation ends this nudges the container by 1px so the observer republishes the
 * real layout size.
 */
function useRelayoutAfterEntranceAnimation(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let nudged = false;
    let fallbackTimer = 0;
    let frame = 0;

    const nudge = () => {
      if (nudged) return;
      nudged = true;
      window.clearTimeout(fallbackTimer);
      frame = requestAnimationFrame(() => {
        element.style.paddingBottom = '1px';
        frame = requestAnimationFrame(() => {
          element.style.paddingBottom = '';
        });
      });
    };

    // `animationend` only bubbles upwards, so an ancestor's entrance animation never passes
    // through this container: listen on `document` and only react to animations that end on
    // the container itself or one of its ancestors.
    const handleAnimationEnd = (event: AnimationEvent) => {
      if ((event.target as Node | null)?.contains(element)) nudge();
    };

    document.addEventListener('animationend', handleAnimationEnd);
    fallbackTimer = window.setTimeout(nudge, RELAYOUT_FALLBACK_DELAY);

    return () => {
      window.clearTimeout(fallbackTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener('animationend', handleAnimationEnd);
      element.style.paddingBottom = '';
    };
  }, [containerRef]);
}

export interface VirtuosoGridScrollAreaProps extends VirtualizedScrollAreaBaseProps {
  /** Total number of cells. */
  totalCount: number;
  /** Renders one cell. */
  itemContent: (index: number) => ReactNode;
  /** Stable key per index. */
  computeItemKey?: (index: number) => Key;
  /** Called whenever the rendered index range changes (useful for lazy loading). */
  onRangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
  /**
   * Extra classes for the grid element. The default is a single column with 16px gaps —
   * pass Tailwind utilities such as `"grid-cols-2 gap-3 md:grid-cols-4"` to override.
   */
  gridClassName?: string;
  /** Rows rendered beyond the viewport. Defaults to `{ main: 200, reverse: 200 }`. */
  overscan?: number | { main: number; reverse: number };
  /** Extra pixels rendered above/below the viewport. Defaults to `{ top: 200, bottom: 200 }`. */
  increaseViewportBy?: number | { top: number; bottom: number };
}

export type VirtuosoGridScrollAreaHandle = VirtualizedScrollAreaHandle;

/**
 * Virtualized grid with the overlay scrollbar and a floating scroll-to-top button.
 *
 * Requires the optional peer dependency `react-virtuoso`.
 *
 * @example
 * <VirtuosoGridScrollArea
 *   totalCount={books.length}
 *   gridClassName="grid-cols-2 gap-3 md:grid-cols-4"
 *   itemContent={(index) => <BookCard book={books[index]} />}
 * />
 */
export const VirtuosoGridScrollArea = forwardRef<
  VirtuosoGridScrollAreaHandle,
  VirtuosoGridScrollAreaProps
>(
  (
    {
      totalCount,
      itemContent,
      computeItemKey,
      onRangeChanged,
      className,
      gridClassName,
      scrollToTopButtonClassName,
      scrollToTopButtonIconClassName,
      buttonOffset = DEFAULT_BUTTON_OFFSET,
      overscan = DEFAULT_OVERSCAN,
      increaseViewportBy = DEFAULT_INCREASE_VIEWPORT_BY,
      scrollbarThumbClassName,
      scrollbarClassName,
      scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
      showScrollToTopButton = true,
      scrollContextInstanceId,
      wheelScroll,
    },
    ref,
  ) => {
    const virtuosoRef = useRef<VirtuosoGridHandle>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const {
      scrollToTop,
      setScrollArea,
      handleScrollerRef,
      scrollerRef,
      resizeCallbackRef,
      scrollAreaContextValue,
    } = useVirtualizedScrollArea({
      handleRef: ref,
      virtuosoRef,
      itemCount: totalCount,
      scrollHideDelay,
      scrollContextInstanceId,
      wheelScroll,
    });

    const composedContainerRef = useComposedRef(containerRef, setScrollArea);
    useRelayoutAfterEntranceAnimation(containerRef);

    const components = useMemo(
      () => ({ List: createGridList(gridClassName), Item: GridItem, Scroller }),
      [gridClassName],
    );

    return (
      <ScrollAreaContext.Provider value={scrollAreaContextValue}>
        <div
          ref={composedContainerRef}
          data-slot="virtuoso-grid-scroll-area"
          className={cx('vsa-scroll-area', className)}
        >
          <div data-virtualized-scroll-area className="vsa-virtualized-scroll-area">
            <VirtuosoGrid
              ref={virtuosoRef}
              scrollerRef={handleScrollerRef}
              totalCount={totalCount}
              overscan={overscan}
              increaseViewportBy={increaseViewportBy}
              components={components}
              itemContent={itemContent}
              computeItemKey={computeItemKey}
              rangeChanged={onRangeChanged}
              style={{ height: '100%' }}
            />
          </div>

          <ScrollAreaScrollbar
            className={scrollbarClassName}
            thumbClassName={scrollbarThumbClassName}
            resizeCallbackRef={resizeCallbackRef}
          />

          {showScrollToTopButton && (
            <ScrollToTopButton
              scrollToTop={scrollToTop}
              scrollToTopButtonClassName={scrollToTopButtonClassName}
              scrollToTopButtonIconClassName={scrollToTopButtonIconClassName}
              buttonOffset={buttonOffset}
              scrollerRef={scrollerRef}
            />
          )}
        </div>
      </ScrollAreaContext.Provider>
    );
  },
);
VirtuosoGridScrollArea.displayName = 'VirtuosoGridScrollArea';
