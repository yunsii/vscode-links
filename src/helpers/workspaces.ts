import { useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'

import { logger } from '../utils'

export async function getCurrentWorkspace() {
  const currentUri = vscode.window.activeTextEditor?.document.uri
  logger.info('Current file', currentUri)

  let targetWorkspacePath: string | undefined
  if (currentUri) {
    targetWorkspacePath = vscode.workspace.getWorkspaceFolder(currentUri)?.uri.fsPath
    logger.info('Current workspace path', targetWorkspacePath)
  }
  if (targetWorkspacePath) {
    return targetWorkspacePath
  }

  const workspaces = useWorkspaceFolders().value

  if (!workspaces) {
    throw new Error('No workspaces opened')
  }

  let currentWorkspace: string | undefined

  if (workspaces.length >= 2) {
    currentWorkspace = await vscode.window.showQuickPick(workspaces.map((item) => {
      return item.uri.fsPath
    }), {
      placeHolder: 'Pick a workspace to get links',
    })
  } else {
    currentWorkspace = workspaces[0].uri.fsPath
  }

  if (!currentWorkspace) {
    throw new Error('No workspaces to use')
  }

  logger.info('Current workspace', currentWorkspace)
  return currentWorkspace
}

export async function getCurrentFileRelativePath() {
  const currentUri = vscode.window.activeTextEditor?.document.uri

  if (!currentUri) {
    return null
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentUri)
  if (!workspaceFolder) {
    return null
  }

  const relativePath = vscode.workspace.asRelativePath(currentUri, false)

  return relativePath
}
