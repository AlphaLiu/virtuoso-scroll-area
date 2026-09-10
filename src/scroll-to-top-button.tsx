import type { FC, ReactNode, RefObject } from 'react';

import { useEffect, useState } from 'react';

import { cx } from './lib/cx';
import { useInjectedStyles } from './use-injected-styles';

/** Default horizontal/vertical offset from the scroll area's right edge. */
export const DEFAULT_BUTTON_OFFSET = { x: -12, y: 0 };

/** Scroll distance (in px) after which the button becomes visible. */
export const DEFAULT_SCROLL_THRESHOLD = 100;

export interface ScrollToTopButtonProps {
  /** Invoked when the button is activated. */
  scrollToTop: () => void;
  /** Extra class names for the `<button>` element. */
  scrollToTopButtonClassName?: string;
  /** Extra class names for the default chevron icon (ignored when `icon` is provided). */
  scrollToTopButtonIconClassName?: string;
  /** Pixel offset of the button relative to the right edge / vertical center. */
  buttonOffset?: { x?: number; y?: number };
  /** The scrolling element to observe. */
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Scroll distance (px) after which the button appears. Defaults to `100`. */
  threshold?: number;
  /** Accessible label for screen readers. Defaults to `"Scroll to top"`. */
  label?: string;
  /** Replaces the default chevron-up icon. */
  icon?: ReactNode;
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

/** `true` once `scrollerRef` has been scrolled past `threshold` pixels (evaluated once per frame). */
function useScrolledPastThreshold(
  scrollerRef: RefObject<HTMLDivElement | null>,
  threshold: number,
): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setScrolledPast(scroller.scrollTop > threshold),
      );
    };

    scroller.addEventListener('scroll', handleScroll);
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollerRef, threshold]);

  return scrolledPast;
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
export const ScrollToTopButton: FC<ScrollToTopButtonProps> = ({
  scrollToTop,
  scrollToTopButtonClassName,
  scrollToTopButtonIconClassName,
  buttonOffset = DEFAULT_BUTTON_OFFSET,
  scrollerRef,
  threshold = DEFAULT_SCROLL_THRESHOLD,
  label = 'Scroll to top',
  icon,
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useInjectedStyles(container);
  const visible = useScrolledPastThreshold(scrollerRef, threshold);
  const { x = 0, y = 0 } = buttonOffset;

  return (
    <div
      ref={setContainer}
      data-visible={visible ? 'true' : 'false'}
      className="vsa-scroll-to-top"
      style={{ transform: `translate(${x}px, calc(-50% + ${y}px))` }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        className={cx('vsa-scroll-to-top-button', scrollToTopButtonClassName)}
      >
        {icon ?? (
          <ChevronUpIcon
            className={cx('vsa-scroll-to-top-icon', scrollToTopButtonIconClassName)}
          />
        )}
        <span className="vsa-sr-only">{label}</span>
      </button>
    </div>
  );
};
