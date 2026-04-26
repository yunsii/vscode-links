// Per-arch VSIX shipping pattern (also used by rust-analyzer, swc-vscode,
// biome-vscode): the .node addon lives next to the bundled dist/index.js
// inside the VSIX archive. This loader walks a small set of well-known
// filenames so the bundle does not need to know its target triple at
// compile time — each per-arch VSIX only ships ONE of these files, so
// the first match wins.

import { createRequire } from 'node:module'
import * as path from 'node:path'

const localRequire = createRequire(__filename)

const CANDIDATES = [
  'native.linux-x64-gnu.node',
  'native.linux-arm64-gnu.node',
  'native.darwin-x64.node',
  'native.darwin-arm64.node',
  'native.win32-x64-msvc.node',
] as const

interface NativeAddon {
  resolveSync: (opts: unknown) => unknown
  renderTemplateSync: (template: string, context: unknown) => string
}

let cached: NativeAddon | null = null
let lastError: unknown = null

function tryLoad(): NativeAddon | null {
  if (cached) {
    return cached
  }
  for (const name of CANDIDATES) {
    try {
      const addon = localRequire(path.join(__dirname, name)) as NativeAddon
      cached = addon
      return addon
    } catch (err) {
      lastError = err
    }
  }
  return null
}

function loadOrThrow(): NativeAddon {
  const addon = tryLoad()
  if (!addon) {
    throw new Error(
      `vscode-links: could not find a native addon next to ${__dirname}. `
      + `Tried ${CANDIDATES.join(', ')}. Last error: ${(lastError as Error)?.message ?? String(lastError)}`,
    )
  }
  return addon
}

export type LinkResourceType = 'local' | 'detected' | 'remote-project' | 'remote-shared'

export interface BaseLinkResource {
  url: string
  title: string
  description?: string
  type: LinkResourceType
  meta?: Record<string, unknown>
}

export interface NativeResolveOptions {
  cwd: string
  config?: {
    resources?: Array<{ url: string, title: string, description?: string }>
    remoteResources?: { url: string, project?: string } | null
  }
  editorContext?: { fileRelativePath?: string | null }
  failSoft?: boolean
}

export interface NativeResolveResult {
  context: Record<string, unknown>
  links: Array<{
    type: LinkResourceType
    source: string
    url: string
    title: string
    description?: string
  }>
  skipped: Array<{
    source: string
    raw: BaseLinkResource
    reason: string
    variable?: string
    message: string
  }>
  diagnostics: Array<{ level: 'warn' | 'error', source: string, message: string }>
}

export function resolve(options: NativeResolveOptions): NativeResolveResult {
  return loadOrThrow().resolveSync(options) as NativeResolveResult
}

export function renderTemplate(template: string, context: Record<string, unknown>): string {
  return loadOrThrow().renderTemplateSync(template, context)
}
