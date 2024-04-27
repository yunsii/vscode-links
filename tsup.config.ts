import { defineConfig } from 'tsup'

import { dependencies } from './package.json'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: false,
  external: [
    'vscode',
  ],
  // https://github.com/egoist/tsup/issues/420#issuecomment-927300508
  // https://tsup.egoist.dev/#excluding-packages
  noExternal: Object.keys(dependencies),
})
