import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Sizes } from '../src/scroll-area';

import {
  addUnlinkedScrollListener,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  isScrollingWithinScrollbarBounds,
  linearScale,
  THUMB_MIN_SIZE,
  toInt,
} from '../src/scroll-area';
import { flushAnimationFrame } from './utils/dom';

/** content 1000 / viewport 400 / rail 400 with no padding → thumb ratio 0.4, thumb 160px. */
const sizes: Sizes = {
  content: 1000,
  viewport: 400,
  scrollbar: { size: 400, paddingStart: 0, paddingEnd: 0 },
};

describe('toInt', () => {
  it('parses pixel values', () => {
    expect(toInt('12px')).toBe(12);
    expect(toInt('0px')).toBe(0);
  });

  it('returns 0 for empty or undefined input', () => {
    expect(toInt('')).toBe(0);
    expect(toInt(undefined)).toBe(0);
  });
});

describe('getThumbRatio', () => {
  it('is viewport divided by content', () => {
    expect(getThumbRatio(400, 1000)).toBe(0.4);
    expect(getThumbRatio(1000, 1000)).toBe(1);
  });

  it('returns 0 instead of NaN when both sizes are unknown', () => {
    expect(getThumbRatio(0, 0)).toBe(0);
  });

  it('returns Infinity for empty content, which the hasThumb guard rejects', () => {
    // `ScrollAreaScrollbar` only shows a thumb for `0 < ratio < 1`, so an empty scroll area
    // (viewport height but no content) correctly ends up without one.
    const ratio = getThumbRatio(400, 0);
    expect(ratio).toBe(Infinity);
    expect(ratio > 0 && ratio < 1).toBe(false);
  });
});

describe('getThumbSize', () => {
  it('scales the rail by the visible ratio', () => {
    expect(getThumbSize(sizes)).toBe(160);
  });

  it('subtracts the rail padding before scaling', () => {
    expect(
      getThumbSize({
        ...sizes,
        scrollbar: { size: 400, paddingStart: 1, paddingEnd: 1 },
      }),
    ).toBeCloseTo(159.2, 5);
  });

  it('never shrinks below the minimum size', () => {
    const tiny = {
      content: 100_000,
      viewport: 100,
      scrollbar: { size: 10, paddingStart: 1, paddingEnd: 1 },
    };
    expect(getThumbSize(tiny)).toBe(THUMB_MIN_SIZE);
    expect(getThumbSize(tiny, 30)).toBe(30);
  });
});

describe('linearScale', () => {
  it('maps one range onto another', () => {
    expect(linearScale([0, 10], [0, 100])(5)).toBe(50);
  });

  it('falls back to the start of the output range for degenerate ranges', () => {
    expect(linearScale([5, 5], [0, 100])(5)).toBe(0);
    expect(linearScale([0, 10], [7, 7])(5)).toBe(7);
  });
});

describe('getThumbOffsetFromScroll', () => {
  it('maps the scroll range onto the free rail space', () => {
    expect(getThumbOffsetFromScroll(0, sizes)).toBe(0);
    expect(getThumbOffsetFromScroll(300, sizes)).toBe(120);
    expect(getThumbOffsetFromScroll(600, sizes)).toBe(240);
  });

  it('clamps out-of-range scroll positions', () => {
    expect(getThumbOffsetFromScroll(-50, sizes)).toBe(0);
    expect(getThumbOffsetFromScroll(9999, sizes)).toBe(240);
  });
});

describe('getScrollPositionFromPointer', () => {
  it('maps a pointer position back onto the scroll range', () => {
    expect(getScrollPositionFromPointer(80, 0, sizes)).toBe(0);
    expect(getScrollPositionFromPointer(200, 0, sizes)).toBe(300);
    expect(getScrollPositionFromPointer(320, 0, sizes)).toBe(600);
  });

  it('accounts for the grab offset inside the thumb', () => {
    // Grabbing 20px below the thumb top narrows the usable pointer range to 20…260.
    expect(getScrollPositionFromPointer(120, 20, sizes)).toBe(250);
  });
});

describe('isScrollingWithinScrollbarBounds', () => {
  it('is true strictly inside the scrollable range', () => {
    expect(isScrollingWithinScrollbarBounds(5, 10)).toBe(true);
    expect(isScrollingWithinScrollbarBounds(0, 10)).toBe(false);
    expect(isScrollingWithinScrollbarBounds(10, 10)).toBe(false);
  });
});

describe('addUnlinkedScrollListener', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('reports vertical scroll changes through an animation frame loop', async () => {
    const node = document.createElement('div');
    document.body.appendChild(node);

    const handler = vi.fn();
    cleanups.push(addUnlinkedScrollListener(node, handler));

    Object.defineProperty(node, 'scrollTop', { configurable: true, value: 0 });
    await flushAnimationFrame();
    expect(handler).not.toHaveBeenCalled();

    Object.defineProperty(node, 'scrollTop', { configurable: true, value: 120 });
    await vi.waitFor(() => expect(handler).toHaveBeenCalled());

    node.remove();
  });

  it('stops reporting once cleaned up', async () => {
    const node = document.createElement('div');
    document.body.appendChild(node);

    const handler = vi.fn();
    const cleanup = addUnlinkedScrollListener(node, handler);

    Object.defineProperty(node, 'scrollTop', { configurable: true, value: 50 });
    await vi.waitFor(() => expect(handler).toHaveBeenCalled());

    cleanup();
    handler.mockClear();

    Object.defineProperty(node, 'scrollTop', { configurable: true, value: 90 });
    await flushAnimationFrame();
    expect(handler).not.toHaveBeenCalled();

    node.remove();
  });
});
