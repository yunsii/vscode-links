import * as vscode from 'vscode'

export function getExtensionConfig() {
  return vscode.workspace.getConfiguration('links')
}

export interface ResourceItem {
  id: string
  url: string
  title: string
  description?: string
}

export function getExtensionResources() {
  const linksConfig = getExtensionConfig()
  const resources = linksConfig.get<ResourceItem[]>('resources')

  return resources
}
