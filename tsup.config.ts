import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    virtuoso: 'src/virtuoso/index.ts',
    'virtuoso-grid': 'src/virtuoso-grid/index.ts',
  },
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
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
