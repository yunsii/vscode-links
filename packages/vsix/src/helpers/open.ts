import { buildContext, getCurrentRepoUrl, renderResource } from '@vscode-links/core'
import * as vscode from 'vscode'

import type { BaseLinkResource } from '@vscode-links/core'

import { logger } from '../utils'
import { getCurrentFileRelativePath } from './workspaces'

/**
 * Unified function to open a link resource with real-time template rendering
 */
export async function openLinkResource(resource: BaseLinkResource): Promise<void> {
  logger.info('Opening resource:', resource.title)
  try {
    // Build context and render the resource just before opening
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    const repoUrl = workspace ? await getCurrentRepoUrl(workspace) : null
    const fileRelativePath = await getCurrentFileRelativePath()
    const context = await buildContext({
      workspacePath: workspace,
      repoUrl,
      fileRelativePath,
      logger,
    })
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
