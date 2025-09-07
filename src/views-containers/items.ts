import * as vscode from 'vscode'

import { getIconForType } from '../helpers/icons'
import { processLinkDisplay } from '../helpers/url'

import type { BaseLinkResource, LinkResourceType } from '../helpers/schemas'

export class LinkItem extends vscode.TreeItem {
  constructor(public readonly resource: BaseLinkResource) {
    const { label, detail, shortUrl } = processLinkDisplay(resource)

    super(label, vscode.TreeItemCollapsibleState.None)

    this.iconPath = new vscode.ThemeIcon('link')

    this.tooltip = detail
    this.description = shortUrl
    this.contextValue = 'linkItem'
    this.command = {
      command: 'links.openUrl',
      title: 'Open Link',
      arguments: [resource],
    }
  }

  get url(): string {
    return this.resource.url
  }

  get category(): LinkResourceType {
    return this.resource.type
  }
}

export class EmptyItem extends vscode.TreeItem {
  constructor(public readonly message: string) {
    super(message, vscode.TreeItemCollapsibleState.None)
    this.iconPath = new vscode.ThemeIcon('info')
    this.tooltip = message
  }
}

export class CategoryItem extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly category: string, private messages?: Record<string, string>, private hasLinks: boolean = true) {
    super(label, hasLinks ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
    this.iconPath = this.getIconForCategory(category)
    this.tooltip = label
  }

  private getIconForCategory(category: string): vscode.ThemeIcon {
    return getIconForType(category as LinkResourceType)
  }
}
