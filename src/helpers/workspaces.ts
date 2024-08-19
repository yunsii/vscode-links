import * as vscode from 'vscode'
import { useWorkspaceFolders } from 'reactive-vscode'

import { logger } from '../utils'

export async function getCurrentWorkspace() {
  const currentFile = vscode.window.activeTextEditor?.document.uri || vscode.workspace.workspaceFolders?.[0].uri
  logger.info('Current file', currentFile)

  let targetWorkspacePath: string | undefined
  if (currentFile) {
    targetWorkspacePath = vscode.workspace.getWorkspaceFolder(currentFile)?.uri.path
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
      return item.uri.path
    }), {
      placeHolder: 'Pick a workspace to get links',
    })
  } else {
    currentWorkspace = workspaces[0].uri.path
  }

  if (!currentWorkspace) {
    throw new Error('No workspaces to use')
  }

  logger.info('Current workspace', currentWorkspace)
  return currentWorkspace
}
