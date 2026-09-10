/**
 * Scroll area building blocks: the root container, the hover-revealed scrollbar, its thumb,
 * the react-virtuoso `Scroller`, and the geometry/hook utilities they are built from.
 */

export {
  addUnlinkedScrollListener,
  EMPTY_SIZES,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  isScrollingWithinScrollbarBounds,
  linearScale,
  THUMB_MIN_SIZE,
  toInt,
} from '../lib/geometry';
export type { Sizes } from '../lib/geometry';

export {
  useCallbackRef,
  useDebounceCallback,
  useIsomorphicLayoutEffect,
  useResizeObserver,
} from '../lib/hooks';

export { isInShadowRoot, useWheelScroll, WHEEL_LATCH_MS } from '../lib/use-wheel-scroll';
export type { WheelScrollMode } from '../lib/use-wheel-scroll';

export { assignRef, useComposedRef } from '../lib/compose-refs';
export type { MutableRef } from '../lib/compose-refs';

export {
  DEFAULT_SCROLL_HIDE_DELAY,
  ScrollAreaContext,
  ScrollbarContext,
  useScrollAreaContext,
  useScrollAreaContextValue,
  useScrollbarContext,
} from './context';
export type { ScrollAreaContextValue, ScrollbarContextValue } from './context';

export { ScrollAreaThumb } from './thumb';
export type { ScrollAreaThumbProps } from './thumb';

export { ScrollAreaScrollbarImpl } from './scrollbar-impl';
export type { ScrollAreaScrollbarImplProps } from './scrollbar-impl';

export { ScrollAreaScrollbar } from './scrollbar';
export type { ScrollAreaScrollbarProps } from './scrollbar';

export { ScrollArea } from './scroll-area';
export type { ScrollAreaProps } from './scroll-area';

export { generateScrollStyle, Scroller } from './scroller';
