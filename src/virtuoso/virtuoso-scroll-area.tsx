import type { HTMLAttributes, ReactNode } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { forwardRef, useMemo, useRef } from 'react';

import { Virtuoso } from 'react-virtuoso';

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

/** Row wrapper handed to react-virtuoso; created per `itemClassName` so it stays referentially stable. */
function createItemComponent(itemClassName?: string) {
  const Item = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className, ...props }, ref) => (
      <div ref={ref} {...props} className={cx(itemClassName, className)}>
        {children}
      </div>
    ),
  );
  Item.displayName = 'VirtuosoItem';
  return Item;
}

export interface VirtuosoScrollAreaProps<
  T = unknown,
> extends VirtualizedScrollAreaBaseProps {
  /** Items rendered by `itemContent`. */
  data: T[];
  /** Renders one row. */
  itemContent: (index: number, item: T) => ReactNode;
  /** Class name applied to every row. */
  itemClassName?: string;
  /** Rows rendered beyond the viewport. Defaults to `200`. */
  overscan?: number;
  /** Extra pixels rendered above/below the viewport. Defaults to `200`. */
  increaseViewportBy?: number;
}

export type VirtuosoScrollAreaHandle = VirtualizedScrollAreaHandle;

/**
 * Virtualized vertical list with the overlay scrollbar and a floating scroll-to-top button.
 *
 * Requires the optional peer dependency `react-virtuoso`.
 *
 * @example
 * <VirtuosoScrollArea
 *   data={rows}
 *   itemClassName="px-4 py-2"
 *   itemContent={(_index, row) => <Row row={row} />}
 * />
 */
export const VirtuosoScrollArea = forwardRef<
  VirtuosoScrollAreaHandle,
  VirtuosoScrollAreaProps<any>
>(
  (
    {
      data,
      itemContent,
      className,
      itemClassName,
      scrollToTopButtonClassName,
      scrollToTopButtonIconClassName,
      buttonOffset = DEFAULT_BUTTON_OFFSET,
      overscan = 200,
      increaseViewportBy = 200,
      scrollbarThumbClassName,
      scrollbarClassName,
      scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
      showScrollToTopButton = true,
      scrollContextInstanceId,
      wheelScroll,
    },
    ref,
  ) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    const components = useMemo(
      () => ({ Scroller, Item: createItemComponent(itemClassName) }),
      [itemClassName],
    );

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
      itemCount: data.length,
      scrollHideDelay,
      scrollContextInstanceId,
      wheelScroll,
      // Give virtuoso a moment to re-render before re-measuring after the data changed.
      recountDelay: 50,
    });

    return (
      <ScrollAreaContext.Provider value={scrollAreaContextValue}>
        <div ref={setScrollArea} className={cx('vsa-scroll-area', className)}>
          <div className="vsa-virtualized-area">
            <Virtuoso
              ref={virtuosoRef}
              scrollerRef={handleScrollerRef}
              data={data}
              overscan={overscan}
              increaseViewportBy={increaseViewportBy}
              components={components}
              itemContent={itemContent}
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
VirtuosoScrollArea.displayName = 'VirtuosoScrollArea';
