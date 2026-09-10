import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Prints the CHANGELOG.md section for one version, so a release can use it as its notes:
 *
 *   node scripts/changelog-section.mjs 1.2.0
 *
 * Exits 2 (with a message on stderr) when the version has no section, which lets the release
 * workflow fall back to GitHub's generated notes.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = (process.argv[2] ?? '').trim().replace(/^v/, '');

if (!version) {
  console.error('usage: node scripts/changelog-section.mjs <version>');
  process.exit(1);
}

const lines = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').split('\n');

// A section runs from its `## [<version>] — <date>` heading to the next `## ` heading.
const heading = /^##\s/;
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wanted = new RegExp(`^##\\s+\\[?v?${escaped}\\]?(?:\\s|$)`);

const start = lines.findIndex((line) => heading.test(line) && wanted.test(line));
if (start === -1) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(2);
}

const rest = lines.slice(start + 1);
const next = rest.findIndex((line) => heading.test(line));
const section = (next === -1 ? rest : rest.slice(0, next)).join('\n').trim();

if (!section) {
  console.error(`CHANGELOG.md section for ${version} is empty`);
  process.exit(2);
}

// The heading itself is dropped: GitHub already titles the release with the tag.
process.stdout.write(`${section}\n`);
