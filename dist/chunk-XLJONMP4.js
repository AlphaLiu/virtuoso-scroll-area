"use client";
import {
  useScrollAreaContextValue,
  useScrollContext
} from "./chunk-AVDGLLWT.js";

// src/virtuoso/use-virtualized-scroll-area.ts
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
function useVirtualizedScrollArea({
  handleRef,
  virtuosoRef,
  itemCount,
  scrollHideDelay,
  scrollContextInstanceId,
  recountDelay = 0
}) {
  const { setScrollAreaElement, registerInstance, unregisterInstance } = useScrollContext();
  const [scrollArea, setScrollArea] = useState(null);
  const [viewport, setViewport] = useState(null);
  const scrollerRef = useRef(null);
  const resizeCallbackRef = useRef(null);
  const scrollToIndex = useCallback(
    (index, behavior = "smooth") => {
      virtuosoRef.current?.scrollToIndex({ index, behavior });
    },
    [virtuosoRef]
  );
  const scrollToTop = useCallback(() => scrollToIndex(0), [scrollToIndex]);
  const scrollToBottom = useCallback(
    () => scrollToIndex(itemCount - 1),
    [scrollToIndex, itemCount]
  );
  useImperativeHandle(handleRef, () => ({ scrollToIndex, scrollToTop }), [
    scrollToIndex,
    scrollToTop
  ]);
  const handleScrollerRef = useCallback(
    (element) => {
      const next = element ?? null;
      if (scrollerRef.current === next) return;
      scrollerRef.current = next;
      setViewport(next);
      setScrollAreaElement(next);
    },
    [setScrollAreaElement]
  );
  useEffect(() => {
    if (!viewport) return;
    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resizeCallbackRef.current?.());
    };
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [viewport]);
  useEffect(() => {
    if (!recountDelay || itemCount <= 0) return;
    const timer = setTimeout(() => resizeCallbackRef.current?.(), recountDelay);
    return () => clearTimeout(timer);
  }, [itemCount, recountDelay]);
  useEffect(() => {
    if (!scrollContextInstanceId) return;
    registerInstance(scrollContextInstanceId, {
      scrollToTop,
      scrollToBottom,
      setScrollAreaElement
    });
    return () => unregisterInstance(scrollContextInstanceId);
  }, [
    scrollContextInstanceId,
    registerInstance,
    unregisterInstance,
    scrollToTop,
    scrollToBottom,
    setScrollAreaElement
  ]);
  const scrollAreaContextValue = useScrollAreaContextValue({
    scrollHideDelay,
    scrollArea,
    viewport,
    onViewportChange: setViewport
  });
  return {
    scrollToTop,
    setScrollArea,
    handleScrollerRef,
    scrollerRef,
    resizeCallbackRef,
    scrollAreaContextValue
  };
}

export {
  useVirtualizedScrollArea
};
//# sourceMappingURL=chunk-XLJONMP4.js.map