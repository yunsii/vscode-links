import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'

import * as vscode from 'vscode'

import { logger } from '@/utils'

const exec = promisify(execCb)

const DEBOUNCE_MS = 200
const REV_PARSE_TIMEOUT_MS = 5000

// Resolve the real .git directory for a workspace folder via
// `git rev-parse --absolute-git-dir`. This handles plain repos,
// worktrees (where .git is a file pointing into <commondir>/worktrees/<name>),
// and submodules (.git/modules/<name>) uniformly — git itself tells us
// the right path, so we don't have to parse .git files ourselves.
async function resolveGitDir(folderPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await exec('git rev-parse --absolute-git-dir', {
      cwd: folderPath,
      timeout: REV_PARSE_TIMEOUT_MS,
    })
    const dir = stdout.trim()
    return dir.length > 0 ? dir : undefined
  } catch {
    return undefined
  }
}

export function watchGitState(onHeadChange: () => void): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = []
  const watchedDirs = new Set<string>()

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

  const watchHead = (gitDir: string) => {
    if (watchedDirs.has(gitDir)) {
      return
    }
    watchedDirs.add(gitDir)

    const dirUri = vscode.Uri.file(gitDir)
    const pattern = new vscode.RelativePattern(dirUri, 'HEAD')
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)
    const tag = `HEAD watcher (${gitDir})`
    disposables.push(
      watcher,
      watcher.onDidChange(() => fire(tag)),
      watcher.onDidCreate(() => fire(tag)),
    )
    logger.info(`Wired HEAD watcher to ${gitDir}`)
  }

  const setupFolder = async (folder: vscode.WorkspaceFolder) => {
    const gitDir = await resolveGitDir(folder.uri.fsPath)
    if (!gitDir) {
      logger.info(`No git dir resolved for ${folder.uri.fsPath}; skipping HEAD watcher`)
      return
    }
    watchHead(gitDir)
  }

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    void setupFolder(folder)
  }
  disposables.push(
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      e.added.forEach((folder) => void setupFolder(folder))
    }),
  )

  disposables.push({
    dispose: () => {
      if (timer) {
        clearTimeout(timer)
      }
    },
  })

  return disposables
}
