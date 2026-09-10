import css from './styles.css';

/**
 * `id` of the `<style>` element the library injects.
 * Useful for opting out (remove the element) or for asserting injection in tests.
 */
export const STYLE_ELEMENT_ID = 'virtuo-scroll-area-styles';

/** The complete stylesheet shipped with this package, as a string. */
export const styles: string = css;

/** Attribute carried by every `<style>` element the library injects (document or shadow root). */
export const STYLE_ELEMENT_ATTRIBUTE = 'data-vsa-styles';

function isShadowRoot(target: Document | ShadowRoot): target is ShadowRoot {
  return typeof ShadowRoot !== 'undefined' && target instanceof ShadowRoot;
}

/**
 * Injects the stylesheet into `document.head` — or into a `ShadowRoot` — once.
 *
 * The library calls this automatically from every entry point (module scope, plus a
 * `useEffect` fallback on first render), so consumers never have to import CSS by hand.
 * Components rendered inside a Shadow DOM tree also inject the stylesheet into their shadow
 * root, because document-level styles do not cascade into shadow trees.
 * Calling it repeatedly is a no-op — injection is keyed to {@link STYLE_ELEMENT_ID} in a
 * document and to a `<style data-vsa-styles>` child in a shadow root.
 *
 * It is safe to call during SSR: without a document it does nothing. If you prefer a plain
 * `<link>`/bundler-managed stylesheet, import `virtuo-scroll-area/styles.css` instead and
 * remove the injected element.
 *
 * @param target Document or shadow root to inject into. Defaults to the global `document`.
 */
export function injectStyles(target?: Document | ShadowRoot | null): void {
  const root = target ?? (typeof document === 'undefined' ? null : document);
  if (!root) return;

  if (isShadowRoot(root)) {
    // Anywhere in the shadow tree counts: a consumer may already place the sheet in there.
    if (root.querySelector(`style[${STYLE_ELEMENT_ATTRIBUTE}]`)) return;

    const element = root.ownerDocument.createElement('style');
    element.setAttribute(STYLE_ELEMENT_ATTRIBUTE, '');
    element.textContent = styles;
    root.appendChild(element);
    return;
  }

  if (root.getElementById(STYLE_ELEMENT_ID)) return;

  const element = root.createElement('style');
  element.id = STYLE_ELEMENT_ID;
  element.setAttribute(STYLE_ELEMENT_ATTRIBUTE, '');
  element.textContent = styles;
  root.head.appendChild(element);
}

// Inject as early as possible in the browser to avoid a flash of unstyled scrollbar.
if (typeof document !== 'undefined') injectStyles();
