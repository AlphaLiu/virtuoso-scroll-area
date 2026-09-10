# Migrating from an in-app copy

The package was extracted from the `scroll-area` component of an in-house Tauri/React app. This
guide is for code that still imports that in-app copy. The [CHANGELOG](./CHANGELOG.md) records
the same changes release by release.

## 1. Import paths

```diff
-import { ScrollArea } from '@/components/ui/scroll-area';
+import { ScrollArea } from 'virtuo-scroll-area';

-import { VirtuosoScrollArea } from '@/components/ui/virtuoso-scroll-area';
+import { VirtuosoScrollArea } from 'virtuo-scroll-area/virtuoso';

-import { VirtuosoGridScrollArea } from '@/components/ui/virtuoso-grid-scroll-area';
+import { VirtuosoGridScrollArea } from 'virtuo-scroll-area/virtuoso-grid';
```

The two virtualized entries are separate so that `react-virtuoso` stays an _optional_ peer
dependency — importing only the core entry never pulls it in.

| In-app module                  | Package entry                      | Requires `react-virtuoso` |
| ------------------------------ | ---------------------------------- | ------------------------- |
| `ui/scroll-area`               | `virtuo-scroll-area`               | no                        |
| `ui/scroll-context`            | `virtuo-scroll-area`               | no                        |
| `ui/scroll-to-top-button`      | `virtuo-scroll-area`               | no                        |
| `ui/virtuoso-scroll-area`      | `virtuo-scroll-area/virtuoso`      | yes                       |
| `ui/virtuoso-grid-scroll-area` | `virtuo-scroll-area/virtuoso-grid` | yes                       |

## 2. Stylesheet

**Delete the CSS import.** The stylesheet is now injected at runtime by the library entry points,
so there is nothing to import and no CSS pipeline to configure:

```diff
-import '@/components/ui/scroll-area.css';
```

Only strict-CSP setups, where a runtime `<style>` injection is not acceptable, should opt out by
importing the published copy instead:

```ts
import 'virtuo-scroll-area/styles.css';
```

### Renamed CSS variable

The thumb height variable lost its Radix prefix:

```diff
-  --radix-scroll-area-thumb-height: 8px;
+  --vsa-thumb-height: 8px;
```

`generateScrollStyle()` used to hand you the react-virtuoso rule block to inject yourself. The
rules now ship inside the stylesheet, so the call is a no-op you can delete:

```diff
-<style>{generateScrollStyle()}</style>
```

The function is still exported for compatibility, but it is deprecated.

## 3. Styling differences

The component no longer depends on the host app's Tailwind setup. Utility classes and design
tokens were replaced by a self-contained stylesheet built on cascade layers:

| Used to be                             | Now                                       |
| -------------------------------------- | ----------------------------------------- |
| `bg-primary`, `bg-muted-foreground/30` | `--vsa-thumb-background`                  |
| `shadow-ink-lg`                        | `--vsa-scroll-to-top-shadow`              |
| `scrollbar-none`                       | native scrollbar hidden by `.vsa-*` rules |
| `clsx` + `tailwind-merge`              | internal `cx` (no dependency)             |
| shadcn `Button`, `lucide-react` icon   | plain `<button>`, inline SVG              |

Two consequences worth checking when you switch over:

- **`cx` is not `tailwind-merge`.** It joins class names without resolving conflicting Tailwind
  utilities. Class strings you pass through the library's `className` props are unchanged; only
  internal merging behaviour differs.
- **Tailwind `className` overrides still work** for layout, but the visual defaults now live in
  `--vsa-*` custom properties. See [Theming](./README.md#theming) for the full list.

## 4. Behaviour changes

- **`ScrollArea` no longer wraps its container in a flex layout.** The
  `vsa-scroll-area-layout` class carries that instead, so the virtualized containers can share the
  same root class. If you relied on the wrapper's `display: flex`, add it explicitly.
- **`ScrollToTopButton` gained `label`, `threshold` and `icon` props**; `ScrollArea` gained
  `viewportRef` and now registers its viewport with a surrounding `ScrollContextProvider`.
- **`wheelScroll`** (`'auto' | 'always' | 'never'`) controls manual wheel handling. The default
  `'auto'` handles wheel events only inside a `ShadowRoot`, so a host page that locks body
  scrolling cannot swallow list scrolling.

## 5. New capabilities

- **Shadow DOM support** — rendering inside a `ShadowRoot` injects the stylesheet into that root
  and keeps wheel scrolling working when the host page cancels wheel events at the `document`.
- **`ScrollContextProvider`** with `useScrollToTop`, `useScrollToBottom`, and a named-instance
  registry (`registerInstance` / `unregisterInstance` / `getInstance`).
- **Low-level building blocks** — `ScrollAreaScrollbar`, `ScrollAreaScrollbarImpl`,
  `ScrollAreaThumb`, `Scroller`, the geometry helpers and `THUMB_MIN_SIZE`, exported for custom
  layouts. See [Low-level API](./README.md#low-level-api).
