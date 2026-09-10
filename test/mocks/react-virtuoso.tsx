import type { ComponentType, CSSProperties, Key, ReactNode, RefAttributes } from 'react';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Stand-in for `react-virtuoso` used by the unit tests.
 *
 * The real library measures the DOM through observers and renders only what fits, which jsdom
 * cannot reproduce. These mocks keep the parts the components actually talk to — the `Scroller`
 * component, `Item`/`List` renderers, `scrollerRef`, `rangeChanged` and the imperative
 * `scrollToIndex` handle — so the wiring can be asserted deterministically. The real integration
 * is covered by the demo app, which is driven in a real browser.
 */

export const virtuosoSpy = {
  /** `scrollToIndex` calls made on a list handle. */
  listScrollToIndex: [] as Array<{ index: number; behavior?: string }>,
  /** `scrollToIndex` calls made on a grid handle. */
  gridScrollToIndex: [] as Array<{ index: number; behavior?: string }>,
  /** Props of the most recent list render, for asserting pass-through defaults. */
  lastListProps: undefined as MockVirtuosoProps | undefined,
  /** Props of the most recent grid render. */
  lastGridProps: undefined as MockVirtuosoGridProps | undefined,
};

export function resetVirtuosoSpy(): void {
  virtuosoSpy.listScrollToIndex.length = 0;
  virtuosoSpy.gridScrollToIndex.length = 0;
  virtuosoSpy.lastListProps = undefined;
  virtuosoSpy.lastGridProps = undefined;
}

interface ItemComponentProps {
  children?: ReactNode;
  'data-index'?: number;
  style?: CSSProperties;
}

interface ScrollerComponentProps {
  children?: ReactNode;
  style?: CSSProperties;
  'data-testid'?: string;
}

type ScrollerComponent = ComponentType<
  ScrollerComponentProps & RefAttributes<HTMLDivElement>
>;

type ItemComponent = ComponentType<ItemComponentProps> | undefined;

interface MockVirtuosoProps {
  data?: unknown[];
  itemContent?: (index: number, item: unknown) => ReactNode;
  components?: { Scroller?: ScrollerComponent; Item?: ItemComponent };
  scrollerRef?: (element: HTMLElement | Window | null) => void;
  style?: CSSProperties;
  overscan?: number;
  increaseViewportBy?: number;
}

export const Virtuoso = forwardRef<unknown, MockVirtuosoProps>(
  function Virtuoso(props, ref) {
    const { data = [], itemContent, components = {}, scrollerRef, style } = props;
    const { Scroller: ScrollerComponent, Item } = components;
    virtuosoSpy.lastListProps = props;

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (options: { index: number; behavior?: string }) => {
          virtuosoSpy.listScrollToIndex.push(options);
        },
      }),
      [],
    );

    const attachScroller = useCallback(
      (element: HTMLDivElement | null) => {
        scrollerRef?.(element);
      },
      [scrollerRef],
    );

    const rows = data.map((item, index) => {
      const content = itemContent?.(index, item);
      return Item ? (
        <Item key={index} data-index={index}>
          {content}
        </Item>
      ) : (
        <div key={index}>{content}</div>
      );
    });

    if (ScrollerComponent) {
      return (
        <ScrollerComponent
          ref={attachScroller}
          style={style}
          data-testid="virtuoso-scroller"
        >
          {rows}
        </ScrollerComponent>
      );
    }

    return (
      <div ref={attachScroller} style={style} data-testid="virtuoso-scroller">
        {rows}
      </div>
    );
  },
);

interface MockVirtuosoGridProps {
  totalCount?: number;
  itemContent?: (index: number) => ReactNode;
  components?: {
    Scroller?: ScrollerComponent;
    Item?: ItemComponent;
    List?: ComponentType<ItemComponentProps>;
  };
  scrollerRef?: (element: HTMLElement | Window | null) => void;
  style?: CSSProperties;
  computeItemKey?: (index: number) => Key;
  rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
  overscan?: number | { main: number; reverse: number };
  increaseViewportBy?: number | { bottom: number; top: number };
}

export const VirtuosoGrid = forwardRef<unknown, MockVirtuosoGridProps>(
  function VirtuosoGrid(props, ref) {
    const {
      totalCount = 0,
      itemContent,
      components = {},
      scrollerRef,
      style,
      computeItemKey,
      rangeChanged,
    } = props;
    const { Scroller: ScrollerComponent, Item, List } = components;
    virtuosoSpy.lastGridProps = props;

    // Kept in a ref so a new callback identity never re-triggers the effect.
    const rangeChangedRef = useRef(rangeChanged);
    rangeChangedRef.current = rangeChanged;

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (options: { index: number; behavior?: string }) => {
          virtuosoSpy.gridScrollToIndex.push(options);
        },
      }),
      [],
    );

    useEffect(() => {
      // The real grid reports its rendered range as soon as it has measured.
      rangeChangedRef.current?.({
        startIndex: 0,
        endIndex: Math.max(totalCount - 1, 0),
      });
    }, [totalCount]);

    const attachScroller = useCallback(
      (element: HTMLDivElement | null) => {
        scrollerRef?.(element);
      },
      [scrollerRef],
    );

    const cells = Array.from({ length: totalCount }, (_, index) => {
      const key = computeItemKey?.(index) ?? index;
      const content = itemContent?.(index);
      return Item ? <Item key={key}>{content}</Item> : <div key={key}>{content}</div>;
    });

    // Real virtuoso hands the List a style with zero vertical padding, which the grid list
    // compensates for.
    const list = List ? (
      <List style={{ paddingTop: 0, paddingBottom: 0 }}>{cells}</List>
    ) : (
      cells
    );

    if (ScrollerComponent) {
      return (
        <ScrollerComponent
          ref={attachScroller}
          style={style}
          data-testid="virtuoso-scroller"
        >
          {list}
        </ScrollerComponent>
      );
    }

    return (
      <div ref={attachScroller} style={style} data-testid="virtuoso-scroller">
        {list}
      </div>
    );
  },
);
