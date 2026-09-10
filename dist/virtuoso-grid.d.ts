import * as react from 'react';
import { ReactNode, Key } from 'react';
import { V as VirtualizedScrollAreaBaseProps, a as VirtualizedScrollAreaHandle } from './use-virtualized-scroll-area-CafjGSVb.js';

interface VirtuosoGridScrollAreaProps extends VirtualizedScrollAreaBaseProps {
    /** Total number of cells. */
    totalCount: number;
    /** Renders one cell. */
    itemContent: (index: number) => ReactNode;
    /** Stable key per index. */
    computeItemKey?: (index: number) => Key;
    /** Called whenever the rendered index range changes (useful for lazy loading). */
    onRangeChanged?: (range: {
        startIndex: number;
        endIndex: number;
    }) => void;
    /**
     * Extra classes for the grid element. The default is a single column with 16px gaps —
     * pass Tailwind utilities such as `"grid-cols-2 gap-3 md:grid-cols-4"` to override.
     */
    gridClassName?: string;
    /** Rows rendered beyond the viewport. Defaults to `{ main: 200, reverse: 200 }`. */
    overscan?: number | {
        main: number;
        reverse: number;
    };
    /** Extra pixels rendered above/below the viewport. Defaults to `{ top: 200, bottom: 200 }`. */
    increaseViewportBy?: number | {
        top: number;
        bottom: number;
    };
}
type VirtuosoGridScrollAreaHandle = VirtualizedScrollAreaHandle;
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
declare const VirtuosoGridScrollArea: react.ForwardRefExoticComponent<VirtuosoGridScrollAreaProps & react.RefAttributes<VirtualizedScrollAreaHandle>>;

export { VirtuosoGridScrollArea, type VirtuosoGridScrollAreaHandle, type VirtuosoGridScrollAreaProps };
