import type { ReactNode } from 'react';

import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ScrollArea, ScrollAreaThumb, useScrollAreaContext } from '../src/index';

import {
  mockElementMetrics,
  readCssVar,
  resizeObserverCount,
  setScrollTop,
  triggerResizeObservers,
} from './utils/dom';

let restoreMetrics: (() => void) | undefined;

afterEach(() => {
  restoreMetrics?.();
  restoreMetrics = undefined;
});

/** Makes the scroll area believe it has 1000px of content in a 400px viewport. */
function mockScrollableMetrics(): void {
  restoreMetrics = mockElementMetrics({
    scrollHeight: 1000,
    offsetHeight: 400,
    clientHeight: 400,
  });
}

function renderScrollArea(ui?: ReactNode) {
  const utils = render(<ScrollArea>{ui ?? <p>content</p>}</ScrollArea>);
  const root = utils.container.firstElementChild as HTMLElement;
  const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
  const scrollbar = root.querySelector<HTMLElement>('.vsa-scrollbar')!;
  const thumb = root.querySelector<HTMLElement>('.vsa-thumb')!;

  return { ...utils, root, viewport, scrollbar, thumb };
}

/** Lets the ResizeObserver → rAF → debounce chain run, then re-reads the geometry. */
async function recomputeGeometry(): Promise<void> {
  await act(async () => {
    triggerResizeObservers();
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

function thumbOffsetPx(thumb: HTMLElement): number {
  const match = /translate3d\(0,\s*([\d.]+)px/.exec(thumb.style.transform);
  return match ? Number(match[1]) : Number.NaN;
}

describe('ScrollArea', () => {
  it('renders children inside a marked viewport and content wrapper', () => {
    const { root, viewport } = renderScrollArea(<p>hello world</p>);

    expect(root).toHaveAttribute('data-slot', 'scroll-area');
    expect(root).toHaveClass('vsa-scroll-area', 'vsa-scroll-area-layout');
    expect(viewport).toHaveAttribute('data-slot', 'scroll-area-viewport');
    expect(viewport).toHaveClass('vsa-viewport');
    expect(viewport).toContainElement(screen.getByText('hello world'));
    expect(screen.getByText('hello world').parentElement).toHaveClass('vsa-content');
  });

  it('merges consumer class names instead of replacing them', () => {
    const { container } = render(
      <ScrollArea
        className="my-root"
        viewportClassName="my-viewport"
        scrollbarClassName="my-scrollbar"
        scrollbarThumbClassName="my-thumb"
      >
        <p>content</p>
      </ScrollArea>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('vsa-scroll-area', 'my-root');
    expect(root.querySelector('[data-slot="scroll-area-viewport"]')).toHaveClass(
      'vsa-viewport',
      'my-viewport',
    );
    expect(root.querySelector('.vsa-scrollbar')).toHaveClass(
      'vsa-scrollbar',
      'my-scrollbar',
    );
    expect(root.querySelector('.vsa-thumb')).toHaveClass('vsa-thumb', 'my-thumb');
  });

  it('forwards extra props and the ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ScrollArea ref={ref} data-testid="root" aria-label="list">
        <p>content</p>
      </ScrollArea>,
    );

    expect(screen.getByTestId('root')).toBe(ref.current);
    expect(ref.current).toHaveAttribute('aria-label', 'list');
  });

  it('keeps the scrollbar out of the way when there is nothing to scroll', () => {
    const { scrollbar, thumb } = renderScrollArea();

    expect(scrollbar.style.visibility).toBe('hidden');
    expect(scrollbar.style.pointerEvents).toBe('none');
    expect(thumb).toHaveAttribute('data-state', 'hidden');
    expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
  });

  it('exposes the scrolling viewport through viewportRef', () => {
    const viewportRef = { current: null as HTMLDivElement | null };
    const utils = render(
      <ScrollArea viewportRef={viewportRef}>
        <p>content</p>
      </ScrollArea>,
    );
    const root = utils.container.firstElementChild as HTMLElement;
    const viewport = root.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    // The forwarded `ref` is the outer container; `viewportRef` is the element that scrolls.
    expect(viewportRef.current).toBe(viewport);
    expect(viewportRef.current).not.toBe(root);
    expect(() =>
      viewportRef.current!.scrollTo({ top: 0, behavior: 'smooth' }),
    ).not.toThrow();
  });

  it('sizes the thumb from the measured geometry', async () => {
    const { scrollbar, thumb } = renderScrollArea();
    mockScrollableMetrics();
    await recomputeGeometry();

    // 1000px of content in a 400px viewport → 0.4 × the 400px rail ≈ 160px.
    // The variable is set on the rail and inherited by the thumb.
    const thumbHeight = Number.parseFloat(readCssVar(scrollbar, '--vsa-thumb-height'));
    expect(thumbHeight).toBeGreaterThan(150);
    expect(thumbHeight).toBeLessThan(170);

    expect(thumb).toHaveAttribute('data-state', 'visible');
    expect(scrollbar.style.visibility).not.toBe('hidden');
  });

  it('reveals the scrollbar while the pointer is inside and hides it again afterwards', async () => {
    const { container } = render(
      <ScrollArea scrollHideDelay={10}>
        <p>content</p>
      </ScrollArea>,
    );
    const scrollbar = container.querySelector<HTMLElement>('.vsa-scrollbar')!;

    expect(scrollbar.style.opacity).toBe('0');

    act(() => {
      container.firstElementChild!.dispatchEvent(new Event('pointerenter'));
    });
    expect(scrollbar.style.opacity).toBe('1');

    act(() => {
      container.firstElementChild!.dispatchEvent(new Event('pointerleave'));
    });
    await vi.waitFor(() => expect(scrollbar.style.opacity).toBe('0'));
  });

  it('reveals the scrollbar while scrolling and hides it after the delay', async () => {
    const { viewport, scrollbar } = renderScrollArea();

    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });
    expect(scrollbar.style.opacity).toBe('1');

    // Default scrollHideDelay is 600ms.
    await vi.waitFor(() => expect(scrollbar.style.opacity).toBe('0'));
  });

  it('follows the scroll position with the thumb', async () => {
    const { viewport, thumb } = renderScrollArea();
    mockScrollableMetrics();
    await recomputeGeometry();

    expect(thumbOffsetPx(thumb)).toBe(0);

    // jsdom does not emit a scroll event when `scrollTop` is assigned, so fire it explicitly.
    setScrollTop(viewport, 300);
    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    await vi.waitFor(() => expect(thumbOffsetPx(thumb)).toBeGreaterThan(115));
    expect(thumbOffsetPx(thumb)).toBeLessThan(125);
  });

  it('scrolls the viewport when the wheel is used over the scrollbar', async () => {
    const { viewport, thumb } = renderScrollArea();
    mockScrollableMetrics();
    await recomputeGeometry();

    const event = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      thumb.dispatchEvent(event);
    });

    expect(viewport.scrollTop).toBe(100);
    expect(event.defaultPrevented).toBe(true);
  });

  it('scrolls the viewport when the thumb is dragged', async () => {
    const { viewport, thumb } = renderScrollArea();
    mockScrollableMetrics();
    await recomputeGeometry();

    act(() => {
      thumb.dispatchEvent(
        new PointerEvent('pointerdown', { clientY: 20, button: 0, bubbles: true }),
      );
    });

    act(() => {
      thumb.dispatchEvent(
        new PointerEvent('pointermove', { clientY: 200, bubbles: true }),
      );
    });

    // Dragging the thumb a third of the way down the rail lands near a third of the content.
    expect(viewport.scrollTop).toBeGreaterThan(440);
    expect(viewport.scrollTop).toBeLessThan(460);
  });

  it('unsubscribes from observers on unmount', async () => {
    mockScrollableMetrics();
    const { unmount } = renderScrollArea();
    await recomputeGeometry();

    expect(resizeObserverCount()).toBeGreaterThan(0);
    unmount();
    expect(resizeObserverCount()).toBe(0);
  });
});

describe('context guards', () => {
  it('throws when a thumb is used outside a ScrollArea', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ScrollAreaThumb />)).toThrow(/must be used within a ScrollArea/);
  });

  it('throws when a thumb is used inside a ScrollArea but outside a Scrollbar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <ScrollArea>
          <ScrollAreaThumb />
        </ScrollArea>,
      ),
    ).toThrow(/must be used within a Scrollbar/);
  });

  it('exposes a working context to descendants', () => {
    let contextViewport: HTMLElement | null = null;

    function Probe() {
      const { viewport, scrollHideDelay, type } = useScrollAreaContext('Probe');
      contextViewport = viewport;
      return (
        <span data-testid="probe">
          {type}:{scrollHideDelay}
        </span>
      );
    }

    const { container } = render(
      <ScrollArea scrollHideDelay={123}>
        <Probe />
      </ScrollArea>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent('hover:123');
    expect(contextViewport).toBe(
      container.querySelector('[data-slot="scroll-area-viewport"]'),
    );
  });

  it('nests the thumb inside the scrollbar rail', () => {
    const { scrollbar, thumb } = renderScrollArea();

    expect(scrollbar).toContainElement(thumb);
    expect(scrollbar).toHaveClass('vsa-scrollbar');
  });
});
