import type { ReactNode } from 'react';

import { useMemo, useRef } from 'react';

import {
  ScrollArea,
  ScrollContextProvider,
  ScrollToTopButton,
  useScrollContext,
} from 'virtuo-scroll-area';
import { VirtuosoScrollArea } from 'virtuo-scroll-area/virtuoso';
import { VirtuosoGridScrollArea } from 'virtuo-scroll-area/virtuoso-grid';

import { createBooks, createRows } from './data';
import { ShadowDomDemo } from './shadow-dom-demo';

export default function App() {
  return (
    <ScrollContextProvider>
      <Showcase />
    </ScrollContextProvider>
  );
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <span className="step">{step}</span>
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Showcase() {
  const plainRows = useMemo(() => createRows(40), []);
  const listBooks = useMemo(() => createBooks(5000), []);
  const gridBooks = useMemo(() => createBooks(51), []);
  const standaloneRows = useMemo(() => createRows(30), []);

  const plainViewportRef = useRef<HTMLDivElement>(null);
  const standaloneViewportRef = useRef<HTMLDivElement>(null);
  const { getInstance } = useScrollContext();

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">virtuo-scroll-area</p>
        <h1>Overlay scrollbars for React</h1>
        <p className="lede">
          Zero configuration, zero runtime dependencies. The stylesheet is injected on
          first render, so importing a component is all it takes — no Tailwind, no CSS
          import, no provider required.
        </p>
        <pre className="snippet">bun add virtuo-scroll-area</pre>
      </header>

      <Section
        step={1}
        title="ScrollArea"
        description="Plain content, hover-revealed scrollbar, native scrollbar hidden. Scroll it, then use the buttons — they drive the viewport through viewportRef."
      >
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              plainViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }
          >
            scrollTo top
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              plainViewportRef.current?.scrollTo({
                top: plainViewportRef.current.scrollHeight,
                behavior: 'smooth',
              })
            }
          >
            scrollTo bottom
          </button>
        </div>
        <ScrollArea className="panel panel-sm" viewportRef={plainViewportRef}>
          <ul className="rows">
            {plainRows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </ScrollArea>
      </Section>

      <Section
        step={2}
        title="Theming with CSS variables"
        description="Every visual is a custom property on .vsa-scroll-area. These two areas override --vsa-* on a plain demo class — in a Tailwind app a utility class would win just as easily."
      >
        <div className="grid-2">
          <div>
            <p className="label">--vsa-scrollbar-width: 14px</p>
            <ScrollArea className="panel panel-sm theme-thick">
              <ul className="rows">
                {plainRows.slice(0, 12).map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
          <div>
            <p className="label">--vsa-thumb-background: lime</p>
            <ScrollArea className="panel panel-sm theme-lime">
              <ul className="rows">
                {plainRows.slice(0, 12).map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
      </Section>

      <Section
        step={3}
        title="VirtuosoScrollArea"
        description="5,000 rows virtualized by react-virtuoso (optional peer). The overlay scrollbar measures virtuoso's own scroller, and rows are styled with itemClassName."
      >
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => getInstance('demo-list')?.scrollToTop()}
          >
            getInstance('demo-list').scrollToTop()
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => getInstance('demo-list')?.scrollToBottom()}
          >
            getInstance('demo-list').scrollToBottom()
          </button>
        </div>
        <VirtuosoScrollArea
          className="panel"
          data={listBooks}
          scrollContextInstanceId="demo-list"
          itemClassName="book-row"
          itemContent={(_index, book) => (
            <>
              <span className="dot" style={{ background: `hsl(${book.hue} 70% 55%)` }} />
              <span className="book-title">{book.title}</span>
              <span className="muted small">{book.author}</span>
              <span className="badge">ch. {book.chapter}</span>
            </>
          )}
        />
      </Section>

      <Section
        step={4}
        title="VirtuosoGridScrollArea"
        description="A virtualized grid. gridClassName is plain CSS here; in a Tailwind app grid-cols-4 would override the single-column default because the library stylesheet lives in the base cascade layer."
      >
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => getInstance('demo-grid')?.scrollToTop()}
          >
            getInstance('demo-grid').scrollToTop()
          </button>
        </div>
        <VirtuosoGridScrollArea
          className="panel"
          totalCount={gridBooks.length}
          scrollContextInstanceId="demo-grid"
          gridClassName="demo-grid-4"
          computeItemKey={(index) => gridBooks[index]!.id}
          itemContent={(index) => {
            const book = gridBooks[index]!;
            return (
              <article className="card">
                <div className="cover" style={{ background: `hsl(${book.hue} 60% 22%)` }}>
                  {book.title.slice(0, 1)}
                </div>
                <h3>{book.title}</h3>
                <p className="muted small">{book.author}</p>
              </article>
            );
          }}
        />
      </Section>

      <Section
        step={5}
        title="ScrollToTopButton on any scroller"
        description="The floating button is exported on its own: point it at any scrollable element and it fades in past a threshold."
      >
        <div className="relative">
          <div className="panel panel-sm native-scroll" ref={standaloneViewportRef}>
            <ul className="rows">
              {standaloneRows.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          </div>
          <ScrollToTopButton
            scrollerRef={standaloneViewportRef}
            scrollToTop={() =>
              standaloneViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }
            threshold={60}
            label="Back to top"
          />
        </div>
      </Section>

      <Section
        step={6}
        title="Shadow DOM"
        description="Rendered through a portal into an open shadow root. The library injects its stylesheet into that root and, because the page simulates a document-level scroll lock that cancels every wheel event surfacing at the shadow host, handles the wheel itself. Toggle the lock to compare with wheelScroll='never'."
      >
        <ShadowDomDemo />
      </Section>

      <footer className="footer">
        <p>
          Entries: <code>virtuo-scroll-area</code>,{' '}
          <code>virtuo-scroll-area/virtuoso</code>,{' '}
          <code>virtuo-scroll-area/virtuoso-grid</code>
        </p>
        <p className="muted small">
          This page uses no Tailwind and imports no CSS — only the components.
        </p>
      </footer>
    </main>
  );
}
