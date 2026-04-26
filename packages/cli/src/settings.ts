import { promises as fs } from 'node:fs'
import * as path from 'node:path'

import type { LinksConfig } from '@vscode-links/core'

import { parseJsonc } from './jsonc'

interface RawVSCodeSettings {
  'links.resources'?: unknown
  'links.remoteResources'?: unknown
}

/**
 * Walk up from `cwd` until `.vscode/settings.json` is found. Returns
 * `null` if no such file exists between `cwd` and the filesystem root.
 */
export async function findWorkspaceSettings(cwd: string): Promise<string | null> {
  let dir = path.resolve(cwd)
  while (true) {
    const candidate = path.join(dir, '.vscode', 'settings.json')
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // not here, walk up
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      return null
    }
    dir = parent
  }
}

/**
 * Load a VS Code settings.json (JSONC) file and project the
 * `links.*` keys into a LinksConfig. Other keys are ignored.
 */
export async function loadLinksConfigFromFile(file: string): Promise<LinksConfig> {
  const text = await fs.readFile(file, 'utf8')
  const parsed = parseJsonc<RawVSCodeSettings | null>(text) ?? {}
  return projectLinksConfig(parsed)
}

/**
 * Resolve the effective LinksConfig for `cwd`: looks up the nearest
 * `.vscode/settings.json` and projects it, or returns an empty config
 * when no settings file is found.
 */
export async function loadLinksConfigFromCwd(cwd: string): Promise<LinksConfig> {
  const file = await findWorkspaceSettings(cwd)
  if (!file) {
    return {}
  }
  return loadLinksConfigFromFile(file)
}

function projectLinksConfig(raw: RawVSCodeSettings): LinksConfig {
  const out: LinksConfig = {}

  const resources = raw['links.resources']
  if (Array.isArray(resources)) {
    out.resources = resources.filter(isPlainObject) as LinksConfig['resources']
  }

  const remote = raw['links.remoteResources']
  if (remote && isPlainObject(remote) && typeof (remote as { url?: unknown }).url === 'string') {
    out.remoteResources = remote as { url: string, project?: string }
  }

  return out
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
