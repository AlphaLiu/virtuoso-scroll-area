import { defineConfig } from 'tsup';

/**
 * Sourcemaps are off by default: every `.map` embeds the full original source of its inputs
 * (`sourcesContent`), so maps used to be ~55% of the unpacked tarball. They are for debugging a
 * release, not for shipping, so opt in with `SOURCEMAP=1 bun run build` when you need them.
 */
const sourcemap = process.env.SOURCEMAP === '1';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    virtuoso: 'src/virtuoso/index.ts',
    'virtuoso-grid': 'src/virtuoso-grid/index.ts',
  },
  // ESM only. The CJS half used to double the file count, and — because tsup does not code-split
  // CJS — it inlined the shared ScrollArea/geometry code into all three entry bundles *plus*
  // emitted a `.d.cts` twin for every `.d.ts`. Node ≥ 20.19 / ≥ 22.12 can `require()` ESM
  // directly, so the legacy `require` condition bought very little for ~2x the output.
  format: ['esm'],
  target: 'es2022',
  dts: true,
  sourcemap,
  clean: true,
  minify: false,
  // NOTE: do not enable `treeshake` or force `splitting: true`. Both route the output through
  // tsup's rollup post-processing step, which silently drops the `banner` below — and losing
  // `"use client"` breaks Next.js App Router consumers. esbuild's own tree shaking is enough,
  // and ESM splitting is already on by default.
  // `react-virtuoso` is an optional peer dependency: never bundle it.
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-virtuoso'],
  // The stylesheet is embedded as a string and injected at runtime, so consumers need no CSS
  // pipeline of their own. A copy is also written to `dist/styles.css` for manual imports.
  loader: { '.css': 'text' },
  banner: { js: '"use client";' },
  onSuccess: 'node scripts/copy-styles.mjs',
});
