import * as vscode from 'vscode'

export function getExtensionConfig() {
  return vscode.workspace.getConfiguration('links')
}

export function getExtensionResources() {
  const linksConfig = getExtensionConfig()
  const resources = linksConfig.get<{
    id: string
    url: string
    title: string
    description?: string
  }[]>('resources')

  return resources
}
