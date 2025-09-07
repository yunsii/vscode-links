import { watch } from 'reactive-vscode'
import * as vscode from 'vscode'

import { logger } from '@/utils'

import { linksStore } from '../store/links'

export function setupStatusBarItem(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  statusBarItem.command = 'links.open'
  statusBarItem.tooltip = 'Open project links'

  context.subscriptions.push(statusBarItem)

  const updateStatusBar = () => {
    const total = linksStore.totalLinks
    const isLoading = linksStore.isLoading.value
    const hasError = linksStore.error.value

    logger.info(`Updating status bar: total=${total}, isLoading=${isLoading}, hasError=${!!hasError}`)

    if (isLoading) {
      // Hide status bar during loading to avoid flickering
      statusBarItem.hide()
    } else if (hasError) {
      // Show error state briefly
      statusBarItem.text = `$(error) Error`
      statusBarItem.tooltip = `Failed to load links: ${hasError}`
      statusBarItem.show()
    } else if (total > 0) {
      statusBarItem.text = `$(link) ${total}`
      statusBarItem.tooltip = 'Open project links'
      statusBarItem.show()
    } else {
      statusBarItem.hide()
    }
  }

  updateStatusBar()

  watch(linksStore.isLoading, updateStatusBar)
  watch(linksStore.resources, updateStatusBar)
  watch(linksStore.error, updateStatusBar)
}
