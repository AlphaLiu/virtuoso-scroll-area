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
  useInjectedStyles
} from "./chunk-AVDGLLWT.js";

// src/virtuoso/virtuoso-scroll-area.tsx
import { forwardRef, useMemo, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import { jsx, jsxs } from "react/jsx-runtime";
function createItemComponent(itemClassName) {
  const Item = forwardRef(
    ({ children, className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, ...props, className: cx(itemClassName, className), children })
  );
  Item.displayName = "VirtuosoItem";
  return Item;
}
var VirtuosoScrollArea = forwardRef(
  ({
    data,
    itemContent,
    className,
    itemClassName,
    scrollToTopButtonClassName,
    scrollToTopButtonIconClassName,
    buttonOffset = DEFAULT_BUTTON_OFFSET,
    overscan = 200,
    increaseViewportBy = 200,
    scrollbarThumbClassName,
    scrollbarClassName,
    scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
    showScrollToTopButton = true,
    scrollContextInstanceId
  }, ref) => {
    useInjectedStyles();
    const virtuosoRef = useRef(null);
    const components = useMemo(
      () => ({ Scroller, Item: createItemComponent(itemClassName) }),
      [itemClassName]
    );
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
      itemCount: data.length,
      scrollHideDelay,
      scrollContextInstanceId,
      // Give virtuoso a moment to re-render before re-measuring after the data changed.
      recountDelay: 50
    });
    return /* @__PURE__ */ jsx(ScrollAreaContext.Provider, { value: scrollAreaContextValue, children: /* @__PURE__ */ jsxs("div", { ref: setScrollArea, className: cx("vsa-scroll-area", className), children: [
      /* @__PURE__ */ jsx("div", { className: "vsa-virtualized-area", children: /* @__PURE__ */ jsx(
        Virtuoso,
        {
          ref: virtuosoRef,
          scrollerRef: handleScrollerRef,
          data,
          overscan,
          increaseViewportBy,
          components,
          itemContent,
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
    ] }) });
  }
);
VirtuosoScrollArea.displayName = "VirtuosoScrollArea";
export {
  VirtuosoScrollArea
};
//# sourceMappingURL=virtuoso.js.map