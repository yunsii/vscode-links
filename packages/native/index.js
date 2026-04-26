// Loader for the per-platform .node addon. The published package will
// install only the matching arch via optionalDependencies; for the
// in-repo dev path we look in the package directory itself.

import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))

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
  throw new Error(`@vscode-links/native: unsupported platform ${platform}/${arch}`)
}

function loadAddon() {
  const triple = detectTriple()
  const local = join(here, `vscode-links.${triple}.node`)
  if (existsSync(local)) {
    return require(local)
  }
  // Production path — per-arch optional package.
  return require(`@vscode-links/native-${triple}`)
}

const addon = loadAddon()

/**
 * @param {{
 *   cwd: string,
 *   config?: { resources?: Array<{url:string,title:string,description?:string}>,
 *              remoteResources?: { url: string, project?: string } | null },
 *   editorContext?: { fileRelativePath?: string | null },
 *   failSoft?: boolean,
 * }} options
 * @returns {{
 *   context: object,
 *   links: Array<{ type: string, source: string, url: string, title: string, description?: string }>,
 *   skipped: Array<{ source: string, raw: object, reason: string, variable?: string, message: string }>,
 *   diagnostics: Array<{ level: 'warn' | 'error', source: string, message: string }>,
 * }} the rendered link list, skipped rows, and diagnostics
 */
export function resolve(options) {
  return addon.resolveSync(options)
}

/**
 * @param {string} template
 * @param {object} context
 * @returns {string} the rendered template
 */
export function renderTemplate(template, context) {
  return addon.renderTemplateSync(template, context)
}
