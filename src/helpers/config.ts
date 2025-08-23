import * as vscode from 'vscode'

import { getCnbRepoResources } from '@/commands/open/cnb'
import { getCodingRepoResources } from '@/commands/open/coding'
import { getGithubRepoResources } from '@/commands/open/github'
import { getRemoteResources } from '@/commands/open/remote'
import { getErrorMessage } from '@/helpers/errors'
import { getCurrentRepoUrl } from '@/helpers/git'
import type { BaseLinkResource } from '@/helpers/schemas'
import { getCurrentWorkspace } from '@/helpers/workspaces'
import { renderResources } from '@/template/engine'
import { logger } from '@/utils'

export function getExtensionConfig() {
  return vscode.workspace.getConfiguration('links')
}

export function getExtensionLocalResources() {
  const linksConfig = getExtensionConfig()
  const resources = linksConfig.get<BaseLinkResource[]>('resources')

  return resources || []
}

export function getExtensionRemoteResourcesConfig() {
  const linksConfig = getExtensionConfig()
  const remoteResourcesConfig = linksConfig.get<{ url: string, project?: string } | null>('remoteResources')

  return remoteResourcesConfig
}

export function getSharedTitlePrefix() {
  const linksConfig = getExtensionConfig()
  const prefix = linksConfig.get<string>('sharedTitlePrefix')
  return typeof prefix === 'string' ? prefix : '[shared] '
}

export function getRemoteTitlePrefix() {
  const linksConfig = getExtensionConfig()
  const prefix = linksConfig.get<string>('remoteTitlePrefix')
  return typeof prefix === 'string' ? prefix : '[remote] '
}

// In-memory cache for computed resources. Use promise dedupe to avoid concurrent work.
let cachedResources: BaseLinkResource[] | null = null
let cachedPromise: Promise<BaseLinkResource[]> | null = null

export function clearLinkResourcesCache() {
  cachedResources = null
  cachedPromise = null
}

/**
 * Helper to auto-clear cache on common workspace events.
 * Call from your extension activation and pass the extension context subscriptions.
 */
export function setupLinkResourcesCacheAutoClear(subscriptions: vscode.Disposable[] = []) {
  subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('links')) {
        clearLinkResourcesCache()
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      clearLinkResourcesCache()
    }),
  )
}

export async function getAllLinkResources() {
  if (cachedResources) {
    return cachedResources
  }

  if (cachedPromise) {
    return cachedPromise
  }

  cachedPromise = (async () => {
    const handleErrorDefault = (err: unknown) => {
      logger.error(getErrorMessage(err))
    }

    const result = [
      ...getExtensionLocalResources(),
      ...(await getCodingRepoResources(handleErrorDefault)),
      ...(await getCnbRepoResources(handleErrorDefault)),
      ...(await getGithubRepoResources(handleErrorDefault)),
      ...(await getRemoteResources((error: unknown) => {
        const errMsg = getErrorMessage(error)
        const message = `Failed to get remote resources: ${errMsg}`
        logger.error(message)
        vscode.window.showWarningMessage(message)
      })),
    ].filter(Boolean)

    // render templates with a minimal context (workspace path + repo url)
    if (result.length === 0) {
      // keep cache cleared on failure
      clearLinkResourcesCache()
      throw new Error('No links resources')
    }

    try {
      const workspace = await getCurrentWorkspace()
      const repoUrl = await getCurrentRepoUrl(workspace)
      const rendered = await renderResources(result, { workspacePath: workspace, repoUrl })
      // allow subsequent calls to return cachedResources
      cachedResources = rendered
      cachedPromise = null
      return rendered
    } catch (err) {
      // if templating fails, fall back to raw result but still cache
      cachedResources = result as BaseLinkResource[]
      cachedPromise = null
      return cachedResources
    }
  })()

  return cachedPromise
}
