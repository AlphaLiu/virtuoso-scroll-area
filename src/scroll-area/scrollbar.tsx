import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import type { MutableRef } from '../lib/compose-refs';
import { useComposedRef } from '../lib/compose-refs';
import {
  EMPTY_SIZES,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  isScrollingWithinScrollbarBounds,
  toInt,
} from '../lib/geometry';
import type { Sizes } from '../lib/geometry';
import { useInjectedStyles } from '../use-injected-styles';
import { useScrollAreaContext } from './context';
import { ScrollAreaScrollbarImpl } from './scrollbar-impl';

export interface ScrollAreaScrollbarProps {
  className?: string;
  thumbClassName?: string;
  /**
   * Receives the internal `onResize` function so a parent can force a recompute when the
   * content changes without a resize (filtering, expanding, data arriving).
   */
  resizeCallbackRef?: MutableRef<(() => void) | null>;
}

/**
 * `true` while the pointer is inside the scroll area or the viewport is scrolling; flips back to
 * `false` `hideDelay` ms after the pointer leaves or the last scroll event.
 */
function useScrollbarVisibility(
  scrollArea: HTMLDivElement | null,
  viewport: HTMLDivElement | null,
  hideDelay: number,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!scrollArea) return;

    let hideTimer = 0;
    const show = () => {
      window.clearTimeout(hideTimer);
      setVisible(true);
    };
    const hideLater = () => {
      hideTimer = window.setTimeout(() => setVisible(false), hideDelay);
    };

    scrollArea.addEventListener('pointerenter', show);
    scrollArea.addEventListener('pointerleave', hideLater);
    return () => {
      window.clearTimeout(hideTimer);
      scrollArea.removeEventListener('pointerenter', show);
      scrollArea.removeEventListener('pointerleave', hideLater);
    };
  }, [scrollArea, hideDelay]);

  useEffect(() => {
    if (!viewport) return;

    let hideTimer = 0;
    const handleScroll = () => {
      setVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisible(false), hideDelay);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      window.clearTimeout(hideTimer);
    };
  }, [viewport, hideDelay]);

  return visible;
}

/**
 * Hover-revealed vertical scrollbar. Measures the viewport, computes the thumb geometry and
 * hands the DOM interactions to {@link ScrollAreaScrollbarImpl}.
 */
export const ScrollAreaScrollbar = forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(
  ({ className, thumbClassName, resizeCallbackRef }, forwardedRef) => {
    useInjectedStyles();
    const { scrollArea, viewport, scrollHideDelay } =
      useScrollAreaContext('ScrollAreaScrollbar');
    const visible = useScrollbarVisibility(scrollArea, viewport, scrollHideDelay);

    const scrollbarRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);
    /** Where inside the thumb the current drag started; `0` when not dragging the thumb. */
    const pointerOffsetRef = useRef(0);
    const [sizes, setSizes] = useState<Sizes>(EMPTY_SIZES);

    const composedRef = useComposedRef(forwardedRef, scrollbarRef);

    const thumbRatio = getThumbRatio(sizes.viewport, sizes.content);
    const hasThumb = thumbRatio > 0 && thumbRatio < 1;

    const onThumbChange = useCallback((thumb: HTMLDivElement | null) => {
      thumbRef.current = thumb;
    }, []);

    const onThumbPointerDown = useCallback((pointerPos: number) => {
      pointerOffsetRef.current = pointerPos;
    }, []);

    const onThumbPointerUp = useCallback(() => {
      pointerOffsetRef.current = 0;
    }, []);

    const onThumbPositionChange = useCallback(() => {
      if (!viewport || !thumbRef.current) return;
      const offset = getThumbOffsetFromScroll(viewport.scrollTop, sizes);
      thumbRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
    }, [viewport, sizes]);

    const onWheelScroll = useCallback(
      (event: WheelEvent, maxScrollPos: number) => {
        if (!viewport) return;
        const scrollPos = viewport.scrollTop + event.deltaY;
        viewport.scrollTop = scrollPos;
        // Only swallow the event while we can still scroll, so the page keeps scrolling at the ends.
        if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) {
          event.preventDefault();
        }
      },
      [viewport],
    );

    const onDragScroll = useCallback(
      (pointerPos: number) => {
        if (!viewport) return;
        viewport.scrollTop = getScrollPositionFromPointer(
          pointerPos,
          pointerOffsetRef.current,
          sizes,
        );
      },
      [viewport, sizes],
    );

    const onResize = useCallback(() => {
      const scrollbar = scrollbarRef.current;
      if (!scrollbar || !viewport) return;

      const scrollbarStyle = getComputedStyle(scrollbar);
      setSizes({
        content: viewport.scrollHeight,
        viewport: viewport.offsetHeight,
        scrollbar: {
          size: scrollbar.clientHeight,
          paddingStart: toInt(scrollbarStyle.paddingTop),
          paddingEnd: toInt(scrollbarStyle.paddingBottom),
        },
      });
    }, [viewport]);

    // Expose `onResize` so a parent can trigger a recompute after content changes.
    useEffect(() => {
      if (resizeCallbackRef) resizeCallbackRef.current = onResize;
    }, [onResize, resizeCallbackRef]);

    return (
      <ScrollAreaScrollbarImpl
        ref={composedRef}
        className={className}
        thumbClassName={thumbClassName}
        sizes={sizes}
        hasThumb={hasThumb}
        onThumbChange={onThumbChange}
        onThumbPointerUp={onThumbPointerUp}
        onThumbPointerDown={onThumbPointerDown}
        onThumbPositionChange={onThumbPositionChange}
        onWheelScroll={onWheelScroll}
        onDragScroll={onDragScroll}
        onResize={onResize}
        data-state={visible ? 'visible' : 'hidden'}
        style={{ opacity: visible ? 1 : 0 }}
      />
    );
  },
);
ScrollAreaScrollbar.displayName = 'ScrollAreaScrollbar';
