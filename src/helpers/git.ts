/* eslint-disable no-console */
import * as vscode from 'vscode'

export async function getCurrentRepoUrl() {
  const { default: gitRemoteOriginUrl } = await import('git-remote-origin-url')
  const currentFile = vscode.window.activeTextEditor?.document.uri || vscode.workspace.workspaceFolders?.[0].uri
  if (!currentFile) {
    return null
  }
  const targetWorkspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile)
  if (!targetWorkspaceFolder) {
    return null
  }

  try {
    const url = await gitRemoteOriginUrl({ cwd: targetWorkspaceFolder.uri.path })
    return url
  }
  catch (err) {
    console.debug(err)
    return null
  }
}
