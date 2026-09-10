import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-virtuoso', () => import('./mocks/react-virtuoso'));

import type { VirtuosoScrollAreaHandle } from '../src/virtuoso/index';

import {
  ScrollContextProvider,
  useScrollAreaContext,
  useScrollContext,
} from '../src/index';
import { VirtuosoScrollArea } from '../src/virtuoso/index';

import { resetVirtuosoSpy, virtuosoSpy } from './mocks/react-virtuoso';
import {
  mockElementMetrics,
  readCssVar,
  setElementMetrics,
  triggerResizeObservers,
} from './utils/dom';

let restoreMetrics: (() => void) | undefined;

beforeEach(() => {
  resetVirtuosoSpy();
});

afterEach(() => {
  restoreMetrics?.();
  restoreMetrics = undefined;
});

/** Lets the ResizeObserver → rAF → debounce chain run. */
async function recomputeGeometry(): Promise<void> {
  await act(async () => {
    triggerResizeObservers();
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function Probe() {
  const { viewport, scrollHideDelay } = useScrollAreaContext('Probe');
  return (
    <span data-testid="probe">
      {scrollHideDelay}:{viewport ? viewport.className : 'none'}
    </span>
  );
}

describe('VirtuosoScrollArea', () => {
  it('renders one row per item and applies itemClassName', () => {
    render(
      <VirtuosoScrollArea
        data={['a', 'b', 'c']}
        itemClassName="my-row"
        itemContent={(index, item) => <span>{`${index}:${String(item)}`}</span>}
      />,
    );

    expect(screen.getByText('0:a')).toBeInTheDocument();
    expect(screen.getByText('2:c')).toBeInTheDocument();
    expect(screen.getByText('0:a').closest('.my-row')).not.toBeNull();
  });

  it('merges itemClassName with the class virtuoso passes to the row', () => {
    render(
      <VirtuosoScrollArea
        data={['a']}
        itemClassName="mine"
        itemContent={() => <span>row</span>}
      />,
    );

    const row = screen.getByText('row').parentElement!;
    expect(row).toHaveClass('mine');
  });

  it('applies the container class name and exposes the virtuoso scroller as the viewport', () => {
    const { container } = render(
      <VirtuosoScrollArea
        className="my-container"
        scrollHideDelay={123}
        data={['a']}
        itemContent={() => <Probe />}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('vsa-scroll-area', 'my-container');
    expect(screen.getByTestId('probe')).toHaveTextContent('123:vsa-scroller');

    // The native scroller must keep the class the stylesheet hides, and the data attribute
    // react-virtuoso sets.
    const scroller = screen.getByTestId('virtuoso-scroller');
    expect(scroller).toHaveClass('vsa-scroller');
    expect(scroller).toHaveAttribute('data-virtuoso-scroller');
  });

  it('passes the documented virtualization defaults to react-virtuoso', () => {
    render(<VirtuosoScrollArea data={['a']} itemContent={() => <span>row</span>} />);

    expect(virtuosoSpy.lastListProps?.overscan).toBe(200);
    expect(virtuosoSpy.lastListProps?.increaseViewportBy).toBe(200);
    expect(virtuosoSpy.lastListProps?.style).toEqual({ height: '100%' });
  });

  it('forwards custom virtualization settings', () => {
    render(
      <VirtuosoScrollArea
        data={['a']}
        overscan={42}
        increaseViewportBy={7}
        itemContent={() => <span>row</span>}
      />,
    );

    expect(virtuosoSpy.lastListProps?.overscan).toBe(42);
    expect(virtuosoSpy.lastListProps?.increaseViewportBy).toBe(7);
  });

  it('shows the scroll-to-top button by default and can hide it', () => {
    const { container, rerender } = render(
      <VirtuosoScrollArea
        data={['a', 'b']}
        itemContent={(index) => <span>row {index}</span>}
      />,
    );
    expect(container.querySelector('.vsa-scroll-to-top')).toBeInTheDocument();

    rerender(
      <VirtuosoScrollArea
        data={['a', 'b']}
        showScrollToTopButton={false}
        itemContent={(index) => <span>row {index}</span>}
      />,
    );
    expect(container.querySelector('.vsa-scroll-to-top')).toBeNull();
  });

  it('forwards the imperative handle to the virtuoso instance', () => {
    const ref = { current: null as VirtuosoScrollAreaHandle | null };
    render(
      <VirtuosoScrollArea ref={ref} data={['a', 'b', 'c']} itemContent={() => null} />,
    );

    act(() => ref.current!.scrollToIndex(2, 'auto'));
    expect(virtuosoSpy.listScrollToIndex).toContainEqual({ index: 2, behavior: 'auto' });

    act(() => ref.current!.scrollToIndex(1));
    expect(virtuosoSpy.listScrollToIndex).toContainEqual({
      index: 1,
      behavior: 'smooth',
    });

    act(() => ref.current!.scrollToTop());
    expect(virtuosoSpy.listScrollToIndex).toContainEqual({
      index: 0,
      behavior: 'smooth',
    });
  });

  it('registers itself in the scroll context and unregisters on unmount', () => {
    let latest: ReturnType<typeof useScrollContext> | undefined;

    function Capture() {
      latest = useScrollContext();
      return null;
    }

    const { unmount } = render(
      <ScrollContextProvider>
        <Capture />
        <VirtuosoScrollArea
          scrollContextInstanceId="rows"
          data={['a', 'b', 'c', 'd']}
          itemContent={() => null}
        />
      </ScrollContextProvider>,
    );

    const instance = latest!.getInstance('rows');
    expect(instance).toBeDefined();

    act(() => instance!.scrollToBottom());
    expect(virtuosoSpy.listScrollToIndex).toContainEqual({
      index: 3,
      behavior: 'smooth',
    });

    act(() => instance!.scrollToTop());
    expect(virtuosoSpy.listScrollToIndex).toContainEqual({
      index: 0,
      behavior: 'smooth',
    });

    unmount();
    expect(latest!.getInstance('rows')).toBeUndefined();
  });

  it('recomputes the scrollbar after the data set shrinks', async () => {
    restoreMetrics = mockElementMetrics({
      scrollHeight: 1000,
      offsetHeight: 400,
      clientHeight: 400,
    });

    const { container, rerender } = render(
      <VirtuosoScrollArea
        data={['a', 'b', 'c']}
        itemContent={(index) => <span>row {index}</span>}
      />,
    );

    await recomputeGeometry();
    const scrollbar = container.querySelector<HTMLElement>('.vsa-scrollbar')!;
    expect(
      Number.parseFloat(readCssVar(scrollbar, '--vsa-thumb-height')),
    ).toBeGreaterThan(150);

    // Filtering the list down to less than one viewport must make the scrollbar disappear again;
    // the component recomputes on its own because virtuoso does not report a resize.
    setElementMetrics({ scrollHeight: 200 });
    rerender(
      <VirtuosoScrollArea
        data={['a']}
        itemContent={(index) => <span>row {index}</span>}
      />,
    );
    await advance(120);

    expect(scrollbar.style.visibility).toBe('hidden');
    expect(scrollbar.querySelector('.vsa-thumb')).toHaveAttribute('data-state', 'hidden');
  });
});
