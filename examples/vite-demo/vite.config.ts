import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dist = fileURLToPath(new URL('../../dist', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The demo consumes the *built* package (run `bun run build` first) through aliases rather
    // than a `file:` dependency: a file dependency is copied into node_modules by bun and would
    // silently go stale on every rebuild. Real consumers resolve the same files through the
    // package's `exports` map — see `scripts/verify-package.mjs`, which installs the packed
    // tarball and imports it by name.
    alias: {
      'virtuo-scroll-area/virtuoso': `${dist}/virtuoso.js`,
      'virtuo-scroll-area/virtuoso-grid': `${dist}/virtuoso-grid.js`,
      'virtuo-scroll-area': `${dist}/index.js`,
    },
    // Required because the aliased files live outside this project: without it Vite resolves
    // `react` from the package's own node_modules as well as from this one, which produces two
    // React copies and the classic "Cannot read properties of null (reading 'useState')".
    // Any consumer that links or aliases the package out-of-tree needs the same line.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5199,
    // The aliased files live one directory above the demo root.
    fs: { allow: ['../..'] },
  },
  preview: { port: 5199 },
});
