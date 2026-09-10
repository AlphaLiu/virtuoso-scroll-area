type ScrollBehaviorOption = 'auto' | 'smooth';
/** Props shared by `VirtuosoScrollArea` and `VirtuosoGridScrollArea`. */
interface VirtualizedScrollAreaBaseProps {
    /** Class name for the outer container. */
    className?: string;
    /** Class name applied to the scroll-to-top `<button>`. */
    scrollToTopButtonClassName?: string;
    /** Class name applied to the scroll-to-top icon. */
    scrollToTopButtonIconClassName?: string;
    /** Pixel offset of the scroll-to-top button. Defaults to `{ x: -12, y: 0 }`. */
    buttonOffset?: {
        x?: number;
        y?: number;
    };
    scrollbarThumbClassName?: string;
    scrollbarClassName?: string;
    /** Delay (ms) before the scrollbar fades out. Defaults to `600`. */
    scrollHideDelay?: number;
    /** Set to `false` to render your own floating affordance. Defaults to `true`. */
    showScrollToTopButton?: boolean;
    /** Registers this region in the scroll context under this id. */
    scrollContextInstanceId?: string;
}
/** Imperative API exposed through the `ref` of both virtualized scroll areas. */
interface VirtualizedScrollAreaHandle {
    scrollToIndex: (index: number, behavior?: ScrollBehaviorOption) => void;
    scrollToTop: () => void;
}

export type { VirtualizedScrollAreaBaseProps as V, VirtualizedScrollAreaHandle as a };
