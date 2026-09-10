import { readFileSync } from 'node:fs';

/**
 * Raw text of the shipped stylesheet.
 *
 * Tests import this instead of `src/styles.css` (see `stylesAsTextPlugin` in `vitest.config.ts`)
 * because Vitest force-replaces CSS module content with an empty string. Reading the same file
 * the build embeds mirrors esbuild's `text` loader, so assertions run against the real CSS.
 *
 * The absolute path is injected by Vitest's `define`, because `import.meta.url` is not a
 * `file:` URL inside Vitest's SSR transform.
 */
declare const __VSA_STYLES_PATH__: string;

export default readFileSync(__VSA_STYLES_PATH__, 'utf8');
