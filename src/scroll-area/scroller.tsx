import type { HTMLAttributes } from 'react';

import { forwardRef } from 'react';

import { cx } from '../lib/cx';

/**
 * The custom `Scroller` component handed to react-virtuoso. It becomes the viewport the overlay
 * scrollbar measures, with its native scrollbar hidden by the stylesheet.
 */
export const Scroller = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cx('vsa-scroller', className)}
      data-virtuoso-scroller
    >
      {children}
    </div>
  ),
);
Scroller.displayName = 'Scroller';

/**
 * @deprecated The stylesheet is now injected automatically from the library entry points, so
 * this helper is no longer required. It is kept for backwards compatibility and returns the
 * CSS needed to let react-virtuoso's scroller coexist with the overlay scrollbar.
 */
export function generateScrollStyle(): string {
  return `
    .vsa-virtualized-scroll-area {
      overflow: hidden !important;
    }

    .vsa-scroller[data-virtuoso-scroller] {
      overflow-y: scroll !important;
      overflow-x: hidden !important;
      scrollbar-width: none !important;
    }

    .vsa-scroller[data-virtuoso-scroller]::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
      background: transparent !important;
    }
  `;
}
