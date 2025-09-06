import * as vscode from 'vscode'

import { CATEGORY_LABELS, CATEGORY_MESSAGES } from '../constants'
import { getAllLinkResources } from '../helpers/config'
import { CategoryItem, EmptyItem, LinkItem } from './items'

import type { LinkResourceType } from '../helpers/schemas'

export type TreeItemType = LinkItem | CategoryItem | EmptyItem

export class LinksProvider implements vscode.TreeDataProvider<TreeItemType> {
  private searchQuery = ''

  private categorizedResources: Record<LinkResourceType, LinkItem[]> | null = null

  private isLoading = true

  constructor() {
    this.loadResources()
  }

  getTreeItem(element: TreeItemType): vscode.TreeItem {
    return element
  }

  private async loadResources() {
    try {
      this.isLoading = true
      this._onDidChangeTreeData.fire()

      const allResources = await getAllLinkResources()

      const categorized = this.createEmptyCategories()

      for (const resource of allResources) {
        categorized[resource.type].push(new LinkItem(resource))
      }

      this.categorizedResources = categorized
      this.isLoading = false
      this._onDidChangeTreeData.fire()
    } catch (error) {
      console.error('Failed to load link resources:', error)
      this.isLoading = false
      this.categorizedResources = this.createEmptyCategories()
      this._onDidChangeTreeData.fire()

      vscode.window.showErrorMessage('Failed to load link resources. Please check your configuration.')
    }
  }

  private createEmptyCategories(): Record<LinkResourceType, LinkItem[]> {
    return {
      'local': [],
      'detected': [],
      'remote-project': [],
      'remote-shared': [],
    }
  }

  private matchesSearch(item: LinkItem): boolean {
    const query = this.searchQuery.toLowerCase()
    const label = typeof item.label === 'string' ? item.label : item.label?.label || ''
    return label.toLowerCase().includes(query)
      || item.url.toLowerCase().includes(query)
  }

  private getFilteredChildren(category: CategoryItem): TreeItemType[] {
    return category.children.filter((child) => {
      if (child instanceof EmptyItem) {
        return true
      }
      return child instanceof LinkItem && this.matchesSearch(child)
    })
  }

  getChildren(element?: TreeItemType): TreeItemType[] {
    if (!element) {
      if (this.isLoading) {
        return [new CategoryItem('Loading...', 'loading', [new EmptyItem('Loading link resources...')])]
      }

      if (!this.categorizedResources) {
        return [new CategoryItem('Error', 'error', [new EmptyItem('Failed to load link resources')])]
      }

      return this.createCategories()
    } else if (element instanceof CategoryItem) {
      return this.getFilteredChildren(element)
    }
    return []
  }

  private createCategories(): CategoryItem[] {
    const categories = [
      { label: CATEGORY_LABELS.local, category: 'local' as const },
      { label: CATEGORY_LABELS.detected, category: 'detected' as const },
      { label: CATEGORY_LABELS['remote-project'], category: 'remote-project' as const },
      { label: CATEGORY_LABELS['remote-shared'], category: 'remote-shared' as const },
    ]

    return categories.map((cat) => {
      const children = this.getCategoryChildren(cat.category)
      return new CategoryItem(cat.label, cat.category, children, CATEGORY_MESSAGES)
    })
  }

  private getCategoryChildren(category: keyof NonNullable<typeof LinksProvider.prototype.categorizedResources>): (LinkItem | EmptyItem)[] {
    if (!this.categorizedResources) {
      return [new EmptyItem('No resources available')]
    }

    const resources = this.categorizedResources[category]
    if (resources.length === 0) {
      return []
    }

    return resources
  }

  setSearchQuery(query: string) {
    if (typeof query !== 'string') {
      throw new TypeError('Search query must be a string')
    }

    if (this.searchQuery !== query) {
      this.searchQuery = query
      this._onDidChangeTreeData.fire()
    }
  }

  refresh(): void {
    this.loadResources()
  }

  updateCategoryResources(category: LinkResourceType, resources: LinkItem[]) {
    if (this.categorizedResources) {
      this.categorizedResources[category] = resources
      this._onDidChangeTreeData.fire()
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItemType | undefined | null | void> = new vscode.EventEmitter<TreeItemType | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<TreeItemType | undefined | null | void> = this._onDidChangeTreeData.event

  dispose() {
    this.categorizedResources = null
  }
}
