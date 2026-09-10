import { forwardRef, useEffect, useRef } from 'react';

import { useComposedRef } from '../lib/compose-refs';
import { cx } from '../lib/cx';
import { addUnlinkedScrollListener } from '../lib/geometry';
import { useDebounceCallback } from '../lib/hooks';
import { useScrollAreaContext, useScrollbarContext } from './context';

export interface ScrollAreaThumbProps {
  className?: string;
}

/** The draggable thumb. Its position is driven imperatively by the scrollbar via `transform`. */
export const ScrollAreaThumb = forwardRef<HTMLDivElement, ScrollAreaThumbProps>(
  ({ className }, forwardedRef) => {
    const { viewport } = useScrollAreaContext('ScrollAreaThumb');
    const {
      hasThumb,
      onThumbChange,
      onThumbPointerDown,
      onThumbPointerUp,
      onThumbPositionChange,
    } = useScrollbarContext('ScrollAreaThumb');

    const composedRef = useComposedRef(forwardedRef, onThumbChange);

    // While the viewport scrolls, follow it frame by frame (this also catches momentum scrolling
    // that fires no `scroll` events) and stop 100ms after the last `scroll` event.
    const stopFollowingRef = useRef<(() => void) | null>(null);
    const stopFollowingSoon = useDebounceCallback(() => {
      stopFollowingRef.current?.();
      stopFollowingRef.current = null;
    }, 100);

    useEffect(() => {
      if (!viewport) return;

      const handleScroll = () => {
        stopFollowingSoon();
        if (!stopFollowingRef.current) {
          stopFollowingRef.current = addUnlinkedScrollListener(
            viewport,
            onThumbPositionChange,
          );
          onThumbPositionChange();
        }
      };

      onThumbPositionChange();
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, [viewport, stopFollowingSoon, onThumbPositionChange]);

    // Never leave the frame loop running after unmount.
    useEffect(() => () => stopFollowingRef.current?.(), []);

    return (
      <div
        ref={composedRef}
        data-state={hasThumb ? 'visible' : 'hidden'}
        className={cx('vsa-thumb', className)}
        onPointerDownCapture={(event) => {
          // Remember where inside the thumb the drag started so it does not jump under the pointer.
          const thumbTop = event.currentTarget.getBoundingClientRect().top;
          onThumbPointerDown(event.clientY - thumbTop);
        }}
        onPointerUp={onThumbPointerUp}
      />
    );
  },
);
ScrollAreaThumb.displayName = 'ScrollAreaThumb';
