import * as vscode from 'vscode'

import { logger } from '@/utils'

interface GitRepositoryState {
  HEAD?: { name?: string, commit?: string }
  onDidChange: vscode.Event<void>
}
interface GitRepository {
  rootUri: vscode.Uri
  state: GitRepositoryState
}
interface GitAPI {
  repositories: GitRepository[]
  onDidOpenRepository: vscode.Event<GitRepository>
}
interface GitExtensionExports {
  getAPI: (version: 1) => GitAPI
}

const DEBOUNCE_MS = 200

export function watchGitState(onHeadChange: () => void): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = []

  let timer: NodeJS.Timeout | undefined
  const fire = (reason: string) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = undefined
      logger.info(`HEAD change via ${reason}; reloading links`)
      onHeadChange()
    }, DEBOUNCE_MS)
  }

  // Source 1 (authoritative for plain repos): watch .git/HEAD per
  // workspace folder. Independent of vscode.git activation order, which
  // is the source of the previous "no auto-refresh" issue — by the time
  // we subscribed to onDidOpenRepository, the git extension had already
  // emitted those events for the existing repos and we missed them.
  // Worktrees / submodules (where .git is a file) are covered by
  // source 2 below.
  const setupHeadWatcher = (folder: vscode.WorkspaceFolder) => {
    const pattern = new vscode.RelativePattern(folder, '.git/HEAD')
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)
    const tag = `HEAD watcher (${folder.name})`
    disposables.push(
      watcher,
      watcher.onDidChange(() => fire(tag)),
      watcher.onDidCreate(() => fire(tag)),
    )
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    setupHeadWatcher(folder)
  }
  disposables.push(
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      e.added.forEach(setupHeadWatcher)
    }),
  )
  logger.info(`Wired .git/HEAD watcher to ${vscode.workspace.workspaceFolders?.length ?? 0} workspace folder(s)`)

  // Source 2 (supplemental): vscode.git extension's repository state.
  // Covers worktrees, submodules, and repos nested deeper than the
  // workspace root, where the FileSystemWatcher above can't reach.
  const ext = vscode.extensions.getExtension<GitExtensionExports>('vscode.git')
  if (!ext) {
    logger.warn('vscode.git extension not found; relying on .git/HEAD watcher only')
  } else {
    const subscribeRepo = (repo: GitRepository) => {
      const headKey = () => `${repo.state.HEAD?.name ?? ''}@${repo.state.HEAD?.commit ?? ''}`
      let last = headKey()
      disposables.push(
        repo.state.onDidChange(() => {
          const cur = headKey()
          if (cur === last) {
            return
          }
          last = cur
          fire(`vscode.git state (${repo.rootUri.fsPath})`)
        }),
      )
    }

    void (async () => {
      try {
        const exports = ext.isActive ? ext.exports : await ext.activate()
        const api = exports.getAPI(1)
        // Subscribe to future opens FIRST so we don't miss a repo that
        // gets opened between our two API calls.
        disposables.push(api.onDidOpenRepository(subscribeRepo))
        api.repositories.forEach(subscribeRepo)
        logger.info(`Wired vscode.git watcher to ${api.repositories.length} repository(ies)`)
      } catch (err) {
        logger.warn(`Failed to wire vscode.git watcher: ${(err as Error).message}`)
      }
    })()
  }

  disposables.push({
    dispose: () => {
      if (timer) {
        clearTimeout(timer)
      }
    },
  })

  return disposables
}
