import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ScrollToTopButtonProps } from '../src/index';

import {
  DEFAULT_BUTTON_OFFSET,
  DEFAULT_SCROLL_THRESHOLD,
  ScrollToTopButton,
} from '../src/index';

import { setScrollTop } from './utils/dom';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Renders the button next to a real scroller element and returns both. */
function setup(props: Partial<ScrollToTopButtonProps> = {}) {
  const scrollerRef = { current: null as HTMLDivElement | null };
  const scrollToTop = vi.fn();

  const utils = render(
    <div className="relative">
      <div
        data-testid="scroller"
        ref={(element) => {
          scrollerRef.current = element;
        }}
      />
      <ScrollToTopButton scrollerRef={scrollerRef} scrollToTop={scrollToTop} {...props} />
    </div>,
  );

  const wrapper = utils.container.querySelector<HTMLElement>('.vsa-scroll-to-top')!;
  const button = utils.container.querySelector<HTMLButtonElement>('button')!;

  return {
    ...utils,
    scrollerRef,
    scroller: utils.getByTestId('scroller'),
    scrollToTop,
    wrapper,
    button,
  };
}

/**
 * Moves the scroller and fires `scroll`. The visibility update happens inside an animation frame,
 * so it is flushed within `act` to keep React's warnings out of the output.
 */
async function scrollTo(element: HTMLElement, position: number): Promise<void> {
  setScrollTop(element, position);
  await act(async () => {
    fireEvent.scroll(element);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

describe('ScrollToTopButton', () => {
  it('is hidden until the scroller is scrolled past the threshold', async () => {
    const { wrapper, button, scroller } = setup();

    expect(wrapper).toHaveAttribute('data-visible', 'false');
    expect(button).toBeInTheDocument();

    await scrollTo(scroller, DEFAULT_SCROLL_THRESHOLD);
    expect(wrapper).toHaveAttribute('data-visible', 'false');

    await scrollTo(scroller, DEFAULT_SCROLL_THRESHOLD + 1);
    expect(wrapper).toHaveAttribute('data-visible', 'true');
  });

  it('honours a custom threshold', async () => {
    const { wrapper, scroller } = setup({ threshold: 20 });

    await scrollTo(scroller, 25);
    expect(wrapper).toHaveAttribute('data-visible', 'true');

    await scrollTo(scroller, 5);
    expect(wrapper).toHaveAttribute('data-visible', 'false');
  });

  it('calls scrollToTop when clicked', () => {
    const { button, scrollToTop } = setup();

    fireEvent.click(button);
    expect(scrollToTop).toHaveBeenCalledOnce();
  });

  it('renders an accessible button with the default chevron icon', () => {
    const { button } = setup();

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('vsa-scroll-to-top-button');
    expect(button).toHaveAccessibleName('Scroll to top');
    expect(button.querySelector('svg')).toHaveClass('vsa-scroll-to-top-icon');
  });

  it('supports a custom label and a custom icon', () => {
    const { button } = setup({
      label: '回到顶部',
      icon: <span data-testid="custom-icon" aria-hidden="true" />,
    });

    expect(button).toHaveAccessibleName('回到顶部');
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeNull();
  });

  it('applies class names to the button, not the wrapper', () => {
    const { wrapper, button } = setup({
      scrollToTopButtonClassName: 'my-button',
      scrollToTopButtonIconClassName: 'my-icon',
    });

    expect(wrapper).toHaveClass('vsa-scroll-to-top');
    expect(wrapper).not.toHaveClass('my-button');
    expect(button).toHaveClass('vsa-scroll-to-top-button', 'my-button');
    expect(button.querySelector('svg')).toHaveClass('vsa-scroll-to-top-icon', 'my-icon');
  });

  it('uses the default button offset', () => {
    const { wrapper } = setup();

    expect(wrapper.style.transform).toBe(
      `translate(${DEFAULT_BUTTON_OFFSET.x}px, calc(-50% + ${DEFAULT_BUTTON_OFFSET.y}px))`,
    );
  });

  it('honours a custom button offset', () => {
    const { wrapper } = setup({ buttonOffset: { x: 8, y: -4 } });

    expect(wrapper.style.transform).toBe('translate(8px, calc(-50% + -4px))');
  });

  it('renders without a scroller and simply stays hidden', () => {
    const { wrapper } = setup({ scrollerRef: { current: null } });

    expect(wrapper).toHaveAttribute('data-visible', 'false');
  });

  it('detaches the scroll listener on unmount', async () => {
    const { wrapper, scroller, unmount } = setup();

    await scrollTo(scroller, 500);
    expect(wrapper).toHaveAttribute('data-visible', 'true');

    const removeEventListener = vi.spyOn(scroller, 'removeEventListener');
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
