import * as vscode from 'vscode'

import type { BaseLinkResource } from '@vscode-links/core'

import { logger } from '../utils'

/**
 * Open a link resource. The URL has already been rendered upstream by
 * core.resolve(); this helper only handles the open transport.
 */
export async function openLinkResource(resource: BaseLinkResource): Promise<void> {
  logger.info('Opening resource:', resource.title)
  let processedUrl = resource.url
  if (!processedUrl.match(/^https?:\/\//)) {
    processedUrl = `https://${processedUrl}`
  }
  vscode.env.openExternal(vscode.Uri.parse(processedUrl))
}
