import { useEffect } from 'react';

import { injectStyles } from './styles';

/**
 * Belt-and-braces guarantee that the stylesheet is present.
 *
 * The stylesheet is already injected at module scope; this hook covers exotic setups where
 * the module-scope call was dropped (for example a bundler that strips side effects) or where
 * a component renders into a *different* document (iframes, portals into a new document).
 */
export function useInjectedStyles(): void {
  useEffect(() => {
    injectStyles();
  }, []);
}
