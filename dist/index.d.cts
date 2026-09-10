import * as react from 'react';
import { useEffect, CSSProperties, HTMLAttributes, Ref, ReactNode, FC, RefObject } from 'react';

/**
 * Scrollbar geometry — pure functions mapping between the viewport's scroll position and the
 * thumb's size/offset on the track. Based on the Radix ScrollArea maths.
 *
 * All values are pixels.
 */
/** Measurements the thumb geometry is derived from. */
interface Sizes {
    /** Total scrollable content height (`scrollHeight`). */
    content: number;
    /** Visible viewport height (`offsetHeight`). */
    viewport: number;
    scrollbar: {
        /** Scrollbar track height (`clientHeight`). */
        size: number;
        paddingStart: number;
        paddingEnd: number;
    };
}
/** Smallest thumb length in pixels, so the thumb never becomes a useless sliver. */
declare const THUMB_MIN_SIZE = 18;
/** Parses a CSS length such as `"4px"` into a number, defaulting to 0. */
declare function toInt(value?: string): number;
/** Visible fraction of the content: `viewport / content`. `0` when content is 0. */
declare function getThumbRatio(viewportSize: number, contentSize: number): number;
/** Length of the thumb in pixels, clamped to {@link THUMB_MIN_SIZE}. */
declare function getThumbSize(sizes: Sizes, minSize?: number): number;
/** Builds a linear interpolation function from one numeric range to another. */
declare function linearScale(input: readonly [number, number], output: readonly [number, number]): (value: number) => number;
/**
 * Converts a pointer position on the scrollbar into a `scrollTop` value.
 *
 * @param pointerPos Pointer offset from the top of the scrollbar.
 * @param pointerOffset Where inside the thumb the drag started (`0` centres the thumb under
 * the pointer, e.g. when clicking the track).
 */
declare function getScrollPositionFromPointer(pointerPos: number, pointerOffset: number, sizes: Sizes): number;
/** Converts a `scrollTop` value into the thumb's translate offset in pixels. */
declare function getThumbOffsetFromScroll(scrollPos: number, sizes: Sizes): number;
/** `true` while the scroll position is strictly inside the scrollable range. */
declare function isScrollingWithinScrollbarBounds(scrollPos: number, maxScrollPos: number): boolean;
/**
 * Calls `handler` on every vertical scroll of `node`, including scrolls that do not fire a
 * `scroll` event (momentum scrolling inside some embedded webviews). Returns a cleanup function.
 */
declare function addUnlinkedScrollListener(node: HTMLElement, handler?: () => void): () => void;

/** Layout effect that degrades to a passive effect on the server (avoids SSR warnings). */
declare const useIsomorphicLayoutEffect: typeof useEffect;
/** Keeps a stable identity while always calling the latest `callback`. */
declare function useCallbackRef<T extends (...args: never[]) => unknown>(callback: T | undefined): T;
/** Returns a stable function that debounces `callback` by `delay` ms. */
declare function useDebounceCallback(callback: () => void, delay: number): () => void;
/** Calls `onResize` (batched into an animation frame) whenever `element` is resized. */
declare function useResizeObserver(element: HTMLElement | null, onResize: () => void): void;

/**
 * Writable ref shape (React 18's `MutableRefObject`, React 19's `RefObject` and a plain
 * `useRef` result are all assignable to it).
 */
interface MutableRef<T> {
    current: T;
}

interface ScrollAreaContextValue {
    /** Reveal mode. Only `hover` is implemented, kept for API compatibility. */
    type: 'hover';
    /** Delay (ms) before the scrollbar fades out after the pointer leaves or scrolling stops. */
    scrollHideDelay: number;
    scrollArea: HTMLDivElement | null;
    viewport: HTMLDivElement | null;
    onViewportChange: (viewport: HTMLDivElement | null) => void;
}
declare const ScrollAreaContext: react.Context<ScrollAreaContextValue | null>;
/** Reads the surrounding {@link ScrollAreaContext}, throwing a helpful error when missing. */
declare function useScrollAreaContext(componentName: string): ScrollAreaContextValue;
interface ScrollbarContextValue {
    hasThumb: boolean;
    scrollbar: HTMLDivElement | null;
    onThumbChange: (thumb: HTMLDivElement | null) => void;
    onThumbPointerUp: () => void;
    onThumbPointerDown: (pointerPos: number) => void;
    onThumbPositionChange: () => void;
}
declare const ScrollbarContext: react.Context<ScrollbarContextValue | null>;
/** Reads the surrounding {@link ScrollbarContext}, throwing a helpful error when missing. */
declare function useScrollbarContext(componentName: string): ScrollbarContextValue;

interface ScrollAreaThumbProps {
    className?: string;
}
/** The draggable thumb. Its position is driven imperatively by the scrollbar via `transform`. */
declare const ScrollAreaThumb: react.ForwardRefExoticComponent<ScrollAreaThumbProps & react.RefAttributes<HTMLDivElement>>;

interface ScrollAreaScrollbarImplProps {
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
/**
 * The scrollbar track: owns the DOM interactions (wheel over the track, dragging, resize
 * observation) and delegates the geometry maths to the callbacks passed by the parent.
 */
declare const ScrollAreaScrollbarImpl: react.ForwardRefExoticComponent<ScrollAreaScrollbarImplProps & react.RefAttributes<HTMLDivElement>>;

interface ScrollAreaScrollbarProps {
    className?: string;
    thumbClassName?: string;
    /**
     * Receives the internal `onResize` function so a parent can force a recompute when the
     * content changes without a resize (filtering, expanding, data arriving).
     */
    resizeCallbackRef?: MutableRef<(() => void) | null>;
}
/**
 * Hover-revealed vertical scrollbar. Measures the viewport, computes the thumb geometry and
 * hands the DOM interactions to {@link ScrollAreaScrollbarImpl}.
 */
declare const ScrollAreaScrollbar: react.ForwardRefExoticComponent<ScrollAreaScrollbarProps & react.RefAttributes<HTMLDivElement>>;

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
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
declare const ScrollArea: react.ForwardRefExoticComponent<ScrollAreaProps & react.RefAttributes<HTMLDivElement>>;

/**
 * The custom `Scroller` component handed to react-virtuoso. It becomes the viewport the overlay
 * scrollbar measures, with its native scrollbar hidden by the stylesheet.
 */
declare const Scroller: react.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>>;
/**
 * @deprecated The stylesheet is now injected automatically from the library entry points, so
 * this helper is no longer required. It is kept for backwards compatibility and returns the
 * CSS needed to let react-virtuoso's scroller coexist with the overlay scrollbar.
 */
declare function generateScrollStyle(): string;

/**
 * A single scrollable region registered with the {@link ScrollContextProvider}.
 *
 * `VirtuosoScrollArea` and `VirtuosoGridScrollArea` register themselves automatically when
 * given a `scrollContextInstanceId`.
 */
interface ScrollAreaInstance {
    scrollToTop: () => void;
    scrollToBottom: () => void;
    setScrollAreaElement: (element: HTMLDivElement | null) => void;
}
/** Value provided by {@link ScrollContextProvider}. */
interface ScrollContextType {
    /** Scrolls the *current* (nearest) instance to the top. */
    scrollToTop: () => void;
    /** Scrolls the *current* (nearest) instance to the bottom. */
    scrollToBottom: () => void;
    /** Attaches the element that {@link ScrollContextType.scrollToTop} controls. */
    setScrollAreaElement: (element: HTMLDivElement | null) => void;
    /** Registers a named instance so it can be driven from anywhere via {@link ScrollContextType.getInstance}. */
    registerInstance: (id: string, instance: ScrollAreaInstance) => void;
    /** Removes a named instance. */
    unregisterInstance: (id: string) => void;
    /** Looks up a named instance previously registered with {@link ScrollContextType.registerInstance}. */
    getInstance: (id: string) => ScrollAreaInstance | undefined;
}
/**
 * Context backing {@link ScrollContextProvider}. Defaults are no-ops, so consuming hooks are
 * always safe to call even without a provider higher in the tree.
 */
declare const ScrollContext: react.Context<ScrollContextType>;
interface ScrollContextProviderProps {
    children: ReactNode;
    /** Registers this provider's instance under a stable id for imperative access. */
    instanceId?: string;
}
/**
 * Provides the scroll context: smooth `scrollToTop` / `scrollToBottom` for the nearest region
 * plus a registry for addressing several regions by id.
 *
 * @example
 * const { getInstance } = useScrollContext();
 * getInstance('theme-grid')?.scrollToTop();
 */
declare function ScrollContextProvider({ children, instanceId, }: ScrollContextProviderProps): react.JSX.Element;
/** Reads the {@link ScrollContext}. Never throws — without a provider it returns no-ops. */
declare function useScrollContext(): ScrollContextType;
/** Convenience hook returning the nearest instance's `scrollToTop`. */
declare function useScrollToTop(): () => void;
/** Convenience hook returning the nearest instance's `scrollToBottom`. */
declare function useScrollToBottom(): () => void;

/** Default horizontal/vertical offset from the scroll area's right edge. */
declare const DEFAULT_BUTTON_OFFSET: {
    x: number;
    y: number;
};
/** Scroll distance (in px) after which the button becomes visible. */
declare const DEFAULT_SCROLL_THRESHOLD = 100;
interface ScrollToTopButtonProps {
    /** Invoked when the button is activated. */
    scrollToTop: () => void;
    /** Extra class names for the `<button>` element. */
    scrollToTopButtonClassName?: string;
    /** Extra class names for the default chevron icon (ignored when `icon` is provided). */
    scrollToTopButtonIconClassName?: string;
    /** Pixel offset of the button relative to the right edge / vertical center. */
    buttonOffset?: {
        x?: number;
        y?: number;
    };
    /** The scrolling element to observe. */
    scrollerRef: RefObject<HTMLDivElement | null>;
    /** Scroll distance (px) after which the button appears. Defaults to `100`. */
    threshold?: number;
    /** Accessible label for screen readers. Defaults to `"Scroll to top"`. */
    label?: string;
    /** Replaces the default chevron-up icon. */
    icon?: ReactNode;
}
/**
 * Floating "back to top" button that fades in once the observed scroller has been scrolled
 * past `threshold` pixels.
 *
 * It is rendered by `VirtuosoScrollArea` / `VirtuosoGridScrollArea` by default; use it directly
 * to attach the same affordance to any scrollable element.
 *
 * @example
 * const scrollerRef = useRef<HTMLDivElement>(null);
 *
 * <div className="relative">
 *   <div ref={scrollerRef} className="h-64 overflow-y-auto">…</div>
 *   <ScrollToTopButton
 *     scrollerRef={scrollerRef}
 *     scrollToTop={() => scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
 *   />
 * </div>
 */
declare const ScrollToTopButton: FC<ScrollToTopButtonProps>;

/**
 * Minimal class name joiner.
 *
 * Replaces the `clsx` + `tailwind-merge` pair the component used inside its
 * original application, so this package has **zero runtime dependencies**.
 * Unlike `tailwind-merge` it does not resolve conflicting utility classes —
 * that is unnecessary here because the library ships plain CSS classes
 * (`vsa-*`) rather than utility classes.
 *
 * @example
 * cx('vsa-thumb', isActive && 'is-active', ['extra', { 'is-hidden': hidden }]);
 */
type ClassValue = string | number | boolean | null | undefined | readonly ClassValue[] | Record<string, boolean | null | undefined>;
declare function cx(...inputs: ClassValue[]): string;

/**
 * `id` of the `<style>` element the library injects.
 * Useful for opting out (remove the element) or for asserting injection in tests.
 */
declare const STYLE_ELEMENT_ID = "virtuo-scroll-area-styles";
/** The complete stylesheet shipped with this package, as a string. */
declare const styles: string;
/**
 * Injects the stylesheet into `document.head` once.
 *
 * The library calls this automatically from every entry point (module scope, plus a
 * `useEffect` fallback on first render), so consumers never have to import CSS by hand.
 * Calling it repeatedly is a no-op — injection is keyed to {@link STYLE_ELEMENT_ID}.
 *
 * It is safe to call during SSR: without a document it does nothing. If you prefer a plain
 * `<link>`/bundler-managed stylesheet, import `virtuo-scroll-area/styles.css` instead and
 * remove the injected element.
 *
 * @param target Document to inject into. Defaults to the global `document`.
 */
declare function injectStyles(target?: Document | null): void;

/**
 * Belt-and-braces guarantee that the stylesheet is present.
 *
 * The stylesheet is already injected at module scope; this hook covers exotic setups where
 * the module-scope call was dropped (for example a bundler that strips side effects) or where
 * a component renders into a *different* document (iframes, portals into a new document).
 */
declare function useInjectedStyles(): void;

export { type ClassValue, DEFAULT_BUTTON_OFFSET, DEFAULT_SCROLL_THRESHOLD, type MutableRef, STYLE_ELEMENT_ID, ScrollArea, ScrollAreaContext, type ScrollAreaContextValue, type ScrollAreaInstance, type ScrollAreaProps, ScrollAreaScrollbar, ScrollAreaScrollbarImpl, type ScrollAreaScrollbarImplProps, type ScrollAreaScrollbarProps, ScrollAreaThumb, type ScrollAreaThumbProps, ScrollContext, ScrollContextProvider, type ScrollContextProviderProps, type ScrollContextType, ScrollToTopButton, type ScrollToTopButtonProps, ScrollbarContext, type ScrollbarContextValue, Scroller, type Sizes, THUMB_MIN_SIZE, addUnlinkedScrollListener, cx, generateScrollStyle, getScrollPositionFromPointer, getThumbOffsetFromScroll, getThumbRatio, getThumbSize, injectStyles, isScrollingWithinScrollbarBounds, linearScale, styles, toInt, useCallbackRef, useDebounceCallback, useInjectedStyles, useIsomorphicLayoutEffect, useResizeObserver, useScrollAreaContext, useScrollContext, useScrollToBottom, useScrollToTop, useScrollbarContext };
