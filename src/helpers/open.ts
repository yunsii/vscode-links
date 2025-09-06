import * as vscode from 'vscode'

import { buildContext, renderResource } from '../template/engine'
import { logger } from '../utils'
import { getCurrentRepoUrl } from './git'

import type { BaseLinkResource } from './schemas'

/**
 * Unified function to open a link resource with real-time template rendering
 */
export async function openLinkResource(resource: BaseLinkResource): Promise<void> {
  logger.info('Opening resource:', resource.title)
  try {
    // Build context and render the resource just before opening
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    const repoUrl = workspace ? await getCurrentRepoUrl(workspace) : null
    const context = await buildContext({ workspacePath: workspace, repoUrl })
    const rendered = renderResource(resource, context)
    let processedUrl = rendered.url
    if (!processedUrl.match(/^https?:\/\//)) {
      processedUrl = `https://${processedUrl}`
    }
    vscode.env.openExternal(vscode.Uri.parse(processedUrl))
  } catch (error) {
    logger.warn('Failed to render template, opening original URL', error)
    vscode.env.openExternal(vscode.Uri.parse(resource.url))
  }
}
