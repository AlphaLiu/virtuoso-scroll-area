import type { ReactNode } from 'react';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ScrollArea } from 'virtuo-scroll-area';
import { VirtuosoScrollArea } from 'virtuo-scroll-area/virtuoso';

import { createBooks, createRows } from './data';

/**
 * Styles for the demo chrome *inside* the shadow root. The page's `demo.css` cannot reach in
 * there — and neither could the library's stylesheet, which is exactly what the library now
 * handles on its own.
 */
const SHADOW_CHROME_CSS = `
  :host { display: block; }
  .shadow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
  .shadow-panel {
    height: 220px;
    border: 1px solid #2a3140;
    border-radius: 14px;
    background: #121620;
    color: #cfd7e6;
    font: 14px/1.4 system-ui, sans-serif;
  }
  .shadow-label { margin: 0 0 8px; font: 12px/1.4 ui-monospace, monospace; color: #8b95a7; }
  .shadow-rows { margin: 0; padding: 0; list-style: none; }
  .shadow-rows li, .shadow-row {
    padding: 10px 16px;
    border-bottom: 1px solid rgb(255 255 255 / 0.04);
  }
`;

/** Renders `children` into an open shadow root attached to a host element. */
function ShadowHost({ children, testId }: { children: ReactNode; testId: string }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    if (!root.querySelector('style[data-demo-chrome]')) {
      const style = document.createElement('style');
      style.setAttribute('data-demo-chrome', '');
      style.textContent = SHADOW_CHROME_CSS;
      root.appendChild(style);
    }
    setShadowRoot(root);
  }, [host]);

  return (
    <div ref={setHost} data-testid={testId}>
      {shadowRoot ? createPortal(children, shadowRoot) : null}
    </div>
  );
}

/**
 * Emulates what body-scroll-lock libraries (e.g. `react-remove-scroll`) do: a non-passive
 * capture listener on `document` that cancels every wheel event it cannot attribute to a
 * light-DOM scroller it knows about. Events from a shadow tree are retargeted to the host, so
 * they are always "foreign" and get cancelled. To keep the rest of this page usable, the demo
 * lock only cancels events that surface at the shadow host.
 */
function useSimulatedScrollLock(enabled: boolean, hostSelector: string) {
  useEffect(() => {
    if (!enabled) return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(hostSelector)) event.preventDefault();
    };

    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [enabled, hostSelector]);
}

export function ShadowDomDemo() {
  const rows = useMemo(() => createRows(30), []);
  const books = useMemo(() => createBooks(2000), []);
  const [lock, setLock] = useState(true);

  useSimulatedScrollLock(lock, '[data-testid="shadow-host"]');

  return (
    <>
      <div className="actions">
        <label
          className="btn"
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
        >
          <input
            type="checkbox"
            checked={lock}
            onChange={(event) => setLock(event.target.checked)}
            data-testid="shadow-lock-toggle"
          />
          simulate a document-level scroll lock
        </label>
      </div>

      <ShadowHost testId="shadow-host">
        <div className="shadow-grid">
          <div>
            <p className="shadow-label">wheelScroll="auto" (default) — scrolls</p>
            <ScrollArea className="shadow-panel" data-testid="shadow-auto">
              <ul className="shadow-rows">
                {rows.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
          <div>
            <p className="shadow-label">wheelScroll="never" — blocked while locked</p>
            <ScrollArea
              className="shadow-panel"
              wheelScroll="never"
              data-testid="shadow-never"
            >
              <ul className="shadow-rows">
                {rows.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
        <p className="shadow-label" style={{ marginTop: 20 }}>
          VirtuosoScrollArea, 2,000 rows, inside the same shadow root
        </p>
        <div data-testid="shadow-virtuoso">
          <VirtuosoScrollArea
            className="shadow-panel"
            data={books}
            itemClassName="shadow-row"
            itemContent={(_index, book) => (
              <>
                <span>{book.title}</span>{' '}
                <span style={{ color: '#8b95a7' }}>{book.author}</span>
              </>
            )}
          />
        </div>
      </ShadowHost>
    </>
  );
}
