# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-09-11

### Changed

- **BREAKING: the package is now ESM-only.** A consuming `require()` no longer resolves a
  dedicated CJS bundle — use `import`/`import()`, or a Node ≥ 20.19 / ≥ 22.12 where `require()`
  of ESM works through the interop path. The `require` condition was removed from `exports` for
  all three entry points, along with the `.cjs` and `.d.cts` output. This roughly halves the
  package: the unpacked tarball drops from 32 files / 655 kB to 17 files / 143 kB.
- Sourcemaps are no longer published. Each `.map` embedded the full original source of its
  inputs, and together they accounted for ~55% of the tarball. Build them on demand with
  `SOURCEMAP=1 bun run build` when debugging a release.
- `verify:pack` now asserts the ESM-only contract instead of the CJS `require()` path: it fails
  if a `.cjs`/`.d.cts` artifact or a `require` condition reappears in the tarball.
- **Releases are staged on npm and need human approval.** `Release` now calls
  `npm stage publish` instead of `npm publish`, and a new `Approve staged release` workflow
  performs the 2FA approval and creates the GitHub Release afterwards. Nothing here needs to be
  done by consumers — but it does mean a version is not installable the moment CI goes green.
- The `prepublishOnly` hook was dropped: `npm stage publish` would trigger it on every staged
  upload, and CI already gates the release commit with the shared `verify` action before
  staging. Run `bun run verify` explicitly if you relied on it locally.
- GitHub Actions were bumped to `actions/checkout@v5` and `actions/setup-node@v5`, which run on
  Node 24 and clear the Node 20 deprecation notice.

### Added

- `MIGRATION.md` — the in-app → package switch-over guide that `README.md` and `CHANGELOG.md`
  already linked to, and that the published `files` list already advertised.
- `.github/workflows/approve-release.yml` — approves a staged version with your 2FA password,
  verifies it actually reached the registry (and carries a provenance attestation), and only
  then creates the GitHub Release.
- `stage:list` and `stage:approve` package scripts, plus a `SOURCEMAP=1` build flag.

## [0.2.0] — 2026-09-10

### Added

- **Native Shadow DOM support.** Components rendered inside a `ShadowRoot` now inject the
  stylesheet into that root (once, as `<style data-vsa-styles>`) and handle wheel scrolling
  themselves, so lists keep scrolling even when the host page or a body-scroll-lock library
  cancels wheel events at the `document` level. Scroll chaining at the boundary, gesture
  latching (`WHEEL_LATCH_MS`), pinch-zoom and horizontal wheel pass-through, and `deltaMode`
  normalisation mirror the browser's own behaviour.
- `wheelScroll?: 'auto' | 'always' | 'never'` prop on `ScrollArea`, `VirtuosoScrollArea` and
  `VirtuosoGridScrollArea` (default `'auto'`: manual handling only inside a shadow root).
- `injectStyles()` accepts a `ShadowRoot`; `useInjectedStyles(element)` injects into the
  element's shadow root (and its owner document, for iframes/portals).
- New exports: `useWheelScroll`, `isInShadowRoot`, `WHEEL_LATCH_MS`, `WheelScrollMode`,
  `STYLE_ELEMENT_ATTRIBUTE`.

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
