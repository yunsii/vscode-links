import { ref, useCommands, useVscodeContext } from 'reactive-vscode'
import * as vscode from 'vscode'

import { logger } from '../utils'
import { LinksProvider } from './provider'

export function setupViewsAndCommands() {
  const provider = new LinksProvider()
  vscode.window.registerTreeDataProvider('linksTree', provider)

  const isSearchMode = ref(false)
  const searchContextKey = 'links.isSearchMode'

  useVscodeContext(searchContextKey, () => isSearchMode.value)

  useCommands({
    'links.openUrl': (url: string) => {
      logger.info('Opening URL:', url)
      try {
        // 确保 URL 有协议
        let processedUrl = url
        if (!url.match(/^https?:\/\//)) {
          processedUrl = `https://${url}`
        }
        vscode.env.openExternal(vscode.Uri.parse(processedUrl))
      } catch (error) {
        logger.error('Failed to open URL:', error)
        vscode.window.showErrorMessage(`Failed to open URL: ${url}`)
      }
    },
    'links.refresh': () => provider.refresh(),
    'links.enterSearch': async () => {
      const query = await vscode.window.showInputBox({
        placeHolder: 'Search links...',
        prompt: 'Enter search term to filter links',
      })
      if (query !== undefined) {
        provider.setSearchQuery(query)
        isSearchMode.value = true
      }
    },
    'links.exitSearch': () => {
      provider.setSearchQuery('')
      isSearchMode.value = false
    },
    'links.copyUrl': async (item: any) => {
      if (item && item.url) {
        await vscode.env.clipboard.writeText(item.url)
        vscode.window.showInformationMessage('Link URL copied to clipboard!')
      }
    },
  })
}
