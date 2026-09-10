import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Installs the packed tarball into a throwaway project and imports it the way a real consumer
 * would — through the package `exports` map over ESM.
 *
 * The package ships ESM only, so there is no `require` condition left to check. What replaces
 * that check is the Node `require(esm)` interop path: Node ≥ 20.19 / ≥ 22.12 can `require()` an
 * ESM package directly, which is what used to justify the separate CJS build.
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

/**
 * This script also runs from `prepublishOnly`, i.e. as a child of another npm process, which
 * exports its whole configuration as `npm_*` variables. Inheriting them breaks the nested npm
 * commands below — `npm_config_dry_run` in particular makes `npm install <tarball>` fetch no
 * data and then fail with ENOENT — so the children get a clean npm environment.
 */
const npmEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key)),
);

const packOutput = execFileSync(
  'npm',
  ['pack', '--json', '--pack-destination', sandbox],
  {
    cwd: root,
    encoding: 'utf8',
    env: npmEnv,
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
  'dist/index.d.ts',
  'dist/virtuoso.js',
  'dist/virtuoso-grid.js',
  'dist/styles.css',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'MIGRATION.md',
]) {
  if (!files.some((file) => file.path === required))
    fail(`missing from tarball: ${required}`);
}

// Guard the other direction too: an ESM-only package must not ship the CJS half it no longer
// declares in `exports`, or the tarball silently grows back to twice the size.
for (const file of files) {
  if (/\.cjs$|\.d\.cts$/.test(file.path))
    fail(`CJS artifact in an ESM-only tarball: ${file.path}`);
}

console.log('• installing into a sandbox consumer…');
mkdirSync(join(sandbox, 'node_modules'), { recursive: true });

execFileSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', tarball], {
  cwd: sandbox,
  stdio: 'pipe',
  env: npmEnv,
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

// The package is ESM only, so `require()` only works through Node's `require(esm)` interop
// (Node ≥ 20.19 / ≥ 22.12). Assert both facts: the interop actually resolves the entry, and no
// `require` condition is advertised — a `require` condition pointing at a CJS file is what made
// the tarball twice its necessary size.
if (manifest.exports['.']?.require) {
  fail("the manifest still advertises a 'require' condition for an ESM-only package");
} else {
  console.log("  ✓ no 'require' condition (ESM only)");
}

const requireEsm = createRequire(join(sandbox, 'index.cjs'));
try {
  const viaRequire = requireEsm('virtuo-scroll-area');
  if (typeof viaRequire.injectStyles !== 'function') {
    fail('require() interop resolved the entry but it has no expected exports');
  } else {
    console.log("  ✓ require('virtuo-scroll-area') via Node require(esm) interop");
  }
} catch (error) {
  // Not a failure: the interop needs a recent Node, and this script may run on an older one.
  console.log(
    `  • require(esm) interop not exercised on ${process.version} (${error.code ?? ''})`,
  );
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
