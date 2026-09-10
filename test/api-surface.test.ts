import { describe, expect, it } from 'vitest';

import * as core from '../src/index';
import * as virtuosoEntry from '../src/virtuoso/index';
import * as virtuosoGridEntry from '../src/virtuoso-grid/index';

/**
 * Locks the public API surface: every export here is documented in the README, so an accidental
 * rename or removal should fail the build rather than break consumers silently.
 */
describe('public API surface', () => {
  it('exposes the components', () => {
    expect(typeof core.ScrollArea).toBe('object'); // forwardRef component
    expect(typeof core.ScrollAreaScrollbar).toBe('object');
    expect(typeof core.ScrollAreaScrollbarImpl).toBe('object');
    expect(typeof core.ScrollAreaThumb).toBe('object');
    expect(typeof core.Scroller).toBe('object');
    expect(typeof core.ScrollToTopButton).toBe('function');
    expect(typeof core.ScrollContextProvider).toBe('function');
  });

  it('exposes the contexts', () => {
    expect(core.ScrollAreaContext).toBeDefined();
    expect(core.ScrollbarContext).toBeDefined();
    expect(core.ScrollContext).toBeDefined();
  });

  it('exposes the hooks', () => {
    for (const hook of [
      'useScrollAreaContext',
      'useScrollbarContext',
      'useScrollContext',
      'useScrollToTop',
      'useScrollToBottom',
      'useCallbackRef',
      'useDebounceCallback',
      'useResizeObserver',
      'useIsomorphicLayoutEffect',
      'useInjectedStyles',
      'useWheelScroll',
    ] as const) {
      expect(typeof core[hook], hook).toBe('function');
    }
  });

  it('exposes the geometry helpers and constants', () => {
    for (const helper of [
      'toInt',
      'getThumbRatio',
      'getThumbSize',
      'linearScale',
      'getScrollPositionFromPointer',
      'getThumbOffsetFromScroll',
      'isScrollingWithinScrollbarBounds',
      'addUnlinkedScrollListener',
      'generateScrollStyle',
      'cx',
      'injectStyles',
      'isInShadowRoot',
    ] as const) {
      expect(typeof core[helper], helper).toBe('function');
    }

    expect(core.THUMB_MIN_SIZE).toBe(18);
    expect(core.DEFAULT_SCROLL_THRESHOLD).toBe(100);
    expect(core.DEFAULT_BUTTON_OFFSET).toEqual({ x: -12, y: 0 });
    expect(core.STYLE_ELEMENT_ID).toBe('virtuo-scroll-area-styles');
    expect(core.STYLE_ELEMENT_ATTRIBUTE).toBe('data-vsa-styles');
    expect(core.WHEEL_LATCH_MS).toBe(150);
    expect(typeof core.styles).toBe('string');
  });

  it('keeps react-virtuoso out of the core entry point', () => {
    // The virtualized components must only be reachable through the optional sub-entries, so
    // that installing the core package never requires react-virtuoso.
    expect(core).not.toHaveProperty('VirtuosoScrollArea');
    expect(core).not.toHaveProperty('VirtuosoGridScrollArea');
  });

  it('exposes the virtualized components from their sub-entries', () => {
    expect(virtuosoEntry.VirtuosoScrollArea).toBeDefined();
    expect(virtuosoGridEntry.VirtuosoGridScrollArea).toBeDefined();
  });
});
