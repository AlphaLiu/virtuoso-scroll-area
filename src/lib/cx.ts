/**
 * Minimal class name joiner.
 *
 * Replaces the `clsx` + `tailwind-merge` pair the component used inside its
 * original application, so this package has **zero runtime dependencies**.
 * Unlike `tailwind-merge` it does not resolve conflicting utility classes —
 * that is unnecessary here because the library ships plain CSS classes
 * (`vsa-*`) rather than utility classes.
 *
 * @example
 * cx('vsa-thumb', isActive && 'is-active', ['extra', { 'is-hidden': hidden }]);
 */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cx(...inputs: ClassValue[]): string {
  const parts: string[] = [];

  const walk = (value: ClassValue): void => {
    if (value === null || value === undefined || value === false || value === '') return;

    if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value === 'object') {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) parts.push(key);
      }
    }
  };

  for (const input of inputs) walk(input);

  return parts.join(' ');
}
