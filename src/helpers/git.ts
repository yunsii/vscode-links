import * as vscode from 'vscode'

import { logger } from '../utils'

export async function getCurrentRepoUrl() {
  const { default: gitRemoteOriginUrl } = await import('git-remote-origin-url')
  const currentFile = vscode.window.activeTextEditor?.document.uri || vscode.workspace.workspaceFolders?.[0].uri
  logger.info('Current file', currentFile)
  if (!currentFile) {
    throw new Error('No current file')
  }
  const targetWorkspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile)
  if (!targetWorkspaceFolder) {
    throw new Error('No target workspace folder')
  }
  const cwd = targetWorkspaceFolder.uri.path
  logger.info('Current working directory', cwd)

  const url = await gitRemoteOriginUrl({ cwd })
  logger.info('Current repo url', url)
  return url
}
