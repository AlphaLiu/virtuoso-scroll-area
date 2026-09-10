/**
 * Scrollbar geometry — pure functions mapping between the viewport's scroll position and the
 * thumb's size/offset on the track. Based on the Radix ScrollArea maths.
 *
 * All values are pixels.
 */

/** Measurements the thumb geometry is derived from. */
export interface Sizes {
  /** Total scrollable content height (`scrollHeight`). */
  content: number;
  /** Visible viewport height (`offsetHeight`). */
  viewport: number;
  scrollbar: {
    /** Scrollbar track height (`clientHeight`). */
    size: number;
    paddingStart: number;
    paddingEnd: number;
  };
}

/** Smallest thumb length in pixels, so the thumb never becomes a useless sliver. */
export const THUMB_MIN_SIZE = 18;

/** Zero geometry, used before the first measurement. */
export const EMPTY_SIZES: Sizes = {
  content: 0,
  viewport: 0,
  scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
};

/** Parses a CSS length such as `"4px"` into a number, defaulting to 0. */
export function toInt(value?: string): number {
  return value ? Number.parseInt(value, 10) : 0;
}

/** Track length available to the thumb: scrollbar size minus its paddings. */
function getTrackSize(sizes: Sizes): number {
  return sizes.scrollbar.size - sizes.scrollbar.paddingStart - sizes.scrollbar.paddingEnd;
}

/** Visible fraction of the content: `viewport / content`. `0` when content is 0. */
export function getThumbRatio(viewportSize: number, contentSize: number): number {
  const ratio = viewportSize / contentSize;
  return Number.isNaN(ratio) ? 0 : ratio;
}

/** Length of the thumb in pixels, clamped to {@link THUMB_MIN_SIZE}. */
export function getThumbSize(sizes: Sizes, minSize: number = THUMB_MIN_SIZE): number {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  return Math.max(getTrackSize(sizes) * ratio, minSize);
}

/** Builds a linear interpolation function from one numeric range to another. */
export function linearScale(
  input: readonly [number, number],
  output: readonly [number, number],
): (value: number) => number {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}

/**
 * Converts a pointer position on the scrollbar into a `scrollTop` value.
 *
 * @param pointerPos Pointer offset from the top of the scrollbar.
 * @param pointerOffset Where inside the thumb the drag started (`0` centres the thumb under
 * the pointer, e.g. when clicking the track).
 */
export function getScrollPositionFromPointer(
  pointerPos: number,
  pointerOffset: number,
  sizes: Sizes,
): number {
  const thumbSize = getThumbSize(sizes);
  const offsetInThumb = pointerOffset || thumbSize / 2;
  const minPointerPos = sizes.scrollbar.paddingStart + offsetInThumb;
  const maxPointerPos =
    sizes.scrollbar.size - sizes.scrollbar.paddingEnd - (thumbSize - offsetInThumb);
  const maxScrollPos = sizes.content - sizes.viewport;
  return linearScale([minPointerPos, maxPointerPos], [0, maxScrollPos])(pointerPos);
}

/** Converts a `scrollTop` value into the thumb's translate offset in pixels. */
export function getThumbOffsetFromScroll(scrollPos: number, sizes: Sizes): number {
  const maxScrollPos = sizes.content - sizes.viewport;
  const maxThumbPos = getTrackSize(sizes) - getThumbSize(sizes);
  // Momentum scrolling can overshoot the range: clamp so the thumb never leaves the track.
  const clampedScrollPos = Math.max(0, Math.min(scrollPos, maxScrollPos));
  return linearScale([0, maxScrollPos], [0, maxThumbPos])(clampedScrollPos);
}

/** `true` while the scroll position is strictly inside the scrollable range. */
export function isScrollingWithinScrollbarBounds(
  scrollPos: number,
  maxScrollPos: number,
): boolean {
  return scrollPos > 0 && scrollPos < maxScrollPos;
}

/**
 * Calls `handler` on every vertical scroll of `node`, including scrolls that do not fire a
 * `scroll` event (momentum scrolling inside some embedded webviews). Returns a cleanup function.
 */
export function addUnlinkedScrollListener(
  node: HTMLElement,
  handler: () => void = () => {},
): () => void {
  let previousTop = node.scrollTop;
  let frame = 0;

  const loop = () => {
    const top = node.scrollTop;
    if (top !== previousTop) handler();
    previousTop = top;
    frame = window.requestAnimationFrame(loop);
  };
  loop();

  return () => window.cancelAnimationFrame(frame);
}
