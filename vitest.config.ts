import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const stylesFixture = fileURLToPath(
  new URL('./test/fixtures/stylesheet.ts', import.meta.url),
);

/**
 * `src/styles.ts` imports the stylesheet as text (esbuild's `text` loader in the build), but
 * Vitest unconditionally replaces CSS module content: its `vitest:css-empty-post` plugin is
 * `post`-enforced and returns `export default ""`, which no `load`/`transform` hook of ours can
 * override. Resolving the specifier to a fixture that reads the same file from disk keeps the
 * tests and the shipped bundle in agreement.
 *
 * `resolve.alias` cannot be used here: Vite's alias plugin never rewrites relative specifiers.
 */
const stylesAsTextPlugin = {
  name: 'virtuo-scroll-area:styles-as-text',
  enforce: 'pre' as const,
  resolveId(source: string) {
    if (source.endsWith('styles.css')) return stylesFixture;
    return null;
  },
};

export default defineConfig({
  plugins: [stylesAsTextPlugin],
  define: {
    // Consumed by `test/fixtures/stylesheet.ts`; `import.meta.url` is not a file: URL under
    // Vitest's SSR transform, so the absolute path is injected here instead.
    __VSA_STYLES_PATH__: JSON.stringify(
      fileURLToPath(new URL('./src/styles.css', import.meta.url)),
    ),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        // Barrel files: re-exports only, nothing to execute.
        'src/index.ts',
        'src/scroll-area/index.ts',
        'src/virtuoso/index.ts',
        'src/virtuoso-grid/index.ts',
      ],
    },
  },
});
