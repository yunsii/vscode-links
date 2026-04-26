#!/usr/bin/env node
// Build the napi addon for the requested target (or the host triple)
// and copy it to packages/vsix/dist/native.<triple>.node so the
// extension's bundle can require it at runtime via ./native-loader.
//
// Usage:
//   node scripts/build-native.mjs                 # host triple
//   node scripts/build-native.mjs --target <rust-target>
//
// Skipping the cargo build (e.g. CI already built it):
//   node scripts/build-native.mjs --from <path-to-existing-cdylib> \
//                                 --triple <triple>

import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const vsixDir = resolve(here, '..')
const repoRoot = resolve(vsixDir, '..', '..')
const distDir = join(vsixDir, 'dist')

const RUST_TO_TRIPLE = {
  'x86_64-unknown-linux-gnu': 'linux-x64-gnu',
  'aarch64-unknown-linux-gnu': 'linux-arm64-gnu',
  'x86_64-apple-darwin': 'darwin-x64',
  'aarch64-apple-darwin': 'darwin-arm64',
  'x86_64-pc-windows-msvc': 'win32-x64-msvc',
}

function detectHostRustTarget() {
  const { platform, arch } = process
  if (platform === 'linux') {
    return arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu'
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin'
  }
  if (platform === 'win32') {
    return 'x86_64-pc-windows-msvc'
  }
  throw new Error(`unsupported host platform ${platform}/${arch}`)
}

function cdylibName(triple) {
  if (triple.endsWith('-msvc')) {
    return 'vscode_links_napi.dll'
  }
  if (triple.startsWith('darwin-')) {
    return 'libvscode_links_napi.dylib'
  }
  return 'libvscode_links_napi.so'
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--target') {
      out.target = argv[++i]
    } else if (a === '--from') {
      out.from = argv[++i]
    } else if (a === '--triple') {
      out.triple = argv[++i]
    } else if (a === '--zigbuild') {
      out.zigbuild = true
    } else {
      throw new Error(`unknown arg: ${a}`)
    }
  }
  return out
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  mkdirSync(distDir, { recursive: true })

  if (opts.from && opts.triple) {
    const target = join(distDir, `native.${opts.triple}.node`)
    copyFileSync(opts.from, target)
    console.warn(`> staged ${target} (${humanSize(target)})`)
    return
  }

  const rustTarget = opts.target ?? detectHostRustTarget()
  const triple = RUST_TO_TRIPLE[rustTarget]
  if (!triple) {
    throw new Error(`unsupported rust target: ${rustTarget}`)
  }

  const builder = opts.zigbuild ? 'zigbuild' : 'build'
  const cmd = `cargo ${builder} --release -p vscode-links-napi --target ${rustTarget}`
  console.warn(`> ${cmd}`)
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit' })

  const built = join(repoRoot, 'target', rustTarget, 'release', cdylibName(triple))
  if (!existsSync(built)) {
    throw new Error(`expected cdylib at ${built} but it is missing`)
  }
  const target = join(distDir, `native.${triple}.node`)
  copyFileSync(built, target)
  console.warn(`> staged ${target} (${humanSize(target)})`)
}

function humanSize(p) {
  return `${(statSync(p).size / 1024 / 1024).toFixed(2)} MB`
}

main()
