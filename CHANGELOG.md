# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-09-10

First release, extracted from the `scroll-area` component of an in-house Tauri/React app and
made standalone.

### Added

- `ScrollArea` — overlay-scrollbar scroll container with hover reveal and content-change
  re-measurement.
- `ScrollToTopButton` — floating back-to-top button with configurable threshold, label, icon and
  offset.
- `ScrollContextProvider`, `useScrollContext`, `useScrollToTop`, `useScrollToBottom` and a
  named-instance registry (`registerInstance` / `unregisterInstance` / `getInstance`).
- `virtuo-scroll-area/virtuoso` — `VirtuosoScrollArea`, a virtualized list with the overlay
  scrollbar and scroll-to-top button (`react-virtuoso` is an optional peer dependency).
- `virtuo-scroll-area/virtuoso-grid` — `VirtuosoGridScrollArea`, the virtualized grid variant,
  including the entrance-animation layout nudge and the grid padding compensation.
- Low-level building blocks exported for custom layouts: `ScrollAreaScrollbar`,
  `ScrollAreaScrollbarImpl`, `ScrollAreaThumb`, `ScrollAreaContext`, `ScrollbarContext`,
  `Scroller`, the geometry helpers (`getThumbSize`, `getThumbOffsetFromScroll`,
  `getScrollPositionFromPointer`, …) and the `THUMB_MIN_SIZE` constant.
- Zero-config styling: `vsa-*` classes plus a stylesheet that is injected on first render and
  themable through `--vsa-*` custom properties. A copy is also published as
  `virtuo-scroll-area/styles.css` for strict-CSP setups.
- Dual ESM/CJS output with bundled type declarations for the three entry points.
- 94 unit tests (Vitest + Testing Library), a Vite demo app and a single-file demo bundle.

### Changed relative to the in-app original

- The `@/lib/utils` `cn` helper was replaced by an internal `cx` (dropping `clsx` and
  `tailwind-merge`, so the package has **no runtime dependencies**).
- Tailwind utility classes and design tokens (`bg-primary`, `bg-muted-foreground/30`,
  `shadow-ink-lg`, `scrollbar-none`) were replaced by the shipped stylesheet, so the components
  render correctly without Tailwind.
- The shadcn `Button` and `lucide-react`'s `ChevronUp` were replaced by a plain `<button>` and an
  inline SVG.
- `--radix-scroll-area-thumb-height` was renamed to `--vsa-thumb-height`.
- `ScrollToTopButton` gained `label`, `threshold` and `icon` props; `ScrollArea` gained
  `viewportRef` and now registers its viewport with a surrounding `ScrollContextProvider`.
- `ScrollArea` no longer wraps its container in a flex layout (`vsa-scroll-area-layout` carries
  that), so the virtualized containers can share the same root class.
- `generateScrollStyle()` is deprecated: the virtuoso rules ship with the stylesheet.

See [MIGRATION.md](./MIGRATION.md) for a step-by-step switch-over.
