import type { Ref, RefCallback } from 'react';

import { useCallback } from 'react';

/**
 * Writable ref shape (React 18's `MutableRefObject`, React 19's `RefObject` and a plain
 * `useRef` result are all assignable to it).
 */
export interface MutableRef<T> {
  current: T;
}

/** Writes `value` into a callback ref or an object ref. Ignores `null`/`undefined` refs. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    (ref as MutableRef<T | null>).current = value;
  }
}

/**
 * Merges several refs into one callback ref, so a single DOM node can be exposed to the parent
 * (`forwardRef`) and tracked locally at the same time.
 *
 * Pass the same number of refs on every render — they are the memoization dependencies.
 */
export function useComposedRef<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      for (const ref of refs) assignRef(ref, node);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the refs *are* the dependencies.
    refs,
  );
}
