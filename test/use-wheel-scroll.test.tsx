import { render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-virtuoso', () => import('./mocks/react-virtuoso'));

import type { WheelScrollMode } from '../src/index';

import { ScrollArea, WHEEL_LATCH_MS, isInShadowRoot, useWheelScroll } from '../src/index';
import { VirtuosoScrollArea } from '../src/virtuoso/index';
import { VirtuosoGridScrollArea } from '../src/virtuoso-grid/index';

import { flushAnimationFrame, mockElementMetrics, setScrollTop } from './utils/dom';

let restoreMetrics: (() => void) | undefined;
const hosts: HTMLElement[] = [];

afterEach(() => {
  restoreMetrics?.();
  restoreMetrics = undefined;
  for (const host of hosts.splice(0)) host.remove();
});

/** A container that lives inside an open shadow root attached to `document.body`. */
function createShadowContainer(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);

  const container = document.createElement('div');
  host.attachShadow({ mode: 'open' }).appendChild(container);
  return container;
}

/** Fires a cancelable wheel event on `target` and reports whether it was consumed. */
function wheel(
  target: Element,
  init: WheelEventInit & { timeStamp?: number } = {},
): { defaultPrevented: boolean; reachedDocument: boolean } {
  let reachedDocument = false;
  const spy = () => {
    reachedDocument = true;
  };
  document.addEventListener('wheel', spy);

  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    composed: true,
    deltaY: 100,
    ...init,
  });
  if (init.timeStamp !== undefined) {
    Object.defineProperty(event, 'timeStamp', { value: init.timeStamp });
  }
  target.dispatchEvent(event);
  document.removeEventListener('wheel', spy);

  return { defaultPrevented: event.defaultPrevented, reachedDocument };
}

function renderScrollArea(
  container: HTMLElement | undefined,
  wheelScroll?: WheelScrollMode,
): HTMLElement {
  const utils = render(
    <ScrollArea wheelScroll={wheelScroll}>
      <p>content</p>
    </ScrollArea>,
    container ? { container } : undefined,
  );
  return utils.container.querySelector<HTMLElement>('.vsa-viewport')!;
}

/** Makes every element scrollable by 600px (scrollHeight 1000, clientHeight 400). */
function makeScrollable(): void {
  restoreMetrics = mockElementMetrics({
    scrollHeight: 1000,
    clientHeight: 400,
    offsetHeight: 400,
  });
}

describe('isInShadowRoot', () => {
  it('detects shadow trees and the light DOM', () => {
    const shadowContainer = createShadowContainer();
    expect(isInShadowRoot(shadowContainer)).toBe(true);
    expect(isInShadowRoot(document.body)).toBe(false);
    expect(isInShadowRoot(null)).toBe(false);
    // A detached node is its own root and therefore not in a shadow tree.
    expect(isInShadowRoot(document.createElement('div'))).toBe(false);
  });
});

describe('useWheelScroll — mode selection', () => {
  it('leaves wheel events alone in the light DOM by default', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined);
    setScrollTop(viewport, 0);

    const result = wheel(viewport, { deltaY: 100 });
    await flushAnimationFrame();

    expect(result.defaultPrevented).toBe(false);
    expect(result.reachedDocument).toBe(true);
    expect(viewport.scrollTop).toBe(0);
  });

  it('takes over wheel events inside a shadow root by default', async () => {
    makeScrollable();
    const viewport = renderScrollArea(createShadowContainer());
    setScrollTop(viewport, 0);

    const result = wheel(viewport, { deltaY: 100 });
    expect(result.defaultPrevented).toBe(true);
    expect(result.reachedDocument).toBe(false);

    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(100);
  });

  it('"always" takes over in the light DOM', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');
    setScrollTop(viewport, 0);

    expect(wheel(viewport, { deltaY: 50 }).defaultPrevented).toBe(true);
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(50);
  });

  it('"never" leaves a shadow-root viewport alone', async () => {
    makeScrollable();
    const viewport = renderScrollArea(createShadowContainer(), 'never');
    setScrollTop(viewport, 0);

    expect(wheel(viewport, { deltaY: 50 }).defaultPrevented).toBe(false);
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(0);
  });

  it('re-evaluates when the mode prop changes', async () => {
    makeScrollable();
    const { container, rerender } = render(
      <ScrollArea wheelScroll="never">
        <p>content</p>
      </ScrollArea>,
    );
    const viewport = container.querySelector<HTMLElement>('.vsa-viewport')!;
    setScrollTop(viewport, 0);
    expect(wheel(viewport).defaultPrevented).toBe(false);

    rerender(
      <ScrollArea wheelScroll="always">
        <p>content</p>
      </ScrollArea>,
    );
    expect(wheel(viewport).defaultPrevented).toBe(true);
  });
});

describe('useWheelScroll — behaviour', () => {
  it('batches several events into one frame and clamps to the scrollable range', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');
    setScrollTop(viewport, 0);

    wheel(viewport, { deltaY: 300 });
    wheel(viewport, { deltaY: 300 });
    wheel(viewport, { deltaY: 300 });
    expect(viewport.scrollTop).toBe(0); // nothing applied synchronously

    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(600); // 900 clamped to scrollHeight - clientHeight
  });

  it('normalises line and page delta modes', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');
    setScrollTop(viewport, 0);

    wheel(viewport, { deltaY: 2, deltaMode: 1 }); // 2 lines × 16px
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(32);

    wheel(viewport, { deltaY: 1, deltaMode: 2, timeStamp: 10_000 }); // 1 page = clientHeight
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(432);
  });

  it('lets pinch-zoom (ctrlKey) and pure horizontal wheel events through', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');
    setScrollTop(viewport, 100);

    expect(wheel(viewport, { deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(viewport, { deltaY: 0, deltaX: 40 }).defaultPrevented).toBe(false);

    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(100);
  });

  it('chains to the ancestors at the boundary when no gesture is in progress', () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');

    setScrollTop(viewport, 0);
    expect(wheel(viewport, { deltaY: -100, timeStamp: 1_000 })).toEqual({
      defaultPrevented: false,
      reachedDocument: true,
    });

    setScrollTop(viewport, 600);
    expect(wheel(viewport, { deltaY: 100, timeStamp: 2_000 })).toEqual({
      defaultPrevented: false,
      reachedDocument: true,
    });

    // Away from the boundary the same events are consumed.
    setScrollTop(viewport, 300);
    expect(wheel(viewport, { deltaY: -100, timeStamp: 3_000 }).defaultPrevented).toBe(
      true,
    );
    expect(wheel(viewport, { deltaY: 100, timeStamp: 4_000 }).defaultPrevented).toBe(
      true,
    );
  });

  it('keeps consuming at the boundary while a gesture that started here is latched', async () => {
    makeScrollable();
    const viewport = renderScrollArea(undefined, 'always');
    setScrollTop(viewport, 550);

    // First event scrolls (550 → 600) and starts the gesture …
    expect(wheel(viewport, { deltaY: 100, timeStamp: 1_000 }).defaultPrevented).toBe(
      true,
    );
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(600);

    // … the trackpad's inertia keeps firing within the latch window: still ours.
    expect(
      wheel(viewport, { deltaY: 100, timeStamp: 1_000 + WHEEL_LATCH_MS })
        .defaultPrevented,
    ).toBe(true);

    // After a pause the next boundary event chains to the page.
    expect(
      wheel(viewport, { deltaY: 100, timeStamp: 1_000 + WHEEL_LATCH_MS * 3 })
        .defaultPrevented,
    ).toBe(false);
  });

  it('stops listening on unmount', async () => {
    makeScrollable();
    const { container, unmount } = render(
      <ScrollArea wheelScroll="always">
        <p>content</p>
      </ScrollArea>,
    );
    const viewport = container.querySelector<HTMLElement>('.vsa-viewport')!;
    setScrollTop(viewport, 0);

    unmount();
    expect(wheel(viewport).defaultPrevented).toBe(false);
    await flushAnimationFrame();
    expect(viewport.scrollTop).toBe(0);
  });

  it('can be attached to any element through the exported hook', async () => {
    makeScrollable();

    function Custom() {
      const [node, setNode] = useState<HTMLDivElement | null>(null);
      useWheelScroll(node, 'always');
      return <div ref={setNode} data-testid="custom" />;
    }

    const { getByTestId } = render(<Custom />);
    const node = getByTestId('custom');
    setScrollTop(node, 0);

    expect(wheel(node, { deltaY: 40 }).defaultPrevented).toBe(true);
    await flushAnimationFrame();
    expect(node.scrollTop).toBe(40);
  });
});

describe('virtualized scroll areas', () => {
  it('VirtuosoScrollArea scrolls its scroller with the wheel inside a shadow root', async () => {
    makeScrollable();
    const { container } = render(
      <VirtuosoScrollArea
        data={['a', 'b']}
        itemContent={(_, item) => <span>{item}</span>}
      />,
      { container: createShadowContainer() },
    );
    const scroller = container.querySelector<HTMLElement>('[data-virtuoso-scroller]')!;
    setScrollTop(scroller, 0);

    expect(wheel(scroller, { deltaY: 120 }).defaultPrevented).toBe(true);
    await flushAnimationFrame();
    expect(scroller.scrollTop).toBe(120);
  });

  it('VirtuosoGridScrollArea honours wheelScroll="never"', async () => {
    makeScrollable();
    const { container } = render(
      <VirtuosoGridScrollArea
        totalCount={2}
        wheelScroll="never"
        itemContent={(i) => i}
      />,
      { container: createShadowContainer() },
    );
    const scroller = container.querySelector<HTMLElement>('[data-virtuoso-scroller]')!;
    setScrollTop(scroller, 0);

    expect(wheel(scroller, { deltaY: 120 }).defaultPrevented).toBe(false);
    await flushAnimationFrame();
    expect(scroller.scrollTop).toBe(0);
  });
});
