#!/usr/bin/env node
// Take a directory of CI artefacts and materialise one publishable
// npm package per arch under <out>/<triple>/. Each per-arch package
// contains:
//
//   package.json   { name, version, os, cpu, main, files }
//   <triple>.node  the cdylib renamed to the loader's expected
//                  filename (vscode-links.<triple>.node)
//
// Publish from each generated directory with `npm publish --access
// public` in CI; the main @vscode-links/native package then declares
// these per-arch packages under `optionalDependencies` so npm only
// installs the matching one.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const nativeRoot = resolve(here, '..')

const TRIPLES = [
  { triple: 'linux-x64-gnu', os: 'linux', cpu: 'x64', libc: 'glibc' },
  { triple: 'linux-arm64-gnu', os: 'linux', cpu: 'arm64', libc: 'glibc' },
  { triple: 'darwin-x64', os: 'darwin', cpu: 'x64' },
  { triple: 'darwin-arm64', os: 'darwin', cpu: 'arm64' },
  { triple: 'win32-x64-msvc', os: 'win32', cpu: 'x64' },
]

function usage() {
  return `
    usage: materialise-arch-packages.mjs --artefacts <dir> --out <dir> --version <semver>

      --artefacts <dir>  Directory whose subdirectories are the per-triple
                         CI artefacts (each contains vscode-links.<triple>.node).
      --out <dir>        Destination root. One subdir per triple is written.
      --version <semver> Version to stamp every package.json with.

    The main @vscode-links/native package.json is also rewritten in place so
    its version + optionalDependencies match what is being published.
  `
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--artefacts') {
      out.artefacts = argv[++i]
    } else if (a === '--out') {
      out.out = argv[++i]
    } else if (a === '--version') {
      out.version = argv[++i]
    } else if (a === '--help' || a === '-h') {
      process.stdout.write(`${usage()}\n`)
      process.exit(0)
    } else {
      throw new Error(`unknown option: ${a}`)
    }
  }
  for (const required of ['artefacts', 'out', 'version']) {
    if (!out[required]) {
      throw new Error(`--${required} is required\n\n${usage()}`)
    }
  }
  return out
}

function writeArchPackage({ triple, os, cpu, libc }, opts) {
  const srcAddon = join(opts.artefacts, triple, `vscode-links.${triple}.node`)
  if (!existsSync(srcAddon)) {
    throw new Error(`expected addon at ${srcAddon} but it is missing`)
  }
  const dest = join(opts.out, triple)
  mkdirSync(dest, { recursive: true })
  copyFileSync(srcAddon, join(dest, `vscode-links.${triple}.node`))

  const pkg = {
    name: `@vscode-links/native-${triple}`,
    version: opts.version,
    description: `Native vscode-links addon for ${triple}.`,
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/yunsii/vscode-links',
      directory: `packages/native/dist/${triple}`,
    },
    main: `vscode-links.${triple}.node`,
    files: [`vscode-links.${triple}.node`],
    os: [os],
    cpu: [cpu],
    ...(libc ? { libc: [libc] } : {}),
    publishConfig: { access: 'public' },
  }
  writeFileSync(join(dest, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
  return pkg.name
}

function rewriteMainPackage(opts, perArchNames) {
  const path = join(nativeRoot, 'package.json')
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  pkg.version = opts.version
  pkg.private = false
  pkg.publishConfig = { access: 'public' }
  pkg.optionalDependencies = Object.fromEntries(
    perArchNames.map((name) => [name, opts.version]),
  )
  // The dev fallback path (`vscode-links.<triple>.node` in this dir)
  // is no longer valid for a published package; the loader walks via
  // optionalDependencies first.
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
  return pkg
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(opts.artefacts)) {
    throw new Error(`artefacts dir does not exist: ${opts.artefacts}`)
  }
  mkdirSync(opts.out, { recursive: true })
  const names = TRIPLES.map((t) => writeArchPackage(t, opts))
  rewriteMainPackage(opts, names)
  process.stdout.write(`materialised ${names.length} per-arch packages at ${opts.out}\n`)
}

main()
