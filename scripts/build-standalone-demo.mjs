import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

/**
 * Bundles the demo app into ONE self-contained HTML file (JS + CSS inlined, no network).
 *
 * Useful for sharing the example, and for checking that the library works without any bundler
 * CSS handling: the stylesheet is injected at runtime by the library itself.
 *
 *   bun run demo:standalone   →  examples/standalone/index.html
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'examples/standalone');
const dist = resolve(root, 'dist');
const demoModules = resolve(root, 'examples/vite-demo/node_modules');

if (!existsSync(resolve(dist, 'index.js'))) {
  console.error('✗ dist/ is missing — run `bun run build` first.');
  process.exit(1);
}

if (!existsSync(demoModules)) {
  console.error(
    '✗ examples/vite-demo/node_modules is missing — run `bun install` in examples/vite-demo,\n' +
      '  or use `bun run demo:standalone` from the repository root.',
  );
  process.exit(1);
}

const result = await esbuild.build({
  entryPoints: [resolve(root, 'examples/vite-demo/src/main.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  minify: true,
  outdir: outDir,
  loader: { '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
  // Same aliasing as the Vite demo: consume the built package rather than a copied dependency.
  alias: {
    'virtuo-scroll-area/virtuoso-grid': resolve(dist, 'virtuoso-grid.js'),
    'virtuo-scroll-area/virtuoso': resolve(dist, 'virtuoso.js'),
    'virtuo-scroll-area': resolve(dist, 'index.js'),
    // The dist files live outside this project, so without this they would resolve `react` from
    // the package root as well — bundling two React copies and failing with
    // "Cannot read properties of null (reading 'useState')". Vite's equivalent is
    // `resolve.dedupe: ['react', 'react-dom']`.
    'react/jsx-dev-runtime': resolve(demoModules, 'react/jsx-dev-runtime'),
    'react/jsx-runtime': resolve(demoModules, 'react/jsx-runtime'),
    'react-dom/client': resolve(demoModules, 'react-dom/client'),
    'react-dom': resolve(demoModules, 'react-dom'),
    react: resolve(demoModules, 'react'),
    'react-virtuoso': resolve(demoModules, 'react-virtuoso'),
  },
  logLevel: 'warning',
});

const javascript = result.outputFiles.find((file) => file.path.endsWith('.js'));
const stylesheet = result.outputFiles.find((file) => file.path.endsWith('.css'));

if (!javascript) throw new Error('esbuild produced no JavaScript output');

// `</script>` inside a string literal would close the tag early.
const inlineScript = javascript.text.replaceAll('</script', '<\\/script');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>virtuo-scroll-area — standalone demo</title>
    <style>${stylesheet?.text ?? ''}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${inlineScript}</script>
  </body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'index.html'), html);

const kb = (html.length / 1024).toFixed(0);
console.log(`wrote examples/standalone/index.html (${kb} kB, fully self-contained)`);
