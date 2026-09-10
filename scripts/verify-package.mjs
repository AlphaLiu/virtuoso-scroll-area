import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Installs the packed tarball into a throwaway project and imports it the way a real consumer
 * would — through the package `exports` map, in both ESM and CJS.
 *
 * The unit tests import `src/`, and the demo aliases `dist/`; this is the only check that
 * exercises package.json, the entry paths and the published file list end to end.
 *
 *   bun run verify:pack
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = join(process.env.TMPDIR ?? '/tmp', 'virtuo-scroll-area-pack-verify');

const EXPECTED = {
  'virtuo-scroll-area': [
    'ScrollArea',
    'ScrollAreaScrollbar',
    'ScrollToTopButton',
    'ScrollContextProvider',
    'useScrollToTop',
    'injectStyles',
    'cx',
    'styles',
  ],
  'virtuo-scroll-area/virtuoso': ['VirtuosoScrollArea'],
  'virtuo-scroll-area/virtuoso-grid': ['VirtuosoGridScrollArea'],
};

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

console.log('• packing…');
rmSync(sandbox, { recursive: true, force: true });
mkdirSync(sandbox, { recursive: true });

const packOutput = execFileSync(
  'npm',
  ['pack', '--json', '--pack-destination', sandbox],
  {
    cwd: root,
    encoding: 'utf8',
  },
);
const [{ filename, files }] = JSON.parse(packOutput);
const tarball = join(sandbox, filename);

console.log(
  `• tarball: ${filename} (${files.length} files, ${(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(0)} kB unpacked)`,
);

// A published tarball must not leak sources, tests or config.
for (const forbidden of [
  /^src\//,
  /^test\//,
  /^examples\//,
  /^scripts\//,
  /tsconfig/,
  /tsup\.config/,
  /vitest/,
]) {
  for (const file of files) {
    if (forbidden.test(file.path)) fail(`unexpected file in tarball: ${file.path}`);
  }
}
for (const required of [
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/virtuoso.js',
  'dist/virtuoso-grid.js',
  'dist/styles.css',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
]) {
  if (!files.some((file) => file.path === required))
    fail(`missing from tarball: ${required}`);
}

console.log('• installing into a sandbox consumer…');
mkdirSync(join(sandbox, 'node_modules'), { recursive: true });

execFileSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', tarball], {
  cwd: sandbox,
  stdio: 'pipe',
});

// Peer dependencies are provided by the consumer; reuse the ones already installed here.
for (const peer of ['react', 'react-dom', 'react-virtuoso', 'scheduler']) {
  const from = join(root, 'node_modules', peer);
  const to = join(sandbox, 'node_modules', peer);
  if (existsSync(from) && !existsSync(to)) symlinkSync(from, to, 'dir');
}

const manifest = JSON.parse(
  readFileSync(join(sandbox, 'node_modules/virtuo-scroll-area/package.json'), 'utf8'),
);

for (const [entry, names] of Object.entries(EXPECTED)) {
  const conditions = manifest.exports?.[entry.replace('virtuo-scroll-area', '.')];
  for (const [condition, target] of Object.entries(conditions ?? {})) {
    const file = join(sandbox, 'node_modules/virtuo-scroll-area', target);
    if (!existsSync(file))
      fail(`${entry} (${condition}) points at a missing file: ${target}`);
  }

  const esm = await import(entry).catch((error) => {
    fail(`${entry} failed to import: ${error.message}`);
    return null;
  });
  if (!esm) continue;

  for (const name of names) {
    if (!(name in esm)) fail(`${entry} is missing the export "${name}"`);
  }
  console.log(`  ✓ import '${entry}' → ${names.length} exports checked`);
}

// The CJS build must work for consumers on require().
const require = createRequire(join(sandbox, 'index.cjs'));
try {
  const cjs = require('virtuo-scroll-area');
  if (typeof cjs.ScrollArea !== 'object' || typeof cjs.injectStyles !== 'function') {
    fail('the CJS entry does not expose the expected exports');
  } else {
    console.log("  ✓ require('virtuo-scroll-area') (CJS)");
  }
  const cjsVirtuoso = require('virtuo-scroll-area/virtuoso');
  if (!cjsVirtuoso.VirtuosoScrollArea)
    fail('the CJS virtuoso entry is missing VirtuosoScrollArea');
  else console.log("  ✓ require('virtuo-scroll-area/virtuoso') (CJS)");
} catch (error) {
  fail(`CJS require failed: ${error.message}`);
}

// The published stylesheet must be the real thing, not an empty stub.
const publishedCss = readFileSync(
  join(sandbox, 'node_modules/virtuo-scroll-area/dist/styles.css'),
  'utf8',
);
if (!publishedCss.includes('.vsa-scrollbar') || publishedCss.length < 1000) {
  fail('dist/styles.css looks empty or truncated');
} else {
  console.log(`  ✓ dist/styles.css (${(publishedCss.length / 1024).toFixed(1)} kB)`);
}

if (process.exitCode) {
  console.error('\npack verification FAILED');
} else {
  console.log('\n✓ pack verification passed');
}
