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

  const ext = vscode.extensions.getExtension<GitExtensionExports>('vscode.git')
  if (!ext) {
    logger.warn('vscode.git extension not found; links will not auto-refresh on branch switch')
    return disposables
  }

  let timer: NodeJS.Timeout | undefined
  const fire = () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = undefined
      onHeadChange()
    }, DEBOUNCE_MS)
  }

  const subscribeRepo = (repo: GitRepository) => {
    const headKey = () => `${repo.state.HEAD?.name ?? ''}@${repo.state.HEAD?.commit ?? ''}`
    let last = headKey()
    disposables.push(
      repo.state.onDidChange(() => {
        const cur = headKey()
        if (cur === last) {
          return
        }
        logger.info(`Git HEAD changed in ${repo.rootUri.fsPath}: ${last} -> ${cur}`)
        last = cur
        fire()
      }),
    )
  }

  ;(async () => {
    try {
      const exports = ext.isActive ? ext.exports : await ext.activate()
      const api = exports.getAPI(1)
      api.repositories.forEach(subscribeRepo)
      disposables.push(api.onDidOpenRepository(subscribeRepo))
    } catch (err) {
      logger.warn('Failed to wire git branch watcher:', err)
    }
  })()

  disposables.push({
    dispose: () => {
      if (timer) {
        clearTimeout(timer)
      }
    },
  })

  return disposables
}
