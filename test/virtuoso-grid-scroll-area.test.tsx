import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-virtuoso', () => import('./mocks/react-virtuoso'));

import type { VirtuosoGridScrollAreaHandle } from '../src/virtuoso-grid/index';

import { ScrollContextProvider, useScrollContext } from '../src/index';
import { VirtuosoGridScrollArea } from '../src/virtuoso-grid/index';

import { resetVirtuosoSpy, virtuosoSpy } from './mocks/react-virtuoso';

beforeEach(() => {
  resetVirtuosoSpy();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('VirtuosoGridScrollArea', () => {
  it('renders one cell per item', () => {
    render(
      <VirtuosoGridScrollArea
        totalCount={5}
        itemContent={(index) => <span>{`cell ${index}`}</span>}
      />,
    );

    expect(screen.getAllByText(/^cell \d$/)).toHaveLength(5);
    expect(screen.getByText('cell 4')).toBeInTheDocument();
  });

  it('marks the grid with the default class and a data slot', () => {
    const { container } = render(
      <VirtuosoGridScrollArea
        className="my-container"
        totalCount={2}
        itemContent={(index) => <span>{index}</span>}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('vsa-scroll-area', 'my-container');
    expect(root).toHaveAttribute('data-slot', 'virtuoso-grid-scroll-area');
    expect(container.querySelector('.vsa-grid-list')).toHaveClass('vsa-grid-list');
    expect(container.querySelector('[data-virtualized-scroll-area]')).toHaveClass(
      'vsa-virtualized-scroll-area',
    );
  });

  it('merges gridClassName with the default grid class', () => {
    const { container } = render(
      <VirtuosoGridScrollArea
        gridClassName="grid-cols-4"
        totalCount={1}
        itemContent={() => <span>cell</span>}
      />,
    );

    expect(container.querySelector('.vsa-grid-list')).toHaveClass(
      'vsa-grid-list',
      'grid-cols-4',
    );
  });

  it('compensates the zero padding react-virtuoso passes to the grid', () => {
    const { container } = render(
      <VirtuosoGridScrollArea totalCount={1} itemContent={() => <span>cell</span>} />,
    );

    const list = container.querySelector<HTMLElement>('.vsa-grid-list')!;
    expect(list.style.paddingTop).toBe('4px');
    expect(list.style.paddingBottom).toBe('4px');
  });

  it('passes the documented virtualization defaults to react-virtuoso', () => {
    render(
      <VirtuosoGridScrollArea totalCount={1} itemContent={() => <span>cell</span>} />,
    );

    expect(virtuosoSpy.lastGridProps?.overscan).toEqual({ main: 200, reverse: 200 });
    expect(virtuosoSpy.lastGridProps?.increaseViewportBy).toEqual({
      bottom: 200,
      top: 200,
    });
    expect(virtuosoSpy.lastGridProps?.style).toEqual({ height: '100%' });
  });

  it('forwards the range and key callbacks', () => {
    const onRangeChanged = vi.fn();
    const computeItemKey = vi.fn((index: number) => `key-${index}`);

    render(
      <VirtuosoGridScrollArea
        totalCount={4}
        computeItemKey={computeItemKey}
        onRangeChanged={onRangeChanged}
        itemContent={(index) => <span>{index}</span>}
      />,
    );

    expect(virtuosoSpy.lastGridProps?.computeItemKey).toBe(computeItemKey);
    expect(onRangeChanged).toHaveBeenCalledWith({ startIndex: 0, endIndex: 3 });
  });

  it('forwards the imperative handle to the virtuoso grid', () => {
    const ref = { current: null as VirtuosoGridScrollAreaHandle | null };
    render(<VirtuosoGridScrollArea ref={ref} totalCount={6} itemContent={() => null} />);

    act(() => ref.current!.scrollToIndex(4));
    expect(virtuosoSpy.gridScrollToIndex).toContainEqual({
      index: 4,
      behavior: 'smooth',
    });

    act(() => ref.current!.scrollToTop());
    expect(virtuosoSpy.gridScrollToIndex).toContainEqual({
      index: 0,
      behavior: 'smooth',
    });
  });

  it('registers itself in the scroll context and scrolls to the last cell', () => {
    let latest: ReturnType<typeof useScrollContext> | undefined;

    function Capture() {
      latest = useScrollContext();
      return null;
    }

    const { unmount } = render(
      <ScrollContextProvider>
        <Capture />
        <VirtuosoGridScrollArea
          scrollContextInstanceId="theme-grid"
          totalCount={51}
          itemContent={() => null}
        />
      </ScrollContextProvider>,
    );

    act(() => latest!.getInstance('theme-grid')!.scrollToBottom());
    expect(virtuosoSpy.gridScrollToIndex).toContainEqual({
      index: 50,
      behavior: 'smooth',
    });

    unmount();
    expect(latest!.getInstance('theme-grid')).toBeUndefined();
  });

  it('shows the scroll-to-top button by default and can hide it', () => {
    const { container, rerender } = render(
      <VirtuosoGridScrollArea
        totalCount={2}
        itemContent={(index) => <span>{index}</span>}
      />,
    );
    expect(container.querySelector('.vsa-scroll-to-top')).toBeInTheDocument();

    rerender(
      <VirtuosoGridScrollArea
        totalCount={2}
        showScrollToTopButton={false}
        itemContent={(index) => <span>{index}</span>}
      />,
    );
    expect(container.querySelector('.vsa-scroll-to-top')).toBeNull();
  });

  it('nudges the container when an entrance animation ends', () => {
    vi.useFakeTimers();

    const { container } = render(
      <VirtuosoGridScrollArea
        totalCount={2}
        itemContent={(index) => <span>{index}</span>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;

    act(() => {
      document.dispatchEvent(new Event('animationend'));
    });

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(root.style.paddingBottom).toBe('1px');

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(root.style.paddingBottom).toBe('');

    // The nudge is a one-shot: further animations must not move the layout again.
    act(() => {
      document.dispatchEvent(new Event('animationend'));
      vi.advanceTimersByTime(40);
    });
    expect(root.style.paddingBottom).toBe('');
  });

  it('falls back to a timer when no animation ever ends', () => {
    vi.useFakeTimers();

    const { container } = render(
      <VirtuosoGridScrollArea
        totalCount={2}
        itemContent={(index) => <span>{index}</span>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(root.style.paddingBottom).toBe('1px');
  });
});
