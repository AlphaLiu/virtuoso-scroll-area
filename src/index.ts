/**
 * virtuo-scroll-area — core entry point.
 *
 * Zero runtime dependencies. The virtualized integrations live in the optional sub-entries
 * `virtuo-scroll-area/virtuoso` and `virtuo-scroll-area/virtuoso-grid`, which require
 * `react-virtuoso` to be installed.
 */

export {
  addUnlinkedScrollListener,
  generateScrollStyle,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  isScrollingWithinScrollbarBounds,
  linearScale,
  ScrollArea,
  ScrollAreaContext,
  ScrollAreaScrollbar,
  ScrollAreaScrollbarImpl,
  ScrollAreaThumb,
  ScrollbarContext,
  Scroller,
  THUMB_MIN_SIZE,
  toInt,
  useCallbackRef,
  useDebounceCallback,
  useIsomorphicLayoutEffect,
  useResizeObserver,
  useScrollAreaContext,
  useScrollbarContext,
} from './scroll-area';
export type {
  MutableRef,
  ScrollAreaContextValue,
  ScrollAreaProps,
  ScrollAreaScrollbarImplProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollbarContextValue,
  Sizes,
} from './scroll-area';

export {
  ScrollContext,
  ScrollContextProvider,
  useScrollContext,
  useScrollToBottom,
  useScrollToTop,
} from './scroll-context';
export type {
  ScrollAreaInstance,
  ScrollContextProviderProps,
  ScrollContextType,
} from './scroll-context';

export {
  DEFAULT_BUTTON_OFFSET,
  DEFAULT_SCROLL_THRESHOLD,
  ScrollToTopButton,
} from './scroll-to-top-button';
export type { ScrollToTopButtonProps } from './scroll-to-top-button';

export { cx } from './lib/cx';
export type { ClassValue } from './lib/cx';

export { injectStyles, STYLE_ELEMENT_ID, styles } from './styles';
export { useInjectedStyles } from './use-injected-styles';
