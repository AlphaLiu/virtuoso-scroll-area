import { copyFileSync } from 'node:fs';

// Publishes `src/styles.css` as `dist/styles.css` so consumers who cannot rely on runtime style
// injection can do `import 'virtuo-scroll-area/styles.css'`.
copyFileSync('src/styles.css', 'dist/styles.css');
console.log('copied src/styles.css → dist/styles.css');
