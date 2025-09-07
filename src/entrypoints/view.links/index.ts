import { computed, createSingletonComposable, ref, useCommands, useTreeView, useVscodeContext } from 'reactive-vscode'
import * as vscode from 'vscode'

import type { TreeViewNode } from 'reactive-vscode'

import { categoryLabels, categoryMessages } from '../../constants'
import { commands } from '../../generated/meta'
import { openLinkResource } from '../../helpers/open'
import { processLinkDisplay } from '../../helpers/url'
import { linksStore } from '../../store/links'
import { CategoryItem, EmptyItem, LinkItem } from './items'

import type { BaseLinkResource } from '../../helpers/schemas'

export const useLinksTreeView = createSingletonComposable(() => {
  const searchQuery = ref('')

  // Create reactive tree data
  const treeData = computed((): TreeViewNode[] => {
    // Show loading state
    if (linksStore.isLoading.value) {
      return [{
        treeItem: new EmptyItem('Loading link resources...'),
      }]
    }

    // Show error state
    if (linksStore.error.value) {
      return [{
        treeItem: new EmptyItem('Failed to load link resources'),
      }]
    }

    // Create category nodes
    const categories = [
      { label: categoryLabels.local, category: 'local' as const },
      { label: categoryLabels.detected, category: 'detected' as const },
      { label: categoryLabels['remote-project'], category: 'remote-project' as const },
      { label: categoryLabels['remote-shared'], category: 'remote-shared' as const },
    ]

    return categories.map((cat) => {
      const linksByType = linksStore.linksByType
      const resources = linksByType[cat.category] || []

      // Filter by search query
      const filteredResources = searchQuery.value
        ? resources.filter((resource) => {
            const { label, detail } = processLinkDisplay(resource)
            const query = searchQuery.value.toLowerCase()
            return label.toLowerCase().includes(query) || detail.toLowerCase().includes(query) || resource.url.toLowerCase().includes(query)
          })
        : resources

      const hasLinks = filteredResources.length > 0
      const children: TreeViewNode[] = hasLinks
        ? filteredResources.map((resource) => ({
            treeItem: new LinkItem(resource),
          }))
        : [{
            treeItem: new EmptyItem('No links found'),
          }]

      return {
        treeItem: new CategoryItem(cat.label, cat.category, categoryMessages, hasLinks),
        children,
      }
    })
  })

  // Create tree view with reactive data
  const view = useTreeView('linksTree', treeData)

  // Search functionality
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  return {
    view,
    setSearchQuery,
    refresh: () => linksStore.refresh(),
  }
})

export function setupViewLinks() {
  const { view, setSearchQuery, refresh } = useLinksTreeView()

  const isSearchMode = ref(false)
  const searchContextKey = 'links.isSearchMode'

  useVscodeContext(searchContextKey, () => isSearchMode.value)

  useCommands({
    [commands.openUrl]: async (resource: BaseLinkResource) => {
      await openLinkResource(resource)
    },
    [commands.refresh]: () => refresh(),
    [commands.enterSearch]: async () => {
      const query = await vscode.window.showInputBox({
        placeHolder: 'Search links...',
        prompt: 'Enter search term to filter links',
      })
      if (query !== undefined) {
        setSearchQuery(query)
        isSearchMode.value = true
      }
    },
    [commands.exitSearch]: () => {
      setSearchQuery('')
      isSearchMode.value = false
    },
    [commands.copyUrl]: async (item: any) => {
      if (item && item.url) {
        await vscode.env.clipboard.writeText(item.url)
        vscode.window.showInformationMessage('Link URL copied to clipboard!')
      }
    },
  })

  return view
}
