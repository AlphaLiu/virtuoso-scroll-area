import * as react from 'react';
import { ReactNode } from 'react';
import { V as VirtualizedScrollAreaBaseProps, a as VirtualizedScrollAreaHandle } from './use-virtualized-scroll-area-CafjGSVb.js';

interface VirtuosoScrollAreaProps<T = unknown> extends VirtualizedScrollAreaBaseProps {
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
type VirtuosoScrollAreaHandle = VirtualizedScrollAreaHandle;
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
declare const VirtuosoScrollArea: react.ForwardRefExoticComponent<VirtuosoScrollAreaProps<any> & react.RefAttributes<VirtualizedScrollAreaHandle>>;

export { VirtuosoScrollArea, type VirtuosoScrollAreaHandle, type VirtuosoScrollAreaProps };
