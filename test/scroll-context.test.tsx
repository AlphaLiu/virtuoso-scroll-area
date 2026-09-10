import { act, render, screen } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScrollContextType } from '../src/index';

import {
  ScrollArea,
  ScrollContextProvider,
  useScrollContext,
  useScrollToBottom,
  useScrollToTop,
} from '../src/index';

import { mockElementMetrics } from './utils/dom';

/** Captures the context and attaches a real element to it, like a scroll area would. */
function Harness({ onContext }: { onContext?: (context: ScrollContextType) => void }) {
  const context = useScrollContext();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    context.setScrollAreaElement(elementRef.current);
  }, [context]);

  useEffect(() => {
    onContext?.(context);
  }, [context, onContext]);

  return <div ref={elementRef} data-testid="scroller" />;
}

function ButtonHarness() {
  const scrollToTop = useScrollToTop();
  const scrollToBottom = useScrollToBottom();

  return (
    <>
      <button type="button" onClick={scrollToTop}>
        top
      </button>
      <button type="button" onClick={scrollToBottom}>
        bottom
      </button>
    </>
  );
}

let scrollToMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Installed globally by the test setup, so it is not restored automatically.
  scrollToMock = Element.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>;
  scrollToMock.mockClear?.();
});

afterEach(() => {
  scrollToMock.mockClear?.();
});

describe('ScrollContext defaults', () => {
  it('exposes safe no-ops without a provider', () => {
    const captured: ScrollContextType[] = [];

    render(<Harness onContext={(context) => captured.push(context)} />);

    const context = captured.at(-1)!;
    expect(() => context.scrollToTop()).not.toThrow();
    expect(() => context.scrollToBottom()).not.toThrow();
    expect(context.getInstance('missing')).toBeUndefined();
  });
});

describe('ScrollContextProvider', () => {
  it('scrolls the attached element to the top and bottom', () => {
    const restore = mockElementMetrics({ scrollHeight: 1234 });
    const captured: ScrollContextType[] = [];

    render(
      <ScrollContextProvider>
        <Harness onContext={(context) => captured.push(context)} />
      </ScrollContextProvider>,
    );

    const context = captured.at(-1)!;

    act(() => context.scrollToTop());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    act(() => context.scrollToBottom());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 1234, behavior: 'smooth' });

    restore();
  });

  it('keeps the imperative callbacks stable across re-renders', () => {
    const captured: ScrollContextType[] = [];
    const capture = (context: ScrollContextType) => captured.push(context);

    const { rerender } = render(
      <ScrollContextProvider>
        <Harness onContext={capture} />
      </ScrollContextProvider>,
    );

    // The first capture happens before the element is attached, which legitimately produces a new
    // closure; from then on the callbacks must stay identical.
    const before = captured.at(-1)!;
    expect(before).not.toBe(captured[0]);

    rerender(
      <ScrollContextProvider>
        <Harness onContext={capture} />
      </ScrollContextProvider>,
    );

    const after = captured.at(-1)!;
    expect(after.scrollToTop).toBe(before.scrollToTop);
    expect(after.scrollToBottom).toBe(before.scrollToBottom);
    expect(after.getInstance).toBe(before.getInstance);
    expect(after.setScrollAreaElement).toBe(before.setScrollAreaElement);
  });

  it('registers and unregisters a named instance', () => {
    const captured: ScrollContextType[] = [];

    const { unmount } = render(
      <ScrollContextProvider instanceId="theme-grid">
        <Harness onContext={(context) => captured.push(context)} />
      </ScrollContextProvider>,
    );

    const instance = captured.at(-1)!.getInstance('theme-grid');
    expect(instance).toBeDefined();
    expect(typeof instance!.scrollToTop).toBe('function');
    expect(typeof instance!.scrollToBottom).toBe('function');
    expect(typeof instance!.setScrollAreaElement).toBe('function');

    unmount();
    expect(captured.at(-1)!.getInstance('theme-grid')).toBeUndefined();
  });

  it('addresses several instances independently', () => {
    const captured: ScrollContextType[] = [];

    render(
      <ScrollContextProvider instanceId="list">
        <Harness onContext={(context) => captured.push(context)} />
      </ScrollContextProvider>,
    );

    const context = captured.at(-1)!;
    const custom = {
      scrollToTop: vi.fn(),
      scrollToBottom: vi.fn(),
      setScrollAreaElement: vi.fn(),
    };

    act(() => context.registerInstance('grid', custom));
    expect(context.getInstance('grid')).toBe(custom);

    act(() => context.getInstance('grid')!.scrollToTop());
    expect(custom.scrollToTop).toHaveBeenCalledOnce();

    act(() => context.unregisterInstance('grid'));
    expect(context.getInstance('grid')).toBeUndefined();

    // The provider's own instance is unaffected.
    expect(context.getInstance('list')).toBeDefined();
    expect(context.getInstance('list')).not.toBe(custom);
  });

  it('drives the nearest region through the convenience hooks', () => {
    const restore = mockElementMetrics({ scrollHeight: 500 });

    render(
      <ScrollContextProvider>
        <Harness />
        <ButtonHarness />
      </ScrollContextProvider>,
    );

    act(() => screen.getByRole('button', { name: 'top' }).click());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    act(() => screen.getByRole('button', { name: 'bottom' }).click());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' });

    restore();
  });

  it('drives a non-virtualized ScrollArea through the convenience hooks', () => {
    const restore = mockElementMetrics({ scrollHeight: 900 });

    render(
      <ScrollContextProvider>
        <ScrollArea>
          <p>plain content</p>
        </ScrollArea>
        <ButtonHarness />
      </ScrollContextProvider>,
    );

    act(() => screen.getByRole('button', { name: 'bottom' }).click());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 900, behavior: 'smooth' });

    act(() => screen.getByRole('button', { name: 'top' }).click());
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    restore();
  });

  it('forgets the viewport when the scroll area unmounts', () => {
    const captured: ScrollContextType[] = [];

    function Capture() {
      captured.push(useScrollContext());
      return null;
    }

    function Wrapper({ showScrollArea }: { showScrollArea: boolean }) {
      return (
        <ScrollContextProvider>
          <Capture />
          {showScrollArea ? (
            <ScrollArea>
              <p>plain content</p>
            </ScrollArea>
          ) : null}
        </ScrollContextProvider>
      );
    }

    const { rerender } = render(<Wrapper showScrollArea />);

    act(() => captured.at(-1)!.scrollToTop());
    expect(scrollToMock).toHaveBeenCalledTimes(1);

    // The provider stays mounted, so the cleared viewport is visible to consumers.
    rerender(<Wrapper showScrollArea={false} />);

    act(() => captured.at(-1)!.scrollToTop());
    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it('prefers the closest provider when nested', () => {
    const outer: ScrollContextType[] = [];
    const inner: ScrollContextType[] = [];

    render(
      <ScrollContextProvider>
        <Harness onContext={(context) => outer.push(context)} />
        <ScrollContextProvider>
          <Harness onContext={(context) => inner.push(context)} />
        </ScrollContextProvider>
      </ScrollContextProvider>,
    );

    expect(inner.at(-1)!.scrollToTop).not.toBe(outer.at(-1)!.scrollToTop);
  });
});
