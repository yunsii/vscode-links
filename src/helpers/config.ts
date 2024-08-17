import * as vscode from 'vscode'

import { getCodingRepoResources } from '../commands/open/coding'
import { logger } from '../utils'

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
  try {
    return [
      ...getExtensionResources(),
      ...(await getCodingRepoResources()),
    ]
  } catch (err) {
    logger.error(err)
    return []
  }
}
