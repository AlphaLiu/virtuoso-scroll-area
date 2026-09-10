import css from './styles.css';

/**
 * `id` of the `<style>` element the library injects.
 * Useful for opting out (remove the element) or for asserting injection in tests.
 */
export const STYLE_ELEMENT_ID = 'virtuo-scroll-area-styles';

/** The complete stylesheet shipped with this package, as a string. */
export const styles: string = css;

/**
 * Injects the stylesheet into `document.head` once.
 *
 * The library calls this automatically from every entry point (module scope, plus a
 * `useEffect` fallback on first render), so consumers never have to import CSS by hand.
 * Calling it repeatedly is a no-op — injection is keyed to {@link STYLE_ELEMENT_ID}.
 *
 * It is safe to call during SSR: without a document it does nothing. If you prefer a plain
 * `<link>`/bundler-managed stylesheet, import `virtuo-scroll-area/styles.css` instead and
 * remove the injected element.
 *
 * @param target Document to inject into. Defaults to the global `document`.
 */
export function injectStyles(target?: Document | null): void {
  const doc = target ?? (typeof document === 'undefined' ? null : document);
  if (!doc || doc.getElementById(STYLE_ELEMENT_ID)) return;

  const element = doc.createElement('style');
  element.id = STYLE_ELEMENT_ID;
  element.setAttribute('data-vsa-styles', '');
  element.textContent = styles;
  doc.head.appendChild(element);
}

// Inject as early as possible in the browser to avoid a flash of unstyled scrollbar.
if (typeof document !== 'undefined') injectStyles();
