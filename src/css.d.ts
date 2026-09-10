declare module '*.css' {
  /** Raw stylesheet text (loaded through the `text` esbuild loader). */
  const css: string;
  export default css;
}
