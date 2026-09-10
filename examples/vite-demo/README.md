# Demo

A runnable showcase for `virtuo-scroll-area`. It uses **no Tailwind and imports no CSS** — only the
components — which is the point: the library ships and injects its own stylesheet.

## Run it

From the repository root:

```bash
bun run demo             # build the library, install demo deps, serve on http://localhost:5199
bun run demo:build       # production build of the demo
bun run demo:standalone  # one self-contained HTML file (examples/standalone/index.html)
```

Or work inside this folder directly (build the library first — the demo consumes `dist/`):

```bash
cd ..
bun run build
cd examples/vite-demo
bun install
bun run dev
```

## What it demonstrates

| Section | Shows                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------- |
| 1       | `ScrollArea` with plain content, hover-revealed scrollbar, and `viewportRef` driving two buttons         |
| 2       | Theming through `--vsa-*` custom properties (rail width, thumb colour, thumb radius)                     |
| 3       | `VirtuosoScrollArea` with 5,000 rows, the scroll-to-top button, and `getInstance('demo-list')`           |
| 4       | `VirtuosoGridScrollArea` with 51 cells, `gridClassName`, `computeItemKey` and `getInstance('demo-grid')` |
| 5       | `ScrollToTopButton` on a plain element, with a custom threshold and label                                |

## How the library is resolved

`vite.config.ts` aliases the three entry points to `../../dist` instead of depending on
`virtuo-scroll-area` through `file:` — bun copies `file:` dependencies into `node_modules`, so the
demo would silently go stale on every rebuild. Real consumers resolve the same files through the
package's `exports` map; `scripts/verify-package.mjs` in the repository root covers that path.

Because the aliased files live outside this project, `resolve.dedupe: ['react', 'react-dom']` is
required here. Without it Vite resolves React from the package root as well, bundles two copies,
and the virtualized components fail with:

```
TypeError: Cannot read properties of null (reading 'useState')
```

Any consumer that links or aliases the package out-of-tree (pnpm workspaces, `file:`, a local
alias) needs the same line.
