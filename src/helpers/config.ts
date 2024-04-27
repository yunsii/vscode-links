import * as vscode from 'vscode'

import { getCodingRepoResources } from '../commands/open/coding'

export function getExtensionConfig() {
  return vscode.workspace.getConfiguration('links')
}

export interface ResourceItem {
  url: string
  title: string
  description?: string
}

export function getExtensionResources() {
  const linksConfig = getExtensionConfig()
  const resources = linksConfig.get<ResourceItem[]>('resources')

  return resources || []
}

export async function getAllLinkResources() {
  return [
    ...getExtensionResources(),
    ...(await getCodingRepoResources()),
  ]
}
