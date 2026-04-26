import { ensureGitHubRepoUrl, getCurrentRepoUrl, getGitHubRepoLinks, parseGitHubRepoUrl } from '@vscode-links/core'

import { getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

export async function getGithubRepoResources(onError: (err: unknown) => void) {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    if (!ensureGitHubRepoUrl(repoUrl)) {
      throw new Error(`Current repo url is not a valid GitHub repo url: ${repoUrl}`)
    }
    logger.info('Current repo url', repoUrl)

    const { repo, owner } = parseGitHubRepoUrl(repoUrl)
    logger.info('Parsed GitHub repo', JSON.stringify({ repo, owner }))

    const result = getGitHubRepoLinks(owner, repo)
    return result
  } catch (err) {
    onError(err)
  }
  return []
}
