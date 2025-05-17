import * as vscode from 'vscode'

import { getCodingRepoResources } from '../commands/open/coding'
import { getCnbRepoResources } from '../commands/open/cnb'
import { getGithubRepoResources } from '../commands/open/github'

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
  const result = [
    ...getExtensionResources(),
    ...(await getCodingRepoResources()),
    ...(await getCnbRepoResources()),
    ...(await getGithubRepoResources()),
  ].filter(Boolean)

  if (result.length === 0) {
    throw new Error('No links resources')
  }

  return result
}
