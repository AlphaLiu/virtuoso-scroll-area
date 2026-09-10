import { useEffect } from 'react';

import { injectStyles } from './styles';

/**
 * Belt-and-braces guarantee that the stylesheet is present.
 *
 * The stylesheet is already injected at module scope; this hook covers exotic setups where
 * the module-scope call was dropped (for example a bundler that strips side effects) or where
 * a component renders into a *different* document (iframes, portals into a new document).
 *
 * When `element` is rendered inside a Shadow DOM tree the stylesheet is also injected into that
 * shadow root, because `document.head` styles do not cascade into shadow trees.
 *
 * @param element Any element rendered by the component; used to discover its root node.
 */
export function useInjectedStyles(element?: Element | null): void {
  useEffect(() => {
    injectStyles();
    if (!element) return;

    // A different document (iframe / portal) needs its own copy …
    if (element.ownerDocument !== document) injectStyles(element.ownerDocument);

    // … and so does a shadow root, which document styles cannot reach.
    const root = element.getRootNode();
    if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot)
      injectStyles(root);
  }, [element]);
}
