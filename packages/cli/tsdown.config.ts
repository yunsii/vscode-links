import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts', 'src/lib.ts'],
  format: ['esm'],
  dts: false,
  shims: false,
  clean: true,
  // Both @vscode-links/core (workspace dep) and jsonc-parser (a CJS
  // package whose internal sub-imports do not survive bundling under
  // ESM output) are resolved by Node at install time.
  external: ['@vscode-links/core', 'jsonc-parser'],
})
