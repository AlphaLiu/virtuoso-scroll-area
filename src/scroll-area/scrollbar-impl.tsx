import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import { useComposedRef } from '../lib/compose-refs';
import { cx } from '../lib/cx';
import { getThumbSize } from '../lib/geometry';
import type { Sizes } from '../lib/geometry';
import { useCallbackRef, useDebounceCallback, useResizeObserver } from '../lib/hooks';
import { ScrollbarContext, useScrollAreaContext } from './context';
import type { ScrollbarContextValue } from './context';
import { ScrollAreaThumb } from './thumb';

export interface ScrollAreaScrollbarImplProps {
  className?: string;
  thumbClassName?: string;
  style?: CSSProperties;
  'data-state'?: string;
  sizes: Sizes;
  hasThumb: boolean;
  onThumbChange: (thumb: HTMLDivElement | null) => void;
  onThumbPointerUp: () => void;
  onThumbPointerDown: (pointerPos: number) => void;
  onThumbPositionChange: () => void;
  onWheelScroll: (event: WheelEvent, maxScrollPos: number) => void;
  onDragScroll: (pointerPos: number) => void;
  onResize: () => void;
}

const MAIN_POINTER_BUTTON = 0;

/** Applied when the content fits: the track stays in the layout but is neither seen nor hit. */
const HIDDEN_STYLE: CSSProperties = { visibility: 'hidden', pointerEvents: 'none' };

/**
 * The scrollbar track: owns the DOM interactions (wheel over the track, dragging, resize
 * observation) and delegates the geometry maths to the callbacks passed by the parent.
 */
export const ScrollAreaScrollbarImpl = forwardRef<
  HTMLDivElement,
  ScrollAreaScrollbarImplProps
>(
  (
    {
      className,
      thumbClassName,
      style,
      'data-state': dataState,
      sizes,
      hasThumb,
      onThumbChange,
      onThumbPointerUp,
      onThumbPointerDown,
      onThumbPositionChange,
      onWheelScroll,
      onDragScroll,
      onResize,
    },
    forwardedRef,
  ) => {
    const { viewport } = useScrollAreaContext('ScrollAreaScrollbarImpl');
    const [scrollbar, setScrollbar] = useState<HTMLDivElement | null>(null);
    const composedRef = useComposedRef(forwardedRef, setScrollbar);
    const maxScrollPos = sizes.content - sizes.viewport;

    // Stable wrappers, so effects and the context value do not churn when the parent re-renders.
    const handleWheelScroll = useCallbackRef(onWheelScroll);
    const handleThumbPositionChange = useCallbackRef(onThumbPositionChange);
    const handleThumbChange = useCallbackRef(onThumbChange);
    const handleThumbPointerUp = useCallbackRef(onThumbPointerUp);
    const handleThumbPointerDown = useCallbackRef(onThumbPointerDown);
    const handleResize = useDebounceCallback(onResize, 10);

    // Wheel events over the track scroll the viewport.
    useEffect(() => {
      if (!scrollbar) return;

      const handleWheel = (event: WheelEvent) => {
        if (scrollbar.contains(event.target as Node)) {
          handleWheelScroll(event, maxScrollPos);
        }
      };
      document.addEventListener('wheel', handleWheel, { passive: false });
      return () => document.removeEventListener('wheel', handleWheel);
    }, [scrollbar, maxScrollPos, handleWheelScroll]);

    // Re-position the thumb whenever the geometry changes.
    useEffect(() => {
      handleThumbPositionChange();
    }, [sizes, handleThumbPositionChange]);

    useResizeObserver(scrollbar, handleResize);
    useResizeObserver(viewport, handleResize);

    // Dragging: while a drag is active, `dragRectRef` holds the track's rect so pointer positions
    // can be made relative to it.
    const dragRectRef = useRef<DOMRect | null>(null);
    const previousUserSelectRef = useRef('');

    const dragTo = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRectRef.current) {
        onDragScroll(event.clientY - dragRectRef.current.top);
      }
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== MAIN_POINTER_BUTTON || !scrollbar) return;

      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      dragRectRef.current = scrollbar.getBoundingClientRect();
      // Prevent text selection and smooth-scroll lag while dragging.
      previousUserSelectRef.current = document.body.style.webkitUserSelect;
      document.body.style.webkitUserSelect = 'none';
      if (viewport) viewport.style.scrollBehavior = 'auto';
      dragTo(event);
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = event.target as HTMLElement;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      document.body.style.webkitUserSelect = previousUserSelectRef.current;
      if (viewport) viewport.style.scrollBehavior = '';
      dragRectRef.current = null;
    };

    const scrollbarContextValue = useMemo<ScrollbarContextValue>(
      () => ({
        hasThumb,
        scrollbar,
        onThumbChange: handleThumbChange,
        onThumbPointerUp: handleThumbPointerUp,
        onThumbPointerDown: handleThumbPointerDown,
        onThumbPositionChange: handleThumbPositionChange,
      }),
      [
        hasThumb,
        scrollbar,
        handleThumbChange,
        handleThumbPointerUp,
        handleThumbPointerDown,
        handleThumbPositionChange,
      ],
    );

    return (
      <div
        ref={composedRef}
        data-orientation="vertical"
        data-state={dataState}
        className={cx('vsa-scrollbar', className)}
        style={{
          ['--vsa-thumb-height' as string]: `${getThumbSize(sizes)}px`,
          ...style,
          ...(hasThumb ? null : HIDDEN_STYLE),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={dragTo}
        onPointerUp={handlePointerUp}
      >
        <ScrollbarContext.Provider value={scrollbarContextValue}>
          <ScrollAreaThumb className={thumbClassName} />
        </ScrollbarContext.Provider>
      </div>
    );
  },
);
ScrollAreaScrollbarImpl.displayName = 'ScrollAreaScrollbarImpl';
