# virtuo-scroll-area

Overlay scrollbars for React: a hover-revealed custom scrollbar, a floating back-to-top button, a
scroll-context API, and optional virtualized list/grid wrappers around
[react-virtuoso](https://virtuoso.dev/).

- **Zero configuration** — the stylesheet is injected on first render. No CSS import, no Tailwind,
  no provider, no build-tool plugin.
- **Zero runtime dependencies** — `react` and `react-dom` are peers; `react-virtuoso` is an
  _optional_ peer that only the virtualized entry points need.
- **Themeable by design** — every visual is a `--vsa-*` custom property, and the defaults sit in
  the `base` cascade layer so your own CSS (including Tailwind utilities) always wins.
- **Shadow DOM ready** — inside a shadow root (userscripts, extensions, web components) the
  stylesheet is injected into that root and wheel scrolling keeps working even when the host page
  locks body scrolling. No wrapper, no extra hook.
- **Typed and tested** — ESM + `.d.ts` for all three entry points, 114 unit tests, and a
  demo app that is verified in a real browser.

```tsx
import { ScrollArea } from 'virtuo-scroll-area';

<ScrollArea className="h-64 w-80 rounded-xl border">
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</ScrollArea>;
```

That is the whole setup.

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Components](#components)
  - [ScrollArea](#scrollarea)
  - [ScrollToTopButton](#scrolltotopbutton)
  - [Scroll context](#scroll-context)
- [Virtualized components](#virtualized-components)
  - [VirtuosoScrollArea](#virtuoscrollarea)
  - [VirtuosoGridScrollArea](#virtuosogridscrollarea)
- [Theming](#theming)
- [Styling and overriding](#styling-and-overriding)
- [Shadow DOM](#shadow-dom)
- [SSR, CSP and Next.js](#ssr-csp-and-nextjs)
- [Low-level API](#low-level-api)
- [Examples](#examples)
- [Development](#development)
- [Browser support](#browser-support)
- [Migrating from an in-app copy](#migrating-from-an-in-app-copy)
- [License](#license)

---

## Install

```bash
bun add virtuo-scroll-area
# npm install virtuo-scroll-area
# pnpm add virtuo-scroll-area
```

```bash
# only for the /virtuoso and /virtuoso-grid entry points
bun add react-virtuoso
```

Requirements: **React 18 or 19** and a bundler. Nothing else.

## Quick start

```tsx
import { ScrollArea, ScrollToTopButton, ScrollContextProvider } from 'virtuo-scroll-area';

export function Panel() {
  const viewportRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContextProvider>
      <div className="relative">
        <ScrollArea
          viewportRef={viewportRef}
          className="h-72 rounded-xl border"
          viewportClassName="p-4"
        >
          {content}
        </ScrollArea>

        <ScrollToTopButton
          scrollerRef={viewportRef}
          scrollToTop={() =>
            viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
        />
      </div>
    </ScrollContextProvider>
  );
}
```

## Components

### ScrollArea

A scroll container whose native scrollbar is hidden and replaced by a custom rail that fades in
while the pointer is inside the area or while the content is scrolling.

```tsx
<ScrollArea
  className="h-64 rounded-xl border"
  viewportClassName="p-4"
  scrollbarClassName="my-rail"
  scrollbarThumbClassName="my-thumb"
  scrollHideDelay={600}
>
  {children}
</ScrollArea>
```

| Prop                      | Type                             | Default | Description                                                                        |
| ------------------------- | -------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `viewportClassName`       | `string`                         | —       | Class name for the inner scrolling element. Padding here scrolls with the content. |
| `viewportRef`             | `Ref<HTMLDivElement>`            | —       | The element that actually scrolls. Use it for imperative scrolling.                |
| `scrollbarClassName`      | `string`                         | —       | Class name for the scrollbar rail.                                                 |
| `scrollbarThumbClassName` | `string`                         | —       | Class name for the thumb.                                                          |
| `scrollHideDelay`         | `number`                         | `600`   | Delay in ms before the rail fades out.                                             |
| `wheelScroll`             | `'auto' \| 'always' \| 'never'`  | `auto`  | Manual wheel handling — see [Shadow DOM](#shadow-dom).                             |
| `className`               | `string`                         | —       | Class name for the outer container. Give it a height — the component does not.     |
| `children`                | `ReactNode`                      | —       | Scrollable content.                                                                |
| …rest                     | `HTMLAttributes<HTMLDivElement>` | —       | Forwarded to the outer container (`data-*`, `aria-*`, `style`, …).                 |

The forwarded `ref` is the **outer container**; use `viewportRef` to scroll. The scrollbar only
shows a thumb when there is actually something to scroll, and geometry is re-measured when the
content resizes (lazy loading, collapsing sections, filtering).

### ScrollToTopButton

A floating button that appears once the observed scroller is scrolled past `threshold`. Rendered
automatically by the virtualized components; use it directly for any scrollable element.

```tsx
<ScrollToTopButton
  scrollerRef={viewportRef}
  scrollToTop={() => viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
  threshold={200}
  label="Back to top"
  buttonOffset={{ x: -16, y: -8 }}
/>
```

| Prop                             | Type                                | Default            | Description                                                   |
| -------------------------------- | ----------------------------------- | ------------------ | ------------------------------------------------------------- |
| `scrollerRef`                    | `RefObject<HTMLDivElement \| null>` | — (required)       | Element whose `scrollTop` is observed.                        |
| `scrollToTop`                    | `() => void`                        | — (required)       | Called when the button is activated.                          |
| `threshold`                      | `number`                            | `100`              | Scroll distance in px after which the button appears.         |
| `label`                          | `string`                            | `"Scroll to top"`  | Screen-reader label.                                          |
| `icon`                           | `ReactNode`                         | chevron SVG        | Replaces the default icon.                                    |
| `buttonOffset`                   | `{ x?: number; y?: number }`        | `{ x: -12, y: 0 }` | Pixel offset from the right edge / vertical centre.           |
| `scrollToTopButtonClassName`     | `string`                            | —                  | Extra class names for the `<button>`.                         |
| `scrollToTopButtonIconClassName` | `string`                            | —                  | Extra class names for the default icon (ignored with `icon`). |

Exports `DEFAULT_BUTTON_OFFSET` and `DEFAULT_SCROLL_THRESHOLD` if you need the defaults.

### Scroll context

`ScrollContextProvider` publishes smooth `scrollToTop` / `scrollToBottom` helpers for the nearest
scroll area, plus a registry for driving several areas by id.

```tsx
import {
  ScrollContextProvider,
  useScrollContext,
  useScrollToTop,
  useScrollToBottom,
} from 'virtuo-scroll-area';

<ScrollContextProvider>
  <Toolbar />
  <ScrollArea>{content}</ScrollArea>
  <VirtuosoGridScrollArea totalCount={51} scrollContextInstanceId="themes" … />
</ScrollContextProvider>;

function Toolbar() {
  const { getInstance } = useScrollContext();
  const scrollToTop = useScrollToTop();      // the nearest registered area
  const scrollToBottom = useScrollToBottom();

  return (
    <>
      <button onClick={scrollToTop}>Top</button>
      <button onClick={() => getInstance('themes')?.scrollToTop()}>Themes to top</button>
    </>
  );
}
```

| Export                                     | Description                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ScrollContextProvider`                    | Provides the context. Optional — every hook is safe to call without it.                                                             |
| `ScrollContextProvider` prop `instanceId`  | Registers this provider's area under a stable id.                                                                                   |
| `useScrollContext()`                       | The full context: `scrollToTop`, `scrollToBottom`, `setScrollAreaElement`, `registerInstance`, `unregisterInstance`, `getInstance`. |
| `useScrollToTop()` / `useScrollToBottom()` | Convenience wrappers for the nearest registered area.                                                                               |
| `ScrollAreaInstance` / `ScrollContextType` | Types for custom instances.                                                                                                         |

Both `ScrollArea` and the virtualized components register their scrolling element with the nearest
provider, so `useScrollToTop()` works for plain areas as well.

## Virtualized components

Both entries require the optional peer dependency `react-virtuoso`:

```tsx
import { VirtuosoScrollArea } from 'virtuo-scroll-area/virtuoso';
import { VirtuosoGridScrollArea } from 'virtuo-scroll-area/virtuoso-grid';
```

### VirtuosoScrollArea

```tsx
<VirtuosoScrollArea
  className="h-[60vh] rounded-xl border"
  data={books}
  itemClassName="px-4 py-2"
  scrollContextInstanceId="book-list"
  itemContent={(_index, book) => <BookRow book={book} />}
/>
```

| Prop                                             | Type                                    | Default            | Description                                             |
| ------------------------------------------------ | --------------------------------------- | ------------------ | ------------------------------------------------------- |
| `data`                                           | `T[]`                                   | — (required)       | Items to render.                                        |
| `itemContent`                                    | `(index: number, item: T) => ReactNode` | — (required)       | Row renderer.                                           |
| `itemClassName`                                  | `string`                                | —                  | Class name applied to every row.                        |
| `overscan`                                       | `number`                                | `200`              | Rows rendered beyond the viewport.                      |
| `increaseViewportBy`                             | `number`                                | `200`              | Extra pixels rendered above/below the viewport.         |
| `showScrollToTopButton`                          | `boolean`                               | `true`             | Set to `false` to render your own affordance.           |
| `scrollToTopButtonClassName`                     | `string`                                | —                  | Class name for the scroll-to-top `<button>`.            |
| `scrollToTopButtonIconClassName`                 | `string`                                | —                  | Class name for the scroll-to-top icon.                  |
| `buttonOffset`                                   | `{ x?: number; y?: number }`            | `{ x: -12, y: 0 }` | Scroll-to-top button offset.                            |
| `scrollContextInstanceId`                        | `string`                                | —                  | Registers the area in the scroll context under this id. |
| `scrollbarClassName` / `scrollbarThumbClassName` | `string`                                | —                  | Forwarded to the overlay scrollbar.                     |
| `scrollHideDelay`                                | `number`                                | `600`              | Rail fade-out delay in ms.                              |
| `wheelScroll`                                    | `'auto' \| 'always' \| 'never'`         | `auto`             | Manual wheel handling — see [Shadow DOM](#shadow-dom).  |
| `className`                                      | `string`                                | —                  | Class name for the outer container (give it a height).  |

Handle (`ref`): `{ scrollToIndex(index, behavior?: 'auto' | 'smooth'), scrollToTop() }`.

### VirtuosoGridScrollArea

```tsx
<VirtuosoGridScrollArea
  className="h-[60vh] rounded-xl border"
  totalCount={books.length}
  gridClassName="grid-cols-2 gap-3 md:grid-cols-4"
  computeItemKey={(index) => books[index].id}
  itemContent={(index) => <BookCard book={books[index]} />}
/>
```

Props are the list props plus `totalCount`, `gridClassName`, `computeItemKey` and
`onRangeChanged`, and with grid-shaped virtualization defaults
(`overscan={{ main: 200, reverse: 200 }}`, `increaseViewportBy={{ top: 200, bottom: 200 }}`).
Handle (`ref`): `{ scrollToIndex(index, behavior?), scrollToTop() }`.

The grid element carries `.vsa-grid-list`, whose default is a single column with 16 px gaps.
Override it with `gridClassName` — Tailwind's `grid-cols-4 gap-3` works, and so does plain CSS:

```css
.my-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
```

Two react-virtuoso quirks are handled for you: the extra space at the bottom of a grid is
compensated, and a 1 px layout nudge is applied after a dialog/panel entrance animation so the
column count is recomputed from the real viewport width.

## Theming

Override the custom properties anywhere above the component — on a wrapper class, or inline:

```css
.my-panel {
  --vsa-scrollbar-width: 14px;
  --vsa-thumb-background: rgb(0 0 0 / 0.25);
  --vsa-thumb-background-hover: rgb(0 0 0 / 0.45);
  --vsa-scroll-to-top-background: #111827;
}
```

| Variable                               | Default                          |
| -------------------------------------- | -------------------------------- |
| `--vsa-scrollbar-width`                | `10px`                           |
| `--vsa-scrollbar-padding`              | `1px`                            |
| `--vsa-scrollbar-z-index`              | `50`                             |
| `--vsa-scrollbar-transition-duration`  | `200ms`                          |
| `--vsa-thumb-background`               | `rgb(115 115 115 / 0.42)`        |
| `--vsa-thumb-background-hover`         | `rgb(115 115 115 / 0.62)`        |
| `--vsa-thumb-radius`                   | `9999px`                         |
| `--vsa-thumb-transition-duration`      | `150ms`                          |
| `--vsa-thumb-height`                   | set by the component (read-only) |
| `--vsa-scroll-to-top-size`             | `40px`                           |
| `--vsa-scroll-to-top-icon-size`        | `20px`                           |
| `--vsa-scroll-to-top-background`       | `#2563eb`                        |
| `--vsa-scroll-to-top-background-hover` | `#1d4ed8`                        |
| `--vsa-scroll-to-top-foreground`       | `#ffffff`                        |
| `--vsa-scroll-to-top-shadow`           | soft `0 10px 15px -3px` shadow   |
| `--vsa-scroll-to-top-z-index`          | `50`                             |

Dark mode: the defaults switch automatically under `prefers-color-scheme: dark` and under a
`.dark` ancestor (the shadcn/ui convention).

**shadcn/ui tokens** — map them once so both systems agree:

```css
.vsa-scroll-area {
  --vsa-thumb-background: color-mix(in oklab, var(--muted-foreground) 30%, transparent);
  --vsa-thumb-background-hover: color-mix(
    in oklab,
    var(--muted-foreground) 50%,
    transparent
  );
  --vsa-scroll-to-top-background: var(--primary);
  --vsa-scroll-to-top-background-hover: var(--primary);
  --vsa-scroll-to-top-foreground: var(--primary-foreground);
}
```

## Styling and overriding

The stylesheet is wrapped in `@layer base`. That choice matters:

- In a **Tailwind** app, Tailwind's `components` and `utilities` layers beat `base`, so
  `className="bg-red-500"` or `grid-cols-4` overrides the library without `!important` and without
  specificity games. The library still beats Preflight, which is emitted earlier in the same layer.
- In a **plain-CSS** app your unlayered rules always beat the library's layered ones.

Class names you can target:

| Class                                                                                      | Element                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `.vsa-scroll-area`                                                                         | Outer container (also holds the variables)  |
| `.vsa-scroll-area-layout`                                                                  | Flex layout modifier used by `ScrollArea`   |
| `.vsa-viewport`                                                                            | Scrolling element (native scrollbar hidden) |
| `.vsa-content`                                                                             | Content wrapper inside the viewport         |
| `.vsa-scrollbar`, `.vsa-thumb`                                                             | Rail and thumb                              |
| `.vsa-scroll-to-top`                                                                       | Button wrapper (`data-visible="true         | false"`) |
| `.vsa-scroll-to-top-button`                                                                | The `<button>` itself                       |
| `.vsa-scroll-to-top-icon`                                                                  | Default chevron                             |
| `.vsa-sr-only`                                                                             | Screen-reader-only text                     |
| `.vsa-virtualized-area`, `.vsa-virtualized-scroll-area`, `.vsa-scroller`, `.vsa-grid-list` | Virtualized layout                          |

## Shadow DOM

Rendering into a shadow root — userscripts, browser extensions, web components — used to need
two workarounds. Both are built in now:

- **Styles.** Document-level stylesheets do not cascade into a shadow tree, so every component
  also injects the stylesheet into the shadow root it is rendered in (once per root, as a
  `<style data-vsa-styles>` element appended to the root). If you already place the sheet there
  yourself — `<style data-vsa-styles>{styles}</style>` — the library detects it and does nothing.
  `injectStyles(shadowRoot)` is exported for manual control.
- **Wheel scrolling.** Host pages and body-scroll-lock libraries (Radix Dialog's
  `react-remove-scroll`, `body-scroll-lock`, …) listen for `wheel` on `document` and
  `preventDefault()` any event they cannot attribute to a scroller they know. Events coming out of
  a shadow tree are retargeted to the shadow host, so they always look foreign and get cancelled —
  the list never scrolls. Inside a shadow root the components therefore handle the wheel
  themselves: a capture-phase, non-passive listener on the viewport consumes the event and writes
  `scrollTop` once per frame.

The manual wheel handling behaves like the browser's own:

- Scroll chaining is preserved — when the viewport cannot move further in the wheel direction,
  the event is left alone and the ancestors (or the host page) scroll instead.
- Gestures are latched — a trackpad flick that started in the viewport keeps scrolling it, even
  after it reached the boundary, until the events pause for `WHEEL_LATCH_MS` (150 ms). So inertia
  never spills over to the page underneath.
- Pinch-zoom (`ctrlKey`) and pure horizontal wheel events are never intercepted.
- `deltaMode` is normalised (Firefox's line mode counts 16 px per line; page mode uses the
  viewport height).

Control it with the `wheelScroll` prop, available on `ScrollArea`, `VirtuosoScrollArea` and
`VirtuosoGridScrollArea`:

| Value              | Behaviour                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `'auto'` (default) | Manual handling only when the viewport is inside a `ShadowRoot`; native scrolling otherwise. |
| `'always'`         | Manual handling everywhere — for light-DOM areas that sit under a body-scroll-lock.          |
| `'never'`          | Leave the wheel to the browser.                                                              |

For custom layouts built from the primitives, `useWheelScroll(viewport, mode)` and
`isInShadowRoot(node)` are exported from the main entry.

## SSR, CSP and Next.js

- Every entry point starts with `"use client"`, so the components can be imported from the App
  Router directly.
- `injectStyles()` is a no-op without a `document`, and the components also re-check on mount, so
  server rendering is safe.
- Under a strict `style-src` CSP, import the published stylesheet instead of relying on injection:

  ```ts
  import 'virtuo-scroll-area/styles.css';
  ```

  Injection is idempotent and keyed to `#virtuo-scroll-area-styles`, so importing the file as well
  is harmless. `injectStyles`, `styles`, `STYLE_ELEMENT_ID` and `STYLE_ELEMENT_ATTRIBUTE` are
  exported for advanced setups.

## Low-level API

Exported from the main entry for building custom scrolling layouts:

- Components: `ScrollAreaScrollbar`, `ScrollAreaScrollbarImpl`, `ScrollAreaThumb`, `Scroller`.
- Contexts and hooks: `ScrollAreaContext`, `useScrollAreaContext`, `ScrollbarContext`,
  `useScrollbarContext`.
- Geometry: `toInt`, `getThumbRatio`, `getThumbSize`, `getThumbOffsetFromScroll`,
  `getScrollPositionFromPointer`, `linearScale`, `isScrollingWithinScrollbarBounds`,
  `addUnlinkedScrollListener`, `THUMB_MIN_SIZE`.
- DOM/React helpers: `useCallbackRef`, `useDebounceCallback`, `useResizeObserver`,
  `useIsomorphicLayoutEffect`, `useInjectedStyles`, `cx`.
- Shadow DOM / wheel: `useWheelScroll`, `isInShadowRoot`, `WHEEL_LATCH_MS`, `WheelScrollMode`.
- Styles: `injectStyles`, `styles`, `STYLE_ELEMENT_ID`, `STYLE_ELEMENT_ATTRIBUTE`,
  `generateScrollStyle` _(deprecated)_.

## Examples

```bash
bun run demo             # build, then serve examples/vite-demo on :5199
bun run demo:build       # production build of the demo
bun run demo:standalone  # single self-contained HTML file, no server needed
```

`examples/vite-demo` is a full showcase — plain scroll areas, CSS-variable theming, a 5,000-row
virtualized list, a 51-cell virtualized grid and a standalone scroll-to-top button. It uses **no
Tailwind and imports no CSS**, which is the point: only the components are imported. See
[examples/vite-demo/README.md](./examples/vite-demo/README.md) for what each section demonstrates.

## Development

```bash
bun install
bun run typecheck     # tsc --noEmit
bun run test          # vitest (114 tests)
bun run coverage      # v8 coverage report
bun run build         # tsup → dist (ESM + .d.ts)
bun run verify:pack   # packs the tarball, installs it, imports it by name
bun run verify        # typecheck + test + build + verify:pack
bun run format        # prettier
```

Notes for contributors:

- Types are generated by tsup's declaration builder, which does not support TypeScript 7 yet, so
  TypeScript is pinned to the 6.x line and `ignoreDeprecations` is set in `tsconfig.json`.
- Do **not** enable tsup's `treeshake` option or force `splitting: true`: both route output through
  a rollup step that drops the `"use client"` banner.
- `src/styles.ts` imports the stylesheet as text (esbuild `text` loader). Vitest replaces CSS module
  content, so `vitest.config.ts` resolves that one specifier to `test/fixtures/stylesheet.ts`.
- The virtualized components are tested against a mock of `react-virtuoso`
  (`test/mocks/react-virtuoso.tsx`); the real integration is covered by the demo.
- If you link the package out-of-tree, add `resolve.dedupe: ['react', 'react-dom']` to the
  consumer's Vite config, or two React copies will be bundled.

## Browser support

Modern evergreen browsers. The stylesheet uses cascade layers, `rgb(r g b / a)` colour syntax and
`scale`/`translate` transitions, and the code uses `ResizeObserver` and `requestAnimationFrame`.

## Migrating from an in-app copy

See [MIGRATION.md](./MIGRATION.md) for the import-path table, the renamed CSS variable, the styling
differences and the new capabilities.

## License

[MIT](./LICENSE) © Alpha Liu
