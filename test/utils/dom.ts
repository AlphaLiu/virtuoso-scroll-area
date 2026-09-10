/**
 * Testing helpers shared by the component tests.
 *
 * jsdom has no layout engine: every element reports `0` for `offsetHeight`, `scrollHeight` and
 * `clientHeight`, and it implements neither `ResizeObserver` nor element scrolling. The helpers
 * below make those measurable/controllable so the scrollbar geometry can be asserted.
 */

// -------------------------------------------------------------------------------------------------
// ResizeObserver
// -------------------------------------------------------------------------------------------------

type ResizeCallback = () => void;

const resizeObservers: Array<{ element: Element; callback: ResizeCallback }> = [];

function dropObservers(callback: ResizeCallback, element?: Element): void {
  for (let i = resizeObservers.length - 1; i >= 0; i--) {
    const entry = resizeObservers[i]!;
    if (entry.callback === callback && (!element || entry.element === element)) {
      resizeObservers.splice(i, 1);
    }
  }
}

class ControllableResizeObserver implements ResizeObserver {
  private readonly callback: ResizeCallback;

  constructor(callback: ResizeObserverCallback) {
    // The library only uses the "something changed" signal, so the entries are ignored.
    this.callback = () => callback([], this);
  }

  observe(element: Element): void {
    resizeObservers.push({ element, callback: this.callback });
  }

  unobserve(element: Element): void {
    dropObservers(this.callback, element);
  }

  disconnect(): void {
    dropObservers(this.callback);
  }
}

/** Installs the controllable ResizeObserver. Called once from `vitest.setup.ts`. */
export function installResizeObserverMock(): void {
  globalThis.ResizeObserver =
    ControllableResizeObserver as unknown as typeof ResizeObserver;
}

/** Fires every currently registered ResizeObserver callback (simulates a size change). */
export function triggerResizeObservers(): void {
  for (const observer of [...resizeObservers]) observer.callback();
}

/** Number of live ResizeObserver subscriptions (used to assert clean-up). */
export function resizeObserverCount(): number {
  return resizeObservers.length;
}

// -------------------------------------------------------------------------------------------------
// Element metrics
// -------------------------------------------------------------------------------------------------

export interface ElementMetrics {
  scrollHeight?: number;
  offsetHeight?: number;
  clientHeight?: number;
  scrollWidth?: number;
  offsetWidth?: number;
  clientWidth?: number;
}

const METRIC_KEYS: Array<keyof ElementMetrics> = [
  'scrollHeight',
  'offsetHeight',
  'clientHeight',
  'scrollWidth',
  'offsetWidth',
  'clientWidth',
];

const activeMetrics: ElementMetrics = {};
let metricsInstalled = false;

/**
 * Makes every element report the given metrics. Returns a restore function.
 *
 * Values stay mutable through {@link setElementMetrics}, which is how tests simulate content
 * growing or shrinking between renders.
 */
export function mockElementMetrics(metrics: ElementMetrics = {}): () => void {
  Object.assign(activeMetrics, metrics);

  const originals = new Map<string, PropertyDescriptor | undefined>();

  for (const key of METRIC_KEYS) {
    originals.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));

    if (!metricsInstalled) {
      Object.defineProperty(HTMLElement.prototype, key, {
        configurable: true,
        get: () => activeMetrics[key] ?? 0,
      });
    }
  }
  metricsInstalled = true;

  return () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, key, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
      }
    }
    metricsInstalled = false;
    for (const key of METRIC_KEYS) delete activeMetrics[key];
  };
}

/** Updates the metrics installed by {@link mockElementMetrics}. */
export function setElementMetrics(metrics: ElementMetrics): void {
  Object.assign(activeMetrics, metrics);
}

/** Sets `scrollTop` on a single element, which jsdom stores without scrolling. */
export function setScrollTop(element: Element, value: number): void {
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    writable: true,
    value,
  });
}

/** Reads the numeric value of a CSS custom property from an element's inline style. */
export function readCssVar(element: HTMLElement, name: string): string {
  return element.style.getPropertyValue(name).trim();
}

/** Flushes requestAnimationFrame callbacks (jsdom schedules them as ~16ms timers). */
export async function flushAnimationFrame(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 40));
}
