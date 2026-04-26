import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: false,
  external: [
    'vscode',
    // @vscode-links/native pulls in a per-arch .node addon that
    // cannot be bundled into the VSIX's CJS output; vsce ships
    // node_modules alongside dist when --no-dependencies is dropped,
    // so the bare require resolves at runtime instead.
    '@vscode-links/native',
  ],
})
