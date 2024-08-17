import * as vscode from 'vscode'

import { logger } from '../utils'

export async function getCurrentRepoUrl() {
  const { default: gitRemoteOriginUrl } = await import('git-remote-origin-url')
  const currentFile = vscode.window.activeTextEditor?.document.uri || vscode.workspace.workspaceFolders?.[0].uri
  logger.info('currentFile', currentFile)
  if (!currentFile) {
    throw new Error('No current file')
  }
  const targetWorkspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile)
  logger.info('targetWorkspaceFolder', targetWorkspaceFolder)
  if (!targetWorkspaceFolder) {
    throw new Error('No target workspace folder')
  }

  const url = await gitRemoteOriginUrl({ cwd: targetWorkspaceFolder.uri.path })
  return url
}
