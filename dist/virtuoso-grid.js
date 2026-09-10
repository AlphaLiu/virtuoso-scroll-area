"use client";
import {
  useVirtualizedScrollArea
} from "./chunk-XLJONMP4.js";
import {
  DEFAULT_BUTTON_OFFSET,
  DEFAULT_SCROLL_HIDE_DELAY,
  ScrollAreaContext,
  ScrollAreaScrollbar,
  ScrollToTopButton,
  Scroller,
  cx,
  useComposedRef,
  useInjectedStyles
} from "./chunk-AVDGLLWT.js";

// src/virtuoso/virtuoso-grid-scroll-area.tsx
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { jsx, jsxs } from "react/jsx-runtime";
var GridItem = ({ children, ...props }) => /* @__PURE__ */ jsx("div", { ...props, children });
var GRID_EDGE_PADDING = 4;
function createGridList(gridClassName) {
  const GridList = forwardRef(
    ({ children, className, style, ...props }, ref) => {
      const paddedStyle = { ...style };
      if (paddedStyle.paddingTop === 0) paddedStyle.paddingTop = GRID_EDGE_PADDING;
      if (paddedStyle.paddingBottom === 0) paddedStyle.paddingBottom = GRID_EDGE_PADDING;
      return /* @__PURE__ */ jsx(
        "div",
        {
          ref,
          ...props,
          className: cx("vsa-grid-list", gridClassName, className),
          style: paddedStyle,
          children
        }
      );
    }
  );
  GridList.displayName = "VirtuosoGridList";
  return GridList;
}
var DEFAULT_OVERSCAN = { main: 200, reverse: 200 };
var DEFAULT_INCREASE_VIEWPORT_BY = { bottom: 200, top: 200 };
var RELAYOUT_FALLBACK_DELAY = 600;
function useRelayoutAfterEntranceAnimation(containerRef) {
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let nudged = false;
    let fallbackTimer = 0;
    let frame = 0;
    const nudge = () => {
      if (nudged) return;
      nudged = true;
      window.clearTimeout(fallbackTimer);
      frame = requestAnimationFrame(() => {
        element.style.paddingBottom = "1px";
        frame = requestAnimationFrame(() => {
          element.style.paddingBottom = "";
        });
      });
    };
    const handleAnimationEnd = (event) => {
      if (event.target?.contains(element)) nudge();
    };
    document.addEventListener("animationend", handleAnimationEnd);
    fallbackTimer = window.setTimeout(nudge, RELAYOUT_FALLBACK_DELAY);
    return () => {
      window.clearTimeout(fallbackTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener("animationend", handleAnimationEnd);
      element.style.paddingBottom = "";
    };
  }, [containerRef]);
}
var VirtuosoGridScrollArea = forwardRef(
  ({
    totalCount,
    itemContent,
    computeItemKey,
    onRangeChanged,
    className,
    gridClassName,
    scrollToTopButtonClassName,
    scrollToTopButtonIconClassName,
    buttonOffset = DEFAULT_BUTTON_OFFSET,
    overscan = DEFAULT_OVERSCAN,
    increaseViewportBy = DEFAULT_INCREASE_VIEWPORT_BY,
    scrollbarThumbClassName,
    scrollbarClassName,
    scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
    showScrollToTopButton = true,
    scrollContextInstanceId
  }, ref) => {
    useInjectedStyles();
    const virtuosoRef = useRef(null);
    const containerRef = useRef(null);
    const {
      scrollToTop,
      setScrollArea,
      handleScrollerRef,
      scrollerRef,
      resizeCallbackRef,
      scrollAreaContextValue
    } = useVirtualizedScrollArea({
      handleRef: ref,
      virtuosoRef,
      itemCount: totalCount,
      scrollHideDelay,
      scrollContextInstanceId
    });
    const composedContainerRef = useComposedRef(containerRef, setScrollArea);
    useRelayoutAfterEntranceAnimation(containerRef);
    const components = useMemo(
      () => ({ List: createGridList(gridClassName), Item: GridItem, Scroller }),
      [gridClassName]
    );
    return /* @__PURE__ */ jsx(ScrollAreaContext.Provider, { value: scrollAreaContextValue, children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: composedContainerRef,
        "data-slot": "virtuoso-grid-scroll-area",
        className: cx("vsa-scroll-area", className),
        children: [
          /* @__PURE__ */ jsx("div", { "data-virtualized-scroll-area": true, className: "vsa-virtualized-scroll-area", children: /* @__PURE__ */ jsx(
            VirtuosoGrid,
            {
              ref: virtuosoRef,
              scrollerRef: handleScrollerRef,
              totalCount,
              overscan,
              increaseViewportBy,
              components,
              itemContent,
              computeItemKey,
              rangeChanged: onRangeChanged,
              style: { height: "100%" }
            }
          ) }),
          /* @__PURE__ */ jsx(
            ScrollAreaScrollbar,
            {
              className: scrollbarClassName,
              thumbClassName: scrollbarThumbClassName,
              resizeCallbackRef
            }
          ),
          showScrollToTopButton && /* @__PURE__ */ jsx(
            ScrollToTopButton,
            {
              scrollToTop,
              scrollToTopButtonClassName,
              scrollToTopButtonIconClassName,
              buttonOffset,
              scrollerRef
            }
          )
        ]
      }
    ) });
  }
);
VirtuosoGridScrollArea.displayName = "VirtuosoGridScrollArea";
export {
  VirtuosoGridScrollArea
};
//# sourceMappingURL=virtuoso-grid.js.map