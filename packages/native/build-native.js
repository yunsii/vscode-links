#!/usr/bin/env node
// Local dev helper: builds the napi crate in release mode and copies
// the produced cdylib into this package as the platform-tagged .node
// file. PR 5e replaces this with the per-arch CI matrix.

import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..', '..')
const cargoManifest = join(repoRoot, 'Cargo.toml')

function detectTriple() {
  const { platform, arch } = process
  if (platform === 'linux') {
    return arch === 'arm64' ? 'linux-arm64-gnu' : 'linux-x64-gnu'
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  }
  if (platform === 'win32') {
    return 'win32-x64-msvc'
  }
  throw new Error(`unsupported platform ${platform}/${arch}`)
}

function cdylibName() {
  const { platform } = process
  if (platform === 'win32') {
    return 'vscode_links_napi.dll'
  }
  if (platform === 'darwin') {
    return 'libvscode_links_napi.dylib'
  }
  return 'libvscode_links_napi.so'
}

const triple = detectTriple()
const target = join(here, `vscode-links.${triple}.node`)

console.warn(`> cargo build --release -p vscode-links-napi`)
execSync('cargo build --release -p vscode-links-napi', {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...process.env, CARGO_MANIFEST_PATH: cargoManifest },
})

const built = join(repoRoot, 'target', 'release', cdylibName())
if (!existsSync(built)) {
  throw new Error(`expected cdylib at ${built} but it is missing`)
}

copyFileSync(built, target)
const size = statSync(target).size
console.warn(`> wrote ${target} (${(size / 1024 / 1024).toFixed(2)} MB)`)
