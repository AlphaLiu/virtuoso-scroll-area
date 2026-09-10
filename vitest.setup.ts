import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { installResizeObserverMock } from './test/utils/dom';

// Testing Library only auto-registers cleanup when globals are enabled.
afterEach(cleanup);

// jsdom has no ResizeObserver, and both the scroll area and react-virtuoso rely on it.
installResizeObserverMock();

if (typeof requestAnimationFrame === 'undefined') {
  // jsdom only provides rAF in "pretend to be visual" mode; the components depend on it.
  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) =>
    setTimeout(
      () => callback(Date.now()),
      16,
    ) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((handle: number) =>
    clearTimeout(
      handle as unknown as ReturnType<typeof setTimeout>,
    )) as typeof cancelAnimationFrame;
}

// jsdom does not implement element scrolling.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
}

// jsdom does not implement pointer capture, which the scrollbar drag handler uses.
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}
