import { extensionContext, ref } from 'reactive-vscode'
import * as vscode from 'vscode'

import { getCnbRepoResources } from '@/entrypoints/command.open/cnb'
import { getCodingRepoResources } from '@/entrypoints/command.open/coding'
import { getGithubRepoResources } from '@/entrypoints/command.open/github'
import { getRemoteResources } from '@/entrypoints/command.open/remote'
import { getExtensionLocalResources } from '@/helpers/config'
import { getErrorMessage } from '@/helpers/errors'
import type { BaseLinkResource } from '@/helpers/schemas'
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
      // Ensure loading state is false when returning cached data
      this.isLoading.value = false
      this.error.value = null // Clear error when using cache
      return this.cachedResources
    }

    if (this.cachedPromise) {
      // If we have a pending promise, wait for it but don't set loading again
      return this.cachedPromise
    }

    this.cachedPromise = this._loadResourcesInternal()
    return this.cachedPromise
  }

  // Internal loading logic
  private async _loadResourcesInternal(): Promise<BaseLinkResource[]> {
    this.isLoading.value = true
    this.error.value = null
    logger.info('Starting to load link resources...')

    try {
      const handleErrorDefault = (err: unknown) => {
        logger.error(getErrorMessage(err))
      }

      logger.info('Loading local resources...')
      const localResources = getExtensionLocalResources()
      logger.info(`Loaded ${localResources.length} local resources`)

      logger.info('Loading coding repo resources...')
      const codingResources = await getCodingRepoResources(handleErrorDefault)
      logger.info(`Loaded ${codingResources.length} coding repo resources`)

      logger.info('Loading CNB repo resources...')
      const cnbResources = await getCnbRepoResources(handleErrorDefault)
      logger.info(`Loaded ${cnbResources.length} CNB repo resources`)

      logger.info('Loading GitHub repo resources...')
      const githubResources = await getGithubRepoResources(handleErrorDefault)
      logger.info(`Loaded ${githubResources.length} GitHub repo resources`)

      logger.info('Loading remote resources...')
      const remoteResources = await getRemoteResources((error: unknown) => {
        const errMsg = getErrorMessage(error)
        const message = `Failed to get remote resources: ${errMsg}`
        logger.error(message)
        vscode.window.showWarningMessage(message)
      })
      logger.info(`Loaded ${remoteResources.length} remote resources`)

      const result: BaseLinkResource[] = [
        ...localResources,
        ...codingResources,
        ...cnbResources,
        ...githubResources,
        ...remoteResources,
      ].filter(Boolean)

      logger.info(`Total resources loaded: ${result.length}`)

      if (result.length === 0) {
        this.clearCache()
        throw new Error('No links resources')
      }

      // Update reactive state
      this.resources.value = result
      this.cachedResources = result
      this.cachedPromise = null

      logger.info('Successfully loaded all resources')
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      this.error.value = errorMessage
      logger.error('Failed to load resources:', errorMessage)
      throw err
    } finally {
      this.isLoading.value = false
      logger.info('Loading process finished, isLoading set to false')
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
      // Ensure loading state is reset even on error
      linksStore.isLoading.value = false
    })
    .finally(() => {
      // Ensure loading state is always reset
      linksStore.isLoading.value = false
      logger.info('Auto-load process finished')
    })

  // Auto-setup cache clearing listeners
  logger.info('Setting up auto-clear cache listeners...')
  linksStore.setupAutoClearCache()
  logger.info('Auto-clear cache listeners setup completed')
}, 0)
