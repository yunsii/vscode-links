import { getErrorMessage } from '@vscode-links/core'
import { resolve } from '@vscode-links/native'
import { extensionContext, ref } from 'reactive-vscode'
import * as vscode from 'vscode'

import type { BaseLinkResource } from '@vscode-links/core'

import { config } from '@/helpers/config'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

// Reactive state management for link resources
export class LinksStore {
  // Core state
  resources = ref<BaseLinkResource[]>([])
  isLoading = ref(false)
  error = ref<string | null>(null)

  // Cache for computed resources (internal)
  private cachedResources: BaseLinkResource[] | null = null
  private cachedPromise: Promise<BaseLinkResource[]> | null = null

  // Clear cache method
  clearCache() {
    this.cachedResources = null
    this.cachedPromise = null
  }

  // Load resources with caching
  async loadResources(): Promise<BaseLinkResource[]> {
    if (this.cachedResources) {
      this.isLoading.value = false
      this.error.value = null
      return this.cachedResources
    }

    if (this.cachedPromise) {
      return this.cachedPromise
    }

    this.cachedPromise = this._loadResourcesInternal()
    return this.cachedPromise
  }

  // Internal loading logic
  private async _loadResourcesInternal(): Promise<BaseLinkResource[]> {
    this.isLoading.value = true
    this.error.value = null
    logger.info('Starting to load link resources via core.resolve...')

    try {
      const cwd = await getCurrentWorkspace()
      const fileRelativePath = await getCurrentFileRelativePath()

      // Native addon is synchronous; vsix used to pass an EngineLogger
      // here but the Rust core does not surface per-provider tracing,
      // so we drop the field. Diagnostics still flow through `result`.
      const result = resolve({
        cwd,
        config: {
          resources: config.resources,
          remoteResources: config.remoteResources,
        },
        editorContext: { fileRelativePath },
      })

      for (const diag of result.diagnostics) {
        const message = `${diag.source}: ${diag.message}`
        if (diag.level === 'warn') {
          logger.warn(message)
          vscode.window.showWarningMessage(message)
        } else {
          logger.error(message)
        }
      }

      const flat: BaseLinkResource[] = result.links.map((l) => ({
        url: l.url,
        title: l.title,
        description: l.description,
        type: l.type,
      }))

      logger.info(`Resolved ${flat.length} links (${result.skipped.length} skipped)`)

      if (flat.length === 0) {
        this.clearCache()
        throw new Error('No links resources')
      }

      this.resources.value = flat
      this.cachedResources = flat
      this.cachedPromise = null

      return flat
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      this.error.value = errorMessage
      logger.error('Failed to load resources:', errorMessage)
      throw err
    } finally {
      this.isLoading.value = false
    }
  }

  // Refresh resources (force reload)
  async refresh(): Promise<void> {
    this.clearCache()
    await this.loadResources()
  }

  // Setup auto-clear cache on workspace events
  setupAutoClearCache() {
    extensionContext.value?.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('links')) {
          this.clearCache()
        }
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.clearCache()
      }),
    )
  }

  // Computed properties
  get totalLinks(): number {
    return this.resources.value.length
  }

  get linksByType() {
    const categorized: Record<string, BaseLinkResource[]> = {
      'local': [],
      'detected': [],
      'remote-project': [],
      'remote-shared': [],
    }

    for (const resource of this.resources.value) {
      categorized[resource.type].push(resource)
    }

    return categorized
  }
}

// Create singleton instance
export const linksStore = new LinksStore()

// Auto-load resources and setup cache clearing on store creation (non-blocking)
setTimeout(() => {
  logger.info('Starting auto-load of link resources...')
  linksStore.loadResources()
    .then((resources) => {
      logger.info(`Auto-load completed successfully with ${resources.length} resources`)
    })
    .catch((err) => {
      logger.error('Failed to load initial link resources:', err)
      linksStore.isLoading.value = false
    })
    .finally(() => {
      linksStore.isLoading.value = false
    })

  linksStore.setupAutoClearCache()
}, 0)
