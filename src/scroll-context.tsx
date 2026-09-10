import type { ReactNode } from 'react';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * A single scrollable region registered with the {@link ScrollContextProvider}.
 *
 * `VirtuosoScrollArea` and `VirtuosoGridScrollArea` register themselves automatically when
 * given a `scrollContextInstanceId`.
 */
export interface ScrollAreaInstance {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  setScrollAreaElement: (element: HTMLDivElement | null) => void;
}

/** Value provided by {@link ScrollContextProvider}. */
export interface ScrollContextType {
  /** Scrolls the *current* (nearest) instance to the top. */
  scrollToTop: () => void;
  /** Scrolls the *current* (nearest) instance to the bottom. */
  scrollToBottom: () => void;
  /** Attaches the element that {@link ScrollContextType.scrollToTop} controls. */
  setScrollAreaElement: (element: HTMLDivElement | null) => void;

  /** Registers a named instance so it can be driven from anywhere via {@link ScrollContextType.getInstance}. */
  registerInstance: (id: string, instance: ScrollAreaInstance) => void;
  /** Removes a named instance. */
  unregisterInstance: (id: string) => void;
  /** Looks up a named instance previously registered with {@link ScrollContextType.registerInstance}. */
  getInstance: (id: string) => ScrollAreaInstance | undefined;
}

const noop = () => {};

/**
 * Context backing {@link ScrollContextProvider}. Defaults are no-ops, so consuming hooks are
 * always safe to call even without a provider higher in the tree.
 */
export const ScrollContext = createContext<ScrollContextType>({
  scrollToTop: noop,
  scrollToBottom: noop,
  setScrollAreaElement: noop,
  registerInstance: noop,
  unregisterInstance: noop,
  getInstance: () => undefined,
});

export interface ScrollContextProviderProps {
  children: ReactNode;
  /** Registers this provider's instance under a stable id for imperative access. */
  instanceId?: string;
}

/**
 * Provides the scroll context: smooth `scrollToTop` / `scrollToBottom` for the nearest region
 * plus a registry for addressing several regions by id.
 *
 * @example
 * const { getInstance } = useScrollContext();
 * getInstance('theme-grid')?.scrollToTop();
 */
export function ScrollContextProvider({
  children,
  instanceId,
}: ScrollContextProviderProps) {
  // Instances live in a ref so registering one never re-renders the tree.
  const instancesRef = useRef(new Map<string, ScrollAreaInstance>());

  const [scrollAreaElement, setScrollAreaElement] = useState<HTMLDivElement | null>(null);

  const scrollToTop = useCallback(() => {
    scrollAreaElement?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollAreaElement]);

  const scrollToBottom = useCallback(() => {
    scrollAreaElement?.scrollTo({
      top: scrollAreaElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [scrollAreaElement]);

  const registerInstance = useCallback((id: string, instance: ScrollAreaInstance) => {
    instancesRef.current.set(id, instance);
  }, []);

  const unregisterInstance = useCallback((id: string) => {
    instancesRef.current.delete(id);
  }, []);

  const getInstance = useCallback((id: string) => instancesRef.current.get(id), []);

  // The provider's own region is addressable by id too.
  useEffect(() => {
    if (!instanceId) return;

    registerInstance(instanceId, { scrollToTop, scrollToBottom, setScrollAreaElement });
    return () => unregisterInstance(instanceId);
  }, [instanceId, scrollToTop, scrollToBottom, registerInstance, unregisterInstance]);

  const contextValue = useMemo<ScrollContextType>(
    () => ({
      scrollToTop,
      scrollToBottom,
      setScrollAreaElement,
      registerInstance,
      unregisterInstance,
      getInstance,
    }),
    [scrollToTop, scrollToBottom, registerInstance, unregisterInstance, getInstance],
  );

  return <ScrollContext.Provider value={contextValue}>{children}</ScrollContext.Provider>;
}

/** Reads the {@link ScrollContext}. Never throws — without a provider it returns no-ops. */
export function useScrollContext(): ScrollContextType {
  return useContext(ScrollContext);
}

/** Convenience hook returning the nearest instance's `scrollToTop`. */
export function useScrollToTop(): () => void {
  return useScrollContext().scrollToTop;
}

/** Convenience hook returning the nearest instance's `scrollToBottom`. */
export function useScrollToBottom(): () => void {
  return useScrollContext().scrollToBottom;
}
