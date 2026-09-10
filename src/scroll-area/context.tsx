import { createContext, useContext, useMemo } from 'react';

/** Default delay (ms) before the scrollbar fades out after the pointer leaves or scrolling stops. */
export const DEFAULT_SCROLL_HIDE_DELAY = 600;

// -------------------------------------------------------------------------------------------------
// ScrollAreaContext — shared by the root, the scrollbar and the thumb
// -------------------------------------------------------------------------------------------------

export interface ScrollAreaContextValue {
  /** Reveal mode. Only `hover` is implemented, kept for API compatibility. */
  type: 'hover';
  /** Delay (ms) before the scrollbar fades out after the pointer leaves or scrolling stops. */
  scrollHideDelay: number;
  scrollArea: HTMLDivElement | null;
  viewport: HTMLDivElement | null;
  onViewportChange: (viewport: HTMLDivElement | null) => void;
}

export const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

/** Reads the surrounding {@link ScrollAreaContext}, throwing a helpful error when missing. */
export function useScrollAreaContext(componentName: string): ScrollAreaContextValue {
  const context = useContext(ScrollAreaContext);
  if (!context) {
    throw new Error(`${componentName} must be used within a ScrollArea`);
  }
  return context;
}

/** Builds a memoized {@link ScrollAreaContextValue} for a scroll-area root. */
export function useScrollAreaContextValue(
  value: Omit<ScrollAreaContextValue, 'type'>,
): ScrollAreaContextValue {
  const { scrollHideDelay, scrollArea, viewport, onViewportChange } = value;
  return useMemo(
    () => ({ type: 'hover', scrollHideDelay, scrollArea, viewport, onViewportChange }),
    [scrollHideDelay, scrollArea, viewport, onViewportChange],
  );
}

// -------------------------------------------------------------------------------------------------
// ScrollbarContext — lets the thumb talk to its scrollbar
// -------------------------------------------------------------------------------------------------

export interface ScrollbarContextValue {
  hasThumb: boolean;
  scrollbar: HTMLDivElement | null;
  onThumbChange: (thumb: HTMLDivElement | null) => void;
  onThumbPointerUp: () => void;
  onThumbPointerDown: (pointerPos: number) => void;
  onThumbPositionChange: () => void;
}

export const ScrollbarContext = createContext<ScrollbarContextValue | null>(null);

/** Reads the surrounding {@link ScrollbarContext}, throwing a helpful error when missing. */
export function useScrollbarContext(componentName: string): ScrollbarContextValue {
  const context = useContext(ScrollbarContext);
  if (!context) {
    throw new Error(`${componentName} must be used within a Scrollbar`);
  }
  return context;
}
