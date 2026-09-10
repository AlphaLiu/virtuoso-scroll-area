"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_BUTTON_OFFSET: () => DEFAULT_BUTTON_OFFSET,
  DEFAULT_SCROLL_THRESHOLD: () => DEFAULT_SCROLL_THRESHOLD,
  STYLE_ELEMENT_ID: () => STYLE_ELEMENT_ID,
  ScrollArea: () => ScrollArea,
  ScrollAreaContext: () => ScrollAreaContext,
  ScrollAreaScrollbar: () => ScrollAreaScrollbar,
  ScrollAreaScrollbarImpl: () => ScrollAreaScrollbarImpl,
  ScrollAreaThumb: () => ScrollAreaThumb,
  ScrollContext: () => ScrollContext,
  ScrollContextProvider: () => ScrollContextProvider,
  ScrollToTopButton: () => ScrollToTopButton,
  ScrollbarContext: () => ScrollbarContext,
  Scroller: () => Scroller,
  THUMB_MIN_SIZE: () => THUMB_MIN_SIZE,
  addUnlinkedScrollListener: () => addUnlinkedScrollListener,
  cx: () => cx,
  generateScrollStyle: () => generateScrollStyle,
  getScrollPositionFromPointer: () => getScrollPositionFromPointer,
  getThumbOffsetFromScroll: () => getThumbOffsetFromScroll,
  getThumbRatio: () => getThumbRatio,
  getThumbSize: () => getThumbSize,
  injectStyles: () => injectStyles,
  isScrollingWithinScrollbarBounds: () => isScrollingWithinScrollbarBounds,
  linearScale: () => linearScale,
  styles: () => styles,
  toInt: () => toInt,
  useCallbackRef: () => useCallbackRef,
  useDebounceCallback: () => useDebounceCallback,
  useInjectedStyles: () => useInjectedStyles,
  useIsomorphicLayoutEffect: () => useIsomorphicLayoutEffect,
  useResizeObserver: () => useResizeObserver,
  useScrollAreaContext: () => useScrollAreaContext,
  useScrollContext: () => useScrollContext,
  useScrollToBottom: () => useScrollToBottom,
  useScrollToTop: () => useScrollToTop,
  useScrollbarContext: () => useScrollbarContext
});
module.exports = __toCommonJS(src_exports);

// src/lib/geometry.ts
var THUMB_MIN_SIZE = 18;
var EMPTY_SIZES = {
  content: 0,
  viewport: 0,
  scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 }
};
function toInt(value) {
  return value ? Number.parseInt(value, 10) : 0;
}
function getTrackSize(sizes) {
  return sizes.scrollbar.size - sizes.scrollbar.paddingStart - sizes.scrollbar.paddingEnd;
}
function getThumbRatio(viewportSize, contentSize) {
  const ratio = viewportSize / contentSize;
  return Number.isNaN(ratio) ? 0 : ratio;
}
function getThumbSize(sizes, minSize = THUMB_MIN_SIZE) {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  return Math.max(getTrackSize(sizes) * ratio, minSize);
}
function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}
function getScrollPositionFromPointer(pointerPos, pointerOffset, sizes) {
  const thumbSize = getThumbSize(sizes);
  const offsetInThumb = pointerOffset || thumbSize / 2;
  const minPointerPos = sizes.scrollbar.paddingStart + offsetInThumb;
  const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - (thumbSize - offsetInThumb);
  const maxScrollPos = sizes.content - sizes.viewport;
  return linearScale([minPointerPos, maxPointerPos], [0, maxScrollPos])(pointerPos);
}
function getThumbOffsetFromScroll(scrollPos, sizes) {
  const maxScrollPos = sizes.content - sizes.viewport;
  const maxThumbPos = getTrackSize(sizes) - getThumbSize(sizes);
  const clampedScrollPos = Math.max(0, Math.min(scrollPos, maxScrollPos));
  return linearScale([0, maxScrollPos], [0, maxThumbPos])(clampedScrollPos);
}
function isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos) {
  return scrollPos > 0 && scrollPos < maxScrollPos;
}
function addUnlinkedScrollListener(node, handler = () => {
}) {
  let previousTop = node.scrollTop;
  let frame = 0;
  const loop = () => {
    const top = node.scrollTop;
    if (top !== previousTop) handler();
    previousTop = top;
    frame = window.requestAnimationFrame(loop);
  };
  loop();
  return () => window.cancelAnimationFrame(frame);
}

// src/lib/hooks.ts
var import_react = require("react");
var useIsomorphicLayoutEffect = typeof window === "undefined" ? import_react.useEffect : import_react.useLayoutEffect;
function useCallbackRef(callback) {
  const callbackRef = (0, import_react.useRef)(callback);
  (0, import_react.useEffect)(() => {
    callbackRef.current = callback;
  });
  return (0, import_react.useMemo)(() => ((...args) => callbackRef.current?.(...args)), []);
}
function useDebounceCallback(callback, delay) {
  const handleCallback = useCallbackRef(callback);
  const timerRef = (0, import_react.useRef)(0);
  (0, import_react.useEffect)(() => () => window.clearTimeout(timerRef.current), []);
  return (0, import_react.useCallback)(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(handleCallback, delay);
  }, [handleCallback, delay]);
}
function useResizeObserver(element, onResize) {
  const handleResize = useCallbackRef(onResize);
  useIsomorphicLayoutEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(handleResize);
    });
    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [element, handleResize]);
}

// src/lib/compose-refs.ts
var import_react2 = require("react");
function assignRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}
function useComposedRef(...refs) {
  return (0, import_react2.useCallback)(
    (node) => {
      for (const ref of refs) assignRef(ref, node);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the refs *are* the dependencies.
    refs
  );
}

// src/scroll-area/context.tsx
var import_react3 = require("react");
var DEFAULT_SCROLL_HIDE_DELAY = 600;
var ScrollAreaContext = (0, import_react3.createContext)(null);
function useScrollAreaContext(componentName) {
  const context = (0, import_react3.useContext)(ScrollAreaContext);
  if (!context) {
    throw new Error(`${componentName} must be used within a ScrollArea`);
  }
  return context;
}
function useScrollAreaContextValue(value) {
  const { scrollHideDelay, scrollArea, viewport, onViewportChange } = value;
  return (0, import_react3.useMemo)(
    () => ({ type: "hover", scrollHideDelay, scrollArea, viewport, onViewportChange }),
    [scrollHideDelay, scrollArea, viewport, onViewportChange]
  );
}
var ScrollbarContext = (0, import_react3.createContext)(null);
function useScrollbarContext(componentName) {
  const context = (0, import_react3.useContext)(ScrollbarContext);
  if (!context) {
    throw new Error(`${componentName} must be used within a Scrollbar`);
  }
  return context;
}

// src/scroll-area/thumb.tsx
var import_react4 = require("react");

// src/lib/cx.ts
function cx(...inputs) {
  const parts = [];
  const walk = (value) => {
    if (value === null || value === void 0 || value === false || value === "") return;
    if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) parts.push(key);
      }
    }
  };
  for (const input of inputs) walk(input);
  return parts.join(" ");
}

// src/scroll-area/thumb.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var ScrollAreaThumb = (0, import_react4.forwardRef)(
  ({ className }, forwardedRef) => {
    const { viewport } = useScrollAreaContext("ScrollAreaThumb");
    const {
      hasThumb,
      onThumbChange,
      onThumbPointerDown,
      onThumbPointerUp,
      onThumbPositionChange
    } = useScrollbarContext("ScrollAreaThumb");
    const composedRef = useComposedRef(forwardedRef, onThumbChange);
    const stopFollowingRef = (0, import_react4.useRef)(null);
    const stopFollowingSoon = useDebounceCallback(() => {
      stopFollowingRef.current?.();
      stopFollowingRef.current = null;
    }, 100);
    (0, import_react4.useEffect)(() => {
      if (!viewport) return;
      const handleScroll = () => {
        stopFollowingSoon();
        if (!stopFollowingRef.current) {
          stopFollowingRef.current = addUnlinkedScrollListener(
            viewport,
            onThumbPositionChange
          );
          onThumbPositionChange();
        }
      };
      onThumbPositionChange();
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }, [viewport, stopFollowingSoon, onThumbPositionChange]);
    (0, import_react4.useEffect)(() => () => stopFollowingRef.current?.(), []);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        ref: composedRef,
        "data-state": hasThumb ? "visible" : "hidden",
        className: cx("vsa-thumb", className),
        onPointerDownCapture: (event) => {
          const thumbTop = event.currentTarget.getBoundingClientRect().top;
          onThumbPointerDown(event.clientY - thumbTop);
        },
        onPointerUp: onThumbPointerUp
      }
    );
  }
);
ScrollAreaThumb.displayName = "ScrollAreaThumb";

// src/scroll-area/scrollbar-impl.tsx
var import_react5 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var MAIN_POINTER_BUTTON = 0;
var HIDDEN_STYLE = { visibility: "hidden", pointerEvents: "none" };
var ScrollAreaScrollbarImpl = (0, import_react5.forwardRef)(
  ({
    className,
    thumbClassName,
    style,
    "data-state": dataState,
    sizes,
    hasThumb,
    onThumbChange,
    onThumbPointerUp,
    onThumbPointerDown,
    onThumbPositionChange,
    onWheelScroll,
    onDragScroll,
    onResize
  }, forwardedRef) => {
    const { viewport } = useScrollAreaContext("ScrollAreaScrollbarImpl");
    const [scrollbar, setScrollbar] = (0, import_react5.useState)(null);
    const composedRef = useComposedRef(forwardedRef, setScrollbar);
    const maxScrollPos = sizes.content - sizes.viewport;
    const handleWheelScroll = useCallbackRef(onWheelScroll);
    const handleThumbPositionChange = useCallbackRef(onThumbPositionChange);
    const handleThumbChange = useCallbackRef(onThumbChange);
    const handleThumbPointerUp = useCallbackRef(onThumbPointerUp);
    const handleThumbPointerDown = useCallbackRef(onThumbPointerDown);
    const handleResize = useDebounceCallback(onResize, 10);
    (0, import_react5.useEffect)(() => {
      if (!scrollbar) return;
      const handleWheel = (event) => {
        if (scrollbar.contains(event.target)) {
          handleWheelScroll(event, maxScrollPos);
        }
      };
      document.addEventListener("wheel", handleWheel, { passive: false });
      return () => document.removeEventListener("wheel", handleWheel);
    }, [scrollbar, maxScrollPos, handleWheelScroll]);
    (0, import_react5.useEffect)(() => {
      handleThumbPositionChange();
    }, [sizes, handleThumbPositionChange]);
    useResizeObserver(scrollbar, handleResize);
    useResizeObserver(viewport, handleResize);
    const dragRectRef = (0, import_react5.useRef)(null);
    const previousUserSelectRef = (0, import_react5.useRef)("");
    const dragTo = (event) => {
      if (dragRectRef.current) {
        onDragScroll(event.clientY - dragRectRef.current.top);
      }
    };
    const handlePointerDown = (event) => {
      if (event.button !== MAIN_POINTER_BUTTON || !scrollbar) return;
      event.target.setPointerCapture(event.pointerId);
      dragRectRef.current = scrollbar.getBoundingClientRect();
      previousUserSelectRef.current = document.body.style.webkitUserSelect;
      document.body.style.webkitUserSelect = "none";
      if (viewport) viewport.style.scrollBehavior = "auto";
      dragTo(event);
    };
    const handlePointerUp = (event) => {
      const element = event.target;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      document.body.style.webkitUserSelect = previousUserSelectRef.current;
      if (viewport) viewport.style.scrollBehavior = "";
      dragRectRef.current = null;
    };
    const scrollbarContextValue = (0, import_react5.useMemo)(
      () => ({
        hasThumb,
        scrollbar,
        onThumbChange: handleThumbChange,
        onThumbPointerUp: handleThumbPointerUp,
        onThumbPointerDown: handleThumbPointerDown,
        onThumbPositionChange: handleThumbPositionChange
      }),
      [
        hasThumb,
        scrollbar,
        handleThumbChange,
        handleThumbPointerUp,
        handleThumbPointerDown,
        handleThumbPositionChange
      ]
    );
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "div",
      {
        ref: composedRef,
        "data-orientation": "vertical",
        "data-state": dataState,
        className: cx("vsa-scrollbar", className),
        style: {
          ["--vsa-thumb-height"]: `${getThumbSize(sizes)}px`,
          ...style,
          ...hasThumb ? null : HIDDEN_STYLE
        },
        onPointerDown: handlePointerDown,
        onPointerMove: dragTo,
        onPointerUp: handlePointerUp,
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ScrollbarContext.Provider, { value: scrollbarContextValue, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ScrollAreaThumb, { className: thumbClassName }) })
      }
    );
  }
);
ScrollAreaScrollbarImpl.displayName = "ScrollAreaScrollbarImpl";

// src/scroll-area/scrollbar.tsx
var import_react7 = require("react");

// src/use-injected-styles.ts
var import_react6 = require("react");

// src/styles.css
var styles_default = "/*!\n * virtuo-scroll-area \u2014 stylesheet\n *\n * This file is auto-injected on first render by every JavaScript entry point, so you normally\n * do not import it yourself. If your setup forbids runtime style injection (strict CSP,\n * SSR-only shells), import it manually instead:\n *\n *   import 'virtuo-scroll-area/styles.css';\n *\n * Injection is idempotent and keyed to `#virtuo-scroll-area-styles`, so doing both is harmless.\n *\n * Cascade\n * -------\n * Everything lives in the `base` cascade layer. In a Tailwind app that means:\n *\n *   - Tailwind's own layers win over these defaults, so `className=\"grid-cols-4\"` or\n *     `scrollbarThumbClassName=\"bg-red-500\"` overrides this stylesheet without `!important`\n *     and without fighting specificity.\n *   - Rules injected here still beat Tailwind Preflight (tailwindcss/preflight), which lives in\n *     the same layer but is emitted earlier.\n *\n * In a plain-CSS app your unlayered rules always beat this file, so overriding stays trivial.\n *\n * Theming\n * -------\n * Every visual is driven by a CSS custom property. Override them anywhere above the component:\n *\n *   .my-scroll-area {\n *     --vsa-thumb-background: rgb(0 0 0 / 0.2);\n *     --vsa-scrollbar-width: 14px;\n *   }\n *\n * Mapping to shadcn/ui tokens looks like this:\n *\n *   .vsa-scroll-area {\n *     --vsa-thumb-background: color-mix(in oklab, var(--muted-foreground) 30%, transparent);\n *     --vsa-scroll-to-top-background: var(--primary);\n *     --vsa-scroll-to-top-foreground: var(--primary-foreground);\n *   }\n */\n\n@layer base {\n  /* ----------------------------------------------------------------------------------------------\n   * Root / layout\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-scroll-area,\n  .vsa-viewport,\n  .vsa-content,\n  .vsa-scrollbar,\n  .vsa-thumb,\n  .vsa-scroll-to-top,\n  .vsa-scroll-to-top-button,\n  .vsa-grid-list {\n    box-sizing: border-box;\n  }\n\n  .vsa-scroll-area {\n    /* Scrollbar rail */\n    --vsa-scrollbar-width: 10px;\n    --vsa-scrollbar-padding: 1px;\n    --vsa-scrollbar-z-index: 50;\n    --vsa-scrollbar-transition-duration: 200ms;\n\n    /* Thumb */\n    --vsa-thumb-background: rgb(115 115 115 / 0.42);\n    --vsa-thumb-background-hover: rgb(115 115 115 / 0.62);\n    --vsa-thumb-radius: 9999px;\n    --vsa-thumb-transition-duration: 150ms;\n\n    /* Scroll-to-top button */\n    --vsa-scroll-to-top-size: 40px;\n    --vsa-scroll-to-top-icon-size: 20px;\n    --vsa-scroll-to-top-background: #2563eb;\n    --vsa-scroll-to-top-background-hover: #1d4ed8;\n    --vsa-scroll-to-top-foreground: #ffffff;\n    --vsa-scroll-to-top-shadow:\n      0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.2);\n    --vsa-scroll-to-top-z-index: 50;\n\n    position: relative;\n    overflow: hidden;\n  }\n\n  /* Layout used by the non-virtualized `ScrollArea`, whose viewport is a flex child. The\n   * virtualized containers only need the variables and the positioning from `.vsa-scroll-area`. */\n  .vsa-scroll-area-layout {\n    display: flex;\n    flex-direction: column;\n  }\n\n  /* Automatic dark-mode defaults. The `.dark` selector also covers apps that toggle a class\n   * (the shadcn/ui convention); it wins over the media query because it is more specific. */\n  @media (prefers-color-scheme: dark) {\n    .vsa-scroll-area {\n      --vsa-thumb-background: rgb(237 237 237 / 0.32);\n      --vsa-thumb-background-hover: rgb(237 237 237 / 0.5);\n    }\n  }\n\n  .dark .vsa-scroll-area {\n    --vsa-thumb-background: rgb(237 237 237 / 0.32);\n    --vsa-thumb-background-hover: rgb(237 237 237 / 0.5);\n  }\n\n  /* ----------------------------------------------------------------------------------------------\n   * Viewport \u2014 the real scrolling element; the native scrollbar is hidden because we draw our own\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-viewport {\n    min-height: 0;\n    flex: 1 1 0%;\n    overflow-x: hidden;\n    overflow-y: auto;\n\n    /* Hide the native scrollbar: Firefox / legacy Edge / WebKit */\n    scrollbar-width: none;\n    -ms-overflow-style: none;\n  }\n\n  .vsa-viewport::-webkit-scrollbar {\n    width: 0;\n    height: 0;\n    display: none;\n    background: transparent;\n  }\n\n  .vsa-content {\n    min-width: 0;\n  }\n\n  /* ----------------------------------------------------------------------------------------------\n   * Overlay scrollbar\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-scrollbar {\n    position: absolute;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    z-index: var(--vsa-scrollbar-z-index);\n    display: flex;\n    width: var(--vsa-scrollbar-width);\n    padding: var(--vsa-scrollbar-padding);\n    border-left: 1px solid transparent;\n    opacity: 1;\n    touch-action: none;\n    user-select: none;\n    -webkit-user-select: none;\n    transition: opacity var(--vsa-scrollbar-transition-duration) ease-out;\n  }\n\n  .vsa-thumb {\n    position: relative;\n    width: 100%;\n    height: var(--vsa-thumb-height, auto);\n    flex: 1 1 0%;\n    border-radius: var(--vsa-thumb-radius);\n    background-color: var(--vsa-thumb-background);\n    opacity: 1;\n    transition:\n      background-color var(--vsa-thumb-transition-duration) ease-out,\n      opacity var(--vsa-thumb-transition-duration) ease-out;\n  }\n\n  .vsa-scrollbar:hover .vsa-thumb,\n  .vsa-thumb:hover {\n    background-color: var(--vsa-thumb-background-hover);\n  }\n\n  .vsa-thumb[data-state='hidden'] {\n    opacity: 0;\n  }\n\n  /* ----------------------------------------------------------------------------------------------\n   * Scroll-to-top button\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-scroll-to-top {\n    position: absolute;\n    top: 50%;\n    right: 0;\n    z-index: var(--vsa-scroll-to-top-z-index);\n    /* `transform` is written inline so each instance can offset itself; keep it animated here. */\n    transition:\n      opacity 300ms ease-in-out,\n      scale 300ms ease-in-out,\n      transform 300ms ease-in-out;\n  }\n\n  .vsa-scroll-to-top[data-visible='false'] {\n    opacity: 0;\n    scale: 0.9;\n    pointer-events: none;\n  }\n\n  .vsa-scroll-to-top[data-visible='true'] {\n    opacity: 1;\n    scale: 1;\n  }\n\n  .vsa-scroll-to-top-button {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: var(--vsa-scroll-to-top-size);\n    height: var(--vsa-scroll-to-top-size);\n    padding: 0;\n    border: 0;\n    border-radius: 9999px;\n    background-color: var(--vsa-scroll-to-top-background);\n    color: var(--vsa-scroll-to-top-foreground);\n    box-shadow: var(--vsa-scroll-to-top-shadow);\n    font: inherit;\n    cursor: pointer;\n    appearance: none;\n    -webkit-appearance: none;\n    animation: vsa-slow-bounce 2s infinite;\n    transition:\n      background-color 150ms ease-out,\n      opacity 150ms ease-out;\n  }\n\n  .vsa-scroll-to-top-button:hover {\n    background-color: var(--vsa-scroll-to-top-background-hover);\n  }\n\n  .vsa-scroll-to-top-button:focus-visible {\n    outline: 2px solid var(--vsa-scroll-to-top-foreground);\n    outline-offset: 2px;\n  }\n\n  .vsa-scroll-to-top-icon {\n    width: var(--vsa-scroll-to-top-icon-size);\n    height: var(--vsa-scroll-to-top-icon-size);\n    color: currentColor;\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .vsa-scroll-to-top-button {\n      animation: none;\n    }\n\n    .vsa-scroll-to-top {\n      transition: none;\n    }\n  }\n\n  /* ----------------------------------------------------------------------------------------------\n   * Accessibility helper\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-sr-only {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    white-space: nowrap;\n    border-width: 0;\n    clip-path: inset(50%);\n  }\n\n  /* ----------------------------------------------------------------------------------------------\n   * Virtualized (react-virtuoso) layout\n   * -------------------------------------------------------------------------------------------- */\n\n  .vsa-virtualized-area {\n    height: 100%;\n  }\n\n  .vsa-virtualized-scroll-area {\n    height: 100%;\n    overflow: hidden !important;\n  }\n\n  /* react-virtuoso's scroller keeps `overflow-y: scroll` so it always has a measurable\n   * scrollbar, and we hide the native one because the overlay scrollbar replaces it. */\n  .vsa-scroller[data-virtuoso-scroller] {\n    overflow-y: scroll !important;\n    overflow-x: hidden !important;\n    scrollbar-width: none !important;\n  }\n\n  .vsa-scroller[data-virtuoso-scroller]::-webkit-scrollbar {\n    width: 0 !important;\n    height: 0 !important;\n    display: none !important;\n    background: transparent !important;\n  }\n\n  /* Default grid: a single column with 16px gaps, matching the layout the component shipped\n   * from. Pass `gridClassName` (for example Tailwind's `grid-cols-4 gap-3`) to override \u2014\n   * utilities win over this layer. */\n  .vsa-grid-list {\n    display: grid;\n    grid-template-columns: repeat(1, minmax(0, 1fr));\n    gap: 16px;\n  }\n}\n\n@keyframes vsa-slow-bounce {\n  0% {\n    transform: translateY(-15%);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n\n  50% {\n    transform: translateY(0);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n\n  100% {\n    transform: translateY(-15%);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n}\n";

// src/styles.ts
var STYLE_ELEMENT_ID = "virtuo-scroll-area-styles";
var styles = styles_default;
function injectStyles(target) {
  const doc = target ?? (typeof document === "undefined" ? null : document);
  if (!doc || doc.getElementById(STYLE_ELEMENT_ID)) return;
  const element = doc.createElement("style");
  element.id = STYLE_ELEMENT_ID;
  element.setAttribute("data-vsa-styles", "");
  element.textContent = styles;
  doc.head.appendChild(element);
}
if (typeof document !== "undefined") injectStyles();

// src/use-injected-styles.ts
function useInjectedStyles() {
  (0, import_react6.useEffect)(() => {
    injectStyles();
  }, []);
}

// src/scroll-area/scrollbar.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function useScrollbarVisibility(scrollArea, viewport, hideDelay) {
  const [visible, setVisible] = (0, import_react7.useState)(false);
  (0, import_react7.useEffect)(() => {
    if (!scrollArea) return;
    let hideTimer = 0;
    const show = () => {
      window.clearTimeout(hideTimer);
      setVisible(true);
    };
    const hideLater = () => {
      hideTimer = window.setTimeout(() => setVisible(false), hideDelay);
    };
    scrollArea.addEventListener("pointerenter", show);
    scrollArea.addEventListener("pointerleave", hideLater);
    return () => {
      window.clearTimeout(hideTimer);
      scrollArea.removeEventListener("pointerenter", show);
      scrollArea.removeEventListener("pointerleave", hideLater);
    };
  }, [scrollArea, hideDelay]);
  (0, import_react7.useEffect)(() => {
    if (!viewport) return;
    let hideTimer = 0;
    const handleScroll = () => {
      setVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisible(false), hideDelay);
    };
    viewport.addEventListener("scroll", handleScroll);
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      window.clearTimeout(hideTimer);
    };
  }, [viewport, hideDelay]);
  return visible;
}
var ScrollAreaScrollbar = (0, import_react7.forwardRef)(
  ({ className, thumbClassName, resizeCallbackRef }, forwardedRef) => {
    useInjectedStyles();
    const { scrollArea, viewport, scrollHideDelay } = useScrollAreaContext("ScrollAreaScrollbar");
    const visible = useScrollbarVisibility(scrollArea, viewport, scrollHideDelay);
    const scrollbarRef = (0, import_react7.useRef)(null);
    const thumbRef = (0, import_react7.useRef)(null);
    const pointerOffsetRef = (0, import_react7.useRef)(0);
    const [sizes, setSizes] = (0, import_react7.useState)(EMPTY_SIZES);
    const composedRef = useComposedRef(forwardedRef, scrollbarRef);
    const thumbRatio = getThumbRatio(sizes.viewport, sizes.content);
    const hasThumb = thumbRatio > 0 && thumbRatio < 1;
    const onThumbChange = (0, import_react7.useCallback)((thumb) => {
      thumbRef.current = thumb;
    }, []);
    const onThumbPointerDown = (0, import_react7.useCallback)((pointerPos) => {
      pointerOffsetRef.current = pointerPos;
    }, []);
    const onThumbPointerUp = (0, import_react7.useCallback)(() => {
      pointerOffsetRef.current = 0;
    }, []);
    const onThumbPositionChange = (0, import_react7.useCallback)(() => {
      if (!viewport || !thumbRef.current) return;
      const offset = getThumbOffsetFromScroll(viewport.scrollTop, sizes);
      thumbRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
    }, [viewport, sizes]);
    const onWheelScroll = (0, import_react7.useCallback)(
      (event, maxScrollPos) => {
        if (!viewport) return;
        const scrollPos = viewport.scrollTop + event.deltaY;
        viewport.scrollTop = scrollPos;
        if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) {
          event.preventDefault();
        }
      },
      [viewport]
    );
    const onDragScroll = (0, import_react7.useCallback)(
      (pointerPos) => {
        if (!viewport) return;
        viewport.scrollTop = getScrollPositionFromPointer(
          pointerPos,
          pointerOffsetRef.current,
          sizes
        );
      },
      [viewport, sizes]
    );
    const onResize = (0, import_react7.useCallback)(() => {
      const scrollbar = scrollbarRef.current;
      if (!scrollbar || !viewport) return;
      const scrollbarStyle = getComputedStyle(scrollbar);
      setSizes({
        content: viewport.scrollHeight,
        viewport: viewport.offsetHeight,
        scrollbar: {
          size: scrollbar.clientHeight,
          paddingStart: toInt(scrollbarStyle.paddingTop),
          paddingEnd: toInt(scrollbarStyle.paddingBottom)
        }
      });
    }, [viewport]);
    (0, import_react7.useEffect)(() => {
      if (resizeCallbackRef) resizeCallbackRef.current = onResize;
    }, [onResize, resizeCallbackRef]);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      ScrollAreaScrollbarImpl,
      {
        ref: composedRef,
        className,
        thumbClassName,
        sizes,
        hasThumb,
        onThumbChange,
        onThumbPointerUp,
        onThumbPointerDown,
        onThumbPositionChange,
        onWheelScroll,
        onDragScroll,
        onResize,
        "data-state": visible ? "visible" : "hidden",
        style: { opacity: visible ? 1 : 0 }
      }
    );
  }
);
ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

// src/scroll-area/scroll-area.tsx
var import_react9 = require("react");

// src/scroll-context.tsx
var import_react8 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var noop = () => {
};
var ScrollContext = (0, import_react8.createContext)({
  scrollToTop: noop,
  scrollToBottom: noop,
  setScrollAreaElement: noop,
  registerInstance: noop,
  unregisterInstance: noop,
  getInstance: () => void 0
});
function ScrollContextProvider({
  children,
  instanceId
}) {
  const instancesRef = (0, import_react8.useRef)(/* @__PURE__ */ new Map());
  const [scrollAreaElement, setScrollAreaElement] = (0, import_react8.useState)(null);
  const scrollToTop = (0, import_react8.useCallback)(() => {
    scrollAreaElement?.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollAreaElement]);
  const scrollToBottom = (0, import_react8.useCallback)(() => {
    scrollAreaElement?.scrollTo({
      top: scrollAreaElement.scrollHeight,
      behavior: "smooth"
    });
  }, [scrollAreaElement]);
  const registerInstance = (0, import_react8.useCallback)((id, instance) => {
    instancesRef.current.set(id, instance);
  }, []);
  const unregisterInstance = (0, import_react8.useCallback)((id) => {
    instancesRef.current.delete(id);
  }, []);
  const getInstance = (0, import_react8.useCallback)((id) => instancesRef.current.get(id), []);
  (0, import_react8.useEffect)(() => {
    if (!instanceId) return;
    registerInstance(instanceId, { scrollToTop, scrollToBottom, setScrollAreaElement });
    return () => unregisterInstance(instanceId);
  }, [instanceId, scrollToTop, scrollToBottom, registerInstance, unregisterInstance]);
  const contextValue = (0, import_react8.useMemo)(
    () => ({
      scrollToTop,
      scrollToBottom,
      setScrollAreaElement,
      registerInstance,
      unregisterInstance,
      getInstance
    }),
    [scrollToTop, scrollToBottom, registerInstance, unregisterInstance, getInstance]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ScrollContext.Provider, { value: contextValue, children });
}
function useScrollContext() {
  return (0, import_react8.useContext)(ScrollContext);
}
function useScrollToTop() {
  return useScrollContext().scrollToTop;
}
function useScrollToBottom() {
  return useScrollContext().scrollToBottom;
}

// src/scroll-area/scroll-area.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var ScrollArea = (0, import_react9.forwardRef)(
  ({
    className,
    children,
    viewportClassName,
    viewportRef,
    scrollbarClassName,
    scrollbarThumbClassName,
    scrollHideDelay = DEFAULT_SCROLL_HIDE_DELAY,
    ...props
  }, forwardedRef) => {
    useInjectedStyles();
    const [scrollArea, setScrollArea] = (0, import_react9.useState)(null);
    const [viewport, setViewport] = (0, import_react9.useState)(null);
    const [content, setContent] = (0, import_react9.useState)(null);
    const resizeCallbackRef = (0, import_react9.useRef)(null);
    const composedRef = useComposedRef(forwardedRef, setScrollArea);
    const composedViewportRef = useComposedRef(viewportRef, setViewport);
    const { setScrollAreaElement } = useScrollContext();
    (0, import_react9.useEffect)(() => {
      setScrollAreaElement(viewport);
      return () => setScrollAreaElement(null);
    }, [setScrollAreaElement, viewport]);
    useResizeObserver(content, () => resizeCallbackRef.current?.());
    const contextValue = useScrollAreaContextValue({
      scrollHideDelay,
      scrollArea,
      viewport,
      onViewportChange: setViewport
    });
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ScrollAreaContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        ref: composedRef,
        "data-slot": "scroll-area",
        ...props,
        className: cx("vsa-scroll-area", "vsa-scroll-area-layout", className),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "div",
            {
              ref: composedViewportRef,
              "data-slot": "scroll-area-viewport",
              className: cx("vsa-viewport", viewportClassName),
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref: setContent, className: "vsa-content", children })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            ScrollAreaScrollbar,
            {
              className: scrollbarClassName,
              thumbClassName: scrollbarThumbClassName,
              resizeCallbackRef
            }
          )
        ]
      }
    ) });
  }
);
ScrollArea.displayName = "ScrollArea";

// src/scroll-area/scroller.tsx
var import_react10 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var Scroller = (0, import_react10.forwardRef)(
  ({ children, className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "div",
    {
      ref,
      ...props,
      className: cx("vsa-scroller", className),
      "data-virtuoso-scroller": true,
      children
    }
  )
);
Scroller.displayName = "Scroller";
function generateScrollStyle() {
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

// src/scroll-to-top-button.tsx
var import_react11 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var DEFAULT_BUTTON_OFFSET = { x: -12, y: 0 };
var DEFAULT_SCROLL_THRESHOLD = 100;
function ChevronUpIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "m18 15-6-6-6 6" })
    }
  );
}
function useScrolledPastThreshold(scrollerRef, threshold) {
  const [scrolledPast, setScrolledPast] = (0, import_react11.useState)(false);
  (0, import_react11.useEffect)(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(
        () => setScrolledPast(scroller.scrollTop > threshold)
      );
    };
    scroller.addEventListener("scroll", handleScroll);
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollerRef, threshold]);
  return scrolledPast;
}
var ScrollToTopButton = ({
  scrollToTop,
  scrollToTopButtonClassName,
  scrollToTopButtonIconClassName,
  buttonOffset = DEFAULT_BUTTON_OFFSET,
  scrollerRef,
  threshold = DEFAULT_SCROLL_THRESHOLD,
  label = "Scroll to top",
  icon
}) => {
  useInjectedStyles();
  const visible = useScrolledPastThreshold(scrollerRef, threshold);
  const { x = 0, y = 0 } = buttonOffset;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "div",
    {
      "data-visible": visible ? "true" : "false",
      className: "vsa-scroll-to-top",
      style: { transform: `translate(${x}px, calc(-50% + ${y}px))` },
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          onClick: scrollToTop,
          className: cx("vsa-scroll-to-top-button", scrollToTopButtonClassName),
          children: [
            icon ?? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              ChevronUpIcon,
              {
                className: cx("vsa-scroll-to-top-icon", scrollToTopButtonIconClassName)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "vsa-sr-only", children: label })
          ]
        }
      )
    }
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_BUTTON_OFFSET,
  DEFAULT_SCROLL_THRESHOLD,
  STYLE_ELEMENT_ID,
  ScrollArea,
  ScrollAreaContext,
  ScrollAreaScrollbar,
  ScrollAreaScrollbarImpl,
  ScrollAreaThumb,
  ScrollContext,
  ScrollContextProvider,
  ScrollToTopButton,
  ScrollbarContext,
  Scroller,
  THUMB_MIN_SIZE,
  addUnlinkedScrollListener,
  cx,
  generateScrollStyle,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  injectStyles,
  isScrollingWithinScrollbarBounds,
  linearScale,
  styles,
  toInt,
  useCallbackRef,
  useDebounceCallback,
  useInjectedStyles,
  useIsomorphicLayoutEffect,
  useResizeObserver,
  useScrollAreaContext,
  useScrollContext,
  useScrollToBottom,
  useScrollToTop,
  useScrollbarContext
});
//# sourceMappingURL=index.cjs.map