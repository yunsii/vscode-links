import * as vscode from 'vscode'

import { getCnbRepoResources } from '@/commands/open/cnb'
import { getCodingRepoResources } from '@/commands/open/coding'
import { getGithubRepoResources } from '@/commands/open/github'
import { getRemoteResources } from '@/commands/open/remote'
import type { BaseLinkResource } from '@/helpers/schemas'

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
    const result = [
      ...getExtensionLocalResources(),
      ...(await getCodingRepoResources()),
      ...(await getCnbRepoResources()),
      ...(await getGithubRepoResources()),
      ...(await getRemoteResources()),
    ].filter(Boolean)

    if (result.length === 0) {
      // keep cache cleared on failure
      clearLinkResourcesCache()
      throw new Error('No links resources')
    }

    cachedResources = result
    // allow subsequent calls to return cachedResources
    cachedPromise = null
    return result
  })()

  return cachedPromise
}
