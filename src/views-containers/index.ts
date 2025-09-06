import { ref, useCommands, useVscodeContext } from 'reactive-vscode'
import * as vscode from 'vscode'

import { openLinkResource } from '../helpers/open'
import { LinksProvider } from './provider'

import type { BaseLinkResource } from '../helpers/schemas'

export function setupViewsAndCommands() {
  const provider = new LinksProvider()
  vscode.window.registerTreeDataProvider('linksTree', provider)

  const isSearchMode = ref(false)
  const searchContextKey = 'links.isSearchMode'

  useVscodeContext(searchContextKey, () => isSearchMode.value)

  useCommands({
    'links.openUrl': async (resource: BaseLinkResource) => {
      await openLinkResource(resource)
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
